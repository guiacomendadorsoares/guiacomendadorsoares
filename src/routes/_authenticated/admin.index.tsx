import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  CheckCircle2,
  Building2,
  Briefcase,
  Home,
  Newspaper,
  Calendar,
  Sparkles,
  Users,
  Pill,
  Crown,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/")({
  component: AdminHome,
});

const TABLES = ["businesses", "jobs", "properties", "news", "events", "curiosities"] as const;

function useCounts() {
  return useQuery({
    queryKey: ["admin-counts"],
    queryFn: async () => {
      const out: Record<string, { total: number; pending: number; approved: number }> = {};
      await Promise.all(
        TABLES.map(async (t) => {
          const [total, pending, approved] = await Promise.all([
            supabase.from(t).select("*", { count: "exact", head: true }),
            supabase.from(t).select("*", { count: "exact", head: true }).eq("status", "pending"),
            supabase.from(t).select("*", { count: "exact", head: true }).eq("status", "approved"),
          ]);
          out[t] = {
            total: total.count ?? 0,
            pending: pending.count ?? 0,
            approved: approved.count ?? 0,
          };
        }),
      );
      const [usersRes, profilesPlans, pharmProducts] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("profiles").select("current_plan"),
        supabase.from("pharmacy_products").select("*", { count: "exact", head: true }),
      ]);
      const plans = { free: 0, destaque: 0, ouro: 0 } as Record<string, number>;
      (profilesPlans.data ?? []).forEach((p: any) => {
        plans[p.current_plan ?? "free"] = (plans[p.current_plan ?? "free"] ?? 0) + 1;
      });
      return {
        byTable: out,
        users: usersRes.count ?? 0,
        plans,
        pharmProducts: pharmProducts.count ?? 0,
      };
    },
  });
}

const ICONS = {
  businesses: Building2,
  jobs: Briefcase,
  properties: Home,
  news: Newspaper,
  events: Calendar,
  curiosities: Sparkles,
} as const;

const LABELS = {
  businesses: "Empresas",
  jobs: "Vagas",
  properties: "Imóveis",
  news: "Notícias",
  events: "Eventos",
  curiosities: "Curiosidades",
} as const;

function AdminHome() {
  const { data, isLoading } = useCounts();
  const totalPending = data
    ? TABLES.reduce((acc, t) => acc + (data.byTable[t]?.pending ?? 0), 0)
    : 0;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Aprovações pendentes"
          value={isLoading ? "…" : totalPending}
          icon={CheckCircle2}
          accent="gold"
          href="/admin/aprovacoes"
        />
        <KpiCard
          label="Usuários"
          value={isLoading ? "…" : (data?.users ?? 0)}
          icon={Users}
          href="/admin/usuarios"
        />
        <KpiCard
          label="Empresas"
          value={isLoading ? "…" : (data?.byTable.businesses.total ?? 0)}
          icon={Building2}
          href="/admin/empresas"
        />
        <KpiCard
          label="Imóveis"
          value={isLoading ? "…" : (data?.byTable.properties.total ?? 0)}
          icon={Home}
          href="/admin/imoveis"
        />
      </div>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-lg font-bold">Assinaturas</h2>
          <Link to="/admin/planos" className="text-xs font-semibold text-primary hover:underline">
            Configurar planos →
          </Link>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <PlanKpi label="Free" value={data?.plans.free ?? 0} tone="muted" />
          <PlanKpi label="Destaque" value={data?.plans.destaque ?? 0} tone="primary" />
          <PlanKpi label="Ouro" value={data?.plans.ouro ?? 0} tone="gold" />
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-lg font-bold">Farmácias</h2>
          <span className="text-xs text-muted-foreground">Produtos cadastrados no comparador</span>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl gradient-brand text-primary-foreground">
              <Pill className="h-5 w-5" />
            </span>
            <div>
              <p className="font-display text-2xl font-bold">{data?.pharmProducts ?? 0}</p>
              <p className="text-xs text-muted-foreground">Produtos totais em todas as farmácias</p>
            </div>
          </div>
        </div>
      </section>

      <section>
        <h2 className="mb-3 font-display text-lg font-bold">Cadastro rápido</h2>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {TABLES.map((t) => {
            const Icon = ICONS[t];
            return (
              <Link
                key={`new-${t}`}
                to={moduleRoute(t)}
                className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-elegant"
              >
                <span className="grid h-9 w-9 place-items-center rounded-lg gradient-brand text-primary-foreground">
                  <Icon className="h-4 w-4" />
                </span>
                <span className="text-sm font-semibold">
                  Cadastrar {LABELS[t].replace(/s$/, "").toLowerCase()}
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      <section>
        <h2 className="mb-3 font-display text-lg font-bold">Conteúdo por módulo</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {TABLES.map((t) => {
            const Icon = ICONS[t];
            const c = data?.byTable[t];
            return (
              <Link
                key={t}
                to={moduleRoute(t)}
                className="group rounded-2xl border border-border bg-card p-5 shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-elegant"
              >
                <div className="flex items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-secondary text-primary">
                    <Icon className="h-5 w-5" />
                  </span>
                  <h3 className="font-semibold">{LABELS[t]}</h3>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                  <Stat label="Total" value={c?.total ?? 0} />
                  <Stat label="Pendente" value={c?.pending ?? 0} tone="gold" />
                  <Stat label="Aprovado" value={c?.approved ?? 0} tone="primary" />
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function moduleRoute(t: (typeof TABLES)[number]) {
  return (
    {
      businesses: "/admin/empresas",
      jobs: "/admin/vagas",
      properties: "/admin/imoveis",
      news: "/admin/noticias",
      events: "/admin/eventos",
      curiosities: "/admin/curiosidades",
    } as const
  )[t];
}

function KpiCard({
  label,
  value,
  icon: Icon,
  accent,
  href,
}: {
  label: string;
  value: number | string;
  icon: any;
  accent?: "gold";
  href: string;
}) {
  return (
    <Link
      to={href}
      className="rounded-2xl border border-border bg-card p-5 shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-elegant"
    >
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        <span
          className={`grid h-9 w-9 place-items-center rounded-xl ${accent === "gold" ? "gradient-gold text-gold-foreground" : "gradient-brand text-primary-foreground"}`}
        >
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <p className="mt-3 font-display text-3xl font-bold">{value}</p>
    </Link>
  );
}

function PlanKpi({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "muted" | "primary" | "gold";
}) {
  const styles =
    tone === "gold"
      ? "gradient-brand text-primary-foreground border-transparent"
      : tone === "primary"
        ? "bg-primary/10 text-primary border-primary/30"
        : "bg-card text-muted-foreground border-border";
  return (
    <div
      className={`flex items-center justify-between rounded-2xl border p-5 shadow-card ${styles}`}
    >
      <div className="flex items-center gap-2">
        <Crown className="h-4 w-4" />
        <span className="text-sm font-bold uppercase tracking-wider">{label}</span>
      </div>
      <span className="font-display text-2xl font-bold">{value}</span>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone?: "gold" | "primary" }) {
  return (
    <div>
      <p
        className={`font-display text-xl font-bold ${tone === "gold" ? "text-gold-foreground" : tone === "primary" ? "text-primary" : ""}`}
      >
        {value}
      </p>
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
    </div>
  );
}
