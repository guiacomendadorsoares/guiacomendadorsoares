import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/app-shell";
import { InstallPrompt } from "@/components/install-prompt";
import { HomePopup } from "@/components/home-popup";
import { HeroCarousel } from "@/components/hero-carousel";
import { CategoriesGrid } from "@/components/categories-grid";
import { SectionHeader } from "@/components/cards";
import { Reveal } from "@/components/reveal";
import { getDisplayImageUrl } from "@/lib/storage";
import { MapPin, Search, Sparkles, ChevronRight, LifeBuoy, Phone, Landmark, Clock, Navigation, Tag, BadgeCheck } from "lucide-react";
import { isOpenNow } from "@/lib/hours";
import { NotificationsBell } from "@/components/notifications-bell";
import logoUrl from "@/assets/logo.png";
import phEmpresa from "@/assets/placeholders/empresa.jpg.asset.json";
import phEmpresa2 from "@/assets/placeholders/empresa-2.jpg.asset.json";
import phEmpresa3 from "@/assets/placeholders/empresa-3.jpg.asset.json";
import phVaga from "@/assets/placeholders/vaga.jpg.asset.json";
import phVaga2 from "@/assets/placeholders/vaga-2.jpg.asset.json";
import phVaga3 from "@/assets/placeholders/vaga-3.jpg.asset.json";
import phImovel from "@/assets/placeholders/imovel.jpg.asset.json";
import phImovel2 from "@/assets/placeholders/imovel-2.jpg.asset.json";
import phImovel3 from "@/assets/placeholders/imovel-3.jpg.asset.json";
import phEvento from "@/assets/placeholders/evento.jpg.asset.json";
import phEvento2 from "@/assets/placeholders/evento-2.jpg.asset.json";
import phEvento3 from "@/assets/placeholders/evento-3.jpg.asset.json";
import phNoticia from "@/assets/placeholders/noticia.jpg.asset.json";
import phNoticia2 from "@/assets/placeholders/noticia-2.jpg.asset.json";
import phNoticia3 from "@/assets/placeholders/noticia-3.jpg.asset.json";
import phComer from "@/assets/placeholders/comer.jpg.asset.json";
import phComer2 from "@/assets/placeholders/comer-2.jpg.asset.json";
import phComer3 from "@/assets/placeholders/comer-3.jpg.asset.json";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Guia Comendador Soares — Comércio e Vagas em Nova Iguaçu" },
      {
        name: "description",
        content:
          "Guia completo do bairro Comendador Soares, em Nova Iguaçu: empresas, farmácias, serviços, vagas de emprego, imóveis, eventos e notícias.",
      },
      { property: "og:title", content: "Guia Comendador Soares — Comércio e Vagas em Nova Iguaçu" },
      {
        property: "og:description",
        content: "O guia oficial do bairro Comendador Soares em Nova Iguaçu: comércio, vagas, imóveis e comunidade.",
      },
      { property: "og:url", content: "https://comendadorsoares.com.br/" },
    ],
    links: [{ rel: "canonical", href: "https://comendadorsoares.com.br/" }],
  }),
  component: HomePage,
});

const PLACEHOLDER_HINTS = [
  "Academia",
  "Advogado",
  "Restaurante",
  "Farmácia",
  "Dentista",
  "Eletricista",
  "Pizzaria",
  "Mercado",
  "Pet Shop",
];

function HomePage() {
  return (
    <AppShell>
      <SmartHeader />
      <SearchHero />
      <QuickShortcuts />
      <Reveal><HeroCarousel /></Reveal>
      <InstallPrompt />
      <HomePopup />


      <Reveal as="section" className="mb-7">
        <SectionHeader title="Categorias" subtitle="Encontre tudo do bairro" to="/guia" />
        <CategoriesGrid />
      </Reveal>

      <Reveal><PharmaciesHighlight /></Reveal>
      <Reveal><OpenNowSection /></Reveal>
      <Reveal><PromotionsPlaceholder /></Reveal>
      <Reveal><WhereToEat /></Reveal>
      <Reveal><LatestJobs /></Reveal>
      <Reveal><RecentProperties /></Reveal>
      <Reveal><NeighborhoodNews /></Reveal>
      <Reveal><UpcomingEvents /></Reveal>
      <Reveal><UtilidadePublicaHighlight /></Reveal>
    </AppShell>
  );
}

