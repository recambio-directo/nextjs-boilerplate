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
  const [tipo, setTipo] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [guardado, setGuardado] = useState(false);
  const [totalPedidos, setTotalPedidos] = useState(0);

  // Datos bancarios
  const [iban, setIban] = useState("");
  const [titularCuenta, setTitularCuenta] = useState("");
  const [banco, setBanco] = useState("");

  // Crédito RD
  const [creditoRD, setCreditoRD] = useState(0);
  const [suscripcion, setSuscripcion] = useState("gratuito");
  const [historialCredito, setHistorialCredito] = useState<any[]>([]);

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
    }

    const { count } = await supabase.from("pedidos").select("*", { count: "exact", head: true }).eq("cliente_id", user.id);
    setTotalPedidos(count || 0);

    // Historial pedidos con RD Pago
    const { data: pedidosRD } = await supabase
      .from("pedidos")
      .select("id, codigo, total, created_at, forma_pago")
      .eq("cliente_id", user.id)
      .eq("forma_pago", "rd_pago")
      .order("id", { ascending: false })
      .limit(5);
    setHistorialCredito(pedidosRD || []);
  }

  async function guardarPerfil() {
    if (guardando) return;
    setGuardando(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setGuardando(false); return; }

    const campos = {
      nombre_empresa: empresa, cif, telefono, direccion, ciudad, provincia,
      codigo_postal: codigoPostal, email: user.email,
      tipo: user.user_metadata?.tipo || tipo,
      iban: iban.trim().toUpperCase(),
      titular_cuenta: titularCuenta,
      banco,
    };

    const { data: existe } = await supabase.from("usuarios").select("id").eq("id", user.id).single();
    let error;
    if (existe) {
      const { error: e } = await supabase.from("usuarios").update(campos).eq("id", user.id);
      error = e;
    } else {
      const { error: e } = await supabase.from("usuarios").insert({ id: user.id, ...campos });
      error = e;
    }

    setGuardando(false);
    if (error) { alert("Error al guardar: " + error.message); return; }
    setGuardado(true);
    setTimeout(() => setGuardado(false), 3000);
  }

  const SUSCRIPCION_LABELS: Record<string, { label: string; color: string }> = {
    gratuito:  { label: "Periodo gratuito", color: "#fbbf24" },
    activo:    { label: "Suscripcion activa", color: "#4ade80" },
    pendiente: { label: "Pago pendiente",    color: "#60a5fa" },
    moroso:    { label: "Pago vencido",      color: "#f87171" },
    cancelado: { label: "Cancelado",         color: "#94a3b8" },
  };
  const subInfo = SUSCRIPCION_LABELS[suscripcion] || SUSCRIPCION_LABELS.gratuito;

  return (
    <main style={mainStyle}>
      <section style={heroStyle}>
        <div style={heroOverlay} />
        <div style={heroContent}>
          <div style={badgeStyle}>CONFIGURACION EMPRESA</div>
          <h1 style={titleStyle}>MI CUENTA</h1>
          <p style={subtitleStyle}>Gestiona la informacion fiscal, bancaria y de contacto.</p>
        </div>
      </section>

      <section style={contentSection}>
        <div style={leftColumn}>

          {/* DATOS EMPRESA */}
          <div style={cardStyle}>
            <h2 style={sectionTitle}>DATOS EMPRESA</h2>
            <div style={gridStyle}>
              <div>
                <p style={labelStyle}>Empresa</p>
                <input placeholder="Nombre de tu empresa" value={empresa} onChange={e => setEmpresa(e.target.value)} style={inputStyle} />
              </div>
              <div>
                <p style={labelStyle}>CIF</p>
                <input placeholder="B12345678" value={cif} onChange={e => setCif(e.target.value)} style={inputStyle} />
              </div>
            </div>
          </div>

          {/* CONTACTO */}
          <div style={cardStyle}>
            <h2 style={sectionTitle}>CONTACTO</h2>
            <div style={gridStyle}>
              <div>
                <p style={labelStyle}>Telefono</p>
                <input placeholder="600 000 000" value={telefono} onChange={e => setTelefono(e.target.value)} style={inputStyle} />
              </div>
              <div>
                <p style={labelStyle}>Email</p>
                <input value={email} disabled style={{ ...inputStyle, opacity: 0.5, cursor: "not-allowed" }} />
              </div>
            </div>
          </div>

          {/* DIRECCIÓN */}
          <div style={cardStyle}>
            <h2 style={sectionTitle}>DIRECCION</h2>
            <div>
              <p style={labelStyle}>Direccion</p>
              <input placeholder="Calle, numero..." value={direccion} onChange={e => setDireccion(e.target.value)} style={inputStyle} />
            </div>
            <div style={{ ...gridStyle, marginTop: 20 }}>
              <div>
                <p style={labelStyle}>Ciudad</p>
                <input placeholder="Sevilla" value={ciudad} onChange={e => setCiudad(e.target.value)} style={inputStyle} />
              </div>
              <div>
                <p style={labelStyle}>Provincia</p>
                <input placeholder="Andalucia" value={provincia} onChange={e => setProvincia(e.target.value)} style={inputStyle} />
              </div>
            </div>
            <div style={{ marginTop: 20 }}>
              <p style={labelStyle}>Codigo Postal</p>
              <input placeholder="41001" value={codigoPostal} onChange={e => setCodigoPostal(e.target.value)} style={{ ...inputStyle, maxWidth: 200 }} maxLength={5} />
            </div>
          </div>

          {/* DATOS BANCARIOS */}
          <div style={{ ...cardStyle, border: "1px solid rgba(37,99,235,0.3)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 28 }}>
              <h2 style={{ ...sectionTitle, marginBottom: 0 }}>DATOS BANCARIOS</h2>
              <span style={{ background: "rgba(37,99,235,0.15)", color: "#60a5fa", padding: "4px 12px", borderRadius: 999, fontSize: 12, fontWeight: 700 }}>
                Para cobros y pagos
              </span>
            </div>
            <div style={{ background: "rgba(37,99,235,0.06)", border: "1px solid rgba(37,99,235,0.15)", borderRadius: 14, padding: "14px 18px", marginBottom: 24 }}>
              <p style={{ color: "#94a3b8", fontSize: 13 }}>
                Tus datos bancarios se usan para recibir pagos de pedidos (proveedores) o para gestionar el credito RD Pago. Solo los ve el administrador de Recambio Directo.
              </p>
            </div>
            <div style={{ marginBottom: 20 }}>
              <p style={labelStyle}>IBAN</p>
              <input
                placeholder="ES12 1234 5678 9012 3456 7890"
                value={iban}
                onChange={e => setIban(e.target.value.toUpperCase())}
                style={{ ...inputStyle, fontFamily: "monospace", letterSpacing: 1 }}
                maxLength={34}
              />
              <p style={{ color: "#94a3b8", fontSize: 12, marginTop: 6 }}>Formato: ES seguido de 22 digitos</p>
            </div>
            <div style={gridStyle}>
              <div>
                <p style={labelStyle}>Titular de la cuenta</p>
                <input placeholder="Nombre completo o razon social" value={titularCuenta} onChange={e => setTitularCuenta(e.target.value)} style={inputStyle} />
              </div>
              <div>
                <p style={labelStyle}>Entidad bancaria</p>
                <input placeholder="Ej: CaixaBank, Santander..." value={banco} onChange={e => setBanco(e.target.value)} style={inputStyle} />
              </div>
            </div>
            {iban && (
              <div style={{ marginTop: 16, background: "rgba(22,163,74,0.08)", border: "1px solid rgba(22,163,74,0.2)", borderRadius: 10, padding: "10px 16px", display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ color: "#4ade80" }}>✓</span>
                <span style={{ color: "#4ade80", fontSize: 13, fontWeight: 700 }}>IBAN guardado correctamente</span>
              </div>
            )}
          </div>

        </div>

        <aside style={rightColumn}>

          {/* PERFIL CARD */}
          <div style={profileCard}>
            <div style={avatarStyle}>{empresa?.charAt(0)?.toUpperCase() || "R"}</div>
            <h2 style={companyName}>{empresa || "Tu Empresa"}</h2>
            <p style={companyType}>{tipo || "cliente"}</p>
            {codigoPostal && <p style={{ color: "#60a5fa", fontSize: 14, marginTop: 8, fontWeight: 700 }}>CP: {codigoPostal}</p>}
            <div style={{ ...statusBadge, background: `${subInfo.color}22`, color: subInfo.color }}>
              {subInfo.label}
            </div>
          </div>

          {/* CREDITO RD */}
          <div style={{ ...statsCard, border: creditoRD > 0 ? "1px solid rgba(37,99,235,0.3)" : "1px solid rgba(255,255,255,0.06)" }}>
            <p style={{ color: "#94a3b8", fontSize: 12, fontWeight: 700, marginBottom: 8 }}>CREDITO RD PAGO DISPONIBLE</p>
            <h2 style={{ fontSize: 42, fontWeight: 900, color: creditoRD > 0 ? "#4ade80" : "#f87171", margin: 0 }}>
              {creditoRD.toFixed(2)}EUR
            </h2>
            {creditoRD <= 0 && (
              <div style={{ marginTop: 12, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 10, padding: "10px 14px" }}>
                <p style={{ color: "#f87171", fontSize: 13, fontWeight: 700, margin: 0 }}>Sin credito disponible</p>
                <p style={{ color: "#94a3b8", fontSize: 12, marginTop: 4 }}>
                  Contacta con nosotros: info@recambiodirecto.es
                </p>
              </div>
            )}
            {creditoRD > 0 && creditoRD < 100 && (
              <div style={{ marginTop: 10, background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: 10, padding: "8px 12px" }}>
                <p style={{ color: "#fbbf24", fontSize: 12, margin: 0 }}>Saldo bajo — contacta con nosotros para recargar</p>
              </div>
            )}
            {historialCredito.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <p style={{ color: "#94a3b8", fontSize: 11, fontWeight: 700, marginBottom: 8 }}>ULTIMOS PEDIDOS CON RD PAGO</p>
                {historialCredito.map(p => (
                  <div key={p.id} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid rgba(255,255,255,0.04)", fontSize: 13 }}>
                    <span style={{ color: "#60a5fa" }}>{p.codigo || "#" + p.id}</span>
                    <span style={{ color: "#f87171", fontWeight: 700 }}>-{Number(p.total).toFixed(2)}EUR</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* STATS */}
          <div style={statsCard}>
            <div style={statRow}>
              <div>
                <p style={statLabel}>PEDIDOS</p>
                <h3 style={statValue}>{totalPedidos}</h3>
              </div>
              <div>
                <p style={statLabel}>ESTADO</p>
                <h3 style={{ ...statValue, color: "#4ade80", fontSize: 18 }}>Verificado</h3>
              </div>
            </div>
          </div>

          <button
            onClick={guardarPerfil}
            disabled={guardando}
            style={{
              ...saveButton,
              background: guardado ? "linear-gradient(135deg,#0891b2,#0e7490)" : "linear-gradient(135deg,#16a34a,#15803d)",
              opacity: guardando ? 0.7 : 1,
              cursor: guardando ? "not-allowed" : "pointer",
            }}
          >
            {guardando ? "GUARDANDO..." : guardado ? "GUARDADO" : "GUARDAR CAMBIOS"}
          </button>

        </aside>
      </section>
    </main>
  );
}

/* STYLES */
const mainStyle = { minHeight: "100vh", background: "linear-gradient(135deg,#020617,#020b2d)", color: "white" };
const heroStyle = { height: "320px", position: "relative" as const, background: "url(https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?q=80&w=1600&auto=format&fit=crop) center/cover", display: "flex", alignItems: "center", padding: "70px" };
const heroOverlay = { position: "absolute" as const, inset: 0, background: "linear-gradient(90deg,rgba(2,6,23,0.94),rgba(2,6,23,0.55))" };
const heroContent = { position: "relative" as const, zIndex: 2, maxWidth: "700px" };
const badgeStyle = { display: "inline-block", background: "rgba(37,99,235,0.18)", border: "1px solid rgba(37,99,235,0.3)", padding: "10px 18px", borderRadius: "999px", marginBottom: "24px", color: "#60a5fa", fontWeight: 700 };
const titleStyle = { fontSize: "72px", fontWeight: 900, lineHeight: 1, marginBottom: "22px" };
const subtitleStyle = { fontSize: "22px", color: "#cbd5e1", lineHeight: 1.6 };
const contentSection = { display: "grid", gridTemplateColumns: "1fr 380px", gap: "40px", padding: "50px" };
const leftColumn = { display: "grid", gap: "30px" };
const rightColumn = { display: "grid", gap: "30px", alignContent: "start" };
const cardStyle = { background: "rgba(15,23,42,0.92)", borderRadius: "30px", padding: "34px", border: "1px solid rgba(255,255,255,0.06)" };
const sectionTitle = { fontSize: "34px", fontWeight: 900, marginBottom: "28px" };
const gridStyle = { display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: "20px" };
const labelStyle = { marginBottom: "10px", color: "#94a3b8", fontSize: "14px" };
const inputStyle = { width: "100%", padding: "18px", borderRadius: "18px", border: "1px solid rgba(255,255,255,0.08)", background: "#0f172a", color: "white", fontSize: "16px", outline: "none", boxSizing: "border-box" as const };
const profileCard = { background: "rgba(15,23,42,0.92)", borderRadius: "32px", padding: "40px", border: "1px solid rgba(255,255,255,0.06)", textAlign: "center" as const };
const avatarStyle = { width: "110px", height: "110px", borderRadius: "32px", background: "linear-gradient(135deg,#2563eb,#1d4ed8)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px", fontSize: "42px", fontWeight: 900 };
const companyName = { fontSize: "34px", fontWeight: 900, marginBottom: "10px" };
const companyType = { color: "#94a3b8", marginBottom: "20px" };
const statusBadge = { display: "inline-block", padding: "10px 18px", borderRadius: "999px", fontWeight: 700, marginTop: 12 };
const statsCard = { background: "rgba(15,23,42,0.92)", borderRadius: "30px", padding: "30px", border: "1px solid rgba(255,255,255,0.06)" };
const statRow = { display: "flex", justifyContent: "space-between" };
const statLabel = { color: "#94a3b8", marginBottom: "10px" };
const statValue = { fontSize: "32px", fontWeight: 900 };
const saveButton = { width: "100%", border: "none", padding: "22px", borderRadius: "22px", color: "white", fontWeight: 900, fontSize: "18px", boxShadow: "0 12px 30px rgba(22,163,74,0.35)" };