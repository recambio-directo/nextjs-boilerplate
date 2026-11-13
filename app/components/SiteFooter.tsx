"use client";

import { usePathname } from "next/navigation";

// Rutas privadas de la aplicación: sin pie público
const RUTAS_SIN_PIE = ["/dashboard", "/admin", "/checkout", "/chat", "/perfil", "/auth"];

const COLUMNAS: { titulo: string; enlaces: { href: string; label: string }[] }[] = [
  {
    titulo: "Plataforma",
    enlaces: [
      { href: "/para-talleres", label: "Para talleres" },
      { href: "/para-proveedores", label: "Para proveedores" },
      { href: "/buscar-por-matricula", label: "Buscar por matrícula" },
      { href: "/registro", label: "Crear cuenta gratis" },
      { href: "/quienes-somos", label: "Quiénes somos" },
      { href: "/blog", label: "Blog" },
    ],
  },
  {
    titulo: "Recambios",
    enlaces: [
      { href: "/recambios", label: "Todas las categorías" },
      { href: "/recambios/frenos", label: "Frenos" },
      { href: "/recambios/filtros", label: "Filtros" },
      { href: "/recambios/embragues", label: "Embragues" },
      { href: "/recambios/suspension", label: "Suspensión" },
      { href: "/recambios/distribucion", label: "Distribución" },
    ],
  },
  {
    titulo: "Marcas",
    enlaces: [
      { href: "/marcas", label: "Todas las marcas" },
      { href: "/marcas/bosch", label: "Bosch" },
      { href: "/marcas/brembo", label: "Brembo" },
      { href: "/marcas/valeo", label: "Valeo" },
      { href: "/marcas/mann-filter", label: "MANN-FILTER" },
      { href: "/marcas/luk", label: "LuK" },
    ],
  },
  {
    titulo: "Por provincia",
    enlaces: [
      { href: "/recambios-madrid", label: "Recambios en Madrid" },
      { href: "/recambios-barcelona", label: "Recambios en Barcelona" },
      { href: "/recambios-valencia", label: "Recambios en Valencia" },
      { href: "/recambios-sevilla", label: "Recambios en Sevilla" },
      { href: "/recambios-vizcaya", label: "Recambios en Bilbao" },
      { href: "/recambios-murcia", label: "Recambios en Murcia" },
    ],
  },
  {
    titulo: "Legal",
    enlaces: [
      { href: "/aviso-legal", label: "Aviso legal" },
      { href: "/privacidad", label: "Política de privacidad" },
      { href: "/terminos", label: "Términos y condiciones" },
      { href: "/cookies", label: "Política de cookies" },
      { href: "/devoluciones", label: "Política de devoluciones" },
    ],
  },
];

export default function SiteFooter() {
  const pathname = usePathname() || "/";
  if (RUTAS_SIN_PIE.some((r) => pathname === r || pathname.startsWith(r + "/"))) return null;

  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <div className="site-footer-grid">
          <div className="site-footer-marca">
            <p style={{ fontWeight: 900, fontSize: 18, marginBottom: 8, letterSpacing: "-0.02em" }}>
              RECAMBIO <span style={{ color: "#3b82f6" }}>DIRECTO</span>
            </p>
            <p style={{ color: "#94a3b8", fontSize: 13, lineHeight: 1.7, maxWidth: 280, marginBottom: 14 }}>
              Marketplace B2B de recambios de automoción. Conectamos talleres y proveedores de recambios en toda España.
            </p>
            <a href="mailto:info@recambio-directo.com" className="site-footer-link">info@recambio-directo.com</a>
            <a href="tel:+34650495270" className="site-footer-link">650 49 52 70</a>
            <div style={{ display: "flex", gap: 14, marginTop: 6 }}>
              <a href="https://www.instagram.com/recambiodirect/" target="_blank" rel="noopener noreferrer" className="site-footer-link">Instagram</a>
              <a href="https://www.linkedin.com/company/135907554" target="_blank" rel="noopener noreferrer" className="site-footer-link">LinkedIn</a>
            </div>
          </div>
          {COLUMNAS.map(({ titulo, enlaces }) => (
            <div key={titulo}>
              <p style={{ fontWeight: 700, fontSize: 14, marginBottom: 12, color: "white" }}>{titulo}</p>
              {enlaces.map(({ href, label }) => (
                <a key={href + label} href={href} className="site-footer-link">{label}</a>
              ))}
            </div>
          ))}
        </div>
        <p style={{ textAlign: "center", color: "#64748b", fontSize: 12 }}>
          © {new Date().getFullYear()} Recambio Directo · Marketplace B2B de Recambios de Automoción · España
        </p>
      </div>
    </footer>
  );
}
