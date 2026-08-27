import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/app-shell";
import { EmptyState } from "@/components/ui-bits";
import { isOpenNow } from "@/lib/hours";
import {
  fetchPharmacies,
  fetchPharmacyCategories,
  fetchPromoProducts,
  searchProducts,
  logSearchEvent,
  type PharmacyProduct,
  type PharmacyBusiness,
} from "@/services/pharmacies.service";
import {
  Search,
  BadgeCheck,
  MessageCircle,
  Phone,
  Navigation,
  Store,
  Clock,
  Tag,
  Pill,
  ArrowRight,
} from "lucide-react";

export const Route = createFileRoute("/farmacias")({
  head: () => ({
    meta: [
      { title: "Farmácias — Compare preços em Comendador Soares" },
      {
        name: "description",
        content:
          "Compare preços das farmácias de Comendador Soares. Encontre medicamentos, marcas e princípios ativos com o menor preço perto de você.",
      },
      { property: "og:title", content: "Farmácias — Guia Comendador Soares" },
      {
        property: "og:description",
        content: "Compare preços das farmácias do bairro e fale direto no WhatsApp.",
      },
    ],
  }),
  component: PharmaciesPage,
});

const SUGGESTIONS = [
  "Dipirona",
  "Dorflex",
  "Neosaldina",
  "Fralda",
  "Shampoo",
  "Vitamina C",
  "Protetor Solar",
];

function PharmaciesPage() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const [filter, setFilter] = useState<
    "cheapest" | "discount" | "open" | "delivery" | "pickup" | "verified" | null
  >(null);

  const { data: categories = [] } = useQuery({
    queryKey: ["pharm", "categories"],
    queryFn: fetchPharmacyCategories,
  });
  const { data: pharmacies = [] } = useQuery({
    queryKey: ["pharm", "pharmacies"],
    queryFn: fetchPharmacies,
  });
  const { data: promos = [] } = useQuery({
    queryKey: ["pharm", "promos"],
    queryFn: () => fetchPromoProducts(12),
  });
  const { data: results = [], isFetching } = useQuery({
    queryKey: ["pharm", "search", query, category],
    queryFn: async () => {
      const r = await searchProducts({ query, category });
      if (query.trim().length >= 2) logSearchEvent(query);
      return r;
    },
    enabled: query.trim().length >= 2 || category !== null,
  });

  const filtered = useMemo(() => {
    let list = [...results];
    if (filter === "delivery") list = list.filter((p) => p.delivery);
    if (filter === "pickup") list = list.filter((p) => p.pickup);
    if (filter === "verified") list = list.filter((p) => p.business?.verified);
    if (filter === "open") list = list.filter((p) => isOpenNow(p.business?.hours));
    if (filter === "cheapest")
      list.sort((a, b) => (effPrice(a) ?? Infinity) - (effPrice(b) ?? Infinity));
    if (filter === "discount") list.sort((a, b) => discountPct(b) - discountPct(a));
    return list;
  }, [results, filter]);

  const openPharmacies = useMemo(() => pharmacies.filter((p) => isOpenNow(p.hours)), [pharmacies]);

  const showSearch = query.trim().length >= 2 || category !== null;

  return (
    <AppShell title="Farmácias em Comendador Soares" subtitle="Compare preços perto de você">
      {/* Search */}
      <div className="mb-4 flex items-center gap-2 rounded-full border border-border bg-card px-4 py-3 shadow-elegant">
        <Search className="h-5 w-5 text-primary-vibrant" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ex: Dipirona, Neosaldina, Shampoo…"
          className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
      </div>

      {!showSearch && (
        <div className="mb-5 flex flex-wrap gap-1.5">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => setQuery(s)}
              className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-foreground hover:bg-secondary/70"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Categories chips */}
      {categories.length > 0 && (
        <div className="-mx-5 mb-5 overflow-x-auto px-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="flex gap-2">
            <Chip active={category === null} onClick={() => setCategory(null)}>
              Todas
            </Chip>
            {categories.map((c) => (
              <Chip
                key={c.id}
                active={category === c.slug}
                onClick={() => setCategory(category === c.slug ? null : c.slug)}
              >
                <span className="mr-1">{c.icon}</span>
                {c.name}
              </Chip>
            ))}
          </div>
        </div>
      )}

      {/* Search results */}
      {showSearch ? (
        <section className="mb-8">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-base font-bold">
              {isFetching
                ? "Buscando…"
                : `${filtered.length} resultado${filtered.length === 1 ? "" : "s"}`}
            </h2>
          </div>
          <div className="-mx-5 mb-4 overflow-x-auto px-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <div className="flex gap-2">
              <FilterChip active={filter === "cheapest"} onClick={() => toggle("cheapest")}>
                Menor preço
              </FilterChip>
              <FilterChip active={filter === "discount"} onClick={() => toggle("discount")}>
                Maior desconto
              </FilterChip>
              <FilterChip active={filter === "open"} onClick={() => toggle("open")}>
                Aberta agora
              </FilterChip>
              <FilterChip active={filter === "delivery"} onClick={() => toggle("delivery")}>
                Entrega
              </FilterChip>
              <FilterChip active={filter === "pickup"} onClick={() => toggle("pickup")}>
                Retirada
              </FilterChip>
              <FilterChip active={filter === "verified"} onClick={() => toggle("verified")}>
                Verificada
              </FilterChip>
            </div>
          </div>

          {filtered.length === 0 ? (
            <EmptyState
              icon={<Pill className="h-5 w-5" />}
              title="Nenhum produto encontrado"
              description="Ainda não temos esse produto cadastrado. Tente outro termo ou fale direto com uma farmácia parceira."
            />
          ) : (
            <div className="flex flex-col gap-3">
              {filtered.map((p) => (
                <ProductCard key={p.id} p={p} />
              ))}
            </div>
          )}
        </section>
      ) : (
        <>
          <SectionTitle title="Farmácias em destaque" />
          {pharmacies.length === 0 ? (
            <EmptyState
              icon={<Store className="h-5 w-5" />}
              title="Nenhuma farmácia cadastrada ainda"
              description="Em breve as farmácias do bairro estarão aqui."
            />
          ) : (
            <div className="-mx-5 mb-8 overflow-x-auto px-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <div className="flex gap-3 pb-1">
                {pharmacies.slice(0, 12).map((b) => (
                  <PharmacyCard key={b.id} b={b} />
                ))}
              </div>
            </div>
          )}

          <SectionTitle title="Ofertas das farmácias" icon={<Tag className="h-4 w-4" />} />
          {promos.length === 0 ? (
            <div className="mb-8 rounded-2xl border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
              Sem ofertas cadastradas no momento.
            </div>
          ) : (
            <div className="mb-8 grid grid-cols-2 gap-3">
              {promos.slice(0, 8).map((p) => (
                <ProductGridCard key={p.id} p={p} />
              ))}
            </div>
          )}

          <SectionTitle title="Abertas agora" icon={<Clock className="h-4 w-4" />} />
          {openPharmacies.length === 0 ? (
            <div className="mb-8 rounded-2xl border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
              Nenhuma farmácia aberta agora.
            </div>
          ) : (
            <div className="mb-8 flex flex-col gap-3">
              {openPharmacies.map((b) => (
                <PharmacyRow key={b.id} b={b} />
              ))}
            </div>
          )}
        </>
      )}
    </AppShell>
  );

  function toggle(f: typeof filter) {
    setFilter((cur) => (cur === f ? null : f));
  }
}

