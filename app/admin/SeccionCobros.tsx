import * as XLSX from "xlsx";
import { Usuario, Pedido, SUSCRIPCION_LABELS, tipoBadge, subBadge, selectSub, tableContainer, tableStyle, thStyle, trStyle, tdStyle, kpiCard, kpiLabel, kpiNum, btnExportar } from "./types";

type Props = {
  usuarios: Usuario[];
  pedidos: Pedido[];
  cambiarSuscripcion: (id: string, sub: string) => void;
};

export default function SeccionCobros({ usuarios, pedidos, cambiarSuscripcion }: Props) {
  const enGratuito = usuarios.filter(u => u.suscripcion === "gratuito").length;
  const activos = usuarios.filter(u => u.suscripcion === "activo").length;
  const morosos = usuarios.filter(u => u.suscripcion === "moroso").length;
  const facturacionMes = activos * 25;

  async function exportarIngresos() {
    const { supabase } = await import("../lib/supabase");
    const { data: pedidosData } = await supabase.from("pedidos").select("*").eq("anulado", false).order("id", { ascending: false });
    if (!pedidosData || pedidosData.length === 0) { alert("No hay pedidos para exportar"); return; }
    const rows: any[] = [];
    for (const p of pedidosData) {
      const productos = p.productos || [];
      let proveedorData: any = null;
      if (productos.length > 0 && productos[0].proveedor_id) {
        const { data: prov } = await supabase.from("usuarios").select("nombre_empresa, cif, direccion, ciudad, codigo_postal, provincia").eq("id", productos[0].proveedor_id).single();
        proveedorData = prov;
      }
      rows.push({ "Fecha Ingreso": p.created_at ? new Date(p.created_at).toLocaleDateString("es-ES") : "-", "Cod. Transporte": p.agencia || p.transporte || "-", "Cod. Pedido": p.codigo || String(p.id), "Fecha Pedido": p.created_at ? new Date(p.created_at).toLocaleDateString("es-ES") : "-", "Nombre Fiscal": proveedorData?.nombre_empresa || p.cliente_nombre || "-", "NIF": proveedorData?.cif || "-", "Direccion": proveedorData?.direccion || p.direccion || "-", "Poblacion": proveedorData?.ciudad || "-", "Cod. Postal": proveedorData?.codigo_postal || "-", "Provincia": proveedorData?.provincia || "-", "Importe Venta": Number(p.subtotal || 0).toFixed(2), "Impuesto Venta (21%)": (Number(p.subtotal || 0) * 0.21).toFixed(2), "Total Venta": Number(p.total || 0).toFixed(2) });
    }
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, "Ingresos");
    XLSX.writeFile(wb, `ingresos_recambiodirecto_${new Date().toLocaleDateString("es-ES", { month: "long", year: "numeric" })}.xlsx`);
  }

  function exportarCobros() {
    const mes = new Date().toLocaleDateString("es-ES", { month: "long", year: "numeric" });
    const data = usuarios.filter(u => u.suscripcion !== "gratuito" && u.suscripcion !== "cancelado").map(u => ({ "Empresa": u.nombre_empresa || "-", "Email": u.email, "Tipo": u.tipo, "CIF": u.cif || "-", "Teléfono": u.telefono || "-", "Ciudad": u.ciudad || "-", "Suscripción": SUSCRIPCION_LABELS[u.suscripcion]?.label || u.suscripcion, "Importe": "25,00 €", "Notas": u.notas_admin || "" }));
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, "Cobros");
    XLSX.writeFile(wb, `cobros_recambiodirecto_${mes}.xlsx`);
  }

  return (
    <div>
      <h1 style={{ fontSize: 56, fontWeight: 900, lineHeight: 1, marginBottom: 12 }}>COBROS</h1>
      <p style={{ color: "#94a3b8", fontSize: 18, marginBottom: 36 }}>Gestión de suscripciones y remesas mensuales.</p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 20, marginBottom: 32 }}>
        {[
          { label: "EN PERIODO GRATUITO", value: enGratuito, color: "#fbbf24", desc: "Primer mes" },
          { label: "SUSCRITOS ACTIVOS", value: activos, color: "#4ade80", desc: "Pagan 25€/mes" },
          { label: "PENDIENTES DE COBRO", value: usuarios.filter(u => u.suscripcion === "pendiente").length, color: "#60a5fa", desc: "Sin confirmar pago" },
          { label: "MOROSOS", value: morosos, color: "#f87171", desc: "Impago > 30 días" },
        ].map(({ label, value, color, desc }) => (
          <div key={label} style={{ ...kpiCard, borderColor: `${color}30` }}><p style={kpiLabel}>{label}</p><h2 style={{ ...kpiNum, color }}>{value}</h2><p style={{ color: "#94a3b8", fontSize: 12, marginTop: 4 }}>{desc}</p></div>
        ))}
      </div>
      <div style={{ background: "rgba(22,163,74,0.08)", border: "1px solid rgba(22,163,74,0.2)", borderRadius: 16, padding: "20px 24px", marginBottom: 28, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <p style={{ fontWeight: 800, fontSize: 18 }}>💰 Facturación este mes</p>
          <p style={{ color: "#4ade80", fontSize: 36, fontWeight: 900, margin: "8px 0 0" }}>{facturacionMes}€</p>
          <p style={{ color: "#94a3b8", fontSize: 13 }}>{activos} usuarios × 25€/mes</p>
        </div>
        <div style={{ display: "flex", gap: 12, flexDirection: "column" as const }}>
          <button onClick={exportarCobros} style={btnExportar}>⬇️ Remesa suscripciones</button>
          <button onClick={exportarIngresos} style={{ ...btnExportar, background: "linear-gradient(135deg,#2563eb,#1d4ed8)" }}>📊 Fichero ingresos</button>
        </div>
      </div>
      <div style={tableContainer}>
        <table style={tableStyle}>
          <thead><tr>{["EMPRESA", "EMAIL", "TIPO", "SUSCRIPCIÓN", "IMPORTE", "CAMBIAR ESTADO"].map(h => <th key={h} style={thStyle}>{h}</th>)}</tr></thead>
          <tbody>
            {usuarios.filter(u => u.tipo !== "admin").map(u => (
              <tr key={u.id} style={trStyle}>
                <td style={tdStyle}><strong>{u.nombre_empresa || "-"}</strong></td>
                <td style={{ ...tdStyle, color: "#94a3b8", fontSize: 13 }}>{u.email}</td>
                <td style={tdStyle}><span style={tipoBadge(u.tipo)}>{u.tipo}</span></td>
                <td style={tdStyle}><span style={subBadge(u.suscripcion)}>{SUSCRIPCION_LABELS[u.suscripcion]?.label || u.suscripcion}</span></td>
                <td style={tdStyle}><span style={{ color: u.suscripcion === "gratuito" || u.suscripcion === "cancelado" ? "#94a3b8" : "#22c55e", fontWeight: 700 }}>{u.suscripcion === "gratuito" || u.suscripcion === "cancelado" ? "—" : "25,00 €"}</span></td>
                <td style={tdStyle}>
                  <select value={u.suscripcion} onChange={e => cambiarSuscripcion(u.id, e.target.value)} style={selectSub(u.suscripcion)}>
                    {Object.entries(SUSCRIPCION_LABELS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}