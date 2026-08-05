import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { ACTIVE_CATEGORIES } from "@/lib/guia-taxonomy";

const BASE_URL = "https://comendadorsoares.com.br";

interface SitemapEntry {
  path: string;
  lastmod?: string;
  changefreq?: "daily" | "weekly" | "monthly" | "yearly";
  priority?: string;
}

function xmlEscape(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const staticEntries: SitemapEntry[] = [
          { path: "/", changefreq: "daily", priority: "1.0" },
          { path: "/guia", changefreq: "daily", priority: "0.9" },
          { path: "/buscar", changefreq: "weekly", priority: "0.7" },
          { path: "/farmacias", changefreq: "daily", priority: "0.9" },
          { path: "/imoveis", changefreq: "daily", priority: "0.9" },
          { path: "/vagas", changefreq: "daily", priority: "0.9" },
          { path: "/noticias", changefreq: "daily", priority: "0.8" },
          { path: "/onde-comer", changefreq: "weekly", priority: "0.7" },
          { path: "/utilidade-publica", changefreq: "monthly", priority: "0.7" },
          { path: "/planos", changefreq: "monthly", priority: "0.7" },
          { path: "/anuncie", changefreq: "monthly", priority: "0.8" },
        ];

        // Guia categories and subcategories from taxonomy (no DB call)
        const categoryEntries: SitemapEntry[] = [];
        for (const c of ACTIVE_CATEGORIES) {
          categoryEntries.push({
            path: `/guia/${c.slug}`,
            changefreq: "weekly",
            priority: "0.8",
          });
          for (const s of c.subcategories) {
            categoryEntries.push({
              path: `/guia/${c.slug}/${s.slug}`,
              changefreq: "weekly",
              priority: "0.6",
            });
          }
        }

        // Dynamic content from database (public, approved rows only)
        const dynamicEntries: SitemapEntry[] = [];
        try {
          const url = process.env.SUPABASE_URL;
          const key = process.env.SUPABASE_PUBLISHABLE_KEY;
          if (url && key) {
            const supabase = createClient<Database>(url, key, {
              auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
              global: {
                fetch: (input, init) => {
                  const h = new Headers(init?.headers);
                  if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) {
                    h.delete("Authorization");
                  }
                  h.set("apikey", key);
                  return fetch(input, { ...init, headers: h });
                },
              },
            });

            const [biz, props, jobs, evts, news, curi] = await Promise.all([
              supabase.from("businesses").select("id, updated_at").eq("status", "approved"),
              supabase.from("properties").select("id, updated_at").eq("status", "approved").eq("active", true),
              supabase.from("jobs").select("id, updated_at").eq("status", "approved").eq("active", true),
              supabase.from("events").select("id, updated_at").eq("status", "approved").eq("active", true),
              supabase.from("news").select("id, updated_at").eq("status", "approved").eq("published", true),
              supabase.from("curiosities").select("id, updated_at").eq("status", "approved"),
            ]);

            const push = (rows: { id: string; updated_at: string | null }[] | null, prefix: string, priority: string, freq: SitemapEntry["changefreq"]) => {
              for (const r of rows ?? []) {
                dynamicEntries.push({
                  path: `${prefix}/${r.id}`,
                  lastmod: r.updated_at ?? undefined,
                  changefreq: freq,
                  priority,
                });
              }
            };
            push(biz.data as any, "/empresa", "0.7", "weekly");
            push(props.data as any, "/imoveis", "0.6", "weekly");
            push(jobs.data as any, "/vagas", "0.7", "daily");
            push(evts.data as any, "/eventos", "0.7", "weekly");
            push(news.data as any, "/noticias", "0.7", "weekly");
            push(curi.data as any, "/curiosidades", "0.5", "monthly");
          }
        } catch (err) {
          // If the dynamic fetch fails, still return the static sitemap
          console.error("sitemap dynamic fetch failed", err);
        }

        const all = [...staticEntries, ...categoryEntries, ...dynamicEntries];

        const urls = all
          .map((e) =>
            [
              `  <url>`,
              `    <loc>${xmlEscape(BASE_URL + e.path)}</loc>`,
              e.lastmod ? `    <lastmod>${xmlEscape(e.lastmod)}</lastmod>` : null,
              e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
              e.priority ? `    <priority>${e.priority}</priority>` : null,
              `  </url>`,
            ]
              .filter(Boolean)
              .join("\n"),
          )
          .join("\n");

        const xml = [
          `<?xml version="1.0" encoding="UTF-8"?>`,
          `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
          urls,
          `</urlset>`,
        ].join("\n");

        return new Response(xml, {
          headers: {
            "Content-Type": "application/xml",
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});