function effPrice(p: PharmacyProduct) {
  return p.promo_price ?? p.price ?? null;
}

function discountPct(p: PharmacyProduct) {
  if (p.price && p.promo_price && p.price > 0)
    return Math.round(((p.price - p.promo_price) / p.price) * 100);
  return 0;
}

function money(n: number | null | undefined) {
  if (n == null) return "Consulte";
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function Chip({
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
      onClick={onClick}
      className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-bold transition-colors ${
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-card text-foreground hover:bg-secondary"
      }`}
    >
      {children}
    </button>
  );
}

function FilterChip(props: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return <Chip {...props} />;
}

function SectionTitle({ title, icon }: { title: string; icon?: React.ReactNode }) {
  return (
    <h2 className="mb-3 flex items-center gap-1.5 font-display text-base font-bold">
      {icon && <span className="text-primary-vibrant">{icon}</span>}
      {title}
    </h2>
  );
}

function PharmacyCard({ b }: { b: PharmacyBusiness }) {
  return (
    <Link
      to="/empresa/$id"
      params={{ id: b.id }}
      className="group flex w-44 shrink-0 flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-card transition-transform hover:-translate-y-0.5"
    >
      <div className="relative h-24 w-full overflow-hidden bg-gradient-to-br from-emerald-500/20 to-primary/10">
        {b.banner_url ? (
          <img src={b.banner_url} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="grid h-full w-full place-items-center text-4xl opacity-40">💊</div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3">
        <div className="flex items-center gap-1">
          <p className="line-clamp-1 text-sm font-bold text-foreground">{b.name}</p>
          {b.verified && <BadgeCheck className="h-3.5 w-3.5 shrink-0 text-primary-vibrant" />}
        </div>
        {b.address && <p className="line-clamp-1 text-[11px] text-muted-foreground">{b.address}</p>}
      </div>
    </Link>
  );
}

function PharmacyRow({ b }: { b: PharmacyBusiness }) {
  return (
    <Link
      to="/empresa/$id"
      params={{ id: b.id }}
      className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3 shadow-card"
    >
      <div className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-xl bg-emerald-500/15 text-xl">
        {b.logo_url ? <img src={b.logo_url} alt="" className="h-full w-full object-cover" /> : "💊"}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1">
          <p className="line-clamp-1 text-sm font-bold text-foreground">{b.name}</p>
          {b.verified && <BadgeCheck className="h-3.5 w-3.5 shrink-0 text-primary-vibrant" />}
        </div>
        {b.address && <p className="line-clamp-1 text-xs text-muted-foreground">{b.address}</p>}
      </div>
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10.5px] font-bold text-emerald-700">
        <Clock className="h-3 w-3" />
        Aberta
      </span>
    </Link>
  );
}

function ProductGridCard({ p }: { p: PharmacyProduct }) {
  const price = effPrice(p);
  const pct = discountPct(p);
  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-card">
      <div className="relative h-24 w-full bg-secondary/40">
        {p.image_url ? (
          <img
            src={p.image_url}
            alt={p.name}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="grid h-full w-full place-items-center text-3xl opacity-40">💊</div>
        )}
        {pct > 0 && (
          <span className="absolute left-2 top-2 rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-bold text-white">
            -{pct}%
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-2.5">
        <p className="line-clamp-2 text-xs font-semibold leading-tight text-foreground">{p.name}</p>
        <p className="text-sm font-black text-primary-vibrant">{money(price)}</p>
        {p.business && (
          <p className="line-clamp-1 text-[10.5px] text-muted-foreground">{p.business.name}</p>
        )}
      </div>
    </div>
  );
}

function ProductCard({ p }: { p: PharmacyProduct }) {
  const price = effPrice(p);
  const pct = discountPct(p);
  const b = p.business;
  const wa = b?.whatsapp
    ? `https://wa.me/${b.whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(
        `Olá! Vi ${p.name} no Guia Comendador Soares. Ainda está disponível por ${money(price)}?`,
      )}`
    : null;
  const tel = b?.phone ? `tel:${b.phone.replace(/\s/g, "")}` : null;
  const map =
    b?.latitude && b?.longitude
      ? `https://www.google.com/maps/dir/?api=1&destination=${b.latitude},${b.longitude}`
      : b?.address
        ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(b.address)}`
        : null;

  return (
    <article className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
      <div className="flex gap-3 p-3">
        <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-secondary/40">
          {p.image_url ? (
            <img
              src={p.image_url}
              alt={p.name}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="grid h-full w-full place-items-center text-3xl opacity-40">💊</div>
          )}
          {pct > 0 && (
            <span className="absolute left-1 top-1 rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
              -{pct}%
            </span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="line-clamp-2 text-sm font-bold leading-tight text-foreground">{p.name}</p>
          {p.brand && (
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              {p.brand}
              {p.active_ingredient ? ` · ${p.active_ingredient}` : ""}
            </p>
          )}
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-lg font-black text-primary-vibrant">{money(price)}</span>
            {p.promo_price && p.price && p.price !== p.promo_price && (
              <span className="text-xs text-muted-foreground line-through">{money(p.price)}</span>
            )}
          </div>
          {b && (
            <Link
              to="/empresa/$id"
              params={{ id: b.id }}
              className="mt-1 flex items-center gap-1 text-xs font-semibold text-foreground"
            >
              <Store className="h-3 w-3" />
              <span className="line-clamp-1">{b.name}</span>
              {b.verified && <BadgeCheck className="h-3 w-3 text-primary-vibrant" />}
            </Link>
          )}
          <div className="mt-1 flex flex-wrap gap-1.5 text-[10px] text-muted-foreground">
            {p.delivery && (
              <span className="rounded bg-emerald-500/10 px-1.5 py-0.5 text-emerald-700">
                Entrega
              </span>
            )}
            {p.pickup && <span className="rounded bg-secondary px-1.5 py-0.5">Retirada</span>}
            {b?.hours && isOpenNow(b.hours) && (
              <span className="rounded bg-primary/10 px-1.5 py-0.5 text-primary-vibrant">
                Aberta agora
              </span>
            )}
            <span className="ml-auto">
              Atualizado {new Date(p.updated_at).toLocaleDateString("pt-BR")}
            </span>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-4 gap-1 border-t border-border p-2">
        {wa ? (
          <a
            href={wa}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-mini bg-[#25D366] text-white"
          >
            <MessageCircle className="h-3.5 w-3.5" />
            WhatsApp
          </a>
        ) : (
          <span className="btn-mini opacity-40">WhatsApp</span>
        )}
        {tel ? (
          <a href={tel} className="btn-mini bg-secondary text-foreground">
            <Phone className="h-3.5 w-3.5" />
            Ligar
          </a>
        ) : (
          <span className="btn-mini opacity-40">Ligar</span>
        )}
        {map ? (
          <a
            href={map}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-mini bg-secondary text-foreground"
          >
            <Navigation className="h-3.5 w-3.5" />
            Rota
          </a>
        ) : (
          <span className="btn-mini opacity-40">Rota</span>
        )}
        {b && (
          <Link
            to="/empresa/$id"
            params={{ id: b.id }}
            className="btn-mini bg-primary text-primary-foreground"
          >
            <ArrowRight className="h-3.5 w-3.5" />
            Ver
          </Link>
        )}
      </div>
      <style>{`.btn-mini{display:inline-flex;align-items:center;justify-content:center;gap:.25rem;border-radius:.5rem;padding:.4rem .25rem;font-size:10.5px;font-weight:700;}`}</style>
    </article>
  );
}
