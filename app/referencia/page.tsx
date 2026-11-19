// app/referencia/page.tsx
// Índice público (SEO) de marcas con referencias en stock → /referencia/[marca] → /referencia/[marca]/[ref]
import type { Metadata } from "next";
import { createClient } from "@supabase/supabase-js";

export const revalidate = 86400;

const BASE = "https://www.recambio-directo.com";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const metadata: Metadata = {
  title: "Buscar recambios por referencia y marca",
  description:
    "Catálogo de referencias de recambios con stock en proveedores de toda España, por marca. Equivalencias OEM e IAM y compra B2B. Gratis para talleres.",
  alternates: { canonical: `${BASE}/referencia` },
};

const enlace: React.CSSProperties = { color: "#60a5fa", textDecoration: "none" };
const card: React.CSSProperties = { background: "rgba(15,23,42,0.92)", borderRadius: 24, padding: 28, border: "1px solid rgba(255,255,255,0.06)", marginTop: 24 };

export default async function ReferenciasIndexPage() {
  // PostgREST devuelve 1000 filas por llamada: se pide por bloques
  const marcas: { marca_slug: string; marca: string; num_refs: number }[] = [];
  for (let desde = 0; desde < 20000; desde += 1000) {
    const { data } = await supabase
      .from("refs_seo_marcas")
      .select("marca_slug, marca, num_refs")
      .order("num_refs", { ascending: false })
      .range(desde, desde + 999);
    if (!data || data.length === 0) break;
    marcas.push(...data);
    if (data.length < 1000) break;
  }
  const total = marcas.reduce((s, m) => s + m.num_refs, 0);
  const top = marcas.slice(0, 40);
  const resto = marcas.slice(40).sort((a, b) => a.marca.localeCompare(b.marca, "es"));

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Referencias de recambios por marca",
    url: `${BASE}/referencia`,
    isPartOf: { "@id": `${BASE}/#website` },
  };

  return (
    <main style={{ minHeight: "100vh", background: "linear-gradient(135deg,#020617,#020b2d)", color: "white", padding: "48px 20px" }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div style={{ maxWidth: 960, margin: "0 auto" }}>
        <nav aria-label="Migas de pan" style={{ marginBottom: 28, fontSize: 13, color: "#64748b" }}>
          <a href="/" style={enlace}>Inicio</a>{" › "}<span style={{ color: "#94a3b8" }}>Referencias</span>
        </nav>
        <h1 style={{ fontSize: "clamp(30px, 4.5vw, 46px)", fontWeight: 900, lineHeight: 1.15, margin: "0 0 12px" }}>
          Recambios por referencia y marca
        </h1>
        <p style={{ color: "#94a3b8", fontSize: 17, lineHeight: 1.7, margin: 0 }}>
          {total.toLocaleString("es-ES")} referencias de {marcas.length.toLocaleString("es-ES")} marcas con stock en proveedores de toda España.
          Elige la marca para ver sus referencias y las equivalencias OEM e IAM de cada pieza.
        </p>

        <section style={card}>
          <h2 style={{ fontSize: 22, fontWeight: 900, margin: "0 0 14px" }}>Marcas con más referencias</h2>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            {top.map((m) => (
              <a key={m.marca_slug} href={`/referencia/${m.marca_slug}`} style={{ ...enlace, fontSize: 14, padding: "6px 14px", border: "1px solid rgba(96,165,250,0.3)", borderRadius: 999 }}>
                {m.marca} <span style={{ color: "#64748b" }}>({m.num_refs.toLocaleString("es-ES")})</span>
              </a>
            ))}
          </div>
        </section>

        {resto.length > 0 && (
          <section style={card}>
            <h2 style={{ fontSize: 22, fontWeight: 900, margin: "0 0 14px" }}>Todas las marcas</h2>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 8 }}>
              {resto.map((m) => (
                <li key={m.marca_slug} style={{ fontSize: 14 }}>
                  <a href={`/referencia/${m.marca_slug}`} style={enlace}>{m.marca}</a>
                  <span style={{ color: "#64748b" }}> ({m.num_refs.toLocaleString("es-ES")})</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        <div style={{ ...card, textAlign: "center" }}>
          <h2 style={{ fontSize: 24, fontWeight: 900, margin: "0 0 10px" }}>¿Buscas una pieza concreta?</h2>
          <p style={{ color: "#94a3b8", margin: "0 0 20px" }}>Dentro de la plataforma buscas por referencia, matrícula o bastidor y comparas precios de todos los proveedores.</p>
          <a href="/registro" style={{ display: "inline-block", background: "linear-gradient(135deg,#2563eb,#1d4ed8)", color: "white", padding: "16px 36px", borderRadius: 14, fontWeight: 800, textDecoration: "none" }}>
            REGISTRARME GRATIS →
          </a>
        </div>
      </div>
    </main>
  );
}
