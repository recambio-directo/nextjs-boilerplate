"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { pdf } from "@react-pdf/renderer";
import React from "react";
import { AlbaranPDF, EtiquetaEnvioPDF } from "../lib/AlbaranPDF";
import StripeCheckout from "../components/StripeCheckout";

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

  useEffect(() => { cargarDatos(); }, []);

  async function cargarDatos() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setUserId(user.id);
    setClienteEmail(user.email || "");

    const { data: perfil } = await supabase.from("usuarios").select("*").eq("id", user.id).single();
    if (perfil) {
      setEmpresa(perfil.nombre_empresa || "");
      setTelefono(perfil.telefono || "");
      setDireccion(perfil.direccion || "");
      setCiudad(perfil.ciudad || "");
      setCif(perfil.cif || "");
      setCreditoRD(Number(perfil.credito_rd) || 0);
      // Inicializar campos editables
      setEmpresaEdit(perfil.nombre_empresa || "");
      setTelefonoEdit(perfil.telefono || "");
      setDireccionEdit(perfil.direccion || "");
      setCiudadEdit(perfil.ciudad || "");
      setCifEdit(perfil.cif || "");
    }

    const { data: cesta } = await supabase.from("cesta").select("*").eq("user_id", user.id).order("id", { ascending: true });
    if (cesta) {
      const vistos = new Set<string>();
      const sinDuplicados = cesta.filter((item: Producto) => {
        if (vistos.has(item.referencia)) return false;
        vistos.add(item.referencia);
        return true;
      });
      setProductos(sinDuplicados);
      // Inicializar cantidades a 1
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

  const subtotal = productos.reduce((acc, item) => {
    const cant = cantidades[item.referencia] || 1;
    return acc + (Number(item.precio) + Number(item.impuesto || 0)) * cant;
  }, 0);
  const precioTransporte = getPrecioTransporte();
  const iva = subtotal * 0.21;
  const total = subtotal + precioTransporte + iva;
  const puedeConfirmar = productos.length > 0 && transporte !== null && !cargando;

  // Agrupar productos por proveedor
  function getGruposPorProveedor(): Map<string, { nombre: string; productos: Producto[] }> {
    const grupos = new Map<string, { nombre: string; productos: Producto[] }>();
    for (const p of productos) {
      const key = p.proveedor_id || "sin_proveedor";
      if (!grupos.has(key)) {
        grupos.set(key, { nombre: p.proveedor_nombre || "Proveedor", productos: [] });
      }
      grupos.get(key)!.productos.push(p);
    }
    return grupos;
  }

  const numProveedores = new Set(productos.map(p => p.proveedor_id)).size;

  async function generarYGuardarPDFs(
    pedidoId: number,
    codigo: string,
    proveedorNombre: string,
    proveedorEmail: string,
    proveedorCif: string,
    proveedorTelefono: string,
    proveedorDireccion: string,
    productosGrupo: Producto[],
    subtotalGrupo: number,
    ivaGrupo: number,
    totalGrupo: number,
    fecha: string
  ) {
    try {
      const props = {
        codigo,
        fecha,
        proveedorNombre,
        proveedorEmail,
        proveedorCif,
        proveedorTelefono,
        proveedorDireccion,
        cliente: empresa,
        clienteEmail: clienteEmail,
        telefono,
        cif,
        direccion: direccion + (ciudad ? ", " + ciudad : ""),
        agencia: transporte || "",
        formaPago,
        productos: productosGrupo,
        subtotal: subtotalGrupo,
        iva: ivaGrupo,
        total: totalGrupo,
      };

      // Generar PDFs en el cliente
      const albaranBlob = await pdf(React.createElement(AlbaranPDF, props) as any).toBlob();
      const etiquetaBlob = await pdf(React.createElement(EtiquetaEnvioPDF, props) as any).toBlob();

      const albaranPath = `documentos/${codigo}/albaran-${codigo}.pdf`;
      const etiquetaPath = `documentos/${codigo}/etiqueta-envio-${codigo}.pdf`;

      // Subir a Storage
      await supabase.storage.from("FACTURAS").upload(albaranPath, albaranBlob, { contentType: "application/pdf", upsert: true });
      await supabase.storage.from("FACTURAS").upload(etiquetaPath, etiquetaBlob, { contentType: "application/pdf", upsert: true });

      const { data: albaranUrl } = supabase.storage.from("FACTURAS").getPublicUrl(albaranPath);
      const { data: etiquetaUrl } = supabase.storage.from("FACTURAS").getPublicUrl(etiquetaPath);

      // Guardar URLs en el pedido
      await supabase.from("pedidos").update({
        albaran_url: albaranUrl.publicUrl,
        etiqueta_envio_url: etiquetaUrl.publicUrl,
      }).eq("id", pedidoId);

      return { albaran_url: albaranUrl.publicUrl, etiqueta_envio_url: etiquetaUrl.publicUrl };
    } catch (e) {
      console.error("Error generando PDFs:", e);
      return null;
    }
  }

  async function finalizarCompra() {
    if (!puedeConfirmar) return;

    // Si pago con tarjeta, abrir Stripe
    if (formaPago === "tarjeta") {
      setMostrarStripe(true);
      return;
    }

    // Validar crédito RD suficiente
    if (formaPago === "rd_pago" && creditoRD < total) {
      alert("Saldo RD Pago insuficiente. Tu credito disponible es " + creditoRD.toFixed(2) + " EUR y el pedido es de " + total.toFixed(2) + " EUR. Contacta con Recambio Directo para ampliar tu credito.");
      return;
    }

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
      const subtotalGrupo = grupo.productos.reduce((acc, p) => {
        const cant = cantidades[p.referencia] || 1;
        return acc + (Number(p.precio) + Number(p.impuesto || 0)) * cant;
      }, 0);
      const transporteGrupo = primerPedido ? precioTransporte : 0;
      const ivaGrupo = subtotalGrupo * 0.21;
      const totalGrupo = subtotalGrupo + transporteGrupo + ivaGrupo;
      const totalSinPorte = subtotalGrupo + ivaGrupo; // Para el albarán
      const codigo = "RD-" + Math.floor(Math.random() * 9000000 + 1000000);

      // Obtener email del proveedor
      let emailProveedor = "";
      let nombreProveedor = grupo.nombre;
      let proveedorCif = "";
      let proveedorTelefono = "";
      let proveedorDireccion = "";
      if (provId !== "sin_proveedor") {
        const { data: prov } = await supabase.from("usuarios").select("email, nombre_empresa, cif, telefono, direccion, ciudad").eq("id", provId).single();
        emailProveedor = prov?.email || "";
        nombreProveedor = prov?.nombre_empresa || grupo.nombre;
        proveedorCif = prov?.cif || "";
        proveedorTelefono = prov?.telefono || "";
        proveedorDireccion = [prov?.direccion, prov?.ciudad].filter(Boolean).join(", ");
      }

      const pedido = {
        cliente_id: user.id,
        cliente_email: user.email,
        cliente_nombre: empresa,
        cliente_telefono: telefono,
        direccion: direccionCompleta,
        subtotal: subtotalGrupo,
        total: totalGrupo,
        coste_transporte: transporteGrupo,
        estado: "pendiente",
        estado_pago: "pendiente",
        estado_envio: "pendiente",
        codigo,
        transporte,
        agencia: transporte,
        forma_pago: formaPago,
        metodo_pago: "pagofacil",
        productos: grupo.productos,
      };

      const { data: pedidoInsertado, error } = await supabase.from("pedidos").insert(pedido).select("id").single();
      if (error) { console.error("Error creando pedido:", error); continue; }

      pedidosCreados.push(codigo);
      primerPedido = false;

      // Generar y guardar PDFs (total sin porte para el albarán)
      if (pedidoInsertado?.id) {
        await generarYGuardarPDFs(
          pedidoInsertado.id, codigo,
          nombreProveedor, emailProveedor, proveedorCif, proveedorTelefono, proveedorDireccion,
          grupo.productos, subtotalGrupo, ivaGrupo, totalSinPorte, fecha
        );
      }

      // Email al proveedor
      if (emailProveedor) {
        try {
          await fetch("/api/enviar-email", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              proveedorEmail: emailProveedor,
              proveedorNombre: nombreProveedor,
              productos: grupo.productos,
              cliente: empresa,
              clienteEmail: user.email,
              telefono, cif,
              direccion: direccionCompleta,
              agencia: transporte,
              formaPago,
              subtotal: subtotalGrupo,
              iva: ivaGrupo,
              total: totalGrupo,
              codigo, fecha,
              pedidoId: pedidoInsertado?.id,
            }),
          });
        } catch (e) { console.error("Error email:", e); }
      }

    }

    await supabase.from("cesta").delete().eq("user_id", user.id);

    // Descontar stock de piezas_publicadas
    for (const [, grupo] of grupos) {
      for (const prod of grupo.productos) {
        if (prod.proveedor_id && prod.referencia) {
          const cant = cantidades[prod.referencia] || 1;
          const { data: pieza } = await supabase
            .from("piezas_publicadas")
            .select("id, stock")
            .eq("proveedor_id", prod.proveedor_id)
            .eq("referencia", prod.referencia)
            .single();
          if (pieza) {
            await supabase
              .from("piezas_publicadas")
              .update({ stock: Math.max(0, (pieza.stock || 0) - cant) })
              .eq("id", pieza.id);
          }
        }
      }
    }

    // Descontar crédito RD si se usó esa forma de pago
    if (formaPago === "rd_pago") {
      const nuevoCreditoRD = Math.max(0, creditoRD - total);
      await supabase.from("usuarios").update({ credito_rd: nuevoCreditoRD }).eq("id", user.id);
      setCreditoRD(nuevoCreditoRD);
      // Notificar si el saldo queda bajo o a cero
      if (nuevoCreditoRD === 0) {
        try {
          await fetch("/api/send-credito-agotado", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              clienteEmail: user.email,
              clienteNombre: empresa,
            }),
          });
        } catch (e) { console.error("Error email credito:", e); }
      }
    }

    if (pedidosCreados.length > 1) {
      alert("Pedidos confirmados: " + pedidosCreados.join(", ") + ". Cada proveedor recibira su albaran.");
    } else if (pedidosCreados.length === 1) {
      alert("Pedido " + pedidosCreados[0] + " confirmado. El proveedor recibira el albaran por email.");
    }

    const { data: perfilTipo } = await supabase.from("usuarios").select("tipo").eq("id", user.id).single();
    if (perfilTipo?.tipo === "proveedor") {
      window.location.href = "/dashboard/proveedor";
    } else {
      window.location.href = "/dashboard/pedidos";
    }
  }

  const LogoMRW = () => <div style={{ background: "#E30613", borderRadius: "8px", padding: "6px 14px" }}><span style={{ color: "white", fontWeight: 900, fontSize: "16px" }}>MRW</span></div>;
  const LogoGLS = () => <div style={{ background: "#F5A800", borderRadius: "8px", padding: "6px 14px" }}><span style={{ color: "white", fontWeight: 900, fontSize: "16px" }}>GLS</span></div>;
  const LogoCorreos = () => <div style={{ background: "#FFCC00", borderRadius: "8px", padding: "6px 10px" }}><span style={{ color: "#333", fontWeight: 900, fontSize: "12px" }}>CORREOS</span></div>;
  const LogoMisMedios = () => <div style={{ background: "rgba(139,92,246,0.3)", borderRadius: "8px", padding: "6px 10px", border: "1px solid rgba(139,92,246,0.5)" }}><span style={{ color: "#a78bfa", fontWeight: 900, fontSize: "12px" }}>PROPIO</span></div>;

  const opciones = [
    { key: "MRW", logo: <LogoMRW />, label: "MRW 24H", precio: "7.95" },
    { key: "GLS", logo: <LogoGLS />, label: "GLS", precio: "6.50" },
    { key: "Correos Express", logo: <LogoCorreos />, label: "Correos Express", precio: "5.00" },
    { key: "Mis Medios", logo: <LogoMisMedios />, label: "Mis Medios", precio: "0.00" },
  ];

  const grupos = getGruposPorProveedor();

  return (
    <main style={mainStyle}>
      <section style={leftSide}>
        <h1 style={titleStyle}>FINALIZAR PEDIDO</h1>
        <p style={subtitleStyle}>Tus datos profesionales se cargan automaticamente desde tu cuenta.</p>

        {/* DATOS ENTREGA */}
        <div style={cardStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 26 }}>
            <h2 style={{ ...sectionTitle, marginBottom: 0 }}>DATOS ENTREGA</h2>
            <button
              onClick={() => {
                if (!editandoDatos) {
                  setEmpresaEdit(empresa);
                  setTelefonoEdit(telefono);
                  setDireccionEdit(direccion);
                  setCiudadEdit(ciudad);
                  setCifEdit(cif);
                }
                setEditandoDatos(!editandoDatos);
              }}
              style={{ background: editandoDatos ? "rgba(22,163,74,0.15)" : "rgba(37,99,235,0.15)", border: "none", color: editandoDatos ? "#4ade80" : "#60a5fa", padding: "8px 18px", borderRadius: 10, cursor: "pointer", fontWeight: 700, fontSize: 14 }}
            >
              {editandoDatos ? "Cancelar" : "Editar datos"}
            </button>
          </div>

          {editandoDatos ? (
            <div style={{ display: "grid", gap: 16 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div>
                  <p style={labelStyle}>Empresa / Nombre fiscal</p>
                  <input value={empresaEdit} onChange={e => setEmpresaEdit(e.target.value)} style={inputStyle} placeholder="Nombre empresa" />
                </div>
                <div>
                  <p style={labelStyle}>CIF / NIF</p>
                  <input value={cifEdit} onChange={e => setCifEdit(e.target.value)} style={inputStyle} placeholder="B12345678" />
                </div>
              </div>
              <div>
                <p style={labelStyle}>Direccion de entrega</p>
                <input value={direccionEdit} onChange={e => setDireccionEdit(e.target.value)} style={inputStyle} placeholder="Calle, numero, piso..." />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div>
                  <p style={labelStyle}>Ciudad</p>
                  <input value={ciudadEdit} onChange={e => setCiudadEdit(e.target.value)} style={inputStyle} placeholder="Madrid" />
                </div>
                <div>
                  <p style={labelStyle}>Telefono</p>
                  <input value={telefonoEdit} onChange={e => setTelefonoEdit(e.target.value)} style={inputStyle} placeholder="600000000" />
                </div>
              </div>
              <button
                onClick={() => {
                  setEmpresa(empresaEdit);
                  setTelefono(telefonoEdit);
                  setDireccion(direccionEdit);
                  setCiudad(ciudadEdit);
                  setCif(cifEdit);
                  setEditandoDatos(false);
                }}
                style={{ background: "linear-gradient(135deg,#16a34a,#15803d)", border: "none", color: "white", padding: "14px", borderRadius: 12, fontWeight: 700, cursor: "pointer", fontSize: 15 }}
              >
                Aplicar datos de entrega
              </button>
              <p style={{ color: "#94a3b8", fontSize: 12, textAlign: "center" as const }}>
                Estos cambios son solo para este pedido, no modifican tu perfil
              </p>
            </div>
          ) : (
            <div style={empresaCard}>
              {empresa ? (
                <>
                  <div style={empresaNombre}>{empresa}</div>
                  {cif && <div style={empresaInfo}>CIF: {cif}</div>}
                  {direccion && <div style={empresaInfo}>{direccion}{ciudad ? ", " + ciudad : ""}</div>}
                  {telefono && <div style={empresaInfo}>{telefono}</div>}
                  {clienteEmail && <div style={empresaInfo}>{clienteEmail}</div>}
                </>
              ) : (
                <div style={{ color: "#94a3b8" }}>
                  Completa tu perfil en <a href="/perfil" style={{ color: "#60a5fa" }}>Mi Cuenta</a>
                </div>
              )}
            </div>
          )}
        </div>

        {/* TRANSPORTE */}
        <div style={cardStyle}>
          <h2 style={sectionTitle}>TRANSPORTE</h2>
          {!transporte && <div style={avisTransporte}>Selecciona una opcion de transporte para continuar</div>}
          <div style={shippingGrid}>
            {opciones.map(({ key, logo, label, precio }) => (
              <button
                key={key}
                onClick={() => setTransporte(key)}
                style={{
                  ...shippingCard,
                  border: transporte === key ? (key === "Mis Medios" ? "2px solid #8b5cf6" : "2px solid #2563eb") : "1px solid rgba(255,255,255,0.06)",
                  background: transporte === key ? (key === "Mis Medios" ? "rgba(139,92,246,0.1)" : "rgba(37,99,235,0.1)") : "#0f172a",
                }}
              >
                {logo}
                <div style={shippingTitle}>{label}</div>
                <div style={{ fontSize: 13, color: key === "Mis Medios" ? "#a78bfa" : "#94a3b8", fontWeight: key === "Mis Medios" ? 700 : 400 }}>
                  {key === "Mis Medios" ? "Sin coste" : precio + "EUR"}
                </div>
              </button>
            ))}
          </div>
          {transporte === "Mis Medios" && (
            <div style={misMediosInfo}>
              Has seleccionado Mis Medios. La plataforma no gestionara el transporte.
            </div>
          )}
        </div>
      </section>

      {/* RESUMEN */}
      <aside style={summarySide}>
        <div style={summaryCard}>
          <h2 style={sectionTitle}>RESUMEN</h2>

          {productos.length === 0 ? (
            <div style={{ color: "#94a3b8", textAlign: "center", padding: "30px 0" }}>
              Tu cesta esta vacia
            </div>
          ) : (
            <div style={productsList}>
              {Array.from(grupos).map(([provId, grupo], gi) => (
                <div key={provId}>
                  {/* Cabecera proveedor */}
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10, marginTop: gi > 0 ? 16 : 0 }}>
                    <div style={{ height: 1, flex: 1, background: "rgba(255,255,255,0.06)" }} />
                    <span style={{ color: "#60a5fa", fontSize: 12, fontWeight: 700, background: "rgba(37,99,235,0.1)", padding: "3px 10px", borderRadius: 999 }}>
                      {grupo.nombre}
                    </span>
                    <div style={{ height: 1, flex: 1, background: "rgba(255,255,255,0.06)" }} />
                  </div>
                  {grupo.productos.map((p) => (
                    <div key={p.id} style={productRow}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <h3 style={productTitle}>{p.descripcion}</h3>
                        <p style={productRef}>{p.referencia}</p>
                        {p.impuesto && Number(p.impuesto) > 0 && (
                          <p style={{ color: "#fbbf24", fontSize: 12, marginTop: 4, fontWeight: 700 }}>
                            + {Number(p.impuesto).toFixed(2)}EUR casco/ecotasa
                          </p>
                        )}
                        {/* SELECTOR CANTIDAD */}
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
                          <button
                            onClick={() => setCantidades(prev => ({ ...prev, [p.referencia]: Math.max(1, (prev[p.referencia] || 1) - 1) }))}
                            style={{ width: 28, height: 28, borderRadius: 6, background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)", color: "white", cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" }}
                          >-</button>
                          <span style={{ fontWeight: 700, fontSize: 15, minWidth: 20, textAlign: "center" as const }}>
                            {cantidades[p.referencia] || 1}
                          </span>
                          <button
                            onClick={() => {
                              const stockMax = Number(p.stock || 99);
                              const cantActual = cantidades[p.referencia] || 1;
                              if (cantActual >= stockMax) {
                                alert("Stock maximo disponible: " + stockMax + " unidades");
                                return;
                              }
                              setCantidades(prev => ({ ...prev, [p.referencia]: cantActual + 1 }));
                            }}
                            disabled={(cantidades[p.referencia] || 1) >= Number(p.stock || 99)}
                            style={{ width: 28, height: 28, borderRadius: 6, background: (cantidades[p.referencia] || 1) >= Number(p.stock || 99) ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)", color: (cantidades[p.referencia] || 1) >= Number(p.stock || 99) ? "#94a3b8" : "white", cursor: (cantidades[p.referencia] || 1) >= Number(p.stock || 99) ? "not-allowed" : "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" }}
                          >+</button>
                          {p.stock && (cantidades[p.referencia] || 1) >= Number(p.stock) && (
                            <span style={{ color: "#f87171", fontSize: 10, fontWeight: 700 }}>MAX</span>
                          )}
                          <span style={{ color: "#94a3b8", fontSize: 12 }}>uds</span>
                        </div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
                        <div style={{ textAlign: "right" as const }}>
                          <strong style={{ fontSize: 16 }}>
                            {((Number(p.precio) + Number(p.impuesto || 0)) * (cantidades[p.referencia] || 1)).toFixed(2)}EUR
                          </strong>
                          {(cantidades[p.referencia] || 1) > 1 && (
                            <p style={{ color: "#94a3b8", fontSize: 11, margin: 0 }}>
                              {(Number(p.precio) + Number(p.impuesto || 0)).toFixed(2)} x {cantidades[p.referencia]}
                            </p>
                          )}
                          {p.impuesto && Number(p.impuesto) > 0 && (cantidades[p.referencia] || 1) === 1 && (
                            <p style={{ color: "#94a3b8", fontSize: 11, margin: 0 }}>{Number(p.precio).toFixed(2)} + {Number(p.impuesto).toFixed(2)}</p>
                          )}
                        </div>
                        <button onClick={() => eliminarArticulo(p)} style={btnEliminar} title="Eliminar">X</button>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
              {numProveedores > 1 && (
                <div style={{ background: "rgba(37,99,235,0.08)", border: "1px solid rgba(37,99,235,0.2)", borderRadius: 10, padding: "10px 14px", marginTop: 8 }}>
                  <p style={{ color: "#60a5fa", fontSize: 12, fontWeight: 700, margin: 0 }}>
                    Se crearan {numProveedores} pedidos separados, uno por proveedor
                  </p>
                </div>
              )}
            </div>
          )}

          <div style={priceRows}>
            <div style={priceRow}><span>Subtotal</span><span>{subtotal.toFixed(2)}EUR</span></div>
            <div style={priceRow}>
              <span>Transporte</span>
              <span style={{ color: transporte === "Mis Medios" ? "#a78bfa" : "white" }}>
                {!transporte ? "Pendiente" : transporte === "Mis Medios" ? "Sin coste" : precioTransporte.toFixed(2) + "EUR"}
              </span>
            </div>
            <div style={priceRow}><span>IVA (21%)</span><span>{iva.toFixed(2)}EUR</span></div>
          </div>

          <div style={totalBox}>
            <span>TOTAL</span>
            <h2 style={totalPrice}>{total.toFixed(2)}EUR</h2>
          </div>

          {!transporte && (
            <div style={avisConfirmar}>Selecciona un metodo de transporte para confirmar</div>
          )}

          {/* FORMA DE PAGO */}
          <div style={{ marginBottom: 24 }}>
            <p style={{ fontWeight: 700, fontSize: 14, marginBottom: 12, color: "#94a3b8" }}>FORMA DE PAGO</p>
            <div style={{ display: "flex", flexDirection: "column" as const, gap: 10 }}>

              <button
                onClick={() => setFormaPago("rd_pago")}
                disabled={creditoRD <= 0}
                style={{
                  padding: "14px 18px", borderRadius: 12, textAlign: "left" as const,
                  cursor: creditoRD > 0 ? "pointer" : "not-allowed",
                  background: formaPago === "rd_pago" ? "rgba(37,99,235,0.2)" : "rgba(255,255,255,0.04)",
                  border: formaPago === "rd_pago" ? "2px solid rgba(37,99,235,0.6)" : "1px solid rgba(255,255,255,0.08)",
                  opacity: creditoRD <= 0 ? 0.4 : 1,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <p style={{ fontWeight: 800, color: formaPago === "rd_pago" ? "#60a5fa" : "white", margin: 0 }}>RD Pago</p>
                    <p style={{ color: "#94a3b8", fontSize: 12, margin: "4px 0 0" }}>Credito disponible en la plataforma</p>
                  </div>
                  <span style={{ color: creditoRD > 0 ? "#4ade80" : "#f87171", fontWeight: 900, fontSize: 16 }}>
                    {creditoRD.toFixed(2)}EUR
                  </span>
                </div>
                {creditoRD <= 0 && <p style={{ color: "#f87171", fontSize: 11, marginTop: 6 }}>Sin credito — contacta con Recambio Directo en info@recambiodirecto.es</p>}
                {creditoRD > 0 && creditoRD < 100 && <p style={{ color: "#fbbf24", fontSize: 11, marginTop: 6 }}>Saldo bajo — considera recargar tu credito pronto</p>}
                {creditoRD > 0 && creditoRD < total && creditoRD >= 100 && <p style={{ color: "#f87171", fontSize: 11, marginTop: 6 }}>Saldo insuficiente para este pedido ({total.toFixed(2)} EUR)</p>}
              </button>

              <button
                onClick={() => setFormaPago("tarjeta")}
                style={{
                  padding: "14px 18px", borderRadius: 12, textAlign: "left" as const, cursor: "pointer",
                  background: formaPago === "tarjeta" ? "rgba(139,92,246,0.2)" : "rgba(255,255,255,0.04)",
                  border: formaPago === "tarjeta" ? "2px solid rgba(139,92,246,0.6)" : "1px solid rgba(255,255,255,0.08)",
                }}
              >
                <p style={{ fontWeight: 800, color: formaPago === "tarjeta" ? "#a78bfa" : "white", margin: 0 }}>Tarjeta bancaria</p>
                <p style={{ color: "#94a3b8", fontSize: 12, margin: "4px 0 0" }}>Pago seguro con tarjeta</p>
              </button>

            </div>
          </div>

          <button
            onClick={finalizarCompra}
            disabled={!puedeConfirmar}
            style={{ ...confirmButton, opacity: puedeConfirmar ? 1 : 0.4, cursor: puedeConfirmar ? "pointer" : "not-allowed" }}
          >
            {cargando ? "PROCESANDO..." : numProveedores > 1 ? "CONFIRMAR " + numProveedores + " PEDIDOS" : "CONFIRMAR PEDIDO"}
          </button>

          <p style={{ color: "#94a3b8", fontSize: 12, textAlign: "center", marginTop: 16 }}>
            Cada proveedor recibira su albaran automaticamente por email
          </p>
        </div>
      </aside>
      {mostrarStripe && (
        <StripeCheckout
          total={total}
          metadata={{ empresa, clienteEmail }}
          onSuccess={async () => {
            setMostrarStripe(false);
            await procesarPedido();
          }}
          onCancel={() => setMostrarStripe(false)}
        />
      )}
    </main>
  );
}

/* STYLES */
const labelStyle = { color: "#94a3b8", fontSize: 13, marginBottom: 8, fontWeight: 600 };
const inputStyle = { width: "100%", background: "#020617", color: "white", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, padding: "12px 16px", fontSize: 15, outline: "none", boxSizing: "border-box" as const };
const mainStyle = { minHeight: "100vh", display: "grid", gridTemplateColumns: "1.2fr 420px", gap: "40px", padding: "50px", background: "linear-gradient(135deg,#020617,#020b2d)", color: "white" };
const leftSide = {};
const summarySide = { position: "sticky" as const, top: "40px", height: "fit-content" };
const titleStyle = { fontSize: "72px", fontWeight: 900, lineHeight: 1, marginBottom: "24px" };
const subtitleStyle = { color: "#94a3b8", fontSize: "22px", lineHeight: 1.7, marginBottom: "40px" };
const cardStyle = { background: "rgba(15,23,42,0.92)", borderRadius: "30px", padding: "32px", border: "1px solid rgba(255,255,255,0.06)", marginBottom: "30px" };
const sectionTitle = { fontSize: "32px", fontWeight: 900, marginBottom: "26px" };
const empresaCard = { background: "#0f172a", borderRadius: "24px", padding: "30px", border: "1px solid rgba(255,255,255,0.06)" };
const empresaNombre = { fontSize: "30px", fontWeight: 900, marginBottom: "18px" };
const empresaInfo = { color: "#cbd5e1", marginBottom: "12px", fontSize: "17px" };
const avisTransporte = { background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.3)", color: "#fbbf24", padding: "12px 18px", borderRadius: 12, marginBottom: 20, fontSize: 14 };
const shippingGrid = { display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: "16px" };
const shippingCard = { borderRadius: "20px", padding: "22px", color: "white", fontWeight: 800, cursor: "pointer", display: "flex", flexDirection: "column" as const, alignItems: "center", justifyContent: "center", gap: "10px" };
const shippingTitle = { fontSize: "15px", fontWeight: 800 };
const misMediosInfo = { background: "rgba(139,92,246,0.1)", border: "1px solid rgba(139,92,246,0.3)", color: "#c4b5fd", padding: "14px 18px", borderRadius: 14, marginTop: 20, fontSize: 14 };
const summaryCard = { background: "rgba(15,23,42,0.92)", borderRadius: "32px", padding: "34px", border: "1px solid rgba(255,255,255,0.06)" };
const productsList = { display: "grid", gap: "18px", marginBottom: "30px" };
const productRow = { display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: "18px", borderBottom: "1px solid rgba(255,255,255,0.06)" };
const productTitle = { fontSize: "18px", fontWeight: 800 };
const productRef = { color: "#94a3b8", marginTop: "6px" };
const btnEliminar = { background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171", width: 34, height: 34, borderRadius: 8, cursor: "pointer", fontSize: 15, display: "flex", alignItems: "center", justifyContent: "center" };
const priceRows = { display: "grid", gap: "16px", marginBottom: "30px" };
const priceRow = { display: "flex", justifyContent: "space-between", color: "#cbd5e1" };
const totalBox = { borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: "24px", marginBottom: "20px" };
const totalPrice = { fontSize: "48px", fontWeight: 900, color: "#22c55e", marginTop: "10px" };
const avisConfirmar = { background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)", color: "#fbbf24", padding: "12px 16px", borderRadius: 12, marginBottom: 16, fontSize: 13, textAlign: "center" as const };
const confirmButton = { width: "100%", background: "linear-gradient(135deg,#16a34a,#15803d)", border: "none", padding: "22px", borderRadius: "20px", color: "white", fontWeight: 900, fontSize: "18px", boxShadow: "0 12px 30px rgba(22,163,74,0.35)" };