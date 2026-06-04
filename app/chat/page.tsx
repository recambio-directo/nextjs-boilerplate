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
  return (
    <span style={{ fontSize: 12, marginLeft: 4 }}>
      {leido
        ? <span style={{ color: "#60a5fa" }}>✓✓</span>
        : <span style={{ color: "rgba(255,255,255,0.35)" }}>✓</span>}
    </span>
  );
}

function esImagen(tipo?: string) {
  return tipo?.startsWith("image/");
}

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
  const mensajesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { iniciar(); }, []);

  useEffect(() => {
    if (chatActivo !== null) {
      cargarMensajes(chatActivo);
      cargarPedidoInfo(chatActivo);
    }
  }, [chatActivo]);

  useEffect(() => {
    mensajesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensajes]);

  async function iniciar() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setUserId(user.id);
    await cargarConversaciones(user.id);
    setCargando(false);
  }

  async function cargarConversaciones(uid: string) {
    const { data: conv1 } = await supabase.from("conversaciones").select("*").eq("user1_id", uid).order("updated_at", { ascending: false });
    const { data: conv2 } = await supabase.from("conversaciones").select("*").eq("user2_id", uid).order("updated_at", { ascending: false });
    const todasConvs = [...(conv1 || []), ...(conv2 || [])];

    if (todasConvs.length === 0) {
      await cargarDesdeMessagesPedido(uid);
      return;
    }

    const convsConNombre: Conversacion[] = await Promise.all(
      todasConvs.map(async (conv) => {
        const otroId = conv.user1_id === uid ? conv.user2_id : conv.user1_id;
        if (!otroId) return { ...conv, participante_nombre: "Usuario", participante_id: otroId };
        const { data: perfil } = await supabase.from("usuarios").select("nombre_empresa, email").eq("id", otroId).single();
        return {
          ...conv,
          participante_nombre: perfil?.nombre_empresa || perfil?.email || "Usuario",
          participante_id: otroId,
        };
      })
    );

    const ordenadas = convsConNombre.sort((a, b) =>
      new Date(b.updated_at || "").getTime() - new Date(a.updated_at || "").getTime()
    );

    setConversaciones(ordenadas);
    if (convParam) setChatActivo(parseInt(convParam));
  }

  async function cargarDesdeMessagesPedido(uid: string) {
    const { data: pedidosData } = await supabase
      .from("pedidos")
      .select("id, codigo, cliente_nombre, created_at")
      .order("id", { ascending: false });
    if (!pedidosData) return;

    const { data: msgData } = await supabase
      .from("mensajes_pedido")
      .select("pedido_id, mensaje, created_at, emisor")
      .order("created_at", { ascending: false });
    if (!msgData) return;

    const pedidosConMensajes = new Map<number, any>();
    msgData.forEach(m => { if (!pedidosConMensajes.has(m.pedido_id)) pedidosConMensajes.set(m.pedido_id, m); });

    const convs: Conversacion[] = pedidosData
      .filter(p => pedidosConMensajes.has(p.id))
      .map(p => {
        const lastMsg = pedidosConMensajes.get(p.id);
        return {
          id: p.id,
          user1_id: uid,
          user2_id: "",
          referencia: `Pedido #${p.id}`,
          ultimo_mensaje: lastMsg?.mensaje || "",
          updated_at: lastMsg?.created_at || p.created_at,
          participante_nombre: p.cliente_nombre || `Pedido #${p.id}`,
          pedido_id: p.id,
        };
      })
      .sort((a, b) => new Date(b.updated_at || "").getTime() - new Date(a.updated_at || "").getTime());

    setConversaciones(convs);
    if (convParam) setChatActivo(parseInt(convParam));
  }

  async function cargarPedidoInfo(convId: number) {
    // Obtener la conversación con su pedido_id desde Supabase (no del state que puede estar vacío)
    const { data: conv } = await supabase
      .from("conversaciones")
      .select("pedido_id, referencia")
      .eq("id", convId)
      .single();

    let pedidoId: number | null = null;

    // 1. Usar pedido_id directo si existe
    if (conv?.pedido_id) {
      pedidoId = conv.pedido_id;
    }
    // 2. Extraer de la referencia: "Pedido #42 — RD-34175" → 42
    else if (conv?.referencia) {
      const match = conv.referencia.match(/Pedido\s*#(\d+)/i);
      if (match) pedidoId = parseInt(match[1]);
    }

    if (!pedidoId) { setPedidoInfo(null); return; }

    const { data } = await supabase
      .from("pedidos")
      .select("id, codigo, total, estado_envio, transporte, created_at, productos")
      .eq("id", pedidoId)
      .single();

    if (data) setPedidoInfo(data);
    else setPedidoInfo(null);
  }

  async function cargarMensajes(convId: number) {
    const { data: msgData } = await supabase
      .from("mensajes")
      .select("*")
      .eq("conversacion_id", convId)
      .order("created_at", { ascending: true });

    if (msgData && msgData.length > 0) {
      setMensajes(msgData);
      await supabase.from("mensajes").update({ leido: true }).eq("conversacion_id", convId).neq("user_id", userId);
      return;
    }

    const { data: msgPedido } = await supabase
      .from("mensajes_pedido")
      .select("*")
      .eq("pedido_id", convId)
      .order("created_at", { ascending: true });

    if (msgPedido) {
      setMensajes(msgPedido.map((m: any) => ({
        id: m.id,
        conversacion_id: convId,
        user_id: m.user_id || userId || "",
        mensaje: m.mensaje,
        emisor: m.emisor,
        created_at: m.created_at,
        leido: m.leido || false,
        adjunto_url: m.adjunto_url,
        adjunto_nombre: m.adjunto_nombre,
        adjunto_tipo: m.adjunto_tipo,
      })));
    }
  }

  async function enviarMensaje() {
    if (!texto.trim() || chatActivo === null || !userId) return;

    const convActiva = conversaciones.find(c => c.id === chatActivo);
    const esConvReal = convActiva?.user2_id && convActiva.user2_id !== "";

    if (esConvReal) {
      const { data, error } = await supabase.from("mensajes").insert({
        conversacion_id: chatActivo,
        user_id: userId,
        mensaje: texto.trim(),
        emisor: "cliente",
        leido: false,
      }).select().single();

      if (!error && data) {
        setMensajes(prev => [...prev, data]);
        await supabase.from("conversaciones").update({ ultimo_mensaje: texto.trim(), updated_at: new Date().toISOString() }).eq("id", chatActivo);
        setConversaciones(prev => prev.map(c => c.id === chatActivo ? { ...c, ultimo_mensaje: texto.trim(), updated_at: new Date().toISOString() } : c));
      }
    } else {
      const { data, error } = await supabase.from("mensajes_pedido").insert({
        pedido_id: chatActivo,
        emisor: "cliente",
        mensaje: texto.trim(),
        user_id: userId,
        leido: false,
      }).select().single();

      if (!error && data) {
        setMensajes(prev => [...prev, {
          id: data.id, conversacion_id: chatActivo, user_id: userId,
          mensaje: texto.trim(), emisor: "cliente",
          created_at: new Date().toISOString(), leido: false,
        }]);
      }
    }

    setTexto("");
  }

  async function subirAdjunto(file: File) {
    if (!chatActivo || !userId) return;
    setSubiendo(true);

    const ext = file.name.split(".").pop();
    const path = `${userId}/${chatActivo}/${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("chat-adjuntos")
      .upload(path, file, { contentType: file.type });

    if (uploadError) {
      alert("Error al subir el archivo");
      setSubiendo(false);
      return;
    }

    const { data: urlData } = supabase.storage.from("chat-adjuntos").getPublicUrl(path);
    const url = urlData.publicUrl;

    const convActiva = conversaciones.find(c => c.id === chatActivo);
    const esConvReal = convActiva?.user2_id && convActiva.user2_id !== "";

    if (esConvReal) {
      const { data } = await supabase.from("mensajes").insert({
        conversacion_id: chatActivo,
        user_id: userId,
        mensaje: `📎 ${file.name}`,
        emisor: "cliente",
        leido: false,
        adjunto_url: url,
        adjunto_nombre: file.name,
        adjunto_tipo: file.type,
      }).select().single();

      if (data) setMensajes(prev => [...prev, data]);
    } else {
      const { data } = await supabase.from("mensajes_pedido").insert({
        pedido_id: chatActivo,
        emisor: "cliente",
        mensaje: `📎 ${file.name}`,
        user_id: userId,
        leido: false,
        adjunto_url: url,
        adjunto_nombre: file.name,
        adjunto_tipo: file.type,
      }).select().single();

      if (data) setMensajes(prev => [...prev, {
        id: data.id, conversacion_id: chatActivo, user_id: userId,
        mensaje: `📎 ${file.name}`, emisor: "cliente",
        created_at: new Date().toISOString(), leido: false,
        adjunto_url: url, adjunto_nombre: file.name, adjunto_tipo: file.type,
      }]);
    }

    setSubiendo(false);
  }

  async function borrarConversacion(convId: number) {
    if (!confirm("¿Seguro que quieres eliminar esta conversación? Solo se eliminará de tu vista.")) return;
    // Marcar como borrada para este usuario — soft delete
    await supabase.from("mensajes").delete().eq("conversacion_id", convId).eq("user_id", userId);
    setConversaciones(prev => prev.filter(c => c.id !== convId));
    if (chatActivo === convId) setChatActivo(null);
  }

  async function cargarFichaProveedor(participanteId?: string) {
    if (!participanteId) return;
    const { data } = await supabase
      .from("usuarios")
      .select("nombre_empresa, email, telefono, direccion, ciudad, provincia, cif, horario_apertura, horario_cierre, dias_apertura")
      .eq("id", participanteId)
      .single();
    if (data) {
      setPerfilProveedor(data);
      setFichaVisible(true);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); enviarMensaje(); }
  }

  const convActiva = conversaciones.find(c => c.id === chatActivo);

  const convFiltradas = conversaciones.filter(c => {
    if (!busqueda) return true;
    return (
      (c.participante_nombre || "").toLowerCase().includes(busqueda.toLowerCase()) ||
      (c.ultimo_mensaje || "").toLowerCase().includes(busqueda.toLowerCase()) ||
      (c.referencia || "").toLowerCase().includes(busqueda.toLowerCase())
    );
  });

  return (
    <div style={wrapperStyle}>
      <div style={containerStyle}>

        {/* SIDEBAR */}
        <aside style={sidebarStyle}>
          <div style={sidebarHeader}>
            <h1 style={sidebarTitle}>Chats</h1>
            <p style={sidebarSub}>Conversaciones activas</p>
          </div>

          <div style={{ padding: "12px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <input
              placeholder="Buscar conversación..."
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              style={searchStyle}
            />
          </div>

          <div style={convListStyle}>
            {cargando ? (
              <div style={emptyMsg}>Cargando...</div>
            ) : convFiltradas.length === 0 ? (
              <div style={emptyMsg}>No hay conversaciones</div>
            ) : (
              convFiltradas.map(conv => (
                <div
                  key={conv.id}
                  onClick={() => { setChatActivo(conv.id); setFichaVisible(false); }}
                  style={{
                    ...convItemStyle,
                    background: chatActivo === conv.id ? "rgba(37,99,235,0.2)" : "transparent",
                    borderLeft: chatActivo === conv.id ? "3px solid #2563eb" : "3px solid transparent",
                  }}
                >
                  <div style={avatarStyle}>
                    {(conv.participante_nombre || "?").charAt(0).toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={convNombreStyle}>{conv.participante_nombre}</span>
                      <span style={convFechaStyle}>{tiempoRelativo(conv.updated_at || "")}</span>
                    </div>
                    {conv.referencia && (
                      <div style={{ color: "#60a5fa", fontSize: 11, fontWeight: 700, marginBottom: 2 }}>
                        {conv.referencia}
                      </div>
                    )}
                    <div style={convUltimoStyle}>{conv.ultimo_mensaje || "Sin mensajes"}</div>
                  </div>
                  <button
                    onClick={e => { e.stopPropagation(); borrarConversacion(conv.id); }}
                    style={{ background: "none", border: "none", color: "rgba(239,68,68,0.4)", cursor: "pointer", fontSize: 14, padding: "4px 6px", flexShrink: 0 }}
                    title="Eliminar conversacion"
                  >🗑️</button>
                </div>
              ))
            )}
          </div>
        </aside>

        {/* PANEL CHAT */}
        <section style={chatPanelStyle}>
          {chatActivo === null ? (
            <div style={panelVacioStyle}>
              <div style={{ fontSize: 80, marginBottom: 24 }}>💬</div>
              <h2 style={{ fontSize: 28, fontWeight: 900, marginBottom: 12 }}>Recambio Directo Chat</h2>
              <p style={{ color: "#94a3b8", fontSize: 16, maxWidth: 400, textAlign: "center", lineHeight: 1.6 }}>
                Selecciona una conversación para ver los mensajes.
              </p>
            </div>
          ) : (
            <>
              {/* CABECERA */}
              <div style={chatHeaderStyle}>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <div style={avatarGrandeStyle}>
                    {(convActiva?.participante_nombre || "?").charAt(0).toUpperCase()}
                  </div>
                  <div>
                    {/* Nombre clicable → abre ficha */}
                    <h2
                      onClick={() => cargarFichaProveedor(convActiva?.participante_id)}
                      style={{ fontSize: 20, fontWeight: 900, margin: 0, cursor: "pointer", textDecoration: "underline dotted" }}
                      title="Ver ficha del proveedor"
                    >
                      {convActiva?.participante_nombre || `Chat #${chatActivo}`}
                    </h2>
                    {convActiva?.referencia && (
                      <p style={{ color: "#60a5fa", fontSize: 13, margin: 0, marginTop: 3, fontWeight: 700 }}>
                        {convActiva.referencia}
                      </p>
                    )}
                  </div>
                </div>

                {/* INFO PEDIDO en cabecera */}
                {pedidoInfo && (
                  <div style={pedidoInfoBox}>
                    <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 4 }}>PEDIDO VINCULADO</div>
                    <div style={{ fontWeight: 800, color: "#60a5fa" }}>{pedidoInfo.codigo || `#${pedidoInfo.id}`}</div>
                    <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>
                      {Number(pedidoInfo.total).toFixed(2)}€ · {pedidoInfo.transporte || "-"}
                    </div>
                    <div style={{
                      fontSize: 11, fontWeight: 700, marginTop: 4,
                      color: pedidoInfo.estado_envio === "entregado" ? "#4ade80" : pedidoInfo.estado_envio === "enviado" ? "#a78bfa" : "#f59e0b"
                    }}>
                      {pedidoInfo.estado_envio || "pendiente"}
                    </div>
                  </div>
                )}
              </div>

              {/* MENSAJES */}
              <div style={mensajesAreaStyle}>
                {mensajes.length === 0 ? (
                  <div style={{ textAlign: "center", color: "#94a3b8", marginTop: 60 }}>
                    <p style={{ fontSize: 40, marginBottom: 12 }}>👋</p>
                    <p>Empieza la conversación</p>
                  </div>
                ) : (
                  mensajes.map((msg, i) => {
                    const esPropio = msg.user_id === userId;
                    const msgAnterior = i > 0 ? mensajes[i - 1] : null;
                    const mismoEmisor = msgAnterior
                      ? (msgAnterior.user_id === msg.user_id || msgAnterior.emisor === msg.emisor)
                      : false;

                    return (
                      <div
                        key={msg.id}
                        style={{
                          display: "flex",
                          justifyContent: esPropio ? "flex-end" : "flex-start",
                          marginBottom: mismoEmisor ? 4 : 16,
                          paddingLeft: esPropio ? "20%" : 0,
                          paddingRight: esPropio ? 0 : "20%",
                        }}
                      >
                        {!esPropio && !mismoEmisor && (
                          <div style={{ ...avatarMiniStyle, marginRight: 8, flexShrink: 0 }}>
                            {(convActiva?.participante_nombre || "P").charAt(0).toUpperCase()}
                          </div>
                        )}
                        {!esPropio && mismoEmisor && <div style={{ width: 32, marginRight: 8 }} />}

                        <div style={{
                          background: esPropio ? "linear-gradient(135deg,#2563eb,#1d4ed8)" : "#1e293b",
                          padding: "10px 16px",
                          borderRadius: esPropio ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                          maxWidth: 520,
                          boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
                        }}>
                          {!esPropio && !mismoEmisor && (
                            <p style={{ color: "#60a5fa", fontSize: 11, fontWeight: 700, marginBottom: 4 }}>
                              {convActiva?.participante_nombre || "Proveedor"}
                            </p>
                          )}

                          {/* ADJUNTO */}
                          {msg.adjunto_url && (
                            <div style={{ marginBottom: 8 }}>
                              {esImagen(msg.adjunto_tipo) ? (
                                <img
                                  src={msg.adjunto_url}
                                  alt={msg.adjunto_nombre}
                                  style={{ maxWidth: 280, maxHeight: 200, borderRadius: 10, display: "block" }}
                                />
                              ) : (
                                <a
                                  href={msg.adjunto_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  style={{
                                    display: "flex", alignItems: "center", gap: 8,
                                    background: "rgba(255,255,255,0.1)", padding: "10px 14px",
                                    borderRadius: 10, textDecoration: "none", color: "white"
                                  }}
                                >
                                  <span style={{ fontSize: 20 }}>📄</span>
                                  <span style={{ fontSize: 13, fontWeight: 700 }}>{msg.adjunto_nombre}</span>
                                </a>
                              )}
                            </div>
                          )}

                          {msg.adjunto_url
                            ? msg.mensaje !== `📎 ${msg.adjunto_nombre}` && <p style={{ fontSize: 15, lineHeight: 1.5, margin: 0 }}>{msg.mensaje}</p>
                            : <p style={{ fontSize: 15, lineHeight: 1.5, margin: 0 }}>{msg.mensaje}</p>
                          }

                          <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", marginTop: 6, gap: 4 }}>
                            <span style={{ color: "rgba(255,255,255,0.45)", fontSize: 11 }}>
                              {new Date(msg.created_at).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}
                            </span>
                            {esPropio && <Ticks leido={msg.leido} />}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={mensajesEndRef} />
              </div>

              {/* INPUT */}
              <div style={inputAreaStyle}>
                {/* Botón adjuntar */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
                  style={{ display: "none" }}
                  onChange={e => { if (e.target.files?.[0]) subirAdjunto(e.target.files[0]); }}
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={subiendo}
                  style={btnAdjuntarStyle}
                  title="Adjuntar archivo"
                >
                  {subiendo ? "⏳" : "📎"}
                </button>

                <input
                  type="text"
                  placeholder="Escribe un mensaje..."
                  value={texto}
                  onChange={e => setTexto(e.target.value)}
                  onKeyDown={handleKeyDown}
                  style={inputStyle}
                />
                <button
                  onClick={enviarMensaje}
                  disabled={!texto.trim()}
                  style={{ ...btnEnviarStyle, opacity: texto.trim() ? 1 : 0.5, cursor: texto.trim() ? "pointer" : "not-allowed" }}
                >
                  Enviar
                </button>
              </div>
            </>
          )}
        </section>

        {/* FICHA PROVEEDOR — panel lateral */}
        {fichaVisible && perfilProveedor && (
          <aside style={fichaStyle}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <h3 style={{ fontWeight: 900, fontSize: 18, margin: 0 }}>Ficha del proveedor</h3>
              <button onClick={() => setFichaVisible(false)} style={btnCerrarFicha}>✕</button>
            </div>

            <div style={fichaAvatar}>
              {(perfilProveedor.nombre_empresa || "?").charAt(0).toUpperCase()}
            </div>
            <h2 style={{ fontWeight: 900, fontSize: 20, margin: "16px 0 4px" }}>{perfilProveedor.nombre_empresa}</h2>
            {perfilProveedor.cif && <p style={{ color: "#94a3b8", fontSize: 13 }}>CIF: {perfilProveedor.cif}</p>}

            <div style={fichaSection}>
              {perfilProveedor.telefono && (
                <div style={fichaRow}>
                  <span style={fichaIcon}>📞</span>
                  <a href={`tel:${perfilProveedor.telefono}`} style={{ color: "#60a5fa", fontWeight: 700, textDecoration: "none" }}>
                    {perfilProveedor.telefono}
                  </a>
                </div>
              )}
              {perfilProveedor.email && (
                <div style={fichaRow}>
                  <span style={fichaIcon}>✉️</span>
                  <span style={{ color: "#cbd5e1", fontSize: 14 }}>{perfilProveedor.email}</span>
                </div>
              )}
              {(perfilProveedor.direccion || perfilProveedor.ciudad) && (
                <div style={fichaRow}>
                  <span style={fichaIcon}>📍</span>
                  <span style={{ color: "#cbd5e1", fontSize: 14 }}>
                    {[perfilProveedor.direccion, perfilProveedor.ciudad, perfilProveedor.provincia].filter(Boolean).join(", ")}
                  </span>
                </div>
              )}
            </div>

            {(perfilProveedor.horario_apertura || perfilProveedor.horario_cierre) && (
              <div style={fichaHorario}>
                <p style={{ color: "#94a3b8", fontSize: 12, marginBottom: 8, fontWeight: 700 }}>HORARIO</p>
                <p style={{ fontWeight: 800, fontSize: 16 }}>
                  🕐 {perfilProveedor.horario_apertura} - {perfilProveedor.horario_cierre}
                </p>
                {perfilProveedor.dias_apertura?.length && (
                  <p style={{ color: "#94a3b8", fontSize: 13, marginTop: 6 }}>
                    {perfilProveedor.dias_apertura.join(", ")}
                  </p>
                )}
              </div>
            )}

            {perfilProveedor.telefono && (
              <a href={`tel:${perfilProveedor.telefono}`} style={btnLlamarStyle}>
                📞 Llamar ahora
              </a>
            )}
          </aside>
        )}

      </div>
    </div>
  );
}

/* STYLES */
const wrapperStyle = { height: "100vh", background: "#020b2d", color: "white", overflow: "hidden" };
const containerStyle = { height: "100%", display: "flex" };
const sidebarStyle = { width: "360px", background: "#0a1628", borderRight: "1px solid rgba(255,255,255,0.06)", display: "flex", flexDirection: "column" as const, flexShrink: 0 };
const sidebarHeader = { padding: "24px 20px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)" };
const sidebarTitle = { fontSize: "28px", fontWeight: 900, margin: 0 };
const sidebarSub = { color: "rgba(255,255,255,0.35)", fontSize: 13, marginTop: 4 };
const searchStyle = { width: "100%", height: 40, borderRadius: 10, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)", padding: "0 14px", color: "white", fontSize: 14, outline: "none", boxSizing: "border-box" as const };
const convListStyle = { flex: 1, overflowY: "auto" as const };
const emptyMsg = { padding: "40px 20px", textAlign: "center" as const, color: "rgba(255,255,255,0.25)", fontSize: 14 };
const convItemStyle = { display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", cursor: "pointer", borderBottom: "1px solid rgba(255,255,255,0.04)", transition: "background 0.15s" };
const avatarStyle = { width: 46, height: 46, borderRadius: "50%", background: "linear-gradient(135deg,#2563eb,#1d4ed8)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 18, flexShrink: 0 };
const convNombreStyle = { fontWeight: 700, fontSize: 15, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const };
const convFechaStyle = { color: "rgba(255,255,255,0.3)", fontSize: 11, flexShrink: 0, marginLeft: 8 };
const convUltimoStyle = { color: "rgba(255,255,255,0.45)", fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const };
const chatPanelStyle = { flex: 1, display: "flex", flexDirection: "column" as const, overflow: "hidden" };
const panelVacioStyle = { flex: 1, display: "flex", flexDirection: "column" as const, alignItems: "center", justifyContent: "center" };
const chatHeaderStyle = { minHeight: 72, background: "#0a1628", borderBottom: "1px solid rgba(255,255,255,0.06)", padding: "12px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0, gap: 16 };
const avatarGrandeStyle = { width: 44, height: 44, borderRadius: "50%", background: "linear-gradient(135deg,#2563eb,#1d4ed8)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 18, flexShrink: 0 };
const avatarMiniStyle = { width: 32, height: 32, borderRadius: "50%", background: "rgba(37,99,235,0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 12, color: "#93c5fd" };
const pedidoInfoBox = { background: "rgba(37,99,235,0.1)", border: "1px solid rgba(37,99,235,0.2)", borderRadius: 12, padding: "10px 16px", textAlign: "right" as const, flexShrink: 0 };
const mensajesAreaStyle = { flex: 1, overflowY: "auto" as const, padding: "24px 24px 8px" };
const inputAreaStyle = { padding: "16px 20px", background: "#0a1628", borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", gap: 10, flexShrink: 0, alignItems: "center" };
const btnAdjuntarStyle = { width: 52, height: 52, borderRadius: "50%", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "white", fontSize: 20, cursor: "pointer", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" };
const inputStyle = { flex: 1, height: 52, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 26, padding: "0 20px", color: "white", fontSize: 15, outline: "none" };
const btnEnviarStyle = { height: 52, minWidth: 110, borderRadius: 26, background: "linear-gradient(135deg,#2563eb,#1d4ed8)", border: "none", color: "white", fontWeight: 800, fontSize: 15 };
const fichaStyle = { width: 300, background: "#0a1628", borderLeft: "1px solid rgba(255,255,255,0.06)", padding: "24px 20px", overflowY: "auto" as const, flexShrink: 0 };
const fichaAvatar = { width: 70, height: 70, borderRadius: "50%", background: "linear-gradient(135deg,#2563eb,#1d4ed8)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 28, margin: "0 auto" };
const fichaSection = { marginTop: 20, display: "flex", flexDirection: "column" as const, gap: 12 };
const fichaRow = { display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: "rgba(255,255,255,0.04)", borderRadius: 10 };
const fichaIcon = { fontSize: 18, flexShrink: 0 };
const fichaHorario = { marginTop: 20, background: "rgba(37,99,235,0.08)", border: "1px solid rgba(37,99,235,0.2)", borderRadius: 14, padding: "16px" };
const btnCerrarFicha = { background: "rgba(255,255,255,0.06)", border: "none", color: "#94a3b8", width: 30, height: 30, borderRadius: "50%", cursor: "pointer", fontSize: 14 };
const btnLlamarStyle = { display: "block", marginTop: 20, background: "linear-gradient(135deg,#16a34a,#15803d)", color: "white", padding: "14px", borderRadius: 14, textAlign: "center" as const, fontWeight: 800, textDecoration: "none", fontSize: 15 };

export default function ChatPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: "100vh", background: "#020b2d", display: "flex", alignItems: "center", justifyContent: "center", color: "white" }}>
        <p>Cargando chat...</p>
      </div>
    }>
      <ChatPageInner />
    </Suspense>
  );
}