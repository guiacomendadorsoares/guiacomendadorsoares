import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { newsDraftSchema, canPublishNews, type NewsCandidate } from "./news-editorial";

async function assertNewsAdmin(context: { supabase: any; userId: string }) {
  const { data, error } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
  if (error || !canPublishNews(data ? ["admin"] : [])) throw new Error("Somente administradores podem gerenciar notícias.");
}

export const searchLocalNews = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ location: z.enum(["Comendador Soares", "Nova Iguaçu"]), terms: z.string().trim().max(120), period: z.enum(["qdr:d", "qdr:w", "qdr:m", "all"]) }).parse(input))
  .handler(async ({ data, context }) => {
    await assertNewsAdmin(context);
    const key = process.env["FIRECRAWL_API_KEY"];
    const lovableKey = process.env["LOVABLE_API_KEY"];
    if (!key || !lovableKey) throw new Error("A conexão de busca não está disponível.");
    const response = await fetch("https://connector-gateway.lovable.dev/firecrawl/v2/search", {
      method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${lovableKey}`, "X-Connection-Api-Key": key },
      body: JSON.stringify({ query: `"${data.location}" ${data.terms} notícias`, limit: 10, sources: [{ type: "news" }], location: "Nova Iguaçu, Rio de Janeiro, Brazil", ...(data.period === "all" ? {} : { tbs: data.period }) }),
    });
    if (!response.ok) {
      const body = await response.text();
      console.error(`News search failed [${response.status}]: ${body}`);
      return { results: [] as NewsCandidate[], error: `Busca indisponível (${response.status}): ${body}`, creditsUsed: 0 };
    }
    const result = await response.json() as { success: boolean; error?: string; creditsUsed?: number; data?: { news?: Array<{ title?: string; url?: string; snippet?: string; date?: string }> } };
    if (!result.success) return { results: [] as NewsCandidate[], error: result.error || "Não foi possível buscar notícias.", creditsUsed: 0 };
    const seen = new Set<string>();
    const results: NewsCandidate[] = [];
    for (const row of result.data?.news ?? []) {
      if (!row.url?.startsWith("https://") || !row.title || seen.has(row.url)) continue;
      try {
        const source = new URL(row.url).hostname.replace(/^www\./, "");
        seen.add(row.url);
        results.push({ title: row.title, url: row.url, snippet: row.snippet ?? "", date: row.date ?? "", source });
      } catch { /* Ignore invalid provider URLs. */ }
    }
    return { results, error: null, creditsUsed: result.creditsUsed ?? 0 };
  });

export const listEditorialNews = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth]).handler(async ({ context }) => {
    await assertNewsAdmin(context);
    const { data, error } = await context.supabase.from("news").select("id,title,summary,content,category,cover_url,source_url,source_name,source_date,published,status,created_at").order("created_at", { ascending: false }).limit(200);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const saveEditorialDraft = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth]).inputValidator((input: unknown) => newsDraftSchema.parse(input))
  .handler(async ({ data, context }) => {
    await assertNewsAdmin(context);
    const { id, ...fields } = data;
    const payload = { ...fields, published: false, status: "draft" as const };
    if (!id && fields.source_url) {
      const { data: existing, error } = await context.supabase.from("news").select("id").eq("source_url", fields.source_url).limit(1);
      if (error) throw new Error(error.message);
      if (existing?.length) throw new Error("Esta fonte já foi preparada. Abra a notícia na lista abaixo.");
    }
    const query = id ? context.supabase.from("news").update(payload).eq("id", id) : context.supabase.from("news").insert({ ...payload, submitted_by: context.userId });
    const { data: saved, error } = await query.select("id").single();
    if (error) throw new Error(error.message);
    return { id: saved.id as string };
  });

export const deleteEditorialNews = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth]).inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertNewsAdmin(context);
    const { error } = await context.supabase.from("news").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const publishEditorialNews = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth]).inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertNewsAdmin(context);
    const { data: row, error: readError } = await context.supabase.from("news").select("title,content").eq("id", data.id).single();
    if (readError) throw new Error(readError.message);
    if (!row.title?.trim() || !row.content?.trim()) throw new Error("Revise o título e escreva o conteúdo antes de publicar.");
    const { error } = await context.supabase.from("news").update({ published: true, status: "approved", approved_by: context.userId, approved_at: new Date().toISOString(), rejection_reason: null }).eq("id", data.id).select("id").single();
    if (error) throw new Error(error.message);
    return { ok: true };
  });