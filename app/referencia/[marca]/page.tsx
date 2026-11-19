// app/referencia/[marca]/page.tsx
// Listado público (SEO) de todas las referencias con stock de una marca, paginado (?p=2…).
import type { Metadata } from "next";
import { notFound, permanentRedirect, redirect } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

// Lee ?p= (paginación), así que se renderiza en cada visita (son 2 consultas rápidas)
export const dynamic = "force-dynamic";

const BASE = "https://www.recambio-directo.com";
const POR_PAGINA = 100;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

type Marca = { marca_slug: string; marca: string; num_refs: number; num_refs_con_desc: number };
type Props = { params: Promise<{ marca: string }>; searchParams: Promise<{ p?: string }> };

const capitalizar = (t: string) => (t ? t.charAt(0).toUpperCase() + t.slice(1).toLowerCase() : t);
const recortar = (t: string, n: number) => (t.length <= n ? t : t.slice(0, n - 1).trimEnd() + "…");

async function cargarMarca(slug: string): Promise<Marca | null> {
  const { data } = await supabase
    .from("refs_seo_marcas")
    .select("marca_slug, marca, num_refs, num_refs_con_desc")
    .eq("marca_slug", slug)
    .maybeSingle();
  return (data as Marca) || null;
}

function paginaDe(p?: string) {
  const n = parseInt(p || "1", 10);
  return Number.isFinite(n) && n > 0 ? n : 1;
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { marca } = await params;
  const pagina = paginaDe((await searchParams).p);
  const m = await cargarMarca(marca.toLowerCase());
  if (!m) return { title: "Marca no encontrada", robots: { index: false, follow: true } };
  const url = `${BASE}/referencia/${m.marca_slug}${pagina > 1 ? `?p=${pagina}` : ""}`;
  const n = m.num_refs.toLocaleString("es-ES");
  return {
    title: `Referencias ${m.marca} con stock${pagina > 1 ? ` (página ${pagina})` : ""}`,
    description: recortar(
      `${n} referencias ${m.marca} con stock en proveedores de toda España. Equivalencias OEM e IAM, compra B2B y envío en 24-48 h. Gratis para talleres.`,
      158
    ),
    alternates: { canonical: url },
    robots: m.num_refs_con_desc > 0 ? { index: true, follow: true } : { index: false, follow: true },
  };
}

const enlace: React.CSSProperties = { color: "#60a5fa", textDecoration: "none" };
const card: React.CSSProperties = { background: "rgba(15,23,42,0.92)", borderRadius: 24, padding: 28, border: "1px solid rgba(255,255,255,0.06)", marginTop: 24 };

