"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { supabase } from "../lib/supabase";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [busqueda, setBusqueda] = useState("");
  const [totalCesta, setTotalCesta] = useState(0);
  const [notifs, setNotifs] = useState<any[]>([]);
  const [showNotifs, setShowNotifs] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [tipoUsuario, setTipoUsuario] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<any>(null);
  const userIdRef = useRef<string | null>(null);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    iniciar();
    const interval = setInterval(() => cargarCesta(), 5000);
    return () => {
      clearInterval(interval);
      if (channelRef.current) supabase.removeChannel(channelRef.current);
    };
  }, []);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifs(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  async function iniciar() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { window.location.href = "/"; return; }
    setUserId(user.id);
    userIdRef.current = user.id;
    cargarCesta(user.id);
    await cargarNotificaciones(user.id);
    const { data: perfil } = await supabase.from("usuarios").select("tipo").eq("id", user.id).single();
    if (perfil?.tipo) setTipoUsuario(perfil.tipo);
    suscribirRealtime(user.id);
  }

  function suscribirRealtime(uid: string) {
    // Canal único por usuario para evitar duplicados entre pestañas
    const channelName = `taller-notif-${uid}-${Date.now()}`;
    const channel = supabase
      .channel(channelName)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "mensajes" }, async (payload) => {
        const m = payload.new as any;
        if (m.user_id === uid) return; // mensaje propio, ignorar
        // Verificar que la conversación pertenece al usuario
        if (m.conversacion_id) {
          const { data: conv } = await supabase
            .from("conversaciones").select("id")
            .eq("id", m.conversacion_id)
            .or(`user1_id.eq.${uid},user2_id.eq.${uid}`)
            .maybeSingle();
          if (!conv) return; // conversación no es del usuario
        }
        const texto = (m.mensaje || "").substring(0, 60);
        agregarNotif({ id: m.id, tipo: "chat", texto: `💬 ${texto}`, leido: false, created_at: m.created_at, conv_id: m.conversacion_id });
        // Sonido suave
        try { new Audio("data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhS0lrlrarlX9oYWBslqOqp5h6ZVZPVXOQoKSdj3tiU0lFTWmGmZ6bko9/cWZeW2B0i5uhoJqQfmpZTUVGVXCJm52YkY57bWVha3yPn6Cclol0X1FJSFhxipmcmJCLfm5oZmpzhJWdoJuSiXtpWU9KUGqDlpuamJGKfG9pampyhJOamJeUjYF1amFcXGVzmJqZmJWPh3tvaWdpb3iKmJmYlpGMg3lyb3BzeouYmpiVkYuFfHZ0dnx/iZSXl5WTj4mCfnx8fX+Bh5GWl5aUkY2Hg4GAfn1+goiOk5WVlJKPi4eDgH59fX+ChouPlJWUk5CMinZ=").play(); } catch {}
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "pedidos" }, (payload) => {
        const p = payload.new as any;
        const old = payload.old as any;
        if (p.cliente_id !== uid) return;
        // Solo notificar si cambió el estado
        if (p.estado_envio === old?.estado_envio) return;
        const estadoLabel: Record<string, string> = {
          preparando: "🔧 en preparación",
          enviado: "🚚 enviado",
          entregado: "✅ entregado",
          anulado: "❌ anulado",
        };
        const label = estadoLabel[p.estado_envio] || p.estado_envio;
        agregarNotif({ id: `upd-${p.id}-${Date.now()}`, tipo: "pedido", texto: `📦 Pedido ${p.codigo || `#${p.id}`} → ${label}`, leido: false, created_at: new Date().toISOString(), pedido_id: p.id });
      })
      .subscribe();
    channelRef.current = channel;
  }

  function agregarNotif(n: any) {
    setNotifs(prev => {
      // Evitar duplicados por id
      if (prev.some(x => x.id === n.id)) return prev;
      return [n, ...prev].slice(0, 30);
    });
  }

  async function cargarCesta(uid?: string) {
    const id = uid || userIdRef.current;
    if (!id) return;
    const { data } = await supabase.from("cesta").select("id").eq("user_id", id);
    setTotalCesta(data?.length || 0);
  }

  async function cargarNotificaciones(uid: string) {
    // Cooldown de 60s persistido en sessionStorage — sobrevive navegación atrás
    const KEY = `rd_notif_last_${uid}`;
    const ultimo = parseInt(sessionStorage.getItem(KEY) || "0");
    const ahora = Date.now();
    if (ahora - ultimo < 60000) return; // menos de 1 minuto → no recargar
    sessionStorage.setItem(KEY, String(ahora));

    // Guardar qué notificaciones ya habíamos visto antes
    const VISTAS_KEY = `rd_notif_vistas_${uid}`;
    const vistasAntes = new Set<string>(JSON.parse(sessionStorage.getItem(VISTAS_KEY) || "[]"));

    const notifsTotales: any[] = [];

    // Mensajes no leídos en conversaciones del usuario
    const { data: convs1 } = await supabase.from("conversaciones").select("id").eq("user1_id", uid);
    const { data: convs2 } = await supabase.from("conversaciones").select("id").eq("user2_id", uid);
    const convIds = [...(convs1 || []), ...(convs2 || [])].map(c => c.id);
    if (convIds.length > 0) {
      const { data: msgs } = await supabase
        .from("mensajes")
        .select("id, mensaje, created_at, conversacion_id")
        .in("conversacion_id", convIds)
        .neq("user_id", uid)
        .or("leido.is.null,leido.eq.false")
        .order("created_at", { ascending: false })
        .limit(10);
      (msgs || []).forEach(m => notifsTotales.push({
        id: m.id, tipo: "chat",
        texto: `💬 ${(m.mensaje || "").substring(0, 50)}${m.mensaje?.length > 50 ? "..." : ""}`,
        leido: vistasAntes.has(String(m.id)), // leído si ya lo habíamos visto antes
        created_at: m.created_at, conv_id: m.conversacion_id,
      }));
    }

    // Pedidos con estado distinto a pendiente de los últimos 30 días
    const hace30dias = new Date();
    hace30dias.setDate(hace30dias.getDate() - 30);
    const { data: pedidos } = await supabase
      .from("pedidos")
      .select("id, codigo, estado_envio, created_at")
      .eq("cliente_id", uid)
      .neq("estado_envio", "pendiente")
      .not("estado_envio", "is", null)
      .gte("created_at", hace30dias.toISOString())
      .order("created_at", { ascending: false })
      .limit(5);
    (pedidos || []).forEach(p => {
      const estadoLabel: Record<string, string> = { preparando: "🔧 en preparación", enviado: "🚚 enviado", entregado: "✅ entregado", anulado: "❌ anulado" };
      notifsTotales.push({
        id: `ped-${p.id}`, tipo: "pedido",
        texto: `📦 Pedido ${p.codigo || `#${p.id}`} → ${estadoLabel[p.estado_envio] || p.estado_envio}`,
        leido: true, // histórico → ya leído
        created_at: p.created_at, pedido_id: p.id,
      });
    });

    notifsTotales.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    setNotifs(notifsTotales);

    // Guardar IDs de todos los mensajes cargados como "vistos" para próximas recargas
    const todosIds = notifsTotales.map(n => String(n.id));
    sessionStorage.setItem(VISTAS_KEY, JSON.stringify(todosIds));
  }

  async function marcarLeidas() {
    setNotifs(prev => prev.map(n => ({ ...n, leido: true })));
    const uid = userIdRef.current;
    if (!uid) return;

    // Guardar todos los IDs actuales como vistos
    const VISTAS_KEY = `rd_notif_vistas_${uid}`;
    const idsActuales = notifs.map(n => String(n.id));
    sessionStorage.setItem(VISTAS_KEY, JSON.stringify(idsActuales));

    const convIds = notifs.filter(n => n.tipo === "chat" && n.conv_id).map(n => n.conv_id);
    if (convIds.length > 0) {
      await supabase.from("mensajes")
        .update({ leido: true })
        .in("conversacion_id", [...new Set(convIds)])
        .neq("user_id", uid);
    }
  }

  function buscarAhora() {
    if (busqueda.trim() === "") return;
    router.push(`/dashboard/buscar?q=${encodeURIComponent(busqueda)}`);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") buscarAhora();
  }

  const noLeidas = notifs.filter(n => !n.leido).length;
  const esProveedor = pathname.includes("/proveedor");
  const logoHref = tipoUsuario === "proveedor" ? "/dashboard/proveedor" : "/dashboard";

  const tabs = [
    { href: "/dashboard",         icon: "🏠", label: "Inicio" },
    { href: "/dashboard/buscar",  icon: "🔍", label: "Buscar" },
    { href: "/checkout",          icon: "🛒", label: "Cesta", badge: totalCesta },
    { href: "/dashboard/pedidos", icon: "📦", label: "Pedidos" },
    { href: "/perfil",            icon: "👤", label: "Cuenta" },
  ];

  if (esProveedor) return <main>{children}</main>;

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(180deg,#020617 0%,#020817 100%)", color: "white" }}>

      <header style={{ height: isMobile ? 60 : 90, display: "flex", alignItems: "center", justifyContent: "space-between", padding: isMobile ? "0 16px" : "0 34px", borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(2,6,23,0.95)", backdropFilter: "blur(16px)", position: "sticky", top: 0, zIndex: 999 }}>

        <Link href={logoHref} style={{ display: "flex", alignItems: "center", gap: isMobile ? 8 : 16, textDecoration: "none", color: "white" }}>
          <div style={{ width: isMobile ? 36 : 54, height: isMobile ? 36 : 54, borderRadius: 12, background: "rgba(255,255,255,0.04)", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid rgba(255,255,255,0.08)", flexShrink: 0 }}>
            <Image src="/logo.svg" alt="Recambio Directo" width={isMobile ? 28 : 42} height={isMobile ? 28 : 42} priority />
          </div>
          {!isMobile && <div><h1 style={{ margin: 0, fontSize: 20, fontWeight: 900 }}>RECAMBIO DIRECTO</h1><p style={{ margin: 0, color: "#94a3b8", fontSize: 13 }}>Marketplace B2B</p></div>}
          {isMobile && <span style={{ fontWeight: 900, fontSize: 15 }}>RECAMBIO DIRECTO</span>}
        </Link>

        {!isMobile && (
          <div style={{ width: "520px", display: "flex" }}>
            <input value={busqueda} onChange={e => setBusqueda(e.target.value)} onKeyDown={handleKeyDown} placeholder="Buscar referencia OEM, IAM o equivalente..." style={{ flex: 1, background: "#0f172a", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "16px 0 0 16px", padding: "16px 18px", color: "white", fontSize: 15, outline: "none" }} />
            <button onClick={buscarAhora} style={{ width: 74, border: "none", borderRadius: "0 16px 16px 0", background: "linear-gradient(135deg,#2563eb,#1d4ed8)", color: "white", cursor: "pointer", fontSize: 18, fontWeight: 800 }}>🔍</button>
          </div>
        )}

        {!isMobile && (
          <nav style={{ display: "flex", alignItems: "center", gap: 22 }}>
            <Link href="/dashboard" style={{ textDecoration: "none", color: pathname === "/dashboard" ? "white" : "#e2e8f0", fontWeight: 700, fontSize: 15 }}>Inicio</Link>
            <Link href="/dashboard/pedidos" style={{ textDecoration: "none", color: "#e2e8f0", fontWeight: 700, fontSize: 15 }}>Pedidos</Link>
            <Link href="/checkout" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none", color: "white", fontWeight: 800 }}>
              <div style={{ position: "relative" }}>
                <span style={{ fontSize: 24 }}>🛒</span>
                {totalCesta > 0 && <span style={{ position: "absolute", top: -8, right: -12, minWidth: 22, height: 22, borderRadius: 999, background: "#22c55e", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 900, padding: "0 6px", border: "2px solid #020617" }}>{totalCesta}</span>}
              </div>
              <span>Cesta</span>
            </Link>
            <Link href="/perfil" style={{ textDecoration: "none", color: "#e2e8f0", fontWeight: 700, fontSize: 15 }}>Mi Cuenta</Link>
            <Link href="/chat" style={{ textDecoration: "none", color: "#e2e8f0", fontWeight: 700, fontSize: 15 }}>Chat</Link>
            <div ref={notifRef} style={{ position: "relative" }}>
              <button onClick={() => { setShowNotifs(!showNotifs); if (!showNotifs) marcarLeidas(); }} style={{ width: 46, height: 46, borderRadius: 14, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.05)", color: "white", cursor: "pointer", fontSize: 20, position: "relative" }}>
                🔔
                {noLeidas > 0 && <span style={{ position: "absolute", top: -6, right: -6, minWidth: 18, height: 18, borderRadius: 999, background: "#ef4444", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 900, padding: "0 4px", border: "2px solid #020617" }}>{noLeidas > 9 ? "9+" : noLeidas}</span>}
              </button>
              {showNotifs && (
                <div style={{ position: "absolute", right: 0, top: 54, width: 340, background: "#0f172a", borderRadius: 16, border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 20px 50px rgba(0,0,0,0.8)", zIndex: 9999, overflow: "hidden" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 18px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                    <span style={{ fontWeight: 800, fontSize: 15 }}>Notificaciones {noLeidas > 0 && <span style={{ background: "#ef4444", color: "white", borderRadius: 999, padding: "2px 8px", fontSize: 11, marginLeft: 8 }}>{noLeidas} nuevas</span>}</span>
                    {notifs.length > 0 && <button onClick={() => setNotifs([])} style={{ background: "transparent", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: 12, fontWeight: 700 }}>Limpiar</button>}
                  </div>
                  {notifs.length === 0 ? (
                    <div style={{ padding: 32, textAlign: "center", color: "#94a3b8", fontSize: 14 }}><p style={{ fontSize: 32, marginBottom: 8 }}>🔔</p><p>Sin notificaciones</p></div>
                  ) : (
                    <div style={{ maxHeight: 380, overflowY: "auto" }}>
                      {notifs.slice(0, 20).map((n, i) => (
                        <div key={`${n.id}-${i}`} onClick={() => { setShowNotifs(false); marcarLeidas(); if (n.tipo === "chat") router.push(n.conv_id ? `/chat?conv=${n.conv_id}` : "/chat"); if (n.tipo === "pedido") router.push("/dashboard/pedidos"); }} style={{ display: "flex", alignItems: "flex-start", padding: "12px 16px", cursor: "pointer", borderBottom: "1px solid rgba(255,255,255,0.04)", background: n.leido ? "transparent" : "rgba(37,99,235,0.1)", borderLeft: n.leido ? "3px solid transparent" : "3px solid #2563eb", transition: "background 0.2s" }}>
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
          </nav>
        )}

        {isMobile && (
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <button onClick={() => { setShowNotifs(!showNotifs); if (!showNotifs) marcarLeidas(); }} style={{ background: "none", border: "none", color: "white", cursor: "pointer", fontSize: 22, position: "relative", padding: "8px", borderRadius: 10 }}>
              🔔
              {noLeidas > 0 && <span style={{ position: "absolute", top: 2, right: 2, minWidth: 16, height: 16, borderRadius: 999, background: "#ef4444", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 900, border: "2px solid #020617" }}>{noLeidas > 9 ? "9+" : noLeidas}</span>}
            </button>
          </div>
        )}
      </header>

      {isMobile && (
        <div style={{ position: "sticky", top: 60, zIndex: 998, background: "rgba(2,6,23,0.97)", padding: "10px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ display: "flex" }}>
            <input value={busqueda} onChange={e => setBusqueda(e.target.value)} onKeyDown={handleKeyDown} placeholder="🔍  Buscar referencia OEM, IAM..." style={{ flex: 1, background: "#0f172a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px 0 0 12px", padding: "12px 14px", color: "white", fontSize: 15, outline: "none" }} />
            <button onClick={buscarAhora} style={{ padding: "12px 18px", border: "none", borderRadius: "0 12px 12px 0", background: "linear-gradient(135deg,#2563eb,#1d4ed8)", color: "white", cursor: "pointer", fontSize: 16, fontWeight: 800 }}>Ir</button>
          </div>
        </div>
      )}

      {isMobile && showNotifs && (
        <div style={{ position: "fixed", top: 60, right: 0, left: 0, background: "#0f172a", borderBottom: "1px solid rgba(255,255,255,0.1)", zIndex: 9998, maxHeight: "55vh", overflowY: "auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <span style={{ fontWeight: 700 }}>Notificaciones {noLeidas > 0 && <span style={{ background: "#ef4444", color: "white", borderRadius: 999, padding: "1px 8px", fontSize: 11, marginLeft: 6 }}>{noLeidas}</span>}</span>
            <div style={{ display: "flex", gap: 12 }}>
              {notifs.length > 0 && <button onClick={() => setNotifs([])} style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: 12 }}>Limpiar</button>}
              <button onClick={() => setShowNotifs(false)} style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: 16 }}>✕</button>
            </div>
          </div>
          {notifs.length === 0 ? (
            <div style={{ padding: 24, textAlign: "center", color: "#94a3b8" }}>Sin notificaciones</div>
          ) : notifs.slice(0, 15).map((n, i) => (
            <div key={`${n.id}-${i}`} onClick={() => { setShowNotifs(false); marcarLeidas(); if (n.tipo === "chat") router.push(n.conv_id ? `/chat?conv=${n.conv_id}` : "/chat"); if (n.tipo === "pedido") router.push("/dashboard/pedidos"); }} style={{ display: "flex", alignItems: "center", padding: "14px 16px", borderBottom: "1px solid rgba(255,255,255,0.04)", cursor: "pointer", gap: 10, background: n.leido ? "transparent" : "rgba(37,99,235,0.08)" }}>
              <span style={{ fontSize: 20 }}>{n.tipo === "chat" ? "💬" : "📦"}</span>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 14, margin: 0, fontWeight: n.leido ? 400 : 700 }}>{n.texto}</p>
                <p style={{ fontSize: 11, color: "#94a3b8", margin: 0, marginTop: 2 }}>{n.created_at ? new Date(n.created_at).toLocaleString("es-ES", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }) : ""}</p>
              </div>
              {!n.leido && <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#2563eb", flexShrink: 0 }} />}
            </div>
          ))}
        </div>
      )}

      <main style={{ paddingBottom: isMobile ? 80 : 60 }}>{children}</main>

      {isMobile && (
        <nav style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 9999, background: "rgba(2,6,23,0.97)", backdropFilter: "blur(20px)", borderTop: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "stretch", height: 64, paddingBottom: "env(safe-area-inset-bottom)" }}>
          {tabs.map(tab => {
            const activo = pathname === tab.href || (tab.href !== "/dashboard" && pathname.startsWith(tab.href));
            return (
              <Link key={tab.href} href={tab.href} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textDecoration: "none", gap: 3, color: activo ? "#60a5fa" : "#64748b", position: "relative" }}>
                {activo && <span style={{ position: "absolute", top: 0, left: "20%", right: "20%", height: 2, background: "#2563eb", borderRadius: "0 0 4px 4px" }} />}
                <span style={{ fontSize: 22, lineHeight: 1 }}>{tab.icon}</span>
                <span style={{ fontSize: 10, fontWeight: activo ? 800 : 600 }}>{tab.label}</span>
                {tab.badge && tab.badge > 0 && (
                  <span style={{ position: "absolute", top: 6, left: "55%", minWidth: 17, height: 17, borderRadius: 999, background: "#22c55e", color: "white", fontSize: 9, fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "center", border: "2px solid #020617", padding: "0 3px" }}>{tab.badge}</span>
                )}
              </Link>
            );
          })}
        </nav>
      )}
    </div>
  );
}