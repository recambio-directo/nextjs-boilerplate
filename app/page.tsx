import type { Metadata } from "next";
import React from "react";
import LoginBox from "./components/LoginBox";
import HomeBuscador from "./components/HomeBuscador";
import { Wrench, Factory, ClipboardList, BadgeCheck, Rocket, Search, Package, Truck, ShieldCheck } from "lucide-react";

export const metadata: Metadata = {
  title: "Recambio Directo — Marketplace B2B de Recambios de Automoción en España",
  description: "Marketplace B2B de recambios de automoción. Conectamos talleres y proveedores en toda España. Busca piezas OEM e IAM, compara precios y recibe en 24h. Madrid, Barcelona, Valencia, Sevilla y toda España.",
  alternates: { canonical: "https://www.recambio-directo.com" },
};

const FAQS = [
  { q: "¿Cuánto cuesta Recambio Directo?", a: "Para talleres es completamente gratis, sin límites ni costes ocultos. Los proveedores pagan 25€/mes sin permanencia ni comisiones por venta, con el primer mes gratis." },
  { q: "¿Quién puede registrarse?", a: "La plataforma es exclusiva para profesionales del sector: talleres mecánicos, concesionarios, distribuidores y proveedores de recambios." },
  { q: "¿Cuánto tarda en activarse mi cuenta?", a: "Verificamos cada cuenta manualmente en menos de 24 horas laborables para garantizar que todos los usuarios son profesionales del sector." },
  { q: "¿Qué agencias de transporte están disponibles?", a: "Trabajamos con varias de las principales agencias de transporte nacionales. La etiqueta de envío se genera automáticamente al crear el pedido y el tracking llega por email." },
  { q: "¿Puedo controlar quién ve mis precios?", a: "Sí. Los proveedores pueden excluir talleres concretos o códigos postales específicos para que no vean su catálogo ni sus precios." },
  { q: "¿Cómo funciona RD Pago?", a: "RD Pago es nuestra línea de crédito para talleres. Permite comprar ahora y pagar en 15 días. Se activa tras 1 mes de actividad y 1 pago con tarjeta." },
];

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": FAQS.map(({ q, a }) => ({ "@type": "Question", "name": q, "acceptedAnswer": { "@type": "Answer", "text": a } })),
};

const CATEGORIAS = [
  { nombre: "Frenos", href: "/recambios/frenos" },
  { nombre: "Filtros", href: "/recambios/filtros" },
  { nombre: "Embragues", href: "/recambios/embragues" },
  { nombre: "Suspensión", href: "/recambios/suspension" },
  { nombre: "Distribución", href: "/recambios/distribucion" },
  { nombre: "Aceites", href: "/recambios/aceites" },
  { nombre: "Baterías", href: "/recambios/baterias" },
  { nombre: "Escape", href: "/recambios/escape" },
  { nombre: "Dirección", href: "/recambios/direccion" },
  { nombre: "Encendido", href: "/recambios/encendido" },
];

const MARCAS = [
  { nombre: "Bosch", href: "/marcas/bosch" },
  { nombre: "Brembo", href: "/marcas/brembo" },
  { nombre: "Valeo", href: "/marcas/valeo" },
  { nombre: "MANN-FILTER", href: "/marcas/mann-filter" },
  { nombre: "Sachs", href: "/marcas/sachs" },
  { nombre: "LuK", href: "/marcas/luk" },
  { nombre: "TRW", href: "/marcas/trw" },
  { nombre: "febi bilstein", href: "/marcas/febi-bilstein" },
  { nombre: "Monroe", href: "/marcas/monroe" },
  { nombre: "NGK", href: "/marcas/ngk" },
  { nombre: "Denso", href: "/marcas/denso" },
  { nombre: "Continental", href: "/marcas/continental" },
  { nombre: "SKF", href: "/marcas/skf" },
  { nombre: "INA", href: "/marcas/ina" },
  { nombre: "Gates", href: "/marcas/gates" },
];

