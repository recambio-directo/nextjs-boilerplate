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
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    iniciar();
    const interval = setInterval(() => { cargarCesta(); }, 1200);
    return () => clearInterval(interval);
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
    if (!user) return;
    setUserId(user.id);
    cargarCesta(user.id);
    cargarNotificaciones(user.id);

    // Cargar tipo de usuario para redirigir el logo
    const { data: perfil } = await supabase.from("usuarios").select("tipo").eq("id", user.id).single();
    if (perfil?.tipo) setTipoUsuario(perfil.tipo);

    supabase
      .channel("notif-realtime")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "mensajes" }, (payload) => {
        const m = payload.new as any;
        if (m.user_id !== user.id) {
          setNotifs(prev => [{ id: m.id, tipo: "chat", texto: `Nuevo mensaje en chat`, leido: false, created_at: m.created_at }, ...prev]);
        }
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "pedidos" }, (payload) => {
        const p = payload.new as any;
        setNotifs(prev => [{ id: p.id, tipo: "pedido", texto: `Pedido #${p.id} creado`, leido: false, created_at: p.created_at }, ...prev]);
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "pedidos" }, (payload) => {
        const p = payload.new as any;
        if (p.cliente_id === user.id) {
          setNotifs(prev => [{ id: `upd-${p.id}-${Date.now()}`, tipo: "pedido", texto: `Pedido #${p.id} → ${p.estado_envio || "actualizado"}`, leido: false, created_at: new Date().toISOString() }, ...prev]);
        }
      })
      .subscribe();
  }

  async function cargarCesta(uid?: string) {
    const id = uid || userId;
    if (!id) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from("cesta").select("*").eq("user_id", user.id);
      setTotalCesta(data?.length || 0);
      return;
    }
    const { data } = await supabase.from("cesta").select("*").eq("user_id", id);
    setTotalCesta(data?.length || 0);
  }

  async function cargarNotificaciones(uid: string) {
    const notifsTotales: any[] = [];

    // Mensajes no leídos — buscar en todas las conversaciones del usuario
    const { data: convs1 } = await supabase.from("conversaciones").select("id").eq("user1_id", uid);
    const { data: convs2 } = await supabase.from("conversaciones").select("id").eq("user2_id", uid);
    const convIds = [...(convs1 || []), ...(convs2 || [])].map(c => c.id);

    if (convIds.length > 0) {
      const { data: msgs } = await supabase
        .from("mensajes")
        .select("id, mensaje, created_at, conversacion_id, leido, user_id")
        .in("conversacion_id", convIds)
        .neq("user_id", uid)  // no son mis propios mensajes
        .or("leido.is.null,leido.eq.false")  // leido=false O leido=null
        .order("created_at", { ascending: false })
        .limit(10);

      if (msgs && msgs.length > 0) {
        msgs.forEach(m => notifsTotales.push({
          id: m.id,
          tipo: "chat",
          texto: `💬 ${m.mensaje.substring(0, 50)}${m.mensaje.length > 50 ? "..." : ""}`,
          leido: false,
          created_at: m.created_at,
          conv_id: m.conversacion_id,
        }));
      }
    }

    // Pedidos con estado actualizado (no pendiente)
    const { data: pedidos } = await supabase
      .from("pedidos")
      .select("id, estado_envio, created_at")
      .eq("cliente_id", uid)
      .neq("estado_envio", "pendiente")
      .order("created_at", { ascending: false })
      .limit(5);

    if (pedidos && pedidos.length > 0) {
      pedidos.forEach(p => notifsTotales.push({
        id: `ped-${p.id}`,
        tipo: "pedido",
        texto: `📦 Pedido #${p.id} → ${p.estado_envio}`,
        leido: false,
        created_at: p.created_at,
      }));
    }

    // Ordenar por fecha más reciente
    notifsTotales.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    if (notifsTotales.length > 0) setNotifs(notifsTotales);
  }

  function buscarAhora() {
    if (busqueda.trim() === "") return;
    router.push(`/dashboard/buscar?q=${encodeURIComponent(busqueda)}`);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") buscarAhora();
  }

  function marcarLeidas() {
    setNotifs(prev => prev.map(n => ({ ...n, leido: true })));
  }

  const noLeidas = notifs.filter(n => !n.leido).length;

  return (
    <div style={wrapperStyle}>
      <header style={{ ...headerStyle, display: pathname.includes("/proveedor") ? "none" : "flex" }}>

        {/* LOGO */}
        <Link href={
          tipoUsuario === "proveedor" ? "/dashboard/proveedor" :
          tipoUsuario === "taller" ? "/dashboard" :
          pathname.includes("/proveedor") ? "/dashboard/proveedor" : "/dashboard"
        } style={logoContainer}>
          <div style={logoBox}>
            <Image src="/logo.svg" alt="Recambio Directo" width={46} height={46} priority />
          </div>
          <div>
            <h1 style={logoTitle}>RECAMBIO DIRECTO</h1>
            <p style={logoSubtitle}>Marketplace B2B</p>
          </div>
        </Link>

        {/* SEARCH */}
        <div style={searchContainer}>
          <input
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Buscar referencia OEM, IAM o equivalente..."
            style={searchInput}
          />
          <button onClick={buscarAhora} style={searchButton}>🔍</button>
        </div>

        {/* NAV — sin enlace "Buscar" */}
        <nav style={navStyle}>
          <Link href="/dashboard" style={{ ...navLink, color: pathname === "/dashboard" ? "white" : "#e2e8f0" }}>
            Inicio
          </Link>
          <Link href="/dashboard/pedidos" style={navLink}>Pedidos</Link>

          {/* CESTA */}
          <Link href="/checkout" style={cestaLink}>
            <div style={cestaIconContainer}>
              <div style={cartEmoji}>🛒</div>
              {totalCesta > 0 && <span style={cestaBadge}>{totalCesta}</span>}
            </div>
            <span>Cesta</span>
          </Link>

          <Link href="/perfil" style={navLink}>Mi Cuenta</Link>
          <Link href="/chat" style={navLink}>Chat</Link>

          {/* CAMPANITA */}
          <div ref={notifRef} style={{ position: "relative" }}>
            <button
              onClick={() => { setShowNotifs(!showNotifs); if (!showNotifs) marcarLeidas(); }}
              style={notificationButton}
            >
              🔔
              {noLeidas > 0 && <span style={notifBadge}>{noLeidas > 9 ? "9+" : noLeidas}</span>}
            </button>

            {showNotifs && (
              <div style={notifPanel}>
                <div style={notifHeader}>
                  <span style={{ fontWeight: 800, fontSize: 15 }}>Notificaciones</span>
                  {notifs.length > 0 && (
                    <button onClick={() => setNotifs([])} style={btnLimpiar}>Limpiar</button>
                  )}
                </div>
                {notifs.length === 0 ? (
                  <div style={notifEmpty}>
                    <p style={{ fontSize: 32, marginBottom: 8 }}>🔔</p>
                    <p>Sin notificaciones</p>
                  </div>
                ) : (
                  <div style={{ maxHeight: 340, overflowY: "auto" }}>
                    {notifs.slice(0, 15).map((n, i) => (
                      <div
                        key={i}
                        onClick={() => {
                          setShowNotifs(false);
                          if (n.tipo === "chat") router.push(n.conv_id ? `/chat?conv=${n.conv_id}` : "/chat");
                          if (n.tipo === "pedido") router.push("/dashboard/pedidos");
                        }}
                        style={{
                          ...notifItem,
                          background: n.leido ? "transparent" : "rgba(37,99,235,0.08)",
                          borderLeft: n.leido ? "3px solid transparent" : "3px solid #2563eb",
                        }}
                      >
                        <span style={{ fontSize: 18, marginRight: 10 }}>
                          {n.tipo === "chat" ? "💬" : "📦"}
                        </span>
                        <div style={{ flex: 1 }}>
                          <p style={{ fontSize: 13, fontWeight: 600, margin: 0 }}>{n.texto}</p>
                          <p style={{ fontSize: 11, color: "#94a3b8", margin: 0, marginTop: 3 }}>
                            {n.created_at ? new Date(n.created_at).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" }) : ""}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </nav>
      </header>

      <main style={contentStyle}>{children}</main>
    </div>
  );
}

/* STYLES */
const wrapperStyle = { minHeight: "100vh", background: "linear-gradient(180deg,#020617 0%,#020817 100%)", color: "white" };
const headerStyle = { height: "90px", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 34px", borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(2,6,23,0.82)", backdropFilter: "blur(16px)", position: "sticky" as const, top: 0, zIndex: 999 };
const logoContainer = { display: "flex", alignItems: "center", gap: "16px", textDecoration: "none", color: "white" };
const logoBox = { width: "58px", height: "58px", borderRadius: "18px", background: "rgba(255,255,255,0.04)", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid rgba(255,255,255,0.08)" };
const logoTitle = { margin: 0, fontSize: "20px", fontWeight: 900 };
const logoSubtitle = { margin: 0, color: "#94a3b8", fontSize: "13px" };
const searchContainer = { width: "520px", display: "flex" };
const searchInput = { flex: 1, background: "#0f172a", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "16px 0 0 16px", padding: "16px 18px", color: "white", fontSize: "15px", outline: "none" };
const searchButton = { width: "74px", border: "none", borderRadius: "0 16px 16px 0", background: "linear-gradient(135deg,#2563eb,#1d4ed8)", color: "white", cursor: "pointer", fontSize: "18px", fontWeight: 800, boxShadow: "0 10px 25px rgba(37,99,235,0.35)" };
const navStyle = { display: "flex", alignItems: "center", gap: "22px" };
const navLink = { textDecoration: "none", color: "#e2e8f0", fontWeight: 700, fontSize: "15px" };
const cestaLink = { display: "flex", alignItems: "center", gap: "10px", textDecoration: "none", color: "white", fontWeight: 800 };
const cestaIconContainer = { position: "relative" as const, display: "flex", alignItems: "center", justifyContent: "center" };
const cartEmoji = { fontSize: "24px", lineHeight: 1, position: "relative" as const, zIndex: 2 };
const cestaBadge = { position: "absolute" as const, top: "-8px", right: "-12px", minWidth: "22px", height: "22px", borderRadius: "999px", background: "#22c55e", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: 900, padding: "0 6px", border: "2px solid #020617", boxShadow: "0 0 20px rgba(34,197,94,0.55)", zIndex: 5 };
const notificationButton = { width: "46px", height: "46px", borderRadius: "14px", border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.05)", color: "white", cursor: "pointer", fontSize: "20px", position: "relative" as const };
const notifBadge = { position: "absolute" as const, top: "-6px", right: "-6px", minWidth: "18px", height: "18px", borderRadius: "999px", background: "#ef4444", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", fontWeight: 900, padding: "0 4px", border: "2px solid #020617" };
const notifPanel = { position: "absolute" as const, right: 0, top: "54px", width: 320, background: "#0f172a", borderRadius: 16, border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 20px 50px rgba(0,0,0,0.8)", zIndex: 9999, overflow: "hidden" };
const notifHeader = { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 18px", borderBottom: "1px solid rgba(255,255,255,0.06)" };
const btnLimpiar = { background: "transparent", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: 12, fontWeight: 700 };
const notifEmpty = { padding: "32px", textAlign: "center" as const, color: "#94a3b8", fontSize: 14 };
const notifItem = { display: "flex", alignItems: "flex-start", padding: "12px 16px", cursor: "pointer", borderBottom: "1px solid rgba(255,255,255,0.04)", transition: "background 0.15s" };
const contentStyle = { paddingBottom: "60px" };