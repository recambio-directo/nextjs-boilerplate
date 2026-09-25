import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Buscar recambios por matrícula — Recambio Directo",
  description: "Busca recambios de automoción por matrícula del vehículo. Identifica la pieza exacta, compara precios B2B entre proveedores y recibe en 24h.",
  alternates: { canonical: "https://www.recambio-directo.com/buscar-por-matricula" },
};

const jsonLd = "{\"@context\": \"https://schema.org\", \"@type\": \"HowTo\", \"name\": \"C\u00f3mo buscar recambios por matr\u00edcula\", \"description\": \"Gu\u00eda paso a paso para buscar recambios de automoci\u00f3n por matr\u00edcula del veh\u00edculo en Recambio Directo.\", \"step\": [{\"@type\": \"HowToStep\", \"position\": 1, \"name\": \"Reg\u00edstrate gratis\", \"text\": \"Crea tu cuenta de taller en Recambio Directo. El primer mes es gratuito y la verificaci\u00f3n tarda menos de 24 horas.\"}, {\"@type\": \"HowToStep\", \"position\": 2, \"name\": \"Introduce la matr\u00edcula\", \"text\": \"En el buscador, introduce la matr\u00edcula del veh\u00edculo. El sistema identifica autom\u00e1ticamente marca, modelo, motorizaci\u00f3n y a\u00f1o.\"}, {\"@type\": \"HowToStep\", \"position\": 3, \"name\": \"Selecciona la pieza\", \"text\": \"Elige la categor\u00eda de pieza que necesitas. El sistema muestra solo las referencias compatibles con ese veh\u00edculo concreto.\"}, {\"@type\": \"HowToStep\", \"position\": 4, \"name\": \"Compara y pide\", \"text\": \"Compara precios entre proveedores verificados y haz tu pedido en un clic. Recibe la pieza en 24 horas.\"}], \"url\": \"https://www.recambio-directo.com/buscar-por-matricula\"}";

const steps = [
  { num: "1", title: "Regístrate gratis", desc: "Crea tu cuenta de taller. Primer mes gratuito, verificación en menos de 24h." },
  { num: "2", title: "Introduce la matrícula", desc: "El sistema identifica automáticamente marca, modelo, motorización y año." },
  { num: "3", title: "Selecciona la pieza", desc: "Elige la categoría. Solo ves referencias compatibles con ese vehículo." },
  { num: "4", title: "Compara y pide", desc: "Compara precios entre proveedores verificados. Pide en un clic, recibe en 24h." },
];

