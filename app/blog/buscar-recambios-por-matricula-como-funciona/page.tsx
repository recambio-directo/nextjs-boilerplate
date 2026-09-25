import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Buscar recambios por matrícula: cómo funciona y por qué ahorra tiempo | Recambio Directo",
  description: "Descubre cómo buscar recambios de automoción por matrícula del vehículo. Identifica la pieza exacta sin errores y ahorra tiempo en cada pedido.",
  alternates: { canonical: "https://www.recambio-directo.com/blog/buscar-recambios-por-matricula-como-funciona" },
};

const jsonLd = "{\"@context\": \"https://schema.org\", \"@type\": \"Article\", \"headline\": \"Buscar recambios por matr\u00edcula: c\u00f3mo funciona y por qu\u00e9 ahorra tiempo\", \"description\": \"Descubre c\u00f3mo buscar recambios de automoci\u00f3n por matr\u00edcula del veh\u00edculo. Identifica la pieza exacta sin errores y ahorra tiempo en cada pedido.\", \"url\": \"https://www.recambio-directo.com/blog/buscar-recambios-por-matricula-como-funciona\", \"author\": {\"@type\": \"Organization\", \"name\": \"Recambio Directo\"}, \"publisher\": {\"@type\": \"Organization\", \"name\": \"Recambio Directo\", \"url\": \"https://www.recambio-directo.com\"}, \"datePublished\": \"2026-09-25\", \"mainEntityOfPage\": \"https://www.recambio-directo.com/blog/buscar-recambios-por-matricula-como-funciona\"}";

