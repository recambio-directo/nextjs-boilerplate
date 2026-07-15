"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

const ESTADO_INFO: Record<string, { label: string; color: string; emoji: string }> = {
  iniciada: { label: "Iniciada", color: "#f59e0b", emoji: "⏳" },
  aceptada: { label: "Aceptada", color: "#4ade80", emoji: "✅" },
  envio_pendiente: { label: "Envío pendiente", color: "#fbbf24", emoji: "📦" },
  en_transito: { label: "En tránsito", color: "#60a5fa", emoji: "🚚" },
  recibida: { label: "Recibida", color: "#a78bfa", emoji: "📥" },
  finalizada: { label: "Finalizada", color: "#22c55e", emoji: "🏁" },
  rechazada: { label: "Rechazada", color: "#f87171", emoji: "🚫" },
  cancelada: { label: "Cancelada", color: "#94a3b8", emoji: "❌" },
  gestion_externa: { label: "Gestión externa", color: "#e879f9", emoji: "🔁" },
};

const TIPO_INFO: Record<string, { label: string; emoji: string }> = {
  arrepentimiento: { label: "Ya no lo necesito", emoji: "🔄" },
  pieza_incorrecta: { label: "Pieza incorrecta", emoji: "❓" },
  rotura_desperfecto: { label: "Rotura / desperfecto", emoji: "💥" },
  otro: { label: "Otro motivo", emoji: "✍️" },
};

const AGENCIAS = [
  { key: "MRW", label: "MRW 24H", precio: 7.95, color: "#E30613", textColor: "#fff" },
  { key: "NACEX", label: "NACEX", precio: 7.50, color: "#FFD200", textColor: "#1a1a1a" },
  { key: "SEUR", label: "SEUR 24", precio: 7.50, color: "#F5A800", textColor: "#1a1a1a" },
  { key: "GLS", label: "GLS", precio: 6.50, color: "#00467F", textColor: "#fff" },
  { key: "Correos Express", label: "Correos Exp.", precio: 5.00, color: "#FFCC00", textColor: "#333" },
  { key: "CTT Express", label: "CTT Express", precio: 7.50, color: "#E2001A", textColor: "#fff" },
];

const MOTIVOS_RECHAZO = [
  "⏱️ Fuera del plazo de devolución",
  "🔧 La pieza ha sido montada o manipulada",
  "📦 Falta el embalaje original",
  "💥 El desperfecto no es de origen",
  "✍️ Otro (detallar por chat)",
];

async function notificarDevolucion(evento: string, devolucion: any) {
  try { await fetch("/api/send-devolucion", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ evento, devolucion }) }); } catch (e) { console.error("Error notificación devolución:", e); }
}

