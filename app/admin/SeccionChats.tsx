import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY!
);
import { tableContainer, tableStyle, thStyle, trStyle, tdStyle, searchInput } from "./types";

type Conversacion = {
  id: number;
  user1_id: string;
  user2_id: string;
  referencia?: string;
  ultimo_mensaje?: string;
  updated_at?: string;
  user1_nombre?: string;
  user2_nombre?: string;
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
};

export default function SeccionChats() {
  const [conversaciones, setConversaciones] = useState<Conversacion[]>([]);
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [chatActivo, setChatActivo] = useState<number | null>(null);
  const [busqueda, setBusqueda] = useState("");
  const [cargando, setCargando] = useState(true);

  useEffect(() => { cargarConversaciones(); }, []);

  async function cargarConversaciones() {
    setCargando(true);
    const { data: convs } = await supabase.from("conversaciones").select("*").order("updated_at", { ascending: false });
    if (!convs) { setCargando(false); return; }

    const userIds = [...new Set([...convs.map(c => c.user1_id), ...convs.map(c => c.user2_id)].filter(Boolean))];
    const { data: perfiles } = await supabase.from("usuarios").select("id, nombre_empresa, email").in("id", userIds);
    const perfilesMap = new Map((perfiles || []).map(p => [p.id, p]));

    const convsConNombres: Conversacion[] = convs.map(c => ({
      ...c,
      user1_nombre: perfilesMap.get(c.user1_id)?.nombre_empresa || perfilesMap.get(c.user1_id)?.email || "—",
      user2_nombre: perfilesMap.get(c.user2_id)?.nombre_empresa || perfilesMap.get(c.user2_id)?.email || "—",
    }));

    setConversaciones(convsConNombres);
    setCargando(false);
  }

  async function cargarMensajes(convId: number) {
    setChatActivo(convId);
    const { data } = await supabase.from("mensajes").select("*").eq("conversacion_id", convId).order("created_at", { ascending: true });
    setMensajes(data || []);
  }

  async function eliminarConversacion(convId: number) {
    if (!confirm("¿Eliminar esta conversación y todos sus mensajes?")) return;
    await supabase.from("mensajes").delete().eq("conversacion_id", convId);
    await supabase.from("conversaciones").delete().eq("id", convId);
    setConversaciones(prev => prev.filter(c => c.id !== convId));
    if (chatActivo === convId) { setChatActivo(null); setMensajes([]); }
  }

  const convFiltradas = conversaciones.filter(c => {
    if (!busqueda) return true;
    const q = busqueda.toLowerCase();
    return (c.user1_nombre || "").toLowerCase().includes(q) || (c.user2_nombre || "").toLowerCase().includes(q) || (c.referencia || "").toLowerCase().includes(q) || (c.ultimo_mensaje || "").toLowerCase().includes(q);
  });

  const convActiva = conversaciones.find(c => c.id === chatActivo);

  return (
    <div>
      <h1 style={{ fontSize: 56, fontWeight: 900, lineHeight: 1, marginBottom: 12 }}>CHATS</h1>
      <p style={{ color: "#94a3b8", fontSize: 18, marginBottom: 36 }}>Todas las conversaciones de la plataforma.</p>

      <div style={{ display: "flex", gap: 24, height: "calc(100vh - 280px)", minHeight: 500 }}>

        {/* LISTA CONVERSACIONES */}
        <div style={{ width: 380, display: "flex", flexDirection: "column", gap: 12, flexShrink: 0 }}>
          <input placeholder="Buscar conversación..." value={busqueda} onChange={e => setBusqueda(e.target.value)} style={{ ...searchInput, width: "100%", boxSizing: "border-box" as const }} />
          <div style={{ background: "rgba(15,23,42,0.95)", borderRadius: 16, border: "1px solid rgba(255,255,255,0.06)", flex: 1, overflowY: "auto" as const }}>
            {cargando ? (
              <div style={{ padding: 40, textAlign: "center", color: "#94a3b8" }}>Cargando...</div>
            ) : convFiltradas.length === 0 ? (
              <div style={{ padding: 40, textAlign: "center", color: "#94a3b8" }}>No hay conversaciones</div>
            ) : convFiltradas.map(conv => (
              <div key={conv.id} onClick={() => cargarMensajes(conv.id)} style={{ padding: "14px 16px", borderBottom: "1px solid rgba(255,255,255,0.04)", cursor: "pointer", background: chatActivo === conv.id ? "rgba(37,99,235,0.15)" : "transparent", borderLeft: chatActivo === conv.id ? "3px solid #2563eb" : "3px solid transparent" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: "#60a5fa", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>{conv.user1_nombre}</div>
                    <div style={{ fontWeight: 600, fontSize: 12, color: "#94a3b8" }}>↔ {conv.user2_nombre}</div>
                    {conv.referencia && <div style={{ fontSize: 11, color: "#a78bfa", marginTop: 2 }}>{conv.referencia}</div>}
                    {conv.ultimo_mensaje && <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginTop: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>{conv.ultimo_mensaje}</div>}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6, flexShrink: 0 }}>
                    <span style={{ fontSize: 10, color: "#475569" }}>{conv.updated_at ? new Date(conv.updated_at).toLocaleDateString("es-ES") : ""}</span>
                    <button onClick={e => { e.stopPropagation(); eliminarConversacion(conv.id); }} style={{ background: "rgba(239,68,68,0.1)", border: "none", color: "#f87171", padding: "3px 8px", borderRadius: 6, cursor: "pointer", fontSize: 11, fontWeight: 700 }}>🗑️</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div style={{ color: "#94a3b8", fontSize: 12, textAlign: "center" as const }}>{convFiltradas.length} conversación{convFiltradas.length !== 1 ? "es" : ""}</div>
        </div>

        {/* PANEL MENSAJES */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", background: "rgba(15,23,42,0.95)", borderRadius: 16, border: "1px solid rgba(255,255,255,0.06)", overflow: "hidden" }}>
          {chatActivo === null ? (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "#94a3b8" }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>💬</div>
              <p>Selecciona una conversación para ver los mensajes</p>
            </div>
          ) : (
            <>
              {/* CABECERA */}
              <div style={{ padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(0,0,0,0.2)" }}>
                <div style={{ fontWeight: 800, fontSize: 15 }}>{convActiva?.user1_nombre} ↔ {convActiva?.user2_nombre}</div>
                {convActiva?.referencia && <div style={{ color: "#a78bfa", fontSize: 12, marginTop: 2 }}>{convActiva.referencia}</div>}
                <div style={{ color: "#475569", fontSize: 11, marginTop: 2 }}>ID conversación: #{chatActivo}</div>
              </div>

              {/* MENSAJES */}
              <div style={{ flex: 1, overflowY: "auto" as const, padding: "16px 20px", display: "flex", flexDirection: "column", gap: 8 }}>
                {mensajes.length === 0 ? (
                  <div style={{ textAlign: "center", color: "#94a3b8", marginTop: 40 }}>Sin mensajes</div>
                ) : mensajes.map(msg => {
                  const esUser1 = msg.user_id === convActiva?.user1_id;
                  return (
                    <div key={msg.id} style={{ display: "flex", justifyContent: esUser1 ? "flex-start" : "flex-end" }}>
                      <div style={{ background: esUser1 ? "#1e293b" : "linear-gradient(135deg,#2563eb,#1d4ed8)", padding: "10px 14px", borderRadius: esUser1 ? "16px 16px 16px 4px" : "16px 16px 4px 16px", maxWidth: "70%" }}>
                        <div style={{ fontSize: 10, color: "rgba(255,255,255,0.5)", marginBottom: 4, fontWeight: 700 }}>{esUser1 ? convActiva?.user1_nombre : convActiva?.user2_nombre}</div>
                        <p style={{ fontSize: 14, margin: 0, lineHeight: 1.5 }}>{msg.mensaje}</p>
                        <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", marginTop: 4, textAlign: "right" as const }}>{new Date(msg.created_at).toLocaleString("es-ES", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}