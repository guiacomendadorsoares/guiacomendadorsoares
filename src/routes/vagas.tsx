import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { EmptyState } from "@/components/ui-bits";
import { JobCard } from "@/components/job-card";
import { JOB_FILTERS, sampleJobs, type JobType } from "@/lib/jobs";
import { Search, SlidersHorizontal, Briefcase } from "lucide-react";

export const Route = createFileRoute("/vagas")({
  head: () => ({
    meta: [
      { title: "Vagas de Emprego em Comendador Soares — Guia CS" },
      {
        name: "description",
        content:
          "Encontre vagas de emprego, estágios, jovem aprendiz e freelances no bairro Comendador Soares e região de Nova Iguaçu.",
      },
      { property: "og:title", content: "Vagas de Emprego em Comendador Soares — Guia CS" },
      {
        property: "og:description",
        content: "Empregos, estágios e oportunidades perto de casa no bairro Comendador Soares.",
      },
    ],
  }),
  component: VagasPage,
});

function VagasPage() {
  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<JobType | "todos">("todos");

  const filtered = useMemo(() => {
    return sampleJobs.filter((j) => {
      const matchesFilter = activeFilter === "todos" || j.type === activeFilter;
      const q = query.trim().toLowerCase();
      const matchesQuery =
        q === "" ||
        j.title.toLowerCase().includes(q) ||
        j.company.toLowerCase().includes(q) ||
        j.location.toLowerCase().includes(q);
      return matchesFilter && matchesQuery;
    });
  }, [activeFilter, query]);

  return (
    <AppShell title="Vagas" subtitle="Oportunidades no bairro">
      {/* Search */}
      <div className="mb-4">
        <div className="flex items-center gap-2.5 rounded-2xl border border-border bg-card px-4 py-3 shadow-card">
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar cargo, empresa ou local..."
            className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
          />
          <button
            type="button"
            className="flex h-8 items-center justify-center rounded-xl bg-muted px-2.5 transition-colors active:bg-secondary"
            aria-label="Filtros"
          >
            <SlidersHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Category pills */}
      <div className="-mx-5 mb-5 overflow-x-auto px-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="flex gap-2 pb-1">
          {JOB_FILTERS.map((f) => {
            const isActive = activeFilter === f.value;
            return (
              <button
                key={f.value}
                onClick={() => setActiveFilter(f.value)}
                className={`shrink-0 rounded-full px-4 py-2 text-xs font-bold transition-all ${
                  isActive
                    ? "gradient-brand text-primary-foreground shadow-elegant"
                    : "border border-border bg-card text-muted-foreground active:bg-secondary"
                }`}
              >
                {f.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Results count */}
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs font-semibold text-muted-foreground">
          {filtered.length} {filtered.length === 1 ? "vaga encontrada" : "vagas encontradas"}
        </span>
        <span className="text-[10px] font-bold uppercase tracking-wider text-primary-vibrant">
          Comendador Soares
        </span>
      </div>

      {/* Jobs list */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={<Briefcase className="h-5 w-5" />}
          title={sampleJobs.length === 0 ? "Nenhuma vaga publicada." : "Nenhuma vaga encontrada"}
          description={
            sampleJobs.length === 0
              ? "As empresas parceiras ainda não publicaram oportunidades. Volte em breve."
              : "Tente ajustar os filtros ou a busca para encontrar oportunidades."
          }
        />
      ) : (
        <div className="grid gap-3 pb-2 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>
      )}
    </AppShell>
  );
}
