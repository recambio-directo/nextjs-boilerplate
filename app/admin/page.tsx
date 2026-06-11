"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";
import * as XLSX from "xlsx";

type Usuario = {
  id: string;
  email: string;
  tipo: string;
  nombre_empresa?: string;
  telefono?: string;
  cif?: string;
  ciudad?: string;
  provincia?: string;
  activo: boolean;
  fecha_registro?: string;
  suscripcion: string;
  notas_admin?: string;
  ftp_activo?: boolean;
  ftp_api_key?: string;
  credito_rd?: number;
  iban?: string;
};

type Pedido = {
  id: number;
  codigo?: string;
  cliente_email?: string;
  cliente_nombre?: string;
  cliente_id?: string;
  total?: number;
  estado_envio?: string;
  forma_pago?: string;
  coste_transporte?: number;
  fecha_entrega_confirmada?: string;
  pago_proveedor_estado?: string;
  anulado?: boolean;
  created_at?: string;
  productos?: any[];
};

type PagoProveedor = {
  id: number;
  pedido_id: number;
  proveedor_id: string;
  importe: number;
  estado: string;
  fecha_entrega?: string;
  fecha_pago_programado?: string;
  fecha_pago_realizado?: string;
  created_at?: string;
};

const SUSCRIPCION_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  gratuito:  { label: "Gratuito",  color: "#fbbf24", bg: "rgba(245,158,11,0.15)" },
  activo:    { label: "Activo",    color: "#4ade80", bg: "rgba(22,163,74,0.15)" },
  pendiente: { label: "Pendiente", color: "#60a5fa", bg: "rgba(37,99,235,0.15)" },
  moroso:    { label: "Moroso",    color: "#f87171", bg: "rgba(239,68,68,0.15)" },
  cancelado: { label: "Cancelado", color: "#94a3b8", bg: "rgba(255,255,255,0.05)" },
};

