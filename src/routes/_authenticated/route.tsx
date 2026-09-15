import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { requestSelfRole } from "@/lib/admin.functions";

const SELF_ROLES = ["partner", "broker", "influencer"] as const;
type SelfRole = (typeof SELF_ROLES)[number];

function isSelfRole(value: string | null): value is SelfRole {
  return SELF_ROLES.some((role) => role === value);
}

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });

    const pendingProfile = sessionStorage.getItem("pending_profile");
    if (isSelfRole(pendingProfile)) {
      try {
        await requestSelfRole({ data: { role: pendingProfile } });
        sessionStorage.removeItem("pending_profile");
      } catch (roleError) {
        console.error("requestSelfRole failed", roleError);
        throw new Error("Não foi possível ativar o perfil selecionado. Tente entrar novamente.");
      }
    }

    return { user: data.user };
  },
  component: () => <Outlet />,
});
