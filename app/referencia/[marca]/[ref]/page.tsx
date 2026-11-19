// app/referencia/[marca]/[ref]/page.tsx
// Página pública (SEO) de una referencia con stock: marca, descripción, equivalencias OEM↔IAM
// y nº de proveedores. Sin precios ni proveedores (eso solo dentro de la plataforma).
import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

export const revalidate = 86400; // se regenera como mucho una vez al día
export const dynamicParams = true;
export async function generateStaticParams() {
  return []; // se generan bajo demanda (300.000 páginas no caben en un build)
}

const BASE = "https://www.recambio-directo.com";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

type Ref = {
  marca_slug: string;
  ref_norm: string;
  referencia: string;
  marca: string;
  descripcion: string | null;
  tipo: "OEM" | "IAM";
  num_proveedores: number;
};

type Equivalencia = {
  marca: string;
  referencia: string;
  ref_norm: string;
  marca_slug: string;
  tipo: "OEM" | "IAM";
  conStock: boolean;
};

const normRef = (r: string) => r.toUpperCase().replace(/[^A-Z0-9]/g, "");
const slugMarca = (m: string) => m.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
const capitalizar = (t: string) => (t ? t.charAt(0).toUpperCase() + t.slice(1).toLowerCase() : t);
const recortar = (t: string, n: number) => (t.length <= n ? t : t.slice(0, n - 1).trimEnd() + "…");

async function cargarRef(marca: string, ref: string): Promise<Ref | null> {
  const { data } = await supabase
    .from("refs_seo")
    .select("marca_slug, ref_norm, referencia, marca, descripcion, tipo, num_proveedores")
    .eq("marca_slug", marca)
    .eq("ref_norm", ref)
    .maybeSingle();
  return (data as Ref) || null;
}

async function cargarEquivalencias(r: Ref): Promise<Equivalencia[]> {
  const [{ data: comoOem }, { data: comoIam }] = await Promise.all([
    supabase
      .from("cruces_referencias")
      .select("marca_iam, referencia_iam")
      .eq("referencia_oem_norm", r.ref_norm)
      .limit(300),
    supabase
      .from("cruces_referencias")
      .select("marca_oem, referencia_oem")
      .eq("referencia_iam_norm", r.ref_norm)
      .limit(300),
  ]);

  const lista: Equivalencia[] = [];
  const vistos = new Set<string>([`${r.marca_slug}|${r.ref_norm}`]);
  const add = (marca: string, referencia: string, tipo: "OEM" | "IAM") => {
    if (!marca || !referencia) return;
    const e = { marca: marca.trim(), referencia: referencia.trim(), ref_norm: normRef(referencia), marca_slug: slugMarca(marca), tipo, conStock: false };
    const k = `${e.marca_slug}|${e.ref_norm}`;
    if (!e.ref_norm || vistos.has(k)) return;
    vistos.add(k);
    lista.push(e);
  };
  for (const d of comoOem || []) add(d.marca_iam, d.referencia_iam, "IAM");
  for (const d of comoIam || []) add(d.marca_oem, d.referencia_oem, "OEM");
  if (lista.length === 0) return lista;

  // ¿Cuáles tienen stock en la plataforma? (enlazamos solo a esas)
  const refs = Array.from(new Set(lista.map((e) => e.ref_norm)));
  const conStock = new Set<string>();
  for (let i = 0; i < refs.length; i += 150) {
    const { data } = await supabase
      .from("refs_seo")
      .select("marca_slug, ref_norm")
      .in("ref_norm", refs.slice(i, i + 150));
    for (const d of data || []) conStock.add(`${d.marca_slug}|${d.ref_norm}`);
  }
  for (const e of lista) e.conStock = conStock.has(`${e.marca_slug}|${e.ref_norm}`);

  return lista.sort((a, b) =>
    a.conStock !== b.conStock ? (a.conStock ? -1 : 1) : a.tipo !== b.tipo ? (a.tipo === "OEM" ? -1 : 1) : a.marca.localeCompare(b.marca)
  );
}

async function cargarRelacionadas(r: Ref) {
  const [{ data: siguientes }, { data: anteriores }] = await Promise.all([
    supabase
      .from("refs_seo")
      .select("marca_slug, ref_norm, referencia, marca, descripcion")
      .eq("marca_slug", r.marca_slug)
      .gt("ref_norm", r.ref_norm)
      .order("ref_norm", { ascending: true })
      .limit(8),
    supabase
      .from("refs_seo")
      .select("marca_slug, ref_norm, referencia, marca, descripcion")
      .eq("marca_slug", r.marca_slug)
      .lt("ref_norm", r.ref_norm)
      .order("ref_norm", { ascending: false })
      .limit(4),
  ]);
  return [...(anteriores || []).reverse(), ...(siguientes || [])];
}

