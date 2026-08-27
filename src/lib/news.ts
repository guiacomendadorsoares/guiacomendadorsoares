// News types and sample data. Swap with Supabase later.
import news1 from "@/assets/news-1.jpg";
import news2 from "@/assets/news-2.jpg";
import news3 from "@/assets/news-3.jpg";
import news4 from "@/assets/news-4.jpg";
import news5 from "@/assets/news-5.jpg";

export type NewsCategory = "bairro" | "seguranca" | "transito" | "obras" | "saude" | "educacao";

export interface NewsItem {
  id: string;
  title: string;
  summary: string;
  image: string;
  category: NewsCategory;
  categoryLabel: string;
  publishedAt: string; // ISO
}

export const NEWS_FILTERS: { value: NewsCategory | "todos"; label: string }[] = [
  { value: "todos", label: "Todas" },
  { value: "bairro", label: "Bairro" },
  { value: "seguranca", label: "Segurança" },
  { value: "transito", label: "Trânsito" },
  { value: "obras", label: "Obras" },
  { value: "saude", label: "Saúde" },
  { value: "educacao", label: "Educação" },
];

export const sampleNews: NewsItem[] = [];

export function formatNewsDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
}

export function getCategoryColor(c: NewsCategory): string {
  switch (c) {
    case "bairro":
      return "bg-primary text-primary-foreground";
    case "seguranca":
      return "bg-destructive text-destructive-foreground";
    case "transito":
      return "bg-gold text-gold-foreground";
    case "obras":
      return "bg-primary-vibrant text-primary-foreground";
    case "saude":
      return "bg-emerald-600 text-white";
    case "educacao":
      return "bg-indigo-600 text-white";
  }
}
