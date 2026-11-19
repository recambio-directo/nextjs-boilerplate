import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Gestión de pedidos de recambios para distribuidores",
  description:
    "Recibe, prepara y envía pedidos de recambios de talleres desde un solo panel: stock sincronizado por FTP o API, albaranes, etiquetas de 6 agencias y devoluciones. 25 €/mes.",
  alternates: { canonical: "https://www.recambio-directo.com/gestion-pedidos-recambios" },
};

const faqs = [
  {
    q: "¿Tengo que cambiar mi programa de gestión (ERP)?",
    a: "No. Recambio Directo se conecta a tu programa actual: subes tu stock y tarifas por FTP, CSV o API y la plataforma se encarga de los pedidos que entran por el canal online. Tu ERP sigue siendo tu sistema de facturación y almacén.",
  },
  {
    q: "¿Cómo se mantiene actualizado el stock?",
    a: "Con una sincronización automática diaria por FTP, subiendo un CSV desde el panel o en tiempo real con la API de stock (actualización de una referencia, por lotes o completa).",
  },
  {
    q: "¿Qué pasa cuando un taller hace un pedido?",
    a: "Recibes un aviso por email y en el panel, preparas el pedido, generas el albarán y la etiqueta de la agencia de transporte desde la propia plataforma, y el taller ve el seguimiento. Todo queda registrado: pedidos, albaranes, facturas y devoluciones.",
  },
  {
    q: "¿Cuánto cuesta?",
    a: "25 € al mes sin permanencia y sin comisión por venta. El primer mes es gratis.",
  },
];

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebPage",
      name: "Gestión de pedidos de recambios para distribuidores",
      url: "https://www.recambio-directo.com/gestion-pedidos-recambios",
      isPartOf: { "@id": "https://www.recambio-directo.com/#website" },
      breadcrumb: {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Inicio", item: "https://www.recambio-directo.com" },
          { "@type": "ListItem", position: 2, name: "Para proveedores", item: "https://www.recambio-directo.com/para-proveedores" },
          { "@type": "ListItem", position: 3, name: "Gestión de pedidos de recambios" },
        ],
      },
    },
    {
      "@type": "FAQPage",
      mainEntity: faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
    },
  ],
};

const card: React.CSSProperties = { background: "rgba(15,23,42,0.92)", borderRadius: 24, padding: 32, border: "1px solid rgba(255,255,255,0.06)", marginTop: 24 };
const texto: React.CSSProperties = { color: "#94a3b8", fontSize: 15, lineHeight: 1.8, margin: "0 0 14px" };
const enlace: React.CSSProperties = { color: "#60a5fa", textDecoration: "none" };

const pasos = [
  { t: "1. Tu stock, siempre al día", d: "Conecta tu catálogo por FTP, CSV o API. Cada referencia se cruza automáticamente con sus equivalencias OEM e IAM, así que los talleres te encuentran aunque busquen por la referencia original del fabricante." },
  { t: "2. Entra el pedido", d: "El taller compara precios y pide. Tú recibes el aviso al instante por email y en la campana de notificaciones del panel, con los datos del taller y la dirección de entrega." },
  { t: "3. Preparación y albarán", d: "Preparas el pedido y generas el albarán desde la plataforma, con el IVA (o IGIC en Canarias) calculado según el destino. Sin hojas de cálculo ni llamadas para confirmar referencias." },
  { t: "4. Envío con tu agencia", d: "Genera la etiqueta de DHL, CTT Express, Correos Express, MRW, NACEX o SEUR/GLS desde el pedido. El taller ve el seguimiento sin tener que llamarte." },
  { t: "5. Devoluciones ordenadas", d: "Si el taller necesita devolver una pieza, la solicitud, el acuerdo y la recogida se gestionan desde el mismo pedido, con avisos en cada paso." },
];

