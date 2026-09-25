import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Recambios de Suspensión — Marketplace B2B | Recambio Directo",
  description: "Amortiguadores, muelles, rótulas y silent blocks. Precios B2B para talleres con entrega rápida en toda España.",
  alternates: { canonical: "https://www.recambio-directo.com/recambios/suspension" },
};

const jsonLd = "{\"@context\": \"https://schema.org\", \"@type\": \"CollectionPage\", \"name\": \"Recambios de Suspensi\u00f3n\", \"description\": \"Amortiguadores, muelles, r\u00f3tulas y silent blocks. Precios B2B para talleres con entrega r\u00e1pida en toda Espa\u00f1a.\", \"url\": \"https://www.recambio-directo.com/recambios/suspension\", \"isPartOf\": {\"@type\": \"WebSite\", \"name\": \"Recambio Directo\", \"url\": \"https://www.recambio-directo.com\"}, \"breadcrumb\": {\"@type\": \"BreadcrumbList\", \"itemListElement\": [{\"@type\": \"ListItem\", \"position\": 1, \"name\": \"Inicio\", \"item\": \"https://www.recambio-directo.com\"}, {\"@type\": \"ListItem\", \"position\": 2, \"name\": \"Recambios de Suspensi\u00f3n\", \"item\": \"https://www.recambio-directo.com/recambios/suspension\"}]}}";

export default function Page() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
      <main style={{ minHeight: "100vh", background: "linear-gradient(135deg,#020617,#020b2d)", color: "white", padding: "60px 20px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>

          <nav style={{ marginBottom: 32, fontSize: 13, color: "#64748b" }}>
            <a href="/" style={{ color: "#60a5fa", textDecoration: "none" }}>Inicio</a>
            {" › "}
            <span style={{ color: "#94a3b8" }}>Recambios de Suspensión</span>
          </nav>

          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <div style={{ display: "inline-block", background: "rgba(37,99,235,0.15)", color: "#60a5fa", padding: "8px 18px", borderRadius: 999, fontWeight: 700, marginBottom: 20, fontSize: 13, letterSpacing: "0.05em" }}>RECAMBIOS B2B</div>
            <h1 style={{ fontSize: "clamp(36px, 5vw, 56px)", fontWeight: 900, marginBottom: 16, lineHeight: 1.1 }}>
              Recambios de suspensión para talleres
            </h1>
            <p style={{ color: "#94a3b8", fontSize: 18, maxWidth: 650, margin: "0 auto", lineHeight: 1.7 }}>
              La suspensión afecta directamente a la seguridad y el confort de conducción. Encuentra amortiguadores, muelles, rótulas, silent blocks y brazos de suspensión de marcas como Monroe, Sachs y Bilstein en nuestra plataforma B2B.
            </p>
          </div>

          <div style={{ background: "rgba(15,23,42,0.92)", borderRadius: 24, padding: 32, border: "1px solid rgba(255,255,255,0.06)", marginBottom: 24 }}>
            <h2 style={{ fontSize: 24, fontWeight: 900, marginBottom: 16 }}>Subcategorías</h2>
            <ul style={{ listStyle: "none", padding: 0, display: "flex", flexDirection: "column", gap: 10 }}>
              <li key={"Amortiguadores"} style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <span style={{ color: "#60a5fa", fontWeight: 900, fontSize: 18 }}>●</span>
                <span style={{ color: "#cbd5e1", fontSize: 15 }}>Amortiguadores</span>
              </li>
              <li key={"Muelles de suspensión"} style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <span style={{ color: "#60a5fa", fontWeight: 900, fontSize: 18 }}>●</span>
                <span style={{ color: "#cbd5e1", fontSize: 15 }}>Muelles de suspensión</span>
              </li>
              <li key={"Rótulas"} style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <span style={{ color: "#60a5fa", fontWeight: 900, fontSize: 18 }}>●</span>
                <span style={{ color: "#cbd5e1", fontSize: 15 }}>Rótulas</span>
              </li>
              <li key={"Silent blocks"} style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <span style={{ color: "#60a5fa", fontWeight: 900, fontSize: 18 }}>●</span>
                <span style={{ color: "#cbd5e1", fontSize: 15 }}>Silent blocks</span>
              </li>
              <li key={"Brazos de suspensión"} style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <span style={{ color: "#60a5fa", fontWeight: 900, fontSize: 18 }}>●</span>
                <span style={{ color: "#cbd5e1", fontSize: 15 }}>Brazos de suspensión</span>
              </li>
              <li key={"Copelas y topes"} style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <span style={{ color: "#60a5fa", fontWeight: 900, fontSize: 18 }}>●</span>
                <span style={{ color: "#cbd5e1", fontSize: 15 }}>Copelas y topes</span>
              </li>
            </ul>
          </div>

          <div style={{ background: "rgba(15,23,42,0.92)", borderRadius: 24, padding: 32, border: "1px solid rgba(255,255,255,0.06)", marginBottom: 24 }}>
            <h2 style={{ fontSize: 24, fontWeight: 900, marginBottom: 16 }}>Marcas disponibles</h2>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
              <a key={"Monroe"} href="/marcas/monroe" style={{ color: "#60a5fa", textDecoration: "none", fontSize: 14, padding: "6px 16px", border: "1px solid rgba(96,165,250,0.3)", borderRadius: 999 }}>Monroe</a>
              <a key={"Sachs"} href="/marcas/sachs" style={{ color: "#60a5fa", textDecoration: "none", fontSize: 14, padding: "6px 16px", border: "1px solid rgba(96,165,250,0.3)", borderRadius: 999 }}>Sachs</a>
              <a key={"Bilstein"} href="/marcas/bilstein" style={{ color: "#60a5fa", textDecoration: "none", fontSize: 14, padding: "6px 16px", border: "1px solid rgba(96,165,250,0.3)", borderRadius: 999 }}>Bilstein</a>
              <a key={"KYB"} href="/marcas/kyb" style={{ color: "#60a5fa", textDecoration: "none", fontSize: 14, padding: "6px 16px", border: "1px solid rgba(96,165,250,0.3)", borderRadius: 999 }}>KYB</a>
              <a key={"Lemförder"} href="/marcas/lemförder" style={{ color: "#60a5fa", textDecoration: "none", fontSize: 14, padding: "6px 16px", border: "1px solid rgba(96,165,250,0.3)", borderRadius: 999 }}>Lemförder</a>
              <a key={"Meyle"} href="/marcas/meyle" style={{ color: "#60a5fa", textDecoration: "none", fontSize: 14, padding: "6px 16px", border: "1px solid rgba(96,165,250,0.3)", borderRadius: 999 }}>Meyle</a>
            </div>
          </div>

          <div style={{ background: "rgba(15,23,42,0.92)", borderRadius: 24, padding: 32, border: "1px solid rgba(255,255,255,0.06)", marginBottom: 24 }}>
            <h2 style={{ fontSize: 24, fontWeight: 900, marginBottom: 16 }}>OEM vs IAM: ¿qué elegir?</h2>
            <p style={{ color: "#94a3b8", fontSize: 15, lineHeight: 1.8 }}>
              Los amortiguadores OEM garantizan el comportamiento dinámico diseñado por el fabricante. Las alternativas IAM de Monroe o KYB ofrecen rendimiento equivalente con certificación de homologación europea.
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