export default function Devoluciones() {
  const router = useRouter();
  const [enviadas, setEnviadas] = useState<any[]>([]);
  const [recibidas, setRecibidas] = useState<any[]>([]);
  const [pestañaActiva, setPestañaActiva] = useState<"enviadas" | "recibidas">("enviadas");
  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("todos");
  const [expandida, setExpandida] = useState<number | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [procesando, setProcesando] = useState<number | null>(null);
  const [modalRechazo, setModalRechazo] = useState<any | null>(null);
  const [motivoRechazo, setMotivoRechazo] = useState("");
  const [agenciaSeleccionada, setAgenciaSeleccionada] = useState<string | null>(null);
  const [creandoEnvio, setCreandoEnvio] = useState(false);
  const [modalContacto, setModalContacto] = useState<any | null>(null);
  const [datosContacto, setDatosContacto] = useState<any | null>(null);

  useEffect(() => { const check = () => setIsMobile(window.innerWidth < 768); check(); window.addEventListener("resize", check); return () => window.removeEventListener("resize", check); }, []);

  useEffect(() => {
    cargarDevoluciones();
    const channel = supabase.channel("devoluciones-realtime").on("postgres_changes", { event: "*", schema: "public", table: "devoluciones" }, () => cargarDevoluciones()).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  async function cargarDevoluciones() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setUserId(user.id);
    const { data: env } = await supabase.from("devoluciones").select("*").eq("solicitante_id", user.id).order("id", { ascending: false });
    setEnviadas(env || []);
    const { data: rec } = await supabase.from("devoluciones").select("*").eq("proveedor_id", user.id).order("id", { ascending: false });
    setRecibidas(rec || []);
  }

  function fmt(n: any) { return Number(Number(n).toFixed(2)).toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
  function fmtFecha(f: string | null) { return f ? new Date(f).toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }) : null; }

  async function actualizarDevolucion(dev: any, cambios: Record<string, any>, evento: string) {
    setProcesando(dev.id);
    const { error } = await supabase.from("devoluciones").update({ ...cambios, updated_at: new Date().toISOString() }).eq("id", dev.id);
    if (error) { alert("Error: " + error.message); setProcesando(null); return false; }
    await notificarDevolucion(evento, { ...dev, ...cambios });
    setProcesando(null);
    cargarDevoluciones();
    return true;
  }

  async function cancelarDevolucion(dev: any) {
    if (!confirm(`¿Cancelar la solicitud de devolución ${dev.codigo}?`)) return;
    await actualizarDevolucion(dev, { estado: "cancelada" }, "cancelada");
  }

  async function cerrarMutuoAcuerdo(dev: any) {
    if (!confirm(`¿Cerrar la devolución ${dev.codigo} de mutuo acuerdo?\n\nLa devolución se marcará como finalizada.`)) return;
    await actualizarDevolucion(dev, { estado: "finalizada", fecha_finalizada: new Date().toISOString(), motivo_texto: (dev.motivo_texto || "") + "\n[Cerrada de mutuo acuerdo entre las partes]" }, "finalizada");
  }

  async function crearEnvioAgencia(dev: any) {
    if (!agenciaSeleccionada) { alert("Selecciona una agencia"); return; }
    setCreandoEnvio(true);
    try {
      const res = await fetch("/api/devolucion/crear-envio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ devolucionId: dev.id, agencia: agenciaSeleccionada }),
      });
      const data = await res.json();
      if (!data.ok) { alert("Error al crear el envío: " + (data.error || "Error desconocido")); setCreandoEnvio(false); return; }
      alert(`✅ Envío creado con ${agenciaSeleccionada}.\n\nTracking: ${data.tracking || "—"}\n${data.etiquetaUrl ? "La etiqueta está disponible para descargar." : "Etiqueta pendiente."}`);
      setAgenciaSeleccionada(null);
      cargarDevoluciones();
    } catch (e) { alert("Error de conexión al crear el envío"); }
    setCreandoEnvio(false);
  }

  // Proveedor actions (pestaña recibidas)
  async function aceptarDevolucion(dev: any) { await actualizarDevolucion(dev, { estado: "envio_pendiente", fecha_aceptada: new Date().toISOString() }, "aceptada"); }
  async function confirmarRechazo() {
    if (!modalRechazo || !motivoRechazo) return;
    setModalRechazo(null);
    await actualizarDevolucion(modalRechazo, { estado: "rechazada", motivo_rechazo: motivoRechazo, fecha_rechazada: new Date().toISOString() }, "rechazada");
    setMotivoRechazo("");
  }
  async function marcarGestionExterna(dev: any) { if (!confirm("¿Marcar como gestión externa?")) return; await actualizarDevolucion(dev, { estado: "gestion_externa" }, "gestion_externa"); }
  async function marcarRecibida(dev: any) { await actualizarDevolucion(dev, { estado: "recibida", fecha_recibida: new Date().toISOString() }, "recibida"); }
  async function finalizarDevolucion(dev: any) { if (!confirm(`¿Finalizar la devolución ${dev.codigo}?`)) return; await actualizarDevolucion(dev, { estado: "finalizada", fecha_finalizada: new Date().toISOString() }, "finalizada"); }

  async function abrirChat(dev: any) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const otroId = pestañaActiva === "enviadas" ? dev.proveedor_id : dev.solicitante_id;
    const { data: conv } = await supabase.from("conversaciones").select("id").eq("pedido_id", dev.pedido_id).maybeSingle();
    if (conv) { router.push(`/chat?conv=${conv.id}`); return; }
    const { data: nuevaConv, error } = await supabase.from("conversaciones").insert({ user1_id: user.id, user2_id: otroId, pedido_id: dev.pedido_id, referencia: `Devolución ${dev.codigo}`, ultimo_mensaje: "", updated_at: new Date().toISOString() }).select("id").single();
    if (!error && nuevaConv) router.push(`/chat?conv=${nuevaConv.id}`);
  }

  async function abrirContacto(dev: any) {
    setModalContacto(dev);
    setDatosContacto(null);
    const otroId = pestañaActiva === "enviadas" ? dev.proveedor_id : dev.solicitante_id;
    if (otroId) {
      const { data } = await supabase.from("usuarios").select("nombre_empresa, email, telefono, direccion, ciudad, codigo_postal, cif").eq("id", otroId).single();
      setDatosContacto(data || null);
    }
  }

  const devoluciones = pestañaActiva === "enviadas" ? enviadas : recibidas;
  const esProveedor = pestañaActiva === "recibidas";

  const devolucionesFiltradas = devoluciones.filter(d => {
    if (busqueda) {
      const q = busqueda.toLowerCase();
      if (!((d.codigo || "").toLowerCase().includes(q) || (d.pedido_codigo || "").toLowerCase().includes(q) || (d.referencia || "").toLowerCase().includes(q) || (d.solicitante_nombre || "").toLowerCase().includes(q) || (d.proveedor_nombre || "").toLowerCase().includes(q))) return false;
    }
    if (filtroEstado !== "todos" && d.estado !== filtroEstado) return false;
    return true;
  });

  const contadores: Record<string, number> = { todos: devoluciones.length };
  Object.keys(ESTADO_INFO).forEach(e => { contadores[e] = devoluciones.filter(d => d.estado === e).length; });
  const pendientesAccion = esProveedor
    ? devoluciones.filter(d => ["iniciada", "en_transito", "recibida"].includes(d.estado)).length
    : devoluciones.filter(d => d.estado === "envio_pendiente").length;

  const GRID_COLS = "1.1fr 1fr 1.5fr 1.4fr 0.7fr 1.1fr 1.1fr 110px";
  const GRID_HEADERS = ["CÓDIGO", "PEDIDO", "REFERENCIA", esProveedor ? "SOLICITANTE" : "PROVEEDOR", "IMPORTE", "TIPO", "ESTADO", "ACCIONES"];

  function BadgeEstado({ estado }: { estado: string }) {
    const info = ESTADO_INFO[estado] || { label: estado, color: "#94a3b8", emoji: "•" };
    return <span style={{ color: info.color, fontWeight: 700, fontSize: 12, background: `${info.color}22`, padding: "4px 10px", borderRadius: 999, whiteSpace: "nowrap" }}>{info.emoji} {info.label.toUpperCase()}</span>;
  }

  function Timeline({ dev }: { dev: any }) {
    const pasos = [
      { label: "Solicitada", fecha: dev.created_at },
      { label: "Aceptada", fecha: dev.fecha_aceptada },
      { label: "Rechazada", fecha: dev.fecha_rechazada },
      { label: "Enviada", fecha: dev.fecha_envio },
      { label: "Recibida", fecha: dev.fecha_recibida },
      { label: "Finalizada", fecha: dev.fecha_finalizada },
    ].filter(p => p.fecha);
    return (
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {pasos.map(p => (
          <div key={p.label} style={{ background: "#0f172a", borderRadius: 10, padding: "8px 12px" }}>
            <p style={{ color: "#94a3b8", fontSize: 10, fontWeight: 700, margin: 0 }}>{p.label.toUpperCase()}</p>
            <p style={{ fontWeight: 700, fontSize: 12, margin: 0, marginTop: 2 }}>{fmtFecha(p.fecha)}</p>
          </div>
        ))}
      </div>
    );
  }

  // ¿Se puede cerrar de mutuo acuerdo? Solo si no se ha generado envío con agencia
  function puedeCerrarMutuo(dev: any): boolean {
    return ["iniciada", "envio_pendiente"].includes(dev.estado) && !dev.agencia_devolucion;
  }

  function AccionesDevolucion({ dev }: { dev: any }) {
    const cargando = procesando === dev.id;
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {dev.motivo_texto && (
          <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, padding: "10px 14px" }}>
            <p style={{ color: "#94a3b8", fontSize: 11, fontWeight: 700, marginBottom: 4 }}>💬 MOTIVO DEL TALLER</p>
            <p style={{ fontSize: 13, margin: 0 }}>{dev.motivo_texto}</p>
          </div>
        )}
        {dev.estado === "rechazada" && dev.motivo_rechazo && (
          <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171", padding: "10px 14px", borderRadius: 10, fontSize: 13, fontWeight: 700 }}>🚫 Rechazada: {dev.motivo_rechazo}</div>
        )}

        {/* Etiqueta + tracking */}
        {dev.agencia_devolucion && (
          <div style={{ background: "rgba(37,99,235,0.08)", border: "1px solid rgba(37,99,235,0.2)", borderRadius: 10, padding: "10px 14px", fontSize: 13 }}>
            <span style={{ color: "#94a3b8", fontWeight: 700, fontSize: 11 }}>🚚 ENVÍO DE VUELTA: </span>
            <strong style={{ color: "#60a5fa" }}>{dev.agencia_devolucion}</strong>
            {dev.codigo_transporte && <span style={{ marginLeft: 8, fontFamily: "monospace", color: "white", fontWeight: 700 }}>{dev.codigo_transporte}</span>}
            {dev.etiqueta_devolucion_url && (
              <a href={dev.etiqueta_devolucion_url} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 6, marginLeft: 12, background: "linear-gradient(135deg,#2563eb,#1d4ed8)", color: "white", padding: "6px 14px", borderRadius: 8, fontWeight: 700, fontSize: 12, textDecoration: "none" }}>📄 Descargar etiqueta</a>
            )}
          </div>
        )}

        <Timeline dev={dev} />

        {/* ── Selector de agencia — solicitante con devolución aceptada ── */}
        {!esProveedor && dev.estado === "envio_pendiente" && !dev.agencia_devolucion && (
          <div style={{ background: "rgba(251,191,36,0.06)", border: "1px solid rgba(251,191,36,0.25)", borderRadius: 12, padding: "14px 16px" }}>
            <p style={{ color: "#fbbf24", fontSize: 12, fontWeight: 800, marginBottom: 10 }}>📦 DEVOLUCIÓN ACEPTADA — Elige cómo enviar la pieza de vuelta</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
              {AGENCIAS.map(({ key, label, precio, color, textColor }) => (
                <button key={key} onClick={() => setAgenciaSeleccionada(key)} style={{ borderRadius: 12, padding: "10px 10px", cursor: "pointer", textAlign: "left", background: agenciaSeleccionada === key ? "rgba(37,99,235,0.08)" : "rgba(255,255,255,0.03)", border: agenciaSeleccionada === key ? "2px solid #2563eb" : "1px solid rgba(255,255,255,0.08)", color: "white", display: "flex", flexDirection: "column", gap: 4 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ background: color, color: textColor, fontWeight: 900, fontSize: 10, padding: "2px 7px", borderRadius: 4 }}>{label}</span>
                    <span style={{ fontWeight: 900, fontSize: 13, color: agenciaSeleccionada === key ? "#60a5fa" : "white" }}>{precio.toFixed(2)}€</span>
                  </div>
                  <p style={{ margin: 0, fontSize: 10, color: "#94a3b8" }}>Recogida en tu dirección</p>
                </button>
              ))}
            </div>
            <button onClick={() => crearEnvioAgencia(dev)} disabled={!agenciaSeleccionada || creandoEnvio} style={{ width: "100%", background: agenciaSeleccionada ? "linear-gradient(135deg,#f59e0b,#d97706)" : "rgba(255,255,255,0.05)", border: "none", color: agenciaSeleccionada ? "white" : "#94a3b8", padding: "12px 18px", borderRadius: 10, fontWeight: 800, cursor: agenciaSeleccionada ? "pointer" : "not-allowed", fontSize: 14, opacity: creandoEnvio ? 0.7 : 1 }}>
              {creandoEnvio ? "Creando envío..." : agenciaSeleccionada ? `🚚 Crear envío con ${agenciaSeleccionada}` : "Selecciona una agencia"}
            </button>
            <p style={{ color: "#94a3b8", fontSize: 11, marginTop: 8 }}>💡 Recibirás la etiqueta para pegarla en el paquete. La agencia recogerá en tu dirección.</p>
          </div>
        )}

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button onClick={() => abrirChat(dev)} style={{ background: "linear-gradient(135deg,#2563eb,#1d4ed8)", border: "none", color: "white", padding: "8px 16px", borderRadius: 10, fontWeight: 700, cursor: "pointer", fontSize: 13 }}>💬 Abrir chat</button>
          <button onClick={() => abrirContacto(dev)} style={{ background: "rgba(37,99,235,0.1)", border: "1px solid rgba(37,99,235,0.2)", color: "#60a5fa", padding: "8px 14px", borderRadius: 10, fontWeight: 700, cursor: "pointer", fontSize: 13 }}>👁 Ver contacto {esProveedor ? "taller" : "proveedor"}</button>

          {/* Cerrar de mutuo acuerdo */}
          {puedeCerrarMutuo(dev) && (
            <button onClick={() => cerrarMutuoAcuerdo(dev)} disabled={cargando} style={{ background: "rgba(22,163,74,0.1)", border: "1px solid rgba(22,163,74,0.25)", color: "#4ade80", padding: "8px 14px", borderRadius: 10, fontWeight: 700, cursor: "pointer", fontSize: 13, opacity: cargando ? 0.7 : 1 }}>🤝 Cerrar de mutuo acuerdo</button>
          )}

          {/* Solicitante: cancelar */}
          {!esProveedor && dev.estado === "iniciada" && (
            <button onClick={() => cancelarDevolucion(dev)} disabled={cargando} style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171", padding: "8px 14px", borderRadius: 10, fontWeight: 700, cursor: "pointer", fontSize: 13, opacity: cargando ? 0.7 : 1 }}>{cargando ? "Cancelando..." : "❌ Cancelar solicitud"}</button>
          )}

          {/* Proveedor actions */}
          {esProveedor && dev.estado === "iniciada" && (
            <>
              <button onClick={() => aceptarDevolucion(dev)} disabled={cargando} style={{ background: "linear-gradient(135deg,#16a34a,#15803d)", border: "none", color: "white", padding: "8px 16px", borderRadius: 10, fontWeight: 800, cursor: "pointer", fontSize: 13, opacity: cargando ? 0.7 : 1 }}>{cargando ? "Guardando..." : "✅ Aceptar"}</button>
              <button onClick={() => { setModalRechazo(dev); setMotivoRechazo(""); }} style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171", padding: "8px 14px", borderRadius: 10, fontWeight: 700, cursor: "pointer", fontSize: 13 }}>🚫 Rechazar</button>
              <button onClick={() => marcarGestionExterna(dev)} style={{ background: "rgba(232,121,249,0.1)", border: "1px solid rgba(232,121,249,0.25)", color: "#e879f9", padding: "8px 14px", borderRadius: 10, fontWeight: 700, cursor: "pointer", fontSize: 13 }}>🔁 Gestión externa</button>
            </>
          )}
          {esProveedor && dev.estado === "en_transito" && (
            <button onClick={() => marcarRecibida(dev)} disabled={cargando} style={{ background: "linear-gradient(135deg,#7c3aed,#6d28d9)", border: "none", color: "white", padding: "8px 16px", borderRadius: 10, fontWeight: 800, cursor: "pointer", fontSize: 13, opacity: cargando ? 0.7 : 1 }}>{cargando ? "Guardando..." : "📥 Marcar como recibida"}</button>
          )}
          {esProveedor && dev.estado === "recibida" && (
            <button onClick={() => finalizarDevolucion(dev)} disabled={cargando} style={{ background: "linear-gradient(135deg,#16a34a,#15803d)", border: "none", color: "white", padding: "8px 16px", borderRadius: 10, fontWeight: 800, cursor: "pointer", fontSize: 13, opacity: cargando ? 0.7 : 1 }}>{cargando ? "Guardando..." : "🏁 Finalizar"}</button>
          )}
        </div>
      </div>
    );
  }

  return (
    <main style={{ padding: isMobile ? "12px" : "clamp(16px,4vw,40px)", minHeight: "100vh", background: "linear-gradient(135deg,#020617,#020b2d)", color: "white" }}>
      <div style={{ marginBottom: isMobile ? 16 : 24 }}>
        <div style={{ display: "inline-block", padding: "6px 14px", borderRadius: 999, background: "rgba(37,99,235,0.18)", color: "#60a5fa", marginBottom: 10, fontWeight: 700, fontSize: 12 }}>PANEL TALLER</div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h1 style={{ fontSize: isMobile ? 28 : "clamp(28px,6vw,52px)", fontWeight: 900, lineHeight: 1 }}>DEVOLUCIONES</h1>
          <div style={{ display: "flex", gap: 10 }}>
            <div style={{ background: "rgba(15,23,42,0.92)", borderRadius: 14, padding: isMobile ? "10px 14px" : "14px 20px", border: "1px solid rgba(255,255,255,0.06)", textAlign: "center" }}>
              <p style={{ color: "#94a3b8", fontSize: 10, fontWeight: 700, marginBottom: 2 }}>ENVIADAS</p>
              <h2 style={{ fontSize: isMobile ? 20 : 32, fontWeight: 900, margin: 0 }}>{enviadas.length}</h2>
            </div>
            <div style={{ background: "rgba(15,23,42,0.92)", borderRadius: 14, padding: isMobile ? "10px 14px" : "14px 20px", border: "1px solid rgba(255,255,255,0.06)", textAlign: "center" }}>
              <p style={{ color: "#94a3b8", fontSize: 10, fontWeight: 700, marginBottom: 2 }}>RECIBIDAS</p>
              <h2 style={{ fontSize: isMobile ? 20 : 32, fontWeight: 900, margin: 0, color: recibidas.length > 0 ? "#22c55e" : "white" }}>{recibidas.length}</h2>
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 0, marginBottom: 16, background: "rgba(15,23,42,0.95)", borderRadius: 14, padding: 5, width: "fit-content", border: "1px solid rgba(255,255,255,0.06)" }}>
        <button onClick={() => { setPestañaActiva("enviadas"); setExpandida(null); setFiltroEstado("todos"); }} style={{ padding: isMobile ? "10px 18px" : "12px 28px", borderRadius: 10, fontWeight: 800, cursor: "pointer", fontSize: isMobile ? 13 : 15, border: "none", background: pestañaActiva === "enviadas" ? "linear-gradient(135deg,#2563eb,#1d4ed8)" : "transparent", color: pestañaActiva === "enviadas" ? "white" : "#94a3b8" }}>📤 Enviadas ({enviadas.length})</button>
        <button onClick={() => { setPestañaActiva("recibidas"); setExpandida(null); setFiltroEstado("todos"); }} style={{ padding: isMobile ? "10px 18px" : "12px 28px", borderRadius: 10, fontWeight: 800, cursor: "pointer", fontSize: isMobile ? 13 : 15, border: "none", background: pestañaActiva === "recibidas" ? "linear-gradient(135deg,#16a34a,#15803d)" : "transparent", color: pestañaActiva === "recibidas" ? "white" : "#94a3b8" }}>📥 Recibidas ({recibidas.length})</button>
      </div>

      <div style={{ background: pestañaActiva === "enviadas" ? "rgba(37,99,235,0.08)" : "rgba(22,163,74,0.08)", border: `1px solid ${pestañaActiva === "enviadas" ? "rgba(37,99,235,0.2)" : "rgba(22,163,74,0.2)"}`, borderRadius: 12, padding: "10px 16px", marginBottom: 16, fontSize: 13, color: pestañaActiva === "enviadas" ? "#60a5fa" : "#4ade80" }}>
        {pestañaActiva === "enviadas" ? "🛒 Devoluciones que has solicitado como comprador" : "🏭 Devoluciones que te han solicitado sobre tus piezas — actúas como vendedor"}
        {pendientesAccion > 0 && <strong style={{ marginLeft: 8, color: "#fbbf24" }}>⚡ {pendientesAccion} pendiente{pendientesAccion !== 1 ? "s" : ""} de acción</strong>}
      </div>

      <div style={{ background: "rgba(15,23,42,0.92)", borderRadius: isMobile ? 14 : 20, padding: isMobile ? "14px" : "20px 24px", marginBottom: 16, border: "1px solid rgba(255,255,255,0.06)", display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", background: "#0f172a", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: "0 12px", height: 42 }}>
          <span style={{ marginRight: 8 }}>🔍</span>
          <input placeholder="Buscar devolución, pedido o referencia..." value={busqueda} onChange={e => setBusqueda(e.target.value)} style={{ flex: 1, background: "transparent", border: "none", color: "white", fontSize: 14, outline: "none" }} />
          {busqueda && <button onClick={() => setBusqueda("")} style={{ background: "transparent", border: "none", color: "#94a3b8", cursor: "pointer" }}>✕</button>}
        </div>
        <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 2 }}>
          <button onClick={() => setFiltroEstado("todos")} style={{ padding: "6px 12px", borderRadius: 999, fontWeight: 700, cursor: "pointer", fontSize: 12, whiteSpace: "nowrap", flexShrink: 0, background: filtroEstado === "todos" ? "linear-gradient(135deg,#2563eb,#1d4ed8)" : "rgba(255,255,255,0.05)", border: filtroEstado === "todos" ? "none" : "1px solid rgba(255,255,255,0.08)", color: filtroEstado === "todos" ? "white" : "#94a3b8" }}>Todas ({contadores.todos})</button>
          {Object.entries(ESTADO_INFO).filter(([k]) => contadores[k] > 0).map(([key, info]) => (
            <button key={key} onClick={() => setFiltroEstado(key)} style={{ padding: "6px 12px", borderRadius: 999, fontWeight: 700, cursor: "pointer", fontSize: 12, whiteSpace: "nowrap", flexShrink: 0, background: filtroEstado === key ? "linear-gradient(135deg,#2563eb,#1d4ed8)" : "rgba(255,255,255,0.05)", border: filtroEstado === key ? "none" : "1px solid rgba(255,255,255,0.08)", color: filtroEstado === key ? "white" : "#94a3b8" }}>{info.emoji} ({contadores[key]})</button>
          ))}
        </div>
      </div>

      {devoluciones.length === 0 && (
        <div style={{ background: "rgba(15,23,42,0.92)", padding: "60px 20px", borderRadius: 20, textAlign: "center" }}>
          <p style={{ fontSize: 48, marginBottom: 16 }}>🔄</p>
          <h2 style={{ fontSize: 22, fontWeight: 900 }}>{pestañaActiva === "enviadas" ? "No has solicitado devoluciones" : "No has recibido solicitudes de devolución"}</h2>
          {pestañaActiva === "enviadas" && <button onClick={() => router.push("/dashboard/pedidos")} style={{ marginTop: 20, background: "linear-gradient(135deg,#2563eb,#1d4ed8)", border: "none", color: "white", padding: "14px 28px", borderRadius: 14, fontWeight: 800, cursor: "pointer" }}>VER MIS PEDIDOS</button>}
        </div>
      )}
      {devolucionesFiltradas.length === 0 && devoluciones.length > 0 && (
        <div style={{ padding: "30px", textAlign: "center", color: "#94a3b8" }}>Sin resultados para los filtros seleccionados</div>
      )}

      {/* MÓVIL */}
      {isMobile && devolucionesFiltradas.length > 0 && (
        <div style={{ display: "grid", gap: 10 }}>
          {devolucionesFiltradas.map(dev => {
            const abierta = expandida === dev.id;
            const tipo = TIPO_INFO[dev.tipo] || { label: dev.tipo, emoji: "•" };
            return (
              <div key={dev.id} style={{ background: "rgba(15,23,42,0.95)", borderRadius: 14, border: "1px solid rgba(255,255,255,0.06)", overflow: "hidden" }}>
                <div onClick={() => { setExpandida(abierta ? null : dev.id); setAgenciaSeleccionada(null); }} style={{ padding: "14px 16px", cursor: "pointer" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                    <div>
                      <p style={{ color: "#60a5fa", fontWeight: 800, fontSize: 14 }}>{dev.codigo}</p>
                      <p style={{ color: "#94a3b8", fontSize: 11, marginTop: 2 }}>Pedido {dev.pedido_codigo || `#${dev.pedido_id}`} · {new Date(dev.created_at).toLocaleDateString("es-ES")}</p>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <p style={{ color: "#22c55e", fontWeight: 900, fontSize: 16 }}>{fmt(dev.importe)}€</p>
                      <BadgeEstado estado={dev.estado} />
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8, fontSize: 12, flexWrap: "wrap", alignItems: "center" }}>
                    <span style={{ color: "#60a5fa", fontWeight: 700 }}>{dev.referencia}</span>
                    <span style={{ color: "#94a3b8" }}>{tipo.emoji} {tipo.label}</span>
                  </div>
                  <div style={{ marginTop: 6, textAlign: "right", color: "#64748b", fontSize: 11 }}>{abierta ? "▲ Cerrar" : "▼ Ver detalle"}</div>
                </div>
                {abierta && <div style={{ borderTop: "1px solid rgba(37,99,235,0.2)", background: "rgba(37,99,235,0.04)", padding: "14px 16px" }}><AccionesDevolucion dev={dev} /></div>}
              </div>
            );
          })}
        </div>
      )}

      {/* DESKTOP */}
      {!isMobile && devolucionesFiltradas.length > 0 && (
        <div style={{ background: "rgba(15,23,42,0.92)", borderRadius: 20, overflow: "hidden", border: "1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ display: "grid", gridTemplateColumns: GRID_COLS, gap: 12, padding: "12px 20px", background: "rgba(0,0,0,0.2)", color: "#94a3b8", fontSize: 12, fontWeight: 700 }}>{GRID_HEADERS.map(h => <div key={h}>{h}</div>)}</div>
          {devolucionesFiltradas.map(dev => {
            const abierta = expandida === dev.id;
            const tipo = TIPO_INFO[dev.tipo] || { label: dev.tipo, emoji: "•" };
            return (
              <React.Fragment key={dev.id}>
                <div onClick={() => { setExpandida(abierta ? null : dev.id); setAgenciaSeleccionada(null); }} style={{ display: "grid", gridTemplateColumns: GRID_COLS, gap: 12, padding: "14px 20px", borderTop: "1px solid rgba(255,255,255,0.04)", cursor: "pointer", background: abierta ? "rgba(37,99,235,0.05)" : "transparent", alignItems: "center" }}>
                  <div><div style={{ color: "#60a5fa", fontWeight: 700, fontSize: 13 }}>{dev.codigo}</div><div style={{ color: "#94a3b8", fontSize: 11, marginTop: 2 }}>{new Date(dev.created_at).toLocaleDateString("es-ES")}</div></div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#94a3b8" }}>{dev.pedido_codigo || `#${dev.pedido_id}`}</div>
                  <div><div style={{ fontWeight: 700, fontSize: 13, color: "#60a5fa" }}>{dev.referencia || "-"}</div><div style={{ color: "#94a3b8", fontSize: 11, marginTop: 2 }}>{(dev.descripcion || "").substring(0, 28)}{dev.cantidad > 1 ? ` ×${dev.cantidad}` : ""}</div></div>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>{esProveedor ? (dev.solicitante_nombre || "-") : (dev.proveedor_nombre || "-")}</div>
                  <div style={{ color: "#22c55e", fontWeight: 900, fontSize: 15 }}>{fmt(dev.importe)}€</div>
                  <div style={{ fontSize: 12, color: "#94a3b8", fontWeight: 700 }}>{tipo.emoji} {tipo.label}</div>
                  <div><BadgeEstado estado={dev.estado} /></div>
                  <div><button onClick={e => { e.stopPropagation(); setExpandida(abierta ? null : dev.id); setAgenciaSeleccionada(null); }} style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)", color: "white", padding: "6px 14px", borderRadius: 8, cursor: "pointer", fontWeight: 700, fontSize: 12 }}>{abierta ? "▲ Cerrar" : "▼ Ver"}</button></div>
                </div>
                {abierta && <div style={{ borderTop: "1px solid rgba(37,99,235,0.2)", background: "rgba(37,99,235,0.04)", borderLeft: "3px solid #2563eb", padding: "20px 24px" }}><AccionesDevolucion dev={dev} /></div>}
              </React.Fragment>
            );
          })}
        </div>
      )}

      {/* MODAL RECHAZO */}
      {modalRechazo && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 99999, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div style={{ background: "#0f172a", borderRadius: 20, padding: "clamp(20px,4vw,36px)", width: "min(480px,92vw)", border: "1px solid rgba(255,255,255,0.1)" }}>
            <h2 style={{ fontSize: 20, fontWeight: 900, marginBottom: 8 }}>🚫 Rechazar devolución</h2>
            <p style={{ color: "#94a3b8", fontSize: 14, marginBottom: 20 }}>Devolución <strong style={{ color: "white" }}>{modalRechazo.codigo}</strong></p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
              {MOTIVOS_RECHAZO.map(motivo => (
                <button key={motivo} onClick={() => setMotivoRechazo(motivo)} style={{ padding: "12px 16px", borderRadius: 10, textAlign: "left", fontWeight: 700, fontSize: isMobile ? 13 : 14, cursor: "pointer", background: motivoRechazo === motivo ? "rgba(239,68,68,0.2)" : "rgba(255,255,255,0.05)", border: motivoRechazo === motivo ? "2px solid rgba(239,68,68,0.5)" : "1px solid rgba(255,255,255,0.08)", color: motivoRechazo === motivo ? "#f87171" : "white" }}>{motivo}</button>
              ))}
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setModalRechazo(null)} style={{ flex: 1, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#94a3b8", padding: "12px", borderRadius: 12, cursor: "pointer", fontWeight: 700 }}>Cancelar</button>
              <button onClick={confirmarRechazo} disabled={!motivoRechazo} style={{ flex: 1, background: motivoRechazo ? "linear-gradient(135deg,#dc2626,#991b1b)" : "rgba(255,255,255,0.05)", border: "none", color: motivoRechazo ? "white" : "#94a3b8", padding: "12px", borderRadius: 12, cursor: motivoRechazo ? "pointer" : "not-allowed", fontWeight: 900 }}>Confirmar rechazo</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CONTACTO */}
      {modalContacto && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 99999, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }} onClick={() => setModalContacto(null)}>
          <div style={{ background: "#0f172a", borderRadius: 24, padding: "clamp(20px,4vw,36px)", width: "min(480px,92vw)", border: "1px solid rgba(255,255,255,0.1)" }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <h2 style={{ fontSize: 20, fontWeight: 900, margin: 0 }}>👤 Datos de contacto</h2>
              <button onClick={() => setModalContacto(null)} style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: 20 }}>✕</button>
            </div>
            <div style={{ background: "rgba(37,99,235,0.08)", border: "1px solid rgba(37,99,235,0.2)", borderRadius: 10, padding: "6px 14px", marginBottom: 20, display: "inline-block" }}>
              <span style={{ color: "#60a5fa", fontSize: 13, fontWeight: 700 }}>Devolución {modalContacto.codigo}</span>
            </div>
            {!datosContacto ? (
              <div style={{ textAlign: "center", padding: "30px 0", color: "#94a3b8" }}>Cargando datos...</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {[
                  { label: "Empresa", value: datosContacto.nombre_empresa },
                  { label: "CIF", value: datosContacto.cif },
                  { label: "Email", value: datosContacto.email, href: `mailto:${datosContacto.email}` },
                  { label: "Teléfono", value: datosContacto.telefono, href: `tel:${datosContacto.telefono}` },
                  { label: "Dirección", value: datosContacto.direccion },
                  { label: "Ciudad", value: datosContacto.ciudad },
                  { label: "CP", value: datosContacto.codigo_postal },
                ].filter(f => f.value).map(({ label, value, href }: any) => (
                  <div key={label} style={{ display: "flex", gap: 12, alignItems: "center", padding: "10px 14px", background: "rgba(255,255,255,0.03)", borderRadius: 10 }}>
                    <span style={{ color: "#94a3b8", fontSize: 13, width: 80, flexShrink: 0 }}>{label}</span>
                    {href ? <a href={href} style={{ color: "#60a5fa", fontWeight: 700, fontSize: 14, textDecoration: "none" }}>{value}</a> : <span style={{ fontWeight: 700, fontSize: 14 }}>{value}</span>}
                  </div>
                ))}
              </div>
            )}
            <button onClick={() => setModalContacto(null)} style={{ width: "100%", marginTop: 20, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#94a3b8", padding: "12px", borderRadius: 12, cursor: "pointer", fontWeight: 700 }}>Cerrar</button>
          </div>
        </div>
      )}
    </main>
  );
}