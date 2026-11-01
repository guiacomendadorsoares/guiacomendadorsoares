import { createFileRoute } from "@tanstack/react-router";
import { ContentCrud } from "@/components/content-crud";
import { JobsDiscovery } from "@/components/jobs-discovery";
import { useHasRole } from "@/hooks/use-auth";
export const Route = createFileRoute("/_authenticated/admin/vagas")({
  head: () => ({ meta: [
    { title: "Gestão e busca de vagas | Guia Comendador Soares" },
    { name: "description", content: "Painel administrativo de empregos e estágios de Nova Iguaçu e seus bairros." },
    { property: "og:title", content: "Gestão de vagas | Guia Comendador Soares" },
    { property: "og:description", content: "Revisão e aprovação administrativa das vagas locais." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
    { name: "robots", content: "noindex,nofollow" },
  ] }),
  component: AdminJobs,
});

function AdminJobs() {
  const isAdmin = useHasRole("admin");
  return isAdmin ? <JobsDiscovery /> : <ContentCrud table="jobs" />;
}
