import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Kits de Distribución — Marketplace B2B | Recambio Directo",
  description: "Kits de distribución, correas, tensores y bombas de agua. Precios B2B competitivos para talleres profesionales.",
  alternates: { canonical: "https://www.recambio-directo.com/recambios/distribucion" },
};

const jsonLd = "{\"@context\": \"https://schema.org\", \"@type\": \"CollectionPage\", \"name\": \"Kits de Distribuci\u00f3n\", \"description\": \"Kits de distribuci\u00f3n, correas, tensores y bombas de agua. Precios B2B competitivos para talleres profesionales.\", \"url\": \"https://www.recambio-directo.com/recambios/distribucion\", \"isPartOf\": {\"@type\": \"WebSite\", \"name\": \"Recambio Directo\", \"url\": \"https://www.recambio-directo.com\"}, \"breadcrumb\": {\"@type\": \"BreadcrumbList\", \"itemListElement\": [{\"@type\": \"ListItem\", \"position\": 1, \"name\": \"Inicio\", \"item\": \"https://www.recambio-directo.com\"}, {\"@type\": \"ListItem\", \"position\": 2, \"name\": \"Kits de Distribuci\u00f3n\", \"item\": \"https://www.recambio-directo.com/recambios/distribucion\"}]}}";

export default function Page() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
      <main style={{ minHeight: "100vh", background: "linear-gradient(135deg,#020617,#020b2d)", color: "white", padding: "60px 20px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>

          <nav style={{ marginBottom: 32, fontSize: 13, color: "#64748b" }}>
            <a href="/" style={{ color: "#60a5fa", textDecoration: "none" }}>Inicio</a>
            {" › "}
            <span style={{ color: "#94a3b8" }}>Kits de Distribución</span>
          </nav>

          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <div style={{ display: "inline-block", background: "rgba(37,99,235,0.15)", color: "#60a5fa", padding: "8px 18px", borderRadius: 999, fontWeight: 700, marginBottom: 20, fontSize: 13, letterSpacing: "0.05em" }}>RECAMBIOS B2B</div>
            <h1 style={{ fontSize: "clamp(36px, 5vw, 56px)", fontWeight: 900, marginBottom: 16, lineHeight: 1.1 }}>
              Kits de distribución para talleres
            </h1>
            <p style={{ color: "#94a3b8", fontSize: 18, maxWidth: 650, margin: "0 auto", lineHeight: 1.7 }}>
              La distribución es una de las operaciones más delicadas y rentables del taller. Encuentra kits completos con correa, tensores, rodillos y bomba de agua de marcas como Gates, Continental e INA en Recambio Directo.
            </p>
          </div>

          <div style={{ background: "rgba(15,23,42,0.92)", borderRadius: 24, padding: 32, border: "1px solid rgba(255,255,255,0.06)", marginBottom: 24 }}>
            <h2 style={{ fontSize: 24, fontWeight: 900, marginBottom: 16 }}>Subcategorías</h2>
            <ul style={{ listStyle: "none", padding: 0, display: "flex", flexDirection: "column", gap: 10 }}>
              <li key={"Kits de distribución completos"} style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <span style={{ color: "#60a5fa", fontWeight: 900, fontSize: 18 }}>●</span>
                <span style={{ color: "#cbd5e1", fontSize: 15 }}>Kits de distribución completos</span>
              </li>
              <li key={"Correas de distribución"} style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <span style={{ color: "#60a5fa", fontWeight: 900, fontSize: 18 }}>●</span>
                <span style={{ color: "#cbd5e1", fontSize: 15 }}>Correas de distribución</span>
              </li>
              <li key={"Tensores"} style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <span style={{ color: "#60a5fa", fontWeight: 900, fontSize: 18 }}>●</span>
                <span style={{ color: "#cbd5e1", fontSize: 15 }}>Tensores</span>
              </li>
              <li key={"Rodillos guía"} style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <span style={{ color: "#60a5fa", fontWeight: 900, fontSize: 18 }}>●</span>
                <span style={{ color: "#cbd5e1", fontSize: 15 }}>Rodillos guía</span>
              </li>
              <li key={"Bombas de agua"} style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <span style={{ color: "#60a5fa", fontWeight: 900, fontSize: 18 }}>●</span>
                <span style={{ color: "#cbd5e1", fontSize: 15 }}>Bombas de agua</span>
              </li>
              <li key={"Correas auxiliares"} style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <span style={{ color: "#60a5fa", fontWeight: 900, fontSize: 18 }}>●</span>
                <span style={{ color: "#cbd5e1", fontSize: 15 }}>Correas auxiliares</span>
              </li>
            </ul>
          </div>

          <div style={{ background: "rgba(15,23,42,0.92)", borderRadius: 24, padding: 32, border: "1px solid rgba(255,255,255,0.06)", marginBottom: 24 }}>
            <h2 style={{ fontSize: 24, fontWeight: 900, marginBottom: 16 }}>Marcas disponibles</h2>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
              <a key={"Gates"} href="/marcas/gates" style={{ color: "#60a5fa", textDecoration: "none", fontSize: 14, padding: "6px 16px", border: "1px solid rgba(96,165,250,0.3)", borderRadius: 999 }}>Gates</a>
              <a key={"Continental"} href="/marcas/continental" style={{ color: "#60a5fa", textDecoration: "none", fontSize: 14, padding: "6px 16px", border: "1px solid rgba(96,165,250,0.3)", borderRadius: 999 }}>Continental</a>
              <a key={"INA"} href="/marcas/ina" style={{ color: "#60a5fa", textDecoration: "none", fontSize: 14, padding: "6px 16px", border: "1px solid rgba(96,165,250,0.3)", borderRadius: 999 }}>INA</a>
              <a key={"SKF"} href="/marcas/skf" style={{ color: "#60a5fa", textDecoration: "none", fontSize: 14, padding: "6px 16px", border: "1px solid rgba(96,165,250,0.3)", borderRadius: 999 }}>SKF</a>
              <a key={"Dayco"} href="/marcas/dayco" style={{ color: "#60a5fa", textDecoration: "none", fontSize: 14, padding: "6px 16px", border: "1px solid rgba(96,165,250,0.3)", borderRadius: 999 }}>Dayco</a>
              <a key={"Optibelt"} href="/marcas/optibelt" style={{ color: "#60a5fa", textDecoration: "none", fontSize: 14, padding: "6px 16px", border: "1px solid rgba(96,165,250,0.3)", borderRadius: 999 }}>Optibelt</a>
            </div>
          </div>

          <div style={{ background: "rgba(15,23,42,0.92)", borderRadius: 24, padding: 32, border: "1px solid rgba(255,255,255,0.06)", marginBottom: 24 }}>
            <h2 style={{ fontSize: 24, fontWeight: 900, marginBottom: 16 }}>OEM vs IAM: ¿qué elegir?</h2>
            <p style={{ color: "#94a3b8", fontSize: 15, lineHeight: 1.8 }}>
              En distribución, usar componentes de calidad OEM o IAM premium es imprescindible: un fallo puede destruir el motor. Gates y Continental son fabricantes originales para la mayoría de constructores europeos.
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
