"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [cargando, setCargando] = useState(false);
  const [exito, setExito] = useState(false);
  const [error, setError] = useState("");
  const [sesionLista, setSesionLista] = useState(false);

  useEffect(() => {
    // Supabase procesa el token del enlace automáticamente
    supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "PASSWORD_RECOVERY" && session) {
        setSesionLista(true);
      }
    });

    // Verificar si ya hay sesión activa via token en URL
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setSesionLista(true);
    });
  }, []);

  async function cambiarPassword() {
    setError("");

    if (!password || password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres");
      return;
    }
    if (password !== confirmar) {
      setError("Las contraseñas no coinciden");
      return;
    }

    setCargando(true);
    const { error: err } = await supabase.auth.updateUser({ password });
    setCargando(false);

    if (err) {
      setError("Error al actualizar: " + err.message);
      return;
    }

    setExito(true);
    setTimeout(() => router.push("/"), 3000);
  }

  return (
    <main style={mainStyle}>
      <div style={card}>
        <div style={logoBadge}>RD</div>
        <h1 style={titulo}>RECAMBIO DIRECTO</h1>
        <p style={subtitulo}>Marketplace B2B de recambios</p>

        {exito ? (
          <div style={exitoBox}>
            <p style={{ fontSize: 48, marginBottom: 12 }}>✅</p>
            <h2 style={{ fontWeight: 900, fontSize: 22, marginBottom: 8 }}>Contrasena actualizada</h2>
            <p style={{ color: "#94a3b8", fontSize: 14 }}>Redirigiendo al inicio de sesion...</p>
          </div>
        ) : !sesionLista ? (
          <div style={{ textAlign: "center" as const, padding: "40px 0" }}>
            <p style={{ fontSize: 40, marginBottom: 12 }}>🔗</p>
            <h2 style={{ fontWeight: 900, fontSize: 20, marginBottom: 8 }}>Verificando enlace...</h2>
            <p style={{ color: "#94a3b8", fontSize: 14 }}>
              Si ves este mensaje mucho tiempo, el enlace puede haber expirado.
            </p>
            <button
              onClick={() => router.push("/")}
              style={{ ...btnPrimario, marginTop: 20 }}
            >
              Volver al inicio
            </button>
          </div>
        ) : (
          <>
            <h2 style={formTitulo}>Nueva contrasena</h2>
            <p style={{ color: "#94a3b8", fontSize: 14, marginBottom: 28, textAlign: "center" as const }}>
              Elige una contrasena segura de al menos 8 caracteres
            </p>

            <div style={formGroup}>
              <label style={labelStyle}>Nueva contrasena</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Minimo 8 caracteres"
                style={inputStyle}
              />
            </div>

            <div style={formGroup}>
              <label style={labelStyle}>Confirmar contrasena</label>
              <input
                type="password"
                value={confirmar}
                onChange={e => setConfirmar(e.target.value)}
                placeholder="Repite la contrasena"
                style={inputStyle}
                onKeyDown={e => e.key === "Enter" && cambiarPassword()}
              />
            </div>

            {/* Indicador fortaleza */}
            {password.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <div style={{ display: "flex", gap: 4, marginBottom: 6 }}>
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} style={{
                      flex: 1, height: 4, borderRadius: 999,
                      background: password.length >= i * 3
                        ? i <= 1 ? "#f87171" : i <= 2 ? "#fbbf24" : i <= 3 ? "#60a5fa" : "#4ade80"
                        : "rgba(255,255,255,0.1)"
                    }} />
                  ))}
                </div>
                <p style={{ color: "#94a3b8", fontSize: 12 }}>
                  {password.length < 8 ? "Muy corta" : password.length < 12 ? "Aceptable" : "Segura"}
                </p>
              </div>
            )}

            {error && (
              <div style={errorBox}>{error}</div>
            )}

            <button
              onClick={cambiarPassword}
              disabled={cargando || !password || !confirmar}
              style={{ ...btnPrimario, opacity: (cargando || !password || !confirmar) ? 0.6 : 1 }}
            >
              {cargando ? "Actualizando..." : "Cambiar contrasena"}
            </button>
          </>
        )}
      </div>
    </main>
  );
}

const mainStyle = { minHeight: "100vh", background: "linear-gradient(135deg,#020617,#020b2d)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, color: "white" };
const card = { background: "rgba(15,23,42,0.98)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 28, padding: "48px 40px", width: "100%", maxWidth: 440, display: "flex", flexDirection: "column" as const, alignItems: "center" };
const logoBadge = { width: 56, height: 56, borderRadius: 16, background: "linear-gradient(135deg,#2563eb,#1d4ed8)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 20, marginBottom: 16 };
const titulo = { fontSize: 22, fontWeight: 900, margin: 0 };
const subtitulo = { color: "#94a3b8", fontSize: 13, marginTop: 4, marginBottom: 32 };
const formTitulo = { fontSize: 24, fontWeight: 900, marginBottom: 8, textAlign: "center" as const };
const formGroup = { width: "100%", marginBottom: 18 };
const labelStyle = { display: "block", color: "#94a3b8", fontSize: 13, fontWeight: 600, marginBottom: 8 };
const inputStyle = { width: "100%", background: "#020617", color: "white", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, padding: "14px 16px", fontSize: 15, outline: "none", boxSizing: "border-box" as const };
const btnPrimario = { width: "100%", background: "linear-gradient(135deg,#2563eb,#1d4ed8)", border: "none", color: "white", padding: "16px", borderRadius: 14, fontWeight: 900, fontSize: 16, cursor: "pointer", marginTop: 8 };
const errorBox = { width: "100%", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#f87171", padding: "12px 16px", borderRadius: 10, marginBottom: 16, fontSize: 14, textAlign: "center" as const };
const exitoBox = { textAlign: "center" as const, padding: "20px 0" };