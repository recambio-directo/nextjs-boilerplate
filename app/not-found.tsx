import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Página no encontrada",
  robots: { index: false, follow: true },
};

const enlaces = [
  { href: "/", label: "Buscar una referencia" },
  { href: "/para-talleres", label: "Para talleres" },
  { href: "/para-proveedores", label: "Para proveedores" },
  { href: "/recambios", label: "Categorías" },
  { href: "/marcas", label: "Marcas" },
  { href: "/blog", label: "Blog" },
];

export default function NotFound() {
  return (
    <main style={{ minHeight: "70vh", background: "#020617", color: "white", padding: "80px 20px", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ maxWidth: 560, textAlign: "center" }}>
        <p style={{ color: "#60a5fa", fontWeight: 800, fontSize: 14, letterSpacing: "0.08em", marginBottom: 12 }}>ERROR 404</p>
        <h1 style={{ fontSize: "clamp(30px, 5vw, 44px)", fontWeight: 900, lineHeight: 1.1, marginBottom: 16 }}>No encontramos esta página</h1>
        <p style={{ color: "#94a3b8", fontSize: 16, lineHeight: 1.7, marginBottom: 28 }}>
          Puede que el enlace esté mal escrito o que la página ya no exista. Desde aquí puedes seguir:
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "center", marginBottom: 28 }}>
          {enlaces.map(({ href, label }) => (
            <a key={href} href={href} style={{ background: "rgba(37,99,235,0.1)", border: "1px solid rgba(37,99,235,0.25)", color: "#93c5fd", padding: "10px 18px", borderRadius: 999, fontSize: 14, fontWeight: 600, textDecoration: "none" }}>{label}</a>
          ))}
        </div>
        <a href="/registro" style={{ display: "inline-block", padding: "16px 32px", background: "linear-gradient(135deg,#2563eb,#1d4ed8)", color: "white", borderRadius: 14, fontSize: 16, fontWeight: 800, textDecoration: "none" }}>Crear cuenta gratis →</a>
      </div>
    </main>
  );
}
