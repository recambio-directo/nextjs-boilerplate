"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

// Rutas privadas de la aplicación: tienen su propia cabecera o no la necesitan
const RUTAS_SIN_CABECERA = ["/dashboard", "/admin", "/checkout", "/chat", "/perfil", "/auth"];

const ENLACES = [
  { href: "/para-talleres", label: "Para talleres" },
  { href: "/para-proveedores", label: "Para proveedores" },
  { href: "/buscar-por-matricula", label: "Buscar por matrícula" },
  { href: "/recambios", label: "Categorías" },
  { href: "/marcas", label: "Marcas" },
  { href: "/blog", label: "Blog" },
];

// Isotipo (engranajes + flecha) extraído de /public/logo.svg
function Isotipo() {
  const dientes = (r: number, size: number, offset: number, color: string) =>
    [0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
      <rect key={a} x={-size / 2} y={-r} width={size} height={size} rx={2} fill={color} transform={`rotate(${a + offset})`} />
    ));
  return (
    <svg width="54" height="28" viewBox="207 122 136 66" aria-hidden="true" focusable="false">
      <g transform="translate(240,155)">
        <circle r="22" fill="none" stroke="#3b82f6" strokeWidth="3.5" />
        <circle r="9" fill="#3b82f6" />
        {dientes(31, 10, 0, "#3b82f6")}
      </g>
      <path d="M272 155h21m-6-5 6 5-6 5" fill="none" stroke="#22c55e" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <g transform="translate(322,155)">
        <circle r="17" fill="none" stroke="#22c55e" strokeWidth="3" />
        <circle r="7" fill="#22c55e" />
        {dientes(24, 8, 22.5, "#22c55e")}
      </g>
    </svg>
  );
}

export default function SiteHeader() {
  const pathname = usePathname() || "/";
  const [abierto, setAbierto] = useState(false);

  if (RUTAS_SIN_CABECERA.some((r) => pathname === r || pathname.startsWith(r + "/"))) return null;

  const activo = (href: string) => pathname === href || pathname.startsWith(href + "/");

  return (
    <header className="site-header">
      <div className="site-header-inner">
        <Link href="/" className="site-logo" aria-label="Recambio Directo — inicio">
          <Isotipo />
          <span className="site-logo-text">
            RECAMBIO <span style={{ color: "#3b82f6" }}>DIRECTO</span>
          </span>
        </Link>

        <nav className="site-nav" aria-label="Principal">
          {ENLACES.map(({ href, label }) => (
            <a key={href} href={href} className={activo(href) ? "site-nav-link site-nav-link-activo" : "site-nav-link"}>
              {label}
            </a>
          ))}
        </nav>

        <div className="site-header-acciones">
          <Link href="/#acceso" className="site-btn-entrar">Entrar</Link>
          <a href="/registro" className="site-btn-registro">Crear cuenta<span className="site-btn-registro-extra"> gratis</span></a>
          <button
            type="button"
            className="site-menu-btn"
            aria-label={abierto ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={abierto}
            onClick={() => setAbierto((v) => !v)}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
              {abierto ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
            </svg>
          </button>
        </div>
      </div>

      {abierto && (
        <nav className="site-nav-movil" aria-label="Principal móvil">
          {ENLACES.map(({ href, label }) => (
            <a key={href} href={href} className="site-nav-movil-link" onClick={() => setAbierto(false)}>
              {label}
            </a>
          ))}
          <Link href="/#acceso" className="site-nav-movil-link" onClick={() => setAbierto(false)}>Entrar en mi cuenta</Link>
          <a href="/registro" className="site-btn-registro" style={{ textAlign: "center", marginTop: 8 }} onClick={() => setAbierto(false)}>
            Crear cuenta gratis
          </a>
        </nav>
      )}
    </header>
  );
}