export default function GestionPedidosRecambiosPage() {
  return (
    <main style={{ minHeight: "100vh", background: "linear-gradient(135deg,#020617,#020b2d)", color: "white", padding: "60px 20px" }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <nav aria-label="Migas de pan" style={{ marginBottom: 32, fontSize: 13, color: "#64748b" }}>
          <a href="/" style={enlace}>Inicio</a>{" › "}
          <a href="/para-proveedores" style={enlace}>Para proveedores</a>{" › "}
          <span style={{ color: "#94a3b8" }}>Gestión de pedidos de recambios</span>
        </nav>

        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div style={{ display: "inline-block", background: "rgba(37,99,235,0.15)", color: "#60a5fa", padding: "8px 18px", borderRadius: 999, fontWeight: 700, marginBottom: 20, fontSize: 13, letterSpacing: "0.05em" }}>
            PARA DISTRIBUIDORES Y RECAMBISTAS
          </div>
          <h1 style={{ fontSize: "clamp(34px, 5vw, 52px)", fontWeight: 900, marginBottom: 16, lineHeight: 1.1 }}>
            Gestión de pedidos de recambios para distribuidores
          </h1>
          <p style={{ color: "#94a3b8", fontSize: 18, maxWidth: 680, margin: "0 auto", lineHeight: 1.7 }}>
            Recibe pedidos de talleres de toda España, prepáralos y envíalos desde un solo panel, con tu stock sincronizado y sin cambiar tu programa de gestión.
          </p>
        </div>

        <section style={card}>
          <h2 style={{ fontSize: 26, fontWeight: 900, margin: "0 0 14px" }}>El problema: pedidos por teléfono, WhatsApp y email</h2>
          <p style={texto}>
            La mayoría de distribuidores de recambios siguen recibiendo los pedidos de los talleres por cinco canales a la vez. Cada pedido supone confirmar la referencia,
            buscar la equivalencia si no hay stock, pasar el precio, apuntar la dirección y llamar a la agencia. Es tiempo de mostrador que no se factura.
          </p>
          <p style={{ ...texto, margin: 0 }}>
            Recambio Directo centraliza todo eso: el taller busca por referencia, matrícula o bastidor, ve tu precio y tu stock, y te llega un pedido cerrado, listo para preparar.
          </p>
        </section>

        <section style={card}>
          <h2 style={{ fontSize: 26, fontWeight: 900, margin: "0 0 18px" }}>Cómo funciona la preparación de pedidos</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            {pasos.map((p) => (
              <div key={p.t}>
                <h3 style={{ fontSize: 18, fontWeight: 800, margin: "0 0 6px", color: "#e2e8f0" }}>{p.t}</h3>
                <p style={{ ...texto, margin: 0 }}>{p.d}</p>
              </div>
            ))}
          </div>
        </section>

        <section style={card}>
          <h2 style={{ fontSize: 26, fontWeight: 900, margin: "0 0 14px" }}>Un canal de venta B2B, no otro ERP</h2>
          <p style={texto}>
            No tienes que sustituir tu sistema de gestión de recambios. Recambio Directo es el canal por el que te llegan pedidos nuevos de talleres que hoy no te conocen,
            y la herramienta con la que los preparas y envías. Tu programa sigue llevando tu almacén y tu facturación.
          </p>
          <p style={{ ...texto, margin: 0 }}>
            Cuesta 25 €/mes, sin permanencia y sin comisión por venta: lo que vendes es tuyo. El primer mes es gratis. Más detalles en{" "}
            <a href="/para-proveedores" style={enlace}>Recambio Directo para proveedores</a> y en la guía{" "}
            <a href="/blog/vender-recambios-online-b2b" style={enlace}>cómo vender recambios online en el canal B2B</a>.
          </p>
        </section>

        <section style={card}>
          <h2 style={{ fontSize: 26, fontWeight: 900, margin: "0 0 18px" }}>Preguntas frecuentes</h2>
          {faqs.map((f) => (
            <div key={f.q} style={{ marginBottom: 18 }}>
              <h3 style={{ fontSize: 17, fontWeight: 800, margin: "0 0 6px", color: "#e2e8f0" }}>{f.q}</h3>
              <p style={{ ...texto, margin: 0 }}>{f.a}</p>
            </div>
          ))}
        </section>

        <div style={{ textAlign: "center", marginTop: 48 }}>
          <h2 style={{ fontSize: 28, fontWeight: 900, marginBottom: 16 }}>Empieza a recibir pedidos de talleres</h2>
          <p style={{ color: "#94a3b8", marginBottom: 24, fontSize: 16 }}>Primer mes gratis. Sin permanencia. 25 €/mes después, sin comisiones.</p>
          <a href="/registro?tipo=proveedor" style={{ display: "inline-block", background: "linear-gradient(135deg,#2563eb,#1d4ed8)", color: "white", padding: "18px 48px", borderRadius: 14, fontWeight: 800, textDecoration: "none", fontSize: 17 }}>
            DARME DE ALTA COMO PROVEEDOR →
          </a>
        </div>
      </div>
    </main>
  );
}
