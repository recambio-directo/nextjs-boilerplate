"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { pdf } from "@react-pdf/renderer";
import React from "react";
import { AlbaranPDF, EtiquetaEnvioPDF } from "../lib/AlbaranPDF";
import StripeCheckout, { calcularRecargo } from "../components/StripeCheckout";

type Producto = {
  id: number;
  referencia: string;
  descripcion: string;
  precio: number;
  impuesto?: number;
  stock?: number;
  proveedor_id?: string;
  proveedor_nombre?: string;
};

const FESTIVOS = [
  "2025-12-25","2026-01-01","2026-01-06",
  "2026-04-02","2026-04-03","2026-05-01",
  "2026-08-15","2026-10-12","2026-11-01",
  "2026-12-06","2026-12-08","2026-12-25",
];

function esDiaHabil(fecha: Date): boolean {
  const d = fecha.getDay();
  if (d === 0 || d === 6) return false;
  return !FESTIVOS.includes(fecha.toISOString().split("T")[0]);
}

function sumarDiasHabiles(desde: Date, dias: number): Date {
  const r = new Date(desde);
  let s = 0;
  while (s < dias) { r.setDate(r.getDate() + 1); if (esDiaHabil(r)) s++; }
  return r;
}

function calcularFechasEnvio(agencia: string) {
  const ahora = new Date();
  const horaEs = new Date(ahora.toLocaleString("en-US", { timeZone: "Europe/Madrid" }));
  const horaActual = horaEs.getHours() + horaEs.getMinutes() / 60;
  const ag = agencia.toLowerCase();
  const horaCierre = ag.includes("nacex") ? "17:00"
    : ag.includes("mrw") ? "16:00"
    : ag.includes("seur") ? "16:00"
    : ag.includes("gls") ? "15:00"
    : ag.includes("correos") ? "14:00"
    : ag.includes("ctt") ? "15:00"
    : ag.includes("dhl") ? "15:00"
    : "16:00";
  const horaCierreNum = parseInt(horaCierre);
  let recogida = new Date(horaEs);
  recogida.setHours(0, 0, 0, 0);
  const recogidaHoy = esDiaHabil(recogida) && horaActual < horaCierreNum;
  if (!recogidaHoy) recogida = sumarDiasHabiles(recogida, 1);
  const diasTransito = ag.includes("nacex") ? 1
    : ag.includes("mrw") ? 1
    : ag.includes("seur") ? 1
    : ag.includes("gls") ? 2
    : ag.includes("correos") ? 2
    : ag.includes("ctt") ? 1
    : ag.includes("dhl") ? 1
    : 1;
  const entrega = sumarDiasHabiles(recogida, diasTransito);
  return { recogida, entrega, horaCierre, recogidaHoy };
}

function fmtFecha(fecha: Date): string {
  return fecha.toLocaleDateString("es-ES", { weekday: "short", day: "numeric", month: "short" });
}

const TODAS_OPCIONES = [
  { key: "MRW",             label: "MRW 24H",        precio: 7.95,  color: "#E30613", textColor: "#fff" },
  { key: "NACEX",           label: "NACEX",           precio: 7.50,  color: "#FFD200", textColor: "#1a1a1a" },
  { key: "SEUR",            label: "SEUR 24",         precio: 7.50,  color: "#F5A800", textColor: "#1a1a1a" },
  { key: "GLS",             label: "GLS",             precio: 6.50,  color: "#00467F", textColor: "#fff" },
  { key: "Correos Express", label: "Correos Exp.",    precio: 5.00,  color: "#FFCC00", textColor: "#333" },
  { key: "CTT Express",     label: "CTT Express",     precio: 7.50,  color: "#E2001A", textColor: "#fff" },
  { key: "DHL",             label: "DHL Express",     precio: 7.50,  color: "#FFCC00", textColor: "#D40511" },
  { key: "Mis Medios",      label: "Mis Medios",      precio: 0,     color: "#7c3aed", textColor: "#fff" },
];

// ── Selector de agencias en GRID 2 columnas ───────────────────────────────────
function GridTransporte({ opciones, transporte, setTransporte }: { opciones: typeof TODAS_OPCIONES; transporte: string | null; setTransporte: (v: string) => void }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
      {opciones.map(({ key, label, precio, color, textColor }) => {
        const sel = transporte === key;
        const esMisMedios = key === "Mis Medios";
        const { recogida, entrega, recogidaHoy } = calcularFechasEnvio(key);
        return (
          <button key={key} onClick={() => setTransporte(key)} style={{ borderRadius: 12, padding: "10px 10px", cursor: "pointer", textAlign: "left" as const, background: sel ? "rgba(37,99,235,0.08)" : "rgba(255,255,255,0.03)", border: sel ? "2px solid #2563eb" : "1px solid rgba(255,255,255,0.08)", color: "white", display: "flex", flexDirection: "column" as const, gap: 4 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ background: color, color: textColor, fontWeight: 900, fontSize: 10, padding: "2px 7px", borderRadius: 4 }}>{label}</span>
              <span style={{ fontWeight: 900, fontSize: 13, color: sel ? "#60a5fa" : esMisMedios ? "#4ade80" : "white" }}>{esMisMedios ? "Gratis" : `${precio.toFixed(2)}€`}</span>
            </div>
            {!esMisMedios ? (
              <>
                <p style={{ margin: 0, fontSize: 10, color: recogidaHoy ? "#4ade80" : "#fbbf24" }}>
                  {recogidaHoy ? "Recogida hoy" : `Recogida ${fmtFecha(recogida)}`}
                </p>
                <p style={{ margin: 0, fontSize: 10, color: "#94a3b8" }}>Entrega {fmtFecha(entrega)}</p>
              </>
            ) : (
              <p style={{ margin: 0, fontSize: 10, color: "#94a3b8" }}>Tú gestionas el envío</p>
            )}
          </button>
        );
      })}
    </div>
  );
}

