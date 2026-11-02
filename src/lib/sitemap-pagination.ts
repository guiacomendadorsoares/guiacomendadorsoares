export type SitemapRow = { id: string; updated_at: string | null };

export async function readAllSitemapRows(
  fetchPage: (from: number, to: number) => PromiseLike<{
    data: SitemapRow[] | null;
    error: { message: string } | null;
  }>,
): Promise<SitemapRow[]> {
  const pageSize = 500;
  const rows: SitemapRow[] = [];
  for (let from = 0; ; from += pageSize) {
    const result = await fetchPage(from, from + pageSize - 1);
    if (result.error) throw new Error(result.error.message);
    if (!result.data) throw new Error("Sitemap query returned no data");
    rows.push(...result.data);
    if (result.data.length < pageSize) return rows;
  }
}