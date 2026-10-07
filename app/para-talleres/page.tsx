import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Recambios para Talleres Mecánicos — Compara Precios B2B | Recambio Directo",
  description: "Compara precios de recambios entre proveedores verificados y recibe en 24h. Más de 300.000 referencias OEM e IAM. Primer mes gratis para talleres.",
  alternates: { canonical: "https://www.recambio-directo.com/para-talleres" },
  openGraph: {
    title: "Recambios para Talleres — Compara Precios B2B",
    description: "Marketplace B2B de recambios para talleres mecánicos en España.",
    type: "website",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  "name": "Recambio Directo para Talleres",
  "description": "Marketplace B2B de recambios de automoción para talleres mecánicos. Compara precios entre proveedores y recibe en 24h.",
  "url": "https://www.recambio-directo.com/para-talleres",
  "publisher": {
    "@type": "Organization",
    "name": "Recambio Directo",
    "url": "https://www.recambio-directo.com",
    "logo": "https://www.recambio-directo.com/icons/manifest-icon-512.maskable.png",
  },
};

const card: React.CSSProperties = { background: "rgba(15,23,42,0.92)", borderRadius: 24, padding: 32, border: "1px solid rgba(255,255,255,0.06)", marginBottom: 24 };

export default function ParaTalleresPage() {
  return (
    <main style={{ minHeight: "100vh", background: "linear-gradient(135deg,#020617,#020b2d)", color: "white", padding: "60px 20px" }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div style={{ maxWidth: 900, margin: "0 auto" }}>

        {/* Hero */}
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <div style={{ display: "inline-block", background: "rgba(37,99,235,0.15)", color: "#60a5fa", padding: "8px 18px", borderRadius: 999, fontWeight: 700, marginBottom: 20, fontSize: 13, letterSpacing: "0.05em" }}>PARA TALLERES MECÁNICOS</div>
          <h1 style={{ fontSize: "clamp(36px, 5vw, 56px)", fontWeight: 900, marginBottom: 20, lineHeight: 1.1 }}>
            Compra recambios al mejor precio sin perder tiempo
          </h1>
          <p style={{ color: "#94a3b8", fontSize: 18, maxWidth: 650, margin: "0 auto", lineHeight: 1.7 }}>
            Busca una referencia y ve los precios de varios proveedores a la vez. Pide online y recibe en 24 horas. Sin llamadas, sin esperas.
          </p>
          <div style={{ marginTop: 32, display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <a href="/registro" style={{ display: "inline-block", background: "linear-gradient(135deg,#2563eb,#1d4ed8)", color: "white", padding: "18px 48px", borderRadius: 14, fontWeight: 800, textDecoration: "none", fontSize: 17 }}>
              PROBAR GRATIS →
            </a>
          </div>
          <p style={{ color: "#64748b", fontSize: 13, marginTop: 12 }}>Primer mes gratis · Sin permanencia · 25 €/mes después</p>
        </div>

        {/* El problema */}
        <div style={card}>
          <h2 style={{ fontSize: 26, fontWeight: 900, marginBottom: 16 }}>El problema que resolvemos</h2>
          <p style={{ color: "#cbd5e1", fontSize: 16, lineHeight: 1.9 }}>
            Cada vez que necesitas una pieza, pierdes 10-15 minutos llamando a proveedores, esperando presupuestos y comparando a mano. Multiplícalo por las reparaciones del día y son horas de trabajo perdidas que podrías dedicar a producir.
          </p>
          <p style={{ color: "#cbd5e1", fontSize: 16, lineHeight: 1.9, marginTop: 16 }}>
            Además, si siempre pides al mismo proveedor sin comparar, estás pagando de más. Los precios de una misma referencia varían un 15-30 % entre distribuidores.
          </p>
        </div>

        {/* Cómo funciona */}
        <div style={card}>
          <h2 style={{ fontSize: 26, fontWeight: 900, marginBottom: 20 }}>Cómo funciona</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            {[
              { n: "1", t: "Busca tu referencia", d: "Introduce la referencia OEM, IAM o el nombre de la pieza. El sistema busca entre más de 300.000 referencias de proveedores verificados en toda España.", icon: "🔍" },
              { n: "2", t: "Compara precios al instante", d: "Ves los precios de todos los proveedores que tienen esa pieza en stock. Sin llamar a nadie, sin esperar presupuestos. En una sola pantalla.", icon: "📊" },
              { n: "3", t: "Haz tu pedido en 1 minuto", d: "Selecciona el proveedor que prefieras, confirma el pedido y listo. Recibes la pieza en 24-48 horas con seguimiento incluido.", icon: "🛒" },
              { n: "4", t: "Gestiona todo desde el panel", d: "Historial de pedidos, albaranes, facturas, devoluciones y chat con el proveedor. Todo en un solo sitio, sin papeleos.", icon: "📋" },
            ].map(({ n, t, d, icon }) => (
              <div key={n} style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
                <div style={{ width: 48, height: 48, borderRadius: "50%", background: "linear-gradient(135deg,#2563eb,#1d4ed8)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 22, flexShrink: 0 }}>{n}</div>
                <div>
                  <strong style={{ color: "white", fontSize: 17 }}>{icon} {t}</strong>
                  <p style={{ color: "#94a3b8", fontSize: 15, lineHeight: 1.7, marginTop: 6, marginBottom: 0 }}>{d}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Ventajas */}
        <div style={card}>
          <h2 style={{ fontSize: 26, fontWeight: 900, marginBottom: 20 }}>Qué gana tu taller</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 16 }}>
            {[
              { t: "Ahorra un 15-20 %", d: "Comparando entre proveedores en cada pedido, el ahorro medio está entre el 15 y el 20 % respecto a pedir siempre al mismo." },
              { t: "Recupera 1-2 horas al día", d: "Sin llamadas ni esperas. Buscar, comparar y pedir lleva menos de un minuto por referencia." },
              { t: "Paga a 15 días", d: "Con RD Pago puedes comprar ahora y pagar en 15 días sin intereses. Cobra al cliente antes de pagar la pieza." },
              { t: "Todo documentado", d: "Albaranes y facturas generados automáticamente. Historial completo de compras para tu contabilidad." },
              { t: "Proveedores verificados", d: "Todos los proveedores de la plataforma están verificados. Si hay un problema, tienes un módulo de devoluciones integrado." },
              { t: "Cobertura nacional", d: "Proveedores en toda España peninsular. Entrega en 24h en la mayoría de destinos." },
            ].map(({ t, d }) => (
              <div key={t} style={{ background: "rgba(37,99,235,0.05)", borderRadius: 16, padding: "20px 20px", border: "1px solid rgba(37,99,235,0.1)" }}>
                <strong style={{ color: "white", fontSize: 15 }}>{t}</strong>
                <p style={{ color: "#94a3b8", fontSize: 14, lineHeight: 1.7, marginTop: 8, marginBottom: 0 }}>{d}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Marcas */}
        <div style={card}>
          <h2 style={{ fontSize: 24, fontWeight: 900, marginBottom: 16 }}>Marcas disponibles</h2>
          <p style={{ color: "#94a3b8", fontSize: 15, lineHeight: 1.8, marginBottom: 20 }}>
            Encuentra piezas de las principales marcas del aftermarket entre los catálogos de nuestros proveedores:
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {[
              { nombre: "Bosch", href: "/marcas/bosch" },
              { nombre: "Brembo", href: "/marcas/brembo" },
              { nombre: "Valeo", href: "/marcas/valeo" },
              { nombre: "MANN-FILTER", href: "/marcas/mann-filter" },
              { nombre: "Sachs", href: "/marcas/sachs" },
              { nombre: "LuK", href: "/marcas/luk" },
              { nombre: "TRW", href: "/marcas/trw" },
              { nombre: "Monroe", href: "/marcas/monroe" },
              { nombre: "NGK", href: "/marcas/ngk" },
              { nombre: "Denso", href: "/marcas/denso" },
              { nombre: "Continental", href: "/marcas/continental" },
              { nombre: "SKF", href: "/marcas/skf" },
              { nombre: "Gates", href: "/marcas/gates" },
              { nombre: "INA", href: "/marcas/ina" },
              { nombre: "Febi Bilstein", href: "/marcas/febi-bilstein" },
            ].map(({ nombre, href }) => (
              <a key={nombre} href={href} style={{ background: "rgba(37,99,235,0.1)", border: "1px solid rgba(37,99,235,0.2)", color: "#93c5fd", padding: "6px 14px", borderRadius: 999, fontSize: 13, fontWeight: 600, textDecoration: "none" }}>{nombre}</a>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <div style={card}>
          <h2 style={{ fontSize: 24, fontWeight: 900, marginBottom: 20 }}>Preguntas frecuentes</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {[
              { q: "¿Cuánto cuesta?", a: "25 €/mes. El primer mes es gratuito y sin compromiso. Sin permanencia ni costes ocultos." },
              { q: "¿Qué tipo de piezas hay?", a: "Más de 300.000 referencias OEM e IAM: frenos, filtros, embragues, suspensión, distribución, aceites, baterías y mucho más." },
              { q: "¿Cuánto tarda la entrega?", a: "24-48 horas en España peninsular con las principales agencias (GLS, MRW, NACEX, SEUR, Correos Express, CTT Express)." },
              { q: "¿Puedo devolver una pieza?", a: "Sí. Cada proveedor tiene su política de devoluciones y puedes gestionar todo desde la plataforma, sin papeleos." },
              { q: "¿Cómo funciona RD Pago?", a: "Compra ahora y paga en 15 días sin intereses. Se activa automáticamente tras 1 mes de actividad y 1 pago con tarjeta." },
              { q: "¿Necesito contrato o permanencia?", a: "No. Puedes darte de baja cuando quieras, sin penalizaciones." },
            ].map(({ q, a }) => (
              <div key={q}>
                <strong style={{ color: "white", fontSize: 15 }}>{q}</strong>
                <p style={{ color: "#94a3b8", fontSize: 14, lineHeight: 1.7, marginTop: 4, marginBottom: 0 }}>{a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA final */}
        <div style={{ ...card, background: "rgba(37,99,235,0.1)", border: "1px solid rgba(37,99,235,0.3)", textAlign: "center" }}>
          <h2 style={{ fontSize: 28, fontWeight: 900, marginBottom: 12 }}>Deja de perder tiempo buscando recambios</h2>
          <p style={{ color: "#94a3b8", fontSize: 16, marginBottom: 24, maxWidth: 500, margin: "0 auto 24px" }}>
            Regístrate gratis, busca tu primera referencia y comprueba la diferencia.
          </p>
          <a href="/registro" style={{ display: "inline-block", background: "linear-gradient(135deg,#2563eb,#1d4ed8)", color: "white", padding: "18px 48px", borderRadius: 14, fontWeight: 800, textDecoration: "none", fontSize: 17 }}>
            EMPEZAR GRATIS →
          </a>
        </div>

        {/* Links */}
        <div style={{ textAlign: "center", marginTop: 32, color: "#64748b", fontSize: 13 }}>
          <a href="/para-proveedores" style={{ color: "#60a5fa", textDecoration: "none" }}>¿Eres proveedor?</a>
          {" · "}
          <a href="/blog" style={{ color: "#60a5fa", textDecoration: "none" }}>Blog</a>
          {" · "}
          <a href="/" style={{ color: "#60a5fa", textDecoration: "none" }}>Inicio</a>
        </div>
      </div>
    </main>
  );
}
