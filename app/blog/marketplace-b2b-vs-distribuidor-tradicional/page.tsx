import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Marketplace B2B vs distribuidor tradicional de recambios: comparativa | Recambio Directo",
  description: "Comparativa entre comprar recambios en un marketplace B2B y usar un distribuidor tradicional. Ventajas, desventajas y cuándo usar cada canal.",
  alternates: { canonical: "https://www.recambio-directo.com/blog/marketplace-b2b-vs-distribuidor-tradicional" },
};

const jsonLd = "{\"@context\": \"https://schema.org\", \"@type\": \"Article\", \"headline\": \"Marketplace B2B vs distribuidor tradicional de recambios: comparativa\", \"description\": \"Comparativa entre comprar recambios en un marketplace B2B y usar un distribuidor tradicional. Ventajas, desventajas y cu\u00e1ndo usar cada canal.\", \"url\": \"https://www.recambio-directo.com/blog/marketplace-b2b-vs-distribuidor-tradicional\", \"author\": {\"@type\": \"Organization\", \"name\": \"Recambio Directo\"}, \"publisher\": {\"@type\": \"Organization\", \"name\": \"Recambio Directo\", \"url\": \"https://www.recambio-directo.com\"}, \"datePublished\": \"2026-09-25\", \"mainEntityOfPage\": \"https://www.recambio-directo.com/blog/marketplace-b2b-vs-distribuidor-tradicional\"}";