type Props = { params: Promise<{ marca: string; ref: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { marca, ref } = await params;
  const r = await cargarRef(marca.toLowerCase(), normRef(decodeURIComponent(ref)));
  if (!r) return { title: "Referencia no encontrada", robots: { index: false, follow: true } };

  const desc = r.descripcion ? capitalizar(r.descripcion) : "Recambio";
  const url = `${BASE}/referencia/${r.marca_slug}/${r.ref_norm}`;
  return {
    title: recortar(`${r.referencia} ${r.marca} · ${desc}`, 55),
    description: recortar(
      `${desc} ${r.marca} ref. ${r.referencia}. ${r.num_proveedores} ${r.num_proveedores === 1 ? "proveedor" : "proveedores"} con stock en España, equivalencias OEM e IAM y envío en 24-48 h. Gratis para talleres.`,
      158
    ),
    alternates: { canonical: url },
    robots: r.descripcion ? { index: true, follow: true } : { index: false, follow: true },
    openGraph: { title: `${r.marca} ${r.referencia} — ${desc}`, url, type: "website", siteName: "Recambio Directo", locale: "es_ES" },
  };
}

const card: React.CSSProperties = { background: "rgba(15,23,42,0.92)", borderRadius: 24, padding: 28, border: "1px solid rgba(255,255,255,0.06)", marginTop: 24 };
const enlace: React.CSSProperties = { color: "#60a5fa", textDecoration: "none" };
const celda: React.CSSProperties = { padding: "10px 12px", borderBottom: "1px solid rgba(255,255,255,0.06)", fontSize: 14, textAlign: "left" };

export default async function ReferenciaPage({ params }: Props) {
  const { marca, ref } = await params;
  const marcaParam = marca.toLowerCase();
  const refParam = normRef(decodeURIComponent(ref));

  // URL canónica única: marca en minúsculas y referencia normalizada
  if (marca !== marcaParam || ref !== refParam) {
    if (!refParam) notFound();
    permanentRedirect(`/referencia/${marcaParam}/${refParam}`);
  }

  const r = await cargarRef(marcaParam, refParam);
  if (!r) notFound();

  const [equivalencias, relacionadas] = await Promise.all([cargarEquivalencias(r), cargarRelacionadas(r)]);
  const oem = equivalencias.filter((e) => e.tipo === "OEM");
  const iam = equivalencias.filter((e) => e.tipo === "IAM");
  const iamConStock = iam.filter((e) => e.conStock).length;
  const desc = r.descripcion ? capitalizar(r.descripcion) : "Recambio de automoción";
  const url = `${BASE}/referencia/${r.marca_slug}/${r.ref_norm}`;
  const mostrar = equivalencias.slice(0, 80);

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": url,
        url,
        name: `${r.marca} ${r.referencia} — ${desc}`,
        inLanguage: "es-ES",
        isPartOf: { "@id": `${BASE}/#website` },
        about: { "@type": "Thing", name: `${desc} ${r.marca} ${r.referencia}` },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Inicio", item: BASE },
          { "@type": "ListItem", position: 2, name: "Referencias", item: `${BASE}/referencia` },
          { "@type": "ListItem", position: 3, name: r.marca, item: `${BASE}/referencia/${r.marca_slug}` },
          { "@type": "ListItem", position: 4, name: r.referencia },
        ],
      },
    ],
  };

  return (
    <main style={{ minHeight: "100vh", background: "linear-gradient(135deg,#020617,#020b2d)", color: "white", padding: "48px 20px" }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div style={{ maxWidth: 960, margin: "0 auto" }}>
        <nav aria-label="Migas de pan" style={{ marginBottom: 28, fontSize: 13, color: "#64748b" }}>
          <a href="/" style={enlace}>Inicio</a>{" › "}
          <a href="/referencia" style={enlace}>Referencias</a>{" › "}
          <a href={`/referencia/${r.marca_slug}`} style={enlace}>{r.marca}</a>{" › "}
          <span style={{ color: "#94a3b8" }}>{r.referencia}</span>
        </nav>

        <div style={{ display: "inline-block", background: "rgba(37,99,235,0.15)", color: "#60a5fa", padding: "6px 14px", borderRadius: 999, fontWeight: 700, fontSize: 12, letterSpacing: "0.05em", marginBottom: 14 }}>
          REFERENCIA {r.tipo} · {r.marca.toUpperCase()}
        </div>
        <h1 style={{ fontSize: "clamp(30px, 4.5vw, 46px)", fontWeight: 900, lineHeight: 1.15, margin: "0 0 12px" }}>
          {r.marca} {r.referencia}{r.descripcion ? ` — ${desc}` : ""}
        </h1>
        <p style={{ color: "#94a3b8", fontSize: 17, lineHeight: 1.7, margin: 0 }}>
          {desc} de {r.marca} con referencia <strong style={{ color: "#e2e8f0" }}>{r.referencia}</strong>
          {r.tipo === "OEM" ? " (recambio original)" : " (recambio aftermarket)"}.{" "}
          {r.num_proveedores === 1 ? "1 proveedor la tiene" : `${r.num_proveedores} proveedores la tienen`} en stock en Recambio Directo
          {iamConStock > 0 ? `, y hay ${iamConStock} ${iamConStock === 1 ? "equivalencia" : "equivalencias"} de otras marcas disponibles` : ""}.
        </p>

        <div style={{ ...card, display: "flex", flexWrap: "wrap", gap: 24, alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 34, fontWeight: 900, color: "#22c55e" }}>{r.num_proveedores}</div>
            <div style={{ color: "#94a3b8", fontSize: 14 }}>{r.num_proveedores === 1 ? "proveedor con stock" : "proveedores con stock"}</div>
          </div>
          <div>
            <div style={{ fontSize: 34, fontWeight: 900, color: "#60a5fa" }}>{equivalencias.length}</div>
            <div style={{ color: "#94a3b8", fontSize: 14 }}>equivalencias OEM e IAM</div>
          </div>
          <a href="/registro" style={{ display: "inline-block", background: "linear-gradient(135deg,#2563eb,#1d4ed8)", color: "white", padding: "16px 30px", borderRadius: 14, fontWeight: 800, textDecoration: "none", fontSize: 16 }}>
            Ver precios y pedir →
          </a>
        </div>
        <p style={{ color: "#64748b", fontSize: 13, marginTop: 10 }}>
          Precios y disponibilidad visibles para talleres registrados. El registro es gratis para talleres.
        </p>

        {mostrar.length > 0 && (
          <section style={card}>
            <h2 style={{ fontSize: 24, fontWeight: 900, margin: "0 0 6px" }}>Equivalencias de {r.marca} {r.referencia}</h2>
            <p style={{ color: "#94a3b8", fontSize: 14, margin: "0 0 16px", lineHeight: 1.6 }}>
              {oem.length > 0 && `${oem.length} ${oem.length === 1 ? "referencia original (OEM)" : "referencias originales (OEM)"}`}
              {oem.length > 0 && iam.length > 0 && " y "}
              {iam.length > 0 && `${iam.length} ${iam.length === 1 ? "referencia aftermarket (IAM)" : "referencias aftermarket (IAM)"}`} intercambiables con esta pieza.
            </p>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ color: "#64748b" }}>
                    <th style={celda}>Marca</th>
                    <th style={celda}>Referencia</th>
                    <th style={celda}>Tipo</th>
                    <th style={celda}>En Recambio Directo</th>
                  </tr>
                </thead>
                <tbody>
                  {mostrar.map((e) => (
                    <tr key={`${e.marca_slug}-${e.ref_norm}`}>
                      <td style={{ ...celda, color: "#cbd5e1" }}>{e.marca}</td>
                      <td style={celda}>
                        {e.conStock ? (
                          <a href={`/referencia/${e.marca_slug}/${e.ref_norm}`} style={{ ...enlace, fontWeight: 700 }}>{e.referencia}</a>
                        ) : (
                          <span style={{ color: "#e2e8f0" }}>{e.referencia}</span>
                        )}
                      </td>
                      <td style={{ ...celda, color: e.tipo === "OEM" ? "#fbbf24" : "#94a3b8" }}>{e.tipo}</td>
                      <td style={{ ...celda, color: e.conStock ? "#22c55e" : "#64748b" }}>{e.conStock ? "Con stock" : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {equivalencias.length > mostrar.length && (
              <p style={{ color: "#64748b", fontSize: 13, marginTop: 12 }}>
                Y {equivalencias.length - mostrar.length} equivalencias más dentro de la plataforma.
              </p>
            )}
          </section>
        )}

        <section style={card}>
          <h2 style={{ fontSize: 22, fontWeight: 900, margin: "0 0 12px" }}>Cómo comprar {r.marca} {r.referencia} para tu taller</h2>
          <ol style={{ color: "#cbd5e1", fontSize: 15, lineHeight: 1.8, paddingLeft: 20, margin: 0 }}>
            <li>Regístrate gratis como taller (empresa o autónomo).</li>
            <li>Busca <strong>{r.referencia}</strong>, la matrícula o el bastidor: verás el precio de cada proveedor y sus equivalencias.</li>
            <li>Haz el pedido y recíbelo en 24-48 h en toda España peninsular, con albarán y factura en tu panel.</li>
          </ol>
        </section>

        {relacionadas.length > 0 && (
          <section style={card}>
            <h2 style={{ fontSize: 22, fontWeight: 900, margin: "0 0 12px" }}>Otras referencias {r.marca} con stock</h2>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 10 }}>
              {relacionadas.map((x) => (
                <li key={x.ref_norm}>
                  <a href={`/referencia/${x.marca_slug}/${x.ref_norm}`} style={enlace}>
                    {x.marca} {x.referencia}
                  </a>
                  {x.descripcion && <span style={{ color: "#64748b", fontSize: 13 }}> · {recortar(capitalizar(x.descripcion), 40)}</span>}
                </li>
              ))}
            </ul>
            <p style={{ marginTop: 16 }}>
              <a href={`/referencia/${r.marca_slug}`} style={{ ...enlace, fontWeight: 700 }}>Ver todas las referencias {r.marca} →</a>
            </p>
          </section>
        )}
      </div>
    </main>
  );
}
