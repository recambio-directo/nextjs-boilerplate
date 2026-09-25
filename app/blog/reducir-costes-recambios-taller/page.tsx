import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "5 formas de reducir el coste de recambios en tu taller | Recambio Directo",
  description: "Estrategias prácticas para que tu taller mecánico ahorre en la compra de recambios sin sacrificar calidad. Comparar, negociar y optimizar.",
  alternates: { canonical: "https://www.recambio-directo.com/blog/reducir-costes-recambios-taller" },
};

const jsonLd = "{\"@context\": \"https://schema.org\", \"@type\": \"Article\", \"headline\": \"5 formas de reducir el coste de recambios en tu taller\", \"description\": \"Estrategias pr\u00e1cticas para que tu taller mec\u00e1nico ahorre en la compra de recambios sin sacrificar calidad. Comparar, negociar y optimizar.\", \"url\": \"https://www.recambio-directo.com/blog/reducir-costes-recambios-taller\", \"author\": {\"@type\": \"Organization\", \"name\": \"Recambio Directo\"}, \"publisher\": {\"@type\": \"Organization\", \"name\": \"Recambio Directo\", \"url\": \"https://www.recambio-directo.com\"}, \"datePublished\": \"2026-09-25\", \"mainEntityOfPage\": \"https://www.recambio-directo.com/blog/reducir-costes-recambios-taller\"}";

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
              5 formas de reducir el coste de recambios en tu taller
            </h1>
            <p style={{ color: "#64748b", fontSize: 14 }}>Publicado en septiembre 2026 · Recambio Directo</p>
          </div>

          <div style={{ background: "rgba(15,23,42,0.92)", borderRadius: 24, padding: 32, border: "1px solid rgba(255,255,255,0.06)", marginBottom: 24 }}>
            <h2 style={{ fontSize: 24, fontWeight: 900, marginBottom: 16 }}>1. Compara precios entre proveedores — de verdad</h2>
            <p style={{ color: "#94a3b8", fontSize: 15, lineHeight: 1.8, marginBottom: 16 }}>Muchos talleres creen que comparan precios, pero en realidad solo piden presupuesto a 2-3 distribuidores habituales. Un marketplace B2B te permite ver el precio de 10+ proveedores para la misma referencia en segundos.</p>
            <p style={{ color: "#94a3b8", fontSize: 15, lineHeight: 1.8, marginBottom: 16 }}>La diferencia de precio entre el proveedor más caro y el más barato para la misma pieza puede ser del 20-30%. Multiplicado por cientos de pedidos al año, son miles de euros de ahorro.</p>
          </div>
          <div style={{ background: "rgba(15,23,42,0.92)", borderRadius: 24, padding: 32, border: "1px solid rgba(255,255,255,0.06)", marginBottom: 24 }}>
            <h2 style={{ fontSize: 24, fontWeight: 900, marginBottom: 16 }}>2. Evalúa alternativas IAM de calidad</h2>
            <p style={{ color: "#94a3b8", fontSize: 15, lineHeight: 1.8, marginBottom: 16 }}>No todas las reparaciones necesitan pieza OEM original. Las alternativas IAM de marcas como Brembo, Mann-Filter, Gates o LuK son fabricadas por los mismos proveedores originales bajo su propia marca, a precio significativamente inferior.</p>
            <p style={{ color: "#94a3b8", fontSize: 15, lineHeight: 1.8, marginBottom: 16 }}>La clave es conocer qué marcas IAM son fiables para cada tipo de pieza. En Recambio Directo puedes filtrar por tipo (OEM o IAM) y ver las marcas disponibles para cada referencia.</p>
          </div>
          <div style={{ background: "rgba(15,23,42,0.92)", borderRadius: 24, padding: 32, border: "1px solid rgba(255,255,255,0.06)", marginBottom: 24 }}>
            <h2 style={{ fontSize: 24, fontWeight: 900, marginBottom: 16 }}>3. Aprovecha las condiciones de pago</h2>
            <p style={{ color: "#94a3b8", fontSize: 15, lineHeight: 1.8, marginBottom: 16 }}>Muchos proveedores ofrecen descuentos por pronto pago o rappels por volumen. Si tu liquidez lo permite, pagar a 7 días en lugar de a 30 puede suponer un 2-3% de descuento adicional.</p>
            <p style={{ color: "#94a3b8", fontSize: 15, lineHeight: 1.8, marginBottom: 16 }}>En Recambio Directo, RD Pago te da 15 días para pagar sin coste adicional. Esto te permite servir la reparación, cobrar al cliente y pagar después: tu flujo de caja mejora sin coste.</p>
          </div>
          <div style={{ background: "rgba(15,23,42,0.92)", borderRadius: 24, padding: 32, border: "1px solid rgba(255,255,255,0.06)", marginBottom: 24 }}>
            <h2 style={{ fontSize: 24, fontWeight: 900, marginBottom: 16 }}>4. Reduce las devoluciones por pieza incorrecta</h2>
            <p style={{ color: "#94a3b8", fontSize: 15, lineHeight: 1.8, marginBottom: 16 }}>Cada devolución es un coste oculto: tiempo del mecánico, tiempo de gestión, transporte de ida y vuelta, y el cliente esperando. La búsqueda por matrícula reduce las devoluciones por error de referencia a prácticamente cero.</p>
            <p style={{ color: "#94a3b8", fontSize: 15, lineHeight: 1.8, marginBottom: 16 }}>Un taller medio gestiona entre 2 y 5 devoluciones por semana. A una media de 30 minutos por gestión, son hasta 2,5 horas semanales que podrías estar facturando.</p>
          </div>
          <div style={{ background: "rgba(15,23,42,0.92)", borderRadius: 24, padding: 32, border: "1px solid rgba(255,255,255,0.06)", marginBottom: 24 }}>
            <h2 style={{ fontSize: 24, fontWeight: 900, marginBottom: 16 }}>5. Centraliza tu gestión de compras</h2>
            <p style={{ color: "#94a3b8", fontSize: 15, lineHeight: 1.8, marginBottom: 16 }}>Tener los pedidos repartidos entre teléfono, WhatsApp, email y fax dificulta el control de costes. Si no puedes consultar fácilmente cuánto has gastado este mes en frenos, no puedes optimizar.</p>
            <p style={{ color: "#94a3b8", fontSize: 15, lineHeight: 1.8, marginBottom: 16 }}>Un panel centralizado como el de Recambio Directo te da visibilidad total: histórico de pedidos, facturas, comparativo de precios y proveedores. Datos para tomar mejores decisiones de compra.</p>
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
