"use client";

import React from "react";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";
import ImportarStock from "./ImportarStock";

type Pieza = {
  id: number;
  referencia: string;
  descripcion: string;
  precio: number;
  stock: number;
  marca?: string;
  provincia?: string;
  proveedor_id?: string;
  proveedor_nombre?: string;
  tipo?: string;
};

type Pedido = {
  id: number;
  codigo?: string;
  cliente_id?: string;
  cliente_nombre?: string;
  cliente_email?: string;
  cliente_telefono?: string;
  total?: number;
  estado?: string;
  estado_envio?: string;
  agencia?: string;
  tracking?: string;
  tracking_nacex?: string;
  tracking_seur?: string;
  collection_ref_seur?: string;
  transporte?: string;
  productos?: any[];
  created_at?: string;
  subtotal?: number;
  coste_transporte?: number;
  comprador_id?: string;
  anulado?: boolean;
  factura_url?: string;
  factura_nombre?: string;
  albaran_url?: string;
  etiqueta_envio_url?: string;
  etiqueta_nacex_url?: string;
  etiqueta_seur_url?: string;
};

type Mensaje = {
  id: number;
  pedido_id?: number;
  conversacion_id?: number;
  emisor?: string;
  user_id?: string;
  mensaje: string;
  created_at?: string;
};

const DIAS_SEMANA = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

function getTrackingUrl(agencia: string, tracking: string): string {
  const ag = (agencia || "").toLowerCase();
  if (ag.includes("mrw")) return `https://www.mrw.es/seguimiento_envios/MRW_resultados_consultas.asp?Referencia=${tracking}`;
  if (ag.includes("nacex")) return `https://www.nacex.com/seguimientoDetalle.do?agencia_origen=${tracking.split("/")[0]}&numero_albaran=${tracking.split("/")[1]}&externo=N`;
  if (ag.includes("seur")) return `https://www.seur.com/es/particular/herramientas/localizador-de-envios.html?referencia=${tracking}`;
  if (ag.includes("gls")) return `https://gls-group.eu/track/${tracking}`;
  if (ag.includes("correos")) return `https://www.correos.es/es/es/herramientas/localizador/envios/detalle?codigoEnvio=${tracking}`;
  return `https://www.google.com/search?q=tracking+${agencia}+${tracking}`;
}

function getTrackingInfo(pedido: Pedido): { tracking: string; url: string } | null {
  const agencia = (pedido.agencia || pedido.transporte || "").toLowerCase();
  if (agencia.includes("nacex") && pedido.tracking_nacex) {
    return { tracking: pedido.tracking_nacex, url: getTrackingUrl("nacex", pedido.tracking_nacex) };
  }
  if (agencia.includes("seur") && pedido.tracking_seur) {
    return { tracking: pedido.tracking_seur, url: getTrackingUrl("seur", pedido.tracking_seur) };
  }
  if (pedido.tracking) {
    return { tracking: pedido.tracking, url: getTrackingUrl(agencia, pedido.tracking) };
  }
  return null;
}

function LogoAgencia({ agencia }: { agencia?: string }) {
  const ag = (agencia || "").toLowerCase();
  if (ag.includes("mrw")) return <span style={{ background: "#E30613", color: "white", padding: "3px 10px", borderRadius: 6, fontWeight: 900, fontSize: 13 }}>MRW</span>;
  if (ag.includes("nacex")) return <span style={{ background: "#FFD200", color: "#1a1a1a", padding: "3px 10px", borderRadius: 6, fontWeight: 900, fontSize: 13 }}>NACEX</span>;
  if (ag.includes("seur")) return <span style={{ background: "#F5A800", color: "#1a1a1a", padding: "3px 10px", borderRadius: 6, fontWeight: 900, fontSize: 13 }}>SEUR</span>;
  if (ag.includes("gls")) return <span style={{ background: "#00467F", color: "white", padding: "3px 10px", borderRadius: 6, fontWeight: 900, fontSize: 13 }}>GLS</span>;
  if (ag.includes("correos")) return <span style={{ background: "#FFCC00", color: "#333", padding: "3px 10px", borderRadius: 6, fontWeight: 900, fontSize: 11 }}>CORREOS</span>;
  if (ag.includes("ctt")) return <span style={{ background: "#E8E8E8", color: "#1a1a1a", padding: "3px 10px", borderRadius: 6, fontWeight: 900, fontSize: 12 }}>CTT</span>;
  if (ag.includes("medios")) return <span style={{ background: "rgba(139,92,246,0.3)", color: "#a78bfa", padding: "3px 10px", borderRadius: 6, fontWeight: 900, fontSize: 13 }}>PROPIO</span>;
  return <span style={{ color: "#94a3b8" }}>{agencia || "-"}</span>;
}

function EstadoEnvio({ estado, anulado }: { estado?: string; anulado?: boolean }) {
  if (anulado) return <span style={{ color: "#f87171", fontWeight: 700, fontSize: 13 }}>❌ Anulado</span>;
  const map: Record<string, { color: string; label: string }> = {
    pendiente:  { color: "#f59e0b", label: "⏳ Pendiente" },
    preparando: { color: "#60a5fa", label: "🔧 Preparando" },
    enviado:    { color: "#a78bfa", label: "🚚 En tránsito" },
    entregado:  { color: "#4ade80", label: "✅ Entregada" },
  };
  const s = map[estado || "pendiente"] || map.pendiente;
  return <span style={{ color: s.color, fontWeight: 700, fontSize: 13 }}>{s.label}</span>;
}

