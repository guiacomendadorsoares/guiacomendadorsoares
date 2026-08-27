import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/app-shell";
import { EmptyState } from "@/components/ui-bits";
import { PropertyCard } from "@/components/property-card";
import {
  LISTING_FILTERS,
  KIND_FILTERS,
  type ListingType,
  type PropertyKind,
  type Property,
} from "@/lib/properties";
import { fetchProperties } from "@/services/properties.service";
import { Search, Building2 } from "lucide-react";

export const Route = createFileRoute("/imoveis")({
  head: () => ({
    meta: [
      { title: "Imóveis em Comendador Soares — Guia CS" },
      {
        name: "description",
        content:
          "Casas, apartamentos, terrenos e imóveis comerciais para alugar e comprar em Comendador Soares, Nova Iguaçu.",
      },
      { property: "og:title", content: "Imóveis em Comendador Soares — Guia CS" },
      {
        property: "og:description",
        content:
          "Casas, apartamentos e comerciais para alugar e comprar no bairro Comendador Soares.",
      },
    ],
  }),
  component: ImoveisPage,
});

const KIND_LABELS: Record<string, string> = {
  casa: "Casa",
  apartamento: "Apartamento",
  terreno: "Terreno",
  comercial: "Comercial",
};

function formatPrice(price: number | null | undefined, listing: string): string {
  if (price == null) return "Sob consulta";
  const formatted = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(price);
  return listing === "aluguel" ? `${formatted}/mês` : formatted;
}

function mapProperty(row: any): Property {
  const listing = (row.listing_type ?? "venda") as ListingType;
  return {
    id: row.id,
    title: row.title ?? "",
    listingType: listing,
    listingLabel: listing === "aluguel" ? "Aluguel" : "Venda",
    kind: (row.kind ?? "casa") as PropertyKind,
    kindLabel: KIND_LABELS[row.kind] ?? "Imóvel",
    price: row.price_label ?? formatPrice(row.price, listing),
    bedrooms: row.bedrooms ?? undefined,
    bathrooms: row.bathrooms ?? undefined,
    areaM2: row.area_m2 ?? undefined,
    address: row.address ?? "",
    image:
      row.cover_url ??
      (Array.isArray(row.gallery_urls) && row.gallery_urls[0]) ??
      "/placeholder.svg",
    featured: !!row.featured,
  };
}

function ImoveisPage() {
  const [listingFilter, setListingFilter] = useState<ListingType | "todos">("todos");
  const [kindFilter, setKindFilter] = useState<PropertyKind | "todos">("todos");
  const [query, setQuery] = useState("");

  const { data: items = [] } = useQuery({
    queryKey: ["properties"],
    queryFn: fetchProperties,
  });

  const properties = useMemo(() => (items as any[]).map(mapProperty), [items]);

  const filtered = useMemo(() => {
    return properties.filter((p) => {
      const matchListing = listingFilter === "todos" || p.listingType === listingFilter;
      const matchKind = kindFilter === "todos" || p.kind === kindFilter;
      const q = query.trim().toLowerCase();
      const matchQuery =
        !q ||
        p.title.toLowerCase().includes(q) ||
        p.address.toLowerCase().includes(q) ||
        p.kindLabel.toLowerCase().includes(q);
      return matchListing && matchKind && matchQuery;
    });
  }, [listingFilter, kindFilter, query, properties]);

  return (
    <AppShell title="Imóveis" subtitle="Alugar e comprar no bairro">
      {/* Search */}
      <div className="mb-4 flex items-center gap-2 rounded-2xl border border-border bg-card px-3 py-2.5 shadow-card">
        <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
        <input
          type="text"
          placeholder="Buscar por endereço, tipo..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
        />
      </div>

      {/* Listing type filter (Venda / Aluguel) */}
      <div className="mb-3 grid grid-cols-3 gap-2">
        {LISTING_FILTERS.map((f) => {
          const active = listingFilter === f.value;
          return (
            <button
              key={f.value}
              onClick={() => setListingFilter(f.value)}
              className={`rounded-full px-3 py-2 text-center text-xs font-semibold transition-all active:scale-95 ${
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

      {/* Kind sub-filter (horizontal scroll) */}
      <div className="mb-4 -mx-5 overflow-x-auto px-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="flex gap-2 pb-1">
          {KIND_FILTERS.map((f) => {
            const active = kindFilter === f.value;
            return (
              <button
                key={f.value}
                onClick={() => setKindFilter(f.value)}
                className={`shrink-0 rounded-full px-4 py-2 text-xs font-semibold transition-all active:scale-95 ${
                  active
                    ? "bg-primary text-primary-foreground shadow-elegant"
                    : "border border-border bg-card text-muted-foreground hover:bg-muted"
                }`}
              >
                {f.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Results count */}
      <p className="mb-3 text-xs text-muted-foreground">
        {filtered.length} {filtered.length === 1 ? "imóvel encontrado" : "imóveis encontrados"}
      </p>

      {/* List */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={<Building2 className="h-5 w-5" />}
          title={properties.length === 0 ? "Nenhum imóvel disponível." : "Nenhum imóvel encontrado"}
          description={
            properties.length === 0
              ? "Em breve novos imóveis serão publicados pelos corretores parceiros."
              : "Tente ajustar os filtros ou busque por outro termo."
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p) => (
            <PropertyCard key={p.id} property={p} />
          ))}
        </div>
      )}
    </AppShell>
  );
}