export default async function MarcaReferenciasPage({ params, searchParams }: Props) {
  const { marca } = await params;
  const slug = marca.toLowerCase();
  if (marca !== slug) permanentRedirect(`/referencia/${slug}`);

  const m = await cargarMarca(slug);
  if (!m) {
    // Las marcas pueden venir escritas distinto en los catálogos (MANN / MANN-FILTER, FEBI / febi bilstein):
    // si no existe la exacta, se manda a la más parecida con más referencias.
    const raiz = slug.split("-")[0];
    if (raiz.length >= 2) {
      const { data: parecida } = await supabase
        .from("refs_seo_marcas")
        .select("marca_slug")
        .like("marca_slug", `${raiz}%`)
        .order("num_refs", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (parecida?.marca_slug && parecida.marca_slug !== slug) redirect(`/referencia/${parecida.marca_slug}`);
    }
    notFound();
  }

  const totalPaginas = Math.max(1, Math.ceil(m.num_refs / POR_PAGINA));
  const pagina = paginaDe((await searchParams).p);
  if (pagina > totalPaginas) notFound();

  const desde = (pagina - 1) * POR_PAGINA;
  const { data } = await supabase
    .from("refs_seo")
    .select("ref_norm, referencia, descripcion, tipo, num_proveedores")
    .eq("marca_slug", slug)
    .order("ref_norm", { ascending: true })
    .range(desde, desde + POR_PAGINA - 1);
  const refs = data || [];

  const paginas = Array.from(new Set([1, pagina - 2, pagina - 1, pagina, pagina + 1, pagina + 2, totalPaginas]))
    .filter((p) => p >= 1 && p <= totalPaginas)
    .sort((a, b) => a - b);
  const hrefPagina = (p: number) => (p === 1 ? `/referencia/${slug}` : `/referencia/${slug}?p=${p}`);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `Referencias ${m.marca} con stock`,
    url: `${BASE}${hrefPagina(pagina)}`,
    isPartOf: { "@id": `${BASE}/#website` },
    about: { "@type": "Brand", name: m.marca },
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Inicio", item: BASE },
        { "@type": "ListItem", position: 2, name: "Referencias", item: `${BASE}/referencia` },
        { "@type": "ListItem", position: 3, name: m.marca },
      ],
    },
  };

  return (
    <main style={{ minHeight: "100vh", background: "linear-gradient(135deg,#020617,#020b2d)", color: "white", padding: "48px 20px" }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div style={{ maxWidth: 960, margin: "0 auto" }}>
        <nav aria-label="Migas de pan" style={{ marginBottom: 28, fontSize: 13, color: "#64748b" }}>
          <a href="/" style={enlace}>Inicio</a>{" › "}
          <a href="/referencia" style={enlace}>Referencias</a>{" › "}
          <span style={{ color: "#94a3b8" }}>{m.marca}</span>
        </nav>

        <h1 style={{ fontSize: "clamp(30px, 4.5vw, 46px)", fontWeight: 900, lineHeight: 1.15, margin: "0 0 12px" }}>
          Referencias {m.marca} con stock
        </h1>
        <p style={{ color: "#94a3b8", fontSize: 17, lineHeight: 1.7, margin: 0 }}>
          {m.num_refs.toLocaleString("es-ES")} referencias de {m.marca} disponibles en proveedores de Recambio Directo. Entra en cada una para ver sus
          equivalencias OEM e IAM; los precios y el pedido están dentro de la plataforma, gratis para talleres.
        </p>

        <section style={card}>
          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 10 }}>
            {refs.map((x) => (
              <li key={x.ref_norm} style={{ fontSize: 14 }}>
                <a href={`/referencia/${slug}/${x.ref_norm}`} style={{ ...enlace, fontWeight: 700 }}>{m.marca} {x.referencia}</a>
                {x.descripcion && <span style={{ color: "#64748b" }}> · {recortar(capitalizar(x.descripcion), 38)}</span>}
              </li>
            ))}
          </ul>
        </section>

        {totalPaginas > 1 && (
          <nav aria-label="Paginación" style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 24, alignItems: "center" }}>
            {pagina > 1 && <a href={hrefPagina(pagina - 1)} rel="prev" style={{ ...enlace, padding: "8px 14px" }}>← Anterior</a>}
            {paginas.map((p, i) => (
              <span key={p} style={{ display: "contents" }}>
                {i > 0 && p - paginas[i - 1] > 1 && <span style={{ color: "#64748b" }}>…</span>}
                {p === pagina ? (
                  <span style={{ padding: "8px 14px", borderRadius: 10, background: "#2563eb", fontWeight: 800 }}>{p}</span>
                ) : (
                  <a href={hrefPagina(p)} style={{ ...enlace, padding: "8px 14px", border: "1px solid rgba(96,165,250,0.3)", borderRadius: 10 }}>{p}</a>
                )}
              </span>
            ))}
            {pagina < totalPaginas && <a href={hrefPagina(pagina + 1)} rel="next" style={{ ...enlace, padding: "8px 14px" }}>Siguiente →</a>}
          </nav>
        )}

        <div style={{ ...card, textAlign: "center" }}>
          <h2 style={{ fontSize: 24, fontWeight: 900, margin: "0 0 10px" }}>Compra recambios {m.marca} al mejor precio</h2>
          <p style={{ color: "#94a3b8", margin: "0 0 20px" }}>Compara el precio de varios proveedores a la vez y recibe en 24-48 h.</p>
          <a href="/registro" style={{ display: "inline-block", background: "linear-gradient(135deg,#2563eb,#1d4ed8)", color: "white", padding: "16px 36px", borderRadius: 14, fontWeight: 800, textDecoration: "none" }}>
            REGISTRARME GRATIS →
          </a>
        </div>
      </div>
    </main>
  );
}
