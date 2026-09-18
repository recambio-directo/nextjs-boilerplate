import type { Metadata } from "next";

export const metadata: Metadata = {
  title:
    "5 ventajas de usar un marketplace B2B para comprar recambios de automoción",
  description:
    "Descubre cómo los talleres que compran recambios en un marketplace B2B ahorran tiempo, comparan precios, reducen errores y mejoran su logística.",
  alternates: {
    canonical:
      "https://www.recambio-directo.com/blog/ventajas-marketplace-b2b-recambios",
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

const ventajaNum: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: 36,
  height: 36,
  borderRadius: 10,
  background: "rgba(37,99,235,0.2)",
  color: "#60a5fa",
  fontWeight: 900,
  fontSize: 16,
  marginRight: 12,
  flexShrink: 0,
};

export default function ArticuloVentajasB2B() {
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

        <div style={badge}>MARKETPLACE B2B</div>

        <h1
          style={{
            fontSize: "clamp(28px, 4vw, 44px)",
            fontWeight: 900,
            lineHeight: 1.15,
            marginBottom: 12,
          }}
        >
          5 ventajas de usar un marketplace B2B para comprar recambios
        </h1>

        <p style={{ color: "#64748b", fontSize: 14, marginBottom: 32 }}>
          Septiembre 2026 · 7 min de lectura
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
            El sector de recambios de automoción en España mueve más de 10.000
            millones de euros al año, pero gran parte de las transacciones entre
            talleres y proveedores todavía se realizan por teléfono, WhatsApp o
            email. Un marketplace B2B digitaliza este proceso y ofrece ventajas
            medibles desde el primer día. Te explicamos las cinco más relevantes
            para un taller mecánico.
          </p>
        </div>

        <div style={section}>
          <h2
            style={{
              fontSize: 22,
              fontWeight: 800,
              marginBottom: 16,
              color: "white",
              display: "flex",
              alignItems: "center",
            }}
          >
            <span style={ventajaNum}>1</span>
            Comparar precios de varios proveedores al instante
          </h2>
          <p style={{ color: "#94a3b8", fontSize: 16, lineHeight: 1.8 }}>
            Sin un marketplace, comparar precios significa llamar a dos o tres
            distribuidores, esperar a que consulten su stock, apuntar las cifras
            y tomar una decisión. Ese proceso puede llevar entre 10 y 30 minutos
            por pieza. En un marketplace B2B como Recambio Directo, buscas la
            referencia una sola vez y ves todos los precios y disponibilidades en
            la misma pantalla, en tiempo real.
          </p>
          <p style={{ color: "#94a3b8", fontSize: 16, lineHeight: 1.8 }}>
            Esto no solo ahorra tiempo: la transparencia de precios genera
            competencia entre proveedores, lo que tiende a reducir el coste
            medio de compra para el taller. Varios de nuestros usuarios reportan
            ahorros de entre un 8% y un 15% en su factura mensual de recambios
            simplemente por poder comparar antes de comprar.
          </p>
        </div>

        <div style={section}>
          <h2
            style={{
              fontSize: 22,
              fontWeight: 800,
              marginBottom: 16,
              color: "white",
              display: "flex",
              alignItems: "center",
            }}
          >
            <span style={ventajaNum}>2</span>
            Reducir errores en los pedidos
          </h2>
          <p style={{ color: "#94a3b8", fontSize: 16, lineHeight: 1.8 }}>
            Un porcentaje significativo de las devoluciones en el sector de
            recambios se debe a errores humanos: una referencia mal apuntada por
            teléfono, una confusión entre modelos del mismo vehículo o un pedido
            duplicado que nadie detectó a tiempo. El coste de una devolución no
            es solo la pieza — es el tiempo de gestión, el transporte de vuelta y
            el retraso en la reparación.
          </p>
          <p style={{ color: "#94a3b8", fontSize: 16, lineHeight: 1.8 }}>
            Un marketplace elimina la mayoría de estos errores porque la búsqueda
            se hace por referencia exacta o por matrícula del vehículo, con
            filtros de compatibilidad automáticos. El pedido queda registrado
            digitalmente con todos los datos (referencia, cantidad, proveedor,
            precio, fecha), lo que facilita cualquier reclamación posterior.
          </p>
        </div>

        <div style={section}>
          <h2
            style={{
              fontSize: 22,
              fontWeight: 800,
              marginBottom: 16,
              color: "white",
              display: "flex",
              alignItems: "center",
            }}
          >
            <span style={ventajaNum}>3</span>
            Ahorrar tiempo en la gestión diaria
          </h2>
          <p style={{ color: "#94a3b8", fontSize: 16, lineHeight: 1.8 }}>
            Un taller medio realiza entre 5 y 15 pedidos de recambios al día. Si
            cada pedido requiere una llamada de 10 minutos (buscar la pieza,
            preguntar precio, confirmar stock, dictar los datos de envío),
            estamos hablando de entre 1 y 2,5 horas diarias dedicadas solo a
            comprar piezas. Eso es tiempo que el mecánico o el encargado no está
            facturando.
          </p>
          <p style={{ color: "#94a3b8", fontSize: 16, lineHeight: 1.8 }}>
            Con un marketplace, el mismo pedido se resuelve en 2-3 minutos:
            buscas, comparas, seleccionas y confirmas. El historial de pedidos
            queda guardado, las direcciones de envío están preconfiguradas y las
            facturas se generan automáticamente. Un taller que pasa de gestión
            telefónica a digital puede recuperar más de una hora productiva al
            día.
          </p>
        </div>

        <div style={section}>
          <h2
            style={{
              fontSize: 22,
              fontWeight: 800,
              marginBottom: 16,
              color: "white",
              display: "flex",
              alignItems: "center",
            }}
          >
            <span style={ventajaNum}>4</span>
            Logística integrada con tracking en tiempo real
          </h2>
          <p style={{ color: "#94a3b8", fontSize: 16, lineHeight: 1.8 }}>
            Una de las mayores frustraciones para un taller es no saber cuándo
            llegará la pieza. El cliente espera con el coche en el elevador, el
            mecánico tiene la bahía ocupada y nadie puede confirmar si el paquete
            llega hoy o mañana. Los marketplaces B2B modernos integran las
            principales agencias de transporte (GLS, MRW, NACEX, SEUR, Correos
            Express, CTT Express) y ofrecen tracking en tiempo real desde el
            momento en que el proveedor confirma el envío.
          </p>
          <p style={{ color: "#94a3b8", fontSize: 16, lineHeight: 1.8 }}>
            Recambio Directo, por ejemplo, genera etiquetas de envío
            automáticamente para el proveedor, lo que acelera la preparación del
            pedido y reduce errores en la dirección de entrega. El taller recibe
            notificaciones de estado y puede planificar el trabajo sabiendo
            exactamente cuándo tendrá la pieza disponible.
          </p>
        </div>

        <div style={section}>
          <h2
            style={{
              fontSize: 22,
              fontWeight: 800,
              marginBottom: 16,
              color: "white",
              display: "flex",
              alignItems: "center",
            }}
          >
            <span style={ventajaNum}>5</span>
            Acceso a financiación y pago aplazado
          </h2>
          <p style={{ color: "#94a3b8", fontSize: 16, lineHeight: 1.8 }}>
            La tesorería es uno de los principales retos de un taller mecánico.
            El cliente no siempre paga al recoger el coche, pero el proveedor
            de recambios necesita cobrar. Este desajuste de flujo de caja obliga
            a muchos talleres a limitar sus compras o a negociar condiciones de
            pago individualmente con cada distribuidor.
          </p>
          <p style={{ color: "#94a3b8", fontSize: 16, lineHeight: 1.8 }}>
            Los marketplaces B2B pueden ofrecer soluciones de financiación
            integradas. En Recambio Directo, RD Pago permite a los talleres
            comprar ahora y pagar en 15 días, sin coste adicional. Esta línea
            de crédito se activa automáticamente tras un mes de actividad y un
            primer pago con tarjeta, sin papeleo ni avales. Para el taller es
            como tener una cuenta corriente con su proveedor, pero gestionada
            digitalmente y con múltiples distribuidores a la vez.
          </p>
        </div>

        <div style={section}>
          <h2
            style={{ fontSize: 22, fontWeight: 800, marginBottom: 16, color: "white" }}
          >
            El modelo B2B digital está transformando el sector
          </h2>
          <p style={{ color: "#94a3b8", fontSize: 16, lineHeight: 1.8 }}>
            En otros sectores industriales — ferretería, material eléctrico,
            suministros médicos — la transición al marketplace B2B ya es una
            realidad consolidada. El sector de recambios de automoción en España
            está en plena transformación, y los talleres que adoptan herramientas
            digitales ahora tendrán una ventaja competitiva clara frente a los
            que sigan dependiendo del teléfono y la libreta.
          </p>
          <p style={{ color: "#94a3b8", fontSize: 16, lineHeight: 1.8 }}>
            No se trata de eliminar la relación con el proveedor de toda la vida,
            sino de complementarla con una herramienta que ahorra tiempo,
            reduce errores y da visibilidad sobre precios y plazos. El
            distribuidor de confianza sigue estando ahí — pero ahora compites
            con información, no con intuición.
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
            Prueba el marketplace B2B de recambios gratis
          </p>
          <p
            style={{
              color: "#94a3b8",
              fontSize: 15,
              marginBottom: 20,
              lineHeight: 1.6,
            }}
          >
            Primer mes gratis, sin permanencia. Compara precios, haz pedidos y
            gestiona tu logística desde un solo lugar.
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
