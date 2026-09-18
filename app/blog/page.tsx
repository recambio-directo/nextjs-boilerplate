import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Blog de Recambios de Automoción B2B — Recambio Directo",
  description:
    "Artículos, guías y novedades sobre recambios de automoción, logística B2B, piezas OEM e IAM y gestión de talleres mecánicos en España.",
  alternates: {
    canonical: "https://www.recambio-directo.com/blog",
  },
};

const badge: React.CSSProperties = {
  display: "inline-block",
  background: "rgba(37,99,235,0.15)",
  color: "#60a5fa",
  padding: "8px 18px",
  borderRadius: 999,
  fontWeight: 700,
  marginBottom: 20,
  fontSize: 13,
};

const card: React.CSSProperties = {
  background: "rgba(15,23,42,0.92)",
  borderRadius: 24,
  padding: 32,
  border: "1px solid rgba(255,255,255,0.06)",
};

const articles = [
  {
    slug: "como-elegir-recambios-oem-o-iam",
    title: "Cómo elegir entre recambios OEM e IAM: guía para talleres",
    excerpt:
      "Descubre las diferencias clave entre piezas OEM (Original Equipment Manufacturer) e IAM (Independent Aftermarket), cuándo conviene cada tipo y cómo afectan a la garantía del vehículo.",
    date: "Septiembre 2026",
  },
  {
    slug: "ventajas-marketplace-b2b-recambios",
    title: "5 ventajas de usar un marketplace B2B para comprar recambios",
    excerpt:
      "Los talleres que compran recambios a través de un marketplace B2B ahorran tiempo, comparan precios y reducen errores en los pedidos. Te explicamos por qué el modelo B2B digital está transformando el sector.",
    date: "Septiembre 2026",
  },
  {
    slug: "guia-logistica-recambios-automocion",
    title: "Guía de logística para recambios de automoción en España",
    excerpt:
      "Agencias de transporte, plazos de entrega, etiquetas automáticas y tracking en tiempo real. Todo lo que necesitas saber sobre la logística de piezas de coche en el mercado español.",
    date: "Septiembre 2026",
  },
];

export default function BlogPage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg,#020617,#020b2d)",
        color: "white",
        padding: "60px 20px",
      }}
    >
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <div style={badge}>BLOG</div>
          <h1
            style={{
              fontSize: "clamp(36px, 5vw, 56px)",
              fontWeight: 900,
              marginBottom: 16,
              lineHeight: 1.1,
            }}
          >
            Blog de Recambios de Automoción
          </h1>
          <p
            style={{
              color: "#94a3b8",
              fontSize: 18,
              maxWidth: 600,
              margin: "0 auto",
              lineHeight: 1.7,
            }}
          >
            Guías, novedades y consejos para talleres y proveedores de recambios
            en España.
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {articles.map(({ slug, title, excerpt, date }) => (
            <a
              key={slug}
              href={`/blog/${slug}`}
              style={{ ...card, textDecoration: "none", color: "inherit" }}
            >
              <p
                style={{
                  color: "#60a5fa",
                  fontSize: 13,
                  fontWeight: 700,
                  marginBottom: 8,
                }}
              >
                {date}
              </p>
              <h2
                style={{
                  fontSize: 22,
                  fontWeight: 900,
                  marginBottom: 10,
                }}
              >
                {title}
              </h2>
              <p
                style={{
                  color: "#94a3b8",
                  fontSize: 15,
                  lineHeight: 1.7,
                  margin: 0,
                }}
              >
                {excerpt}
              </p>
            </a>
          ))}
        </div>

        <div
          style={{
            textAlign: "center",
            marginTop: 48,
            color: "#64748b",
            fontSize: 13,
          }}
        >
          <a
            href="/"
            style={{ color: "#60a5fa", textDecoration: "none" }}
          >
            ← Volver a Recambio Directo
          </a>
        </div>
      </div>
    </main>
  );
}
