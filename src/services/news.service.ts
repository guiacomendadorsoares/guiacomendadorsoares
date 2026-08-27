import { supabase } from "@/integrations/supabase/client";
import { NEWS_FILTERS, type NewsCategory, type NewsItem } from "@/lib/news";
import { getDisplayImageUrl } from "@/lib/storage";
import fallback from "@/assets/news-1.jpg";

const LABELS = Object.fromEntries(NEWS_FILTERS.map((f) => [f.value, f.label])) as Record<
  string,
  string
>;

export async function fetchNews(): Promise<NewsItem[]> {
  const { data, error } = await supabase
    .from("news")
    .select("id,title,summary,cover_url,category,published_at")
    .eq("published", true)
    .eq("status", "approved")
    .order("published_at", { ascending: false });

  if (error) {
    console.error("[news.service] fetch error:", error.message);
    return [];
  }
  return Promise.all(
    (data ?? []).map(async (r: any) => ({
      id: r.id,
      title: r.title,
      summary: r.summary ?? "",
      image: (await getDisplayImageUrl(r.cover_url)) || fallback,
      category: r.category as NewsCategory,
      categoryLabel: LABELS[r.category] ?? r.category,
      publishedAt: r.published_at,
    })),
  );
}
