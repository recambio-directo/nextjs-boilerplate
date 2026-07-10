"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";
import * as XLSX from "xlsx";
import { Usuario, Pedido, PagoProveedor } from "./types";
import SeccionDashboard from "./SeccionDashboard";
import SeccionUsuarios from "./SeccionUsuarios";
import SeccionCobros from "./SeccionCobros";
import SeccionFacturacion from "./SeccionFacturacion";
import SeccionFinanciero from "./SeccionFinanciero";
import SeccionPedidos from "./SeccionPedidos";
import SeccionFTP from "./SeccionFTP";

export default function AdminPage() {
  const router = useRouter();
  const [seccion, setSeccion] = useState<"dashboard"|"usuarios"|"pedidos"|"cobros"|"financiero"|"facturacion"|"ftp">("dashboard");
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [pagosProveedores, setPagosProveedores] = useState<PagoProveedor[]>([]);
  const [adminNombre, setAdminNombre] = useState("Admin");
  const [usuarioEditando, setUsuarioEditando] = useState<Usuario | null>(null);
  const [notasTemp, setNotasTemp] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [ftpProveedorId, setFtpProveedorId] = useState("");
  const [ftpPassword, setFtpPassword] = useState("");
  const [ftpTipoReferencias, setFtpTipoReferencias] = useState<"OEM"|"IAM">("IAM");
  const [ftpCreando, setFtpCreando] = useState(false);
  const [ftpResultado, setFtpResultado] = useState<{ usuario: string; password: string; empresa: string } | null>(null);
  const [verificando, setVerificando] = useState(true);

  const proximosACobrar = usuarios.filter(u => {
    if (u.suscripcion !== "gratuito" || !u.fecha_registro) return false;
    const dias = Math.floor((new Date().getTime() - new Date(u.fecha_registro).getTime()) / (1000 * 60 * 60 * 24));
    return dias >= 20 && dias <= 35;
  });

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/"); return; }
      const { data: perfil } = await supabase.from("usuarios").select("nombre_empresa, tipo").eq("id", user.id).single();
      if (!perfil || perfil.tipo !== "admin") { router.push("/"); return; }
      setAdminNombre(perfil?.nombre_empresa || user.email || "Admin");
      setVerificando(false);
      cargarDatos();
    }
    init();
  }, []);

  if (verificando) return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(180deg,#020617,#020b2d)", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <p style={{ color: "#94a3b8", fontSize: 16 }}>Verificando acceso...</p>
    </div>
  );

  async function cargarDatos() {
    const { data: usuariosData } = await supabase.from("usuarios").select("*").neq("tipo", "admin").order("fecha_registro", { ascending: false });
    setUsuarios(usuariosData || []);
    const { data: pedidosData } = await supabase.from("pedidos").select("*").order("id", { ascending: false }).limit(500);
    setPedidos(pedidosData || []);
    const { data: pagosData } = await supabase.from("pagos_proveedores").select("*").order("created_at", { ascending: false });
    setPagosProveedores(pagosData || []);
  }

  async function toggleActivo(usuario: Usuario) {
    await supabase.from("usuarios").update({ activo: !usuario.activo }).eq("id", usuario.id);
    setUsuarios(prev => prev.map(u => u.id === usuario.id ? { ...u, activo: !u.activo } : u));
  }

  async function cambiarSuscripcion(id: string, suscripcion: string) {
    await supabase.from("usuarios").update({ suscripcion }).eq("id", id);
    setUsuarios(prev => prev.map(u => u.id === id ? { ...u, suscripcion } : u));
  }

  async function eliminarUsuario(id: string) {
    if (!confirm("¿Eliminar este usuario? Esta acción no se puede deshacer.")) return;
    await supabase.from("usuarios").delete().eq("id", id);
    setUsuarios(prev => prev.filter(u => u.id !== id));
  }

  async function guardarNotas() {
    if (!usuarioEditando) return;
    setGuardando(true);
    await supabase.from("usuarios").update({ notas_admin: notasTemp }).eq("id", usuarioEditando.id);
    setUsuarios(prev => prev.map(u => u.id === usuarioEditando.id ? { ...u, notas_admin: notasTemp } : u));
    setGuardando(false);
    setUsuarioEditando(null);
  }

  async function marcarPagado(pagoId: number) {
    await supabase.from("pagos_proveedores").update({ estado: "pagado", fecha_pago_realizado: new Date().toISOString() }).eq("id", pagoId);
    cargarDatos();
  }

  async function generarRemesaPagos() {
    const pendientes = pagosProveedores.filter(p => p.estado === "listo_para_pagar");
    if (pendientes.length === 0) { alert("No hay pagos listos para remesar"); return; }
    const rows = pendientes.map(p => { const proveedor = usuarios.find(u => u.id === p.proveedor_id); return { "IBAN": proveedor?.iban||"SIN IBAN", "Empresa": proveedor?.nombre_empresa||"-", "Email": proveedor?.email||"-", "Pedido": `#${p.pedido_id}`, "Importe": p.importe.toFixed(2), "Fecha entrega": p.fecha_entrega ? new Date(p.fecha_entrega).toLocaleDateString("es-ES") : "-", "Fecha pago programado": p.fecha_pago_programado ? new Date(p.fecha_pago_programado).toLocaleDateString("es-ES") : "-" }; });
    const wb = XLSX.utils.book_new(); const ws = XLSX.utils.json_to_sheet(rows); XLSX.utils.book_append_sheet(wb, ws, "Remesa");
    XLSX.writeFile(wb, `remesa_proveedores_${new Date().toLocaleDateString("es-ES").replace(/\//g,"-")}.xlsx`);
  }

  async function crearPagoProveedorSiNoExiste(pedido: Pedido) {
    if (!pedido.id || !pedido.productos) return;
    const proveedoresUnicos = new Map<string, number>();
    for (const prod of pedido.productos) { if (prod.proveedor_id) { const actual = proveedoresUnicos.get(prod.proveedor_id) || 0; proveedoresUnicos.set(prod.proveedor_id, actual + Number(prod.precio || 0)); } }
    const fechaEntrega = new Date().toISOString();
    const fechaPago = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    for (const [provId, importe] of proveedoresUnicos.entries()) {
      const { data: existe } = await supabase.from("pagos_proveedores").select("id").eq("pedido_id", pedido.id).eq("proveedor_id", provId).maybeSingle();
      if (!existe) { await supabase.from("pagos_proveedores").insert({ pedido_id: pedido.id, proveedor_id: provId, importe, estado: "esperando_7dias", fecha_entrega: fechaEntrega, fecha_pago_programado: fechaPago }); }
    }
  }

  async function crearUsuarioFTP() {
    if (!ftpProveedorId || !ftpPassword) { alert("Selecciona un proveedor y pon una contraseña"); return; }
    setFtpCreando(true); setFtpResultado(null);
    const proveedor = usuarios.find(u => u.id === ftpProveedorId);
    if (!proveedor) { setFtpCreando(false); return; }
    const nombreUsuario = ("ftp_" + (proveedor.nombre_empresa || proveedor.email).toLowerCase().replace(/[^a-z0-9]/g,"_").replace(/_+/g,"_").substring(0,20)).replace(/_$/,"");
    try {
      const res = await fetch("/api/ftp/crear", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ proveedorId: ftpProveedorId, nombreUsuario, password: ftpPassword, proveedorNombre: proveedor.nombre_empresa || proveedor.email, tipoReferencias: ftpTipoReferencias }) });
      const data = await res.json();
      if (data.ok) { setFtpResultado({ usuario: nombreUsuario, password: ftpPassword, empresa: proveedor.nombre_empresa || proveedor.email }); setFtpPassword(""); setFtpProveedorId(""); cargarDatos(); }
      else { alert("Error: " + data.error); }
    } catch (e) { alert("Error de conexión con el servidor"); }
    setFtpCreando(false);
  }

  function descargarCredencialesFTP(usuario: string, password: string, empresa: string) {
    const contenido = `CREDENCIALES FTP — RECAMBIO DIRECTO\n=====================================\nEmpresa: ${empresa}\nFecha: ${new Date().toLocaleDateString("es-ES")}\n\nHost: 168.231.83.226\nPuerto: 21\nUsuario: ${usuario}\nPassword: ${password}\nCarpeta: /catalogo\n\nSoporte: info@recambio-directo.com\n=====================================`;
    const blob = new Blob([contenido], { type: "text/plain;charset=utf-8" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `credenciales-ftp-${empresa.replace(/\s+/g,"-").toLowerCase()}.txt`; a.click();
  }

  const mainStyle = { display: "flex", minHeight: "100vh", background: "linear-gradient(180deg,#020617,#020b2d)", color: "white" };
  const sidebarStyle = { width: 260, background: "rgba(15,23,42,0.98)", borderRight: "1px solid rgba(255,255,255,0.06)", padding: "32px 24px", display: "flex", flexDirection: "column" as const };
  const logoBadge = { width: 48, height: 48, borderRadius: 14, background: "linear-gradient(135deg,#dc2626,#991b1b)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 18 };
  const menuItem = { padding: "12px 16px", borderRadius: 12, cursor: "pointer", fontWeight: 600, fontSize: 15, color: "#94a3b8" };
  const menuActivo = { ...menuItem, background: "linear-gradient(135deg,#dc2626,#991b1b)", color: "white", boxShadow: "0 8px 25px rgba(220,38,38,0.3)" };
  const contentStyle = { flex: 1, padding: 48, overflowY: "auto" as const };

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
            { key: "financiero",  label: `🏦 Financiero${proximosACobrar.length > 0 ? " 🔴" : ""}` },
            { key: "pedidos",     label: "📦 Pedidos" },
            { key: "ftp",         label: "🔄 FTP Sync" },
          ].map(({ key, label }) => (
            <div key={key} onClick={() => setSeccion(key as any)} style={seccion === (key as any) ? menuActivo : menuItem}>{label}</div>
          ))}
        </nav>
        <div style={{ marginTop: "auto", paddingTop: 24 }}>
          <button onClick={async () => { await supabase.auth.signOut(); router.push("/"); }} style={{ width: "100%", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171", padding: "10px", borderRadius: 10, cursor: "pointer", fontWeight: 700, fontSize: 13 }}>Cerrar sesión</button>
        </div>
      </aside>

      <section style={contentStyle}>
        {seccion === "dashboard"   && <SeccionDashboard usuarios={usuarios} pedidos={pedidos} setSeccion={setSeccion} />}
        {seccion === "usuarios"    && <SeccionUsuarios usuarios={usuarios} setSeccion={setSeccion} setFtpProveedorId={setFtpProveedorId} toggleActivo={toggleActivo} cambiarSuscripcion={cambiarSuscripcion} eliminarUsuario={eliminarUsuario} setUsuarioEditando={setUsuarioEditando} setNotasTemp={setNotasTemp} />}
        {seccion === "cobros"      && <SeccionCobros usuarios={usuarios} pedidos={pedidos} cambiarSuscripcion={cambiarSuscripcion} />}
        {seccion === "facturacion" && <SeccionFacturacion usuarios={usuarios} pedidos={pedidos} />}
        {seccion === "financiero"  && <SeccionFinanciero usuarios={usuarios} pagosProveedores={pagosProveedores} cambiarSuscripcion={cambiarSuscripcion} setUsuarios={setUsuarios} setUsuarioEditando={setUsuarioEditando} setNotasTemp={setNotasTemp} marcarPagado={marcarPagado} generarRemesaPagos={generarRemesaPagos} pedidos={pedidos} />}
        {seccion === "pedidos"     && <SeccionPedidos pedidos={pedidos} cargarDatos={cargarDatos} crearPagoProveedorSiNoExiste={crearPagoProveedorSiNoExiste} />}
        {seccion === "ftp"         && <SeccionFTP usuarios={usuarios} ftpProveedorId={ftpProveedorId} setFtpProveedorId={setFtpProveedorId} ftpPassword={ftpPassword} setFtpPassword={setFtpPassword} ftpTipoReferencias={ftpTipoReferencias} setFtpTipoReferencias={setFtpTipoReferencias} ftpCreando={ftpCreando} ftpResultado={ftpResultado} setFtpResultado={setFtpResultado} crearUsuarioFTP={crearUsuarioFTP} descargarCredencialesFTP={descargarCredencialesFTP} />}
      </section>

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