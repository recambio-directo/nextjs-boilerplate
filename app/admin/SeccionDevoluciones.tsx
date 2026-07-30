import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";
import { searchInput } from "./types";

const ESTADO_INFO: Record<string, { label: string; color: string; emoji: string }> = {
  iniciada:        { label: "Iniciada",        color: "#f59e0b", emoji: "⏳" },
  aceptada:        { label: "Aceptada",        color: "#4ade80", emoji: "✅" },
  envio_pendiente: { label: "Envío pendiente", color: "#fbbf24", emoji: "📦" },
  en_transito:     { label: "En tránsito",     color: "#60a5fa", emoji: "🚚" },
  recibida:        { label: "Recibida",        color: "#a78bfa", emoji: "📥" },
  finalizada:      { label: "Finalizada",      color: "#22c55e", emoji: "🏁" },
  rechazada:       { label: "Rechazada",       color: "#f87171", emoji: "🚫" },
  cancelada:       { label: "Cancelada",       color: "#94a3b8", emoji: "❌" },
  gestion_externa: { label: "Gestión externa", color: "#e879f9", emoji: "🔁" },
};

const TIPO_INFO: Record<string, { label: string; emoji: string }> = {
  arrepentimiento:    { label: "Ya no lo necesito",   emoji: "🔄" },
  pieza_incorrecta:   { label: "Pieza incorrecta",    emoji: "❓" },
  rotura_desperfecto: { label: "Rotura / desperfecto", emoji: "💥" },
  otro:               { label: "Otro motivo",          emoji: "✍️" },
};

