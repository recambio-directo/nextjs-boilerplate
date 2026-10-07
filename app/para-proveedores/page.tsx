import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Vende Recambios en Recambio Directo — Canal B2B para Proveedores y Distribuidores",
  description: "Abre un nuevo canal de venta B2B online. Llega a cientos de talleres en toda España, sube tu catálogo y recibe pedidos desde el primer día. Primer mes gratis.",
  alternates: { canonical: "https://www.recambio-directo.com/para-proveedores" },
  openGraph: {
    title: "Vende Recambios en Recambio Directo — Para Proveedores",
    description: "Nuevo canal B2B para distribuidores de recambios. Llega a talleres en toda España.",
    type: "website",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  "name": "Recambio Directo para Proveedores",
  "description": "Canal de venta B2B online para proveedores y distribuidores de recambios de automoción.",
  "url": "https://www.recambio-directo.com/para-proveedores",
  "publisher": {
    "@type": "Organization",
    "name": "Recambio Directo",
    "url": "https://www.recambio-directo.com",
    "logo": "https://www.recambio-directo.com/icons/manifest-icon-512.maskable.png",
  },
  "offers": {
    "@type": "Offer",
    "description": "Suscripción mensual al marketplace B2B",
    "price": "25",
    "priceCurrency": "EUR",
    "priceValidUntil": "2027-12-31",
  },
};

const card: React.CSSProperties = { background: "rgba(15,23,42,0.92)", borderRadius: 24, padding: 32, border: "1px solid rgba(255,255,255,0.06)", marginBottom: 24 };
const stat: React.CSSProperties = { textAlign: "center" as const, flex: "1 1 140px" };
const statNum: React.CSSProperties = { fontSize: 40, fontWeight: 900, color: "#60a5fa", lineHeight: 1 };
const statLabel: React.CSSProperties = { color: "#94a3b8", fontSize: 14, marginTop: 8 };

