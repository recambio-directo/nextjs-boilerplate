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
            En cumplimiento del artículo 10 de la Ley 34/2002, de 11 de julio, de Servicios de la Sociedad de la Información y del Comercio Electrónico (LSSI-CE):<br /><br />
            <strong>Titular:</strong> Vicente de Paco Cabeza<br />
            <strong>NIF:</strong> 77856096S<br />
            <strong>Domicilio:</strong> C/ Sola Nº16, 30430 Cehegín (Murcia), España<br />
            <strong>Email:</strong> info@recambio-directo.com<br />
            <strong>Teléfono:</strong> 744487895<br />
            <strong>Web:</strong> www.recambio-directo.com<br /><br />
            <strong>Actividad:</strong> Intermediarios del Comercio — Epígrafe IAE 631 Sección 1ª. La actividad consiste en poner en relación a compradores y vendedores de recambios de automoción entre profesionales del sector.
          </Section>

          <Section title="2. OBJETO">
            Recambio Directo es una plataforma marketplace B2B especializada en la compraventa de recambios de automoción entre profesionales del sector. El acceso está reservado exclusivamente a empresas y profesionales autónomos del sector de la automoción legalmente constituidos en España.
            <br /><br />
            Recambio Directo no posee ninguno de los artículos en venta. La compraventa se realiza directamente entre usuarios (talleres y proveedores), por lo que Recambio Directo no se responsabiliza de la exactitud, veracidad o actualidad de los productos publicados por los usuarios.
          </Section>

          <Section title="3. PROPIEDAD INTELECTUAL">
            Todos los contenidos de la plataforma (textos, imágenes, logotipos, diseño, código fuente) son propiedad de Vicente de Paco Cabeza o de terceros que han autorizado su uso. Queda expresamente prohibida su reproducción, distribución o comunicación pública sin autorización expresa y por escrito del titular.
          </Section>

          <Section title="4. RESPONSABILIDAD">
            El titular no se hace responsable de los contenidos publicados por los usuarios, las transacciones realizadas entre talleres y proveedores, los daños derivados del uso incorrecto de la plataforma, ni la veracidad de los datos aportados por los usuarios en el registro. Recambio Directo se reserva el derecho de retirar contenidos o cancelar cuentas que incumplan los presentes términos o la legislación vigente.
          </Section>

          <Section title="5. PORTES Y TRANSPORTE">
            El precio de transporte mostrado durante el proceso de compra es orientativo y corresponde a envíos de hasta 3 kg en ruta peninsular estándar. Las agencias de transporte se reservan el derecho a recalcular el coste del porte en función del peso real, peso volumétrico y distancia del envío una vez procesado en sus instalaciones.
            <br /><br />
            En caso de que el coste real del porte sea superior al mostrado en el checkout, la diferencia será repercutida al comprador mediante factura separada emitida por Recambio Directo. El comprador acepta esta condición al completar el proceso de compra.
            <br /><br />
            Se recomienda indicar el peso aproximado real del envío para evitar cargos adicionales. El factor de cubicaje aplicado por las agencias es de 167 kg/m³ para envíos terrestres.
          </Section>

          <Section title="6. LEGISLACIÓN APLICABLE">
            Las presentes condiciones se rigen por la legislación española, en particular por la Ley 34/2002 de Servicios de la Sociedad de la Información, la Ley 15/2009 del Contrato de Transporte Terrestre de Mercancías y el Reglamento General de Protección de Datos (RGPD). Para cualquier controversia, las partes se someten a los Juzgados y Tribunales de Murcia, con renuncia expresa a cualquier otro fuero.
          </Section>

          <div style={{ marginTop: 40, paddingTop: 24, borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", gap: 16, flexWrap: "wrap" as const }}>
            <a href="/terminos" style={legalLink}>Términos y Condiciones</a>
            <a href="/privacidad" style={legalLink}>Política de Privacidad</a>
            <a href="/cookies" style={legalLink}>Política de Cookies</a>
            <a href="/devoluciones" style={legalLink}>Política de Devoluciones</a>
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