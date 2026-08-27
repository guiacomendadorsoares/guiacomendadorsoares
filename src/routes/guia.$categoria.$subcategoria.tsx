import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/app-shell";
import { EmptyState } from "@/components/ui-bits";
import { GuiaBusinessCard } from "@/components/guia-business-card";
import { findCategory, findSubcategory } from "@/lib/guia-taxonomy";
import { fetchBusinessesBySubcategory } from "@/services/businesses.service";
import { ArrowLeft, Store } from "lucide-react";

export const Route = createFileRoute("/guia/$categoria/$subcategoria")({
  beforeLoad: ({ params }) => {
    if (!findSubcategory(params.categoria, params.subcategoria)) throw notFound();
  },
  head: ({ params }) => {
    const c = findCategory(params.categoria);
    const s = findSubcategory(params.categoria, params.subcategoria);
    const title = c && s ? `${s.label} em ${c.label} — Guia CS` : "Guia CS";
    const desc = c && s ? `${s.label} em Comendador Soares.` : "Guia comercial.";
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
      ],
    };
  },
  notFoundComponent: () => (
    <AppShell title="Subcategoria não encontrada">
      <EmptyState
        icon={<Store className="h-5 w-5" />}
        title="Subcategoria inválida"
        description="A subcategoria solicitada não existe."
      />
      <Link
        to="/guia"
        className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary-vibrant"
      >
        <ArrowLeft className="h-4 w-4" /> Voltar ao guia
      </Link>
    </AppShell>
  ),
  errorComponent: ({ error }) => (
    <AppShell title="Erro">
      <p className="text-sm text-destructive">{error.message}</p>
    </AppShell>
  ),
  component: SubPage,
});

function SubPage() {
  const { categoria, subcategoria } = Route.useParams();
  const cat = findCategory(categoria)!;
  const sub = findSubcategory(categoria, subcategoria)!;

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["guia", "sub", cat.slug, sub.slug],
    queryFn: () => fetchBusinessesBySubcategory(cat.slug, sub.slug),
  });

  return (
    <AppShell>
      <div
        className="relative mb-5 overflow-hidden rounded-3xl p-6 text-white shadow-elegant"
        style={{ background: `linear-gradient(135deg, ${cat.from} 0%, ${cat.to} 100%)` }}
      >
        <Link
          to="/guia/$categoria"
          params={{ categoria: cat.slug }}
          className="inline-flex items-center gap-1 text-xs font-semibold opacity-90 hover:opacity-100"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> {cat.label}
        </Link>
        <h1 className="mt-2 font-display text-2xl font-black leading-tight">
          {cat.emoji} {sub.label}
        </h1>
        <p className="mt-1 inline-flex items-center gap-1 rounded-full bg-white/15 px-3 py-1 text-[11px] font-bold backdrop-blur">
          {items.length} {items.length === 1 ? "empresa" : "empresas"}
        </p>
      </div>

      {isLoading ? (
        <p className="py-12 text-center text-sm text-muted-foreground">Carregando…</p>
      ) : items.length === 0 ? (
        <EmptyState
          icon={<Store className="h-5 w-5" />}
          title="Nenhuma empresa cadastrada"
          description="Em breve novas empresas serão adicionadas nesta subcategoria."
        />
      ) : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {items.map((b) => (
            <GuiaBusinessCard key={b.id} b={b} />
          ))}
        </div>
      )}
    </AppShell>
  );
}
