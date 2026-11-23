// app/sitemaps/referencias/sitemap.ts
// Sitemaps de las páginas de referencia, en lotes de 20.000 URLs:
//   /sitemaps/referencias/sitemap/0.xml, /1.xml, /2.xml…
// robots.ts los anuncia todos. Solo incluye referencias con descripción (las indexables).
import type { MetadataRoute } from "next";
import { createClient } from "@supabase/supabase-js";

export const revalidate = 86400;

const BASE = "https://www.recambio-directo.com";
const LOTE_SITEMAP = 20000;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function generateSitemaps() {
  const { count } = await supabase.from("refs_seo").select("rn", { count: "exact", head: true });
  const lotes = Math.max(1, Math.ceil((count ?? 0) / LOTE_SITEMAP));
  return Array.from({ length: lotes }, (_, id) => ({ id }));
}

export default async function sitemap(props: { id: Promise<string | number> | string | number }): Promise<MetadataRoute.Sitemap> {
  const id = Number(await props.id) || 0;
  const desde = id * LOTE_SITEMAP + 1;
  const hasta = (id + 1) * LOTE_SITEMAP;
  const hoy = new Date();
  const urls: MetadataRoute.Sitemap = [];

  // PostgREST devuelve máx. 1000 filas por llamada
  for (let a = desde; a <= hasta; a += 1000) {
    const b = Math.min(a + 999, hasta);
    const { data, error } = await supabase
      .from("refs_seo")
      .select("marca_slug, ref_norm")
      .gte("rn", a)
      .lte("rn", b)
      .not("descripcion", "is", null)
      .order("rn", { ascending: true });
    if (error || !data) break;
    for (const r of data) {
      // Sin lastModified: si se pone "hoy", Google cree que todas cambian a diario y las vuelve a rastrear
      urls.push({ url: `${BASE}/referencia/${r.marca_slug}/${r.ref_norm}`, changeFrequency: "monthly", priority: 0.5 });
    }
  }

  // El primer lote incluye también las páginas de marca
  if (id === 0) {
    urls.unshift({ url: `${BASE}/referencia`, lastModified: hoy, changeFrequency: "weekly", priority: 0.7 });
    for (let a = 0; a < 20000; a += 1000) {
      const { data } = await supabase
        .from("refs_seo_marcas")
        .select("marca_slug")
        .gt("num_refs_con_desc", 0)
        .order("marca_slug")
        .range(a, a + 999);
      if (!data || data.length === 0) break;
      for (const m of data) urls.splice(1, 0, { url: `${BASE}/referencia/${m.marca_slug}`, lastModified: hoy, changeFrequency: "weekly", priority: 0.6 });
      if (data.length < 1000) break;
    }
  }

  return urls;
}
