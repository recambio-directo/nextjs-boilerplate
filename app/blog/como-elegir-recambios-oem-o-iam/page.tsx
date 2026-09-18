import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cómo elegir entre recambios OEM e IAM: guía para talleres",
  description:
    "Diferencias entre piezas OEM e IAM, cuándo conviene cada tipo, cómo afectan a la garantía y consejos para talleres mecánicos en España.",
  alternates: {
    canonical:
      "https://www.recambio-directo.com/blog/como-elegir-recambios-oem-o-iam",
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

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Article",
      "headline": "Cómo elegir entre recambios OEM e IAM: guía para talleres",
      "description": "Diferencias entre piezas OEM e IAM, cuándo conviene cada tipo, cómo afectan a la garantía y consejos para talleres mecánicos en España.",
      "datePublished": "2026-09-01",
      "dateModified": "2026-09-18",
      "author": { "@type": "Organization", "name": "Recambio Directo", "url": "https://www.recambio-directo.com" },
      "publisher": { "@id": "https://www.recambio-directo.com/#organization" },
      "mainEntityOfPage": "https://www.recambio-directo.com/blog/como-elegir-recambios-oem-o-iam",
      "inLanguage": "es-ES",
    },
    {
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Inicio", "item": "https://www.recambio-directo.com" },
        { "@type": "ListItem", "position": 2, "name": "Blog", "item": "https://www.recambio-directo.com/blog" },
        { "@type": "ListItem", "position": 3, "name": "OEM vs IAM", "item": "https://www.recambio-directo.com/blog/como-elegir-recambios-oem-o-iam" },
      ],
    },
  ],
};

