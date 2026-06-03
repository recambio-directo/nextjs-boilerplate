"use client";

export default function TerminosPage() {
  return (
    <main style={mainStyle}>
      <div style={wrapper}>
        <div style={header}>
          <div style={badge}>LEGAL</div>
          <h1 style={title}>Términos y Condiciones</h1>
          <p style={subtitle}>Última actualización: junio de 2026</p>
        </div>

        <div style={content}>

          <Seccion titulo="1. Objeto y ámbito de aplicación">
            <p>Los presentes Términos y Condiciones regulan el acceso y uso de la plataforma Recambio Directo, un marketplace B2B de recambios de automoción exclusivamente para profesionales del sector (talleres mecánicos, carrocerías y proveedores de recambios).</p>
            <p>El acceso y uso de la plataforma implica la aceptación plena de estos términos.</p>
          </Seccion>

          <Seccion titulo="2. Registro y acceso">
            <p>Para utilizar la plataforma es necesario registrarse como empresa profesional. Al registrarse, el usuario declara:</p>
            <ul>
              <li>Ser mayor de edad y actuar en nombre de una empresa legalmente constituida</li>
              <li>Que los datos facilitados son verídicos y actualizados</li>
              <li>Mantener la confidencialidad de sus credenciales de acceso</li>
              <li>Notificar inmediatamente cualquier uso no autorizado de su cuenta</li>
            </ul>
          </Seccion>

          <Seccion titulo="3. Condiciones de uso para talleres">
            <p>Los talleres registrados podrán:</p>
            <ul>
              <li>Buscar y comparar precios de referencias OEM e IAM entre proveedores</li>
              <li>Añadir productos a la cesta y realizar pedidos</li>
              <li>Comunicarse con proveedores mediante el sistema de chat</li>
              <li>Publicar piezas sueltas o excedentes de stock propios</li>
            </ul>
            <p>Los talleres se comprometen a no utilizar la plataforma para actividades fraudulentas o ilegales.</p>
          </Seccion>

          <Seccion titulo="4. Condiciones de uso para proveedores">
            <p>Los proveedores registrados podrán:</p>
            <ul>
              <li>Publicar su catálogo de piezas con precios y stock actualizados</li>
              <li>Gestionar pedidos recibidos y actualizar estados de envío</li>
              <li>Configurar exclusiones por código postal o cliente específico</li>
              <li>Comunicarse con talleres mediante el sistema de chat</li>
            </ul>
            <p>Los proveedores garantizan que las piezas publicadas son auténticas, están en buen estado y corresponden a las descripciones indicadas.</p>
          </Seccion>

          <Seccion titulo="5. Precios y pagos">
            <p>Los precios publicados en la plataforma son precios de venta entre profesionales, sin IVA salvo indicación contraria. Recambio Directo actúa como intermediario y no es responsable de los precios fijados por cada proveedor.</p>
            <p>Los métodos de pago disponibles son los indicados en el proceso de checkout. El pago se realiza directamente entre taller y proveedor según las condiciones acordadas.</p>
          </Seccion>

          <Seccion titulo="6. Responsabilidades">
            <p>Recambio Directo no se hace responsable de:</p>
            <ul>
              <li>La calidad, autenticidad o disponibilidad de los productos publicados por proveedores</li>
              <li>Incumplimientos entre partes en la ejecución de pedidos</li>
              <li>Daños derivados del uso incorrecto de la plataforma</li>
              <li>Interrupciones del servicio por causas ajenas a nuestra voluntad</li>
            </ul>
          </Seccion>

          <Seccion titulo="7. Propiedad intelectual">
            <p>Todos los contenidos de la plataforma (diseño, código, textos, imágenes) son propiedad de Recambio Directo y están protegidos por la legislación de propiedad intelectual. Queda prohibida su reproducción sin autorización expresa.</p>
          </Seccion>

          <Seccion titulo="8. Modificación y cancelación">
            <p>Recambio Directo se reserva el derecho de modificar estos términos con previo aviso a los usuarios. Podemos suspender o cancelar cuentas que incumplan estos términos o realicen actividades fraudulentas.</p>
          </Seccion>

          <Seccion titulo="9. Legislación aplicable">
            <p>Estos términos se rigen por la legislación española. Para cualquier disputa, las partes se someten a los Juzgados y Tribunales de España, salvo que la normativa de protección al consumidor establezca otra cosa.</p>
          </Seccion>

        </div>

        <div style={footer}>
          <p>Para cualquier consulta: <a href="mailto:legal@recambiodirecto.es" style={link}>legal@recambiodirecto.es</a></p>
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