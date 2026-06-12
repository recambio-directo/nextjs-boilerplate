"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export default function PerfilPage() {
  const [empresa, setEmpresa] = useState("");
  const [cif, setCif] = useState("");
  const [telefono, setTelefono] = useState("");
  const [direccion, setDireccion] = useState("");
  const [ciudad, setCiudad] = useState("");
  const [provincia, setProvincia] = useState("");
  const [codigoPostal, setCodigoPostal] = useState("");
  const [email, setEmail] = useState("");
  const [emailFacturas, setEmailFacturas] = useState("");
  const [tipo, setTipo] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [guardado, setGuardado] = useState(false);
  const [totalPedidos, setTotalPedidos] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  const [iban, setIban] = useState("");
  const [titularCuenta, setTitularCuenta] = useState("");
  const [banco, setBanco] = useState("");

  const [creditoRD, setCreditoRD] = useState(0);
  const [suscripcion, setSuscripcion] = useState("gratuito");
  const [historialCredito, setHistorialCredito] = useState<any[]>([]);

  const [mostrarCambioPass, setMostrarCambioPass] = useState(false);
  const [passwordActual, setPasswordActual] = useState("");
  const [passwordNueva, setPasswordNueva] = useState("");
  const [passwordNueva2, setPasswordNueva2] = useState("");
  const [cambiandoPass, setCambiandoPass] = useState(false);
  const [mensajePass, setMensajePass] = useState<{tipo: "ok" | "error"; texto: string} | null>(null);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => { cargarPerfil(); }, []);

  async function cargarPerfil() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setUserId(user.id);
    setEmail(user.email || "");
    setTipo(user.user_metadata?.tipo || "cliente");
    const { data } = await supabase.from("usuarios").select("*").eq("id", user.id).single();
    if (data) {
      setEmpresa(data.nombre_empresa || "");
      setCif(data.cif || "");
      setTelefono(data.telefono || "");
      setDireccion(data.direccion || "");
      setCiudad(data.ciudad || "");
      setProvincia(data.provincia || "");
      setCodigoPostal(data.codigo_postal || "");
      setIban(data.iban || "");
      setTitularCuenta(data.titular_cuenta || "");
      setBanco(data.banco || "");
      setCreditoRD(Number(data.credito_rd) || 0);
      setSuscripcion(data.suscripcion || "gratuito");
      setEmailFacturas(data.email_facturas || "");
    }
    const { count } = await supabase.from("pedidos").select("*", { count: "exact", head: true }).eq("cliente_id", user.id);
    setTotalPedidos(count || 0);
    const { data: pedidosRD } = await supabase.from("pedidos").select("id, codigo, total, created_at, forma_pago").eq("cliente_id", user.id).eq("forma_pago", "rd_pago").order("id", { ascending: false }).limit(5);
    setHistorialCredito(pedidosRD || []);
  }

  async function guardarPerfil() {
    if (guardando) return;
    setGuardando(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setGuardando(false); return; }
    const campos = {
      nombre_empresa: empresa, telefono, direccion, ciudad, provincia,
      codigo_postal: codigoPostal, email: user.email,
      tipo: user.user_metadata?.tipo || tipo,
      iban: iban.trim().toUpperCase(), titular_cuenta: titularCuenta, banco,
      email_facturas: emailFacturas.trim().toLowerCase() || null,
    };
    const { data: existe } = await supabase.from("usuarios").select("id").eq("id", user.id).single();
    let error;
    if (existe) { const { error: e } = await supabase.from("usuarios").update(campos).eq("id", user.id); error = e; }
    else { const { error: e } = await supabase.from("usuarios").insert({ id: user.id, ...campos }); error = e; }
    setGuardando(false);
    if (error) { alert("Error al guardar: " + error.message); return; }
    setGuardado(true);
    setTimeout(() => setGuardado(false), 3000);
  }

  async function cambiarContrasena() {
    setMensajePass(null);
    if (!passwordNueva || !passwordNueva2) { setMensajePass({ tipo: "error", texto: "Rellena todos los campos" }); return; }
    if (passwordNueva.length < 6) { setMensajePass({ tipo: "error", texto: "La contraseña debe tener mínimo 6 caracteres" }); return; }
    if (passwordNueva !== passwordNueva2) { setMensajePass({ tipo: "error", texto: "Las contraseñas no coinciden" }); return; }
    setCambiandoPass(true);
    const { error: loginError } = await supabase.auth.signInWithPassword({ email, password: passwordActual });
    if (loginError) { setMensajePass({ tipo: "error", texto: "La contraseña actual no es correcta" }); setCambiandoPass(false); return; }
    const { error: updateError } = await supabase.auth.updateUser({ password: passwordNueva });
    setCambiandoPass(false);
    if (updateError) { setMensajePass({ tipo: "error", texto: "Error al cambiar la contraseña: " + updateError.message }); return; }
    setMensajePass({ tipo: "ok", texto: "Contraseña cambiada correctamente" });
    setPasswordActual(""); setPasswordNueva(""); setPasswordNueva2("");
    setTimeout(() => { setMostrarCambioPass(false); setMensajePass(null); }, 2500);
  }

  const SUSCRIPCION_LABELS: Record<string, { label: string; color: string }> = {
    gratuito:  { label: "Periodo gratuito", color: "#fbbf24" },
    activo:    { label: "Suscripcion activa", color: "#4ade80" },
    pendiente: { label: "Pago pendiente",    color: "#60a5fa" },
    moroso:    { label: "Pago vencido",      color: "#f87171" },
    cancelado: { label: "Cancelado",         color: "#94a3b8" },
  };
  const subInfo = SUSCRIPCION_LABELS[suscripcion] || SUSCRIPCION_LABELS.gratuito;
  const m = isMobile;

  const card: React.CSSProperties = { background: "rgba(15,23,42,0.92)", borderRadius: m ? 16 : 24, padding: m ? "16px" : "28px", border: "1px solid rgba(255,255,255,0.06)", marginBottom: m ? 12 : 20 };
  const secTitle: React.CSSProperties = { fontSize: m ? 14 : 16, fontWeight: 800, color: "#60a5fa", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: m ? 14 : 20 };
  const label: React.CSSProperties = { color: "#94a3b8", fontSize: 13, marginBottom: 6 };
  const input: React.CSSProperties = { width: "100%", padding: m ? "12px 14px" : "14px 16px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.08)", background: "#0f172a", color: "white", fontSize: m ? 14 : 15, outline: "none", boxSizing: "border-box" };
  const grid2: React.CSSProperties = { display: "grid", gridTemplateColumns: m ? "1fr" : "1fr 1fr", gap: m ? 10 : 16 };

  return (
    <main style={{ minHeight: "100vh", background: "linear-gradient(135deg,#020617,#020b2d)", color: "white", padding: m ? "12px 12px 80px" : "clamp(16px,4vw,40px)" }}>

      <div style={{ marginBottom: m ? 16 : 24 }}>
        <div style={{ display: "inline-block", padding: "6px 14px", borderRadius: 999, background: "rgba(37,99,235,0.18)", color: "#60a5fa", marginBottom: 10, fontWeight: 700, fontSize: 12 }}>CONFIGURACION</div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h1 style={{ fontSize: m ? 28 : "clamp(28px,5vw,48px)", fontWeight: 900, lineHeight: 1 }}>MI CUENTA</h1>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: m ? 40 : 48, height: m ? 40 : 48, borderRadius: 12, background: "linear-gradient(135deg,#2563eb,#1d4ed8)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: m ? 18 : 22, fontWeight: 900 }}>
              {empresa?.charAt(0)?.toUpperCase() || "R"}
            </div>
            {!m && (
              <div>
                <p style={{ fontWeight: 800, fontSize: 15, margin: 0 }}>{empresa || "Tu empresa"}</p>
                <p style={{ color: subInfo.color, fontSize: 12, margin: 0, fontWeight: 700 }}>{subInfo.label}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: m ? "1fr" : "1fr 320px", gap: m ? 0 : 24, alignItems: "start" }}>

        <div>

          {/* DATOS EMPRESA */}
          <div style={card}>
            <p style={secTitle}>Datos de empresa</p>
            <div style={grid2}>
              <div>
                <p style={label}>Nombre de empresa</p>
                <input placeholder="Talleres Martinez S.L." value={empresa} onChange={e => setEmpresa(e.target.value)} style={input} />
              </div>
              <div>
                <p style={label}>CIF / NIF</p>
                <input value={cif} disabled style={{ ...input, opacity: 0.5, cursor: "not-allowed" }} />
                <p style={{ color: "#94a3b8", fontSize: 11, marginTop: 4 }}>🔒 No modificable</p>
              </div>
            </div>
          </div>

          {/* CONTACTO */}
          <div style={card}>
            <p style={secTitle}>Contacto</p>
            <div style={grid2}>
              <div>
                <p style={label}>Teléfono</p>
                <input placeholder="600 000 000" value={telefono} onChange={e => setTelefono(e.target.value)} style={input} />
              </div>
              <div>
                <p style={label}>Email de acceso</p>
                <input value={email} disabled style={{ ...input, opacity: 0.5, cursor: "not-allowed" }} />
                <p style={{ color: "#94a3b8", fontSize: 11, marginTop: 4 }}>🔒 No modificable</p>
              </div>
            </div>
            {/* EMAIL FACTURAS */}
            <div style={{ marginTop: 14 }}>
              <p style={label}>📧 Email para recibir facturas <span style={{ color: "#64748b", fontSize: 11 }}>(opcional — si es distinto al de acceso)</span></p>
              <input
                placeholder="contabilidad@tuempresa.com"
                value={emailFacturas}
                onChange={e => setEmailFacturas(e.target.value)}
                style={{ ...input, borderColor: emailFacturas ? "rgba(37,99,235,0.4)" : "rgba(255,255,255,0.08)" }}
                type="email"
              />
              {emailFacturas && (
                <p style={{ color: "#60a5fa", fontSize: 11, marginTop: 4 }}>✓ Las facturas se enviarán también a este email</p>
              )}
            </div>
          </div>

          {/* DIRECCIÓN */}
          <div style={card}>
            <p style={secTitle}>Dirección</p>
            <div style={{ marginBottom: 12 }}>
              <p style={label}>Dirección</p>
              <input placeholder="Calle Mayor, 123" value={direccion} onChange={e => setDireccion(e.target.value)} style={input} />
            </div>
            <div style={grid2}>
              <div>
                <p style={label}>Ciudad</p>
                <input placeholder="Sevilla" value={ciudad} onChange={e => setCiudad(e.target.value)} style={input} />
              </div>
              <div>
                <p style={label}>Código postal</p>
                <input placeholder="41001" value={codigoPostal} onChange={e => setCodigoPostal(e.target.value)} style={input} maxLength={5} />
              </div>
            </div>
          </div>

          {/* DATOS BANCARIOS */}
          <div style={{ ...card, border: "1px solid rgba(37,99,235,0.25)" }}>
            <p style={secTitle}>Datos bancarios</p>
            <div style={{ background: "rgba(37,99,235,0.06)", border: "1px solid rgba(37,99,235,0.15)", borderRadius: 10, padding: "10px 14px", marginBottom: 16 }}>
              <p style={{ color: "#94a3b8", fontSize: 12 }}>Solo visibles para el administrador de Recambio Directo. Se usan para cobros y pagos.</p>
            </div>
            <div style={{ marginBottom: 14 }}>
              <p style={label}>IBAN</p>
              <input placeholder="ES12 1234 5678 9012 3456 7890" value={iban} onChange={e => setIban(e.target.value.toUpperCase())} style={{ ...input, fontFamily: "monospace" }} maxLength={34} />
            </div>
            <div style={grid2}>
              <div>
                <p style={label}>Titular</p>
                <input placeholder="Nombre o razón social" value={titularCuenta} onChange={e => setTitularCuenta(e.target.value)} style={input} />
              </div>
              <div>
                <p style={label}>Banco</p>
                <input placeholder="CaixaBank, Santander..." value={banco} onChange={e => setBanco(e.target.value)} style={input} />
              </div>
            </div>
          </div>

          {/* CONTRASEÑA */}
          <div style={{ ...card, border: "1px solid rgba(139,92,246,0.25)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: mostrarCambioPass ? 16 : 0 }}>
              <div>
                <p style={secTitle}>Contraseña</p>
                {!mostrarCambioPass && <p style={{ color: "#94a3b8", fontSize: 13, marginTop: -10 }}>Cambia tu contraseña de acceso</p>}
              </div>
              <button onClick={() => { setMostrarCambioPass(!mostrarCambioPass); setMensajePass(null); setPasswordActual(""); setPasswordNueva(""); setPasswordNueva2(""); }} style={{ background: mostrarCambioPass ? "rgba(255,255,255,0.05)" : "rgba(139,92,246,0.15)", border: "none", color: mostrarCambioPass ? "#94a3b8" : "#a78bfa", padding: m ? "8px 12px" : "10px 18px", borderRadius: 10, cursor: "pointer", fontWeight: 700, fontSize: 13 }}>
                {mostrarCambioPass ? "Cancelar" : "🔑 Cambiar"}
              </button>
            </div>
            {mostrarCambioPass && (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div>
                  <p style={label}>Contraseña actual</p>
                  <input type="password" placeholder="Tu contraseña actual" value={passwordActual} onChange={e => setPasswordActual(e.target.value)} style={input} />
                </div>
                <div style={grid2}>
                  <div>
                    <p style={label}>Nueva contraseña</p>
                    <input type="password" placeholder="Mínimo 6 caracteres" value={passwordNueva} onChange={e => setPasswordNueva(e.target.value)} style={input} />
                  </div>
                  <div>
                    <p style={label}>Repetir nueva</p>
                    <input type="password" placeholder="Repite la contraseña" value={passwordNueva2} onChange={e => setPasswordNueva2(e.target.value)} style={input} />
                  </div>
                </div>
                {mensajePass && (
                  <div style={{ background: mensajePass.tipo === "ok" ? "rgba(22,163,74,0.1)" : "rgba(239,68,68,0.1)", border: `1px solid ${mensajePass.tipo === "ok" ? "rgba(22,163,74,0.3)" : "rgba(239,68,68,0.3)"}`, color: mensajePass.tipo === "ok" ? "#4ade80" : "#f87171", padding: "10px 14px", borderRadius: 10, fontSize: 13, fontWeight: 700 }}>
                    {mensajePass.tipo === "ok" ? "✅ " : "⚠️ "}{mensajePass.texto}
                  </div>
                )}
                <button onClick={cambiarContrasena} disabled={cambiandoPass} style={{ background: "linear-gradient(135deg,#7c3aed,#6d28d9)", border: "none", color: "white", padding: "14px", borderRadius: 12, fontWeight: 900, fontSize: 14, cursor: cambiandoPass ? "not-allowed" : "pointer", opacity: cambiandoPass ? 0.7 : 1 }}>
                  {cambiandoPass ? "Verificando..." : "Confirmar cambio"}
                </button>
              </div>
            )}
          </div>

          {m && (
            <button onClick={guardarPerfil} disabled={guardando} style={{ width: "100%", border: "none", padding: "16px", borderRadius: 14, color: "white", fontWeight: 900, fontSize: 16, cursor: guardando ? "not-allowed" : "pointer", opacity: guardando ? 0.7 : 1, background: guardado ? "linear-gradient(135deg,#0891b2,#0e7490)" : "linear-gradient(135deg,#16a34a,#15803d)" }}>
              {guardando ? "GUARDANDO..." : guardado ? "✓ GUARDADO" : "GUARDAR CAMBIOS"}
            </button>
          )}
        </div>

        {!m && (
          <aside style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ background: "rgba(15,23,42,0.92)", borderRadius: 24, padding: 24, border: "1px solid rgba(255,255,255,0.06)", textAlign: "center" }}>
              <div style={{ width: 72, height: 72, borderRadius: 18, background: "linear-gradient(135deg,#2563eb,#1d4ed8)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", fontSize: 30, fontWeight: 900 }}>
                {empresa?.charAt(0)?.toUpperCase() || "R"}
              </div>
              <h2 style={{ fontSize: 20, fontWeight: 900, marginBottom: 6 }}>{empresa || "Tu Empresa"}</h2>
              <p style={{ color: "#94a3b8", fontSize: 13, marginBottom: 10 }}>{tipo || "cliente"}</p>
              <span style={{ display: "inline-block", padding: "6px 14px", borderRadius: 999, fontWeight: 700, fontSize: 12, background: `${subInfo.color}22`, color: subInfo.color }}>{subInfo.label}</span>
              {emailFacturas && (
                <div style={{ marginTop: 14, background: "rgba(37,99,235,0.08)", border: "1px solid rgba(37,99,235,0.2)", borderRadius: 10, padding: "8px 12px" }}>
                  <p style={{ color: "#94a3b8", fontSize: 10, fontWeight: 700, margin: "0 0 4px" }}>EMAIL FACTURAS</p>
                  <p style={{ color: "#60a5fa", fontSize: 12, fontWeight: 700, margin: 0 }}>{emailFacturas}</p>
                </div>
              )}
            </div>

            <div style={{ background: "rgba(15,23,42,0.92)", borderRadius: 24, padding: 24, border: creditoRD > 0 ? "1px solid rgba(37,99,235,0.3)" : "1px solid rgba(255,255,255,0.06)" }}>
              <p style={{ color: "#94a3b8", fontSize: 11, fontWeight: 700, marginBottom: 8 }}>CRÉDITO RD PAGO</p>
              <h2 style={{ fontSize: 34, fontWeight: 900, color: creditoRD > 0 ? "#4ade80" : "#f87171", margin: "0 0 8px" }}>{creditoRD.toFixed(2)}€</h2>
              {creditoRD <= 0 && <p style={{ color: "#f87171", fontSize: 12 }}>Sin crédito — contacta info@recambio-directo.com</p>}
              {historialCredito.length > 0 && (
                <div style={{ marginTop: 12 }}>
                  <p style={{ color: "#94a3b8", fontSize: 11, fontWeight: 700, marginBottom: 8 }}>ÚLTIMOS PEDIDOS RD PAGO</p>
                  {historialCredito.map(p => (
                    <div key={p.id} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: "1px solid rgba(255,255,255,0.04)", fontSize: 12 }}>
                      <span style={{ color: "#60a5fa" }}>{p.codigo || "#" + p.id}</span>
                      <span style={{ color: "#f87171", fontWeight: 700 }}>-{Number(p.total).toFixed(2)}€</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ background: "rgba(15,23,42,0.92)", borderRadius: 24, padding: 24, border: "1px solid rgba(255,255,255,0.06)", display: "flex", justifyContent: "space-between" }}>
              <div>
                <p style={{ color: "#94a3b8", fontSize: 11, fontWeight: 700, marginBottom: 6 }}>PEDIDOS</p>
                <p style={{ fontSize: 28, fontWeight: 900, margin: 0 }}>{totalPedidos}</p>
              </div>
              <div style={{ textAlign: "right" }}>
                <p style={{ color: "#94a3b8", fontSize: 11, fontWeight: 700, marginBottom: 6 }}>ESTADO</p>
                <p style={{ fontSize: 15, fontWeight: 900, color: "#4ade80", margin: 0 }}>Verificado</p>
              </div>
            </div>

            <button onClick={guardarPerfil} disabled={guardando} style={{ width: "100%", border: "none", padding: "18px", borderRadius: 16, color: "white", fontWeight: 900, fontSize: 16, cursor: guardando ? "not-allowed" : "pointer", opacity: guardando ? 0.7 : 1, background: guardado ? "linear-gradient(135deg,#0891b2,#0e7490)" : "linear-gradient(135deg,#16a34a,#15803d)", boxShadow: "0 8px 24px rgba(22,163,74,0.3)" }}>
              {guardando ? "GUARDANDO..." : guardado ? "✓ GUARDADO" : "GUARDAR CAMBIOS"}
            </button>
          </aside>
        )}
      </div>
    </main>
  );
}