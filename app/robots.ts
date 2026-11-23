// app/robots.ts
import { MetadataRoute } from "next";
import { createClient } from "@supabase/supabase-js";

export const revalidate = 86400;

const BASE = "https://www.recambio-directo.com";
const LOTE_SITEMAP = 20000; // igual que en app/sitemaps/referencias/sitemap.ts

async function sitemapsReferencias(): Promise<string[]> {
  try {
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
    const { count } = await supabase.from("refs_seo").select("rn", { count: "exact", head: true });
    const lotes = Math.max(1, Math.ceil((count ?? 0) / LOTE_SITEMAP));
    return Array.from({ length: lotes }, (_, i) => `${BASE}/sitemaps/referencias/sitemap/${i}.xml`);
  } catch {
    return [`${BASE}/sitemaps/referencias/sitemap/0.xml`];
  }
}

export default async function robots(): Promise<MetadataRoute.Robots> {
  return {
    rules: [
      // Robots de herramientas SEO, scrapers y bots de IA: no traen clientes y consumen mucho
      // (ISR Writes, CPU y transferencia en Vercel) recorriendo las páginas de referencias.
      {
        userAgent: [
          "AhrefsBot", "SemrushBot", "MJ12bot", "DotBot", "BLEXBot", "PetalBot",
          "DataForSeoBot", "serpstatbot", "Barkrowler", "SeekportBot",
          "GPTBot", "ClaudeBot", "CCBot", "Bytespider", "Amazonbot", "meta-externalagent",
          "Applebot-Extended", "Google-Extended", "anthropic-ai", "cohere-ai",
        ],
        disallow: "/",
      },
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/login",
          "/dashboard/",
          "/admin/",
          "/checkout/",
          "/perfil/",
          "/chat/",
          "/api/",
        ],
      },
    ],
    sitemap: [`${BASE}/sitemap.xml`, ...(await sitemapsReferencias())],
    host: BASE,
  };
}
