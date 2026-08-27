import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  Banknote,
  Briefcase,
  Clock,
  Flame,
  Loader2,
  MapPin,
  MessageCircle,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { supabase } from "@/integrations/supabase/client";

async function fetchJobById(id: string) {
  const { data, error } = await supabase
    .from("jobs")
    .select(
      "id,title,company,type,salary,location,description,apply_url,whatsapp,urgent,posted_at,expires_at,active,status",
    )
    .eq("id", id)
    .eq("status", "approved")
    .eq("active", true)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export const Route = createFileRoute("/vagas/$id")({
  loader: ({ params }) => fetchJobById(params.id).then((job) => ({ job })),
  head: ({ params, loaderData }) => {
    const j: any = loaderData?.job ?? null;
    const jobTitle = j?.title ?? "Vaga de emprego";
    const company = j?.company ?? "";
    const title = (company ? `${jobTitle} — ${company}` : `${jobTitle} — Comendador Soares`).slice(
      0,
      60,
    );
    const desc = (
      j
        ? `${jobTitle}${company ? " na " + company : ""} em Comendador Soares, Nova Iguaçu.${j.salary ? " Salário: " + j.salary + "." : ""}`
        : "Confira detalhes desta vaga em Comendador Soares e candidate-se."
    ).slice(0, 155);
    const url = `https://comendadorsoares.com.br/vagas/${params.id}`;
    const meta: Array<any> = [
      { title },
      { name: "description", content: desc },
      { property: "og:title", content: title },
      { property: "og:description", content: desc },
      { property: "og:type", content: "article" },
      { property: "og:url", content: url },
      { name: "twitter:card", content: "summary" },
    ];
    const scripts: Array<any> = [];
    if (j) {
      scripts.push({
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "JobPosting",
          title: j.title,
          description: j.description || jobTitle,
          datePosted: j.posted_at || undefined,
          validThrough: j.expires_at || undefined,
          employmentType: j.type || undefined,
          hiringOrganization: j.company ? { "@type": "Organization", name: j.company } : undefined,
          jobLocation: {
            "@type": "Place",
            address: {
              "@type": "PostalAddress",
              streetAddress: j.location || "Comendador Soares",
              addressLocality: "Nova Iguaçu",
              addressRegion: "RJ",
              addressCountry: "BR",
            },
          },
          baseSalary: j.salary
            ? {
                "@type": "MonetaryAmount",
                currency: "BRL",
                value: { "@type": "QuantitativeValue", value: j.salary, unitText: "MONTH" },
              }
            : undefined,
        }),
      });
    }
    return { meta, links: [{ rel: "canonical", href: url }], scripts };
  },
  component: VagaDetalhe,
  errorComponent: ({ error }) => (
    <AppShell title="Vaga">
      <p className="text-sm text-destructive">{error.message}</p>
    </AppShell>
  ),
  notFoundComponent: () => (
    <AppShell title="Vaga">
      <p className="text-sm text-muted-foreground">Vaga não encontrada.</p>
    </AppShell>
  ),
});

const TYPE_LABELS: Record<string, string> = {
  emprego: "Emprego",
  estagio: "Estágio",
  "jovem-aprendiz": "Jovem Aprendiz",
  freelancer: "Freelancer",
};

function formatDate(iso?: string | null) {
  if (!iso) return "Publicado recentemente";
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function VagaDetalhe() {
  const { id } = Route.useParams();
  const router = useRouter();

  const { data, isLoading, error } = useQuery({
    queryKey: ["jobs", "detail", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("jobs")
        .select(
          "id,title,company,type,salary,location,description,apply_url,whatsapp,urgent,posted_at,expires_at,active,status",
        )
        .eq("id", id)
        .eq("status", "approved")
        .eq("active", true)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const whatsappUrl = data?.whatsapp ? `https://wa.me/${data.whatsapp.replace(/\D/g, "")}` : "";

  return (
    <AppShell title="Vaga">
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
        <p className="text-sm text-destructive">Erro ao carregar vaga.</p>
      ) : !data ? (
        <p className="text-sm text-muted-foreground">
          Vaga não encontrada.{" "}
          <Link to="/vagas" className="text-primary underline">
            Voltar
          </Link>
        </p>
      ) : (
        <article className="mx-auto flex w-full max-w-3xl flex-col gap-4">
          <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
            <div className="flex items-start gap-3">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                <Briefcase className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-primary px-2.5 py-1 text-[11px] font-bold uppercase text-primary-foreground">
                    {TYPE_LABELS[data.type as string] ?? data.type}
                  </span>
                  {data.urgent ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-destructive">
                      <Flame className="h-3.5 w-3.5" /> Urgente
                    </span>
                  ) : null}
                </div>
                <h1 className="mt-3 font-display text-2xl font-bold leading-tight">{data.title}</h1>
                <p className="mt-1 text-sm font-semibold text-muted-foreground">{data.company}</p>
              </div>
            </div>
          </div>

          <div className="grid gap-2 text-sm text-muted-foreground">
            {data.salary && <Info icon={<Banknote className="h-4 w-4" />} text={data.salary} />}
            {data.location && <Info icon={<MapPin className="h-4 w-4" />} text={data.location} />}
            <Info
              icon={<Clock className="h-4 w-4" />}
              text={`Publicado em ${formatDate(data.posted_at)}`}
            />
            {data.expires_at && (
              <Info
                icon={<Clock className="h-4 w-4" />}
                text={`Encerra em ${formatDate(data.expires_at)}`}
              />
            )}
          </div>

          {data.description && (
            <div className="whitespace-pre-wrap rounded-2xl border border-border bg-card p-4 text-sm leading-relaxed text-foreground shadow-card">
              {data.description}
            </div>
          )}

          <div className="flex flex-col gap-2 sm:flex-row">
            {data.apply_url && (
              <a
                href={data.apply_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-card"
              >
                Candidatar-se
              </a>
            )}
            {whatsappUrl && (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-border bg-card px-4 py-3 text-sm font-semibold text-foreground shadow-card"
              >
                <MessageCircle className="h-4 w-4" /> WhatsApp
              </a>
            )}
          </div>
        </article>
      )}
    </AppShell>
  );
}

function Info({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-2 rounded-2xl border border-border bg-card px-4 py-3 shadow-card">
      <span className="text-primary-vibrant">{icon}</span>
      <span>{text}</span>
    </div>
  );
}
