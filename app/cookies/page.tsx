export default function CookiesPage() {
  return (
    <main style={{ minHeight: "100vh", background: "linear-gradient(180deg,#020617,#0f172a)", color: "white", padding: "60px 20px" }}>
      <div style={{ maxWidth: 800, margin: "0 auto" }}>
        <a href="/" style={{ color: "#60a5fa", textDecoration: "none", fontSize: 14, fontWeight: 600 }}>← Volver al inicio</a>
        <div style={{ background: "rgba(15,23,42,0.92)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 24, padding: "48px", marginTop: 24 }}>
          <div style={{ display: "inline-block", background: "rgba(37,99,235,0.15)", color: "#60a5fa", padding: "8px 16px", borderRadius: 999, fontWeight: 700, fontSize: 13, marginBottom: 24 }}>LEGAL</div>
          <h1 style={{ fontSize: 36, fontWeight: 900, marginBottom: 8 }}>Política de Cookies</h1>
          <p style={{ color: "#94a3b8", fontSize: 14, marginBottom: 40 }}>Última actualización: Junio 2026</p>

          <Section title="1. ¿QUÉ SON LAS COOKIES?">
            Las cookies son pequeños archivos de texto que se almacenan en su dispositivo cuando visita un sitio web. Nos permiten recordar sus preferencias y mejorar su experiencia de navegación.
          </Section>

          <Section title="2. COOKIES TÉCNICAS (NECESARIAS)">
            Son imprescindibles para el funcionamiento de la plataforma. Sin ellas no podría iniciar sesión ni usar los servicios. No requieren su consentimiento.
          </Section>

          <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, padding: "20px", marginBottom: 32 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 2fr 1fr", gap: 12, marginBottom: 10, color: "#60a5fa", fontSize: 12, fontWeight: 800 }}>
              <div>COOKIE</div><div>PROVEEDOR</div><div>FINALIDAD</div><div>DURACIÓN</div>
            </div>
            {[
              ["sb-auth-token", "Supabase", "Mantener la sesión iniciada", "Sesión"],
              ["sb-refresh-token", "Supabase", "Renovar la sesión automáticamente", "7 días"],
              ["_vercel_analytics", "Vercel", "Análisis de visitas anónimo", "1 año"],
            ].map(([cookie, prov, fin, dur]) => (
              <div key={cookie} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 2fr 1fr", gap: 12, padding: "10px 0", borderTop: "1px solid rgba(255,255,255,0.04)", color: "#cbd5e1", fontSize: 13 }}>
                <div style={{ fontWeight: 700, color: "white" }}>{cookie}</div>
                <div>{prov}</div>
                <div>{fin}</div>
                <div>{dur}</div>
              </div>
            ))}
          </div>

          <Section title="3. GESTIÓN DE COOKIES">
            Puede configurar su navegador para bloquear o eliminar cookies desde la configuración de privacidad de cada navegador (Chrome, Firefox, Safari, Edge). Tenga en cuenta que bloquear las cookies técnicas puede impedir el correcto funcionamiento de la plataforma.
          </Section>

          <div style={{ marginTop: 40, paddingTop: 24, borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", gap: 16, flexWrap: "wrap" as const }}>
            <a href="/terminos" style={legalLink}>Términos y Condiciones</a>
            <a href="/privacidad" style={legalLink}>Política de Privacidad</a>
            <a href="/aviso-legal" style={legalLink}>Aviso Legal</a>
          </div>
        </div>
      </div>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 32 }}>
      <h2 style={{ fontSize: 16, fontWeight: 800, color: "#60a5fa", marginBottom: 12, textTransform: "uppercase" as const, letterSpacing: "0.05em" }}>{title}</h2>
      <p style={{ color: "#cbd5e1", fontSize: 15, lineHeight: 1.8 }}>{children}</p>
    </div>
  );
}

const legalLink = { color: "#94a3b8", fontSize: 13, textDecoration: "none", fontWeight: 600 };