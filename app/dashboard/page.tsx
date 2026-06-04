"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../lib/supabase";

export default function Dashboard() {
  const [pedidos, setPedidos] = useState<any[]>([]);
  const [facturacion, setFacturacion] = useState(0);
  const [piezasTaller, setPiezasTaller] = useState<any[]>([]);
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => { cargarDatos(); }, []);

  async function cargarDatos() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase.from("pedidos").select("*").eq("cliente_email", user.email).order("created_at", { ascending: false });
    if (data) {
      setPedidos(data);
      setFacturacion(data.reduce((acc, p) => acc + (Number(p.total) || 0), 0));
    }

    const { data: piezas } = await supabase.from("piezas_publicadas").select("*").eq("proveedor_id", user.id).eq("tipo_vendedor", "taller").order("id", { ascending: false });
    setPiezasTaller(piezas || []);
  }

  async function cerrarSesion() {
    await supabase.auth.signOut();
    location.href = "/";
  }

  const pedidosMes = pedidos.filter(p => {
    if (!p.created_at) return false;
    const fecha = new Date(p.created_at);
    const ahora = new Date();
    return fecha.getMonth() === ahora.getMonth() && fecha.getFullYear() === ahora.getFullYear();
  });

  const menuLinks = [
    { href: "/dashboard", label: "Inicio" },
    { href: "/dashboard/buscar", label: "Buscar" },
    { href: "/dashboard/pedidos", label: "Pedidos" },
    { href: "/dashboard/mis-piezas", label: "Mis Piezas" },
    { href: "/checkout", label: "Cesta" },
    { href: "/perfil", label: "Mi cuenta" },
    { href: "/chat", label: "Chat" },
  ];

  return (
    <main style={{ display: "flex", minHeight: "100vh", background: "linear-gradient(135deg,#020617,#020b2d)", color: "white" }}>

      {/* SIDEBAR DESKTOP */}
      {!isMobile && (
        <aside style={{ width: "280px", background: "rgba(15,23,42,0.92)", borderRight: "1px solid rgba(255,255,255,0.06)", padding: "30px 22px", display: "flex", flexDirection: "column" as const, justifyContent: "space-between", backdropFilter: "blur(18px)", flexShrink: 0 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 40 }}>
              <div style={{ width: 60, height: 60, borderRadius: 18, background: "linear-gradient(135deg,#2563eb,#1d4ed8)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 20 }}>RD</div>
              <div>
                <h2 style={{ fontSize: 22, fontWeight: 900 }}>RECAMBIO DIRECTO</h2>
                <p style={{ color: "#94a3b8", marginTop: 4, fontSize: 13 }}>Marketplace B2B</p>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column" as const, gap: 10 }}>
              {menuLinks.map(({ href, label }) => (
                <Link key={href} href={href} style={{ padding: "14px 18px", borderRadius: 14, background: href === "/dashboard" ? "linear-gradient(135deg,#2563eb,#1d4ed8)" : "rgba(255,255,255,0.04)", color: href === "/dashboard" ? "white" : "#cbd5e1", textDecoration: "none", fontWeight: 700, fontSize: 14 }}>
                  {label}
                </Link>
              ))}
            </div>
          </div>
          <div style={{ background: "linear-gradient(135deg,#1e293b,#0f172a)", borderRadius: 24, padding: 24 }}>
            <p style={{ color: "#94a3b8", marginBottom: 10, fontSize: 12 }}>FACTURACIÓN</p>
            <h2 style={{ fontSize: 42, fontWeight: 900 }}>{facturacion.toFixed(0)}€</h2>
            <p style={{ color: "#22c55e", marginTop: 8, fontWeight: 700, fontSize: 13 }}>{pedidos.length} pedidos totales</p>
          </div>
        </aside>
      )}

      {/* CONTENT */}
      <section style={{ flex: 1, overflow: "hidden" }}>

        {/* NAVBAR MÓVIL */}
        {isMobile && (
          <div style={{ background: "rgba(15,23,42,0.98)", borderBottom: "1px solid rgba(255,255,255,0.06)", padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky" as const, top: 0, zIndex: 100 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg,#2563eb,#1d4ed8)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 14 }}>RD</div>
              <span style={{ fontWeight: 900, fontSize: 16 }}>RECAMBIO DIRECTO</span>
            </div>
            <button onClick={() => setMenuAbierto(!menuAbierto)} style={{ background: "rgba(255,255,255,0.08)", border: "none", color: "white", width: 40, height: 40, borderRadius: 10, cursor: "pointer", fontSize: 20 }}>
              {menuAbierto ? "✕" : "☰"}
            </button>
          </div>
        )}

        {/* MENÚ HAMBURGUESA */}
        {isMobile && menuAbierto && (
          <div style={{ position: "fixed" as const, inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 99, display: "flex" }} onClick={() => setMenuAbierto(false)}>
            <div style={{ width: "80%", maxWidth: 300, background: "#0f172a", padding: "24px 20px", display: "flex", flexDirection: "column" as const, gap: 10, overflowY: "auto" as const }} onClick={e => e.stopPropagation()}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <span style={{ fontWeight: 900, fontSize: 16 }}>Menu</span>
                <button onClick={() => setMenuAbierto(false)} style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: 20 }}>✕</button>
              </div>
              {menuLinks.map(({ href, label }) => (
                <Link key={href} href={href} onClick={() => setMenuAbierto(false)} style={{ padding: "14px 18px", borderRadius: 12, background: href === "/dashboard" ? "linear-gradient(135deg,#2563eb,#1d4ed8)" : "rgba(255,255,255,0.05)", color: "white", textDecoration: "none", fontWeight: 700, fontSize: 15 }}>
                  {label}
                </Link>
              ))}
              <button onClick={cerrarSesion} style={{ marginTop: 16, background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)", color: "#f87171", padding: "14px", borderRadius: 12, cursor: "pointer", fontWeight: 700 }}>
                Cerrar sesión
              </button>
            </div>
          </div>
        )}

        {/* HERO */}
        <section style={{ height: isMobile ? "200px" : "420px", position: "relative" as const, background: "url('https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?q=80&w=1600&auto=format&fit=crop') center/cover", display: "flex", alignItems: "center", padding: isMobile ? "30px 20px" : "70px" }}>
          <div style={{ position: "absolute" as const, inset: 0, background: "linear-gradient(90deg,rgba(2,6,23,0.95),rgba(2,6,23,0.65))" }} />
          <div style={{ position: "relative" as const, zIndex: 2 }}>
            <div style={{ display: "inline-block", padding: "8px 16px", borderRadius: 999, background: "rgba(37,99,235,0.18)", border: "1px solid rgba(37,99,235,0.3)", color: "#60a5fa", fontWeight: 700, marginBottom: 16, fontSize: isMobile ? 11 : 14 }}>MARKETPLACE PROFESIONAL</div>
            <h1 style={{ fontSize: isMobile ? "36px" : "82px", lineHeight: 1, fontWeight: 900, marginBottom: isMobile ? 10 : 26 }}>
              ENCUENTRA<br />RECAMBIOS
            </h1>
            {!isMobile && <p style={{ fontSize: 22, lineHeight: 1.7, color: "#cbd5e1", maxWidth: 760 }}>Busca referencias OEM, IAM y equivalencias directamente entre proveedores conectados.</p>}
          </div>
        </section>

        {/* STATS */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: isMobile ? 12 : 24, padding: isMobile ? "20px 16px" : "40px 50px" }}>
          {[
            { label: "PEDIDOS MES", value: pedidosMes.length },
            { label: "FACTURACIÓN", value: `${facturacion.toFixed(0)}€` },
            { label: "MIS PIEZAS", value: piezasTaller.length },
          ].map(({ label, value }) => (
            <div key={label} style={{ background: "rgba(15,23,42,0.92)", padding: isMobile ? "16px" : "34px", borderRadius: isMobile ? 16 : 28, border: "1px solid rgba(255,255,255,0.06)" }}>
              <p style={{ color: "#94a3b8", marginBottom: 8, fontSize: isMobile ? 10 : 14 }}>{label}</p>
              <h2 style={{ fontSize: isMobile ? "28px" : "54px", fontWeight: 900 }}>{value}</h2>
            </div>
          ))}
        </div>

        {/* ACCESOS RÁPIDOS */}
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3,1fr)", gap: isMobile ? 12 : 24, padding: isMobile ? "0 16px 20px" : "0 50px", marginBottom: isMobile ? 20 : 40 }}>
          {[
            { href: "/dashboard/pedidos", title: "MIS PEDIDOS", text: "Consulta pedidos, estados y tracking." },
            { href: "/dashboard/mis-piezas", title: "MIS PIEZAS", text: "Publica piezas sueltas para vender a otros talleres." },
            { href: "/perfil", title: "MI CUENTA", text: "Gestiona tus datos y empresa." },
          ].map(({ href, title, text }) => (
            <Link key={href} href={href} style={{ background: "rgba(15,23,42,0.92)", borderRadius: isMobile ? 16 : 28, padding: isMobile ? "20px" : "38px", textDecoration: "none", color: "white", border: "1px solid rgba(255,255,255,0.06)", display: "block" }}>
              <h2 style={{ fontSize: isMobile ? 20 : 36, fontWeight: 900, marginBottom: isMobile ? 8 : 18 }}>{title}</h2>
              <p style={{ color: "#94a3b8", lineHeight: 1.7, fontSize: isMobile ? 13 : 15 }}>{text}</p>
            </Link>
          ))}
        </div>

        {/* ACTIVIDAD RECIENTE */}
        {pedidos.length > 0 && (
          <div style={{ background: "rgba(15,23,42,0.92)", borderRadius: isMobile ? 16 : 32, padding: isMobile ? "20px 16px" : "40px", margin: isMobile ? "0 16px 20px" : "0 50px", border: "1px solid rgba(255,255,255,0.06)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: isMobile ? 20 : 40 }}>
              <h2 style={{ fontSize: isMobile ? 20 : 40, fontWeight: 900 }}>ACTIVIDAD RECIENTE</h2>
              <Link href="/dashboard/pedidos" style={{ color: "#60a5fa", textDecoration: "none", fontWeight: 800, fontSize: isMobile ? 13 : 15 }}>VER TODOS</Link>
            </div>
            <div style={{ display: "grid", gap: 16 }}>
              {pedidos.slice(0, 5).map((pedido, index) => (
                <div key={index} style={{ background: "#0f172a", borderRadius: isMobile ? 12 : 24, padding: isMobile ? "16px" : "30px", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                    <div>
                      <h3 style={{ fontSize: isMobile ? 16 : 28, fontWeight: 900 }}>Pedido #{pedido.id}</h3>
                      <p style={{ color: "#60a5fa", marginTop: 4, fontWeight: 700, fontSize: 13 }}>{pedido.codigo}</p>
                      <p style={{ color: "#94a3b8", fontSize: 12, marginTop: 4 }}>
                        {pedido.created_at ? new Date(pedido.created_at).toLocaleDateString("es-ES") : ""}
                      </p>
                    </div>
                    <div style={{ padding: "8px 14px", borderRadius: 999, fontWeight: 700, fontSize: 12, background: pedido.estado_envio === "entregado" ? "rgba(22,163,74,0.2)" : "rgba(245,158,11,0.2)", color: pedido.estado_envio === "entregado" ? "#4ade80" : "#f59e0b" }}>
                      {pedido.estado_envio || "pendiente"}
                    </div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2,1fr)" : "repeat(4,1fr)", gap: isMobile ? 10 : 20 }}>
                    {[
                      { l: "Transporte", v: pedido.transporte || pedido.agencia || "-" },
                      { l: "Pago", v: pedido.metodo_pago || "-" },
                      { l: "Total", v: `${pedido.total}€`, green: true },
                      { l: "Estado", v: pedido.estado_envio || "pendiente" },
                    ].map(({ l, v, green }) => (
                      <div key={l}>
                        <p style={{ color: "#94a3b8", marginBottom: 6, fontSize: 11 }}>{l}</p>
                        <h3 style={{ fontSize: isMobile ? 15 : 22, fontWeight: 800, color: green ? "#22c55e" : "white" }}>{v}</h3>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {!isMobile && (
          <button onClick={cerrarSesion} style={{ margin: "40px 50px", background: "linear-gradient(135deg,#dc2626,#991b1b)", border: "none", color: "white", padding: "18px 28px", borderRadius: 18, cursor: "pointer", fontWeight: 800 }}>
            CERRAR SESIÓN
          </button>
        )}

      </section>
    </main>
  );
}