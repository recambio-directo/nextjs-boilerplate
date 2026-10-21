import { Usuario, Pedido, SUSCRIPCION_LABELS, tipoBadge, subBadge, kpiCard, kpiLabel, kpiNum, seccionCard, tableContainer, tableStyle, thStyle, trStyle, tdStyle, btnVer } from "./types";

type Props = {
  usuarios: Usuario[];
  pedidos: Pedido[];
  setSeccion: (s: any) => void;
};

export default function SeccionDashboard({ usuarios, pedidos, setSeccion }: Props) {
  const totalUsuarios = usuarios.length;
  const totalProveedores = usuarios.filter(u => u.tipo === "proveedor").length;
  const totalTalleres = usuarios.filter(u => u.tipo === "taller").length;
  const enGratuito = usuarios.filter(u => u.suscripcion === "gratuito").length;
  const activos = usuarios.filter(u => u.suscripcion === "activo").length;
  const morosos = usuarios.filter(u => u.suscripcion === "moroso").length;
  const pendientes = usuarios.filter(u => u.suscripcion === "pendiente").length;
  const facturacionMes = activos * 25;
  const now = new Date();
  const pedidosMes = pedidos.filter(p => { if (!p.created_at) return false; const f = new Date(p.created_at); return f.getMonth() === now.getMonth() && f.getFullYear() === now.getFullYear(); }).length;

  // Pedidos semana
  const hace7dias = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const pedidosSemana = pedidos.filter(p => p.created_at && new Date(p.created_at) >= hace7dias).length;

  // Alertas
  const proximosACobrar = usuarios.filter(u => {
    if (u.suscripcion !== "gratuito" || !u.fecha_registro) return false;
    const dias = Math.floor((now.getTime() - new Date(u.fecha_registro).getTime()) / (1000 * 60 * 60 * 24));
    return dias >= 20 && dias <= 35;
  });

  const sinIBAN = usuarios.filter(u => (u as any).rd_pago_activo && !u.iban);
  const pedidosAnulados = pedidos.filter(p => p.anulado).length;
  const pedidosPreparando = pedidos.filter(p => p.estado_envio === "preparando" && !p.anulado).length;
  const pedidosEnTransito = pedidos.filter(p => p.estado_envio === "en_transito" && !p.anulado).length;
  const pedidosEntregados = pedidos.filter(p => p.estado_envio === "entregado" && !p.anulado).length;

  // Últimos 7 días de registros por día (mini sparkline data)
  const registrosPorDia: number[] = [];
  for (let i = 6; i >= 0; i--) {
    const dia = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const count = usuarios.filter(u => {
      if (!u.fecha_registro) return false;
      const f = new Date(u.fecha_registro);
      return f.toDateString() === dia.toDateString();
    }).length;
    registrosPorDia.push(count);
  }
  const maxReg = Math.max(...registrosPorDia, 1);

  // Usuarios inactivos (último acceso > 30 días)
  const inactivos = usuarios.filter(u => {
    if (!u.ultimo_acceso) return true;
    const dias = Math.floor((now.getTime() - new Date(u.ultimo_acceso).getTime()) / (1000 * 60 * 60 * 24));
    return dias > 30;
  }).length;

  const alertas: { tipo: "error" | "warning" | "info"; mensaje: string; accion?: string; seccion?: string }[] = [];
  if (morosos > 0) alertas.push({ tipo: "error", mensaje: `${morosos} usuario${morosos > 1 ? "s" : ""} moroso${morosos > 1 ? "s" : ""}`, accion: "Ver financiero →", seccion: "financiero" });
  if (proximosACobrar.length > 0) alertas.push({ tipo: "warning", mensaje: `${proximosACobrar.length} usuario${proximosACobrar.length > 1 ? "s" : ""} próximo${proximosACobrar.length > 1 ? "s" : ""} a fin de periodo gratuito`, accion: "Ver cobros →", seccion: "cobros" });
  if (sinIBAN.length > 0) alertas.push({ tipo: "warning", mensaje: `${sinIBAN.length} usuario${sinIBAN.length > 1 ? "s" : ""} con RD Pago activo sin IBAN`, accion: "Ver financiero →", seccion: "financiero" });
  if (pendientes > 0) alertas.push({ tipo: "info", mensaje: `${pendientes} suscripción${pendientes > 1 ? "es" : ""} pendiente${pendientes > 1 ? "s" : ""} de confirmación`, accion: "Ver cobros →", seccion: "cobros" });

  const kpiGrid = { display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 20, marginBottom: 32 };
  const alertColors = { error: { bg: "rgba(239,68,68,0.08)", border: "rgba(239,68,68,0.25)", color: "#f87171", icon: "🔴" }, warning: { bg: "rgba(245,158,11,0.08)", border: "rgba(245,158,11,0.25)", color: "#fbbf24", icon: "🟡" }, info: { bg: "rgba(37,99,235,0.08)", border: "rgba(37,99,235,0.25)", color: "#60a5fa", icon: "🔵" } };

  return (
    <div>
      <h1 style={{ fontSize: 56, fontWeight: 900, lineHeight: 1, marginBottom: 12 }}>PANEL DE CONTROL</h1>
      <p style={{ color: "#94a3b8", fontSize: 18, marginBottom: 36 }}>Resumen general de Recambio Directo.</p>

      {/* ALERTAS */}
      {alertas.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 28 }}>
          {alertas.map((a, i) => {
            const c = alertColors[a.tipo];
            return (
              <div key={i} style={{ background: c.bg, border: `1px solid ${c.border}`, borderRadius: 14, padding: "14px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ color: c.color, fontWeight: 700, fontSize: 14 }}>{c.icon} {a.mensaje}</span>
                {a.accion && <button onClick={() => setSeccion(a.seccion)} style={{ background: "transparent", border: "none", color: c.color, cursor: "pointer", fontWeight: 800, fontSize: 13 }}>{a.accion}</button>}
              </div>
            );
          })}
        </div>
      )}

      {/* KPIs FILA 1: Usuarios */}
      <div style={kpiGrid}>
        {[
          { label: "USUARIOS TOTALES", value: totalUsuarios, color: "white", sub: `${totalTalleres} talleres · ${totalProveedores} proveedores` },
          { label: "SUSCRITOS ACTIVOS", value: activos, color: "#4ade80", sub: `${facturacionMes}€/mes` },
          { label: "EN GRATUITO", value: enGratuito, color: "#fbbf24", sub: `${proximosACobrar.length} próximos a cobro` },
          { label: "MOROSOS", value: morosos, color: "#f87171", sub: morosos > 0 ? "Requieren atención" : "Todo en orden" },
        ].map(({ label, value, color, sub }) => (
          <div key={label} style={kpiCard}>
            <p style={kpiLabel}>{label}</p>
            <h2 style={{ ...kpiNum, color }}>{value}</h2>
            <p style={{ color: "#64748b", fontSize: 11, marginTop: 4 }}>{sub}</p>
          </div>
        ))}
      </div>

      {/* KPIs FILA 2: Actividad */}
      <div style={kpiGrid}>
        {[
          { label: "PEDIDOS ESTE MES", value: pedidosMes, color: "#60a5fa", sub: `${pedidosSemana} esta semana` },
          { label: "EN PREPARACIÓN", value: pedidosPreparando, color: "#fbbf24", sub: "Pendientes de envío" },
          { label: "EN TRÁNSITO", value: pedidosEnTransito, color: "#a78bfa", sub: `${pedidosEntregados} entregados` },
          { label: "FACTURACIÓN MES", value: `${facturacionMes}€`, color: "#22c55e", sub: `+ FTP + portes RD Pago` },
        ].map(({ label, value, color, sub }) => (
          <div key={label} style={kpiCard}>
            <p style={kpiLabel}>{label}</p>
            <h2 style={{ ...kpiNum, color }}>{value}</h2>
            <p style={{ color: "#64748b", fontSize: 11, marginTop: 4 }}>{sub}</p>
          </div>
        ))}
      </div>

      {/* ACTIVIDAD + REGISTROS RECIENTES */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 28 }}>
        {/* Mini gráfico registros últimos 7 días */}
        <div style={seccionCard}>
          <h2 style={{ fontSize: 18, fontWeight: 900, marginBottom: 16 }}>📈 Registros últimos 7 días</h2>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 80 }}>
            {registrosPorDia.map((count, i) => {
              const dia = new Date(now.getTime() - (6 - i) * 24 * 60 * 60 * 1000);
              const label = dia.toLocaleDateString("es-ES", { weekday: "short" }).substring(0, 2);
              return (
                <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                  <span style={{ color: "#60a5fa", fontSize: 11, fontWeight: 800 }}>{count}</span>
                  <div style={{ width: "100%", height: `${Math.max((count / maxReg) * 60, 4)}px`, background: "linear-gradient(180deg,#2563eb,#1d4ed8)", borderRadius: 6, minHeight: 4 }} />
                  <span style={{ color: "#64748b", fontSize: 10, textTransform: "uppercase" }}>{label}</span>
                </div>
              );
            })}
          </div>
          <p style={{ color: "#64748b", fontSize: 12, marginTop: 12 }}>Total semana: <strong style={{ color: "white" }}>{registrosPorDia.reduce((a, b) => a + b, 0)}</strong> · Inactivos +30d: <strong style={{ color: inactivos > 10 ? "#f87171" : "#94a3b8" }}>{inactivos}</strong></p>
        </div>

        {/* Acciones rápidas */}
        <div style={seccionCard}>
          <h2 style={{ fontSize: 18, fontWeight: 900, marginBottom: 16 }}>⚡ Acciones rápidas</h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {[
              { label: "👥 Usuarios", s: "usuarios" },
              { label: "📦 Pedidos", s: "pedidos" },
              { label: "💰 Cobros", s: "cobros" },
              { label: "🏦 Financiero", s: "financiero" },
              { label: "🧾 Facturación", s: "facturacion" },
              { label: "⚙️ Sistema", s: "sistema" },
            ].map(({ label, s }) => (
              <button key={s} onClick={() => setSeccion(s)} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: "14px 16px", color: "#94a3b8", cursor: "pointer", fontWeight: 700, fontSize: 14, textAlign: "left" as const, transition: "all 0.15s" }}>
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ÚLTIMOS REGISTROS */}
      <div style={seccionCard}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h2 style={{ fontSize: 22, fontWeight: 900 }}>Últimos registros</h2>
          <button onClick={() => setSeccion("usuarios")} style={btnVer}>Ver todos →</button>
        </div>
        <div style={tableContainer}>
          <table style={tableStyle}>
            <thead><tr>{["EMPRESA", "EMAIL", "TIPO", "SUSCRIPCIÓN", "REGISTRADO", "ACTIVO"].map(h => <th key={h} style={thStyle}>{h}</th>)}</tr></thead>
            <tbody>
              {usuarios.slice(0, 10).map(u => (
                <tr key={u.id} style={trStyle}>
                  <td style={tdStyle}><strong>{u.nombre_empresa || "-"}</strong></td>
                  <td style={{ ...tdStyle, color: "#94a3b8", fontSize: 13 }}>{u.email}</td>
                  <td style={tdStyle}><span style={tipoBadge(u.tipo)}>{u.tipo}</span></td>
                  <td style={tdStyle}><span style={subBadge(u.suscripcion)}>{SUSCRIPCION_LABELS[u.suscripcion]?.label || u.suscripcion}</span></td>
                  <td style={{ ...tdStyle, color: "#94a3b8", fontSize: 12 }}>{u.fecha_registro ? new Date(u.fecha_registro).toLocaleDateString("es-ES") : "-"}</td>
                  <td style={tdStyle}><span style={{ color: u.activo ? "#4ade80" : "#f87171", fontWeight: 700 }}>{u.activo ? "✅" : "❌"}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ÚLTIMOS PEDIDOS */}
      <div style={{ ...seccionCard, marginTop: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h2 style={{ fontSize: 22, fontWeight: 900 }}>Últimos pedidos</h2>
          <button onClick={() => setSeccion("pedidos")} style={btnVer}>Ver todos →</button>
        </div>
        <div style={tableContainer}>
          <table style={tableStyle}>
            <thead><tr>{["CÓDIGO", "CLIENTE", "AGENCIA", "ESTADO", "TRACKING", "FECHA"].map(h => <th key={h} style={thStyle}>{h}</th>)}</tr></thead>
            <tbody>
              {pedidos.slice(0, 8).map(p => {
                const estadoColor: Record<string, string> = { preparando: "#fbbf24", en_transito: "#a78bfa", entregado: "#4ade80", recogido: "#60a5fa", incidencia: "#f87171" };
                return (
                  <tr key={p.id} style={{ ...trStyle, opacity: p.anulado ? 0.4 : 1 }}>
                    <td style={tdStyle}><strong style={{ color: p.anulado ? "#f87171" : "white" }}>{p.codigo || `#${p.id}`}</strong>{p.anulado && <span style={{ color: "#f87171", fontSize: 11, marginLeft: 6 }}>ANULADO</span>}</td>
                    <td style={{ ...tdStyle, color: "#94a3b8", fontSize: 13 }}>{p.cliente_nombre || "-"}</td>
                    <td style={tdStyle}><span style={{ color: "#60a5fa", fontWeight: 700, fontSize: 13 }}>{p.agencia || "-"}</span></td>
                    <td style={tdStyle}>
                      <span style={{ background: `${estadoColor[p.estado_envio] || "#94a3b8"}20`, color: estadoColor[p.estado_envio] || "#94a3b8", padding: "4px 10px", borderRadius: 999, fontSize: 12, fontWeight: 700 }}>
                        {p.estado_envio || "—"}
                      </span>
                    </td>
                    <td style={{ ...tdStyle, fontFamily: "monospace", fontSize: 12, color: p.tracking_number ? "#4ade80" : "#475569" }}>{p.tracking_number || "—"}</td>
                    <td style={{ ...tdStyle, color: "#94a3b8", fontSize: 12 }}>{p.created_at ? new Date(p.created_at).toLocaleDateString("es-ES") : "-"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