export default function ProveedorPage() {
  const router = useRouter();
  const channelRef = useRef<any>(null);
  const [busquedaHeader, setBusquedaHeader] = useState("");
  const [notifs, setNotifs] = useState<any[]>([]);
  const [showNotifs, setShowNotifs] = useState(false);
  const [totalCesta, setTotalCesta] = useState(0);
  const [seccion, setSeccion] = useState<"dashboard" | "almacen" | "publicar" | "pedidos" | "importar" | "horarios" | "exclusiones" | "cuenta">("dashboard");
  const [pestañaPedidos, setPestañaPedidos] = useState<"recibidos" | "realizados">("recibidos");
  const [pestañaAlmacen, setPestañaAlmacen] = useState<"todos" | "oem" | "iam">("todos");
  const [pedidosRecibidos, setPedidosRecibidos] = useState<Pedido[]>([]);
  const [pedidosRealizados, setPedidosRealizados] = useState<Pedido[]>([]);
  const [piezas, setPiezas] = useState<Pieza[]>([]);
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [nuevoMensaje, setNuevoMensaje] = useState<Record<number, string>>({});
  const [pedidoExpandido, setPedidoExpandido] = useState<number | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [nombreEmpresa, setNombreEmpresa] = useState("Proveedor");
  const [provinciaPerfil, setProvinciaPerfil] = useState<string | null>(null);
  const [cargando, setCargando] = useState(true);
  const [busquedaPedido, setBusquedaPedido] = useState("");
  const [subiendoFactura, setSubiendoFactura] = useState<number | null>(null);
  const [solicitandoFactura, setSolicitandoFactura] = useState<number | null>(null);
  const [anulandoPedido, setAnulandoPedido] = useState<number | null>(null);
  const [modalAnular, setModalAnular] = useState<any | null>(null);
  const [modalContacto, setModalContacto] = useState<any | null>(null);
  const [datosContacto, setDatosContacto] = useState<any | null>(null);
  const [motivoSeleccionado, setMotivoSeleccionado] = useState<string>("");
  const [horarioApertura, setHorarioApertura] = useState("09:00");
  const [horarioCierre, setHorarioCierre] = useState("18:00");
  const [diasApertura, setDiasApertura] = useState<string[]>(["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"]);
  const [guardandoHorario, setGuardandoHorario] = useState(false);
  const [horarioGuardado, setHorarioGuardado] = useState(false);
  const [exclusiones, setExclusiones] = useState<any[]>([]);
  const [nuevoCp, setNuevoCp] = useState("");
  const [nuevoCliente, setNuevoCliente] = useState("");
  const [tabExclusiones, setTabExclusiones] = useState<"cp" | "cliente">("cp");
  const [clientes, setClientes] = useState<any[]>([]);
  const [emailPerfil, setEmailPerfil] = useState("");
  const [emailFacturas, setEmailFacturas] = useState("");
  const [guardandoEmailFacturas, setGuardandoEmailFacturas] = useState(false);
  const [emailFacturasGuardado, setEmailFacturasGuardado] = useState(false);
  const [mostrarCambioPass, setMostrarCambioPass] = useState(false);
  const [passwordActual, setPasswordActual] = useState("");
  const [passwordNueva, setPasswordNueva] = useState("");
  const [passwordNueva2, setPasswordNueva2] = useState("");
  const [cambiandoPass, setCambiandoPass] = useState(false);
  const [mensajePass, setMensajePass] = useState<{tipo:"ok"|"error";texto:string}|null>(null);
  const [formReferencia, setFormReferencia] = useState("");
  const [formDescripcion, setFormDescripcion] = useState("");
  const [formPrecio, setFormPrecio] = useState("");
  const [formStock, setFormStock] = useState("");
  const [formMarca, setFormMarca] = useState("");
  const [formTipo, setFormTipo] = useState("OEM");
  const [formFoto, setFormFoto] = useState<File | null>(null);
  const [formFotoPreview, setFormFotoPreview] = useState<string | null>(null);
  const [subiendoFoto, setSubiendoFoto] = useState(false);
  const [guardandoPieza, setGuardandoPieza] = useState(false);
  const [piezaGuardada, setPiezaGuardada] = useState(false);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [editPrecio, setEditPrecio] = useState("");
  const [editStock, setEditStock] = useState("");
  const [paginaActual, setPaginaActual] = useState(1);
  const [totalPiezas, setTotalPiezas] = useState(0);
  const [busquedaAlmacen, setBusquedaAlmacen] = useState("");
  const [busquedaInput, setBusquedaInput] = useState("");
  const [totalOEM, setTotalOEM] = useState(0);
  const [totalIAM, setTotalIAM] = useState(0);

  useEffect(() => {
    iniciarPagina();
    return () => { if (channelRef.current) supabase.removeChannel(channelRef.current); };
  }, []);

  async function iniciarPagina() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/"); return; }
    const { data: perfil } = await supabase.from("usuarios").select("tipo").eq("id", user.id).single();
    if (!perfil || perfil.tipo !== "proveedor") { router.push("/"); return; }
    setUserId(user.id);
    await cargarDatos();
    await cargarNotificaciones(user.id);
    cargarCesta(user.id);

    const channelName = `proveedor-realtime-${user.id}-${Date.now()}`;
    const channel = supabase
      .channel(channelName)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "pedidos" }, () => { cargarDatos(); })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "mensajes" }, async (payload) => {
        const m = payload.new as any;
        if (m.user_id === user.id) return;
        if (m.conversacion_id) {
          const { data: conv } = await supabase.from("conversaciones").select("id").eq("id", m.conversacion_id).or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`).maybeSingle();
          if (!conv) return;
        }
        const texto = (m.mensaje || "").substring(0, 50);
        setNotifs(prev => {
          if (prev.some(x => x.id === m.id)) return prev;
          return [{ id: m.id, tipo: "chat", texto: `💬 ${texto}`, leido: false, created_at: m.created_at, conv_id: m.conversacion_id }, ...prev].slice(0, 30);
        });
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "pedidos" }, async (payload) => {
        const p = payload.new as any;
        const { data: pedidoCompleto } = await supabase.from("pedidos").select("id, codigo, productos, created_at").eq("id", p.id).single();
        if (!pedidoCompleto) return;
        const productos = pedidoCompleto.productos || [];
        if (productos.some((pr: any) => pr.proveedor_id === user.id)) {
          setNotifs(prev => {
            const id = `ped-${p.id}`;
            if (prev.some(x => x.id === id)) return prev;
            return [{ id, tipo: "pedido", texto: `📦 Nuevo pedido ${pedidoCompleto.codigo || `#${p.id}`}`, leido: false, created_at: pedidoCompleto.created_at }, ...prev].slice(0, 30);
          });
        }
      })
      .subscribe();
    channelRef.current = channel;
  }

  async function cargarCesta(uid: string) {
    const { data } = await supabase.from("cesta").select("id").eq("user_id", uid);
    setTotalCesta(data?.length || 0);
  }

  async function cargarNotificaciones(uid: string) {
    const KEY = `rd_notif_last_prov_${uid}`;
    const VISTAS_KEY = `rd_notif_vistas_prov_${uid}`;
    const ultimo = parseInt(localStorage.getItem(KEY) || "0");
    const ahora = Date.now();
    if (ahora - ultimo < 60000) return;
    localStorage.setItem(KEY, String(ahora));
    const vistasAntes = new Set<string>(JSON.parse(localStorage.getItem(VISTAS_KEY) || "[]"));
    const notifsTotales: any[] = [];
    const { data: convs1 } = await supabase.from("conversaciones").select("id").eq("user1_id", uid);
    const { data: convs2 } = await supabase.from("conversaciones").select("id").eq("user2_id", uid);
    const convIds = [...(convs1 || []), ...(convs2 || [])].map(c => c.id);
    if (convIds.length > 0) {
      const { data: msgs } = await supabase.from("mensajes").select("id, mensaje, created_at, conversacion_id").in("conversacion_id", convIds).neq("user_id", uid).or("leido.is.null,leido.eq.false").order("created_at", { ascending: false }).limit(10);
      (msgs || []).forEach(m => notifsTotales.push({ id: m.id, tipo: "chat", texto: `💬 ${(m.mensaje || "").substring(0, 50)}${(m.mensaje || "").length > 50 ? "..." : ""}`, leido: vistasAntes.has(String(m.id)), created_at: m.created_at, conv_id: m.conversacion_id }));
    }
    const hace7dias = new Date();
    hace7dias.setDate(hace7dias.getDate() - 7);
    const { data: pedidos } = await supabase.from("pedidos").select("id, codigo, created_at, productos").gte("created_at", hace7dias.toISOString()).order("created_at", { ascending: false }).limit(50);
    (pedidos || []).filter(p => (p.productos || []).some((pr: any) => pr.proveedor_id === uid)).slice(0, 5).forEach(p => {
      notifsTotales.push({ id: `ped-${p.id}`, tipo: "pedido", texto: `📦 Pedido ${p.codigo || `#${p.id}`} recibido`, leido: true, created_at: p.created_at });
    });
    notifsTotales.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    setNotifs(notifsTotales);
    localStorage.setItem(VISTAS_KEY, JSON.stringify(notifsTotales.map(n => String(n.id))));
  }

  async function cargarDatos() {
    setCargando(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const currentUserId = user.id;
    setUserId(currentUserId);
    if (user.email) setEmailPerfil(user.email);
    const { data: perfil } = await supabase.from("usuarios").select("nombre_empresa, provincia, horario_apertura, horario_cierre, dias_apertura, email_facturas").eq("id", currentUserId).single();
    if (perfil?.nombre_empresa) setNombreEmpresa(perfil.nombre_empresa);
    if (perfil?.provincia) setProvinciaPerfil(perfil.provincia);
    if (perfil?.horario_apertura) setHorarioApertura(perfil.horario_apertura);
    if (perfil?.horario_cierre) setHorarioCierre(perfil.horario_cierre);
    if (perfil?.dias_apertura?.length) setDiasApertura(perfil.dias_apertura);
    if (perfil?.email_facturas) setEmailFacturas(perfil.email_facturas);
    const { count } = await supabase.from("piezas_publicadas").select("*", { count: "exact", head: true }).eq("proveedor_id", currentUserId);
    setTotalPiezas(count || 0);
    const { count: countOEM } = await supabase.from("piezas_publicadas").select("*", { count: "exact", head: true }).eq("proveedor_id", currentUserId).eq("tipo", "OEM");
    setTotalOEM(countOEM || 0);
    const { count: countIAM } = await supabase.from("piezas_publicadas").select("*", { count: "exact", head: true }).eq("proveedor_id", currentUserId).neq("tipo", "OEM");
    setTotalIAM(countIAM || 0);
    await cargarPiezasPaginadas(currentUserId, 1, "");
    const { data: recibidosData } = await supabase.from("pedidos").select("*").order("id", { ascending: false });
    const recibidos = (recibidosData || []).filter(p => (p.productos || []).some((prod: any) => prod.proveedor_id === currentUserId));
    setPedidosRecibidos(recibidos);
    const { data: realizadosData } = await supabase.from("pedidos").select("*").eq("cliente_id", currentUserId).order("id", { ascending: false });
    const recibidosIds = new Set(recibidos.map((p: any) => p.id));
    setPedidosRealizados((realizadosData || []).filter(p => !recibidosIds.has(p.id)));
    const { data: convsData } = await supabase.from("conversaciones").select("id, pedido_id").not("pedido_id", "is", null);
    const convIds = (convsData || []).map((c: any) => c.id);
    let mensajesData: any[] = [];
    if (convIds.length > 0) {
      const { data: msgs } = await supabase.from("mensajes").select("*, conversaciones!inner(pedido_id)").in("conversacion_id", convIds).order("created_at", { ascending: true });
      mensajesData = (msgs || []).map((m: any) => ({ ...m, pedido_id: m.conversaciones?.pedido_id }));
    }
    setMensajes(mensajesData);
    const { data: exclusionesData } = await supabase.from("exclusiones_proveedor").select("*").eq("proveedor_id", user.id).order("created_at", { ascending: false });
    setExclusiones(exclusionesData || []);
    const { data: clientesData } = await supabase.from("usuarios").select("id, nombre_empresa, email, codigo_postal, ciudad").eq("tipo", "taller").order("nombre_empresa");
    setClientes(clientesData || []);
    setCargando(false);
  }

  async function cargarPiezasPaginadas(uid: string, pagina: number, busqueda: string, tipo?: string) {
    const desde = (pagina - 1) * 100;
    const hasta = desde + 99;
    let query = supabase.from("piezas_publicadas").select("*", { count: "exact" }).eq("proveedor_id", uid).order("referencia", { ascending: true }).range(desde, hasta);
    if (busqueda.trim()) query = query.or(`referencia.ilike.%${busqueda}%,descripcion.ilike.%${busqueda}%,marca.ilike.%${busqueda}%`);
    if (tipo === "oem") query = query.eq("tipo", "OEM");
    if (tipo === "iam") query = query.neq("tipo", "OEM");
    const { data, count } = await query;
    setPiezas(data || []);
    if (count !== null) setTotalPiezas(count);
    setPaginaActual(pagina);
  }

  async function recargarContadores(uid: string) {
    const { count } = await supabase.from("piezas_publicadas").select("*", { count: "exact", head: true }).eq("proveedor_id", uid);
    setTotalPiezas(count || 0);
    const { count: countOEM } = await supabase.from("piezas_publicadas").select("*", { count: "exact", head: true }).eq("proveedor_id", uid).eq("tipo", "OEM");
    setTotalOEM(countOEM || 0);
    const { count: countIAM } = await supabase.from("piezas_publicadas").select("*", { count: "exact", head: true }).eq("proveedor_id", uid).neq("tipo", "OEM");
    setTotalIAM(countIAM || 0);
  }

  async function solicitarFacturaProveedor(pedido: Pedido) {
    setSolicitandoFactura(pedido.id);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: perfil } = await supabase.from("usuarios").select("nombre_empresa, cif, telefono, direccion, ciudad, codigo_postal").eq("id", user.id).single();
    const productos = pedido.productos || [];
    const proveedorId = productos[0]?.proveedor_id || null;
    let emailProveedor = "info@recambio-directo.com";
    let nombreProveedor = productos[0]?.proveedor_nombre || "Proveedor";
    if (proveedorId) {
      const { data: provPerfil } = await supabase.from("usuarios").select("email, nombre_empresa").eq("id", proveedorId).single();
      if (provPerfil?.email) emailProveedor = provPerfil.email;
      if (provPerfil?.nombre_empresa) nombreProveedor = provPerfil.nombre_empresa;
    }
    try {
      await fetch("/api/send-solicitud-factura", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ pedidoCodigo: pedido.codigo || `#${pedido.id}`, pedidoId: pedido.id, pedidoTotal: pedido.total, pedidoFecha: pedido.created_at, clienteEmail: user.email, clienteNombre: perfil?.nombre_empresa || user.email, clienteCif: perfil?.cif || "-", clienteTelefono: perfil?.telefono || "-", clienteDireccion: [perfil?.direccion, perfil?.ciudad, perfil?.codigo_postal].filter(Boolean).join(", "), proveedorNombre: nombreProveedor, emailProveedor }) });
      alert("✅ Solicitud enviada al proveedor.");
    } catch (e) { alert("Error al enviar la solicitud"); }
    setSolicitandoFactura(null);
  }

  async function subirFactura(pedidoId: number, file: File) {
    setSubiendoFactura(pedidoId);
    const path = `facturas/${pedidoId}/${Date.now()}_${file.name}`;
    const { error: uploadError } = await supabase.storage.from("FACTURAS").upload(path, file, { contentType: "application/pdf" });
    if (uploadError) { alert("Error al subir la factura: " + uploadError.message); setSubiendoFactura(null); return; }
    const { data: urlData } = supabase.storage.from("FACTURAS").getPublicUrl(path);
    await supabase.from("pedidos").update({ factura_url: urlData.publicUrl, factura_nombre: file.name }).eq("id", pedidoId);

    // Notificar al taller por email con la factura adjunta
    try {
      const { data: pedidoData } = await supabase.from("pedidos").select("codigo, total, created_at, cliente_email, cliente_nombre, cliente_id, productos").eq("id", pedidoId).single();
      if (pedidoData?.cliente_email) {
        let emailFacturasTaller = pedidoData.cliente_email;
        if (pedidoData.cliente_id) {
          const { data: tallerPerfil } = await supabase.from("usuarios").select("email_facturas").eq("id", pedidoData.cliente_id).single();
          if (tallerPerfil?.email_facturas) emailFacturasTaller = tallerPerfil.email_facturas;
        }
        await fetch("/api/send-factura-subida", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            pedidoCodigo: pedidoData.codigo || `#${pedidoId}`,
            pedidoId,
            pedidoTotal: pedidoData.total,
            pedidoFecha: pedidoData.created_at,
            clienteEmail: emailFacturasTaller,
            clienteNombre: pedidoData.cliente_nombre || pedidoData.cliente_email,
            proveedorNombre: nombreEmpresa,
            facturaUrl: urlData.publicUrl,
            facturaNombre: file.name,
            productos: pedidoData.productos || [],
          }),
        });
      }
    } catch (e) { console.error("Error enviando email factura:", e); }

    setSubiendoFactura(null);
    cargarDatos();
  }

  function abrirModalAnular(pedido: Pedido) { setModalAnular(pedido); setMotivoSeleccionado(""); }
  async function abrirContactoCliente(pedido: Pedido, e: React.MouseEvent) {
    e.stopPropagation();
    setModalContacto(pedido);
    setDatosContacto(null);
    if (pedido.cliente_id) {
      const { data } = await supabase.from("usuarios").select("nombre_empresa, email, telefono, direccion, ciudad, codigo_postal, cif").eq("id", pedido.cliente_id).single();
      setDatosContacto(data || null);
    }
  }

  async function abrirContactoProveedor(pedido: Pedido, e: React.MouseEvent) {
    e.stopPropagation();
    setModalContacto(pedido);
    setDatosContacto(null);
    const proveedorId = (pedido.productos || [])[0]?.proveedor_id || null;
    if (proveedorId) {
      const { data } = await supabase.from("usuarios").select("nombre_empresa, email, telefono, direccion, ciudad, codigo_postal, cif").eq("id", proveedorId).single();
      setDatosContacto(data || null);
    }
  }

  async function confirmarAnulacion() {
    if (!modalAnular || !motivoSeleccionado) return;
    const pedido = modalAnular;
    setModalAnular(null);
    setAnulandoPedido(pedido.id);
    await supabase.from("pedidos").update({ anulado: true, estado_envio: "anulado", motivo_anulacion: motivoSeleccionado }).eq("id", pedido.id);

    // Anular envío en la agencia si existe
    try {
      await fetch("/api/anular-envio-agencia", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pedidoId: pedido.id }),
      });
    } catch (e) { console.error("Error anulando envío en agencia:", e); }

    setAnulandoPedido(null);
    const { data: { user } } = await supabase.auth.getUser();
    const { data: provPerfil } = await supabase.from("usuarios").select("email, nombre_empresa").eq("id", user?.id || "").single();
    try {
      await fetch("/api/send-anulacion", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ pedidoCodigo: pedido.codigo || `#${pedido.id}`, pedidoId: pedido.id, pedidoTotal: pedido.total, pedidoFecha: pedido.created_at, anuladorTipo: "proveedor", anuladorNombre: nombreEmpresa, clienteEmail: pedido.cliente_email || "", clienteNombre: pedido.cliente_nombre || pedido.cliente_email || "", proveedorEmail: provPerfil?.email || "", proveedorNombre: nombreEmpresa, productos: pedido.productos || [], motivoAnulacion: motivoSeleccionado }) });
    } catch (e) { console.error(e); }
    cargarDatos();
  }

  async function cambiarContrasena() {
    setMensajePass(null);
    if (!passwordActual || !passwordNueva || !passwordNueva2) { setMensajePass({ tipo: "error", texto: "Rellena todos los campos" }); return; }
    if (passwordNueva.length < 6) { setMensajePass({ tipo: "error", texto: "Mínimo 6 caracteres" }); return; }
    if (passwordNueva !== passwordNueva2) { setMensajePass({ tipo: "error", texto: "Las contraseñas no coinciden" }); return; }
    setCambiandoPass(true);
    const { error: loginError } = await supabase.auth.signInWithPassword({ email: emailPerfil, password: passwordActual });
    if (loginError) { setMensajePass({ tipo: "error", texto: "La contraseña actual no es correcta" }); setCambiandoPass(false); return; }
    const { error: updateError } = await supabase.auth.updateUser({ password: passwordNueva });
    setCambiandoPass(false);
    if (updateError) { setMensajePass({ tipo: "error", texto: "Error: " + updateError.message }); return; }
    setMensajePass({ tipo: "ok", texto: "Contraseña cambiada correctamente" });
    setPasswordActual(""); setPasswordNueva(""); setPasswordNueva2("");
    setTimeout(() => { setMostrarCambioPass(false); setMensajePass(null); }, 2500);
  }

  async function guardarHorarios() {
    if (!userId) return;
    setGuardandoHorario(true);
    await supabase.from("usuarios").update({ horario_apertura: horarioApertura, horario_cierre: horarioCierre, dias_apertura: diasApertura }).eq("id", userId);
    setGuardandoHorario(false);
    setHorarioGuardado(true);
    setTimeout(() => setHorarioGuardado(false), 3000);
  }

  function toggleDia(dia: string) { setDiasApertura(prev => prev.includes(dia) ? prev.filter(d => d !== dia) : [...prev, dia]); }

  async function añadirExclusion(tipo: string, valor: string) {
    if (!userId || !valor.trim()) return;
    const { data: existe } = await supabase.from("exclusiones_proveedor").select("id").eq("proveedor_id", userId).eq("tipo", tipo).eq("valor", valor.trim()).maybeSingle();
    if (existe) { alert("Esta exclusión ya existe"); return; }
    await supabase.from("exclusiones_proveedor").insert({ proveedor_id: userId, tipo, valor: valor.trim() });
    if (tipo === "cp") setNuevoCp(""); else setNuevoCliente("");
    const { data } = await supabase.from("exclusiones_proveedor").select("*").eq("proveedor_id", userId).order("created_at", { ascending: false });
    setExclusiones(data || []);
  }

  async function eliminarExclusion(id: number) {
    await supabase.from("exclusiones_proveedor").delete().eq("id", id);
    const { data } = await supabase.from("exclusiones_proveedor").select("*").eq("proveedor_id", userId!).order("created_at", { ascending: false });
    setExclusiones(data || []);
  }

  async function publicarPieza() {
    if (!formReferencia || !formDescripcion || !formPrecio || !formStock || !formMarca) { alert("Rellena todos los campos obligatorios"); return; }
    if (formTipo === "UNIVERSAL" && !formFoto) { alert("Las piezas universales requieren una foto"); return; }
    setGuardandoPieza(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    let fotoUrl: string | null = null;
    if (formTipo === "UNIVERSAL" && formFoto) {
      setSubiendoFoto(true);
      const path = `piezas/${user.id}/${Date.now()}_${formFoto.name}`;
      const { error: uploadError } = await supabase.storage.from("piezas-fotos").upload(path, formFoto, { contentType: formFoto.type });
      if (uploadError) { alert("Error al subir la foto: " + uploadError.message); setGuardandoPieza(false); setSubiendoFoto(false); return; }
      const { data: urlData } = supabase.storage.from("piezas-fotos").getPublicUrl(path);
      fotoUrl = urlData.publicUrl;
      setSubiendoFoto(false);
    }
    const { error } = await supabase.from("piezas_publicadas").insert({ proveedor_id: user.id, proveedor_nombre: nombreEmpresa, referencia: formReferencia.toUpperCase().trim(), descripcion: formDescripcion.toUpperCase().trim(), precio: parseFloat(formPrecio), stock: parseInt(formStock), marca: formMarca.toUpperCase().trim(), provincia: provinciaPerfil || null, tipo: formTipo, foto_url: fotoUrl, origen: "manual" });
    setGuardandoPieza(false);
    if (error) { alert("Error al publicar: " + error.message); return; }
    setFormReferencia(""); setFormDescripcion(""); setFormPrecio(""); setFormStock(""); setFormMarca(""); setFormTipo("OEM"); setFormFoto(null); setFormFotoPreview(null);
    setPiezaGuardada(true);
    setTimeout(() => setPiezaGuardada(false), 3000);
    cargarDatos();
    setSeccion("almacen");
  }

  async function eliminarPieza(id: number) {
    if (!confirm("¿Eliminar esta pieza?")) return;
    await supabase.from("piezas_publicadas").delete().eq("id", id);
    cargarDatos();
  }

  async function guardarEdicion(id: number) {
    await supabase.from("piezas_publicadas").update({ precio: parseFloat(editPrecio), stock: parseInt(editStock) }).eq("id", id);
    setEditandoId(null);
    cargarDatos();
  }

  async function enviarMensaje(pedidoId: number) {
    const texto = nuevoMensaje[pedidoId];
    if (!texto?.trim() || !userId) return;
    const { data: conv } = await supabase.from("conversaciones").select("id").eq("pedido_id", pedidoId).maybeSingle();
    if (conv?.id) {
      await supabase.from("mensajes").insert({ conversacion_id: conv.id, user_id: userId, mensaje: texto.trim(), emisor: "proveedor", leido: false });
      await supabase.from("conversaciones").update({ ultimo_mensaje: texto.trim(), updated_at: new Date().toISOString() }).eq("id", conv.id);
    } else {
      await supabase.from("mensajes_pedido").insert({ pedido_id: pedidoId, emisor: "proveedor", mensaje: texto });
    }
    setNuevoMensaje({ ...nuevoMensaje, [pedidoId]: "" });
    cargarDatos();
  }

  const noLeidas = notifs.filter(n => !n.leido).length;
  const totalFacturado = pedidosRecibidos.filter(p => !p.anulado).reduce((acc, p) => acc + (Number(p.total) || 0), 0);
  const pedidosFiltrados = (pestañaPedidos === "recibidos" ? pedidosRecibidos : pedidosRealizados).filter(p => {
    if (!busquedaPedido) return true;
    const q = busquedaPedido.toLowerCase();
    return String(p.id).includes(q) || (p.codigo || "").toLowerCase().includes(q) || (p.cliente_nombre || "").toLowerCase().includes(q) || (p.cliente_email || "").toLowerCase().includes(q);
  });
  const excCp = exclusiones.filter(e => e.tipo === "cp");
  const excClientes = exclusiones.filter(e => e.tipo === "cliente");
  const piezasFiltradas = piezas;

  return (
    <main style={mainStyle}>
      <header style={proveedorHeaderStyle}>
        <div onClick={() => setSeccion("dashboard")} style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer", flexShrink: 0 }}>
          <div style={{ width: 46, height: 46, borderRadius: 14, background: "linear-gradient(135deg,#2563eb,#1d4ed8)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 18 }}>RD</div>
          <div><p style={{ fontWeight: 900, fontSize: 16, margin: 0 }}>RECAMBIO DIRECTO</p><p style={{ color: "#94a3b8", fontSize: 12, margin: 0 }}>Panel Proveedor</p></div>
        </div>
        <div style={{ display: "flex", flex: 1, maxWidth: 500, margin: "0 24px" }}>
          <input value={busquedaHeader} onChange={e => setBusquedaHeader(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && busquedaHeader.trim()) router.push(`/dashboard/buscar?q=${encodeURIComponent(busquedaHeader)}`); }} placeholder="Buscar referencia OEM, IAM o equivalente..." style={{ flex: 1, background: "#0f172a", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "14px 0 0 14px", padding: "12px 16px", color: "white", fontSize: 14, outline: "none" }} />
          <button onClick={() => { if (busquedaHeader.trim()) router.push(`/dashboard/buscar?q=${encodeURIComponent(busquedaHeader)}`); }} style={{ background: "linear-gradient(135deg,#2563eb,#1d4ed8)", border: "none", borderRadius: "0 14px 14px 0", padding: "12px 18px", color: "white", cursor: "pointer", fontSize: 16 }}>🔍</button>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
          <span style={{ color: "#94a3b8", fontSize: 14, fontWeight: 700 }}>{nombreEmpresa}</span>
          <button onClick={() => router.push("/chat")} style={{ background: "rgba(37,99,235,0.15)", border: "1px solid rgba(37,99,235,0.3)", color: "#60a5fa", padding: "8px 18px", borderRadius: 10, cursor: "pointer", fontWeight: 700, fontSize: 14 }}>💬 Chats</button>
          <button onClick={() => router.push("/checkout")} style={{ position: "relative", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "white", padding: "8px 18px", borderRadius: 10, cursor: "pointer", fontWeight: 700, fontSize: 14 }}>
            🛒 Cesta
            {totalCesta > 0 && <span style={{ position: "absolute", top: -6, right: -6, minWidth: 18, height: 18, borderRadius: 999, background: "#22c55e", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 900, border: "2px solid #020617" }}>{totalCesta}</span>}
          </button>
          <div style={{ position: "relative" as const }}>
            <button onClick={() => {
              setShowNotifs(!showNotifs);
              if (!showNotifs) {
                const uid = userId;
                if (uid) {
                  const VISTAS_KEY = `rd_notif_vistas_prov_${uid}`;
                  localStorage.setItem(VISTAS_KEY, JSON.stringify(notifs.map(n => String(n.id))));
                  const convIds = notifs.filter(n => n.tipo === "chat" && n.conv_id).map(n => n.conv_id);
                  if (convIds.length > 0) { supabase.from("mensajes").update({ leido: true }).in("conversacion_id", [...new Set(convIds)]).neq("user_id", uid); }
                  localStorage.removeItem(`rd_notif_last_prov_${uid}`);
                }
                setNotifs(prev => prev.map(n => ({ ...n, leido: true })));
              }
            }} style={{ width: 42, height: 42, borderRadius: 12, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.05)", color: "white", cursor: "pointer", fontSize: 18, position: "relative" as const }}>
              🔔
              {noLeidas > 0 && <span style={{ position: "absolute" as const, top: -4, right: -4, minWidth: 18, height: 18, borderRadius: 999, background: "#ef4444", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 900, border: "2px solid #020617" }}>{noLeidas > 9 ? "9+" : noLeidas}</span>}
            </button>
            {showNotifs && (
              <div style={{ position: "absolute" as const, right: 0, top: 50, width: 340, background: "#0f172a", borderRadius: 16, border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 20px 50px rgba(0,0,0,0.8)", zIndex: 9999, overflow: "hidden" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                  <span style={{ fontWeight: 800, fontSize: 14 }}>Notificaciones {noLeidas > 0 && <span style={{ background: "#ef4444", color: "white", borderRadius: 999, padding: "1px 8px", fontSize: 11, marginLeft: 6 }}>{noLeidas} nuevas</span>}</span>
                  {notifs.length > 0 && <button onClick={() => setNotifs([])} style={{ background: "transparent", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: 12, fontWeight: 700 }}>Limpiar</button>}
                </div>
                {notifs.length === 0 ? (
                  <div style={{ padding: "32px", textAlign: "center" as const, color: "#94a3b8", fontSize: 14 }}><p style={{ fontSize: 28, marginBottom: 8 }}>🔔</p><p>Sin notificaciones</p></div>
                ) : (
                  <div style={{ maxHeight: 380, overflowY: "auto" as const }}>
                    {notifs.slice(0, 20).map((n, i) => (
                      <div key={`${n.id}-${i}`} onClick={() => { setShowNotifs(false); if (userId) localStorage.removeItem(`rd_notif_last_prov_${userId}`); if (n.tipo === "chat") router.push(n.conv_id ? `/chat?conv=${n.conv_id}` : "/chat"); if (n.tipo === "pedido") setSeccion("pedidos"); }} style={{ display: "flex", alignItems: "flex-start", padding: "12px 16px", cursor: "pointer", borderBottom: "1px solid rgba(255,255,255,0.04)", background: n.leido ? "transparent" : "rgba(37,99,235,0.1)", borderLeft: n.leido ? "3px solid transparent" : "3px solid #2563eb" }}>
                        <span style={{ fontSize: 18, marginRight: 10, flexShrink: 0 }}>{n.tipo === "chat" ? "💬" : "📦"}</span>
                        <div style={{ flex: 1 }}>
                          <p style={{ fontSize: 13, fontWeight: n.leido ? 500 : 700, margin: 0 }}>{n.texto}</p>
                          <p style={{ fontSize: 11, color: "#94a3b8", margin: 0, marginTop: 3 }}>{n.created_at ? new Date(n.created_at).toLocaleString("es-ES", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }) : ""}</p>
                        </div>
                        {!n.leido && <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#2563eb", flexShrink: 0, marginTop: 4 }} />}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
          <button onClick={async () => { await import("../../lib/supabase").then(m => m.supabase.auth.signOut()); router.push("/"); }} style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171", padding: "8px 16px", borderRadius: 10, cursor: "pointer", fontWeight: 700, fontSize: 13 }}>Salir</button>
        </div>
      </header>

      <div style={{ display: "flex", flex: 1 }}>
        <aside style={sidebarStyle}>
          <div>
            <h1 style={logoStyle}>RECAMBIO<br />DIRECTO</h1>
            <p style={logoSub}>Panel Proveedor</p>
            <div style={empresaBadge}>{nombreEmpresa.charAt(0).toUpperCase()}</div>
            <p style={empresaNombreStyle}>{nombreEmpresa}</p>
            {provinciaPerfil && <p style={{ color: "#94a3b8", fontSize: 12, marginTop: 4 }}>📍 {provinciaPerfil}</p>}
            {diasApertura.length > 0 && <div style={horarioBadge}>🕐 {horarioApertura} - {horarioCierre}<div style={{ fontSize: 10, marginTop: 3, color: "#94a3b8" }}>{diasApertura.slice(0, 3).join(", ")}{diasApertura.length > 3 ? "..." : ""}</div></div>}
            {exclusiones.length > 0 && <div style={{ marginTop: 8, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 10, padding: "6px 12px", fontSize: 12, color: "#f87171", fontWeight: 700 }}>🚫 {exclusiones.length} exclusión{exclusiones.length !== 1 ? "es" : ""} activa{exclusiones.length !== 1 ? "s" : ""}</div>}
          </div>
          <nav style={{ marginTop: 30 }}>
            {[
              { key: "dashboard",   label: "📊 Dashboard" },
              { key: "almacen",     label: "📦 Mi Almacén" },
              { key: "publicar",    label: "➕ Publicar Pieza" },
              { key: "importar",    label: "📥 Importar Excel" },
              { key: "pedidos",     label: "🛒 Pedidos" },
              { key: "horarios",    label: "🕐 Horarios" },
              { key: "exclusiones", label: "🚫 Exclusiones" },
              { key: "cuenta",      label: "👤 Mi Cuenta" },
            ].map(({ key, label }) => (
              <div key={key} onClick={() => setSeccion(key as any)} style={seccion === key ? menuItemActive : menuItem}>{label}</div>
            ))}
          </nav>
        </aside>

        <section style={contentStyle}>

          {seccion === "dashboard" && (
            <div>
              <div style={badgeStyle}>PANEL ENTERPRISE</div>
              <h1 style={titleStyle}>PANEL PROVEEDOR</h1>
              <p style={descStyle}>Gestiona tu stock, pedidos recibidos y catálogo de piezas.</p>
              <div style={kpiGrid}>
                <div style={kpiCard}><p style={kpiLabel}>PIEZAS PUBLICADAS</p><h2 style={kpiNumber}>{totalPiezas.toLocaleString()}</h2></div>
                <div style={kpiCard}><p style={kpiLabel}>PEDIDOS RECIBIDOS</p><h2 style={kpiNumber}>{pedidosRecibidos.filter(p => !p.anulado).length}</h2></div>
                <div style={kpiCard}><p style={kpiLabel}>FACTURACIÓN</p><h2 style={{ ...kpiNumber, color: "#22c55e" }}>{totalFacturado.toFixed(0)}€</h2></div>
                <div style={kpiCard}><p style={kpiLabel}>EXCLUSIONES</p><h2 style={{ ...kpiNumber, color: "#f87171" }}>{exclusiones.length}</h2></div>
              </div>
              <div style={quickGrid}>
                <div style={quickCard} onClick={() => setSeccion("publicar")}><div style={quickIcon}>➕</div><h3 style={quickTitle}>Publicar Pieza</h3><p style={quickDesc}>Añade una nueva referencia</p></div>
                <div style={quickCard} onClick={() => setSeccion("importar")}><div style={quickIcon}>📥</div><h3 style={quickTitle}>Importar Excel</h3><p style={quickDesc}>Sube tu catálogo completo</p></div>
                <div style={quickCard} onClick={() => setSeccion("exclusiones")}><div style={quickIcon}>🚫</div><h3 style={quickTitle}>Exclusiones</h3><p style={quickDesc}>Controla quién ve tus precios</p></div>
              </div>
            </div>
          )}

          {seccion === "almacen" && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
                <div><div style={badgeStyle}>MI ALMACÉN</div><h1 style={titleStyle}>STOCK PUBLICADO</h1><p style={{ color: "#94a3b8", fontSize: 18 }}>Piezas disponibles en el marketplace.</p></div>
                <div style={{ background: "rgba(15,23,42,0.95)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 20, padding: "20px 32px", textAlign: "center" as const, flexShrink: 0 }}>
                  <p style={{ color: "#94a3b8", fontSize: 12, fontWeight: 700, marginBottom: 8 }}>REFERENCIAS SUBIDAS</p>
                  <h2 style={{ fontSize: 48, fontWeight: 900, color: "#60a5fa", margin: 0 }}>{totalPiezas.toLocaleString()}</h2>
                </div>
              </div>
              {piezaGuardada && <div style={successBanner}>✅ Pieza publicada correctamente</div>}
              <div style={{ display: "flex", gap: 0, marginBottom: 20, background: "rgba(15,23,42,0.95)", borderRadius: 14, padding: 5, width: "fit-content", border: "1px solid rgba(255,255,255,0.06)" }}>
                {[
                  { key: "todos", label: `📦 Todas (${totalPiezas.toLocaleString()})`, bg: undefined },
                  { key: "oem",   label: `🔵 OEM (${totalOEM.toLocaleString()})`, bg: "linear-gradient(135deg,#2563eb,#1d4ed8)" },
                  { key: "iam",   label: `🟣 IAM (${totalIAM.toLocaleString()})`, bg: "linear-gradient(135deg,#7c3aed,#6d28d9)" },
                ].map(({ key, label, bg }) => (
                  <button key={key} onClick={async () => {
                    setPestañaAlmacen(key as any);
                    const { data: { user } } = await supabase.auth.getUser();
                    if (user) {
                      await recargarContadores(user.id);
                      cargarPiezasPaginadas(user.id, 1, busquedaAlmacen, key === "todos" ? undefined : key);
                    }
                  }} style={{ padding: "10px 22px", borderRadius: 10, fontWeight: 700, cursor: "pointer", fontSize: 14, border: "none", background: pestañaAlmacen === key ? (bg || "rgba(255,255,255,0.1)") : "transparent", color: pestañaAlmacen === key ? "white" : "#94a3b8" }}>{label}</button>
                ))}
              </div>
              <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" as const, alignItems: "center" }}>
                <button onClick={() => setSeccion("publicar")} style={addButton}>➕ PUBLICAR NUEVA PIEZA</button>
                <button onClick={() => setSeccion("importar")} style={importButton}>📥 IMPORTAR EXCEL</button>
                <div style={{ flex: 1, display: "flex", gap: 8, minWidth: 280 }}>
                  <input placeholder="Buscar por referencia, descripción o marca..." value={busquedaInput} onChange={e => setBusquedaInput(e.target.value)} onKeyDown={async e => { if (e.key === "Enter") { setBusquedaAlmacen(busquedaInput); const { data: { user } } = await supabase.auth.getUser(); if (user) cargarPiezasPaginadas(user.id, 1, busquedaInput, pestañaAlmacen === "todos" ? undefined : pestañaAlmacen); } }} style={{ flex: 1, background: "#0f172a", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: "12px 16px", color: "white", fontSize: 14, outline: "none" }} />
                  <button onClick={async () => { setBusquedaAlmacen(busquedaInput); const { data: { user } } = await supabase.auth.getUser(); if (user) cargarPiezasPaginadas(user.id, 1, busquedaInput, pestañaAlmacen === "todos" ? undefined : pestañaAlmacen); }} style={{ background: "linear-gradient(135deg,#2563eb,#1d4ed8)", border: "none", color: "white", padding: "12px 20px", borderRadius: 12, fontWeight: 700, cursor: "pointer", fontSize: 14 }}>🔍</button>
                  {busquedaAlmacen && <button onClick={async () => { setBusquedaInput(""); setBusquedaAlmacen(""); const { data: { user } } = await supabase.auth.getUser(); if (user) cargarPiezasPaginadas(user.id, 1, "", pestañaAlmacen === "todos" ? undefined : pestañaAlmacen); }} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#94a3b8", padding: "12px 16px", borderRadius: 12, cursor: "pointer", fontSize: 13, fontWeight: 700 }}>✕ Limpiar</button>}
                </div>
              </div>
              {busquedaAlmacen && <div style={{ color: "#94a3b8", fontSize: 13, marginBottom: 12 }}>{piezasFiltradas.length} resultado{piezasFiltradas.length !== 1 ? "s" : ""} para "<strong style={{ color: "white" }}>{busquedaAlmacen}</strong>"</div>}
              {piezasFiltradas.length === 0 ? (
                <div style={emptyState}><p style={{ fontSize: 60 }}>📦</p><p style={{ fontSize: 22, fontWeight: 700, marginTop: 20 }}>{busquedaAlmacen ? `Sin resultados para "${busquedaAlmacen}"` : "No tienes piezas publicadas"}</p></div>
              ) : (
                <>
                  <div style={tableContainer}>
                    <table style={tableStyle}>
                      <thead><tr>{["REFERENCIA","TIPO","DESCRIPCIÓN","MARCA","PRECIO","IMP/CASCO","STOCK","PROVINCIA","ACCIONES"].map(h => <th key={h} style={thStyle}>{h}</th>)}</tr></thead>
                      <tbody>
                        {piezasFiltradas.map(pieza => (
                          <tr key={pieza.id} style={trStyle}>
                            <td style={tdStyle}><strong>{pieza.referencia}</strong></td>
                            <td style={tdStyle}><span style={{ background: (pieza as any).tipo === "OEM" ? "rgba(37,99,235,0.2)" : "rgba(139,92,246,0.2)", color: (pieza as any).tipo === "OEM" ? "#60a5fa" : "#a78bfa", padding: "3px 10px", borderRadius: 999, fontSize: 12, fontWeight: 700 }}>{(pieza as any).tipo || "IAM"}</span></td>
                            <td style={tdStyle}>{pieza.descripcion}</td>
                            <td style={tdStyle}>{pieza.marca || "-"}</td>
                            <td style={tdStyle}>{editandoId === pieza.id ? <input value={editPrecio} onChange={e => setEditPrecio(e.target.value)} style={miniInput} type="number" /> : <span style={{ color: "#22c55e", fontWeight: 900 }}>{pieza.precio}€</span>}</td>
                            <td style={tdStyle}>{(pieza as any).impuesto > 0 ? <span style={{ color: "#fbbf24", fontWeight: 700, fontSize: 13 }}>+{Number((pieza as any).impuesto).toFixed(2)}€</span> : <span style={{ color: "#475569" }}>—</span>}</td>
                            <td style={tdStyle}>{editandoId === pieza.id ? <input value={editStock} onChange={e => setEditStock(e.target.value)} style={miniInput} type="number" /> : <span style={stockBadge}>{pieza.stock} uds</span>}</td>
                            <td style={tdStyle}>{pieza.provincia || "-"}</td>
                            <td style={tdStyle}>
                              {editandoId === pieza.id ? <button onClick={() => guardarEdicion(pieza.id)} style={btnGuardar}>✓ OK</button> : <button onClick={() => { setEditandoId(pieza.id); setEditPrecio(String(pieza.precio)); setEditStock(String(pieza.stock)); }} style={btnEditar}>✏️</button>}
                              <button onClick={() => eliminarPieza(pieza.id)} style={btnEliminar}>🗑️</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {totalPiezas > 100 && (
                    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 8, marginTop: 20 }}>
                      <button disabled={paginaActual === 1} onClick={async () => { const { data: { user } } = await supabase.auth.getUser(); if (user) cargarPiezasPaginadas(user.id, paginaActual - 1, busquedaAlmacen, pestañaAlmacen === "todos" ? undefined : pestañaAlmacen); }} style={{ ...btnPagina, opacity: paginaActual === 1 ? 0.3 : 1 }}>← Anterior</button>
                      <span style={{ color: "#94a3b8", fontSize: 14, padding: "0 16px" }}>Página <strong style={{ color: "white" }}>{paginaActual}</strong> de <strong style={{ color: "white" }}>{Math.ceil(totalPiezas / 100)}</strong><span style={{ marginLeft: 12, color: "#60a5fa" }}>({totalPiezas.toLocaleString()} refs)</span></span>
                      <button disabled={paginaActual >= Math.ceil(totalPiezas / 100)} onClick={async () => { const { data: { user } } = await supabase.auth.getUser(); if (user) cargarPiezasPaginadas(user.id, paginaActual + 1, busquedaAlmacen, pestañaAlmacen === "todos" ? undefined : pestañaAlmacen); }} style={{ ...btnPagina, opacity: paginaActual >= Math.ceil(totalPiezas / 100) ? 0.3 : 1 }}>Siguiente →</button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {seccion === "publicar" && (
            <div>
              <div style={badgeStyle}>NUEVO ARTÍCULO</div>
              <h1 style={titleStyle}>PUBLICAR PIEZA</h1>
              <p style={descStyle}>Añade una referencia a tu catálogo.</p>
              {provinciaPerfil ? <div style={provinciaInfo}>📍 Provincia asignada: <strong>{provinciaPerfil}</strong></div> : <div style={provinciaAviso}>⚠️ Sin provincia. <a href="/perfil" style={{ color: "#fbbf24" }}>Ve a Mi Cuenta</a></div>}
              <div style={formCard}>
                <div style={{ marginBottom: 24 }}>
                  <p style={formLabel}>Tipo de referencia *</p>
                  <div style={{ display: "flex", gap: 10 }}>
                    {["OEM", "IAM", "UNIVERSAL"].map(t => (
                      <button key={t} onClick={() => { setFormTipo(t); setFormFoto(null); setFormFotoPreview(null); }} style={{ padding: "10px 20px", borderRadius: 12, fontWeight: 700, cursor: "pointer", fontSize: 14, background: formTipo === t ? (t === "OEM" ? "rgba(37,99,235,0.3)" : t === "IAM" ? "rgba(139,92,246,0.3)" : "rgba(22,163,74,0.3)") : "rgba(255,255,255,0.05)", border: formTipo === t ? (t === "OEM" ? "1px solid rgba(37,99,235,0.6)" : t === "IAM" ? "1px solid rgba(139,92,246,0.6)" : "1px solid rgba(22,163,74,0.6)") : "1px solid rgba(255,255,255,0.08)", color: formTipo === t ? (t === "OEM" ? "#60a5fa" : t === "IAM" ? "#a78bfa" : "#4ade80") : "#94a3b8" }}>{t}</button>
                    ))}
                  </div>
                  {formTipo === "UNIVERSAL" && <div style={{ marginTop: 12, background: "rgba(22,163,74,0.08)", border: "1px solid rgba(22,163,74,0.2)", borderRadius: 10, padding: "10px 14px", color: "#4ade80", fontSize: 13 }}>⚠️ Las piezas universales requieren foto obligatoria</div>}
                </div>
                <div style={formGrid}>
                  <div><p style={formLabel}>Referencia *</p><input placeholder="Ej: W79..." value={formReferencia} onChange={e => setFormReferencia(e.target.value)} style={formInput} /></div>
                  <div><p style={formLabel}>Marca *</p><input placeholder="Ej: MANN, BOSCH..." value={formMarca} onChange={e => setFormMarca(e.target.value)} style={formInput} /></div>
                </div>
                <div style={{ marginTop: 24 }}><p style={formLabel}>Descripción *</p><input placeholder="Ej: FILTRO DE ACEITE MANN W79" value={formDescripcion} onChange={e => setFormDescripcion(e.target.value)} style={formInput} /></div>
                <div style={{ ...formGrid, marginTop: 24 }}>
                  <div><p style={formLabel}>Precio (€) *</p><input placeholder="5.42" value={formPrecio} onChange={e => setFormPrecio(e.target.value)} style={formInput} type="number" step="0.01" /></div>
                  <div><p style={formLabel}>Stock *</p><input placeholder="12" value={formStock} onChange={e => setFormStock(e.target.value)} style={formInput} type="number" /></div>
                </div>
                {formTipo === "UNIVERSAL" && (
                  <div style={{ marginTop: 24 }}>
                    <p style={formLabel}>Foto de la pieza * <span style={{ color: "#f87171", fontSize: 12 }}>(obligatoria para Universal)</span></p>
                    {formFotoPreview ? (
                      <div style={{ position: "relative", display: "inline-block" }}>
                        <img src={formFotoPreview} alt="Preview" style={{ width: 200, height: 150, objectFit: "cover", borderRadius: 12, border: "1px solid rgba(255,255,255,0.1)" }} />
                        <button onClick={() => { setFormFoto(null); setFormFotoPreview(null); }} style={{ position: "absolute", top: 6, right: 6, background: "rgba(239,68,68,0.8)", border: "none", color: "white", width: 26, height: 26, borderRadius: "50%", cursor: "pointer", fontWeight: 900, fontSize: 14 }}>✕</button>
                      </div>
                    ) : (
                      <label style={{ display: "flex", alignItems: "center", gap: 10, background: "rgba(22,163,74,0.1)", border: "2px dashed rgba(22,163,74,0.4)", borderRadius: 14, padding: "20px 24px", cursor: "pointer", color: "#4ade80", fontWeight: 700 }}>
                        📸 Subir foto (JPG, PNG)
                        <input type="file" accept="image/*" style={{ display: "none" }} onChange={e => { const file = e.target.files?.[0]; if (!file) return; setFormFoto(file); setFormFotoPreview(URL.createObjectURL(file)); }} />
                      </label>
                    )}
                  </div>
                )}
                <div style={{ marginTop: 34, display: "flex", gap: 16 }}>
                  <button onClick={publicarPieza} disabled={guardandoPieza || subiendoFoto} style={{ ...publishButton, opacity: (guardandoPieza || subiendoFoto) ? 0.7 : 1 }}>{subiendoFoto ? "SUBIENDO FOTO..." : guardandoPieza ? "PUBLICANDO..." : "✓ PUBLICAR"}</button>
                  <button onClick={() => setSeccion("almacen")} style={cancelButton}>Cancelar</button>
                </div>
              </div>
            </div>
          )}

          {seccion === "importar" && userId && (
            <div>
              <div style={badgeStyle}>IMPORTACIÓN MASIVA</div>
              <h1 style={titleStyle}>SUBIR STOCK</h1>
              <p style={descStyle}>Importa tu catálogo desde Excel.</p>
              <div style={{ background: "rgba(15,23,42,0.95)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 28, padding: 40, marginBottom: 30 }}>
                <ImportarStock proveedorId={userId} proveedorNombre={nombreEmpresa} onImportado={async () => {
                  const { data: { user } } = await supabase.auth.getUser();
                  if (user) {
                    await recargarContadores(user.id);
                    cargarPiezasPaginadas(user.id, 1, "");
                  }
                  setTimeout(() => setSeccion("almacen"), 3000);
                }} />
              </div>
            </div>
          )}

          {seccion === "pedidos" && (
            <div>
              <div style={badgeStyle}>GESTIÓN</div>
              <h1 style={titleStyle}>PEDIDOS</h1>
              <div style={tabsContainer}>
                <button onClick={() => setPestañaPedidos("recibidos")} style={pestañaPedidos === "recibidos" ? tabActive : tabInactive}>📥 Recibidos ({pedidosRecibidos.length})</button>
                <button onClick={() => setPestañaPedidos("realizados")} style={pestañaPedidos === "realizados" ? tabActive : tabInactive}>📤 Realizados ({pedidosRealizados.length})</button>
              </div>
              <div style={searchRow}><input placeholder="Buscar por código, referencia o comprador..." value={busquedaPedido} onChange={e => setBusquedaPedido(e.target.value)} style={searchInput} /></div>
              {pedidosFiltrados.length === 0 ? (
                <div style={emptyState}><p style={{ fontSize: 48 }}>🛒</p><p style={{ fontSize: 20, fontWeight: 700, marginTop: 16 }}>No hay pedidos</p></div>
              ) : (
                <div style={tableContainer}>
                  <table style={tableStyle}>
                    <thead>
                      <tr style={{ background: "rgba(0,0,0,0.3)" }}>
                        {["CÓDIGO PEDIDO","REFERENCIA / DESCRIPCIÓN","TOTAL",pestañaPedidos === "recibidos" ? "COMPRADOR" : "PROVEEDOR","FECHA","TRANSPORTE","TRACKING","ESTADO","ACCIONES"].map(h => <th key={h} style={thStyle}>{h}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {pedidosFiltrados.map(pedido => {
                        const productos = pedido.productos || [];
                        const mensajesPedido = mensajes.filter(m => m.pedido_id === pedido.id);
                        const expandido = pedidoExpandido === pedido.id;
                        const puedeAnular = !pedido.anulado && !["enviado", "entregado"].includes(pedido.estado_envio || "");
                        const trackingInfo = getTrackingInfo(pedido);
                        const agencia = pedido.agencia || pedido.transporte || "";
                        const esSeur = agencia.toLowerCase().includes("seur");
                        const esNacex = agencia.toLowerCase().includes("nacex");
                        const esMrw = agencia.toLowerCase().includes("mrw");
                        return (
                          <React.Fragment key={pedido.id}>
                            <tr style={{ ...trStyle, cursor: "pointer", opacity: pedido.anulado ? 0.6 : 1 }} onClick={() => setPedidoExpandido(expandido ? null : pedido.id)}>
                              <td style={tdStyle}><div style={{ color: pedido.anulado ? "#f87171" : "#60a5fa", fontWeight: 700, fontSize: 13 }}>{pedido.codigo || `RD-${pedido.id}`}</div><div style={{ color: "#94a3b8", fontSize: 11, marginTop: 2 }}>#{pedido.id}</div></td>
                              <td style={tdStyle}>{productos.slice(0, 2).map((p: any, i: number) => (<div key={i} style={{ fontSize: 13, marginBottom: 2 }}><strong>{p.referencia}</strong><span style={{ color: "#94a3b8", marginLeft: 6 }}>{p.descripcion}</span></div>))}{productos.length > 2 && <div style={{ color: "#94a3b8", fontSize: 11 }}>+{productos.length - 2} más</div>}</td>
                              <td style={tdStyle}><span style={{ color: "#22c55e", fontWeight: 900 }}>{Number(pedido.total).toFixed(2)}€</span></td>
                              <td style={tdStyle}>
  {pestañaPedidos === "recibidos" ? (
    <button onClick={e => abrirContactoCliente(pedido, e)} style={{ background: "none", border: "none", cursor: "pointer", textAlign: "left", padding: 0 }}>
      <div style={{ fontWeight: 700, fontSize: 14, color: "#60a5fa", textDecoration: "underline dotted" }}>{pedido.cliente_nombre || pedido.cliente_email || "-"}</div>
      {pedido.cliente_email && pedido.cliente_nombre && <div style={{ color: "#94a3b8", fontSize: 12 }}>{pedido.cliente_email}</div>}
      <div style={{ color: "#475569", fontSize: 11, marginTop: 2 }}>👁 Ver contacto</div>
    </button>
  ) : (
    <button onClick={e => abrirContactoProveedor(pedido, e)} style={{ background: "none", border: "none", cursor: "pointer", textAlign: "left", padding: 0 }}>
      <div style={{ fontWeight: 700, fontSize: 14, color: "#60a5fa", textDecoration: "underline dotted" }}>{(pedido.productos || [])[0]?.proveedor_nombre || "-"}</div>
      <div style={{ color: "#475569", fontSize: 11, marginTop: 2 }}>👁 Ver contacto</div>
    </button>
  )}
</td>
                              <td style={tdStyle}><div style={{ fontSize: 13 }}>{pedido.created_at ? new Date(pedido.created_at).toLocaleDateString("es-ES") : "-"}</div><div style={{ color: "#94a3b8", fontSize: 11 }}>{pedido.created_at ? new Date(pedido.created_at).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" }) : ""}</div></td>
                              <td style={tdStyle}><LogoAgencia agencia={agencia} /></td>
                              <td style={tdStyle}>
                                {trackingInfo
                                  ? <a href={trackingInfo.url} target="_blank" rel="noopener noreferrer" style={{ color: "#60a5fa", fontWeight: 700, fontSize: 13, textDecoration: "none" }} onClick={e => e.stopPropagation()}>{trackingInfo.tracking}</a>
                                  : <span style={{ color: "#94a3b8", fontSize: 13 }}>Sin tracking</span>
                                }
                              </td>
                              <td style={tdStyle}><EstadoEnvio estado={pedido.estado_envio} anulado={pedido.anulado} /></td>
                              <td style={tdStyle}><button onClick={e => { e.stopPropagation(); setPedidoExpandido(expandido ? null : pedido.id); }} style={btnAccion}>{expandido ? "▲ Cerrar" : "▼ Detalle"}</button></td>
                            </tr>
                            {expandido && (
                              <tr key={`exp-${pedido.id}`}><td colSpan={9} style={{ padding: 0 }}>
                                <div style={expandedRow}>
                                  <div style={{ marginBottom: 16 }}>
                                    <h4 style={{ fontWeight: 800, marginBottom: 12, color: "#60a5fa" }}>💬 Chat del pedido #{pedido.id}{mensajesPedido.length > 0 && <span style={{ marginLeft: 10, background: "rgba(37,99,235,0.2)", color: "#60a5fa", padding: "2px 10px", borderRadius: 999, fontSize: 12 }}>{mensajesPedido.length} mensaje{mensajesPedido.length !== 1 ? "s" : ""}</span>}</h4>
                                    {mensajesPedido.length > 0 && (
                                      <div style={{ ...chatBox, maxHeight: 120, marginBottom: 12 }}>
                                        {mensajesPedido.slice(-2).map(m => {
                                          const esProveedor = m.user_id === userId || m.emisor === "proveedor";
                                          return (
                                            <div key={m.id} style={{ display: "flex", justifyContent: esProveedor ? "flex-end" : "flex-start", marginBottom: 6 }}>
                                              <div style={{ background: esProveedor ? "linear-gradient(135deg,#2563eb,#1d4ed8)" : "#1e293b", padding: "8px 14px", borderRadius: esProveedor ? "14px 14px 4px 14px" : "14px 14px 14px 4px", maxWidth: "70%", fontSize: 13 }}>
                                                <p style={{ margin: 0 }}>{m.mensaje}</p>
                                                {m.created_at && <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 10, margin: "4px 0 0", textAlign: esProveedor ? "right" : "left" }}>{new Date(m.created_at).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}</p>}
                                              </div>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    )}
                                    <button onClick={async () => {
                                      const { data: conv } = await supabase.from("conversaciones").select("id").eq("pedido_id", pedido.id).maybeSingle();
                                      if (conv?.id) router.push(`/chat?conv=${conv.id}`);
                                      else {
                                        const { data: nuevaConv } = await supabase.from("conversaciones").insert({ user1_id: userId, user2_id: pedido.cliente_id || pedido.comprador_id || "", pedido_id: pedido.id, referencia: `Pedido #${pedido.id}${pedido.codigo ? ` — ${pedido.codigo}` : ""}`, ultimo_mensaje: "", updated_at: new Date().toISOString() }).select("id").single();
                                        if (nuevaConv?.id) router.push(`/chat?conv=${nuevaConv.id}`);
                                      }
                                    }} style={btnAbrirChat}>💬 {mensajesPedido.length > 0 ? "Ver conversación" : "Abrir chat"}</button>
                                  </div>
                                  {!pedido.anulado && (
                                    <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" as const }}>
                                      <div style={{ marginBottom: 16, display: "flex", gap: 10, flexWrap: "wrap" as const }}>
                                        {pedido.albaran_url && <a href={pedido.albaran_url} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(37,99,235,0.15)", border: "1px solid rgba(37,99,235,0.3)", color: "#60a5fa", padding: "8px 14px", borderRadius: 8, fontWeight: 700, fontSize: 12, textDecoration: "none" }}>📄 Albarán cliente</a>}
                                        {pestañaPedidos === "recibidos" && esNacex && pedido.etiqueta_nacex_url && <a href={pedido.etiqueta_nacex_url} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(234,179,8,0.15)", border: "1px solid rgba(234,179,8,0.3)", color: "#fde047", padding: "8px 14px", borderRadius: 8, fontWeight: 700, fontSize: 12, textDecoration: "none" }}>🟡 Etiqueta NACEX</a>}
                                        {pestañaPedidos === "recibidos" && esSeur && pedido.etiqueta_seur_url && <a href={pedido.etiqueta_seur_url} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(245,168,0,0.15)", border: "1px solid rgba(245,168,0,0.3)", color: "#F5A800", padding: "8px 14px", borderRadius: 8, fontWeight: 700, fontSize: 12, textDecoration: "none" }}>🟠 Etiqueta SEUR</a>}
                                        {pestañaPedidos === "recibidos" && esMrw && pedido.etiqueta_envio_url && <a href={pedido.etiqueta_envio_url} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(227,6,19,0.15)", border: "1px solid rgba(227,6,19,0.3)", color: "#E30613", padding: "8px 14px", borderRadius: 8, fontWeight: 700, fontSize: 12, textDecoration: "none" }}>🔴 Etiqueta MRW</a>}
                                        {pestañaPedidos === "recibidos" && !esNacex && !esSeur && !esMrw && pedido.etiqueta_envio_url && <a href={pedido.etiqueta_envio_url} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(220,38,38,0.15)", border: "1px solid rgba(220,38,38,0.3)", color: "#f87171", padding: "8px 14px", borderRadius: 8, fontWeight: 700, fontSize: 12, textDecoration: "none" }}>📦 Etiqueta de envío</a>}
                                      </div>
                                      <div style={{ flex: 1 }}>
                                        <p style={{ color: "#94a3b8", fontSize: 12, fontWeight: 700, marginBottom: 10 }}>📄 FACTURA</p>
                                        {pestañaPedidos === "recibidos" ? (
                                          pedido.factura_url ? (
                                            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                              <span style={{ color: "#4ade80", fontSize: 13, fontWeight: 700 }}>✅ Factura subida</span>
                                              <a href={pedido.factura_url} target="_blank" rel="noopener noreferrer" style={{ color: "#60a5fa", fontSize: 13, fontWeight: 700 }}>Ver PDF</a>
                                              <label style={btnSubirFactura}>🔄 Reemplazar<input type="file" accept=".pdf" style={{ display: "none" }} onChange={e => { if (e.target.files?.[0]) subirFactura(pedido.id, e.target.files[0]); }} /></label>
                                            </div>
                                          ) : (
                                            <label style={{ ...btnSubirFactura, opacity: subiendoFactura === pedido.id ? 0.7 : 1 }}>
                                              {subiendoFactura === pedido.id ? "⏳ Subiendo..." : "📤 Subir factura PDF"}
                                              <input type="file" accept=".pdf" style={{ display: "none" }} disabled={subiendoFactura === pedido.id} onChange={e => { if (e.target.files?.[0]) subirFactura(pedido.id, e.target.files[0]); }} />
                                            </label>
                                          )
                                        ) : (
                                          pedido.factura_url ? (
                                            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                              <span style={{ color: "#4ade80", fontSize: 13, fontWeight: 700 }}>✅ Factura disponible</span>
                                              <a href={pedido.factura_url} target="_blank" rel="noopener noreferrer" style={{ color: "#60a5fa", fontSize: 13, fontWeight: 700 }}>Descargar PDF</a>
                                            </div>
                                          ) : (
                                            <button onClick={() => solicitarFacturaProveedor(pedido)} disabled={solicitandoFactura === pedido.id} style={{ ...btnSubirFactura, opacity: solicitandoFactura === pedido.id ? 0.7 : 1, background: "rgba(139,92,246,0.15)", border: "1px solid rgba(139,92,246,0.3)", cursor: "pointer" }}>
                                              {solicitandoFactura === pedido.id ? "Enviando..." : "🧾 Solicitar factura"}
                                            </button>
                                          )
                                        )}
                                      </div>
                                      {puedeAnular && <button onClick={() => abrirModalAnular(pedido)} disabled={anulandoPedido === pedido.id} style={{ ...btnAnular, opacity: anulandoPedido === pedido.id ? 0.7 : 1 }}>{anulandoPedido === pedido.id ? "Anulando..." : "❌ Anular pedido"}</button>}
                                    </div>
                                  )}
                                  {pedido.anulado && <div style={{ marginTop: 16, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 10, padding: "12px 16px", color: "#f87171", fontSize: 13, fontWeight: 700 }}>❌ Este pedido fue anulado</div>}
                                </div>
                              </td></tr>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {seccion === "horarios" && (
            <div>
              <div style={badgeStyle}>CONFIGURACIÓN</div>
              <h1 style={titleStyle}>HORARIOS DE APERTURA</h1>
              <p style={descStyle}>Indica cuándo está abierto tu negocio. Visible para los talleres.</p>
              {horarioGuardado && <div style={successBanner}>✅ Horario guardado correctamente</div>}
              <div style={formCard}>
                <p style={formLabel}>Días de apertura</p>
                <div style={diasGrid}>{DIAS_SEMANA.map(dia => (<button key={dia} onClick={() => toggleDia(dia)} style={{ ...diaBtnBase, background: diasApertura.includes(dia) ? "linear-gradient(135deg,#2563eb,#1d4ed8)" : "rgba(255,255,255,0.05)", border: diasApertura.includes(dia) ? "none" : "1px solid rgba(255,255,255,0.1)", color: diasApertura.includes(dia) ? "white" : "#94a3b8" }}>{dia}</button>))}</div>
                <div style={{ ...formGrid, marginTop: 30 }}>
                  <div><p style={formLabel}>Hora apertura</p><input type="time" value={horarioApertura} onChange={e => setHorarioApertura(e.target.value)} style={formInput} /></div>
                  <div><p style={formLabel}>Hora cierre</p><input type="time" value={horarioCierre} onChange={e => setHorarioCierre(e.target.value)} style={formInput} /></div>
                </div>
                <div style={horarioPreview}>
                  <p style={{ color: "#94a3b8", fontSize: 13, marginBottom: 8 }}>VISTA PREVIA</p>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}><span style={{ fontSize: 24 }}>🕐</span><div><p style={{ fontWeight: 800, fontSize: 18 }}>{horarioApertura} - {horarioCierre}</p><p style={{ color: "#94a3b8", fontSize: 13, marginTop: 4 }}>{diasApertura.length === 0 ? "Sin días" : diasApertura.join(", ")}</p></div></div>
                </div>
                <button onClick={guardarHorarios} disabled={guardandoHorario} style={{ ...publishButton, marginTop: 24, opacity: guardandoHorario ? 0.7 : 1 }}>{guardandoHorario ? "GUARDANDO..." : "✓ GUARDAR HORARIOS"}</button>
              </div>
            </div>
          )}

          {seccion === "exclusiones" && (
            <div>
              <div style={{ ...badgeStyle, background: "rgba(239,68,68,0.18)", color: "#f87171" }}>PRIVACIDAD</div>
              <h1 style={titleStyle}>EXCLUSIONES</h1>
              <p style={descStyle}>Controla quién puede ver tus precios y stock.</p>
              <div style={{ display: "flex", gap: 14, alignItems: "flex-start", background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: 16, padding: "16px 20px", marginBottom: 28, color: "#fbbf24" }}><span style={{ fontSize: 20 }}>🔒</span><p style={{ fontSize: 14, lineHeight: 1.6 }}>Los talleres excluidos no verán tus piezas en el buscador.</p></div>
              <div style={{ ...tabsContainer, marginBottom: 24 }}>
                <button onClick={() => setTabExclusiones("cp")} style={tabExclusiones === "cp" ? { ...tabActive, background: "linear-gradient(135deg,#dc2626,#991b1b)" } : tabInactive}>📮 Códigos Postales ({excCp.length})</button>
                <button onClick={() => setTabExclusiones("cliente")} style={tabExclusiones === "cliente" ? { ...tabActive, background: "linear-gradient(135deg,#dc2626,#991b1b)" } : tabInactive}>👤 Clientes concretos ({excClientes.length})</button>
              </div>
              {tabExclusiones === "cp" && (
                <div style={{ background: "rgba(15,23,42,0.95)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 24, padding: 32 }}>
                  <h3 style={{ fontWeight: 800, fontSize: 20, marginBottom: 8 }}>Excluir por Código Postal</h3>
                  <p style={{ color: "#94a3b8", fontSize: 14, marginBottom: 24 }}>Los talleres con estos CPs no verán tus piezas ni precios.</p>
                  <div style={{ display: "flex", gap: 12, marginBottom: 24 }}>
                    <input placeholder="Ej: 41001" value={nuevoCp} onChange={e => setNuevoCp(e.target.value.replace(/\D/g, "").slice(0, 5))} onKeyDown={e => e.key === "Enter" && añadirExclusion("cp", nuevoCp)} style={{ flex: 1, background: "#020617", color: "white", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 14, padding: "14px 18px", fontSize: 15, outline: "none" }} maxLength={5} />
                    <button onClick={() => añadirExclusion("cp", nuevoCp)} disabled={nuevoCp.length < 4} style={{ background: "linear-gradient(135deg,#dc2626,#991b1b)", border: "none", color: "white", padding: "14px 24px", borderRadius: 14, fontWeight: 800, cursor: "pointer", fontSize: 15, opacity: nuevoCp.length < 4 ? 0.5 : 1 }}>+ Excluir CP</button>
                  </div>
                  {excCp.length === 0 ? <div style={{ textAlign: "center", padding: "40px 0", color: "#94a3b8" }}><p style={{ fontSize: 40, marginBottom: 12 }}>📮</p><p>No hay códigos postales excluidos</p></div> : <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>{excCp.map(exc => (<div key={exc.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#0f172a", borderRadius: 12, padding: "14px 18px", border: "1px solid rgba(255,255,255,0.06)" }}><div style={{ display: "flex", alignItems: "center", gap: 10 }}><span style={{ background: "rgba(239,68,68,0.15)", color: "#f87171", padding: "4px 12px", borderRadius: 999, fontWeight: 700, fontSize: 14 }}>CP {exc.valor}</span><span style={{ color: "#94a3b8", fontSize: 13 }}>Añadido {new Date(exc.created_at).toLocaleDateString("es-ES")}</span></div><button onClick={() => eliminarExclusion(exc.id)} style={{ background: "rgba(239,68,68,0.1)", color: "#f87171", border: "none", padding: "8px 14px", borderRadius: 8, cursor: "pointer", fontWeight: 700, fontSize: 13 }}>🗑️ Eliminar</button></div>))}</div>}
                </div>
              )}
              {tabExclusiones === "cliente" && (
                <div style={{ background: "rgba(15,23,42,0.95)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 24, padding: 32 }}>
                  <h3 style={{ fontWeight: 800, fontSize: 20, marginBottom: 8 }}>Excluir clientes concretos</h3>
                  <p style={{ color: "#94a3b8", fontSize: 14, marginBottom: 24 }}>Busca y excluye talleres específicos por email.</p>
                  <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
                    <input placeholder="Email o nombre del taller..." value={nuevoCliente} onChange={e => setNuevoCliente(e.target.value)} onKeyDown={e => e.key === "Enter" && añadirExclusion("cliente", nuevoCliente)} style={{ flex: 1, background: "#020617", color: "white", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 14, padding: "14px 18px", fontSize: 15, outline: "none" }} />
                    <button onClick={() => añadirExclusion("cliente", nuevoCliente)} disabled={!nuevoCliente.trim()} style={{ background: "linear-gradient(135deg,#dc2626,#991b1b)", border: "none", color: "white", padding: "14px 24px", borderRadius: 14, fontWeight: 800, cursor: "pointer", fontSize: 15, opacity: !nuevoCliente.trim() ? 0.5 : 1 }}>+ Excluir</button>
                  </div>
                  {clientes.length > 0 && nuevoCliente.length >= 2 && (
                    <div style={{ background: "#020617", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: 16, marginBottom: 16 }}>
                      <p style={{ color: "#94a3b8", fontSize: 12, marginBottom: 8, fontWeight: 700 }}>TALLERES REGISTRADOS</p>
                      {clientes.filter(c => (c.nombre_empresa || "").toLowerCase().includes(nuevoCliente.toLowerCase()) || (c.email || "").toLowerCase().includes(nuevoCliente.toLowerCase())).slice(0, 5).map(c => (
                        <div key={c.id} onClick={() => setNuevoCliente(c.email)} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", borderRadius: 10, cursor: "pointer", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                          <div><p style={{ fontWeight: 700, fontSize: 14 }}>{c.nombre_empresa || "Sin nombre"}</p><p style={{ color: "#94a3b8", fontSize: 12 }}>{c.email}{c.codigo_postal ? ` · CP ${c.codigo_postal}` : ""}</p></div>
                          <span style={{ color: "#60a5fa", fontSize: 12, fontWeight: 700 }}>Seleccionar →</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {excClientes.length === 0 ? <div style={{ textAlign: "center", padding: "40px 0", color: "#94a3b8" }}><p style={{ fontSize: 40, marginBottom: 12 }}>👤</p><p>No hay clientes excluidos</p></div> : <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>{excClientes.map(exc => (<div key={exc.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#0f172a", borderRadius: 12, padding: "14px 18px", border: "1px solid rgba(255,255,255,0.06)" }}><div style={{ display: "flex", alignItems: "center", gap: 10 }}><span style={{ background: "rgba(239,68,68,0.15)", color: "#f87171", padding: "4px 12px", borderRadius: 999, fontWeight: 700, fontSize: 14 }}>👤 {exc.valor}</span><span style={{ color: "#94a3b8", fontSize: 13 }}>Añadido {new Date(exc.created_at).toLocaleDateString("es-ES")}</span></div><button onClick={() => eliminarExclusion(exc.id)} style={{ background: "rgba(239,68,68,0.1)", color: "#f87171", border: "none", padding: "8px 14px", borderRadius: 8, cursor: "pointer", fontWeight: 700, fontSize: 13 }}>🗑️ Eliminar</button></div>))}</div>}
                </div>
              )}
            </div>
          )}

          {seccion === "cuenta" && (
            <div>
              <div style={badgeStyle}>CONFIGURACIÓN</div>
              <h1 style={titleStyle}>MI CUENTA</h1>
              <p style={descStyle}>Gestiona tu acceso a la plataforma.</p>
              <div style={{ maxWidth: 600 }}>
                <div style={{ ...formCard, border: "1px solid rgba(37,99,235,0.3)", marginBottom: 20 }}>
                  <h2 style={{ fontSize: 20, fontWeight: 900, marginBottom: 6 }}>📧 Email para facturas</h2>
                  <p style={{ color: "#94a3b8", fontSize: 14, marginBottom: 16 }}>Si tu email de facturación es distinto al de acceso, indícalo aquí.</p>
                  <input type="email" placeholder="contabilidad@tuempresa.com" value={emailFacturas} onChange={e => setEmailFacturas(e.target.value)} style={{ ...formInput, borderColor: emailFacturas ? "rgba(37,99,235,0.4)" : "rgba(255,255,255,0.1)" }} />
                  {emailFacturas && <p style={{ color: "#60a5fa", fontSize: 12, marginTop: 6 }}>✓ Las solicitudes de factura indicarán este email</p>}
                  <button onClick={async () => { if (!userId) return; setGuardandoEmailFacturas(true); await supabase.from("usuarios").update({ email_facturas: emailFacturas.trim().toLowerCase() || null }).eq("id", userId); setGuardandoEmailFacturas(false); setEmailFacturasGuardado(true); setTimeout(() => setEmailFacturasGuardado(false), 3000); }} disabled={guardandoEmailFacturas} style={{ ...publishButton, marginTop: 16, fontSize: 14, padding: "12px 24px", opacity: guardandoEmailFacturas ? 0.7 : 1 }}>
                    {guardandoEmailFacturas ? "Guardando..." : emailFacturasGuardado ? "✓ Guardado" : "Guardar email"}
                  </button>
                </div>
                <div style={{ ...formCard, border: "1px solid rgba(139,92,246,0.3)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: mostrarCambioPass ? 28 : 0 }}>
                    <div><h2 style={{ fontSize: 22, fontWeight: 900, marginBottom: 6 }}>🔑 Cambiar contraseña</h2>{!mostrarCambioPass && <p style={{ color: "#94a3b8", fontSize: 14 }}>Cambia tu contraseña de acceso a la plataforma</p>}</div>
                    <button onClick={() => { setMostrarCambioPass(!mostrarCambioPass); setMensajePass(null); setPasswordActual(""); setPasswordNueva(""); setPasswordNueva2(""); }} style={{ background: mostrarCambioPass ? "rgba(255,255,255,0.05)" : "rgba(139,92,246,0.15)", border: "none", color: mostrarCambioPass ? "#94a3b8" : "#a78bfa", padding: "10px 20px", borderRadius: 12, cursor: "pointer", fontWeight: 700, fontSize: 14, whiteSpace: "nowrap" as const }}>{mostrarCambioPass ? "Cancelar" : "Cambiar"}</button>
                  </div>
                  {mostrarCambioPass && (
                    <div style={{ display: "flex", flexDirection: "column" as const, gap: 16 }}>
                      <div><p style={formLabel}>Contraseña actual</p><input type="password" placeholder="Tu contraseña actual" value={passwordActual} onChange={e => setPasswordActual(e.target.value)} style={formInput} /></div>
                      <div><p style={formLabel}>Nueva contraseña</p><input type="password" placeholder="Mínimo 6 caracteres" value={passwordNueva} onChange={e => setPasswordNueva(e.target.value)} style={{ ...formInput, borderColor: passwordNueva && passwordNueva.length < 6 ? "rgba(239,68,68,0.5)" : "rgba(255,255,255,0.1)" }} />{passwordNueva && passwordNueva.length < 6 && <p style={{ color: "#f87171", fontSize: 12, marginTop: 6 }}>Mínimo 6 caracteres</p>}</div>
                      <div><p style={formLabel}>Repetir nueva contraseña</p><input type="password" placeholder="Repite la nueva contraseña" value={passwordNueva2} onChange={e => setPasswordNueva2(e.target.value)} style={{ ...formInput, borderColor: passwordNueva2 && passwordNueva !== passwordNueva2 ? "rgba(239,68,68,0.5)" : "rgba(255,255,255,0.1)" }} />{passwordNueva2 && passwordNueva === passwordNueva2 && passwordNueva.length >= 6 && <p style={{ color: "#4ade80", fontSize: 12, marginTop: 6 }}>✓ Coinciden</p>}{passwordNueva2 && passwordNueva !== passwordNueva2 && <p style={{ color: "#f87171", fontSize: 12, marginTop: 6 }}>Las contraseñas no coinciden</p>}</div>
                      {mensajePass && <div style={{ background: mensajePass.tipo === "ok" ? "rgba(22,163,74,0.1)" : "rgba(239,68,68,0.1)", border: "1px solid " + (mensajePass.tipo === "ok" ? "rgba(22,163,74,0.3)" : "rgba(239,68,68,0.3)"), color: mensajePass.tipo === "ok" ? "#4ade80" : "#f87171", padding: "12px 16px", borderRadius: 12, fontSize: 14, fontWeight: 700 }}>{mensajePass.tipo === "ok" ? "✅ " : "⚠️ "}{mensajePass.texto}</div>}
                      <button onClick={cambiarContrasena} disabled={cambiandoPass} style={{ background: "linear-gradient(135deg,#7c3aed,#6d28d9)", border: "none", color: "white", padding: "16px", borderRadius: 14, fontWeight: 900, fontSize: 15, cursor: cambiandoPass ? "not-allowed" : "pointer", opacity: cambiandoPass ? 0.7 : 1 }}>{cambiandoPass ? "Verificando..." : "Confirmar cambio de contraseña"}</button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

        </section>
      </div>

      {modalContacto && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 99999, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={() => setModalContacto(null)}>
          <div style={{ background: "#0f172a", borderRadius: 24, padding: 36, width: 480, border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 30px 80px rgba(0,0,0,0.8)" }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <h2 style={{ fontSize: 22, fontWeight: 900, margin: 0 }}>👤 Datos de contacto</h2>
              <button onClick={() => setModalContacto(null)} style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: 20 }}>✕</button>
            </div>
            <div style={{ background: "rgba(37,99,235,0.08)", border: "1px solid rgba(37,99,235,0.2)", borderRadius: 12, padding: "6px 14px", marginBottom: 20, display: "inline-block" }}>
              <span style={{ color: "#60a5fa", fontSize: 13, fontWeight: 700 }}>Pedido {modalContacto.codigo || "#" + modalContacto.id}</span>
            </div>
            {!datosContacto ? (
              <div style={{ textAlign: "center", padding: "30px 0", color: "#94a3b8" }}>Cargando datos...</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {[
                  { label: "Empresa", value: datosContacto.nombre_empresa },
                  { label: "CIF", value: datosContacto.cif },
                  { label: "Email", value: datosContacto.email, href: `mailto:${datosContacto.email}` },
                  { label: "Teléfono", value: datosContacto.telefono, href: `tel:${datosContacto.telefono}` },
                  { label: "Dirección", value: datosContacto.direccion },
                  { label: "Ciudad", value: datosContacto.ciudad },
                  { label: "CP", value: datosContacto.codigo_postal },
                ].filter(f => f.value).map(({ label, value, href }: any) => (
                  <div key={label} style={{ display: "flex", gap: 12, alignItems: "center", padding: "10px 14px", background: "rgba(255,255,255,0.03)", borderRadius: 10 }}>
                    <span style={{ color: "#94a3b8", fontSize: 13, width: 80, flexShrink: 0 }}>{label}</span>
                    {href ? (
                      <a href={href} style={{ color: "#60a5fa", fontWeight: 700, fontSize: 14, textDecoration: "none" }}>{value}</a>
                    ) : (
                      <span style={{ fontWeight: 700, fontSize: 14 }}>{value}</span>
                    )}
                  </div>
                ))}
              </div>
            )}
            <button onClick={() => setModalContacto(null)} style={{ width: "100%", marginTop: 24, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#94a3b8", padding: "12px", borderRadius: 12, cursor: "pointer", fontWeight: 700 }}>Cerrar</button>
          </div>
        </div>
      )}
      {modalAnular && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 99999, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "#0f172a", borderRadius: 24, padding: 36, width: 480, border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 30px 80px rgba(0,0,0,0.8)" }}>
            <h2 style={{ fontSize: 22, fontWeight: 900, marginBottom: 8 }}>❌ Anular pedido</h2>
            <p style={{ color: "#94a3b8", fontSize: 14, marginBottom: 24 }}>Pedido <strong style={{ color: "white" }}>{modalAnular.codigo || `#${modalAnular.id}`}</strong> — Selecciona el motivo.</p>
            <div style={{ display: "flex", flexDirection: "column" as const, gap: 10, marginBottom: 24 }}>
              {["🚫 Referencia agotada en almacén","💶 Error en el precio publicado","🔧 Artículo dañado o en mal estado"].map(motivo => (
                <button key={motivo} onClick={() => setMotivoSeleccionado(motivo)} style={{ padding: "14px 18px", borderRadius: 12, textAlign: "left" as const, fontWeight: 700, fontSize: 15, cursor: "pointer", background: motivoSeleccionado === motivo ? "rgba(239,68,68,0.2)" : "rgba(255,255,255,0.05)", border: motivoSeleccionado === motivo ? "2px solid rgba(239,68,68,0.5)" : "1px solid rgba(255,255,255,0.08)", color: motivoSeleccionado === motivo ? "#f87171" : "white" }}>{motivo}</button>
              ))}
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              <button onClick={() => setModalAnular(null)} style={{ flex: 1, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#94a3b8", padding: "14px", borderRadius: 12, cursor: "pointer", fontWeight: 700 }}>Cancelar</button>
              <button onClick={confirmarAnulacion} disabled={!motivoSeleccionado} style={{ flex: 1, background: motivoSeleccionado ? "linear-gradient(135deg,#dc2626,#991b1b)" : "rgba(255,255,255,0.05)", border: "none", color: motivoSeleccionado ? "white" : "#94a3b8", padding: "14px", borderRadius: 12, cursor: motivoSeleccionado ? "pointer" : "not-allowed", fontWeight: 900, fontSize: 15 }}>Confirmar anulación</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

const mainStyle = { display: "flex", flexDirection: "column" as const, minHeight: "100vh", background: "linear-gradient(180deg,#020617 0%,#020817 100%)", color: "white" };
const proveedorHeaderStyle = { height: 70, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 30px", borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(2,6,23,0.9)", backdropFilter: "blur(16px)", position: "sticky" as const, top: 0, zIndex: 999, flexShrink: 0 };
const sidebarStyle = { width: "280px", background: "rgba(15,23,42,0.96)", borderRight: "1px solid rgba(255,255,255,0.06)", padding: "40px 30px", display: "flex", flexDirection: "column" as const };
const logoStyle = { fontSize: "36px", fontWeight: 900, lineHeight: 1 };
const logoSub = { color: "#94a3b8", marginTop: 8, fontSize: 14 };
const empresaBadge = { width: 60, height: 60, borderRadius: 18, background: "linear-gradient(135deg,#2563eb,#1d4ed8)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, fontWeight: 900, marginTop: 30 };
const empresaNombreStyle = { fontWeight: 800, marginTop: 12, fontSize: 15 };
const horarioBadge = { marginTop: 12, background: "rgba(37,99,235,0.1)", border: "1px solid rgba(37,99,235,0.2)", borderRadius: 10, padding: "8px 12px", fontSize: 12, color: "#60a5fa", fontWeight: 700 };
const menuItem = { padding: "14px 18px", borderRadius: 14, marginBottom: 10, background: "rgba(255,255,255,0.03)", cursor: "pointer", fontWeight: 600, fontSize: 15 };
const menuItemActive = { ...menuItem, background: "linear-gradient(135deg,#2563eb,#1d4ed8)", boxShadow: "0 8px 25px rgba(37,99,235,0.3)" };
const contentStyle = { flex: 1, padding: 50, overflowY: "auto" as const };
const badgeStyle = { display: "inline-block", background: "rgba(37,99,235,0.18)", color: "#60a5fa", padding: "10px 18px", borderRadius: 999, fontWeight: 700, marginBottom: 18 };
const titleStyle = { fontSize: "60px", fontWeight: 900, lineHeight: 1, marginBottom: 16 };
const descStyle = { color: "#94a3b8", fontSize: 18, marginBottom: 40 };
const kpiGrid = { display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 24, marginBottom: 40 };
const kpiCard = { background: "rgba(15,23,42,0.95)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 26, padding: 28 };
const kpiLabel = { color: "#94a3b8", marginBottom: 12, fontSize: 13, fontWeight: 700 };
const kpiNumber = { fontSize: "44px", fontWeight: 900 };
const quickGrid = { display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 24 };
const quickCard = { background: "rgba(15,23,42,0.95)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 26, padding: 30, cursor: "pointer" };
const quickIcon = { fontSize: 36, marginBottom: 16 };
const quickTitle = { fontSize: 22, fontWeight: 900, marginBottom: 8 };
const quickDesc = { color: "#94a3b8", fontSize: 15 };
const addButton = { background: "linear-gradient(135deg,#2563eb,#1d4ed8)", border: "none", color: "white", padding: "16px 28px", borderRadius: 16, fontWeight: 800, cursor: "pointer", fontSize: 15 };
const importButton = { background: "rgba(22,163,74,0.15)", border: "1px solid rgba(22,163,74,0.3)", color: "#4ade80", padding: "16px 28px", borderRadius: 16, fontWeight: 800, cursor: "pointer", fontSize: 15 };
const tableContainer = { background: "rgba(15,23,42,0.95)", borderRadius: 24, overflow: "hidden", border: "1px solid rgba(255,255,255,0.06)" };
const tableStyle = { width: "100%", borderCollapse: "collapse" as const };
const thStyle = { padding: "14px 16px", textAlign: "left" as const, color: "#94a3b8", fontSize: 12, fontWeight: 700, borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(0,0,0,0.2)", whiteSpace: "nowrap" as const };
const trStyle = { borderBottom: "1px solid rgba(255,255,255,0.04)" };
const tdStyle = { padding: "14px 16px", fontSize: 14, verticalAlign: "middle" as const };
const stockBadge = { background: "rgba(22,163,74,0.2)", color: "#4ade80", padding: "4px 12px", borderRadius: 999, fontWeight: 700, fontSize: 13 };
const miniInput = { background: "#020617", color: "white", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 8, padding: "6px 10px", width: 80, fontSize: 14, outline: "none" };
const btnEditar = { background: "rgba(37,99,235,0.2)", color: "#60a5fa", border: "none", padding: "6px 12px", borderRadius: 8, cursor: "pointer", fontWeight: 700, fontSize: 13, marginRight: 8 };
const btnGuardar = { background: "rgba(22,163,74,0.2)", color: "#4ade80", border: "none", padding: "6px 12px", borderRadius: 8, cursor: "pointer", fontWeight: 700, fontSize: 13, marginRight: 8 };
const btnEliminar = { background: "rgba(239,68,68,0.15)", color: "#f87171", border: "none", padding: "6px 10px", borderRadius: 8, cursor: "pointer", fontSize: 13 };
const btnAccion = { background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)", color: "white", padding: "6px 14px", borderRadius: 8, cursor: "pointer", fontWeight: 700, fontSize: 12, whiteSpace: "nowrap" as const };
const emptyState = { textAlign: "center" as const, padding: "80px 0", color: "#94a3b8" };
const tabsContainer = { display: "flex", gap: 0, marginBottom: 24, background: "rgba(15,23,42,0.95)", borderRadius: 16, padding: 6, width: "fit-content", border: "1px solid rgba(255,255,255,0.06)" };
const tabActive = { padding: "12px 28px", borderRadius: 12, background: "linear-gradient(135deg,#2563eb,#1d4ed8)", border: "none", color: "white", fontWeight: 800, cursor: "pointer", fontSize: 15 };
const tabInactive = { padding: "12px 28px", borderRadius: 12, background: "transparent", border: "none", color: "#94a3b8", fontWeight: 700, cursor: "pointer", fontSize: 15 };
const searchRow = { marginBottom: 20 };
const searchInput = { background: "#0f172a", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: "14px 18px", color: "white", fontSize: 14, outline: "none", width: "400px", boxSizing: "border-box" as const };
const expandedRow = { background: "rgba(37,99,235,0.05)", borderLeft: "3px solid #2563eb", padding: "20px 24px" };
const chatBox = { background: "#020617", borderRadius: 14, padding: 16, maxHeight: 200, overflowY: "auto" as const, marginBottom: 12 };
const btnSubirFactura = { display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(139,92,246,0.15)", border: "1px solid rgba(139,92,246,0.3)", color: "#a78bfa", padding: "10px 18px", borderRadius: 10, cursor: "pointer", fontWeight: 700, fontSize: 13 };
const btnAnular = { background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171", padding: "10px 18px", borderRadius: 10, cursor: "pointer", fontWeight: 700, fontSize: 13 };
const formCard = { background: "rgba(15,23,42,0.95)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 30, padding: 40, maxWidth: 800 };
const formGrid = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 };
const formLabel = { color: "#94a3b8", fontSize: 14, marginBottom: 10 };
const formInput = { width: "100%", background: "#020617", color: "white", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 14, padding: "16px 18px", fontSize: 15, outline: "none", boxSizing: "border-box" as const };
const publishButton = { background: "linear-gradient(135deg,#16a34a,#15803d)", border: "none", color: "white", padding: "18px 32px", borderRadius: 16, fontWeight: 900, cursor: "pointer", fontSize: 16 };
const cancelButton = { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#94a3b8", padding: "18px 28px", borderRadius: 16, cursor: "pointer", fontWeight: 700, fontSize: 15 };
const successBanner = { background: "rgba(22,163,74,0.15)", border: "1px solid rgba(22,163,74,0.3)", color: "#4ade80", padding: "16px 24px", borderRadius: 16, marginBottom: 24, fontWeight: 700 };
const provinciaInfo = { background: "rgba(22,163,74,0.1)", border: "1px solid rgba(22,163,74,0.3)", color: "#4ade80", padding: "14px 20px", borderRadius: 14, marginBottom: 24, fontSize: 14 };
const provinciaAviso = { background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.3)", color: "#fbbf24", padding: "14px 20px", borderRadius: 14, marginBottom: 24, fontSize: 14 };
const diasGrid = { display: "flex", flexWrap: "wrap" as const, gap: 10, marginBottom: 8 };
const diaBtnBase = { padding: "10px 18px", borderRadius: 999, fontWeight: 700, cursor: "pointer", fontSize: 14 };
const horarioPreview = { background: "rgba(37,99,235,0.08)", border: "1px solid rgba(37,99,235,0.2)", borderRadius: 16, padding: "20px 24px", marginTop: 24 };
const btnPagina = { background: "rgba(37,99,235,0.15)", border: "1px solid rgba(37,99,235,0.3)", color: "#60a5fa", padding: "10px 20px", borderRadius: 10, cursor: "pointer", fontWeight: 700, fontSize: 14 };
const btnAbrirChat = { background: "linear-gradient(135deg,#2563eb,#1d4ed8)", border: "none", color: "white", padding: "10px 20px", borderRadius: 12, fontWeight: 700, cursor: "pointer", fontSize: 14 };