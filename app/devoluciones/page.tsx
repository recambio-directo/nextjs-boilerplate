export default function DevolucionesPage() {
  return (
    <main style={{ minHeight: "100vh", background: "linear-gradient(180deg,#020617,#0f172a)", color: "white", padding: "60px 20px" }}>
      <div style={{ maxWidth: 800, margin: "0 auto" }}>
        <a href="/" style={{ color: "#60a5fa", textDecoration: "none", fontSize: 14, fontWeight: 600 }}>← Volver al inicio</a>
        <div style={{ background: "rgba(15,23,42,0.92)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 24, padding: "48px", marginTop: 24 }}>
          <div style={{ display: "inline-block", background: "rgba(37,99,235,0.15)", color: "#60a5fa", padding: "8px 16px", borderRadius: 999, fontWeight: 700, fontSize: 13, marginBottom: 24 }}>LEGAL</div>
          <h1 style={{ fontSize: 36, fontWeight: 900, marginBottom: 8 }}>Política de Devoluciones</h1>
          <p style={{ color: "#94a3b8", fontSize: 14, marginBottom: 40 }}>Última actualización: Junio 2026</p>

          <Section title="1. NATURALEZA DEL SERVICIO">
            Recambio Directo es una plataforma de intermediación B2B. La relación comercial se establece directamente entre el proveedor (vendedor) y el taller (comprador). Recambio Directo no es parte de la transacción y actúa únicamente como intermediario y mediador en caso de disputa.
            <br /><br />
            Al tratarse de ventas entre profesionales, <strong>no aplica el derecho de desistimiento de 14 días</strong> previsto en la normativa de consumidores (Real Decreto Legislativo 1/2007).
          </Section>

          <Section title="2. PIEZA INCORRECTA O NO CONFORME">
            Si la pieza recibida no se corresponde con la referencia pedida o presenta defectos de fabricación:<br /><br />
            — El taller debe notificarlo al proveedor a través del chat de la plataforma en un plazo máximo de <strong>48 horas</strong> desde la recepción.<br />
            — El proveedor es responsable de gestionar la devolución y proceder al reenvío de la pieza correcta o al reembolso del importe.<br />
            — Si no hay acuerdo entre las partes, el taller puede contactar con Recambio Directo en info@recambio-directo.com para mediar en la resolución.
          </Section>

          <Section title="3. DAÑOS POR TRANSPORTE">
            Si la pieza llega dañada como consecuencia del transporte:<br /><br />
            — El taller debe documentar los daños con fotografías en el momento de la recepción y notificarlo al proveedor en un plazo máximo de <strong>24 horas</strong>.<br />
            — La reclamación deberá gestionarse con la agencia de transporte correspondiente. El proveedor, como remitente del envío, es quien debe iniciar dicha reclamación.<br />
            — Las agencias de transporte con las que opera la plataforma son: MRW, NACEX, SEUR, Correos Express, GLS, DHL y CTT Express, cada una con sus propias condiciones de cobertura por siniestro.<br />
            — Recambio Directo facilitará los datos del envío que sean necesarios para la reclamación.
          </Section>

          <Section title="4. ERROR DEL COMPRADOR">
            Si el taller realizó el pedido por error o ya no necesita la pieza:<br /><br />
            — No existe obligación legal de devolución al tratarse de una transacción B2B.<br />
            — La devolución queda sujeta a la aceptación voluntaria del proveedor.<br />
            — Los gastos de transporte de devolución correrán a cargo del comprador en este caso.
          </Section>

          <Section title="5. ANULACIÓN ANTES DEL ENVÍO">
            Un pedido puede anularse sin coste desde el panel de usuario siempre que no haya pasado a estado "enviado". Una vez gestionado el envío por la agencia de transporte, no es posible la anulación y se aplicará esta política de devoluciones.
          </Section>

          <Section title="6. CONTACTO PARA INCIDENCIAS">
            Para cualquier incidencia relacionada con devoluciones o reclamaciones puede contactar con nuestro equipo en:<br /><br />
            <strong>Email:</strong> info@recambio-directo.com<br />
            <strong>Teléfono:</strong> 744487895<br /><br />
            Responderemos en un plazo máximo de 48 horas laborables.
          </Section>

          <div style={{ marginTop: 40, paddingTop: 24, borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", gap: 16, flexWrap: "wrap" as const }}>
            <a href="/terminos" style={legalLink}>Términos y Condiciones</a>
            <a href="/privacidad" style={legalLink}>Política de Privacidad</a>
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