import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cómo Buscar Recambios por Referencia OEM — Guía para Talleres | Recambio Directo",
  description: "Aprende a buscar recambios por referencia OEM, encontrar equivalencias IAM y usar cruces de referencias para comprar la pieza correcta al mejor precio.",
  alternates: { canonical: "https://www.recambio-directo.com/blog/buscar-recambios-por-referencia-oem" },
  openGraph: {
    title: "Cómo Buscar Recambios por Referencia OEM",
    description: "Guía práctica para buscar piezas por referencia OEM y encontrar equivalencias IAM.",
    type: "article",
    publishedTime: "2026-10-07",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "Cómo Buscar Recambios por Referencia OEM — Guía para Talleres",
  "description": "Guía práctica para buscar piezas por referencia OEM y encontrar equivalencias IAM al mejor precio.",
  "datePublished": "2026-10-07",
  "dateModified": "2026-10-07",
  "author": { "@type": "Organization", "name": "Recambio Directo", "url": "https://www.recambio-directo.com" },
  "publisher": { "@type": "Organization", "name": "Recambio Directo", "logo": { "@type": "ImageObject", "url": "https://www.recambio-directo.com/icons/manifest-icon-512.maskable.png" } },
  "mainEntityOfPage": "https://www.recambio-directo.com/blog/buscar-recambios-por-referencia-oem"
};

const card: React.CSSProperties = { background: "rgba(15,23,42,0.92)", borderRadius: 24, padding: 32, border: "1px solid rgba(255,255,255,0.06)", marginBottom: 24 };

