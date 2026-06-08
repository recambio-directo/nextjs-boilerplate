"use client";

import React from "react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

export default function Pedidos() {
  const router = useRouter();
  const [pedidosRealizados, setPedidosRealizados] = useState<any[]>([]);
  const [pedidosRecibidos, setPedidosRecibidos] = useState<any[]>([]);
  const [pestañaActiva, setPestañaActiva] = useState<"realizados" | "recibidos">("realizados");
  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("todos");
  const [filtroFecha, setFiltroFecha] = useState("todos");
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [solicitandoFactura, setSolicitandoFactura] = useState<number | null>(null);
  const [subiendoFactura, setSubiendoFactura] = useState<number | null>(null);
  const [anulando, setAnulando] = useState<number | null>(null);
  const [modalAnular, setModalAnular] = useState<any | null>(null);
  const [motivoSeleccionado, setMotivoSeleccionado] = useState<string>("");
  const [pedidoExpandido, setPedidoExpandido] = useState<number | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    cargarPedidos();
    const channel = supabase.channel("pedidos-taller-realtime")
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "pedidos" }, () => cargarPedidos())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  async function cargarPedidos() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setUserId(user.id);
    setUserEmail(user.email || null);

    // REALIZADOS: pedidos donde el taller es el comprador
    const { data: realizados } = await supabase
      .from("pedidos").select("*")
      .eq("cliente_id", user.id)
      .order("id", { ascending: false });
    setPedidosRealizados(realizados || []);

    // RECIBIDOS: pedidos donde el taller es el vendedor (sus piezas están en productos)
    const { data: todos } = await supabase
      .from("pedidos").select("*")
      .order("id", { ascending: false });
    const recibidos = (todos || []).filter(p =>
      (p.productos || []).some((prod: any) => prod.proveedor_id === user.id)
    );
    // Excluir los que ya están en realizados
    const realizadosIds = new Set((realizados || []).map((p: any) => p.id));
    setPedidosRecibidos(recibidos.filter(p => !realizadosIds.has(p.id)));
  }

  function fmt(n: any) {
    return Number(Number(n).toFixed(2)).toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function getProveedorPedido(pedido: any) {
    const productos = pedido.productos || [];
    if (productos.length > 0) {
      const p = productos[0];
      return { nombre: p.proveedor_nombre || p.proveedor || "-", id: p.proveedor_id || null };
    }
    return { nombre: "-", id: null };
  }

  function getCompradorPedido(pedido: any) {
    return { nombre: pedido.cliente_nombre || pedido.cliente_email || "-", email: pedido.cliente_email || "" };
  }

  function abrirModalAnular(pedido: any) { setModalAnular(pedido); setMotivoSeleccionado(""); }

  async function confirmarAnulacion() {
    if (!modalAnular || !motivoSeleccionado) return;
    const pedido = modalAnular;
    setModalAnular(null);
    setAnulando(pedido.id);
    await supabase.from("pedidos").update({ anulado: true, estado_envio: "anulado", motivo_anulacion: motivoSeleccionado }).eq("id", pedido.id);
    setAnulando(null);
    const proveedor = getProveedorPedido(pedido);
    let emailProveedor = "";
    if (proveedor.id) {
      const { data: provPerfil } = await supabase.from("usuarios").select("email").eq("id", proveedor.id).single();
      emailProveedor = provPerfil?.email || "";
    }
    try {
      await fetch("/api/send-anulacion", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pedidoCodigo: pedido.codigo || `#${pedido.id}`, pedidoId: pedido.id, pedidoTotal: pedido.total, pedidoFecha: pedido.created_at, anuladorTipo: "taller", anuladorNombre: "", clienteEmail: pedido.cliente_email || userEmail, clienteNombre: pedido.cliente_nombre || "", proveedorEmail: emailProveedor, proveedorNombre: proveedor.nombre, productos: pedido.productos || [], motivoAnulacion: motivoSeleccionado }),
      });
    } catch (e) { console.error(e); }
    cargarPedidos();
  }

  async function solicitarFactura(pedido: any) {
    setSolicitandoFactura(pedido.id);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: perfil } = await supabase.from("usuarios").select("nombre_empresa, cif, telefono, direccion, ciudad, codigo_postal").eq("id", user.id).single();
    const proveedor = getProveedorPedido(pedido);
    let emailProveedor = "info@recambio-directo.com";
    if (proveedor.id) {
      const { data: provPerfil } = await supabase.from("usuarios").select("email").eq("id", proveedor.id).single();
      if (provPerfil?.email) emailProveedor = provPerfil.email;
    }
    try {
      await fetch("/api/send-solicitud-factura", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pedidoCodigo: pedido.codigo || `#${pedido.id}`, pedidoId: pedido.id, pedidoTotal: pedido.total, pedidoFecha: pedido.created_at, clienteEmail: user.email, clienteNombre: perfil?.nombre_empresa || user.email, clienteCif: perfil?.cif || "-", clienteTelefono: perfil?.telefono || "-", clienteDireccion: [perfil?.direccion, perfil?.ciudad, perfil?.codigo_postal].filter(Boolean).join(", "), proveedorNombre: proveedor.nombre, emailProveedor }),
      });
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
    setSubiendoFactura(null);
    cargarPedidos();
  }

  async function abrirChat(pedido: any) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const proveedor = getProveedorPedido(pedido);
    // En recibidos el "otro" es el comprador, en realizados es el proveedor
    const otroId = pestañaActiva === "recibidos"
      ? pedido.cliente_id
      : proveedor.id;
    if (!otroId) { alert("No se puede identificar el interlocutor"); return; }
    const { data: convExistente } = await supabase.from("conversaciones").select("id").eq("pedido_id", pedido.id).maybeSingle();
    if (convExistente) { router.push(`/chat?conv=${convExistente.id}`); return; }
    const { data: nuevaConv, error } = await supabase.from("conversaciones").insert({ user1_id: user.id, user2_id: otroId, pedido_id: pedido.id, referencia: `Pedido #${pedido.id}${pedido.codigo ? ` — ${pedido.codigo}` : ""}`, ultimo_mensaje: "", updated_at: new Date().toISOString() }).select("id").single();
    if (!error && nuevaConv) router.push(`/chat?conv=${nuevaConv.id}`);
    else alert("Error al abrir el chat");
  }

  const pedidos = pestañaActiva === "realizados" ? pedidosRealizados : pedidosRecibidos;

  const pedidosFiltrados = pedidos.filter(p => {
    if (p.anulado && filtroEstado !== "todos" && filtroEstado !== "anulado") return false;
    if (busqueda) {
      const q = busqueda.toLowerCase();
      const proveedor = getProveedorPedido(p);
      const comprador = getCompradorPedido(p);
      const productos = (p.productos || []).map((pr: any) => `${pr.referencia} ${pr.descripcion}`).join(" ").toLowerCase();
      if (!((p.codigo || "").toLowerCase().includes(q) || String(p.id).includes(q) || proveedor.nombre.toLowerCase().includes(q) || comprador.nombre.toLowerCase().includes(q) || productos.includes(q) || (p.agencia || p.transporte || "").toLowerCase().includes(q))) return false;
    }
    if (filtroEstado !== "todos") {
      if (filtroEstado === "anulado") return p.anulado;
      if (p.anulado) return false;
      if ((p.estado_envio || "pendiente") !== filtroEstado) return false;
    }
    if (filtroFecha !== "todos") {
      const fecha = new Date(p.created_at);
      const ahora = new Date();
      if (filtroFecha === "hoy" && fecha.toDateString() !== ahora.toDateString()) return false;
      if (filtroFecha === "semana") { const h7 = new Date(); h7.setDate(ahora.getDate() - 7); if (fecha < h7) return false; }
      if (filtroFecha === "mes" && (fecha.getMonth() !== ahora.getMonth() || fecha.getFullYear() !== ahora.getFullYear())) return false;
    }
    return true;
  });

  const contadores: Record<string, number> = {
    todos: pedidos.length,
    pendiente: pedidos.filter(p => !p.anulado && (p.estado_envio || "pendiente") === "pendiente").length,
    preparando: pedidos.filter(p => !p.anulado && p.estado_envio === "preparando").length,
    enviado: pedidos.filter(p => !p.anulado && p.estado_envio === "enviado").length,
    entregado: pedidos.filter(p => !p.anulado && p.estado_envio === "entregado").length,
    anulado: pedidos.filter(p => p.anulado).length,
  };

  const estadoColor: Record<string, string> = {
    entregado: "#4ade80", enviado: "#60a5fa", preparando: "#a78bfa", pendiente: "#f59e0b", anulado: "#f87171",
  };
  const estadoEmoji: Record<string, string> = {
    entregado: "✅", enviado: "🚚", preparando: "🔧", pendiente: "⏳", anulado: "❌",
  };

  // Acciones según pestaña
  const esVendedor = pestañaActiva === "recibidos";

  // Render fila expandida — compartido móvil y desktop
  function AccionesExpandidas({ pedido }: { pedido: any }) {
    const anulado = pedido.anulado || false;
    const puedeAnular = !anulado && !["enviado", "entregado"].includes(pedido.estado_envio || "");
    return (
      <>
        {/* Documentos */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
          {pedido.albaran_url && <a href={pedido.albaran_url} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(37,99,235,0.15)", border: "1px solid rgba(37,99,235,0.3)", color: "#60a5fa", padding: "8px 14px", borderRadius: 8, fontWeight: 700, fontSize: 12, textDecoration: "none" }}>📄 Albarán PDF</a>}
          {pedido.factura_url && <a href={pedido.factura_url} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(22,163,74,0.15)", border: "1px solid rgba(22,163,74,0.3)", color: "#4ade80", padding: "8px 14px", borderRadius: 8, fontWeight: 700, fontSize: 12, textDecoration: "none" }}>🧾 Factura PDF</a>}
        </div>

        {/* Factura — diferente según rol */}
        {!anulado && (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            <p style={{ color: "#94a3b8", fontSize: 12, fontWeight: 700, margin: 0, marginRight: 4 }}>📄 FACTURA:</p>
            {esVendedor ? (
              // RECIBIDOS → el taller es vendedor → sube la factura
              pedido.factura_url ? (
                <>
                  <span style={{ color: "#4ade80", fontSize: 13, fontWeight: 700 }}>✅ Subida</span>
                  <a href={pedido.factura_url} target="_blank" rel="noopener noreferrer" style={{ color: "#60a5fa", fontSize: 13, fontWeight: 700 }}>Ver PDF</a>
                  <label style={btnFacturaStyle}>🔄 Reemplazar<input type="file" accept=".pdf" style={{ display: "none" }} onChange={e => { if (e.target.files?.[0]) subirFactura(pedido.id, e.target.files[0]); }} /></label>
                </>
              ) : (
                <label style={{ ...btnFacturaStyle, opacity: subiendoFactura === pedido.id ? 0.7 : 1 }}>
                  {subiendoFactura === pedido.id ? "⏳ Subiendo..." : "📤 Subir factura PDF"}
                  <input type="file" accept=".pdf" style={{ display: "none" }} disabled={subiendoFactura === pedido.id} onChange={e => { if (e.target.files?.[0]) subirFactura(pedido.id, e.target.files[0]); }} />
                </label>
              )
            ) : (
              // REALIZADOS → el taller es comprador → solicita la factura
              pedido.factura_url
                ? <span style={{ color: "#4ade80", fontSize: 13, fontWeight: 700 }}>✅ Disponible</span>
                : <button onClick={() => solicitarFactura(pedido)} disabled={solicitandoFactura === pedido.id} style={{ ...btnFacturaStyle, cursor: "pointer", opacity: solicitandoFactura === pedido.id ? 0.7 : 1 }}>{solicitandoFactura === pedido.id ? "Enviando..." : "🧾 Solicitar factura"}</button>
            )}
          </div>
        )}

        {/* Botones acción */}
        {!anulado && (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
            <button onClick={() => abrirChat(pedido)} style={{ background: "linear-gradient(135deg,#2563eb,#1d4ed8)", border: "none", color: "white", padding: "8px 16px", borderRadius: 10, fontWeight: 700, cursor: "pointer", fontSize: 13 }}>💬 Abrir chat</button>
            {puedeAnular && (
              <button onClick={() => abrirModalAnular(pedido)} disabled={anulando === pedido.id} style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171", padding: "8px 14px", borderRadius: 10, fontWeight: 700, cursor: "pointer", fontSize: 13, opacity: anulando === pedido.id ? 0.7 : 1 }}>
                {anulando === pedido.id ? "Anulando..." : "❌ Anular"}
              </button>
            )}
          </div>
        )}
        {anulado && pedido.motivo_anulacion && (
          <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171", padding: "8px 14px", borderRadius: 10, fontSize: 13, fontWeight: 700, marginTop: 8 }}>❌ Anulado: {pedido.motivo_anulacion}</div>
        )}
      </>
    );
  }

  return (
    <main style={{ padding: isMobile ? "12px" : "clamp(16px,4vw,40px)", minHeight: "100vh", background: "linear-gradient(135deg,#020617,#020b2d)", color: "white" }}>

      {/* HEADER */}
      <div style={{ marginBottom: isMobile ? 16 : 24 }}>
        <div style={{ display: "inline-block", padding: "6px 14px", borderRadius: 999, background: "rgba(37,99,235,0.18)", color: "#60a5fa", marginBottom: 10, fontWeight: 700, fontSize: 12 }}>PANEL TALLER</div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h1 style={{ fontSize: isMobile ? 28 : "clamp(28px,6vw,52px)", fontWeight: 900, lineHeight: 1 }}>MIS PEDIDOS</h1>
          <div style={{ display: "flex", gap: 10 }}>
            <div style={{ background: "rgba(15,23,42,0.92)", borderRadius: 14, padding: isMobile ? "10px 14px" : "14px 20px", border: "1px solid rgba(255,255,255,0.06)", textAlign: "center" }}>
              <p style={{ color: "#94a3b8", fontSize: 10, fontWeight: 700, marginBottom: 2 }}>REALIZADOS</p>
              <h2 style={{ fontSize: isMobile ? 20 : 32, fontWeight: 900, margin: 0 }}>{pedidosRealizados.length}</h2>
            </div>
            <div style={{ background: "rgba(15,23,42,0.92)", borderRadius: 14, padding: isMobile ? "10px 14px" : "14px 20px", border: "1px solid rgba(255,255,255,0.06)", textAlign: "center" }}>
              <p style={{ color: "#94a3b8", fontSize: 10, fontWeight: 700, marginBottom: 2 }}>RECIBIDOS</p>
              <h2 style={{ fontSize: isMobile ? 20 : 32, fontWeight: 900, margin: 0, color: pedidosRecibidos.length > 0 ? "#22c55e" : "white" }}>{pedidosRecibidos.length}</h2>
            </div>
          </div>
        </div>
      </div>

      {/* PESTAÑAS */}
      <div style={{ display: "flex", gap: 0, marginBottom: 16, background: "rgba(15,23,42,0.95)", borderRadius: 14, padding: 5, width: "fit-content", border: "1px solid rgba(255,255,255,0.06)" }}>
        <button
          onClick={() => { setPestañaActiva("realizados"); setPedidoExpandido(null); setFiltroEstado("todos"); }}
          style={{ padding: isMobile ? "10px 18px" : "12px 28px", borderRadius: 10, fontWeight: 800, cursor: "pointer", fontSize: isMobile ? 13 : 15, border: "none", background: pestañaActiva === "realizados" ? "linear-gradient(135deg,#2563eb,#1d4ed8)" : "transparent", color: pestañaActiva === "realizados" ? "white" : "#94a3b8" }}
        >
          📤 Realizados ({pedidosRealizados.length})
        </button>
        <button
          onClick={() => { setPestañaActiva("recibidos"); setPedidoExpandido(null); setFiltroEstado("todos"); }}
          style={{ padding: isMobile ? "10px 18px" : "12px 28px", borderRadius: 10, fontWeight: 800, cursor: "pointer", fontSize: isMobile ? 13 : 15, border: "none", background: pestañaActiva === "recibidos" ? "linear-gradient(135deg,#16a34a,#15803d)" : "transparent", color: pestañaActiva === "recibidos" ? "white" : "#94a3b8" }}
        >
          📥 Recibidos ({pedidosRecibidos.length})
        </button>
      </div>

      {/* INFO CONTEXTUAL */}
      <div style={{ background: pestañaActiva === "realizados" ? "rgba(37,99,235,0.08)" : "rgba(22,163,74,0.08)", border: `1px solid ${pestañaActiva === "realizados" ? "rgba(37,99,235,0.2)" : "rgba(22,163,74,0.2)"}`, borderRadius: 12, padding: "10px 16px", marginBottom: 16, fontSize: 13, color: pestañaActiva === "realizados" ? "#60a5fa" : "#4ade80" }}>
        {pestañaActiva === "realizados"
          ? "🛒 Pedidos que has realizado como comprador en la plataforma"
          : "🏭 Pedidos recibidos de tus piezas publicadas — actúas como vendedor"}
      </div>

      {/* FILTROS */}
      <div style={{ background: "rgba(15,23,42,0.92)", borderRadius: isMobile ? 14 : 20, padding: isMobile ? "14px" : "20px 24px", marginBottom: 16, border: "1px solid rgba(255,255,255,0.06)", display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", background: "#0f172a", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: "0 12px", height: 42 }}>
          <span style={{ marginRight: 8 }}>🔍</span>
          <input placeholder="Buscar pedido..." value={busqueda} onChange={e => setBusqueda(e.target.value)} style={{ flex: 1, background: "transparent", border: "none", color: "white", fontSize: 14, outline: "none" }} />
          {busqueda && <button onClick={() => setBusqueda("")} style={{ background: "transparent", border: "none", color: "#94a3b8", cursor: "pointer" }}>✕</button>}
        </div>
        <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 2 }}>
          {[
            { key: "todos", label: `Todos (${contadores.todos})` },
            { key: "pendiente", label: `⏳ (${contadores.pendiente})` },
            { key: "preparando", label: `🔧 (${contadores.preparando})` },
            { key: "enviado", label: `🚚 (${contadores.enviado})` },
            { key: "entregado", label: `✅ (${contadores.entregado})` },
            { key: "anulado", label: `❌ (${contadores.anulado})` },
          ].map(({ key, label }) => (
            <button key={key} onClick={() => setFiltroEstado(key)} style={{ padding: "6px 12px", borderRadius: 999, fontWeight: 700, cursor: "pointer", fontSize: 12, whiteSpace: "nowrap", flexShrink: 0, background: filtroEstado === key ? "linear-gradient(135deg,#2563eb,#1d4ed8)" : "rgba(255,255,255,0.05)", border: filtroEstado === key ? "none" : "1px solid rgba(255,255,255,0.08)", color: filtroEstado === key ? "white" : "#94a3b8" }}>{label}</button>
          ))}
        </div>
        <div style={{ display: "flex", gap: 6, overflowX: "auto" }}>
          {[{ key: "todos", label: "Todos" }, { key: "hoy", label: "Hoy" }, { key: "semana", label: "Semana" }, { key: "mes", label: "Mes" }].map(({ key, label }) => (
            <button key={key} onClick={() => setFiltroFecha(key)} style={{ padding: "5px 12px", borderRadius: 999, fontWeight: 700, cursor: "pointer", fontSize: 11, whiteSpace: "nowrap", flexShrink: 0, background: filtroFecha === key ? "rgba(139,92,246,0.3)" : "rgba(255,255,255,0.05)", border: filtroFecha === key ? "1px solid rgba(139,92,246,0.5)" : "1px solid rgba(255,255,255,0.08)", color: filtroFecha === key ? "#a78bfa" : "#94a3b8" }}>{label}</button>
          ))}
        </div>
      </div>

      {/* VACÍO */}
      {pedidos.length === 0 && (
        <div style={{ background: "rgba(15,23,42,0.92)", padding: "60px 20px", borderRadius: 20, textAlign: "center" }}>
          <p style={{ fontSize: 48, marginBottom: 16 }}>{pestañaActiva === "realizados" ? "🛒" : "📦"}</p>
          <h2 style={{ fontSize: 22, fontWeight: 900 }}>
            {pestañaActiva === "realizados" ? "No has realizado pedidos todavía" : "No has recibido pedidos todavía"}
          </h2>
          {pestañaActiva === "realizados" && (
            <button onClick={() => router.push("/dashboard")} style={{ marginTop: 20, background: "linear-gradient(135deg,#2563eb,#1d4ed8)", border: "none", color: "white", padding: "14px 28px", borderRadius: 14, fontWeight: 800, cursor: "pointer" }}>BUSCAR RECAMBIOS</button>
          )}
          {pestañaActiva === "recibidos" && (
            <button onClick={() => router.push("/dashboard/mis-piezas")} style={{ marginTop: 20, background: "linear-gradient(135deg,#16a34a,#15803d)", border: "none", color: "white", padding: "14px 28px", borderRadius: 14, fontWeight: 800, cursor: "pointer" }}>PUBLICAR PIEZAS</button>
          )}
        </div>
      )}

      {pedidosFiltrados.length === 0 && pedidos.length > 0 && (
        <div style={{ padding: "30px", textAlign: "center", color: "#94a3b8" }}>Sin resultados para los filtros seleccionados</div>
      )}

      {/* ── MÓVIL: tarjetas ── */}
      {isMobile && pedidosFiltrados.length > 0 && (
        <div style={{ display: "grid", gap: 10 }}>
          {pedidosFiltrados.map(pedido => {
            const anulado = pedido.anulado || false;
            const expandido = pedidoExpandido === pedido.id;
            const estado = anulado ? "anulado" : (pedido.estado_envio || "pendiente");
            const productos = pedido.productos || [];
            const contraparte = esVendedor ? getCompradorPedido(pedido) : getProveedorPedido(pedido);

            return (
              <div key={pedido.id} style={{ background: "rgba(15,23,42,0.95)", borderRadius: 14, border: "1px solid rgba(255,255,255,0.06)", overflow: "hidden", opacity: anulado ? 0.75 : 1 }}>
                <div onClick={() => setPedidoExpandido(expandido ? null : pedido.id)} style={{ padding: "14px 16px", cursor: "pointer" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                    <div>
                      <p style={{ color: "#60a5fa", fontWeight: 800, fontSize: 14 }}>{pedido.codigo || `RD-${pedido.id}`}</p>
                      <p style={{ color: "#94a3b8", fontSize: 11, marginTop: 2 }}>{pedido.created_at ? new Date(pedido.created_at).toLocaleDateString("es-ES") : ""}</p>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <p style={{ color: "#22c55e", fontWeight: 900, fontSize: 18 }}>{fmt(pedido.total)}€</p>
                      <span style={{ color: estadoColor[estado] || "#f59e0b", fontWeight: 700, fontSize: 11, background: `${estadoColor[estado]}22`, padding: "3px 8px", borderRadius: 999 }}>{estadoEmoji[estado]} {estado}</span>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8, fontSize: 12, flexWrap: "wrap" }}>
                    <span style={{ color: "#94a3b8" }}>{esVendedor ? "🔧" : "🏭"} {contraparte.nombre}</span>
                    {(pedido.agencia || pedido.transporte) && <span style={{ color: "#94a3b8" }}>🚚 {pedido.agencia || pedido.transporte}</span>}
                    <span style={{ color: "#94a3b8" }}>{productos.length} ref{productos.length !== 1 ? "s" : ""}</span>
                  </div>
                  <div style={{ marginTop: 6, textAlign: "right", color: "#64748b", fontSize: 11 }}>{expandido ? "▲ Cerrar" : "▼ Ver detalle"}</div>
                </div>
                {expandido && (
                  <div style={{ borderTop: "1px solid rgba(37,99,235,0.2)", background: "rgba(37,99,235,0.04)", padding: "14px 16px" }}>
                    <p style={{ color: "#94a3b8", fontSize: 11, fontWeight: 700, marginBottom: 8 }}>REFERENCIAS</p>
                    {productos.map((p: any, i: number) => (
                      <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid rgba(255,255,255,0.04)", fontSize: 13 }}>
                        <div><span style={{ fontWeight: 700, color: "#60a5fa" }}>{p.referencia}</span><span style={{ color: "#94a3b8", marginLeft: 6, fontSize: 12 }}>{(p.descripcion || "").substring(0, 20)}</span></div>
                        <span style={{ color: "#22c55e", fontWeight: 700 }}>{fmt(p.precio)}€</span>
                      </div>
                    ))}
                    <div style={{ marginTop: 12 }}>
                      <AccionesExpandidas pedido={pedido} />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── DESKTOP: tabla ── */}
      {!isMobile && pedidosFiltrados.length > 0 && (
        <div style={{ background: "rgba(15,23,42,0.92)", borderRadius: 20, overflow: "hidden", border: "1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1.5fr 1.5fr 1fr 1fr 1fr 120px", gap: 16, padding: "12px 20px", background: "rgba(0,0,0,0.2)", color: "#94a3b8", fontSize: 12, fontWeight: 700 }}>
            {["CÓDIGO", "REFERENCIAS", esVendedor ? "COMPRADOR" : "PROVEEDOR", "TOTAL", "TRANSPORTE", "ESTADO", "ACCIONES"].map(h => <div key={h}>{h}</div>)}
          </div>
          {pedidosFiltrados.map(pedido => {
            const anulado = pedido.anulado || false;
            const expandido = pedidoExpandido === pedido.id;
            const estado = anulado ? "anulado" : (pedido.estado_envio || "pendiente");
            const productos = pedido.productos || [];
            const contraparte = esVendedor ? getCompradorPedido(pedido) : getProveedorPedido(pedido);
            return (
              <React.Fragment key={pedido.id}>
                <div onClick={() => setPedidoExpandido(expandido ? null : pedido.id)} style={{ display: "grid", gridTemplateColumns: "1.2fr 1.5fr 1.5fr 1fr 1fr 1fr 120px", gap: 16, padding: "14px 20px", borderTop: "1px solid rgba(255,255,255,0.04)", cursor: "pointer", opacity: anulado ? 0.7 : 1, background: expandido ? "rgba(37,99,235,0.05)" : "transparent", alignItems: "center" }}>
                  <div>
                    <div style={{ color: "#60a5fa", fontWeight: 700, fontSize: 13 }}>{pedido.codigo || `RD-${pedido.id}`}</div>
                    <div style={{ color: "#94a3b8", fontSize: 11, marginTop: 2 }}>{pedido.created_at ? new Date(pedido.created_at).toLocaleDateString("es-ES") : ""}</div>
                  </div>
                  <div>
                    {productos.slice(0, 2).map((p: any, i: number) => (
                      <div key={i} style={{ fontSize: 13, marginBottom: 2 }}>
                        <strong style={{ color: "#60a5fa" }}>{p.referencia}</strong>
                        <span style={{ color: "#94a3b8", marginLeft: 6, fontSize: 12 }}>{(p.descripcion || "").substring(0, 25)}{(p.descripcion || "").length > 25 ? "..." : ""}</span>
                      </div>
                    ))}
                    {productos.length > 2 && <div style={{ color: "#94a3b8", fontSize: 11 }}>+{productos.length - 2} más</div>}
                  </div>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{contraparte.nombre}</div>
                  <div style={{ color: "#22c55e", fontWeight: 900, fontSize: 16 }}>{fmt(pedido.total)}€</div>
                  <div style={{ fontSize: 13, color: "#cbd5e1" }}>{pedido.agencia || pedido.transporte || "-"}</div>
                  <div><span style={{ color: estadoColor[estado] || "#f59e0b", fontWeight: 700, fontSize: 12, background: `${estadoColor[estado]}22`, padding: "4px 10px", borderRadius: 999 }}>{estado.toUpperCase()}</span></div>
                  <div><button onClick={e => { e.stopPropagation(); setPedidoExpandido(expandido ? null : pedido.id); }} style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)", color: "white", padding: "6px 14px", borderRadius: 8, cursor: "pointer", fontWeight: 700, fontSize: 12 }}>{expandido ? "▲ Cerrar" : "▼ Ver"}</button></div>
                </div>
                {expandido && (
                  <div style={{ borderTop: "1px solid rgba(37,99,235,0.2)", background: "rgba(37,99,235,0.04)", borderLeft: "3px solid #2563eb", padding: "20px 24px" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 20 }}>
                      <div>
                        <p style={{ color: "#94a3b8", fontSize: 12, fontWeight: 700, marginBottom: 10 }}>PRODUCTOS</p>
                        {productos.map((p: any, i: number) => (
                          <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.04)", fontSize: 13 }}>
                            <div><span style={{ fontWeight: 700, color: "#60a5fa" }}>{p.referencia}</span><span style={{ color: "#94a3b8", marginLeft: 8 }}>{p.descripcion}</span></div>
                            <span style={{ color: "#22c55e", fontWeight: 700 }}>{fmt(p.precio)}€</span>
                          </div>
                        ))}
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                          <div style={{ background: "#0f172a", borderRadius: 12, padding: "12px 16px" }}><p style={{ color: "#94a3b8", fontSize: 11, fontWeight: 700, marginBottom: 4 }}>TOTAL</p><p style={{ color: "#22c55e", fontWeight: 900, fontSize: 20, margin: 0 }}>{fmt(pedido.total)}€</p></div>
                          <div style={{ background: "#0f172a", borderRadius: 12, padding: "12px 16px" }}><p style={{ color: "#94a3b8", fontSize: 11, fontWeight: 700, marginBottom: 4 }}>TRANSPORTE</p><p style={{ fontWeight: 800, fontSize: 15, margin: 0 }}>{pedido.agencia || pedido.transporte || "-"}</p></div>
                          <div style={{ background: "#0f172a", borderRadius: 12, padding: "12px 16px" }}><p style={{ color: "#94a3b8", fontSize: 11, fontWeight: 700, marginBottom: 4 }}>PAGO</p><p style={{ fontWeight: 700, fontSize: 13, margin: 0 }}>{pedido.estado_pago || "pendiente"}</p></div>
                          <div style={{ background: "#0f172a", borderRadius: 12, padding: "12px 16px" }}><p style={{ color: "#94a3b8", fontSize: 11, fontWeight: 700, marginBottom: 4 }}>ESTADO</p><p style={{ fontWeight: 700, fontSize: 13, margin: 0, color: estadoColor[estado] }}>{estado}</p></div>
                        </div>
                        {pedido.tracking && !anulado && <div style={{ background: "linear-gradient(135deg,#2563eb,#1d4ed8)", borderRadius: 12, padding: "12px 16px" }}><p style={{ fontSize: 11, fontWeight: 700, marginBottom: 4, opacity: 0.8 }}>TRACKING</p><p style={{ fontWeight: 900, fontSize: 15, margin: 0 }}>{pedido.tracking}</p></div>}
                      </div>
                    </div>
                    <AccionesExpandidas pedido={pedido} />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      )}

      {/* MODAL ANULACIÓN */}
      {modalAnular && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 99999, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div style={{ background: "#0f172a", borderRadius: 20, padding: "clamp(20px,4vw,36px)", width: "min(480px,92vw)", border: "1px solid rgba(255,255,255,0.1)" }}>
            <h2 style={{ fontSize: 20, fontWeight: 900, marginBottom: 8 }}>❌ Anular pedido</h2>
            <p style={{ color: "#94a3b8", fontSize: 14, marginBottom: 20 }}>Pedido <strong style={{ color: "white" }}>{modalAnular.codigo || `#${modalAnular.id}`}</strong></p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
              {(esVendedor
                ? ["🚫 Referencia agotada en almacén", "💶 Error en el precio publicado", "🔧 Artículo dañado o en mal estado"]
                : ["🚫 Ya no necesito el artículo", "💳 La forma de pago no es la acordada", "💶 El precio no coincide con el publicado", "📍 El artículo no está disponible en la ubicación indicada", "⏱️ El plazo de entrega es demasiado largo"]
              ).map(motivo => (
                <button key={motivo} onClick={() => setMotivoSeleccionado(motivo)} style={{ padding: "12px 16px", borderRadius: 10, textAlign: "left", fontWeight: 700, fontSize: isMobile ? 13 : 14, cursor: "pointer", background: motivoSeleccionado === motivo ? "rgba(239,68,68,0.2)" : "rgba(255,255,255,0.05)", border: motivoSeleccionado === motivo ? "2px solid rgba(239,68,68,0.5)" : "1px solid rgba(255,255,255,0.08)", color: motivoSeleccionado === motivo ? "#f87171" : "white" }}>{motivo}</button>
              ))}
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setModalAnular(null)} style={{ flex: 1, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#94a3b8", padding: "12px", borderRadius: 12, cursor: "pointer", fontWeight: 700 }}>Cancelar</button>
              <button onClick={confirmarAnulacion} disabled={!motivoSeleccionado} style={{ flex: 1, background: motivoSeleccionado ? "linear-gradient(135deg,#dc2626,#991b1b)" : "rgba(255,255,255,0.05)", border: "none", color: motivoSeleccionado ? "white" : "#94a3b8", padding: "12px", borderRadius: 12, cursor: motivoSeleccionado ? "pointer" : "not-allowed", fontWeight: 900 }}>Confirmar</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

const btnFacturaStyle: React.CSSProperties = { display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(139,92,246,0.15)", border: "1px solid rgba(139,92,246,0.3)", color: "#a78bfa", padding: "8px 14px", borderRadius: 10, fontWeight: 700, fontSize: 13 };