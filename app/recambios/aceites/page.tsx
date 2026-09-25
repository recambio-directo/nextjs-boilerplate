import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Aceites y Lubricantes — Marketplace B2B | Recambio Directo",
  description: "Aceites de motor, transmisión, dirección y líquidos. Marketplace B2B con precios de distribuidor para talleres.",
  alternates: { canonical: "https://www.recambio-directo.com/recambios/aceites" },
};

const jsonLd = "{\"@context\": \"https://schema.org\", \"@type\": \"CollectionPage\", \"name\": \"Aceites y Lubricantes\", \"description\": \"Aceites de motor, transmisi\u00f3n, direcci\u00f3n y l\u00edquidos. Marketplace B2B con precios de distribuidor para talleres.\", \"url\": \"https://www.recambio-directo.com/recambios/aceites\", \"isPartOf\": {\"@type\": \"WebSite\", \"name\": \"Recambio Directo\", \"url\": \"https://www.recambio-directo.com\"}, \"breadcrumb\": {\"@type\": \"BreadcrumbList\", \"itemListElement\": [{\"@type\": \"ListItem\", \"position\": 1, \"name\": \"Inicio\", \"item\": \"https://www.recambio-directo.com\"}, {\"@type\": \"ListItem\", \"position\": 2, \"name\": \"Aceites y Lubricantes\", \"item\": \"https://www.recambio-directo.com/recambios/aceites\"}]}}";

export default function Page() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
      <main style={{ minHeight: "100vh", background: "linear-gradient(135deg,#020617,#020b2d)", color: "white", padding: "60px 20px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>

          <nav style={{ marginBottom: 32, fontSize: 13, color: "#64748b" }}>
            <a href="/" style={{ color: "#60a5fa", textDecoration: "none" }}>Inicio</a>
            {" › "}
            <span style={{ color: "#94a3b8" }}>Aceites y Lubricantes</span>
          </nav>

          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <div style={{ display: "inline-block", background: "rgba(37,99,235,0.15)", color: "#60a5fa", padding: "8px 18px", borderRadius: 999, fontWeight: 700, marginBottom: 20, fontSize: 13, letterSpacing: "0.05em" }}>RECAMBIOS B2B</div>
            <h1 style={{ fontSize: "clamp(36px, 5vw, 56px)", fontWeight: 900, marginBottom: 16, lineHeight: 1.1 }}>
              Aceites y lubricantes para talleres
            </h1>
            <p style={{ color: "#94a3b8", fontSize: 18, maxWidth: 650, margin: "0 auto", lineHeight: 1.7 }}>
              Los aceites y lubricantes representan un consumo constante en el taller. Compara precios entre proveedores de aceites de motor, transmisión, dirección asistida y líquidos de frenos en nuestra plataforma B2B.
            </p>
          </div>

          <div style={{ background: "rgba(15,23,42,0.92)", borderRadius: 24, padding: 32, border: "1px solid rgba(255,255,255,0.06)", marginBottom: 24 }}>
            <h2 style={{ fontSize: 24, fontWeight: 900, marginBottom: 16 }}>Subcategorías</h2>
            <ul style={{ listStyle: "none", padding: 0, display: "flex", flexDirection: "column", gap: 10 }}>
              <li key={"Aceites de motor"} style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <span style={{ color: "#60a5fa", fontWeight: 900, fontSize: 18 }}>●</span>
                <span style={{ color: "#cbd5e1", fontSize: 15 }}>Aceites de motor</span>
              </li>
              <li key={"Aceites de transmisión"} style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <span style={{ color: "#60a5fa", fontWeight: 900, fontSize: 18 }}>●</span>
                <span style={{ color: "#cbd5e1", fontSize: 15 }}>Aceites de transmisión</span>
              </li>
              <li key={"Líquido de dirección"} style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <span style={{ color: "#60a5fa", fontWeight: 900, fontSize: 18 }}>●</span>
                <span style={{ color: "#cbd5e1", fontSize: 15 }}>Líquido de dirección</span>
              </li>
              <li key={"Líquido de frenos"} style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <span style={{ color: "#60a5fa", fontWeight: 900, fontSize: 18 }}>●</span>
                <span style={{ color: "#cbd5e1", fontSize: 15 }}>Líquido de frenos</span>
              </li>
              <li key={"Anticongelante"} style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <span style={{ color: "#60a5fa", fontWeight: 900, fontSize: 18 }}>●</span>
                <span style={{ color: "#cbd5e1", fontSize: 15 }}>Anticongelante</span>
              </li>
              <li key={"Aditivos"} style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <span style={{ color: "#60a5fa", fontWeight: 900, fontSize: 18 }}>●</span>
                <span style={{ color: "#cbd5e1", fontSize: 15 }}>Aditivos</span>
              </li>
            </ul>
          </div>

          <div style={{ background: "rgba(15,23,42,0.92)", borderRadius: 24, padding: 32, border: "1px solid rgba(255,255,255,0.06)", marginBottom: 24 }}>
            <h2 style={{ fontSize: 24, fontWeight: 900, marginBottom: 16 }}>Marcas disponibles</h2>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
              <a key={"Castrol"} href="/marcas/castrol" style={{ color: "#60a5fa", textDecoration: "none", fontSize: 14, padding: "6px 16px", border: "1px solid rgba(96,165,250,0.3)", borderRadius: 999 }}>Castrol</a>
              <a key={"Mobil"} href="/marcas/mobil" style={{ color: "#60a5fa", textDecoration: "none", fontSize: 14, padding: "6px 16px", border: "1px solid rgba(96,165,250,0.3)", borderRadius: 999 }}>Mobil</a>
              <a key={"Shell"} href="/marcas/shell" style={{ color: "#60a5fa", textDecoration: "none", fontSize: 14, padding: "6px 16px", border: "1px solid rgba(96,165,250,0.3)", borderRadius: 999 }}>Shell</a>
              <a key={"Total"} href="/marcas/total" style={{ color: "#60a5fa", textDecoration: "none", fontSize: 14, padding: "6px 16px", border: "1px solid rgba(96,165,250,0.3)", borderRadius: 999 }}>Total</a>
              <a key={"Repsol"} href="/marcas/repsol" style={{ color: "#60a5fa", textDecoration: "none", fontSize: 14, padding: "6px 16px", border: "1px solid rgba(96,165,250,0.3)", borderRadius: 999 }}>Repsol</a>
              <a key={"Motul"} href="/marcas/motul" style={{ color: "#60a5fa", textDecoration: "none", fontSize: 14, padding: "6px 16px", border: "1px solid rgba(96,165,250,0.3)", borderRadius: 999 }}>Motul</a>
            </div>
          </div>

          <div style={{ background: "rgba(15,23,42,0.92)", borderRadius: 24, padding: 32, border: "1px solid rgba(255,255,255,0.06)", marginBottom: 24 }}>
            <h2 style={{ fontSize: 24, fontWeight: 900, marginBottom: 16 }}>OEM vs IAM: ¿qué elegir?</h2>
            <p style={{ color: "#94a3b8", fontSize: 15, lineHeight: 1.8 }}>
              Cada fabricante homologa aceites con especificaciones concretas (VW 504/507, MB 229.5, BMW LL-04). En Recambio Directo puedes filtrar por especificación para asegurar el aceite correcto.
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
