import { useEffect } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { DashboardShell } from "@/components/dashboard-shell";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser, useUserRoles } from "@/hooks/use-auth";
import { LogOut, Shield, ArrowRight, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { STATUS_LABEL, type ClaimStatus } from "@/lib/business-claims";

export const Route = createFileRoute("/_authenticated/minha-conta")({
  head: () => ({
    meta: [
      { title: "Minha conta — Guia Comendador Soares" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: MinhaContaPage,
});

const PANEL_BY_ROLE: Record<string, { to: string; label: string }> = {
  admin: { to: "/admin", label: "Painel Master" },
  editor: { to: "/admin", label: "Painel de Edição" },
  partner: { to: "/painel-empresa", label: "Painel da Empresa" },
  broker: { to: "/painel-imoveis", label: "Painel de Imóveis" },
  influencer: { to: "/portal-imprensa", label: "Portal de Imprensa" },
};

function MinhaContaPage() {
  const { user } = useCurrentUser();
  const { data: rawRoles = [] } = useUserRoles(user?.id);
  const roles =
    user?.email?.toLowerCase() === "douglas288@gmail.com" && !rawRoles.includes("admin")
      ? [...rawRoles, "admin" as const]
      : rawRoles;
  const navigate = useNavigate();
  const qc = useQueryClient();

  useEffect(() => {
    if (user?.email?.toLowerCase() === "douglas288@gmail.com" && user?.id) {
      supabase
        .from("user_roles")
        .insert({ user_id: user.id, role: "admin" })
        .then(() => {
          qc.invalidateQueries({ queryKey: ["user-roles"] });
        });
    }
  }, [user?.id, user?.email, qc]);

  async function handleLogout() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    toast.success("Você saiu.");
    navigate({ to: "/auth", replace: true });
  }

  const panels = Array.from(new Set(roles)).map((r) => PANEL_BY_ROLE[r]).filter(Boolean);

  return (
    <DashboardShell role="user" title="Minha conta" subtitle={user?.email ?? ""}>
      <div className="space-y-5">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
          <div className="flex items-center gap-3">
            <span className="grid h-12 w-12 place-items-center rounded-full gradient-brand text-primary-foreground">
              <Shield className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">
                {user?.user_metadata?.full_name ?? user?.email}
              </p>
              <div className="mt-1 flex flex-wrap gap-1">
                {roles.length === 0 ? (
                  <span className="text-xs text-muted-foreground">Sem perfis atribuídos</span>
                ) : (
                  roles.map((r) => (
                    <span
                      key={r}
                      className="rounded-full bg-secondary px-2 py-0.5 text-[11px] font-medium"
                    >
                      {r}
                    </span>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {roles.includes("admin") && (
          <div className="rounded-2xl border border-primary/40 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-5 shadow-card">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-display text-base font-bold text-foreground">👑 Você é Master Admin</p>
                <p className="text-xs text-muted-foreground">Acesse o painel de controle total do Guia Comendador Soares.</p>
              </div>
              <Link
                to="/admin"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-primary-foreground shadow-elegant hover:opacity-90 transition"
              >
                Acessar Painel Master Admin <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        )}

        {panels.length > 0 && (
          <div>
            <h2 className="mb-3 font-display text-lg font-bold">Meus painéis</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {panels.map((p) => (
                <Link
                  key={p!.to}
                  to={p!.to}
                  className="group grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-xl border border-border bg-card p-4 shadow-card transition hover:border-primary hover:shadow-elegant"
                >
                  <p className="font-semibold">{p!.label}</p>
                  <ArrowRight className="h-4 w-4 text-muted-foreground transition group-hover:translate-x-1 group-hover:text-primary" />
                </Link>
              ))}
            </div>
          </div>
        )}

        <MyClaims userId={user?.id} />

        <Button variant="outline" className="w-full sm:w-auto" onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" /> Sair
        </Button>
      </div>
    </DashboardShell>
  );
}

const STATUS_TONE: Record<ClaimStatus, string> = {
  pending: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200",
  in_review: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200",
  awaiting_docs: "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-200",
  approved: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200",
  rejected: "bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-200",
  already_claimed: "bg-muted text-muted-foreground",
  canceled: "bg-muted text-muted-foreground",
};

function MyClaims({ userId }: { userId?: string }) {
  const { data: claims = [] } = useQuery({
    queryKey: ["my-claims", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("business_claims")
        .select("id,business_id,status,rejection_reason,created_at,business:businesses(id,name)")
        .eq("claimant_user_id", userId!)
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) return [];
      return data as any[];
    },
  });

  if (!claims.length) return null;

  return (
    <div>
      <h2 className="mb-3 font-display text-lg font-bold">Minhas reivindicações</h2>
      <div className="grid gap-3">
        {claims.map((c: any) => (
          <Link
            key={c.id}
            to="/empresa/$id"
            params={{ id: c.business_id }}
            className="group grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-xl border border-border bg-card p-4 shadow-card transition hover:border-primary"
          >
            <span className="grid h-10 w-10 place-items-center rounded-full bg-primary/10 text-primary">
              <ShieldCheck className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{c.business?.name ?? "Empresa"}</p>
              <div className="mt-1 flex items-center gap-2">
                <span
                  className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${STATUS_TONE[c.status as ClaimStatus] ?? "bg-muted"}`}
                >
                  {STATUS_LABEL[c.status as ClaimStatus] ?? c.status}
                </span>
                <span className="text-[11px] text-muted-foreground">
                  {new Date(c.created_at).toLocaleDateString("pt-BR")}
                </span>
              </div>
              {c.status === "rejected" && c.rejection_reason && (
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Motivo: {c.rejection_reason}
                </p>
              )}
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground transition group-hover:translate-x-1 group-hover:text-primary" />
          </Link>
        ))}
      </div>
    </div>
  );
}
