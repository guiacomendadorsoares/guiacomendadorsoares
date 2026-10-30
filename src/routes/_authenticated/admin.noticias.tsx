import { createFileRoute } from "@tanstack/react-router";
import { NewsEditorial } from "@/components/news-editorial";
export const Route = createFileRoute("/_authenticated/admin/noticias")({
  head: () => ({ meta: [
    { title: "Redação de Notícias — Guia Comendador Soares" },
    { name: "description", content: "Painel administrativo de busca, revisão e publicação das notícias locais do Guia Comendador Soares." },
    { property: "og:title", content: "Redação de Notícias — Guia Comendador Soares" },
    { property: "og:description", content: "Busca e aprovação administrativa de notícias de Comendador Soares e Nova Iguaçu." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
    { name: "robots", content: "noindex,nofollow" },
  ] }),
  component: NewsEditorial,
});