const chipStyle: React.CSSProperties = { background: "rgba(37,99,235,0.1)", border: "1px solid rgba(37,99,235,0.2)", color: "#93c5fd", padding: "8px 16px", borderRadius: 999, fontSize: 13, fontWeight: 600, textDecoration: "none" };
const saberMas: React.CSSProperties = { display: "block", textAlign: "center", color: "#93c5fd", fontSize: 14, fontWeight: 700, textDecoration: "none", marginTop: 14, padding: "8px 0" };

const badgeStyle: React.CSSProperties = { display: "inline-block", background: "rgba(37,99,235,0.15)", color: "#60a5fa", padding: "8px 16px", borderRadius: "999px", fontSize: "13px", fontWeight: 700, marginBottom: "24px", letterSpacing: "0.05em" };

export default function Home() {
  return (
    <main style={{ minHeight: "100vh", background: "#020617", color: "white", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(37,99,235,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(37,99,235,0.07) 1px, transparent 1px)", backgroundSize: "60px 60px", pointerEvents: "none", zIndex: 1 }} />
      <div style={{ width: "600px", height: "600px", borderRadius: "999px", background: "rgba(37,99,235,0.22)", filter: "blur(160px)", position: "absolute", top: "-200px", left: "-200px", pointerEvents: "none", zIndex: 1 }} />
      <div style={{ width: "400px", height: "400px", borderRadius: "999px", background: "rgba(22,163,74,0.12)", filter: "blur(140px)", position: "absolute", bottom: "0", right: "-100px", pointerEvents: "none", zIndex: 1 }} />

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

      {/* ── HERO ── */}
      <section className="landing-hero">
        <div className="landing-hero-text">
          <div style={{ ...badgeStyle, alignSelf: "flex-start" }}>MARKETPLACE B2B AUTOMOCIÓN</div>
          <h1 className="landing-hero-h1">
            Marketplace B2B de recambios de automoción, <span style={{ color: "#3b82f6" }}>gratis para talleres</span>
          </h1>
          <p className="landing-hero-sub">
            Busca una referencia OEM o IAM y compara el stock de proveedores de toda España. Sin intermediarios, sin llamadas y con entrega en 24-48h.
          </p>
          <HomeBuscador />
          <div className="landing-hero-ctas">
            <a href="/registro" className="landing-cta-primario">Crear cuenta gratis →</a>
            <a href="/para-proveedores" className="landing-cta-secundario">Soy proveedor</a>
          </div>
          <p style={{ color: "#94a3b8", fontSize: 13, marginTop: 14 }}>
            Sin tarjeta · Sin permanencia · Alta verificada en 24h laborables
          </p>
        </div>
        <div id="acceso" className="landing-hero-login">
          <LoginBox />
        </div>
      </section>

      {/* ── PARA TALLERES Y PROVEEDORES ── */}
      <section className="landing-section">
        <div style={{ textAlign: "center", marginBottom: 56 }}>
          <div style={badgeStyle}>¿QUIÉN SOY?</div>
          <h2 style={{ fontSize: 44, fontWeight: 900, marginBottom: 12 }}>Recambios para talleres y proveedores</h2>
          <p style={{ color: "#94a3b8", fontSize: 17 }}>Una plataforma diseñada para los dos lados del negocio</p>
        </div>
        <div className="landing-grid-2">
          <div style={{ background: "rgba(37,99,235,0.06)", border: "1px solid rgba(37,99,235,0.25)", borderRadius: 24, padding: 36 }}>
            <div style={{ marginBottom: 16, color: "#60a5fa" }}><Wrench size={40} strokeWidth={1.8} aria-hidden="true" /></div>
            <div style={{ display: "inline-block", background: "rgba(37,99,235,0.2)", color: "#60a5fa", padding: "4px 14px", borderRadius: 999, fontSize: 12, fontWeight: 700, marginBottom: 16 }}>SOY TALLER</div>
            <h3 style={{ fontSize: 24, fontWeight: 900, marginBottom: 12 }}>Busca por matrícula, bastidor o aplicación y compra en 3 clics</h3>
            <p style={{ color: "#94a3b8", fontSize: 14, lineHeight: 1.7, marginBottom: 20 }}>Introduce la matrícula o el VIN del vehículo y encuentra las piezas compatibles al instante. Compara precios de varios proveedores en la misma pantalla y haz el pedido sin llamadas ni esperas.</p>
            <ul style={{ listStyle: "none", padding: 0, margin: "0 0 24px", display: "flex", flexDirection: "column", gap: 10 }}>
              {["Búsqueda por matrícula o bastidor (VIN) del vehículo", "Búsqueda por aplicación: marca, modelo, versión y motor", "Catálogos completos de múltiples proveedores en un solo sitio", "Acceso a referencias OEM, IAM y Universal", "Compara precios de varios proveedores al instante", "Entrega 24h con las principales agencias de transporte", "RD Pago — compra ahora y paga en 15 días"].map(item => (
                <li key={item} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                  <span style={{ color: "#4ade80", fontWeight: 900, fontSize: 16, flexShrink: 0, marginTop: 1 }}>✓</span>
                  <span style={{ color: "#cbd5e1", fontSize: 14 }}>{item}</span>
                </li>
              ))}
            </ul>
            <a href="/registro" style={{ display: "block", width: "100%", padding: "16px", background: "linear-gradient(135deg,#2563eb,#1d4ed8)", color: "white", border: "none", borderRadius: "14px", fontSize: "16px", fontWeight: 800, cursor: "pointer", textAlign: "center", textDecoration: "none", boxSizing: "border-box" as const }}>Registrarme como taller →</a>
            <a href="/para-talleres" style={saberMas}>Ver todas las ventajas para talleres</a>
          </div>
          <div style={{ background: "rgba(22,163,74,0.06)", border: "1px solid rgba(22,163,74,0.25)", borderRadius: 24, padding: 36 }}>
            <div style={{ marginBottom: 16, color: "#4ade80" }}><Factory size={40} strokeWidth={1.8} aria-hidden="true" /></div>
            <div style={{ display: "inline-block", background: "rgba(22,163,74,0.2)", color: "#4ade80", padding: "4px 14px", borderRadius: 999, fontSize: 12, fontWeight: 700, marginBottom: 16 }}>SOY PROVEEDOR</div>
            <h3 style={{ fontSize: 24, fontWeight: 900, marginBottom: 12 }}>Tu catálogo visto por talleres de toda España</h3>
            <p style={{ color: "#94a3b8", fontSize: 14, lineHeight: 1.7, marginBottom: 20 }}>Sube tu catálogo una vez y empieza a recibir pedidos sin visitas comerciales y sin llamadas.</p>
            <ul style={{ listStyle: "none", padding: 0, margin: "0 0 24px", display: "flex", flexDirection: "column", gap: 10 }}>
              {["Importación masiva desde Excel, CSV o FTP automático", "Albarán y etiqueta de envío generados automáticamente", "Control total sobre quién ve tus precios", "Panel de pedidos, facturación y estadísticas", "25€/mes fijos — sin sorpresas ni comisiones"].map(item => (
                <li key={item} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                  <span style={{ color: "#4ade80", fontWeight: 900, fontSize: 16, flexShrink: 0, marginTop: 1 }}>✓</span>
                  <span style={{ color: "#cbd5e1", fontSize: 14 }}>{item}</span>
                </li>
              ))}
            </ul>
            <a href="/registro?tipo=proveedor" style={{ display: "block", width: "100%", padding: "16px", background: "linear-gradient(135deg,#16a34a,#15803d)", color: "white", border: "none", borderRadius: "14px", fontSize: "16px", fontWeight: 800, cursor: "pointer", textAlign: "center", textDecoration: "none", boxSizing: "border-box" as const }}>Registrarme como proveedor →</a>
            <a href="/para-proveedores" style={{ ...saberMas, color: "#86efac" }}>Ver cómo vender en Recambio Directo</a>
          </div>
        </div>
      </section>

      {/* ── CÓMO FUNCIONA ── */}
      <section className="landing-section" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ textAlign: "center", marginBottom: 56 }}>
          <div style={badgeStyle}>PROCESO</div>
          <h2 style={{ fontSize: 44, fontWeight: 900, marginBottom: 12 }}>Cómo comprar recambios en 3 pasos</h2>
          <p style={{ color: "#94a3b8", fontSize: 17 }}>Sin burocracia, sin esperas, sin complicaciones</p>
        </div>
        <div className="landing-grid-3">
          {[
            { num: "01", Icon: ClipboardList, title: "Crea tu cuenta", desc: "Rellena tus datos profesionales en menos de 3 minutos. Solo necesitas tu CIF y email de empresa.", color: "#2563eb" },
            { num: "02", Icon: BadgeCheck, title: "Verificación en 24h", desc: "Nuestro equipo valida tu perfil profesional y activa tu acceso. Recibirás un email de confirmación.", color: "#16a34a" },
            { num: "03", Icon: Rocket, title: "Opera desde el primer día", desc: "Busca piezas, sube tu catálogo o gestiona tus pedidos. Todo desde un panel diseñado para el sector.", color: "#7c3aed" },
          ].map(({ num, Icon, title, desc, color }) => (
            <div key={num} style={{ background: "rgba(30,41,59,0.7)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, padding: 32, position: "relative" as const }}>
              <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 44, height: 44, borderRadius: 12, background: `${color}30`, border: `1px solid ${color}60`, marginBottom: 16 }}>
                <Icon size={22} color="white" strokeWidth={2} aria-hidden="true" />
              </div>
              <div style={{ position: "absolute" as const, top: 32, right: 32, fontSize: 40, fontWeight: 900, color: "rgba(255,255,255,0.08)" }} aria-hidden="true">{num}</div>
              <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 10 }}>{title}</h3>
              <p style={{ color: "#94a3b8", fontSize: 14, lineHeight: 1.7 }}>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── DEMO VIDEO ── */}
      <section className="landing-section" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div style={badgeStyle}>DEMO</div>
          <h2 style={{ fontSize: 44, fontWeight: 900, marginBottom: 12 }}>Mira la plataforma en acción</h2>
          <p style={{ color: "#94a3b8", fontSize: 17 }}>Búsqueda por referencia, por matrícula, precios en tiempo real y pedido en 3 clics</p>
        </div>
        <div style={{ maxWidth: 920, margin: "0 auto", borderRadius: 20, overflow: "hidden", border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 20px 60px rgba(0,0,0,0.5)" }}>
          <video autoPlay loop muted playsInline preload="metadata" width={1280} height={720} aria-label="Demostración de la plataforma Recambio Directo" src="/demo-plataforma.mp4" style={{ width: "100%", height: "auto", display: "block" }}>Tu navegador no soporta vídeo.</video>
        </div>
        <div style={{ display: "flex", justifyContent: "center", gap: 24, marginTop: 32, flexWrap: "wrap" as const }}>
          {["Busca por referencia OEM/IAM", "Busca por matrícula del vehículo", "Compara precios al instante", "Pide en 3 clics"].map(t => (
            <div key={t} style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ color: "#4ade80", fontWeight: 900 }}>✓</span>
              <span style={{ color: "#94a3b8", fontSize: 13 }}>{t}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="landing-section" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ textAlign: "center", marginBottom: 56 }}>
          <div style={badgeStyle}>PLATAFORMA</div>
          <h2 style={{ fontSize: 44, fontWeight: 900, marginBottom: 12 }}>Búsqueda por matrícula, bastidor y aplicación de vehículo incluida</h2>
          <p style={{ color: "#94a3b8", fontSize: 17 }}>Diseñado específicamente para el sector del recambio de automoción en España</p>
          <a href="/buscar-por-matricula" style={{ ...saberMas, display: "inline-block" }}>Cómo funciona la búsqueda por matrícula →</a>
        </div>
        <div className="landing-grid-2">
          {[
            { Icon: Search, title: "Busca por matrícula, bastidor o aplicación de vehículo", desc: "Introduce la matrícula o el VIN y encuentra las piezas compatibles automáticamente. También puedes buscar por marca, modelo, versión y motor, o por referencia OEM e IAM. Precios en tiempo real de múltiples proveedores.", color: "#2563eb" },
            { Icon: Package, title: "Gestión de pedidos completa para talleres", desc: "Albarán automático, etiqueta de envío, chat con el proveedor y seguimiento en tiempo real desde el panel.", color: "#16a34a" },
            { Icon: Truck, title: "Logística integrada con las principales agencias nacionales", desc: "Conectado con las principales agencias de transporte. Elige agencia, se genera la etiqueta automáticamente y el tracking llega por email.", color: "#7c3aed" },
            { Icon: ShieldCheck, title: "Control total sobre tu negocio de recambios", desc: "Excluye competidores, controla quién ve tus precios, gestiona crédito RD y accede a tu histórico completo.", color: "#f59e0b" },
          ].map(({ Icon, title, desc, color }) => (
            <div key={title} style={{ background: "rgba(30,41,59,0.7)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, padding: 32, display: "flex", gap: 16, alignItems: "flex-start" }}>
              <div style={{ flexShrink: 0, width: 48, height: 48, borderRadius: 14, background: `${color}20`, border: `1px solid ${color}40`, display: "flex", alignItems: "center", justifyContent: "center" }}><Icon size={24} color="white" strokeWidth={2} aria-hidden="true" /></div>
              <div>
                <h3 style={{ fontSize: 17, fontWeight: 800, marginBottom: 8 }}>{title}</h3>
                <p style={{ color: "#94a3b8", fontSize: 14, lineHeight: 1.7, margin: 0 }}>{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CATEGORÍAS Y MARCAS ── */}
      <section className="landing-section-sm" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={badgeStyle}>CATÁLOGO</div>
          <h2 style={{ fontSize: 36, fontWeight: 900, marginBottom: 12 }}>Recambios por categoría y marca</h2>
          <p style={{ color: "#94a3b8", fontSize: 15, maxWidth: 600, margin: "0 auto" }}>Piezas OEM e IAM de las principales marcas del aftermarket</p>
        </div>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: "#94a3b8", textAlign: "center", marginBottom: 14, letterSpacing: "0.05em" }}><a href="/recambios" style={{ color: "inherit", textDecoration: "none" }}>CATEGORÍAS</a></h3>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "center", marginBottom: 32 }}>
          {CATEGORIAS.map(({ nombre, href }) => (
            <a key={href} href={href} style={chipStyle}>{nombre}</a>
          ))}
        </div>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: "#94a3b8", textAlign: "center", marginBottom: 14, letterSpacing: "0.05em" }}><a href="/marcas" style={{ color: "inherit", textDecoration: "none" }}>MARCAS</a></h3>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "center" }}>
          {MARCAS.map(({ nombre, href }) => (
            <a key={href} href={href} style={{ ...chipStyle, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)", color: "#e2e8f0" }}>{nombre}</a>
          ))}
        </div>
      </section>

      {/* ── ZONAS ── */}
      <section className="landing-section-sm" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div style={badgeStyle}>COBERTURA NACIONAL</div>
          <h2 style={{ fontSize: 36, fontWeight: 900, marginBottom: 12 }}>Proveedores de recambios en toda España</h2>
          <p style={{ color: "#94a3b8", fontSize: 15, maxWidth: 600, margin: "0 auto" }}>Proveedores y talleres conectados en las principales ciudades y provincias españolas</p>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "center" }}>
          {[
            { nombre: "Madrid", href: "/recambios-madrid" },
            { nombre: "Barcelona", href: "/recambios-barcelona" },
            { nombre: "Valencia", href: "/recambios-valencia" },
            { nombre: "Sevilla", href: "/recambios-sevilla" },
            { nombre: "Bilbao", href: "/recambios-vizcaya" },
            { nombre: "Zaragoza", href: "/recambios-zaragoza" },
            { nombre: "Málaga", href: "/recambios-malaga" },
            { nombre: "Murcia", href: "/recambios-murcia" },
            { nombre: "Baleares", href: "/recambios-baleares" },
            { nombre: "Las Palmas", href: "/recambios-las-palmas" },
            { nombre: "Alicante", href: "/recambios-alicante" },
            { nombre: "Córdoba", href: "/recambios-cordoba" },
            { nombre: "Valladolid", href: "/recambios-valladolid" },
            { nombre: "Granada", href: "/recambios-granada" },
            { nombre: "A Coruña", href: "/recambios-la-coruna" },
            { nombre: "S.C. Tenerife", href: "/recambios-santa-cruz-de-tenerife" },
            { nombre: "Asturias", href: "/recambios-asturias" },
            { nombre: "Navarra", href: "/recambios-navarra" },
            { nombre: "Cantabria", href: "/recambios-cantabria" },
            { nombre: "Almería", href: "/recambios-almeria" },
            { nombre: "Cádiz", href: "/recambios-cadiz" },
            { nombre: "Huelva", href: "/recambios-huelva" },
            { nombre: "Jaén", href: "/recambios-jaen" },
            { nombre: "Toledo", href: "/recambios-toledo" },
            { nombre: "Burgos", href: "/recambios-burgos" },
            { nombre: "León", href: "/recambios-leon" },
            { nombre: "Salamanca", href: "/recambios-salamanca" },
            { nombre: "Castellón", href: "/recambios-castellon" },
            { nombre: "Girona", href: "/recambios-girona" },
            { nombre: "Lleida", href: "/recambios-lleida" },
            { nombre: "Tarragona", href: "/recambios-tarragona" },
            { nombre: "Badajoz", href: "/recambios-badajoz" },
            { nombre: "Cáceres", href: "/recambios-caceres" },
            { nombre: "Pontevedra", href: "/recambios-pontevedra" },
            { nombre: "Lugo", href: "/recambios-lugo" },
            { nombre: "Ourense", href: "/recambios-ourense" },
            { nombre: "Guipúzcoa", href: "/recambios-guipuzcoa" },
            { nombre: "Álava", href: "/recambios-alava" },
            { nombre: "La Rioja", href: "/recambios-la-rioja" },
            { nombre: "Huesca", href: "/recambios-huesca" },
            { nombre: "Teruel", href: "/recambios-teruel" },
            { nombre: "Cuenca", href: "/recambios-cuenca" },
            { nombre: "Guadalajara", href: "/recambios-guadalajara" },
            { nombre: "Ciudad Real", href: "/recambios-ciudad-real" },
            { nombre: "Albacete", href: "/recambios-albacete" },
            { nombre: "Segovia", href: "/recambios-segovia" },
            { nombre: "Soria", href: "/recambios-soria" },
            { nombre: "Palencia", href: "/recambios-palencia" },
            { nombre: "Zamora", href: "/recambios-zamora" },
          ].map(({ nombre, href }) => (
            <a key={nombre} href={href} style={{ background: "rgba(37,99,235,0.1)", border: "1px solid rgba(37,99,235,0.2)", color: "#93c5fd", padding: "8px 16px", borderRadius: 999, fontSize: 13, fontWeight: 600, textDecoration: "none" }}>{nombre}</a>
          ))}
        </div>
      </section>

      {/* ── AGENCIAS ── */}
      <section className="landing-section-sm" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="landing-agencias" style={{ background: "rgba(37,99,235,0.06)", border: "1px solid rgba(37,99,235,0.2)", borderRadius: 20, padding: "32px 48px", display: "flex", alignItems: "center", gap: 32 }}>
          <div style={{ flexShrink: 0, color: "#60a5fa" }}><Truck size={40} strokeWidth={1.8} aria-hidden="true" /></div>
          <div style={{ flex: 1 }}>
            <h3 style={{ fontSize: 20, fontWeight: 900, marginBottom: 6 }}>Logística integrada con las principales agencias de transporte nacionales</h3>
            <p style={{ color: "#94a3b8", fontSize: 15, margin: 0, lineHeight: 1.6 }}>Etiquetas automáticas, tracking en tiempo real y entrega en 24-48h en toda España. Trabajamos con las agencias líderes del mercado para garantizar la mejor cobertura en cada envío.</p>
          </div>
          <div style={{ flexShrink: 0, background: "rgba(37,99,235,0.15)", border: "1px solid rgba(37,99,235,0.3)", borderRadius: 12, padding: "12px 20px", textAlign: "center" as const }}>
            <p style={{ color: "#60a5fa", fontWeight: 900, fontSize: 22, margin: 0 }}>24-48h</p>
            <p style={{ color: "#94a3b8", fontSize: 12, margin: 0 }}>Entrega en España</p>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="landing-section" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ textAlign: "center", marginBottom: 56 }}>
          <div style={badgeStyle}>PREGUNTAS FRECUENTES</div>
          <h2 style={{ fontSize: 44, fontWeight: 900, marginBottom: 12 }}>Preguntas frecuentes sobre recambios B2B</h2>
        </div>
        <div className="landing-grid-2 landing-faq-grid" style={{ gap: 20, maxWidth: 1000, margin: "0 auto" }}>
          {FAQS.map(({ q, a }) => (
            <div key={q} style={{ background: "rgba(30,41,59,0.7)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: 24 }}>
              <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 10, color: "#60a5fa" }}>{q}</h3>
              <p style={{ color: "#94a3b8", fontSize: 14, lineHeight: 1.7, margin: 0 }}>{a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA FINAL ── */}
      <section style={{ padding: "clamp(32px, 6vw, 80px)", position: "relative", zIndex: 10, borderTop: "1px solid rgba(255,255,255,0.06)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ maxWidth: 700, margin: "0 auto", textAlign: "center" as const }}>
          <div style={{ ...badgeStyle, marginBottom: 20 }}>EMPIEZA HOY</div>
          <h2 style={{ fontSize: 48, fontWeight: 900, marginBottom: 16, lineHeight: 1.1 }}>Gratis para talleres.<br />Sin compromiso.</h2>
          <p style={{ color: "#94a3b8", fontSize: 17, marginBottom: 32, lineHeight: 1.7 }}>Regístrate y accede a todos los proveedores y precios sin coste. Para talleres es gratis, para siempre. Sin tarjeta de crédito, sin permanencia.</p>
          <div className="landing-cta-buttons" style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" as const }}>
            <a href="/registro" style={{ display: "inline-flex", alignItems: "center", padding: "18px 48px", background: "linear-gradient(135deg,#2563eb,#1d4ed8)", color: "white", border: "none", borderRadius: 14, fontSize: 17, fontWeight: 800, cursor: "pointer", textDecoration: "none", boxShadow: "0 10px 30px rgba(37,99,235,0.35)" }}>EMPEZAR GRATIS →</a>
            <a href="mailto:info@recambio-directo.com" style={{ display: "flex", alignItems: "center", padding: "18px 32px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 14, color: "white", textDecoration: "none", fontWeight: 700, fontSize: 15 }}>Hablar con el equipo</a>
          </div>
          <div style={{ display: "flex", justifyContent: "center", gap: 32, marginTop: 32, flexWrap: "wrap" as const }}>
            {["Gratis para talleres", "Sin permanencia", "Soporte incluido", "Alta en 24h"].map(g => (
              <div key={g} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ color: "#4ade80", fontWeight: 900 }}>✓</span>
                <span style={{ color: "#94a3b8", fontSize: 13 }}>{g}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

    </main>
  );
}
