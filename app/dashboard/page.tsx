"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../lib/supabase";

export default function Dashboard() {
  const [pedidos, setPedidos] = useState<any[]>([]);
  const [facturacion, setFacturacion] = useState(0);
  const [piezasTaller, setPiezasTaller] = useState<any[]>([]);

  useEffect(() => {
    cargarDatos();
  }, []);

  async function cargarDatos() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("pedidos")
      .select("*")
      .eq("cliente_email", user.email)
      .order("created_at", { ascending: false });

    if (data) {
      setPedidos(data);
      const total = data.reduce((acc, p) => acc + (Number(p.total) || 0), 0);
      setFacturacion(total);
    }

    const { data: piezas } = await supabase
      .from("piezas_publicadas")
      .select("*")
      .eq("proveedor_id", user.id)
      .eq("tipo_vendedor", "taller")
      .order("id", { ascending: false });

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

  return (
    <main style={mainStyle}>

      {/* SIDEBAR */}
      <aside style={sidebarStyle}>
        <div>
          <div style={logoBox}>
            <div style={logoCircle}>RD</div>
            <div>
              <h2 style={logoText}>RECAMBIO DIRECTO</h2>
              <p style={logoSub}>Marketplace B2B</p>
            </div>
          </div>

          <div style={menuContainer}>
            <Link href="/dashboard" style={activeMenu}>Inicio</Link>
            <Link href="/dashboard/pedidos" style={menuItem}>Pedidos</Link>
            <Link href="/dashboard/mis-piezas" style={menuItem}>Mis Piezas</Link>
            <Link href="/checkout" style={menuItem}>Cesta</Link>
            <Link href="/perfil" style={menuItem}>Mi cuenta</Link>
            <Link href="/chat" style={menuItem}>Chat</Link>
          </div>
        </div>

        <div style={sidebarCard}>
          <p style={sidebarCardLabel}>FACTURACIÓN</p>
          <h2 style={sidebarCardValue}>{facturacion.toFixed(0)}€</h2>
          <p style={sidebarGrowth}>{pedidos.length} pedidos totales</p>
        </div>
      </aside>

      {/* CONTENT */}
      <section style={contentStyle}>

        {/* HERO */}
        <section style={heroStyle}>
          <div style={heroOverlay} />
          <div style={heroContent}>
            <div style={badgeStyle}>MARKETPLACE PROFESIONAL</div>
            <h1 style={heroTitle}>
              ENCUENTRA<br />RECAMBIOS EN<br />SEGUNDOS
            </h1>
            <p style={heroText}>
              Busca referencias OEM, IAM y equivalencias directamente entre proveedores conectados.
            </p>
          </div>
        </section>

        {/* STATS REALES */}
        <div style={statsGrid}>
          <div style={statCard}>
            <p style={statLabel}>PEDIDOS MES</p>
            <h2 style={statNumber}>{pedidosMes.length}</h2>
          </div>
          <div style={statCard}>
            <p style={statLabel}>FACTURACIÓN</p>
            <h2 style={statNumber}>{facturacion.toFixed(0)}€</h2>
          </div>
          <div style={statCard}>
            <p style={statLabel}>MIS PIEZAS</p>
            <h2 style={statNumber}>{piezasTaller.length}</h2>
          </div>
        </div>

        {/* ACCESOS RÁPIDOS */}
        <div style={cardsGrid}>
          <Link href="/dashboard/pedidos" style={cardStyle}>
            <h2 style={cardTitle}>MIS PEDIDOS</h2>
            <p style={cardText}>Consulta pedidos, estados y tracking.</p>
          </Link>
          <Link href="/dashboard/mis-piezas" style={{ ...cardStyle, borderColor: "rgba(139,92,246,0.3)" }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>🔧</div>
            <h2 style={cardTitle}>MIS PIEZAS</h2>
            <p style={cardText}>Publica piezas sueltas para vender a otros talleres.</p>
            {piezasTaller.length > 0 && (
              <div style={piezasBadge}>{piezasTaller.length} publicadas</div>
            )}
          </Link>
          <Link href="/perfil" style={cardStyle}>
            <h2 style={cardTitle}>MI CUENTA</h2>
            <p style={cardText}>Gestiona tus datos y empresa.</p>
          </Link>
        </div>

        {/* ACTIVIDAD RECIENTE */}
        {pedidos.length > 0 && (
          <div style={pedidosContainer}>
            <div style={pedidosHeader}>
              <h2 style={pedidosTitle}>ACTIVIDAD RECIENTE</h2>
              <Link href="/dashboard/pedidos" style={verTodos}>VER TODOS</Link>
            </div>

            <div style={{ display: "grid", gap: "20px" }}>
              {pedidos.slice(0, 5).map((pedido, index) => (
                <div key={index} style={pedidoCard}>
                  <div style={pedidoTop}>
                    <div>
                      <h3 style={pedidoNumero}>Pedido #{pedido.id}</h3>
                      <p style={pedidoRef}>{pedido.codigo}</p>
                      <p style={{ color: "#94a3b8", fontSize: 13, marginTop: 4 }}>
                        {pedido.created_at ? new Date(pedido.created_at).toLocaleDateString("es-ES") : ""}
                      </p>
                    </div>
                    <div style={{
                      padding: "12px 22px", borderRadius: 999, fontWeight: 700,
                      background: pedido.estado_envio === "entregado" ? "rgba(22,163,74,0.2)" : pedido.estado_envio === "enviado" ? "rgba(37,99,235,0.2)" : "rgba(245,158,11,0.2)",
                      color: pedido.estado_envio === "entregado" ? "#4ade80" : pedido.estado_envio === "enviado" ? "#60a5fa" : "#f59e0b",
                    }}>
                      {pedido.estado_envio || "pendiente"}
                    </div>
                  </div>

                  <div style={pedidoGrid}>
                    <div><p style={label}>Transporte</p><h3 style={valor}>{pedido.transporte || pedido.agencia || "-"}</h3></div>
                    <div><p style={label}>Pago</p><h3 style={valor}>{pedido.metodo_pago || "-"}</h3></div>
                    <div><p style={label}>Total</p><h3 style={{ ...valor, color: "#22c55e" }}>{pedido.total}€</h3></div>
                    <div><p style={label}>Estado envío</p><h3 style={valor}>{pedido.estado_envio || "pendiente"}</h3></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <button onClick={cerrarSesion} style={logoutButton}>CERRAR SESIÓN</button>

      </section>
    </main>
  );
}

/* STYLES */
const mainStyle = { display: "flex", minHeight: "100vh", background: "linear-gradient(135deg,#020617,#020b2d)", color: "white" };
const sidebarStyle = { width: "280px", background: "rgba(15,23,42,0.92)", borderRight: "1px solid rgba(255,255,255,0.06)", padding: "30px 22px", display: "flex", flexDirection: "column" as const, justifyContent: "space-between", backdropFilter: "blur(18px)" };
const logoBox = { display: "flex", alignItems: "center", gap: "16px", marginBottom: "40px" };
const logoCircle = { width: "60px", height: "60px", borderRadius: "18px", background: "linear-gradient(135deg,#2563eb,#1d4ed8)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: "20px" };
const logoText = { fontSize: "26px", fontWeight: 900 };
const logoSub = { color: "#94a3b8", marginTop: "6px" };
const menuContainer = { display: "flex", flexDirection: "column" as const, gap: "14px" };
const menuItem = { padding: "18px", borderRadius: "18px", background: "rgba(255,255,255,0.04)", color: "#cbd5e1", textDecoration: "none", fontWeight: 700 };
const activeMenu = { ...menuItem, background: "linear-gradient(135deg,#2563eb,#1d4ed8)", color: "white", boxShadow: "0 10px 30px rgba(37,99,235,0.35)" };
const sidebarCard = { background: "linear-gradient(135deg,#1e293b,#0f172a)", borderRadius: "28px", padding: "24px" };
const sidebarCardLabel = { color: "#94a3b8", marginBottom: "12px" };
const sidebarCardValue = { fontSize: "54px", fontWeight: 900 };
const sidebarGrowth = { color: "#22c55e", marginTop: "10px", fontWeight: 700 };
const contentStyle = { flex: 1 };
const heroStyle = { height: "420px", position: "relative" as const, background: "url('https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?q=80&w=1600&auto=format&fit=crop') center/cover", display: "flex", alignItems: "center", padding: "70px" };
const heroOverlay = { position: "absolute" as const, inset: 0, background: "linear-gradient(90deg,rgba(2,6,23,0.95),rgba(2,6,23,0.65))" };
const heroContent = { position: "relative" as const, zIndex: 2, maxWidth: "900px" };
const badgeStyle = { display: "inline-block", padding: "12px 22px", borderRadius: "999px", background: "rgba(37,99,235,0.18)", border: "1px solid rgba(37,99,235,0.3)", color: "#60a5fa", fontWeight: 700, marginBottom: "24px" };
const heroTitle = { fontSize: "82px", lineHeight: 1, fontWeight: 900, marginBottom: "26px" };
const heroText = { fontSize: "22px", lineHeight: 1.7, color: "#cbd5e1", maxWidth: "760px" };
const statsGrid = { display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "24px", padding: "40px 50px" };
const statCard = { background: "rgba(15,23,42,0.92)", padding: "34px", borderRadius: "28px", border: "1px solid rgba(255,255,255,0.06)" };
const statLabel = { color: "#94a3b8", marginBottom: "18px" };
const statNumber = { fontSize: "54px", fontWeight: 900 };
const cardsGrid = { display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "24px", padding: "0 50px", marginBottom: "40px" };
const cardStyle = { background: "rgba(15,23,42,0.92)", borderRadius: "28px", padding: "38px", textDecoration: "none", color: "white", border: "1px solid rgba(255,255,255,0.06)" };
const cardTitle = { fontSize: "36px", fontWeight: 900, marginBottom: "18px" };
const cardText = { color: "#94a3b8", lineHeight: 1.7 };
const piezasBadge = { marginTop: 12, display: "inline-block", background: "rgba(139,92,246,0.2)", color: "#a78bfa", padding: "4px 12px", borderRadius: 999, fontSize: 13, fontWeight: 700 };
const pedidosContainer = { background: "rgba(15,23,42,0.92)", borderRadius: "32px", padding: "40px", margin: "0 50px", border: "1px solid rgba(255,255,255,0.06)" };
const pedidosHeader = { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "40px" };
const pedidosTitle = { fontSize: "40px", fontWeight: 900 };
const verTodos = { color: "#60a5fa", textDecoration: "none", fontWeight: 800 };
const pedidoCard = { background: "#0f172a", borderRadius: "24px", padding: "30px", border: "1px solid rgba(255,255,255,0.06)" };
const pedidoTop = { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px" };
const pedidoNumero = { fontSize: "28px", fontWeight: 900 };
const pedidoRef = { color: "#60a5fa", marginTop: "8px", fontWeight: 700 };
const pedidoGrid = { display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "20px" };
const label = { color: "#94a3b8", marginBottom: "10px" };
const valor = { fontSize: "22px", fontWeight: 800 };
const logoutButton = { margin: "40px 50px", background: "linear-gradient(135deg,#dc2626,#991b1b)", border: "none", color: "white", padding: "18px 28px", borderRadius: "18px", cursor: "pointer", fontWeight: 800 };