export default function ArticuloOemIam() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
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

        <div style={badge}>GUÍA TÉCNICA</div>

        <h1
          style={{
            fontSize: "clamp(28px, 4vw, 44px)",
            fontWeight: 900,
            lineHeight: 1.15,
            marginBottom: 12,
          }}
        >
          Cómo elegir entre recambios OEM e IAM: guía para talleres
        </h1>

        <p style={{ color: "#64748b", fontSize: 14, marginBottom: 32 }}>
          Septiembre 2026 · 8 min de lectura
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
            Elegir entre piezas OEM (Original Equipment Manufacturer) e IAM
            (Independent Aftermarket) es una de las decisiones más frecuentes en
            cualquier taller mecánico. La elección correcta afecta al coste de la
            reparación, a la satisfacción del cliente y a la garantía del
            vehículo. En esta guía explicamos las diferencias reales, cuándo
            conviene cada opción y cómo un marketplace B2B como Recambio Directo
            puede simplificar la comparación.
          </p>
        </div>

        <div style={section}>
          <h2
            style={{ fontSize: 22, fontWeight: 800, marginBottom: 16, color: "white" }}
          >
            ¿Qué son los recambios OEM?
          </h2>
          <p style={{ color: "#94a3b8", fontSize: 16, lineHeight: 1.8 }}>
            Las piezas OEM son fabricadas por el mismo proveedor que suministra
            al fabricante del vehículo. Llevan la marca del constructor
            (Volkswagen, Renault, Toyota…) y se distribuyen a través de la red
            oficial de concesionarios. Esto implica que cumplen exactamente las
            mismas especificaciones que la pieza original montada en fábrica.
          </p>
          <p style={{ color: "#94a3b8", fontSize: 16, lineHeight: 1.8 }}>
            Su principal ventaja es la compatibilidad garantizada: no hay
            sorpresas en el montaje, las tolerancias son idénticas y el cliente
            recibe una pieza con el sello de la marca. Sin embargo, su precio es
            considerablemente más alto — entre un 20% y un 60% más que una pieza
            equivalente IAM — porque incluye el margen del fabricante del
            vehículo y de la red oficial.
          </p>
        </div>

        <div style={section}>
          <h2
            style={{ fontSize: 22, fontWeight: 800, marginBottom: 16, color: "white" }}
          >
            ¿Qué son los recambios IAM?
          </h2>
          <p style={{ color: "#94a3b8", fontSize: 16, lineHeight: 1.8 }}>
            Las piezas IAM proceden de fabricantes independientes que producen
            recambios compatibles con múltiples marcas y modelos. Empresas como
            Bosch, Valeo, Sachs, TRW, Mann-Filter o SKF son ejemplos de
            fabricantes IAM de primer nivel que, en muchos casos, son los mismos
            que fabrican las piezas OEM para los constructores — simplemente las
            comercializan con su propia marca y sin el sobreprecio del canal
            oficial.
          </p>
          <p style={{ color: "#94a3b8", fontSize: 16, lineHeight: 1.8 }}>
            La calidad de las piezas IAM varía mucho según el fabricante.
            Existen piezas IAM de calidad equivalente (o idéntica) a la original,
            denominadas «calidad OE» o «primer equipo», y piezas IAM de gama
            económica pensadas para reparaciones donde el presupuesto es la
            prioridad. Saber distinguir entre ambas es clave para un taller
            profesional.
          </p>
        </div>

        <div style={section}>
          <h2
            style={{ fontSize: 22, fontWeight: 800, marginBottom: 16, color: "white" }}
          >
            Comparativa directa: OEM vs IAM
          </h2>
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                color: "#94a3b8",
                fontSize: 15,
              }}
            >
              <thead>
                <tr
                  style={{
                    borderBottom: "1px solid rgba(255,255,255,0.1)",
                    textAlign: "left",
                  }}
                >
                  <th style={{ padding: "12px 8px", color: "white" }}>Aspecto</th>
                  <th style={{ padding: "12px 8px", color: "white" }}>OEM</th>
                  <th style={{ padding: "12px 8px", color: "white" }}>IAM</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["Precio", "Alto (margen de marca)", "Medio-bajo"],
                  ["Calidad", "Garantizada por el constructor", "Variable según fabricante"],
                  ["Compatibilidad", "Exacta", "Hay que verificar referencias"],
                  ["Garantía del vehículo", "No afecta nunca", "No afecta si es calidad OE"],
                  ["Disponibilidad", "Solo red oficial", "Múltiples distribuidores"],
                  ["Plazo de entrega", "Variable (stock oficial)", "Generalmente más rápido"],
                ].map(([aspecto, oem, iam]) => (
                  <tr
                    key={aspecto}
                    style={{
                      borderBottom: "1px solid rgba(255,255,255,0.05)",
                    }}
                  >
                    <td style={{ padding: "10px 8px", fontWeight: 600, color: "#e2e8f0" }}>
                      {aspecto}
                    </td>
                    <td style={{ padding: "10px 8px" }}>{oem}</td>
                    <td style={{ padding: "10px 8px" }}>{iam}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div style={section}>
          <h2
            style={{ fontSize: 22, fontWeight: 800, marginBottom: 16, color: "white" }}
          >
            ¿Cuándo elegir OEM?
          </h2>
          <p style={{ color: "#94a3b8", fontSize: 16, lineHeight: 1.8 }}>
            La pieza OEM es la mejor opción cuando el vehículo está en garantía
            oficial y el cliente quiere mantenerla sin riesgo alguno. También es
            recomendable en piezas de seguridad crítica como airbags, sensores
            ADAS o componentes del sistema de frenado electrónico donde la
            homologación exacta del constructor es esencial.
          </p>
          <p style={{ color: "#94a3b8", fontSize: 16, lineHeight: 1.8 }}>
            Los vehículos premium (Mercedes, BMW, Audi) o de reciente
            fabricación con sistemas electrónicos complejos también se benefician
            del recambio OEM, porque las tolerancias de calibración son más
            estrictas y una pieza genérica puede generar errores en la
            centralita.
          </p>
        </div>

        <div style={section}>
          <h2
            style={{ fontSize: 22, fontWeight: 800, marginBottom: 16, color: "white" }}
          >
            ¿Cuándo elegir IAM?
          </h2>
          <p style={{ color: "#94a3b8", fontSize: 16, lineHeight: 1.8 }}>
            Para la gran mayoría de reparaciones de mantenimiento — pastillas de
            freno, filtros, amortiguadores, kits de distribución, embragues —
            una pieza IAM de primer nivel ofrece la misma calidad a un precio
            significativamente menor. En vehículos fuera de garantía, que
            representan la mayor parte del parque automovilístico español, la
            relación calidad-precio del IAM es imbatible.
          </p>
          <p style={{ color: "#94a3b8", fontSize: 16, lineHeight: 1.8 }}>
            Además, los fabricantes IAM de referencia (Bosch, Valeo, LuK, TRW,
            NGK) ofrecen sus propias garantías de 2 años que cubren defectos de
            fabricación. Esto da al taller y al cliente final la misma seguridad
            que la pieza de marca, pero con un ahorro que puede superar el 40%.
          </p>
        </div>

        <div style={section}>
          <h2
            style={{ fontSize: 22, fontWeight: 800, marginBottom: 16, color: "white" }}
          >
            El mito de la garantía del vehículo
          </h2>
          <p style={{ color: "#94a3b8", fontSize: 16, lineHeight: 1.8 }}>
            Una creencia errónea muy extendida es que montar una pieza IAM anula
            la garantía del fabricante. La normativa europea (Reglamento CE
            461/2010, conocido como «Block Exemption») establece expresamente
            que el uso de recambios de calidad equivalente no puede ser motivo
            para rechazar una reclamación de garantía, siempre que la pieza
            instalada no sea la causa directa del fallo.
          </p>
          <p style={{ color: "#94a3b8", fontSize: 16, lineHeight: 1.8 }}>
            En la práctica, esto significa que si un taller monta unos discos de
            freno Brembo (IAM) y posteriormente falla el turbo, el fabricante no
            puede rechazar la cobertura del turbo alegando que los discos no eran
            originales. El taller debe documentar la reparación con la factura y
            la referencia de la pieza para proteger al cliente.
          </p>
        </div>

        <div style={section}>
          <h2
            style={{ fontSize: 22, fontWeight: 800, marginBottom: 16, color: "white" }}
          >
            Cómo comparar recambios OEM e IAM en Recambio Directo
          </h2>
          <p style={{ color: "#94a3b8", fontSize: 16, lineHeight: 1.8 }}>
            En Recambio Directo puedes buscar cualquier pieza por referencia OEM
            o por matrícula y ver de forma inmediata todas las opciones
            disponibles — tanto originales como IAM — con sus precios, plazos de
            entrega y proveedor. Esto permite al taller tomar una decisión
            informada en segundos, sin tener que llamar a tres distribuidores
            distintos.
          </p>
          <p style={{ color: "#94a3b8", fontSize: 16, lineHeight: 1.8 }}>
            La plataforma muestra la equivalencia de referencias cruzadas, de
            modo que puedes partir de la referencia OEM del constructor y ver
            qué fabricantes IAM ofrecen una pieza compatible, con qué
            certificaciones y a qué precio. Así, la decisión entre OEM e IAM
            deja de ser una cuestión de intuición y pasa a basarse en datos
            reales.
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
            Compara recambios OEM e IAM en un solo lugar
          </p>
          <p
            style={{
              color: "#94a3b8",
              fontSize: 15,
              marginBottom: 20,
              lineHeight: 1.6,
            }}
          >
            Regístrate gratis en Recambio Directo y accede a miles de
            referencias de múltiples proveedores verificados.
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

        <div style={{ ...section, marginTop: 32 }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 16, color: "white" }}>
            Artículos relacionados
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <a href="/blog/ventajas-marketplace-b2b-recambios" style={{ color: "#60a5fa", textDecoration: "none", fontSize: 15, lineHeight: 1.6 }}>
              → 5 ventajas de usar un marketplace B2B para comprar recambios
            </a>
            <a href="/blog/guia-logistica-recambios-automocion" style={{ color: "#60a5fa", textDecoration: "none", fontSize: 15, lineHeight: 1.6 }}>
              → Guía de logística para recambios de automoción en España
            </a>
          </div>
          <p style={{ color: "#64748b", fontSize: 14, marginTop: 16, lineHeight: 1.6 }}>
            Encuentra recambios OEM e IAM en tu ciudad:{" "}
            <a href="/recambios-madrid" style={{ color: "#60a5fa", textDecoration: "none" }}>Madrid</a>{" · "}
            <a href="/recambios-barcelona" style={{ color: "#60a5fa", textDecoration: "none" }}>Barcelona</a>{" · "}
            <a href="/recambios-valencia" style={{ color: "#60a5fa", textDecoration: "none" }}>Valencia</a>{" · "}
            <a href="/recambios-sevilla" style={{ color: "#60a5fa", textDecoration: "none" }}>Sevilla</a>{" · "}
            <a href="/recambios-bilbao" style={{ color: "#60a5fa", textDecoration: "none" }}>Bilbao</a>
          </p>
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
    </>
  );
}