// ── Acordeón paso ─────────────────────────────────────────────────────────────
function Paso({ numero, titulo, icono, activo, completado, resumen, children, onContinuar, labelContinuar }: {
  numero: number; titulo: string; icono: string; activo: boolean; completado: boolean;
  resumen?: React.ReactNode; children?: React.ReactNode;
  onContinuar?: () => void; labelContinuar?: string;
}) {
  return (
    <div style={{ background: "rgba(15,23,42,0.95)", borderRadius: 16, border: activo ? "2px solid rgba(37,99,235,0.5)" : "1px solid rgba(255,255,255,0.06)", overflow: "hidden", opacity: !activo && !completado ? 0.5 : 1 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px" }}>
        <div style={{ width: 28, height: 28, borderRadius: "50%", background: completado ? "rgba(22,163,74,0.2)" : activo ? "rgba(37,99,235,0.2)" : "rgba(255,255,255,0.06)", border: completado ? "1px solid rgba(22,163,74,0.5)" : activo ? "1px solid rgba(37,99,235,0.5)" : "1px solid rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          {completado ? <span style={{ fontSize: 13, color: "#4ade80" }}>✓</span> : <span style={{ fontSize: 12, fontWeight: 700, color: activo ? "#60a5fa" : "#94a3b8" }}>{numero}</span>}
        </div>
        <span style={{ fontWeight: 800, fontSize: 15, color: activo ? "white" : "#94a3b8", flex: 1 }}>{icono} {titulo}</span>
        {completado && !activo && <span style={{ fontSize: 11, color: "#4ade80", fontWeight: 700 }}>✓ listo</span>}
      </div>
      {completado && !activo && resumen && (
        <div style={{ padding: "0 16px 14px" }}>{resumen}</div>
      )}
      {activo && (
        <div style={{ padding: "0 16px 16px" }}>
          {children}
          {onContinuar && (
            <button onClick={onContinuar} style={{ width: "100%", marginTop: 14, padding: "13px", background: "linear-gradient(135deg,#2563eb,#1d4ed8)", border: "none", borderRadius: 12, color: "white", fontWeight: 800, fontSize: 14, cursor: "pointer" }}>
              {labelContinuar || "Continuar →"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default function CheckoutPage() {
  const [paso, setPaso] = useState<1 | 2 | 3>(1);
  const [empresa, setEmpresa] = useState("");
  const [telefono, setTelefono] = useState("");
  const [direccion, setDireccion] = useState("");
  const [ciudad, setCiudad] = useState("");
  const [cif, setCif] = useState("");
  const [codigoPostal, setCodigoPostal] = useState("");
  const [provincia, setProvincia] = useState("");
  const [clienteEmail, setClienteEmail] = useState("");
  const [productos, setProductos] = useState<Producto[]>([]);
  const [transporte, setTransporte] = useState<string | null>(null);
  const [formaPago, setFormaPago] = useState<"rd_pago" | "tarjeta">("tarjeta");
  const [creditoRD, setCreditoRD] = useState(0);
  const [cargando, setCargando] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [cantidades, setCantidades] = useState<Record<string, number>>({});
  const [editandoDatos, setEditandoDatos] = useState(false);
  const [mostrarStripe, setMostrarStripe] = useState(false);
  const [mostrarModalRD, setMostrarModalRD] = useState(false);
  const [empresaEdit, setEmpresaEdit] = useState("");
  const [telefonoEdit, setTelefonoEdit] = useState("");
  const [direccionEdit, setDireccionEdit] = useState("");
  const [ciudadEdit, setCiudadEdit] = useState("");
  const [cifEdit, setCifEdit] = useState("");
  const [isMobile, setIsMobile] = useState(false);
  const [agenciasDisponibles, setAgenciasDisponibles] = useState<string[]>(["MRW","NACEX","SEUR","GLS","Correos Express","CTT Express","DHL","Mis Medios"]);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => { cargarDatos(); }, []);

  function getAgenciasDisponibles(cpOrigen: string, cpDestino: string): string[] {
    const esIsla = (cp: string) => cp.startsWith("35") || cp.startsWith("38") || cp.startsWith("51") || cp.startsWith("52");
    const agencias: string[] = ["Mis Medios","MRW","Correos Express","SEUR","CTT Express","DHL"];
    if (!esIsla(cpOrigen) && !esIsla(cpDestino)) agencias.push("GLS");
    return agencias;
  }

  async function cargarDatos() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setUserId(user.id);
    setClienteEmail(user.email || "");
    const { data: perfil } = await supabase.from("usuarios").select("*").eq("id", user.id).single();
    if (perfil) {
      setEmpresa(perfil.nombre_empresa || ""); setTelefono(perfil.telefono || "");
      setDireccion(perfil.direccion || ""); setCiudad(perfil.ciudad || "");
      setCif(perfil.cif || ""); setCreditoRD(Number(perfil.credito_rd) || 0);
      setCodigoPostal(perfil.codigo_postal || ""); setProvincia(perfil.provincia || "");
      setEmpresaEdit(perfil.nombre_empresa || ""); setTelefonoEdit(perfil.telefono || "");
      setDireccionEdit(perfil.direccion || ""); setCiudadEdit(perfil.ciudad || "");
      setCifEdit(perfil.cif || "");
    }
    const { data: cesta } = await supabase.from("cesta").select("*").eq("user_id", user.id).order("id", { ascending: true });
    if (cesta) {
      const vistos = new Set<string>();
      const sinDuplicados = cesta.filter((item: Producto) => { if (vistos.has(item.referencia)) return false; vistos.add(item.referencia); return true; });
      setProductos(sinDuplicados);
      const initCantidades: Record<string, number> = {};
      sinDuplicados.forEach((p: Producto) => { initCantidades[p.referencia] = 1; });
      setCantidades(initCantidades);
      const proveedorIds = [...new Set(cesta.map((p: any) => p.proveedor_id).filter(Boolean))];
      let agenciasValidas = ["MRW","SEUR","GLS","Correos Express","CTT Express","DHL","Mis Medios"];
      for (const provId of proveedorIds) {
        const { data: prov } = await supabase.from("usuarios").select("codigo_postal").eq("id", provId).single();
        const cpOrigen = prov?.codigo_postal || "";
        const cpDestino = perfil?.codigo_postal || "";
        const disponibles = getAgenciasDisponibles(cpOrigen, cpDestino);
        agenciasValidas = agenciasValidas.filter(a => disponibles.includes(a));
      }
      let nacexDisponible = true;
      for (const provId of proveedorIds) {
        const { data: prov } = await supabase.from("usuarios").select("codigo_postal, ciudad").eq("id", provId).single();
        const cpOrigen = prov?.codigo_postal || "";
        const poblacionOrigen = prov?.ciudad || "";
        const cpDestino = perfil?.codigo_postal || "";
        const poblacionDestino = perfil?.ciudad || "";
        if (!cpOrigen || !cpDestino) { nacexDisponible = false; break; }
        try {
          const dispRes = await fetch("/api/nacex/disponibilidad", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ cpOrigen, poblacionOrigen, cpDestino, poblacionDestino }),
          });
          const dispData = await dispRes.json();
          if (!dispData.ok || !dispData.disponible) { nacexDisponible = false; break; }
        } catch { nacexDisponible = false; break; }
      }
      if (nacexDisponible) agenciasValidas.push("NACEX");
      setAgenciasDisponibles(agenciasValidas);
      if (transporte && !agenciasValidas.includes(transporte)) setTransporte(null);
    }
  }

  async function eliminarArticulo(producto: Producto) {
    if (!userId) return;
    await supabase.from("cesta").delete().eq("user_id", userId).eq("referencia", producto.referencia);
    setProductos(prev => prev.filter(p => p.referencia !== producto.referencia));
  }

  function getPrecioTransporte(): number {
    if (!transporte || transporte === "Mis Medios") return 0;
    if (transporte === "MRW") return 7.95;
    if (transporte === "NACEX") return 7.50;
    if (transporte === "SEUR") return 7.50;
    if (transporte === "GLS") return 6.50;
    if (transporte === "Correos Express") return 5.00;
    if (transporte === "CTT Express") return 7.50;
    if (transporte === "DHL") return 7.50;
    return 0;
  }

  const subtotal = productos.reduce((acc, item) => acc + (Number(item.precio) + Number(item.impuesto || 0)) * (cantidades[item.referencia] || 1), 0);
  const precioTransporte = getPrecioTransporte();
  const iva = subtotal * 0.21;
  const total = subtotal + precioTransporte + iva;
  const puedeConfirmar = productos.length > 0 && transporte !== null && !cargando;

  const rdPagoActivo = creditoRD > 0;

  function getGruposPorProveedor(): Map<string, { nombre: string; productos: Producto[] }> {
    const grupos = new Map<string, { nombre: string; productos: Producto[] }>();
    for (const p of productos) {
      const key = p.proveedor_id || "sin_proveedor";
      if (!grupos.has(key)) grupos.set(key, { nombre: p.proveedor_nombre || "Proveedor", productos: [] });
      grupos.get(key)!.productos.push(p);
    }
    return grupos;
  }

  const numProveedores = new Set(productos.map(p => p.proveedor_id)).size;
  const grupos = getGruposPorProveedor();
  const opciones = TODAS_OPCIONES.filter(o => agenciasDisponibles.includes(o.key));

  async function generarYGuardarPDFs(pedidoId: number, codigo: string, proveedorNombre: string, proveedorEmail: string, proveedorCif: string, proveedorTelefono: string, proveedorDireccion: string, proveedorCiudad: string, proveedorCodigoPostal: string, proveedorProvincia: string, productosGrupo: Producto[], subtotalGrupo: number, ivaGrupo: number, totalGrupo: number, fecha: string, numeroEnvio?: string, numeroSolicitud?: string) {
    try {
      const gastosGestion = formaPago === "tarjeta" ? calcularRecargo(totalGrupo).recargo : 0;
      const props = { codigo, fecha, proveedorNombre, proveedorEmail, proveedorCif, proveedorTelefono, proveedorDireccion, proveedorCiudad, proveedorCodigoPostal, proveedorProvincia, cliente: empresa, clienteEmail, telefono, cif, direccion, ciudad, codigoPostal, provincia, agencia: transporte || "", formaPago, productos: productosGrupo, subtotal: subtotalGrupo, iva: ivaGrupo, total: totalGrupo, gastosGestion, numeroEnvio, numeroSolicitud };
      const albaranBlob = await pdf(React.createElement(AlbaranPDF, props) as any).toBlob();
      const etiquetaBlob = await pdf(React.createElement(EtiquetaEnvioPDF, props) as any).toBlob();
      const albaranPath = `documentos/${codigo}/albaran-${codigo}.pdf`;
      const etiquetaPath = `documentos/${codigo}/etiqueta-envio-${codigo}.pdf`;
      await supabase.storage.from("FACTURAS").upload(albaranPath, albaranBlob, { contentType: "application/pdf", upsert: true });
      await supabase.storage.from("FACTURAS").upload(etiquetaPath, etiquetaBlob, { contentType: "application/pdf", upsert: true });
      const { data: albaranUrl } = supabase.storage.from("FACTURAS").getPublicUrl(albaranPath);
      const { data: etiquetaUrl } = supabase.storage.from("FACTURAS").getPublicUrl(etiquetaPath);
      const agLower = (transporte || "").toLowerCase();
      const tieneEtiquetaAgencia = agLower.includes("mrw") || agLower.includes("nacex") || agLower.includes("seur") || agLower.includes("correos") || agLower.includes("ctt") || agLower.includes("dhl");
      await supabase.from("pedidos").update({ albaran_url: albaranUrl.publicUrl, ...(tieneEtiquetaAgencia ? {} : { etiqueta_envio_url: etiquetaUrl.publicUrl }) }).eq("id", pedidoId);
      return { albaran_url: albaranUrl.publicUrl, etiqueta_envio_url: tieneEtiquetaAgencia ? null : etiquetaUrl.publicUrl };
    } catch (e) { console.error("Error generando PDFs:", e); return null; }
  }

  async function finalizarCompra() {
    if (!puedeConfirmar) return;
    if (formaPago === "tarjeta") { setMostrarStripe(true); return; }
    if (formaPago === "rd_pago" && creditoRD < total) { alert("Saldo RD Pago insuficiente."); return; }
    setCargando(true);
    await procesarPedido();
  }

  async function descontarStock(provId: string, productosGrupo: Producto[], cantidadesCompradas: Record<string, number>) {
    for (const prod of productosGrupo) {
      if (provId === "sin_proveedor") continue;
      const cantidad = cantidadesCompradas[prod.referencia] || 1;
      const { data: pieza } = await supabase.from("piezas_publicadas").select("id, stock, tipo").eq("proveedor_id", provId).eq("referencia", prod.referencia).maybeSingle();
      if (!pieza) continue;
      const nuevoStock = Math.max(0, (pieza.stock || 0) - cantidad);
      if (nuevoStock === 0) await supabase.from("piezas_publicadas").delete().eq("id", pieza.id);
      else await supabase.from("piezas_publicadas").update({ stock: nuevoStock }).eq("id", pieza.id);
    }
  }

  async function procesarPedido() {
    setCargando(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { alert("Debes iniciar sesión"); setCargando(false); return; }
    const fecha = new Date().toISOString();
    const direccionCompleta = direccion + (ciudad ? ", " + ciudad : "");
    const grupos = getGruposPorProveedor();
    let primerPedido = true;
    for (const [provId, grupo] of grupos) {
      const subtotalGrupo = grupo.productos.reduce((acc, p) => acc + (Number(p.precio) + Number(p.impuesto || 0)) * (cantidades[p.referencia] || 1), 0);
      const transporteGrupo = primerPedido ? precioTransporte : 0;
      const ivaGrupo = subtotalGrupo * 0.21;
      const totalGrupo = subtotalGrupo + transporteGrupo + ivaGrupo;
      const totalSinPorte = subtotalGrupo + ivaGrupo;
      const codigo = "RD-" + Math.floor(Math.random() * 9000000 + 1000000);
      let emailProveedor = "", nombreProveedor = grupo.nombre, proveedorCif = "", proveedorTelefono = "", proveedorDireccion = "", proveedorCiudad = "", proveedorCodigoPostal = "", proveedorProvincia = "";
      if (provId !== "sin_proveedor") {
        const { data: prov } = await supabase.from("usuarios").select("email, nombre_empresa, cif, telefono, direccion, ciudad, codigo_postal, provincia").eq("id", provId).single();
        emailProveedor = prov?.email || ""; nombreProveedor = prov?.nombre_empresa || grupo.nombre;
        proveedorCif = prov?.cif || ""; proveedorTelefono = prov?.telefono || "";
        proveedorDireccion = prov?.direccion || ""; proveedorCiudad = prov?.ciudad || "";
        proveedorCodigoPostal = prov?.codigo_postal || ""; proveedorProvincia = prov?.provincia || "";
      }
      const pedido = { cliente_id: user.id, cliente_email: user.email, cliente_nombre: empresa, cliente_telefono: telefono, direccion: direccionCompleta, subtotal: subtotalGrupo, total: totalGrupo, coste_transporte: transporteGrupo, estado: "pendiente", estado_pago: formaPago === "tarjeta" ? "pagado" : "pendiente", estado_envio: "pendiente", codigo, transporte, agencia: transporte, forma_pago: formaPago, metodo_pago: "pagofacil", productos: grupo.productos };
      const { data: pedidoInsertado, error } = await supabase.from("pedidos").insert(pedido).select("id").single();
      if (error) { console.error("Error creando pedido:", error); continue; }
      primerPedido = false;
      await descontarStock(provId, grupo.productos, cantidades);
      if (pedidoInsertado?.id) await generarYGuardarPDFs(pedidoInsertado.id, codigo, nombreProveedor, emailProveedor, proveedorCif, proveedorTelefono, proveedorDireccion, proveedorCiudad, proveedorCodigoPostal, proveedorProvincia, grupo.productos, subtotalGrupo, ivaGrupo, totalSinPorte, fecha);

      if (transporte === "MRW" && pedidoInsertado?.id) {
        try {
          const provDireccionParts = proveedorDireccion.split(",");
          const provCiudad = provDireccionParts[provDireccionParts.length - 1]?.trim() || "";
          const provDireccionSolo = provDireccionParts.slice(0, -1).join(",").trim() || proveedorDireccion;
          let provCP = "";
          if (provId !== "sin_proveedor") { const { data: provExtra } = await supabase.from("usuarios").select("codigo_postal").eq("id", provId).single(); provCP = provExtra?.codigo_postal || ""; }
          const { data: clienteExtra } = await supabase.from("usuarios").select("codigo_postal").eq("id", user.id).single();
          const clienteCP = clienteExtra?.codigo_postal || "";
          const mrwRes = await fetch("/api/mrw/crear-envio", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ pedidoId: pedidoInsertado.id, pedidoCodigo: codigo, remitenteNombre: nombreProveedor, remitenteDireccion: provDireccionSolo, remitenteCodigoPostal: provCP, remitentePoblacion: provCiudad, remitenteTelefono: proveedorTelefono, destinatarioNombre: empresa || user.email, destinatarioDireccion: direccion, destinatarioCodigoPostal: clienteCP, destinatarioPoblacion: ciudad, destinatarioTelefono: telefono, destinatarioEmail: user.email, pesoKg: Math.max(1, grupo.productos.length * 2) }) });
          const mrwData = await mrwRes.json();
          if (mrwData.ok && mrwData.numeroEnvio) await generarYGuardarPDFs(pedidoInsertado.id, codigo, nombreProveedor, emailProveedor, proveedorCif, proveedorTelefono, proveedorDireccion, proveedorCiudad, proveedorCodigoPostal, proveedorProvincia, grupo.productos, subtotalGrupo, ivaGrupo, totalSinPorte, fecha, mrwData.numeroEnvio, mrwData.numeroSolicitud);
        } catch (e) { console.error("Error MRW:", e); }
      }
      if (transporte === "NACEX" && pedidoInsertado?.id) {
        try {
          const provDireccionParts = proveedorDireccion.split(",");
          const provCiudad = provDireccionParts[provDireccionParts.length - 1]?.trim() || proveedorCiudad || "";
          const provDireccionSolo = provDireccionParts.slice(0, -1).join(",").trim() || proveedorDireccion;
          const nacexRes = await fetch("/api/nacex/crear-envio", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ pedidoId: pedidoInsertado.id, pedidoCodigo: codigo, remitenteNombre: nombreProveedor, remitenteDireccion: provDireccionSolo, remitenteCodigoPostal: proveedorCodigoPostal, remitentePoblacion: provCiudad, remitenteTelefono: proveedorTelefono, destinatarioNombre: empresa || user.email, destinatarioDireccion: direccion, destinatarioCodigoPostal: codigoPostal, destinatarioPoblacion: ciudad, destinatarioTelefono: telefono, destinatarioEmail: user.email, pesoKg: Math.max(1, grupo.productos.length * 2) }) });
          const nacexData = await nacexRes.json();
          if (nacexData.ok && nacexData.localizador) { await supabase.from("pedidos").update({ tracking_nacex: nacexData.localizador, codigo_postal_destino: codigoPostal }).eq("id", pedidoInsertado.id); await generarYGuardarPDFs(pedidoInsertado.id, codigo, nombreProveedor, emailProveedor, proveedorCif, proveedorTelefono, proveedorDireccion, proveedorCiudad, proveedorCodigoPostal, proveedorProvincia, grupo.productos, subtotalGrupo, ivaGrupo, totalSinPorte, fecha, nacexData.localizador); }
        } catch (e) { console.error("Error NACEX:", e); }
      }
      if (transporte === "SEUR" && pedidoInsertado?.id) {
        try {
          const provDireccionParts = proveedorDireccion.split(",");
          const provCiudad = provDireccionParts[provDireccionParts.length - 1]?.trim() || proveedorCiudad || "";
          const provDireccionSolo = provDireccionParts.slice(0, -1).join(",").trim() || proveedorDireccion;
          const seurRes = await fetch("/api/seur/crear-envio", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ pedidoId: pedidoInsertado.id, pedidoCodigo: codigo, remitenteNombre: nombreProveedor, remitenteCif: proveedorCif, remitenteDireccion: provDireccionSolo, remitenteCodigoPostal: proveedorCodigoPostal, remitentePoblacion: provCiudad, remitenteTelefono: proveedorTelefono, remitenteEmail: emailProveedor, destinatarioNombre: empresa || user.email, destinatarioDireccion: direccion, destinatarioCodigoPostal: codigoPostal, destinatarioPoblacion: ciudad, destinatarioTelefono: telefono, destinatarioEmail: user.email, pesoKg: Math.max(1, grupo.productos.length * 2) }) });
          const seurData = await seurRes.json();
          if (seurData.ok && seurData.collectionRef) { await supabase.from("pedidos").update({ tracking_seur: seurData.tracking, collection_ref_seur: seurData.collectionRef }).eq("id", pedidoInsertado.id); await generarYGuardarPDFs(pedidoInsertado.id, codigo, nombreProveedor, emailProveedor, proveedorCif, proveedorTelefono, proveedorDireccion, proveedorCiudad, proveedorCodigoPostal, proveedorProvincia, grupo.productos, subtotalGrupo, ivaGrupo, totalSinPorte, fecha, seurData.tracking); }
        } catch (e) { console.error("Error SEUR:", e); }
      }
      if (transporte === "Correos Express" && pedidoInsertado?.id) {
        try {
          const cexRes = await fetch("/api/correos-express/crear-envio", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ pedidoId: pedidoInsertado.id }) });
          const cexData = await cexRes.json();
          if (cexData.ok && cexData.numEnvio) await generarYGuardarPDFs(pedidoInsertado.id, codigo, nombreProveedor, emailProveedor, proveedorCif, proveedorTelefono, proveedorDireccion, proveedorCiudad, proveedorCodigoPostal, proveedorProvincia, grupo.productos, subtotalGrupo, ivaGrupo, totalSinPorte, fecha, cexData.numEnvio);
        } catch (e) { console.error("Error CEX:", e); }
      }
      if (transporte === "CTT Express" && pedidoInsertado?.id) {
        try {
          const cttRes = await fetch("/api/ctt/crear-envio", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ pedidoId: pedidoInsertado.id }) });
          const cttData = await cttRes.json();
          if (cttData.ok && cttData.shippingCode) await generarYGuardarPDFs(pedidoInsertado.id, codigo, nombreProveedor, emailProveedor, proveedorCif, proveedorTelefono, proveedorDireccion, proveedorCiudad, proveedorCodigoPostal, proveedorProvincia, grupo.productos, subtotalGrupo, ivaGrupo, totalSinPorte, fecha, cttData.shippingCode);
        } catch (e) { console.error("Error CTT:", e); }
      }
      if (transporte === "DHL" && pedidoInsertado?.id) {
        try {
          const dhlRes = await fetch("/api/dhl/crear-envio", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ pedidoId: pedidoInsertado.id }) });
          const dhlData = await dhlRes.json();
          if (dhlData.ok && dhlData.trackingNumber) await generarYGuardarPDFs(pedidoInsertado.id, codigo, nombreProveedor, emailProveedor, proveedorCif, proveedorTelefono, proveedorDireccion, proveedorCiudad, proveedorCodigoPostal, proveedorProvincia, grupo.productos, subtotalGrupo, ivaGrupo, totalSinPorte, fecha, dhlData.trackingNumber);
        } catch (e) { console.error("Error DHL:", e); }
      }
      if (emailProveedor) {
        try { await fetch("/api/enviar-email", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ proveedorEmail: emailProveedor, proveedorNombre: nombreProveedor, productos: grupo.productos, cliente: empresa, clienteEmail: user.email, telefono, cif, direccion: direccionCompleta, agencia: transporte, formaPago, subtotal: subtotalGrupo, iva: ivaGrupo, total: totalGrupo, codigo, fecha, pedidoId: pedidoInsertado?.id }) }); }
        catch (e) { console.error("Error email:", e); }
      }
    }
    await supabase.from("cesta").delete().eq("user_id", user.id);
    if (formaPago === "rd_pago") {
      const nuevoCreditoRD = Math.max(0, creditoRD - total);
      await supabase.from("usuarios").update({ credito_rd: nuevoCreditoRD }).eq("id", user.id);
      setCreditoRD(nuevoCreditoRD);
      if (nuevoCreditoRD === 0) { try { await fetch("/api/send-credito-agotado", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ clienteEmail: user.email, clienteNombre: empresa }) }); } catch (e) { console.error(e); } }
    }
    const { data: perfilTipo } = await supabase.from("usuarios").select("tipo").eq("id", user.id).single();
    if (perfilTipo?.tipo === "proveedor") window.location.href = "/dashboard/proveedor";
    else window.location.href = "/dashboard/pedidos";
  }

  // ── Resumen compacto siempre visible ─────────────────────────────────────
  const ResumenBar = () => (
    <div style={{ background: "rgba(15,23,42,0.98)", borderRadius: 16, padding: "14px 16px", border: "1px solid rgba(255,255,255,0.08)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#94a3b8", marginBottom: 6 }}>
        <span>{productos.length} artículo{productos.length !== 1 ? "s" : ""}</span>
        <span>Sub: {subtotal.toFixed(2)}€{transporte && transporte !== "Mis Medios" ? ` + ${precioTransporte.toFixed(2)}€ porte` : ""} + IVA</span>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 13, color: "#94a3b8" }}>Total</span>
        <span style={{ fontSize: 22, fontWeight: 900, color: "#22c55e" }}>{total.toFixed(2)}€</span>
      </div>
    </div>
  );

  const ModalRDPago = () => (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 99999, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ background: "#0f172a", borderRadius: 24, padding: isMobile ? 24 : 36, maxWidth: 480, width: "100%", border: "1px solid rgba(37,99,235,0.3)" }}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>💳</div>
          <h2 style={{ fontSize: 22, fontWeight: 900, marginBottom: 8 }}>¿Qué es RD Pago?</h2>
          <p style={{ color: "#94a3b8", fontSize: 14, lineHeight: 1.7 }}>Crédito exclusivo para clientes verificados. Compra ahora y paga en 15 días sin recargos.</p>
        </div>
        <button onClick={() => setMostrarModalRD(false)} style={{ width: "100%", background: "linear-gradient(135deg,#2563eb,#1d4ed8)", border: "none", color: "white", padding: "14px", borderRadius: 14, fontWeight: 900, fontSize: 15, cursor: "pointer" }}>Entendido</button>
      </div>
    </div>
  );

  // ── MÓVIL / PWA — stepper acordeón ───────────────────────────────────────
  if (isMobile) return (
    <main style={{ background: "linear-gradient(135deg,#020617,#020b2d)", color: "white", minHeight: "100vh", padding: "16px 12px 24px" }}>
      {mostrarModalRD && <ModalRDPago />}

      <h1 style={{ fontSize: 22, fontWeight: 900, marginBottom: 4 }}>Finalizar pedido</h1>
      <p style={{ color: "#94a3b8", fontSize: 13, marginBottom: 20 }}>{numProveedores > 1 ? `${numProveedores} proveedores · ` : ""}{productos.length} artículo{productos.length !== 1 ? "s" : ""}</p>

      {/* Stepper indicador */}
      <div style={{ display: "flex", alignItems: "center", marginBottom: 20, gap: 0 }}>
        {[{ n: 1, label: "Entrega" }, { n: 2, label: "Transporte" }, { n: 3, label: "Pago" }].map(({ n, label }, i) => (
          <React.Fragment key={n}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, flex: 1 }}>
              <div style={{ width: 28, height: 28, borderRadius: "50%", background: paso > n ? "rgba(22,163,74,0.2)" : paso === n ? "rgba(37,99,235,0.2)" : "rgba(255,255,255,0.05)", border: paso > n ? "1px solid rgba(22,163,74,0.5)" : paso === n ? "1px solid rgba(37,99,235,0.5)" : "1px solid rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: paso > n ? "#4ade80" : paso === n ? "#60a5fa" : "#475569" }}>{paso > n ? "✓" : n}</span>
              </div>
              <span style={{ fontSize: 10, color: paso === n ? "#60a5fa" : paso > n ? "#4ade80" : "#475569", fontWeight: 700 }}>{label}</span>
            </div>
            {i < 2 && <div style={{ flex: 1, height: 1, background: paso > n + 1 ? "rgba(22,163,74,0.4)" : "rgba(255,255,255,0.08)", marginBottom: 14 }} />}
          </React.Fragment>
        ))}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>

        {/* PASO 1: Datos de entrega */}
        <Paso numero={1} titulo="Datos de entrega" icono="📍" activo={paso === 1} completado={paso > 1}
          resumen={
            <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 10, padding: "10px 12px" }}>
              <p style={{ margin: 0, fontWeight: 800, fontSize: 13 }}>{empresa}</p>
              <p style={{ margin: "2px 0 0", fontSize: 12, color: "#94a3b8" }}>{direccion}{ciudad ? `, ${ciudad}` : ""}</p>
            </div>
          }
          onContinuar={() => setPaso(2)} labelContinuar="Continuar al transporte →"
        >
          {!editandoDatos ? (
            <div>
              <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 12, padding: "12px 14px", marginBottom: 10 }}>
                <p style={{ margin: 0, fontWeight: 800, fontSize: 14 }}>{empresa || "Sin empresa"}</p>
                {cif && <p style={{ margin: "4px 0 0", fontSize: 12, color: "#94a3b8" }}>CIF: {cif}</p>}
                {direccion && <p style={{ margin: "4px 0 0", fontSize: 12, color: "#94a3b8" }}>{direccion}{ciudad ? `, ${ciudad}` : ""}</p>}
                {telefono && <p style={{ margin: "4px 0 0", fontSize: 12, color: "#94a3b8" }}>{telefono}</p>}
              </div>
              <button onClick={() => { setEmpresaEdit(empresa); setTelefonoEdit(telefono); setDireccionEdit(direccion); setCiudadEdit(ciudad); setCifEdit(cif); setEditandoDatos(true); }} style={{ background: "rgba(37,99,235,0.1)", border: "1px solid rgba(37,99,235,0.2)", color: "#60a5fa", padding: "8px 14px", borderRadius: 10, cursor: "pointer", fontWeight: 700, fontSize: 12, marginBottom: 2 }}>Editar datos</button>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 2 }}>
              {[{ label: "Empresa", val: empresaEdit, set: setEmpresaEdit }, { label: "CIF", val: cifEdit, set: setCifEdit }, { label: "Dirección", val: direccionEdit, set: setDireccionEdit }, { label: "Ciudad", val: ciudadEdit, set: setCiudadEdit }, { label: "Teléfono", val: telefonoEdit, set: setTelefonoEdit }].map(({ label, val, set }) => (
                <div key={label}>
                  <p style={{ color: "#94a3b8", fontSize: 11, marginBottom: 4 }}>{label}</p>
                  <input value={val} onChange={e => set(e.target.value)} style={{ width: "100%", background: "#020617", color: "white", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "10px 12px", fontSize: 14, outline: "none", boxSizing: "border-box" as const }} />
                </div>
              ))}
              <button onClick={() => { setEmpresa(empresaEdit); setTelefono(telefonoEdit); setDireccion(direccionEdit); setCiudad(ciudadEdit); setCif(cifEdit); setEditandoDatos(false); }} style={{ background: "linear-gradient(135deg,#16a34a,#15803d)", border: "none", color: "white", padding: "11px", borderRadius: 10, fontWeight: 700, cursor: "pointer", fontSize: 13 }}>Aplicar cambios</button>
              <button onClick={() => setEditandoDatos(false)} style={{ background: "none", border: "1px solid rgba(255,255,255,0.1)", color: "#94a3b8", padding: "9px", borderRadius: 10, cursor: "pointer", fontSize: 12 }}>Cancelar</button>
            </div>
          )}
        </Paso>

        {/* PASO 2: Transporte */}
        <Paso numero={2} titulo="Transporte" icono="🚚" activo={paso === 2} completado={paso > 2}
          resumen={
            transporte ? (
              <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 10, padding: "10px 12px", display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: 13, fontWeight: 800 }}>{transporte}</span>
                <span style={{ fontSize: 13, color: "#22c55e", fontWeight: 700 }}>{transporte === "Mis Medios" ? "Gratis" : `${getPrecioTransporte().toFixed(2)}€`}</span>
              </div>
            ) : undefined
          }
          onContinuar={transporte ? () => setPaso(3) : undefined} labelContinuar="Continuar al pago →"
        >
          {!transporte && <p style={{ color: "#f59e0b", fontSize: 12, marginBottom: 10 }}>Selecciona una agencia para continuar</p>}
          <GridTransporte opciones={opciones} transporte={transporte} setTransporte={setTransporte} />
        </Paso>

        {/* PASO 3: Forma de pago */}
        <Paso numero={3} titulo="Forma de pago" icono="💳" activo={paso === 3} completado={false}
          resumen={undefined}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 2 }}>
            {rdPagoActivo && (
              <button onClick={() => setFormaPago("rd_pago")} style={{ padding: "14px", borderRadius: 12, textAlign: "left" as const, cursor: "pointer", background: formaPago === "rd_pago" ? "rgba(37,99,235,0.15)" : "rgba(255,255,255,0.04)", border: formaPago === "rd_pago" ? "2px solid rgba(37,99,235,0.5)" : "1px solid rgba(255,255,255,0.08)" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <p style={{ fontWeight: 800, color: formaPago === "rd_pago" ? "#60a5fa" : "white", margin: 0, fontSize: 14 }}>RD Pago — 15 días</p>
                  <span style={{ color: "#4ade80", fontWeight: 900 }}>{creditoRD.toFixed(2)}€</span>
                </div>
                <p style={{ color: "#94a3b8", fontSize: 12, margin: "4px 0 0" }}>Crédito disponible</p>
              </button>
            )}
            {!rdPagoActivo && (
              <div style={{ padding: "12px 14px", borderRadius: 12, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div><p style={{ fontWeight: 800, color: "#64748b", margin: 0, fontSize: 13 }}>RD Pago — 15 días</p><p style={{ color: "#475569", fontSize: 11, margin: "2px 0 0" }}>No disponible</p></div>
                <button onClick={() => setMostrarModalRD(true)} style={{ background: "rgba(37,99,235,0.1)", border: "1px solid rgba(37,99,235,0.2)", color: "#60a5fa", padding: "5px 10px", borderRadius: 8, cursor: "pointer", fontSize: 11, fontWeight: 700 }}>¿Qué es?</button>
              </div>
            )}
            <button onClick={() => setFormaPago("tarjeta")} style={{ padding: "14px", borderRadius: 12, textAlign: "left" as const, cursor: "pointer", background: formaPago === "tarjeta" ? "rgba(139,92,246,0.15)" : "rgba(255,255,255,0.04)", border: formaPago === "tarjeta" ? "2px solid rgba(139,92,246,0.5)" : "1px solid rgba(255,255,255,0.08)" }}>
              <p style={{ fontWeight: 800, color: formaPago === "tarjeta" ? "#a78bfa" : "white", margin: 0, fontSize: 14 }}>Tarjeta bancaria</p>
              <p style={{ color: "#94a3b8", fontSize: 12, margin: "4px 0 0" }}>Pago seguro con Stripe</p>
            </button>
          </div>
        </Paso>

        {/* Artículos colapsables */}
        <div style={{ background: "rgba(15,23,42,0.95)", borderRadius: 16, border: "1px solid rgba(255,255,255,0.06)", overflow: "hidden" }}>
          <details>
            <summary style={{ padding: "14px 16px", cursor: "pointer", fontWeight: 800, fontSize: 14, listStyle: "none", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span>🛒 Artículos ({productos.length})</span>
              <span style={{ fontSize: 12, color: "#94a3b8" }}>Ver ▾</span>
            </summary>
            <div style={{ padding: "0 16px 16px" }}>
              {Array.from(grupos).map(([provId, grupo]) => (
                <div key={provId}>
                  {Array.from(grupos).length > 1 && <p style={{ color: "#60a5fa", fontSize: 11, fontWeight: 700, margin: "8px 0" }}>🏭 {grupo.nombre}</p>}
                  {grupo.productos.map(p => (
                    <div key={p.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: 12, borderBottom: "1px solid rgba(255,255,255,0.05)", marginBottom: 12 }}>
                      <div style={{ flex: 1, minWidth: 0, marginRight: 8 }}>
                        <p style={{ fontWeight: 800, fontSize: 13, marginBottom: 2 }}>{p.referencia}</p>
                        <p style={{ color: "#94a3b8", fontSize: 11 }}>{(p.descripcion || "").substring(0, 30)}</p>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 6 }}>
                          <button onClick={() => setCantidades(prev => ({ ...prev, [p.referencia]: Math.max(1, (prev[p.referencia] || 1) - 1) }))} style={{ width: 26, height: 26, borderRadius: 6, background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)", color: "white", cursor: "pointer", fontSize: 14 }}>-</button>
                          <span style={{ fontWeight: 700, fontSize: 13, minWidth: 18, textAlign: "center" }}>{cantidades[p.referencia] || 1}</span>
                          <button onClick={() => { const max = Number(p.stock || 99); const actual = cantidades[p.referencia] || 1; if (actual >= max) { alert("Stock máximo: " + max); return; } setCantidades(prev => ({ ...prev, [p.referencia]: actual + 1 })); }} style={{ width: 26, height: 26, borderRadius: 6, background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)", color: "white", cursor: "pointer", fontSize: 14 }}>+</button>
                        </div>
                      </div>
                      <div style={{ textAlign: "right", flexShrink: 0 }}>
                        <p style={{ fontWeight: 900, fontSize: 15 }}>{((Number(p.precio) + Number(p.impuesto || 0)) * (cantidades[p.referencia] || 1)).toFixed(2)}€</p>
                        <button onClick={() => eliminarArticulo(p)} style={{ background: "rgba(239,68,68,0.1)", border: "none", color: "#f87171", padding: "3px 7px", borderRadius: 6, cursor: "pointer", fontSize: 11, marginTop: 4 }}>✕</button>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </details>
        </div>

        {/* Resumen */}
        <ResumenBar />

        {/* Botón confirmar */}
        <button onClick={finalizarCompra} disabled={!puedeConfirmar} style={{ width: "100%", background: puedeConfirmar ? "linear-gradient(135deg,#16a34a,#15803d)" : "rgba(255,255,255,0.08)", border: "none", color: puedeConfirmar ? "white" : "#64748b", padding: "16px", borderRadius: 14, fontWeight: 900, fontSize: 16, cursor: puedeConfirmar ? "pointer" : "not-allowed", marginTop: 4 }}>
          {cargando ? "PROCESANDO..." : paso < 3 ? `Completar paso ${paso} primero` : !transporte ? "Elige transporte" : numProveedores > 1 ? `CONFIRMAR ${numProveedores} PEDIDOS` : "CONFIRMAR PEDIDO"}
        </button>

      </div>
      {mostrarStripe && <StripeCheckout total={total} metadata={{ empresa, clienteEmail }} onSuccess={async () => { setMostrarStripe(false); await procesarPedido(); }} onCancel={() => setMostrarStripe(false)} />}
    </main>
  );

  /* ── DESKTOP ── */
  return (
    <main style={{ minHeight: "100vh", display: "grid", gridTemplateColumns: "1fr 400px", gap: 32, padding: 40, background: "linear-gradient(135deg,#020617,#020b2d)", color: "white", alignItems: "start" }}>
      {mostrarModalRD && <ModalRDPago />}

      <section>
        <h1 style={{ fontSize: 56, fontWeight: 900, lineHeight: 1, marginBottom: 32 }}>FINALIZAR PEDIDO</h1>

        {/* Stepper desktop */}
        <div style={{ display: "flex", alignItems: "center", marginBottom: 32, gap: 0 }}>
          {[{ n: 1, label: "Datos de entrega" }, { n: 2, label: "Transporte" }, { n: 3, label: "Forma de pago" }].map(({ n, label }, i) => (
            <React.Fragment key={n}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1 }}>
                <div style={{ width: 32, height: 32, borderRadius: "50%", background: paso > n ? "rgba(22,163,74,0.2)" : paso === n ? "rgba(37,99,235,0.2)" : "rgba(255,255,255,0.05)", border: paso > n ? "1px solid rgba(22,163,74,0.5)" : paso === n ? "1px solid rgba(37,99,235,0.5)" : "1px solid rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: paso > n ? "#4ade80" : paso === n ? "#60a5fa" : "#475569" }}>{paso > n ? "✓" : n}</span>
                </div>
                <span style={{ fontSize: 14, fontWeight: paso === n ? 800 : 500, color: paso === n ? "white" : paso > n ? "#4ade80" : "#94a3b8" }}>{label}</span>
              </div>
              {i < 2 && <div style={{ flex: 1, height: 1, background: paso > n + 1 ? "rgba(22,163,74,0.4)" : "rgba(255,255,255,0.08)", margin: "0 16px 0 0" }} />}
            </React.Fragment>
          ))}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          {/* PASO 1 desktop */}
          <Paso numero={1} titulo="Datos de entrega" icono="📍" activo={paso === 1} completado={paso > 1}
            resumen={
              <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 12, padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <p style={{ margin: 0, fontWeight: 800, fontSize: 14 }}>{empresa}</p>
                  <p style={{ margin: "4px 0 0", fontSize: 13, color: "#94a3b8" }}>{direccion}{ciudad ? `, ${ciudad}` : ""} · {cif}</p>
                </div>
                <button onClick={() => setPaso(1)} style={{ background: "none", border: "1px solid rgba(255,255,255,0.1)", color: "#60a5fa", padding: "6px 14px", borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 700 }}>Editar</button>
              </div>
            }
            onContinuar={() => setPaso(2)} labelContinuar="Continuar al transporte →"
          >
            {!editandoDatos ? (
              <div>
                <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 14, padding: "16px 18px", marginBottom: 14 }}>
                  <p style={{ margin: 0, fontWeight: 900, fontSize: 18 }}>{empresa || "Sin empresa"}</p>
                  {cif && <p style={{ margin: "6px 0 0", fontSize: 14, color: "#cbd5e1" }}>CIF: {cif}</p>}
                  {direccion && <p style={{ margin: "6px 0 0", fontSize: 14, color: "#cbd5e1" }}>{direccion}{ciudad ? `, ${ciudad}` : ""}</p>}
                  {telefono && <p style={{ margin: "6px 0 0", fontSize: 14, color: "#cbd5e1" }}>{telefono}</p>}
                  {clienteEmail && <p style={{ margin: "6px 0 0", fontSize: 14, color: "#cbd5e1" }}>{clienteEmail}</p>}
                </div>
                <button onClick={() => { setEmpresaEdit(empresa); setTelefonoEdit(telefono); setDireccionEdit(direccion); setCiudadEdit(ciudad); setCifEdit(cif); setEditandoDatos(true); }} style={{ background: "rgba(37,99,235,0.1)", border: "1px solid rgba(37,99,235,0.2)", color: "#60a5fa", padding: "8px 16px", borderRadius: 10, cursor: "pointer", fontWeight: 700, fontSize: 13 }}>Editar datos de entrega</button>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 2 }}>
                {[{ label: "Empresa", val: empresaEdit, set: setEmpresaEdit }, { label: "CIF/NIF", val: cifEdit, set: setCifEdit }].map(({ label, val, set }) => (
                  <div key={label}><p style={{ color: "#94a3b8", fontSize: 12, marginBottom: 6 }}>{label}</p><input value={val} onChange={e => set(e.target.value)} style={{ width: "100%", background: "#020617", color: "white", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "10px 14px", fontSize: 14, outline: "none", boxSizing: "border-box" as const }} /></div>
                ))}
                <div style={{ gridColumn: "1/-1" }}><p style={{ color: "#94a3b8", fontSize: 12, marginBottom: 6 }}>Dirección</p><input value={direccionEdit} onChange={e => setDireccionEdit(e.target.value)} style={{ width: "100%", background: "#020617", color: "white", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "10px 14px", fontSize: 14, outline: "none", boxSizing: "border-box" as const }} /></div>
                {[{ label: "Ciudad", val: ciudadEdit, set: setCiudadEdit }, { label: "Teléfono", val: telefonoEdit, set: setTelefonoEdit }].map(({ label, val, set }) => (
                  <div key={label}><p style={{ color: "#94a3b8", fontSize: 12, marginBottom: 6 }}>{label}</p><input value={val} onChange={e => set(e.target.value)} style={{ width: "100%", background: "#020617", color: "white", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "10px 14px", fontSize: 14, outline: "none", boxSizing: "border-box" as const }} /></div>
                ))}
                <div style={{ gridColumn: "1/-1", display: "flex", gap: 10 }}>
                  <button onClick={() => { setEmpresa(empresaEdit); setTelefono(telefonoEdit); setDireccion(direccionEdit); setCiudad(ciudadEdit); setCif(cifEdit); setEditandoDatos(false); }} style={{ background: "linear-gradient(135deg,#16a34a,#15803d)", border: "none", color: "white", padding: "12px 20px", borderRadius: 10, fontWeight: 700, cursor: "pointer", fontSize: 14 }}>Aplicar</button>
                  <button onClick={() => setEditandoDatos(false)} style={{ background: "none", border: "1px solid rgba(255,255,255,0.1)", color: "#94a3b8", padding: "12px 20px", borderRadius: 10, cursor: "pointer", fontSize: 13 }}>Cancelar</button>
                </div>
              </div>
            )}
          </Paso>

          {/* PASO 2 desktop */}
          <Paso numero={2} titulo="Transporte" icono="🚚" activo={paso === 2} completado={paso > 2}
            resumen={
              transporte ? (
                <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 12, padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 14, fontWeight: 800 }}>{transporte}</span>
                  <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                    <span style={{ fontSize: 14, color: "#22c55e", fontWeight: 700 }}>{transporte === "Mis Medios" ? "Gratis" : `${getPrecioTransporte().toFixed(2)}€`}</span>
                    <button onClick={() => setPaso(2)} style={{ background: "none", border: "1px solid rgba(255,255,255,0.1)", color: "#60a5fa", padding: "6px 14px", borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 700 }}>Cambiar</button>
                  </div>
                </div>
              ) : undefined
            }
            onContinuar={transporte ? () => setPaso(3) : undefined} labelContinuar="Continuar al pago →"
          >
            {!transporte && <p style={{ color: "#f59e0b", fontSize: 13, marginBottom: 14 }}>⚠️ Selecciona una agencia para continuar</p>}
            <GridTransporte opciones={opciones} transporte={transporte} setTransporte={setTransporte} />
          </Paso>

          {/* PASO 3 desktop */}
          <Paso numero={3} titulo="Forma de pago" icono="💳" activo={paso === 3} completado={false}>
            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 2 }}>
              {rdPagoActivo && (
                <button onClick={() => setFormaPago("rd_pago")} style={{ padding: "16px 18px", borderRadius: 14, textAlign: "left" as const, cursor: "pointer", background: formaPago === "rd_pago" ? "rgba(37,99,235,0.15)" : "rgba(255,255,255,0.04)", border: formaPago === "rd_pago" ? "2px solid rgba(37,99,235,0.5)" : "1px solid rgba(255,255,255,0.08)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <p style={{ fontWeight: 800, color: formaPago === "rd_pago" ? "#60a5fa" : "white", margin: 0 }}>RD Pago — 15 días</p>
                    <span style={{ color: "#4ade80", fontWeight: 900, fontSize: 16 }}>{creditoRD.toFixed(2)}€</span>
                  </div>
                  <p style={{ color: "#94a3b8", fontSize: 13, margin: "4px 0 0" }}>Crédito disponible — sin recargos</p>
                </button>
              )}
              {!rdPagoActivo && (
                <div style={{ padding: "14px 18px", borderRadius: 14, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", display: "flex", justifyContent: "space-between", alignItems: "center", opacity: 0.7 }}>
                  <div><p style={{ fontWeight: 800, color: "#64748b", margin: 0 }}>RD Pago — 15 días</p><p style={{ color: "#475569", fontSize: 12, margin: "4px 0 0" }}>Crédito no disponible</p></div>
                  <button onClick={() => setMostrarModalRD(true)} style={{ background: "rgba(37,99,235,0.1)", border: "1px solid rgba(37,99,235,0.2)", color: "#60a5fa", padding: "7px 14px", borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 700 }}>¿Qué es?</button>
                </div>
              )}
              <button onClick={() => setFormaPago("tarjeta")} style={{ padding: "16px 18px", borderRadius: 14, textAlign: "left" as const, cursor: "pointer", background: formaPago === "tarjeta" ? "rgba(139,92,246,0.15)" : "rgba(255,255,255,0.04)", border: formaPago === "tarjeta" ? "2px solid rgba(139,92,246,0.5)" : "1px solid rgba(255,255,255,0.08)" }}>
                <p style={{ fontWeight: 800, color: formaPago === "tarjeta" ? "#a78bfa" : "white", margin: 0 }}>Tarjeta bancaria</p>
                <p style={{ color: "#94a3b8", fontSize: 13, margin: "4px 0 0" }}>Pago seguro con Stripe</p>
              </button>
            </div>
            <button onClick={finalizarCompra} disabled={!puedeConfirmar} style={{ width: "100%", marginTop: 16, background: puedeConfirmar ? "linear-gradient(135deg,#16a34a,#15803d)" : "rgba(255,255,255,0.08)", border: "none", padding: 18, borderRadius: 16, color: puedeConfirmar ? "white" : "#64748b", fontWeight: 900, fontSize: 17, opacity: puedeConfirmar ? 1 : 0.5, cursor: puedeConfirmar ? "pointer" : "not-allowed", boxShadow: puedeConfirmar ? "0 8px 24px rgba(22,163,74,0.3)" : "none" }}>
              {cargando ? "PROCESANDO..." : !transporte ? "Elige transporte primero" : numProveedores > 1 ? `CONFIRMAR ${numProveedores} PEDIDOS` : "CONFIRMAR PEDIDO"}
            </button>
            <p style={{ color: "#94a3b8", fontSize: 12, textAlign: "center", marginTop: 10 }}>El proveedor recibirá su albarán automáticamente</p>
          </Paso>
        </div>
      </section>

      {/* ASIDE DERECHO desktop */}
      <aside style={{ position: "sticky", top: 40 }}>
        <div style={{ background: "rgba(15,23,42,0.95)", borderRadius: 28, padding: 28, border: "1px solid rgba(255,255,255,0.06)" }}>
          <h2 style={{ fontSize: 24, fontWeight: 900, marginBottom: 20 }}>RESUMEN</h2>
          {productos.length === 0 ? (
            <p style={{ color: "#94a3b8", textAlign: "center", padding: "20px 0" }}>Tu cesta está vacía</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 20 }}>
              {Array.from(grupos).map(([provId, grupo], gi) => (
                <div key={provId}>
                  {Array.from(grupos).length > 1 && (
                    <p style={{ color: "#60a5fa", fontSize: 11, fontWeight: 700, marginBottom: 8, marginTop: gi > 0 ? 12 : 0 }}>🏭 {grupo.nombre}</p>
                  )}
                  {grupo.productos.map(p => (
                    <div key={p.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: 12, borderBottom: "1px solid rgba(255,255,255,0.05)", marginBottom: 12 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontWeight: 800, fontSize: 14, marginBottom: 2 }}>{p.descripcion || p.referencia}</p>
                        <p style={{ color: "#94a3b8", fontSize: 12, marginBottom: 6 }}>{p.referencia}</p>
                        {p.impuesto && Number(p.impuesto) > 0 && <p style={{ color: "#fbbf24", fontSize: 11, fontWeight: 700, marginBottom: 6 }}>+ {Number(p.impuesto).toFixed(2)}€ ecotasa</p>}
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <button onClick={() => setCantidades(prev => ({ ...prev, [p.referencia]: Math.max(1, (prev[p.referencia] || 1) - 1) }))} style={{ width: 26, height: 26, borderRadius: 6, background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)", color: "white", cursor: "pointer", fontSize: 14 }}>-</button>
                          <span style={{ fontWeight: 700, fontSize: 13, minWidth: 18, textAlign: "center" }}>{cantidades[p.referencia] || 1}</span>
                          <button onClick={() => { const max = Number(p.stock || 99); const actual = cantidades[p.referencia] || 1; if (actual >= max) { alert("Stock máximo: " + max); return; } setCantidades(prev => ({ ...prev, [p.referencia]: actual + 1 })); }} style={{ width: 26, height: 26, borderRadius: 6, background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)", color: "white", cursor: "pointer", fontSize: 14 }}>+</button>
                        </div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
                        <strong style={{ fontSize: 14 }}>{((Number(p.precio) + Number(p.impuesto || 0)) * (cantidades[p.referencia] || 1)).toFixed(2)}€</strong>
                        <button onClick={() => eliminarArticulo(p)} style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171", width: 30, height: 30, borderRadius: 8, cursor: "pointer", fontSize: 14 }}>✕</button>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
              {numProveedores > 1 && (
                <div style={{ background: "rgba(37,99,235,0.08)", border: "1px solid rgba(37,99,235,0.2)", borderRadius: 10, padding: "8px 12px" }}>
                  <p style={{ color: "#60a5fa", fontSize: 12, fontWeight: 700, margin: 0 }}>Se crearán {numProveedores} pedidos separados</p>
                </div>
              )}
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20, paddingTop: 16, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#94a3b8" }}><span>Subtotal</span><span>{subtotal.toFixed(2)}€</span></div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#94a3b8" }}><span>Transporte</span><span>{!transporte ? "Pendiente" : transporte === "Mis Medios" ? "Sin coste" : `${precioTransporte.toFixed(2)}€`}</span></div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#94a3b8" }}><span>IVA (21%)</span><span>{iva.toFixed(2)}€</span></div>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 15, fontWeight: 700 }}>TOTAL</span>
            <span style={{ fontSize: 36, fontWeight: 900, color: "#22c55e" }}>{total.toFixed(2)}€</span>
          </div>
          <p style={{ color: "#94a3b8", fontSize: 11, textAlign: "center", marginTop: 12 }}>Completa los 3 pasos para confirmar el pedido</p>
        </div>
      </aside>

      {mostrarStripe && <StripeCheckout total={total} metadata={{ empresa, clienteEmail }} onSuccess={async () => { setMostrarStripe(false); await procesarPedido(); }} onCancel={() => setMostrarStripe(false)} />}
    </main>
  );
}