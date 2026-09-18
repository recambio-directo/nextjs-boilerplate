import type { Metadata } from "next";

export const metadata: Metadata = {
  title:
    "Guía de logística para recambios de automoción en España",
  description:
    "Agencias de transporte, plazos de entrega, etiquetas automáticas y tracking en tiempo real. Todo sobre la logística de recambios de coche en España.",
  alternates: {
    canonical:
      "https://www.recambio-directo.com/blog/guia-logistica-recambios-automocion",
  },
};

const badge: React.CSSProperties = {
  display: "inline-block",
  background: "rgba(37,99,235,0.15)",
  color: "#60a5fa",
  padding: "8px 18px",
  borderRadius: 999,
  fontWeight: 700,
  marginBottom: 20,
  fontSize: 13,
};

const section: React.CSSProperties = {
  background: "rgba(15,23,42,0.92)",
  borderRadius: 24,
  padding: 32,
  border: "1px solid rgba(255,255,255,0.06)",
  marginBottom: 24,
};

export default function ArticuloLogistica() {
  return (
    <main
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg,#020617,#020b2d)",
        color: "white",
        padding: "60px 20px",
      }}
    >
      <article style={{ maxWidth: 780, margin: "0 auto" }}>
        <div style={{ marginBottom: 32 }}>
          <a
            href="/blog"
            style={{ color: "#60a5fa", textDecoration: "none", fontSize: 14 }}
          >
            ← Volver al blog
          </a>
        </div>

        <div style={badge}>LOGÍSTICA</div>

        <h1
          style={{
            fontSize: "clamp(28px, 4vw, 44px)",
            fontWeight: 900,
            lineHeight: 1.15,
            marginBottom: 12,
          }}
        >
          Guía de logística para recambios de automoción en España
        </h1>

        <p style={{ color: "#64748b", fontSize: 14, marginBottom: 32 }}>
          Septiembre 2026 · 9 min de lectura
        </p>

        <div style={section}>
          <p
            style={{
              color: "#94a3b8",
              fontSize: 16,
              lineHeight: 1.8,
              margin: 0,
            }}
          >
            La logística es el eslabón que convierte un pedido de recambios en
            una reparación terminada. Un taller que recibe la pieza correcta en
            24 horas factura antes, libera bahías y fideliza clientes. Un envío
            que se retrasa o llega con la referencia equivocada genera costes
            ocultos que se acumulan semana tras semana. En esta guía repasamos
            cómo funciona la logística de recambios en España, qué agencias
            operan, qué plazos puedes esperar y cómo un marketplace B2B
            simplifica todo el proceso.
          </p>
        </div>

        <div style={section}>
          <h2
            style={{ fontSize: 22, fontWeight: 800, marginBottom: 16, color: "white" }}
          >
            El reto logístico del recambio de automoción
          </h2>
          <p style={{ color: "#94a3b8", fontSize: 16, lineHeight: 1.8 }}>
            El recambio de automoción tiene características que lo hacen
            especialmente complejo de gestionar logísticamente. Hay millones de
            referencias activas (solo un catálogo como TecDoc contiene más de 10
            millones), las piezas varían enormemente en tamaño y peso — desde un
            tornillo de 5 gramos hasta un motor de transmisión de 40 kilos — y
            la urgencia es alta: el coche está en el elevador y el cliente
            necesita su vehículo.
          </p>
          <p style={{ color: "#94a3b8", fontSize: 16, lineHeight: 1.8 }}>
            En España, el modelo tradicional se basa en repartidores propios del
            distribuidor local que cubren un radio de 30-50 km con furgonetas.
            Esto funciona bien para entregas el mismo día dentro de una zona
            urbana, pero deja fuera a talleres en zonas rurales, islas o
            localidades alejadas de los grandes hubs de distribución. Aquí es
            donde las agencias de paquetería y los marketplaces digitales
            amplían las opciones.
          </p>
        </div>

        <div style={section}>
          <h2
            style={{ fontSize: 22, fontWeight: 800, marginBottom: 16, color: "white" }}
          >
            Principales agencias de transporte para recambios en España
          </h2>
          <p style={{ color: "#94a3b8", fontSize: 16, lineHeight: 1.8 }}>
            Las agencias de paquetería que dominan el transporte de recambios
            B2B en España peninsular son GLS, MRW, NACEX, SEUR, Correos Express
            y CTT Express. Cada una tiene sus fortalezas:
          </p>
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                color: "#94a3b8",
                fontSize: 15,
                marginTop: 12,
              }}
            >
              <thead>
                <tr
                  style={{
                    borderBottom: "1px solid rgba(255,255,255,0.1)",
                    textAlign: "left",
                  }}
                >
                  <th style={{ padding: "12px 8px", color: "white" }}>Agencia</th>
                  <th style={{ padding: "12px 8px", color: "white" }}>Plazo peninsular</th>
                  <th style={{ padding: "12px 8px", color: "white" }}>Punto fuerte</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["GLS", "24-48h", "Red capilar densa, buen precio B2B"],
                  ["MRW", "24h urgente", "Entregas urgentes mismo día en capitales"],
                  ["NACEX", "24h", "Especialista en paquetería industrial"],
                  ["SEUR", "24-48h", "Mayor cobertura rural peninsular"],
                  ["Correos Express", "24-48h", "Acceso a oficinas de Correos para recogida"],
                  ["CTT Express", "24-48h", "Precios competitivos en volumen"],
                ].map(([agencia, plazo, fuerte]) => (
                  <tr
                    key={agencia}
                    style={{
                      borderBottom: "1px solid rgba(255,255,255,0.05)",
                    }}
                  >
                    <td style={{ padding: "10px 8px", fontWeight: 600, color: "#e2e8f0" }}>
                      {agencia}
                    </td>
                    <td style={{ padding: "10px 8px" }}>{plazo}</td>
                    <td style={{ padding: "10px 8px" }}>{fuerte}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p
            style={{
              color: "#94a3b8",
              fontSize: 16,
              lineHeight: 1.8,
              marginTop: 16,
            }}
          >
            El plazo real depende de tres factores: la hora de corte del
            proveedor (normalmente entre las 14:00 y las 17:00), la distancia
            entre el almacén y el taller, y si el paquete requiere manipulación
            especial (piezas pesadas, materiales peligrosos como baterías o
            líquidos de frenos). Un pedido confirmado antes de las 14:00 en
            Madrid con destino a Barcelona se entrega generalmente al día
            siguiente por la mañana.
          </p>
        </div>

        <div style={section}>
          <h2
            style={{ fontSize: 22, fontWeight: 800, marginBottom: 16, color: "white" }}
          >
            Etiquetas automáticas y preparación de envíos
          </h2>
          <p style={{ color: "#94a3b8", fontSize: 16, lineHeight: 1.8 }}>
            Uno de los cuellos de botella más comunes en la logística de
            recambios es la preparación del envío por parte del proveedor. En el
            modelo tradicional, el distribuidor tiene que generar la etiqueta
            manualmente en el sistema de su agencia de transporte, imprimir el
            albarán, empaquetarlo y programar la recogida. Esto añade entre 15 y
            30 minutos por pedido y es fuente frecuente de errores en la
            dirección de entrega.
          </p>
          <p style={{ color: "#94a3b8", fontSize: 16, lineHeight: 1.8 }}>
            En Recambio Directo, cuando un proveedor confirma un pedido, la
            plataforma genera automáticamente la etiqueta de envío con la
            agencia correspondiente, incluyendo los datos del taller, el peso
            estimado y el código de seguimiento. El proveedor solo tiene que
            imprimir la etiqueta, pegarla en el paquete y dejarlo preparado
            para la recogida. Esto reduce el tiempo de preparación a menos de 5
            minutos y elimina los errores de transcripción.
          </p>
        </div>

        <div style={section}>
          <h2
            style={{ fontSize: 22, fontWeight: 800, marginBottom: 16, color: "white" }}
          >
            Tracking en tiempo real: por qué importa
          </h2>
          <p style={{ color: "#94a3b8", fontSize: 16, lineHeight: 1.8 }}>
            Saber dónde está la pieza no es un lujo — es una necesidad
            operativa. Cuando el taller puede ver que el paquete está «en
            reparto» puede avisar al cliente de que el coche estará listo por la
            tarde. Cuando ve que hay un retraso puede reorganizar el trabajo del
            día y dedicar esa bahía a otro vehículo mientras espera.
          </p>
          <p style={{ color: "#94a3b8", fontSize: 16, lineHeight: 1.8 }}>
            Los marketplaces B2B integran el tracking de las agencias de
            transporte directamente en la plataforma, de modo que el taller no
            tiene que entrar en la web de GLS, MRW o NACEX por separado.
            Recambio Directo muestra el estado del envío en el panel de pedidos
            con actualizaciones automáticas: pedido confirmado, en preparación,
            recogido por la agencia, en tránsito, en reparto y entregado. Si
            hay una incidencia (dirección incorrecta, ausencia en destino,
            paquete dañado), la plataforma la notifica al taller y al proveedor
            para que se resuelva sin llamadas intermedias.
          </p>
        </div>

        <div style={section}>
          <h2
            style={{ fontSize: 22, fontWeight: 800, marginBottom: 16, color: "white" }}
          >
            Gestión de devoluciones y garantías
          </h2>
          <p style={{ color: "#94a3b8", fontSize: 16, lineHeight: 1.8 }}>
            Las devoluciones son inevitables en el sector de recambios — una
            pieza que no era compatible, un diagnóstico que cambió a mitad de
            reparación o un artículo que llegó defectuoso. La logística inversa
            es tan importante como la directa, y un proceso de devolución ágil
            marca la diferencia entre un taller que confía en su proveedor y uno
            que busca alternativas.
          </p>
          <p style={{ color: "#94a3b8", fontSize: 16, lineHeight: 1.8 }}>
            En un marketplace, la devolución se gestiona desde la misma
            plataforma: el taller solicita la devolución, el sistema genera una
            etiqueta de recogida inversa con la misma agencia que hizo la
            entrega y el proveedor recibe la notificación con el motivo. El
            reembolso o la pieza de sustitución se procesan una vez que el
            proveedor confirma la recepción del artículo devuelto. Todo queda
            trazado digitalmente, lo que elimina las disputas de «yo lo envié /
            yo no lo recibí».
          </p>
        </div>

        <div style={section}>
          <h2
            style={{ fontSize: 22, fontWeight: 800, marginBottom: 16, color: "white" }}
          >
            Consejos para optimizar la logística de tu taller
          </h2>
          <p style={{ color: "#94a3b8", fontSize: 16, lineHeight: 1.8 }}>
            Agrupa pedidos siempre que sea posible. Si necesitas tres piezas del
            mismo proveedor, es más eficiente y barato hacer un solo pedido que
            tres separados. Verifica la dirección de entrega y el horario de
            recepción en tu perfil: muchos retrasos se deben a que la agencia
            intentó entregar fuera de horario o en una dirección desactualizada.
          </p>
          <p style={{ color: "#94a3b8", fontSize: 16, lineHeight: 1.8 }}>
            Haz los pedidos antes de la hora de corte del proveedor. La mayoría
            de los distribuidores tienen un corte entre las 14:00 y las 16:00
            para envíos del mismo día. Un pedido a las 14:30 puede significar un
            día entero de retraso respecto a uno a las 13:30. Y si tu volumen de
            pedidos es alto, negocia con el marketplace o el proveedor una
            recogida fija diaria: las agencias ofrecen tarifas reducidas cuando
            hay un volumen predecible y una recogida programada.
          </p>
        </div>

        <div
          style={{
            textAlign: "center",
            marginTop: 40,
            padding: "32px 24px",
            background: "rgba(37,99,235,0.1)",
            borderRadius: 20,
            border: "1px solid rgba(96,165,250,0.2)",
          }}
        >
          <p
            style={{
              fontSize: 20,
              fontWeight: 800,
              marginBottom: 12,
              color: "white",
            }}
          >
            Logística de recambios simplificada
          </p>
          <p
            style={{
              color: "#94a3b8",
              fontSize: 15,
              marginBottom: 20,
              lineHeight: 1.6,
            }}
          >
            Etiquetas automáticas, tracking en tiempo real y 6 agencias de
            transporte integradas. Regístrate gratis en Recambio Directo.
          </p>
          <a
            href="/registro"
            style={{
              display: "inline-block",
              background: "#2563eb",
              color: "white",
              padding: "14px 32px",
              borderRadius: 12,
              fontWeight: 700,
              textDecoration: "none",
              fontSize: 15,
            }}
          >
            Crear cuenta gratis →
          </a>
        </div>

        <div
          style={{
            textAlign: "center",
            marginTop: 32,
            color: "#64748b",
            fontSize: 13,
          }}
        >
          <a
            href="/blog"
            style={{ color: "#60a5fa", textDecoration: "none" }}
          >
            ← Volver al blog
          </a>
        </div>
      </article>
    </main>
  );
}
