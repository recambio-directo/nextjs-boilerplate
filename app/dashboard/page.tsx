"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../lib/supabase";

export default function Dashboard() {
  const [pedidos, setPedidos] = useState<any[]>([]);
  const [facturacion, setFacturacion] = useState(0);
  const [piezasTaller, setPiezasTaller] = useState<any[]>([]);
  const [isMobile, setIsMobile] = useState(false);
  const [nombreEmpresa, setNombreEmpresa] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [creditoRD, setCreditoRD] = useState(0);
  const [rdPagoActivo, setRdPagoActivo] = useState(false);
  const [rdPagoSolicitado, setRdPagoSolicitado] = useState(false);
  const [fechaRegistro, setFechaRegistro] = useState<string | null>(null);
  const [solicitandoRD, setSolicitandoRD] = useState(false);
  const [rdSolicitadoOk, setRdSolicitadoOk] = useState(false);
  const [cif, setCif] = useState("");
  const [telefono, setTelefono] = useState("");
  const [iban, setIban] = useState("");

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => { cargarDatos(); }, []);

  async function cargarDatos() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { window.location.href = "/"; return; }
    const { data: perfil } = await supabase.from("usuarios").select("nombre_empresa, tipo, credito_rd, rd_pago_activo, rd_pago_solicitado, fecha_registro, cif, telefono, iban").eq("id", user.id).single();
    if (!perfil || perfil.tipo !== "taller") { window.location.href = "/"; return; }
    await supabase.from("usuarios").update({ ultimo_acceso: new Date().toISOString() }).eq("id", user.id);
    if (perfil?.nombre_empresa) setNombreEmpresa(perfil.nombre_empresa);
    setUserId(user.id);
    setUserEmail(user.email || null);
    setCreditoRD(Number(perfil.credito_rd || 0));
    setRdPagoActivo(!!perfil.rd_pago_activo);
    setRdPagoSolicitado(!!perfil.rd_pago_solicitado);
    setFechaRegistro(perfil.fecha_registro || null);
    setCif(perfil.cif || "");
    setTelefono(perfil.telefono || "");
    setIban(perfil.iban || "");

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

  // Calcular requisitos RD Pago
  function calcularRequisitos() {
    const diasActivo = fechaRegistro
      ? Math.floor((new Date().getTime() - new Date(fechaRegistro).getTime()) / (1000 * 60 * 60 * 24))
      : 0;
    const pedidoConTarjeta = pedidos.some(p => !p.anulado && (p.forma_pago === "tarjeta" || p.metodo_pago === "tarjeta" || p.estado_pago === "pagado"));
    return {
      diasActivo,
      cumpleMes: diasActivo >= 30,
      cumplePedido: pedidoConTarjeta,
      cumpleTodo: diasActivo >= 30 && pedidoConTarjeta,
    };
  }

  async function solicitarRDPago() {
    if (!userId || !userEmail) return;
    setSolicitandoRD(true);
    try {
      // Marcar solicitud en Supabase
      await supabase.from("usuarios").update({ rd_pago_solicitado: true }).eq("id", userId);
      setRdPagoSolicitado(true);

      // Email a Vicente
      await fetch("/api/send-rd-pago-solicitud", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tallerNombre: nombreEmpresa,
          tallerEmail: userEmail,
          tallerCif: cif,
          tallerTelefono: telefono,
          tallerIban: iban,
          pedidosTotales: pedidos.filter(p => !p.anulado).length,
          facturacionTotal: facturacion,
          diasActivo: calcularRequisitos().diasActivo,
        }),
      });

      setRdSolicitadoOk(true);
    } catch (e) {
      console.error("Error solicitando RD Pago:", e);
    }
    setSolicitandoRD(false);
  }

  const req = calcularRequisitos();

  // Bloque RD Pago
  function BloqueRDPago() {
    if (rdPagoActivo) {
      return (
        <div style={{ background: "linear-gradient(135deg,rgba(37,99,235,0.15),rgba(37,99,235,0.05))", border: "1px solid rgba(37,99,235,0.3)", borderRadius: isMobile ? 16 : 28, padding: isMobile ? 20 : 32 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
            <div>
              <div style={{ display: "inline-block", background: "rgba(37,99,235,0.2)", color: "#60a5fa", padding: "4px 12px", borderRadius: 999, fontSize: 12, fontWeight: 700, marginBottom: 10 }}>💳 RD PAGO ACTIVO</div>
              <h3 style={{ fontSize: isMobile ? 22 : 32, fontWeight: 900, marginBottom: 6 }}>Crédito disponible</h3>
              <p style={{ color: "#94a3b8", fontSize: 14 }}>Compra ahora y paga en 15 días sin recargos</p>
            </div>
            <div style={{ textAlign: "right" }}>
              <p style={{ fontSize: isMobile ? 36 : 52, fontWeight: 900, color: creditoRD > 0 ? "#22c55e" : "#f87171", lineHeight: 1 }}>{creditoRD.toFixed(2)}€</p>
              <p style={{ color: "#94a3b8", fontSize: 13, marginTop: 4 }}>disponibles</p>
            </div>
          </div>
          {creditoRD <= 0 && (
            <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 10, padding: "10px 14px", marginTop: 14 }}>
              <p style={{ color: "#f87171", fontSize: 13, fontWeight: 700, margin: 0 }}>⚠️ Crédito agotado — contacta con Recambio Directo para renovar tu límite</p>
            </div>
          )}
        </div>
      );
    }

    if (rdPagoSolicitado || rdSolicitadoOk) {
      return (
        <div style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.3)", borderRadius: isMobile ? 16 : 28, padding: isMobile ? 20 : 32 }}>
          <div style={{ display: "inline-block", background: "rgba(245,158,11,0.2)", color: "#fbbf24", padding: "4px 12px", borderRadius: 999, fontSize: 12, fontWeight: 700, marginBottom: 10 }}>⏳ SOLICITUD EN REVISIÓN</div>
          <h3 style={{ fontSize: isMobile ? 20 : 28, fontWeight: 900, marginBottom: 8 }}>RD Pago — Pendiente de activación</h3>
          <p style={{ color: "#94a3b8", fontSize: 14, lineHeight: 1.6 }}>Tu solicitud ha sido recibida. Revisaremos tu cuenta y te notificaremos por email cuando esté activada.</p>
        </div>
      );
    }

    if (!req.cumpleTodo) {
      return (
        <div style={{ background: "rgba(15,23,42,0.95)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: isMobile ? 16 : 28, padding: isMobile ? 20 : 32 }}>
          <div style={{ display: "inline-block", background: "rgba(255,255,255,0.05)", color: "#94a3b8", padding: "4px 12px", borderRadius: 999, fontSize: 12, fontWeight: 700, marginBottom: 12 }}>💳 RD PAGO</div>
          <h3 style={{ fontSize: isMobile ? 20 : 28, fontWeight: 900, marginBottom: 8 }}>Paga en 15 días sin recargos</h3>
          <p style={{ color: "#94a3b8", fontSize: 14, marginBottom: 18 }}>Completa los siguientes requisitos para solicitar RD Pago:</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, background: req.cumpleMes ? "rgba(22,163,74,0.08)" : "rgba(255,255,255,0.03)", border: `1px solid ${req.cumpleMes ? "rgba(22,163,74,0.3)" : "rgba(255,255,255,0.06)"}`, borderRadius: 10, padding: "12px 16px" }}>
              <span style={{ fontSize: 20 }}>{req.cumpleMes ? "✅" : "⏳"}</span>
              <div>
                <p style={{ fontWeight: 700, fontSize: 14, color: req.cumpleMes ? "#4ade80" : "white" }}>1 mes activo en la plataforma</p>
                <p style={{ color: "#94a3b8", fontSize: 12 }}>{req.cumpleMes ? "Completado" : `${req.diasActivo} de 30 días`}</p>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, background: req.cumplePedido ? "rgba(22,163,74,0.08)" : "rgba(255,255,255,0.03)", border: `1px solid ${req.cumplePedido ? "rgba(22,163,74,0.3)" : "rgba(255,255,255,0.06)"}`, borderRadius: 10, padding: "12px 16px" }}>
              <span style={{ fontSize: 20 }}>{req.cumplePedido ? "✅" : "🛒"}</span>
              <div>
                <p style={{ fontWeight: 700, fontSize: 14, color: req.cumplePedido ? "#4ade80" : "white" }}>Al menos 1 pedido pagado con tarjeta</p>
                <p style={{ color: "#94a3b8", fontSize: 12 }}>{req.cumplePedido ? "Completado" : "Pendiente"}</p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div style={{ background: "linear-gradient(135deg,rgba(22,163,74,0.1),rgba(22,163,74,0.03))", border: "1px solid rgba(22,163,74,0.3)", borderRadius: isMobile ? 16 : 28, padding: isMobile ? 20 : 32 }}>
        <div style={{ display: "inline-block", background: "rgba(22,163,74,0.2)", color: "#4ade80", padding: "4px 12px", borderRadius: 999, fontSize: 12, fontWeight: 700, marginBottom: 12 }}>✅ REQUISITOS CUMPLIDOS</div>
        <h3 style={{ fontSize: isMobile ? 22 : 32, fontWeight: 900, marginBottom: 8 }}>Solicitar RD Pago</h3>
        <p style={{ color: "#94a3b8", fontSize: 14, marginBottom: 20, lineHeight: 1.6 }}>Ya puedes solicitar RD Pago. Con un crédito inicial de hasta <strong style={{ color: "white" }}>200€</strong>, compra ahora y paga en 15 días sin recargos.</p>
        <button onClick={solicitarRDPago} disabled={solicitandoRD} style={{ background: solicitandoRD ? "rgba(255,255,255,0.05)" : "linear-gradient(135deg,#16a34a,#15803d)", border: "none", color: "white", padding: isMobile ? "14px 24px" : "16px 32px", borderRadius: 14, fontWeight: 900, fontSize: isMobile ? 14 : 16, cursor: solicitandoRD ? "not-allowed" : "pointer", opacity: solicitandoRD ? 0.7 : 1 }}>
          {solicitandoRD ? "Enviando solicitud..." : "💳 Solicitar RD Pago"}
        </button>
      </div>
    );
  }

  const pedidosMes = pedidos.filter(p => {
    if (!p.created_at) return false;
    const fecha = new Date(p.created_at);
    const ahora = new Date();
    return fecha.getMonth() === ahora.getMonth() && fecha.getFullYear() === ahora.getFullYear();
  });

  const accesos = [
    { href: "/dashboard/pedidos",  icon: "📦", title: "Mis Pedidos",  text: "Estados y tracking" },
    { href: "/dashboard/mis-piezas", icon: "🔩", title: "Mis Piezas",   text: "Vende piezas sueltas" },
    { href: "/chat",               icon: "💬", title: "Chat",          text: "Mensajes con proveedores" },
    { href: "/perfil",             icon: "👤", title: "Mi Cuenta",     text: "Datos y contraseña" },
  ];

  const estadoColor = (estado?: string) => {
    if (estado === "entregado") return { bg: "rgba(22,163,74,0.18)", color: "#4ade80" };
    if (estado === "enviado")   return { bg: "rgba(139,92,246,0.18)", color: "#a78bfa" };
    if (estado === "preparando") return { bg: "rgba(37,99,235,0.18)", color: "#60a5fa" };
    return { bg: "rgba(245,158,11,0.18)", color: "#f59e0b" };
  };

  /* ── MÓVIL ── */
  if (isMobile) return (
    <main style={{ background: "linear-gradient(180deg,#020617,#020b2d)", color: "white", minHeight: "100vh" }}>
      <div style={{ position: "relative", height: 180, background: "url('https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?q=80&w=800&auto=format&fit=crop') center/cover", display: "flex", alignItems: "flex-end", padding: "20px 16px" }}>
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg,rgba(2,6,23,0.4),rgba(2,6,23,0.92))" }} />
        <div style={{ position: "relative", zIndex: 2 }}>
          <p style={{ color: "#60a5fa", fontSize: 11, fontWeight: 700, marginBottom: 4 }}>MARKETPLACE PROFESIONAL</p>
          <h1 style={{ fontSize: 28, fontWeight: 900, lineHeight: 1.1 }}>{nombreEmpresa ? `Hola, ${nombreEmpresa.split(" ")[0]}` : "Bienvenido"}</h1>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8, padding: "16px 16px 0" }}>
        {[
          { label: "Este mes", value: pedidosMes.length, unit: "pedidos" },
          { label: "Facturado", value: `${facturacion.toFixed(0)}€`, unit: "" },
          { label: "Mis piezas", value: piezasTaller.length, unit: "refs" },
        ].map(({ label, value, unit }) => (
          <div key={label} style={{ background: "rgba(15,23,42,0.95)", borderRadius: 14, padding: "14px 12px", border: "1px solid rgba(255,255,255,0.06)", textAlign: "center" }}>
            <p style={{ color: "#64748b", fontSize: 10, fontWeight: 700, marginBottom: 4 }}>{label}</p>
            <p style={{ fontSize: 22, fontWeight: 900, lineHeight: 1 }}>{value}</p>
            {unit && <p style={{ color: "#94a3b8", fontSize: 10, marginTop: 2 }}>{unit}</p>}
          </div>
        ))}
      </div>
      <div style={{ padding: "16px 16px 0" }}><BloqueRDPago /></div>
      <div style={{ padding: "16px 16px 0" }}>
        <p style={{ color: "#64748b", fontSize: 11, fontWeight: 700, marginBottom: 10 }}>ACCESOS RÁPIDOS</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {accesos.map(({ href, icon, title, text }) => (
            <Link key={href} href={href} style={{ background: "rgba(15,23,42,0.95)", borderRadius: 14, padding: "16px 14px", textDecoration: "none", color: "white", border: "1px solid rgba(255,255,255,0.06)", display: "block" }}>
              <span style={{ fontSize: 26, display: "block", marginBottom: 8 }}>{icon}</span>
              <p style={{ fontWeight: 800, fontSize: 14, marginBottom: 4 }}>{title}</p>
              <p style={{ color: "#94a3b8", fontSize: 11 }}>{text}</p>
            </Link>
          ))}
        </div>
      </div>
      {pedidos.length > 0 && (
        <div style={{ padding: "16px 16px 0" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <p style={{ color: "#64748b", fontSize: 11, fontWeight: 700 }}>ACTIVIDAD RECIENTE</p>
            <Link href="/dashboard/pedidos" style={{ color: "#60a5fa", fontSize: 12, fontWeight: 700, textDecoration: "none" }}>Ver todos →</Link>
          </div>
          <div style={{ display: "grid", gap: 10 }}>
            {pedidos.slice(0, 4).map((pedido) => {
              const est = estadoColor(pedido.estado_envio);
              return (
                <Link key={pedido.id} href="/dashboard/pedidos" style={{ background: "rgba(15,23,42,0.95)", borderRadius: 14, padding: "14px 16px", border: "1px solid rgba(255,255,255,0.06)", textDecoration: "none", color: "white", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <p style={{ fontWeight: 800, fontSize: 14 }}>{pedido.codigo || `#${pedido.id}`}</p>
                    <p style={{ color: "#94a3b8", fontSize: 12, marginTop: 2 }}>{pedido.created_at ? new Date(pedido.created_at).toLocaleDateString("es-ES") : ""}</p>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <p style={{ fontWeight: 900, fontSize: 16, color: "#22c55e" }}>{Number(pedido.total).toFixed(2)}€</p>
                    <span style={{ background: est.bg, color: est.color, padding: "3px 10px", borderRadius: 999, fontSize: 11, fontWeight: 700 }}>{pedido.estado_envio || "pendiente"}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}
      <div style={{ padding: "16px" }}>
        <button onClick={cerrarSesion} style={{ width: "100%", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171", padding: "14px", borderRadius: 14, cursor: "pointer", fontWeight: 700, fontSize: 14 }}>Cerrar sesión</button>
      </div>
    </main>
  );

  /* ── DESKTOP ── */
  return (
    <main style={{ display: "flex", minHeight: "100vh", background: "linear-gradient(135deg,#020617,#020b2d)", color: "white" }}>
      <aside style={{ width: 280, background: "rgba(15,23,42,0.92)", borderRight: "1px solid rgba(255,255,255,0.06)", padding: "30px 22px", display: "flex", flexDirection: "column", justifyContent: "space-between", backdropFilter: "blur(18px)", flexShrink: 0 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 40 }}>
            <div style={{ width: 60, height: 60, borderRadius: 18, background: "linear-gradient(135deg,#2563eb,#1d4ed8)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 20 }}>RD</div>
            <div><h2 style={{ fontSize: 22, fontWeight: 900 }}>RECAMBIO DIRECTO</h2><p style={{ color: "#94a3b8", marginTop: 4, fontSize: 13 }}>Marketplace B2B</p></div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[
              { href: "/dashboard", label: "🏠 Inicio" },
              { href: "/dashboard/buscar", label: "🔍 Buscar" },
              { href: "/dashboard/pedidos", label: "📦 Pedidos" },
              { href: "/dashboard/devoluciones", label: "🔄 Devoluciones" },
              { href: "/dashboard/mis-piezas", label: "🔩 Mis Piezas" },
              { href: "/checkout", label: "🛒 Cesta" },
              { href: "/perfil", label: "👤 Mi Cuenta" },
              { href: "/chat", label: "💬 Chat" },
            ].map(({ href, label }) => (
              <Link key={href} href={href} style={{ padding: "14px 18px", borderRadius: 14, background: href === "/dashboard" ? "linear-gradient(135deg,#2563eb,#1d4ed8)" : "rgba(255,255,255,0.04)", color: href === "/dashboard" ? "white" : "#cbd5e1", textDecoration: "none", fontWeight: 700, fontSize: 14 }}>{label}</Link>
            ))}
          </div>
        </div>
        <div style={{ background: "linear-gradient(135deg,#1e293b,#0f172a)", borderRadius: 24, padding: 24 }}>
          <p style={{ color: "#94a3b8", marginBottom: 10, fontSize: 12 }}>FACTURACIÓN TOTAL</p>
          <h2 style={{ fontSize: 42, fontWeight: 900 }}>{facturacion.toFixed(0)}€</h2>
          <p style={{ color: "#22c55e", marginTop: 8, fontWeight: 700, fontSize: 13 }}>{pedidos.length} pedidos totales</p>
        </div>
      </aside>
      <section style={{ flex: 1, overflow: "hidden" }}>
        <div style={{ height: 420, position: "relative", background: "url('https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?q=80&w=1600&auto=format&fit=crop') center/cover", display: "flex", alignItems: "center", padding: 70 }}>
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg,rgba(2,6,23,0.95),rgba(2,6,23,0.65))" }} />
          <div style={{ position: "relative", zIndex: 2 }}>
            <div style={{ display: "inline-block", padding: "8px 16px", borderRadius: 999, background: "rgba(37,99,235,0.18)", border: "1px solid rgba(37,99,235,0.3)", color: "#60a5fa", fontWeight: 700, marginBottom: 16, fontSize: 14 }}>MARKETPLACE PROFESIONAL</div>
            <h1 style={{ fontSize: 82, lineHeight: 1, fontWeight: 900, marginBottom: 26 }}>ENCUENTRA<br />RECAMBIOS</h1>
            <p style={{ fontSize: 22, lineHeight: 1.7, color: "#cbd5e1", maxWidth: 760 }}>Busca referencias OEM, IAM y equivalencias directamente entre proveedores conectados.</p>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 24, padding: "40px 50px" }}>
          {[
            { label: "PEDIDOS MES", value: pedidosMes.length },
            { label: "FACTURACIÓN", value: `${facturacion.toFixed(0)}€` },
            { label: "MIS PIEZAS", value: piezasTaller.length },
          ].map(({ label, value }) => (
            <div key={label} style={{ background: "rgba(15,23,42,0.92)", padding: 34, borderRadius: 28, border: "1px solid rgba(255,255,255,0.06)" }}>
              <p style={{ color: "#94a3b8", marginBottom: 8, fontSize: 14 }}>{label}</p>
              <h2 style={{ fontSize: 54, fontWeight: 900 }}>{value}</h2>
            </div>
          ))}
        </div>
        {/* RD PAGO */}
        <div style={{ padding: "0 50px", marginBottom: 32 }}><BloqueRDPago /></div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 24, padding: "0 50px", marginBottom: 40 }}>
          {[
            { href: "/dashboard/pedidos", title: "MIS PEDIDOS", text: "Consulta pedidos, estados y tracking." },
            { href: "/dashboard/mis-piezas", title: "MIS PIEZAS", text: "Publica piezas sueltas para vender a otros talleres." },
            { href: "/perfil", title: "MI CUENTA", text: "Gestiona tus datos y empresa." },
          ].map(({ href, title, text }) => (
            <Link key={href} href={href} style={{ background: "rgba(15,23,42,0.92)", borderRadius: 28, padding: 38, textDecoration: "none", color: "white", border: "1px solid rgba(255,255,255,0.06)", display: "block" }}>
              <h2 style={{ fontSize: 36, fontWeight: 900, marginBottom: 18 }}>{title}</h2>
              <p style={{ color: "#94a3b8", lineHeight: 1.7, fontSize: 15 }}>{text}</p>
            </Link>
          ))}
        </div>
        {pedidos.length > 0 && (
          <div style={{ background: "rgba(15,23,42,0.92)", borderRadius: 32, padding: 40, margin: "0 50px", border: "1px solid rgba(255,255,255,0.06)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 40 }}>
              <h2 style={{ fontSize: 40, fontWeight: 900 }}>ACTIVIDAD RECIENTE</h2>
              <Link href="/dashboard/pedidos" style={{ color: "#60a5fa", textDecoration: "none", fontWeight: 800 }}>VER TODOS</Link>
            </div>
            <div style={{ display: "grid", gap: 16 }}>
              {pedidos.slice(0, 5).map((pedido) => {
                const est = estadoColor(pedido.estado_envio);
                return (
                  <div key={pedido.id} style={{ background: "#0f172a", borderRadius: 24, padding: 30, border: "1px solid rgba(255,255,255,0.06)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                      <div>
                        <h3 style={{ fontSize: 28, fontWeight: 900 }}>Pedido #{pedido.id}</h3>
                        <p style={{ color: "#60a5fa", marginTop: 4, fontWeight: 700, fontSize: 13 }}>{pedido.codigo}</p>
                        <p style={{ color: "#94a3b8", fontSize: 12, marginTop: 4 }}>{pedido.created_at ? new Date(pedido.created_at).toLocaleDateString("es-ES") : ""}</p>
                      </div>
                      <span style={{ padding: "8px 14px", borderRadius: 999, fontWeight: 700, fontSize: 12, background: est.bg, color: est.color }}>{pedido.estado_envio || "pendiente"}</span>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 20 }}>
                      {[
                        { l: "Transporte", v: pedido.transporte || pedido.agencia || "-" },
                        { l: "Pago", v: pedido.metodo_pago || "-" },
                        { l: "Total", v: `${pedido.total}€`, green: true },
                        { l: "Estado", v: pedido.estado_envio || "pendiente" },
                      ].map(({ l, v, green }) => (
                        <div key={l}>
                          <p style={{ color: "#94a3b8", marginBottom: 6, fontSize: 11 }}>{l}</p>
                          <h3 style={{ fontSize: 22, fontWeight: 800, color: green ? "#22c55e" : "white" }}>{v}</h3>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        <button onClick={cerrarSesion} style={{ margin: "40px 50px", background: "linear-gradient(135deg,#dc2626,#991b1b)", border: "none", color: "white", padding: "18px 28px", borderRadius: 18, cursor: "pointer", fontWeight: 800 }}>CERRAR SESIÓN</button>
      </section>
    </main>
  );
}