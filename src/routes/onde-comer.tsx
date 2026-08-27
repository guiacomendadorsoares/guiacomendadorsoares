import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Search, UtensilsCrossed } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { EmptyState } from "@/components/ui-bits";
import { GuiaBusinessCard } from "@/components/guia-business-card";
import { fetchBusinessesByCategory } from "@/services/businesses.service";
import { findCategory } from "@/lib/guia-taxonomy";

export const Route = createFileRoute("/onde-comer")({
  head: () => ({
    meta: [
      { title: "Onde Comer em Comendador Soares — Guia CS" },
      {
        name: "description",
        content:
          "Restaurantes, hamburguerias, pizzarias, lanchonetes e delivery em Comendador Soares, Nova Iguaçu.",
      },
      { property: "og:title", content: "Onde Comer em Comendador Soares — Guia CS" },
      {
        property: "og:description",
        content: "Sabores do bairro: restaurantes, pizzarias e lanchonetes em Comendador Soares.",
      },
    ],
  }),
  component: OndeComerPage,
});

function OndeComerPage() {
  const [filter, setFilter] = useState<string>("todos");
  const [query, setQuery] = useState("");

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["guia", "category", "alimentacao"],
    queryFn: () => fetchBusinessesByCategory("alimentacao"),
  });

  const cat = findCategory("alimentacao");
  const filters = useMemo(
    () => [
      { value: "todos", label: "Todos" },
      ...(cat?.subcategories.map((s) => ({ value: s.slug, label: s.label })) ?? []),
    ],
    [cat],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((b) => {
      const matchCat = filter === "todos" || b.subcategory === filter;
      const matchQ =
        !q || b.name.toLowerCase().includes(q) || (b.address ?? "").toLowerCase().includes(q);
      return matchCat && matchQ;
    });
  }, [filter, query, items]);

  return (
    <AppShell title="Onde Comer" subtitle="Sabores do bairro">
      <div className="mb-4 flex items-center gap-2 rounded-2xl border border-border bg-card px-3 py-2.5 shadow-card">
        <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
        <input
          type="text"
          placeholder="Buscar restaurante..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
        />
      </div>

      <div className="mb-4 -mx-5 overflow-x-auto px-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="flex gap-2 pb-1">
          {filters.map((f) => {
            const active = filter === f.value;
            return (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                className={`shrink-0 rounded-full px-4 py-2 text-xs font-semibold transition-all active:scale-95 ${
                  active
                    ? "gradient-brand text-primary-foreground shadow-elegant"
                    : "border border-border bg-card text-muted-foreground hover:bg-muted"
                }`}
              >
                {f.label}
              </button>
            );
          })}
        </div>
      </div>

      <p className="mb-3 text-xs text-muted-foreground">
        {filtered.length} {filtered.length === 1 ? "lugar encontrado" : "lugares encontrados"}
      </p>

      {isLoading ? (
        <p className="py-12 text-center text-sm text-muted-foreground">Carregando…</p>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<UtensilsCrossed className="h-5 w-5" />}
          title="Nenhum estabelecimento encontrado"
          description="Em breve mais opções de Alimentação por aqui."
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((b) => (
            <GuiaBusinessCard key={b.id} b={b} />
          ))}
        </div>
      )}
    </AppShell>
  );
}
