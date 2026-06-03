"use client";

import { useState } from "react";
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

  async function iniciarSesion() {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { alert(error.message); return; }
    const { data: { user } } = await supabase.auth.getUser();
    const { data: perfil } = await supabase.from("usuarios").select("tipo, activo").eq("id", user!.id).single();

    // Verificar si la cuenta está activa
    if (perfil && perfil.activo === false) {
      await supabase.auth.signOut();
      alert("Tu cuenta está pendiente de verificación. Recibirás un email cuando esté activa. Si tienes dudas escríbenos a info@recambiodirecto.es");
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
    const { error } = await supabase.auth.resetPasswordForEmail(emailReset, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });
    setEnviandoReset(false);
    if (error) { alert("Error: " + error.message); return; }
    setResetEnviado(true);
  }

  const features = [
    { icon: "🔍", title: "Busca en miles de referencias", desc: "OEM, IAM y Universal con filtros avanzados y precios en tiempo real" },
    { icon: "📦", title: "Gestión de pedidos completa", desc: "Seguimiento, facturas, chat con proveedor y historial completo" },
    { icon: "🚚", title: "Logística integrada", desc: "MRW, GLS, Correos Express — etiquetas automáticas y tracking en tiempo real" },
    { icon: "📊", title: "Panel profesional", desc: "Gestiona tu stock, pedidos recibidos y catálogo desde un panel intuitivo" },
  ];

  return (
    <main style={mainStyle}>
      {/* GRID DE FONDO */}
      <div style={gridBg} />
      <div style={glowOne} />
      <div style={glowTwo} />
      <div style={glowThree} />

      {/* HERO */}
      <section style={heroSection}>

        {/* COLUMNA IZQUIERDA */}
        <div style={heroLeft}>
          <div style={badgeStyle}>MARKETPLACE B2B AUTOMOCIÓN</div>
          <h1 style={tituloStyle}>
            RECAMBIO<br />
            <span style={{ color: "#2563eb" }}>DIRECTO</span>
          </h1>
          <p style={subtituloStyle}>
            La plataforma profesional que conecta talleres y proveedores de recambios.
            Compra, vende y gestiona todo en un solo lugar.
          </p>
          <div style={statsRow}>
            {[
              { num: "B2B", label: "Solo profesionales" },
              { num: "24h", label: "Entrega express" },
              { num: "100%", label: "Digital y seguro" },
            ].map(({ num, label }) => (
              <div key={label} style={statBox}>
                <span style={statNum}>{num}</span>
                <span style={statLabel}>{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* FORMULARIO LOGIN */}
        <div style={cardStyle}>
          {!mostrarReset ? (
            <>
              <h2 style={formTitulo}>Accede a tu cuenta</h2>
              <p style={formSubtitulo}>Plataforma exclusiva para profesionales del sector</p>

              <input
                type="email"
                placeholder="Email profesional"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={handleKeyDown}
                style={inputStyle}
              />
              <input
                type="password"
                placeholder="Contraseña"
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={handleKeyDown}
                style={inputStyle}
              />

              <button onClick={iniciarSesion} style={loginButton}>
                INICIAR SESIÓN →
              </button>

              <button onClick={() => router.push("/registro")} style={registerButton}>
                ➕ CREAR CUENTA GRATIS
              </button>

              <button
                onClick={() => setMostrarReset(true)}
                style={{ background: "none", border: "none", color: "#60a5fa", cursor: "pointer", fontSize: 13, marginTop: 12, width: "100%", textAlign: "center" as const }}
              >
                ¿Olvidaste tu contraseña?
              </button>

              <div style={legalLinks}>
                <a href="/quienes-somos" style={legalLink}>Quiénes somos</a>
                <span style={separator}>·</span>
                <a href="/privacidad" style={legalLink}>Privacidad</a>
                <span style={separator}>·</span>
                <a href="/terminos" style={legalLink}>Términos</a>
                <span style={separator}>·</span>
                <a href="/cookies" style={legalLink}>Cookies</a>
              </div>
            </>
          ) : (
            <>
              <h2 style={formTitulo}>Recuperar contraseña</h2>
              <p style={formSubtitulo}>Te enviaremos un enlace a tu email</p>

              {resetEnviado ? (
                <div style={{ background: "rgba(22,163,74,0.1)", border: "1px solid rgba(22,163,74,0.3)", borderRadius: 14, padding: "20px", textAlign: "center" as const }}>
                  <p style={{ fontSize: 32, marginBottom: 8 }}>📧</p>
                  <p style={{ color: "#4ade80", fontWeight: 700, marginBottom: 6 }}>Email enviado</p>
                  <p style={{ color: "#94a3b8", fontSize: 13 }}>Revisa tu bandeja de entrada y sigue el enlace para cambiar tu contraseña.</p>
                </div>
              ) : (
                <input
                  type="email"
                  placeholder="Tu email"
                  value={emailReset}
                  onChange={e => setEmailReset(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && enviarResetPassword()}
                  style={inputStyle}
                />
              )}

              {!resetEnviado && (
                <button onClick={enviarResetPassword} disabled={enviandoReset} style={loginButton}>
                  {enviandoReset ? "Enviando..." : "ENVIAR ENLACE"}
                </button>
              )}

              <button
                onClick={() => { setMostrarReset(false); setResetEnviado(false); setEmailReset(""); }}
                style={{ background: "none", border: "none", color: "#60a5fa", cursor: "pointer", fontSize: 13, marginTop: 12, width: "100%", textAlign: "center" as const }}
              >
                ← Volver al login
              </button>
            </>
          )}
        </div>
      </section>

      {/* FEATURES */}
      <section style={featuresSection}>
        <div style={featuresTitulo}>
          <h2 style={{ fontSize: 42, fontWeight: 900, marginBottom: 12 }}>Todo lo que necesitas en una plataforma</h2>
          <p style={{ color: "#94a3b8", fontSize: 18 }}>Diseñada específicamente para el sector del recambio de automoción</p>
        </div>
        <div style={featuresGrid}>
          {features.map(({ icon, title, desc }) => (
            <div key={title} style={featureCard}>
              <div style={featureIcon}>{icon}</div>
              <h3 style={featureTitle}>{title}</h3>
              <p style={featureDesc}>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={ctaSection}>
        <h2 style={{ fontSize: 36, fontWeight: 900, marginBottom: 12 }}>¿Eres proveedor o taller?</h2>
        <p style={{ color: "#94a3b8", fontSize: 16, marginBottom: 32, maxWidth: 500, textAlign: "center" as const }}>
          Únete gratis durante 2 meses y descubre cómo Recambio Directo puede hacer crecer tu negocio.
        </p>
        <button onClick={() => router.push("/registro")} style={{ ...loginButton, width: "auto", padding: "18px 48px", fontSize: 18 }}>
          EMPEZAR GRATIS →
        </button>
      </section>

      {/* FOOTER */}
      <footer style={footerStyle}>
        <div style={footerGrid}>
          <div>
            <h3 style={{ fontWeight: 900, fontSize: 20, marginBottom: 8 }}>RECAMBIO DIRECTO</h3>
            <p style={{ color: "#94a3b8", fontSize: 13, lineHeight: 1.7 }}>Marketplace B2B de recambios de automoción. Conectamos talleres y proveedores en toda España.</p>
          </div>
          <div>
            <h4 style={footerColTitle}>Plataforma</h4>
            <a href="/registro" style={footerLink}>Crear cuenta</a>
            <a href="/quienes-somos" style={footerLink}>Quiénes somos</a>
            <a href="mailto:info@recambiodirecto.es" style={footerLink}>Contacto</a>
          </div>
          <div>
            <h4 style={footerColTitle}>Legal</h4>
            <a href="/privacidad" style={footerLink}>Política de privacidad</a>
            <a href="/terminos" style={footerLink}>Términos y condiciones</a>
            <a href="/cookies" style={footerLink}>Política de cookies</a>
          </div>
          <div>
            <h4 style={footerColTitle}>Contacto</h4>
            <p style={{ color: "#94a3b8", fontSize: 13 }}>info@recambiodirecto.es</p>
            <p style={{ color: "#94a3b8", fontSize: 13, marginTop: 4 }}>España</p>
          </div>
        </div>
        <div style={footerBottom}>
          <p>© 2026 Recambio Directo · Marketplace B2B de Automoción · España</p>
        </div>
      </footer>

    </main>
  );
}

/* STYLES */
const mainStyle = { minHeight: "100vh", background: "#020617", color: "white", position: "relative" as const, overflow: "hidden" };
const gridBg = { position: "absolute" as const, inset: 0, backgroundImage: "linear-gradient(rgba(37,99,235,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(37,99,235,0.07) 1px, transparent 1px)", backgroundSize: "60px 60px", pointerEvents: "none" as const, zIndex: 1 };
const glowOne = { width: "800px", height: "800px", borderRadius: "999px", background: "rgba(37,99,235,0.22)", filter: "blur(160px)", position: "absolute" as const, top: "-300px", left: "-300px", pointerEvents: "none" as const, zIndex: 1 };
const glowTwo = { width: "600px", height: "600px", borderRadius: "999px", background: "rgba(22,163,74,0.12)", filter: "blur(140px)", position: "absolute" as const, bottom: "0px", right: "-200px", pointerEvents: "none" as const, zIndex: 1 };
const glowThree = { width: "500px", height: "500px", borderRadius: "999px", background: "rgba(139,92,246,0.1)", filter: "blur(130px)", position: "absolute" as const, top: "50%", left: "50%", transform: "translate(-50%,-50%)", pointerEvents: "none" as const, zIndex: 1 };

const heroSection = { display: "grid", gridTemplateColumns: "1fr 460px", gap: 60, padding: "80px 80px 60px", maxWidth: 1300, margin: "0 auto", alignItems: "center", position: "relative" as const, zIndex: 10 };
const heroLeft = { display: "flex", flexDirection: "column" as const };
const badgeStyle = { display: "inline-block", background: "rgba(37,99,235,0.15)", color: "#60a5fa", padding: "8px 16px", borderRadius: "999px", fontSize: "13px", fontWeight: 700, marginBottom: "24px", letterSpacing: "0.05em", width: "fit-content" };
const tituloStyle = { fontSize: "86px", fontWeight: 900, color: "white", lineHeight: 0.95, marginBottom: "24px", letterSpacing: "-0.04em" };
const subtituloStyle = { color: "#94a3b8", marginBottom: "36px", fontSize: "18px", lineHeight: 1.7, maxWidth: 480 };
const statsRow = { display: "flex", gap: 24 };
const statBox = { display: "flex", flexDirection: "column" as const, alignItems: "center", background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 16, padding: "16px 24px" };
const statNum = { fontSize: 28, fontWeight: 900, color: "#60a5fa" };
const statLabel = { fontSize: 12, color: "#94a3b8", marginTop: 4 };

const cardStyle = { background: "rgba(30,41,59,0.95)", backdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.12)", padding: "40px", borderRadius: "28px", boxShadow: "0 30px 80px rgba(0,0,0,0.4)" };
const formTitulo = { fontSize: 26, fontWeight: 900, marginBottom: 6 };
const formSubtitulo = { color: "#94a3b8", fontSize: 14, marginBottom: 28 };
const inputStyle = { width: "100%", padding: "16px 18px", borderRadius: "14px", border: "1px solid rgba(255,255,255,0.12)", marginBottom: "14px", fontSize: "15px", background: "rgba(15,23,42,0.8)", color: "white", outline: "none", boxSizing: "border-box" as const };
const loginButton = { width: "100%", padding: "16px", background: "linear-gradient(135deg,#2563eb,#1d4ed8)", color: "white", border: "none", borderRadius: "14px", fontSize: "16px", fontWeight: 800 as const, cursor: "pointer", marginBottom: "12px", boxShadow: "0 10px 30px rgba(37,99,235,0.35)" };
const registerButton = { width: "100%", padding: "16px", background: "rgba(255,255,255,0.05)", color: "white", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "14px", fontSize: "15px", fontWeight: 700 as const, cursor: "pointer" };
const legalLinks = { display: "flex", justifyContent: "center", flexWrap: "wrap" as const, gap: 4, marginTop: 20, paddingTop: 16, borderTop: "1px solid rgba(255,255,255,0.06)" };
const legalLink = { color: "#94a3b8", fontSize: 11, textDecoration: "none", fontWeight: 600 };
const separator = { color: "rgba(255,255,255,0.2)", fontSize: 11 };

const featuresSection = { padding: "80px", maxWidth: 1300, margin: "0 auto", position: "relative" as const, zIndex: 10 };
const featuresTitulo = { textAlign: "center" as const, marginBottom: 60 };
const featuresGrid = { display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 24 };
const featureCard = { background: "rgba(30,41,59,0.7)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 24, padding: 32 };
const featureIcon = { fontSize: 36, marginBottom: 16 };
const featureTitle = { fontSize: 18, fontWeight: 800, marginBottom: 10 };
const featureDesc = { color: "#94a3b8", fontSize: 14, lineHeight: 1.7 };

const ctaSection = { padding: "60px 80px", display: "flex", flexDirection: "column" as const, alignItems: "center", position: "relative" as const, zIndex: 10, borderTop: "1px solid rgba(255,255,255,0.06)", borderBottom: "1px solid rgba(255,255,255,0.06)" };

const footerStyle = { padding: "60px 80px 30px", position: "relative" as const, zIndex: 10 };
const footerGrid = { display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: 40, marginBottom: 40, paddingBottom: 40, borderBottom: "1px solid rgba(255,255,255,0.06)" };
const footerColTitle = { fontWeight: 700, fontSize: 14, marginBottom: 16, color: "white" };
const footerLink = { display: "block", color: "#94a3b8", fontSize: 13, textDecoration: "none", marginBottom: 8 };
const footerBottom = { textAlign: "center" as const, color: "rgba(255,255,255,0.25)", fontSize: 12 };