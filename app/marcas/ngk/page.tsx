import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Recambios NGK — Comprar Online B2B | Recambio Directo",
  description: "Compra recambios NGK al mejor precio en nuestro marketplace B2B. NGK, número uno mundial en bujías y sondas lambda. bujías NGK, calentadores NGK, sonda lambda NGK. Entrega en 24h.",
  alternates: { canonical: "https://www.recambio-directo.com/marcas/ngk" },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "Recambios NGK",
  "description": "NGK: número uno mundial en bujías y sondas lambda. Compra bujías, calentadores y sondas lambda en Recambio Directo.",
  "url": "https://www.recambio-directo.com/marcas/ngk",
  "brand": {
    "@type": "Brand",
    "name": "NGK"
  },
  "offers": {
    "@type": "AggregateOffer",
    "priceCurrency": "EUR",
    "availability": "https://schema.org/InStock",
    "seller": {
      "@type": "Organization",
      "name": "Recambio Directo",
      "url": "https://www.recambio-directo.com"
    }
  }
};

const badge: React.CSSProperties = { display: "inline-block", background: "rgba(37,99,235,0.15)", color: "#60a5fa", padding: "8px 18px", borderRadius: 999, fontWeight: 700, marginBottom: 20, fontSize: 13, letterSpacing: "0.05em" };
const card: React.CSSProperties = { background: "rgba(15,23,42,0.92)", borderRadius: 24, padding: 32, border: "1px solid rgba(255,255,255,0.06)" };

export default function RecambiosNgkPage() {
  return (
    <main style={ { minHeight: "100vh", background: "linear-gradient(135deg,#020617,#020b2d)", color: "white", padding: "60px 20px" } }>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div style={ { maxWidth: 900, margin: "0 auto" } }>

        <div style={ { textAlign: "center", marginBottom: 48 } }>
          <div style={badge}>RECAMBIOS NGK</div>
          <h1 style={ { fontSize: "clamp(36px, 5vw, 56px)", fontWeight: 900, marginBottom: 16, lineHeight: 1.1 } }>
            Recambios NGK al mejor precio
          </h1>
          <p style={ { color: "#94a3b8", fontSize: 18, maxWidth: 650, margin: "0 auto", lineHeight: 1.7 } }>
            NGK, número uno mundial en bujías y sondas lambda. Compara precios entre proveedores verificados y recibe en 24 horas.
          </p>
        </div>

        <div style={card}>
          <h2 style={ { fontSize: 28, fontWeight: 900, marginBottom: 16 } }>¿Por qué elegir NGK?</h2>
          <p style={ { color: "#94a3b8", fontSize: 15, lineHeight: 1.8, marginBottom: 16 } }>
            NGK es número uno mundial en bujías y sondas lambda, con origen en Japón. Su especialidad son bujías, calentadores y sondas lambda.
          </p>
          <p style={ { color: "#94a3b8", fontSize: 15, lineHeight: 1.8, marginBottom: 16 } }>
            NGK es el mayor fabricante de bujías del mundo y proveedor OEM de Toyota, Honda, Nissan, BMW y Mercedes, entre otros.
          </p>
          <p style={ { color: "#94a3b8", fontSize: 15, lineHeight: 1.8 } }>
            En Recambio Directo puedes encontrar bujías de encendido, bujías de precalentamiento, sondas lambda, bobinas de encendido y cables de bujías de NGK entre múltiples proveedores verificados, comparar precios en tiempo real y hacer el pedido en menos de un minuto.
          </p>
        </div>

        <div style={ { ...card, marginTop: 24 } }>
          <h2 style={ { fontSize: 24, fontWeight: 900, marginBottom: 16 } }>Ventajas de comprar NGK en Recambio Directo</h2>
          <ul style={ { listStyle: "none", padding: 0, display: "flex", flexDirection: "column", gap: 12 } }>
            {["Compara precios de NGK entre varios proveedores a la vez", "Piezas originales y equivalentes con garantía del proveedor", "Entrega en 24-48h en toda España peninsular", "Gestión de pedidos, albaranes y facturas desde un único panel", "Chat en tiempo real con el proveedor vinculado a cada pedido", "RD Pago: compra ahora, paga en 15 días"].map((item, i) => (
              <li key={i} style={ { display: "flex", gap: 10, alignItems: "flex-start" } }>
                <span style={ { color: "#22c55e", fontWeight: 900, fontSize: 18, flexShrink: 0 } }>✓</span>
                <span style={ { color: "#cbd5e1", fontSize: 15, lineHeight: 1.6 } }>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div style={ { textAlign: "center", marginTop: 48 } }>
          <h2 style={ { fontSize: 28, fontWeight: 900, marginBottom: 16 } }>Empieza a comprar NGK hoy</h2>
          <p style={ { color: "#94a3b8", marginBottom: 24, fontSize: 16 } }>Primer mes gratuito. Sin permanencia. Solo 25€/mes después.</p>
          <a href="/registro" style={ { display: "inline-block", background: "linear-gradient(135deg,#2563eb,#1d4ed8)", color: "white", padding: "18px 48px", borderRadius: 14, fontWeight: 800, textDecoration: "none", fontSize: 17 } }>
            REGISTRARME GRATIS →
          </a>
        </div>

        <div style={ { textAlign: "center", marginTop: 48, color: "#64748b", fontSize: 13 } }>
          <a href="/" style={ { color: "#60a5fa", textDecoration: "none" } }>← Volver a Recambio Directo</a>
        </div>
      </div>
    </main>
  );
}
