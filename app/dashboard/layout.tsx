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
  const [menuMovilAbierto, setMenuMovilAbierto] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

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
    const { data: perfil } = await supabase.from("usuarios").select("tipo").eq("id", user.id).single();
    if (perfil?.tipo) setTipoUsuario(perfil.tipo);

    supabase.channel("notif-realtime")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "mensajes" }, (payload) => {
        const m = payload.new as any;
        if (m.user_id !== user.id) {
          setNotifs(prev => [{ id: m.id, tipo: "chat", texto: `Nuevo mensaje en chat`, leido: false, created_at: m.created_at }, ...prev]);
        }
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
    const { data: convs1 } = await supabase.from("conversaciones").select("id").eq("user1_id", uid);
    const { data: convs2 } = await supabase.from("conversaciones").select("id").eq("user2_id", uid);
    const convIds = [...(convs1 || []), ...(convs2 || [])].map(c => c.id);
    if (convIds.length > 0) {
      const { data: msgs } = await supabase.from("mensajes").select("id, mensaje, created_at, conversacion_id, leido, user_id").in("conversacion_id", convIds).neq("user_id", uid).or("leido.is.null,leido.eq.false").order("created_at", { ascending: false }).limit(10);
      if (msgs && msgs.length > 0) {
        msgs.forEach(m => notifsTotales.push({ id: m.id, tipo: "chat", texto: `💬 ${m.mensaje.substring(0, 50)}${m.mensaje.length > 50 ? "..." : ""}`, leido: false, created_at: m.created_at, conv_id: m.conversacion_id }));
      }
    }
    const { data: pedidos } = await supabase.from("pedidos").select("id, estado_envio, created_at").eq("cliente_id", uid).neq("estado_envio", "pendiente").order("created_at", { ascending: false }).limit(5);
    if (pedidos && pedidos.length > 0) {
      pedidos.forEach(p => notifsTotales.push({ id: `ped-${p.id}`, tipo: "pedido", texto: `📦 Pedido #${p.id} → ${p.estado_envio}`, leido: false, created_at: p.created_at }));
    }
    notifsTotales.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    if (notifsTotales.length > 0) setNotifs(notifsTotales);
  }

  function buscarAhora() {
    if (busqueda.trim() === "") return;
    router.push(`/dashboard/buscar?q=${encodeURIComponent(busqueda)}`);
    setMenuMovilAbierto(false);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") buscarAhora();
  }

  function marcarLeidas() {
    setNotifs(prev => prev.map(n => ({ ...n, leido: true })));
  }

  const noLeidas = notifs.filter(n => !n.leido).length;
  const esProveedor = pathname.includes("/proveedor");
  const logoHref = tipoUsuario === "proveedor" ? "/dashboard/proveedor" : "/dashboard";

  const navLinks = [
    { href: "/dashboard", label: "Inicio" },
    { href: "/dashboard/pedidos", label: "Pedidos" },
    { href: "/checkout", label: `Cesta ${totalCesta > 0 ? `(${totalCesta})` : ""}` },
    { href: "/perfil", label: "Mi Cuenta" },
    { href: "/chat", label: "Chat" },
  ];

  if (esProveedor) return <main>{children}</main>;

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(180deg,#020617 0%,#020817 100%)", color: "white" }}>

      {/* HEADER */}
      <header style={{ height: isMobile ? "64px" : "90px", display: "flex", alignItems: "center", justifyContent: "space-between", padding: isMobile ? "0 16px" : "0 34px", borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(2,6,23,0.92)", backdropFilter: "blur(16px)", position: "sticky" as const, top: 0, zIndex: 999 }}>

        {/* LOGO */}
        <Link href={logoHref} style={{ display: "flex", alignItems: "center", gap: isMobile ? 10 : 16, textDecoration: "none", color: "white" }}>
          <div style={{ width: isMobile ? 40 : 58, height: isMobile ? 40 : 58, borderRadius: 14, background: "rgba(255,255,255,0.04)", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid rgba(255,255,255,0.08)", flexShrink: 0 }}>
            <Image src="/logo.svg" alt="Recambio Directo" width={isMobile ? 32 : 46} height={isMobile ? 32 : 46} priority />
          </div>
          {!isMobile && (
            <div>
              <h1 style={{ margin: 0, fontSize: 20, fontWeight: 900 }}>RECAMBIO DIRECTO</h1>
              <p style={{ margin: 0, color: "#94a3b8", fontSize: 13 }}>Marketplace B2B</p>
            </div>
          )}
        </Link>

        {/* BUSCADOR DESKTOP */}
        {!isMobile && (
          <div style={{ width: "520px", display: "flex" }}>
            <input value={busqueda} onChange={e => setBusqueda(e.target.value)} onKeyDown={handleKeyDown} placeholder="Buscar referencia OEM, IAM o equivalente..." style={{ flex: 1, background: "#0f172a", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "16px 0 0 16px", padding: "16px 18px", color: "white", fontSize: 15, outline: "none" }} />
            <button onClick={buscarAhora} style={{ width: 74, border: "none", borderRadius: "0 16px 16px 0", background: "linear-gradient(135deg,#2563eb,#1d4ed8)", color: "white", cursor: "pointer", fontSize: 18, fontWeight: 800 }}>🔍</button>
          </div>
        )}

        {/* NAV DESKTOP */}
        {!isMobile && (
          <nav style={{ display: "flex", alignItems: "center", gap: 22 }}>
            <Link href="/dashboard" style={{ textDecoration: "none", color: pathname === "/dashboard" ? "white" : "#e2e8f0", fontWeight: 700, fontSize: 15 }}>Inicio</Link>
            <Link href="/dashboard/pedidos" style={{ textDecoration: "none", color: "#e2e8f0", fontWeight: 700, fontSize: 15 }}>Pedidos</Link>
            <Link href="/checkout" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none", color: "white", fontWeight: 800 }}>
              <div style={{ position: "relative" as const }}>
                <span style={{ fontSize: 24 }}>🛒</span>
                {totalCesta > 0 && <span style={{ position: "absolute" as const, top: -8, right: -12, minWidth: 22, height: 22, borderRadius: 999, background: "#22c55e", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 900, padding: "0 6px", border: "2px solid #020617" }}>{totalCesta}</span>}
              </div>
              <span>Cesta</span>
            </Link>
            <Link href="/perfil" style={{ textDecoration: "none", color: "#e2e8f0", fontWeight: 700, fontSize: 15 }}>Mi Cuenta</Link>
            <Link href="/chat" style={{ textDecoration: "none", color: "#e2e8f0", fontWeight: 700, fontSize: 15 }}>Chat</Link>
            <div ref={notifRef} style={{ position: "relative" as const }}>
              <button onClick={() => { setShowNotifs(!showNotifs); if (!showNotifs) marcarLeidas(); }} style={{ width: 46, height: 46, borderRadius: 14, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.05)", color: "white", cursor: "pointer", fontSize: 20, position: "relative" as const }}>
                🔔
                {noLeidas > 0 && <span style={{ position: "absolute" as const, top: -6, right: -6, minWidth: 18, height: 18, borderRadius: 999, background: "#ef4444", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 900, padding: "0 4px", border: "2px solid #020617" }}>{noLeidas > 9 ? "9+" : noLeidas}</span>}
              </button>
              {showNotifs && (
                <div style={{ position: "absolute" as const, right: 0, top: 54, width: 320, background: "#0f172a", borderRadius: 16, border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 20px 50px rgba(0,0,0,0.8)", zIndex: 9999, overflow: "hidden" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 18px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                    <span style={{ fontWeight: 800, fontSize: 15 }}>Notificaciones</span>
                    {notifs.length > 0 && <button onClick={() => setNotifs([])} style={{ background: "transparent", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: 12, fontWeight: 700 }}>Limpiar</button>}
                  </div>
                  {notifs.length === 0 ? (
                    <div style={{ padding: 32, textAlign: "center" as const, color: "#94a3b8", fontSize: 14 }}>
                      <p style={{ fontSize: 32, marginBottom: 8 }}>🔔</p><p>Sin notificaciones</p>
                    </div>
                  ) : (
                    <div style={{ maxHeight: 340, overflowY: "auto" as const }}>
                      {notifs.slice(0, 15).map((n, i) => (
                        <div key={i} onClick={() => { setShowNotifs(false); if (n.tipo === "chat") router.push(n.conv_id ? `/chat?conv=${n.conv_id}` : "/chat"); if (n.tipo === "pedido") router.push("/dashboard/pedidos"); }} style={{ display: "flex", alignItems: "flex-start", padding: "12px 16px", cursor: "pointer", borderBottom: "1px solid rgba(255,255,255,0.04)", background: n.leido ? "transparent" : "rgba(37,99,235,0.08)", borderLeft: n.leido ? "3px solid transparent" : "3px solid #2563eb" }}>
                          <span style={{ fontSize: 18, marginRight: 10 }}>{n.tipo === "chat" ? "💬" : "📦"}</span>
                          <div style={{ flex: 1 }}>
                            <p style={{ fontSize: 13, fontWeight: 600, margin: 0 }}>{n.texto}</p>
                            <p style={{ fontSize: 11, color: "#94a3b8", margin: 0, marginTop: 3 }}>{n.created_at ? new Date(n.created_at).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" }) : ""}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </nav>
        )}

        {/* ICONOS MÓVIL */}
        {isMobile && (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {/* Cesta */}
            <Link href="/checkout" style={{ position: "relative" as const, textDecoration: "none" }}>
              <span style={{ fontSize: 22 }}>🛒</span>
              {totalCesta > 0 && <span style={{ position: "absolute" as const, top: -6, right: -8, minWidth: 18, height: 18, borderRadius: 999, background: "#22c55e", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 900, border: "2px solid #020617" }}>{totalCesta}</span>}
            </Link>
            {/* Notifs */}
            <button onClick={() => { setShowNotifs(!showNotifs); if (!showNotifs) marcarLeidas(); }} style={{ background: "none", border: "none", color: "white", cursor: "pointer", fontSize: 22, position: "relative" as const, padding: "4px" }}>
              🔔
              {noLeidas > 0 && <span style={{ position: "absolute" as const, top: -2, right: -2, minWidth: 16, height: 16, borderRadius: 999, background: "#ef4444", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 900, border: "2px solid #020617" }}>{noLeidas}</span>}
            </button>
            {/* Hamburguesa */}
            <button onClick={() => setMenuMovilAbierto(!menuMovilAbierto)} style={{ background: "rgba(255,255,255,0.08)", border: "none", color: "white", width: 36, height: 36, borderRadius: 10, cursor: "pointer", fontSize: 18 }}>
              {menuMovilAbierto ? "✕" : "☰"}
            </button>
          </div>
        )}
      </header>

      {/* NOTIFS MÓVIL */}
      {isMobile && showNotifs && (
        <div style={{ position: "fixed" as const, top: 64, right: 0, left: 0, background: "#0f172a", borderBottom: "1px solid rgba(255,255,255,0.1)", zIndex: 998, maxHeight: "60vh", overflowY: "auto" as const }}>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <span style={{ fontWeight: 700 }}>Notificaciones</span>
            <button onClick={() => setNotifs([])} style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: 12 }}>Limpiar</button>
          </div>
          {notifs.length === 0 ? (
            <div style={{ padding: 24, textAlign: "center" as const, color: "#94a3b8" }}>Sin notificaciones</div>
          ) : notifs.slice(0, 10).map((n, i) => (
            <div key={i} onClick={() => { setShowNotifs(false); if (n.tipo === "chat") router.push(n.conv_id ? `/chat?conv=${n.conv_id}` : "/chat"); if (n.tipo === "pedido") router.push("/dashboard/pedidos"); }} style={{ display: "flex", alignItems: "center", padding: "12px 16px", borderBottom: "1px solid rgba(255,255,255,0.04)", cursor: "pointer" }}>
              <span style={{ fontSize: 18, marginRight: 10 }}>{n.tipo === "chat" ? "💬" : "📦"}</span>
              <p style={{ fontSize: 13, margin: 0 }}>{n.texto}</p>
            </div>
          ))}
        </div>
      )}

      {/* MENÚ HAMBURGUESA MÓVIL */}
      {isMobile && menuMovilAbierto && (
        <div style={{ position: "fixed" as const, inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 997 }} onClick={() => setMenuMovilAbierto(false)}>
          <div style={{ position: "absolute" as const, top: 64, right: 0, width: "75%", maxWidth: 280, background: "#0f172a", height: "calc(100vh - 64px)", padding: 20, display: "flex", flexDirection: "column" as const, gap: 8, overflowY: "auto" as const }} onClick={e => e.stopPropagation()}>
            {/* Buscador en menú móvil */}
            <div style={{ display: "flex", marginBottom: 16 }}>
              <input value={busqueda} onChange={e => setBusqueda(e.target.value)} onKeyDown={handleKeyDown} placeholder="Buscar referencia..." style={{ flex: 1, background: "#020617", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px 0 0 12px", padding: "12px 14px", color: "white", fontSize: 14, outline: "none" }} />
              <button onClick={buscarAhora} style={{ width: 48, border: "none", borderRadius: "0 12px 12px 0", background: "linear-gradient(135deg,#2563eb,#1d4ed8)", color: "white", cursor: "pointer", fontSize: 16 }}>🔍</button>
            </div>
            {navLinks.map(({ href, label }) => (
              <Link key={href} href={href} onClick={() => setMenuMovilAbierto(false)} style={{ padding: "14px 16px", borderRadius: 12, background: pathname === href ? "linear-gradient(135deg,#2563eb,#1d4ed8)" : "rgba(255,255,255,0.05)", color: "white", textDecoration: "none", fontWeight: 700, fontSize: 15 }}>
                {label}
              </Link>
            ))}
            <button onClick={async () => { await supabase.auth.signOut(); router.push("/"); }} style={{ marginTop: 16, background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)", color: "#f87171", padding: "14px", borderRadius: 12, cursor: "pointer", fontWeight: 700, fontSize: 14 }}>
              Cerrar sesión
            </button>
          </div>
        </div>
      )}

      <main style={{ paddingBottom: 60 }}>{children}</main>
    </div>
  );
}