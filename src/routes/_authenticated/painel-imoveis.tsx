import { createFileRoute, Link } from "@tanstack/react-router";
import { DashboardShell, useRequireAnyRole } from "@/components/dashboard-shell";
import { ContentCrud } from "@/components/content-crud";
import { MyPlanCard } from "@/components/my-plan-card";
import { useCurrentUser } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLimits } from "@/lib/plan-limits";
import { Lock } from "lucide-react";

export const Route = createFileRoute("/_authenticated/painel-imoveis")({
  component: PainelImoveis,
});

function PainelImoveis() {
  const { ready } = useRequireAnyRole(["broker", "admin"]);
  const { user } = useCurrentUser();
  const limits = useLimits();
  const max: number = limits.properties.max_listings ?? 0;
  const { data: count = 0 } = useQuery({
    queryKey: ["my-properties-count", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { count } = await supabase
        .from("properties")
        .select("id", { count: "exact", head: true })
        .eq("submitted_by", user!.id);
      return count ?? 0;
    },
  });
  if (!ready || !user) return null;
  const full = max !== -1 && count >= max;
  return (
    <DashboardShell
      role="broker"
      title="Painel de Imóveis"
      subtitle="Cadastre e acompanhe seus imóveis"
    >
      <div className="space-y-6">
        <MyPlanCard kind="properties" usage={{ used: count }} />
        {full && (
          <div className="flex items-center justify-between gap-3 rounded-xl border border-destructive/40 bg-destructive/5 p-3 text-sm">
            <span className="flex items-center gap-2">
              <Lock className="h-4 w-4 text-destructive" /> Você atingiu o limite do seu plano (
              {max} imóveis).
            </span>
            <Link
              to="/planos"
              className="rounded-full bg-primary px-3 py-1 text-xs font-bold text-primary-foreground"
            >
              Fazer upgrade
            </Link>
          </div>
        )}
        <ContentCrud table="properties" ownerOnly={user.id} forcePending />
      </div>
    </DashboardShell>
  );
}
