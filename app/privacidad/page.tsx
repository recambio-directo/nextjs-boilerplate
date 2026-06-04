export default function PrivacidadPage() {
  return (
    <main style={{ minHeight: "100vh", background: "linear-gradient(180deg,#020617,#0f172a)", color: "white", padding: "60px 20px" }}>
      <div style={{ maxWidth: 800, margin: "0 auto" }}>
        <a href="/" style={{ color: "#60a5fa", textDecoration: "none", fontSize: 14, fontWeight: 600 }}>← Volver al inicio</a>
        <div style={{ background: "rgba(15,23,42,0.92)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 24, padding: "48px", marginTop: 24 }}>
          <div style={{ display: "inline-block", background: "rgba(37,99,235,0.15)", color: "#60a5fa", padding: "8px 16px", borderRadius: 999, fontWeight: 700, fontSize: 13, marginBottom: 24 }}>LEGAL</div>
          <h1 style={{ fontSize: 36, fontWeight: 900, marginBottom: 8 }}>Política de Privacidad</h1>
          <p style={{ color: "#94a3b8", fontSize: 14, marginBottom: 40 }}>Última actualización: Junio 2026</p>

          <Section title="1. RESPONSABLE DEL TRATAMIENTO">
            <strong>Vicente de Paco Cabeza</strong> — NIF: 77856096S<br />
            C/ Sola Nº16, 30430 Cehegín (Murcia), España<br />
            Email: info@recambio-directo.com · Tel: 744487895
          </Section>

          <Section title="2. DATOS QUE RECOPILAMOS">
            Al registrarse y usar Recambio Directo, recopilamos: datos de identificación (nombre de empresa, CIF/NIF), datos de contacto (email, teléfono, dirección, código postal), datos de uso (historial de pedidos, piezas publicadas, conversaciones en chat) y datos técnicos (dirección IP, navegador, páginas visitadas).
          </Section>

          <Section title="3. FINALIDAD Y BASE JURÍDICA">
            Tratamos sus datos para: gestión de la cuenta y acceso a la plataforma (base: ejecución de contrato), gestión de pedidos y transacciones (base: ejecución de contrato), envío de comunicaciones sobre el servicio (base: ejecución de contrato), cumplimiento de obligaciones legales y mejora de la plataforma (base: interés legítimo).
          </Section>

          <Section title="4. CONSERVACIÓN DE LOS DATOS">
            Conservaremos sus datos mientras mantenga una cuenta activa. Una vez cancelada, los datos se conservarán durante el plazo legalmente exigido (mínimo 5 años para datos de facturación).
          </Section>

          <Section title="5. DESTINATARIOS">
            Sus datos no serán cedidos a terceros salvo a proveedores técnicos necesarios para el servicio: <strong>Supabase</strong> (base de datos, servidores en la UE), <strong>Vercel</strong> (hosting) y <strong>Resend</strong> (envío de emails). Todos cumplen con el RGPD. También podrán cederse cuando sea requerido por autoridades competentes.
          </Section>

          <Section title="6. DERECHOS DEL USUARIO">
            Puede ejercer sus derechos de acceso, rectificación, supresión, oposición, portabilidad y limitación enviando un email a <strong>info@recambio-directo.com</strong> con copia de su DNI. Responderemos en un plazo máximo de 30 días. También puede reclamar ante la <strong>Agencia Española de Protección de Datos (AEPD)</strong> en www.aepd.es.
          </Section>

          <Section title="7. SEGURIDAD">
            Aplicamos medidas técnicas para proteger sus datos: cifrado SSL, autenticación segura y control de accesos mediante políticas de seguridad a nivel de fila (RLS) en nuestra base de datos.
          </Section>

          <div style={{ marginTop: 40, paddingTop: 24, borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", gap: 16, flexWrap: "wrap" as const }}>
            <a href="/terminos" style={legalLink}>Términos y Condiciones</a>
            <a href="/cookies" style={legalLink}>Política de Cookies</a>
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