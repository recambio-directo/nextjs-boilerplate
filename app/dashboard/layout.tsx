"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { supabase } from "../lib/supabase";
import AsistentePanel from "../asistente/AsistentePanel";

const SONIDO_NOTIF = "data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhS0lrlrarlX9oYWBslqOqp5h6ZVZPVXOQoKSdj3tiU0lFTWmGmZ6bko9/cWZeW2B0i5uhoJqQfmpZTUVGVXCJm52YkY57bWVha3yPn6Cclol0X1FJSFhxipmcmJCLfm5oZmpzhJWdoJuSiXtpWU9KUGqDlpuamJGKfG9pampyhJOamJeUjYF1amFcXGVzmJqZmJWPh3tvaWdpb3iKmJmYlpGMg3lyb3BzeouYmpiVkYuFfHZ0dnx/iZSXl5WTj4mCfnx8fX+Bh5GWl5aUkY2Hg4GAfn1+goiOk5WVlJKPi4eDgH59fX+ChouPlJWUk5CMinZ=";

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
  const [perfilCargado, setPerfilCargado] = useState(false);
  const [facturacionTotal, setFacturacionTotal] = useState(0);
  const [pedidosTotales, setPedidosTotales] = useState(0);
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
    const interval = setInterval(() => cargarCesta(), 3000);
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
    suscribirCesta(user.id);
    await cargarNotificaciones(user.id);
    const { data: perfil } = await supabase.from("usuarios").select("tipo").eq("id", user.id).single();
    if (perfil?.tipo) setTipoUsuario(perfil.tipo);
    setPerfilCargado(true);
    // Datos del menú lateral del taller (antes solo los calculaba el Inicio)
    if (perfil?.tipo === "taller" && user.email) {
      const { data: peds } = await supabase.from("pedidos").select("total").eq("cliente_email", user.email);
      setPedidosTotales(peds?.length || 0);
      setFacturacionTotal((peds || []).reduce((acc: number, p: any) => acc + (Number(p.total) || 0), 0));
    }
    suscribirRealtime(user.id);
  }

  // Convierte una fila de notificaciones_usuario al formato que pinta la campanita
  function mapNotif(n: any) {
    return { id: n.id, tipo: n.tipo, texto: n.texto, leido: !!n.leida, created_at: n.created_at, conv_id: n.conv_id, pedido_id: n.pedido_id };
  }

  // Las notificaciones las crea la base de datos (triggers en pedidos y mensajes).
  // Aquí solo escuchamos las filas nuevas de este usuario.
  function suscribirRealtime(uid: string) {
    const channel = supabase
      .channel(`notif-${uid}-${Date.now()}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notificaciones_usuario", filter: `user_id=eq.${uid}` }, (payload) => {
        agregarNotif(mapNotif(payload.new));
        try { new Audio(SONIDO_NOTIF).play().catch(() => {}); } catch {}
      })
      .subscribe();
    channelRef.current = channel;
  }

  function agregarNotif(n: any) {
    setNotifs(prev => {
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

  function suscribirCesta(uid: string) {
    const channel = supabase
      .channel(`cesta-${uid}-${Date.now()}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "cesta", filter: `user_id=eq.${uid}` },
        () => cargarCesta(uid)
      )
      .subscribe();
    return channel;
  }

  async function cargarNotificaciones(uid: string) {
    const { data, error } = await supabase
      .from("notificaciones_usuario")
      .select("id, tipo, texto, leida, created_at, conv_id, pedido_id")
      .eq("user_id", uid)
      .order("created_at", { ascending: false })
      .limit(30);
    if (error) { console.error("Error cargando notificaciones:", error.message); return; }
    setNotifs((data || []).map(mapNotif));
  }

  // Limpiar = borrar de verdad en la base de datos (ya no depende del navegador)
  async function limpiarNotifs() {
    const uid = userIdRef.current;
    setNotifs([]);
    if (!uid) return;
    const { error } = await supabase.from("notificaciones_usuario").delete().eq("user_id", uid);
    if (error) console.error("Error limpiando notificaciones:", error.message);
  }

  async function marcarLeidas() {
    const uid = userIdRef.current;
    if (!uid) return;
    setNotifs(prev => prev.map(n => ({ ...n, leido: true })));
    const { error } = await supabase.from("notificaciones_usuario").update({ leida: true }).eq("user_id", uid).eq("leida", false);
    if (error) console.error("Error marcando notificaciones como leídas:", error.message);
  }

  function buscarAhora() {
    if (busqueda.trim() === "") return;
    router.push(`/dashboard/buscar?q=${encodeURIComponent(busqueda)}&t=${Date.now()}`);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") buscarAhora();
  }

  async function cerrarSesion() {
    await supabase.auth.signOut();
    location.href = "/";
  }

  const noLeidas = notifs.filter(n => !n.leido).length;
  // Cesta, Mi Cuenta y Chat viven fuera de /dashboard: solo los talleres los ven dentro del marco
  const fueraDelPanel = !pathname.startsWith("/dashboard");
  const esProveedor = pathname.includes("/proveedor");
  const logoHref = tipoUsuario === "proveedor" ? "/dashboard/proveedor" : "/dashboard";

  const tabs = [
    { href: "/dashboard",         icon: "🏠", label: "Inicio" },
    { href: "/checkout",          icon: "🛒", label: "Cesta", badge: totalCesta },
    { href: "/dashboard/catalogos", icon: "📚", label: "Catálogos" },
    { href: "/dashboard/pedidos", icon: "📦", label: "Pedidos" },
    { href: "/perfil",            icon: "👤", label: "Cuenta" },
  ];

  if (fueraDelPanel) {
    if (!perfilCargado) return <div style={{ minHeight: "100vh", background: "linear-gradient(135deg,#020617,#020b2d)" }} />;
    // En el móvil estas páginas se quedan exactamente como estaban
    if (isMobile || tipoUsuario !== "taller") return <>{children}</>;
  }

  const menuLateral = [
    { href: "/dashboard", label: "🏠 Inicio" },
    { href: "/dashboard/catalogos", label: "📚 Catálogos" },
    { href: "/dashboard/pedidos", label: "📦 Pedidos" },
    { href: "/dashboard/devoluciones", label: "🔄 Devoluciones" },
    { href: "/dashboard/mis-piezas", label: "🔩 Mis Piezas" },
    { href: "/checkout", label: "🛒 Cesta", badge: totalCesta },
    { href: "/perfil", label: "👤 Mi Cuenta" },
    { href: "/chat", label: "💬 Chat" },
  ];

  if (esProveedor) {
    const enCatalogos = pathname?.startsWith("/dashboard/catalogos");
    return (
      <div style={{ minHeight: "100vh", background: "linear-gradient(180deg,#020617 0%,#020817 100%)", color: "white" }}>
        {/* Header proveedor con buscador, chat y notificaciones */}
        <header style={{ height: isMobile ? 56 : 72, display: "flex", alignItems: "center", justifyContent: "space-between", padding: isMobile ? "0 12px" : "0 28px", borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(2,6,23,0.95)", backdropFilter: "blur(16px)", position: "sticky", top: 0, zIndex: 999 }}>
          <Link href="/dashboard/proveedor" scroll={false} onClick={() => window.scrollTo({ top: 0 })} style={{ display: "flex", alignItems: "center", gap: isMobile ? 8 : 14, textDecoration: "none", color: "white" }}>
            <div style={{ width: isMobile ? 32 : 44, height: isMobile ? 32 : 44, borderRadius: 10, background: "rgba(255,255,255,0.04)", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid rgba(255,255,255,0.08)", flexShrink: 0 }}>
              <Image src="/logo.svg" alt="Recambio Directo" width={isMobile ? 24 : 34} height={isMobile ? 24 : 34} priority />
            </div>
            {!isMobile && <div><h1 style={{ margin: 0, fontSize: 17, fontWeight: 900 }}>RECAMBIO DIRECTO</h1><p style={{ margin: 0, color: "#94a3b8", fontSize: 11 }}>Panel Proveedor</p></div>}
          </Link>

          {!isMobile && (
            <div style={{ width: "420px", display: "flex" }}>
              <input value={busqueda} onChange={e => setBusqueda(e.target.value)} onKeyDown={handleKeyDown} placeholder="Buscar referencia OEM, IAM..." style={{ flex: 1, background: "#0f172a", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "14px 0 0 14px", padding: "12px 16px", color: "white", fontSize: 14, outline: "none" }} />
              <button onClick={buscarAhora} style={{ width: 60, border: "none", borderRadius: "0 14px 14px 0", background: "linear-gradient(135deg,#2563eb,#1d4ed8)", color: "white", cursor: "pointer", fontSize: 16, fontWeight: 800 }}>🔍</button>
            </div>
          )}

          <nav style={{ display: "flex", alignItems: "center", gap: isMobile ? 8 : 18 }}>
            {!isMobile && (
              <>
                <Link href="/dashboard/catalogos" style={{ textDecoration: "none", color: pathname.startsWith("/dashboard/catalogos") ? "white" : "#e2e8f0", fontWeight: 700, fontSize: 14 }}>Catálogos</Link>
                <Link href="/chat" style={{ textDecoration: "none", color: "#e2e8f0", fontWeight: 700, fontSize: 14 }}>💬 Chat</Link>
              </>
            )}
            {isMobile && (
              <Link href="/chat" style={{ textDecoration: "none", color: "#e2e8f0", fontSize: 20 }}>💬</Link>
            )}
            <div ref={notifRef} style={{ position: "relative" }}>
              <button onClick={() => { setShowNotifs(!showNotifs); if (!showNotifs) marcarLeidas(); }} style={{ width: isMobile ? 36 : 42, height: isMobile ? 36 : 42, borderRadius: 12, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.05)", color: "white", cursor: "pointer", fontSize: 18, position: "relative" }}>
                🔔
                {noLeidas > 0 && <span style={{ position: "absolute", top: -5, right: -5, minWidth: 16, height: 16, borderRadius: 999, background: "#ef4444", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 900, padding: "0 4px", border: "2px solid #020617" }}>{noLeidas > 9 ? "9+" : noLeidas}</span>}
              </button>
              {showNotifs && (
                <div style={{ position: "absolute", right: 0, top: 50, width: isMobile ? 280 : 340, background: "#0f172a", borderRadius: 14, border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 20px 50px rgba(0,0,0,0.8)", zIndex: 9999, overflow: "hidden" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                    <span style={{ fontWeight: 800, fontSize: 14 }}>Notificaciones {noLeidas > 0 && <span style={{ background: "#ef4444", color: "white", borderRadius: 999, padding: "2px 8px", fontSize: 10, marginLeft: 8 }}>{noLeidas} nuevas</span>}</span>
                    {notifs.length > 0 && <button onClick={limpiarNotifs} style={{ background: "transparent", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: 11, fontWeight: 700 }}>Limpiar</button>}
                  </div>
                  {notifs.length === 0 ? (
                    <div style={{ padding: 28, textAlign: "center", color: "#94a3b8", fontSize: 13 }}><p style={{ fontSize: 28, marginBottom: 8 }}>🔔</p><p>Sin notificaciones</p></div>
                  ) : (
                    <div style={{ maxHeight: 340, overflowY: "auto" }}>
                      {notifs.slice(0, 15).map((n, i) => (
                        <div key={`${n.id}-${i}`} onClick={() => { setShowNotifs(false); marcarLeidas(); if (n.tipo === "chat") router.push(n.conv_id ? `/chat?conv=${n.conv_id}` : "/chat"); if (n.tipo === "pedido") router.push("/dashboard/proveedor"); }} style={{ display: "flex", alignItems: "flex-start", padding: "10px 14px", cursor: "pointer", borderBottom: "1px solid rgba(255,255,255,0.04)", background: n.leido ? "transparent" : "rgba(37,99,235,0.1)", borderLeft: n.leido ? "3px solid transparent" : "3px solid #2563eb", transition: "background 0.2s" }}>
                          <span style={{ fontSize: 16, marginRight: 8, flexShrink: 0 }}>{n.tipo === "chat" ? "💬" : "📦"}</span>
                          <div style={{ flex: 1 }}>
                            <p style={{ fontSize: 12, fontWeight: n.leido ? 500 : 700, margin: 0 }}>{n.texto}</p>
                            <p style={{ fontSize: 10, color: "#94a3b8", margin: 0, marginTop: 2 }}>{n.created_at ? new Date(n.created_at).toLocaleString("es-ES", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }) : ""}</p>
                          </div>
                          {!n.leido && <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#2563eb", flexShrink: 0, marginTop: 4 }} />}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </nav>
        </header>

        {isMobile && (
          <div style={{ position: "sticky", top: 56, zIndex: 998, background: "rgba(2,6,23,0.97)", padding: "8px 12px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <div style={{ display: "flex" }}>
              <input value={busqueda} onChange={e => setBusqueda(e.target.value)} onKeyDown={handleKeyDown} placeholder="🔍  Buscar referencia OEM, IAM..." style={{ flex: 1, background: "#0f172a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px 0 0 10px", padding: "10px 12px", color: "white", fontSize: 14, outline: "none" }} />
              <button onClick={buscarAhora} style={{ padding: "10px 16px", border: "none", borderRadius: "0 10px 10px 0", background: "linear-gradient(135deg,#2563eb,#1d4ed8)", color: "white", cursor: "pointer", fontSize: 14, fontWeight: 800 }}>Ir</button>
            </div>
          </div>
        )}

        {enCatalogos && (
          <div style={{ padding: "10px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(2,6,23,0.95)" }}>
            <button onClick={() => router.push("/dashboard/proveedor")} style={{ background: "rgba(37,99,235,0.15)", color: "#60a5fa", border: "1px solid rgba(37,99,235,0.3)", borderRadius: 8, padding: "8px 16px", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>
              ← Volver al panel
            </button>
          </div>
        )}

        <main>{children}</main>
      </div>
    );
  }

  return (
    // --rd-alto-cabecera: lo usan Cesta, Mi Cuenta y Chat para ajustarse a la cabecera cuando van dentro del marco
    <div style={{ minHeight: "100vh", background: "linear-gradient(180deg,#020617 0%,#020817 100%)", color: "white", ...(isMobile ? {} : { "--rd-alto-cabecera": "90px" }) } as React.CSSProperties}>

      <header style={{ height: isMobile ? 60 : 90, display: "flex", alignItems: "center", justifyContent: "space-between", padding: isMobile ? "0 16px" : "0 34px", borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(2,6,23,0.95)", backdropFilter: "blur(16px)", position: "sticky", top: 0, zIndex: 999 }}>

        <Link href={logoHref} scroll={false} onClick={() => window.scrollTo({ top: 0 })} style={{ display: "flex", alignItems: "center", gap: isMobile ? 8 : 16, textDecoration: "none", color: "white" }}>
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
            <Link href="/dashboard/catalogos" style={{ textDecoration: "none", color: pathname.startsWith("/dashboard/catalogos") ? "white" : "#e2e8f0", fontWeight: 700, fontSize: 15 }}>Catálogos</Link>
            <Link href="/dashboard/vehiculo" style={{ textDecoration: "none", color: pathname.startsWith("/dashboard/vehiculo") ? "white" : "#e2e8f0", fontWeight: 700, fontSize: 15 }}>Vehículo</Link>
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
                {noLeidas > 0 && <span style={{ position: "absolute", top: -6, right: -6, minWidth: 18, height: 18, borderRadius: 999, background: "#ef4444", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 900, padding: "0 4px", border: "2px solid #020617" }}>{noLeidas}</span>}
              </button>
              {showNotifs && (
                <div style={{ position: "absolute", right: 0, top: 54, width: 340, background: "#0f172a", borderRadius: 16, border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 20px 50px rgba(0,0,0,0.8)", zIndex: 9999, overflow: "hidden" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 18px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                    <span style={{ fontWeight: 800, fontSize: 15 }}>Notificaciones {noLeidas > 0 && <span style={{ background: "#ef4444", color: "white", borderRadius: 999, padding: "2px 8px", fontSize: 11, marginLeft: 8 }}>{noLeidas} nuevas</span>}</span>
                    {notifs.length > 0 && <button onClick={limpiarNotifs} style={{ background: "transparent", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: 12, fontWeight: 700 }}>Limpiar</button>}
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
              {notifs.length > 0 && <button onClick={limpiarNotifs} style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: 12 }}>Limpiar</button>}
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

      {isMobile ? (
        <main style={{ paddingBottom: 80 }}>{children}</main>
      ) : (
        <div style={{ display: "flex", alignItems: "flex-start" }}>
          {/* Menú lateral común a todas las páginas del taller (los proveedores que entran a Catálogos no lo ven) */}
          {tipoUsuario === "taller" && (
          <aside style={{ position: "sticky", top: 90, height: "calc(100dvh - 90px)", width: 240, flexShrink: 0, boxSizing: "border-box", background: "rgba(15,23,42,0.92)", borderRight: "1px solid rgba(255,255,255,0.06)", padding: "18px 16px", display: "flex", flexDirection: "column", gap: 6, overflowY: "auto", zIndex: 50 }}>
            {menuLateral.map(({ href, label, badge }) => {
              const activo = href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(href);
              return (
                <Link key={href} href={href} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", borderRadius: 12, background: activo ? "linear-gradient(135deg,#2563eb,#1d4ed8)" : "rgba(255,255,255,0.04)", color: activo ? "white" : "#cbd5e1", textDecoration: "none", fontWeight: 700, fontSize: 14 }}>
                  <span>{label}</span>
                  {!!badge && badge > 0 && <span style={{ minWidth: 20, height: 20, borderRadius: 999, background: "#22c55e", color: "white", fontSize: 11, fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 5px" }}>{badge}</span>}
                </Link>
              );
            })}
            <div style={{ marginTop: "auto", background: "linear-gradient(135deg,#1e293b,#0f172a)", borderRadius: 16, padding: 16 }}>
              <p style={{ color: "#94a3b8", marginBottom: 6, fontSize: 11, fontWeight: 700 }}>FACTURACIÓN TOTAL</p>
              <h2 style={{ fontSize: 28, fontWeight: 900 }}>{facturacionTotal.toFixed(0)}€</h2>
              <p style={{ color: "#22c55e", marginTop: 4, fontWeight: 700, fontSize: 12 }}>{pedidosTotales} pedidos totales</p>
            </div>
            <button onClick={cerrarSesion} style={{ width: "100%", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", color: "#f87171", padding: "10px", borderRadius: 12, cursor: "pointer", fontWeight: 800, fontSize: 13, flexShrink: 0 }}>Cerrar sesión</button>
          </aside>
          )}
          <main style={{ flex: 1, minWidth: 0, paddingBottom: pathname === "/dashboard" ? 0 : 40 }}>{children}</main>
        </div>
      )}

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

      {/* Asistente de recambios (módulo aislado en app/asistente) */}
      <AsistentePanel />
    </div>
  );
}