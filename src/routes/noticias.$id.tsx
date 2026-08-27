import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Calendar, Loader2 } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { supabase } from "@/integrations/supabase/client";
import { getDisplayImageUrl } from "@/lib/storage";
import { formatNewsDate, getCategoryColor, NEWS_FILTERS, type NewsCategory } from "@/lib/news";
import fallback from "@/assets/news-1.jpg";

const LABELS = Object.fromEntries(NEWS_FILTERS.map((f) => [f.value, f.label])) as Record<
  string,
  string
>;

async function fetchNewsById(id: string) {
  const { data, error } = await supabase
    .from("news")
    .select("id,title,summary,content,cover_url,category,published_at")
    .eq("id", id)
    .eq("published", true)
    .eq("status", "approved")
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return {
    ...data,
    image: (await getDisplayImageUrl(data.cover_url)) || fallback,
  };
}

export const Route = createFileRoute("/noticias/$id")({
  loader: ({ params }) => fetchNewsById(params.id).then((news) => ({ news })),
  head: ({ params, loaderData }) => {
    const n = loaderData?.news ?? null;
    const rawTitle = n?.title ?? "Notícia";
    const title = `${rawTitle} — Guia Comendador Soares`.slice(0, 60);
    const desc = (n?.summary ?? "Notícia local do bairro Comendador Soares, em Nova Iguaçu.").slice(
      0,
      155,
    );
    const url = `https://comendadorsoares.com.br/noticias/${params.id}`;
    const image = n?.image;
    const meta: Array<any> = [
      { title },
      { name: "description", content: desc },
      { property: "og:title", content: rawTitle },
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
    if (n) {
      scripts.push({
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "NewsArticle",
          headline: n.title,
          description: n.summary || undefined,
          image: image || undefined,
          datePublished: n.published_at || undefined,
          articleSection: n.category || undefined,
          mainEntityOfPage: url,
        }),
      });
    }
    return { meta, links: [{ rel: "canonical", href: url }], scripts };
  },
  component: NoticiaDetalhe,
  errorComponent: ({ error }) => (
    <AppShell title="Notícia">
      <p className="text-sm text-destructive">{error.message}</p>
    </AppShell>
  ),
  notFoundComponent: () => (
    <AppShell title="Notícia">
      <p className="text-sm text-muted-foreground">Notícia não encontrada.</p>
    </AppShell>
  ),
});

function NoticiaDetalhe() {
  const { id } = Route.useParams();
  const router = useRouter();

  const { data, isLoading, error } = useQuery({
    queryKey: ["news", "detail", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("news")
        .select("id,title,summary,content,cover_url,category,published_at")
        .eq("id", id)
        .eq("published", true)
        .eq("status", "approved")
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      return {
        ...data,
        image: (await getDisplayImageUrl(data.cover_url)) || fallback,
      };
    },
  });

  return (
    <AppShell title="Notícia">
      <button
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
        <p className="text-sm text-destructive">Erro ao carregar notícia.</p>
      ) : !data ? (
        <p className="text-sm text-muted-foreground">
          Notícia não encontrada.{" "}
          <Link to="/noticias" className="text-primary underline">
            Voltar
          </Link>
        </p>
      ) : (
        <article className="mx-auto flex w-full max-w-3xl flex-col gap-4">
          <div className="relative w-full overflow-hidden rounded-2xl">
            <img src={data.image} alt={data.title} className="h-64 w-full object-cover" />
            <span
              className={`absolute left-3 top-3 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide shadow-lg ${getCategoryColor(data.category as NewsCategory)}`}
            >
              {LABELS[data.category] ?? data.category}
            </span>
          </div>
          <h1 className="font-display text-2xl font-bold leading-tight">{data.title}</h1>
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Calendar className="h-3.5 w-3.5 text-primary-vibrant" />
            {formatNewsDate(data.published_at)}
          </p>
          {data.summary && <p className="text-base text-muted-foreground">{data.summary}</p>}
          {data.content && (
            <div className="prose prose-sm max-w-none whitespace-pre-wrap text-foreground">
              {data.content}
            </div>
          )}
        </article>
      )}
    </AppShell>
  );
}
