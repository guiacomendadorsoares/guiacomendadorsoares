import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/app-shell";
import { EmptyState } from "@/components/ui-bits";
import { GuiaBusinessCard } from "@/components/guia-business-card";
import { findCategory, ACTIVE_CATEGORIES } from "@/lib/guia-taxonomy";
import { fetchBusinessesByCategory } from "@/services/businesses.service";
import { ArrowLeft, Search, Store, Sparkles } from "lucide-react";

export const Route = createFileRoute("/guia/$categoria")({
  beforeLoad: ({ params }) => {
    if (!findCategory(params.categoria)) throw notFound();
  },
  head: ({ params }) => {
    const c = findCategory(params.categoria);
    const title = c ? `${c.label} — Guia CS` : "Guia CS";
    const desc = c?.description ?? "Guia comercial de Comendador Soares.";
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
      ],
    };
  },
  notFoundComponent: () => (
    <AppShell title="Categoria não encontrada">
      <EmptyState
        icon={<Store className="h-5 w-5" />}
        title="Categoria inválida"
        description="A categoria solicitada não existe."
      />
      <Link
        to="/guia"
        className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary-vibrant"
      >
        <ArrowLeft className="h-4 w-4" /> Voltar ao guia
      </Link>
    </AppShell>
  ),
  errorComponent: ({ error }) => (
    <AppShell title="Erro">
      <p className="text-sm text-destructive">{error.message}</p>
    </AppShell>
  ),
  component: CategoryPage,
});

function CategoryPage() {
  const { categoria } = Route.useParams();
  const cat = findCategory(categoria)!;
  const [sub, setSub] = useState<string>("all");
  const [query, setQuery] = useState("");

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["guia", "category", cat.slug],
    queryFn: () => fetchBusinessesByCategory(cat.slug),
  });

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((b) => {
      const matchSub = sub === "all" || b.subcategory === sub;
      const matchQ =
        !q || b.name.toLowerCase().includes(q) || (b.address ?? "").toLowerCase().includes(q);
      return matchSub && matchQ;
    });
  }, [items, sub, query]);

  const featured = filtered.filter((b) => b.featured);
  const others = filtered.filter((b) => !b.featured);

  return (
    <AppShell>
      {/* Banner */}
      <div
        className="relative mb-5 overflow-hidden rounded-3xl p-6 text-white shadow-elegant"
        style={{ background: `linear-gradient(135deg, ${cat.from} 0%, ${cat.to} 100%)` }}
      >
        <Link
          to="/guia"
          className="inline-flex items-center gap-1 text-xs font-semibold opacity-90 hover:opacity-100"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Guia comercial
        </Link>
        <div className="mt-2 flex items-center gap-3">
          <span className="text-4xl">{cat.emoji}</span>
          <div className="min-w-0">
            <h1 className="font-display text-2xl font-black leading-tight">{cat.label}</h1>
            <p className="text-xs opacity-90">{cat.description}</p>
          </div>
        </div>
        <p className="mt-3 inline-flex items-center gap-1 rounded-full bg-white/15 px-3 py-1 text-[11px] font-bold backdrop-blur">
          {items.length} {items.length === 1 ? "empresa" : "empresas"}
        </p>
      </div>

      {/* Subcategorias */}
      <div className="-mx-5 mb-4 overflow-x-auto px-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="flex gap-2 pb-1">
          <Pill active={sub === "all"} onClick={() => setSub("all")}>
            Todos
          </Pill>
          {cat.subcategories.map((s) => (
            <Pill key={s.slug} active={sub === s.slug} onClick={() => setSub(s.slug)}>
              {s.label}
            </Pill>
          ))}
        </div>
      </div>

      {/* Busca */}
      <div className="mb-4 flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2.5 shadow-card">
        <Search className="h-4 w-4 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={`Buscar em ${cat.label}…`}
          className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
      </div>

      {isLoading ? (
        <p className="py-12 text-center text-sm text-muted-foreground">Carregando…</p>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Store className="h-5 w-5" />}
          title="Sem resultados"
          description="Tente outra subcategoria ou termo de busca."
        />
      ) : (
        <div className="space-y-5">
          {featured.length > 0 && (
            <section>
              <h2 className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                <Sparkles className="h-3.5 w-3.5 text-gold" /> Em destaque
              </h2>
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {featured.map((b) => (
                  <GuiaBusinessCard key={b.id} b={b} />
                ))}
              </div>
            </section>
          )}
          {others.length > 0 && (
            <section>
              {featured.length > 0 && (
                <h2 className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Todas
                </h2>
              )}
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {others.map((b) => (
                  <GuiaBusinessCard key={b.id} b={b} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {/* Ver subcategoria dedicada */}
      {sub !== "all" && (
        <div className="mt-6">
          <Link
            to="/guia/$categoria/$subcategoria"
            params={{ categoria: cat.slug, subcategoria: sub }}
            className="block rounded-2xl border border-border bg-card p-4 text-center text-sm font-semibold text-primary-vibrant shadow-card"
          >
            Ver página completa desta subcategoria →
          </Link>
        </div>
      )}

      {/* Outras categorias rápidas */}
      <div className="mt-8 text-xs text-muted-foreground">
        <p className="mb-2 font-semibold">Outras categorias</p>
        <div className="flex flex-wrap gap-2">
          {ACTIVE_CATEGORIES.filter((c) => c.slug !== cat.slug)
            .slice(0, 8)
            .map((c) => (
              <Link
                key={c.slug}
                to="/guia/$categoria"
                params={{ categoria: c.slug }}
                className="rounded-full border border-border bg-card px-3 py-1 font-medium text-foreground/80 hover:bg-secondary"
              >
                {c.emoji} {c.label}
              </Link>
            ))}
        </div>
      </div>
    </AppShell>
  );
}

function Pill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-all " +
        (active
          ? "border-transparent gradient-brand text-primary-foreground shadow-elegant"
          : "border-border bg-card text-foreground/80 hover:bg-secondary")
      }
    >
      {children}
    </button>
  );
}
