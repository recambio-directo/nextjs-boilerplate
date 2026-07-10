import { useState } from "react";
import { supabase } from "../lib/supabase";
import { Pedido, Usuario, PagoProveedor, tableContainer, tableStyle, thStyle, trStyle, tdStyle, btnFiltro, btnPagina, searchInput } from "./types";

type Props = {
  pedidos: Pedido[];
  usuarios: Usuario[];
  cargarDatos: () => void;
  crearPagoProveedorSiNoExiste: (p: Pedido) => void;
};

export default function SeccionPedidos({ pedidos, usuarios, cargarDatos, crearPagoProveedorSiNoExiste }: Props) {
  const [busquedaPedidos, setBusquedaPedidos] = useState("");
  const [filtroPedidoEstado, setFiltroPedidoEstado] = useState("todos");
  const [filtroPedidoPago, setFiltroPedidoPago] = useState("todos");
  const [filtroPedidoAnulado, setFiltroPedidoAnulado] = useState("todos");
  const [paginaPedidos, setPaginaPedidos] = useState(1);
  const [pedidoExpandido, setPedidoExpandido] = useState<number | null>(null);
  const PEDIDOS_POR_PAGINA = 20;

  // Helper: obtener nombre de proveedor a partir de su id
  function getNombreProveedor(proveedorId?: string): string {
    if (!proveedorId) return "-";
    const u = usuarios.find(u => u.id === proveedorId);
    return u?.nombre_empresa || u?.email || "-";
  }

  // Helper: obtener teléfono y email de un usuario
  function getContacto(userId?: string) {
    if (!userId) return null;
    const u = usuarios.find(u => u.id === userId);
    if (!u) return null;
    return { nombre: u.nombre_empresa || u.email || "-", telefono: u.telefono || "No disponible", email: u.email || "-" };
  }

  // Extraer proveedores únicos de un pedido
  function getProveedoresPedido(p: Pedido): { id: string; nombre: string }[] {
    if (!p.productos || !Array.isArray(p.productos)) return [];
    const mapa = new Map<string, string>();
    for (const prod of p.productos) {
      if (prod.proveedor_id && !mapa.has(prod.proveedor_id)) {
        mapa.set(prod.proveedor_id, getNombreProveedor(prod.proveedor_id));
      }
    }
    return Array.from(mapa.entries()).map(([id, nombre]) => ({ id, nombre }));
  }

  // Texto de proveedores para mostrar en la columna
  function getProveedoresTexto(p: Pedido): string {
    const provs = getProveedoresPedido(p);
    if (provs.length === 0) return "-";
    return provs.map(pr => pr.nombre).join(", ");
  }

  const pedidosFiltrados = pedidos.filter(p => {
    if (filtroPedidoEstado !== "todos" && p.estado_envio !== filtroPedidoEstado) return false;
    if (filtroPedidoPago !== "todos" && p.forma_pago !== filtroPedidoPago) return false;
    if (filtroPedidoAnulado === "activos" && p.anulado) return false;
    if (filtroPedidoAnulado === "anulados" && !p.anulado) return false;
    if (busquedaPedidos) {
      const q = busquedaPedidos.toLowerCase();
      const provTexto = getProveedoresTexto(p).toLowerCase();
      return (
        (p.codigo || "").toLowerCase().includes(q) ||
        (p.cliente_nombre || "").toLowerCase().includes(q) ||
        (p.cliente_email || "").toLowerCase().includes(q) ||
        provTexto.includes(q) ||
        String(p.id).includes(q)
      );
    }
    return true;
  });

  const totalPaginasPedidos = Math.ceil(pedidosFiltrados.length / PEDIDOS_POR_PAGINA);
  const pedidosPagina = pedidosFiltrados.slice((paginaPedidos - 1) * PEDIDOS_POR_PAGINA, paginaPedidos * PEDIDOS_POR_PAGINA);

  // Función para abrir chat en nueva pestaña
  async function abrirChat(clienteId: string, proveedorId: string) {
    // Buscar conversación existente en ambas direcciones
    const { data: conv1 } = await supabase
      .from("conversaciones")
      .select("id")
      .eq("user1_id", clienteId)
      .eq("user2_id", proveedorId)
      .maybeSingle();
    const { data: conv2 } = await supabase
      .from("conversaciones")
      .select("id")
      .eq("user1_id", proveedorId)
      .eq("user2_id", clienteId)
      .maybeSingle();
    const conv = conv1 || conv2;
    if (conv) {
      window.open(`/chat?conv=${conv.id}`, "_blank");
    } else {
      alert("No hay conversación entre este cliente y proveedor");
    }
  }

  return (
    <div>
      <h1 style={{ fontSize: 56, fontWeight: 900, lineHeight: 1, marginBottom: 12 }}>PEDIDOS</h1>
      <p style={{ color: "#94a3b8", fontSize: 18, marginBottom: 36 }}>Todos los pedidos de la plataforma.</p>

      {/* FILTROS */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" as const, alignItems: "center" }}>
        <input
          placeholder="Buscar código, cliente, proveedor..."
          value={busquedaPedidos}
          onChange={e => { setBusquedaPedidos(e.target.value); setPaginaPedidos(1); }}
          style={{ ...searchInput, minWidth: 280 }}
        />
        <div style={{ display: "flex", gap: 6 }}>
          {[
            { key: "todos", label: "Todos" },
            { key: "pendiente", label: "⏳ Pendiente" },
            { key: "preparando", label: "🔧 Preparando" },
            { key: "enviado", label: "🚚 Enviado" },
            { key: "entregado", label: "✅ Entregado" },
          ].map(({ key, label }) => (
            <button key={key} onClick={() => { setFiltroPedidoEstado(key); setPaginaPedidos(1); }}
              style={{ ...btnFiltro, fontSize: 12, padding: "7px 12px", background: filtroPedidoEstado === key ? "rgba(37,99,235,0.3)" : "rgba(255,255,255,0.05)", color: filtroPedidoEstado === key ? "#60a5fa" : "#94a3b8", border: filtroPedidoEstado === key ? "1px solid rgba(37,99,235,0.5)" : "1px solid rgba(255,255,255,0.08)" }}>
              {label}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {[
            { key: "todos", label: "Todos" },
            { key: "tarjeta", label: "💳 Tarjeta" },
            { key: "rd_pago", label: "🔵 RD Pago" },
          ].map(({ key, label }) => (
            <button key={key} onClick={() => { setFiltroPedidoPago(key); setPaginaPedidos(1); }}
              style={{ ...btnFiltro, fontSize: 12, padding: "7px 12px", background: filtroPedidoPago === key ? "rgba(139,92,246,0.3)" : "rgba(255,255,255,0.05)", color: filtroPedidoPago === key ? "#a78bfa" : "#94a3b8", border: filtroPedidoPago === key ? "1px solid rgba(139,92,246,0.5)" : "1px solid rgba(255,255,255,0.08)" }}>
              {label}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {[
            { key: "todos", label: "Todos" },
            { key: "activos", label: "✅ Activos" },
            { key: "anulados", label: "✗ Anulados" },
          ].map(({ key, label }) => (
            <button key={key} onClick={() => { setFiltroPedidoAnulado(key); setPaginaPedidos(1); }}
              style={{ ...btnFiltro, fontSize: 12, padding: "7px 12px", background: filtroPedidoAnulado === key ? "rgba(239,68,68,0.2)" : "rgba(255,255,255,0.05)", color: filtroPedidoAnulado === key ? "#f87171" : "#94a3b8", border: filtroPedidoAnulado === key ? "1px solid rgba(239,68,68,0.4)" : "1px solid rgba(255,255,255,0.08)" }}>
              {label}
            </button>
          ))}
        </div>
        <span style={{ color: "#94a3b8", fontSize: 13 }}>{pedidosFiltrados.length} pedido{pedidosFiltrados.length !== 1 ? "s" : ""}</span>
      </div>

      {/* TABLA */}
      <div style={tableContainer}>
        <table style={tableStyle}>
          <thead>
            <tr>
              {["CÓDIGO", "CLIENTE", "PROVEEDOR", "TOTAL", "PAGO", "ESTADO", "FECHA", "ACCIÓN"].map(h => (
                <th key={h} style={thStyle}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pedidosPagina.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ ...tdStyle, textAlign: "center", color: "#94a3b8", padding: "40px" }}>
                  No hay pedidos con los filtros aplicados
                </td>
              </tr>
            ) : pedidosPagina.map(p => {
              const proveedores = getProveedoresPedido(p);
              const expandido = pedidoExpandido === p.id;

              return (
                <>
                  {/* FILA PRINCIPAL */}
                  <tr key={p.id} style={{ ...trStyle, opacity: p.anulado ? 0.5 : 1, cursor: "pointer" }}
                    onClick={() => setPedidoExpandido(expandido ? null : p.id)}>
                    <td style={tdStyle}>
                      <span style={{ color: "#60a5fa", fontWeight: 700 }}>{p.codigo || `#${p.id}`}</span>
                      {p.anulado && <div style={{ color: "#f87171", fontSize: 11, fontWeight: 700 }}>✗ Anulado</div>}
                    </td>
                    <td style={tdStyle}>
                      <div style={{ fontWeight: 600 }}>{p.cliente_nombre || "-"}</div>
                      <div style={{ color: "#94a3b8", fontSize: 12 }}>{p.cliente_email}</div>
                    </td>
                    <td style={tdStyle}>
                      {proveedores.length === 0 ? (
                        <span style={{ color: "#64748b" }}>-</span>
                      ) : proveedores.map((prov, i) => (
                        <div key={prov.id} style={{ fontSize: 13, fontWeight: 600, color: "#fbbf24" }}>
                          🏭 {prov.nombre}
                        </div>
                      ))}
                    </td>
                    <td style={{ ...tdStyle, color: "#22c55e", fontWeight: 700 }}>{Number(p.total || 0).toFixed(2)}€</td>
                    <td style={tdStyle}>
                      <span style={{
                        background: p.forma_pago === "rd_pago" ? "rgba(37,99,235,0.2)" : "rgba(139,92,246,0.2)",
                        color: p.forma_pago === "rd_pago" ? "#60a5fa" : "#a78bfa",
                        padding: "3px 8px", borderRadius: 999, fontSize: 11, fontWeight: 700
                      }}>
                        {p.forma_pago === "rd_pago" ? "RD Pago" : "Tarjeta"}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      <span style={{
                        color: p.estado_envio === "entregado" ? "#4ade80" : p.estado_envio === "enviado" ? "#a78bfa" : p.estado_envio === "preparando" ? "#60a5fa" : "#f59e0b",
                        fontWeight: 700, fontSize: 13
                      }}>
                        {p.estado_envio === "entregado" ? "✅ Entregado" : p.estado_envio === "enviado" ? "🚚 Enviado" : p.estado_envio === "preparando" ? "🔧 Preparando" : "⏳ Pendiente"}
                      </span>
                    </td>
                    <td style={{ ...tdStyle, color: "#94a3b8", fontSize: 13 }}>
                      {p.created_at ? new Date(p.created_at).toLocaleDateString("es-ES") : "-"}
                    </td>
                    <td style={tdStyle}>
                      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                        {!p.anulado && p.estado_envio !== "entregado" && (
                          <button
                            onClick={async (e) => {
                              e.stopPropagation();
                              await supabase.from("pedidos").update({ estado_envio: "entregado", fecha_entrega_confirmada: new Date().toISOString() }).eq("id", p.id);
                              await crearPagoProveedorSiNoExiste(p);
                              cargarDatos();
                            }}
                            style={{ background: "rgba(22,163,74,0.15)", color: "#4ade80", border: "none", padding: "6px 12px", borderRadius: 8, cursor: "pointer", fontWeight: 700, fontSize: 12 }}>
                            ✅ Entregado
                          </button>
                        )}
                        {p.estado_envio === "entregado" && <span style={{ color: "#4ade80", fontSize: 12, fontWeight: 700 }}>✅</span>}
                        <span style={{ color: expandido ? "#60a5fa" : "#64748b", fontSize: 16, fontWeight: 700 }}>
                          {expandido ? "▲" : "▼"}
                        </span>
                      </div>
                    </td>
                  </tr>

                  {/* FILA EXPANDIDA: DETALLE DEL PEDIDO */}
                  {expandido && (
                    <tr key={`${p.id}-detalle`} style={{ background: "rgba(15,23,42,0.7)" }}>
                      <td colSpan={8} style={{ padding: "20px 24px" }}>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>

                          {/* COLUMNA IZQUIERDA: Productos */}
                          <div>
                            <h4 style={{ fontWeight: 800, fontSize: 14, color: "#60a5fa", marginBottom: 12 }}>📦 PRODUCTOS DEL PEDIDO</h4>
                            {p.productos && Array.isArray(p.productos) && p.productos.length > 0 ? (
                              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                {p.productos.map((prod: any, i: number) => (
                                  <div key={i} style={{ background: "rgba(255,255,255,0.03)", borderRadius: 10, padding: "10px 14px", border: "1px solid rgba(255,255,255,0.06)" }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                      <div>
                                        <span style={{ fontWeight: 700, fontSize: 14 }}>{prod.referencia || "-"}</span>
                                        <span style={{ color: "#94a3b8", fontSize: 12, marginLeft: 8 }}>{prod.descripcion || prod.nombre || ""}</span>
                                      </div>
                                      <div style={{ textAlign: "right" }}>
                                        <span style={{ color: "#22c55e", fontWeight: 700 }}>{Number(prod.precio || 0).toFixed(2)}€</span>
                                        <span style={{ color: "#94a3b8", fontSize: 12, marginLeft: 6 }}>x{prod.cantidad || 1}</span>
                                      </div>
                                    </div>
                                    <div style={{ fontSize: 12, color: "#fbbf24", marginTop: 4 }}>
                                      🏭 {getNombreProveedor(prod.proveedor_id)}
                                      {prod.marca && <span style={{ color: "#94a3b8", marginLeft: 8 }}>· {prod.marca}</span>}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p style={{ color: "#64748b", fontSize: 13 }}>Sin detalle de productos</p>
                            )}

                            {/* Datos de envío */}
                            {(p.agencia || p.transporte || p.direccion) && (
                              <div style={{ marginTop: 16 }}>
                                <h4 style={{ fontWeight: 800, fontSize: 14, color: "#a78bfa", marginBottom: 8 }}>🚚 ENVÍO</h4>
                                <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 10, padding: "10px 14px", border: "1px solid rgba(255,255,255,0.06)", fontSize: 13 }}>
                                  {p.agencia && <div><span style={{ color: "#94a3b8" }}>Agencia:</span> <span style={{ fontWeight: 600 }}>{p.agencia}</span></div>}
                                  {p.transporte && <div><span style={{ color: "#94a3b8" }}>Transporte:</span> <span style={{ fontWeight: 600 }}>{p.transporte}</span></div>}
                                  {p.coste_transporte != null && <div><span style={{ color: "#94a3b8" }}>Coste:</span> <span style={{ fontWeight: 600, color: "#22c55e" }}>{Number(p.coste_transporte).toFixed(2)}€</span></div>}
                                  {p.direccion && <div><span style={{ color: "#94a3b8" }}>Dirección:</span> <span style={{ fontWeight: 600 }}>{p.direccion}</span></div>}
                                </div>
                              </div>
                            )}
                          </div>

                          {/* COLUMNA DERECHA: Contacto + Chat */}
                          <div>
                            {/* Datos del cliente */}
                            <h4 style={{ fontWeight: 800, fontSize: 14, color: "#4ade80", marginBottom: 12 }}>👤 CLIENTE</h4>
                            <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 10, padding: "12px 14px", border: "1px solid rgba(255,255,255,0.06)", marginBottom: 16, fontSize: 13 }}>
                              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{p.cliente_nombre || "-"}</div>
                              <div style={{ color: "#94a3b8" }}>📧 {p.cliente_email || "-"}</div>
                              {(() => {
                                const contacto = getContacto(p.cliente_id);
                                return contacto?.telefono && contacto.telefono !== "No disponible" ? (
                                  <div style={{ color: "#94a3b8" }}>📞 {contacto.telefono}</div>
                                ) : null;
                              })()}
                            </div>

                            {/* Datos del proveedor */}
                            <h4 style={{ fontWeight: 800, fontSize: 14, color: "#fbbf24", marginBottom: 12 }}>🏭 PROVEEDOR(ES)</h4>
                            {proveedores.length === 0 ? (
                              <p style={{ color: "#64748b", fontSize: 13 }}>Sin proveedor</p>
                            ) : proveedores.map(prov => {
                              const contacto = getContacto(prov.id);
                              return (
                                <div key={prov.id} style={{ background: "rgba(255,255,255,0.03)", borderRadius: 10, padding: "12px 14px", border: "1px solid rgba(255,255,255,0.06)", marginBottom: 10, fontSize: 13 }}>
                                  <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4, color: "#fbbf24" }}>{prov.nombre}</div>
                                  {contacto && (
                                    <>
                                      <div style={{ color: "#94a3b8" }}>📧 {contacto.email}</div>
                                      {contacto.telefono !== "No disponible" && (
                                        <div style={{ color: "#94a3b8" }}>📞 {contacto.telefono}</div>
                                      )}
                                    </>
                                  )}
                                  {/* Botón ver chat */}
                                  {p.cliente_id && (
                                    <button
                                      onClick={(e) => { e.stopPropagation(); abrirChat(p.cliente_id!, prov.id); }}
                                      style={{
                                        marginTop: 8, background: "rgba(37,99,235,0.15)", border: "1px solid rgba(37,99,235,0.3)",
                                        color: "#60a5fa", padding: "6px 14px", borderRadius: 8, cursor: "pointer", fontWeight: 700, fontSize: 12
                                      }}>
                                      💬 Ver chat cliente ↔ proveedor
                                    </button>
                                  )}
                                </div>
                              );
                            })}

                            {/* Resumen económico */}
                            <h4 style={{ fontWeight: 800, fontSize: 14, color: "#22c55e", marginTop: 16, marginBottom: 8 }}>💰 RESUMEN</h4>
                            <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 10, padding: "12px 14px", border: "1px solid rgba(255,255,255,0.06)", fontSize: 13 }}>
                              {p.subtotal != null && <div><span style={{ color: "#94a3b8" }}>Subtotal:</span> <span style={{ fontWeight: 600 }}>{Number(p.subtotal).toFixed(2)}€</span></div>}
                              {p.coste_transporte != null && <div><span style={{ color: "#94a3b8" }}>Transporte:</span> <span style={{ fontWeight: 600 }}>{Number(p.coste_transporte).toFixed(2)}€</span></div>}
                              <div style={{ marginTop: 4, paddingTop: 4, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                                <span style={{ color: "#94a3b8" }}>Total:</span> <span style={{ fontWeight: 900, color: "#22c55e", fontSize: 18 }}>{Number(p.total || 0).toFixed(2)}€</span>
                              </div>
                              <div style={{ marginTop: 4 }}>
                                <span style={{ color: "#94a3b8" }}>Pago:</span> <span style={{ fontWeight: 600 }}>{p.forma_pago === "rd_pago" ? "RD Pago" : "Tarjeta"}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* PAGINACIÓN */}
      {totalPaginasPedidos > 1 && (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 8, marginTop: 20 }}>
          <button onClick={() => setPaginaPedidos(1)} disabled={paginaPedidos === 1} style={{ ...btnPagina, opacity: paginaPedidos === 1 ? 0.3 : 1 }}>««</button>
          <button onClick={() => setPaginaPedidos(p => Math.max(1, p - 1))} disabled={paginaPedidos === 1} style={{ ...btnPagina, opacity: paginaPedidos === 1 ? 0.3 : 1 }}>← Anterior</button>
          <div style={{ display: "flex", gap: 4 }}>
            {Array.from({ length: Math.min(5, totalPaginasPedidos) }, (_, i) => {
              let page: number;
              if (totalPaginasPedidos <= 5) page = i + 1;
              else if (paginaPedidos <= 3) page = i + 1;
              else if (paginaPedidos >= totalPaginasPedidos - 2) page = totalPaginasPedidos - 4 + i;
              else page = paginaPedidos - 2 + i;
              return (
                <button key={page} onClick={() => setPaginaPedidos(page)}
                  style={{ width: 36, height: 36, borderRadius: 8, border: "none", cursor: "pointer", fontWeight: 700, fontSize: 14, background: paginaPedidos === page ? "linear-gradient(135deg,#2563eb,#1d4ed8)" : "rgba(255,255,255,0.06)", color: paginaPedidos === page ? "white" : "#94a3b8" }}>
                  {page}
                </button>
              );
            })}
          </div>
          <button onClick={() => setPaginaPedidos(p => Math.min(totalPaginasPedidos, p + 1))} disabled={paginaPedidos === totalPaginasPedidos} style={{ ...btnPagina, opacity: paginaPedidos === totalPaginasPedidos ? 0.3 : 1 }}>Siguiente →</button>
          <button onClick={() => setPaginaPedidos(totalPaginasPedidos)} disabled={paginaPedidos === totalPaginasPedidos} style={{ ...btnPagina, opacity: paginaPedidos === totalPaginasPedidos ? 0.3 : 1 }}>»»</button>
          <span style={{ color: "#94a3b8", fontSize: 13 }}>Pág <strong style={{ color: "white" }}>{paginaPedidos}</strong> de <strong style={{ color: "white" }}>{totalPaginasPedidos}</strong></span>
        </div>
      )}
    </div>
  );
}