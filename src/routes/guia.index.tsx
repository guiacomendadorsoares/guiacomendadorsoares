import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { AppShell } from "@/components/app-shell";
import { EmptyState } from "@/components/ui-bits";
import { CategoryImageCard } from "@/components/category-image-card";
import { GuiaBusinessCard } from "@/components/guia-business-card";
import { ACTIVE_CATEGORIES } from "@/lib/guia-taxonomy";
import { fetchCategoryCounts, searchBusinesses } from "@/services/businesses.service";
import { Search, Store, MapPin } from "lucide-react";

export const Route = createFileRoute("/guia/")({
  head: () => ({
    meta: [
      { title: "Guia Comercial — Guia CS" },
      {
        name: "description",
        content: "Encontre estabelecimentos, serviços e comércios em Comendador Soares.",
      },
      { property: "og:title", content: "Guia Comercial — Guia CS" },
      {
        property: "og:description",
        content: "A vitrine digital do comércio de Comendador Soares.",
      },
    ],
  }),
  component: GuiaHome,
});

function useDebounced<T>(value: T, delay = 250): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

function GuiaHome() {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounced(query, 250);
  const hasQuery = debouncedQuery.trim().length >= 2;

  const { data: counts = {} } = useQuery({
    queryKey: ["guia", "counts"],
    queryFn: fetchCategoryCounts,
  });

  const { data: searchResults = [], isFetching: searching } = useQuery({
    queryKey: ["guia", "search", debouncedQuery.trim().toLowerCase()],
    queryFn: () => searchBusinesses(debouncedQuery, 30),
    enabled: hasQuery,
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });

  const sortedCategories = useMemo(
    () =>
      [...ACTIVE_CATEGORIES].sort(
        (a, b) => (a.order ?? 999) - (b.order ?? 999) || a.label.localeCompare(b.label, "pt-BR"),
      ),
    [],
  );

  return (
    <AppShell title="Guia comercial" subtitle="Descubra o comércio do bairro">
      {/* Busca global */}
      <div className="mb-3 flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2.5 shadow-card">
        <Search className="h-4 w-4 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar empresa, categoria ou serviço…"
          className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
      </div>

      <div className="mb-5 flex items-center gap-1.5 text-[11.5px] text-muted-foreground">
        <MapPin className="h-3 w-3 text-primary-vibrant" />
        Resultados em <span className="font-semibold text-foreground">Comendador Soares</span>
      </div>

      {/* Resultados de busca global */}
      {hasQuery ? (
        <section className="mb-6">
          <h2 className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
            {searching
              ? "Buscando…"
              : `${searchResults.length} resultado${searchResults.length === 1 ? "" : "s"}`}
          </h2>
          {!searching && searchResults.length === 0 ? (
            <EmptyState
              icon={<Store className="h-5 w-5" />}
              title="Nada encontrado"
              description="Tente outro termo ou explore as categorias abaixo."
            />
          ) : (
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {searchResults.map((b) => (
                <GuiaBusinessCard key={b.id} b={b} />
              ))}
            </div>
          )}
        </section>
      ) : null}

      {/* Grid de categorias com imagem */}
      <section>
        <h2 className="mb-3 font-display text-base font-bold">Categorias</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {sortedCategories.map((c) => (
            <CategoryImageCard key={c.slug} c={c} count={counts[c.slug]} />
          ))}
        </div>
      </section>

      {/* Anuncie */}
      <div className="mt-8 rounded-3xl border border-border bg-gradient-to-br from-primary/10 to-gold/10 p-5 text-center shadow-card">
        <p className="font-display text-base font-bold">É dono de um negócio?</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Cadastre sua empresa e apareça para milhares de moradores.
        </p>
        <Link
          to="/anuncie"
          className="mt-3 inline-flex items-center justify-center rounded-full bg-primary px-5 py-2 text-sm font-bold text-primary-foreground shadow-elegant"
        >
          Anunciar agora
        </Link>
      </div>
    </AppShell>
  );
}
