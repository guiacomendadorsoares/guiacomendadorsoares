import { z } from "zod";

export const newsDraftSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().trim().min(1).max(200),
  summary: z.string().trim().max(500),
  content: z.string().trim().max(20000),
  category: z.enum(["bairro", "seguranca", "transito", "obras", "saude", "educacao"]),
  cover_url: z.string().max(2000).nullable(),
  source_url: z.string().url().refine((v) => v.startsWith("https://"), "Use uma fonte HTTPS").nullable(),
  source_name: z.string().trim().max(200).nullable(),
  source_date: z.string().max(100).nullable(),
});
export type EditorialDraft = z.infer<typeof newsDraftSchema>;
export type NewsCandidate = { title: string; url: string; snippet: string; date: string; source: string };
export function canPublishNews(roles: string[]) { return roles.includes("admin"); }
export function isPublicNews(row: { published: boolean; status: string }) {
  return row.published && row.status === "approved";
}
export function candidateToDraft(candidate: NewsCandidate): EditorialDraft {
  return { title: candidate.title.slice(0, 200), summary: candidate.snippet.slice(0, 500),
    content: "", category: "bairro", cover_url: null, source_url: candidate.url,
    source_name: candidate.source, source_date: candidate.date || null };
}