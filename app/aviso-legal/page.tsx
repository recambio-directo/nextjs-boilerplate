export default function AvisoLegalPage() {
  return (
    <main style={{ minHeight: "100vh", background: "linear-gradient(180deg,#020617,#0f172a)", color: "white", padding: "60px 20px" }}>
      <div style={{ maxWidth: 800, margin: "0 auto" }}>
        <a href="/" style={{ color: "#60a5fa", textDecoration: "none", fontSize: 14, fontWeight: 600 }}>← Volver al inicio</a>
        <div style={{ background: "rgba(15,23,42,0.92)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 24, padding: "48px", marginTop: 24 }}>
          <div style={{ display: "inline-block", background: "rgba(37,99,235,0.15)", color: "#60a5fa", padding: "8px 16px", borderRadius: 999, fontWeight: 700, fontSize: 13, marginBottom: 24 }}>LEGAL</div>
          <h1 style={{ fontSize: 36, fontWeight: 900, marginBottom: 8 }}>Aviso Legal</h1>
          <p style={{ color: "#94a3b8", fontSize: 14, marginBottom: 40 }}>Última actualización: Junio 2026</p>

          <Section title="1. DATOS IDENTIFICATIVOS">
            En cumplimiento del artículo 10 de la Ley 34/2002 (LSSI-CE):<br /><br />
            <strong>Titular:</strong> Vicente de Paco Cabeza<br />
            <strong>NIF:</strong> 77856096S<br />
            <strong>Domicilio:</strong> C/ Sola Nº16, 30430 Cehegín (Murcia), España<br />
            <strong>Email:</strong> info@recambio-directo.com<br />
            <strong>Teléfono:</strong> 744487895<br />
            <strong>Web:</strong> www.recambio-directo.com
          </Section>

          <Section title="2. OBJETO">
            Recambio Directo es una plataforma marketplace B2B especializada en la compraventa de recambios de automoción entre profesionales del sector. El acceso está reservado exclusivamente a empresas y profesionales autónomos del sector de la automoción.
          </Section>

          <Section title="3. PROPIEDAD INTELECTUAL">
            Todos los contenidos de la plataforma (textos, imágenes, logotipos, diseño, código fuente) son propiedad de Vicente de Paco Cabeza o de terceros que han autorizado su uso. Queda prohibida su reproducción, distribución o comunicación pública sin autorización expresa.
          </Section>

          <Section title="4. RESPONSABILIDAD">
            El titular no se hace responsable de los contenidos publicados por los usuarios, las transacciones realizadas entre talleres y proveedores, los daños derivados del uso incorrecto de la plataforma, ni la veracidad de los datos aportados por los usuarios en el registro.
          </Section>

          <Section title="5. LEGISLACIÓN APLICABLE">
            Las presentes condiciones se rigen por la legislación española. Para cualquier controversia, las partes se someten a los Juzgados y Tribunales de Murcia, con renuncia expresa a cualquier otro fuero.
          </Section>

          <div style={{ marginTop: 40, paddingTop: 24, borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", gap: 16, flexWrap: "wrap" as const }}>
            <a href="/terminos" style={legalLink}>Términos y Condiciones</a>
            <a href="/privacidad" style={legalLink}>Política de Privacidad</a>
            <a href="/cookies" style={legalLink}>Política de Cookies</a>
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