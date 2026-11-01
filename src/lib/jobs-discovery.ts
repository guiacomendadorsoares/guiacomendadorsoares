import { z } from "zod";

const httpsUrl = z.string().url().refine(v => v.startsWith("https://"), "Use um endereço HTTPS");
export const jobDraftSchema = z.object({
  id: z.string().uuid().optional(), title: z.string().trim().min(1).max(200),
  company: z.string().trim().max(200), location: z.string().trim().max(300),
  type: z.enum(["emprego", "estagio", "jovem-aprendiz", "freelancer"]),
  description: z.string().trim().max(20000), salary: z.string().trim().max(200),
  apply_url: httpsUrl.nullable(), whatsapp: z.string().trim().max(30),
  source_url: httpsUrl.nullable(), source_name: z.string().trim().max(200).nullable(),
  expires_at: z.string().datetime().nullable(), urgent: z.boolean(), active: z.boolean(),
});
export type JobDraft = z.infer<typeof jobDraftSchema>;
export type JobCandidate = { title: string; url: string; snippet: string; source: string };
export function canManageJobDiscovery(roles: string[]) { return roles.includes("admin"); }
export function canPublishJob(draft: JobDraft, now = Date.now()) {
  return !!(draft.title.trim() && draft.company.trim() && draft.location.trim() && draft.description.trim() && (draft.apply_url || draft.whatsapp.trim()) && (!draft.expires_at || Date.parse(draft.expires_at) > now));
}
export function emptyJobDraft(): JobDraft {
  return { title: "", company: "", location: "Nova Iguaçu", type: "emprego", description: "", salary: "", apply_url: null, whatsapp: "", source_url: null, source_name: null, expires_at: null, urgent: false, active: true };
}
export function candidateToJobDraft(candidate: JobCandidate, type: JobDraft["type"], location: string): JobDraft {
  return { ...emptyJobDraft(), title: candidate.title.slice(0,200), description: candidate.snippet.slice(0,20000), type, location, source_url: candidate.url, source_name: candidate.source, apply_url: candidate.url };
}