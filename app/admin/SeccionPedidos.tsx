import React, { useState } from "react";
import { supabase } from "../lib/supabase";
import { Pedido, tableContainer, tableStyle, thStyle, trStyle, tdStyle, btnFiltro, btnPagina, searchInput } from "./types";

type Props = { pedidos: Pedido[]; cargarDatos: () => void; crearPagoProveedorSiNoExiste: (p: Pedido) => void; };

const AGENCIAS = ["GLS", "MRW", "NACEX", "SEUR", "Correos Express", "CTT Express", "Medios propios"];

export default function SeccionPedidos({ pedidos, cargarDatos, crearPagoProveedorSiNoExiste }: Props) {
  const [busquedaPedidos, setBusquedaPedidos] = useState("");
  const [filtroPedidoEstado, setFiltroPedidoEstado] = useState("todos");
  const [filtroPedidoPago, setFiltroPedidoPago] = useState("todos");
  const [filtroPedidoAnulado, setFiltroPedidoAnulado] = useState("todos");
  const [filtroPedidoAgencia, setFiltroPedidoAgencia] = useState("todos");
  const [paginaPedidos, setPaginaPedidos] = useState(1);
  const [cambiandoAgencia, setCambiandoAgencia] = useState<number | null>(null);
  const [agenciaTemp, setAgenciaTemp] = useState<Record<number, string>>({});
  const [pedidoExpandido, setPedidoExpandido] = useState<number | null>(null);
  const [cambiandoAgenciaCompleto, setCambiandoAgenciaCompleto] = useState<number | null>(null);
  const [reenviandoEmail, setReenviandoEmail] = useState<number | null>(null);
  const [msgAccion, setMsgAccion] = useState<{ id: number; msg: string; ok: boolean } | null>(null);
  const [cambiandoEstado, setCambiandoEstado] = useState<number | null>(null);
  const PEDIDOS_POR_PAGINA = 20;

  const TRACKING_URLS: Record<string, (t: string) => string> = {
    "MRW": (t) => `https://www.mrw.es/seguimiento_envios/MRWEnvio_seguimiento.asp?codigo=${t}`,
    "NACEX": (t) => `https://www.nacex.es/irSegupsimiento.do?agencia_org=&numero_albaran=${t}`,
    "SEUR": (t) => `https://www.seur.com/livetracking/?segOnlineIdentificador=${t}`,
    "CTT Express": (t) => `https://www.cttexpress.com/seguimiento?numero=${t}`,
    "GLS": (t) => `https://www.gls-spain.es/es/seguimiento-de-envios/?match=${t}`,
    "Correos Express": (t) => `https://www.correosexpress.com/web/correosexpress/seguimiento-online?envio=${t}`,
    "DHL": (t) => `https://www.dhl.com/es-es/home/tracking/tracking-express.html?submit=1&tracking-id=${t}`,
  };

  function getTrackingNumber(p: Pedido): string {
    return (p as any).tracking_number || p.tracking || (p as any).tracking_nacex || (p as any).tracking_dhl || (p as any).tracking_gls || (p as any).tracking_ctt || (p as any).tracking_seur || "";
  }

  function getTrackingUrl(p: Pedido): string | null {
    const tn = getTrackingNumber(p);
    if (!tn) return null;
    const ag = (p.agencia || p.transporte || "").trim();
    for (const [key, fn] of Object.entries(TRACKING_URLS)) {
      if (ag.toLowerCase().includes(key.toLowerCase())) return fn(tn);
    }
    return null;
  }

  async function cambiarEstadoManual(pedidoId: number, nuevoEstado: string) {
    setCambiandoEstado(pedidoId);
    const updates: any = { estado_envio: nuevoEstado };
    if (nuevoEstado === "entregado") updates.fecha_entrega_confirmada = new Date().toISOString();
    await supabase.from("pedidos").update(updates).eq("id", pedidoId);
    if (nuevoEstado === "entregado") {
      const pedido = pedidos.find(p => p.id === pedidoId);
      if (pedido) await crearPagoProveedorSiNoExiste(pedido);
    }
    cargarDatos();
    setCambiandoEstado(null);
  }

  const pedidosFiltrados = pedidos.filter(p => {
    if (filtroPedidoEstado !== "todos" && p.estado_envio !== filtroPedidoEstado) return false;
    if (filtroPedidoPago !== "todos" && p.forma_pago !== filtroPedidoPago) return false;
    if (filtroPedidoAnulado === "activos" && p.anulado) return false;
    if (filtroPedidoAnulado === "anulados" && !p.anulado) return false;
    if (filtroPedidoAgencia !== "todos" && (p.agencia || p.transporte || "") !== filtroPedidoAgencia) return false;
    if (busquedaPedidos) { const q = busquedaPedidos.toLowerCase(); return (p.codigo||"").toLowerCase().includes(q) || (p.cliente_nombre||"").toLowerCase().includes(q) || (p.cliente_email||"").toLowerCase().includes(q) || String(p.id).includes(q) || getTrackingNumber(p).toLowerCase().includes(q); }
    return true;
  });
  const totalPaginasPedidos = Math.ceil(pedidosFiltrados.length / PEDIDOS_POR_PAGINA);
  const pedidosPagina = pedidosFiltrados.slice((paginaPedidos-1)*PEDIDOS_POR_PAGINA, paginaPedidos*PEDIDOS_POR_PAGINA);

  async function guardarAgencia(pedidoId: number) {
    const nuevaAgencia = agenciaTemp[pedidoId];
    if (!nuevaAgencia) return;
    setCambiandoAgencia(pedidoId);
    await supabase.from("pedidos").update({ agencia: nuevaAgencia, transporte: nuevaAgencia }).eq("id", pedidoId);
    setCambiandoAgencia(null);
    setAgenciaTemp(prev => { const n = { ...prev }; delete n[pedidoId]; return n; });
    cargarDatos();
  }

  async function cambiarAgenciaCompleto(pedido: Pedido, nuevaAgencia: string) {
    setCambiandoAgenciaCompleto(pedido.id);
    setMsgAccion(null);
    try {
      // 1. Anular en agencia actual
      await fetch("/api/anular-envio-agencia", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pedidoId: pedido.id }),
      });
      // 2. Actualizar agencia en Supabase
      await supabase.from("pedidos").update({
        agencia: nuevaAgencia,
        transporte: nuevaAgencia,
        tracking: null,
        tracking_nacex: null,
        tracking_dhl: null,
        tracking_gls: null,
        tracking_ctt: null,
        tracking_seur: null,
        etiqueta_envio_url: null,
        collection_ref_seur: null,
        collection_ref_correos_express: null,
      }).eq("id", pedido.id);
      // 3. Crear envío en nueva agencia
      const agLower = nuevaAgencia.toLowerCase();
      let endpoint = "";
      if (agLower.includes("nacex")) endpoint = "/api/nacex/crear-envio";
      else if (agLower.includes("mrw")) endpoint = "/api/mrw/crear-envio";
      else if (agLower.includes("gls")) endpoint = "/api/gls/crear-envio";
      else if (agLower.includes("dhl")) endpoint = "/api/dhl/crear-envio";
      else if (agLower.includes("seur")) endpoint = "/api/seur/crear-envio";
      else if (agLower.includes("correos")) endpoint = "/api/correos-express/crear-envio";
      else if (agLower.includes("ctt")) endpoint = "/api/ctt/crear-envio";

      if (endpoint) {
        const res = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pedidoId: pedido.id }),
        });
        const data = await res.json();
        if (data.ok) {
          setMsgAccion({ id: pedido.id, msg: `✅ Agencia cambiada a ${nuevaAgencia} correctamente`, ok: true });
        } else {
          setMsgAccion({ id: pedido.id, msg: `⚠️ Agencia actualizada pero error al crear envío: ${data.error || "Error desconocido"}`, ok: false });
        }
      } else {
        setMsgAccion({ id: pedido.id, msg: `✅ Agencia cambiada a ${nuevaAgencia} (sin integración API)`, ok: true });
      }
      cargarDatos();
    } catch (e: any) {
      setMsgAccion({ id: pedido.id, msg: `❌ Error: ${e.message}`, ok: false });
    }
    setCambiandoAgenciaCompleto(null);
    setAgenciaTemp(prev => { const n = { ...prev }; delete n[pedido.id]; return n; });
  }

  async function reenviarEmailProveedor(pedido: Pedido) {
    setReenviandoEmail(pedido.id);
    setMsgAccion(null);
    try {
      const proveedorId = (pedido.productos || [])[0]?.proveedor_id;
      let emailProveedor = "", nombreProveedor = (pedido.productos || [])[0]?.proveedor_nombre || "";
      if (proveedorId) {
        const { data: prov } = await supabase.from("usuarios").select("email, nombre_empresa").eq("id", proveedorId).single();
        emailProveedor = prov?.email || "";
        nombreProveedor = prov?.nombre_empresa || nombreProveedor;
      }
      if (!emailProveedor) { setMsgAccion({ id: pedido.id, msg: "❌ No se encontró email del proveedor", ok: false }); setReenviandoEmail(null); return; }
      const res = await fetch("/api/enviar-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          proveedorEmail: emailProveedor,
          proveedorNombre: nombreProveedor,
          productos: pedido.productos || [],
          cliente: pedido.cliente_nombre || pedido.cliente_email,
          clienteEmail: pedido.cliente_email,
          telefono: (pedido as any).cliente_telefono || "",
          cif: "",
          direccion: pedido.direccion || "",
          agencia: pedido.agencia || pedido.transporte,
          formaPago: pedido.forma_pago,
          subtotal: pedido.subtotal || pedido.total,
          iva: (pedido.total || 0) * 0.21,
          total: pedido.total,
          codigo: pedido.codigo || `#${pedido.id}`,
          fecha: pedido.created_at,
          pedidoId: pedido.id,
        }),
      });
      const data = await res.json();
      if (data.ok) setMsgAccion({ id: pedido.id, msg: `✅ Email reenviado a ${emailProveedor}`, ok: true });
      else setMsgAccion({ id: pedido.id, msg: `❌ Error al reenviar: ${data.error}`, ok: false });
    } catch (e: any) {
      setMsgAccion({ id: pedido.id, msg: `❌ Error: ${e.message}`, ok: false });
    }
    setReenviandoEmail(null);
  }

  return (
    <div>
      <h1 style={{ fontSize: 56, fontWeight: 900, lineHeight: 1, marginBottom: 12 }}>PEDIDOS</h1>
      <p style={{ color: "#94a3b8", fontSize: 18, marginBottom: 36 }}>Todos los pedidos de la plataforma.</p>
      <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" as const, alignItems: "center" }}>
        <input placeholder="Buscar código, cliente, email..." value={busquedaPedidos} onChange={e => { setBusquedaPedidos(e.target.value); setPaginaPedidos(1); }} style={{ ...searchInput, minWidth: 260 }} />
        <div style={{ display: "flex", gap: 6 }}>{[{key:"todos",label:"Todos"},{key:"pendiente",label:"⏳ Pendiente"},{key:"preparando",label:"🔧 Preparando"},{key:"enviado",label:"🚚 Enviado"},{key:"entregado",label:"✅ Entregado"}].map(({key,label}) => (<button key={key} onClick={() => { setFiltroPedidoEstado(key); setPaginaPedidos(1); }} style={{ ...btnFiltro, fontSize: 12, padding: "7px 12px", background: filtroPedidoEstado===key ? "rgba(37,99,235,0.3)" : "rgba(255,255,255,0.05)", color: filtroPedidoEstado===key ? "#60a5fa" : "#94a3b8", border: filtroPedidoEstado===key ? "1px solid rgba(37,99,235,0.5)" : "1px solid rgba(255,255,255,0.08)" }}>{label}</button>))}</div>
        <div style={{ display: "flex", gap: 6 }}>{[{key:"todos",label:"Todos"},{key:"tarjeta",label:"💳 Tarjeta"},{key:"rd_pago",label:"🔵 RD Pago"}].map(({key,label}) => (<button key={key} onClick={() => { setFiltroPedidoPago(key); setPaginaPedidos(1); }} style={{ ...btnFiltro, fontSize: 12, padding: "7px 12px", background: filtroPedidoPago===key ? "rgba(139,92,246,0.3)" : "rgba(255,255,255,0.05)", color: filtroPedidoPago===key ? "#a78bfa" : "#94a3b8", border: filtroPedidoPago===key ? "1px solid rgba(139,92,246,0.5)" : "1px solid rgba(255,255,255,0.08)" }}>{label}</button>))}</div>
        <div style={{ display: "flex", gap: 6 }}>{[{key:"todos",label:"Todos"},{key:"activos",label:"✅ Activos"},{key:"anulados",label:"❌ Anulados"}].map(({key,label}) => (<button key={key} onClick={() => { setFiltroPedidoAnulado(key); setPaginaPedidos(1); }} style={{ ...btnFiltro, fontSize: 12, padding: "7px 12px", background: filtroPedidoAnulado===key ? "rgba(239,68,68,0.2)" : "rgba(255,255,255,0.05)", color: filtroPedidoAnulado===key ? "#f87171" : "#94a3b8", border: filtroPedidoAnulado===key ? "1px solid rgba(239,68,68,0.4)" : "1px solid rgba(255,255,255,0.08)" }}>{label}</button>))}</div>
        <select value={filtroPedidoAgencia} onChange={e => { setFiltroPedidoAgencia(e.target.value); setPaginaPedidos(1); }} style={{ background: "#0f172a", color: "#94a3b8", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "7px 12px", fontSize: 12, outline: "none", cursor: "pointer" }}>
          <option value="todos">🚚 Todas agencias</option>
          {AGENCIAS.map(a => <option key={a} value={a}>{a}</option>)}
        </select>
        <span style={{ color: "#94a3b8", fontSize: 13 }}>{pedidosFiltrados.length} pedido{pedidosFiltrados.length !== 1 ? "s" : ""}</span>
      </div>
      <div style={tableContainer}>
        <table style={tableStyle}>
          <thead><tr>{["CÓDIGO","COMPRADOR","VENDEDOR","TOTAL","PAGO","AGENCIA","TRACKING","ESTADO","FECHA","ACCIÓN"].map(h => <th key={h} style={thStyle}>{h}</th>)}</tr></thead>
          <tbody>
            {pedidosPagina.length === 0 ? (
              <tr><td colSpan={10} style={{ ...tdStyle, textAlign: "center", color: "#94a3b8", padding: "40px" }}>No hay pedidos con los filtros aplicados</td></tr>
            ) : pedidosPagina.map(p => (
              <React.Fragment key={p.id}>
              <tr style={{ ...trStyle, opacity: p.anulado ? 0.5 : 1 }}>
                <td style={tdStyle}>
                  <span style={{ color: "#60a5fa", fontWeight: 700 }}>{p.codigo || `#${p.id}`}</span>
                  {p.anulado && <div style={{ color: "#f87171", fontSize: 11, fontWeight: 700 }}>❌ Anulado</div>}
                </td>
                <td style={tdStyle}>
                  <div style={{ fontWeight: 600 }}>{p.cliente_nombre||"-"}</div>
                  <div style={{ color: "#94a3b8", fontSize: 12 }}>{p.cliente_email}</div>
                  {(p as any).cliente_telefono && <div style={{ color: "#60a5fa", fontSize: 12 }}>📞 {(p as any).cliente_telefono}</div>}
                </td>
                <td style={tdStyle}>
                  <div style={{ fontWeight: 600 }}>{(p.productos||[])[0]?.proveedor_nombre||"-"}</div>
                  <div style={{ color: "#94a3b8", fontSize: 11 }}>{(p.productos||[])[0]?.proveedor_id ? "ID: " + (p.productos||[])[0]?.proveedor_id.substring(0,8)+"..." : "-"}</div>
                </td>
                <td style={{ ...tdStyle, color: "#22c55e", fontWeight: 700 }}>{Number(p.total||0).toFixed(2)}€</td>
                <td style={tdStyle}>
                  <span style={{ background: p.forma_pago==="rd_pago" ? "rgba(37,99,235,0.2)" : "rgba(139,92,246,0.2)", color: p.forma_pago==="rd_pago" ? "#60a5fa" : "#a78bfa", padding: "3px 8px", borderRadius: 999, fontSize: 11, fontWeight: 700 }}>
                    {p.forma_pago==="rd_pago" ? "RD Pago" : "Tarjeta"}
                  </span>
                </td>
                <td style={tdStyle}>
                  <span style={{ fontSize: 12, color: "#94a3b8", fontWeight: 700 }}>{p.agencia || p.transporte || "—"}</span>
                </td>
                <td style={tdStyle}>
                  {(() => {
                    const tn = getTrackingNumber(p);
                    const url = getTrackingUrl(p);
                    if (!tn) return <span style={{ color: "#475569", fontSize: 12 }}>—</span>;
                    return (
                      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                        {url ? (
                          <a href={url} target="_blank" rel="noopener noreferrer" style={{ fontFamily: "monospace", fontSize: 11, color: "#4ade80", fontWeight: 700, textDecoration: "none" }} title="Ver tracking">{tn.length > 18 ? tn.substring(0, 18) + "…" : tn} 🔗</a>
                        ) : (
                          <span style={{ fontFamily: "monospace", fontSize: 11, color: "#94a3b8", fontWeight: 600 }}>{tn.length > 18 ? tn.substring(0, 18) + "…" : tn}</span>
                        )}
                      </div>
                    );
                  })()}
                </td>
                <td style={tdStyle}>
                  <span style={{ color: p.estado_envio==="entregado" ? "#4ade80" : p.estado_envio==="en_transito" ? "#a78bfa" : p.estado_envio==="preparando" ? "#60a5fa" : p.estado_envio==="recogido" ? "#38bdf8" : p.estado_envio==="incidencia" ? "#f87171" : "#f59e0b", fontWeight: 700, fontSize: 13 }}>
                    {p.estado_envio || "pendiente"}
                  </span>
                </td>
                <td style={{ ...tdStyle, color: "#94a3b8", fontSize: 13 }}>{p.created_at ? new Date(p.created_at).toLocaleDateString("es-ES") : "-"}</td>
                <td style={tdStyle}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    {!p.anulado && p.estado_envio !== "entregado" && (
                      <button onClick={async () => { await supabase.from("pedidos").update({ estado_envio: "entregado", fecha_entrega_confirmada: new Date().toISOString() }).eq("id", p.id); await crearPagoProveedorSiNoExiste(p); cargarDatos(); }} style={{ background: "rgba(22,163,74,0.15)", color: "#4ade80", border: "none", padding: "6px 12px", borderRadius: 8, cursor: "pointer", fontWeight: 700, fontSize: 12 }}>✅ Entregado</button>
                    )}
                    <button onClick={() => setPedidoExpandido(pedidoExpandido === p.id ? null : p.id)} style={{ background: "rgba(37,99,235,0.15)", color: "#60a5fa", border: "none", padding: "6px 12px", borderRadius: 8, cursor: "pointer", fontWeight: 700, fontSize: 12 }}>
                      {pedidoExpandido === p.id ? "▲ Cerrar" : "⚙️ Gestionar"}
                    </button>
                  </div>
                </td>
              </tr>
              {pedidoExpandido === p.id && (
                <tr>
                  <td colSpan={10} style={{ padding: "0 0 12px 0", background: "rgba(37,99,235,0.04)", borderLeft: "3px solid #2563eb" }}>
                    <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: 12 }}>
                      {/* TRACKING INFO */}
                      {getTrackingNumber(p) && (
                        <div style={{ background: "rgba(22,163,74,0.06)", border: "1px solid rgba(22,163,74,0.15)", borderRadius: 10, padding: "10px 14px", display: "flex", alignItems: "center", gap: 12 }}>
                          <span style={{ color: "#94a3b8", fontSize: 12, fontWeight: 700 }}>📦 TRACKING:</span>
                          <span style={{ fontFamily: "monospace", color: "#4ade80", fontWeight: 800, fontSize: 14 }}>{getTrackingNumber(p)}</span>
                          {getTrackingUrl(p) && <a href={getTrackingUrl(p)!} target="_blank" rel="noopener noreferrer" style={{ color: "#60a5fa", fontSize: 12, fontWeight: 700, textDecoration: "none" }}>🔗 Ver en web de la agencia</a>}
                        </div>
                      )}
                      {/* CAMBIO DE ESTADO MANUAL */}
                      <div>
                        <p style={{ color: "#94a3b8", fontSize: 12, fontWeight: 700, marginBottom: 8 }}>📋 CAMBIAR ESTADO DEL ENVÍO</p>
                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" as const }}>
                          {["pendiente", "preparando", "recogido", "en_transito", "entregado", "incidencia"].map(est => (
                            <button key={est} onClick={() => cambiarEstadoManual(p.id, est)} disabled={cambiandoEstado === p.id || p.estado_envio === est} style={{
                              background: p.estado_envio === est ? "rgba(37,99,235,0.3)" : "rgba(255,255,255,0.05)",
                              border: p.estado_envio === est ? "1px solid rgba(37,99,235,0.5)" : "1px solid rgba(255,255,255,0.08)",
                              color: p.estado_envio === est ? "#60a5fa" : "#94a3b8",
                              padding: "6px 12px", borderRadius: 8, cursor: p.estado_envio === est ? "default" : "pointer", fontWeight: 700, fontSize: 12, opacity: cambiandoEstado === p.id ? 0.5 : 1
                            }}>
                              {est}
                            </button>
                          ))}
                        </div>
                      </div>
                      {msgAccion?.id === p.id && (
                        <div style={{ background: msgAccion.ok ? "rgba(22,163,74,0.15)" : "rgba(239,68,68,0.15)", border: `1px solid ${msgAccion.ok ? "rgba(22,163,74,0.3)" : "rgba(239,68,68,0.3)"}`, borderRadius: 8, padding: "8px 14px", fontSize: 13, fontWeight: 700, color: msgAccion.ok ? "#4ade80" : "#f87171" }}>
                          {msgAccion.msg}
                        </div>
                      )}
                      <div>
                        <p style={{ color: "#94a3b8", fontSize: 12, fontWeight: 700, marginBottom: 8 }}>🚚 CAMBIO DE AGENCIA (anula actual + crea en nueva)</p>
                        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" as const }}>
                          <select value={agenciaTemp[p.id] ?? ""} onChange={e => setAgenciaTemp(prev => ({ ...prev, [p.id]: e.target.value }))} style={{ background: "#020617", color: "white", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "8px 12px", fontSize: 13, cursor: "pointer", outline: "none" }}>
                            <option value="">Seleccionar nueva agencia...</option>
                            {AGENCIAS.map(a => <option key={a} value={a}>{a}</option>)}
                          </select>
                          {agenciaTemp[p.id] && (
                            <>
                              <button onClick={() => cambiarAgenciaCompleto(p, agenciaTemp[p.id])} disabled={cambiandoAgenciaCompleto === p.id} style={{ background: "linear-gradient(135deg,#dc2626,#991b1b)", border: "none", color: "white", padding: "8px 16px", borderRadius: 8, cursor: "pointer", fontWeight: 700, fontSize: 13 }}>
                                {cambiandoAgenciaCompleto === p.id ? "Procesando..." : "🔄 Cambiar agencia + API"}
                              </button>
                              <button onClick={() => guardarAgencia(p.id)} disabled={cambiandoAgencia === p.id} style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)", color: "#94a3b8", padding: "8px 16px", borderRadius: 8, cursor: "pointer", fontWeight: 700, fontSize: 13 }}>
                                {cambiandoAgencia === p.id ? "..." : "Solo actualizar campo"}
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                      <div>
                        <p style={{ color: "#94a3b8", fontSize: 12, fontWeight: 700, marginBottom: 8 }}>📧 REENVÍO DE EMAILS</p>
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" as const }}>
                          <button onClick={() => reenviarEmailProveedor(p)} disabled={reenviandoEmail === p.id} style={{ background: "rgba(37,99,235,0.15)", border: "1px solid rgba(37,99,235,0.3)", color: "#60a5fa", padding: "8px 16px", borderRadius: 8, cursor: "pointer", fontWeight: 700, fontSize: 13 }}>
                            {reenviandoEmail === p.id ? "Enviando..." : "📦 Reenviar email proveedor"}
                          </button>
                          {p.albaran_url && (
                            <a href={p.albaran_url} target="_blank" rel="noopener noreferrer" style={{ background: "rgba(139,92,246,0.15)", border: "1px solid rgba(139,92,246,0.3)", color: "#a78bfa", padding: "8px 16px", borderRadius: 8, fontWeight: 700, fontSize: 13, textDecoration: "none" }}>📄 Ver albarán</a>
                          )}
                          {(p as any).etiqueta_envio_url && (
                            <a href={(p as any).etiqueta_envio_url} target="_blank" rel="noopener noreferrer" style={{ background: "rgba(22,163,74,0.15)", border: "1px solid rgba(22,163,74,0.3)", color: "#4ade80", padding: "8px 16px", borderRadius: 8, fontWeight: 700, fontSize: 13, textDecoration: "none" }}>🏷️ Ver etiqueta</a>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
      {totalPaginasPedidos > 1 && (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 8, marginTop: 20 }}>
          <button onClick={() => setPaginaPedidos(1)} disabled={paginaPedidos===1} style={{ ...btnPagina, opacity: paginaPedidos===1 ? 0.3 : 1 }}>««</button>
          <button onClick={() => setPaginaPedidos(p => Math.max(1,p-1))} disabled={paginaPedidos===1} style={{ ...btnPagina, opacity: paginaPedidos===1 ? 0.3 : 1 }}>← Anterior</button>
          <div style={{ display: "flex", gap: 4 }}>{Array.from({ length: Math.min(5,totalPaginasPedidos) }, (_,i) => { let page: number; if (totalPaginasPedidos<=5) page=i+1; else if (paginaPedidos<=3) page=i+1; else if (paginaPedidos>=totalPaginasPedidos-2) page=totalPaginasPedidos-4+i; else page=paginaPedidos-2+i; return <button key={page} onClick={() => setPaginaPedidos(page)} style={{ width:36, height:36, borderRadius:8, border:"none", cursor:"pointer", fontWeight:700, fontSize:14, background: paginaPedidos===page ? "linear-gradient(135deg,#2563eb,#1d4ed8)" : "rgba(255,255,255,0.06)", color: paginaPedidos===page ? "white" : "#94a3b8" }}>{page}</button>; })}</div>
          <button onClick={() => setPaginaPedidos(p => Math.min(totalPaginasPedidos,p+1))} disabled={paginaPedidos===totalPaginasPedidos} style={{ ...btnPagina, opacity: paginaPedidos===totalPaginasPedidos ? 0.3 : 1 }}>Siguiente →</button>
          <button onClick={() => setPaginaPedidos(totalPaginasPedidos)} disabled={paginaPedidos===totalPaginasPedidos} style={{ ...btnPagina, opacity: paginaPedidos===totalPaginasPedidos ? 0.3 : 1 }}>»»</button>
          <span style={{ color: "#94a3b8", fontSize: 13 }}>Pág <strong style={{ color: "white" }}>{paginaPedidos}</strong> de <strong style={{ color: "white" }}>{totalPaginasPedidos}</strong></span>
        </div>
      )}
    </div>
  );
}