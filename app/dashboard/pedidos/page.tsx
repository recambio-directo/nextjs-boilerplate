"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

export default function Pedidos() {
  const router = useRouter();
  const [pedidos, setPedidos] = useState<any[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("todos");
  const [filtroFecha, setFiltroFecha] = useState("todos");
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [solicitandoFactura, setSolicitandoFactura] = useState<number | null>(null);
  const [anulando, setAnulando] = useState<number | null>(null);
  const [modalAnular, setModalAnular] = useState<any | null>(null);
  const [motivoSeleccionado, setMotivoSeleccionado] = useState<string>("");
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    cargarPedidos();

    // Realtime — actualizar pedidos automáticamente cuando el proveedor cambia el estado
    const channel = supabase
      .channel("pedidos-realtime")
      .on("postgres_changes", {
        event: "UPDATE",
        schema: "public",
        table: "pedidos",
      }, () => {
        cargarPedidos();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  async function cargarPedidos() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setUserId(user.id);
    setUserEmail(user.email || null);
    const { data } = await supabase
      .from("pedidos")
      .select("*")
      .eq("cliente_id", user.id)
      .order("id", { ascending: false });
    setPedidos(data || []);
  }

  function fmt(n: any) {
    return Number(Number(n).toFixed(2)).toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function getEstadoStyle(estado: string, anulado?: boolean) {
    if (anulado) return { background: "rgba(239,68,68,0.2)", color: "#f87171", padding: "12px 22px", borderRadius: 999, fontWeight: 700, textTransform: "uppercase" as const };
    const map: Record<string, { bg: string; color: string }> = {
      entregado:  { bg: "rgba(22,163,74,0.2)",  color: "#4ade80" },
      enviado:    { bg: "rgba(37,99,235,0.2)",   color: "#60a5fa" },
      preparando: { bg: "rgba(139,92,246,0.2)",  color: "#a78bfa" },
      pendiente:  { bg: "rgba(245,158,11,0.2)",  color: "#f59e0b" },
    };
    const c = map[estado] || map.pendiente;
    return { background: c.bg, color: c.color, padding: "12px 22px", borderRadius: 999, fontWeight: 700, textTransform: "uppercase" as const };
  }

  function getProveedorPedido(pedido: any): { nombre: string; id: string | null; email?: string } {
    const productos = pedido.productos || [];
    if (productos.length > 0) {
      const p = productos[0];
      return { nombre: p.proveedor_nombre || p.proveedor || "-", id: p.proveedor_id || null };
    }
    return { nombre: "-", id: null };
  }

  // ===== ANULAR PEDIDO =====
  function abrirModalAnular(pedido: any) {
    setModalAnular(pedido);
    setMotivoSeleccionado("");
  }

  async function confirmarAnulacion() {
    if (!modalAnular || !motivoSeleccionado) return;
    const pedido = modalAnular;
    setModalAnular(null);
    setAnulando(pedido.id);

    const { error } = await supabase
      .from("pedidos")
      .update({ anulado: true, estado_envio: "anulado", motivo_anulacion: motivoSeleccionado })
      .eq("id", pedido.id);
    setAnulando(null);
    if (error) { alert("Error al anular el pedido"); return; }

    const proveedor = getProveedorPedido(pedido);
    let emailProveedor = "";
    if (proveedor.id) {
      const { data: provPerfil } = await supabase.from("usuarios").select("email").eq("id", proveedor.id).single();
      emailProveedor = provPerfil?.email || "";
    }
    try {
      await fetch("/api/send-anulacion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pedidoCodigo: pedido.codigo || `#${pedido.id}`,
          pedidoId: pedido.id,
          pedidoTotal: pedido.total,
          pedidoFecha: pedido.created_at,
          anuladorTipo: "taller",
          anuladorNombre: "",
          clienteEmail: pedido.cliente_email || userEmail,
          clienteNombre: pedido.cliente_nombre || pedido.cliente_email || "",
          proveedorEmail: emailProveedor,
          proveedorNombre: proveedor.nombre,
          productos: pedido.productos || [],
          motivoAnulacion: motivoSeleccionado,
        }),
      });
    } catch (e) { console.error("Error enviando email anulación:", e); }

    cargarPedidos();
  }

  // ===== SOLICITAR FACTURA =====
  async function solicitarFactura(pedido: any) {
    setSolicitandoFactura(pedido.id);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: perfil } = await supabase
      .from("usuarios")
      .select("nombre_empresa, cif, telefono, direccion, ciudad, codigo_postal")
      .eq("id", user.id)
      .single();

    const proveedor = getProveedorPedido(pedido);

    // Obtener email del proveedor
    let emailProveedor = "info@recambiodirecto.es";
    if (proveedor.id) {
      const { data: provPerfil } = await supabase
        .from("usuarios")
        .select("email")
        .eq("id", proveedor.id)
        .single();
      if (provPerfil?.email) emailProveedor = provPerfil.email;
    }

    try {
      await fetch("/api/send-solicitud-factura", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pedidoCodigo: pedido.codigo || `#${pedido.id}`,
          pedidoId: pedido.id,
          pedidoTotal: pedido.total,
          pedidoFecha: pedido.created_at,
          clienteEmail: user.email,
          clienteNombre: perfil?.nombre_empresa || user.email,
          clienteCif: perfil?.cif || "-",
          clienteTelefono: perfil?.telefono || "-",
          clienteDireccion: [perfil?.direccion, perfil?.ciudad, perfil?.codigo_postal].filter(Boolean).join(", "),
          proveedorNombre: proveedor.nombre,
          emailProveedor,
        }),
      });
      alert("✅ Solicitud de factura enviada correctamente. El proveedor la recibirá por email.");
    } catch (e) {
      alert("Error al enviar la solicitud");
    }
    setSolicitandoFactura(null);
  }

  async function abrirChat(pedido: any) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const proveedor = getProveedorPedido(pedido);
    let proveedorId = proveedor.id;

    if (!proveedorId && proveedor.nombre && proveedor.nombre !== "-") {
      const { data: provData } = await supabase.from("usuarios").select("id").ilike("nombre_empresa", proveedor.nombre).maybeSingle();
      if (provData?.id) proveedorId = provData.id;
    }
    if (!proveedorId) {
      const { data: provData } = await supabase.from("usuarios").select("id").eq("tipo", "proveedor").limit(1).maybeSingle();
      if (provData?.id) proveedorId = provData.id;
    }
    if (!proveedorId) { alert("No se puede identificar el proveedor"); return; }

    // Buscar conversación ESPECÍFICA de este pedido (no reutilizar otras)
    const { data: convExistente } = await supabase
      .from("conversaciones")
      .select("id")
      .eq("pedido_id", pedido.id)
      .maybeSingle();

    if (convExistente) { router.push(`/chat?conv=${convExistente.id}`); return; }

    // Crear nueva conversación vinculada EXCLUSIVAMENTE a este pedido
    const { data: nuevaConv, error } = await supabase.from("conversaciones").insert({
      user1_id: user.id,
      user2_id: proveedorId,
      pedido_id: pedido.id,
      referencia: `Pedido #${pedido.id}${pedido.codigo ? ` — ${pedido.codigo}` : ""}`,
      ultimo_mensaje: "",
      updated_at: new Date().toISOString(),
    }).select("id").single();

    if (!error && nuevaConv) router.push(`/chat?conv=${nuevaConv.id}`);
    else alert("Error al abrir el chat");
  }

  const pedidosFiltrados = pedidos.filter(p => {
    if (p.anulado && filtroEstado !== "todos" && filtroEstado !== "anulado") return false;

    if (busqueda) {
      const q = busqueda.toLowerCase();
      const proveedor = getProveedorPedido(p);
      const productos = (p.productos || []).map((pr: any) => `${pr.referencia} ${pr.descripcion}`).join(" ").toLowerCase();
      const coincide =
        (p.codigo || "").toLowerCase().includes(q) ||
        String(p.id).includes(q) ||
        proveedor.nombre.toLowerCase().includes(q) ||
        productos.includes(q) ||
        (p.agencia || p.transporte || "").toLowerCase().includes(q);
      if (!coincide) return false;
    }

    if (filtroEstado !== "todos") {
      if (filtroEstado === "anulado") return p.anulado;
      if (p.anulado) return false;
      if ((p.estado_envio || "pendiente") !== filtroEstado) return false;
    }

    if (filtroFecha !== "todos") {
      const fecha = new Date(p.created_at);
      const ahora = new Date();
      if (filtroFecha === "hoy") { if (fecha.toDateString() !== ahora.toDateString()) return false; }
      else if (filtroFecha === "semana") { const h7 = new Date(); h7.setDate(ahora.getDate() - 7); if (fecha < h7) return false; }
      else if (filtroFecha === "mes") { if (fecha.getMonth() !== ahora.getMonth() || fecha.getFullYear() !== ahora.getFullYear()) return false; }
    }

    return true;
  });

  const contadores = {
    todos: pedidos.length,
    pendiente: pedidos.filter(p => !p.anulado && (p.estado_envio || "pendiente") === "pendiente").length,
    preparando: pedidos.filter(p => !p.anulado && p.estado_envio === "preparando").length,
    enviado: pedidos.filter(p => !p.anulado && p.estado_envio === "enviado").length,
    entregado: pedidos.filter(p => !p.anulado && p.estado_envio === "entregado").length,
    anulado: pedidos.filter(p => p.anulado).length,
  };

  return (
    <main style={mainStyle}>

      <div style={topHeader}>
        <div>
          <div style={badgeStyle}>PANEL ENTERPRISE</div>
          <h1 style={titleStyle}>MIS PEDIDOS</h1>
          <p style={subtitleStyle}>Gestión completa de pedidos, tracking y control logístico.</p>
        </div>
        <div style={statsBox}>
          <p style={statsLabel}>PEDIDOS</p>
          <h2 style={statsValue}>{pedidos.length}</h2>
        </div>
      </div>

      {/* FILTROS */}
      <div style={filtrosContainer}>
        <div style={searchBox}>
          <span style={{ fontSize: 18, marginRight: 10 }}>🔍</span>
          <input placeholder="Buscar por código, referencia, proveedor, agencia..." value={busqueda} onChange={e => setBusqueda(e.target.value)} style={searchInput} />
          {busqueda && <button onClick={() => setBusqueda("")} style={btnLimpiar}>✕</button>}
        </div>

        <div style={filtroGrupo}>
          <span style={filtroLabel}>ESTADO</span>
          <div style={botonesGrupo}>
            {[
              { key: "todos",     label: `Todos (${contadores.todos})` },
              { key: "pendiente", label: `⏳ Pendiente (${contadores.pendiente})` },
              { key: "preparando",label: `🔧 Preparando (${contadores.preparando})` },
              { key: "enviado",   label: `🚚 Enviado (${contadores.enviado})` },
              { key: "entregado", label: `✅ Entregado (${contadores.entregado})` },
              { key: "anulado",   label: `❌ Anulado (${contadores.anulado})` },
            ].map(({ key, label }) => (
              <button key={key} onClick={() => setFiltroEstado(key)} style={{
                ...btnFiltro,
                background: filtroEstado === key ? (key === "anulado" ? "rgba(239,68,68,0.3)" : "linear-gradient(135deg,#2563eb,#1d4ed8)") : "rgba(255,255,255,0.05)",
                border: filtroEstado === key ? "none" : "1px solid rgba(255,255,255,0.08)",
                color: filtroEstado === key ? "white" : "#94a3b8",
              }}>{label}</button>
            ))}
          </div>
        </div>

        <div style={filtroGrupo}>
          <span style={filtroLabel}>FECHA</span>
          <div style={botonesGrupo}>
            {[
              { key: "todos", label: "Todos" },
              { key: "hoy", label: "Hoy" },
              { key: "semana", label: "Esta semana" },
              { key: "mes", label: "Este mes" },
            ].map(({ key, label }) => (
              <button key={key} onClick={() => setFiltroFecha(key)} style={{
                ...btnFiltro,
                background: filtroFecha === key ? "rgba(139,92,246,0.3)" : "rgba(255,255,255,0.05)",
                border: filtroFecha === key ? "1px solid rgba(139,92,246,0.5)" : "1px solid rgba(255,255,255,0.08)",
                color: filtroFecha === key ? "#a78bfa" : "#94a3b8",
              }}>{label}</button>
            ))}
          </div>
        </div>

        {(busqueda || filtroEstado !== "todos" || filtroFecha !== "todos") && (
          <div style={resultadosRow}>
            <span style={{ color: "#94a3b8", fontSize: 14 }}>
              {pedidosFiltrados.length} pedido{pedidosFiltrados.length !== 1 ? "s" : ""} encontrado{pedidosFiltrados.length !== 1 ? "s" : ""}
            </span>
            <button onClick={() => { setBusqueda(""); setFiltroEstado("todos"); setFiltroFecha("todos"); }} style={btnResetFiltros}>
              Limpiar filtros
            </button>
          </div>
        )}
      </div>

      {pedidos.length === 0 && (
        <div style={emptyBox}>
          <p style={{ fontSize: 48, marginBottom: 16 }}>🛒</p>
          <h2 style={{ fontSize: 24, fontWeight: 900 }}>No hay pedidos todavía</h2>
          <p style={{ color: "#94a3b8", marginTop: 10 }}>Cuando realices un pedido aparecerá aquí</p>
          <button onClick={() => router.push("/dashboard")} style={btnVolver}>BUSCAR RECAMBIOS</button>
        </div>
      )}

      {pedidos.length > 0 && pedidosFiltrados.length === 0 && (
        <div style={emptyBox}>
          <p style={{ fontSize: 48, marginBottom: 16 }}>🔍</p>
          <h2 style={{ fontSize: 24, fontWeight: 900 }}>Sin resultados</h2>
          <p style={{ color: "#94a3b8", marginTop: 10 }}>No hay pedidos que coincidan con los filtros</p>
          <button onClick={() => { setBusqueda(""); setFiltroEstado("todos"); setFiltroFecha("todos"); }} style={btnVolver}>LIMPIAR FILTROS</button>
        </div>
      )}

      <div style={pedidosGrid}>
        {pedidosFiltrados.map((pedido) => {
          const proveedor = getProveedorPedido(pedido);
          const anulado = pedido.anulado || false;
          const puedeAnular = !anulado && !["enviado", "entregado"].includes(pedido.estado_envio || "");

          return (
            <div key={pedido.id} style={{ ...pedidoCard, opacity: anulado ? 0.7 : 1, border: anulado ? "1px solid rgba(239,68,68,0.2)" : "1px solid rgba(255,255,255,0.06)" }}>

              <div style={pedidoTop}>
                <div>
                  <p style={pedidoCode}>{pedido.codigo}</p>
                  <h2 style={pedidoId}>Pedido #{pedido.id}</h2>
                  <p style={pedidoDate}>{new Date(pedido.created_at).toLocaleDateString("es-ES")}</p>
                </div>
                <div style={getEstadoStyle(pedido.estado_envio || "pendiente", anulado)}>
                  {anulado ? "ANULADO" : (pedido.estado_envio || "pendiente")}
                </div>
              </div>

              {/* PROVEEDOR */}
              <div style={proveedorBox}>
                <span style={{ fontSize: 16 }}>🏭</span>
                <div>
                  <p style={{ color: "#94a3b8", fontSize: 12, fontWeight: 700 }}>PROVEEDOR</p>
                  <p style={{ fontWeight: 800, fontSize: 16 }}>{proveedor.nombre}</p>
                </div>
              </div>

              {(pedido.productos || []).length > 0 && (
                <div style={productsBox}>
                  <h3 style={sectionTitle}>PRODUCTOS</h3>
                  {(pedido.productos || []).map((producto: any, index: number) => (
                    <div key={index} style={productRow}>
                      <div>
                        <h4 style={productTitle}>{producto.descripcion}</h4>
                        <p style={productRef}>REF: {producto.referencia}</p>
                      </div>
                      <strong style={productPrice}>{fmt(producto.precio)}€</strong>
                    </div>
                  ))}
                </div>
              )}

              <div style={infoGrid}>
                <div style={infoCard}>
                  <p style={infoLabel}>TOTAL</p>
                  <h3 style={priceText}>{fmt(pedido.total)}€</h3>
                </div>
                <div style={infoCard}>
                  <p style={infoLabel}>TRANSPORTE</p>
                  <h3 style={infoValue}>{pedido.agencia || pedido.transporte || "-"}</h3>
                </div>
              </div>

              <div style={statusGrid}>
                <div style={statusCard}>
                  <p style={statusLabel}>PAGO</p>
                  <h3 style={statusValue}>{pedido.estado_pago || "pendiente"}</h3>
                </div>
                <div style={statusCard}>
                  <p style={statusLabel}>ENVÍO</p>
                  <h3 style={statusValue}>{anulado ? "Anulado" : (pedido.estado_envio || "pendiente")}</h3>
                </div>
              </div>

              {pedido.tracking && !anulado && (
                <div style={trackingBox}>
                  <p style={trackingLabel}>TRACKING</p>
                  <h3 style={trackingValue}>{pedido.tracking}</h3>
                </div>
              )}

              {/* ALBARAN DESCARGABLE */}
              {pedido.albaran_url && (
                <div style={{ marginBottom: 12 }}>
                  <a
                    href={pedido.albaran_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(37,99,235,0.15)", border: "1px solid rgba(37,99,235,0.3)", color: "#60a5fa", padding: "10px 18px", borderRadius: 10, fontWeight: 700, fontSize: 13, textDecoration: "none" }}
                  >
                    📄 Descargar albaran PDF
                  </a>
                </div>
              )}

              {/* FACTURA DISPONIBLE */}
              {pedido.factura_url && !anulado && (
                <div style={facturaBox}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 20 }}>📄</span>
                    <div>
                      <p style={{ fontWeight: 700, fontSize: 14 }}>Factura disponible</p>
                      <p style={{ color: "#94a3b8", fontSize: 12 }}>{pedido.factura_nombre || "factura.pdf"}</p>
                    </div>
                  </div>
                  <a href={pedido.factura_url} target="_blank" rel="noopener noreferrer" style={btnDescargarFactura}>
                    ⬇️ Descargar
                  </a>
                </div>
              )}

              {/* ACCIONES */}
              {!anulado && (
                <div style={accionesRow}>
                  <button onClick={() => abrirChat(pedido)} style={btnChat}>
                    💬 Chat con proveedor
                  </button>
                  <button
                    onClick={() => solicitarFactura(pedido)}
                    disabled={solicitandoFactura === pedido.id}
                    style={{ ...btnFactura, opacity: solicitandoFactura === pedido.id ? 0.7 : 1 }}
                  >
                    {solicitandoFactura === pedido.id ? "Enviando..." : "🧾 Solicitar factura"}
                  </button>
                  {puedeAnular && (
                    <button
                      onClick={() => abrirModalAnular(pedido)}
                      disabled={anulando === pedido.id}
                      style={{ ...btnAnular, opacity: anulando === pedido.id ? 0.7 : 1 }}
                    >
                      {anulando === pedido.id ? "Anulando..." : "❌ Anular"}
                    </button>
                  )}
                </div>
              )}

              {anulado && (
                <div style={anuladoBanner}>
                  ❌ Este pedido fue anulado
                  {pedido.motivo_anulacion && (
                    <p style={{ fontSize: 13, marginTop: 6, fontWeight: 400, color: "#fca5a5" }}>
                      Motivo: {pedido.motivo_anulacion}
                    </p>
                  )}
                </div>
              )}

            </div>
          );
        })}
      </div>
      {/* MODAL MOTIVO ANULACIÓN */}
      {modalAnular && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 99999, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "#0f172a", borderRadius: 24, padding: "clamp(20px,4vw,36px)", width: "min(480px, 92vw)", border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 30px 80px rgba(0,0,0,0.8)" }}>
            <h2 style={{ fontSize: 22, fontWeight: 900, marginBottom: 8 }}>❌ Anular pedido</h2>
            <p style={{ color: "#94a3b8", fontSize: 14, marginBottom: 24 }}>
              Pedido <strong style={{ color: "white" }}>{modalAnular.codigo || `#${modalAnular.id}`}</strong> — Selecciona el motivo de anulación.
            </p>
            <div style={{ display: "flex", flexDirection: "column" as const, gap: 10, marginBottom: 24 }}>
              {[
                "🚫 Ya no necesito el artículo",
                "💳 La forma de pago no es la acordada",
                "💶 El precio no coincide con el publicado",
                "📍 El artículo no está disponible en la ubicación indicada",
                "⏱️ El plazo de entrega es demasiado largo",
              ].map(motivo => (
                <button
                  key={motivo}
                  onClick={() => setMotivoSeleccionado(motivo)}
                  style={{
                    padding: "14px 18px", borderRadius: 12, textAlign: "left" as const,
                    fontWeight: 700, fontSize: 15, cursor: "pointer",
                    background: motivoSeleccionado === motivo ? "rgba(239,68,68,0.2)" : "rgba(255,255,255,0.05)",
                    border: motivoSeleccionado === motivo ? "2px solid rgba(239,68,68,0.5)" : "1px solid rgba(255,255,255,0.08)",
                    color: motivoSeleccionado === motivo ? "#f87171" : "white",
                  }}
                >{motivo}</button>
              ))}
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              <button
                onClick={() => setModalAnular(null)}
                style={{ flex: 1, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#94a3b8", padding: "14px", borderRadius: 12, cursor: "pointer", fontWeight: 700 }}
              >Cancelar</button>
              <button
                onClick={confirmarAnulacion}
                disabled={!motivoSeleccionado}
                style={{ flex: 1, background: motivoSeleccionado ? "linear-gradient(135deg,#dc2626,#991b1b)" : "rgba(255,255,255,0.05)", border: "none", color: motivoSeleccionado ? "white" : "#94a3b8", padding: "14px", borderRadius: 12, cursor: motivoSeleccionado ? "pointer" : "not-allowed", fontWeight: 900, fontSize: 15 }}
              >Confirmar anulación</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

/* STYLES */
const mainStyle = { padding: "clamp(16px, 4vw, 50px)", minHeight: "100vh", background: "linear-gradient(135deg,#020617,#020b2d)", color: "white" };
const topHeader = { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "clamp(20px,4vw,40px)", flexWrap: "wrap" as const, gap: 16 };
const badgeStyle = { display: "inline-block", padding: "8px 14px", borderRadius: "999px", background: "rgba(37,99,235,0.18)", color: "#60a5fa", border: "1px solid rgba(37,99,235,0.3)", marginBottom: "16px", fontWeight: 700, fontSize: 13 };
const titleStyle = { fontSize: "clamp(36px,8vw,72px)", fontWeight: 900, lineHeight: 1, marginBottom: "16px" };
const subtitleStyle = { color: "#94a3b8", fontSize: "clamp(14px,2vw,20px)", maxWidth: "700px", lineHeight: 1.7 };
const statsBox = { background: "rgba(15,23,42,0.92)", borderRadius: "20px", padding: "20px 24px", border: "1px solid rgba(255,255,255,0.06)" };
const statsLabel = { color: "#94a3b8", marginBottom: "8px", fontSize: 13 };
const statsValue = { fontSize: "clamp(32px,6vw,58px)", fontWeight: 900 };
const filtrosContainer = { background: "rgba(15,23,42,0.92)", borderRadius: 24, padding: "24px 28px", marginBottom: 32, border: "1px solid rgba(255,255,255,0.06)", display: "flex", flexDirection: "column" as const, gap: 20 };
const searchBox = { display: "flex", alignItems: "center", background: "#0f172a", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: "0 16px", height: 52 };
const searchInput = { flex: 1, background: "transparent", border: "none", color: "white", fontSize: 15, outline: "none" };
const btnLimpiar = { background: "transparent", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: 16, padding: "0 4px" };
const filtroGrupo = { display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" as const };
const filtroLabel = { color: "#94a3b8", fontSize: 12, fontWeight: 700, minWidth: 50 };
const botonesGrupo = { display: "flex", gap: 8, flexWrap: "wrap" as const };
const btnFiltro = { padding: "8px 16px", borderRadius: 999, fontWeight: 700, cursor: "pointer", fontSize: 13, transition: "all 0.2s" };
const resultadosRow = { display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 8, borderTop: "1px solid rgba(255,255,255,0.06)" };
const btnResetFiltros = { background: "transparent", border: "1px solid rgba(255,255,255,0.1)", color: "#94a3b8", padding: "6px 14px", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 700 };
const emptyBox = { background: "rgba(15,23,42,0.92)", padding: "60px", borderRadius: "30px", textAlign: "center" as const, marginBottom: 30 };
const btnVolver = { marginTop: 24, background: "linear-gradient(135deg,#2563eb,#1d4ed8)", border: "none", color: "white", padding: "16px 32px", borderRadius: 16, fontWeight: 800, cursor: "pointer", fontSize: 16 };
const pedidosGrid = { display: "grid", gap: "30px" };
const pedidoCard = { background: "rgba(15,23,42,0.92)", borderRadius: "clamp(16px,3vw,32px)", padding: "clamp(16px,3vw,36px)" };
const pedidoTop = { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px", gap: 12 };
const pedidoCode = { color: "#60a5fa", marginBottom: "8px", fontWeight: 700, fontSize: 13 };
const pedidoId = { fontSize: "clamp(22px,5vw,42px)", fontWeight: 900 };
const pedidoDate = { color: "#94a3b8", marginTop: "8px", fontSize: 13 };
const proveedorBox = { display: "flex", alignItems: "center", gap: 14, background: "rgba(37,99,235,0.08)", border: "1px solid rgba(37,99,235,0.15)", borderRadius: 16, padding: "14px 20px", marginBottom: 24 };
const productsBox = { marginBottom: "30px" };
const sectionTitle = { fontSize: "26px", fontWeight: 900, marginBottom: "20px" };
const productRow = { display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: "18px", marginBottom: "18px", borderBottom: "1px solid rgba(255,255,255,0.06)" };
const productTitle = { fontSize: "20px", fontWeight: 800 };
const productRef = { color: "#94a3b8", marginTop: "6px" };
const productPrice = { color: "#22c55e", fontSize: "22px" };
const infoGrid = { display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: "clamp(10px,2vw,20px)", marginBottom: "clamp(12px,2vw,24px)" };
const infoCard = { background: "#0f172a", padding: "clamp(14px,2vw,24px)", borderRadius: "clamp(12px,2vw,20px)" };
const infoLabel = { color: "#94a3b8", marginBottom: "8px", fontSize: "clamp(11px,1.5vw,14px)" };
const infoValue = { fontSize: "clamp(16px,3vw,24px)", fontWeight: 800 };
const priceText = { fontSize: "clamp(22px,4vw,34px)", fontWeight: 900, color: "#22c55e" };
const statusGrid = { display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: "clamp(10px,2vw,20px)", marginBottom: "clamp(12px,2vw,24px)" };
const statusCard = { background: "#0f172a", padding: "clamp(12px,2vw,22px)", borderRadius: "clamp(12px,2vw,20px)" };
const statusLabel = { color: "#94a3b8", marginBottom: "8px", fontSize: "clamp(11px,1.5vw,14px)" };
const statusValue = { fontSize: "clamp(15px,2.5vw,22px)", fontWeight: 800 };
const trackingBox = { background: "linear-gradient(135deg,#2563eb,#1d4ed8)", borderRadius: "24px", padding: "24px", marginBottom: "24px" };
const trackingLabel = { marginBottom: "10px", opacity: 0.8 };
const trackingValue = { fontSize: "28px", fontWeight: 900 };
const facturaBox = { display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(22,163,74,0.08)", border: "1px solid rgba(22,163,74,0.2)", borderRadius: 16, padding: "16px 20px", marginBottom: 16 };
const btnDescargarFactura = { background: "linear-gradient(135deg,#16a34a,#15803d)", color: "white", padding: "10px 20px", borderRadius: 12, fontWeight: 700, textDecoration: "none", fontSize: 14 };
const accionesRow = { display: "flex", gap: 10, marginTop: 8, flexWrap: "wrap" as const };
const btnChat = { background: "linear-gradient(135deg,#2563eb,#1d4ed8)", border: "none", color: "white", padding: "14px 16px", borderRadius: 14, fontWeight: 800, cursor: "pointer", fontSize: 14, flex: 1, minWidth: 120 };
const btnFactura = { background: "rgba(139,92,246,0.15)", border: "1px solid rgba(139,92,246,0.3)", color: "#a78bfa", padding: "14px 16px", borderRadius: 14, fontWeight: 800, cursor: "pointer", fontSize: 13 };
const btnAnular = { background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171", padding: "14px 16px", borderRadius: 14, fontWeight: 800, cursor: "pointer", fontSize: 13 };
const anuladoBanner = { background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171", padding: "16px 24px", borderRadius: 16, marginTop: 8, fontWeight: 700, textAlign: "center" as const };