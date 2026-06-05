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

export default function CheckoutPage() {
  const [empresa, setEmpresa] = useState("");
  const [telefono, setTelefono] = useState("");
  const [direccion, setDireccion] = useState("");
  const [ciudad, setCiudad] = useState("");
  const [cif, setCif] = useState("");
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
  const [empresaEdit, setEmpresaEdit] = useState("");
  const [telefonoEdit, setTelefonoEdit] = useState("");
  const [direccionEdit, setDireccionEdit] = useState("");
  const [ciudadEdit, setCiudadEdit] = useState("");
  const [cifEdit, setCifEdit] = useState("");
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => { cargarDatos(); }, []);

  async function cargarDatos() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setUserId(user.id);
    setClienteEmail(user.email || "");
    const { data: perfil } = await supabase.from("usuarios").select("*").eq("id", user.id).single();
    if (perfil) {
      setEmpresa(perfil.nombre_empresa || ""); setTelefono(perfil.telefono || ""); setDireccion(perfil.direccion || ""); setCiudad(perfil.ciudad || ""); setCif(perfil.cif || ""); setCreditoRD(Number(perfil.credito_rd) || 0);
      setEmpresaEdit(perfil.nombre_empresa || ""); setTelefonoEdit(perfil.telefono || ""); setDireccionEdit(perfil.direccion || ""); setCiudadEdit(perfil.ciudad || ""); setCifEdit(perfil.cif || "");
    }
    const { data: cesta } = await supabase.from("cesta").select("*").eq("user_id", user.id).order("id", { ascending: true });
    if (cesta) {
      const vistos = new Set<string>();
      const sinDuplicados = cesta.filter((item: Producto) => { if (vistos.has(item.referencia)) return false; vistos.add(item.referencia); return true; });
      setProductos(sinDuplicados);
      const initCantidades: Record<string, number> = {};
      sinDuplicados.forEach((p: Producto) => { initCantidades[p.referencia] = 1; });
      setCantidades(initCantidades);
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
    if (transporte === "GLS") return 6.50;
    if (transporte === "Correos Express") return 5.00;
    return 0;
  }

  const subtotal = productos.reduce((acc, item) => acc + (Number(item.precio) + Number(item.impuesto || 0)) * (cantidades[item.referencia] || 1), 0);
  const precioTransporte = getPrecioTransporte();
  const iva = subtotal * 0.21;
  const total = subtotal + precioTransporte + iva;
  const puedeConfirmar = productos.length > 0 && transporte !== null && !cargando;

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

  async function generarYGuardarPDFs(pedidoId: number, codigo: string, proveedorNombre: string, proveedorEmail: string, proveedorCif: string, proveedorTelefono: string, proveedorDireccion: string, productosGrupo: Producto[], subtotalGrupo: number, ivaGrupo: number, totalGrupo: number, fecha: string) {
    try {
      const gastosGestion = formaPago === "tarjeta" ? calcularRecargo(totalGrupo).recargo : 0;
      const props = { codigo, fecha, proveedorNombre, proveedorEmail, proveedorCif, proveedorTelefono, proveedorDireccion, cliente: empresa, clienteEmail, telefono, cif, direccion: direccion + (ciudad ? ", " + ciudad : ""), agencia: transporte || "", formaPago, productos: productosGrupo, subtotal: subtotalGrupo, iva: ivaGrupo, total: totalGrupo, gastosGestion };
      const albaranBlob = await pdf(React.createElement(AlbaranPDF, props) as any).toBlob();
      const etiquetaBlob = await pdf(React.createElement(EtiquetaEnvioPDF, props) as any).toBlob();
      const albaranPath = `documentos/${codigo}/albaran-${codigo}.pdf`;
      const etiquetaPath = `documentos/${codigo}/etiqueta-envio-${codigo}.pdf`;
      await supabase.storage.from("FACTURAS").upload(albaranPath, albaranBlob, { contentType: "application/pdf", upsert: true });
      await supabase.storage.from("FACTURAS").upload(etiquetaPath, etiquetaBlob, { contentType: "application/pdf", upsert: true });
      const { data: albaranUrl } = supabase.storage.from("FACTURAS").getPublicUrl(albaranPath);
      const { data: etiquetaUrl } = supabase.storage.from("FACTURAS").getPublicUrl(etiquetaPath);
      await supabase.from("pedidos").update({ albaran_url: albaranUrl.publicUrl, etiqueta_envio_url: etiquetaUrl.publicUrl }).eq("id", pedidoId);
      return { albaran_url: albaranUrl.publicUrl, etiqueta_envio_url: etiquetaUrl.publicUrl };
    } catch (e) { console.error("Error generando PDFs:", e); return null; }
  }

  async function finalizarCompra() {
    if (!puedeConfirmar) return;
    if (formaPago === "tarjeta") { setMostrarStripe(true); return; }
    if (formaPago === "rd_pago" && creditoRD < total) { alert("Saldo RD Pago insuficiente. Disponible: " + creditoRD.toFixed(2) + " EUR — Pedido: " + total.toFixed(2) + " EUR"); return; }
    setCargando(true);
    await procesarPedido();
  }

  async function procesarPedido() {
    setCargando(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { alert("Debes iniciar sesion"); setCargando(false); return; }
    const fecha = new Date().toISOString();
    const direccionCompleta = direccion + (ciudad ? ", " + ciudad : "");
    const grupos = getGruposPorProveedor();
    const pedidosCreados: string[] = [];
    let primerPedido = true;
    for (const [provId, grupo] of grupos) {
      const subtotalGrupo = grupo.productos.reduce((acc, p) => acc + (Number(p.precio) + Number(p.impuesto || 0)) * (cantidades[p.referencia] || 1), 0);
      const transporteGrupo = primerPedido ? precioTransporte : 0;
      const ivaGrupo = subtotalGrupo * 0.21;
      const totalGrupo = subtotalGrupo + transporteGrupo + ivaGrupo;
      const totalSinPorte = subtotalGrupo + ivaGrupo;
      const codigo = "RD-" + Math.floor(Math.random() * 9000000 + 1000000);
      let emailProveedor = "", nombreProveedor = grupo.nombre, proveedorCif = "", proveedorTelefono = "", proveedorDireccion = "";
      if (provId !== "sin_proveedor") {
        const { data: prov } = await supabase.from("usuarios").select("email, nombre_empresa, cif, telefono, direccion, ciudad").eq("id", provId).single();
        emailProveedor = prov?.email || ""; nombreProveedor = prov?.nombre_empresa || grupo.nombre; proveedorCif = prov?.cif || ""; proveedorTelefono = prov?.telefono || ""; proveedorDireccion = [prov?.direccion, prov?.ciudad].filter(Boolean).join(", ");
      }
      const pedido = { cliente_id: user.id, cliente_email: user.email, cliente_nombre: empresa, cliente_telefono: telefono, direccion: direccionCompleta, subtotal: subtotalGrupo, total: totalGrupo, coste_transporte: transporteGrupo, estado: "pendiente", estado_pago: formaPago === "tarjeta" ? "pagado" : "pendiente", estado_envio: "pendiente", codigo, transporte, agencia: transporte, forma_pago: formaPago, metodo_pago: "pagofacil", productos: grupo.productos };
      const { data: pedidoInsertado, error } = await supabase.from("pedidos").insert(pedido).select("id").single();
      if (error) { console.error("Error creando pedido:", error); continue; }
      pedidosCreados.push(codigo);
      primerPedido = false;
      if (pedidoInsertado?.id) await generarYGuardarPDFs(pedidoInsertado.id, codigo, nombreProveedor, emailProveedor, proveedorCif, proveedorTelefono, proveedorDireccion, grupo.productos, subtotalGrupo, ivaGrupo, totalSinPorte, fecha);
      if (emailProveedor) {
        try { await fetch("/api/enviar-email", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ proveedorEmail: emailProveedor, proveedorNombre: nombreProveedor, productos: grupo.productos, cliente: empresa, clienteEmail: user.email, telefono, cif, direccion: direccionCompleta, agencia: transporte, formaPago, subtotal: subtotalGrupo, iva: ivaGrupo, total: totalGrupo, codigo, fecha, pedidoId: pedidoInsertado?.id }) }); } catch (e) { console.error("Error email:", e); }
      }
    }
    await supabase.from("cesta").delete().eq("user_id", user.id);
    for (const [, grupo] of grupos) {
      for (const prod of grupo.productos) {
        if (prod.proveedor_id && prod.referencia) {
          const cant = cantidades[prod.referencia] || 1;
          const { data: pieza } = await supabase.from("piezas_publicadas").select("id, stock").eq("proveedor_id", prod.proveedor_id).eq("referencia", prod.referencia).single();
          if (pieza) await supabase.from("piezas_publicadas").update({ stock: Math.max(0, (pieza.stock || 0) - cant) }).eq("id", pieza.id);
        }
      }
    }
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

  const opciones = [
    { key: "MRW", color: "#E30613", label: "MRW 24H", precio: "7.95€" },
    { key: "GLS", color: "#F5A800", label: "GLS", precio: "6.50€" },
    { key: "Correos Express", color: "#FFCC00", textColor: "#333", label: "Correos Express", precio: "5.00€" },
    { key: "Mis Medios", color: "rgba(139,92,246,0.5)", label: "Mis Medios", precio: "Gratis" },
  ];

  /* ── MÓVIL ── */
  if (isMobile) return (
    <main style={{ background: "linear-gradient(135deg,#020617,#020b2d)", color: "white", minHeight: "100vh", padding: "16px 12px 100px" }}>
      <h1 style={{ fontSize: 26, fontWeight: 900, marginBottom: 4 }}>FINALIZAR PEDIDO</h1>
      <p style={{ color: "#94a3b8", fontSize: 13, marginBottom: 20 }}>Revisa y confirma tu pedido</p>

      {/* ARTÍCULOS */}
      <div style={{ background: "rgba(15,23,42,0.95)", borderRadius: 16, padding: 16, marginBottom: 16, border: "1px solid rgba(255,255,255,0.06)" }}>
        <h2 style={{ fontSize: 16, fontWeight: 900, marginBottom: 14 }}>🛒 Artículos</h2>
        {productos.length === 0 ? (
          <p style={{ color: "#94a3b8", textAlign: "center", padding: "20px 0" }}>Cesta vacía</p>
        ) : (
          <div style={{ display: "grid", gap: 12 }}>
            {Array.from(grupos).map(([provId, grupo], gi) => (
              <div key={provId}>
                {Array.from(grupos).length > 1 && <p style={{ color: "#60a5fa", fontSize: 11, fontWeight: 700, marginBottom: 8 }}>🏭 {grupo.nombre}</p>}
                {grupo.productos.map(p => (
                  <div key={p.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: 12, borderBottom: "1px solid rgba(255,255,255,0.05)", marginBottom: 12 }}>
                    <div style={{ flex: 1, minWidth: 0, marginRight: 8 }}>
                      <p style={{ fontWeight: 800, fontSize: 14, marginBottom: 2 }}>{p.referencia}</p>
                      <p style={{ color: "#94a3b8", fontSize: 12 }}>{(p.descripcion || "").substring(0, 30)}</p>
                      {/* Cantidad */}
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6 }}>
                        <button onClick={() => setCantidades(prev => ({ ...prev, [p.referencia]: Math.max(1, (prev[p.referencia] || 1) - 1) }))} style={{ width: 28, height: 28, borderRadius: 6, background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)", color: "white", cursor: "pointer", fontSize: 16 }}>-</button>
                        <span style={{ fontWeight: 700, fontSize: 15, minWidth: 20, textAlign: "center" }}>{cantidades[p.referencia] || 1}</span>
                        <button onClick={() => { const max = Number(p.stock || 99); const actual = cantidades[p.referencia] || 1; if (actual >= max) { alert("Stock máximo: " + max); return; } setCantidades(prev => ({ ...prev, [p.referencia]: actual + 1 })); }} style={{ width: 28, height: 28, borderRadius: 6, background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)", color: "white", cursor: "pointer", fontSize: 16 }}>+</button>
                        <span style={{ color: "#94a3b8", fontSize: 11 }}>uds</span>
                      </div>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <p style={{ fontWeight: 900, fontSize: 16 }}>{((Number(p.precio) + Number(p.impuesto || 0)) * (cantidades[p.referencia] || 1)).toFixed(2)}€</p>
                      <button onClick={() => eliminarArticulo(p)} style={{ background: "rgba(239,68,68,0.1)", border: "none", color: "#f87171", padding: "4px 8px", borderRadius: 6, cursor: "pointer", fontSize: 12, marginTop: 4 }}>✕</button>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* TRANSPORTE */}
      <div style={{ background: "rgba(15,23,42,0.95)", borderRadius: 16, padding: 16, marginBottom: 16, border: "1px solid rgba(255,255,255,0.06)" }}>
        <h2 style={{ fontSize: 16, fontWeight: 900, marginBottom: 14 }}>🚚 Transporte</h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {opciones.map(({ key, color, textColor, label, precio }) => (
            <button key={key} onClick={() => setTransporte(key)} style={{ borderRadius: 12, padding: "14px 10px", cursor: "pointer", textAlign: "center", background: transporte === key ? "rgba(37,99,235,0.2)" : "rgba(255,255,255,0.04)", border: transporte === key ? "2px solid #2563eb" : "1px solid rgba(255,255,255,0.08)", color: "white" }}>
              <div style={{ background: color, borderRadius: 6, padding: "3px 8px", display: "inline-block", marginBottom: 6 }}>
                <span style={{ color: textColor || "white", fontWeight: 900, fontSize: 12 }}>{label}</span>
              </div>
              <p style={{ color: "#94a3b8", fontSize: 12, margin: 0 }}>{precio}</p>
            </button>
          ))}
        </div>
      </div>

      {/* FORMA DE PAGO */}
      <div style={{ background: "rgba(15,23,42,0.95)", borderRadius: 16, padding: 16, marginBottom: 16, border: "1px solid rgba(255,255,255,0.06)" }}>
        <h2 style={{ fontSize: 16, fontWeight: 900, marginBottom: 14 }}>💳 Forma de pago</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <button onClick={() => setFormaPago("rd_pago")} disabled={creditoRD <= 0} style={{ padding: "14px 16px", borderRadius: 12, textAlign: "left", cursor: creditoRD > 0 ? "pointer" : "not-allowed", background: formaPago === "rd_pago" ? "rgba(37,99,235,0.2)" : "rgba(255,255,255,0.04)", border: formaPago === "rd_pago" ? "2px solid rgba(37,99,235,0.6)" : "1px solid rgba(255,255,255,0.08)", opacity: creditoRD <= 0 ? 0.4 : 1 }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <div><p style={{ fontWeight: 800, margin: 0, color: formaPago === "rd_pago" ? "#60a5fa" : "white" }}>RD Pago</p><p style={{ color: "#94a3b8", fontSize: 12, margin: "2px 0 0" }}>Crédito plataforma</p></div>
              <span style={{ color: creditoRD > 0 ? "#4ade80" : "#f87171", fontWeight: 900, fontSize: 16 }}>{creditoRD.toFixed(2)}€</span>
            </div>
          </button>
          <button onClick={() => setFormaPago("tarjeta")} style={{ padding: "14px 16px", borderRadius: 12, textAlign: "left", cursor: "pointer", background: formaPago === "tarjeta" ? "rgba(139,92,246,0.2)" : "rgba(255,255,255,0.04)", border: formaPago === "tarjeta" ? "2px solid rgba(139,92,246,0.6)" : "1px solid rgba(255,255,255,0.08)" }}>
            <p style={{ fontWeight: 800, margin: 0, color: formaPago === "tarjeta" ? "#a78bfa" : "white" }}>Tarjeta bancaria</p>
            <p style={{ color: "#94a3b8", fontSize: 12, margin: "2px 0 0" }}>Pago seguro con tarjeta</p>
          </button>
        </div>
      </div>

      {/* DATOS ENTREGA */}
      <div style={{ background: "rgba(15,23,42,0.95)", borderRadius: 16, padding: 16, marginBottom: 16, border: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <h2 style={{ fontSize: 16, fontWeight: 900, margin: 0 }}>📍 Entrega</h2>
          <button onClick={() => { if (!editandoDatos) { setEmpresaEdit(empresa); setTelefonoEdit(telefono); setDireccionEdit(direccion); setCiudadEdit(ciudad); setCifEdit(cif); } setEditandoDatos(!editandoDatos); }} style={{ background: "rgba(37,99,235,0.15)", border: "none", color: "#60a5fa", padding: "6px 12px", borderRadius: 8, cursor: "pointer", fontWeight: 700, fontSize: 12 }}>{editandoDatos ? "Cancelar" : "Editar"}</button>
        </div>
        {editandoDatos ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[{ label: "Empresa", val: empresaEdit, set: setEmpresaEdit }, { label: "CIF", val: cifEdit, set: setCifEdit }, { label: "Dirección", val: direccionEdit, set: setDireccionEdit }, { label: "Ciudad", val: ciudadEdit, set: setCiudadEdit }, { label: "Teléfono", val: telefonoEdit, set: setTelefonoEdit }].map(({ label, val, set }) => (
              <div key={label}>
                <p style={{ color: "#94a3b8", fontSize: 12, marginBottom: 4 }}>{label}</p>
                <input value={val} onChange={e => set(e.target.value)} style={{ width: "100%", background: "#020617", color: "white", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "10px 12px", fontSize: 14, outline: "none", boxSizing: "border-box" }} />
              </div>
            ))}
            <button onClick={() => { setEmpresa(empresaEdit); setTelefono(telefonoEdit); setDireccion(direccionEdit); setCiudad(ciudadEdit); setCif(cifEdit); setEditandoDatos(false); }} style={{ background: "linear-gradient(135deg,#16a34a,#15803d)", border: "none", color: "white", padding: "12px", borderRadius: 10, fontWeight: 700, cursor: "pointer" }}>Aplicar</button>
          </div>
        ) : (
          <div style={{ fontSize: 14, lineHeight: 1.8 }}>
            {empresa && <p style={{ fontWeight: 800, margin: 0 }}>{empresa}</p>}
            {cif && <p style={{ color: "#94a3b8", margin: 0 }}>CIF: {cif}</p>}
            {direccion && <p style={{ color: "#94a3b8", margin: 0 }}>{direccion}{ciudad ? `, ${ciudad}` : ""}</p>}
            {telefono && <p style={{ color: "#94a3b8", margin: 0 }}>{telefono}</p>}
          </div>
        )}
      </div>

      {/* RESUMEN FIJO ABAJO */}
      <div style={{ position: "fixed", bottom: 64, left: 0, right: 0, background: "rgba(2,6,23,0.98)", borderTop: "1px solid rgba(255,255,255,0.08)", padding: "12px 16px", zIndex: 998 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <div style={{ fontSize: 13, color: "#94a3b8" }}>
            <span>Sub: {subtotal.toFixed(2)}€ </span>
            {transporte && transporte !== "Mis Medios" && <span>+ {precioTransporte.toFixed(2)}€ porte </span>}
            <span>+ IVA</span>
          </div>
          <div style={{ fontSize: 22, fontWeight: 900, color: "#22c55e" }}>{total.toFixed(2)}€</div>
        </div>
        <button onClick={finalizarCompra} disabled={!puedeConfirmar} style={{ width: "100%", background: puedeConfirmar ? "linear-gradient(135deg,#16a34a,#15803d)" : "rgba(255,255,255,0.08)", border: "none", color: puedeConfirmar ? "white" : "#64748b", padding: "16px", borderRadius: 14, fontWeight: 900, fontSize: 16, cursor: puedeConfirmar ? "pointer" : "not-allowed" }}>
          {cargando ? "PROCESANDO..." : !transporte ? "Elige transporte" : numProveedores > 1 ? `CONFIRMAR ${numProveedores} PEDIDOS` : "CONFIRMAR PEDIDO"}
        </button>
      </div>

      {mostrarStripe && <StripeCheckout total={total} metadata={{ empresa, clienteEmail }} onSuccess={async () => { setMostrarStripe(false); await procesarPedido(); }} onCancel={() => setMostrarStripe(false)} />}
    </main>
  );

  /* ── DESKTOP ── */
  return (
    <main style={{ minHeight: "100vh", display: "grid", gridTemplateColumns: "1.2fr 420px", gap: 40, padding: 50, background: "linear-gradient(135deg,#020617,#020b2d)", color: "white" }}>
      <section>
        <h1 style={{ fontSize: 72, fontWeight: 900, lineHeight: 1, marginBottom: 24 }}>FINALIZAR PEDIDO</h1>
        <p style={{ color: "#94a3b8", fontSize: 22, lineHeight: 1.7, marginBottom: 40 }}>Tus datos profesionales se cargan automáticamente desde tu cuenta.</p>

        {/* DATOS ENTREGA */}
        <div style={{ background: "rgba(15,23,42,0.92)", borderRadius: 30, padding: 32, border: "1px solid rgba(255,255,255,0.06)", marginBottom: 30 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 26 }}>
            <h2 style={{ fontSize: 32, fontWeight: 900, margin: 0 }}>DATOS ENTREGA</h2>
            <button onClick={() => { if (!editandoDatos) { setEmpresaEdit(empresa); setTelefonoEdit(telefono); setDireccionEdit(direccion); setCiudadEdit(ciudad); setCifEdit(cif); } setEditandoDatos(!editandoDatos); }} style={{ background: editandoDatos ? "rgba(22,163,74,0.15)" : "rgba(37,99,235,0.15)", border: "none", color: editandoDatos ? "#4ade80" : "#60a5fa", padding: "8px 18px", borderRadius: 10, cursor: "pointer", fontWeight: 700, fontSize: 14 }}>{editandoDatos ? "Cancelar" : "Editar datos"}</button>
          </div>
          {editandoDatos ? (
            <div style={{ display: "grid", gap: 16 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div><p style={{ color: "#94a3b8", fontSize: 13, marginBottom: 8 }}>Empresa</p><input value={empresaEdit} onChange={e => setEmpresaEdit(e.target.value)} style={{ width: "100%", background: "#020617", color: "white", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, padding: "12px 16px", fontSize: 15, outline: "none", boxSizing: "border-box" }} /></div>
                <div><p style={{ color: "#94a3b8", fontSize: 13, marginBottom: 8 }}>CIF / NIF</p><input value={cifEdit} onChange={e => setCifEdit(e.target.value)} style={{ width: "100%", background: "#020617", color: "white", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, padding: "12px 16px", fontSize: 15, outline: "none", boxSizing: "border-box" }} /></div>
              </div>
              <div><p style={{ color: "#94a3b8", fontSize: 13, marginBottom: 8 }}>Dirección de entrega</p><input value={direccionEdit} onChange={e => setDireccionEdit(e.target.value)} style={{ width: "100%", background: "#020617", color: "white", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, padding: "12px 16px", fontSize: 15, outline: "none", boxSizing: "border-box" }} /></div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div><p style={{ color: "#94a3b8", fontSize: 13, marginBottom: 8 }}>Ciudad</p><input value={ciudadEdit} onChange={e => setCiudadEdit(e.target.value)} style={{ width: "100%", background: "#020617", color: "white", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, padding: "12px 16px", fontSize: 15, outline: "none", boxSizing: "border-box" }} /></div>
                <div><p style={{ color: "#94a3b8", fontSize: 13, marginBottom: 8 }}>Teléfono</p><input value={telefonoEdit} onChange={e => setTelefonoEdit(e.target.value)} style={{ width: "100%", background: "#020617", color: "white", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, padding: "12px 16px", fontSize: 15, outline: "none", boxSizing: "border-box" }} /></div>
              </div>
              <button onClick={() => { setEmpresa(empresaEdit); setTelefono(telefonoEdit); setDireccion(direccionEdit); setCiudad(ciudadEdit); setCif(cifEdit); setEditandoDatos(false); }} style={{ background: "linear-gradient(135deg,#16a34a,#15803d)", border: "none", color: "white", padding: 14, borderRadius: 12, fontWeight: 700, cursor: "pointer", fontSize: 15 }}>Aplicar datos de entrega</button>
            </div>
          ) : (
            <div style={{ background: "#0f172a", borderRadius: 24, padding: 30, border: "1px solid rgba(255,255,255,0.06)" }}>
              {empresa ? (<><div style={{ fontSize: 30, fontWeight: 900, marginBottom: 18 }}>{empresa}</div>{cif && <div style={{ color: "#cbd5e1", marginBottom: 12, fontSize: 17 }}>CIF: {cif}</div>}{direccion && <div style={{ color: "#cbd5e1", marginBottom: 12, fontSize: 17 }}>{direccion}{ciudad ? ", " + ciudad : ""}</div>}{telefono && <div style={{ color: "#cbd5e1", marginBottom: 12, fontSize: 17 }}>{telefono}</div>}{clienteEmail && <div style={{ color: "#cbd5e1", fontSize: 17 }}>{clienteEmail}</div>}</>) : (<div style={{ color: "#94a3b8" }}>Completa tu perfil en <a href="/perfil" style={{ color: "#60a5fa" }}>Mi Cuenta</a></div>)}
            </div>
          )}
        </div>

        {/* TRANSPORTE */}
        <div style={{ background: "rgba(15,23,42,0.92)", borderRadius: 30, padding: 32, border: "1px solid rgba(255,255,255,0.06)", marginBottom: 30 }}>
          <h2 style={{ fontSize: 32, fontWeight: 900, marginBottom: 26 }}>TRANSPORTE</h2>
          {!transporte && <div style={{ background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.3)", color: "#fbbf24", padding: "12px 18px", borderRadius: 12, marginBottom: 20, fontSize: 14 }}>Selecciona una opción de transporte para continuar</div>}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 16 }}>
            {opciones.map(({ key, color, textColor, label, precio }) => (
              <button key={key} onClick={() => setTransporte(key)} style={{ borderRadius: 20, padding: 22, color: "white", fontWeight: 800, cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 10, background: transporte === key ? "rgba(37,99,235,0.1)" : "#0f172a", border: transporte === key ? "2px solid #2563eb" : "1px solid rgba(255,255,255,0.06)" }}>
                <div style={{ background: color, borderRadius: 8, padding: "6px 14px" }}><span style={{ color: textColor || "white", fontWeight: 900, fontSize: 16 }}>{label}</span></div>
                <div style={{ fontSize: 13, color: "#94a3b8" }}>{precio}</div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* RESUMEN DESKTOP */}
      <aside style={{ position: "sticky", top: 40, height: "fit-content" }}>
        <div style={{ background: "rgba(15,23,42,0.92)", borderRadius: 32, padding: 34, border: "1px solid rgba(255,255,255,0.06)" }}>
          <h2 style={{ fontSize: 32, fontWeight: 900, marginBottom: 26 }}>RESUMEN</h2>
          {productos.length === 0 ? (<div style={{ color: "#94a3b8", textAlign: "center", padding: "30px 0" }}>Tu cesta está vacía</div>) : (
            <div style={{ display: "grid", gap: 18, marginBottom: 30 }}>
              {Array.from(grupos).map(([provId, grupo], gi) => (
                <div key={provId}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10, marginTop: gi > 0 ? 16 : 0 }}>
                    <div style={{ height: 1, flex: 1, background: "rgba(255,255,255,0.06)" }} />
                    <span style={{ color: "#60a5fa", fontSize: 12, fontWeight: 700, background: "rgba(37,99,235,0.1)", padding: "3px 10px", borderRadius: 999 }}>{grupo.nombre}</span>
                    <div style={{ height: 1, flex: 1, background: "rgba(255,255,255,0.06)" }} />
                  </div>
                  {grupo.productos.map(p => (
                    <div key={p.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: 18, borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <h3 style={{ fontSize: 18, fontWeight: 800 }}>{p.descripcion}</h3>
                        <p style={{ color: "#94a3b8", marginTop: 6 }}>{p.referencia}</p>
                        {p.impuesto && Number(p.impuesto) > 0 && <p style={{ color: "#fbbf24", fontSize: 12, marginTop: 4, fontWeight: 700 }}>+ {Number(p.impuesto).toFixed(2)}€ ecotasa</p>}
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
                          <button onClick={() => setCantidades(prev => ({ ...prev, [p.referencia]: Math.max(1, (prev[p.referencia] || 1) - 1) }))} style={{ width: 28, height: 28, borderRadius: 6, background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)", color: "white", cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>-</button>
                          <span style={{ fontWeight: 700, fontSize: 15, minWidth: 20, textAlign: "center" }}>{cantidades[p.referencia] || 1}</span>
                          <button onClick={() => { const max = Number(p.stock || 99); const actual = cantidades[p.referencia] || 1; if (actual >= max) { alert("Stock máximo: " + max); return; } setCantidades(prev => ({ ...prev, [p.referencia]: actual + 1 })); }} style={{ width: 28, height: 28, borderRadius: 6, background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)", color: "white", cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>+</button>
                          <span style={{ color: "#94a3b8", fontSize: 12 }}>uds</span>
                        </div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
                        <strong style={{ fontSize: 16 }}>{((Number(p.precio) + Number(p.impuesto || 0)) * (cantidades[p.referencia] || 1)).toFixed(2)}€</strong>
                        <button onClick={() => eliminarArticulo(p)} style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171", width: 34, height: 34, borderRadius: 8, cursor: "pointer", fontSize: 15 }}>✕</button>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
              {numProveedores > 1 && <div style={{ background: "rgba(37,99,235,0.08)", border: "1px solid rgba(37,99,235,0.2)", borderRadius: 10, padding: "10px 14px" }}><p style={{ color: "#60a5fa", fontSize: 12, fontWeight: 700, margin: 0 }}>Se crearán {numProveedores} pedidos separados</p></div>}
            </div>
          )}
          <div style={{ display: "grid", gap: 16, marginBottom: 30 }}>
            <div style={{ display: "flex", justifyContent: "space-between", color: "#cbd5e1" }}><span>Subtotal</span><span>{subtotal.toFixed(2)}€</span></div>
            <div style={{ display: "flex", justifyContent: "space-between", color: "#cbd5e1" }}><span>Transporte</span><span>{!transporte ? "Pendiente" : transporte === "Mis Medios" ? "Sin coste" : precioTransporte.toFixed(2) + "€"}</span></div>
            <div style={{ display: "flex", justifyContent: "space-between", color: "#cbd5e1" }}><span>IVA (21%)</span><span>{iva.toFixed(2)}€</span></div>
          </div>
          <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: 24, marginBottom: 20 }}>
            <span>TOTAL</span>
            <h2 style={{ fontSize: 48, fontWeight: 900, color: "#22c55e", marginTop: 10 }}>{total.toFixed(2)}€</h2>
          </div>
          {/* FORMA DE PAGO */}
          <div style={{ marginBottom: 24 }}>
            <p style={{ fontWeight: 700, fontSize: 14, marginBottom: 12, color: "#94a3b8" }}>FORMA DE PAGO</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <button onClick={() => setFormaPago("rd_pago")} disabled={creditoRD <= 0} style={{ padding: "14px 18px", borderRadius: 12, textAlign: "left", cursor: creditoRD > 0 ? "pointer" : "not-allowed", background: formaPago === "rd_pago" ? "rgba(37,99,235,0.2)" : "rgba(255,255,255,0.04)", border: formaPago === "rd_pago" ? "2px solid rgba(37,99,235,0.6)" : "1px solid rgba(255,255,255,0.08)", opacity: creditoRD <= 0 ? 0.4 : 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}><div><p style={{ fontWeight: 800, color: formaPago === "rd_pago" ? "#60a5fa" : "white", margin: 0 }}>RD Pago</p><p style={{ color: "#94a3b8", fontSize: 12, margin: "4px 0 0" }}>Crédito disponible</p></div><span style={{ color: creditoRD > 0 ? "#4ade80" : "#f87171", fontWeight: 900, fontSize: 16 }}>{creditoRD.toFixed(2)}€</span></div>
              </button>
              <button onClick={() => setFormaPago("tarjeta")} style={{ padding: "14px 18px", borderRadius: 12, textAlign: "left", cursor: "pointer", background: formaPago === "tarjeta" ? "rgba(139,92,246,0.2)" : "rgba(255,255,255,0.04)", border: formaPago === "tarjeta" ? "2px solid rgba(139,92,246,0.6)" : "1px solid rgba(255,255,255,0.08)" }}>
                <p style={{ fontWeight: 800, color: formaPago === "tarjeta" ? "#a78bfa" : "white", margin: 0 }}>Tarjeta bancaria</p>
                <p style={{ color: "#94a3b8", fontSize: 12, margin: "4px 0 0" }}>Pago seguro con tarjeta</p>
              </button>
            </div>
          </div>
          <button onClick={finalizarCompra} disabled={!puedeConfirmar} style={{ width: "100%", background: "linear-gradient(135deg,#16a34a,#15803d)", border: "none", padding: 22, borderRadius: 20, color: "white", fontWeight: 900, fontSize: 18, boxShadow: "0 12px 30px rgba(22,163,74,0.35)", opacity: puedeConfirmar ? 1 : 0.4, cursor: puedeConfirmar ? "pointer" : "not-allowed" }}>
            {cargando ? "PROCESANDO..." : numProveedores > 1 ? `CONFIRMAR ${numProveedores} PEDIDOS` : "CONFIRMAR PEDIDO"}
          </button>
          <p style={{ color: "#94a3b8", fontSize: 12, textAlign: "center", marginTop: 16 }}>Cada proveedor recibirá su albarán automáticamente por email</p>
        </div>
      </aside>

      {mostrarStripe && <StripeCheckout total={total} metadata={{ empresa, clienteEmail }} onSuccess={async () => { setMostrarStripe(false); await procesarPedido(); }} onCancel={() => setMostrarStripe(false)} />}
    </main>
  );
}