import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Newspaper } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { EmptyState, ListSkeleton } from "@/components/ui-bits";
import { NewsCard } from "@/components/news-card";
import { NEWS_FILTERS, type NewsCategory } from "@/lib/news";
import { fetchNews } from "@/services/news.service";

export const Route = createFileRoute("/noticias/")({
  head: () => ({
    meta: [
      { title: "Notícias de Comendador Soares — Guia CS" },
      {
        name: "description",
        content:
          "Últimas notícias de Comendador Soares: bairro, segurança, trânsito, obras, saúde e educação em Nova Iguaçu.",
      },
      { property: "og:title", content: "Notícias de Comendador Soares — Guia CS" },
      {
        property: "og:description",
        content: "Últimas notícias do bairro Comendador Soares em Nova Iguaçu.",
      },
    ],
  }),
  component: NoticiasPage,
});

function NoticiasPage() {
  const [filter, setFilter] = useState<NewsCategory | "todos">("todos");

  const { data: allNews = [], isLoading } = useQuery({
    queryKey: ["news", "public"],
    queryFn: fetchNews,
  });

  const items = useMemo(
    () => (filter === "todos" ? allNews : allNews.filter((n) => n.category === filter)),
    [filter, allNews],
  );

  const [featured, ...rest] = items;

  return (
    <AppShell title="Notícias" subtitle="O que acontece no bairro">
      {/* Category filters */}
      <div className="mb-5 -mx-5 overflow-x-auto px-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="flex gap-2 pb-1">
          {NEWS_FILTERS.map((f) => {
            const active = filter === f.value;
            return (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                className={`shrink-0 rounded-full px-4 py-2 text-xs font-semibold transition-all active:scale-95 ${
                  active
                    ? "gradient-brand text-primary-foreground shadow-elegant"
                    : "border border-border bg-card text-muted-foreground hover:bg-muted"
                }`}
              >
                {f.label}
              </button>
            );
          })}
        </div>
      </div>

      {isLoading ? (
        <ListSkeleton count={4} height="h-28" />
      ) : items.length === 0 ? (
        <EmptyState
          icon={<Newspaper className="h-5 w-5" />}
          title={
            allNews.length === 0 ? "Nenhuma notícia disponível." : "Sem notícias nesta categoria"
          }
          description={
            allNews.length === 0
              ? "A redação está preparando os próximos conteúdos sobre o bairro."
              : "Volte em breve ou escolha outra editoria."
          }
        />
      ) : (
        <div className="flex flex-col gap-4">
          {featured && <NewsCard item={featured} featured />}
          {rest.length > 0 && (
            <>
              <h2 className="mt-2 font-display text-sm font-bold uppercase tracking-wider text-muted-foreground">
                Mais notícias
              </h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {rest.map((n) => (
                  <NewsCard key={n.id} item={n} />
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </AppShell>
  );
}
