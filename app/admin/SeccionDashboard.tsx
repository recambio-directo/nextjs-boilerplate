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
  const facturacionMes = activos * 25;
  const pedidosMes = pedidos.filter(p => { if (!p.created_at) return false; const f = new Date(p.created_at); const now = new Date(); return f.getMonth() === now.getMonth() && f.getFullYear() === now.getFullYear(); }).length;

  const kpiGrid = { display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 20, marginBottom: 36 };

  return (
    <div>
      <h1 style={{ fontSize: 56, fontWeight: 900, lineHeight: 1, marginBottom: 12 }}>PANEL DE CONTROL</h1>
      <p style={{ color: "#94a3b8", fontSize: 18, marginBottom: 36 }}>Resumen general de Recambio Directo.</p>
      <div style={kpiGrid}>
        {[
          { label: "USUARIOS TOTALES", value: totalUsuarios, color: "white" },
          { label: "PROVEEDORES", value: totalProveedores, color: "#60a5fa" },
          { label: "TALLERES", value: totalTalleres, color: "#a78bfa" },
          { label: "EN GRATUITO", value: enGratuito, color: "#fbbf24" },
          { label: "SUSCRITOS ACTIVOS", value: activos, color: "#4ade80" },
          { label: "MOROSOS", value: morosos, color: "#f87171" },
          { label: "FACTURACIÓN MES", value: `${facturacionMes}€`, color: "#22c55e" },
          { label: "PEDIDOS MES", value: pedidosMes, color: "#60a5fa" },
        ].map(({ label, value, color }) => (
          <div key={label} style={kpiCard}><p style={kpiLabel}>{label}</p><h2 style={{ ...kpiNum, color }}>{value}</h2></div>
        ))}
      </div>
      <div style={seccionCard}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h2 style={{ fontSize: 22, fontWeight: 900 }}>Últimos registros</h2>
          <button onClick={() => setSeccion("usuarios")} style={btnVer}>Ver todos →</button>
        </div>
        <div style={tableContainer}>
          <table style={tableStyle}>
            <thead><tr>{["EMPRESA", "EMAIL", "TIPO", "SUSCRIPCIÓN", "ACTIVO"].map(h => <th key={h} style={thStyle}>{h}</th>)}</tr></thead>
            <tbody>
              {usuarios.slice(0, 8).map(u => (
                <tr key={u.id} style={trStyle}>
                  <td style={tdStyle}><strong>{u.nombre_empresa || "-"}</strong></td>
                  <td style={{ ...tdStyle, color: "#94a3b8" }}>{u.email}</td>
                  <td style={tdStyle}><span style={tipoBadge(u.tipo)}>{u.tipo}</span></td>
                  <td style={tdStyle}><span style={subBadge(u.suscripcion)}>{SUSCRIPCION_LABELS[u.suscripcion]?.label || u.suscripcion}</span></td>
                  <td style={tdStyle}><span style={{ color: u.activo ? "#4ade80" : "#f87171", fontWeight: 700 }}>{u.activo ? "✅ Sí" : "❌ No"}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}