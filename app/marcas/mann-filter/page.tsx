import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Recambios MANN-FILTER — Marketplace B2B | Recambio Directo",
  description: "Filtros MANN-FILTER para talleres: aceite, aire, combustible y habitáculo. Precios B2B en Recambio Directo.",
  alternates: { canonical: "https://www.recambio-directo.com/marcas/mann-filter" },
};

const jsonLd = "{\"@context\": \"https://schema.org\", \"@type\": \"CollectionPage\", \"name\": \"Recambios MANN-FILTER\", \"description\": \"Filtros MANN-FILTER para talleres: aceite, aire, combustible y habit\u00e1culo. Precios B2B en Recambio Directo.\", \"url\": \"https://www.recambio-directo.com/marcas/mann-filter\", \"isPartOf\": {\"@type\": \"WebSite\", \"name\": \"Recambio Directo\", \"url\": \"https://www.recambio-directo.com\"}, \"breadcrumb\": {\"@type\": \"BreadcrumbList\", \"itemListElement\": [{\"@type\": \"ListItem\", \"position\": 1, \"name\": \"Inicio\", \"item\": \"https://www.recambio-directo.com\"}, {\"@type\": \"ListItem\", \"position\": 2, \"name\": \"Recambios MANN-FILTER\", \"item\": \"https://www.recambio-directo.com/marcas/mann-filter\"}]}}";

export default function Page() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
      <main style={{ minHeight: "100vh", background: "linear-gradient(135deg,#020617,#020b2d)", color: "white", padding: "60px 20px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>

          <nav style={{ marginBottom: 32, fontSize: 13, color: "#64748b" }}>
            <a href="/" style={{ color: "#60a5fa", textDecoration: "none" }}>Inicio</a>
            {" › "}
            <span style={{ color: "#94a3b8" }}>Recambios MANN-FILTER</span>
          </nav>

          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <div style={{ display: "inline-block", background: "rgba(37,99,235,0.15)", color: "#60a5fa", padding: "8px 18px", borderRadius: 999, fontWeight: 700, marginBottom: 20, fontSize: 13, letterSpacing: "0.05em" }}>MARCA VERIFICADA</div>
            <h1 style={{ fontSize: "clamp(36px, 5vw, 56px)", fontWeight: 900, marginBottom: 16, lineHeight: 1.1 }}>
              Recambios MANN-FILTER
            </h1>
            <p style={{ color: "#94a3b8", fontSize: 18, maxWidth: 650, margin: "0 auto", lineHeight: 1.7 }}>
              MANN+HUMMEL es el líder mundial en tecnología de filtración. Sus filtros MANN-FILTER equipan de serie más del 80% de los vehículos europeos. Calidad OE, cobertura de más de 6.000 referencias y documentación técnica impecable.
            </p>
          </div>

          <div style={{ background: "rgba(15,23,42,0.92)", borderRadius: 24, padding: 32, border: "1px solid rgba(255,255,255,0.06)", marginBottom: 24 }}>
            <h2 style={{ fontSize: 24, fontWeight: 900, marginBottom: 16 }}>Productos MANN-FILTER disponibles</h2>
            <ul style={{ listStyle: "none", padding: 0, display: "flex", flexDirection: "column", gap: 10 }}>
              <li key={"Filtros de aceite"} style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <span style={{ color: "#22c55e", fontWeight: 900, fontSize: 18 }}>✓</span>
                <span style={{ color: "#cbd5e1", fontSize: 15 }}>Filtros de aceite</span>
              </li>
              <li key={"Filtros de aire"} style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <span style={{ color: "#22c55e", fontWeight: 900, fontSize: 18 }}>✓</span>
                <span style={{ color: "#cbd5e1", fontSize: 15 }}>Filtros de aire</span>
              </li>
              <li key={"Filtros de combustible"} style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <span style={{ color: "#22c55e", fontWeight: 900, fontSize: 18 }}>✓</span>
                <span style={{ color: "#cbd5e1", fontSize: 15 }}>Filtros de combustible</span>
              </li>
              <li key={"Filtros de habitáculo"} style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <span style={{ color: "#22c55e", fontWeight: 900, fontSize: 18 }}>✓</span>
                <span style={{ color: "#cbd5e1", fontSize: 15 }}>Filtros de habitáculo</span>
              </li>
            </ul>
          </div>

          <div style={{ background: "rgba(15,23,42,0.92)", borderRadius: 24, padding: 32, border: "1px solid rgba(255,255,255,0.06)", marginBottom: 24 }}>
            <h2 style={{ fontSize: 24, fontWeight: 900, marginBottom: 16 }}>Compatibilidad de vehículos</h2>
            <p style={{ color: "#94a3b8", fontSize: 15, lineHeight: 1.8 }}>
              Cobertura universal para turismos y vehículos comerciales ligeros europeos.
            </p>
          </div>

          <div style={{ background: "rgba(15,23,42,0.92)", borderRadius: 24, padding: 32, border: "1px solid rgba(255,255,255,0.06)", marginBottom: 24 }}>
            <h2 style={{ fontSize: 24, fontWeight: 900, marginBottom: 16 }}>¿Por qué elegir MANN-FILTER?</h2>
            <p style={{ color: "#94a3b8", fontSize: 15, lineHeight: 1.8 }}>
              MANN-FILTER garantiza la especificación exacta del fabricante. Su filtro de habitáculo FreciousPlus con capa de biofuncionalización es referencia en el mercado.
            </p>
          </div>

          <div style={{ textAlign: "center", marginTop: 48 }}>
            <h2 style={{ fontSize: 28, fontWeight: 900, marginBottom: 16 }}>Compara precios de MANN-FILTER</h2>
            <p style={{ color: "#94a3b8", marginBottom: 24, fontSize: 16 }}>Accede a proveedores verificados con stock de MANN-FILTER. Primer mes gratis.</p>
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
