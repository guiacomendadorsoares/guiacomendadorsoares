// Service layer for businesses. Reads exclusively from Supabase — no sample fallback.
import { supabase } from "@/integrations/supabase/client";
import type { Business } from "@/lib/businesses";
import { getDisplayImageUrl, getDisplayImageUrls } from "@/lib/storage";

const DEFAULT_PAGE_SIZE = 24;

function stripAccents(s: string): string {
  return s.normalize("NFD").replace(/\p{Diacritic}/gu, "");
}

async function hydrateBusinessImages(row: any): Promise<Business> {
  return {
    ...row,
    logo_url: await getDisplayImageUrl(row.logo_url),
    banner_url: await getDisplayImageUrl(row.banner_url),
    cover_url: await getDisplayImageUrl(row.cover_url ?? row.banner_url ?? row.logo_url),
    gallery_urls: await getDisplayImageUrls(row.gallery_urls),
  } as unknown as Business;
}

export async function fetchBusinesses(): Promise<Business[]> {
  const { data, error } = await supabase
    .from("businesses")
    .select("*")
    .eq("status", "approved")
    .order("featured", { ascending: false })
    .order("name", { ascending: true });

  if (error) {
    console.error("[businesses.service] fetch error:", error.message);
    return [];
  }
  return Promise.all((data ?? []).map(hydrateBusinessImages));
}

export async function fetchBusinessById(id: string): Promise<Business | null> {
  const { data, error } = await supabase.from("businesses").select("*").eq("id", id).maybeSingle();

  if (error) {
    console.error("[businesses.service] fetch by id error:", error.message);
    return null;
  }
  return data ? hydrateBusinessImages(data) : null;
}

export async function fetchBusinessesByCategory(mainCategory: string): Promise<Business[]> {
  const { data, error } = await supabase
    .from("businesses")
    .select("*")
    .eq("status", "approved")
    .eq("main_category", mainCategory)
    .order("featured", { ascending: false })
    .order("name", { ascending: true });
  if (error) {
    console.error("[businesses.service] by category error:", error.message);
    return [];
  }
  return Promise.all((data ?? []).map(hydrateBusinessImages));
}

export async function fetchBusinessesBySubcategory(
  mainCategory: string,
  subcategory: string,
): Promise<Business[]> {
  const { data, error } = await supabase
    .from("businesses")
    .select("*")
    .eq("status", "approved")
    .eq("main_category", mainCategory)
    .eq("subcategory", subcategory)
    .order("featured", { ascending: false })
    .order("name", { ascending: true });
  if (error) {
    console.error("[businesses.service] by subcategory error:", error.message);
    return [];
  }
  return Promise.all((data ?? []).map(hydrateBusinessImages));
}

export async function fetchCategoryCounts(): Promise<Record<string, number>> {
  const { data, error } = await supabase
    .from("businesses")
    .select("main_category")
    .eq("status", "approved");
  if (error || !data) return {};
  const counts: Record<string, number> = {};
  for (const row of data as any[]) {
    const k = row.main_category;
    if (!k) continue;
    counts[k] = (counts[k] ?? 0) + 1;
  }
  return counts;
}

// ---------------------------------------------------------------------------
// Paginated + full-text search (server-side)
// ---------------------------------------------------------------------------

export interface BusinessesPageArgs {
  mainCategory?: string;
  subcategory?: string;
  query?: string;
  page?: number;
  pageSize?: number;
}

export interface BusinessesPage {
  items: Business[];
  total: number;
  page: number;
  pageSize: number;
}

export async function fetchBusinessesPaged(args: BusinessesPageArgs): Promise<BusinessesPage> {
  const page = Math.max(1, args.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, args.pageSize ?? DEFAULT_PAGE_SIZE));
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let q = supabase.from("businesses").select("*", { count: "exact" }).eq("status", "approved");

  if (args.mainCategory) q = q.eq("main_category", args.mainCategory);
  if (args.subcategory) q = q.eq("subcategory", args.subcategory);

  const term = (args.query ?? "").trim();
  if (term.length >= 2) {
    q = q.textSearch("search_tsv", stripAccents(term), {
      type: "websearch",
      config: "simple",
    });
  }

  q = q.order("featured", { ascending: false }).order("name", { ascending: true }).range(from, to);

  const { data, error, count } = await q;
  if (error) {
    console.error("[businesses.service] paged error:", error.message);
    return { items: [], total: 0, page, pageSize };
  }
  const items = await Promise.all((data ?? []).map(hydrateBusinessImages));
  return { items, total: count ?? items.length, page, pageSize };
}

/**
 * Full-text search across approved businesses. Uses the generated `search_tsv`
 * column (Portuguese + unaccent) via a GIN index for O(log n) lookup.
 */
export async function searchBusinesses(query: string, limit = 30): Promise<Business[]> {
  const term = query.trim();
  if (term.length < 2) return [];
  const { data, error } = await supabase
    .from("businesses")
    .select("*")
    .eq("status", "approved")
    .textSearch("search_tsv", stripAccents(term), { type: "websearch", config: "simple" })
    .order("featured", { ascending: false })
    .order("name", { ascending: true })
    .limit(limit);
  if (error) {
    console.error("[businesses.service] search error:", error.message);
    return [];
  }
  return Promise.all((data ?? []).map(hydrateBusinessImages));
}
