"use client";

export default function QuienesSomosPage() {
  return (
    <main style={mainStyle}>
      <div style={wrapper}>

        <div style={hero}>
          <div style={heroBadge}>SOBRE NOSOTROS</div>
          <h1 style={heroTitle}>Quiénes Somos</h1>
          <p style={heroText}>La plataforma B2B de recambios de automoción más eficiente de España.</p>
        </div>

        <div style={grid}>
          <div style={card}>
            <div style={iconBox}>🚗</div>
            <h2 style={cardTitle}>Nuestra misión</h2>
            <p style={cardText}>
              Recambio Directo nació para transformar la forma en que talleres y proveedores de recambios se relacionan. Eliminamos intermediarios, reducimos costes y agilizamos el proceso de compra de piezas de automoción.
            </p>
          </div>
          <div style={card}>
            <div style={iconBox}>🤝</div>
            <h2 style={cardTitle}>Para profesionales</h2>
            <p style={cardText}>
              Somos un marketplace exclusivamente B2B. Trabajamos con talleres mecánicos, carrocerías y proveedores de recambios que buscan eficiencia, transparencia y mejores precios en sus operaciones diarias.
            </p>
          </div>
          <div style={card}>
            <div style={iconBox}>⚡</div>
            <h2 style={cardTitle}>Tecnología al servicio del sector</h2>
            <p style={cardText}>
              Nuestra plataforma permite buscar referencias OEM e IAM, comparar precios entre proveedores, gestionar pedidos, comunicarse en tiempo real y controlar el stock, todo desde un único lugar.
            </p>
          </div>
        </div>

        <div style={statsRow}>
          {[
            { num: "100%", label: "Profesional B2B" },
            { num: "24/7", label: "Disponibilidad" },
            { num: "OEM+IAM", label: "Referencias" },
            { num: "España", label: "Cobertura nacional" },
          ].map(({ num, label }) => (
            <div key={label} style={statCard}>
              <h2 style={statNum}>{num}</h2>
              <p style={statLabel}>{label}</p>
            </div>
          ))}
        </div>

        <div style={section}>
          <h2 style={sectionTitle}>¿Por qué Recambio Directo?</h2>
          <div style={listGrid}>
            {[
              "Búsqueda instantánea de referencias OEM e IAM entre múltiples proveedores",
              "Chat en tiempo real con proveedores vinculado a cada pedido",
              "Gestión completa de pedidos, tracking y facturación",
              "Exclusividad de precios: cada proveedor controla quién ve sus tarifas",
              "Publicación de piezas sueltas y excedentes de stock",
              "Importación masiva de catálogo desde Excel",
            ].map((item, i) => (
              <div key={i} style={listItem}>
                <span style={checkIcon}>✓</span>
                <p style={{ margin: 0, fontSize: 15, lineHeight: 1.6 }}>{item}</p>
              </div>
            ))}
          </div>
        </div>

        <div style={contactBox}>
          <h2 style={{ fontWeight: 900, fontSize: 28, marginBottom: 12 }}>¿Tienes alguna pregunta?</h2>
          <p style={{ color: "#94a3b8", marginBottom: 24 }}>Estamos aquí para ayudarte a sacar el máximo partido a la plataforma.</p>
          <a href="mailto:info@recambiodirecto.es" style={btnContacto}>
            ✉️ Contactar con nosotros
          </a>
        </div>

      </div>
    </main>
  );
}

const mainStyle = { minHeight: "100vh", background: "linear-gradient(135deg,#020617,#020b2d)", color: "white", padding: "60px 40px" };
const wrapper = { maxWidth: 1100, margin: "0 auto" };
const hero = { textAlign: "center" as const, marginBottom: 60 };
const heroBadge = { display: "inline-block", background: "rgba(37,99,235,0.15)", color: "#60a5fa", padding: "8px 18px", borderRadius: 999, fontWeight: 700, marginBottom: 20, fontSize: 13 };
const heroTitle = { fontSize: 64, fontWeight: 900, marginBottom: 20 };
const heroText = { color: "#94a3b8", fontSize: 20, maxWidth: 600, margin: "0 auto" };
const grid = { display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 24, marginBottom: 48 };
const card = { background: "rgba(15,23,42,0.92)", borderRadius: 24, padding: 32, border: "1px solid rgba(255,255,255,0.06)" };
const iconBox = { fontSize: 40, marginBottom: 20 };
const cardTitle = { fontSize: 22, fontWeight: 900, marginBottom: 14 };
const cardText = { color: "#94a3b8", fontSize: 15, lineHeight: 1.7 };
const statsRow = { display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 20, marginBottom: 60 };
const statCard = { background: "rgba(37,99,235,0.1)", border: "1px solid rgba(37,99,235,0.2)", borderRadius: 20, padding: "28px", textAlign: "center" as const };
const statNum = { fontSize: 36, fontWeight: 900, color: "#60a5fa", marginBottom: 8 };
const statLabel = { color: "#94a3b8", fontSize: 14 };
const section = { background: "rgba(15,23,42,0.92)", borderRadius: 24, padding: 40, marginBottom: 40, border: "1px solid rgba(255,255,255,0.06)" };
const sectionTitle = { fontSize: 32, fontWeight: 900, marginBottom: 28 };
const listGrid = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 };
const listItem = { display: "flex", gap: 12, alignItems: "flex-start" };
const checkIcon = { color: "#22c55e", fontWeight: 900, fontSize: 18, flexShrink: 0, marginTop: 2 };
const contactBox = { background: "linear-gradient(135deg,rgba(37,99,235,0.15),rgba(37,99,235,0.05))", border: "1px solid rgba(37,99,235,0.2)", borderRadius: 24, padding: 48, textAlign: "center" as const };
const btnContacto = { display: "inline-block", background: "linear-gradient(135deg,#2563eb,#1d4ed8)", color: "white", padding: "16px 32px", borderRadius: 14, fontWeight: 800, textDecoration: "none", fontSize: 16 };