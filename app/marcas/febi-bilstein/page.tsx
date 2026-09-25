import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Recambios Febi Bilstein — Marketplace B2B | Recambio Directo",
  description: "Recambios Febi Bilstein para talleres: suspensión, dirección, motor y carrocería. Precios B2B.",
  alternates: { canonical: "https://www.recambio-directo.com/marcas/febi-bilstein" },
};

const jsonLd = "{\"@context\": \"https://schema.org\", \"@type\": \"CollectionPage\", \"name\": \"Recambios Febi Bilstein\", \"description\": \"Recambios Febi Bilstein para talleres: suspensi\u00f3n, direcci\u00f3n, motor y carrocer\u00eda. Precios B2B.\", \"url\": \"https://www.recambio-directo.com/marcas/febi-bilstein\", \"isPartOf\": {\"@type\": \"WebSite\", \"name\": \"Recambio Directo\", \"url\": \"https://www.recambio-directo.com\"}, \"breadcrumb\": {\"@type\": \"BreadcrumbList\", \"itemListElement\": [{\"@type\": \"ListItem\", \"position\": 1, \"name\": \"Inicio\", \"item\": \"https://www.recambio-directo.com\"}, {\"@type\": \"ListItem\", \"position\": 2, \"name\": \"Recambios Febi Bilstein\", \"item\": \"https://www.recambio-directo.com/marcas/febi-bilstein\"}]}}";

export default function Page() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
      <main style={{ minHeight: "100vh", background: "linear-gradient(135deg,#020617,#020b2d)", color: "white", padding: "60px 20px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>

          <nav style={{ marginBottom: 32, fontSize: 13, color: "#64748b" }}>
            <a href="/" style={{ color: "#60a5fa", textDecoration: "none" }}>Inicio</a>
            {" › "}
            <span style={{ color: "#94a3b8" }}>Recambios Febi Bilstein</span>
          </nav>

          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <div style={{ display: "inline-block", background: "rgba(37,99,235,0.15)", color: "#60a5fa", padding: "8px 18px", borderRadius: 999, fontWeight: 700, marginBottom: 20, fontSize: 13, letterSpacing: "0.05em" }}>MARCA VERIFICADA</div>
            <h1 style={{ fontSize: "clamp(36px, 5vw, 56px)", fontWeight: 900, marginBottom: 16, lineHeight: 1.1 }}>
              Recambios Febi Bilstein
            </h1>
            <p style={{ color: "#94a3b8", fontSize: 18, maxWidth: 650, margin: "0 auto", lineHeight: 1.7 }}>
              Febi Bilstein, parte del grupo Ferdinand Bilstein, lleva más de 175 años en el mercado de recambios. Su catálogo de más de 40.000 referencias abarca desde piezas de suspensión y dirección hasta componentes de motor, refrigeración y carrocería.
            </p>
          </div>

          <div style={{ background: "rgba(15,23,42,0.92)", borderRadius: 24, padding: 32, border: "1px solid rgba(255,255,255,0.06)", marginBottom: 24 }}>
            <h2 style={{ fontSize: 24, fontWeight: 900, marginBottom: 16 }}>Productos Febi Bilstein disponibles</h2>
            <ul style={{ listStyle: "none", padding: 0, display: "flex", flexDirection: "column", gap: 10 }}>
              <li key={"Piezas de suspensión"} style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <span style={{ color: "#22c55e", fontWeight: 900, fontSize: 18 }}>✓</span>
                <span style={{ color: "#cbd5e1", fontSize: 15 }}>Piezas de suspensión</span>
              </li>
              <li key={"Dirección"} style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <span style={{ color: "#22c55e", fontWeight: 900, fontSize: 18 }}>✓</span>
                <span style={{ color: "#cbd5e1", fontSize: 15 }}>Dirección</span>
              </li>
              <li key={"Motor"} style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <span style={{ color: "#22c55e", fontWeight: 900, fontSize: 18 }}>✓</span>
                <span style={{ color: "#cbd5e1", fontSize: 15 }}>Motor</span>
              </li>
              <li key={"Refrigeración"} style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <span style={{ color: "#22c55e", fontWeight: 900, fontSize: 18 }}>✓</span>
                <span style={{ color: "#cbd5e1", fontSize: 15 }}>Refrigeración</span>
              </li>
              <li key={"Carrocería"} style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <span style={{ color: "#22c55e", fontWeight: 900, fontSize: 18 }}>✓</span>
                <span style={{ color: "#cbd5e1", fontSize: 15 }}>Carrocería</span>
              </li>
              <li key={"Transmisión"} style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <span style={{ color: "#22c55e", fontWeight: 900, fontSize: 18 }}>✓</span>
                <span style={{ color: "#cbd5e1", fontSize: 15 }}>Transmisión</span>
              </li>
            </ul>
          </div>

          <div style={{ background: "rgba(15,23,42,0.92)", borderRadius: 24, padding: 32, border: "1px solid rgba(255,255,255,0.06)", marginBottom: 24 }}>
            <h2 style={{ fontSize: 24, fontWeight: 900, marginBottom: 16 }}>Compatibilidad de vehículos</h2>
            <p style={{ color: "#94a3b8", fontSize: 15, lineHeight: 1.8 }}>
              Especialista en marcas alemanas (VW/Audi, BMW, Mercedes, Opel) con creciente cobertura de francesas y asiáticas.
            </p>
          </div>

          <div style={{ background: "rgba(15,23,42,0.92)", borderRadius: 24, padding: 32, border: "1px solid rgba(255,255,255,0.06)", marginBottom: 24 }}>
            <h2 style={{ fontSize: 24, fontWeight: 900, marginBottom: 16 }}>¿Por qué elegir Febi Bilstein?</h2>
            <p style={{ color: "#94a3b8", fontSize: 15, lineHeight: 1.8 }}>
              Febi Bilstein es ideal para piezas de difícil localización. Su catálogo profundo cubre componentes que otras marcas IAM no tienen, con calidad OE garantizada.
            </p>
          </div>

          <div style={{ textAlign: "center", marginTop: 48 }}>
            <h2 style={{ fontSize: 28, fontWeight: 900, marginBottom: 16 }}>Compara precios de Febi Bilstein</h2>
            <p style={{ color: "#94a3b8", marginBottom: 24, fontSize: 16 }}>Accede a proveedores verificados con stock de Febi Bilstein. Primer mes gratis.</p>
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
