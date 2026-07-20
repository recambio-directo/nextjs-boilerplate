"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";

export default function LoginBox() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [enviandoReset, setEnviandoReset] = useState(false);
  const [resetEnviado, setResetEnviado] = useState(false);
  const [mostrarReset, setMostrarReset] = useState(false);
  const [emailReset, setEmailReset] = useState("");

  useEffect(() => {
    async function checkSession() {
      if (window.location.hash.includes("type=recovery")) {
        router.push("/auth/reset-password" + window.location.hash);
        return;
      }
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

  return (
    <div style={{ background: "rgba(30,41,59,0.95)", backdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.12)", padding: "40px", borderRadius: "28px", boxShadow: "0 30px 80px rgba(0,0,0,0.4)" }}>
      {!mostrarReset ? (
        <>
          <h2 style={{ fontSize: 26, fontWeight: 900, marginBottom: 6, color: "white" }}>Accede a tu cuenta</h2>
          <p style={{ color: "#94a3b8", fontSize: 14, marginBottom: 24 }}>Plataforma exclusiva para profesionales del sector</p>
          <input type="email" placeholder="Email profesional" value={email} onChange={e => setEmail(e.target.value)} onKeyDown={handleKeyDown} style={inputStyle} />
          <input type="password" placeholder="Contraseña" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={handleKeyDown} style={inputStyle} />
          <button onClick={iniciarSesion} style={loginButton}>INICIAR SESIÓN →</button>
          <a href="/registro" style={registerButton}>➕ CREAR CUENTA GRATIS</a>
          <button onClick={() => setMostrarReset(true)} style={{ background: "none", border: "none", color: "#60a5fa", cursor: "pointer", fontSize: 13, marginTop: 12, width: "100%", textAlign: "center" as const }}>¿Olvidaste tu contraseña?</button>
          <div style={{ display: "flex", justifyContent: "center", flexWrap: "wrap" as const, gap: 4, marginTop: 20, paddingTop: 16, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            {[
              { label: "Privacidad", href: "/privacidad" },
              { label: "Términos", href: "/terminos" },
              { label: "Cookies", href: "/cookies" },
              { label: "Devoluciones", href: "/devoluciones" },
              { label: "Aviso Legal", href: "/aviso-legal" },
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
          <h2 style={{ fontSize: 26, fontWeight: 900, marginBottom: 6, color: "white" }}>Recuperar contraseña</h2>
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
  );
}

const inputStyle: React.CSSProperties = { width: "100%", padding: "16px 18px", borderRadius: "14px", border: "1px solid rgba(255,255,255,0.12)", marginBottom: "14px", fontSize: "15px", background: "rgba(15,23,42,0.8)", color: "white", outline: "none", boxSizing: "border-box" };
const loginButton: React.CSSProperties = { width: "100%", padding: "16px", background: "linear-gradient(135deg,#2563eb,#1d4ed8)", color: "white", border: "none", borderRadius: "14px", fontSize: "16px", fontWeight: 800, cursor: "pointer", marginBottom: "12px", boxShadow: "0 10px 30px rgba(37,99,235,0.35)", display: "block", textAlign: "center" as const };
const registerButton: React.CSSProperties = { width: "100%", padding: "16px", background: "rgba(255,255,255,0.05)", color: "white", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "14px", fontSize: "15px", fontWeight: 700, cursor: "pointer", display: "block", textAlign: "center" as const, textDecoration: "none" };