/* ---------- Smart sticky header ---------- */

function SmartHeader() {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      className={`sticky top-0 z-40 -mx-5 mb-3 px-5 pt-[max(env(safe-area-inset-top),0.5rem)] transition-all duration-300 ease-out md:-mx-8 md:px-8 lg:-mx-12 lg:px-12 ${
        scrolled
          ? "border-b border-border/60 bg-background/75 pb-2 shadow-[0_6px_20px_-12px_rgba(0,0,0,0.25)] backdrop-blur-xl"
          : "border-b border-transparent bg-transparent pb-2"
      }`}
    >
      <div className="flex items-center gap-3">
        <Link to="/" className="flex min-w-0 items-center gap-2">
          <img
            src={logoUrl}
            alt="Guia Comendador Soares — Guia comercial de Nova Iguaçu"
            className={`shrink-0 object-contain transition-all duration-300 ${scrolled ? "h-8 w-8" : "h-10 w-10"}`}
          />
          <div className="min-w-0 leading-tight">
            {!scrolled ? (
              <>
                <p className="font-display text-[13px] font-extrabold text-foreground animate-fade-in">
                  {greeting()} <span aria-hidden>👋</span>
                </p>
                <p className="flex items-center gap-1 truncate text-[10px] text-muted-foreground">
                  <MapPin className="h-2.5 w-2.5 shrink-0 text-primary" /> Você está em Comendador Soares
                </p>
              </>
            ) : (
              <>
                <p className="font-display text-[12px] font-extrabold text-foreground">Guia CS</p>
                <p className="flex items-center gap-1 truncate text-[10px] text-muted-foreground">
                  <MapPin className="h-2.5 w-2.5 shrink-0" /> Comendador Soares
                </p>
              </>
            )}
          </div>
        </Link>
        <div className="ml-auto flex items-center gap-2">
          <NotificationsBell variant="card" />
        </div>
      </div>

      <div
        className={`grid transition-all duration-300 ease-out ${
          scrolled ? "mt-2 grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden">
          <button
            type="button"
            onClick={() => navigate({ to: "/buscar", search: { q: "" } })}
            className="flex w-full items-center gap-2 rounded-full border border-border bg-card px-4 py-2.5 text-left text-sm text-muted-foreground shadow-card transition-transform active:scale-[0.98]"
            aria-label="Abrir busca"
          >
            <Search className="h-4 w-4 shrink-0 text-primary" />
            <span className="truncate">O que você está procurando?</span>
          </button>
        </div>
      </div>
    </div>
  );
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
}



function SearchHero() {
  const navigate = useNavigate();
  const [term, setTerm] = useState("");
  const [hintIndex, setHintIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setHintIndex((i) => (i + 1) % PLACEHOLDER_HINTS.length);
    }, 2200);
    return () => clearInterval(id);
  }, []);

  function submit(e?: React.FormEvent) {
    e?.preventDefault();
    navigate({ to: "/buscar", search: { q: term.trim() } });
  }

  return (
    <section className="relative -mx-5 mb-5 overflow-hidden px-5 pb-6 pt-2">
      <div
        className="pointer-events-none absolute inset-0 -z-10 opacity-90"
        style={{
          background:
            "radial-gradient(120% 80% at 20% 0%, color-mix(in oklab, var(--primary) 22%, transparent) 0%, transparent 55%), radial-gradient(90% 70% at 100% 10%, color-mix(in oklab, var(--gold) 28%, transparent) 0%, transparent 60%)",
        }}
      />
      <h1 className="font-display text-[26px] font-black leading-[1.1] tracking-tight text-foreground sm:text-[30px]">
        Encontre <span className="text-primary">empresas, profissionais e serviços</span> do bairro em segundos.
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Empresas, profissionais e serviços do bairro na palma da mão.
      </p>

      <form
        onSubmit={submit}
        className="mt-4 flex items-center gap-2 rounded-2xl border border-border bg-card px-4 py-3.5 shadow-elegant"
      >
        <Search className="h-5 w-5 shrink-0 text-primary transition-transform duration-300 focus-within:scale-110" />
        <div className="relative min-w-0 flex-1">
          <input
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder={`Procure ${PLACEHOLDER_HINTS[hintIndex].toLowerCase()}...`}
            className="w-full bg-transparent text-[15px] outline-none placeholder:text-muted-foreground transition-all"
            aria-label="Buscar"
          />

          {term.length === 0 && (
            <span
              key={hintIndex}
              className="pointer-events-none absolute inset-y-0 right-0 hidden items-center pr-1 text-xs text-muted-foreground animate-fade-in sm:flex"
            >
              ex.: {PLACEHOLDER_HINTS[hintIndex]}
            </span>
          )}
        </div>
        <button
          type="submit"
          className="shrink-0 rounded-full bg-primary px-4 py-2 text-sm font-bold text-primary-foreground shadow-card transition-transform active:scale-95"
        >
          Buscar
        </button>
      </form>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {PLACEHOLDER_HINTS.slice(0, 6).map((h) => (
          <Link
            key={h}
            to="/buscar"
            search={{ q: h }}
            className="rounded-full border border-border bg-card px-3 py-1 text-[11.5px] font-semibold text-foreground shadow-card hover:bg-secondary"
          >
            {h}
          </Link>
        ))}
      </div>
    </section>
  );
}

/* ---------- Quick shortcuts row ---------- */

type Shortcut = {
  label: string;
  icon: string;
  to: string;
  search?: Record<string, string>;
  from: string;
  to2: string;
};

const SHORTCUTS: Shortcut[] = [
  { label: "Perto de Mim", icon: "📍", to: "/buscar", search: { q: "" }, from: "#1a4d3a", to2: "#34c781" },
  { label: "Mais Procurados", icon: "🔥", to: "/guia", from: "#b8842b", to2: "#f0c068" },
  { label: "Farmácias", icon: "💊", to: "/farmacias", from: "#0f3a5c", to2: "#3aa0d6" },
  { label: "Onde Comer", icon: "🍔", to: "/onde-comer", from: "#8a3a1f", to2: "#e08a3a" },
  { label: "Empregos", icon: "💼", to: "/vagas", from: "#1f3a2e", to2: "#4a8a6b" },
  { label: "Imóveis", icon: "🏠", to: "/imoveis", from: "#2a3a5a", to2: "#6a8ac0" },
  { label: "Eventos", icon: "🎉", to: "/", from: "#5a1f5a", to2: "#c060a8" },
  { label: "Emergência", icon: "🚨", to: "/utilidade-publica", from: "#7a1f1f", to2: "#d64545" },
];

function QuickShortcuts() {
  return (
    <section className="-mx-5 mb-5 md:-mx-8 lg:-mx-12" aria-label="Atalhos rápidos">
      <div className="flex gap-2.5 overflow-x-auto px-5 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:px-8 lg:px-12">
        {SHORTCUTS.map((s) => (
          <Link
            key={s.label}
            to={s.to}
            search={s.search as never}
            className="group flex min-w-[92px] shrink-0 flex-col items-center gap-1.5 rounded-2xl border border-border bg-card px-2 py-2.5 shadow-card transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-elegant active:scale-[0.96] motion-reduce:transition-none motion-reduce:hover:transform-none"
          >
            <span
              className="grid h-10 w-10 place-items-center rounded-xl text-lg text-white shadow-card transition-transform duration-200 group-hover:scale-105 motion-reduce:transform-none"
              style={{
                background: `linear-gradient(135deg, ${s.from} 0%, ${s.to2} 100%)`,
                boxShadow: `0 8px 18px -10px ${s.from}cc, inset 0 1px 0 rgba(255,255,255,0.25)`,
              }}
              aria-hidden
            >
              {s.icon}
            </span>
            <span className="text-center text-[10.5px] font-semibold leading-tight text-foreground">
              {s.label}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}


/* ---------- Shared row helpers ---------- */

type ApprovedItem = {
  id: string;
  name?: string;
  title?: string;
  subtitle?: string | null;
  company?: string | null;
  summary?: string | null;
  address?: string | null;
  cover_url?: string | null;
  logo_url?: string | null;
  banner_url?: string | null;
  featured?: boolean;
};

function useApprovedItems(
  table: "businesses" | "jobs" | "properties" | "events" | "news" | "curiosities",
  opts: { mainCategory?: string; limit?: number } = {},
) {
  const { mainCategory, limit = 3 } = opts;
  return useQuery({
    queryKey: ["home-items", table, mainCategory ?? "all", limit],
    staleTime: 5 * 60_000,
    gcTime: 30 * 60_000,
    queryFn: async () => {
      const hasFeatured = table === "businesses" || table === "properties";
      const cols = table === "businesses"
        ? "id,name,address,logo_url,banner_url,featured"
        : table === "jobs"
        ? "id,title,company,urgent"
        : table === "news"
        ? "id,title,summary,cover_url"
        : hasFeatured
        ? "id,title,cover_url,featured"
        : "id,title,cover_url";
      let q = supabase.from(table).select(cols).eq("status", "approved");
      if (table === "businesses" && mainCategory) q = (q as any).eq("main_category", mainCategory);
      if (hasFeatured) q = q.order("featured", { ascending: false });
      else q = q.order("created_at", { ascending: false });
      const { data, error } = await q.limit(limit);
      if (error) {
        console.error(`[home] ${table} fetch error:`, error.message);
        return [];
      }
      return Promise.all(
        ((data ?? []) as unknown as ApprovedItem[]).map(async (item) => ({
          ...item,
          subtitle: item.company ?? item.summary ?? item.address ?? null,
          cover_url: await getDisplayImageUrl(item.cover_url ?? item.banner_url ?? item.logo_url ?? null),
          banner_url: await getDisplayImageUrl(item.banner_url ?? null),
          logo_url: await getDisplayImageUrl(item.logo_url ?? null),
        })),
      );
    },
  });
}

type PHCard = { title: string; subtitle: string; image: string };

function PlaceholderRow({ cards, compact = false }: { cards: PHCard[]; compact?: boolean }) {
  const size = compact
    ? { card: "min-w-[150px] max-w-[150px]", img: "h-20", pad: "p-2", title: "text-[12.5px]", sub: "text-[11px]" }
    : { card: "min-w-[230px] max-w-[230px]", img: "h-32", pad: "p-3", title: "text-sm", sub: "text-xs" };
  return (
    <div className="-mx-1 flex gap-2.5 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {cards.map((c, i) => (
        <article
          key={i}
          className={`relative overflow-hidden rounded-2xl border border-border bg-card shadow-card ${size.card}`}
        >
          <div className={`relative w-full overflow-hidden ${size.img}`}>
            <img src={c.image} alt={c.title} loading="lazy" className="h-full w-full object-cover" />
            <span className="absolute left-1.5 top-1.5 inline-flex items-center gap-1 rounded-full bg-background/85 px-1.5 py-0.5 text-[9px] font-semibold text-muted-foreground backdrop-blur">
              <Sparkles className="h-2.5 w-2.5" /> Em breve
            </span>
          </div>
          <div className={size.pad}>
            <p className={`font-semibold leading-tight line-clamp-1 ${size.title}`}>{c.title}</p>
            {!compact && <p className={`mt-0.5 line-clamp-2 text-muted-foreground ${size.sub}`}>{c.subtitle}</p>}
          </div>
        </article>
      ))}
    </div>
  );
}

type HomeCardTarget =
  | { to: "/empresa/$id"; params: { id: string } }
  | { to: "/vagas/$id"; params: { id: string } }
  | { to: "/imoveis/$id"; params: { id: string } }
  | { to: "/eventos/$id"; params: { id: string } }
  | { to: "/noticias/$id"; params: { id: string } }
  | { to: "/curiosidades/$id"; params: { id: string } };

function RealRow({
  items,
  to,
  fallbackImage,
  compact = false,
}: {
  items: ApprovedItem[];
  to: (id: string) => HomeCardTarget;
  fallbackImage: string;
  compact?: boolean;
}) {
  const size = compact
    ? { card: "min-w-[150px] max-w-[150px]", img: "h-20", pad: "p-2", title: "text-[12.5px]", sub: "text-[11px]" }
    : { card: "min-w-[230px] max-w-[230px]", img: "h-32", pad: "p-3", title: "text-sm", sub: "text-xs" };
  return (
    <div className="-mx-1 flex gap-2.5 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {items.map((it) => {
        const cover = it.cover_url || it.banner_url || fallbackImage;
        const title = it.name || it.title || "Sem título";
        const target = to(it.id);
        return (
          <Link
            key={it.id}
            to={target.to}
            params={target.params}
            className={`group relative overflow-hidden rounded-2xl border border-border bg-card shadow-card transition-all duration-200 ease-out hover:-translate-y-1 hover:border-primary/30 hover:shadow-elegant active:scale-[0.98] motion-reduce:transition-none motion-reduce:hover:transform-none ${size.card}`}
          >
            <div className={`relative w-full overflow-hidden ${size.img}`}>
              <img src={cover} alt={title} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.06] motion-reduce:transform-none" />
              <span className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-black/40 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              {it.featured ? (
                <span className="absolute left-1.5 top-1.5 inline-flex items-center gap-1 rounded-full bg-gold px-1.5 py-0.5 text-[9px] font-semibold text-gold-foreground shadow-card">
                  <Sparkles className="h-2.5 w-2.5" /> Ouro
                </span>
              ) : null}
            </div>
            <div className={size.pad}>
              <p className={`font-semibold leading-tight line-clamp-2 ${size.title}`}>{title}</p>
              {!compact && it.subtitle ? (
                <p className={`mt-1 line-clamp-2 text-muted-foreground ${size.sub}`}>{it.subtitle}</p>
              ) : null}
            </div>
          </Link>
        );
      })}
    </div>
  );
}

function SkeletonRow({ compact = false, count = 3 }: { compact?: boolean; count?: number }) {
  const size = compact
    ? { card: "min-w-[150px] max-w-[150px]", img: "h-20", pad: "p-2" }
    : { card: "min-w-[230px] max-w-[230px]", img: "h-32", pad: "p-3" };
  return (
    <div className="-mx-1 flex gap-2.5 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={`overflow-hidden rounded-2xl border border-border bg-card shadow-card ${size.card}`}>
          <div className={`w-full animate-pulse bg-muted ${size.img}`} />
          <div className={`${size.pad} space-y-2`}>
            <div className="h-3 w-4/5 animate-pulse rounded bg-muted" />
            {!compact && <div className="h-2.5 w-3/5 animate-pulse rounded bg-muted" />}
          </div>
        </div>
      ))}
    </div>
  );
}


/* ---------- Sections ---------- */

function FeaturedCompanies() {
  const { data: items = [], isLoading } = useApprovedItems("businesses");
  const placeholders: PHCard[] = [
    { title: "Sua empresa aqui", subtitle: "Anuncie seu negócio e apareça em destaque.", image: phEmpresa.url },
    { title: "Comércio local", subtitle: "Conecte-se com clientes da sua vizinhança.", image: phEmpresa2.url },
    { title: "Plano Ouro", subtitle: "Tenha prioridade no guia com o premium.", image: phEmpresa3.url },
  ];
  return (
    <section className="mb-7">
      <SectionHeader title="Empresas em destaque" subtitle="Selecionadas com plano Ouro" to="/guia" />
      {isLoading ? <SkeletonRow /> : items.length === 0 ? <PlaceholderRow cards={placeholders} /> : <RealRow items={items} to={(id) => ({ to: "/empresa/$id", params: { id } })} fallbackImage={phEmpresa.url} />}
    </section>
  );
}

function LatestJobs() {
  const { data: items = [], isLoading } = useApprovedItems("jobs");
  const placeholders: PHCard[] = [
    { title: "Vagas no bairro", subtitle: "Empresas locais publicarão oportunidades aqui.", image: phVaga.url },
    { title: "Trabalhe perto de casa", subtitle: "Menos deslocamento, mais qualidade de vida.", image: phVaga2.url },
    { title: "Cadastre sua vaga", subtitle: "Encontre talentos da vizinhança.", image: phVaga3.url },
  ];
  return (
    <section className="mb-7">
      <SectionHeader title="Últimas vagas" subtitle="Trabalhe perto de casa" to="/vagas" />
      {isLoading ? <SkeletonRow compact /> : items.length === 0 ? <PlaceholderRow compact cards={placeholders} /> : <RealRow compact items={items} to={(id) => ({ to: "/vagas/$id", params: { id } })} fallbackImage={phVaga.url} />}
    </section>
  );
}

function RecentProperties() {
  const { data: items = [], isLoading } = useApprovedItems("properties");
  const placeholders: PHCard[] = [
    { title: "Casas para alugar", subtitle: "Confira opções por aqui em breve.", image: phImovel.url },
    { title: "Imóveis à venda", subtitle: "Corretores parceiros publicam aqui.", image: phImovel2.url },
    { title: "Terrenos", subtitle: "Oportunidades para investir no bairro.", image: phImovel3.url },
  ];
  return (
    <section className="mb-7">
      <SectionHeader title="Imóveis em destaque" subtitle="Alugar e comprar" to="/imoveis" />
      {isLoading ? <SkeletonRow compact /> : items.length === 0 ? <PlaceholderRow compact cards={placeholders} /> : <RealRow compact items={items} to={(id) => ({ to: "/imoveis/$id", params: { id } })} fallbackImage={phImovel.url} />}
    </section>
  );
}

function UpcomingEvents() {
  const { data: items = [], isLoading } = useApprovedItems("events");
  const placeholders: PHCard[] = [
    { title: "Festas do bairro", subtitle: "Eventos da comunidade aparecerão aqui.", image: phEvento.url },
    { title: "Shows e feiras", subtitle: "Fique por dentro da agenda local.", image: phEvento2.url },
    { title: "Encontros culturais", subtitle: "Cultura e lazer pertinho de você.", image: phEvento3.url },
  ];
  return (
    <section className="mb-7">
      <SectionHeader title="Próximos eventos" subtitle="Acontece pertinho de você" />
      {isLoading ? <SkeletonRow compact /> : items.length === 0 ? <PlaceholderRow compact cards={placeholders} /> : <RealRow compact items={items} to={(id) => ({ to: "/eventos/$id", params: { id } })} fallbackImage={phEvento.url} />}
    </section>
  );
}

function NeighborhoodNews() {
  const { data: items = [], isLoading } = useApprovedItems("news", { limit: 5 });
  const placeholders: PHCard[] = [
    { title: "Notícias do bairro", subtitle: "A redação está preparando os conteúdos.", image: phNoticia.url },
    { title: "Comunidade", subtitle: "Histórias dos moradores.", image: phNoticia2.url },
    { title: "Acontece em CS", subtitle: "Acompanhe o que rola por aqui.", image: phNoticia3.url },
  ];
  return (
    <section className="mb-7">
      <SectionHeader title="Notícias do bairro" subtitle="As 5 mais recentes" to="/noticias" />
      {isLoading ? <SkeletonRow compact /> : items.length === 0 ? <PlaceholderRow compact cards={placeholders} /> : <RealRow compact items={items} to={(id) => ({ to: "/noticias/$id", params: { id } })} fallbackImage={phNoticia.url} />}
    </section>
  );
}

function WhereToEat() {
  const { data: items = [], isLoading } = useApprovedItems("businesses", { mainCategory: "alimentacao" });
  const placeholders: PHCard[] = [
    { title: "Restaurantes locais", subtitle: "Os favoritos da vizinhança em breve.", image: phComer.url },
    { title: "Lanchonetes", subtitle: "Sabores do bairro pertinho de você.", image: phComer2.url },
    { title: "Cafés e padarias", subtitle: "Comece bem o dia no comércio local.", image: phComer3.url },
  ];
  return (
    <section className="mb-7">
      <SectionHeader title="Onde comer" subtitle="Restaurantes, pizzarias, açaí e mais" to="/onde-comer" />
      {isLoading ? <SkeletonRow compact /> : items.length === 0 ? <PlaceholderRow compact cards={placeholders} /> : <RealRow compact items={items} to={(id) => ({ to: "/empresa/$id", params: { id } })} fallbackImage={phComer.url} />}
    </section>
  );
}

function UtilidadePublicaHighlight() {
  return (
    <section className="mb-2">
      <Link
        to="/utilidade-publica"
        className="group relative block overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-primary/15 via-card to-gold/15 p-5 shadow-card transition-transform hover:-translate-y-0.5 hover:shadow-elegant"
      >
        <div className="flex items-start gap-4">
          <span
            className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl text-white"
            style={{
              background: "linear-gradient(135deg, #7a1f1f 0%, #d64545 100%)",
              boxShadow: "0 12px 24px -10px #7a1f1fcc, inset 0 1px 0 rgba(255,255,255,0.28)",
            }}
          >
            <LifeBuoy className="h-7 w-7 drop-shadow" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-display text-lg font-black text-foreground">Utilidade Pública</p>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Emergências, telefones úteis e Prefeitura em um só lugar.
            </p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              <span className="inline-flex items-center gap-1 rounded-full bg-background/70 px-2.5 py-1 text-[11px] font-semibold text-foreground">
                <Phone className="h-3 w-3 text-primary" /> Emergência
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-background/70 px-2.5 py-1 text-[11px] font-semibold text-foreground">
                <Phone className="h-3 w-3 text-primary" /> Telefones úteis
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-background/70 px-2.5 py-1 text-[11px] font-semibold text-foreground">
                <Landmark className="h-3 w-3 text-primary" /> Prefeitura
              </span>
            </div>
          </div>
          <ChevronRight className="mt-1 h-5 w-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
        </div>
      </Link>
    </section>
  );
}

/* ---------- New Fase 1 sections ---------- */

function OpenNowSection() {
  const { data: items = [] } = useQuery({
    queryKey: ["home", "open-now"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("businesses")
        .select("id,name,address,logo_url,banner_url,hours,verified,whatsapp,latitude,longitude,category_label,subcategory")
        .eq("status", "approved")
        .limit(60);
      if (error) return [];
      const open = (data ?? []).filter((b: any) => isOpenNow(b.hours));
      return Promise.all(
        open.slice(0, 10).map(async (b: any) => ({
          ...b,
          cover_url: await getDisplayImageUrl(b.banner_url ?? b.logo_url ?? null),
        })),
      );
    },
  });

  if (items.length === 0) return null;

  return (
    <section className="mb-7">
      <SectionHeader title="Abertas agora" subtitle="Funcionando neste momento" to="/buscar" />
      <div className="-mx-1 flex gap-2.5 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {items.map((b: any) => (
          <Link
            key={b.id}
            to="/empresa/$id"
            params={{ id: b.id }}
            className="relative min-w-[230px] max-w-[230px] overflow-hidden rounded-2xl border border-border bg-card shadow-card transition-all hover:-translate-y-0.5 hover:shadow-elegant"
          >
            <div className="relative h-28 w-full overflow-hidden">
              {b.cover_url ? (
                <img src={b.cover_url} alt={b.name} loading="lazy" className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full bg-gradient-to-br from-primary/25 to-gold/20" />
              )}
              <span className="absolute left-1.5 top-1.5 inline-flex items-center gap-1 rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-bold text-white shadow">
                <Clock className="h-2.5 w-2.5" /> Aberto agora
              </span>
              {b.verified && (
                <span className="absolute right-1.5 top-1.5 inline-flex items-center gap-1 rounded-full bg-background/85 px-1.5 py-0.5 text-[10px] font-semibold text-primary backdrop-blur">
                  <BadgeCheck className="h-3 w-3" /> Verificada
                </span>
              )}
            </div>
            <div className="p-3">
              <p className="line-clamp-1 text-sm font-bold">{b.name}</p>
              <p className="mt-0.5 line-clamp-1 text-[11px] text-muted-foreground">
                {b.category_label ?? b.subcategory ?? "Empresa local"}
              </p>
              <div className="mt-2 flex items-center gap-1.5 text-[11px] text-primary-vibrant">
                <Navigation className="h-3 w-3" /> Como chegar
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

function NearbyPlaceholder() {
  return (
    <section className="mb-7">
      <SectionHeader title="Empresas próximas" subtitle="Em breve, ordenadas por distância" />
      <div className="rounded-2xl border border-dashed border-border bg-card/60 p-4 text-center text-xs text-muted-foreground">
        <MapPin className="mx-auto mb-1.5 h-4 w-4 text-primary" />
        Ative sua localização para ver os negócios mais perto de você.
      </div>
    </section>
  );
}

function PromotionsPlaceholder() {
  return (
    <section className="mb-7">
      <SectionHeader title="Promoções do bairro" subtitle="Ofertas dos comércios locais" />
      <div className="rounded-2xl border border-dashed border-border bg-gradient-to-br from-gold/10 to-primary/10 p-4 text-center text-xs text-muted-foreground">
        <Tag className="mx-auto mb-1.5 h-4 w-4 text-gold" />
        Em breve as melhores ofertas do comércio de Comendador Soares.
      </div>
    </section>
  );
}

function PharmaciesHighlight() {
  return (
    <section className="mb-7">
      <Link
        to="/farmacias"
        className="group relative block overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-emerald-500/15 via-primary/10 to-teal-400/15 p-5 shadow-elegant transition-all hover:-translate-y-0.5"
      >
        <div className="absolute -right-6 -top-6 text-8xl opacity-20 transition-transform group-hover:scale-110">💊</div>
        <div className="relative">
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[10.5px] font-bold uppercase tracking-wider text-emerald-700">
            Novidade
          </span>
          <h2 className="mt-2 font-display text-2xl font-black leading-tight text-foreground">
            💊 Farmácias
          </h2>
          <p className="mt-1 max-w-[85%] text-sm text-muted-foreground">
            Compare preços das farmácias de Comendador Soares.
          </p>
          <span className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-bold text-primary-foreground shadow-card">
            <Search className="h-4 w-4" />
            Pesquisar Produtos
          </span>
        </div>
      </Link>
    </section>
  );
}


