"use client";

export default function PrivacidadPage() {
  return (
    <main style={mainStyle}>
      <div style={wrapper}>
        <div style={header}>
          <div style={badge}>LEGAL</div>
          <h1 style={title}>Política de Privacidad</h1>
          <p style={subtitle}>Última actualización: junio de 2026</p>
        </div>

        <div style={content}>

          <Seccion titulo="1. Responsable del tratamiento">
            <p>En cumplimiento del Reglamento (UE) 2016/679 del Parlamento Europeo (RGPD) y la Ley Orgánica 3/2018 de Protección de Datos Personales (LOPDGDD), le informamos:</p>
            <ul>
              <li><strong>Razón social:</strong> Recambio Directo S.L. (en constitución)</li>
              <li><strong>Email de contacto:</strong> privacidad@recambiodirecto.es</li>
              <li><strong>Actividad:</strong> Marketplace B2B de recambios de automoción</li>
            </ul>
          </Seccion>

          <Seccion titulo="2. Datos que recopilamos">
            <p>Recogemos los siguientes datos personales:</p>
            <ul>
              <li>Datos de identificación: nombre, apellidos, nombre de empresa, CIF/NIF</li>
              <li>Datos de contacto: email, teléfono, dirección postal y código postal</li>
              <li>Datos de navegación: dirección IP, cookies técnicas</li>
              <li>Datos de transacciones: pedidos, importes, historial de compras</li>
              <li>Comunicaciones: mensajes intercambiados en el chat de la plataforma</li>
            </ul>
          </Seccion>

          <Seccion titulo="3. Finalidad del tratamiento">
            <p>Utilizamos sus datos para:</p>
            <ul>
              <li>Gestionar su cuenta y acceso a la plataforma</li>
              <li>Procesar y gestionar los pedidos realizados</li>
              <li>Facilitar la comunicación entre talleres y proveedores</li>
              <li>Enviar comunicaciones relacionadas con su actividad en la plataforma</li>
              <li>Cumplir con obligaciones legales y fiscales</li>
              <li>Mejorar nuestros servicios mediante análisis estadísticos anónimos</li>
            </ul>
          </Seccion>

          <Seccion titulo="4. Base legal">
            <p>El tratamiento de sus datos se basa en:</p>
            <ul>
              <li><strong>Ejecución de contrato:</strong> para la gestión de su cuenta y pedidos</li>
              <li><strong>Interés legítimo:</strong> para mejorar nuestros servicios</li>
              <li><strong>Obligación legal:</strong> para cumplir con normativa fiscal y mercantil</li>
              <li><strong>Consentimiento:</strong> para comunicaciones comerciales (puede retirarlo en cualquier momento)</li>
            </ul>
          </Seccion>

          <Seccion titulo="5. Conservación de datos">
            <p>Conservamos sus datos durante el tiempo necesario para cumplir con las finalidades descritas y las obligaciones legales aplicables:</p>
            <ul>
              <li>Datos de cuenta: mientras mantenga su cuenta activa</li>
              <li>Datos de pedidos y facturación: 5 años (obligación fiscal)</li>
              <li>Comunicaciones de chat: 6 meses desde su creación</li>
            </ul>
          </Seccion>

          <Seccion titulo="6. Sus derechos">
            <p>Puede ejercer en cualquier momento los siguientes derechos:</p>
            <ul>
              <li><strong>Acceso:</strong> conocer qué datos tenemos sobre usted</li>
              <li><strong>Rectificación:</strong> corregir datos inexactos</li>
              <li><strong>Supresión:</strong> solicitar la eliminación de sus datos</li>
              <li><strong>Limitación:</strong> restringir el tratamiento en ciertos casos</li>
              <li><strong>Portabilidad:</strong> recibir sus datos en formato estructurado</li>
              <li><strong>Oposición:</strong> oponerse al tratamiento basado en interés legítimo</li>
            </ul>
            <p>Para ejercer estos derechos, contáctenos en <strong>privacidad@recambiodirecto.es</strong>. También puede presentar una reclamación ante la Agencia Española de Protección de Datos (www.aepd.es).</p>
          </Seccion>

          <Seccion titulo="7. Seguridad">
            <p>Aplicamos medidas técnicas y organizativas apropiadas para proteger sus datos, incluyendo cifrado de comunicaciones (HTTPS), acceso restringido a datos personales y almacenamiento seguro en servidores europeos.</p>
          </Seccion>

          <Seccion titulo="8. Transferencias internacionales">
            <p>Sus datos se almacenan en servidores ubicados en la Unión Europea. En caso de transferencias a terceros países, garantizamos que se realicen con las salvaguardas adecuadas conforme al RGPD.</p>
          </Seccion>

        </div>

        <div style={footer}>
          <p>Para cualquier consulta sobre esta política: <a href="mailto:privacidad@recambiodirecto.es" style={link}>privacidad@recambiodirecto.es</a></p>
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
const footer = { marginTop: 40, textAlign: "center" as const, color: "#94a3b8" };
const link = { color: "#60a5fa", textDecoration: "none" };
const btnVolver = { display: "inline-block", marginTop: 16, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "white", padding: "12px 24px", borderRadius: 12, textDecoration: "none", fontWeight: 700 };