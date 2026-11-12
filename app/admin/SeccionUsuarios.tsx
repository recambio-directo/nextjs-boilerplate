import { useState } from "react";
import { supabase } from "../lib/supabase";
import { adminPost, datosQueFaltan } from "./adminApi";
import { Usuario, SUSCRIPCION_LABELS, tipoBadge, subBadge, selectSub, tableContainer, tableStyle, thStyle, trStyle, tdStyle, btnAccion, btnFiltro, searchInput, filtrosBox } from "./types";

type Props = {
  usuarios: Usuario[];
  setSeccion: (s: any) => void;
  setFtpProveedorId: (id: string) => void;
  toggleActivo: (u: Usuario) => void;
  cambiarSuscripcion: (id: string, sub: string) => void;
  eliminarUsuario: (id: string) => Promise<{ ok: boolean; error?: string; avisos?: string[]; pedidosConservados?: number }>;
  setUsuarioEditando: (u: Usuario) => void;
  setNotasTemp: (n: string) => void;
  setUsuarios: (fn: (prev: Usuario[]) => Usuario[]) => void;
};

export default function SeccionUsuarios({ usuarios, setSeccion, setFtpProveedorId, toggleActivo, cambiarSuscripcion, eliminarUsuario, setUsuarioEditando, setNotasTemp, setUsuarios }: Props) {
  const [busqueda, setBusqueda] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("todos");
  const [filtroSub, setFiltroSub] = useState("todos");
  const [cambiandoTipo, setCambiandoTipo] = useState<string | null>(null);
  const [soloIncompletos, setSoloIncompletos] = useState(false);
  const [ficha, setFicha] = useState<Usuario | null>(null);
  const [form, setForm] = useState<Record<string, string>>({});
  const [guardandoFicha, setGuardandoFicha] = useState(false);
  const [msgFicha, setMsgFicha] = useState<{ ok: boolean; texto: string } | null>(null);
  const [enlacePassword, setEnlacePassword] = useState("");
  const [eliminando, setEliminando] = useState<string | null>(null);

  const CAMPOS_FICHA: [string, string, string][] = [
    ["nombre_empresa", "Empresa / razón social", "1/-1"],
    ["email", "Email de acceso", "auto"],
    ["telefono", "Teléfono", "auto"],
    ["cif", "CIF / NIF", "auto"],
    ["email_facturas", "Email para facturas", "auto"],
    ["direccion", "Dirección (calle y número)", "1/-1"],
    ["ciudad", "Ciudad", "auto"],
    ["codigo_postal", "Código postal", "auto"],
    ["provincia", "Provincia", "auto"],
    ["iban", "IBAN", "auto"],
    ["credito_rd", "Crédito RD actual (€)", "auto"],
    ["credito_rd_maximo", "Crédito RD máximo (€)", "auto"],
  ];

  function abrirFicha(u: Usuario) {
    const f: Record<string, string> = {};
    for (const [k] of CAMPOS_FICHA) f[k] = (u as any)[k] === null || (u as any)[k] === undefined ? "" : String((u as any)[k]);
    f.notas_admin = u.notas_admin || "";
    setForm(f); setFicha(u); setMsgFicha(null); setEnlacePassword("");
  }

  async function guardarFicha() {
    if (!ficha) return;
    setGuardandoFicha(true); setMsgFicha(null);
    // Solo se envían los campos que han cambiado
    const campos: Record<string, string> = {};
    for (const [k, v] of Object.entries(form)) {
      const original = (ficha as any)[k] === null || (ficha as any)[k] === undefined ? "" : String((ficha as any)[k]);
      if (v.trim() !== original.trim()) campos[k] = v.trim();
    }
    if (Object.keys(campos).length === 0) { setMsgFicha({ ok: true, texto: "No hay cambios que guardar" }); setGuardandoFicha(false); return; }
    const r = await adminPost("/api/admin/usuario", { accion: "actualizar", userId: ficha.id, campos });
    if (r.ok) {
      if (r.usuario) setUsuarios(prev => prev.map(u => u.id === ficha.id ? { ...u, ...r.usuario } : u));
      setMsgFicha({ ok: true, texto: r.descartados?.length ? `Guardado. Estos campos no existen en la base de datos y no se han guardado: ${r.descartados.join(", ")}` : "Cambios guardados" });
      if (r.usuario) setFicha({ ...ficha, ...r.usuario });
    } else {
      setMsgFicha({ ok: false, texto: r.error || "No se pudo guardar" });
    }
    setGuardandoFicha(false);
  }

  async function generarEnlacePassword() {
    if (!ficha) return;
    setMsgFicha(null);
    const r = await adminPost("/api/admin/usuario", { accion: "enlace_password", userId: ficha.id });
    if (r.ok) { setEnlacePassword(r.enlace); setMsgFicha({ ok: true, texto: "Enlace generado. Envíaselo al usuario: al abrirlo podrá poner una contraseña nueva. Es de un solo uso." }); }
    else setMsgFicha({ ok: false, texto: r.error || "No se pudo generar el enlace" });
  }

  async function confirmarEmail() {
    if (!ficha) return;
    const r = await adminPost("/api/admin/usuario", { accion: "confirmar_email", userId: ficha.id });
    setMsgFicha({ ok: !!r.ok, texto: r.ok ? "Email marcado como verificado: ya puede iniciar sesión" : (r.error || "No se pudo confirmar") });
  }

  async function eliminarConConfirmacion(u: Usuario) {
    const nombre = u.nombre_empresa || u.email;
    const escrito = prompt(`ELIMINAR DEFINITIVAMENTE a "${nombre}" (${u.tipo}).\n\nSe borra su acceso, su perfil, su cesta${u.tipo === "proveedor" ? ", TODO su stock publicado y sus claves de API" : ""}. Sus pedidos se conservan como histórico.\nNo se puede deshacer. Si solo quieres bloquearlo, usa el botón Activo/Inactivo.\n\nEscribe ELIMINAR para confirmar:`);
    if (escrito !== "ELIMINAR") return;
    setEliminando(u.id);
    const r = await eliminarUsuario(u.id);
    setEliminando(null);
    if (r.ok) {
      setFicha(null);
      alert(`Usuario eliminado.${r.pedidosConservados ? ` Se conservan ${r.pedidosConservados} pedidos suyos en el histórico.` : ""}${r.avisos?.length ? "\n\nAvisos:\n" + r.avisos.join("\n") : ""}`);
    } else {
      alert(`No se pudo eliminar: ${r.error || "error desconocido"}${r.avisos?.length ? "\n" + r.avisos.join("\n") : ""}`);
    }
  }

  const numIncompletos = usuarios.filter(u => datosQueFaltan(u).length > 0).length;

  async function cambiarTipo(id: string, nuevoTipo: string) {
    if (!confirm(`¿Cambiar este usuario a ${nuevoTipo}? Esto afectará a su acceso en la plataforma.`)) return;
    setCambiandoTipo(id);
    await supabase.from("usuarios").update({ tipo: nuevoTipo }).eq("id", id);
    setUsuarios(prev => prev.map(u => u.id === id ? { ...u, tipo: nuevoTipo } : u));
    setCambiandoTipo(null);
  }

  const usuariosFiltrados = usuarios.filter(u => {
    if (soloIncompletos && datosQueFaltan(u).length === 0) return false;
    if (filtroTipo !== "todos" && u.tipo !== filtroTipo) return false;
    if (filtroSub !== "todos" && u.suscripcion !== filtroSub) return false;
    if (busqueda) { const q = busqueda.toLowerCase(); return (u.nombre_empresa || "").toLowerCase().includes(q) || (u.email || "").toLowerCase().includes(q) || (u.cif || "").toLowerCase().includes(q) || (u.telefono || "").toLowerCase().includes(q) || (u.ciudad || "").toLowerCase().includes(q); }
    return true;
  });

  return (
    <>
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
        <button onClick={() => setSoloIncompletos(!soloIncompletos)} style={{ ...btnFiltro, background: soloIncompletos ? "linear-gradient(135deg,#d97706,#b45309)" : numIncompletos > 0 ? "rgba(245,158,11,0.15)" : "rgba(255,255,255,0.05)", color: soloIncompletos ? "white" : numIncompletos > 0 ? "#fbbf24" : "#94a3b8", border: soloIncompletos ? "none" : "1px solid rgba(245,158,11,0.25)" }}>⚠️ Datos incompletos ({numIncompletos})</button>
        <span style={{ color: "#94a3b8", fontSize: 13 }}>{usuariosFiltrados.length} usuarios</span>
      </div>
      <div style={tableContainer}>
        <table style={tableStyle}>
          <thead><tr>{["EMPRESA", "TELÉFONO", "EMAIL", "CIF", "TIPO", "SUSCRIPCIÓN", "ÚLTIMO ACCESO", "FTP", "VEHÍCULO", "ACTIVO", "ACCIONES"].map(h => <th key={h} style={thStyle}>{h}</th>)}</tr></thead>
          <tbody>
            {usuariosFiltrados.map(u => (
              <tr key={u.id} style={{ ...trStyle, opacity: u.activo ? 1 : 0.5 }}>
                <td style={tdStyle}>
                  <div style={{ fontWeight: 700 }}>{u.nombre_empresa || "-"}</div>
                  {u.ciudad && <div style={{ color: "#94a3b8", fontSize: 12 }}>📍 {u.ciudad}</div>}
                  {u.notas_admin && <div style={{ color: "#fbbf24", fontSize: 11, marginTop: 2 }}>📝 {u.notas_admin.substring(0, 40)}...</div>}
                  {datosQueFaltan(u).length > 0 && <div style={{ color: "#f87171", fontSize: 11, marginTop: 2, fontWeight: 700 }}>⚠️ Falta: {datosQueFaltan(u).join(", ")}</div>}
                </td>
                <td style={{ ...tdStyle, color: "#94a3b8", fontSize: 13 }}>{u.telefono || "-"}</td>
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
                  {u.ultimo_acceso ? (
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: (() => { const dias = Math.floor((Date.now() - new Date(u.ultimo_acceso).getTime()) / 86400000); return dias === 0 ? "#4ade80" : dias <= 3 ? "#60a5fa" : dias <= 7 ? "#fbbf24" : "#f87171"; })() }}>
                        {(() => { const dias = Math.floor((Date.now() - new Date(u.ultimo_acceso).getTime()) / 86400000); return dias === 0 ? "🟢 Hoy" : dias === 1 ? "🔵 Ayer" : dias <= 7 ? `🟡 Hace ${dias} días` : `🔴 Hace ${dias} días`; })()}
                      </div>
                      <div style={{ color: "#64748b", fontSize: 11 }}>{new Date(u.ultimo_acceso).toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" })}</div>
                    </div>
                  ) : (
                    <span style={{ color: "#475569", fontSize: 12 }}>Sin datos</span>
                  )}
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
                  {u.tipo === "taller" ? (
                    <button onClick={async () => {
                      const nuevo = !u.vehiculo_activo;
                      await supabase.from("usuarios").update({ vehiculo_activo: nuevo }).eq("id", u.id);
                      setUsuarios(prev => prev.map(x => x.id === u.id ? { ...x, vehiculo_activo: nuevo } : x));
                    }} style={{ background: u.vehiculo_activo ? "rgba(22,163,74,0.15)" : "rgba(255,255,255,0.05)", border: u.vehiculo_activo ? "none" : "1px solid rgba(255,255,255,0.08)", color: u.vehiculo_activo ? "#4ade80" : "#64748b", padding: "6px 14px", borderRadius: 8, cursor: "pointer", fontWeight: 700, fontSize: 12 }}>
                      {u.vehiculo_activo ? "🚗 Activo" : "Activar"}
                    </button>
                  ) : (
                    <span style={{ color: "#334155", fontSize: 12 }}>—</span>
                  )}
                </td>
                <td style={tdStyle}>
                  <button onClick={() => toggleActivo(u)} style={{ background: u.activo ? "rgba(22,163,74,0.15)" : "rgba(239,68,68,0.15)", border: "none", color: u.activo ? "#4ade80" : "#f87171", padding: "6px 14px", borderRadius: 8, cursor: "pointer", fontWeight: 700, fontSize: 13 }}>{u.activo ? "✅ Activo" : "❌ Inactivo"}</button>
                </td>
                <td style={tdStyle}>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button onClick={() => { setUsuarioEditando(u); setNotasTemp(u.notas_admin || ""); }} style={btnAccion}>📝</button>
<button title="Ficha completa: editar todos los datos" onClick={() => abrirFicha(u)} style={{ ...btnAccion, background: "rgba(245,158,11,0.15)", color: "#fbbf24" }}>✏️</button>
                    <button title="Eliminar usuario" disabled={eliminando === u.id} onClick={() => eliminarConConfirmacion(u)} style={{ ...btnAccion, background: "rgba(239,68,68,0.15)", color: "#f87171" }}>{eliminando === u.id ? "..." : "🗑️"}</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>

    {ficha && (
      <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 99999, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={() => setFicha(null)}>
        <div style={{ background: "#0f172a", borderRadius: 24, padding: 32, width: 720, maxWidth: "100%", maxHeight: "92vh", overflowY: "auto" as const, border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 30px 80px rgba(0,0,0,0.8)" }} onClick={e => e.stopPropagation()}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
            <h2 style={{ fontSize: 20, fontWeight: 900, margin: 0 }}>✏️ Ficha de usuario</h2>
            <button onClick={() => setFicha(null)} style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: 20 }}>✕</button>
          </div>
          <p style={{ color: "#94a3b8", fontSize: 13, margin: "0 0 16px" }}><span style={tipoBadge(ficha.tipo)}>{ficha.tipo}</span> <span style={{ marginLeft: 8 }}>Alta: {ficha.fecha_registro ? new Date(ficha.fecha_registro).toLocaleDateString("es-ES") : "-"} · ID {ficha.id.substring(0, 8)}…</span></p>
          {datosQueFaltan({ ...ficha, ...form }).length > 0 && (
            <div style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.25)", borderRadius: 10, padding: "8px 14px", marginBottom: 16 }}>
              <span style={{ color: "#fbbf24", fontSize: 13, fontWeight: 700 }}>⚠️ Falta: {datosQueFaltan({ ...ficha, ...form }).join(", ")}. Sin dirección, ciudad y código postal las agencias no pueden crear sus envíos.</span>
            </div>
          )}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {CAMPOS_FICHA.map(([k, label, col]) => (
              <label key={k} style={{ gridColumn: col === "auto" ? undefined : col, display: "flex", flexDirection: "column" as const, gap: 4, fontSize: 12, color: "#94a3b8", fontWeight: 700 }}>{label}
                <input
                  value={form[k] ?? ""}
                  onChange={e => setForm(prev => ({ ...prev, [k]: k === "codigo_postal" ? e.target.value.replace(/\D/g, "").slice(0, 5) : e.target.value }))}
                  style={{ background: "#020617", color: "white", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "10px 12px", fontSize: 14, outline: "none" }}
                />
              </label>
            ))}
            <label style={{ gridColumn: "1/-1", display: "flex", flexDirection: "column" as const, gap: 4, fontSize: 12, color: "#94a3b8", fontWeight: 700 }}>Notas internas (solo admin)
              <textarea value={form.notas_admin ?? ""} onChange={e => setForm(prev => ({ ...prev, notas_admin: e.target.value }))} style={{ background: "#020617", color: "white", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "10px 12px", fontSize: 13, outline: "none", minHeight: 70, resize: "vertical" as const }} />
            </label>
          </div>
          <p style={{ color: "#64748b", fontSize: 12, margin: "10px 0 0" }}>Cambiar el email cambia también el email con el que inicia sesión.</p>

          {msgFicha && <div style={{ background: msgFicha.ok ? "rgba(22,163,74,0.15)" : "rgba(239,68,68,0.15)", border: `1px solid ${msgFicha.ok ? "rgba(22,163,74,0.3)" : "rgba(239,68,68,0.3)"}`, color: msgFicha.ok ? "#4ade80" : "#f87171", borderRadius: 10, padding: "10px 14px", fontSize: 13, fontWeight: 700, marginTop: 14 }}>{msgFicha.texto}</div>}
          {enlacePassword && (
            <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
              <input readOnly value={enlacePassword} onFocus={e => e.target.select()} style={{ flex: 1, background: "#020617", color: "#60a5fa", border: "1px solid rgba(37,99,235,0.3)", borderRadius: 10, padding: "8px 12px", fontSize: 12, outline: "none" }} />
              <button onClick={() => { navigator.clipboard?.writeText(enlacePassword); setMsgFicha({ ok: true, texto: "Enlace copiado al portapapeles" }); }} style={{ ...btnAccion, padding: "8px 14px" }}>Copiar</button>
            </div>
          )}

          <div style={{ display: "flex", gap: 10, marginTop: 20, flexWrap: "wrap" as const }}>
            <button onClick={guardarFicha} disabled={guardandoFicha} style={{ flex: 1, minWidth: 180, background: "linear-gradient(135deg,#2563eb,#1d4ed8)", border: "none", color: "white", padding: "13px", borderRadius: 12, cursor: "pointer", fontWeight: 900, fontSize: 15, opacity: guardandoFicha ? 0.7 : 1 }}>{guardandoFicha ? "Guardando..." : "Guardar cambios"}</button>
            <button onClick={generarEnlacePassword} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#cbd5e1", padding: "13px 16px", borderRadius: 12, cursor: "pointer", fontWeight: 700, fontSize: 13 }}>🔑 Enlace nueva contraseña</button>
            <button onClick={confirmarEmail} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#cbd5e1", padding: "13px 16px", borderRadius: 12, cursor: "pointer", fontWeight: 700, fontSize: 13 }}>✉️ Verificar email</button>
            <button onClick={() => eliminarConConfirmacion(ficha)} disabled={eliminando === ficha.id} style={{ background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.3)", color: "#f87171", padding: "13px 16px", borderRadius: 12, cursor: "pointer", fontWeight: 700, fontSize: 13 }}>{eliminando === ficha.id ? "Eliminando..." : "🗑️ Eliminar usuario"}</button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}