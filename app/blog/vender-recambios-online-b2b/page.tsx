import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cómo vender recambios de automoción online en el canal B2B | Recambio Directo",
  description: "Guía para proveedores y distribuidores que quieren abrir un nuevo canal de ventas B2B online. Estrategias y plataformas para llegar a más talleres.",
  alternates: { canonical: "https://www.recambio-directo.com/blog/vender-recambios-online-b2b" },
};

const jsonLd = "{\"@context\": \"https://schema.org\", \"@type\": \"Article\", \"headline\": \"C\u00f3mo vender recambios de automoci\u00f3n online en el canal B2B\", \"description\": \"Gu\u00eda para proveedores y distribuidores que quieren abrir un nuevo canal de ventas B2B online. Estrategias y plataformas para llegar a m\u00e1s talleres.\", \"url\": \"https://www.recambio-directo.com/blog/vender-recambios-online-b2b\", \"author\": {\"@type\": \"Organization\", \"name\": \"Recambio Directo\"}, \"publisher\": {\"@type\": \"Organization\", \"name\": \"Recambio Directo\", \"url\": \"https://www.recambio-directo.com\"}, \"datePublished\": \"2026-09-25\", \"mainEntityOfPage\": \"https://www.recambio-directo.com/blog/vender-recambios-online-b2b\"}";

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
              Cómo vender recambios de automoción online en el canal B2B
            </h1>
            <p style={{ color: "#64748b", fontSize: 14 }}>Publicado en septiembre 2026 · Recambio Directo</p>
          </div>

          <div style={{ background: "rgba(15,23,42,0.92)", borderRadius: 24, padding: 32, border: "1px solid rgba(255,255,255,0.06)", marginBottom: 24 }}>
            <h2 style={{ fontSize: 24, fontWeight: 900, marginBottom: 16 }}>El mercado B2B de recambios se digitaliza</h2>
            <p style={{ color: "#94a3b8", fontSize: 15, lineHeight: 1.8, marginBottom: 16 }}>El sector de recambios de automoción en España mueve más de 10.000 millones de euros al año. Históricamente, la venta B2B (de proveedor a taller) ha funcionado por teléfono, visita comercial y fax. Pero eso está cambiando.</p>
            <p style={{ color: "#94a3b8", fontSize: 15, lineHeight: 1.8, marginBottom: 16 }}>Los talleres más jóvenes — y cada vez más los veteranos — buscan proveedores online. Quieren comparar precios, ver stock en tiempo real y hacer pedidos a cualquier hora. El proveedor que no esté online pierde visibilidad frente a los que sí lo están.</p>
          </div>
          <div style={{ background: "rgba(15,23,42,0.92)", borderRadius: 24, padding: 32, border: "1px solid rgba(255,255,255,0.06)", marginBottom: 24 }}>
            <h2 style={{ fontSize: 24, fontWeight: 900, marginBottom: 16 }}>¿Marketplace B2B o tienda online propia?</h2>
            <p style={{ color: "#94a3b8", fontSize: 15, lineHeight: 1.8, marginBottom: 16 }}>Montar una tienda online propia (e-commerce B2B) requiere inversión en desarrollo, catálogo, logística y marketing. Para un distribuidor mediano, puede suponer meses de trabajo y decenas de miles de euros.</p>
            <p style={{ color: "#94a3b8", fontSize: 15, lineHeight: 1.8, marginBottom: 16 }}>Un marketplace B2B como Recambio Directo ofrece una alternativa: subes tu catálogo, fijas tus precios y empiezas a recibir pedidos de talleres verificados. Sin inversión en desarrollo, sin gastos de marketing, sin permanencia.</p>
          </div>
          <div style={{ background: "rgba(15,23,42,0.92)", borderRadius: 24, padding: 32, border: "1px solid rgba(255,255,255,0.06)", marginBottom: 24 }}>
            <h2 style={{ fontSize: 24, fontWeight: 900, marginBottom: 16 }}>Ventajas de vender en un marketplace B2B</h2>
            <p style={{ color: "#94a3b8", fontSize: 15, lineHeight: 1.8, marginBottom: 16 }}>Acceso a una base de talleres verificados que buscan activamente recambios. Visibilidad inmediata sin invertir en SEO ni publicidad. Gestión de pedidos, chat con clientes y facturación integrada.</p>
            <p style={{ color: "#94a3b8", fontSize: 15, lineHeight: 1.8, marginBottom: 16 }}>En Recambio Directo, el proveedor controla sus precios, su stock y sus zonas de envío. La plataforma cobra una comisión solo cuando hay venta: si no vendes, no pagas. Es un canal de ventas adicional sin riesgo.</p>
          </div>
          <div style={{ background: "rgba(15,23,42,0.92)", borderRadius: 24, padding: 32, border: "1px solid rgba(255,255,255,0.06)", marginBottom: 24 }}>
            <h2 style={{ fontSize: 24, fontWeight: 900, marginBottom: 16 }}>Cómo empezar a vender en Recambio Directo</h2>
            <p style={{ color: "#94a3b8", fontSize: 15, lineHeight: 1.8, marginBottom: 16 }}>El proceso es sencillo: regístrate como proveedor, sube tu catálogo (aceptamos formatos CSV, Excel y TecDoc) y configura tus condiciones de envío. Verificamos tu cuenta en menos de 24 horas.</p>
            <p style={{ color: "#94a3b8", fontSize: 15, lineHeight: 1.8, marginBottom: 16 }}>El primer mes es gratuito. A partir del segundo, el coste es de 25 €/mes sin permanencia. Puedes cancelar en cualquier momento si no te convence. Es la forma más rápida de abrir un canal de venta B2B online.</p>
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
