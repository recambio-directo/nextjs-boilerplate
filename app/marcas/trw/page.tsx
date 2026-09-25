import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Recambios TRW — Marketplace B2B | Recambio Directo",
  description: "Recambios TRW: frenos, dirección y suspensión para talleres. Precios B2B en Recambio Directo.",
  alternates: { canonical: "https://www.recambio-directo.com/marcas/trw" },
};

const jsonLd = "{\"@context\": \"https://schema.org\", \"@type\": \"CollectionPage\", \"name\": \"Recambios TRW\", \"description\": \"Recambios TRW: frenos, direcci\u00f3n y suspensi\u00f3n para talleres. Precios B2B en Recambio Directo.\", \"url\": \"https://www.recambio-directo.com/marcas/trw\", \"isPartOf\": {\"@type\": \"WebSite\", \"name\": \"Recambio Directo\", \"url\": \"https://www.recambio-directo.com\"}, \"breadcrumb\": {\"@type\": \"BreadcrumbList\", \"itemListElement\": [{\"@type\": \"ListItem\", \"position\": 1, \"name\": \"Inicio\", \"item\": \"https://www.recambio-directo.com\"}, {\"@type\": \"ListItem\", \"position\": 2, \"name\": \"Recambios TRW\", \"item\": \"https://www.recambio-directo.com/marcas/trw\"}]}}";

export default function Page() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
      <main style={{ minHeight: "100vh", background: "linear-gradient(135deg,#020617,#020b2d)", color: "white", padding: "60px 20px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>

          <nav style={{ marginBottom: 32, fontSize: 13, color: "#64748b" }}>
            <a href="/" style={{ color: "#60a5fa", textDecoration: "none" }}>Inicio</a>
            {" › "}
            <span style={{ color: "#94a3b8" }}>Recambios TRW</span>
          </nav>

          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <div style={{ display: "inline-block", background: "rgba(37,99,235,0.15)", color: "#60a5fa", padding: "8px 18px", borderRadius: 999, fontWeight: 700, marginBottom: 20, fontSize: 13, letterSpacing: "0.05em" }}>MARCA VERIFICADA</div>
            <h1 style={{ fontSize: "clamp(36px, 5vw, 56px)", fontWeight: 900, marginBottom: 16, lineHeight: 1.1 }}>
              Recambios TRW
            </h1>
            <p style={{ color: "#94a3b8", fontSize: 18, maxWidth: 650, margin: "0 auto", lineHeight: 1.7 }}>
              TRW Automotive, ahora parte de ZF, es uno de los mayores fabricantes mundiales de sistemas de seguridad: frenos, dirección y suspensión. Proveedor OE de casi todos los constructores europeos, su catálogo IAM ofrece calidad original a precio competitivo.
            </p>
          </div>

          <div style={{ background: "rgba(15,23,42,0.92)", borderRadius: 24, padding: 32, border: "1px solid rgba(255,255,255,0.06)", marginBottom: 24 }}>
            <h2 style={{ fontSize: 24, fontWeight: 900, marginBottom: 16 }}>Productos TRW disponibles</h2>
            <ul style={{ listStyle: "none", padding: 0, display: "flex", flexDirection: "column", gap: 10 }}>
              <li key={"Pastillas de freno"} style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <span style={{ color: "#22c55e", fontWeight: 900, fontSize: 18 }}>✓</span>
                <span style={{ color: "#cbd5e1", fontSize: 15 }}>Pastillas de freno</span>
              </li>
              <li key={"Discos de freno"} style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <span style={{ color: "#22c55e", fontWeight: 900, fontSize: 18 }}>✓</span>
                <span style={{ color: "#cbd5e1", fontSize: 15 }}>Discos de freno</span>
              </li>
              <li key={"Rótulas"} style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <span style={{ color: "#22c55e", fontWeight: 900, fontSize: 18 }}>✓</span>
                <span style={{ color: "#cbd5e1", fontSize: 15 }}>Rótulas</span>
              </li>
              <li key={"Brazos de suspensión"} style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <span style={{ color: "#22c55e", fontWeight: 900, fontSize: 18 }}>✓</span>
                <span style={{ color: "#cbd5e1", fontSize: 15 }}>Brazos de suspensión</span>
              </li>
              <li key={"Cremalleras de dirección"} style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <span style={{ color: "#22c55e", fontWeight: 900, fontSize: 18 }}>✓</span>
                <span style={{ color: "#cbd5e1", fontSize: 15 }}>Cremalleras de dirección</span>
              </li>
            </ul>
          </div>

          <div style={{ background: "rgba(15,23,42,0.92)", borderRadius: 24, padding: 32, border: "1px solid rgba(255,255,255,0.06)", marginBottom: 24 }}>
            <h2 style={{ fontSize: 24, fontWeight: 900, marginBottom: 16 }}>Compatibilidad de vehículos</h2>
            <p style={{ color: "#94a3b8", fontSize: 15, lineHeight: 1.8 }}>
              Cobertura universal para turismos europeos, especialmente VW/Audi, BMW, Mercedes, Renault, PSA.
            </p>
          </div>

          <div style={{ background: "rgba(15,23,42,0.92)", borderRadius: 24, padding: 32, border: "1px solid rgba(255,255,255,0.06)", marginBottom: 24 }}>
            <h2 style={{ fontSize: 24, fontWeight: 900, marginBottom: 16 }}>¿Por qué elegir TRW?</h2>
            <p style={{ color: "#94a3b8", fontSize: 15, lineHeight: 1.8 }}>
              TRW fabrica las mismas piezas que van de serie en millones de coches europeos. Elegir TRW es elegir calidad OE con referencia IAM: el taller ahorra sin comprometer seguridad.
            </p>
          </div>

          <div style={{ textAlign: "center", marginTop: 48 }}>
            <h2 style={{ fontSize: 28, fontWeight: 900, marginBottom: 16 }}>Compara precios de TRW</h2>
            <p style={{ color: "#94a3b8", marginBottom: 24, fontSize: 16 }}>Accede a proveedores verificados con stock de TRW. Primer mes gratis.</p>
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
