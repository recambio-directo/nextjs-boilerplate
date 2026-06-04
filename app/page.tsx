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

  const m = isMobile;

  return (
    <main style={{ minHeight: "100vh", background: "#020617", color: "white", position: "relative", overflow: "hidden" }}>
      {/* FONDO */}
      <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(37,99,235,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(37,99,235,0.07) 1px, transparent 1px)", backgroundSize: "60px 60px", pointerEvents: "none", zIndex: 1 }} />
      <div style={{ width: "600px", height: "600px", borderRadius: "999px", background: "rgba(37,99,235,0.22)", filter: "blur(160px)", position: "absolute", top: "-200px", left: "-200px", pointerEvents: "none", zIndex: 1 }} />
      <div style={{ width: "400px", height: "400px", borderRadius: "999px", background: "rgba(22,163,74,0.12)", filter: "blur(140px)", position: "absolute", bottom: "0", right: "-100px", pointerEvents: "none", zIndex: 1 }} />

      {/* HERO */}
      <section style={{
        display: "grid",
        gridTemplateColumns: m ? "1fr" : "1fr 460px",
        gap: m ? 32 : 60,
        padding: m ? "40px 20px 32px" : "80px 80px 60px",
        maxWidth: 1300,
        margin: "0 auto",
        alignItems: "center",
        position: "relative",
        zIndex: 10,
      }}>
        {/* COLUMNA IZQUIERDA — solo visible en desktop o encima del form en móvil */}
        {!m && (
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={badgeStyle}>MARKETPLACE B2B AUTOMOCIÓN</div>
            <h1 style={{ fontSize: "86px", fontWeight: 900, color: "white", lineHeight: 0.95, marginBottom: "24px", letterSpacing: "-0.04em" }}>
              RECAMBIO<br /><span style={{ color: "#2563eb" }}>DIRECTO</span>
            </h1>
            <p style={{ color: "#94a3b8", marginBottom: "36px", fontSize: "18px", lineHeight: 1.7, maxWidth: 480 }}>
              La plataforma profesional que conecta talleres y proveedores de recambios.
            </p>
            <div style={{ display: "flex", gap: 24 }}>
              {[{ num: "B2B", label: "Solo profesionales" }, { num: "24h", label: "Entrega express" }, { num: "100%", label: "Digital y seguro" }].map(({ num, label }) => (
                <div key={label} style={{ display: "flex", flexDirection: "column", alignItems: "center", background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 16, padding: "16px 24px" }}>
                  <span style={{ fontSize: 28, fontWeight: 900, color: "#60a5fa" }}>{num}</span>
                  <span style={{ fontSize: 12, color: "#94a3b8", marginTop: 4 }}>{label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* FORMULARIO LOGIN */}
        <div style={{ background: "rgba(30,41,59,0.95)", backdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.12)", padding: m ? "28px 20px" : "40px", borderRadius: "28px", boxShadow: "0 30px 80px rgba(0,0,0,0.4)" }}>
          {m && (
            <div style={{ textAlign: "center", marginBottom: 24 }}>
              <div style={{ ...badgeStyle, margin: "0 auto 16px" }}>MARKETPLACE B2B</div>
              <h1 style={{ fontSize: 42, fontWeight: 900, lineHeight: 1, marginBottom: 8 }}>
                RECAMBIO<br /><span style={{ color: "#2563eb" }}>DIRECTO</span>
              </h1>
              <p style={{ color: "#94a3b8", fontSize: 14, lineHeight: 1.6 }}>
                La plataforma profesional de recambios B2B
              </p>
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

              <button onClick={() => setMostrarReset(true)} style={{ background: "none", border: "none", color: "#60a5fa", cursor: "pointer", fontSize: 13, marginTop: 12, width: "100%", textAlign: "center" as const }}>
                ¿Olvidaste tu contraseña?
              </button>

              <div style={{ display: "flex", justifyContent: "center", flexWrap: "wrap" as const, gap: 4, marginTop: 20, paddingTop: 16, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                {["Quiénes somos", "Privacidad", "Términos", "Cookies"].map((t, i) => (
                  <span key={t} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    {i > 0 && <span style={{ color: "rgba(255,255,255,0.2)", fontSize: 11 }}>·</span>}
                    <a href={`/${t.toLowerCase().replace(/\s/g, "-").replace("é", "e").replace("é", "e")}`} style={{ color: "#94a3b8", fontSize: 11, textDecoration: "none", fontWeight: 600 }}>{t}</a>
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
              {!resetEnviado && (
                <button onClick={enviarResetPassword} disabled={enviandoReset} style={loginButton}>
                  {enviandoReset ? "Enviando..." : "ENVIAR ENLACE"}
                </button>
              )}
              <button onClick={() => { setMostrarReset(false); setResetEnviado(false); setEmailReset(""); }} style={{ background: "none", border: "none", color: "#60a5fa", cursor: "pointer", fontSize: 13, marginTop: 12, width: "100%", textAlign: "center" as const }}>
                ← Volver al login
              </button>
            </>
          )}
        </div>
      </section>

      {/* FEATURES */}
      <section style={{ padding: m ? "40px 20px" : "80px", maxWidth: 1300, margin: "0 auto", position: "relative", zIndex: 10 }}>
        <div style={{ textAlign: "center", marginBottom: m ? 32 : 60 }}>
          <h2 style={{ fontSize: m ? 26 : 42, fontWeight: 900, marginBottom: 12 }}>Todo lo que necesitas en una plataforma</h2>
          <p style={{ color: "#94a3b8", fontSize: m ? 15 : 18 }}>Diseñada específicamente para el sector del recambio de automoción</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: m ? "1fr" : "repeat(2,1fr)", gap: m ? 16 : 24 }}>
          {features.map(({ icon, title, desc }) => (
            <div key={title} style={{ background: "rgba(30,41,59,0.7)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 20, padding: m ? 20 : 32 }}>
              <div style={{ fontSize: m ? 28 : 36, marginBottom: 12 }}>{icon}</div>
              <h3 style={{ fontSize: m ? 16 : 18, fontWeight: 800, marginBottom: 8 }}>{title}</h3>
              <p style={{ color: "#94a3b8", fontSize: m ? 13 : 14, lineHeight: 1.7 }}>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: m ? "40px 20px" : "60px 80px", display: "flex", flexDirection: "column", alignItems: "center", position: "relative", zIndex: 10, borderTop: "1px solid rgba(255,255,255,0.06)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <h2 style={{ fontSize: m ? 24 : 36, fontWeight: 900, marginBottom: 12, textAlign: "center" }}>¿Eres proveedor o taller?</h2>
        <p style={{ color: "#94a3b8", fontSize: m ? 14 : 16, marginBottom: 28, maxWidth: 500, textAlign: "center" }}>
          Únete gratis durante 2 meses y descubre cómo Recambio Directo puede hacer crecer tu negocio.
        </p>
        <button onClick={() => router.push("/registro")} style={{ ...loginButton, width: m ? "100%" : "auto", padding: "18px 48px", fontSize: 18, marginBottom: 0 }}>
          EMPEZAR GRATIS →
        </button>
      </section>

      {/* FOOTER */}
      <footer style={{ padding: m ? "40px 20px 24px" : "60px 80px 30px", position: "relative", zIndex: 10 }}>
        <div style={{ display: "grid", gridTemplateColumns: m ? "1fr" : "2fr 1fr 1fr 1fr", gap: m ? 28 : 40, marginBottom: 32, paddingBottom: 32, borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <div>
            <h3 style={{ fontWeight: 900, fontSize: 18, marginBottom: 8 }}>RECAMBIO DIRECTO</h3>
            <p style={{ color: "#94a3b8", fontSize: 13, lineHeight: 1.7 }}>Marketplace B2B de recambios de automoción. Conectamos talleres y proveedores en toda España.</p>
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