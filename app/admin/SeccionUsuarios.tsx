import { Usuario, SUSCRIPCION_LABELS, tipoBadge, subBadge, selectSub, tableContainer, tableStyle, thStyle, trStyle, tdStyle, btnAccion, btnFiltro, searchInput, filtrosBox } from "./types";

type Props = {
  usuarios: Usuario[];
  setSeccion: (s: any) => void;
  setFtpProveedorId: (id: string) => void;
  toggleActivo: (u: Usuario) => void;
  cambiarSuscripcion: (id: string, sub: string) => void;
  eliminarUsuario: (id: string) => void;
  setUsuarioEditando: (u: Usuario) => void;
  setNotasTemp: (n: string) => void;
};

export default function SeccionUsuarios({ usuarios, setSeccion, setFtpProveedorId, toggleActivo, cambiarSuscripcion, eliminarUsuario, setUsuarioEditando, setNotasTemp }: Props) {
  const [busqueda, setBusqueda] = require("react").useState("");
  const [filtroTipo, setFiltroTipo] = require("react").useState("todos");
  const [filtroSub, setFiltroSub] = require("react").useState("todos");

  const usuariosFiltrados = usuarios.filter(u => {
    if (filtroTipo !== "todos" && u.tipo !== filtroTipo) return false;
    if (filtroSub !== "todos" && u.suscripcion !== filtroSub) return false;
    if (busqueda) { const q = busqueda.toLowerCase(); return (u.nombre_empresa || "").toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || (u.cif || "").toLowerCase().includes(q); }
    return true;
  });

  return (
    <div>
      <h1 style={{ fontSize: 56, fontWeight: 900, lineHeight: 1, marginBottom: 12 }}>USUARIOS</h1>
      <p style={{ color: "#94a3b8", fontSize: 18, marginBottom: 36 }}>Gestiona talleres y proveedores de la plataforma.</p>
      <div style={filtrosBox}>
        <input placeholder="Buscar empresa, email, CIF..." value={busqueda} onChange={e => setBusqueda(e.target.value)} style={searchInput} />
        <div style={{ display: "flex", gap: 8 }}>
          {["todos", "taller", "proveedor"].map(t => (
            <button key={t} onClick={() => setFiltroTipo(t)} style={{ ...btnFiltro, background: filtroTipo === t ? "linear-gradient(135deg,#2563eb,#1d4ed8)" : "rgba(255,255,255,0.05)", color: filtroTipo === t ? "white" : "#94a3b8", border: filtroTipo === t ? "none" : "1px solid rgba(255,255,255,0.08)" }}>{t === "todos" ? "Todos" : t}</button>
          ))}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {["todos", "gratuito", "activo", "pendiente", "moroso"].map(s => (
            <button key={s} onClick={() => setFiltroSub(s)} style={{ ...btnFiltro, background: filtroSub === s ? "rgba(139,92,246,0.3)" : "rgba(255,255,255,0.05)", color: filtroSub === s ? "#a78bfa" : "#94a3b8", border: filtroSub === s ? "1px solid rgba(139,92,246,0.5)" : "1px solid rgba(255,255,255,0.08)" }}>{SUSCRIPCION_LABELS[s]?.label || "Todos"}</button>
          ))}
        </div>
        <span style={{ color: "#94a3b8", fontSize: 13 }}>{usuariosFiltrados.length} usuarios</span>
      </div>
      <div style={tableContainer}>
        <table style={tableStyle}>
          <thead><tr>{["EMPRESA", "EMAIL", "CIF", "TIPO", "SUSCRIPCIÓN", "FTP", "ACTIVO", "ACCIONES"].map(h => <th key={h} style={thStyle}>{h}</th>)}</tr></thead>
          <tbody>
            {usuariosFiltrados.map(u => (
              <tr key={u.id} style={{ ...trStyle, opacity: u.activo ? 1 : 0.5 }}>
                <td style={tdStyle}>
                  <div style={{ fontWeight: 700 }}>{u.nombre_empresa || "-"}</div>
                  {u.ciudad && <div style={{ color: "#94a3b8", fontSize: 12 }}>📍 {u.ciudad}</div>}
                  {u.notas_admin && <div style={{ color: "#fbbf24", fontSize: 11, marginTop: 2 }}>📝 {u.notas_admin.substring(0, 40)}...</div>}
                </td>
                <td style={{ ...tdStyle, color: "#94a3b8", fontSize: 13 }}>{u.email}</td>
                <td style={{ ...tdStyle, color: "#94a3b8", fontSize: 13 }}>{u.cif || "-"}</td>
                <td style={tdStyle}><span style={tipoBadge(u.tipo)}>{u.tipo}</span></td>
                <td style={tdStyle}>
                  <select value={u.suscripcion} onChange={e => cambiarSuscripcion(u.id, e.target.value)} style={selectSub(u.suscripcion)}>
                    {Object.entries(SUSCRIPCION_LABELS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </td>
                <td style={tdStyle}>
                  {u.ftp_activo ? (
                    <div>
                      <span style={{ background: "rgba(139,92,246,0.2)", color: "#a78bfa", padding: "3px 10px", borderRadius: 999, fontSize: 12, fontWeight: 700 }}>🔄 Activo</span>
                      {u.ftp_usuario && <div style={{ color: "#64748b", fontSize: 11, marginTop: 2 }}>{u.ftp_usuario}</div>}
                    </div>
                  ) : (
                    <button onClick={() => { setSeccion("ftp"); setFtpProveedorId(u.id); }} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "#64748b", padding: "4px 10px", borderRadius: 8, cursor: "pointer", fontWeight: 700, fontSize: 12 }}>+ Activar</button>
                  )}
                </td>
                <td style={tdStyle}>
                  <button onClick={() => toggleActivo(u)} style={{ background: u.activo ? "rgba(22,163,74,0.15)" : "rgba(239,68,68,0.15)", border: "none", color: u.activo ? "#4ade80" : "#f87171", padding: "6px 14px", borderRadius: 8, cursor: "pointer", fontWeight: 700, fontSize: 13 }}>{u.activo ? "✅ Activo" : "❌ Inactivo"}</button>
                </td>
                <td style={tdStyle}>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button onClick={() => { setUsuarioEditando(u); setNotasTemp(u.notas_admin || ""); }} style={btnAccion}>📝</button>
                    <button onClick={() => eliminarUsuario(u.id)} style={{ ...btnAccion, background: "rgba(239,68,68,0.15)", color: "#f87171" }}>🗑️</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}