export default function Page() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
      <main style={{ minHeight: "100vh", background: "linear-gradient(135deg,#020617,#020b2d)", color: "white", padding: "60px 20px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>

          <nav style={{ marginBottom: 32, fontSize: 13, color: "#64748b" }}>
            <a href="/" style={{ color: "#60a5fa", textDecoration: "none" }}>Inicio</a>
            {" › "}
            <span style={{ color: "#94a3b8" }}>Buscar por matrícula</span>
          </nav>

          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <div style={{ display: "inline-block", background: "rgba(37,99,235,0.15)", color: "#60a5fa", padding: "8px 18px", borderRadius: 999, fontWeight: 700, marginBottom: 20, fontSize: 13, letterSpacing: "0.05em" }}>BÚSQUEDA INTELIGENTE</div>
            <h1 style={{ fontSize: "clamp(36px, 5vw, 56px)", fontWeight: 900, marginBottom: 16, lineHeight: 1.1 }}>
              Buscar recambios por matrícula
            </h1>
            <p style={{ color: "#94a3b8", fontSize: 18, maxWidth: 650, margin: "0 auto", lineHeight: 1.7 }}>
              Introduce la matrícula del vehículo y encuentra la pieza exacta en segundos. Sin errores de compatibilidad, sin devoluciones, sin tiempo perdido.
            </p>
          </div>

          <div style={{ background: "rgba(15,23,42,0.92)", borderRadius: 24, padding: 32, border: "1px solid rgba(255,255,255,0.06)", marginBottom: 24 }}>
            <h2 style={{ fontSize: 28, fontWeight: 900, marginBottom: 24 }}>Cómo funciona</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              {steps.map((s) => (
                <div key={s.num} style={{ display: "flex", gap: 20, alignItems: "flex-start" }}>
                  <div style={{ width: 48, height: 48, borderRadius: "50%", background: "linear-gradient(135deg,#2563eb,#1d4ed8)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 20, flexShrink: 0 }}>{s.num}</div>
                  <div>
                    <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 4 }}>{s.title}</h3>
                    <p style={{ color: "#94a3b8", fontSize: 15, lineHeight: 1.6, margin: 0 }}>{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ background: "rgba(15,23,42,0.92)", borderRadius: 24, padding: 32, border: "1px solid rgba(255,255,255,0.06)", marginBottom: 24 }}>
            <h2 style={{ fontSize: 24, fontWeight: 900, marginBottom: 16 }}>¿Por qué buscar por matrícula?</h2>
            <ul style={{ listStyle: "none", padding: 0, display: "flex", flexDirection: "column", gap: 12 }}>
              {["Identificación exacta del vehículo: marca, modelo, motor y año", "Solo piezas compatibles: cero errores de referencia", "Ahorro de tiempo: de 10 minutos a 30 segundos por búsqueda", "Menos devoluciones: menos costes ocultos para el taller", "Compara precios entre proveedores para la misma pieza"].map((item, i) => (
                <li key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                  <span style={{ color: "#22c55e", fontWeight: 900, fontSize: 18, flexShrink: 0 }}>✓</span>
                  <span style={{ color: "#cbd5e1", fontSize: 15, lineHeight: 1.6 }}>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div style={{ background: "rgba(15,23,42,0.92)", borderRadius: 24, padding: 32, border: "1px solid rgba(255,255,255,0.06)", marginBottom: 24 }}>
            <h2 style={{ fontSize: 24, fontWeight: 900, marginBottom: 16 }}>Más de 2 horas al día recuperadas</h2>
            <p style={{ color: "#94a3b8", fontSize: 15, lineHeight: 1.8, marginBottom: 16 }}>
              Un taller medio realiza entre 10 y 20 búsquedas de piezas al día. Si cada búsqueda manual consume 10 minutos, son entre 100 y 200 minutos diarios solo buscando referencias. Con la búsqueda por matrícula, ese tiempo se reduce a menos de 10 minutos en total.
            </p>
            <p style={{ color: "#94a3b8", fontSize: 15, lineHeight: 1.8 }}>
              Ese tiempo recuperado es tiempo que tu mecánico puede estar en el elevador, produciendo y facturando. A una tarifa media de 40 €/hora, son más de 80 € diarios de capacidad productiva recuperada.
            </p>
          </div>

          <div style={{ textAlign: "center", marginTop: 48 }}>
            <h2 style={{ fontSize: 28, fontWeight: 900, marginBottom: 16 }}>Prueba la búsqueda por matrícula</h2>
            <p style={{ color: "#94a3b8", marginBottom: 24, fontSize: 16 }}>Regístrate gratis y busca con la matrícula de tu próxima reparación.</p>
            <a href="/registro" style={{ display: "inline-block", background: "linear-gradient(135deg,#2563eb,#1d4ed8)", color: "white", padding: "18px 48px", borderRadius: 14, fontWeight: 800, textDecoration: "none", fontSize: 17 }}>
              REGISTRARME GRATIS →
            </a>
          </div>

          <div style={{ textAlign: "center", marginTop: 32, fontSize: 13 }}>
            <a href="/" style={{ color: "#60a5fa", textDecoration: "none" }}>← Volver a Recambio Directo</a>
          </div>
        </div>
      </main>
    </>
  );
}
