"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "./lib/supabase";

export default function Home() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [enviandoReset, setEnviandoReset] = useState(false);
  const [resetEnviado, setResetEnviado] = useState(false);
  const [mostrarReset, setMostrarReset] = useState(false);
  const [emailReset, setEmailReset] = useState("");
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    async function checkSession() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: perfil } = await supabase.from("usuarios").select("tipo, activo").eq("id", user.id).single();
      if (!perfil || perfil.activo === false) return;
      if (perfil.tipo === "proveedor") { router.push("/dashboard/proveedor"); return; }
      if (perfil.tipo === "admin") { router.push("/admin"); return; }
      router.push("/dashboard");
    }
    checkSession();
  }, []);

  async function iniciarSesion() {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { alert(error.message); return; }
    const { data: { user } } = await supabase.auth.getUser();
    const { data: perfil } = await supabase.from("usuarios").select("tipo, activo").eq("id", user!.id).single();
    if (perfil && perfil.activo === false) {
      await supabase.auth.signOut();
      alert("Tu cuenta está pendiente de verificación. Recibirás un email cuando esté activa. Si tienes dudas escríbenos a info@recambio-directo.com");
      return;
    }
    if (perfil?.tipo === "proveedor") { router.push("/dashboard/proveedor"); return; }
    if (perfil?.tipo === "admin") { router.push("/admin"); return; }
    router.push("/dashboard");
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") iniciarSesion();
  }

  async function enviarResetPassword() {
    if (!emailReset) { alert("Introduce tu email"); return; }
    setEnviandoReset(true);
    const { error } = await supabase.auth.resetPasswordForEmail(emailReset, { redirectTo: `${window.location.origin}/auth/reset-password` });
    setEnviandoReset(false);
    if (error) { alert("Error: " + error.message); return; }
    setResetEnviado(true);
  }

  const m = isMobile;

  return (
    <main style={{ minHeight: "100vh", background: "#020617", color: "white", position: "relative", overflow: "hidden" }}>
      {/* Fondo */}
      <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(37,99,235,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(37,99,235,0.07) 1px, transparent 1px)", backgroundSize: "60px 60px", pointerEvents: "none", zIndex: 1 }} />
      <div style={{ width: "600px", height: "600px", borderRadius: "999px", background: "rgba(37,99,235,0.22)", filter: "blur(160px)", position: "absolute", top: "-200px", left: "-200px", pointerEvents: "none", zIndex: 1 }} />
      <div style={{ width: "400px", height: "400px", borderRadius: "999px", background: "rgba(22,163,74,0.12)", filter: "blur(140px)", position: "absolute", bottom: "0", right: "-100px", pointerEvents: "none", zIndex: 1 }} />

      {/* ── HERO ── */}
      <section style={{ display: "grid", gridTemplateColumns: m ? "1fr" : "1fr 460px", gap: m ? 32 : 60, padding: m ? "40px 20px 32px" : "80px 80px 60px", maxWidth: 1300, margin: "0 auto", alignItems: "center", position: "relative", zIndex: 10 }}>
        {!m && (
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={badgeStyle}>MARKETPLACE B2B AUTOMOCIÓN</div>
            <h1 style={{ fontSize: "86px", fontWeight: 900, color: "white", lineHeight: 0.95, marginBottom: "24px", letterSpacing: "-0.04em" }}>
              RECAMBIO<br /><span style={{ color: "#2563eb" }}>DIRECTO</span>
            </h1>
            <p style={{ color: "#94a3b8", marginBottom: "36px", fontSize: "18px", lineHeight: 1.7, maxWidth: 480 }}>
              La plataforma profesional que conecta talleres y proveedores de recambios en toda España. Sin intermediarios, sin llamadas, con precio fijo mensual.
            </p>
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap" as const }}>
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
        )}

        {/* LOGIN BOX */}
        <div style={{ background: "rgba(30,41,59,0.95)", backdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.12)", padding: m ? "28px 20px" : "40px", borderRadius: "28px", boxShadow: "0 30px 80px rgba(0,0,0,0.4)" }}>
          {m && (
            <div style={{ textAlign: "center", marginBottom: 24 }}>
              <div style={{ ...badgeStyle, margin: "0 auto 16px" }}>MARKETPLACE B2B</div>
              <h1 style={{ fontSize: 42, fontWeight: 900, lineHeight: 1, marginBottom: 8 }}>RECAMBIO<br /><span style={{ color: "#2563eb" }}>DIRECTO</span></h1>
              <p style={{ color: "#94a3b8", fontSize: 14, lineHeight: 1.6 }}>La plataforma profesional de recambios B2B</p>
            </div>
          )}
          {!mostrarReset ? (
            <>
              <h2 style={{ fontSize: m ? 20 : 26, fontWeight: 900, marginBottom: 6 }}>Accede a tu cuenta</h2>
              <p style={{ color: "#94a3b8", fontSize: 14, marginBottom: 24 }}>Plataforma exclusiva para profesionales del sector</p>
              <input type="email" placeholder="Email profesional" value={email} onChange={e => setEmail(e.target.value)} onKeyDown={handleKeyDown} style={inputStyle} />
              <input type="password" placeholder="Contraseña" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={handleKeyDown} style={inputStyle} />
              <button onClick={iniciarSesion} style={loginButton}>INICIAR SESIÓN →</button>
              <button onClick={() => router.push("/registro")} style={registerButton}>➕ CREAR CUENTA GRATIS</button>
              <button onClick={() => setMostrarReset(true)} style={{ background: "none", border: "none", color: "#60a5fa", cursor: "pointer", fontSize: 13, marginTop: 12, width: "100%", textAlign: "center" as const }}>¿Olvidaste tu contraseña?</button>
              <div style={{ display: "flex", justifyContent: "center", flexWrap: "wrap" as const, gap: 4, marginTop: 20, paddingTop: 16, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                {[
                  { label: "Quiénes somos", href: "/quienes-somos" },
                  { label: "Privacidad", href: "/privacidad" },
                  { label: "Términos", href: "/terminos" },
                  { label: "Cookies", href: "/cookies" },
                ].map(({ label, href }, i) => (
                  <span key={label} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    {i > 0 && <span style={{ color: "rgba(255,255,255,0.2)", fontSize: 11 }}>·</span>}
                    <a href={href} style={{ color: "#94a3b8", fontSize: 11, textDecoration: "none", fontWeight: 600 }}>{label}</a>
                  </span>
                ))}
              </div>
            </>
          ) : (
            <>
              <h2 style={{ fontSize: m ? 20 : 26, fontWeight: 900, marginBottom: 6 }}>Recuperar contraseña</h2>
              <p style={{ color: "#94a3b8", fontSize: 14, marginBottom: 24 }}>Te enviaremos un enlace a tu email</p>
              {resetEnviado ? (
                <div style={{ background: "rgba(22,163,74,0.1)", border: "1px solid rgba(22,163,74,0.3)", borderRadius: 14, padding: "20px", textAlign: "center" as const }}>
                  <p style={{ fontSize: 32, marginBottom: 8 }}>📧</p>
                  <p style={{ color: "#4ade80", fontWeight: 700, marginBottom: 6 }}>Email enviado</p>
                  <p style={{ color: "#94a3b8", fontSize: 13 }}>Revisa tu bandeja de entrada y sigue el enlace para cambiar tu contraseña.</p>
                </div>
              ) : (
                <input type="email" placeholder="Tu email" value={emailReset} onChange={e => setEmailReset(e.target.value)} onKeyDown={e => e.key === "Enter" && enviarResetPassword()} style={inputStyle} />
              )}
              {!resetEnviado && <button onClick={enviarResetPassword} disabled={enviandoReset} style={loginButton}>{enviandoReset ? "Enviando..." : "ENVIAR ENLACE"}</button>}
              <button onClick={() => { setMostrarReset(false); setResetEnviado(false); setEmailReset(""); }} style={{ background: "none", border: "none", color: "#60a5fa", cursor: "pointer", fontSize: 13, marginTop: 12, width: "100%", textAlign: "center" as const }}>← Volver al login</button>
            </>
          )}
        </div>
      </section>

      {/* ── PARA TALLERES Y PROVEEDORES ── */}
      <section style={{ padding: m ? "40px 20px" : "80px", maxWidth: 1300, margin: "0 auto", position: "relative", zIndex: 10 }}>
        <div style={{ textAlign: "center", marginBottom: m ? 32 : 56 }}>
          <div style={badgeStyle}>¿QUIÉN SOY?</div>
          <h2 style={{ fontSize: m ? 28 : 44, fontWeight: 900, marginBottom: 12 }}>Elige tu perfil</h2>
          <p style={{ color: "#94a3b8", fontSize: m ? 14 : 17 }}>Una plataforma diseñada para los dos lados del negocio</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: m ? "1fr" : "1fr 1fr", gap: m ? 16 : 24 }}>

          {/* TALLER */}
          <div style={{ background: "rgba(37,99,235,0.06)", border: "1px solid rgba(37,99,235,0.25)", borderRadius: 24, padding: m ? 24 : 36 }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>🔧</div>
            <div style={{ display: "inline-block", background: "rgba(37,99,235,0.2)", color: "#60a5fa", padding: "4px 14px", borderRadius: 999, fontSize: 12, fontWeight: 700, marginBottom: 16 }}>SOY TALLER</div>
            <h3 style={{ fontSize: m ? 20 : 24, fontWeight: 900, marginBottom: 12 }}>Encuentra el recambio que necesitas en segundos</h3>
            <p style={{ color: "#94a3b8", fontSize: 14, lineHeight: 1.7, marginBottom: 20 }}>
              Sin esperar a que te cojan el teléfono. Sin catálogos desactualizados. Busca por referencia OEM o IAM, ve el precio en tiempo real y pide en 3 clics.
            </p>
            <div style={{ display: "flex", flexDirection: "column" as const, gap: 10, marginBottom: 24 }}>
              {[
                "Acceso a referencias OEM, IAM y Universal",
                "Entrega 24h con las principales agencias de transporte",
                "Chat directo con el proveedor en cada pedido",
                "Historial de pedidos y facturas descargables",
                "RD Pago — compra ahora y paga en 15 días",
              ].map(item => (
                <div key={item} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                  <span style={{ color: "#4ade80", fontWeight: 900, fontSize: 16, flexShrink: 0, marginTop: 1 }}>✓</span>
                  <span style={{ color: "#cbd5e1", fontSize: 14 }}>{item}</span>
                </div>
              ))}
            </div>
            <button onClick={() => router.push("/registro")} style={{ ...loginButton, marginBottom: 0, background: "linear-gradient(135deg,#2563eb,#1d4ed8)" }}>
              Registrarme como taller →
            </button>
          </div>

          {/* PROVEEDOR */}
          <div style={{ background: "rgba(22,163,74,0.06)", border: "1px solid rgba(22,163,74,0.25)", borderRadius: 24, padding: m ? 24 : 36 }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>🏭</div>
            <div style={{ display: "inline-block", background: "rgba(22,163,74,0.2)", color: "#4ade80", padding: "4px 14px", borderRadius: 999, fontSize: 12, fontWeight: 700, marginBottom: 16 }}>SOY PROVEEDOR</div>
            <h3 style={{ fontSize: m ? 20 : 24, fontWeight: 900, marginBottom: 12 }}>Tu catálogo visto por talleres de toda España</h3>
            <p style={{ color: "#94a3b8", fontSize: 14, lineHeight: 1.7, marginBottom: 20 }}>
              Sube tu catálogo una vez y empieza a recibir pedidos sin visitas comerciales y sin llamadas.
            </p>
            <div style={{ display: "flex", flexDirection: "column" as const, gap: 10, marginBottom: 24 }}>
              {[
                "Importación masiva desde Excel, CSV o FTP automático",
                "Albarán y etiqueta de envío generados automáticamente",
                "Control total sobre quién ve tus precios",
                "Panel de pedidos, facturación y estadísticas",
                "Precio fijo mensual — sin sorpresas",
              ].map(item => (
                <div key={item} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                  <span style={{ color: "#4ade80", fontWeight: 900, fontSize: 16, flexShrink: 0, marginTop: 1 }}>✓</span>
                  <span style={{ color: "#cbd5e1", fontSize: 14 }}>{item}</span>
                </div>
              ))}
            </div>
            <button onClick={() => router.push("/registro?tipo=proveedor")} style={{ ...loginButton, marginBottom: 0, background: "linear-gradient(135deg,#16a34a,#15803d)" }}>
              Registrarme como proveedor →
            </button>
          </div>
        </div>
      </section>

      {/* ── CÓMO FUNCIONA ── */}
      <section style={{ padding: m ? "40px 20px" : "80px", maxWidth: 1300, margin: "0 auto", position: "relative", zIndex: 10, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ textAlign: "center", marginBottom: m ? 32 : 56 }}>
          <div style={badgeStyle}>PROCESO</div>
          <h2 style={{ fontSize: m ? 28 : 44, fontWeight: 900, marginBottom: 12 }}>Empieza en 3 pasos</h2>
          <p style={{ color: "#94a3b8", fontSize: m ? 14 : 17 }}>Sin burocracia, sin esperas, sin complicaciones</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: m ? "1fr" : "repeat(3,1fr)", gap: m ? 16 : 24 }}>
          {[
            { num: "01", icon: "📝", title: "Crea tu cuenta", desc: "Rellena tus datos profesionales en menos de 3 minutos. Solo necesitas tu CIF y email de empresa.", color: "#2563eb" },
            { num: "02", icon: "✅", title: "Verificación en 24h", desc: "Nuestro equipo valida tu perfil profesional y activa tu acceso. Recibirás un email de confirmación.", color: "#16a34a" },
            { num: "03", icon: "🚀", title: "Opera desde el primer día", desc: "Busca piezas, sube tu catálogo o gestiona tus pedidos. Todo desde un panel diseñado para el sector.", color: "#7c3aed" },
          ].map(({ num, icon, title, desc, color }) => (
            <div key={num} style={{ background: "rgba(30,41,59,0.7)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, padding: m ? 20 : 32, position: "relative" as const }}>
              <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 44, height: 44, borderRadius: 12, background: `${color}30`, border: `1px solid ${color}60`, marginBottom: 16 }}>
                <span style={{ fontSize: 20 }}>{icon}</span>
              </div>
              <div style={{ position: "absolute" as const, top: m ? 20 : 32, right: m ? 20 : 32, fontSize: 40, fontWeight: 900, color: "rgba(255,255,255,0.04)" }}>{num}</div>
              <h3 style={{ fontSize: m ? 16 : 18, fontWeight: 800, marginBottom: 10 }}>{title}</h3>
              <p style={{ color: "#94a3b8", fontSize: m ? 13 : 14, lineHeight: 1.7 }}>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section style={{ padding: m ? "40px 20px" : "80px", maxWidth: 1300, margin: "0 auto", position: "relative", zIndex: 10, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ textAlign: "center", marginBottom: m ? 32 : 56 }}>
          <div style={badgeStyle}>PLATAFORMA</div>
          <h2 style={{ fontSize: m ? 28 : 44, fontWeight: 900, marginBottom: 12 }}>Todo lo que necesitas en un solo lugar</h2>
          <p style={{ color: "#94a3b8", fontSize: m ? 14 : 17 }}>Diseñado específicamente para el sector del recambio de automoción</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: m ? "1fr" : "repeat(2,1fr)", gap: m ? 16 : 24 }}>
          {[
            { icon: "🔍", title: "Búsqueda instantánea de referencias", desc: "OEM, IAM y Universal. Filtra por tipo, marca o referencia exacta. Precios en tiempo real sin necesidad de llamar.", color: "#2563eb" },
            { icon: "📦", title: "Gestión de pedidos completa", desc: "Albarán automático, etiqueta de envío, chat con el proveedor y seguimiento en tiempo real desde el panel.", color: "#16a34a" },
            { icon: "🚚", title: "Logística integrada", desc: "Conectado con las principales agencias de transporte. Elige agencia, se genera la etiqueta automáticamente y el tracking llega por email.", color: "#7c3aed" },
            { icon: "🔒", title: "Control total sobre tu negocio", desc: "Excluye competidores, controla quién ve tus precios, gestiona crédito RD y accede a tu histórico completo.", color: "#f59e0b" },
          ].map(({ icon, title, desc, color }) => (
            <div key={title} style={{ background: "rgba(30,41,59,0.7)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, padding: m ? 20 : 32, display: "flex", gap: 16, alignItems: "flex-start" }}>
              <div style={{ flexShrink: 0, width: 48, height: 48, borderRadius: 14, background: `${color}20`, border: `1px solid ${color}40`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>{icon}</div>
              <div>
                <h3 style={{ fontSize: m ? 15 : 17, fontWeight: 800, marginBottom: 8 }}>{title}</h3>
                <p style={{ color: "#94a3b8", fontSize: m ? 13 : 14, lineHeight: 1.7, margin: 0 }}>{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── AGENCIAS ── */}
      <section style={{ padding: m ? "32px 20px" : "60px 80px", maxWidth: 1300, margin: "0 auto", position: "relative", zIndex: 10, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ background: "rgba(37,99,235,0.06)", border: "1px solid rgba(37,99,235,0.2)", borderRadius: 20, padding: m ? "24px 20px" : "32px 48px", display: "flex", flexDirection: m ? "column" : "row" as const, alignItems: "center", gap: m ? 16 : 32 }}>
          <div style={{ fontSize: 36, flexShrink: 0 }}>🚚</div>
          <div style={{ flex: 1 }}>
            <h3 style={{ fontSize: m ? 16 : 20, fontWeight: 900, marginBottom: 6 }}>Logística integrada con las principales agencias de transporte</h3>
            <p style={{ color: "#94a3b8", fontSize: m ? 13 : 15, margin: 0, lineHeight: 1.6 }}>Trabajamos con múltiples agencias para garantizar la mejor cobertura y precio en cada envío. Etiquetas automáticas, tracking en tiempo real y entrega en 24-48h en toda España.</p>
          </div>
          <div style={{ flexShrink: 0, background: "rgba(37,99,235,0.15)", border: "1px solid rgba(37,99,235,0.3)", borderRadius: 12, padding: "12px 20px", textAlign: "center" as const }}>
            <p style={{ color: "#60a5fa", fontWeight: 900, fontSize: 22, margin: 0 }}>24-48h</p>
            <p style={{ color: "#94a3b8", fontSize: 12, margin: 0 }}>Entrega en España</p>
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ── */}
      <section style={{ padding: m ? "40px 20px" : "80px", position: "relative", zIndex: 10, borderTop: "1px solid rgba(255,255,255,0.06)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ maxWidth: 700, margin: "0 auto", textAlign: "center" as const }}>
          <div style={{ ...badgeStyle, marginBottom: 20 }}>EMPIEZA HOY</div>
          <h2 style={{ fontSize: m ? 28 : 48, fontWeight: 900, marginBottom: 16, lineHeight: 1.1 }}>
            1 mes gratis.<br />Sin compromiso.
          </h2>
          <p style={{ color: "#94a3b8", fontSize: m ? 14 : 17, marginBottom: 32, lineHeight: 1.7 }}>
            Prueba Recambio Directo durante un mes completamente gratis. Sin tarjeta de crédito, sin permanencia. A partir del segundo mes, solo 25€/mes. Sin permanencia ni sorpresas.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" as const }}>
            <button onClick={() => router.push("/registro")} style={{ ...loginButton, width: "auto", padding: "18px 48px", fontSize: 17, marginBottom: 0 }}>
              EMPEZAR GRATIS →
            </button>
            <a href="mailto:info@recambio-directo.com" style={{ display: "flex", alignItems: "center", padding: "18px 32px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 14, color: "white", textDecoration: "none", fontWeight: 700, fontSize: 15 }}>
              Hablar con el equipo
            </a>
          </div>
          <div style={{ display: "flex", justifyContent: "center", gap: m ? 16 : 32, marginTop: 32, flexWrap: "wrap" as const }}>
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
      <footer style={{ padding: m ? "40px 20px 24px" : "60px 80px 30px", position: "relative", zIndex: 10 }}>
        <div style={{ display: "grid", gridTemplateColumns: m ? "1fr" : "2fr 1fr 1fr 1fr", gap: m ? 28 : 40, marginBottom: 32, paddingBottom: 32, borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
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
            <a href="/privacidad" style={footerLink}>Política de privacidad</a>
            <a href="/terminos" style={footerLink}>Términos y condiciones</a>
            <a href="/cookies" style={footerLink}>Política de cookies</a>
          </div>
          <div>
            <h4 style={{ fontWeight: 700, fontSize: 14, marginBottom: 14, color: "white" }}>Contacto</h4>
            <p style={{ color: "#94a3b8", fontSize: 13 }}>info@recambio-directo.com</p>
            <p style={{ color: "#94a3b8", fontSize: 13, marginTop: 4 }}>España</p>
            <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
              <span style={{ background: "rgba(22,163,74,0.15)", color: "#4ade80", padding: "4px 10px", borderRadius: 999, fontSize: 11, fontWeight: 700 }}>● Online</span>
            </div>
          </div>
        </div>
        <div style={{ textAlign: "center", color: "rgba(255,255,255,0.25)", fontSize: 12 }}>
          <p>© 2026 Recambio Directo · Marketplace B2B de Automoción · España</p>
        </div>
      </footer>
    </main>
  );
}

const badgeStyle: React.CSSProperties = { display: "inline-block", background: "rgba(37,99,235,0.15)", color: "#60a5fa", padding: "8px 16px", borderRadius: "999px", fontSize: "13px", fontWeight: 700, marginBottom: "24px", letterSpacing: "0.05em" };
const inputStyle: React.CSSProperties = { width: "100%", padding: "16px 18px", borderRadius: "14px", border: "1px solid rgba(255,255,255,0.12)", marginBottom: "14px", fontSize: "15px", background: "rgba(15,23,42,0.8)", color: "white", outline: "none", boxSizing: "border-box" };
const loginButton: React.CSSProperties = { width: "100%", padding: "16px", background: "linear-gradient(135deg,#2563eb,#1d4ed8)", color: "white", border: "none", borderRadius: "14px", fontSize: "16px", fontWeight: 800, cursor: "pointer", marginBottom: "12px", boxShadow: "0 10px 30px rgba(37,99,235,0.35)" };
const registerButton: React.CSSProperties = { width: "100%", padding: "16px", background: "rgba(255,255,255,0.05)", color: "white", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "14px", fontSize: "15px", fontWeight: 700, cursor: "pointer" };
const footerLink: React.CSSProperties = { display: "block", color: "#94a3b8", fontSize: 13, textDecoration: "none", marginBottom: 8 };