export default function Page() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
      <main style={{ minHeight: "100vh", background: "linear-gradient(135deg,#020617,#020b2d)", color: "white", padding: "60px 20px" }}>
        <div style={{ maxWidth: 800, margin: "0 auto" }}>

          <nav style={{ marginBottom: 32, fontSize: 13, color: "#64748b" }}>
            <a href="/" style={{ color: "#60a5fa", textDecoration: "none" }}>Inicio</a>
            {" › "}
            <a href="/blog" style={{ color: "#60a5fa", textDecoration: "none" }}>Blog</a>
            {" › "}
            <span style={{ color: "#94a3b8" }}>Artículo</span>
          </nav>

          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <div style={{ display: "inline-block", background: "rgba(37,99,235,0.15)", color: "#60a5fa", padding: "8px 18px", borderRadius: 999, fontWeight: 700, marginBottom: 20, fontSize: 13, letterSpacing: "0.05em" }}>BLOG</div>
            <h1 style={{ fontSize: "clamp(32px, 4.5vw, 48px)", fontWeight: 900, marginBottom: 16, lineHeight: 1.15 }}>
              Buscar recambios por matrícula: cómo funciona y por qué ahorra tiempo
            </h1>
            <p style={{ color: "#64748b", fontSize: 14 }}>Publicado en septiembre 2026 · Recambio Directo</p>
          </div>

          <div style={{ background: "rgba(15,23,42,0.92)", borderRadius: 24, padding: 32, border: "1px solid rgba(255,255,255,0.06)", marginBottom: 24 }}>
            <h2 style={{ fontSize: 24, fontWeight: 900, marginBottom: 16 }}>El problema de buscar por referencia manualmente</h2>
            <p style={{ color: "#94a3b8", fontSize: 15, lineHeight: 1.8, marginBottom: 16 }}>Cada vehículo tiene cientos de variantes: motorización, año, versión de equipamiento. Una referencia de pastillas de freno puede tener 4 opciones distintas para el mismo modelo según el año y la motorización.</p>
            <p style={{ color: "#94a3b8", fontSize: 15, lineHeight: 1.8, marginBottom: 16 }}>Buscar la referencia correcta manualmente — consultando catálogos TecDoc, llamando al proveedor, verificando con el VIN — consume entre 5 y 15 minutos por pieza. Multiplica eso por los 10-20 pedidos diarios de un taller medio.</p>
          </div>
          <div style={{ background: "rgba(15,23,42,0.92)", borderRadius: 24, padding: 32, border: "1px solid rgba(255,255,255,0.06)", marginBottom: 24 }}>
            <h2 style={{ fontSize: 24, fontWeight: 900, marginBottom: 16 }}>Cómo funciona la búsqueda por matrícula</h2>
            <p style={{ color: "#94a3b8", fontSize: 15, lineHeight: 1.8, marginBottom: 16 }}>La búsqueda por matrícula identifica automáticamente el vehículo exacto: marca, modelo, motorización, año de fabricación y variante. Con esa información, el sistema cruza las bases de datos de recambios y muestra solo las piezas compatibles.</p>
            <p style={{ color: "#94a3b8", fontSize: 15, lineHeight: 1.8, marginBottom: 16 }}>En Recambio Directo, introduces la matrícula y en segundos ves las piezas que encajan con ese vehículo concreto. Sin errores de compatibilidad, sin devoluciones por pieza incorrecta, sin tiempo perdido verificando.</p>
          </div>
          <div style={{ background: "rgba(15,23,42,0.92)", borderRadius: 24, padding: 32, border: "1px solid rgba(255,255,255,0.06)", marginBottom: 24 }}>
            <h2 style={{ fontSize: 24, fontWeight: 900, marginBottom: 16 }}>Ventajas para el taller</h2>
            <p style={{ color: "#94a3b8", fontSize: 15, lineHeight: 1.8, marginBottom: 16 }}>Menos errores: al identificar el vehículo automáticamente, eliminas el riesgo de pedir una pieza incorrecta. Menos devoluciones, menos tiempo perdido, menos clientes esperando.</p>
            <p style={{ color: "#94a3b8", fontSize: 15, lineHeight: 1.8, marginBottom: 16 }}>Más rapidez: lo que antes eran 10 minutos de búsqueda se convierte en 30 segundos. Multiplica eso por 15 pedidos al día y son más de 2 horas recuperadas para producir.</p>
          </div>
          <div style={{ background: "rgba(15,23,42,0.92)", borderRadius: 24, padding: 32, border: "1px solid rgba(255,255,255,0.06)", marginBottom: 24 }}>
            <h2 style={{ fontSize: 24, fontWeight: 900, marginBottom: 16 }}>Prueba la búsqueda por matrícula en Recambio Directo</h2>
            <p style={{ color: "#94a3b8", fontSize: 15, lineHeight: 1.8, marginBottom: 16 }}>Recambio Directo integra la búsqueda por matrícula en su plataforma B2B. Combina la identificación automática del vehículo con la comparación de precios entre proveedores verificados.</p>
            <p style={{ color: "#94a3b8", fontSize: 15, lineHeight: 1.8, marginBottom: 16 }}>El resultado: encuentras la pieza correcta al mejor precio en menos de un minuto. Regístrate gratis y pruébalo con la matrícula de tu próxima reparación.</p>
          </div>

          <div style={{ textAlign: "center", marginTop: 48, background: "rgba(15,23,42,0.92)", borderRadius: 24, padding: 40, border: "1px solid rgba(255,255,255,0.06)" }}>
            <h2 style={{ fontSize: 28, fontWeight: 900, marginBottom: 16 }}>¿Quieres probarlo?</h2>
            <p style={{ color: "#94a3b8", marginBottom: 24, fontSize: 16 }}>Primer mes gratis. Sin permanencia. Solo 25 €/mes después.</p>
            <a href="/registro" style={{ display: "inline-block", background: "linear-gradient(135deg,#2563eb,#1d4ed8)", color: "white", padding: "18px 48px", borderRadius: 14, fontWeight: 800, textDecoration: "none", fontSize: 17 }}>
              REGISTRARME GRATIS →
            </a>
          </div>

          <div style={{ textAlign: "center", marginTop: 32, fontSize: 13 }}>
            <a href="/blog" style={{ color: "#60a5fa", textDecoration: "none" }}>← Volver al blog</a>
          </div>
        </div>
      </main>
    </>
  );
}