export default function AdminPage() {
  const router = useRouter();
  const [seccion, setSeccion] = useState<"dashboard" | "usuarios" | "pedidos" | "cobros" | "financiero" | "facturacion">("dashboard");
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [cargando, setCargando] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("todos");
  const [filtroSub, setFiltroSub] = useState("todos");
  const [usuarioEditando, setUsuarioEditando] = useState<Usuario | null>(null);
  const [notasTemp, setNotasTemp] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [adminNombre, setAdminNombre] = useState("Admin");
  const [pagosProveedores, setPagosProveedores] = useState<PagoProveedor[]>([]);
  const [creditoEditando, setCreditoEditando] = useState<string | null>(null);
  const [creditoTemp, setCreditoTemp] = useState("");
  const [ibanEditando, setIbanEditando] = useState<string | null>(null);
  const [ibanTemp, setIbanTemp] = useState("");
  const [mesFacturacion, setMesFacturacion] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });
  const [busquedaPedidos, setBusquedaPedidos] = useState("");
  const [filtroPedidoEstado, setFiltroPedidoEstado] = useState("todos");
  const [filtroPedidoPago, setFiltroPedidoPago] = useState("todos");
  const [filtroPedidoAnulado, setFiltroPedidoAnulado] = useState("todos");
  const [paginaPedidos, setPaginaPedidos] = useState(1);
  const PEDIDOS_POR_PAGINA = 20;

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: perfil } = await supabase.from("usuarios").select("nombre_empresa").eq("id", user.id).single();
      setAdminNombre(perfil?.nombre_empresa || user.email || "Admin");
      cargarDatos();
    }
    init();
  }, []);

  async function cargarDatos() {
    setCargando(true);
    const { data: usuariosData } = await supabase.from("usuarios").select("*").neq("tipo", "admin").order("fecha_registro", { ascending: false });
    setUsuarios(usuariosData || []);
    const { data: pedidosData } = await supabase.from("pedidos").select("*").order("id", { ascending: false }).limit(500);
    setPedidos(pedidosData || []);
    const { data: pagosData } = await supabase.from("pagos_proveedores").select("*").order("created_at", { ascending: false });
    setPagosProveedores(pagosData || []);
    setCargando(false);
  }

  async function guardarCredito(id: string) {
    const credito = parseFloat(creditoTemp);
    if (isNaN(credito) || credito < 0) { alert("Importe inválido"); return; }
    await supabase.from("usuarios").update({ credito_rd: credito }).eq("id", id);
    setUsuarios(prev => prev.map(u => u.id === id ? { ...u, credito_rd: credito } : u));
    setCreditoEditando(null);
  }

  async function guardarIban(id: string) {
    if (!ibanTemp.trim()) { alert("IBAN inválido"); return; }
    await supabase.from("usuarios").update({ iban: ibanTemp.trim().toUpperCase() }).eq("id", id);
    setUsuarios(prev => prev.map(u => u.id === id ? { ...u, iban: ibanTemp.trim().toUpperCase() } : u));
    setIbanEditando(null);
  }

  async function crearPagoProveedorSiNoExiste(pedido: Pedido) {
    if (!pedido.id || !pedido.productos) return;
    const proveedoresUnicos = new Map<string, number>();
    for (const prod of pedido.productos) {
      if (prod.proveedor_id) {
        const actual = proveedoresUnicos.get(prod.proveedor_id) || 0;
        proveedoresUnicos.set(prod.proveedor_id, actual + Number(prod.precio || 0));
      }
    }
    const fechaEntrega = new Date().toISOString();
    const fechaPago = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    for (const [provId, importe] of proveedoresUnicos.entries()) {
      const { data: existe } = await supabase.from("pagos_proveedores").select("id").eq("pedido_id", pedido.id).eq("proveedor_id", provId).maybeSingle();
      if (!existe) {
        await supabase.from("pagos_proveedores").insert({ pedido_id: pedido.id, proveedor_id: provId, importe, estado: "esperando_7dias", fecha_entrega: fechaEntrega, fecha_pago_programado: fechaPago });
      }
    }
    cargarDatos();
  }

  async function marcarPagado(pagoId: number) {
    await supabase.from("pagos_proveedores").update({ estado: "pagado", fecha_pago_realizado: new Date().toISOString() }).eq("id", pagoId);
    cargarDatos();
  }

  async function generarRemesaPagos() {
    const pendientes = pagosProveedores.filter(p => p.estado === "listo_para_pagar");
    if (pendientes.length === 0) { alert("No hay pagos listos para remesar"); return; }
    const rows = pendientes.map(p => {
      const proveedor = usuarios.find(u => u.id === p.proveedor_id);
      return { "IBAN": proveedor?.iban || "SIN IBAN", "Empresa": proveedor?.nombre_empresa || "-", "Email": proveedor?.email || "-", "Pedido": `#${p.pedido_id}`, "Importe": p.importe.toFixed(2), "Fecha entrega": p.fecha_entrega ? new Date(p.fecha_entrega).toLocaleDateString("es-ES") : "-", "Fecha pago programado": p.fecha_pago_programado ? new Date(p.fecha_pago_programado).toLocaleDateString("es-ES") : "-" };
    });
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, "Remesa");
    XLSX.writeFile(wb, `remesa_proveedores_${new Date().toLocaleDateString("es-ES").replace(/\//g, "-")}.xlsx`);
  }

  function usuariosProximosACobrar() {
    const ahora = new Date();
    return usuarios.filter(u => {
      if (u.suscripcion !== "gratuito" || !u.fecha_registro) return false;
      const dias = Math.floor((ahora.getTime() - new Date(u.fecha_registro).getTime()) / (1000 * 60 * 60 * 24));
      return dias >= 50 && dias <= 65;
    });
  }

  async function toggleActivo(usuario: Usuario) {
    await supabase.from("usuarios").update({ activo: !usuario.activo }).eq("id", usuario.id);
    setUsuarios(prev => prev.map(u => u.id === usuario.id ? { ...u, activo: !u.activo } : u));
  }

  async function cambiarSuscripcion(id: string, suscripcion: string) {
    await supabase.from("usuarios").update({ suscripcion }).eq("id", id);
    setUsuarios(prev => prev.map(u => u.id === id ? { ...u, suscripcion } : u));
  }

  async function guardarNotas() {
    if (!usuarioEditando) return;
    setGuardando(true);
    await supabase.from("usuarios").update({ notas_admin: notasTemp }).eq("id", usuarioEditando.id);
    setUsuarios(prev => prev.map(u => u.id === usuarioEditando.id ? { ...u, notas_admin: notasTemp } : u));
    setGuardando(false);
    setUsuarioEditando(null);
  }

  async function eliminarUsuario(id: string) {
    if (!confirm("¿Eliminar este usuario? Esta acción no se puede deshacer.")) return;
    await supabase.from("usuarios").delete().eq("id", id);
    setUsuarios(prev => prev.filter(u => u.id !== id));
  }

  async function exportarIngresos() {
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
    ws["!cols"] = [{ wch: 14 }, { wch: 16 }, { wch: 16 }, { wch: 14 }, { wch: 30 }, { wch: 12 }, { wch: 30 }, { wch: 20 }, { wch: 10 }, { wch: 16 }, { wch: 14 }, { wch: 18 }, { wch: 14 }];
    XLSX.utils.book_append_sheet(wb, ws, "Ingresos");
    XLSX.writeFile(wb, `ingresos_recambiodirecto_${new Date().toLocaleDateString("es-ES", { month: "long", year: "numeric" })}.xlsx`);
  }

  function exportarCobros() {
    const mes = new Date().toLocaleDateString("es-ES", { month: "long", year: "numeric" });
    const data = usuariosFiltrados.filter(u => u.suscripcion !== "gratuito" && u.suscripcion !== "cancelado").map(u => ({ "Empresa": u.nombre_empresa || "-", "Email": u.email, "Tipo": u.tipo, "CIF": u.cif || "-", "Teléfono": u.telefono || "-", "Ciudad": u.ciudad || "-", "Suscripción": SUSCRIPCION_LABELS[u.suscripcion]?.label || u.suscripcion, "Importe": "25,00 €", "Notas": u.notas_admin || "" }));
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, "Cobros");
    XLSX.writeFile(wb, `cobros_recambiodirecto_${mes}.xlsx`);
  }

  // ── FACTURACIÓN ──
  function calcularFacturacionUsuario(u: Usuario) {
    const [anio, mesNum] = mesFacturacion.split("-").map(Number);
    const suscripcion = (u.suscripcion !== "gratuito" && u.suscripcion !== "cancelado") ? 25 : 0;
    const ftp = u.ftp_activo ? 10 : 0;
    const pedidosMes = pedidos.filter(p => {
      if (!p.created_at || p.anulado) return false;
      const f = new Date(p.created_at);
      return f.getFullYear() === anio && (f.getMonth() + 1) === mesNum && p.cliente_id === u.id && p.forma_pago === "rd_pago";
    });
    const portes = pedidosMes.reduce((acc, p) => acc + Number(p.coste_transporte || 0), 0);
    const total = suscripcion + ftp + portes;
    return { suscripcion, ftp, portes, total, numPedidosPortes: pedidosMes.length };
  }

  function exportarParaHolded() {
    const [anio, mesNum] = mesFacturacion.split("-").map(Number);
    const nombreMes = new Date(anio, mesNum - 1).toLocaleDateString("es-ES", { month: "long", year: "numeric" });
    const rows = usuariosConFactura.map(u => {
      const f = calcularFacturacionUsuario(u);
      return { "Empresa": u.nombre_empresa || "-", "CIF": u.cif || "-", "Email": u.email, "Ciudad": u.ciudad || "-", "Suscripción plataforma": f.suscripcion > 0 ? `${f.suscripcion.toFixed(2)}€` : "-", "FTP Sync": f.ftp > 0 ? `${f.ftp.toFixed(2)}€` : "-", "Portes RD Pago": f.portes > 0 ? `${f.portes.toFixed(2)}€` : "-", "Nº pedidos con porte": f.numPedidosPortes || "-", "Base imponible": f.total.toFixed(2), "IVA 21%": (f.total * 0.21).toFixed(2), "TOTAL FACTURA": (f.total * 1.21).toFixed(2) };
    });
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(rows);
    ws["!cols"] = Array(11).fill({ wch: 22 });
    XLSX.utils.book_append_sheet(wb, ws, "Facturación");
    XLSX.writeFile(wb, `facturacion_recambiodirecto_${mesFacturacion}.xlsx`);
  }

  const usuariosFiltrados = usuarios.filter(u => {
    if (filtroTipo !== "todos" && u.tipo !== filtroTipo) return false;
    if (filtroSub !== "todos" && u.suscripcion !== filtroSub) return false;
    if (busqueda) { const q = busqueda.toLowerCase(); return (u.nombre_empresa || "").toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || (u.cif || "").toLowerCase().includes(q); }
    return true;
  });

  const usuariosConFactura = usuarios.filter(u => u.tipo !== "admin").filter(u => {
    const f = calcularFacturacionUsuario(u);
    return f.total > 0;
  }).sort((a, b) => calcularFacturacionUsuario(b).total - calcularFacturacionUsuario(a).total);

  const totalUsuarios = usuarios.length;
  const totalProveedores = usuarios.filter(u => u.tipo === "proveedor").length;
  const totalTalleres = usuarios.filter(u => u.tipo === "taller").length;
  const enGratuito = usuarios.filter(u => u.suscripcion === "gratuito").length;
  const activos = usuarios.filter(u => u.suscripcion === "activo").length;
  const morosos = usuarios.filter(u => u.suscripcion === "moroso").length;
  const facturacionMes = activos * 25;
  const pedidosMes = pedidos.filter(p => { if (!p.created_at) return false; const f = new Date(p.created_at); const now = new Date(); return f.getMonth() === now.getMonth() && f.getFullYear() === now.getFullYear(); }).length;

  const [anioFact, mesFact] = mesFacturacion.split("-").map(Number);
  const nombreMesFact = new Date(anioFact, mesFact - 1).toLocaleDateString("es-ES", { month: "long", year: "numeric" });
  const totalFactMes = usuariosConFactura.reduce((acc, u) => acc + calcularFacturacionUsuario(u).total, 0);
  const totalSuscMes = usuariosConFactura.reduce((acc, u) => acc + calcularFacturacionUsuario(u).suscripcion, 0);
  const totalFtpMes = usuariosConFactura.reduce((acc, u) => acc + calcularFacturacionUsuario(u).ftp, 0);
  const totalPortesMes = usuariosConFactura.reduce((acc, u) => acc + calcularFacturacionUsuario(u).portes, 0);

  // Pedidos filtrados y paginados
  const pedidosFiltrados = pedidos.filter(p => {
    if (filtroPedidoEstado !== "todos" && p.estado_envio !== filtroPedidoEstado) return false;
    if (filtroPedidoPago !== "todos" && p.forma_pago !== filtroPedidoPago) return false;
    if (filtroPedidoAnulado === "activos" && p.anulado) return false;
    if (filtroPedidoAnulado === "anulados" && !p.anulado) return false;
    if (busquedaPedidos) {
      const q = busquedaPedidos.toLowerCase();
      return (p.codigo || "").toLowerCase().includes(q) ||
             (p.cliente_nombre || "").toLowerCase().includes(q) ||
             (p.cliente_email || "").toLowerCase().includes(q) ||
             String(p.id).includes(q);
    }
    return true;
  });
  const totalPaginasPedidos = Math.ceil(pedidosFiltrados.length / PEDIDOS_POR_PAGINA);
  const pedidosPagina = pedidosFiltrados.slice((paginaPedidos - 1) * PEDIDOS_POR_PAGINA, paginaPedidos * PEDIDOS_POR_PAGINA);

  return (
    <main style={mainStyle}>
      <aside style={sidebarStyle}>
        <div style={{ marginBottom: 32 }}>
          <div style={logoBadge}>RD</div>
          <h1 style={{ fontSize: 20, fontWeight: 900, marginTop: 12 }}>RECAMBIO DIRECTO</h1>
          <p style={{ color: "#94a3b8", fontSize: 12, marginTop: 4 }}>Panel Administración</p>
          <div style={{ marginTop: 12, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 8, padding: "6px 12px", fontSize: 12, color: "#f87171", fontWeight: 700 }}>🔐 {adminNombre}</div>
        </div>
        <nav style={{ display: "flex", flexDirection: "column" as const, gap: 8 }}>
          {[
            { key: "dashboard",   label: "📊 Dashboard" },
            { key: "usuarios",    label: "👥 Usuarios" },
            { key: "cobros",      label: "💰 Cobros" },
            { key: "facturacion", label: "🧾 Facturación" },
            { key: "financiero",  label: "🏦 Financiero" },
            { key: "pedidos",     label: "📦 Pedidos" },
          ].map(({ key, label }) => (
            <div key={key} onClick={() => setSeccion(key as any)} style={seccion === key ? menuActivo : menuItem}>{label}</div>
          ))}
        </nav>
        <div style={{ marginTop: "auto", paddingTop: 24 }}>
          <button onClick={async () => { await supabase.auth.signOut(); router.push("/"); }} style={{ width: "100%", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171", padding: "10px", borderRadius: 10, cursor: "pointer", fontWeight: 700, fontSize: 13 }}>Cerrar sesión</button>
        </div>
      </aside>

      <section style={contentStyle}>

        {/* DASHBOARD */}
        {seccion === "dashboard" && (
          <div>
            <h1 style={titleStyle}>PANEL DE CONTROL</h1>
            <p style={descStyle}>Resumen general de Recambio Directo.</p>
            <div style={kpiGrid}>
              {[
                { label: "USUARIOS TOTALES", value: totalUsuarios, color: "white" },
                { label: "PROVEEDORES", value: totalProveedores, color: "#60a5fa" },
                { label: "TALLERES", value: totalTalleres, color: "#a78bfa" },
                { label: "EN GRATUITO", value: enGratuito, color: "#fbbf24" },
                { label: "SUSCRITOS ACTIVOS", value: activos, color: "#4ade80" },
                { label: "MOROSOS", value: morosos, color: "#f87171" },
                { label: "FACTURACIÓN MES", value: `${facturacionMes}€`, color: "#22c55e" },
                { label: "PEDIDOS MES", value: pedidosMes, color: "#60a5fa" },
              ].map(({ label, value, color }) => (
                <div key={label} style={kpiCard}><p style={kpiLabel}>{label}</p><h2 style={{ ...kpiNum, color }}>{value}</h2></div>
              ))}
            </div>
            <div style={seccionCard}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <h2 style={{ fontSize: 22, fontWeight: 900 }}>Últimos registros</h2>
                <button onClick={() => setSeccion("usuarios")} style={btnVer}>Ver todos →</button>
              </div>
              <div style={tableContainer}>
                <table style={tableStyle}>
                  <thead><tr>{["EMPRESA", "EMAIL", "TIPO", "SUSCRIPCIÓN", "ACTIVO"].map(h => <th key={h} style={thStyle}>{h}</th>)}</tr></thead>
                  <tbody>
                    {usuarios.slice(0, 8).map(u => (
                      <tr key={u.id} style={trStyle}>
                        <td style={tdStyle}><strong>{u.nombre_empresa || "-"}</strong></td>
                        <td style={{ ...tdStyle, color: "#94a3b8" }}>{u.email}</td>
                        <td style={tdStyle}><span style={tipoBadge(u.tipo)}>{u.tipo}</span></td>
                        <td style={tdStyle}><span style={subBadge(u.suscripcion)}>{SUSCRIPCION_LABELS[u.suscripcion]?.label || u.suscripcion}</span></td>
                        <td style={tdStyle}><span style={{ color: u.activo ? "#4ade80" : "#f87171", fontWeight: 700 }}>{u.activo ? "✅ Sí" : "❌ No"}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* USUARIOS */}
        {seccion === "usuarios" && (
          <div>
            <h1 style={titleStyle}>USUARIOS</h1>
            <p style={descStyle}>Gestiona talleres y proveedores de la plataforma.</p>
            <div style={filtrosBox}>
              <input placeholder="Buscar empresa, email, CIF..." value={busqueda} onChange={e => setBusqueda(e.target.value)} style={searchInput} />
              <div style={{ display: "flex", gap: 8 }}>
                {["todos", "taller", "proveedor"].map(t => (
                  <button key={t} onClick={() => setFiltroTipo(t)} style={{ ...btnFiltro, background: filtroTipo === t ? "linear-gradient(135deg,#2563eb,#1d4ed8)" : "rgba(255,255,255,0.05)", color: filtroTipo === t ? "white" : "#94a3b8", border: filtroTipo === t ? "none" : "1px solid rgba(255,255,255,0.08)" }}>{t === "todos" ? "Todos" : t}</button>
                ))}
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                {["todos", "gratuito", "activo", "pendiente", "moroso"].map(s => (
                  <button key={s} onClick={() => setFiltroSub(s)} style={{ ...btnFiltro, background: filtroSub === s ? "rgba(139,92,246,0.3)" : "rgba(255,255,255,0.05)", color: filtroSub === s ? "#a78bfa" : "#94a3b8", border: filtroSub === s ? "1px solid rgba(139,92,246,0.5)" : "1px solid rgba(255,255,255,0.08)" }}>{SUSCRIPCION_LABELS[s]?.label || "Todos"}</button>
                ))}
              </div>
              <span style={{ color: "#94a3b8", fontSize: 13 }}>{usuariosFiltrados.length} usuarios</span>
            </div>
            <div style={tableContainer}>
              <table style={tableStyle}>
                <thead><tr>{["EMPRESA", "EMAIL", "CIF", "TIPO", "SUSCRIPCIÓN", "FTP", "ACTIVO", "ACCIONES"].map(h => <th key={h} style={thStyle}>{h}</th>)}</tr></thead>
                <tbody>
                  {usuariosFiltrados.map(u => (
                    <tr key={u.id} style={{ ...trStyle, opacity: u.activo ? 1 : 0.5 }}>
                      <td style={tdStyle}>
                        <div style={{ fontWeight: 700 }}>{u.nombre_empresa || "-"}</div>
                        {u.ciudad && <div style={{ color: "#94a3b8", fontSize: 12 }}>📍 {u.ciudad}</div>}
                        {u.notas_admin && <div style={{ color: "#fbbf24", fontSize: 11, marginTop: 2 }}>📝 {u.notas_admin.substring(0, 40)}...</div>}
                      </td>
                      <td style={{ ...tdStyle, color: "#94a3b8", fontSize: 13 }}>{u.email}</td>
                      <td style={{ ...tdStyle, color: "#94a3b8", fontSize: 13 }}>{u.cif || "-"}</td>
                      <td style={tdStyle}><span style={tipoBadge(u.tipo)}>{u.tipo}</span></td>
                      <td style={tdStyle}>
                        <select value={u.suscripcion} onChange={e => cambiarSuscripcion(u.id, e.target.value)} style={selectSub(u.suscripcion)}>
                          {Object.entries(SUSCRIPCION_LABELS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                        </select>
                      </td>
                      <td style={tdStyle}>
                        <button onClick={async () => {
                          const nuevoEstado = !u.ftp_activo;
                          const updates: any = { ftp_activo: nuevoEstado };
                          if (nuevoEstado && !u.ftp_api_key) {
                            updates.ftp_api_key = `rd-ftp-${u.id.substring(0, 8)}-${Math.random().toString(36).substring(2, 10)}`;
                          }
                          await supabase.from("usuarios").update(updates).eq("id", u.id);
                          setUsuarios(prev => prev.map(x => x.id === u.id ? { ...x, ...updates } : x));
                          if (nuevoEstado) {
                            const apiKey = updates.ftp_api_key || u.ftp_api_key;
                            const url = `https://recambio-directo.com/api/ftp/upload?api_key=${apiKey}`;
                            const contenido = `CREDENCIALES FTP SYNC — RECAMBIO DIRECTO
==========================================
Empresa: ${u.nombre_empresa || u.email}
Fecha activación: ${new Date().toLocaleDateString("es-ES")}

API KEY: ${apiKey}

URL UPLOAD:
${url}

INSTRUCCIONES:
- Método: POST (multipart/form-data)
- Campo: file
- Formatos aceptados: CSV, XLSX, XLS
- Columnas requeridas: referencia, descripcion, precio, marca, stock
- Columna opcional: importe casco
- Procesamiento automático: cada noche a las 5:00 AM

FORMATO DE COLUMNAS:
referencia   → Código de la pieza (OEM o IAM)
descripcion  → Descripción del artículo
precio       → Precio de venta sin IVA (si precio=0 se trata como casco)
marca        → Fabricante o marca
stock        → Unidades disponibles
importe casco → Precio del casco (solo si aplica)

NOTA CASCOS:
Si una referencia lleva casco, incluir una fila adicional con
precio=0 e importe casco=precio del casco. El sistema la
asociará automáticamente a la referencia anterior.

EJEMPLO CSV:
referencia;descripcion;precio;marca;stock;importe casco
W79;FILTRO ACEITE MANN W79;4.50;MANN;25;0
W79;CASCO FILTRO W79;0;MANN;25;2.50

Soporte: info@recambio-directo.com
==========================================`;
                            const blob = new Blob([contenido], { type: "text/plain;charset=utf-8" });
                            const a = document.createElement("a");
                            a.href = URL.createObjectURL(blob);
                            a.download = `credenciales-ftp-${(u.nombre_empresa || u.email).replace(/\s+/g, "-").toLowerCase()}.txt`;
                            a.click();
                          }
                        }} style={{ background: u.ftp_activo ? "rgba(139,92,246,0.2)" : "rgba(255,255,255,0.05)", border: "none", color: u.ftp_activo ? "#a78bfa" : "#64748b", padding: "4px 10px", borderRadius: 8, cursor: "pointer", fontWeight: 700, fontSize: 12 }}>
                          {u.ftp_activo ? "🔄 Activo" : "—"}
                        </button>
                      </td>
                      <td style={tdStyle}>
                        <button onClick={() => toggleActivo(u)} style={{ background: u.activo ? "rgba(22,163,74,0.15)" : "rgba(239,68,68,0.15)", border: "none", color: u.activo ? "#4ade80" : "#f87171", padding: "6px 14px", borderRadius: 8, cursor: "pointer", fontWeight: 700, fontSize: 13 }}>{u.activo ? "✅ Activo" : "❌ Inactivo"}</button>
                      </td>
                      <td style={tdStyle}>
                        <div style={{ display: "flex", gap: 6 }}>
                          <button onClick={() => { setUsuarioEditando(u); setNotasTemp(u.notas_admin || ""); }} style={btnAccion}>📝</button>
                          <button onClick={() => eliminarUsuario(u.id)} style={{ ...btnAccion, background: "rgba(239,68,68,0.15)", color: "#f87171" }}>🗑️</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* COBROS */}
        {seccion === "cobros" && (
          <div>
            <h1 style={titleStyle}>COBROS</h1>
            <p style={descStyle}>Gestión de suscripciones y remesas mensuales.</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 20, marginBottom: 32 }}>
              {[
                { label: "EN PERIODO GRATUITO", value: enGratuito, color: "#fbbf24", desc: "Primeros 2 meses" },
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
        )}

        {/* FACTURACIÓN */}
        {seccion === "facturacion" && (
          <div>
            <h1 style={titleStyle}>FACTURACIÓN</h1>
            <p style={descStyle}>Resumen mensual para emitir facturas en Holded. Incluye suscripciones, FTP y portes RD Pago.</p>

            <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 28 }}>
              <label style={{ color: "#94a3b8", fontWeight: 700 }}>Mes a facturar:</label>
              <input type="month" value={mesFacturacion} onChange={e => setMesFacturacion(e.target.value)} style={{ background: "#0f172a", color: "white", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "10px 16px", fontSize: 15, outline: "none" }} />
              <span style={{ color: "#60a5fa", fontWeight: 700, fontSize: 16 }}>{nombreMesFact}</span>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 20, marginBottom: 28 }}>
              {[
                { label: "TOTAL A FACTURAR", value: `${(totalFactMes * 1.21).toFixed(2)}€`, color: "#22c55e", desc: "IVA incluido" },
                { label: "SUSCRIPCIONES", value: `${totalSuscMes.toFixed(2)}€`, color: "#60a5fa", desc: `${usuariosConFactura.filter(u => calcularFacturacionUsuario(u).suscripcion > 0).length} usuarios` },
                { label: "FTP SYNC", value: `${totalFtpMes.toFixed(2)}€`, color: "#a78bfa", desc: `${usuariosConFactura.filter(u => calcularFacturacionUsuario(u).ftp > 0).length} usuarios` },
                { label: "PORTES RD PAGO", value: `${totalPortesMes.toFixed(2)}€`, color: "#fbbf24", desc: "A recuperar" },
              ].map(({ label, value, color, desc }) => (
                <div key={label} style={kpiCard}><p style={kpiLabel}>{label}</p><h2 style={{ ...kpiNum, color }}>{value}</h2><p style={{ color: "#94a3b8", fontSize: 12, marginTop: 4 }}>{desc}</p></div>
              ))}
            </div>

            <div style={{ background: "rgba(139,92,246,0.08)", border: "1px solid rgba(139,92,246,0.2)", borderRadius: 14, padding: "14px 20px", marginBottom: 20, display: "flex", gap: 12, alignItems: "center" }}>
              <span style={{ fontSize: 20 }}>ℹ️</span>
              <p style={{ color: "#a78bfa", fontSize: 14, margin: 0 }}>Los pedidos pagados con <strong>tarjeta (Stripe)</strong> ya incluyen el porte en el cargo al cliente — no aparecen aquí. Solo se muestran portes de pedidos con <strong>RD Pago</strong>.</p>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 20 }}>
              <button onClick={exportarParaHolded} disabled={usuariosConFactura.length === 0} style={{ ...btnExportar, opacity: usuariosConFactura.length === 0 ? 0.5 : 1 }}>⬇️ Exportar para Holded ({nombreMesFact})</button>
            </div>

            {usuariosConFactura.length === 0 ? (
              <div style={{ textAlign: "center", padding: "60px 0", color: "#94a3b8" }}>
                <p style={{ fontSize: 48, marginBottom: 16 }}>🧾</p>
                <p style={{ fontSize: 18, fontWeight: 700 }}>No hay nada que facturar este mes</p>
                <p style={{ fontSize: 14, marginTop: 8 }}>Todos los usuarios están en periodo gratuito o cancelados</p>
              </div>
            ) : (
              <div style={tableContainer}>
                <table style={tableStyle}>
                  <thead>
                    <tr style={{ background: "rgba(0,0,0,0.2)" }}>
                      {["EMPRESA", "CIF", "TIPO", "SUSCRIPCIÓN", "FTP +10€", "PORTES RD", "BASE IMP.", "IVA 21%", "TOTAL"].map(h => <th key={h} style={thStyle}>{h}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {usuariosConFactura.map(u => {
                      const f = calcularFacturacionUsuario(u);
                      return (
                        <tr key={u.id} style={trStyle}>
                          <td style={tdStyle}><div style={{ fontWeight: 700 }}>{u.nombre_empresa || "-"}</div><div style={{ color: "#94a3b8", fontSize: 12 }}>{u.email}</div></td>
                          <td style={{ ...tdStyle, color: "#94a3b8", fontSize: 13 }}>{u.cif || "-"}</td>
                          <td style={tdStyle}><span style={tipoBadge(u.tipo)}>{u.tipo}</span></td>
                          <td style={tdStyle}>{f.suscripcion > 0 ? <span style={{ color: "#4ade80", fontWeight: 700 }}>25,00€</span> : <span style={{ color: "#94a3b8" }}>—</span>}</td>
                          <td style={tdStyle}>{f.ftp > 0 ? <span style={{ color: "#a78bfa", fontWeight: 700 }}>10,00€</span> : <span style={{ color: "#94a3b8" }}>—</span>}</td>
                          <td style={tdStyle}>{f.portes > 0 ? <div><span style={{ color: "#fbbf24", fontWeight: 700 }}>{f.portes.toFixed(2)}€</span><div style={{ color: "#94a3b8", fontSize: 11 }}>{f.numPedidosPortes} pedido{f.numPedidosPortes !== 1 ? "s" : ""}</div></div> : <span style={{ color: "#94a3b8" }}>—</span>}</td>
                          <td style={{ ...tdStyle, fontWeight: 700 }}>{f.total.toFixed(2)}€</td>
                          <td style={{ ...tdStyle, color: "#94a3b8" }}>{(f.total * 0.21).toFixed(2)}€</td>
                          <td style={tdStyle}><span style={{ color: "#22c55e", fontWeight: 900, fontSize: 16 }}>{(f.total * 1.21).toFixed(2)}€</span></td>
                        </tr>
                      );
                    })}
                    <tr style={{ background: "rgba(37,99,235,0.08)", borderTop: "2px solid rgba(37,99,235,0.3)" }}>
                      <td colSpan={6} style={{ padding: "14px 16px", fontWeight: 900, color: "#60a5fa" }}>TOTALES ({usuariosConFactura.length} facturas)</td>
                      <td style={{ padding: "14px 16px", fontWeight: 900 }}>{totalFactMes.toFixed(2)}€</td>
                      <td style={{ padding: "14px 16px", fontWeight: 900, color: "#94a3b8" }}>{(totalFactMes * 0.21).toFixed(2)}€</td>
                      <td style={{ padding: "14px 16px" }}><span style={{ color: "#22c55e", fontWeight: 900, fontSize: 18 }}>{(totalFactMes * 1.21).toFixed(2)}€</span></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            <div style={{ background: "rgba(15,23,42,0.95)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 16, padding: 24, marginTop: 24 }}>
              <p style={{ fontWeight: 800, fontSize: 16, marginBottom: 12 }}>📋 Cómo usar con Holded</p>
              {["1. Descarga el Excel con el botón de arriba", "2. Abre Holded → Ventas → Facturas → Nueva factura", "3. Para cada fila del Excel crea una factura con los conceptos desglosados", "4. Concepto 1: 'Suscripción plataforma Recambio Directo' — 25€", "5. Concepto 2 (si aplica): 'Servicio FTP Sync automático' — 10€", "6. Concepto 3 (si aplica): 'Gastos de transporte RD Pago' — importe exacto", "7. IVA 21% en todos los conceptos"].map((paso, i) => (
                <p key={i} style={{ color: i === 0 ? "#94a3b8" : "#cbd5e1", fontSize: 14, margin: "0 0 6px", paddingLeft: i > 0 ? 8 : 0 }}>{paso}</p>
              ))}
            </div>
          </div>
        )}

        {/* PEDIDOS */}
        {seccion === "pedidos" && (
          <div>
            <h1 style={titleStyle}>PEDIDOS</h1>
            <p style={descStyle}>Todos los pedidos de la plataforma.</p>

            {/* FILTROS */}
            <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" as const, alignItems: "center" }}>
              <input
                placeholder="Buscar código, cliente, email..."
                value={busquedaPedidos}
                onChange={e => { setBusquedaPedidos(e.target.value); setPaginaPedidos(1); }}
                style={{ ...searchInput, minWidth: 260 }}
              />
              <div style={{ display: "flex", gap: 6 }}>
                {[
                  { key: "todos", label: "Todos" },
                  { key: "pendiente", label: "⏳ Pendiente" },
                  { key: "preparando", label: "🔧 Preparando" },
                  { key: "enviado", label: "🚚 Enviado" },
                  { key: "entregado", label: "✅ Entregado" },
                ].map(({ key, label }) => (
                  <button key={key} onClick={() => { setFiltroPedidoEstado(key); setPaginaPedidos(1); }} style={{ ...btnFiltro, fontSize: 12, padding: "7px 12px", background: filtroPedidoEstado === key ? "rgba(37,99,235,0.3)" : "rgba(255,255,255,0.05)", color: filtroPedidoEstado === key ? "#60a5fa" : "#94a3b8", border: filtroPedidoEstado === key ? "1px solid rgba(37,99,235,0.5)" : "1px solid rgba(255,255,255,0.08)" }}>{label}</button>
                ))}
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                {[
                  { key: "todos", label: "Todos" },
                  { key: "tarjeta", label: "💳 Tarjeta" },
                  { key: "rd_pago", label: "🔵 RD Pago" },
                ].map(({ key, label }) => (
                  <button key={key} onClick={() => { setFiltroPedidoPago(key); setPaginaPedidos(1); }} style={{ ...btnFiltro, fontSize: 12, padding: "7px 12px", background: filtroPedidoPago === key ? "rgba(139,92,246,0.3)" : "rgba(255,255,255,0.05)", color: filtroPedidoPago === key ? "#a78bfa" : "#94a3b8", border: filtroPedidoPago === key ? "1px solid rgba(139,92,246,0.5)" : "1px solid rgba(255,255,255,0.08)" }}>{label}</button>
                ))}
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                {[
                  { key: "todos", label: "Todos" },
                  { key: "activos", label: "✅ Activos" },
                  { key: "anulados", label: "❌ Anulados" },
                ].map(({ key, label }) => (
                  <button key={key} onClick={() => { setFiltroPedidoAnulado(key); setPaginaPedidos(1); }} style={{ ...btnFiltro, fontSize: 12, padding: "7px 12px", background: filtroPedidoAnulado === key ? "rgba(239,68,68,0.2)" : "rgba(255,255,255,0.05)", color: filtroPedidoAnulado === key ? "#f87171" : "#94a3b8", border: filtroPedidoAnulado === key ? "1px solid rgba(239,68,68,0.4)" : "1px solid rgba(255,255,255,0.08)" }}>{label}</button>
                ))}
              </div>
              <span style={{ color: "#94a3b8", fontSize: 13, marginLeft: 4 }}>
                {pedidosFiltrados.length} pedido{pedidosFiltrados.length !== 1 ? "s" : ""}
                {pedidosFiltrados.length !== pedidos.length && <span style={{ color: "#60a5fa" }}> (de {pedidos.length})</span>}
              </span>
              {(busquedaPedidos || filtroPedidoEstado !== "todos" || filtroPedidoPago !== "todos" || filtroPedidoAnulado !== "todos") && (
                <button onClick={() => { setBusquedaPedidos(""); setFiltroPedidoEstado("todos"); setFiltroPedidoPago("todos"); setFiltroPedidoAnulado("todos"); setPaginaPedidos(1); }} style={{ ...btnFiltro, fontSize: 12, padding: "7px 12px", background: "rgba(255,255,255,0.05)", color: "#94a3b8", border: "1px solid rgba(255,255,255,0.08)" }}>✕ Limpiar</button>
              )}
            </div>

            <div style={tableContainer}>
              <table style={tableStyle}>
                <thead><tr>{["CÓDIGO", "CLIENTE", "TOTAL", "PAGO", "ESTADO", "FECHA", "ACCIÓN"].map(h => <th key={h} style={thStyle}>{h}</th>)}</tr></thead>
                <tbody>
                  {pedidosPagina.length === 0 ? (
                    <tr><td colSpan={7} style={{ ...tdStyle, textAlign: "center", color: "#94a3b8", padding: "40px" }}>No hay pedidos con los filtros aplicados</td></tr>
                  ) : pedidosPagina.map(p => (
                    <tr key={p.id} style={{ ...trStyle, opacity: p.anulado ? 0.5 : 1 }}>
                      <td style={tdStyle}>
                        <span style={{ color: "#60a5fa", fontWeight: 700 }}>{p.codigo || `#${p.id}`}</span>
                        {p.anulado && <div style={{ color: "#f87171", fontSize: 11, fontWeight: 700 }}>❌ Anulado</div>}
                      </td>
                      <td style={tdStyle}>
                        <div style={{ fontWeight: 600 }}>{p.cliente_nombre || "-"}</div>
                        <div style={{ color: "#94a3b8", fontSize: 12 }}>{p.cliente_email}</div>
                      </td>
                      <td style={{ ...tdStyle, color: "#22c55e", fontWeight: 700 }}>{Number(p.total || 0).toFixed(2)}€</td>
                      <td style={tdStyle}>
                        <span style={{ background: p.forma_pago === "rd_pago" ? "rgba(37,99,235,0.2)" : "rgba(139,92,246,0.2)", color: p.forma_pago === "rd_pago" ? "#60a5fa" : "#a78bfa", padding: "3px 8px", borderRadius: 999, fontSize: 11, fontWeight: 700 }}>
                          {p.forma_pago === "rd_pago" ? "RD Pago" : "Tarjeta"}
                        </span>
                      </td>
                      <td style={tdStyle}>
                        <span style={{ color: p.estado_envio === "entregado" ? "#4ade80" : p.estado_envio === "enviado" ? "#a78bfa" : p.estado_envio === "preparando" ? "#60a5fa" : "#f59e0b", fontWeight: 700, fontSize: 13 }}>
                          {p.estado_envio === "entregado" ? "✅ Entregado" : p.estado_envio === "enviado" ? "🚚 Enviado" : p.estado_envio === "preparando" ? "🔧 Preparando" : "⏳ Pendiente"}
                        </span>
                      </td>
                      <td style={{ ...tdStyle, color: "#94a3b8", fontSize: 13 }}>
                        {p.created_at ? new Date(p.created_at).toLocaleDateString("es-ES") : "-"}
                      </td>
                      <td style={tdStyle}>
                        {!p.anulado && p.estado_envio !== "entregado" && (
                          <button onClick={async () => { await supabase.from("pedidos").update({ estado_envio: "entregado", fecha_entrega_confirmada: new Date().toISOString() }).eq("id", p.id); await crearPagoProveedorSiNoExiste(p); }} style={{ background: "rgba(22,163,74,0.15)", color: "#4ade80", border: "none", padding: "6px 12px", borderRadius: 8, cursor: "pointer", fontWeight: 700, fontSize: 12 }}>✅ Entregado</button>
                        )}
                        {p.estado_envio === "entregado" && <span style={{ color: "#4ade80", fontSize: 12, fontWeight: 700 }}>✅</span>}
                      </td>
                    </tr>
                  ))}
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
                      <button key={page} onClick={() => setPaginaPedidos(page)} style={{ width: 36, height: 36, borderRadius: 8, border: "none", cursor: "pointer", fontWeight: 700, fontSize: 14, background: paginaPedidos === page ? "linear-gradient(135deg,#2563eb,#1d4ed8)" : "rgba(255,255,255,0.06)", color: paginaPedidos === page ? "white" : "#94a3b8" }}>{page}</button>
                    );
                  })}
                </div>
                <button onClick={() => setPaginaPedidos(p => Math.min(totalPaginasPedidos, p + 1))} disabled={paginaPedidos === totalPaginasPedidos} style={{ ...btnPagina, opacity: paginaPedidos === totalPaginasPedidos ? 0.3 : 1 }}>Siguiente →</button>
                <button onClick={() => setPaginaPedidos(totalPaginasPedidos)} disabled={paginaPedidos === totalPaginasPedidos} style={{ ...btnPagina, opacity: paginaPedidos === totalPaginasPedidos ? 0.3 : 1 }}>»»</button>
                <span style={{ color: "#94a3b8", fontSize: 13 }}>Pág <strong style={{ color: "white" }}>{paginaPedidos}</strong> de <strong style={{ color: "white" }}>{totalPaginasPedidos}</strong></span>
              </div>
            )}
          </div>
        )}

        {/* FINANCIERO */}
        {seccion === "financiero" && (
          <div>
            <h1 style={titleStyle}>FINANCIERO</h1>
            <p style={descStyle}>Créditos RD, IBAN proveedores y pagos a 7 días.</p>
            {usuariosProximosACobrar().length > 0 && (
              <div style={{ background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.3)", borderRadius: 16, padding: "16px 20px", marginBottom: 28 }}>
                <p style={{ fontWeight: 800, color: "#fbbf24", marginBottom: 8 }}>⏰ {usuariosProximosACobrar().length} usuario{usuariosProximosACobrar().length > 1 ? "s" : ""} próximos a cumplir 2 meses gratuitos</p>
                {usuariosProximosACobrar().map(u => {
                  const dias = Math.floor((new Date().getTime() - new Date(u.fecha_registro!).getTime()) / (1000 * 60 * 60 * 24));
                  return (
                    <div key={u.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(0,0,0,0.2)", borderRadius: 10, padding: "10px 14px", marginTop: 8 }}>
                      <div><span style={{ fontWeight: 700 }}>{u.nombre_empresa}</span><span style={{ color: "#94a3b8", fontSize: 13, marginLeft: 10 }}>{u.email}</span><span style={{ color: "#fbbf24", fontSize: 12, marginLeft: 10 }}>Día {dias} de 60</span></div>
                      <button onClick={() => cambiarSuscripcion(u.id, "pendiente")} style={{ background: "rgba(245,158,11,0.2)", border: "1px solid rgba(245,158,11,0.4)", color: "#fbbf24", padding: "6px 14px", borderRadius: 8, cursor: "pointer", fontWeight: 700, fontSize: 13 }}>Pasar a Pendiente</button>
                    </div>
                  );
                })}
              </div>
            )}
            <div style={{ ...seccionCard, marginBottom: 28 }}>
              <h2 style={{ fontSize: 20, fontWeight: 900, marginBottom: 16 }}>💳 Crédito RD e IBAN por usuario</h2>
              <div style={tableContainer}>
                <table style={tableStyle}>
                  <thead><tr>{["EMPRESA", "TIPO", "CRÉDITO RD", "IBAN", "ACCIONES"].map(h => <th key={h} style={thStyle}>{h}</th>)}</tr></thead>
                  <tbody>
                    {usuarios.map(u => (
                      <tr key={u.id} style={trStyle}>
                        <td style={tdStyle}><strong>{u.nombre_empresa || "-"}</strong><div style={{ color: "#94a3b8", fontSize: 12 }}>{u.email}</div></td>
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
                              <span style={{ color: (u.credito_rd || 0) > 0 ? "#4ade80" : "#94a3b8", fontWeight: 700 }}>{Number(u.credito_rd || 0).toFixed(2)}€</span>
                              <button onClick={() => { setCreditoEditando(u.id); setCreditoTemp(String(u.credito_rd || 0)); }} style={{ background: "rgba(37,99,235,0.15)", color: "#60a5fa", border: "none", borderRadius: 6, padding: "3px 8px", cursor: "pointer", fontSize: 12 }}>✏️</button>
                            </div>
                          )}
                        </td>
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
                        <td style={tdStyle}><button onClick={() => { setUsuarioEditando(u); setNotasTemp(u.notas_admin || ""); }} style={btnAccion}>📝 Notas</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div style={seccionCard}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <div>
                  <h2 style={{ fontSize: 20, fontWeight: 900 }}>🏦 Pagos a proveedores (7 días post-entrega)</h2>
                  <p style={{ color: "#94a3b8", fontSize: 13, marginTop: 4 }}>Pendientes: <strong style={{ color: "#fbbf24" }}>{pagosProveedores.filter(p => p.estado === "listo_para_pagar").length}</strong> · Pagados: <strong style={{ color: "#4ade80" }}>{pagosProveedores.filter(p => p.estado === "pagado").length}</strong></p>
                </div>
                <button onClick={generarRemesaPagos} style={btnExportar}>⬇️ Remesa SEPA Excel</button>
              </div>
              {pagosProveedores.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px", color: "#94a3b8" }}><p style={{ fontSize: 40, marginBottom: 8 }}>🏦</p><p>No hay pagos registrados aún</p><p style={{ fontSize: 13, marginTop: 8 }}>Aparecerán aquí cuando los pedidos sean marcados como entregados</p></div>
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
        )}

      </section>

      {/* MODAL CRÉDITO */}
      {creditoEditando && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 99999, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "#0f172a", borderRadius: 20, padding: 32, width: 560, border: "1px solid rgba(255,255,255,0.1)", maxHeight: "80vh", overflowY: "auto" as const }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h3 style={{ fontWeight: 900, fontSize: 18, margin: 0 }}>Credito RD — {usuarios.find(u => u.id === creditoEditando)?.nombre_empresa}</h3>
              <button onClick={() => setCreditoEditando(null)} style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: 20 }}>✕</button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
              <div style={{ background: "rgba(37,99,235,0.1)", border: "1px solid rgba(37,99,235,0.2)", borderRadius: 12, padding: 16 }}>
                <p style={{ color: "#94a3b8", fontSize: 11, fontWeight: 700, marginBottom: 6 }}>CREDITO ACTUAL</p>
                <p style={{ fontSize: 28, fontWeight: 900, color: "#4ade80", margin: 0 }}>{Number(usuarios.find(u => u.id === creditoEditando)?.credito_rd || 0).toFixed(2)}€</p>
              </div>
              <div style={{ background: "rgba(15,23,42,0.95)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: 16 }}>
                <p style={{ color: "#94a3b8", fontSize: 11, fontWeight: 700, marginBottom: 6 }}>ASIGNAR NUEVO CREDITO</p>
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

      {/* MODAL NOTAS */}
      {usuarioEditando && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 99999, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "#0f172a", borderRadius: 20, padding: 32, width: 480, border: "1px solid rgba(255,255,255,0.1)" }}>
            <h3 style={{ fontWeight: 900, fontSize: 18, marginBottom: 8 }}>📝 Notas — {usuarioEditando.nombre_empresa}</h3>
            <p style={{ color: "#94a3b8", fontSize: 13, marginBottom: 16 }}>Solo visibles para el admin.</p>
            <textarea value={notasTemp} onChange={e => setNotasTemp(e.target.value)} placeholder="Ej: SEPA enviado 01/06/2026, pendiente firma..." style={{ width: "100%", height: 140, background: "#020617", color: "white", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, padding: 14, fontSize: 14, outline: "none", resize: "vertical", boxSizing: "border-box" as const }} />
            <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
              <button onClick={() => setUsuarioEditando(null)} style={{ flex: 1, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#94a3b8", padding: 12, borderRadius: 10, cursor: "pointer", fontWeight: 700 }}>Cancelar</button>
              <button onClick={guardarNotas} disabled={guardando} style={{ flex: 1, background: "linear-gradient(135deg,#2563eb,#1d4ed8)", border: "none", color: "white", padding: 12, borderRadius: 10, cursor: "pointer", fontWeight: 700 }}>{guardando ? "Guardando..." : "✓ Guardar"}</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function HistorialCredito({ userId, pedidos }: { userId: string; pedidos: any[] }) {
  const pedidosUsuario = pedidos.filter(p => p.cliente_id === userId && p.forma_pago === "rd_pago");
  const totalUsado = pedidosUsuario.reduce((acc, p) => acc + Number(p.total || 0), 0);
  if (pedidosUsuario.length === 0) return <p style={{ color: "#94a3b8", fontSize: 13, textAlign: "center" as const, padding: "20px 0" }}>No hay pedidos con RD Pago</p>;
  return (
    <div>
      <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 10, padding: "10px 16px", marginBottom: 12 }}>
        <p style={{ color: "#f87171", fontSize: 13, fontWeight: 700, margin: 0 }}>Total usado: {totalUsado.toFixed(2)}€ en {pedidosUsuario.length} pedido{pedidosUsuario.length !== 1 ? "s" : ""}</p>
      </div>
      <div style={{ maxHeight: 200, overflowY: "auto" as const }}>
        {pedidosUsuario.map(p => (
          <div key={p.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.04)", fontSize: 13 }}>
            <div><span style={{ color: "#60a5fa", fontWeight: 700 }}>{p.codigo || "#" + p.id}</span><span style={{ color: "#94a3b8", marginLeft: 10 }}>{p.created_at ? new Date(p.created_at).toLocaleDateString("es-ES") : "-"}</span></div>
            <span style={{ color: "#f87171", fontWeight: 700 }}>-{Number(p.total).toFixed(2)}€</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function tipoBadge(tipo: string) {
  const map: Record<string, any> = { taller: { background: "rgba(139,92,246,0.2)", color: "#a78bfa", padding: "3px 10px", borderRadius: 999, fontSize: 12, fontWeight: 700 }, proveedor: { background: "rgba(37,99,235,0.2)", color: "#60a5fa", padding: "3px 10px", borderRadius: 999, fontSize: 12, fontWeight: 700 } };
  return map[tipo] || { background: "rgba(255,255,255,0.05)", color: "#94a3b8", padding: "3px 10px", borderRadius: 999, fontSize: 12, fontWeight: 700 };
}
function subBadge(sub: string) {
  const s = SUSCRIPCION_LABELS[sub] || { bg: "rgba(255,255,255,0.05)", color: "#94a3b8" };
  return { background: s.bg, color: s.color, padding: "3px 10px", borderRadius: 999, fontSize: 12, fontWeight: 700 };
}
function selectSub(sub: string) {
  const s = SUSCRIPCION_LABELS[sub] || { bg: "rgba(255,255,255,0.05)", color: "#94a3b8" };
  return { background: s.bg, color: s.color, border: "none", borderRadius: 8, padding: "6px 10px", fontWeight: 700, fontSize: 13, cursor: "pointer", outline: "none" };
}

const mainStyle = { display: "flex", minHeight: "100vh", background: "linear-gradient(180deg,#020617,#020b2d)", color: "white" };
const sidebarStyle = { width: 260, background: "rgba(15,23,42,0.98)", borderRight: "1px solid rgba(255,255,255,0.06)", padding: "32px 24px", display: "flex", flexDirection: "column" as const };
const logoBadge = { width: 48, height: 48, borderRadius: 14, background: "linear-gradient(135deg,#dc2626,#991b1b)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 18 };
const menuItem = { padding: "12px 16px", borderRadius: 12, cursor: "pointer", fontWeight: 600, fontSize: 15, color: "#94a3b8" };
const menuActivo = { ...menuItem, background: "linear-gradient(135deg,#dc2626,#991b1b)", color: "white", boxShadow: "0 8px 25px rgba(220,38,38,0.3)" };
const contentStyle = { flex: 1, padding: 48, overflowY: "auto" as const };
const titleStyle = { fontSize: 56, fontWeight: 900, lineHeight: 1, marginBottom: 12 };
const descStyle = { color: "#94a3b8", fontSize: 18, marginBottom: 36 };
const kpiGrid = { display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 20, marginBottom: 36 };
const kpiCard = { background: "rgba(15,23,42,0.95)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 20, padding: 24 };
const kpiLabel = { color: "#94a3b8", fontSize: 11, fontWeight: 700, marginBottom: 10 };
const kpiNum = { fontSize: 40, fontWeight: 900, margin: 0 };
const seccionCard = { background: "rgba(15,23,42,0.95)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 24, padding: 28 };
const filtrosBox = { display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" as const, alignItems: "center" };
const searchInput = { background: "#0f172a", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: "10px 16px", color: "white", fontSize: 14, outline: "none", minWidth: 280 };
const btnFiltro = { padding: "8px 16px", borderRadius: 999, fontWeight: 700, cursor: "pointer", fontSize: 13 };
const tableContainer = { background: "rgba(15,23,42,0.95)", borderRadius: 20, overflow: "hidden", border: "1px solid rgba(255,255,255,0.06)" };
const tableStyle = { width: "100%", borderCollapse: "collapse" as const };
const thStyle = { padding: "12px 16px", textAlign: "left" as const, color: "#94a3b8", fontSize: 11, fontWeight: 700, borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(0,0,0,0.2)", whiteSpace: "nowrap" as const };
const trStyle = { borderBottom: "1px solid rgba(255,255,255,0.04)" };
const tdStyle = { padding: "12px 16px", fontSize: 14, verticalAlign: "middle" as const };
const btnAccion = { background: "rgba(37,99,235,0.2)", color: "#60a5fa", border: "none", padding: "6px 10px", borderRadius: 8, cursor: "pointer", fontWeight: 700, fontSize: 13 };
const btnVer = { background: "rgba(37,99,235,0.15)", border: "1px solid rgba(37,99,235,0.3)", color: "#60a5fa", padding: "8px 16px", borderRadius: 10, cursor: "pointer", fontWeight: 700, fontSize: 13 };
const btnExportar = { background: "linear-gradient(135deg,#16a34a,#15803d)", border: "none", color: "white", padding: "14px 28px", borderRadius: 14, fontWeight: 900, cursor: "pointer", fontSize: 15 };
const btnPagina = { background: "rgba(37,99,235,0.15)", border: "1px solid rgba(37,99,235,0.3)", color: "#60a5fa", padding: "8px 14px", borderRadius: 10, cursor: "pointer", fontWeight: 700, fontSize: 13 };