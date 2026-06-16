import * as XLSX from "xlsx";
import { supabase } from "../lib/supabase";
import { useState } from "react";
import { Usuario, PagoProveedor, SUSCRIPCION_LABELS, tipoBadge, tableContainer, tableStyle, thStyle, trStyle, tdStyle, seccionCard, btnAccion, btnExportar, kpiCard, kpiLabel, kpiNum } from "./types";

type Props = {
  usuarios: Usuario[];
  pagosProveedores: PagoProveedor[];
  cambiarSuscripcion: (id: string, sub: string) => void;
  setUsuarios: (fn: (prev: Usuario[]) => Usuario[]) => void;
  setUsuarioEditando: (u: Usuario) => void;
  setNotasTemp: (n: string) => void;
  marcarPagado: (id: number) => void;
  generarRemesaPagos: () => void;
  pedidos: any[];
};

function usuariosProximosACobrar(usuarios: Usuario[]) {
  const ahora = new Date();
  return usuarios.filter(u => {
    if (u.suscripcion !== "gratuito" || !u.fecha_registro) return false;
    const dias = Math.floor((ahora.getTime() - new Date(u.fecha_registro).getTime()) / (1000 * 60 * 60 * 24));
    return dias >= 20 && dias <= 35;
  });
}

function HistorialCredito({ userId, pedidos }: { userId: string; pedidos: any[] }) {
  const pedidosUsuario = pedidos.filter(p => p.cliente_id === userId && p.forma_pago === "rd_pago");
  const totalUsado = pedidosUsuario.reduce((acc: number, p: any) => acc + Number(p.total || 0), 0);
  if (pedidosUsuario.length === 0) return <p style={{ color: "#94a3b8", fontSize: 13, textAlign: "center" as const, padding: "20px 0" }}>No hay pedidos con RD Pago</p>;
  return (
    <div>
      <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 10, padding: "10px 16px", marginBottom: 12 }}>
        <p style={{ color: "#f87171", fontSize: 13, fontWeight: 700, margin: 0 }}>Total usado: {totalUsado.toFixed(2)}€ en {pedidosUsuario.length} pedido{pedidosUsuario.length !== 1 ? "s" : ""}</p>
      </div>
      <div style={{ maxHeight: 200, overflowY: "auto" as const }}>
        {pedidosUsuario.map((p: any) => (
          <div key={p.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.04)", fontSize: 13 }}>
            <div><span style={{ color: "#60a5fa", fontWeight: 700 }}>{p.codigo || "#" + p.id}</span><span style={{ color: "#94a3b8", marginLeft: 10 }}>{p.created_at ? new Date(p.created_at).toLocaleDateString("es-ES") : "-"}</span></div>
            <span style={{ color: "#f87171", fontWeight: 700 }}>-{Number(p.total).toFixed(2)}€</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function SeccionFinanciero({ usuarios, pagosProveedores, cambiarSuscripcion, setUsuarios, setUsuarioEditando, setNotasTemp, marcarPagado, generarRemesaPagos, pedidos }: Props) {
  const [creditoEditando, setCreditoEditando] = useState<string | null>(null);
  const [creditoTemp, setCreditoTemp] = useState("");
  const [ibanEditando, setIbanEditando] = useState<string | null>(null);
  const [ibanTemp, setIbanTemp] = useState("");
  const [renovandoCredito, setRenovandoCredito] = useState<string | null>(null);
  const [marcandoMoroso, setMarcandoMoroso] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState("");
  const [orden, setOrden] = useState<"empresa" | "credito" | "moroso" | "siniban">("empresa");

  async function guardarCredito(id: string) {
    const credito = parseFloat(creditoTemp);
    if (isNaN(credito) || credito < 0) { alert("Importe inválido"); return; }
    await supabase.from("usuarios").update({ credito_rd: credito, credito_rd_maximo: credito }).eq("id", id);
    setUsuarios(prev => prev.map(u => u.id === id ? { ...u, credito_rd: credito, credito_rd_maximo: credito } : u));
    setCreditoEditando(null);
  }

  async function guardarIban(id: string) {
    if (!ibanTemp.trim()) { alert("IBAN inválido"); return; }
    await supabase.from("usuarios").update({ iban: ibanTemp.trim().toUpperCase() }).eq("id", id);
    setUsuarios(prev => prev.map(u => u.id === id ? { ...u, iban: ibanTemp.trim().toUpperCase() } : u));
    setIbanEditando(null);
  }

  async function renovarCreditoRD(u: Usuario) {
    const maximo = Number(u.credito_rd_maximo || u.credito_rd || 0);
    if (maximo <= 0) { alert("Configura primero el crédito máximo con el lápiz."); return; }
    if (!confirm(`¿Renovar crédito RD de ${u.nombre_empresa} a ${maximo.toFixed(2)}€?`)) return;
    setRenovandoCredito(u.id);
    await supabase.from("usuarios").update({ credito_rd: maximo }).eq("id", u.id);
    setUsuarios(prev => prev.map(x => x.id === u.id ? { ...x, credito_rd: maximo } : x));
    setRenovandoCredito(null);
  }

  async function marcarMoroso(u: Usuario) {
    if (!confirm(`¿Marcar como moroso a ${u.nombre_empresa}? Se le quitará el crédito RD.`)) return;
    setMarcandoMoroso(u.id);
    await supabase.from("usuarios").update({ credito_rd: 0, suscripcion: "moroso" }).eq("id", u.id);
    setUsuarios(prev => prev.map(x => x.id === u.id ? { ...x, credito_rd: 0, suscripcion: "moroso" } : x));
    setMarcandoMoroso(null);
  }

  const proximos = usuariosProximosACobrar(usuarios);

  const usuariosFiltrados = usuarios
    .filter(u => {
      if (!busqueda.trim()) return true;
      const q = busqueda.toLowerCase();
      return (u.nombre_empresa || "").toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
    })
    .sort((a, b) => {
      if (orden === "empresa") return (a.nombre_empresa || "").localeCompare(b.nombre_empresa || "");
      if (orden === "credito") return Number(b.credito_rd || 0) - Number(a.credito_rd || 0);
      if (orden === "moroso") return (b.suscripcion === "moroso" ? 1 : 0) - (a.suscripcion === "moroso" ? 1 : 0);
      if (orden === "siniban") return (!a.iban ? -1 : 1) - (!b.iban ? -1 : 1);
      return 0;
    });

  const ordenOpciones: { key: typeof orden; label: string }[] = [
    { key: "empresa",  label: "A-Z Empresa" },
    { key: "credito",  label: "Mayor crédito" },
    { key: "moroso",   label: "Morosos primero" },
    { key: "siniban",  label: "Sin IBAN primero" },
  ];

  return (
    <div>
      <h1 style={{ fontSize: 56, fontWeight: 900, lineHeight: 1, marginBottom: 12 }}>FINANCIERO</h1>
      <p style={{ color: "#94a3b8", fontSize: 18, marginBottom: 36 }}>Créditos RD, IBAN proveedores y pagos a 7 días.</p>

      {proximos.length > 0 && (
        <div style={{ background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.3)", borderRadius: 16, padding: "16px 20px", marginBottom: 28 }}>
          <p style={{ fontWeight: 800, color: "#fbbf24", marginBottom: 12 }}>📞 {proximos.length} usuario{proximos.length > 1 ? "s" : ""} próximos a cumplir 1 mes gratuito — llámales para enviar el mandato SEPA</p>
          {proximos.map(u => {
            const dias = Math.floor((new Date().getTime() - new Date(u.fecha_registro!).getTime()) / (1000 * 60 * 60 * 24));
            return (
              <div key={u.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(0,0,0,0.2)", borderRadius: 10, padding: "10px 14px", marginTop: 8 }}>
                <div>
                  <span style={{ fontWeight: 700 }}>{u.nombre_empresa}</span>
                  <span style={{ color: "#94a3b8", fontSize: 13, marginLeft: 10 }}>{u.email}</span>
                  {u.telefono && <span style={{ color: "#60a5fa", fontSize: 13, marginLeft: 10 }}>📞 {u.telefono}</span>}
                  <span style={{ color: "#fbbf24", fontSize: 12, marginLeft: 10 }}>Día {dias} de 30</span>
                </div>
                <button onClick={() => cambiarSuscripcion(u.id, "pendiente")} style={{ background: "rgba(245,158,11,0.2)", border: "1px solid rgba(245,158,11,0.4)", color: "#fbbf24", padding: "6px 14px", borderRadius: 8, cursor: "pointer", fontWeight: 700, fontSize: 13 }}>Pasar a Pendiente</button>
              </div>
            );
          })}
        </div>
      )}

      <div style={{ ...seccionCard, marginBottom: 28 }}>
        <h2 style={{ fontSize: 20, fontWeight: 900, marginBottom: 6 }}>💳 Crédito RD e IBAN por usuario</h2>
        <p style={{ color: "#94a3b8", fontSize: 13, marginBottom: 16 }}>Cuando el taller pague la remesa, pulsa <strong style={{ color: "#4ade80" }}>Renovar</strong>. Si no ha pagado, pulsa <strong style={{ color: "#f87171" }}>Moroso</strong>.</p>

        {/* FILTRO Y ORDEN */}
        <div style={{ display: "flex", gap: 12, marginBottom: 16, alignItems: "center", flexWrap: "wrap" as const }}>
          <input
            placeholder="Buscar empresa o email..."
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            style={{ background: "#0f172a", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: "10px 14px", color: "white", fontSize: 14, outline: "none", minWidth: 240 }}
          />
          <div style={{ display: "flex", gap: 8 }}>
            {ordenOpciones.map(({ key, label }) => (
              <button key={key} onClick={() => setOrden(key)} style={{ padding: "8px 14px", borderRadius: 999, fontWeight: 700, cursor: "pointer", fontSize: 13, border: "none", background: orden === key ? "linear-gradient(135deg,#2563eb,#1d4ed8)" : "rgba(255,255,255,0.05)", color: orden === key ? "white" : "#94a3b8" }}>{label}</button>
            ))}
          </div>
          <span style={{ color: "#94a3b8", fontSize: 13 }}>{usuariosFiltrados.length} usuarios</span>
        </div>

        <div style={tableContainer}>
          <table style={tableStyle}>
            <thead><tr>{["EMPRESA", "TIPO", "CRÉDITO ACTUAL", "CRÉDITO MÁX", "IBAN", "ACCIONES"].map(h => <th key={h} style={thStyle}>{h}</th>)}</tr></thead>
            <tbody>
              {usuariosFiltrados.map(u => (
                <tr key={u.id} style={{ ...trStyle, background: u.suscripcion === "moroso" ? "rgba(239,68,68,0.04)" : "transparent" }}>
                  <td style={tdStyle}>
                    <strong>{u.nombre_empresa || "-"}</strong>
                    <div style={{ color: "#94a3b8", fontSize: 12 }}>{u.email}</div>
                    {u.suscripcion === "moroso" && <span style={{ background: "rgba(239,68,68,0.2)", color: "#f87171", padding: "1px 8px", borderRadius: 999, fontSize: 11, fontWeight: 700 }}>MOROSO</span>}
                  </td>
                  <td style={tdStyle}><span style={tipoBadge(u.tipo)}>{u.tipo}</span></td>
                  <td style={tdStyle}>
                    {creditoEditando === u.id ? (
                      <div style={{ display: "flex", gap: 6 }}>
                        <input value={creditoTemp} onChange={e => setCreditoTemp(e.target.value)} type="number" style={{ width: 90, background: "#020617", color: "white", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 6, padding: "4px 8px", fontSize: 13 }} />
                        <button onClick={() => guardarCredito(u.id)} style={{ background: "rgba(22,163,74,0.2)", color: "#4ade80", border: "none", borderRadius: 6, padding: "4px 10px", cursor: "pointer", fontWeight: 700 }}>✓</button>
                        <button onClick={() => setCreditoEditando(null)} style={{ background: "rgba(255,255,255,0.05)", color: "#94a3b8", border: "none", borderRadius: 6, padding: "4px 8px", cursor: "pointer" }}>✕</button>
                      </div>
                    ) : (
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ color: (u.credito_rd || 0) > 0 ? "#4ade80" : "#94a3b8", fontWeight: 700, fontSize: 16 }}>{Number(u.credito_rd || 0).toFixed(2)}€</span>
                        <button onClick={() => { setCreditoEditando(u.id); setCreditoTemp(String(u.credito_rd || 0)); }} style={{ background: "rgba(37,99,235,0.15)", color: "#60a5fa", border: "none", borderRadius: 6, padding: "3px 8px", cursor: "pointer", fontSize: 12 }}>✏️</button>
                      </div>
                    )}
                  </td>
                  <td style={tdStyle}><span style={{ color: "#94a3b8", fontSize: 13 }}>{Number(u.credito_rd_maximo || 0).toFixed(2)}€</span></td>
                  <td style={tdStyle}>
                    {ibanEditando === u.id ? (
                      <div style={{ display: "flex", gap: 6 }}>
                        <input value={ibanTemp} onChange={e => setIbanTemp(e.target.value)} placeholder="ES12 1234..." style={{ width: 200, background: "#020617", color: "white", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 6, padding: "4px 8px", fontSize: 12 }} />
                        <button onClick={() => guardarIban(u.id)} style={{ background: "rgba(22,163,74,0.2)", color: "#4ade80", border: "none", borderRadius: 6, padding: "4px 10px", cursor: "pointer", fontWeight: 700 }}>✓</button>
                        <button onClick={() => setIbanEditando(null)} style={{ background: "rgba(255,255,255,0.05)", color: "#94a3b8", border: "none", borderRadius: 6, padding: "4px 8px", cursor: "pointer" }}>✕</button>
                      </div>
                    ) : (
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ color: u.iban ? "#60a5fa" : "#f87171", fontSize: 12, fontFamily: "monospace" }}>{u.iban || "⚠️ Sin IBAN"}</span>
                        <button onClick={() => { setIbanEditando(u.id); setIbanTemp(u.iban || ""); }} style={{ background: "rgba(37,99,235,0.15)", color: "#60a5fa", border: "none", borderRadius: 6, padding: "3px 8px", cursor: "pointer", fontSize: 12 }}>✏️</button>
                      </div>
                    )}
                  </td>
                  <td style={tdStyle}>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" as const }}>
                      <button onClick={() => renovarCreditoRD(u)} disabled={renovandoCredito === u.id || Number(u.credito_rd_maximo || 0) <= 0} style={{ background: Number(u.credito_rd_maximo || 0) > 0 ? "rgba(22,163,74,0.2)" : "rgba(255,255,255,0.05)", color: Number(u.credito_rd_maximo || 0) > 0 ? "#4ade80" : "#475569", border: "none", padding: "6px 12px", borderRadius: 8, cursor: Number(u.credito_rd_maximo || 0) > 0 ? "pointer" : "not-allowed", fontWeight: 700, fontSize: 12, whiteSpace: "nowrap" as const }}>
                        {renovandoCredito === u.id ? "..." : "🔄 Renovar"}
                      </button>
                      <button onClick={() => marcarMoroso(u)} disabled={marcandoMoroso === u.id || u.suscripcion === "moroso"} style={{ background: u.suscripcion === "moroso" ? "rgba(255,255,255,0.05)" : "rgba(239,68,68,0.15)", color: u.suscripcion === "moroso" ? "#475569" : "#f87171", border: "none", padding: "6px 12px", borderRadius: 8, cursor: u.suscripcion === "moroso" ? "not-allowed" : "pointer", fontWeight: 700, fontSize: 12, whiteSpace: "nowrap" as const }}>
                        {marcandoMoroso === u.id ? "..." : u.suscripcion === "moroso" ? "✓ Moroso" : "🚫 Moroso"}
                      </button>
                      <button onClick={() => { setUsuarioEditando(u); setNotasTemp(u.notas_admin || ""); }} style={{ ...btnAccion, fontSize: 12 }}>📝</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* MODAL CRÉDITO */}
        {creditoEditando && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 99999, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ background: "#0f172a", borderRadius: 20, padding: 32, width: 560, border: "1px solid rgba(255,255,255,0.1)", maxHeight: "80vh", overflowY: "auto" as const }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <h3 style={{ fontWeight: 900, fontSize: 18, margin: 0 }}>Credito RD — {usuarios.find(u => u.id === creditoEditando)?.nombre_empresa}</h3>
                <button onClick={() => setCreditoEditando(null)} style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: 20 }}>✕</button>
              </div>
              <div style={{ background: "rgba(37,99,235,0.08)", border: "1px solid rgba(37,99,235,0.2)", borderRadius: 12, padding: 14, marginBottom: 16 }}>
                <p style={{ color: "#60a5fa", fontSize: 13, margin: 0 }}>💡 Al guardar este importe se usará también como <strong>crédito máximo</strong> para futuras renovaciones.</p>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
                <div style={{ background: "rgba(37,99,235,0.1)", border: "1px solid rgba(37,99,235,0.2)", borderRadius: 12, padding: 16 }}>
                  <p style={{ color: "#94a3b8", fontSize: 11, fontWeight: 700, marginBottom: 6 }}>CRÉDITO ACTUAL</p>
                  <p style={{ fontSize: 28, fontWeight: 900, color: "#4ade80", margin: 0 }}>{Number(usuarios.find(u => u.id === creditoEditando)?.credito_rd || 0).toFixed(2)}€</p>
                </div>
                <div style={{ background: "rgba(15,23,42,0.95)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: 16 }}>
                  <p style={{ color: "#94a3b8", fontSize: 11, fontWeight: 700, marginBottom: 6 }}>ASIGNAR CRÉDITO</p>
                  <div style={{ display: "flex", gap: 8 }}>
                    <input value={creditoTemp} onChange={e => setCreditoTemp(e.target.value)} type="number" placeholder="0.00" style={{ flex: 1, background: "#020617", color: "white", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "8px 12px", fontSize: 14, outline: "none" }} />
                    <button onClick={() => guardarCredito(creditoEditando)} style={{ background: "linear-gradient(135deg,#16a34a,#15803d)", border: "none", color: "white", padding: "8px 14px", borderRadius: 8, cursor: "pointer", fontWeight: 700 }}>OK</button>
                  </div>
                </div>
              </div>
              <p style={{ color: "#94a3b8", fontSize: 12, fontWeight: 700, marginBottom: 10 }}>HISTORIAL PEDIDOS CON RD PAGO</p>
              <HistorialCredito userId={creditoEditando} pedidos={pedidos} />
              <button onClick={() => setCreditoEditando(null)} style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#94a3b8", padding: 12, borderRadius: 10, cursor: "pointer", fontWeight: 700, marginTop: 16 }}>Cerrar</button>
            </div>
          </div>
        )}
      </div>

      {/* PAGOS PROVEEDORES */}
      <div style={seccionCard}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 900 }}>🏦 Pagos a proveedores (7 días post-entrega)</h2>
            <p style={{ color: "#94a3b8", fontSize: 13, marginTop: 4 }}>Pendientes: <strong style={{ color: "#fbbf24" }}>{pagosProveedores.filter(p => p.estado === "listo_para_pagar").length}</strong> · Pagados: <strong style={{ color: "#4ade80" }}>{pagosProveedores.filter(p => p.estado === "pagado").length}</strong></p>
          </div>
          <button onClick={generarRemesaPagos} style={btnExportar}>⬇️ Remesa SEPA Excel</button>
        </div>
        {pagosProveedores.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px", color: "#94a3b8" }}><p style={{ fontSize: 40, marginBottom: 8 }}>🏦</p><p>No hay pagos registrados aún</p></div>
        ) : (
          <div style={tableContainer}>
            <table style={tableStyle}>
              <thead><tr>{["PEDIDO", "PROVEEDOR", "IMPORTE", "ENTREGADO", "PAGAR EL", "ESTADO", "ACCIÓN"].map(h => <th key={h} style={thStyle}>{h}</th>)}</tr></thead>
              <tbody>
                {pagosProveedores.map(pago => {
                  const proveedor = usuarios.find(u => u.id === pago.proveedor_id);
                  const diasRestantes = pago.fecha_pago_programado ? Math.ceil((new Date(pago.fecha_pago_programado).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : null;
                  return (
                    <tr key={pago.id} style={trStyle}>
                      <td style={{ ...tdStyle, color: "#60a5fa", fontWeight: 700 }}>#{pago.pedido_id}</td>
                      <td style={tdStyle}><div style={{ fontWeight: 700 }}>{proveedor?.nombre_empresa || "-"}</div><div style={{ color: "#94a3b8", fontSize: 11, fontFamily: "monospace" }}>{proveedor?.iban || "⚠️ Sin IBAN"}</div></td>
                      <td style={{ ...tdStyle, color: "#22c55e", fontWeight: 900, fontSize: 16 }}>{Number(pago.importe).toFixed(2)}€</td>
                      <td style={{ ...tdStyle, color: "#94a3b8", fontSize: 13 }}>{pago.fecha_entrega ? new Date(pago.fecha_entrega).toLocaleDateString("es-ES") : "-"}</td>
                      <td style={tdStyle}>{pago.fecha_pago_programado ? <div><div style={{ fontWeight: 700 }}>{new Date(pago.fecha_pago_programado).toLocaleDateString("es-ES")}</div>{diasRestantes !== null && pago.estado !== "pagado" && <div style={{ fontSize: 12, color: diasRestantes <= 0 ? "#f87171" : diasRestantes <= 2 ? "#fbbf24" : "#94a3b8" }}>{diasRestantes <= 0 ? "⚠️ Vencido" : `${diasRestantes}d restantes`}</div>}</div> : "-"}</td>
                      <td style={tdStyle}><span style={{ background: pago.estado === "pagado" ? "rgba(22,163,74,0.2)" : pago.estado === "listo_para_pagar" ? "rgba(245,158,11,0.2)" : "rgba(255,255,255,0.05)", color: pago.estado === "pagado" ? "#4ade80" : pago.estado === "listo_para_pagar" ? "#fbbf24" : "#94a3b8", padding: "4px 10px", borderRadius: 999, fontSize: 12, fontWeight: 700 }}>{pago.estado === "pagado" ? "✅ Pagado" : pago.estado === "listo_para_pagar" ? "⏳ Listo" : "🕐 Esperando"}</span></td>
                      <td style={tdStyle}>{pago.estado === "listo_para_pagar" && <button onClick={() => marcarPagado(pago.id)} style={{ background: "rgba(22,163,74,0.2)", color: "#4ade80", border: "none", padding: "6px 12px", borderRadius: 8, cursor: "pointer", fontWeight: 700, fontSize: 13 }}>✓ Marcar pagado</button>}{pago.estado === "pagado" && pago.fecha_pago_realizado && <span style={{ color: "#94a3b8", fontSize: 12 }}>{new Date(pago.fecha_pago_realizado).toLocaleDateString("es-ES")}</span>}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}