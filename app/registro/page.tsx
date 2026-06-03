"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";

function validarCIF(cif: string): boolean {
  const cifLimpio = cif.trim().toUpperCase();
  // NIF: 8 dígitos + letra
  if (/^\d{8}[A-Z]$/.test(cifLimpio)) return true;
  // CIF empresa: letra + 7 dígitos + letra/número
  if (/^[ABCDEFGHJKLMNPQRSUVW]\d{7}[A-Z0-9]$/.test(cifLimpio)) return true;
  // NIE: X/Y/Z + 7 dígitos + letra
  if (/^[XYZ]\d{7}[A-Z]$/.test(cifLimpio)) return true;
  return false;
}

export default function RegistroPage() {
  const router = useRouter();
  const [tipo, setTipo] = useState<"taller" | "proveedor">("taller");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [nombreEmpresa, setNombreEmpresa] = useState("");
  const [cif, setCif] = useState("");
  const [telefono, setTelefono] = useState("");
  const [direccion, setDireccion] = useState("");
  const [ciudad, setCiudad] = useState("");
  const [codigoPostal, setCodigoPostal] = useState("");
  const [aceptaTerminos, setAceptaTerminos] = useState(false);
  const [aceptaPrivacidad, setAceptaPrivacidad] = useState(false);
  const [esProfesional, setEsProfesional] = useState(false);
  const [registrando, setRegistrando] = useState(false);
  const [error, setError] = useState("");
  const [registrado, setRegistrado] = useState(false);

  async function registrar() {
    setError("");

    if (!nombreEmpresa.trim()) { setError("El nombre de empresa es obligatorio"); return; }
    if (!email.trim()) { setError("El email es obligatorio"); return; }
    if (!cif.trim()) { setError("El CIF/NIF es obligatorio"); return; }
    if (!validarCIF(cif)) { setError("El formato del CIF/NIF no es válido. Ejemplos: B12345678 (empresa) o 12345678A (autónomo)"); return; }
    if (!password) { setError("La contraseña es obligatoria"); return; }
    if (password.length < 6) { setError("La contraseña debe tener al menos 6 caracteres"); return; }
    if (password !== password2) { setError("Las contraseñas no coinciden"); return; }
    if (!esProfesional) { setError("Debes confirmar que eres un profesional del sector"); return; }
    if (!aceptaTerminos) { setError("Debes aceptar los términos y condiciones"); return; }
    if (!aceptaPrivacidad) { setError("Debes aceptar la política de privacidad"); return; }

    setRegistrando(true);

    const { data, error: authError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { data: { tipo } },
    });

    if (authError) {
      setError(authError.message === "User already registered"
        ? "Este email ya está registrado. Inicia sesión."
        : authError.message);
      setRegistrando(false);
      return;
    }

    const user = data.user;
    if (user) {
      await supabase.from("usuarios").insert({
        id: user.id,
        email: user.email,
        tipo,
        nombre_empresa: nombreEmpresa.trim(),
        cif: cif.trim().toUpperCase(),
        telefono: telefono.trim(),
        direccion: direccion.trim(),
        ciudad: ciudad.trim(),
        codigo_postal: codigoPostal.trim(),
        activo: false, // Pendiente de verificación por el admin
        suscripcion: "gratuito",
      });

      try {
        await fetch("/api/send-registro", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nombreEmpresa: nombreEmpresa.trim(),
            cif: cif.trim().toUpperCase(),
            email: user.email,
            telefono: telefono.trim(),
            direccion: direccion.trim(),
            ciudad: ciudad.trim(),
            codigoPostal: codigoPostal.trim(),
            tipo,
          }),
        });
      } catch (e) { console.error("Error enviando emails:", e); }
    }

    setRegistrando(false);
    setRegistrado(true); // Mostrar pantalla de confirmación
  }

  // PANTALLA CONFIRMACIÓN
  if (registrado) {
    return (
      <main style={mainStyle}>
        <div style={glowOne} />
        <div style={glowTwo} />
        <div style={{ ...wrapper, display: "flex", flexDirection: "column" as const, alignItems: "center", justifyContent: "center", minHeight: "80vh" }}>
          <div style={{ background: "rgba(15,23,42,0.92)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 28, padding: 48, textAlign: "center" as const, maxWidth: 500 }}>
            <div style={{ fontSize: 64, marginBottom: 20 }}>✅</div>
            <h2 style={{ fontSize: 28, fontWeight: 900, marginBottom: 12 }}>Cuenta creada correctamente</h2>
            <div style={{ background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.3)", borderRadius: 14, padding: "16px 20px", marginBottom: 20 }}>
              <p style={{ color: "#fbbf24", fontWeight: 700, marginBottom: 6 }}>⏳ Pendiente de verificación</p>
              <p style={{ color: "#94a3b8", fontSize: 14, lineHeight: 1.6 }}>
                Nuestro equipo revisará tus datos en las próximas horas. Recibirás un email cuando tu cuenta esté activa.
              </p>
            </div>
            <p style={{ color: "#94a3b8", fontSize: 14, marginBottom: 24 }}>
              Si tienes alguna duda escríbenos a <a href="mailto:info@recambiodirecto.es" style={{ color: "#60a5fa" }}>info@recambiodirecto.es</a>
            </p>
            <button onClick={() => router.push("/")} style={{ background: "linear-gradient(135deg,#2563eb,#1d4ed8)", border: "none", color: "white", padding: "14px 32px", borderRadius: 14, fontWeight: 700, cursor: "pointer", fontSize: 15 }}>
              Volver al inicio
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main style={mainStyle}>
      <div style={glowOne} />
      <div style={glowTwo} />
      <div style={wrapper}>
        <div style={header}>
          <a href="/" style={btnVolver}>← Volver</a>
          <div style={badge}>REGISTRO PROFESIONAL</div>
          <h1 style={title}>Crea tu cuenta gratis</h1>
          <p style={subtitle}>Solo para profesionales del sector de la automoción</p>
        </div>

        <div style={trialBanner}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 28 }}>🎁</span>
            <div>
              <p style={{ fontWeight: 900, fontSize: 16, marginBottom: 4 }}>2 meses gratis, sin compromiso</p>
              <p style={{ color: "#86efac", fontSize: 14 }}>
                Prueba la plataforma sin coste durante 2 meses. A partir del 3er mes, <strong>25€/mes</strong>. Cancela cuando quieras.
              </p>
            </div>
          </div>
          <div style={precioBox}>
            <p style={{ fontSize: 12, color: "#86efac", marginBottom: 4 }}>DESPUÉS</p>
            <p style={{ fontSize: 28, fontWeight: 900 }}>25€<span style={{ fontSize: 14, fontWeight: 400 }}>/mes</span></p>
          </div>
        </div>

        <div style={formCard}>
          <div style={tipoRow}>
            <button onClick={() => setTipo("taller")} style={{ ...tipoBtnBase, background: tipo === "taller" ? "linear-gradient(135deg,#2563eb,#1d4ed8)" : "rgba(255,255,255,0.04)", border: tipo === "taller" ? "none" : "1px solid rgba(255,255,255,0.1)", color: tipo === "taller" ? "white" : "#94a3b8" }}>
              <span style={{ fontSize: 28, display: "block", marginBottom: 8 }}>🔧</span>
              <strong style={{ fontSize: 16 }}>Soy Taller</strong>
              <p style={{ fontSize: 13, marginTop: 6, opacity: 0.8 }}>Quiero comprar recambios</p>
            </button>
            <button onClick={() => setTipo("proveedor")} style={{ ...tipoBtnBase, background: tipo === "proveedor" ? "linear-gradient(135deg,#16a34a,#15803d)" : "rgba(255,255,255,0.04)", border: tipo === "proveedor" ? "none" : "1px solid rgba(255,255,255,0.1)", color: tipo === "proveedor" ? "white" : "#94a3b8" }}>
              <span style={{ fontSize: 28, display: "block", marginBottom: 8 }}>🏭</span>
              <strong style={{ fontSize: 16 }}>Soy Proveedor</strong>
              <p style={{ fontSize: 13, marginTop: 6, opacity: 0.8 }}>Quiero vender recambios</p>
            </button>
          </div>

          <h3 style={seccionTitulo}>Datos de empresa</h3>
          <div style={grid2}>
            <div>
              <p style={labelStyle}>Nombre de empresa *</p>
              <input placeholder="Talleres Martinez S.L." value={nombreEmpresa} onChange={e => setNombreEmpresa(e.target.value)} style={input} />
            </div>
            <div>
              <p style={labelStyle}>CIF / NIF *</p>
              <input
                placeholder="B12345678"
                value={cif}
                onChange={e => setCif(e.target.value.toUpperCase())}
                style={{ ...input, borderColor: cif && !validarCIF(cif) ? "rgba(239,68,68,0.5)" : "rgba(255,255,255,0.1)" }}
              />
              {cif && !validarCIF(cif) && <p style={{ color: "#f87171", fontSize: 12, marginTop: 4 }}>Formato invalido</p>}
              {cif && validarCIF(cif) && <p style={{ color: "#4ade80", fontSize: 12, marginTop: 4 }}>Formato valido</p>}
            </div>
          </div>

          <h3 style={seccionTitulo}>Contacto</h3>
          <div style={grid2}>
            <div>
              <p style={labelStyle}>Email *</p>
              <input type="email" placeholder="taller@ejemplo.es" value={email} onChange={e => setEmail(e.target.value)} style={input} />
            </div>
            <div>
              <p style={labelStyle}>Telefono</p>
              <input placeholder="600 000 000" value={telefono} onChange={e => setTelefono(e.target.value)} style={input} />
            </div>
          </div>

          <h3 style={seccionTitulo}>Direccion</h3>
          <div style={{ marginBottom: 16 }}>
            <p style={labelStyle}>Direccion</p>
            <input placeholder="Calle Mayor, 123" value={direccion} onChange={e => setDireccion(e.target.value)} style={input} />
          </div>
          <div style={grid2}>
            <div>
              <p style={labelStyle}>Ciudad</p>
              <input placeholder="Sevilla" value={ciudad} onChange={e => setCiudad(e.target.value)} style={input} />
            </div>
            <div>
              <p style={labelStyle}>Codigo Postal</p>
              <input placeholder="41001" value={codigoPostal} onChange={e => setCodigoPostal(e.target.value.replace(/\D/g, "").slice(0, 5))} style={input} maxLength={5} />
            </div>
          </div>

          <h3 style={seccionTitulo}>Acceso a la plataforma</h3>
          <div style={grid2}>
            <div>
              <p style={labelStyle}>Contrasena *</p>
              <input type="password" placeholder="Minimo 6 caracteres" value={password} onChange={e => setPassword(e.target.value)} style={input} />
            </div>
            <div>
              <p style={labelStyle}>Repetir contrasena *</p>
              <input type="password" placeholder="Repite la contrasena" value={password2} onChange={e => setPassword2(e.target.value)} style={input} />
            </div>
          </div>

          <div style={checkboxSection}>
            <label style={checkboxRow}>
              <input type="checkbox" checked={esProfesional} onChange={e => setEsProfesional(e.target.checked)} style={checkbox} />
              <span style={checkboxText}>Confirmo que soy empresa o autonomo del sector de la automocion</span>
            </label>
            <label style={checkboxRow}>
              <input type="checkbox" checked={aceptaTerminos} onChange={e => setAceptaTerminos(e.target.checked)} style={checkbox} />
              <span style={checkboxText}>Acepto los <a href="/terminos" target="_blank" style={checkboxLink}>Terminos y Condiciones</a>, incluyendo las condiciones de suscripcion (2 meses gratis + 25/mes)</span>
            </label>
            <label style={checkboxRow}>
              <input type="checkbox" checked={aceptaPrivacidad} onChange={e => setAceptaPrivacidad(e.target.checked)} style={checkbox} />
              <span style={checkboxText}>He leido y acepto la <a href="/privacidad" target="_blank" style={checkboxLink}>Politica de Privacidad</a></span>
            </label>
          </div>

          {error && <div style={errorBox}>⚠️ {error}</div>}

          <button onClick={registrar} disabled={registrando} style={{ ...btnRegistrar, opacity: registrando ? 0.7 : 1, cursor: registrando ? "not-allowed" : "pointer" }}>
            {registrando ? "Creando cuenta..." : "Empezar 2 meses gratis →"}
          </button>

          <p style={loginLink}>Ya tienes cuenta? <a href="/" style={checkboxLink}>Inicia sesion</a></p>
        </div>
      </div>
    </main>
  );
}

const mainStyle = { minHeight: "100vh", background: "linear-gradient(180deg,#020617 0%,#0f172a 100%)", color: "white", padding: "40px 20px", position: "relative" as const, overflow: "hidden" };
const glowOne = { width: "500px", height: "500px", borderRadius: "999px", background: "rgba(37,99,235,0.2)", filter: "blur(120px)", position: "absolute" as const, top: "-100px", left: "-100px", pointerEvents: "none" as const };
const glowTwo = { width: "400px", height: "400px", borderRadius: "999px", background: "rgba(22,163,74,0.15)", filter: "blur(120px)", position: "absolute" as const, bottom: "-100px", right: "-100px", pointerEvents: "none" as const };
const wrapper = { maxWidth: 700, margin: "0 auto", position: "relative" as const, zIndex: 10 };
const header = { textAlign: "center" as const, marginBottom: 24 };
const btnVolver = { display: "inline-block", color: "#94a3b8", textDecoration: "none", fontSize: 14, marginBottom: 20, fontWeight: 600 };
const badge = { display: "inline-block", background: "rgba(37,99,235,0.15)", color: "#60a5fa", padding: "8px 18px", borderRadius: 999, fontWeight: 700, marginBottom: 16, fontSize: 13 };
const title = { fontSize: 48, fontWeight: 900, marginBottom: 10 };
const subtitle = { color: "#94a3b8", fontSize: 16 };
const trialBanner = { display: "flex", justifyContent: "space-between", alignItems: "center", background: "linear-gradient(135deg,rgba(22,163,74,0.2),rgba(22,163,74,0.1))", border: "1px solid rgba(22,163,74,0.3)", borderRadius: 20, padding: "20px 24px", marginBottom: 24, color: "white", gap: 16 };
const precioBox = { textAlign: "center" as const, flexShrink: 0, background: "rgba(22,163,74,0.2)", borderRadius: 14, padding: "12px 20px" };
const formCard = { background: "rgba(15,23,42,0.92)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 28, padding: "40px" };
const tipoRow = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 32 };
const tipoBtnBase = { padding: "20px", borderRadius: 16, cursor: "pointer", textAlign: "center" as const, transition: "all 0.2s" };
const seccionTitulo = { fontSize: 13, fontWeight: 800, color: "#60a5fa", marginBottom: 16, marginTop: 24, textTransform: "uppercase" as const, letterSpacing: "0.08em" };
const grid2 = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 8 };
const labelStyle = { color: "#94a3b8", fontSize: 13, marginBottom: 8 };
const input = { width: "100%", background: "#020617", color: "white", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, padding: "14px 16px", fontSize: 15, outline: "none", boxSizing: "border-box" as const };
const checkboxSection = { display: "flex", flexDirection: "column" as const, gap: 14, margin: "24px 0", padding: "20px", background: "rgba(255,255,255,0.03)", borderRadius: 14, border: "1px solid rgba(255,255,255,0.06)" };
const checkboxRow = { display: "flex", alignItems: "flex-start", gap: 12, cursor: "pointer" };
const checkbox = { marginTop: 2, flexShrink: 0, width: 16, height: 16, cursor: "pointer" };
const checkboxText = { color: "#cbd5e1", fontSize: 14, lineHeight: 1.5 };
const checkboxLink = { color: "#60a5fa", textDecoration: "none", fontWeight: 700 };
const errorBox = { background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#f87171", padding: "14px 18px", borderRadius: 12, marginBottom: 20, fontSize: 14 };
const btnRegistrar = { width: "100%", background: "linear-gradient(135deg,#16a34a,#15803d)", border: "none", color: "white", padding: "18px", borderRadius: 16, fontWeight: 900, fontSize: 16, boxShadow: "0 10px 30px rgba(22,163,74,0.35)" };
const loginLink = { textAlign: "center" as const, color: "#94a3b8", fontSize: 14, marginTop: 20 };