import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cómo encontrar nuevos proveedores de recambios para tu taller | Recambio Directo",
  description: "Guía práctica para talleres que buscan nuevos proveedores de recambios de automoción. Compara opciones y encuentra el canal más eficiente.",
  alternates: { canonical: "https://www.recambio-directo.com/blog/como-encontrar-nuevos-proveedores-recambios" },
};

const jsonLd = "{\"@context\": \"https://schema.org\", \"@type\": \"Article\", \"headline\": \"C\u00f3mo encontrar nuevos proveedores de recambios para tu taller\", \"description\": \"Gu\u00eda pr\u00e1ctica para talleres que buscan nuevos proveedores de recambios de automoci\u00f3n. Compara opciones y encuentra el canal m\u00e1s eficiente.\", \"url\": \"https://www.recambio-directo.com/blog/como-encontrar-nuevos-proveedores-recambios\", \"author\": {\"@type\": \"Organization\", \"name\": \"Recambio Directo\"}, \"publisher\": {\"@type\": \"Organization\", \"name\": \"Recambio Directo\", \"url\": \"https://www.recambio-directo.com\"}, \"datePublished\": \"2026-09-25\", \"mainEntityOfPage\": \"https://www.recambio-directo.com/blog/como-encontrar-nuevos-proveedores-recambios\"}";

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
              Cómo encontrar nuevos proveedores de recambios para tu taller
            </h1>
            <p style={{ color: "#64748b", fontSize: 14 }}>Publicado en septiembre 2026 · Recambio Directo</p>
          </div>

          <div style={{ background: "rgba(15,23,42,0.92)", borderRadius: 24, padding: 32, border: "1px solid rgba(255,255,255,0.06)", marginBottom: 24 }}>
            <h2 style={{ fontSize: 24, fontWeight: 900, marginBottom: 16 }}>El problema: depender de uno o dos proveedores</h2>
            <p style={{ color: "#94a3b8", fontSize: 15, lineHeight: 1.8, marginBottom: 16 }}>La mayoría de talleres mecánicos en España trabajan con uno o dos distribuidores de recambios de toda la vida. Esto genera dependencia: cuando tu proveedor habitual no tiene la pieza, pierdes tiempo llamando a otros, buscando en catálogos o esperando a que la consigan.</p>
            <p style={{ color: "#94a3b8", fontSize: 15, lineHeight: 1.8, marginBottom: 16 }}>Según datos del sector, un taller medio pierde entre 45 y 90 minutos al día buscando piezas por teléfono o WhatsApp. Ese tiempo es facturación perdida: un mecánico que no está en el elevador no genera ingresos.</p>
          </div>
          <div style={{ background: "rgba(15,23,42,0.92)", borderRadius: 24, padding: 32, border: "1px solid rgba(255,255,255,0.06)", marginBottom: 24 }}>
            <h2 style={{ fontSize: 24, fontWeight: 900, marginBottom: 16 }}>Canales tradicionales vs digitales</h2>
            <p style={{ color: "#94a3b8", fontSize: 15, lineHeight: 1.8, marginBottom: 16 }}>Los canales tradicionales — teléfono, visita del comercial, catálogo en papel — funcionan pero no escalan. Cuando necesitas una pieza urgente de un modelo poco común, el proceso puede alargarse horas.</p>
            <p style={{ color: "#94a3b8", fontSize: 15, lineHeight: 1.8, marginBottom: 16 }}>Los marketplaces B2B de recambios como Recambio Directo permiten buscar entre múltiples proveedores a la vez, comparar precios en tiempo real y hacer el pedido en menos de un minuto. La diferencia está en el tiempo: lo que antes eran 6 llamadas se convierte en una búsqueda.</p>
          </div>
          <div style={{ background: "rgba(15,23,42,0.92)", borderRadius: 24, padding: 32, border: "1px solid rgba(255,255,255,0.06)", marginBottom: 24 }}>
            <h2 style={{ fontSize: 24, fontWeight: 900, marginBottom: 16 }}>Qué buscar en un nuevo proveedor</h2>
            <p style={{ color: "#94a3b8", fontSize: 15, lineHeight: 1.8, marginBottom: 16 }}>Al evaluar un nuevo canal de aprovisionamiento, fíjate en: amplitud de catálogo (¿cubre OEM e IAM?), plazo de entrega (¿24h o 48h?), condiciones de pago (¿ofrecen crédito?), política de devoluciones y atención postventa.</p>
            <p style={{ color: "#94a3b8", fontSize: 15, lineHeight: 1.8, marginBottom: 16 }}>En Recambio Directo todos los proveedores están verificados: comprobamos que son empresas reales con stock propio. Además, cada pedido tiene un chat directo con el proveedor y una garantía de devolución.</p>
          </div>
          <div style={{ background: "rgba(15,23,42,0.92)", borderRadius: 24, padding: 32, border: "1px solid rgba(255,255,255,0.06)", marginBottom: 24 }}>
            <h2 style={{ fontSize: 24, fontWeight: 900, marginBottom: 16 }}>Cómo empezar sin riesgo</h2>
            <p style={{ color: "#94a3b8", fontSize: 15, lineHeight: 1.8, marginBottom: 16 }}>No necesitas dejar a tu proveedor actual. Puedes usar un marketplace B2B como canal complementario: para las piezas que tu distribuidor no tiene, para comparar precios en pedidos grandes, o para probar nuevos proveedores sin compromiso.</p>
            <p style={{ color: "#94a3b8", fontSize: 15, lineHeight: 1.8, marginBottom: 16 }}>Recambio Directo ofrece el primer mes gratis y sin permanencia. Regístrate, busca unas cuantas referencias y compara. Si el precio y el servicio te convencen, habrás ganado un canal más sin riesgo.</p>
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
