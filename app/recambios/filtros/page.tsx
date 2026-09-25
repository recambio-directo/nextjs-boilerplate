import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Filtros de Automoción — Marketplace B2B | Recambio Directo",
  description: "Filtros de aceite, aire, combustible y habitáculo. Marketplace B2B para talleres con precios competitivos y entrega en 24h.",
  alternates: { canonical: "https://www.recambio-directo.com/recambios/filtros" },
};

const jsonLd = "{\"@context\": \"https://schema.org\", \"@type\": \"CollectionPage\", \"name\": \"Filtros de Automoci\u00f3n\", \"description\": \"Filtros de aceite, aire, combustible y habit\u00e1culo. Marketplace B2B para talleres con precios competitivos y entrega en 24h.\", \"url\": \"https://www.recambio-directo.com/recambios/filtros\", \"isPartOf\": {\"@type\": \"WebSite\", \"name\": \"Recambio Directo\", \"url\": \"https://www.recambio-directo.com\"}, \"breadcrumb\": {\"@type\": \"BreadcrumbList\", \"itemListElement\": [{\"@type\": \"ListItem\", \"position\": 1, \"name\": \"Inicio\", \"item\": \"https://www.recambio-directo.com\"}, {\"@type\": \"ListItem\", \"position\": 2, \"name\": \"Filtros de Automoci\u00f3n\", \"item\": \"https://www.recambio-directo.com/recambios/filtros\"}]}}";