export default function SeccionDevoluciones() {
  const router = useRouter();
  const [devoluciones, setDevoluciones] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("todos");
  const [expandida, setExpandida] = useState<number | null>(null);

  useEffect(() => { cargarDevoluciones(); }, []);

  async function cargarDevoluciones() {
    setCargando(true);
    const res = await fetch("/api/admin/devoluciones");
    const data = await res.json();
    setDevoluciones(data || []);
    setCargando(false);
  }

  function fmt(n: any) { return Number(Number(n).toFixed(2)).toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
  function fmtFecha(f: string | null) { return f ? new Date(f).toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "-"; }

  async function cambiarEstado(dev: any, nuevoEstado: string) {
    if (!confirm(`¿Cambiar estado de ${dev.codigo} a "${ESTADO_INFO[nuevoEstado]?.label || nuevoEstado}"?`)) return;
    await supabase.from("devoluciones").update({ estado: nuevoEstado, updated_at: new Date().toISOString() }).eq("id", dev.id);
    cargarDevoluciones();
  }

  async function eliminarDevolucion(dev: any) {
    if (!confirm(`¿Eliminar la devolución ${dev.codigo}? Esta acción no se puede deshacer.`)) return;
    await supabase.from("devoluciones").delete().eq("id", dev.id);
    setDevoluciones(prev => prev.filter(d => d.id !== dev.id));
    if (expandida === dev.id) setExpandida(null);
  }

  const devolucionesFiltradas = devoluciones.filter(d => {
    if (filtroEstado !== "todos" && d.estado !== filtroEstado) return false;
    if (busqueda) {
      const q = busqueda.toLowerCase();
      return (d.codigo || "").toLowerCase().includes(q) || (d.pedido_codigo || "").toLowerCase().includes(q) || (d.referencia || "").toLowerCase().includes(q) || (d.solicitante_nombre || "").toLowerCase().includes(q) || (d.proveedor_nombre || "").toLowerCase().includes(q);
    }
    return true;
  });

  const contadores: Record<string, number> = { todos: devoluciones.length };
  Object.keys(ESTADO_INFO).forEach(e => { contadores[e] = devoluciones.filter(d => d.estado === e).length; });

  function BadgeEstado({ estado }: { estado: string }) {
    const info = ESTADO_INFO[estado] || { label: estado, color: "#94a3b8", emoji: "•" };
    return <span style={{ color: info.color, fontWeight: 700, fontSize: 11, background: `${info.color}22`, padding: "3px 8px", borderRadius: 999, whiteSpace: "nowrap" as const }}>{info.emoji} {info.label}</span>;
  }

  return (
    <div>
      <h1 style={{ fontSize: 56, fontWeight: 900, lineHeight: 1, marginBottom: 12 }}>DEVOLUCIONES</h1>
      <p style={{ color: "#94a3b8", fontSize: 18, marginBottom: 36 }}>Todas las devoluciones de la plataforma.</p>

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 28 }}>
        {[
          { label: "TOTAL", valor: devoluciones.length, color: "white" },
          { label: "PENDIENTES", valor: devoluciones.filter(d => ["iniciada", "envio_pendiente", "en_transito", "recibida"].includes(d.estado)).length, color: "#f59e0b" },
          { label: "FINALIZADAS", valor: contadores.finalizada || 0, color: "#22c55e" },
          { label: "RECHAZADAS", valor: contadores.rechazada || 0, color: "#f87171" },
        ].map(({ label, valor, color }) => (
          <div key={label} style={{ background: "rgba(15,23,42,0.95)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 16, padding: "20px 24px" }}>
            <p style={{ color: "#94a3b8", fontSize: 11, fontWeight: 700, marginBottom: 8 }}>{label}</p>
            <h2 style={{ fontSize: 36, fontWeight: 900, margin: 0, color }}>{valor}</h2>
          </div>
        ))}
      </div>

      {/* FILTROS */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" as const, alignItems: "center" }}>
        <input placeholder="Buscar devolución, taller, proveedor..." value={busqueda} onChange={e => setBusqueda(e.target.value)} style={{ ...searchInput, minWidth: 280 }} />
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" as const }}>
          <button onClick={() => setFiltroEstado("todos")} style={{ padding: "7px 12px", borderRadius: 999, fontWeight: 700, cursor: "pointer", fontSize: 12, background: filtroEstado === "todos" ? "rgba(37,99,235,0.3)" : "rgba(255,255,255,0.05)", border: filtroEstado === "todos" ? "1px solid rgba(37,99,235,0.5)" : "1px solid rgba(255,255,255,0.08)", color: filtroEstado === "todos" ? "#60a5fa" : "#94a3b8" }}>Todas ({devoluciones.length})</button>
          {Object.entries(ESTADO_INFO).filter(([k]) => contadores[k] > 0).map(([key, info]) => (
            <button key={key} onClick={() => setFiltroEstado(key)} style={{ padding: "7px 12px", borderRadius: 999, fontWeight: 700, cursor: "pointer", fontSize: 12, background: filtroEstado === key ? "rgba(37,99,235,0.3)" : "rgba(255,255,255,0.05)", border: filtroEstado === key ? "1px solid rgba(37,99,235,0.5)" : "1px solid rgba(255,255,255,0.08)", color: filtroEstado === key ? "#60a5fa" : "#94a3b8" }}>{info.emoji} {info.label} ({contadores[key]})</button>
          ))}
        </div>
        <span style={{ color: "#94a3b8", fontSize: 13 }}>{devolucionesFiltradas.length} resultado{devolucionesFiltradas.length !== 1 ? "s" : ""}</span>
      </div>

      {/* TABLA */}
      {cargando ? (
        <div style={{ padding: 40, textAlign: "center", color: "#94a3b8" }}>Cargando...</div>
      ) : devolucionesFiltradas.length === 0 ? (
        <div style={{ padding: "60px 20px", textAlign: "center", color: "#94a3b8", background: "rgba(15,23,42,0.95)", borderRadius: 16, border: "1px solid rgba(255,255,255,0.06)" }}>
          <p style={{ fontSize: 48, marginBottom: 12 }}>🔄</p>
          <p style={{ fontSize: 18, fontWeight: 700 }}>No hay devoluciones</p>
        </div>
      ) : (
        <div style={{ background: "rgba(15,23,42,0.95)", borderRadius: 20, overflow: "hidden", border: "1px solid rgba(255,255,255,0.06)" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" as const }}>
            <thead>
              <tr style={{ background: "rgba(0,0,0,0.2)" }}>
                {["CÓDIGO", "PEDIDO", "TALLER", "PROVEEDOR", "REFERENCIA", "IMPORTE", "TIPO", "ESTADO", "FECHA", "ACCIONES"].map(h => (
                  <th key={h} style={{ padding: "12px 14px", textAlign: "left" as const, color: "#94a3b8", fontSize: 11, fontWeight: 700, borderBottom: "1px solid rgba(255,255,255,0.06)", whiteSpace: "nowrap" as const }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {devolucionesFiltradas.map(dev => {
                const abierta = expandida === dev.id;
                const tipo = TIPO_INFO[dev.tipo] || { label: dev.tipo, emoji: "•" };
                return (
                  <React.Fragment key={dev.id}>
                    <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.04)", cursor: "pointer", background: abierta ? "rgba(37,99,235,0.05)" : "transparent" }} onClick={() => setExpandida(abierta ? null : dev.id)}>
                      <td style={{ padding: "12px 14px", fontSize: 13 }}><span style={{ color: "#60a5fa", fontWeight: 700 }}>{dev.codigo}</span></td>
                      <td style={{ padding: "12px 14px", fontSize: 13, color: "#94a3b8" }}>{dev.pedido_codigo || `#${dev.pedido_id}`}</td>
                      <td style={{ padding: "12px 14px", fontSize: 13, fontWeight: 600 }}>{dev.solicitante_nombre || "-"}</td>
                      <td style={{ padding: "12px 14px", fontSize: 13, fontWeight: 600 }}>{dev.proveedor_nombre || "-"}</td>
                      <td style={{ padding: "12px 14px", fontSize: 13 }}><span style={{ color: "#60a5fa", fontWeight: 700 }}>{dev.referencia || "-"}</span></td>
                      <td style={{ padding: "12px 14px", fontSize: 14, color: "#22c55e", fontWeight: 900 }}>{fmt(dev.importe)}€</td>
                      <td style={{ padding: "12px 14px", fontSize: 12, color: "#94a3b8" }}>{tipo.emoji} {tipo.label}</td>
                      <td style={{ padding: "12px 14px" }}><BadgeEstado estado={dev.estado} /></td>
                      <td style={{ padding: "12px 14px", fontSize: 12, color: "#94a3b8" }}>{fmtFecha(dev.created_at)}</td>
                      <td style={{ padding: "12px 14px" }}>
                        <div style={{ display: "flex", gap: 6 }}>
                          <button onClick={e => { e.stopPropagation(); setExpandida(abierta ? null : dev.id); }} style={{ background: "rgba(37,99,235,0.15)", border: "none", color: "#60a5fa", padding: "5px 10px", borderRadius: 6, cursor: "pointer", fontWeight: 700, fontSize: 11 }}>{abierta ? "▲" : "▼ Ver"}</button>
                          <button onClick={e => { e.stopPropagation(); eliminarDevolucion(dev); }} style={{ background: "rgba(239,68,68,0.1)", border: "none", color: "#f87171", padding: "5px 8px", borderRadius: 6, cursor: "pointer", fontSize: 11 }}>🗑️</button>
                        </div>
                      </td>
                    </tr>
                    {abierta && (
                      <tr>
                        <td colSpan={10} style={{ padding: 0 }}>
                          <div style={{ background: "rgba(37,99,235,0.04)", borderLeft: "3px solid #2563eb", padding: "20px 24px", display: "flex", flexDirection: "column", gap: 16 }}>

                            {/* INFO DETALLADA */}
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                              <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 10, padding: "12px 16px" }}>
                                <p style={{ color: "#94a3b8", fontSize: 11, fontWeight: 700, marginBottom: 6 }}>🛒 TALLER (SOLICITANTE)</p>
                                <p style={{ fontWeight: 700, fontSize: 14, margin: 0 }}>{dev.solicitante_nombre || "-"}</p>
                                <p style={{ color: "#94a3b8", fontSize: 12, margin: "4px 0 0" }}>{dev.solicitante_email || "-"}</p>
                              </div>
                              <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 10, padding: "12px 16px" }}>
                                <p style={{ color: "#94a3b8", fontSize: 11, fontWeight: 700, marginBottom: 6 }}>🏭 PROVEEDOR</p>
                                <p style={{ fontWeight: 700, fontSize: 14, margin: 0 }}>{dev.proveedor_nombre || "-"}</p>
                                <p style={{ color: "#94a3b8", fontSize: 12, margin: "4px 0 0" }}>{dev.proveedor_email || "-"}</p>
                              </div>
                              <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 10, padding: "12px 16px" }}>
                                <p style={{ color: "#94a3b8", fontSize: 11, fontWeight: 700, marginBottom: 6 }}>📦 PIEZA</p>
                                <p style={{ fontWeight: 700, fontSize: 14, color: "#60a5fa", margin: 0 }}>{dev.referencia || "-"}</p>
                                <p style={{ color: "#94a3b8", fontSize: 12, margin: "4px 0 0" }}>{dev.descripcion || ""}{dev.cantidad > 1 ? ` ×${dev.cantidad}` : ""}</p>
                              </div>
                            </div>

                            {/* MOTIVO */}
                            {dev.motivo_texto && (
                              <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, padding: "12px 16px" }}>
                                <p style={{ color: "#94a3b8", fontSize: 11, fontWeight: 700, marginBottom: 4 }}>💬 MOTIVO DEL TALLER</p>
                                <p style={{ fontSize: 13, margin: 0 }}>{dev.motivo_texto}</p>
                              </div>
                            )}

                            {/* RECHAZO */}
                            {dev.motivo_rechazo && (
                              <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 10, padding: "12px 16px", color: "#f87171", fontWeight: 700, fontSize: 13 }}>
                                🚫 Rechazada: {dev.motivo_rechazo}
                              </div>
                            )}

                            {/* ENVÍO */}
                            {dev.agencia_devolucion && (
                              <div style={{ background: "rgba(37,99,235,0.08)", border: "1px solid rgba(37,99,235,0.2)", borderRadius: 10, padding: "12px 16px", fontSize: 13 }}>
                                <span style={{ color: "#94a3b8", fontWeight: 700, fontSize: 11 }}>🚚 ENVÍO: </span>
                                <strong style={{ color: "#60a5fa" }}>{dev.agencia_devolucion}</strong>
                                {dev.codigo_transporte && <span style={{ marginLeft: 8, fontFamily: "monospace", fontWeight: 700 }}>{dev.codigo_transporte}</span>}
                                {dev.etiqueta_devolucion_url && <a href={dev.etiqueta_devolucion_url} target="_blank" rel="noopener noreferrer" style={{ marginLeft: 12, color: "#60a5fa", fontWeight: 700, fontSize: 12 }}>📄 Ver etiqueta</a>}
                              </div>
                            )}

                            {/* FECHAS */}
                            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" as const }}>
                              {[
                                { label: "Solicitada", fecha: dev.created_at },
                                { label: "Aceptada", fecha: dev.fecha_aceptada },
                                { label: "Rechazada", fecha: dev.fecha_rechazada },
                                { label: "Enviada", fecha: dev.fecha_envio },
                                { label: "Recibida", fecha: dev.fecha_recibida },
                                { label: "Finalizada", fecha: dev.fecha_finalizada },
                              ].filter(p => p.fecha).map(p => (
                                <div key={p.label} style={{ background: "#0f172a", borderRadius: 8, padding: "8px 12px" }}>
                                  <p style={{ color: "#94a3b8", fontSize: 10, fontWeight: 700, margin: 0 }}>{p.label.toUpperCase()}</p>
                                  <p style={{ fontWeight: 700, fontSize: 12, margin: "2px 0 0" }}>{fmtFecha(p.fecha)}</p>
                                </div>
                              ))}
                            </div>

                            {/* CAMBIO DE ESTADO ADMIN */}
                            <div>
                              <p style={{ color: "#94a3b8", fontSize: 12, fontWeight: 700, marginBottom: 8 }}>⚙️ CAMBIAR ESTADO (Admin)</p>
                              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" as const }}>
                                {Object.entries(ESTADO_INFO).filter(([k]) => k !== dev.estado).map(([key, info]) => (
                                  <button key={key} onClick={() => cambiarEstado(dev, key)} style={{ background: `${info.color}22`, border: `1px solid ${info.color}44`, color: info.color, padding: "6px 12px", borderRadius: 8, cursor: "pointer", fontWeight: 700, fontSize: 12 }}>
                                    {info.emoji} {info.label}
                                  </button>
                                ))}
                              </div>
                            </div>

                            {/* ACCIONES */}
                            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" as const }}>
                              <button onClick={() => router.push(`/chat?pedido=${dev.pedido_id}`)} style={{ background: "linear-gradient(135deg,#2563eb,#1d4ed8)", border: "none", color: "white", padding: "8px 16px", borderRadius: 10, fontWeight: 700, cursor: "pointer", fontSize: 13 }}>💬 Ver chat del pedido</button>
                              <button onClick={() => eliminarDevolucion(dev)} style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171", padding: "8px 14px", borderRadius: 10, fontWeight: 700, cursor: "pointer", fontSize: 13 }}>🗑️ Eliminar devolución</button>
                            </div>

                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}