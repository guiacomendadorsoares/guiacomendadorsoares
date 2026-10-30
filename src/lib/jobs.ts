export type JobType = "emprego" | "estagio" | "jovem-aprendiz" | "freelancer";

export interface Job {
  id: string;
  company: string;
  companyInitials: string;
  companyGradient: [string, string];
  title: string;
  type: JobType;
  typeLabel: string;
  salary: string;
  location: string;
  postedAt: string; // "Há 2 dias", etc.
  description?: string;
  urgent?: boolean;
}

export const JOB_FILTERS: { value: JobType | "todos"; label: string }[] = [
  { value: "todos", label: "Todos" },
  { value: "emprego", label: "Emprego" },
  { value: "estagio", label: "Estágio" },
  { value: "jovem-aprendiz", label: "Jovem Aprendiz" },
  { value: "freelancer", label: "Freelancer" },
];

export const JOB_TYPE_LABELS: Record<JobType, string> = {
  emprego: "Emprego",
  estagio: "Estágio",
  "jovem-aprendiz": "Jovem Aprendiz",
  freelancer: "Freelancer",
};

export const sampleJobs: Job[] = [];

export function getTypeBadgeColor(type: JobType): string {
  switch (type) {
    case "emprego":
      return "bg-primary/12 text-primary";
    case "estagio":
      return "bg-primary-vibrant/12 text-primary-vibrant";
    case "jovem-aprendiz":
      return "bg-gold/15 text-gold-foreground";
    case "freelancer":
      return "bg-accent text-accent-foreground";
    default:
      return "bg-muted text-muted-foreground";
  }
}

const COMPANY_GRADIENT: [string, string] = ["#1a4d3a", "#34c781"];

function companyInitials(company: string): string {
  const parts = company.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

function formatPostedAt(iso?: string | null): string {
  if (!iso) return "Publicado recentemente";
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "Publicado recentemente";
  const diffDays = Math.floor((Date.now() - then) / 86_400_000);
  if (diffDays <= 0) return "Publicado hoje";
  if (diffDays === 1) return "Há 1 dia";
  if (diffDays < 30) return `Há ${diffDays} dias`;
  const months = Math.floor(diffDays / 30);
  return months === 1 ? "Há 1 mês" : `Há ${months} meses`;
}

export interface JobRow {
  id: string;
  title: string;
  company: string;
  type: string;
  salary: string | null;
  location: string;
  description: string | null;
  urgent: boolean;
  posted_at: string;
}

export function jobRowToJob(row: JobRow): Job {
  const type = (row.type as JobType) || "emprego";
  return {
    id: row.id,
    company: row.company,
    companyInitials: companyInitials(row.company),
    companyGradient: COMPANY_GRADIENT,
    title: row.title,
    type,
    typeLabel: JOB_TYPE_LABELS[type] ?? row.type,
    salary: row.salary?.trim() || "A combinar",
    location: row.location?.trim() || "Comendador Soares",
    postedAt: formatPostedAt(row.posted_at),
    description: row.description ?? undefined,
    urgent: row.urgent ?? false,
  };
}
