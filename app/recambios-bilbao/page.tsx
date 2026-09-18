import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Recambios de Automoción en Bilbao — Marketplace B2B | Recambio Directo",
  description: "Compra recambios de automoción en Bilbao al mejor precio. Marketplace B2B para talleres y proveedores en País Vasco. Piezas OEM e IAM con entrega en 24h.",
  alternates: { canonical: "https://www.recambio-directo.com/recambios-bilbao" },
};

const badge: React.CSSProperties = { display: "inline-block", background: "rgba(37,99,235,0.15)", color: "#60a5fa", padding: "8px 18px", borderRadius: 999, fontWeight: 700, marginBottom: 20, fontSize: 13, letterSpacing: "0.05em" };
const card: React.CSSProperties = { background: "rgba(15,23,42,0.92)", borderRadius: 24, padding: 32, border: "1px solid rgba(255,255,255,0.06)" };

export default function RecambiosBilbaoPage() {
  return (
    <main style={ { minHeight: "100vh", background: "linear-gradient(135deg,#020617,#020b2d)", color: "white", padding: "60px 20px" } }>
      <div style={ { maxWidth: 900, margin: "0 auto" } }>

        <div style={ { textAlign: "center", marginBottom: 48 } }>
          <div style={badge}>RECAMBIOS EN BILBAO</div>
          <h1 style={ { fontSize: "clamp(36px, 5vw, 56px)", fontWeight: 900, marginBottom: 16, lineHeight: 1.1 } }>
            Recambios de automoción en Bilbao
          </h1>
          <p style={ { color: "#94a3b8", fontSize: 18, maxWidth: 650, margin: "0 auto", lineHeight: 1.7 } }>
            Encuentra piezas OEM e IAM para tu taller en Bilbao y País Vasco. Compara precios entre proveedores y recibe en 24 horas.
          </p>
        </div>

        <div style={card}>
          <h2 style={ { fontSize: 28, fontWeight: 900, marginBottom: 16 } }>Marketplace B2B de recambios para talleres en Bilbao</h2>
          <p style={ { color: "#94a3b8", fontSize: 15, lineHeight: 1.8, marginBottom: 16 } }>
            Bilbao cuenta con talleres que trabajan en un entorno climático exigente, con alta demanda de piezas de desgaste como frenos, suspensión y neumáticos. Recambio Directo conecta estos talleres directamente con proveedores verificados, eliminando intermediarios y reduciendo los tiempos de espera en la búsqueda de piezas.
          </p>
          <p style={ { color: "#94a3b8", fontSize: 15, lineHeight: 1.8, marginBottom: 16 } }>
            Nuestra plataforma permite buscar por referencia OEM o IAM entre múltiples proveedores a la vez, comparar precios en tiempo real y hacer el pedido en menos de un minuto. Para los talleres de Bilbao, esto significa menos tiempo al teléfono y más tiempo produciendo.
          </p>
          <p style={ { color: "#94a3b8", fontSize: 15, lineHeight: 1.8 } }>
            Cubrimos todas las zonas: Gran Bilbao, Bizkaia, Gipuzkoa, Álava, Cantabria y Navarra. Los proveedores activos en la plataforma operan en Barakaldo, Getxo, Portugalete, Santurtzi, Basauri, Donostia-San Sebastián, Vitoria-Gasteiz, Irún, Eibar y Durango, entre otras localidades.
          </p>
        </div>

        <div style={ { ...card, marginTop: 24 } }>
          <h2 style={ { fontSize: 24, fontWeight: 900, marginBottom: 16 } }>Ventajas logísticas en País Vasco</h2>
          <p style={ { color: "#94a3b8", fontSize: 15, lineHeight: 1.8 } }>
            El País Vasco cuenta con una red de infraestructuras de transporte que conecta bien con los grandes almacenes del norte peninsular. Los talleres de Bilbao y alrededores reciben piezas con frecuencia diaria, y la proximidad a la frontera francesa facilita el acceso a proveedores europeos de recambios OEM para marcas como Renault, Peugeot y Citroën.
          </p>
        </div>

        <div style={ { ...card, marginTop: 24 } }>
          <h2 style={ { fontSize: 24, fontWeight: 900, marginBottom: 16 } }>¿Qué puedes hacer en Recambio Directo?</h2>
          <ul style={ { listStyle: "none", padding: 0, display: "flex", flexDirection: "column", gap: 12 } }>
            {["Buscar referencias OEM e IAM entre proveedores verificados de " + "País Vasco", "Comparar precios en tiempo real sin llamar a cada proveedor", "Pedir piezas con entrega en 24h en Bilbao y alrededores", "Gestionar pedidos, albaranes y facturas desde un único panel", "Chatear en tiempo real con el proveedor vinculado a cada pedido", "Acceder a RD Pago: compra ahora, paga en 15 días"].map((item, i) => (
              <li key={i} style={ { display: "flex", gap: 10, alignItems: "flex-start" } }>
                <span style={ { color: "#22c55e", fontWeight: 900, fontSize: 18, flexShrink: 0 } }>✓</span>
                <span style={ { color: "#cbd5e1", fontSize: 15, lineHeight: 1.6 } }>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div style={ { textAlign: "center", marginTop: 48 } }>
          <h2 style={ { fontSize: 28, fontWeight: 900, marginBottom: 16 } }>Empieza gratis en Bilbao</h2>
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
