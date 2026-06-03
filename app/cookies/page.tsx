"use client";

export default function CookiesPage() {
  return (
    <main style={mainStyle}>
      <div style={wrapper}>
        <div style={header}>
          <div style={badge}>LEGAL</div>
          <h1 style={title}>Política de Cookies</h1>
          <p style={subtitle}>Última actualización: junio de 2026</p>
        </div>

        <div style={content}>

          <Seccion titulo="1. ¿Qué son las cookies?">
            <p>Las cookies son pequeños archivos de texto que se almacenan en su dispositivo cuando visita un sitio web. Permiten que el sitio recuerde sus acciones y preferencias durante un período de tiempo.</p>
          </Seccion>

          <Seccion titulo="2. Cookies que utilizamos">
            <p>Recambio Directo utiliza únicamente cookies técnicas estrictamente necesarias para el funcionamiento de la plataforma:</p>
            <div style={cookieTable}>
              <div style={cookieRow}>
                <div style={cookieCol}><strong>sb-auth-token</strong></div>
                <div style={cookieCol}>Técnica / Sesión</div>
                <div style={cookieCol}>Mantiene su sesión iniciada en la plataforma</div>
              </div>
              <div style={cookieRow}>
                <div style={cookieCol}><strong>sb-refresh-token</strong></div>
                <div style={cookieCol}>Técnica / 7 días</div>
                <div style={cookieCol}>Renueva automáticamente su sesión</div>
              </div>
              <div style={cookieRow}>
                <div style={cookieCol}><strong>next-auth</strong></div>
                <div style={cookieCol}>Técnica / Sesión</div>
                <div style={cookieCol}>Gestión de autenticación segura</div>
              </div>
            </div>
            <p>No utilizamos cookies de seguimiento, publicidad o análisis de terceros.</p>
          </Seccion>

          <Seccion titulo="3. Cookies técnicas necesarias">
            <p>Las cookies técnicas son imprescindibles para el funcionamiento de la plataforma. Sin ellas no sería posible iniciar sesión, mantener su cesta de compra o acceder a las funciones del panel.</p>
            <p>Por su carácter estrictamente necesario, estas cookies no requieren su consentimiento según la normativa vigente (LSSI-CE y RGPD).</p>
          </Seccion>

          <Seccion titulo="4. Cookies de terceros">
            <p>Actualmente Recambio Directo no utiliza cookies de terceros para publicidad ni analítica. En caso de incorporarlas en el futuro, le informaremos y solicitaremos su consentimiento previo.</p>
          </Seccion>

          <Seccion titulo="5. Cómo gestionar las cookies">
            <p>Puede configurar su navegador para bloquear o eliminar cookies. Tenga en cuenta que bloquear las cookies técnicas impedirá el correcto funcionamiento de la plataforma.</p>
            <ul>
              <li><strong>Chrome:</strong> Configuración → Privacidad y seguridad → Cookies</li>
              <li><strong>Firefox:</strong> Opciones → Privacidad y seguridad → Cookies</li>
              <li><strong>Safari:</strong> Preferencias → Privacidad → Cookies</li>
              <li><strong>Edge:</strong> Configuración → Privacidad → Cookies</li>
            </ul>
          </Seccion>

          <Seccion titulo="6. Actualizaciones">
            <p>Podemos actualizar esta política cuando incorporemos nuevas funcionalidades o cambios en el uso de cookies. Le notificaremos cualquier cambio relevante mediante un aviso en la plataforma.</p>
          </Seccion>

        </div>

        <div style={footer}>
          <p>Para consultas sobre cookies: <a href="mailto:privacidad@recambiodirecto.es" style={link}>privacidad@recambiodirecto.es</a></p>
          <a href="/" style={btnVolver}>← Volver al inicio</a>
        </div>
      </div>
    </main>
  );
}

function Seccion({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div style={seccionStyle}>
      <h2 style={seccionTitulo}>{titulo}</h2>
      <div style={seccionContent}>{children}</div>
    </div>
  );
}

const mainStyle = { minHeight: "100vh", background: "linear-gradient(135deg,#020617,#020b2d)", color: "white", padding: "60px 40px" };
const wrapper = { maxWidth: 860, margin: "0 auto" };
const header = { textAlign: "center" as const, marginBottom: 48 };
const badge = { display: "inline-block", background: "rgba(37,99,235,0.15)", color: "#60a5fa", padding: "8px 18px", borderRadius: 999, fontWeight: 700, marginBottom: 16, fontSize: 13 };
const title = { fontSize: 52, fontWeight: 900, marginBottom: 12 };
const subtitle = { color: "#94a3b8", fontSize: 15 };
const content = { display: "flex", flexDirection: "column" as const, gap: 4 };
const seccionStyle = { background: "rgba(15,23,42,0.92)", borderRadius: 20, padding: "28px 32px", border: "1px solid rgba(255,255,255,0.06)", marginBottom: 12 };
const seccionTitulo = { fontSize: 20, fontWeight: 900, marginBottom: 16, color: "#60a5fa" };
const seccionContent = { color: "#cbd5e1", fontSize: 15, lineHeight: 1.8 };
const cookieTable = { background: "#020617", borderRadius: 12, overflow: "hidden", marginBottom: 16, border: "1px solid rgba(255,255,255,0.06)" };
const cookieRow = { display: "grid", gridTemplateColumns: "1.5fr 1fr 2fr", gap: 16, padding: "12px 16px", borderBottom: "1px solid rgba(255,255,255,0.04)", fontSize: 13 };
const cookieCol = { color: "#cbd5e1" };
const footer = { marginTop: 40, textAlign: "center" as const, color: "#94a3b8" };
const link = { color: "#60a5fa", textDecoration: "none" };
const btnVolver = { display: "inline-block", marginTop: 16, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "white", padding: "12px 24px", borderRadius: 12, textDecoration: "none", fontWeight: 700 };