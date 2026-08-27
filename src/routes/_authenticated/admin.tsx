import { createFileRoute, Outlet } from "@tanstack/react-router";
import { DashboardShell, useRequireAnyRole } from "@/components/dashboard-shell";

export const Route = createFileRoute("/_authenticated/admin")({
  component: AdminLayout,
});

function AdminLayout() {
  const { ready } = useRequireAnyRole(["admin", "editor"]);
  if (!ready) return null;
  return (
    <DashboardShell
      role="admin"
      title="Painel Master"
      subtitle="Controle total do Guia Comendador Soares"
    >
      <Outlet />
    </DashboardShell>
  );
}
