import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Recambios de Frenos — Marketplace B2B | Recambio Directo",
  description: "Pastillas, discos, pinzas y latiguillos de freno para talleres. Compara precios entre proveedores B2B verificados en Recambio Directo.",
  alternates: { canonical: "https://www.recambio-directo.com/recambios/frenos" },
};

const jsonLd = "{\"@context\": \"https://schema.org\", \"@type\": \"CollectionPage\", \"name\": \"Recambios de Frenos\", \"description\": \"Pastillas, discos, pinzas y latiguillos de freno para talleres. Compara precios entre proveedores B2B verificados en Recambio Directo.\", \"url\": \"https://www.recambio-directo.com/recambios/frenos\", \"isPartOf\": {\"@type\": \"WebSite\", \"name\": \"Recambio Directo\", \"url\": \"https://www.recambio-directo.com\"}, \"breadcrumb\": {\"@type\": \"BreadcrumbList\", \"itemListElement\": [{\"@type\": \"ListItem\", \"position\": 1, \"name\": \"Inicio\", \"item\": \"https://www.recambio-directo.com\"}, {\"@type\": \"ListItem\", \"position\": 2, \"name\": \"Recambios de Frenos\", \"item\": \"https://www.recambio-directo.com/recambios/frenos\"}]}}";

export default function Page() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
      <main style={{ minHeight: "100vh", background: "linear-gradient(135deg,#020617,#020b2d)", color: "white", padding: "60px 20px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>

          <nav style={{ marginBottom: 32, fontSize: 13, color: "#64748b" }}>
            <a href="/" style={{ color: "#60a5fa", textDecoration: "none" }}>Inicio</a>
            {" › "}
            <span style={{ color: "#94a3b8" }}>Recambios de Frenos</span>
          </nav>

          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <div style={{ display: "inline-block", background: "rgba(37,99,235,0.15)", color: "#60a5fa", padding: "8px 18px", borderRadius: 999, fontWeight: 700, marginBottom: 20, fontSize: 13, letterSpacing: "0.05em" }}>RECAMBIOS B2B</div>
            <h1 style={{ fontSize: "clamp(36px, 5vw, 56px)", fontWeight: 900, marginBottom: 16, lineHeight: 1.1 }}>
              Recambios de frenos para talleres
            </h1>
            <p style={{ color: "#94a3b8", fontSize: 18, maxWidth: 650, margin: "0 auto", lineHeight: 1.7 }}>
              Los frenos son el sistema de seguridad más crítico de cualquier vehículo. En Recambio Directo encuentras pastillas, discos, pinzas, latiguillos y kits completos de freno de las mejores marcas OEM e IAM, todo desde un único panel B2B.
            </p>
          </div>

          <div style={{ background: "rgba(15,23,42,0.92)", borderRadius: 24, padding: 32, border: "1px solid rgba(255,255,255,0.06)", marginBottom: 24 }}>
            <h2 style={{ fontSize: 24, fontWeight: 900, marginBottom: 16 }}>Subcategorías</h2>
            <ul style={{ listStyle: "none", padding: 0, display: "flex", flexDirection: "column", gap: 10 }}>
              <li key={"Pastillas de freno"} style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <span style={{ color: "#60a5fa", fontWeight: 900, fontSize: 18 }}>●</span>
                <span style={{ color: "#cbd5e1", fontSize: 15 }}>Pastillas de freno</span>
              </li>
              <li key={"Discos de freno"} style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <span style={{ color: "#60a5fa", fontWeight: 900, fontSize: 18 }}>●</span>
                <span style={{ color: "#cbd5e1", fontSize: 15 }}>Discos de freno</span>
              </li>
              <li key={"Pinzas de freno"} style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <span style={{ color: "#60a5fa", fontWeight: 900, fontSize: 18 }}>●</span>
                <span style={{ color: "#cbd5e1", fontSize: 15 }}>Pinzas de freno</span>
              </li>
              <li key={"Latiguillos de freno"} style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <span style={{ color: "#60a5fa", fontWeight: 900, fontSize: 18 }}>●</span>
                <span style={{ color: "#cbd5e1", fontSize: 15 }}>Latiguillos de freno</span>
              </li>
              <li key={"Líquido de frenos"} style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <span style={{ color: "#60a5fa", fontWeight: 900, fontSize: 18 }}>●</span>
                <span style={{ color: "#cbd5e1", fontSize: 15 }}>Líquido de frenos</span>
              </li>
              <li key={"Kits de freno completos"} style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <span style={{ color: "#60a5fa", fontWeight: 900, fontSize: 18 }}>●</span>
                <span style={{ color: "#cbd5e1", fontSize: 15 }}>Kits de freno completos</span>
              </li>
            </ul>
          </div>

          <div style={{ background: "rgba(15,23,42,0.92)", borderRadius: 24, padding: 32, border: "1px solid rgba(255,255,255,0.06)", marginBottom: 24 }}>
            <h2 style={{ fontSize: 24, fontWeight: 900, marginBottom: 16 }}>Marcas disponibles</h2>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
              <a key={"Brembo"} href="/marcas/brembo" style={{ color: "#60a5fa", textDecoration: "none", fontSize: 14, padding: "6px 16px", border: "1px solid rgba(96,165,250,0.3)", borderRadius: 999 }}>Brembo</a>
              <a key={"TRW"} href="/marcas/trw" style={{ color: "#60a5fa", textDecoration: "none", fontSize: 14, padding: "6px 16px", border: "1px solid rgba(96,165,250,0.3)", borderRadius: 999 }}>TRW</a>
              <a key={"Bosch"} href="/marcas/bosch" style={{ color: "#60a5fa", textDecoration: "none", fontSize: 14, padding: "6px 16px", border: "1px solid rgba(96,165,250,0.3)", borderRadius: 999 }}>Bosch</a>
              <a key={"Ferodo"} href="/marcas/ferodo" style={{ color: "#60a5fa", textDecoration: "none", fontSize: 14, padding: "6px 16px", border: "1px solid rgba(96,165,250,0.3)", borderRadius: 999 }}>Ferodo</a>
              <a key={"ATE"} href="/marcas/ate" style={{ color: "#60a5fa", textDecoration: "none", fontSize: 14, padding: "6px 16px", border: "1px solid rgba(96,165,250,0.3)", borderRadius: 999 }}>ATE</a>
              <a key={"Zimmermann"} href="/marcas/zimmermann" style={{ color: "#60a5fa", textDecoration: "none", fontSize: 14, padding: "6px 16px", border: "1px solid rgba(96,165,250,0.3)", borderRadius: 999 }}>Zimmermann</a>
            </div>
          </div>

          <div style={{ background: "rgba(15,23,42,0.92)", borderRadius: 24, padding: 32, border: "1px solid rgba(255,255,255,0.06)", marginBottom: 24 }}>
            <h2 style={{ fontSize: 24, fontWeight: 900, marginBottom: 16 }}>OEM vs IAM: ¿qué elegir?</h2>
            <p style={{ color: "#94a3b8", fontSize: 15, lineHeight: 1.8 }}>
              Las pastillas OEM garantizan la homologación original del fabricante. Las alternativas IAM de marcas como Brembo o TRW ofrecen calidad equivalente a precio competitivo, con certificación ECE R90.
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
