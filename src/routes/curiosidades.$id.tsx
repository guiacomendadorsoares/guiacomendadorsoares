import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Loader2 } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { supabase } from "@/integrations/supabase/client";
import { getDisplayImageUrl } from "@/lib/storage";
import fallback from "@/assets/placeholders/curiosidade.jpg.asset.json";

async function fetchCuriosityById(id: string) {
  const { data, error } = await supabase
    .from("curiosities")
    .select("id,title,body,cover_url,status")
    .eq("id", id)
    .eq("status", "approved")
    .maybeSingle();
  if (error) throw error;
  return data;
}

export const Route = createFileRoute("/curiosidades/$id")({
  loader: ({ params }) => fetchCuriosityById(params.id).then((curiosity) => ({ curiosity })),
  head: ({ params, loaderData }) => {
    const c: any = loaderData?.curiosity ?? null;
    const name = c?.title ?? "Curiosidade";
    const title = `${name} — Comendador Soares`.slice(0, 60);
    const rawDesc = (c?.body ?? "").trim();
    const desc = (rawDesc || `Curiosidade sobre Comendador Soares, Nova Iguaçu.`).slice(0, 155);
    const url = `https://comendadorsoares.com.br/curiosidades/${params.id}`;
    const image = c?.cover_url || undefined;
    const meta: Array<any> = [
      { title },
      { name: "description", content: desc },
      { property: "og:title", content: title },
      { property: "og:description", content: desc },
      { property: "og:type", content: "article" },
      { property: "og:url", content: url },
      { name: "twitter:card", content: image ? "summary_large_image" : "summary" },
    ];
    if (image) {
      meta.push({ property: "og:image", content: image });
      meta.push({ name: "twitter:image", content: image });
    }
    const scripts: Array<any> = [];
    if (c) {
      scripts.push({
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Article",
          headline: c.title,
          description: rawDesc ? rawDesc.slice(0, 200) : undefined,
          image: image || undefined,
          url,
        }),
      });
    }
    return { meta, links: [{ rel: "canonical", href: url }], scripts };
  },
  component: CuriosidadeDetalhe,
  errorComponent: ({ error }) => (
    <AppShell title="Curiosidade">
      <p className="text-sm text-destructive">{error.message}</p>
    </AppShell>
  ),
  notFoundComponent: () => (
    <AppShell title="Curiosidade">
      <p className="text-sm text-muted-foreground">Curiosidade não encontrada.</p>
    </AppShell>
  ),
});

function CuriosidadeDetalhe() {
  const { id } = Route.useParams();
  const router = useRouter();

  const { data, isLoading, error } = useQuery({
    queryKey: ["curiosities", "detail", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("curiosities")
        .select("id,title,body,cover_url,status")
        .eq("id", id)
        .eq("status", "approved")
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      return {
        ...data,
        image: (await getDisplayImageUrl(data.cover_url)) || fallback.url,
      };
    },
  });

  return (
    <AppShell title="Curiosidade">
      <button
        type="button"
        onClick={() => router.history.back()}
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Voltar
      </button>

      {isLoading ? (
        <div className="grid place-items-center py-12">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : error ? (
        <p className="text-sm text-destructive">Erro ao carregar curiosidade.</p>
      ) : !data ? (
        <p className="text-sm text-muted-foreground">
          Curiosidade não encontrada.{" "}
          <Link to="/" className="text-primary underline">
            Voltar
          </Link>
        </p>
      ) : (
        <article className="mx-auto flex w-full max-w-3xl flex-col gap-4">
          <div className="relative w-full overflow-hidden rounded-2xl">
            <img src={data.image} alt={data.title} className="h-64 w-full object-cover" />
          </div>
          <h1 className="font-display text-2xl font-bold leading-tight">{data.title}</h1>
          <div className="prose prose-sm max-w-none whitespace-pre-wrap rounded-2xl border border-border bg-card p-4 text-foreground shadow-card">
            {data.body}
          </div>
        </article>
      )}
    </AppShell>
  );
}
