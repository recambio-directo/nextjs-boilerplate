import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Marcas de Recambios de Automoción — Marketplace B2B",
  description: "Marcas de recambios disponibles en Recambio Directo: Bosch, Brembo, Valeo, MANN-FILTER, Sachs, LuK, TRW, febi bilstein, Monroe, NGK, Denso, Continental, SKF, INA y Gates.",
  alternates: { canonical: "https://www.recambio-directo.com/marcas" },
};

const ITEMS = [
  { nombre: "Bosch", href: "/marcas/bosch", desc: "Bujías, filtros, escobillas, baterías y sistemas de inyección." },
  { nombre: "Brembo", href: "/marcas/brembo", desc: "Discos, pastillas y pinzas de freno." },
  { nombre: "Valeo", href: "/marcas/valeo", desc: "Embragues, iluminación, climatización y sistemas eléctricos." },
  { nombre: "MANN-FILTER", href: "/marcas/mann-filter", desc: "Filtros de aceite, aire, combustible y habitáculo." },
  { nombre: "Sachs", href: "/marcas/sachs", desc: "Embragues y amortiguadores." },
  { nombre: "LuK", href: "/marcas/luk", desc: "Embragues y volantes bimasa." },
  { nombre: "TRW", href: "/marcas/trw", desc: "Frenos, dirección y suspensión." },
  { nombre: "febi bilstein", href: "/marcas/febi-bilstein", desc: "Dirección, suspensión, motor y piezas de carrocería." },
  { nombre: "Monroe", href: "/marcas/monroe", desc: "Amortiguadores y componentes de suspensión." },
  { nombre: "NGK", href: "/marcas/ngk", desc: "Bujías, calentadores y bobinas de encendido." },
  { nombre: "Denso", href: "/marcas/denso", desc: "Climatización, encendido y gestión de motor." },
  { nombre: "Continental", href: "/marcas/continental", desc: "Correas, kits de distribución y componentes de transmisión." },
  { nombre: "SKF", href: "/marcas/skf", desc: "Rodamientos, kits de rueda y distribución." },
  { nombre: "INA", href: "/marcas/ina", desc: "Tensores, rodillos y componentes de distribución." },
  { nombre: "Gates", href: "/marcas/gates", desc: "Correas, kits de distribución y bombas de agua." },
];

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  "name": "Marcas de recambios de automoción",
  "url": "https://www.recambio-directo.com/marcas",
  "isPartOf": { "@id": "https://www.recambio-directo.com/#website" },
  "breadcrumb": {
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Inicio", "item": "https://www.recambio-directo.com" },
      { "@type": "ListItem", "position": 2, "name": "Marcas" },
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

export default function MarcasIndexPage() {
  return (
    <main style={{ minHeight: "100vh", background: "linear-gradient(135deg,#020617,#020b2d)", color: "white", padding: "60px 20px" }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div style={{ maxWidth: 1000, margin: "0 auto" }}>

        <nav aria-label="Migas de pan" style={{ marginBottom: 32, fontSize: 13, color: "#64748b" }}>
          <Link href="/" style={{ color: "#60a5fa", textDecoration: "none" }}>Inicio</Link>
          {" › "}
          <span style={{ color: "#94a3b8" }}>Marcas</span>
        </nav>

        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <div style={{ display: "inline-block", background: "rgba(37,99,235,0.15)", color: "#60a5fa", padding: "8px 18px", borderRadius: 999, fontWeight: 700, marginBottom: 20, fontSize: 13, letterSpacing: "0.05em" }}>MARCAS</div>
          <h1 style={{ fontSize: "clamp(34px, 5vw, 54px)", fontWeight: 900, marginBottom: 16, lineHeight: 1.1 }}>Marcas de recambios de automoción</h1>
          <p style={{ color: "#94a3b8", fontSize: 18, maxWidth: 680, margin: "0 auto", lineHeight: 1.7 }}>
            Las principales marcas del aftermarket, con stock de varios proveedores y equivalencias OEM e IAM en la misma búsqueda.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16, marginBottom: 48 }}>
          {ITEMS.map(({ nombre, href, desc }) => (
            <a key={href} href={href} style={{ display: "block", background: "rgba(15,23,42,0.92)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, padding: 24, textDecoration: "none", color: "white" }}>
              <h2 style={{ fontSize: 20, fontWeight: 900, marginBottom: 8 }}>{nombre}</h2>
              <p style={{ color: "#94a3b8", fontSize: 14, lineHeight: 1.6, margin: 0 }}>{desc}</p>
              <span style={{ display: "inline-block", color: "#60a5fa", fontSize: 14, fontWeight: 700, marginTop: 14 }}>Ver marca →</span>
            </a>
          ))}
        </div>

        <div style={{ background: "rgba(37,99,235,0.08)", border: "1px solid rgba(37,99,235,0.25)", borderRadius: 24, padding: "36px 28px", textAlign: "center" }}>
          <h2 style={{ fontSize: 26, fontWeight: 900, marginBottom: 10 }}>Compara precios de la misma marca entre proveedores</h2>
          <p style={{ color: "#94a3b8", fontSize: 15, lineHeight: 1.7, maxWidth: 560, margin: "0 auto 22px" }}>
            Regístrate gratis como taller y compara precios y stock de varios proveedores en una sola búsqueda, por referencia, matrícula o bastidor.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <a href="/registro" style={{ display: "inline-block", padding: "16px 32px", background: "linear-gradient(135deg,#2563eb,#1d4ed8)", color: "white", borderRadius: 14, fontSize: 16, fontWeight: 800, textDecoration: "none" }}>Crear cuenta gratis →</a>
            <a href="/recambios" style={{ display: "inline-block", padding: "16px 28px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.14)", color: "white", borderRadius: 14, fontSize: 15, fontWeight: 700, textDecoration: "none" }}>Ver categorías</a>
          </div>
        </div>

      </div>
    </main>
  );
}