export default function BlogBuscarReferenciaOEMPage() {
  return (
    <main style={{ minHeight: "100vh", background: "linear-gradient(135deg,#020617,#020b2d)", color: "white", padding: "60px 20px" }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <article style={{ maxWidth: 800, margin: "0 auto" }}>

        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <div style={{ display: "inline-block", background: "rgba(37,99,235,0.15)", color: "#60a5fa", padding: "8px 18px", borderRadius: 999, fontWeight: 700, marginBottom: 20, fontSize: 13 }}>GUÍA TÉCNICA</div>
          <h1 style={{ fontSize: "clamp(32px, 5vw, 48px)", fontWeight: 900, marginBottom: 16, lineHeight: 1.15 }}>
            Cómo buscar recambios por referencia OEM
          </h1>
          <p style={{ color: "#94a3b8", fontSize: 16 }}>Actualizado en octubre de 2026 · 6 min de lectura</p>
        </div>

        <div style={card}>
          <p style={{ color: "#cbd5e1", fontSize: 16, lineHeight: 1.9 }}>
            La referencia OEM (Original Equipment Manufacturer) es el código que el fabricante del vehículo asigna a cada pieza. Es la forma más fiable de encontrar exactamente la pieza que necesitas, sin errores de compatibilidad. En esta guía te explicamos cómo usarla para buscar recambios y cómo encontrar equivalencias más baratas.
          </p>
        </div>

        <div style={card}>
          <h2 style={{ fontSize: 26, fontWeight: 900, marginBottom: 16, color: "white" }}>¿Qué es una referencia OEM?</h2>
          <p style={{ color: "#cbd5e1", fontSize: 16, lineHeight: 1.9 }}>
            La referencia OEM es el número de pieza que aparece en el catálogo oficial del fabricante del coche. Por ejemplo, si tienes un Volkswagen Golf y necesitas unas pastillas de freno delanteras, la referencia OEM podría ser algo como 5K0 698 151. Este código identifica exactamente esa pieza para ese modelo y motorización.
          </p>
          <p style={{ color: "#cbd5e1", fontSize: 16, lineHeight: 1.9, marginTop: 16 }}>
            La ventaja de buscar por referencia OEM es que eliminas las dudas: sabes que estás pidiendo exactamente la pieza que monta el vehículo. No dependes de catálogos de aplicación que a veces tienen errores o ambigüedades.
          </p>
        </div>

        <div style={card}>
          <h2 style={{ fontSize: 26, fontWeight: 900, marginBottom: 16, color: "white" }}>¿Dónde encontrar la referencia OEM?</h2>
          <p style={{ color: "#cbd5e1", fontSize: 16, lineHeight: 1.9 }}>
            Hay varias formas de obtener la referencia OEM de una pieza:
          </p>
          <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 12 }}>
            {[
              { t: "En la pieza vieja", d: "Muchas piezas llevan impresa o grabada la referencia OEM. Desmonta la pieza que vas a sustituir y busca el código en la propia pieza o en su etiqueta." },
              { t: "En el catálogo del fabricante", d: "Los concesionarios y talleres oficiales tienen acceso al catálogo de piezas originales (ETKA para Volkswagen, EPC para BMW, etc.)." },
              { t: "En portales online", d: "Webs como 7Zap, parts-catalogs.com o el portal de piezas del fabricante te permiten buscar por VIN o por modelo y ver las referencias OEM de cada pieza." },
              { t: "Preguntando al proveedor", d: "Si tienes el VIN (número de bastidor), cualquier proveedor con acceso a TecDoc o un catálogo similar puede darte la referencia OEM." },
            ].map(({ t, d }) => (
              <div key={t} style={{ background: "rgba(37,99,235,0.05)", borderRadius: 14, padding: "14px 18px", border: "1px solid rgba(37,99,235,0.1)" }}>
                <strong style={{ color: "white", fontSize: 15 }}>{t}</strong>
                <p style={{ color: "#94a3b8", fontSize: 14, lineHeight: 1.7, marginTop: 4, marginBottom: 0 }}>{d}</p>
              </div>
            ))}
          </div>
        </div>

        <div style={card}>
          <h2 style={{ fontSize: 26, fontWeight: 900, marginBottom: 16, color: "white" }}>OEM vs IAM: ¿cuál comprar?</h2>
          <p style={{ color: "#cbd5e1", fontSize: 16, lineHeight: 1.9 }}>
            Una vez que tienes la referencia OEM, puedes buscar esa pieza exacta (marca del fabricante del coche) o buscar sus equivalencias IAM (Independent Aftermarket): piezas fabricadas por terceros que son compatibles con esa referencia.
          </p>
          <p style={{ color: "#cbd5e1", fontSize: 16, lineHeight: 1.9, marginTop: 16 }}>
            En muchos casos, la pieza IAM es fabricada por la misma empresa que suministra al fabricante del coche. Por ejemplo, <a href="/marcas/bosch" style={{ color: "#60a5fa", textDecoration: "underline" }}>Bosch</a> fabrica bujías para muchas marcas de coches; la bujía «original» con referencia OEM y la bujía Bosch con referencia IAM son físicamente la misma pieza, pero la IAM cuesta un 20-40 % menos.
          </p>
          <p style={{ color: "#cbd5e1", fontSize: 16, lineHeight: 1.9, marginTop: 16 }}>
            La clave está en usar un sistema de cruces de referencias que te muestre automáticamente las equivalencias. En <a href="/" style={{ color: "#60a5fa", textDecoration: "underline" }}>Recambio Directo</a> buscas la referencia OEM y ves todas las equivalencias IAM disponibles con sus precios.
          </p>
        </div>

        <div style={card}>
          <h2 style={{ fontSize: 26, fontWeight: 900, marginBottom: 16, color: "white" }}>Errores comunes al buscar por referencia</h2>
          <p style={{ color: "#cbd5e1", fontSize: 16, lineHeight: 1.9 }}>
            <strong style={{ color: "white" }}>Confundir espacios y guiones.</strong> La referencia 5K0698151, 5K0 698 151 y 5K0-698-151 son la misma pieza, pero algunos buscadores no limpian los espacios. Un buen marketplace normaliza el formato automáticamente.
          </p>
          <p style={{ color: "#cbd5e1", fontSize: 16, lineHeight: 1.9, marginTop: 16 }}>
            <strong style={{ color: "white" }}>Usar la referencia de otro modelo.</strong> Dos versiones del mismo coche (por ejemplo, un Golf con motor 1.6 y otro con 2.0) pueden montar piezas diferentes con referencias distintas. Asegúrate de que la referencia corresponde a la motorización exacta.
          </p>
          <p style={{ color: "#cbd5e1", fontSize: 16, lineHeight: 1.9, marginTop: 16 }}>
            <strong style={{ color: "white" }}>No verificar la compatibilidad de la equivalencia.</strong> Las equivalencias IAM suelen ser fiables, pero siempre conviene comprobar la tabla de aplicaciones del fabricante IAM para confirmar que cubre tu vehículo específico.
          </p>
        </div>

        <div style={{ ...card, background: "rgba(37,99,235,0.1)", border: "1px solid rgba(37,99,235,0.3)" }}>
          <h2 style={{ fontSize: 24, fontWeight: 900, marginBottom: 16, color: "white" }}>Busca tu referencia ahora</h2>
          <p style={{ color: "#cbd5e1", fontSize: 16, lineHeight: 1.9, marginBottom: 24 }}>
            En <a href="/" style={{ color: "#60a5fa", textDecoration: "underline" }}>Recambio Directo</a> buscas por referencia OEM o IAM entre más de 300.000 piezas de proveedores verificados. Ves los precios, las equivalencias y pides en un minuto.
          </p>
          <a href="/registro" style={{ display: "inline-block", background: "linear-gradient(135deg,#2563eb,#1d4ed8)", color: "white", padding: "16px 40px", borderRadius: 14, fontWeight: 800, textDecoration: "none", fontSize: 16 }}>
            PROBAR GRATIS →
          </a>
        </div>

        <div style={{ textAlign: "center", marginTop: 32, color: "#64748b", fontSize: 13 }}>
          <a href="/blog" style={{ color: "#60a5fa", textDecoration: "none" }}>← Volver al blog</a>
          {" · "}
          <a href="/" style={{ color: "#60a5fa", textDecoration: "none" }}>Inicio</a>
        </div>
      </article>
    </main>
  );
}
