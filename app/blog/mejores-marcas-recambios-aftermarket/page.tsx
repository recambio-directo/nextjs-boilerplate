import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Las 10 Mejores Marcas de Recambios Aftermarket en 2026 | Recambio Directo",
  description: "Ranking de las mejores marcas de recambios aftermarket para talleres: Bosch, Brembo, Valeo, MANN-FILTER y más. Calidad OE a precio IAM.",
  alternates: { canonical: "https://www.recambio-directo.com/blog/mejores-marcas-recambios-aftermarket" },
  openGraph: {
    title: "Las 10 Mejores Marcas de Recambios Aftermarket",
    description: "Las marcas aftermarket más fiables para talleres mecánicos en España.",
    type: "article",
    publishedTime: "2026-10-07",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "Las 10 Mejores Marcas de Recambios Aftermarket en 2026",
  "description": "Ranking de las mejores marcas aftermarket para talleres mecánicos.",
  "datePublished": "2026-10-07",
  "dateModified": "2026-10-07",
  "author": { "@type": "Organization", "name": "Recambio Directo", "url": "https://www.recambio-directo.com" },
  "publisher": { "@type": "Organization", "name": "Recambio Directo", "logo": { "@type": "ImageObject", "url": "https://www.recambio-directo.com/icons/manifest-icon-512.maskable.png" } },
  "mainEntityOfPage": "https://www.recambio-directo.com/blog/mejores-marcas-recambios-aftermarket"
};

const card: React.CSSProperties = { background: "rgba(15,23,42,0.92)", borderRadius: 24, padding: 32, border: "1px solid rgba(255,255,255,0.06)", marginBottom: 24 };

const marcas = [
  { nombre: "Bosch", slug: "bosch", especialidad: "Inyección, bujías, alternadores, motores de arranque, escobillas, filtros", desc: "El mayor fabricante de componentes de automoción del mundo. Suministra a prácticamente todas las marcas de coches como OE. Sus piezas aftermarket son idénticas a las originales en la mayoría de aplicaciones." },
  { nombre: "Brembo", slug: "brembo", especialidad: "Discos y pastillas de freno", desc: "Referencia mundial en frenado. Equipa de serie a marcas como Alfa Romeo, Ferrari, Porsche y Audi. Sus discos y pastillas aftermarket ofrecen la misma calidad OE a precio IAM." },
  { nombre: "Valeo", slug: "valeo", especialidad: "Embragues, iluminación, motores de arranque, alternadores, escobillas", desc: "Multinacional francesa que suministra a Peugeot, Citroën, Renault y muchas más. Uno de los mayores fabricantes OE de embragues y sistemas de iluminación." },
  { nombre: "MANN-FILTER", slug: "mann-filter", especialidad: "Filtros de aceite, aire, habitáculo y combustible", desc: "El especialista en filtración. Suministra filtros OE a BMW, Mercedes, Volkswagen y Audi entre otros. Sus filtros aftermarket son los mismos que van montados de fábrica." },
  { nombre: "Sachs", slug: "sachs", especialidad: "Amortiguadores, embragues, volantes bimasa", desc: "Pertenece al grupo ZF. Suministra amortiguadores OE a BMW, Mercedes, Audi y Porsche. Referencia en embragues y volantes bimasa." },
  { nombre: "LuK", slug: "luk", especialidad: "Embragues, volantes bimasa, sistemas hidráulicos", desc: "También del grupo ZF/Schaeffler. Líder mundial en embragues. Suministra a Volkswagen, Ford, Fiat y muchas más como OE." },
  { nombre: "TRW", slug: "trw", especialidad: "Frenos, dirección, suspensión", desc: "Ahora parte de ZF. Uno de los mayores fabricantes OE de sistemas de frenado y dirección. Sus pastillas, discos y componentes de dirección tienen calidad probada." },
  { nombre: "Monroe", slug: "monroe", especialidad: "Amortiguadores y suspensión", desc: "Una de las marcas de amortiguadores más reconocidas del mundo. Suministra OE a General Motors, Ford y Fiat entre otros." },
  { nombre: "NGK", slug: "ngk", especialidad: "Bujías, sondas lambda, bobinas de encendido", desc: "Líder mundial en bujías. Suministra a prácticamente todos los fabricantes de coches japoneses y muchos europeos como OE." },
  { nombre: "Continental", slug: "continental", especialidad: "Correas de distribución y accesorios, sensores, turbocompresores", desc: "Gigante alemán conocido por neumáticos, pero también fabrica correas, tensores y sensores OE para la mayoría de marcas europeas." },
];

