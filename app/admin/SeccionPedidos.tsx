import { useState } from "react";
import { supabase } from "../lib/supabase";
import { Pedido, tableContainer, tableStyle, thStyle, trStyle, tdStyle, btnFiltro, btnPagina, searchInput } from "./types";

type Props = { pedidos: Pedido[]; cargarDatos: () => void; crearPagoProveedorSiNoExiste: (p: Pedido) => void; };

const AGENCIAS = ["GLS", "MRW", "NACEX", "SEUR", "Correos Express", "CTT Express", "Medios propios"];

export default function SeccionPedidos({ pedidos, cargarDatos, crearPagoProveedorSiNoExiste }: Props) {
  const [busquedaPedidos, setBusquedaPedidos] = useState("");
  const [filtroPedidoEstado, setFiltroPedidoEstado] = useState("todos");
  const [filtroPedidoPago, setFiltroPedidoPago] = useState("todos");
  const [filtroPedidoAnulado, setFiltroPedidoAnulado] = useState("todos");
  const [paginaPedidos, setPaginaPedidos] = useState(1);
  const [cambiandoAgencia, setCambiandoAgencia] = useState<number | null>(null);
  const [agenciaTemp, setAgenciaTemp] = useState<Record<number, string>>({});
  const PEDIDOS_POR_PAGINA = 20;

  const pedidosFiltrados = pedidos.filter(p => {
    if (filtroPedidoEstado !== "todos" && p.estado_envio !== filtroPedidoEstado) return false;
    if (filtroPedidoPago !== "todos" && p.forma_pago !== filtroPedidoPago) return false;
    if (filtroPedidoAnulado === "activos" && p.anulado) return false;
    if (filtroPedidoAnulado === "anulados" && !p.anulado) return false;
    if (busquedaPedidos) { const q = busquedaPedidos.toLowerCase(); return (p.codigo||"").toLowerCase().includes(q) || (p.cliente_nombre||"").toLowerCase().includes(q) || (p.cliente_email||"").toLowerCase().includes(q) || String(p.id).includes(q); }
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

  return (
    <div>
      <h1 style={{ fontSize: 56, fontWeight: 900, lineHeight: 1, marginBottom: 12 }}>PEDIDOS</h1>
      <p style={{ color: "#94a3b8", fontSize: 18, marginBottom: 36 }}>Todos los pedidos de la plataforma.</p>
      <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" as const, alignItems: "center" }}>
        <input placeholder="Buscar código, cliente, email..." value={busquedaPedidos} onChange={e => { setBusquedaPedidos(e.target.value); setPaginaPedidos(1); }} style={{ ...searchInput, minWidth: 260 }} />
        <div style={{ display: "flex", gap: 6 }}>{[{key:"todos",label:"Todos"},{key:"pendiente",label:"⏳ Pendiente"},{key:"preparando",label:"🔧 Preparando"},{key:"enviado",label:"🚚 Enviado"},{key:"entregado",label:"✅ Entregado"}].map(({key,label}) => (<button key={key} onClick={() => { setFiltroPedidoEstado(key); setPaginaPedidos(1); }} style={{ ...btnFiltro, fontSize: 12, padding: "7px 12px", background: filtroPedidoEstado===key ? "rgba(37,99,235,0.3)" : "rgba(255,255,255,0.05)", color: filtroPedidoEstado===key ? "#60a5fa" : "#94a3b8", border: filtroPedidoEstado===key ? "1px solid rgba(37,99,235,0.5)" : "1px solid rgba(255,255,255,0.08)" }}>{label}</button>))}</div>
        <div style={{ display: "flex", gap: 6 }}>{[{key:"todos",label:"Todos"},{key:"tarjeta",label:"💳 Tarjeta"},{key:"rd_pago",label:"🔵 RD Pago"}].map(({key,label}) => (<button key={key} onClick={() => { setFiltroPedidoPago(key); setPaginaPedidos(1); }} style={{ ...btnFiltro, fontSize: 12, padding: "7px 12px", background: filtroPedidoPago===key ? "rgba(139,92,246,0.3)" : "rgba(255,255,255,0.05)", color: filtroPedidoPago===key ? "#a78bfa" : "#94a3b8", border: filtroPedidoPago===key ? "1px solid rgba(139,92,246,0.5)" : "1px solid rgba(255,255,255,0.08)" }}>{label}</button>))}</div>
        <div style={{ display: "flex", gap: 6 }}>{[{key:"todos",label:"Todos"},{key:"activos",label:"✅ Activos"},{key:"anulados",label:"❌ Anulados"}].map(({key,label}) => (<button key={key} onClick={() => { setFiltroPedidoAnulado(key); setPaginaPedidos(1); }} style={{ ...btnFiltro, fontSize: 12, padding: "7px 12px", background: filtroPedidoAnulado===key ? "rgba(239,68,68,0.2)" : "rgba(255,255,255,0.05)", color: filtroPedidoAnulado===key ? "#f87171" : "#94a3b8", border: filtroPedidoAnulado===key ? "1px solid rgba(239,68,68,0.4)" : "1px solid rgba(255,255,255,0.08)" }}>{label}</button>))}</div>
        <span style={{ color: "#94a3b8", fontSize: 13 }}>{pedidosFiltrados.length} pedido{pedidosFiltrados.length !== 1 ? "s" : ""}</span>
      </div>
      <div style={tableContainer}>
        <table style={tableStyle}>
          <thead><tr>{["CÓDIGO","CLIENTE","TOTAL","PAGO","AGENCIA","ESTADO","FECHA","ACCIÓN"].map(h => <th key={h} style={thStyle}>{h}</th>)}</tr></thead>
          <tbody>
            {pedidosPagina.length === 0 ? (
              <tr><td colSpan={8} style={{ ...tdStyle, textAlign: "center", color: "#94a3b8", padding: "40px" }}>No hay pedidos con los filtros aplicados</td></tr>
            ) : pedidosPagina.map(p => (
              <tr key={p.id} style={{ ...trStyle, opacity: p.anulado ? 0.5 : 1 }}>
                <td style={tdStyle}><span style={{ color: "#60a5fa", fontWeight: 700 }}>{p.codigo || `#${p.id}`}</span>{p.anulado && <div style={{ color: "#f87171", fontSize: 11, fontWeight: 700 }}>❌ Anulado</div>}</td>
                <td style={tdStyle}><div style={{ fontWeight: 600 }}>{p.cliente_nombre||"-"}</div><div style={{ color: "#94a3b8", fontSize: 12 }}>{p.cliente_email}</div></td>
                <td style={{ ...tdStyle, color: "#22c55e", fontWeight: 700 }}>{Number(p.total||0).toFixed(2)}€</td>
                <td style={tdStyle}><span style={{ background: p.forma_pago==="rd_pago" ? "rgba(37,99,235,0.2)" : "rgba(139,92,246,0.2)", color: p.forma_pago==="rd_pago" ? "#60a5fa" : "#a78bfa", padding: "3px 8px", borderRadius: 999, fontSize: 11, fontWeight: 700 }}>{p.forma_pago==="rd_pago" ? "RD Pago" : "Tarjeta"}</span></td>
                <td style={tdStyle}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <span style={{ fontSize: 12, color: "#94a3b8", fontWeight: 700 }}>{p.agencia || p.transporte || "—"}</span>
                    <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                      <select
                        value={agenciaTemp[p.id] ?? ""}
                        onChange={e => setAgenciaTemp(prev => ({ ...prev, [p.id]: e.target.value }))}
                        style={{ background: "#020617", color: "#94a3b8", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6, padding: "3px 6px", fontSize: 11, cursor: "pointer", outline: "none" }}
                      >
                        <option value="">Cambiar...</option>
                        {AGENCIAS.map(a => <option key={a} value={a}>{a}</option>)}
                      </select>
                      {agenciaTemp[p.id] && (
                        <button
                          onClick={() => guardarAgencia(p.id)}
                          disabled={cambiandoAgencia === p.id}
                          style={{ background: "rgba(22,163,74,0.2)", border: "none", color: "#4ade80", padding: "3px 8px", borderRadius: 6, cursor: "pointer", fontWeight: 700, fontSize: 11 }}
                        >
                          {cambiandoAgencia === p.id ? "..." : "✓"}
                        </button>
                      )}
                    </div>
                  </div>
                </td>
                <td style={tdStyle}><span style={{ color: p.estado_envio==="entregado" ? "#4ade80" : p.estado_envio==="enviado" ? "#a78bfa" : p.estado_envio==="preparando" ? "#60a5fa" : "#f59e0b", fontWeight: 700, fontSize: 13 }}>{p.estado_envio==="entregado" ? "✅ Entregado" : p.estado_envio==="enviado" ? "🚚 Enviado" : p.estado_envio==="preparando" ? "🔧 Preparando" : "⏳ Pendiente"}</span></td>
                <td style={{ ...tdStyle, color: "#94a3b8", fontSize: 13 }}>{p.created_at ? new Date(p.created_at).toLocaleDateString("es-ES") : "-"}</td>
                <td style={tdStyle}>{!p.anulado && p.estado_envio !== "entregado" && (<button onClick={async () => { await supabase.from("pedidos").update({ estado_envio: "entregado", fecha_entrega_confirmada: new Date().toISOString() }).eq("id", p.id); await crearPagoProveedorSiNoExiste(p); cargarDatos(); }} style={{ background: "rgba(22,163,74,0.15)", color: "#4ade80", border: "none", padding: "6px 12px", borderRadius: 8, cursor: "pointer", fontWeight: 700, fontSize: 12 }}>✅ Entregado</button>)}{p.estado_envio==="entregado" && <span style={{ color: "#4ade80", fontSize: 12, fontWeight: 700 }}>✅</span>}</td>
              </tr>
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