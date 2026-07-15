"use client";

// SeccionDevoluciones.tsx — Panel del proveedor
// ⚠️ Ajusta la ruta del import de supabase para que coincida con la que usa
// el fichero del panel donde lo montes (p.ej. SeccionPedidos.tsx).
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
  arrepentimiento: { label: "Ya no lo necesita", emoji: "🔄" },
  pieza_incorrecta: { label: "Pieza incorrecta", emoji: "❓" },
  rotura_desperfecto: { label: "Rotura / desperfecto", emoji: "💥" },
  otro: { label: "Otro motivo", emoji: "✍️" },
};

const MOTIVOS_RECHAZO = [
  "⏱️ Fuera del plazo de devolución",
  "🔧 La pieza ha sido montada o manipulada",
  "📦 Falta el embalaje original",
  "💥 El desperfecto no es de origen",
  "✍️ Otro (detallar por chat)",
];

async function notificarDevolucion(evento: string, devolucion: any) {
  try {
    await fetch("/api/send-devolucion", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ evento, devolucion }),
    });
  } catch (e) {
    console.error("Error enviando notificación de devolución:", e);
  }
}

export default function SeccionDevoluciones({ isMobile = false }: { isMobile?: boolean }) {
  const router = useRouter();
  const [devoluciones, setDevoluciones] = useState<any[]>([]);
  const [filtroEstado, setFiltroEstado] = useState("pendientes");
  const [expandida, setExpandida] = useState<number | null>(null);
  const [procesando, setProcesando] = useState<number | null>(null);
  const [modalRechazo, setModalRechazo] = useState<any | null>(null);
  const [motivoRechazo, setMotivoRechazo] = useState("");

  useEffect(() => {
    cargarDevoluciones();
    const channel = supabase.channel("devoluciones-proveedor-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "devoluciones" }, () => cargarDevoluciones())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  async function cargarDevoluciones() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from("devoluciones").select("*").eq("proveedor_id", user.id).order("id", { ascending: false });
    setDevoluciones(data || []);
  }

  function fmt(n: any) {
    return Number(Number(n).toFixed(2)).toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  async function actualizarDevolucion(dev: any, cambios: Record<string, any>, evento: string) {
    setProcesando(dev.id);
    const { error } = await supabase.from("devoluciones").update({ ...cambios, updated_at: new Date().toISOString() }).eq("id", dev.id);
    if (error) {
      alert("Error al actualizar la devolución: " + error.message);
      setProcesando(null);
      return;
    }
    await notificarDevolucion(evento, { ...dev, ...cambios });
    setProcesando(null);
    cargarDevoluciones();
  }

  async function aceptarDevolucion(dev: any) {
    await actualizarDevolucion(dev, { estado: "envio_pendiente", fecha_aceptada: new Date().toISOString() }, "aceptada");
  }

  async function confirmarRechazo() {
    if (!modalRechazo || !motivoRechazo) return;
    const dev = modalRechazo;
    setModalRechazo(null);
    await actualizarDevolucion(dev, { estado: "rechazada", motivo_rechazo: motivoRechazo, fecha_rechazada: new Date().toISOString() }, "rechazada");
    setMotivoRechazo("");
  }

  async function marcarGestionExterna(dev: any) {
    if (!confirm("¿Marcar como gestión externa? La devolución se gestionará fuera de la plataforma y quedará solo como registro.")) return;
    await actualizarDevolucion(dev, { estado: "gestion_externa" }, "gestion_externa");
  }

  async function marcarRecibida(dev: any) {
    await actualizarDevolucion(dev, { estado: "recibida", fecha_recibida: new Date().toISOString() }, "recibida");
  }

  async function finalizarDevolucion(dev: any) {
    if (!confirm(`¿Finalizar la devolución ${dev.codigo}? Confirma que el abono al taller queda gestionado.`)) return;
    await actualizarDevolucion(dev, { estado: "finalizada", fecha_finalizada: new Date().toISOString() }, "finalizada");
  }

  async function abrirChat(dev: any) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: convExistente } = await supabase.from("conversaciones").select("id").eq("pedido_id", dev.pedido_id).maybeSingle();
    if (convExistente) { router.push(`/chat?conv=${convExistente.id}`); return; }
    const { data: nuevaConv, error } = await supabase.from("conversaciones").insert({ user1_id: user.id, user2_id: dev.solicitante_id, pedido_id: dev.pedido_id, referencia: `Devolución ${dev.codigo} — Pedido ${dev.pedido_codigo || "#" + dev.pedido_id}`, ultimo_mensaje: "", updated_at: new Date().toISOString() }).select("id").single();
    if (!error && nuevaConv) router.push(`/chat?conv=${nuevaConv.id}`);
    else alert("Error al abrir el chat");
  }

  const pendientes = devoluciones.filter(d => ["iniciada", "en_transito", "recibida"].includes(d.estado));

  const devolucionesFiltradas = devoluciones.filter(d => {
    if (filtroEstado === "todas") return true;
    if (filtroEstado === "pendientes") return ["iniciada", "en_transito", "recibida"].includes(d.estado);
    return d.estado === filtroEstado;
  });

  const contadores: Record<string, number> = { todas: devoluciones.length, pendientes: pendientes.length };
  Object.keys(ESTADO_INFO).forEach(e => { contadores[e] = devoluciones.filter(d => d.estado === e).length; });

  function BadgeEstado({ estado }: { estado: string }) {
    const info = ESTADO_INFO[estado] || { label: estado, color: "#94a3b8", emoji: "•" };
    return <span style={{ color: info.color, fontWeight: 700, fontSize: 11, background: `${info.color}22`, padding: "3px 9px", borderRadius: 999, whiteSpace: "nowrap" }}>{info.emoji} {info.label.toUpperCase()}</span>;
  }

  return (
    <div style={{ background: "rgba(15,23,42,0.92)", borderRadius: isMobile ? 14 : 20, padding: isMobile ? "14px" : "20px 24px", border: "1px solid rgba(255,255,255,0.06)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexWrap: "wrap", gap: 10 }}>
        <h2 style={{ fontSize: isMobile ? 18 : 22, fontWeight: 900, margin: 0 }}>
          🔄 DEVOLUCIONES
          {pendientes.length > 0 && (
            <span style={{ marginLeft: 10, background: "linear-gradient(135deg,#dc2626,#991b1b)", color: "white", fontSize: 12, fontWeight: 900, padding: "3px 10px", borderRadius: 999, verticalAlign: "middle" }}>{pendientes.length}</span>
          )}
        </h2>
        <div style={{ display: "flex", gap: 6, overflowX: "auto" }}>
          {[
            { key: "pendientes", label: `⚡ Pendientes (${contadores.pendientes})` },
            { key: "todas", label: `Todas (${contadores.todas})` },
            { key: "finalizada", label: `🏁 (${contadores.finalizada})` },
            { key: "rechazada", label: `🚫 (${contadores.rechazada})` },
          ].map(({ key, label }) => (
            <button key={key} onClick={() => setFiltroEstado(key)} style={{ padding: "6px 12px", borderRadius: 999, fontWeight: 700, cursor: "pointer", fontSize: 12, whiteSpace: "nowrap", flexShrink: 0, background: filtroEstado === key ? "linear-gradient(135deg,#2563eb,#1d4ed8)" : "rgba(255,255,255,0.05)", border: filtroEstado === key ? "none" : "1px solid rgba(255,255,255,0.08)", color: filtroEstado === key ? "white" : "#94a3b8" }}>{label}</button>
          ))}
        </div>
      </div>

      {devolucionesFiltradas.length === 0 && (
        <div style={{ padding: "30px 20px", textAlign: "center", color: "#94a3b8" }}>
          {filtroEstado === "pendientes" ? "✅ No tienes devoluciones pendientes de gestionar" : "Sin devoluciones en este filtro"}
        </div>
      )}

      <div style={{ display: "grid", gap: 10 }}>
        {devolucionesFiltradas.map(dev => {
          const abierta = expandida === dev.id;
          const cargando = procesando === dev.id;
          const tipo = TIPO_INFO[dev.tipo] || { label: dev.tipo, emoji: "•" };
          return (
            <div key={dev.id} style={{ background: "rgba(2,6,23,0.5)", borderRadius: 14, border: dev.estado === "iniciada" ? "1px solid rgba(245,158,11,0.35)" : "1px solid rgba(255,255,255,0.06)", overflow: "hidden" }}>
              <div onClick={() => setExpandida(abierta ? null : dev.id)} style={{ padding: "14px 16px", cursor: "pointer" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, flexWrap: "wrap" }}>
                  <div>
                    <p style={{ color: "#60a5fa", fontWeight: 800, fontSize: 14, margin: 0 }}>{dev.codigo} <span style={{ color: "#94a3b8", fontWeight: 700, fontSize: 12 }}>· Pedido {dev.pedido_codigo || `#${dev.pedido_id}`}</span></p>
                    <p style={{ fontSize: 13, margin: 0, marginTop: 4 }}>
                      <strong style={{ color: "#60a5fa" }}>{dev.referencia}</strong>
                      <span style={{ color: "#94a3b8", marginLeft: 8 }}>{(dev.descripcion || "").substring(0, 32)}{dev.cantidad > 1 ? ` ×${dev.cantidad}` : ""}</span>
                    </p>
                    <p style={{ color: "#94a3b8", fontSize: 12, margin: 0, marginTop: 4 }}>🔧 {dev.solicitante_nombre || "-"} · {tipo.emoji} {tipo.label} · {new Date(dev.created_at).toLocaleDateString("es-ES")}</p>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <p style={{ color: "#22c55e", fontWeight: 900, fontSize: 16, margin: 0, marginBottom: 4 }}>{fmt(dev.importe)}€</p>
                    <BadgeEstado estado={dev.estado} />
                  </div>
                </div>
                <div style={{ marginTop: 6, textAlign: "right", color: "#64748b", fontSize: 11 }}>{abierta ? "▲ Cerrar" : "▼ Gestionar"}</div>
              </div>

              {abierta && (
                <div style={{ borderTop: "1px solid rgba(37,99,235,0.2)", background: "rgba(37,99,235,0.04)", padding: "14px 16px", display: "flex", flexDirection: "column", gap: 12 }}>
                  {dev.motivo_texto && (
                    <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, padding: "10px 14px" }}>
                      <p style={{ color: "#94a3b8", fontSize: 11, fontWeight: 700, marginBottom: 4 }}>💬 MOTIVO DEL TALLER</p>
                      <p style={{ fontSize: 13, margin: 0 }}>{dev.motivo_texto}</p>
                    </div>
                  )}
                  {dev.agencia_devolucion && (
                    <div style={{ background: "rgba(37,99,235,0.08)", border: "1px solid rgba(37,99,235,0.2)", borderRadius: 10, padding: "10px 14px", fontSize: 13 }}>
                      <span style={{ color: "#94a3b8", fontWeight: 700, fontSize: 11 }}>🚚 ENVÍO DE VUELTA: </span>
                      <strong style={{ color: "#60a5fa" }}>{dev.agencia_devolucion}</strong>
                      {dev.codigo_transporte && <span style={{ marginLeft: 8, fontFamily: "monospace", color: "white", fontWeight: 700 }}>{dev.codigo_transporte}</span>}
                    </div>
                  )}
                  {dev.estado === "rechazada" && dev.motivo_rechazo && (
                    <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171", padding: "10px 14px", borderRadius: 10, fontSize: 13, fontWeight: 700 }}>🚫 Rechazada: {dev.motivo_rechazo}</div>
                  )}

                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <button onClick={() => abrirChat(dev)} style={{ background: "linear-gradient(135deg,#2563eb,#1d4ed8)", border: "none", color: "white", padding: "8px 16px", borderRadius: 10, fontWeight: 700, cursor: "pointer", fontSize: 13 }}>💬 Abrir chat</button>
                    {dev.estado === "iniciada" && (
                      <>
                        <button onClick={() => aceptarDevolucion(dev)} disabled={cargando} style={{ background: "linear-gradient(135deg,#16a34a,#15803d)", border: "none", color: "white", padding: "8px 16px", borderRadius: 10, fontWeight: 800, cursor: "pointer", fontSize: 13, opacity: cargando ? 0.7 : 1 }}>{cargando ? "Guardando..." : "✅ Aceptar"}</button>
                        <button onClick={() => { setModalRechazo(dev); setMotivoRechazo(""); }} style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171", padding: "8px 14px", borderRadius: 10, fontWeight: 700, cursor: "pointer", fontSize: 13 }}>🚫 Rechazar</button>
                        <button onClick={() => marcarGestionExterna(dev)} style={{ background: "rgba(232,121,249,0.1)", border: "1px solid rgba(232,121,249,0.25)", color: "#e879f9", padding: "8px 14px", borderRadius: 10, fontWeight: 700, cursor: "pointer", fontSize: 13 }}>🔁 Gestión externa</button>
                      </>
                    )}
                    {dev.estado === "en_transito" && (
                      <button onClick={() => marcarRecibida(dev)} disabled={cargando} style={{ background: "linear-gradient(135deg,#7c3aed,#6d28d9)", border: "none", color: "white", padding: "8px 16px", borderRadius: 10, fontWeight: 800, cursor: "pointer", fontSize: 13, opacity: cargando ? 0.7 : 1 }}>{cargando ? "Guardando..." : "📥 Marcar como recibida"}</button>
                    )}
                    {dev.estado === "recibida" && (
                      <button onClick={() => finalizarDevolucion(dev)} disabled={cargando} style={{ background: "linear-gradient(135deg,#16a34a,#15803d)", border: "none", color: "white", padding: "8px 16px", borderRadius: 10, fontWeight: 800, cursor: "pointer", fontSize: 13, opacity: cargando ? 0.7 : 1 }}>{cargando ? "Guardando..." : "🏁 Finalizar"}</button>
                    )}
                  </div>
                  {dev.estado === "recibida" && (
                    <p style={{ color: "#94a3b8", fontSize: 12, margin: 0 }}>💡 Al finalizar confirmas que el abono al taller queda gestionado entre las partes.</p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* MODAL RECHAZO */}
      {modalRechazo && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 99999, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div style={{ background: "#0f172a", borderRadius: 20, padding: "clamp(20px,4vw,36px)", width: "min(480px,92vw)", border: "1px solid rgba(255,255,255,0.1)" }}>
            <h2 style={{ fontSize: 20, fontWeight: 900, marginBottom: 8 }}>🚫 Rechazar devolución</h2>
            <p style={{ color: "#94a3b8", fontSize: 14, marginBottom: 20 }}>Devolución <strong style={{ color: "white" }}>{modalRechazo.codigo}</strong> — {modalRechazo.referencia}</p>
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
    </div>
  );
}