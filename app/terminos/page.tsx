export default function TerminosPage() {
  return (
    <main style={{ minHeight: "100vh", background: "linear-gradient(180deg,#020617,#0f172a)", color: "white", padding: "60px 20px" }}>
      <div style={{ maxWidth: 800, margin: "0 auto" }}>
        <a href="/" style={{ color: "#60a5fa", textDecoration: "none", fontSize: 14, fontWeight: 600 }}>← Volver al inicio</a>
        <div style={{ background: "rgba(15,23,42,0.92)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 24, padding: "48px", marginTop: 24 }}>
          <div style={{ display: "inline-block", background: "rgba(37,99,235,0.15)", color: "#60a5fa", padding: "8px 16px", borderRadius: 999, fontWeight: 700, fontSize: 13, marginBottom: 24 }}>LEGAL</div>
          <h1 style={{ fontSize: 36, fontWeight: 900, marginBottom: 8 }}>Términos y Condiciones</h1>
          <p style={{ color: "#94a3b8", fontSize: 14, marginBottom: 40 }}>Última actualización: Junio 2026</p>

          <Section title="1. OBJETO Y ACEPTACIÓN">
            Los presentes Términos y Condiciones regulan el acceso y uso de <strong>Recambio Directo</strong> (www.recambio-directo.com), plataforma marketplace B2B para la compraventa de recambios de automoción, titularidad de Vicente de Paco Cabeza (NIF: 77856096S).
            <br /><br />
            El registro en la plataforma implica la aceptación plena de estos términos. Si no está de acuerdo, no debe usar el servicio.
          </Section>

          <Section title="2. ACCESO Y REGISTRO">
            El acceso está reservado exclusivamente a <strong>profesionales del sector de la automoción</strong>: talleres mecánicos, empresas de recambios, distribuidores y autónomos del sector.
            <br /><br />
            Al registrarse, el usuario garantiza que es una empresa o autónomo legalmente constituido en España, que los datos aportados son verídicos y que tiene capacidad legal para contratar.
            <br /><br />
            Recambio Directo se reserva el derecho de verificar los datos y rechazar o cancelar cuentas que no cumplan los requisitos.
          </Section>

          <Section title="3. SUSCRIPCIÓN Y PRECIOS">
            <strong>Periodo gratuito:</strong> El primer mes desde el registro es completamente gratuito, sin compromiso de permanencia.
            <br /><br />
            <strong>Suscripción mensual:</strong> A partir del segundo mes, el precio es de <strong>25€/mes + IVA</strong> por cuenta activa.
            <br /><br />
            <strong>Cancelación:</strong> El usuario puede cancelar su suscripción en cualquier momento contactando con info@recambio-directo.com, sin penalización. La cancelación será efectiva al final del periodo en curso.
          </Section>

          <Section title="4. OBLIGACIONES DE LOS USUARIOS">
            <strong>Los proveedores se comprometen a:</strong> publicar únicamente piezas con stock real, mantener precios y stocks actualizados, gestionar los pedidos en los plazos acordados y emitir facturas por las ventas realizadas.
            <br /><br />
            <strong>Los talleres se comprometen a:</strong> realizar pedidos con intención real de compra, pagar según la forma de pago acordada y no anular pedidos de forma reiterada sin causa justificada.
          </Section>

          <Section title="5. TRANSACCIONES Y PAGOS">
            Recambio Directo actúa como intermediario entre talleres y proveedores. La relación comercial se establece directamente entre ambas partes. El pago puede realizarse mediante tarjeta bancaria o RD Pago (crédito de plataforma sujeto a activación). Los gastos de transporte se añaden al importe del pedido y no son reembolsables una vez gestionado el envío.
          </Section>

          <Section title="6. ANULACIÓN DE PEDIDOS">
            Un pedido puede anularse antes de que haya sido enviado, indicando el motivo desde el panel de usuario. Una vez en estado "enviado" o "entregado", la anulación no es posible y cualquier incidencia deberá gestionarse directamente entre las partes según la política de devoluciones.
          </Section>

          <Section title="7. DEVOLUCIONES E INCIDENCIAS">
            <strong>Pieza incorrecta o no conforme:</strong> El proveedor es responsable de aceptar la devolución y reembolsar o reenviar la pieza correcta. Recambio Directo actuará como mediador si existe disputa entre las partes.
            <br /><br />
            <strong>Daños por transporte:</strong> La reclamación deberá gestionarse con la agencia de transporte correspondiente. El proveedor, como remitente, deberá iniciar dicha reclamación. Recambio Directo facilitará los datos del envío si fuera necesario.
            <br /><br />
            <strong>Error del comprador:</strong> Al tratarse de ventas entre profesionales (B2B), no aplica el derecho de desistimiento de 14 días previsto para consumidores. La devolución por error del comprador queda sujeta a la aceptación voluntaria del proveedor.
            <br /><br />
            Para cualquier incidencia puede contactar con info@recambio-directo.com.
          </Section>

          <Section title="8. LIMITACIÓN DE RESPONSABILIDAD">
            Recambio Directo no se responsabiliza de la calidad o legalidad de las piezas publicadas, el incumplimiento de acuerdos entre usuarios, los daños derivados del uso de piezas adquiridas, ni las interrupciones del servicio por causas técnicas ajenas a su control.
          </Section>

          <Section title="9. LEGISLACIÓN Y JURISDICCIÓN">
            Estos términos se rigen por la legislación española. Para cualquier controversia, las partes se someten a los Juzgados y Tribunales de Murcia, con renuncia expresa a cualquier otro fuero.
          </Section>

          <div style={{ marginTop: 40, paddingTop: 24, borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", gap: 16, flexWrap: "wrap" as const }}>
            <a href="/privacidad" style={legalLink}>Política de Privacidad</a>
            <a href="/cookies" style={legalLink}>Política de Cookies</a>
            <a href="/aviso-legal" style={legalLink}>Aviso Legal</a>
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