import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { categories as staticCategories, products as staticProducts } from "@/data/catalog";

const BASE_URL = "https://mazhalaihub.com";

interface SitemapEntry {
  path: string;
  lastmod?: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: string;
}

const staticEntries: SitemapEntry[] = [
  { path: "/", changefreq: "daily", priority: "1.0" },
  { path: "/shop", changefreq: "daily", priority: "0.9" },
  { path: "/offers", changefreq: "daily", priority: "0.8" },
  { path: "/about", changefreq: "monthly", priority: "0.6" },
  { path: "/contact", changefreq: "monthly", priority: "0.6" },
  { path: "/faq", changefreq: "monthly", priority: "0.6" },
  { path: "/blog", changefreq: "weekly", priority: "0.6" },
  { path: "/compare", changefreq: "weekly", priority: "0.4" },
  { path: "/support", changefreq: "monthly", priority: "0.4" },
  { path: "/ai-chat", changefreq: "monthly", priority: "0.4" },
  { path: "/order-tracking", changefreq: "monthly", priority: "0.4" },
  { path: "/privacy-policy", changefreq: "yearly", priority: "0.2" },
  { path: "/terms", changefreq: "yearly", priority: "0.2" },
  { path: "/shipping-policy", changefreq: "yearly", priority: "0.2" },
  { path: "/returns-refunds", changefreq: "yearly", priority: "0.2" },
];

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const entries: SitemapEntry[] = [...staticEntries];

        const categorySlugs = new Set(staticCategories.map((c) => c.slug));
        const productSlugs = new Set(staticProducts.map((p) => p.slug));

        const { createClient } = await import("@supabase/supabase-js");
        const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
        const supabase = createClient(process.env["SUPABASE_URL"]!, key, {
          auth: { persistSession: false, autoRefreshToken: false },
          global: {
            fetch: (input, init) => {
              const headers = new Headers(init?.headers);
              // Opaque sb_ keys are not JWTs; send apikey without the default bearer.
              if (key.startsWith("sb_") && headers.get("Authorization") === "Bearer " + key)
                headers.delete("Authorization");
              headers.set("apikey", key);
              return fetch(input, { ...init, headers });
            },
          },
        });

        const pageSize = 1000;
        for (let offset = 0; ; offset += pageSize) {
          const { data, error } = await supabase
            .from("products")
            .select("slug, updated_at")
            .eq("is_active", true)
            .eq("status", "active")
            .order("id")
            .range(offset, offset + pageSize - 1);
          if (error) throw error;
          for (const p of data ?? []) {
            if (productSlugs.has(p.slug)) continue;
            productSlugs.add(p.slug);
            entries.push({
              path: `/product/${encodeURIComponent(p.slug)}`,
              lastmod: p.updated_at ?? undefined,
              changefreq: "weekly",
              priority: "0.8",
            });
          }
          if (!data || data.length < pageSize) break;
        }
        // Static catalog products
        for (const p of staticProducts) {
          entries.push({ path: `/product/${p.slug}`, changefreq: "weekly", priority: "0.8" });
        }

        const { data: dbCategories } = await supabase.from("categories").select("slug");
        for (const c of dbCategories ?? []) {
          if (c.slug && !categorySlugs.has(c.slug)) categorySlugs.add(c.slug);
        }
        for (const slug of categorySlugs) {
          entries.push({ path: `/category/${encodeURIComponent(slug)}`, changefreq: "weekly", priority: "0.7" });
        }

        const urls = entries.map((e) =>
          [
            `  <url>`,
            `    <loc>${BASE_URL}${e.path}</loc>`,
            e.lastmod ? `    <lastmod>${e.lastmod}</lastmod>` : null,
            e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
            e.priority ? `    <priority>${e.priority}</priority>` : null,
            `  </url>`,
          ]
            .filter(Boolean)
            .join("\n"),
        );

        const xml = [
          `<?xml version="1.0" encoding="UTF-8"?>`,
          `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
          ...urls,
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