export default function ParaProveedoresPage() {
  return (
    <main style={{ minHeight: "100vh", background: "linear-gradient(135deg,#020617,#020b2d)", color: "white", padding: "60px 20px" }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div style={{ maxWidth: 900, margin: "0 auto" }}>

        {/* Hero */}
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <div style={{ display: "inline-block", background: "rgba(34,197,94,0.15)", color: "#4ade80", padding: "8px 18px", borderRadius: 999, fontWeight: 700, marginBottom: 20, fontSize: 13, letterSpacing: "0.05em" }}>PARA PROVEEDORES Y DISTRIBUIDORES</div>
          <h1 style={{ fontSize: "clamp(36px, 5vw, 56px)", fontWeight: 900, marginBottom: 20, lineHeight: 1.1 }}>
            Vende recambios a talleres de toda España
          </h1>
          <p style={{ color: "#94a3b8", fontSize: 18, maxWidth: 650, margin: "0 auto", lineHeight: 1.7 }}>
            Recambio Directo es el marketplace B2B donde los talleres buscan y compran recambios. Sube tu catálogo, recibe pedidos y gestiona todo desde un solo panel.
          </p>
          <div style={{ marginTop: 32, display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <a href="/registro" style={{ display: "inline-block", background: "linear-gradient(135deg,#22c55e,#16a34a)", color: "white", padding: "18px 48px", borderRadius: 14, fontWeight: 800, textDecoration: "none", fontSize: 17 }}>
              EMPEZAR GRATIS →
            </a>
          </div>
        </div>

        {/* Stats */}
        <div style={{ ...card, display: "flex", flexWrap: "wrap", gap: 24, justifyContent: "center", padding: "32px 24px" }}>
          <div style={stat}>
            <div style={statNum}>300K+</div>
            <div style={statLabel}>Referencias en la plataforma</div>
          </div>
          <div style={stat}>
            <div style={statNum}>60+</div>
            <div style={statLabel}>Talleres registrados</div>
          </div>
          <div style={stat}>
            <div style={statNum}>24h</div>
            <div style={statLabel}>Entrega en España peninsular</div>
          </div>
          <div style={stat}>
            <div style={statNum}>25€</div>
            <div style={statLabel}>Al mes · Primer mes gratis</div>
          </div>
        </div>

        {/* Por qué vender en RD */}
        <div style={card}>
          <h2 style={{ fontSize: 28, fontWeight: 900, marginBottom: 20 }}>¿Por qué vender en Recambio Directo?</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {[
              { icon: "🔍", title: "Los talleres te encuentran a ti", desc: "Cuando un taller busca una referencia, tu catálogo aparece en los resultados. No necesitas comerciales ni llamadas en frío: los pedidos llegan solos." },
              { icon: "📦", title: "Gestión de pedidos centralizada", desc: "Recibes los pedidos en un panel, los confirmas, generas albaranes y facturas, y gestionas el envío. Todo desde un solo sitio." },
              { icon: "💬", title: "Chat directo con el taller", desc: "Cada pedido tiene un chat integrado para resolver dudas, gestionar incidencias o confirmar detalles sin salir de la plataforma." },
              { icon: "📊", title: "Visibilidad de tu catálogo completo", desc: "Sube tu catálogo en CSV o Excel y todas tus referencias quedan disponibles para los talleres. Actualiza precios y stock cuando quieras." },
              { icon: "🚚", title: "Logística flexible", desc: "Trabaja con tu propia agencia de transporte o usa las integraciones de la plataforma con GLS, MRW, NACEX, SEUR, Correos Express y CTT Express." },
              { icon: "💰", title: "Cobra con garantía", desc: "Los talleres pagan a través de la plataforma. Con RD Pago, el taller puede aplazar 15 días y tú cobras igualmente." },
            ].map(({ icon, title, desc }) => (
              <div key={title} style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
                <span style={{ fontSize: 28, flexShrink: 0, lineHeight: 1.2 }}>{icon}</span>
                <div>
                  <strong style={{ color: "white", fontSize: 16 }}>{title}</strong>
                  <p style={{ color: "#94a3b8", fontSize: 15, lineHeight: 1.7, marginTop: 4, marginBottom: 0 }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Cómo funciona */}
        <div style={card}>
          <h2 style={{ fontSize: 28, fontWeight: 900, marginBottom: 20 }}>Cómo empezar a vender</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {[
              { n: "1", t: "Regístrate como proveedor", d: "Crea tu cuenta en 2 minutos. Solo necesitas tu CIF, nombre comercial y un email. Verificamos tu cuenta en menos de 24 horas." },
              { n: "2", t: "Sube tu catálogo", d: "Importa tu catálogo en CSV o Excel. Nuestro sistema mapea automáticamente las referencias OEM e IAM para que los talleres puedan encontrar tus piezas." },
              { n: "3", t: "Recibe pedidos", d: "Los talleres buscan por referencia, ven tus precios y hacen el pedido. Tú recibes una notificación y confirmas. Así de simple." },
              { n: "4", t: "Envía y cobra", d: "Preparas el envío, marcas como enviado en la plataforma y el taller recibe la pieza. El pago queda registrado y gestionado." },
            ].map(({ n, t, d }) => (
              <div key={n} style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
                <div style={{ width: 44, height: 44, borderRadius: "50%", background: "linear-gradient(135deg,#22c55e,#16a34a)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 20, flexShrink: 0 }}>{n}</div>
                <div>
                  <strong style={{ color: "white", fontSize: 16 }}>{t}</strong>
                  <p style={{ color: "#94a3b8", fontSize: 15, lineHeight: 1.7, marginTop: 4, marginBottom: 0 }}>{d}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Para quién */}
        <div style={card}>
          <h2 style={{ fontSize: 24, fontWeight: 900, marginBottom: 16 }}>¿Para quién es Recambio Directo?</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {[
              "Distribuidores de recambios que quieren llegar a más talleres sin ampliar su red comercial",
              "Proveedores regionales que quieren vender fuera de su zona habitual",
              "Distribuidores con stock que quieren dar salida a referencias de baja rotación",
              "Empresas del sector que buscan un canal de venta B2B online sin inversión en tecnología",
              "Miembros de grupos de compra (DIPART, ANCERA, AD Parts…) que quieren complementar su canal habitual",
            ].map((item) => (
              <div key={item} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                <span style={{ color: "#22c55e", fontWeight: 900, fontSize: 18, flexShrink: 0 }}>✓</span>
                <span style={{ color: "#cbd5e1", fontSize: 15, lineHeight: 1.6 }}>{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ proveedores */}
        <div style={card}>
          <h2 style={{ fontSize: 24, fontWeight: 900, marginBottom: 20 }}>Preguntas frecuentes para proveedores</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {[
              { q: "¿Cuánto cuesta?", a: "25 €/mes. El primer mes es gratuito y sin compromiso. No hay comisiones por venta ni costes de alta." },
              { q: "¿Necesito integración técnica?", a: "No. Subes tu catálogo en un archivo CSV o Excel y listo. No necesitas conectar tu ERP ni desarrollar nada." },
              { q: "¿Puedo poner mis propios precios?", a: "Sí, tú controlas al 100 % los precios y la disponibilidad de tu catálogo. Puedes actualizar cuando quieras." },
              { q: "¿Cómo gestiono los envíos?", a: "Usas tu propia agencia de transporte. También puedes contratar envíos a través de nuestras integraciones con las principales agencias nacionales." },
              { q: "¿Qué pasa si un taller devuelve una pieza?", a: "La plataforma tiene un módulo de devoluciones integrado. Tú defines tu política y gestionas todo desde el panel, sin papeleos." },
              { q: "¿Hay exclusividad?", a: "No. Puedes seguir vendiendo por tus canales habituales. Recambio Directo es un canal adicional." },
            ].map(({ q, a }) => (
              <div key={q}>
                <strong style={{ color: "white", fontSize: 15 }}>{q}</strong>
                <p style={{ color: "#94a3b8", fontSize: 14, lineHeight: 1.7, marginTop: 4, marginBottom: 0 }}>{a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA final */}
        <div style={{ ...card, background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.3)", textAlign: "center" }}>
          <h2 style={{ fontSize: 28, fontWeight: 900, marginBottom: 12 }}>Empieza a vender hoy</h2>
          <p style={{ color: "#94a3b8", fontSize: 16, marginBottom: 24, maxWidth: 500, margin: "0 auto 24px" }}>
            Date de alta gratis, sube tu catálogo y empieza a recibir pedidos de talleres de toda España.
          </p>
          <a href="/registro" style={{ display: "inline-block", background: "linear-gradient(135deg,#22c55e,#16a34a)", color: "white", padding: "18px 48px", borderRadius: 14, fontWeight: 800, textDecoration: "none", fontSize: 17 }}>
            REGISTRARME COMO PROVEEDOR →
          </a>
          <p style={{ color: "#64748b", fontSize: 13, marginTop: 16 }}>Primer mes gratis · Sin permanencia · Sin comisiones</p>
        </div>

        <div style={{ textAlign: "center", marginTop: 32, color: "#64748b", fontSize: 13 }}>
          <a href="/" style={{ color: "#60a5fa", textDecoration: "none" }}>← Volver a Recambio Directo</a>
        </div>
      </div>
    </main>
  );
}
