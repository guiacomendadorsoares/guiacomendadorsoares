import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, MapPin, BedDouble, Bath, Maximize, Car } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { BottomNav } from "@/components/bottom-nav";
import { GlassCard } from "@/components/cards";

async function fetchPropertyById(id: string) {
  const { data, error } = await supabase.from("properties").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data;
}

export const Route = createFileRoute("/imoveis/$id")({
  loader: ({ params }) => fetchPropertyById(params.id).then((property) => ({ property })),
  head: ({ params, loaderData }) => {
    const p: any = loaderData?.property ?? null;
    const name = p?.title ?? "Imóvel";
    const title = `${name} — Comendador Soares, Nova Iguaçu`.slice(0, 60);
    const rawDesc = (p?.description ?? p?.address ?? "").trim();
    const desc = (rawDesc || `Detalhes de ${name} em Comendador Soares, Nova Iguaçu.`).slice(
      0,
      155,
    );
    const url = `https://comendadorsoares.com.br/imoveis/${params.id}`;
    const image =
      p?.cover_url || (Array.isArray(p?.gallery_urls) && p.gallery_urls[0]) || undefined;
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
    if (p) {
      scripts.push({
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Product",
          name: p.title,
          description: rawDesc || undefined,
          image: image || undefined,
          offers: p.price
            ? {
                "@type": "Offer",
                priceCurrency: "BRL",
                price: p.price,
                availability: "https://schema.org/InStock",
              }
            : undefined,
          url,
        }),
      });
    }
    return { meta, links: [{ rel: "canonical", href: url }], scripts };
  },
  component: ImovelPage,
});

function formatPrice(price: number | null | undefined, listing: string): string {
  if (price == null) return "Sob consulta";
  const formatted = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(price);
  return listing === "aluguel" ? `${formatted}/mês` : formatted;
}

function ImovelPage() {
  const { id } = Route.useParams();
  const { data: p, isLoading } = useQuery({
    queryKey: ["property", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("properties")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return (
      <div className="mx-auto flex min-h-dvh max-w-md items-center justify-center p-6 text-sm text-muted-foreground">
        Carregando…
      </div>
    );
  }

  if (!p) {
    return (
      <div className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-3 p-6 text-center">
        <p className="font-display text-lg font-bold text-foreground">Imóvel não encontrado</p>
        <Link to="/imoveis" className="text-sm font-semibold text-primary-vibrant">
          Voltar
        </Link>
      </div>
    );
  }

  const listing = (p.listing_type ?? "venda") as string;
  const listingLabel = listing === "aluguel" ? "Aluguel" : "Venda";
  const price = p.price_label ?? formatPrice(p.price as any, listing);
  const cover =
    p.cover_url || (Array.isArray(p.gallery_urls) && p.gallery_urls[0]) || "/placeholder.svg";
  const gallery: string[] = Array.isArray(p.gallery_urls) ? p.gallery_urls : [];

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col bg-background">
      <div className="relative h-64 w-full overflow-hidden">
        <img src={cover} alt={p.title} className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-background" />
        <Link
          to="/imoveis"
          aria-label="Voltar"
          className="absolute left-4 top-[max(env(safe-area-inset-top),1rem)] grid h-10 w-10 place-items-center rounded-full bg-background/80 text-foreground shadow-card backdrop-blur"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <span className="absolute left-4 top-[max(env(safe-area-inset-top),1rem)] ml-14 rounded-full bg-primary px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-primary-foreground shadow-lg">
          {listingLabel}
        </span>
      </div>

      <main className="-mt-14 flex-1 px-5 pb-24">
        <GlassCard className="p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {p.kind ?? "Imóvel"}
          </p>
          <h1 className="mt-1 font-display text-xl font-bold leading-tight text-foreground">
            {p.title}
          </h1>
          {p.address && (
            <p className="mt-2 flex items-start gap-1.5 text-sm text-muted-foreground">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary-vibrant" />
              <span>{p.address}</span>
            </p>
          )}
          <p className="mt-4 font-display text-2xl font-bold tracking-tight text-foreground">
            {price}
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
            {typeof p.bedrooms === "number" && (
              <span className="flex items-center gap-1">
                <BedDouble className="h-4 w-4" />
                {p.bedrooms} {p.bedrooms === 1 ? "quarto" : "quartos"}
              </span>
            )}
            {typeof p.bathrooms === "number" && (
              <span className="flex items-center gap-1">
                <Bath className="h-4 w-4" />
                {p.bathrooms} {p.bathrooms === 1 ? "banheiro" : "banheiros"}
              </span>
            )}
            {typeof p.parking === "number" && (
              <span className="flex items-center gap-1">
                <Car className="h-4 w-4" />
                {p.parking} {p.parking === 1 ? "vaga" : "vagas"}
              </span>
            )}
            {typeof p.area_m2 === "number" && (
              <span className="flex items-center gap-1">
                <Maximize className="h-4 w-4" />
                {p.area_m2} m²
              </span>
            )}
          </div>
        </GlassCard>

        {p.description && (
          <section className="mt-6">
            <h2 className="mb-3 font-display text-sm font-bold uppercase tracking-wider text-muted-foreground">
              Descrição
            </h2>
            <GlassCard className="p-4">
              <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                {p.description}
              </p>
            </GlassCard>
          </section>
        )}

        {gallery.length > 0 && (
          <section className="mt-6">
            <h2 className="mb-3 font-display text-sm font-bold uppercase tracking-wider text-muted-foreground">
              Galeria
            </h2>
            <div className="-mx-5 overflow-x-auto px-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <div className="flex gap-3 pb-1">
                {gallery.map((src, i) => (
                  <img
                    key={i}
                    src={src}
                    alt={`Foto ${i + 1}`}
                    loading="lazy"
                    className="h-40 w-40 shrink-0 rounded-2xl object-cover shadow-card"
                  />
                ))}
              </div>
            </div>
          </section>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