export default function BlogMejoresMarcasPage() {
  return (
    <main style={{ minHeight: "100vh", background: "linear-gradient(135deg,#020617,#020b2d)", color: "white", padding: "60px 20px" }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <article style={{ maxWidth: 800, margin: "0 auto" }}>

        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <div style={{ display: "inline-block", background: "rgba(37,99,235,0.15)", color: "#60a5fa", padding: "8px 18px", borderRadius: 999, fontWeight: 700, marginBottom: 20, fontSize: 13 }}>GUÍA DE MARCAS</div>
          <h1 style={{ fontSize: "clamp(32px, 5vw, 48px)", fontWeight: 900, marginBottom: 16, lineHeight: 1.15 }}>
            Las 10 mejores marcas de recambios aftermarket en 2026
          </h1>
          <p style={{ color: "#94a3b8", fontSize: 16 }}>Actualizado en octubre de 2026 · 7 min de lectura</p>
        </div>

        <div style={card}>
          <p style={{ color: "#cbd5e1", fontSize: 16, lineHeight: 1.9 }}>
            Elegir la marca correcta de recambio es tan importante como encontrar la referencia correcta. Una pieza aftermarket de calidad OE cuesta un 20-40 % menos que la pieza con referencia del fabricante del coche, pero solo si eliges marcas que realmente suministran como OE. En esta guía repasamos las 10 marcas aftermarket más fiables para talleres mecánicos en España.
          </p>
        </div>

        {marcas.map(({ nombre, slug, especialidad, desc }, i) => (
          <div key={slug} style={card}>
            <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 14 }}>
              <div style={{ width: 44, height: 44, borderRadius: "50%", background: "linear-gradient(135deg,#2563eb,#1d4ed8)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 20, flexShrink: 0 }}>{i + 1}</div>
              <h2 style={{ fontSize: 24, fontWeight: 900, margin: 0 }}>
                <a href={`/marcas/${slug}`} style={{ color: "white", textDecoration: "none" }}>{nombre}</a>
              </h2>
            </div>
            <p style={{ color: "#60a5fa", fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Especialidad: {especialidad}</p>
            <p style={{ color: "#cbd5e1", fontSize: 15, lineHeight: 1.8 }}>{desc}</p>
            <div style={{ marginTop: 12 }}>
              <a href={`/marcas/${slug}`} style={{ color: "#60a5fa", fontSize: 14, textDecoration: "underline" }}>Ver recambios {nombre} en Recambio Directo →</a>
            </div>
          </div>
        ))}

        <div style={card}>
          <h2 style={{ fontSize: 24, fontWeight: 900, marginBottom: 16, color: "white" }}>¿Cómo elegir entre marcas?</h2>
          <p style={{ color: "#cbd5e1", fontSize: 16, lineHeight: 1.9 }}>
            La regla general es sencilla: si una marca fabrica esa pieza como OE para el vehículo en cuestión, su versión aftermarket es la apuesta segura. Es literalmente la misma pieza con diferente etiqueta.
          </p>
          <p style={{ color: "#cbd5e1", fontSize: 16, lineHeight: 1.9, marginTop: 16 }}>
            Para saber qué marca es el fabricante OE de una pieza concreta, busca la referencia OEM y mira los cruces: la marca que aparece con referencia directa (no adaptada) suele ser el fabricante OE. Los catálogos TecDoc y las plataformas B2B como <a href="/" style={{ color: "#60a5fa", textDecoration: "underline" }}>Recambio Directo</a> te muestran esta información automáticamente.
          </p>
        </div>

        <div style={{ ...card, background: "rgba(37,99,235,0.1)", border: "1px solid rgba(37,99,235,0.3)" }}>
          <h2 style={{ fontSize: 24, fontWeight: 900, marginBottom: 16, color: "white" }}>Compara precios de estas marcas</h2>
          <p style={{ color: "#cbd5e1", fontSize: 16, lineHeight: 1.9, marginBottom: 24 }}>
            En Recambio Directo encuentras todas estas marcas entre los catálogos de nuestros proveedores. Compara precios y elige la mejor opción para cada reparación.
          </p>
          <a href="/registro" style={{ display: "inline-block", background: "linear-gradient(135deg,#2563eb,#1d4ed8)", color: "white", padding: "16px 40px", borderRadius: 14, fontWeight: 800, textDecoration: "none", fontSize: 16 }}>
            PROBAR GRATIS →
          </a>
        </div>

        <div style={{ textAlign: "center", marginTop: 32, color: "#64748b", fontSize: 13 }}>
          <a href="/blog" style={{ color: "#60a5fa", textDecoration: "none" }}>← Volver al blog</a>
          {" · "}
          <a href="/blog/como-ahorrar-recambios-taller" style={{ color: "#60a5fa", textDecoration: "none" }}>Guía de ahorro</a>
          {" · "}
          <a href="/" style={{ color: "#60a5fa", textDecoration: "none" }}>Inicio</a>
        </div>
      </article>
    </main>
  );
}
