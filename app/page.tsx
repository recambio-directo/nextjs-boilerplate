import type { Metadata } from "next";
import React from "react";
import LoginBox from "./components/LoginBox";

export const metadata: Metadata = {
  title: "Recambio Directo — Marketplace B2B de Recambios de Automoción en España",
  description: "Marketplace B2B de recambios de automoción. Conectamos talleres y proveedores en toda España. Busca piezas OEM e IAM, compara precios y recibe en 24h. Madrid, Barcelona, Valencia, Sevilla y toda España.",
  alternates: { canonical: "https://www.recambio-directo.com" },
};

const badgeStyle: React.CSSProperties = { display: "inline-block", background: "rgba(37,99,235,0.15)", color: "#60a5fa", padding: "8px 16px", borderRadius: "999px", fontSize: "13px", fontWeight: 700, marginBottom: "24px", letterSpacing: "0.05em" };
const footerLink: React.CSSProperties = { display: "block", color: "#94a3b8", fontSize: 13, textDecoration: "none", marginBottom: 8 };

export default function Home() {
  return (
    <main style={{ minHeight: "100vh", background: "#020617", color: "white", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(37,99,235,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(37,99,235,0.07) 1px, transparent 1px)", backgroundSize: "60px 60px", pointerEvents: "none", zIndex: 1 }} />
      <div style={{ width: "600px", height: "600px", borderRadius: "999px", background: "rgba(37,99,235,0.22)", filter: "blur(160px)", position: "absolute", top: "-200px", left: "-200px", pointerEvents: "none", zIndex: 1 }} />
      <div style={{ width: "400px", height: "400px", borderRadius: "999px", background: "rgba(22,163,74,0.12)", filter: "blur(140px)", position: "absolute", bottom: "0", right: "-100px", pointerEvents: "none", zIndex: 1 }} />

      {/* ── HERO ── */}
      <section className="landing-hero">
        <div className="landing-hero-text">
          <div style={badgeStyle}>MARKETPLACE B2B AUTOMOCIÓN</div>
          <h1 style={{ fontSize: "86px", fontWeight: 900, color: "white", lineHeight: 0.95, marginBottom: "24px", letterSpacing: "-0.04em" }}>
            RECAMBIO<br /><span style={{ color: "#2563eb" }}>DIRECTO</span>
          </h1>
          <p style={{ color: "#94a3b8", marginBottom: "36px", fontSize: "18px", lineHeight: 1.7, maxWidth: 480 }}>
            La plataforma profesional que conecta talleres y proveedores de recambios en toda España. Sin intermediarios, sin llamadas, con precio fijo mensual.
          </p>
          <div className="landing-stats">
            {[
              { num: "B2B", label: "Solo profesionales" },
              { num: "24h", label: "Entrega express" },
              { num: "100%", label: "Digital y seguro" },
              { num: "25€", label: "Precio fijo al mes" },
            ].map(({ num, label }) => (
              <div key={label} style={{ display: "flex", flexDirection: "column", alignItems: "center", background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 16, padding: "14px 20px", minWidth: 80 }}>
                <span style={{ fontSize: 24, fontWeight: 900, color: "#60a5fa" }}>{num}</span>
                <span style={{ fontSize: 11, color: "#94a3b8", marginTop: 4, textAlign: "center" as const }}>{label}</span>
              </div>
            ))}
          </div>
        </div>
        <LoginBox />
      </section>

      {/* ── PARA TALLERES Y PROVEEDORES ── */}
      <section className="landing-section">
        <div style={{ textAlign: "center", marginBottom: 56 }}>
          <div style={badgeStyle}>¿QUIÉN SOY?</div>
          <h2 style={{ fontSize: 44, fontWeight: 900, marginBottom: 12 }}>Elige tu perfil</h2>
          <p style={{ color: "#94a3b8", fontSize: 17 }}>Una plataforma diseñada para los dos lados del negocio</p>
        </div>
        <div className="landing-grid-2">
          <div style={{ background: "rgba(37,99,235,0.06)", border: "1px solid rgba(37,99,235,0.25)", borderRadius: 24, padding: 36 }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>🔧</div>
            <div style={{ display: "inline-block", background: "rgba(37,99,235,0.2)", color: "#60a5fa", padding: "4px 14px", borderRadius: 999, fontSize: 12, fontWeight: 700, marginBottom: 16 }}>SOY TALLER</div>
            <h2 style={{ fontSize: 24, fontWeight: 900, marginBottom: 12 }}>Encuentra el recambio que necesitas en segundos</h2>
            <p style={{ color: "#94a3b8", fontSize: 14, lineHeight: 1.7, marginBottom: 20 }}>Sin esperar a que te cojan el teléfono. Sin catálogos desactualizados. Busca por referencia OEM o IAM, ve el precio en tiempo real y pide en 3 clics.</p>
            <ul style={{ listStyle: "none", padding: 0, margin: "0 0 24px", display: "flex", flexDirection: "column", gap: 10 }}>
              {["Acceso a referencias OEM, IAM y Universal", "Entrega 24h con las principales agencias de transporte", "Chat directo con el proveedor en cada pedido", "Historial de pedidos y facturas descargables", "RD Pago — compra ahora y paga en 15 días"].map(item => (
                <li key={item} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                  <span style={{ color: "#4ade80", fontWeight: 900, fontSize: 16, flexShrink: 0, marginTop: 1 }}>✓</span>
                  <span style={{ color: "#cbd5e1", fontSize: 14 }}>{item}</span>
                </li>
              ))}
            </ul>
            <a href="/registro" style={{ display: "block", width: "100%", padding: "16px", background: "linear-gradient(135deg,#2563eb,#1d4ed8)", color: "white", border: "none", borderRadius: "14px", fontSize: "16px", fontWeight: 800, cursor: "pointer", textAlign: "center", textDecoration: "none", boxSizing: "border-box" as const }}>Registrarme como taller →</a>
          </div>
          <div style={{ background: "rgba(22,163,74,0.06)", border: "1px solid rgba(22,163,74,0.25)", borderRadius: 24, padding: 36 }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>🏭</div>
            <div style={{ display: "inline-block", background: "rgba(22,163,74,0.2)", color: "#4ade80", padding: "4px 14px", borderRadius: 999, fontSize: 12, fontWeight: 700, marginBottom: 16 }}>SOY PROVEEDOR</div>
            <h2 style={{ fontSize: 24, fontWeight: 900, marginBottom: 12 }}>Tu catálogo visto por talleres de toda España</h2>
            <p style={{ color: "#94a3b8", fontSize: 14, lineHeight: 1.7, marginBottom: 20 }}>Sube tu catálogo una vez y empieza a recibir pedidos sin visitas comerciales y sin llamadas.</p>
            <ul style={{ listStyle: "none", padding: 0, margin: "0 0 24px", display: "flex", flexDirection: "column", gap: 10 }}>
              {["Importación masiva desde Excel, CSV o FTP automático", "Albarán y etiqueta de envío generados automáticamente", "Control total sobre quién ve tus precios", "Panel de pedidos, facturación y estadísticas", "Precio fijo mensual — sin sorpresas"].map(item => (
                <li key={item} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                  <span style={{ color: "#4ade80", fontWeight: 900, fontSize: 16, flexShrink: 0, marginTop: 1 }}>✓</span>
                  <span style={{ color: "#cbd5e1", fontSize: 14 }}>{item}</span>
                </li>
              ))}
            </ul>
            <a href="/registro?tipo=proveedor" style={{ display: "block", width: "100%", padding: "16px", background: "linear-gradient(135deg,#16a34a,#15803d)", color: "white", border: "none", borderRadius: "14px", fontSize: "16px", fontWeight: 800, cursor: "pointer", textAlign: "center", textDecoration: "none", boxSizing: "border-box" as const }}>Registrarme como proveedor →</a>
          </div>
        </div>
      </section>

      {/* ── CÓMO FUNCIONA ── */}
      <section className="landing-section" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ textAlign: "center", marginBottom: 56 }}>
          <div style={badgeStyle}>PROCESO</div>
          <h2 style={{ fontSize: 44, fontWeight: 900, marginBottom: 12 }}>Empieza en 3 pasos</h2>
          <p style={{ color: "#94a3b8", fontSize: 17 }}>Sin burocracia, sin esperas, sin complicaciones</p>
        </div>
        <div className="landing-grid-3">
          {[
            { num: "01", icon: "📝", title: "Crea tu cuenta", desc: "Rellena tus datos profesionales en menos de 3 minutos. Solo necesitas tu CIF y email de empresa.", color: "#2563eb" },
            { num: "02", icon: "✅", title: "Verificación en 24h", desc: "Nuestro equipo valida tu perfil profesional y activa tu acceso. Recibirás un email de confirmación.", color: "#16a34a" },
            { num: "03", icon: "🚀", title: "Opera desde el primer día", desc: "Busca piezas, sube tu catálogo o gestiona tus pedidos. Todo desde un panel diseñado para el sector.", color: "#7c3aed" },
          ].map(({ num, icon, title, desc, color }) => (
            <div key={num} style={{ background: "rgba(30,41,59,0.7)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, padding: 32, position: "relative" as const }}>
              <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 44, height: 44, borderRadius: 12, background: `${color}30`, border: `1px solid ${color}60`, marginBottom: 16 }}>
                <span style={{ fontSize: 20 }}>{icon}</span>
              </div>
              <div style={{ position: "absolute" as const, top: 32, right: 32, fontSize: 40, fontWeight: 900, color: "rgba(255,255,255,0.04)" }}>{num}</div>
              <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 10 }}>{title}</h3>
              <p style={{ color: "#94a3b8", fontSize: 14, lineHeight: 1.7 }}>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="landing-section" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ textAlign: "center", marginBottom: 56 }}>
          <div style={badgeStyle}>PLATAFORMA</div>
          <h2 style={{ fontSize: 44, fontWeight: 900, marginBottom: 12 }}>Todo lo que necesitas en un solo lugar</h2>
          <p style={{ color: "#94a3b8", fontSize: 17 }}>Diseñado específicamente para el sector del recambio de automoción en España</p>
        </div>
        <div className="landing-grid-2">
          {[
            { icon: "🔍", title: "Búsqueda instantánea de referencias OEM e IAM", desc: "Filtra por tipo, marca o referencia exacta. Precios en tiempo real sin necesidad de llamar. Compatible con referencias de todas las marcas.", color: "#2563eb" },
            { icon: "📦", title: "Gestión de pedidos completa para talleres", desc: "Albarán automático, etiqueta de envío, chat con el proveedor y seguimiento en tiempo real desde el panel.", color: "#16a34a" },
            { icon: "🚚", title: "Logística integrada con las principales agencias nacionales", desc: "Conectado con las principales agencias de transporte. Elige agencia, se genera la etiqueta automáticamente y el tracking llega por email.", color: "#7c3aed" },
            { icon: "🔒", title: "Control total sobre tu negocio de recambios", desc: "Excluye competidores, controla quién ve tus precios, gestiona crédito RD y accede a tu histórico completo.", color: "#f59e0b" },
          ].map(({ icon, title, desc, color }) => (
            <div key={title} style={{ background: "rgba(30,41,59,0.7)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, padding: 32, display: "flex", gap: 16, alignItems: "flex-start" }}>
              <div style={{ flexShrink: 0, width: 48, height: 48, borderRadius: 14, background: `${color}20`, border: `1px solid ${color}40`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>{icon}</div>
              <div>
                <h3 style={{ fontSize: 17, fontWeight: 800, marginBottom: 8 }}>{title}</h3>
                <p style={{ color: "#94a3b8", fontSize: 14, lineHeight: 1.7, margin: 0 }}>{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── ZONAS ── */}
      <section className="landing-section-sm" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div style={badgeStyle}>COBERTURA NACIONAL</div>
          <h2 style={{ fontSize: 36, fontWeight: 900, marginBottom: 12 }}>Marketplace de recambios en toda España</h2>
          <p style={{ color: "#94a3b8", fontSize: 15, maxWidth: 600, margin: "0 auto" }}>Proveedores y talleres conectados en las principales ciudades y provincias españolas</p>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "center" }}>
          {["Madrid", "Barcelona", "Valencia", "Sevilla", "Zaragoza", "Málaga", "Murcia", "Palma", "Las Palmas", "Bilbao", "Alicante", "Córdoba", "Valladolid", "Vigo", "Gijón", "Granada", "Hospitalet", "Vitoria", "A Coruña", "Elche", "Santa Cruz de Tenerife", "Oviedo", "Badalona", "Cartagena", "Terrassa", "Sabadell", "Jerez", "Móstoles", "Alcalá de Henares", "Pamplona"].map(ciudad => (
            <span key={ciudad} style={{ background: "rgba(37,99,235,0.1)", border: "1px solid rgba(37,99,235,0.2)", color: "#93c5fd", padding: "6px 14px", borderRadius: 999, fontSize: 13, fontWeight: 600 }}>{ciudad}</span>
          ))}
        </div>
      </section>

      {/* ── AGENCIAS ── */}
      <section className="landing-section-sm" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="landing-agencias" style={{ background: "rgba(37,99,235,0.06)", border: "1px solid rgba(37,99,235,0.2)", borderRadius: 20, padding: "32px 48px", display: "flex", alignItems: "center", gap: 32 }}>
          <div style={{ fontSize: 36, flexShrink: 0 }}>🚚</div>
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
          <h2 style={{ fontSize: 44, fontWeight: 900, marginBottom: 12 }}>Resolvemos tus dudas</h2>
        </div>
        <div className="landing-grid-2 landing-faq-grid" style={{ gap: 20, maxWidth: 1000, margin: "0 auto" }}>
          {[
            { q: "¿Cuánto cuesta Recambio Directo?", a: "El primer mes es completamente gratuito. A partir del segundo mes, el precio es de 25€/mes sin permanencia ni costes ocultos." },
            { q: "¿Quién puede registrarse?", a: "La plataforma es exclusiva para profesionales del sector: talleres mecánicos, concesionarios, distribuidores y proveedores de recambios." },
            { q: "¿Cuánto tarda en activarse mi cuenta?", a: "Verificamos cada cuenta manualmente en menos de 24 horas laborables para garantizar que todos los usuarios son profesionales del sector." },
            { q: "¿Qué agencias de transporte están disponibles?", a: "Trabajamos con varias de las principales agencias de transporte nacionales. La etiqueta de envío se genera automáticamente al crear el pedido y el tracking llega por email." },
            { q: "¿Puedo controlar quién ve mis precios?", a: "Sí. Los proveedores pueden excluir talleres concretos o códigos postales específicos para que no vean su catálogo ni sus precios." },
            { q: "¿Cómo funciona RD Pago?", a: "RD Pago es nuestra línea de crédito para talleres. Permite comprar ahora y pagar en 15 días. Se activa tras 1 mes de actividad y 1 pago con tarjeta." },
          ].map(({ q, a }) => (
            <div key={q} style={{ background: "rgba(30,41,59,0.7)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: 24 }}>
              <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 10, color: "#60a5fa" }}>{q}</h3>
              <p style={{ color: "#94a3b8", fontSize: 14, lineHeight: 1.7, margin: 0 }}>{a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA FINAL ── */}
      <section style={{ padding: "80px", position: "relative", zIndex: 10, borderTop: "1px solid rgba(255,255,255,0.06)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ maxWidth: 700, margin: "0 auto", textAlign: "center" as const }}>
          <div style={{ ...badgeStyle, marginBottom: 20 }}>EMPIEZA HOY</div>
          <h2 style={{ fontSize: 48, fontWeight: 900, marginBottom: 16, lineHeight: 1.1 }}>1 mes gratis.<br />Sin compromiso.</h2>
          <p style={{ color: "#94a3b8", fontSize: 17, marginBottom: 32, lineHeight: 1.7 }}>Prueba Recambio Directo durante un mes completamente gratis. Sin tarjeta de crédito, sin permanencia. A partir del segundo mes, solo 25€/mes.</p>
          <div className="landing-cta-buttons" style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" as const }}>
            <a href="/registro" style={{ display: "inline-flex", alignItems: "center", padding: "18px 48px", background: "linear-gradient(135deg,#2563eb,#1d4ed8)", color: "white", border: "none", borderRadius: 14, fontSize: 17, fontWeight: 800, cursor: "pointer", textDecoration: "none", boxShadow: "0 10px 30px rgba(37,99,235,0.35)" }}>EMPEZAR GRATIS →</a>
            <a href="mailto:info@recambio-directo.com" style={{ display: "flex", alignItems: "center", padding: "18px 32px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 14, color: "white", textDecoration: "none", fontWeight: 700, fontSize: 15 }}>Hablar con el equipo</a>
          </div>
          <div style={{ display: "flex", justifyContent: "center", gap: 32, marginTop: 32, flexWrap: "wrap" as const }}>
            {["Sin permanencia", "Precio fijo mensual", "Soporte incluido", "Alta en 24h"].map(g => (
              <div key={g} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ color: "#4ade80", fontWeight: 900 }}>✓</span>
                <span style={{ color: "#94a3b8", fontSize: 13 }}>{g}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ padding: "60px 80px 30px", position: "relative", zIndex: 10 }}>
        <div className="landing-footer-grid" style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: 40, marginBottom: 32, paddingBottom: 32, borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <div>
            <h3 style={{ fontWeight: 900, fontSize: 18, marginBottom: 8 }}>RECAMBIO DIRECTO</h3>
            <p style={{ color: "#94a3b8", fontSize: 13, lineHeight: 1.7, maxWidth: 280 }}>Marketplace B2B de recambios de automoción. Conectamos talleres y proveedores de recambios en toda España.</p>
          </div>
          <div>
            <h4 style={{ fontWeight: 700, fontSize: 14, marginBottom: 14, color: "white" }}>Plataforma</h4>
            <a href="/registro" style={footerLink}>Crear cuenta</a>
            <a href="/quienes-somos" style={footerLink}>Quiénes somos</a>
            <a href="mailto:info@recambio-directo.com" style={footerLink}>Contacto</a>
          </div>
          <div>
            <h4 style={{ fontWeight: 700, fontSize: 14, marginBottom: 14, color: "white" }}>Legal</h4>
            <a href="/aviso-legal" style={footerLink}>Aviso legal</a>
            <a href="/privacidad" style={footerLink}>Política de privacidad</a>
            <a href="/terminos" style={footerLink}>Términos y condiciones</a>
            <a href="/cookies" style={footerLink}>Política de cookies</a>
            <a href="/devoluciones" style={footerLink}>Política de devoluciones</a>
          </div>
          <div>
            <h4 style={{ fontWeight: 700, fontSize: 14, marginBottom: 14, color: "white" }}>Contacto</h4>
            <p style={{ color: "#94a3b8", fontSize: 13 }}>info@recambio-directo.com</p>
            <p style={{ color: "#94a3b8", fontSize: 13, marginTop: 4 }}>España</p>
            <div style={{ marginTop: 12, display: "flex", gap: 10, alignItems: "center" }}>
              <a href="https://www.instagram.com/recambiodirect" target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 34, height: 34, borderRadius: 8, background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)", color: "white", textDecoration: "none", fontSize: 16 }}>📷</a>
              <a href="https://www.linkedin.com/company/recambio-directo" target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 34, height: 34, borderRadius: 8, background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)", color: "white", textDecoration: "none", fontSize: 16 }}>💼</a>
              <span style={{ background: "rgba(22,163,74,0.15)", color: "#4ade80", padding: "4px 10px", borderRadius: 999, fontSize: 11, fontWeight: 700 }}>● Online</span>
            </div>
          </div>
        </div>
        <div style={{ textAlign: "center", color: "rgba(255,255,255,0.25)", fontSize: 12 }}>
          <p>© 2026 Recambio Directo · Marketplace B2B de Recambios de Automoción · España</p>
        </div>
      </footer>
    </main>
  );
}