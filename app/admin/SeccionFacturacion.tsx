import React, { useEffect, useState } from "react";
import * as XLSX from "xlsx";
import { supabase } from "../lib/supabase";
import { Usuario, Pedido, tableContainer, tableStyle, thStyle, trStyle, tdStyle, kpiCard, kpiLabel, kpiNum, btnExportar, seccionCard } from "./types";
import { r2, eur } from "./adminApi";

type Props = { usuarios: Usuario[]; pedidos: Pedido[] };

const CUOTA_PROVEEDOR = 25;
const CUOTA_FTP = 10;

type LineaPedido = { id: number; codigo: string; fecha: string; agencia: string; importe: number };
type FilaTaller = { clave: string; empresa: string; cif: string; email: string; ciudad: string; lineas: LineaPedido[]; base: number };

export default function SeccionFacturacion({ usuarios }: Props) {
  const [mes, setMes] = useState(() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`; });
  const [pedidosMes, setPedidosMes] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState("");
  const [abierto, setAbierto] = useState<string | null>(null);
  const [facturados, setFacturados] = useState<Record<string, boolean>>({});

  const [anio, mesNum] = mes.split("-").map(Number);
  const nombreMes = new Date(anio, mesNum - 1).toLocaleDateString("es-ES", { month: "long", year: "numeric" });

  // Los pedidos del mes se leen directamente (el panel general solo carga los últimos)
  useEffect(() => {
    let vivo = true;
    async function cargar() {
      setCargando(true); setErrorCarga("");
      const desde = new Date(anio, mesNum - 1, 1).toISOString();
      const hasta = new Date(anio, mesNum, 1).toISOString();
      const { data, error } = await supabase.from("pedidos").select("*").gte("created_at", desde).lt("created_at", hasta).order("created_at", { ascending: true }).limit(5000);
      if (!vivo) return;
      if (error) setErrorCarga(error.message);
      setPedidosMes((data || []).filter((p: any) => !p.anulado));
      setCargando(false);
    }
    cargar();
    try { setFacturados(JSON.parse(localStorage.getItem(`rd_facturado_${mes}`) || "{}")); } catch { setFacturados({}); }
    return () => { vivo = false; };
  }, [mes]);

  function marcarFacturado(clave: string) {
    setFacturados(prev => {
      const n = { ...prev, [clave]: !prev[clave] };
      try { localStorage.setItem(`rd_facturado_${mes}`, JSON.stringify(n)); } catch { /* sin almacenamiento */ }
      return n;
    });
  }

  // Agrupa por taller un concepto del pedido (porte o recargo)
  function agrupar(filtro: (p: any) => boolean, importe: (p: any) => number): FilaTaller[] {
    const mapa = new Map<string, FilaTaller>();
    for (const p of pedidosMes) {
      if (!filtro(p)) continue;
      const imp = r2(importe(p));
      if (imp <= 0) continue;
      const u = usuarios.find(x => x.id === p.cliente_id);
      const clave = p.cliente_id || p.cliente_email || `pedido-${p.id}`;
      if (!mapa.has(clave)) mapa.set(clave, { clave, empresa: u?.nombre_empresa || p.cliente_nombre || p.cliente_email || "-", cif: u?.cif || "", email: u?.email || p.cliente_email || "", ciudad: u?.ciudad || "", lineas: [], base: 0 });
      const f = mapa.get(clave)!;
      f.lineas.push({ id: p.id, codigo: p.codigo || `#${p.id}`, fecha: p.created_at ? new Date(p.created_at).toLocaleDateString("es-ES") : "-", agencia: p.agencia || p.transporte || "-", importe: imp });
      f.base = r2(f.base + imp);
    }
    return [...mapa.values()].sort((a, b) => b.base - a.base);
  }

  const portes = agrupar(p => p.forma_pago === "rd_pago", p => Number(p.coste_transporte || 0));
  const recargos = agrupar(p => p.forma_pago === "tarjeta", p => Number(p.gastos_gestion || 0));
  const cuotas = usuarios
    .filter(u => u.tipo === "proveedor")
    .map(u => {
      const cuota = (u.suscripcion !== "gratuito" && u.suscripcion !== "cancelado") ? CUOTA_PROVEEDOR : 0;
      const ftp = u.ftp_activo && u.suscripcion !== "cancelado" ? CUOTA_FTP : 0;
      return { u, cuota, ftp, base: cuota + ftp };
    })
    .filter(x => x.base > 0)
    .sort((a, b) => (a.u.nombre_empresa || "").localeCompare(b.u.nombre_empresa || ""));

  const totalPortes = r2(portes.reduce((a, f) => a + f.base, 0));
  const totalRecargos = r2(recargos.reduce((a, f) => a + f.base, 0));
  const totalCuotas = r2(cuotas.reduce((a, f) => a + f.base, 0));
  const totalBase = r2(totalPortes + totalRecargos + totalCuotas);

  function exportar() {
    const wb = XLSX.utils.book_new();
    const hoja = (nombre: string, filas: any[]) => XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(filas.length ? filas : [{ "Sin datos": "" }]), nombre);
    hoja("Portes RD Pago", portes.map(f => ({ "Empresa": f.empresa, "CIF": f.cif, "Email": f.email, "Ciudad": f.ciudad, "Nº pedidos": f.lineas.length, "Concepto": `Portes ${nombreMes}`, "Base sin IVA": f.base })));
    hoja("Detalle portes", portes.flatMap(f => f.lineas.map(l => ({ "Empresa": f.empresa, "CIF": f.cif, "Pedido": l.codigo, "Fecha": l.fecha, "Agencia": l.agencia, "Porte sin IVA": l.importe }))));
    hoja("Recargo tarjeta", recargos.map(f => ({ "Empresa": f.empresa, "CIF": f.cif, "Email": f.email, "Ciudad": f.ciudad, "Nº pedidos": f.lineas.length, "Concepto": `Recargo pago con tarjeta ${nombreMes}`, "Base sin IVA": f.base })));
    hoja("Detalle recargo", recargos.flatMap(f => f.lineas.map(l => ({ "Empresa": f.empresa, "CIF": f.cif, "Pedido": l.codigo, "Fecha": l.fecha, "Recargo sin IVA": l.importe }))));
    hoja("Cuotas proveedores", cuotas.map(x => ({ "Empresa": x.u.nombre_empresa || "-", "CIF": x.u.cif || "", "Email": x.u.email, "Ciudad": x.u.ciudad || "", "Suscripción": x.cuota, "FTP Sync": x.ftp, "Concepto": `Cuota plataforma ${nombreMes}`, "Base sin IVA": x.base })));
    XLSX.writeFile(wb, `facturacion_sin_iva_${mes}.xlsx`);
  }

  const pill = (activo: boolean) => ({ background: activo ? "rgba(22,163,74,0.2)" : "rgba(255,255,255,0.05)", color: activo ? "#4ade80" : "#94a3b8", border: "none", padding: "5px 10px", borderRadius: 8, cursor: "pointer", fontWeight: 700, fontSize: 12, whiteSpace: "nowrap" as const });

  function TablaTalleres({ prefijo, filas, etiquetaImporte }: { prefijo: string; filas: FilaTaller[]; etiquetaImporte: string }) {
    if (filas.length === 0) return <p style={{ color: "#94a3b8", fontSize: 14, padding: "12px 0" }}>Nada que facturar por este concepto en {nombreMes}.</p>;
    return (
      <div style={tableContainer}>
        <table style={tableStyle}>
          <thead><tr>{["TALLER", "CIF", "PEDIDOS", "BASE SIN IVA", "DETALLE", "FACTURADO"].map(h => <th key={h} style={thStyle}>{h}</th>)}</tr></thead>
          <tbody>
            {filas.map(f => { const k = `${prefijo}:${f.clave}`; return (
              <React.Fragment key={k}>
                <tr style={{ ...trStyle, opacity: facturados[k] ? 0.55 : 1 }}>
                  <td style={tdStyle}><div style={{ fontWeight: 700 }}>{f.empresa}</div><div style={{ color: "#94a3b8", fontSize: 12 }}>{f.email}</div></td>
                  <td style={{ ...tdStyle, fontSize: 13, color: f.cif ? "#94a3b8" : "#f87171" }}>{f.cif || "⚠️ Sin CIF"}</td>
                  <td style={tdStyle}>{f.lineas.length}</td>
                  <td style={{ ...tdStyle, fontWeight: 900, fontSize: 16, color: "#22c55e" }}>{eur(f.base)}</td>
                  <td style={tdStyle}><button onClick={() => setAbierto(abierto === k ? null : k)} style={pill(false)}>{abierto === k ? "▲ Ocultar" : "▼ Ver pedidos"}</button></td>
                  <td style={tdStyle}><button onClick={() => marcarFacturado(k)} style={pill(!!facturados[k])}>{facturados[k] ? "✓ Facturado" : "Marcar"}</button></td>
                </tr>
                {abierto === k && (
                  <tr><td colSpan={6} style={{ padding: "0 16px 14px", background: "rgba(37,99,235,0.04)" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse" as const, fontSize: 13 }}>
                      <tbody>
                        {f.lineas.map(l => (
                          <tr key={l.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                            <td style={{ padding: "6px 8px", color: "#60a5fa", fontWeight: 700 }}>{l.codigo}</td>
                            <td style={{ padding: "6px 8px", color: "#94a3b8" }}>{l.fecha}</td>
                            <td style={{ padding: "6px 8px", color: "#94a3b8" }}>{l.agencia}</td>
                            <td style={{ padding: "6px 8px", textAlign: "right" as const, fontWeight: 700 }}>{etiquetaImporte}: {eur(l.importe)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </td></tr>
                )}
              </React.Fragment>
            ); })}
            <tr style={{ background: "rgba(37,99,235,0.08)", borderTop: "2px solid rgba(37,99,235,0.3)" }}>
              <td colSpan={3} style={{ padding: "12px 16px", fontWeight: 900, color: "#60a5fa" }}>TOTAL ({filas.length} factura{filas.length !== 1 ? "s" : ""})</td>
              <td colSpan={3} style={{ padding: "12px 16px", fontWeight: 900, fontSize: 16 }}>{eur(filas.reduce((a, f) => a + f.base, 0))}</td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div>
      <h1 style={{ fontSize: 56, fontWeight: 900, lineHeight: 1, marginBottom: 12 }}>FACTURACIÓN</h1>
      <p style={{ color: "#94a3b8", fontSize: 18, marginBottom: 24 }}>Lo que factura Recambio Directo cada mes, separado por concepto.</p>

      <div style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.25)", borderRadius: 14, padding: "14px 18px", marginBottom: 24 }}>
        <p style={{ color: "#fbbf24", fontWeight: 800, margin: 0, fontSize: 14 }}>Todos los importes de esta pantalla y del Excel son BASE SIN IVA.</p>
        <p style={{ color: "#94a3b8", margin: "4px 0 0", fontSize: 13 }}>Introdúcelos tal cual en Holded: el IVA lo añade el programa de facturación. No se incluyen pedidos anulados ni los portes de pedidos pagados con tarjeta.</p>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24, flexWrap: "wrap" as const }}>
        <label style={{ color: "#94a3b8", fontWeight: 700 }}>Mes a facturar:</label>
        <input type="month" value={mes} onChange={e => e.target.value && setMes(e.target.value)} style={{ background: "#0f172a", color: "white", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "10px 16px", fontSize: 15, outline: "none" }} />
        <span style={{ color: "#60a5fa", fontWeight: 700, fontSize: 16 }}>{nombreMes}</span>
        {cargando && <span style={{ color: "#94a3b8", fontSize: 13 }}>Cargando pedidos...</span>}
        {errorCarga && <span style={{ color: "#f87171", fontSize: 13 }}>Error leyendo pedidos: {errorCarga}</span>}
        <button onClick={exportar} disabled={cargando || totalBase === 0} style={{ ...btnExportar, marginLeft: "auto", opacity: cargando || totalBase === 0 ? 0.5 : 1 }}>⬇️ Excel para Holded (sin IVA)</button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 20, marginBottom: 28 }}>
        {[
          { label: "PORTES RD PAGO", value: eur(totalPortes), color: "#fbbf24", desc: `${portes.length} talleres · ${portes.reduce((a, f) => a + f.lineas.length, 0)} pedidos` },
          { label: "RECARGO 3% TARJETA", value: eur(totalRecargos), color: "#a78bfa", desc: `${recargos.length} talleres · ${recargos.reduce((a, f) => a + f.lineas.length, 0)} pedidos` },
          { label: "CUOTAS PROVEEDORES", value: eur(totalCuotas), color: "#60a5fa", desc: `${cuotas.length} proveedores` },
          { label: "TOTAL BASE A FACTURAR", value: eur(totalBase), color: "#22c55e", desc: "Sin IVA" },
        ].map(({ label, value, color, desc }) => (
          <div key={label} style={kpiCard}><p style={kpiLabel}>{label}</p><h2 style={{ ...kpiNum, fontSize: 30, color }}>{value}</h2><p style={{ color: "#94a3b8", fontSize: 12, marginTop: 4 }}>{desc}</p></div>
        ))}
      </div>

      <div style={{ ...seccionCard, marginBottom: 24 }}>
        <h2 style={{ fontSize: 20, fontWeight: 900, marginBottom: 4 }}>🚚 Portes de pedidos RD Pago</h2>
        <p style={{ color: "#94a3b8", fontSize: 13, marginBottom: 16 }}>Una factura por taller con el porte de sus pedidos a crédito del mes. Pendiente de cobro por remesa.</p>
        <TablaTalleres prefijo="porte" filas={portes} etiquetaImporte="Porte" />
      </div>

      <div style={{ ...seccionCard, marginBottom: 24 }}>
        <h2 style={{ fontSize: 20, fontWeight: 900, marginBottom: 4 }}>💳 Recargo 3% por pago con tarjeta</h2>
        <p style={{ color: "#94a3b8", fontSize: 13, marginBottom: 16 }}>Ya cobrado al taller en el momento del pago. Una factura por taller.</p>
        <TablaTalleres prefijo="recargo" filas={recargos} etiquetaImporte="Recargo" />
      </div>

      <div style={seccionCard}>
        <h2 style={{ fontSize: 20, fontWeight: 900, marginBottom: 4 }}>🏷️ Cuotas de proveedores</h2>
        <p style={{ color: "#94a3b8", fontSize: 13, marginBottom: 16 }}>Suscripción {CUOTA_PROVEEDOR} €/mes (proveedores que no están en mes gratuito ni cancelados) y FTP Sync {CUOTA_FTP} €/mes. Los talleres no pagan cuota.</p>
        {cuotas.length === 0 ? <p style={{ color: "#94a3b8", fontSize: 14 }}>Ningún proveedor con cuota este mes.</p> : (
          <div style={tableContainer}>
            <table style={tableStyle}>
              <thead><tr>{["PROVEEDOR", "CIF", "SUSCRIPCIÓN", "FTP SYNC", "BASE SIN IVA", "FACTURADO"].map(h => <th key={h} style={thStyle}>{h}</th>)}</tr></thead>
              <tbody>
                {cuotas.map(({ u, cuota, ftp, base }) => { const k = `cuota:${u.id}`; return (
                  <tr key={u.id} style={{ ...trStyle, opacity: facturados[k] ? 0.55 : 1 }}>
                    <td style={tdStyle}><div style={{ fontWeight: 700 }}>{u.nombre_empresa || "-"}</div><div style={{ color: "#94a3b8", fontSize: 12 }}>{u.email}{u.suscripcion === "moroso" ? " · MOROSO" : ""}</div></td>
                    <td style={{ ...tdStyle, fontSize: 13, color: u.cif ? "#94a3b8" : "#f87171" }}>{u.cif || "⚠️ Sin CIF"}</td>
                    <td style={tdStyle}>{cuota > 0 ? eur(cuota) : <span style={{ color: "#94a3b8" }}>—</span>}</td>
                    <td style={tdStyle}>{ftp > 0 ? eur(ftp) : <span style={{ color: "#94a3b8" }}>—</span>}</td>
                    <td style={{ ...tdStyle, fontWeight: 900, fontSize: 16, color: "#22c55e" }}>{eur(base)}</td>
                    <td style={tdStyle}><button onClick={() => marcarFacturado(k)} style={pill(!!facturados[k])}>{facturados[k] ? "✓ Facturado" : "Marcar"}</button></td>
                  </tr>
                ); })}
                <tr style={{ background: "rgba(37,99,235,0.08)", borderTop: "2px solid rgba(37,99,235,0.3)" }}>
                  <td colSpan={4} style={{ padding: "12px 16px", fontWeight: 900, color: "#60a5fa" }}>TOTAL ({cuotas.length} factura{cuotas.length !== 1 ? "s" : ""})</td>
                  <td colSpan={2} style={{ padding: "12px 16px", fontWeight: 900, fontSize: 16 }}>{eur(totalCuotas)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p style={{ color: "#64748b", fontSize: 12, marginTop: 16 }}>La marca "Facturado" es un recordatorio que se guarda en este navegador; no cambia nada en la plataforma.</p>
    </div>
  );
}
