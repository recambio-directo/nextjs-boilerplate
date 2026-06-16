"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";
import { buscarCP } from "../lib/codigosPostales";

function validarCIF(cif: string): boolean {
  const cifLimpio = cif.trim().toUpperCase();
  if (/^\d{8}[A-Z]$/.test(cifLimpio)) return true;
  if (/^[ABCDEFGHJKLMNPQRSUVW]\d{7}[A-Z0-9]$/.test(cifLimpio)) return true;
  if (/^[XYZ]\d{7}[A-Z]$/.test(cifLimpio)) return true;
  return false;
}

function RegistroPageInner() {
  const router = useRouter();
  const [isMobile, setIsMobile] = useState(false);
  const searchParams = useSearchParams();
  const [tipo, setTipo] = useState<"taller" | "proveedor">(searchParams.get("tipo") === "proveedor" ? "proveedor" : "taller");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [nombreEmpresa, setNombreEmpresa] = useState("");
  const [cif, setCif] = useState("");
  const [telefono, setTelefono] = useState("");
  const [direccion, setDireccion] = useState("");
  const [ciudad, setCiudad] = useState("");
  const [codigoPostal, setCodigoPostal] = useState("");
  const [provincia, setProvincia] = useState("");
  const [aceptaTerminos, setAceptaTerminos] = useState(false);
  const [aceptaPrivacidad, setAceptaPrivacidad] = useState(false);
  const [esProfesional, setEsProfesional] = useState(false);
  const [registrando, setRegistrando] = useState(false);
  const [error, setError] = useState("");
  const [registrado, setRegistrado] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  async function registrar() {
    setError("");
    if (!nombreEmpresa.trim()) { setError("El nombre de empresa es obligatorio"); return; }
    if (!email.trim()) { setError("El email es obligatorio"); return; }
    if (!cif.trim()) { setError("El CIF/NIF es obligatorio"); return; }
    if (!validarCIF(cif)) { setError("Formato CIF/NIF no válido. Ej: B12345678 o 12345678A"); return; }
    if (!telefono.trim()) { setError("El teléfono es obligatorio"); return; }
    if (!direccion.trim()) { setError("La dirección es obligatoria"); return; }
    if (!codigoPostal.trim() || codigoPostal.length < 5) { setError("El código postal es obligatorio"); return; }
    if (!password) { setError("La contraseña es obligatoria"); return; }
    if (password.length < 6) { setError("Mínimo 6 caracteres"); return; }
    if (password !== password2) { setError("Las contraseñas no coinciden"); return; }
    if (!esProfesional) { setError("Confirma que eres profesional del sector"); return; }
    if (!aceptaTerminos) { setError("Acepta los términos y condiciones"); return; }
    if (!aceptaPrivacidad) { setError("Acepta la política de privacidad"); return; }

    setRegistrando(true);
    const { data, error: authError } = await supabase.auth.signUp({ email: email.trim(), password, options: { data: { tipo } } });
    if (authError) {
      setError(authError.message === "User already registered" ? "Este email ya está registrado." : authError.message);
      setRegistrando(false);
      return;
    }
    const user = data.user;
    if (user) {
      await supabase.from("usuarios").insert({
        id: user.id, email: user.email, tipo,
        nombre_empresa: nombreEmpresa.trim(), cif: cif.trim().toUpperCase(),
        telefono: telefono.trim(), direccion: direccion.trim(),
        ciudad: ciudad.trim(), codigo_postal: codigoPostal.trim(),
        provincia: provincia.trim(),
        activo: false, suscripcion: "gratuito",
      });
      try {
        await fetch("/api/enviar-email/send-registro", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ nombreEmpresa: nombreEmpresa.trim(), cif: cif.trim().toUpperCase(), email: user.email, telefono: telefono.trim(), direccion: direccion.trim(), ciudad: ciudad.trim(), codigoPostal: codigoPostal.trim(), tipo }),
        });
      } catch (e) { console.error(e); }
    }
    setRegistrando(false);
    setRegistrado(true);
  }

  const m = isMobile;
  const grid2: React.CSSProperties = { display: "grid", gridTemplateColumns: m ? "1fr" : "1fr 1fr", gap: 16, marginBottom: 8 };

  if (registrado) {
    return (
      <main style={{ minHeight: "100vh", background: "linear-gradient(180deg,#020617,#0f172a)", color: "white", padding: "40px 20px", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ background: "rgba(15,23,42,0.92)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 28, padding: m ? "32px 20px" : 48, textAlign: "center", maxWidth: 500, width: "100%" }}>
          <div style={{ fontSize: 64, marginBottom: 20 }}>✅</div>
          <h2 style={{ fontSize: m ? 22 : 28, fontWeight: 900, marginBottom: 12 }}>Cuenta creada correctamente</h2>
          <div style={{ background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.3)", borderRadius: 14, padding: "16px 20px", marginBottom: 20 }}>
            <p style={{ color: "#fbbf24", fontWeight: 700, marginBottom: 6 }}>⏳ Pendiente de verificación</p>
            <p style={{ color: "#94a3b8", fontSize: 14, lineHeight: 1.6 }}>Nuestro equipo revisará tus datos en las próximas horas.</p>
          </div>
          <p style={{ color: "#94a3b8", fontSize: 14, marginBottom: 24 }}>
            Dudas: <a href="mailto:info@recambio-directo.com" style={{ color: "#60a5fa" }}>info@recambio-directo.com</a>
          </p>
          <button onClick={() => router.push("/")} style={{ background: "linear-gradient(135deg,#2563eb,#1d4ed8)", border: "none", color: "white", padding: "14px 32px", borderRadius: 14, fontWeight: 700, cursor: "pointer", fontSize: 15, width: m ? "100%" : "auto" }}>
            Volver al inicio
          </button>
        </div>
      </main>
    );
  }

  return (
    <main style={{ minHeight: "100vh", background: "linear-gradient(180deg,#020617,#0f172a)", color: "white", padding: m ? "24px 16px" : "40px 20px", position: "relative", overflow: "hidden" }}>
      <div style={{ width: "500px", height: "500px", borderRadius: "999px", background: "rgba(37,99,235,0.2)", filter: "blur(120px)", position: "absolute", top: "-100px", left: "-100px", pointerEvents: "none" }} />
      <div style={{ width: "400px", height: "400px", borderRadius: "999px", background: "rgba(22,163,74,0.15)", filter: "blur(120px)", position: "absolute", bottom: "-100px", right: "-100px", pointerEvents: "none" }} />

      <div style={{ maxWidth: 700, margin: "0 auto", position: "relative", zIndex: 10 }}>
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <a href="/" style={{ display: "inline-block", color: "#94a3b8", textDecoration: "none", fontSize: 14, marginBottom: 16, fontWeight: 600 }}>← Volver</a>
          <div style={{ display: "inline-block", background: "rgba(37,99,235,0.15)", color: "#60a5fa", padding: "8px 18px", borderRadius: 999, fontWeight: 700, marginBottom: 14, fontSize: 13 }}>REGISTRO PROFESIONAL</div>
          <h1 style={{ fontSize: m ? 32 : 48, fontWeight: 900, marginBottom: 8 }}>Crea tu cuenta gratis</h1>
          <p style={{ color: "#94a3b8", fontSize: m ? 14 : 16 }}>Solo para profesionales del sector de la automoción</p>
        </div>

        <div style={{ display: "flex", flexDirection: m ? "column" : "row", justifyContent: "space-between", alignItems: m ? "flex-start" : "center", background: "linear-gradient(135deg,rgba(22,163,74,0.2),rgba(22,163,74,0.1))", border: "1px solid rgba(22,163,74,0.3)", borderRadius: 20, padding: "20px", marginBottom: 20, gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 28 }}>🎁</span>
            <div>
              <p style={{ fontWeight: 900, fontSize: m ? 14 : 16, marginBottom: 4 }}>1 mes gratis, sin compromiso</p>
              <p style={{ color: "#86efac", fontSize: m ? 12 : 14 }}>A partir del 2º mes, <strong>25€/mes</strong>. Cancela cuando quieras.</p>
            </div>
          </div>
          {!m && (
            <div style={{ textAlign: "center", flexShrink: 0, background: "rgba(22,163,74,0.2)", borderRadius: 14, padding: "12px 20px" }}>
              <p style={{ fontSize: 12, color: "#86efac", marginBottom: 4 }}>DESPUÉS</p>
              <p style={{ fontSize: 28, fontWeight: 900 }}>25€<span style={{ fontSize: 14, fontWeight: 400 }}>/mes</span></p>
            </div>
          )}
        </div>

        <div style={{ background: "rgba(15,23,42,0.92)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 24, padding: m ? "24px 16px" : "40px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 28 }}>
            {(["taller", "proveedor"] as const).map(t => (
              <button key={t} onClick={() => setTipo(t)} style={{ padding: m ? "16px 12px" : "20px", borderRadius: 14, cursor: "pointer", textAlign: "center", background: tipo === t ? (t === "taller" ? "linear-gradient(135deg,#2563eb,#1d4ed8)" : "linear-gradient(135deg,#16a34a,#15803d)") : "rgba(255,255,255,0.04)", border: tipo === t ? "none" : "1px solid rgba(255,255,255,0.1)", color: tipo === t ? "white" : "#94a3b8" }}>
                <span style={{ fontSize: m ? 22 : 28, display: "block", marginBottom: 6 }}>{t === "taller" ? "🔧" : "🏭"}</span>
                <strong style={{ fontSize: m ? 14 : 16 }}>Soy {t === "taller" ? "Taller" : "Proveedor"}</strong>
                <p style={{ fontSize: m ? 11 : 13, marginTop: 4, opacity: 0.8 }}>{t === "taller" ? "Quiero comprar recambios" : "Quiero vender recambios"}</p>
              </button>
            ))}
          </div>

          <h3 style={{ fontSize: 12, fontWeight: 800, color: "#60a5fa", marginBottom: 14, marginTop: 20, textTransform: "uppercase", letterSpacing: "0.08em" }}>Datos de empresa</h3>
          <div style={grid2}>
            <div>
              <p style={{ color: "#94a3b8", fontSize: 13, marginBottom: 8 }}>Nombre de empresa *</p>
              <input placeholder="Talleres Martinez S.L." value={nombreEmpresa} onChange={e => setNombreEmpresa(e.target.value)} style={inputStyle} />
            </div>
            <div>
              <p style={{ color: "#94a3b8", fontSize: 13, marginBottom: 8 }}>CIF / NIF *</p>
              <input placeholder="B12345678" value={cif} onChange={e => setCif(e.target.value.toUpperCase())} style={{ ...inputStyle, borderColor: cif && !validarCIF(cif) ? "rgba(239,68,68,0.5)" : "rgba(255,255,255,0.1)" }} />
              {cif && !validarCIF(cif) && <p style={{ color: "#f87171", fontSize: 12, marginTop: 4 }}>Formato invalido</p>}
              {cif && validarCIF(cif) && <p style={{ color: "#4ade80", fontSize: 12, marginTop: 4 }}>Formato valido ✓</p>}
            </div>
          </div>

          <h3 style={{ fontSize: 12, fontWeight: 800, color: "#60a5fa", marginBottom: 14, marginTop: 20, textTransform: "uppercase", letterSpacing: "0.08em" }}>Contacto</h3>
          <div style={grid2}>
            <div>
              <p style={{ color: "#94a3b8", fontSize: 13, marginBottom: 8 }}>Email *</p>
              <input type="email" placeholder="taller@ejemplo.es" value={email} onChange={e => setEmail(e.target.value)} style={inputStyle} />
            </div>
            <div>
              <p style={{ color: "#94a3b8", fontSize: 13, marginBottom: 8 }}>Telefono *</p>
              <input placeholder="600 000 000" value={telefono} onChange={e => setTelefono(e.target.value)} style={inputStyle} />
            </div>
          </div>

          <h3 style={{ fontSize: 12, fontWeight: 800, color: "#60a5fa", marginBottom: 14, marginTop: 20, textTransform: "uppercase", letterSpacing: "0.08em" }}>Direccion</h3>
          <div style={{ marginBottom: 14 }}>
            <p style={{ color: "#94a3b8", fontSize: 13, marginBottom: 8 }}>Direccion *</p>
            <input placeholder="Calle Mayor, 123" value={direccion} onChange={e => setDireccion(e.target.value)} style={inputStyle} />
          </div>
          <div style={grid2}>
            <div>
              <p style={{ color: "#94a3b8", fontSize: 13, marginBottom: 8 }}>Ciudad</p>
              <input placeholder="Se rellena con el CP" value={ciudad} onChange={e => setCiudad(e.target.value)} style={inputStyle} />
            </div>
            <div>
              <p style={{ color: "#94a3b8", fontSize: 13, marginBottom: 8 }}>Codigo Postal *</p>
              <input placeholder="41001" value={codigoPostal} onChange={e => {
                const cp = e.target.value.replace(/\D/g, "").slice(0, 5);
                setCodigoPostal(cp);
                if (cp.length === 5) {
                  const datos = buscarCP(cp);
                  if (datos) { setCiudad(datos.poblacion); setProvincia(datos.provincia); } else { setProvincia(""); }
                } else { setProvincia(""); }
              }} style={inputStyle} maxLength={5} />
              {codigoPostal.length === 5 && provincia && <p style={{ color: "#4ade80", fontSize: 12, marginTop: 4 }}>✓ {ciudad} — {provincia}</p>}
              {codigoPostal.length === 5 && !provincia && <p style={{ color: "#94a3b8", fontSize: 12, marginTop: 4 }}>CP no encontrado — escribe la ciudad manualmente</p>}
            </div>
          </div>

          <h3 style={{ fontSize: 12, fontWeight: 800, color: "#60a5fa", marginBottom: 14, marginTop: 20, textTransform: "uppercase", letterSpacing: "0.08em" }}>Acceso</h3>
          <div style={grid2}>
            <div>
              <p style={{ color: "#94a3b8", fontSize: 13, marginBottom: 8 }}>Contrasena *</p>
              <input type="password" placeholder="Minimo 6 caracteres" value={password} onChange={e => setPassword(e.target.value)} style={inputStyle} />
            </div>
            <div>
              <p style={{ color: "#94a3b8", fontSize: 13, marginBottom: 8 }}>Repetir contrasena *</p>
              <input type="password" placeholder="Repite la contrasena" value={password2} onChange={e => setPassword2(e.target.value)} style={inputStyle} />
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12, margin: "20px 0", padding: "16px", background: "rgba(255,255,255,0.03)", borderRadius: 12, border: "1px solid rgba(255,255,255,0.06)" }}>
            {[
              { checked: esProfesional, onChange: setEsProfesional, text: "Confirmo que soy empresa o autonomo del sector de la automocion" },
              { checked: aceptaTerminos, onChange: setAceptaTerminos, text: "Acepto los Terminos y Condiciones (1 mes gratis + 25€/mes)" },
              { checked: aceptaPrivacidad, onChange: setAceptaPrivacidad, text: "He leido y acepto la Politica de Privacidad" },
            ].map(({ checked, onChange, text }, i) => (
              <label key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer" }}>
                <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} style={{ marginTop: 2, flexShrink: 0, width: 16, height: 16, cursor: "pointer" }} />
                <span style={{ color: "#cbd5e1", fontSize: m ? 13 : 14, lineHeight: 1.5 }}>{text}</span>
              </label>
            ))}
          </div>

          {error && <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#f87171", padding: "12px 16px", borderRadius: 12, marginBottom: 16, fontSize: 14 }}>⚠️ {error}</div>}

          <button onClick={registrar} disabled={registrando} style={{ width: "100%", background: "linear-gradient(135deg,#16a34a,#15803d)", border: "none", color: "white", padding: "16px", borderRadius: 14, fontWeight: 900, fontSize: m ? 15 : 16, cursor: registrando ? "not-allowed" : "pointer", opacity: registrando ? 0.7 : 1, boxShadow: "0 10px 30px rgba(22,163,74,0.35)" }}>
            {registrando ? "Creando cuenta..." : "Empezar 1 mes gratis →"}
          </button>

          <p style={{ textAlign: "center", color: "#94a3b8", fontSize: 14, marginTop: 16 }}>
            Ya tienes cuenta? <a href="/" style={{ color: "#60a5fa", textDecoration: "none", fontWeight: 700 }}>Inicia sesion</a>
          </p>
        </div>
      </div>
    </main>
  );
}

export default function RegistroPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", background: "#020617" }} />}>
      <RegistroPageInner />
    </Suspense>
  );
}

const inputStyle: React.CSSProperties = { width: "100%", background: "#020617", color: "white", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, padding: "14px 16px", fontSize: 15, outline: "none", boxSizing: "border-box" };