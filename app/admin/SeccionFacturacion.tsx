import * as XLSX from "xlsx";
import { Usuario, Pedido, tipoBadge, tableContainer, tableStyle, thStyle, trStyle, tdStyle, kpiCard, kpiLabel, kpiNum, btnExportar } from "./types";

type Props = { usuarios: Usuario[]; pedidos: Pedido[] };

export default function SeccionFacturacion({ usuarios, pedidos }: Props) {
  const [mesFacturacion, setMesFacturacion] = require("react").useState(() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`; });

  function calcularFacturacionUsuario(u: Usuario) {
    const [anio, mesNum] = mesFacturacion.split("-").map(Number);
    const suscripcion = (u.suscripcion !== "gratuito" && u.suscripcion !== "cancelado") ? 25 : 0;
    const ftp = u.ftp_activo ? 10 : 0;
    const pedidosMes = pedidos.filter(p => { if (!p.created_at || p.anulado) return false; const f = new Date(p.created_at); return f.getFullYear() === anio && (f.getMonth()+1) === mesNum && p.cliente_id === u.id && p.forma_pago === "rd_pago"; });
    const portes = pedidosMes.reduce((acc, p) => acc + Number(p.coste_transporte || 0), 0);
    return { suscripcion, ftp, portes, total: suscripcion + ftp + portes, numPedidosPortes: pedidosMes.length };
  }

  const usuariosConFactura = usuarios.filter(u => u.tipo !== "admin").filter(u => calcularFacturacionUsuario(u).total > 0).sort((a,b) => calcularFacturacionUsuario(b).total - calcularFacturacionUsuario(a).total);
  const [anioFact, mesFact] = mesFacturacion.split("-").map(Number);
  const nombreMesFact = new Date(anioFact, mesFact-1).toLocaleDateString("es-ES", { month:"long", year:"numeric" });
  const totalFactMes = usuariosConFactura.reduce((acc,u) => acc + calcularFacturacionUsuario(u).total, 0);
  const totalSuscMes = usuariosConFactura.reduce((acc,u) => acc + calcularFacturacionUsuario(u).suscripcion, 0);
  const totalFtpMes = usuariosConFactura.reduce((acc,u) => acc + calcularFacturacionUsuario(u).ftp, 0);
  const totalPortesMes = usuariosConFactura.reduce((acc,u) => acc + calcularFacturacionUsuario(u).portes, 0);

  function exportarParaHolded() {
    const rows = usuariosConFactura.map(u => { const f = calcularFacturacionUsuario(u); return { "Empresa": u.nombre_empresa||"-", "CIF": u.cif||"-", "Email": u.email, "Ciudad": u.ciudad||"-", "Suscripción plataforma": f.suscripcion > 0 ? `${f.suscripcion.toFixed(2)}€` : "-", "FTP Sync": f.ftp > 0 ? `${f.ftp.toFixed(2)}€` : "-", "Portes RD Pago": f.portes > 0 ? `${f.portes.toFixed(2)}€` : "-", "Nº pedidos con porte": f.numPedidosPortes || "-", "Base imponible": f.total.toFixed(2), "IVA 21%": (f.total*0.21).toFixed(2), "TOTAL FACTURA": (f.total*1.21).toFixed(2) }; });
    const wb = XLSX.utils.book_new(); const ws = XLSX.utils.json_to_sheet(rows); XLSX.utils.book_append_sheet(wb, ws, "Facturación"); XLSX.writeFile(wb, `facturacion_recambiodirecto_${mesFacturacion}.xlsx`);
  }

  return (
    <div>
      <h1 style={{ fontSize: 56, fontWeight: 900, lineHeight: 1, marginBottom: 12 }}>FACTURACIÓN</h1>
      <p style={{ color: "#94a3b8", fontSize: 18, marginBottom: 36 }}>Resumen mensual para emitir facturas en Holded.</p>
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 28 }}>
        <label style={{ color: "#94a3b8", fontWeight: 700 }}>Mes a facturar:</label>
        <input type="month" value={mesFacturacion} onChange={e => setMesFacturacion(e.target.value)} style={{ background: "#0f172a", color: "white", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "10px 16px", fontSize: 15, outline: "none" }} />
        <span style={{ color: "#60a5fa", fontWeight: 700, fontSize: 16 }}>{nombreMesFact}</span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 20, marginBottom: 28 }}>
        {[
          { label: "TOTAL A FACTURAR", value: `${(totalFactMes*1.21).toFixed(2)}€`, color: "#22c55e", desc: "IVA incluido" },
          { label: "SUSCRIPCIONES", value: `${totalSuscMes.toFixed(2)}€`, color: "#60a5fa", desc: `${usuariosConFactura.filter(u => calcularFacturacionUsuario(u).suscripcion > 0).length} usuarios` },
          { label: "FTP SYNC", value: `${totalFtpMes.toFixed(2)}€`, color: "#a78bfa", desc: `${usuariosConFactura.filter(u => calcularFacturacionUsuario(u).ftp > 0).length} usuarios` },
          { label: "PORTES RD PAGO", value: `${totalPortesMes.toFixed(2)}€`, color: "#fbbf24", desc: "A recuperar" },
        ].map(({ label, value, color, desc }) => (<div key={label} style={kpiCard}><p style={kpiLabel}>{label}</p><h2 style={{ ...kpiNum, color }}>{value}</h2><p style={{ color: "#94a3b8", fontSize: 12, marginTop: 4 }}>{desc}</p></div>))}
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 20 }}>
        <button onClick={exportarParaHolded} disabled={usuariosConFactura.length === 0} style={{ ...btnExportar, opacity: usuariosConFactura.length === 0 ? 0.5 : 1 }}>⬇️ Exportar para Holded ({nombreMesFact})</button>
      </div>
      {usuariosConFactura.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 0", color: "#94a3b8" }}><p style={{ fontSize: 48, marginBottom: 16 }}>🧾</p><p style={{ fontSize: 18, fontWeight: 700 }}>No hay nada que facturar este mes</p></div>
      ) : (
        <div style={tableContainer}>
          <table style={tableStyle}>
            <thead><tr>{["EMPRESA","CIF","TIPO","SUSCRIPCIÓN","FTP +10€","PORTES RD","BASE IMP.","IVA 21%","TOTAL"].map(h => <th key={h} style={thStyle}>{h}</th>)}</tr></thead>
            <tbody>
              {usuariosConFactura.map(u => { const f = calcularFacturacionUsuario(u); return (
                <tr key={u.id} style={trStyle}>
                  <td style={tdStyle}><div style={{ fontWeight: 700 }}>{u.nombre_empresa||"-"}</div><div style={{ color: "#94a3b8", fontSize: 12 }}>{u.email}</div></td>
                  <td style={{ ...tdStyle, color: "#94a3b8", fontSize: 13 }}>{u.cif||"-"}</td>
                  <td style={tdStyle}><span style={tipoBadge(u.tipo)}>{u.tipo}</span></td>
                  <td style={tdStyle}>{f.suscripcion > 0 ? <span style={{ color: "#4ade80", fontWeight: 700 }}>25,00€</span> : <span style={{ color: "#94a3b8" }}>—</span>}</td>
                  <td style={tdStyle}>{f.ftp > 0 ? <span style={{ color: "#a78bfa", fontWeight: 700 }}>10,00€</span> : <span style={{ color: "#94a3b8" }}>—</span>}</td>
                  <td style={tdStyle}>{f.portes > 0 ? <div><span style={{ color: "#fbbf24", fontWeight: 700 }}>{f.portes.toFixed(2)}€</span><div style={{ color: "#94a3b8", fontSize: 11 }}>{f.numPedidosPortes} pedidos</div></div> : <span style={{ color: "#94a3b8" }}>—</span>}</td>
                  <td style={{ ...tdStyle, fontWeight: 700 }}>{f.total.toFixed(2)}€</td>
                  <td style={{ ...tdStyle, color: "#94a3b8" }}>{(f.total*0.21).toFixed(2)}€</td>
                  <td style={tdStyle}><span style={{ color: "#22c55e", fontWeight: 900, fontSize: 16 }}>{(f.total*1.21).toFixed(2)}€</span></td>
                </tr>
              ); })}
              <tr style={{ background: "rgba(37,99,235,0.08)", borderTop: "2px solid rgba(37,99,235,0.3)" }}>
                <td colSpan={6} style={{ padding: "14px 16px", fontWeight: 900, color: "#60a5fa" }}>TOTALES ({usuariosConFactura.length} facturas)</td>
                <td style={{ padding: "14px 16px", fontWeight: 900 }}>{totalFactMes.toFixed(2)}€</td>
                <td style={{ padding: "14px 16px", fontWeight: 900, color: "#94a3b8" }}>{(totalFactMes*0.21).toFixed(2)}€</td>
                <td style={{ padding: "14px 16px" }}><span style={{ color: "#22c55e", fontWeight: 900, fontSize: 18 }}>{(totalFactMes*1.21).toFixed(2)}€</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}