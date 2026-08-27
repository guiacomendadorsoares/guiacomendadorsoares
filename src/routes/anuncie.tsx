import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Building2,
  Home as HomeIcon,
  Briefcase,
  TrendingUp,
  Users,
  Phone,
  ShoppingBag,
  Check,
  X,
  Crown,
  Star,
  Sparkles,
  ChevronDown,
  ArrowRight,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { SiteFooter } from "@/components/site-footer";
import logoUrl from "@/assets/logo.png";

export const Route = createFileRoute("/anuncie")({
  head: () => ({
    meta: [
      { title: "Anuncie no Guia Comendador Soares — Mais visibilidade" },
      {
        name: "description",
        content:
          "Cadastre sua empresa, anuncie imóveis e publique vagas no maior guia digital de Comendador Soares. Planos a partir de R$ 19,90/mês.",
      },
      { property: "og:title", content: "Anuncie no Guia Comendador Soares" },
      {
        property: "og:description",
        content: "Mais visibilidade, mais clientes, mais vendas. Comece grátis.",
      },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: FAQS.map((f) => ({
            "@type": "Question",
            name: f.q,
            acceptedAnswer: { "@type": "Answer", text: f.a },
          })),
        }),
      },
    ],
  }),
  component: AnunciePage,
});

function AnunciePage() {
  return (
    <div className="min-h-dvh bg-background">
      <Header />
      <Hero />
      <Benefits />
      <Plans />
      <Compare />
      <Testimonials />
      <Faq />
      <FinalCta />
      <SiteFooter />
    </div>
  );
}

/* ---------- Header ---------- */
function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur-lg">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link to="/" className="flex items-center gap-2">
          <img src={logoUrl} alt="" className="h-9 w-9 object-contain" />
          <span className="font-display text-sm font-bold leading-tight">
            Guia
            <br />
            Comendador Soares
          </span>
        </Link>
        <div className="flex items-center gap-2">
          <Link
            to="/auth"
            className="hidden text-sm font-medium text-muted-foreground hover:text-foreground sm:block"
          >
            Entrar
          </Link>
          <Button asChild size="sm" variant="premium">
            <Link to="/auth">Começar agora</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}

/* ---------- Hero ---------- */
function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-border bg-gradient-to-b from-primary/5 via-card to-background">
      <div
        className="absolute inset-0 -z-10 opacity-30"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 10%, var(--primary-vibrant) 0%, transparent 40%), radial-gradient(circle at 80% 60%, var(--gold) 0%, transparent 35%)",
        }}
      />
      <div className="mx-auto max-w-6xl px-4 py-16 text-center md:py-24">
        <span className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-primary">
          <Sparkles className="h-3 w-3" /> Anuncie no Guia
        </span>
        <h1 className="font-display text-4xl font-bold leading-tight tracking-tight md:text-6xl">
          O maior guia digital de
          <br />
          <span className="bg-gradient-to-r from-primary to-primary-vibrant bg-clip-text text-transparent">
            Comendador Soares
          </span>
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-base text-muted-foreground md:text-lg">
          Conecte sua empresa, imóvel ou vaga a milhares de moradores do bairro. Mais visibilidade,
          mais clientes, mais resultado.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button asChild size="lg" variant="default">
            <Link to="/auth">
              <Building2 className="h-4 w-4" /> Cadastrar Empresa
            </Link>
          </Button>
          <Button asChild size="lg" variant="gold">
            <Link to="/auth">
              <HomeIcon className="h-4 w-4" /> Anunciar Imóvel
            </Link>
          </Button>
          <Button asChild size="lg" variant="premium">
            <Link to="/auth">
              <Briefcase className="h-4 w-4" /> Publicar Vaga
            </Link>
          </Button>
        </div>
        <p className="mt-5 text-xs text-muted-foreground">Comece grátis • Sem cartão de crédito</p>
      </div>
    </section>
  );
}

/* ---------- Benefits ---------- */
const BENEFITS = [
  {
    icon: TrendingUp,
    title: "Mais visibilidade",
    desc: "Apareça para milhares de moradores buscando empresas e serviços no bairro.",
  },
  {
    icon: Users,
    title: "Mais clientes",
    desc: "Receba contatos qualificados de quem está realmente perto de você.",
  },
  {
    icon: Phone,
    title: "Mais contatos",
    desc: "WhatsApp, telefone e redes sociais direto no perfil — sem intermediários.",
  },
  {
    icon: ShoppingBag,
    title: "Mais vendas",
    desc: "Promoções, destaque na home e estatísticas que aumentam sua conversão.",
  },
];

