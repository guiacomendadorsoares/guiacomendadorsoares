import { Link } from "@tanstack/react-router";
import { Crown, Check, Lock, Sparkles, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCurrentPlan } from "@/lib/plans";
import { useCurrentUser } from "@/hooks/use-auth";
import { useUsageCounts, formatLimit } from "@/lib/plan-limits";

type Kind = "business" | "properties" | "pharmacy";

const LABELS: Record<Kind, Record<string, string>> = {
  business: {
    whatsapp: "WhatsApp + botão",
    map: "Localização/Como chegar",
    gallery: "Galeria de fotos",
    banner: "Banner",
    social: "Instagram e Facebook",
    website: "Site próprio",
    promotions: "Promoções",
    products: "Catálogo de produtos",
    videos: "Vídeos",
    verified_badge: "Selo Empresa Verificada",
    featured_category: "Destaque na categoria",
    featured_home: "Destaque na Home",
    empresa_do_dia: "Empresa do Dia",
    priority_search: "Prioridade nas buscas",
  },
  properties: {
    videos: "Vídeos",
    whatsapp: "WhatsApp direto",
    featured_search: "Destaque nas buscas",
    featured_home: "Destaque na Home",
    priority_search: "Melhor posicionamento",
  },
  pharmacy: {
    promotions: "Produtos em promoção",
    featured_category: "Destaque em Farmácias",
    featured_home: "Destaque na Home",
    priority_search: "Melhor posicionamento",
  },
};

const NEXT: Record<string, string> = { free: "destaque", destaque: "ouro", ouro: "" };

export function MyPlanCard({
  kind = "business",
  usage,
}: {
  kind?: Kind;
  usage?: { used: number };
}) {
  const { plan, slug, loading, allPlans } = useCurrentPlan();
  const { user } = useCurrentUser();
  const counts = useUsageCounts(user?.id);
  if (loading || !plan) return null;
  const features = (plan.features as any)?.[kind] ?? {};
  const nextSlug = NEXT[slug];
  const nextPlan = nextSlug ? allPlans.find((p) => p.slug === nextSlug) : null;
  const nextFeatures = nextPlan ? ((nextPlan.features as any)?.[kind] ?? {}) : {};

  const meters = buildMeters(kind, features, counts.data, usage);
  const statColor =
    slug === "ouro" ? "gradient-brand text-primary-foreground" : "bg-secondary text-primary";

  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className={`grid h-10 w-10 place-items-center rounded-xl ${statColor}`}>
            <Crown className="h-5 w-5" />
          </span>
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Meu plano</p>
            <p className="font-display text-lg font-bold">{plan.name}</p>
          </div>
        </div>
        <Button asChild size="sm" variant={slug === "ouro" ? "outline" : "default"}>
          <Link to="/planos">{slug === "ouro" ? "Gerenciar" : "Fazer upgrade"}</Link>
        </Button>
      </div>

      {meters.length > 0 && (
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {meters.map((m) => (
            <UsageMeter key={m.label} {...m} />
          ))}
        </div>
      )}

      <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
        {Object.entries(LABELS[kind]).map(([k, label]) => {
          const enabled = !!features[k];
          return (
            <div
              key={k}
              className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm ${enabled ? "border-primary/30 bg-primary/5" : "border-border bg-muted/30 text-muted-foreground"}`}
            >
              {enabled ? <Check className="h-4 w-4 text-primary" /> : <Lock className="h-4 w-4" />}
              <span>{label}</span>
            </div>
          );
        })}
      </div>

      {nextPlan && (
        <div className="mt-4 rounded-xl border border-dashed border-primary/40 bg-primary/5 p-3">
          <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-primary">
            <Sparkles className="h-3.5 w-3.5" /> Benefícios do próximo plano ({nextPlan.name})
          </p>
          <ul className="mt-2 space-y-1 text-xs">
            {Object.entries(LABELS[kind])
              .filter(([k]) => !features[k] && nextFeatures[k])
              .slice(0, 4)
              .map(([k, label]) => (
                <li key={k} className="flex items-center gap-1.5">
                  <TrendingUp className="h-3 w-3 text-primary" />
                  <span>{label}</span>
                </li>
              ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function UsageMeter({ label, used, max }: { label: string; used: number; max: number }) {
  const pct = max <= 0 ? (used > 0 ? 100 : 0) : max === -1 ? 0 : Math.min(100, (used / max) * 100);
  const full = max !== -1 && max > 0 && used >= max;
  return (
    <div
      className={`rounded-lg border p-3 ${full ? "border-destructive/40 bg-destructive/5" : "border-border bg-secondary/40"}`}
    >
      <div className="flex items-baseline justify-between text-xs">
        <span className="font-semibold">{label}</span>
        <span className={full ? "text-destructive font-bold" : "text-muted-foreground"}>
          {used}/{formatLimit(max)}
        </span>
      </div>
      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
        <div
          className={`h-full ${full ? "bg-destructive" : "bg-primary"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function buildMeters(
  kind: Kind,
  features: any,
  counts:
    | { businesses: number; properties: number; jobsThisMonth: number; products: number }
    | undefined,
  usage?: { used: number },
) {
  const c = counts ?? { businesses: 0, properties: 0, jobsThisMonth: 0, products: 0 };
  if (kind === "properties") {
    return [
      {
        label: "Imóveis ativos",
        used: usage?.used ?? c.properties,
        max: features.max_listings ?? 0,
      },
    ];
  }
  if (kind === "pharmacy") {
    return [{ label: "Produtos", used: c.products, max: features.max_products ?? 0 }];
  }
  return [
    { label: "Vagas (30d)", used: c.jobsThisMonth, max: features.max_jobs_per_month ?? 0 },
    { label: "Fotos da empresa", used: 0, max: features.gallery_max ?? 0 },
  ];
}
