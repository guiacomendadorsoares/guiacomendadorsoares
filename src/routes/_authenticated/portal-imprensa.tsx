import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell, useRequireAnyRole } from "@/components/dashboard-shell";
import { ContentCrud } from "@/components/content-crud";
import { useCurrentUser, useHasRole } from "@/hooks/use-auth";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export const Route = createFileRoute("/_authenticated/portal-imprensa")({
  component: PortalImprensa,
});

function PortalImprensa() {
  const { ready } = useRequireAnyRole(["influencer", "editor", "admin"]);
  const { user } = useCurrentUser();
  const isEditorRole = useHasRole("editor");
  const isAdminRole = useHasRole("admin");
  const isEditor = isEditorRole || isAdminRole;
  if (!ready || !user) return null;
  return (
    <DashboardShell
      role="influencer"
      title="Portal de Imprensa"
      subtitle="Crie notícias, eventos e curiosidades"
    >
      <Tabs defaultValue="noticias">
        <TabsList>
          <TabsTrigger value="noticias">Notícias</TabsTrigger>
          <TabsTrigger value="eventos">Eventos</TabsTrigger>
          <TabsTrigger value="curiosidades">Curiosidades</TabsTrigger>
        </TabsList>
        <TabsContent value="noticias" className="mt-4">
          <ContentCrud table="news" ownerOnly={user.id} forcePending={!isEditor} />
        </TabsContent>
        <TabsContent value="eventos" className="mt-4">
          <ContentCrud table="events" ownerOnly={user.id} forcePending={!isEditor} />
        </TabsContent>
        <TabsContent value="curiosidades" className="mt-4">
          <ContentCrud table="curiosities" ownerOnly={user.id} forcePending={!isEditor} />
        </TabsContent>
      </Tabs>
    </DashboardShell>
  );
}
