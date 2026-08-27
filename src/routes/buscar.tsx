import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { z } from "zod";
import { AppShell } from "@/components/app-shell";
import { EmptyState } from "@/components/ui-bits";
import { GuiaBusinessCard } from "@/components/guia-business-card";
import { CATEGORIES } from "@/lib/guia-taxonomy";
import { fetchBusinesses } from "@/services/businesses.service";
import { Search, Store, X } from "lucide-react";
import { Link } from "@tanstack/react-router";

const searchSchema = z.object({
  q: fallback(z.string(), "").default(""),
});

export const Route = createFileRoute("/buscar")({
  validateSearch: zodValidator(searchSchema),
  head: () => ({
    meta: [
      { title: "Buscar Empresas — Guia Comendador Soares" },
      {
        name: "description",
        content:
          "Encontre empresas, serviços e categorias no bairro Comendador Soares, em Nova Iguaçu.",
      },
      { property: "og:title", content: "Buscar Empresas — Guia Comendador Soares" },
      {
        property: "og:description",
        content: "Busque empresas e serviços por nome ou categoria no Guia Comendador Soares.",
      },
    ],
  }),
  component: BuscarPage,
});

function BuscarPage() {
  const { q } = Route.useSearch();
  const navigate = useNavigate({ from: "/buscar" });
  const [term, setTerm] = useState(q);

  useEffect(() => setTerm(q), [q]);

  useEffect(() => {
    const id = setTimeout(() => {
      navigate({ search: { q: term }, replace: true });
    }, 250);
    return () => clearTimeout(id);
  }, [term, navigate]);

  const { data: all = [], isLoading } = useQuery({
    queryKey: ["buscar", "businesses"],
    queryFn: fetchBusinesses,
  });

  const query = term.trim().toLowerCase();

  const matchedCategories = useMemo(() => {
    if (query.length < 2) return [];
    return CATEGORIES.filter((c) => {
      if (c.label.toLowerCase().includes(query) || c.slug.includes(query)) return true;
      return c.subcategories.some((s) => s.label.toLowerCase().includes(query));
    }).slice(0, 8);
  }, [query]);

  const matchedBusinesses = useMemo(() => {
    if (query.length < 2) return [];
    return all
      .filter((b) => {
        const name = b.name.toLowerCase();
        const cat = (b.main_category ?? "").toLowerCase();
        const sub = (b.subcategory ?? "").toLowerCase();
        return name.includes(query) || cat.includes(query) || sub.includes(query);
      })
      .slice(0, 30);
  }, [all, query]);

  return (
    <AppShell title="Buscar" subtitle="O que você procura hoje?">
      <div className="mb-4 flex items-center gap-2 rounded-2xl border border-border bg-card px-4 py-3 shadow-card">
        <Search className="h-5 w-5 text-primary" />
        <input
          autoFocus
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          placeholder="Academia, restaurante, dentista…"
          className="w-full bg-transparent text-base outline-none placeholder:text-muted-foreground"
        />
        {term && (
          <button
            type="button"
            onClick={() => setTerm("")}
            aria-label="Limpar"
            className="text-muted-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {query.length < 2 ? (
        <section>
          <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Explorar categorias
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {CATEGORIES.filter((c) => c.showOnHome).map((c) => (
              <Link
                key={c.slug}
                to="/guia/$categoria"
                params={{ categoria: c.slug }}
                className="rounded-2xl border border-border bg-card p-4 text-sm font-semibold shadow-card hover:bg-secondary"
              >
                <span className="mr-2 text-lg">{c.emoji}</span>
                {c.label}
              </Link>
            ))}
          </div>
        </section>
      ) : (
        <>
          {matchedCategories.length > 0 && (
            <section className="mb-6">
              <h2 className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Categorias
              </h2>
              <div className="flex flex-wrap gap-2">
                {matchedCategories.map((c) => (
                  <Link
                    key={c.slug}
                    to="/guia/$categoria"
                    params={{ categoria: c.slug }}
                    className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-sm shadow-card hover:bg-secondary"
                  >
                    <span>{c.emoji}</span>
                    <span className="font-semibold">{c.label}</span>
                  </Link>
                ))}
              </div>
            </section>
          )}

          <section>
            <h2 className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
              {isLoading
                ? "Buscando…"
                : `${matchedBusinesses.length} empresa${matchedBusinesses.length === 1 ? "" : "s"}`}
            </h2>
            {!isLoading && matchedBusinesses.length === 0 && matchedCategories.length === 0 ? (
              <EmptyState
                icon={<Store className="h-5 w-5" />}
                title="Nada encontrado"
                description="Tente outro termo ou explore as categorias."
              />
            ) : (
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {matchedBusinesses.map((b) => (
                  <GuiaBusinessCard key={b.id} b={b} />
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </AppShell>
  );
}