export default function Page() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
      <main style={{ minHeight: "100vh", background: "linear-gradient(135deg,#020617,#020b2d)", color: "white", padding: "60px 20px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>

          <nav style={{ marginBottom: 32, fontSize: 13, color: "#64748b" }}>
            <a href="/" style={{ color: "#60a5fa", textDecoration: "none" }}>Inicio</a>
            {" › "}
            <span style={{ color: "#94a3b8" }}>Filtros de Automoción</span>
          </nav>

          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <div style={{ display: "inline-block", background: "rgba(37,99,235,0.15)", color: "#60a5fa", padding: "8px 18px", borderRadius: 999, fontWeight: 700, marginBottom: 20, fontSize: 13, letterSpacing: "0.05em" }}>RECAMBIOS B2B</div>
            <h1 style={{ fontSize: "clamp(36px, 5vw, 56px)", fontWeight: 900, marginBottom: 16, lineHeight: 1.1 }}>
              Filtros de automoción para talleres
            </h1>
            <p style={{ color: "#94a3b8", fontSize: 18, maxWidth: 650, margin: "0 auto", lineHeight: 1.7 }}>
              Los filtros son componentes de mantenimiento esencial que se sustituyen en cada revisión. En Recambio Directo encuentras filtros de aceite, aire, combustible y habitáculo de marcas líderes como Mann-Filter, Bosch y Mahle.
            </p>
          </div>

          <div style={{ background: "rgba(15,23,42,0.92)", borderRadius: 24, padding: 32, border: "1px solid rgba(255,255,255,0.06)", marginBottom: 24 }}>
            <h2 style={{ fontSize: 24, fontWeight: 900, marginBottom: 16 }}>Subcategorías</h2>
            <ul style={{ listStyle: "none", padding: 0, display: "flex", flexDirection: "column", gap: 10 }}>
              <li key={"Filtros de aceite"} style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <span style={{ color: "#60a5fa", fontWeight: 900, fontSize: 18 }}>●</span>
                <span style={{ color: "#cbd5e1", fontSize: 15 }}>Filtros de aceite</span>
              </li>
              <li key={"Filtros de aire"} style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <span style={{ color: "#60a5fa", fontWeight: 900, fontSize: 18 }}>●</span>
                <span style={{ color: "#cbd5e1", fontSize: 15 }}>Filtros de aire</span>
              </li>
              <li key={"Filtros de combustible"} style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <span style={{ color: "#60a5fa", fontWeight: 900, fontSize: 18 }}>●</span>
                <span style={{ color: "#cbd5e1", fontSize: 15 }}>Filtros de combustible</span>
              </li>
              <li key={"Filtros de habitáculo"} style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <span style={{ color: "#60a5fa", fontWeight: 900, fontSize: 18 }}>●</span>
                <span style={{ color: "#cbd5e1", fontSize: 15 }}>Filtros de habitáculo</span>
              </li>
              <li key={"Filtros de partículas"} style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <span style={{ color: "#60a5fa", fontWeight: 900, fontSize: 18 }}>●</span>
                <span style={{ color: "#cbd5e1", fontSize: 15 }}>Filtros de partículas</span>
              </li>
              <li key={"Filtros de transmisión"} style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <span style={{ color: "#60a5fa", fontWeight: 900, fontSize: 18 }}>●</span>
                <span style={{ color: "#cbd5e1", fontSize: 15 }}>Filtros de transmisión</span>
              </li>
            </ul>
          </div>

          <div style={{ background: "rgba(15,23,42,0.92)", borderRadius: 24, padding: 32, border: "1px solid rgba(255,255,255,0.06)", marginBottom: 24 }}>
            <h2 style={{ fontSize: 24, fontWeight: 900, marginBottom: 16 }}>Marcas disponibles</h2>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
              <a key={"Mann-Filter"} href="/marcas/mann-filter" style={{ color: "#60a5fa", textDecoration: "none", fontSize: 14, padding: "6px 16px", border: "1px solid rgba(96,165,250,0.3)", borderRadius: 999 }}>Mann-Filter</a>
              <a key={"Bosch"} href="/marcas/bosch" style={{ color: "#60a5fa", textDecoration: "none", fontSize: 14, padding: "6px 16px", border: "1px solid rgba(96,165,250,0.3)", borderRadius: 999 }}>Bosch</a>
              <a key={"Mahle"} href="/marcas/mahle" style={{ color: "#60a5fa", textDecoration: "none", fontSize: 14, padding: "6px 16px", border: "1px solid rgba(96,165,250,0.3)", borderRadius: 999 }}>Mahle</a>
              <a key={"Hengst"} href="/marcas/hengst" style={{ color: "#60a5fa", textDecoration: "none", fontSize: 14, padding: "6px 16px", border: "1px solid rgba(96,165,250,0.3)", borderRadius: 999 }}>Hengst</a>
              <a key={"Purflux"} href="/marcas/purflux" style={{ color: "#60a5fa", textDecoration: "none", fontSize: 14, padding: "6px 16px", border: "1px solid rgba(96,165,250,0.3)", borderRadius: 999 }}>Purflux</a>
              <a key={"UFI"} href="/marcas/ufi" style={{ color: "#60a5fa", textDecoration: "none", fontSize: 14, padding: "6px 16px", border: "1px solid rgba(96,165,250,0.3)", borderRadius: 999 }}>UFI</a>
            </div>
          </div>

          <div style={{ background: "rgba(15,23,42,0.92)", borderRadius: 24, padding: 32, border: "1px solid rgba(255,255,255,0.06)", marginBottom: 24 }}>
            <h2 style={{ fontSize: 24, fontWeight: 900, marginBottom: 16 }}>OEM vs IAM: ¿qué elegir?</h2>
            <p style={{ color: "#94a3b8", fontSize: 15, lineHeight: 1.8 }}>
              Los filtros OEM aseguran la especificación exacta del fabricante. Las alternativas IAM de Mann-Filter o Mahle cumplen las mismas normas de filtración a precio más ajustado para el taller.
            </p>
          </div>

          <div style={{ textAlign: "center", marginTop: 48 }}>
            <h2 style={{ fontSize: 28, fontWeight: 900, marginBottom: 16 }}>Compara precios entre proveedores</h2>
            <p style={{ color: "#94a3b8", marginBottom: 24, fontSize: 16 }}>Primer mes gratis. Sin permanencia. Solo 25 €/mes después.</p>
            <a href="/registro" style={{ display: "inline-block", background: "linear-gradient(135deg,#2563eb,#1d4ed8)", color: "white", padding: "18px 48px", borderRadius: 14, fontWeight: 800, textDecoration: "none", fontSize: 17 }}>
              REGISTRARME GRATIS →
            </a>
          </div>

          <div style={{ textAlign: "center", marginTop: 32, fontSize: 13 }}>
            <a href="/" style={{ color: "#60a5fa", textDecoration: "none" }}>← Volver a Recambio Directo</a>
          </div>
        </div>
      </main>
    </>
  );
}