function Benefits() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-16 md:py-20">
      <div className="text-center">
        <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-primary">
          Benefícios
        </p>
        <h2 className="font-display text-3xl font-bold md:text-4xl">
          Por que anunciar com a gente?
        </h2>
      </div>
      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {BENEFITS.map(({ icon: Icon, title, desc }) => (
          <div
            key={title}
            className="rounded-2xl border border-border bg-card p-6 shadow-card transition-all duration-200 hover:-translate-y-1 hover:border-primary/30 hover:shadow-elegant"
          >
            <span className="mb-4 grid h-12 w-12 place-items-center rounded-xl gradient-brand text-primary-foreground shadow-elegant">
              <Icon className="h-5 w-5" />
            </span>
            <h3 className="font-display text-lg font-bold">{title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ---------- Plans ---------- */
const PLANS = [
  {
    slug: "free",
    name: "Free",
    price: "Grátis",
    icon: Sparkles,
    bullets: [
      "Nome, categoria e endereço",
      "Logo da empresa",
      "Horário de funcionamento",
      "Até 3 imóveis · 5 fotos",
    ],
  },
  {
    slug: "destaque",
    name: "Destaque",
    price: "R$ 19,90",
    period: "/mês",
    icon: Star,
    bullets: [
      "Tudo do Free",
      "Banner e galeria",
      "Redes sociais + WhatsApp",
      "Selo Verificada",
      "Até 10 imóveis · 15 fotos",
    ],
  },
  {
    slug: "ouro",
    name: "Ouro",
    price: "R$ 49,90",
    period: "/mês",
    icon: Crown,
    highlight: true,
    bullets: [
      "Tudo do Destaque",
      "Destaque na Home",
      "Prioridade nas buscas",
      "Estatísticas avançadas",
      "Imóveis ilimitados + vídeos",
    ],
  },
];

function Plans() {
  return (
    <section className="border-y border-border bg-card/50 py-16 md:py-20">
      <div className="mx-auto max-w-6xl px-4">
        <div className="text-center">
          <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-primary">
            Planos
          </p>
          <h2 className="font-display text-3xl font-bold md:text-4xl">Escolha o plano ideal</h2>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
            Comece grátis. Suba de plano quando precisar de mais alcance.
          </p>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {PLANS.map((p) => {
            const Icon = p.icon;
            return (
              <div
                key={p.slug}
                className={`relative flex flex-col rounded-2xl border-2 p-6 shadow-card transition-all duration-200 hover:-translate-y-1 ${
                  p.highlight
                    ? "border-primary bg-gradient-to-b from-primary/5 to-card shadow-elegant"
                    : "border-border bg-card hover:shadow-elegant"
                }`}
              >
                {p.highlight && (
                  <span className="absolute -top-3 right-6 rounded-full gradient-brand px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-primary-foreground shadow-elegant">
                    Mais popular
                  </span>
                )}
                <div className="flex items-center gap-3">
                  <span
                    className={`grid h-12 w-12 place-items-center rounded-xl ${p.highlight ? "gradient-brand text-primary-foreground" : "bg-secondary text-primary"}`}
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                  <h3 className="font-display text-xl font-bold">{p.name}</h3>
                </div>
                <div className="mt-5">
                  <span className="font-display text-4xl font-bold">{p.price}</span>
                  {p.period && <span className="text-sm text-muted-foreground">{p.period}</span>}
                </div>
                <ul className="mt-5 flex-1 space-y-2 text-sm">
                  {p.bullets.map((b) => (
                    <li key={b} className="flex items-start gap-2">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  asChild
                  className="mt-6 w-full"
                  variant={p.highlight ? "default" : "secondary"}
                >
                  <Link to="/planos">Selecionar {p.name}</Link>
                </Button>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ---------- Compare ---------- */
const FEATURES: { label: string; free: boolean; destaque: boolean; ouro: boolean }[] = [
  { label: "Perfil da empresa", free: true, destaque: true, ouro: true },
  { label: "Logo + horário", free: true, destaque: true, ouro: true },
  { label: "WhatsApp + redes sociais", free: false, destaque: true, ouro: true },
  { label: "Banner + galeria de fotos", free: false, destaque: true, ouro: true },
  { label: "Selo Empresa Verificada", free: false, destaque: true, ouro: true },
  { label: "Promoções e cupons", free: false, destaque: true, ouro: true },
  { label: "Destaque na Home", free: false, destaque: false, ouro: true },
  { label: "Prioridade nas buscas", free: false, destaque: false, ouro: true },
  { label: "Estatísticas avançadas", free: false, destaque: false, ouro: true },
  { label: "Vídeos e imóveis ilimitados", free: false, destaque: false, ouro: true },
];

function Compare() {
  return (
    <section className="mx-auto max-w-5xl px-4 py-16 md:py-20">
      <div className="text-center">
        <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-primary">
          Comparativo
        </p>
        <h2 className="font-display text-3xl font-bold md:text-4xl">Tudo o que você ganha</h2>
      </div>
      <div className="mt-10 overflow-hidden rounded-2xl border border-border bg-card shadow-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-secondary/50">
              <th className="px-4 py-3 text-left font-semibold">Recurso</th>
              <th className="px-4 py-3 text-center font-semibold">Free</th>
              <th className="px-4 py-3 text-center font-semibold">Destaque</th>
              <th className="px-4 py-3 text-center font-semibold text-primary">Ouro</th>
            </tr>
          </thead>
          <tbody>
            {FEATURES.map((f, i) => (
              <tr key={f.label} className={i % 2 ? "bg-secondary/20" : ""}>
                <td className="px-4 py-3 font-medium">{f.label}</td>
                <td className="px-4 py-3 text-center">
                  <Cell on={f.free} />
                </td>
                <td className="px-4 py-3 text-center">
                  <Cell on={f.destaque} />
                </td>
                <td className="px-4 py-3 text-center">
                  <Cell on={f.ouro} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function Cell({ on }: { on: boolean }) {
  return on ? (
    <Check className="mx-auto h-4 w-4 text-primary" />
  ) : (
    <X className="mx-auto h-4 w-4 text-muted-foreground/40" />
  );
}

/* ---------- Testimonials (placeholder) ---------- */
function Testimonials() {
  const items = [
    {
      name: "Em breve",
      role: "Comerciante local",
      quote: "Espaço reservado para depoimentos reais de parceiros.",
    },
    {
      name: "Em breve",
      role: "Corretor de imóveis",
      quote: "Espaço reservado para depoimentos reais de parceiros.",
    },
    {
      name: "Em breve",
      role: "RH local",
      quote: "Espaço reservado para depoimentos reais de parceiros.",
    },
  ];
  return (
    <section className="border-y border-border bg-card/50 py-16 md:py-20">
      <div className="mx-auto max-w-6xl px-4">
        <div className="text-center">
          <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-primary">
            Depoimentos
          </p>
          <h2 className="font-display text-3xl font-bold md:text-4xl">Quem anuncia recomenda</h2>
        </div>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {items.map((t, i) => (
            <div
              key={i}
              className="rounded-2xl border border-dashed border-border bg-card p-6 shadow-card"
            >
              <div className="mb-3 flex gap-0.5 text-gold">
                {Array.from({ length: 5 }).map((_, k) => (
                  <Star key={k} className="h-4 w-4 fill-current" />
                ))}
              </div>
              <p className="text-sm italic text-muted-foreground">"{t.quote}"</p>
              <div className="mt-4 flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-full bg-secondary text-xs font-bold text-primary">
                  ?
                </span>
                <div>
                  <p className="text-sm font-semibold">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------- FAQ ---------- */
const FAQS = [
  {
    q: "Como anunciar minha empresa?",
    a: "Crie sua conta gratuita, acesse o painel da empresa e preencha as informações. Após aprovação, seu perfil fica visível para todos os usuários do guia.",
  },
  {
    q: "Como publicar vagas de emprego?",
    a: "Empresas cadastradas podem publicar vagas direto pelo painel. Cada vaga passa por uma rápida moderação para garantir qualidade.",
  },
  {
    q: "Como anunciar imóveis?",
    a: "Corretores e proprietários podem usar o painel de imóveis. No plano Free são até 3 anúncios; planos pagos liberam mais imóveis e fotos.",
  },
  {
    q: "Como funciona a aprovação dos anúncios?",
    a: "Nossa equipe revisa cada novo anúncio em até 24h úteis para garantir que o conteúdo respeita as regras do guia.",
  },
];

function Faq() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section className="mx-auto max-w-3xl px-4 py-16 md:py-20">
      <div className="text-center">
        <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-primary">FAQ</p>
        <h2 className="font-display text-3xl font-bold md:text-4xl">Perguntas frequentes</h2>
      </div>
      <div className="mt-10 space-y-3">
        {FAQS.map((f, i) => {
          const isOpen = open === i;
          return (
            <button
              key={f.q}
              type="button"
              onClick={() => setOpen(isOpen ? null : i)}
              className="block w-full rounded-2xl border border-border bg-card p-5 text-left shadow-card transition-all hover:border-primary/30"
            >
              <div className="flex items-center justify-between gap-4">
                <span className="font-display font-bold">{f.q}</span>
                <ChevronDown
                  className={`h-5 w-5 shrink-0 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`}
                />
              </div>
              {isOpen && (
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{f.a}</p>
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
}

/* ---------- Final CTA ---------- */
function FinalCta() {
  return (
    <section className="px-4 py-16 md:py-24">
      <div className="mx-auto max-w-4xl overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-primary to-primary-vibrant p-10 text-center text-primary-foreground shadow-elegant md:p-16">
        <h2 className="font-display text-3xl font-bold md:text-5xl">
          Faça parte do Guia Comendador Soares
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-primary-foreground/85">
          Em poucos minutos seu negócio está visível para o bairro inteiro. Comece grátis hoje.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button asChild size="lg" variant="gold">
            <Link to="/auth">
              Cadastrar grátis <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="premium">
            <Link to="/planos">Ver planos</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
