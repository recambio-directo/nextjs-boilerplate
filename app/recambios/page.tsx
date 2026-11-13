import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Recambios de Automoción por Categoría — Marketplace B2B",
  description: "Todas las categorías de recambios de automoción para talleres: frenos, filtros, embragues, suspensión, distribución, aceites, baterías, escape, dirección y encendido.",
  alternates: { canonical: "https://www.recambio-directo.com/recambios" },
};

const ITEMS = [
  { nombre: "Frenos", href: "/recambios/frenos", desc: "Pastillas, discos, pinzas, latiguillos y kits de freno." },
  { nombre: "Filtros", href: "/recambios/filtros", desc: "Filtros de aceite, aire, combustible y habitáculo." },
  { nombre: "Embragues", href: "/recambios/embragues", desc: "Kits de embrague, volantes bimasa y cojinetes." },
  { nombre: "Suspensión", href: "/recambios/suspension", desc: "Amortiguadores, muelles, brazos y rótulas." },
  { nombre: "Distribución", href: "/recambios/distribucion", desc: "Kits de distribución, correas, tensores y bombas de agua." },
  { nombre: "Aceites y lubricantes", href: "/recambios/aceites", desc: "Aceites de motor, de transmisión y lubricantes." },
  { nombre: "Baterías", href: "/recambios/baterias", desc: "Baterías de arranque, AGM, EFB y auxiliares." },
  { nombre: "Escape", href: "/recambios/escape", desc: "Silenciosos, catalizadores, tubos y abrazaderas." },
  { nombre: "Dirección", href: "/recambios/direccion", desc: "Cremalleras, bombas, rótulas y barras de dirección." },
  { nombre: "Encendido", href: "/recambios/encendido", desc: "Bujías, bobinas, cables y módulos de encendido." },
];

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  "name": "Recambios de automoción por categoría",
  "url": "https://www.recambio-directo.com/recambios",
  "isPartOf": { "@id": "https://www.recambio-directo.com/#website" },
  "breadcrumb": {
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Inicio", "item": "https://www.recambio-directo.com" },
      { "@type": "ListItem", "position": 2, "name": "Recambios" },
    ],
  },
  "mainEntity": {
    "@type": "ItemList",
    "itemListElement": ITEMS.map(({ nombre, href }, i) => ({
      "@type": "ListItem",
      "position": i + 1,
      "name": nombre,
      "url": `https://www.recambio-directo.com${href}`,
    })),
  },
};

export default function RecambiosIndexPage() {
  return (
    <main style={{ minHeight: "100vh", background: "linear-gradient(135deg,#020617,#020b2d)", color: "white", padding: "60px 20px" }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div style={{ maxWidth: 1000, margin: "0 auto" }}>

        <nav aria-label="Migas de pan" style={{ marginBottom: 32, fontSize: 13, color: "#64748b" }}>
          <Link href="/" style={{ color: "#60a5fa", textDecoration: "none" }}>Inicio</Link>
          {" › "}
          <span style={{ color: "#94a3b8" }}>Recambios</span>
        </nav>

        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <div style={{ display: "inline-block", background: "rgba(37,99,235,0.15)", color: "#60a5fa", padding: "8px 18px", borderRadius: 999, fontWeight: 700, marginBottom: 20, fontSize: 13, letterSpacing: "0.05em" }}>CATEGORÍAS</div>
          <h1 style={{ fontSize: "clamp(34px, 5vw, 54px)", fontWeight: 900, marginBottom: 16, lineHeight: 1.1 }}>Recambios de automoción por categoría</h1>
          <p style={{ color: "#94a3b8", fontSize: 18, maxWidth: 680, margin: "0 auto", lineHeight: 1.7 }}>
            Piezas OEM e IAM de varios proveedores para cada sistema del vehículo. Elige una categoría para ver qué puedes encontrar y de qué marcas.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16, marginBottom: 48 }}>
          {ITEMS.map(({ nombre, href, desc }) => (
            <a key={href} href={href} style={{ display: "block", background: "rgba(15,23,42,0.92)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, padding: 24, textDecoration: "none", color: "white" }}>
              <h2 style={{ fontSize: 20, fontWeight: 900, marginBottom: 8 }}>{nombre}</h2>
              <p style={{ color: "#94a3b8", fontSize: 14, lineHeight: 1.6, margin: 0 }}>{desc}</p>
              <span style={{ display: "inline-block", color: "#60a5fa", fontSize: 14, fontWeight: 700, marginTop: 14 }}>Ver categoría →</span>
            </a>
          ))}
        </div>

        <div style={{ background: "rgba(37,99,235,0.08)", border: "1px solid rgba(37,99,235,0.25)", borderRadius: 24, padding: "36px 28px", textAlign: "center" }}>
          <h2 style={{ fontSize: 26, fontWeight: 900, marginBottom: 10 }}>Busca cualquier referencia en segundos</h2>
          <p style={{ color: "#94a3b8", fontSize: 15, lineHeight: 1.7, maxWidth: 560, margin: "0 auto 22px" }}>
            Regístrate gratis como taller y compara precios y stock de varios proveedores en una sola búsqueda, por referencia, matrícula o bastidor.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <a href="/registro" style={{ display: "inline-block", padding: "16px 32px", background: "linear-gradient(135deg,#2563eb,#1d4ed8)", color: "white", borderRadius: 14, fontSize: 16, fontWeight: 800, textDecoration: "none" }}>Crear cuenta gratis →</a>
            <a href="/marcas" style={{ display: "inline-block", padding: "16px 28px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.14)", color: "white", borderRadius: 14, fontSize: 15, fontWeight: 700, textDecoration: "none" }}>Ver marcas</a>
          </div>
        </div>

      </div>
    </main>
  );
}
