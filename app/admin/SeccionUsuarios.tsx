import { useState } from "react";
import { supabase } from "../lib/supabase";
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
  setUsuarios: (fn: (prev: Usuario[]) => Usuario[]) => void;
};

export default function SeccionUsuarios({ usuarios, setSeccion, setFtpProveedorId, toggleActivo, cambiarSuscripcion, eliminarUsuario, setUsuarioEditando, setNotasTemp, setUsuarios }: Props) {
  const [busqueda, setBusqueda] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("todos");
  const [filtroSub, setFiltroSub] = useState("todos");
  const [cambiandoTipo, setCambiandoTipo] = useState<string | null>(null);

  async function cambiarTipo(id: string, nuevoTipo: string) {
    if (!confirm(`¿Cambiar este usuario a ${nuevoTipo}? Esto afectará a su acceso en la plataforma.`)) return;
    setCambiandoTipo(id);
    await supabase.from("usuarios").update({ tipo: nuevoTipo }).eq("id", id);
    setUsuarios(prev => prev.map(u => u.id === id ? { ...u, tipo: nuevoTipo } : u));
    setCambiandoTipo(null);
  }

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
                <td style={tdStyle}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <span style={tipoBadge(u.tipo)}>{u.tipo}</span>
                    <select
                      value={u.tipo}
                      disabled={cambiandoTipo === u.id}
                      onChange={e => cambiarTipo(u.id, e.target.value)}
                      style={{ background: "#020617", color: "#94a3b8", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6, padding: "3px 6px", fontSize: 11, cursor: "pointer", outline: "none" }}
                    >
                      <option value="taller">taller</option>
                      <option value="proveedor">proveedor</option>
                    </select>
                  </div>
                </td>
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