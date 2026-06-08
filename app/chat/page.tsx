"use client";

import { Suspense } from "react";
import { useEffect, useState, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "../lib/supabase";

type Conversacion = {
  id: number;
  user1_id: string;
  user2_id: string;
  referencia?: string;
  ultimo_mensaje?: string;
  updated_at?: string;
  participante_nombre?: string;
  participante_id?: string;
  pedido_id?: number;
};

type Mensaje = {
  id: number;
  conversacion_id: number;
  user_id?: string;
  mensaje: string;
  emisor?: string;
  created_at: string;
  leido?: boolean;
  adjunto_url?: string;
  adjunto_nombre?: string;
  adjunto_tipo?: string;
};

type PerfilProveedor = {
  nombre_empresa?: string;
  email?: string;
  telefono?: string;
  direccion?: string;
  ciudad?: string;
  provincia?: string;
  cif?: string;
  horario_apertura?: string;
  horario_cierre?: string;
  dias_apertura?: string[];
};

function tiempoRelativo(fecha: string) {
  if (!fecha) return "";
  const diff = Math.floor((Date.now() - new Date(fecha).getTime()) / 1000);
  if (diff < 60) return "Ahora";
  if (diff < 3600) return `${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  if (diff < 172800) return "Ayer";
  return new Date(fecha).toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit" });
}

function Ticks({ leido }: { leido?: boolean }) {
  return <span style={{ fontSize: 12, marginLeft: 4 }}>{leido ? <span style={{ color: "#60a5fa" }}>✓✓</span> : <span style={{ color: "rgba(255,255,255,0.35)" }}>✓</span>}</span>;
}

function esImagen(tipo?: string) { return tipo?.startsWith("image/"); }

function ChatPageInner() {
  const searchParams = useSearchParams();
  const convParam = searchParams.get("conv");
  const [conversaciones, setConversaciones] = useState<Conversacion[]>([]);
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [chatActivo, setChatActivo] = useState<number | null>(null);
  const [texto, setTexto] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState("");
  const [cargando, setCargando] = useState(true);
  const [subiendo, setSubiendo] = useState(false);
  const [fichaVisible, setFichaVisible] = useState(false);
  const [perfilProveedor, setPerfilProveedor] = useState<PerfilProveedor | null>(null);
  const [pedidoInfo, setPedidoInfo] = useState<any>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [vistaMovil, setVistaMovil] = useState<"lista" | "chat">("lista");
  const mensajesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const userIdRef = useRef<string | null>(null);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => { iniciar(); }, []);

  useEffect(() => {
    if (chatActivo !== null) { cargarMensajes(chatActivo); cargarPedidoInfo(chatActivo); }
  }, [chatActivo]);

  useEffect(() => { mensajesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [mensajes]);

  async function iniciar() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setUserId(user.id);
    userIdRef.current = user.id;
    await cargarConversaciones(user.id);
    setCargando(false);
  }

  async function cargarConversaciones(uid: string) {
    const { data: conv1 } = await supabase.from("conversaciones").select("*").eq("user1_id", uid).order("updated_at", { ascending: false });
    const { data: conv2 } = await supabase.from("conversaciones").select("*").eq("user2_id", uid).order("updated_at", { ascending: false });
    const todasConvs = [...(conv1 || []), ...(conv2 || [])];
    if (todasConvs.length === 0) { await cargarDesdeMessagesPedido(uid); return; }
    const convsConNombre: Conversacion[] = await Promise.all(todasConvs.map(async (conv) => {
      const otroId = conv.user1_id === uid ? conv.user2_id : conv.user1_id;
      if (!otroId) return { ...conv, participante_nombre: "Usuario", participante_id: otroId };
      const { data: perfil } = await supabase.from("usuarios").select("nombre_empresa, email").eq("id", otroId).single();
      return { ...conv, participante_nombre: perfil?.nombre_empresa || perfil?.email || "Usuario", participante_id: otroId };
    }));
    const ordenadas = convsConNombre.sort((a, b) => new Date(b.updated_at || "").getTime() - new Date(a.updated_at || "").getTime());
    setConversaciones(ordenadas);
    if (convParam) { setChatActivo(parseInt(convParam)); if (isMobile) setVistaMovil("chat"); }
  }

  async function cargarDesdeMessagesPedido(uid: string) {
    const { data: pedidosData } = await supabase.from("pedidos").select("id, codigo, cliente_nombre, created_at").order("id", { ascending: false });
    if (!pedidosData) return;
    const { data: msgData } = await supabase.from("mensajes_pedido").select("pedido_id, mensaje, created_at, emisor").order("created_at", { ascending: false });
    if (!msgData) return;
    const pedidosConMensajes = new Map<number, any>();
    msgData.forEach(m => { if (!pedidosConMensajes.has(m.pedido_id)) pedidosConMensajes.set(m.pedido_id, m); });
    const convs: Conversacion[] = pedidosData.filter(p => pedidosConMensajes.has(p.id)).map(p => {
      const lastMsg = pedidosConMensajes.get(p.id);
      return { id: p.id, user1_id: uid, user2_id: "", referencia: `Pedido #${p.id}`, ultimo_mensaje: lastMsg?.mensaje || "", updated_at: lastMsg?.created_at || p.created_at, participante_nombre: p.cliente_nombre || `Pedido #${p.id}`, pedido_id: p.id };
    }).sort((a, b) => new Date(b.updated_at || "").getTime() - new Date(a.updated_at || "").getTime());
    setConversaciones(convs);
    if (convParam) { setChatActivo(parseInt(convParam)); if (isMobile) setVistaMovil("chat"); }
  }

  async function cargarPedidoInfo(convId: number) {
    const { data: conv } = await supabase.from("conversaciones").select("pedido_id, referencia").eq("id", convId).single();
    let pedidoId: number | null = null;
    if (conv?.pedido_id) pedidoId = conv.pedido_id;
    else if (conv?.referencia) { const match = conv.referencia.match(/Pedido\s*#(\d+)/i); if (match) pedidoId = parseInt(match[1]); }
    if (!pedidoId) { setPedidoInfo(null); return; }
    const { data } = await supabase.from("pedidos").select("id, codigo, total, estado_envio, transporte, created_at, productos").eq("id", pedidoId).single();
    if (data) setPedidoInfo(data); else setPedidoInfo(null);
  }

  async function cargarMensajes(convId: number) {
    const { data: msgData } = await supabase.from("mensajes").select("*").eq("conversacion_id", convId).order("created_at", { ascending: true });
    if (msgData && msgData.length > 0) {
      setMensajes(msgData);
      const uid = userIdRef.current;
      if (uid) {
        await supabase.from("mensajes")
          .update({ leido: true })
          .eq("conversacion_id", convId)
          .neq("user_id", uid);
        // Limpiar cooldown para que al volver al dashboard recargue las notificaciones
        // y las encuentre ya como leídas en Supabase
        sessionStorage.removeItem(`rd_notif_last_${uid}`);
      }
      return;
    }
    const { data: msgPedido } = await supabase.from("mensajes_pedido").select("*").eq("pedido_id", convId).order("created_at", { ascending: true });
    if (msgPedido) setMensajes(msgPedido.map((m: any) => ({ id: m.id, conversacion_id: convId, user_id: m.user_id || userId || "", mensaje: m.mensaje, emisor: m.emisor, created_at: m.created_at, leido: m.leido || false, adjunto_url: m.adjunto_url, adjunto_nombre: m.adjunto_nombre, adjunto_tipo: m.adjunto_tipo })));
  }

  async function enviarMensaje() {
    if (!texto.trim() || chatActivo === null || !userId) return;
    const convActiva = conversaciones.find(c => c.id === chatActivo);
    const esConvReal = convActiva?.user2_id && convActiva.user2_id !== "";
    if (esConvReal) {
      const { data, error } = await supabase.from("mensajes").insert({ conversacion_id: chatActivo, user_id: userId, mensaje: texto.trim(), emisor: "cliente", leido: false }).select().single();
      if (!error && data) { setMensajes(prev => [...prev, data]); await supabase.from("conversaciones").update({ ultimo_mensaje: texto.trim(), updated_at: new Date().toISOString() }).eq("id", chatActivo); setConversaciones(prev => prev.map(c => c.id === chatActivo ? { ...c, ultimo_mensaje: texto.trim(), updated_at: new Date().toISOString() } : c)); }
    } else {
      const { data, error } = await supabase.from("mensajes_pedido").insert({ pedido_id: chatActivo, emisor: "cliente", mensaje: texto.trim(), user_id: userId, leido: false }).select().single();
      if (!error && data) setMensajes(prev => [...prev, { id: data.id, conversacion_id: chatActivo, user_id: userId, mensaje: texto.trim(), emisor: "cliente", created_at: new Date().toISOString(), leido: false }]);
    }
    setTexto("");
  }

  async function subirAdjunto(file: File) {
    if (!chatActivo || !userId) return;
    setSubiendo(true);
    const ext = file.name.split(".").pop();
    const path = `${userId}/${chatActivo}/${Date.now()}.${ext}`;
    const { error: uploadError } = await supabase.storage.from("chat-adjuntos").upload(path, file, { contentType: file.type });
    if (uploadError) { alert("Error al subir el archivo"); setSubiendo(false); return; }
    const { data: urlData } = supabase.storage.from("chat-adjuntos").getPublicUrl(path);
    const url = urlData.publicUrl;
    const convActiva = conversaciones.find(c => c.id === chatActivo);
    const esConvReal = convActiva?.user2_id && convActiva.user2_id !== "";
    if (esConvReal) {
      const { data } = await supabase.from("mensajes").insert({ conversacion_id: chatActivo, user_id: userId, mensaje: `📎 ${file.name}`, emisor: "cliente", leido: false, adjunto_url: url, adjunto_nombre: file.name, adjunto_tipo: file.type }).select().single();
      if (data) setMensajes(prev => [...prev, data]);
    }
    setSubiendo(false);
  }

  async function borrarConversacion(convId: number) {
    if (!confirm("¿Eliminar esta conversación?")) return;
    await supabase.from("mensajes").delete().eq("conversacion_id", convId).eq("user_id", userId);
    setConversaciones(prev => prev.filter(c => c.id !== convId));
    if (chatActivo === convId) { setChatActivo(null); setVistaMovil("lista"); }
  }

  async function cargarFichaProveedor(participanteId?: string) {
    if (!participanteId) return;
    const { data } = await supabase.from("usuarios").select("nombre_empresa, email, telefono, direccion, ciudad, provincia, cif, horario_apertura, horario_cierre, dias_apertura").eq("id", participanteId).single();
    if (data) { setPerfilProveedor(data); setFichaVisible(true); }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); enviarMensaje(); }
  }

  const convActiva = conversaciones.find(c => c.id === chatActivo);
  const convFiltradas = conversaciones.filter(c => {
    if (!busqueda) return true;
    return (c.participante_nombre || "").toLowerCase().includes(busqueda.toLowerCase()) || (c.ultimo_mensaje || "").toLowerCase().includes(busqueda.toLowerCase()) || (c.referencia || "").toLowerCase().includes(busqueda.toLowerCase());
  });

  function abrirChat(convId: number) {
    setChatActivo(convId);
    setFichaVisible(false);
    if (isMobile) setVistaMovil("chat");
  }

  /* ── PANEL MENSAJES (compartido móvil/desktop) ── */


  /* ── MÓVIL: vista tipo WhatsApp ── */
  if (isMobile) return (
    <div style={{ height: "100dvh", background: "#020b2d", color: "white", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {vistaMovil === "lista" ? (
        /* Lista conversaciones móvil */
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <div style={{ padding: "16px 16px 12px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <h1 style={{ fontSize: 22, fontWeight: 900, marginBottom: 10 }}>Chats</h1>
            <input placeholder="Buscar..." value={busqueda} onChange={e => setBusqueda(e.target.value)} style={{ width: "100%", height: 38, borderRadius: 10, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)", padding: "0 12px", color: "white", fontSize: 14, outline: "none", boxSizing: "border-box" }} />
          </div>
          <div style={{ flex: 1, overflowY: "auto" }}>
            {cargando ? <div style={{ padding: 40, textAlign: "center", color: "#94a3b8" }}>Cargando...</div> :
              convFiltradas.length === 0 ? <div style={{ padding: 40, textAlign: "center", color: "#94a3b8" }}>No hay conversaciones</div> :
              convFiltradas.map(conv => (
                <div key={conv.id} onClick={() => abrirChat(conv.id)} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", borderBottom: "1px solid rgba(255,255,255,0.04)", cursor: "pointer", background: chatActivo === conv.id ? "rgba(37,99,235,0.15)" : "transparent" }}>
                  <div style={{ width: 46, height: 46, borderRadius: "50%", background: "linear-gradient(135deg,#2563eb,#1d4ed8)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 18, flexShrink: 0 }}>{(conv.participante_nombre || "?").charAt(0).toUpperCase()}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontWeight: 700, fontSize: 15 }}>{conv.participante_nombre}</span>
                      <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 11 }}>{tiempoRelativo(conv.updated_at || "")}</span>
                    </div>
                    {conv.referencia && <div style={{ color: "#60a5fa", fontSize: 11, fontWeight: 700 }}>{conv.referencia}</div>}
                    <div style={{ color: "rgba(255,255,255,0.45)", fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{conv.ultimo_mensaje || "Sin mensajes"}</div>
                  </div>
                </div>
              ))
            }
          </div>
        </div>
      ) : (
        /* Vista chat activo móvil */
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          {chatActivo !== null && (
          <>
          {/* CABECERA */}
      <div style={{ minHeight: 64, background: "#0a1628", borderBottom: "1px solid rgba(255,255,255,0.06)", padding: "10px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0, gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {isMobile && (
            <button onClick={() => setVistaMovil("lista")} style={{ background: "rgba(255,255,255,0.06)", border: "none", color: "white", width: 36, height: 36, borderRadius: 10, cursor: "pointer", fontSize: 18 }}>←</button>
          )}
          <div style={{ width: 40, height: 40, borderRadius: "50%", background: "linear-gradient(135deg,#2563eb,#1d4ed8)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 16, flexShrink: 0 }}>
            {(convActiva?.participante_nombre || "?").charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 onClick={() => cargarFichaProveedor(convActiva?.participante_id)} style={{ fontSize: isMobile ? 15 : 18, fontWeight: 900, margin: 0, cursor: "pointer", textDecoration: "underline dotted" }}>{convActiva?.participante_nombre || `Chat #${chatActivo}`}</h2>
            {convActiva?.referencia && <p style={{ color: "#60a5fa", fontSize: 11, margin: 0, marginTop: 2, fontWeight: 700 }}>{convActiva.referencia}</p>}
          </div>
        </div>
        {pedidoInfo && !isMobile && (
          <div style={{ background: "rgba(37,99,235,0.1)", border: "1px solid rgba(37,99,235,0.2)", borderRadius: 10, padding: "8px 14px", textAlign: "right", flexShrink: 0 }}>
            <div style={{ fontSize: 10, color: "#94a3b8" }}>PEDIDO VINCULADO</div>
            <div style={{ fontWeight: 800, color: "#60a5fa", fontSize: 13 }}>{pedidoInfo.codigo || `#${pedidoInfo.id}`}</div>
            <div style={{ fontSize: 11, color: "#94a3b8" }}>{Number(pedidoInfo.total).toFixed(2)}€</div>
          </div>
        )}
      </div>

      {/* MENSAJES */}
      <div style={{ flex: 1, overflowY: "auto", padding: isMobile ? "12px 12px 8px" : "24px 24px 8px" }}>
        {mensajes.length === 0 ? (
          <div style={{ textAlign: "center", color: "#94a3b8", marginTop: 40 }}><p style={{ fontSize: 32, marginBottom: 8 }}>👋</p><p>Empieza la conversación</p></div>
        ) : mensajes.map((msg, i) => {
          const esPropio = msg.user_id === userId;
          const msgAnterior = i > 0 ? mensajes[i - 1] : null;
          const mismoEmisor = msgAnterior ? (msgAnterior.user_id === msg.user_id || msgAnterior.emisor === msg.emisor) : false;
          return (
            <div key={msg.id} style={{ display: "flex", justifyContent: esPropio ? "flex-end" : "flex-start", marginBottom: mismoEmisor ? 4 : 12, paddingLeft: esPropio ? "15%" : 0, paddingRight: esPropio ? 0 : "15%" }}>
              {!esPropio && !mismoEmisor && <div style={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(37,99,235,0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 11, color: "#93c5fd", marginRight: 8, flexShrink: 0, alignSelf: "flex-end" }}>{(convActiva?.participante_nombre || "P").charAt(0).toUpperCase()}</div>}
              {!esPropio && mismoEmisor && <div style={{ width: 28, marginRight: 8 }} />}
              <div style={{ background: esPropio ? "linear-gradient(135deg,#2563eb,#1d4ed8)" : "#1e293b", padding: "10px 14px", borderRadius: esPropio ? "16px 16px 4px 16px" : "16px 16px 16px 4px", maxWidth: isMobile ? "85%" : 520, boxShadow: "0 2px 8px rgba(0,0,0,0.3)" }}>
                {!esPropio && !mismoEmisor && <p style={{ color: "#60a5fa", fontSize: 10, fontWeight: 700, marginBottom: 4 }}>{convActiva?.participante_nombre}</p>}
                {msg.adjunto_url && (
                  <div style={{ marginBottom: 8 }}>
                    {esImagen(msg.adjunto_tipo) ? <img src={msg.adjunto_url} alt={msg.adjunto_nombre} style={{ maxWidth: isMobile ? 200 : 280, maxHeight: 180, borderRadius: 8, display: "block" }} /> : <a href={msg.adjunto_url} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.1)", padding: "8px 12px", borderRadius: 8, textDecoration: "none", color: "white" }}><span style={{ fontSize: 18 }}>📄</span><span style={{ fontSize: 13, fontWeight: 700 }}>{msg.adjunto_nombre}</span></a>}
                  </div>
                )}
                {(!msg.adjunto_url || msg.mensaje !== `📎 ${msg.adjunto_nombre}`) && <p style={{ fontSize: isMobile ? 14 : 15, lineHeight: 1.5, margin: 0 }}>{msg.mensaje}</p>}
                <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", marginTop: 4, gap: 4 }}>
                  <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 10 }}>{new Date(msg.created_at).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}</span>
                  {esPropio && <Ticks leido={msg.leido} />}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={mensajesEndRef} />
      </div>

      {/* INPUT */}
      <div style={{ padding: isMobile ? "10px 12px" : "14px 20px", background: "#0a1628", borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", gap: 8, flexShrink: 0, alignItems: "center" }}>
        <input ref={fileInputRef} type="file" accept="image/*,.pdf,.doc,.docx,.xls,.xlsx" style={{ display: "none" }} onChange={e => { if (e.target.files?.[0]) subirAdjunto(e.target.files[0]); }} />
        <button onClick={() => fileInputRef.current?.click()} disabled={subiendo} style={{ width: 44, height: 44, borderRadius: "50%", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "white", cursor: "pointer", fontSize: 18, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>{subiendo ? "⏳" : "📎"}</button>
        <input type="text" placeholder="Escribe un mensaje..." value={texto} onChange={e => setTexto(e.target.value)} onKeyDown={handleKeyDown} style={{ flex: 1, height: 44, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 22, padding: "0 16px", color: "white", fontSize: 14, outline: "none" }} />
        <button onClick={enviarMensaje} disabled={!texto.trim()} style={{ height: 44, minWidth: isMobile ? 60 : 90, borderRadius: 22, background: "linear-gradient(135deg,#2563eb,#1d4ed8)", border: "none", color: "white", fontWeight: 800, fontSize: 14, opacity: texto.trim() ? 1 : 0.5, cursor: texto.trim() ? "pointer" : "not-allowed" }}>
          {isMobile ? "↑" : "Enviar"}
        </button>
      </div>
          </>
        )}
        </div>
      )}

      {/* Ficha proveedor móvil */}
      {fichaVisible && perfilProveedor && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", zIndex: 9999, display: "flex", alignItems: "flex-end" }}>
          <div style={{ background: "#0f172a", borderRadius: "20px 20px 0 0", padding: "24px 20px", width: "100%", maxHeight: "80vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h3 style={{ fontWeight: 900, fontSize: 18, margin: 0 }}>{perfilProveedor.nombre_empresa}</h3>
              <button onClick={() => setFichaVisible(false)} style={{ background: "rgba(255,255,255,0.06)", border: "none", color: "#94a3b8", width: 32, height: 32, borderRadius: "50%", cursor: "pointer", fontSize: 16 }}>✕</button>
            </div>
            {perfilProveedor.telefono && <a href={`tel:${perfilProveedor.telefono}`} style={{ display: "flex", alignItems: "center", gap: 10, background: "rgba(37,99,235,0.1)", border: "1px solid rgba(37,99,235,0.2)", borderRadius: 12, padding: "12px 16px", marginBottom: 10, textDecoration: "none", color: "white" }}><span style={{ fontSize: 20 }}>📞</span><div><p style={{ margin: 0, fontWeight: 800 }}>{perfilProveedor.telefono}</p><p style={{ margin: 0, color: "#94a3b8", fontSize: 12 }}>Llamar</p></div></a>}
            {perfilProveedor.email && <a href={`mailto:${perfilProveedor.email}`} style={{ display: "flex", alignItems: "center", gap: 10, background: "rgba(139,92,246,0.1)", border: "1px solid rgba(139,92,246,0.2)", borderRadius: 12, padding: "12px 16px", textDecoration: "none", color: "white" }}><span style={{ fontSize: 20 }}>✉️</span><p style={{ margin: 0 }}>{perfilProveedor.email}</p></a>}
            {(perfilProveedor.horario_apertura || perfilProveedor.horario_cierre) && <div style={{ marginTop: 12, background: "rgba(37,99,235,0.08)", borderRadius: 12, padding: "12px 16px" }}><p style={{ color: "#94a3b8", fontSize: 11, marginBottom: 4 }}>HORARIO</p><p style={{ fontWeight: 800 }}>🕐 {perfilProveedor.horario_apertura} - {perfilProveedor.horario_cierre}</p>{perfilProveedor.dias_apertura?.length && <p style={{ color: "#94a3b8", fontSize: 12 }}>{perfilProveedor.dias_apertura.join(", ")}</p>}</div>}
          </div>
        </div>
      )}
    </div>
  );

  /* ── DESKTOP ── */
  return (
    <div style={{ height: "100vh", background: "#020b2d", color: "white", overflow: "hidden", display: "flex" }}>
      {/* SIDEBAR */}
      <aside style={{ width: 360, background: "#0a1628", borderRight: "1px solid rgba(255,255,255,0.06)", display: "flex", flexDirection: "column", flexShrink: 0 }}>
        <div style={{ padding: "24px 20px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <h1 style={{ fontSize: 28, fontWeight: 900, margin: 0 }}>Chats</h1>
          <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 13, marginTop: 4 }}>Conversaciones activas</p>
        </div>
        <div style={{ padding: "12px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <input placeholder="Buscar conversación..." value={busqueda} onChange={e => setBusqueda(e.target.value)} style={{ width: "100%", height: 40, borderRadius: 10, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)", padding: "0 14px", color: "white", fontSize: 14, outline: "none", boxSizing: "border-box" }} />
        </div>
        <div style={{ flex: 1, overflowY: "auto" }}>
          {cargando ? <div style={{ padding: "40px 20px", textAlign: "center", color: "rgba(255,255,255,0.25)" }}>Cargando...</div> :
            convFiltradas.length === 0 ? <div style={{ padding: "40px 20px", textAlign: "center", color: "rgba(255,255,255,0.25)" }}>No hay conversaciones</div> :
            convFiltradas.map(conv => (
              <div key={conv.id} onClick={() => abrirChat(conv.id)} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", cursor: "pointer", borderBottom: "1px solid rgba(255,255,255,0.04)", background: chatActivo === conv.id ? "rgba(37,99,235,0.2)" : "transparent", borderLeft: chatActivo === conv.id ? "3px solid #2563eb" : "3px solid transparent" }}>
                <div style={{ width: 46, height: 46, borderRadius: "50%", background: "linear-gradient(135deg,#2563eb,#1d4ed8)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 18, flexShrink: 0 }}>{(conv.participante_nombre || "?").charAt(0).toUpperCase()}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontWeight: 700, fontSize: 15, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{conv.participante_nombre}</span>
                    <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 11, flexShrink: 0, marginLeft: 8 }}>{tiempoRelativo(conv.updated_at || "")}</span>
                  </div>
                  {conv.referencia && <div style={{ color: "#60a5fa", fontSize: 11, fontWeight: 700, marginBottom: 2 }}>{conv.referencia}</div>}
                  <div style={{ color: "rgba(255,255,255,0.45)", fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{conv.ultimo_mensaje || "Sin mensajes"}</div>
                </div>
                <button onClick={e => { e.stopPropagation(); borrarConversacion(conv.id); }} style={{ background: "none", border: "none", color: "rgba(239,68,68,0.4)", cursor: "pointer", fontSize: 14, padding: "4px 6px", flexShrink: 0 }}>🗑️</button>
              </div>
            ))
          }
        </div>
      </aside>

      {/* PANEL CHAT DESKTOP */}
      <section style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {chatActivo === null ? (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
            <div style={{ fontSize: 80, marginBottom: 24 }}>💬</div>
            <h2 style={{ fontSize: 28, fontWeight: 900, marginBottom: 12 }}>Recambio Directo Chat</h2>
            <p style={{ color: "#94a3b8", fontSize: 16, maxWidth: 400, textAlign: "center", lineHeight: 1.6 }}>Selecciona una conversación para ver los mensajes.</p>
          </div>
        ) : (
          <>
          {/* CABECERA */}
      <div style={{ minHeight: 64, background: "#0a1628", borderBottom: "1px solid rgba(255,255,255,0.06)", padding: "10px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0, gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {isMobile && (
            <button onClick={() => setVistaMovil("lista")} style={{ background: "rgba(255,255,255,0.06)", border: "none", color: "white", width: 36, height: 36, borderRadius: 10, cursor: "pointer", fontSize: 18 }}>←</button>
          )}
          <div style={{ width: 40, height: 40, borderRadius: "50%", background: "linear-gradient(135deg,#2563eb,#1d4ed8)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 16, flexShrink: 0 }}>
            {(convActiva?.participante_nombre || "?").charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 onClick={() => cargarFichaProveedor(convActiva?.participante_id)} style={{ fontSize: isMobile ? 15 : 18, fontWeight: 900, margin: 0, cursor: "pointer", textDecoration: "underline dotted" }}>{convActiva?.participante_nombre || `Chat #${chatActivo}`}</h2>
            {convActiva?.referencia && <p style={{ color: "#60a5fa", fontSize: 11, margin: 0, marginTop: 2, fontWeight: 700 }}>{convActiva.referencia}</p>}
          </div>
        </div>
        {pedidoInfo && !isMobile && (
          <div style={{ background: "rgba(37,99,235,0.1)", border: "1px solid rgba(37,99,235,0.2)", borderRadius: 10, padding: "8px 14px", textAlign: "right", flexShrink: 0 }}>
            <div style={{ fontSize: 10, color: "#94a3b8" }}>PEDIDO VINCULADO</div>
            <div style={{ fontWeight: 800, color: "#60a5fa", fontSize: 13 }}>{pedidoInfo.codigo || `#${pedidoInfo.id}`}</div>
            <div style={{ fontSize: 11, color: "#94a3b8" }}>{Number(pedidoInfo.total).toFixed(2)}€</div>
          </div>
        )}
      </div>

      {/* MENSAJES */}
      <div style={{ flex: 1, overflowY: "auto", padding: isMobile ? "12px 12px 8px" : "24px 24px 8px" }}>
        {mensajes.length === 0 ? (
          <div style={{ textAlign: "center", color: "#94a3b8", marginTop: 40 }}><p style={{ fontSize: 32, marginBottom: 8 }}>👋</p><p>Empieza la conversación</p></div>
        ) : mensajes.map((msg, i) => {
          const esPropio = msg.user_id === userId;
          const msgAnterior = i > 0 ? mensajes[i - 1] : null;
          const mismoEmisor = msgAnterior ? (msgAnterior.user_id === msg.user_id || msgAnterior.emisor === msg.emisor) : false;
          return (
            <div key={msg.id} style={{ display: "flex", justifyContent: esPropio ? "flex-end" : "flex-start", marginBottom: mismoEmisor ? 4 : 12, paddingLeft: esPropio ? "15%" : 0, paddingRight: esPropio ? 0 : "15%" }}>
              {!esPropio && !mismoEmisor && <div style={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(37,99,235,0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 11, color: "#93c5fd", marginRight: 8, flexShrink: 0, alignSelf: "flex-end" }}>{(convActiva?.participante_nombre || "P").charAt(0).toUpperCase()}</div>}
              {!esPropio && mismoEmisor && <div style={{ width: 28, marginRight: 8 }} />}
              <div style={{ background: esPropio ? "linear-gradient(135deg,#2563eb,#1d4ed8)" : "#1e293b", padding: "10px 14px", borderRadius: esPropio ? "16px 16px 4px 16px" : "16px 16px 16px 4px", maxWidth: isMobile ? "85%" : 520, boxShadow: "0 2px 8px rgba(0,0,0,0.3)" }}>
                {!esPropio && !mismoEmisor && <p style={{ color: "#60a5fa", fontSize: 10, fontWeight: 700, marginBottom: 4 }}>{convActiva?.participante_nombre}</p>}
                {msg.adjunto_url && (
                  <div style={{ marginBottom: 8 }}>
                    {esImagen(msg.adjunto_tipo) ? <img src={msg.adjunto_url} alt={msg.adjunto_nombre} style={{ maxWidth: isMobile ? 200 : 280, maxHeight: 180, borderRadius: 8, display: "block" }} /> : <a href={msg.adjunto_url} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.1)", padding: "8px 12px", borderRadius: 8, textDecoration: "none", color: "white" }}><span style={{ fontSize: 18 }}>📄</span><span style={{ fontSize: 13, fontWeight: 700 }}>{msg.adjunto_nombre}</span></a>}
                  </div>
                )}
                {(!msg.adjunto_url || msg.mensaje !== `📎 ${msg.adjunto_nombre}`) && <p style={{ fontSize: isMobile ? 14 : 15, lineHeight: 1.5, margin: 0 }}>{msg.mensaje}</p>}
                <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", marginTop: 4, gap: 4 }}>
                  <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 10 }}>{new Date(msg.created_at).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}</span>
                  {esPropio && <Ticks leido={msg.leido} />}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={mensajesEndRef} />
      </div>

      {/* INPUT */}
      <div style={{ padding: isMobile ? "10px 12px" : "14px 20px", background: "#0a1628", borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", gap: 8, flexShrink: 0, alignItems: "center" }}>
        <input ref={fileInputRef} type="file" accept="image/*,.pdf,.doc,.docx,.xls,.xlsx" style={{ display: "none" }} onChange={e => { if (e.target.files?.[0]) subirAdjunto(e.target.files[0]); }} />
        <button onClick={() => fileInputRef.current?.click()} disabled={subiendo} style={{ width: 44, height: 44, borderRadius: "50%", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "white", cursor: "pointer", fontSize: 18, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>{subiendo ? "⏳" : "📎"}</button>
        <input type="text" placeholder="Escribe un mensaje..." value={texto} onChange={e => setTexto(e.target.value)} onKeyDown={handleKeyDown} style={{ flex: 1, height: 44, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 22, padding: "0 16px", color: "white", fontSize: 14, outline: "none" }} />
        <button onClick={enviarMensaje} disabled={!texto.trim()} style={{ height: 44, minWidth: isMobile ? 60 : 90, borderRadius: 22, background: "linear-gradient(135deg,#2563eb,#1d4ed8)", border: "none", color: "white", fontWeight: 800, fontSize: 14, opacity: texto.trim() ? 1 : 0.5, cursor: texto.trim() ? "pointer" : "not-allowed" }}>
          {isMobile ? "↑" : "Enviar"}
        </button>
      </div>
          </>
        )}
      </section>

      {/* FICHA PROVEEDOR DESKTOP */}
      {fichaVisible && perfilProveedor && (
        <aside style={{ width: 300, background: "#0a1628", borderLeft: "1px solid rgba(255,255,255,0.06)", padding: "24px 20px", overflowY: "auto", flexShrink: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
            <h3 style={{ fontWeight: 900, fontSize: 18, margin: 0 }}>Ficha proveedor</h3>
            <button onClick={() => setFichaVisible(false)} style={{ background: "rgba(255,255,255,0.06)", border: "none", color: "#94a3b8", width: 30, height: 30, borderRadius: "50%", cursor: "pointer", fontSize: 14 }}>✕</button>
          </div>
          <div style={{ width: 70, height: 70, borderRadius: "50%", background: "linear-gradient(135deg,#2563eb,#1d4ed8)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 28, margin: "0 auto" }}>{(perfilProveedor.nombre_empresa || "?").charAt(0).toUpperCase()}</div>
          <h2 style={{ fontWeight: 900, fontSize: 20, margin: "16px 0 4px", textAlign: "center" }}>{perfilProveedor.nombre_empresa}</h2>
          {perfilProveedor.cif && <p style={{ color: "#94a3b8", fontSize: 13, textAlign: "center" }}>CIF: {perfilProveedor.cif}</p>}
          <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 10 }}>
            {perfilProveedor.telefono && <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: "rgba(255,255,255,0.04)", borderRadius: 10 }}><span style={{ fontSize: 18 }}>📞</span><a href={`tel:${perfilProveedor.telefono}`} style={{ color: "#60a5fa", fontWeight: 700, textDecoration: "none" }}>{perfilProveedor.telefono}</a></div>}
            {perfilProveedor.email && <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: "rgba(255,255,255,0.04)", borderRadius: 10 }}><span style={{ fontSize: 18 }}>✉️</span><span style={{ color: "#cbd5e1", fontSize: 14, overflow: "hidden", textOverflow: "ellipsis" }}>{perfilProveedor.email}</span></div>}
            {(perfilProveedor.direccion || perfilProveedor.ciudad) && <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: "rgba(255,255,255,0.04)", borderRadius: 10 }}><span style={{ fontSize: 18 }}>📍</span><span style={{ color: "#cbd5e1", fontSize: 14 }}>{[perfilProveedor.direccion, perfilProveedor.ciudad, perfilProveedor.provincia].filter(Boolean).join(", ")}</span></div>}
          </div>
          {(perfilProveedor.horario_apertura || perfilProveedor.horario_cierre) && <div style={{ marginTop: 20, background: "rgba(37,99,235,0.08)", border: "1px solid rgba(37,99,235,0.2)", borderRadius: 14, padding: 16 }}><p style={{ color: "#94a3b8", fontSize: 12, marginBottom: 8, fontWeight: 700 }}>HORARIO</p><p style={{ fontWeight: 800, fontSize: 16 }}>🕐 {perfilProveedor.horario_apertura} - {perfilProveedor.horario_cierre}</p>{perfilProveedor.dias_apertura?.length && <p style={{ color: "#94a3b8", fontSize: 13, marginTop: 6 }}>{perfilProveedor.dias_apertura.join(", ")}</p>}</div>}
          {perfilProveedor.telefono && <a href={`tel:${perfilProveedor.telefono}`} style={{ display: "block", marginTop: 20, background: "linear-gradient(135deg,#16a34a,#15803d)", color: "white", padding: 14, borderRadius: 14, textAlign: "center", fontWeight: 800, textDecoration: "none", fontSize: 15 }}>📞 Llamar ahora</a>}
        </aside>
      )}
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", background: "#020b2d", display: "flex", alignItems: "center", justifyContent: "center", color: "white" }}><p>Cargando chat...</p></div>}>
      <ChatPageInner />
    </Suspense>
  );
}