export default function Page() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
      <main style={{ minHeight: "100vh", background: "linear-gradient(135deg,#020617,#020b2d)", color: "white", padding: "60px 20px" }}>
        <div style={{ maxWidth: 800, margin: "0 auto" }}>

          <nav style={{ marginBottom: 32, fontSize: 13, color: "#64748b" }}>
            <a href="/" style={{ color: "#60a5fa", textDecoration: "none" }}>Inicio</a>
            {" › "}
            <a href="/blog" style={{ color: "#60a5fa", textDecoration: "none" }}>Blog</a>
            {" › "}
            <span style={{ color: "#94a3b8" }}>Artículo</span>
          </nav>

          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <div style={{ display: "inline-block", background: "rgba(37,99,235,0.15)", color: "#60a5fa", padding: "8px 18px", borderRadius: 999, fontWeight: 700, marginBottom: 20, fontSize: 13, letterSpacing: "0.05em" }}>BLOG</div>
            <h1 style={{ fontSize: "clamp(32px, 4.5vw, 48px)", fontWeight: 900, marginBottom: 16, lineHeight: 1.15 }}>
              Marketplace B2B vs distribuidor tradicional de recambios: comparativa
            </h1>
            <p style={{ color: "#64748b", fontSize: 14 }}>Publicado en septiembre 2026 · Recambio Directo</p>
          </div>

          <div style={{ background: "rgba(15,23,42,0.92)", borderRadius: 24, padding: 32, border: "1px solid rgba(255,255,255,0.06)", marginBottom: 24 }}>
            <h2 style={{ fontSize: 24, fontWeight: 900, marginBottom: 16 }}>Distribuidor tradicional: lo que funciona y lo que no</h2>
            <p style={{ color: "#94a3b8", fontSize: 15, lineHeight: 1.8, marginBottom: 16 }}>El distribuidor tradicional lleva décadas siendo el canal principal de aprovisionamiento del taller. Su punto fuerte es la relación personal: tu comercial conoce tus necesidades, te fía, te trae la pieza urgente.</p>
            <p style={{ color: "#94a3b8", fontSize: 15, lineHeight: 1.8, marginBottom: 16 }}>Pero tiene limitaciones: el catálogo depende de su stock, los precios no siempre son competitivos (pagas la estructura comercial), el horario es limitado y comparar entre distribuidores requiere múltiples llamadas.</p>
          </div>
          <div style={{ background: "rgba(15,23,42,0.92)", borderRadius: 24, padding: 32, border: "1px solid rgba(255,255,255,0.06)", marginBottom: 24 }}>
            <h2 style={{ fontSize: 24, fontWeight: 900, marginBottom: 16 }}>Marketplace B2B: qué aporta de nuevo</h2>
            <p style={{ color: "#94a3b8", fontSize: 15, lineHeight: 1.8, marginBottom: 16 }}>Un marketplace B2B conecta al taller con múltiples proveedores desde un único panel. Puedes buscar la pieza, ver quién la tiene en stock, comparar precios y pedir — todo en menos de un minuto, a cualquier hora.</p>
            <p style={{ color: "#94a3b8", fontSize: 15, lineHeight: 1.8, marginBottom: 16 }}>La transparencia de precios es la mayor ventaja: ves el precio de cada proveedor lado a lado. No necesitas negociar ni llamar; el mercado fija el precio. Los talleres que usan marketplace reportan ahorros del 5-15% frente a su distribuidor habitual.</p>
          </div>
          <div style={{ background: "rgba(15,23,42,0.92)", borderRadius: 24, padding: 32, border: "1px solid rgba(255,255,255,0.06)", marginBottom: 24 }}>
            <h2 style={{ fontSize: 24, fontWeight: 900, marginBottom: 16 }}>¿Son excluyentes? No</h2>
            <p style={{ color: "#94a3b8", fontSize: 15, lineHeight: 1.8, marginBottom: 16 }}>No se trata de elegir uno u otro. Los talleres más eficientes usan ambos canales: el distribuidor para el día a día y las urgencias locales, y el marketplace para comparar precios, encontrar piezas difíciles y acceder a proveedores que antes no conocían.</p>
            <p style={{ color: "#94a3b8", fontSize: 15, lineHeight: 1.8, marginBottom: 16 }}>El marketplace no sustituye la relación con tu distribuidor: la complementa. Es un canal más en tu caja de herramientas de aprovisionamiento.</p>
          </div>
          <div style={{ background: "rgba(15,23,42,0.92)", borderRadius: 24, padding: 32, border: "1px solid rgba(255,255,255,0.06)", marginBottom: 24 }}>
            <h2 style={{ fontSize: 24, fontWeight: 900, marginBottom: 16 }}>Recambio Directo: lo mejor de ambos mundos</h2>
            <p style={{ color: "#94a3b8", fontSize: 15, lineHeight: 1.8, marginBottom: 16 }}>Recambio Directo combina la amplitud de un marketplace con la atención personalizada: cada pedido tiene chat directo con el proveedor, los proveedores están verificados y el taller tiene línea de crédito (RD Pago) desde el segundo mes.</p>
            <p style={{ color: "#94a3b8", fontSize: 15, lineHeight: 1.8, marginBottom: 16 }}>Si quieres probar cómo funciona un marketplace B2B sin dejar tu distribuidor, Recambio Directo te da el primer mes gratis y sin permanencia.</p>
          </div>

          <div style={{ textAlign: "center", marginTop: 48, background: "rgba(15,23,42,0.92)", borderRadius: 24, padding: 40, border: "1px solid rgba(255,255,255,0.06)" }}>
            <h2 style={{ fontSize: 28, fontWeight: 900, marginBottom: 16 }}>¿Quieres probarlo?</h2>
            <p style={{ color: "#94a3b8", marginBottom: 24, fontSize: 16 }}>Primer mes gratis. Sin permanencia. Solo 25 €/mes después.</p>
            <a href="/registro" style={{ display: "inline-block", background: "linear-gradient(135deg,#2563eb,#1d4ed8)", color: "white", padding: "18px 48px", borderRadius: 14, fontWeight: 800, textDecoration: "none", fontSize: 17 }}>
              REGISTRARME GRATIS →
            </a>
          </div>

          <div style={{ textAlign: "center", marginTop: 32, fontSize: 13 }}>
            <a href="/blog" style={{ color: "#60a5fa", textDecoration: "none" }}>← Volver al blog</a>
          </div>
        </div>
      </main>
    </>
  );
}
