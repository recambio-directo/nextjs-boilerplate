import { Fragment, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { tableContainer, tableStyle, thStyle, trStyle, tdStyle, kpiCard, kpiLabel, kpiNum, seccionCard, titleStyle, descStyle, btnFiltro, searchInput } from "./types";

type Datos = {
  dias: number;
  resumen: { consultas: number; usuarios: number; coste_usd: number; coste_medio_usd: number; piezas_mostradas: number; porcentaje_con_piezas: number; errores: number; segundos_medios: number };
  porUsuario: { user_id: string; nombre: string; tipo: string; provincia: string; consultas: number; piezas: number; coste_usd: number; ultima: string }[];
  sinResultado: { id: number; nombre: string; pregunta: string; vehiculo: string | null; created_at: string }[];
  ultimas: { id: number; nombre: string; pregunta: string; respuesta: string | null; vehiculo: string | null; herramientas: string[] | null; piezas: number; coste_usd: number; segundos: number | null; error: string | null; created_at: string }[];
};

const PERIODOS = [
  { dias: 1, label: "Hoy" },
  { dias: 7, label: "7 días" },
  { dias: 30, label: "30 días" },
  { dias: 90, label: "90 días" },
];

const usd = (n: number, dec = 2) => `${(Number(n) || 0).toLocaleString("es-ES", { minimumFractionDigits: dec, maximumFractionDigits: dec })} $`;
const fecha = (s: string) => new Date(s).toLocaleString("es-ES", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });

export default function SeccionAsistente() {
  const [dias, setDias] = useState(7);
  const [datos, setDatos] = useState<Datos | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [abierta, setAbierta] = useState<number | null>(null);
  const [busqueda, setBusqueda] = useState("");

  useEffect(() => { cargar(dias); }, [dias]);

  async function cargar(d: number) {
    setCargando(true);
    setError("");
    try {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) { setError("Sesión caducada: vuelve a iniciar sesión"); return; }
      const res = await fetch(`/api/admin/asistente?dias=${d}`, { headers: { Authorization: `Bearer ${token}` } });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json) { setError(json?.error || `Error ${res.status}`); return; }
      setDatos(json);
    } catch (e: any) {
      setError(e?.message || "Error de conexión");
    } finally {
      setCargando(false);
    }
  }

  const r = datos?.resumen;
  const filtro = busqueda.trim().toLowerCase();
  const ultimas = (datos?.ultimas || []).filter((c) => !filtro || c.nombre.toLowerCase().includes(filtro) || c.pregunta.toLowerCase().includes(filtro));

  return (
    <div>
      <h2 style={titleStyle}>ASISTENTE</h2>
      <p style={descStyle}>Uso y coste del asistente de recambios. El coste es estimado; el cargo real y el saldo están en la Consola de Anthropic.</p>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", marginBottom: 24 }}>
        {PERIODOS.map((p) => (
          <button key={p.dias} onClick={() => setDias(p.dias)}
            style={{ ...btnFiltro, border: "1px solid rgba(255,255,255,0.08)", background: dias === p.dias ? "#2563eb" : "rgba(255,255,255,0.04)", color: dias === p.dias ? "white" : "#cbd5e1" }}>
            {p.label}
          </button>
        ))}
        <a href="https://console.anthropic.com" target="_blank" rel="noopener noreferrer"
          style={{ ...btnFiltro, marginLeft: "auto", border: "1px solid rgba(255,255,255,0.08)", color: "#cbd5e1", textDecoration: "none" }}>
          Ver saldo en la Consola ↗
        </a>
      </div>

      {error && <div style={{ ...seccionCard, color: "#fca5a5", marginBottom: 20 }}>{error}</div>}
      {cargando && !datos && <p style={{ color: "#94a3b8" }}>Cargando…</p>}

      {r && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 14, marginBottom: 24, opacity: cargando ? 0.6 : 1 }}>
            <div style={kpiCard}><p style={kpiLabel}>CONSULTAS</p><p style={kpiNum}>{r.consultas}</p></div>
            <div style={kpiCard}><p style={kpiLabel}>USUARIOS QUE LO USAN</p><p style={kpiNum}>{r.usuarios}</p></div>
            <div style={kpiCard}><p style={kpiLabel}>COSTE ESTIMADO</p><p style={kpiNum}>{usd(r.coste_usd)}</p><p style={{ color: "#94a3b8", fontSize: 12, margin: "6px 0 0" }}>{usd(r.coste_medio_usd, 4)} por consulta</p></div>
            <div style={kpiCard}><p style={kpiLabel}>CON PIEZAS EN STOCK</p><p style={kpiNum}>{r.porcentaje_con_piezas}%</p><p style={{ color: "#94a3b8", fontSize: 12, margin: "6px 0 0" }}>{r.piezas_mostradas} piezas mostradas</p></div>
            <div style={kpiCard}><p style={kpiLabel}>TIEMPO MEDIO</p><p style={kpiNum}>{r.segundos_medios} s</p></div>
            <div style={kpiCard}><p style={kpiLabel}>ERRORES</p><p style={{ ...kpiNum, color: r.errores ? "#f87171" : "white" }}>{r.errores}</p></div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(420px, 1fr))", gap: 20, marginBottom: 24 }}>
            <div style={seccionCard}>
              <h3 style={{ fontSize: 16, fontWeight: 900, margin: "0 0 14px" }}>Quién lo usa</h3>
              {datos!.porUsuario.length === 0 ? <p style={{ color: "#94a3b8", margin: 0 }}>Sin consultas en este periodo.</p> : (
                <div style={tableContainer}>
                  <table style={tableStyle}>
                    <thead><tr><th style={thStyle}>EMPRESA</th><th style={thStyle}>CONSULTAS</th><th style={thStyle}>PIEZAS</th><th style={thStyle}>COSTE</th><th style={thStyle}>ÚLTIMA</th></tr></thead>
                    <tbody>
                      {datos!.porUsuario.slice(0, 30).map((u) => (
                        <tr key={u.user_id} style={trStyle}>
                          <td style={tdStyle}><span style={{ fontWeight: 700 }}>{u.nombre}</span><span style={{ display: "block", color: "#94a3b8", fontSize: 11 }}>{[u.tipo, u.provincia].filter(Boolean).join(" · ")}</span></td>
                          <td style={tdStyle}>{u.consultas}</td>
                          <td style={tdStyle}>{u.piezas}</td>
                          <td style={tdStyle}>{usd(u.coste_usd, 3)}</td>
                          <td style={{ ...tdStyle, color: "#94a3b8", fontSize: 12 }}>{fecha(u.ultima)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div style={seccionCard}>
              <h3 style={{ fontSize: 16, fontWeight: 900, margin: "0 0 4px" }}>Lo que piden y no encuentran</h3>
              <p style={{ color: "#94a3b8", fontSize: 12, margin: "0 0 14px" }}>Consultas sin piezas en stock. Útil para saber qué stock pedir a los proveedores.</p>
              {datos!.sinResultado.length === 0 ? <p style={{ color: "#94a3b8", margin: 0 }}>Nada en este periodo.</p> : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 420, overflowY: "auto" }}>
                  {datos!.sinResultado.map((c) => (
                    <div key={c.id} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, padding: "10px 12px" }}>
                      <p style={{ margin: 0, fontSize: 13.5 }}>{c.pregunta}</p>
                      <p style={{ margin: "4px 0 0", fontSize: 11, color: "#94a3b8" }}>{c.nombre}{c.vehiculo ? ` · ${c.vehiculo}` : ""} · {fecha(c.created_at)}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div style={seccionCard}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 14 }}>
              <h3 style={{ fontSize: 16, fontWeight: 900, margin: 0 }}>Últimas consultas</h3>
              <input value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Buscar empresa o texto…" aria-label="Buscar en las consultas" style={searchInput} />
            </div>
            <div style={tableContainer}>
              <table style={tableStyle}>
                <thead><tr><th style={thStyle}>FECHA</th><th style={thStyle}>EMPRESA</th><th style={thStyle}>CONSULTA</th><th style={thStyle}>PIEZAS</th><th style={thStyle}>COSTE</th><th style={thStyle}>TIEMPO</th></tr></thead>
                <tbody>
                  {ultimas.map((c) => (
                    <Fragment key={c.id}>
                      <tr style={{ ...trStyle, cursor: "pointer", background: abierta === c.id ? "rgba(37,99,235,0.08)" : undefined }} onClick={() => setAbierta(abierta === c.id ? null : c.id)}>
                        <td style={{ ...tdStyle, color: "#94a3b8", fontSize: 12, whiteSpace: "nowrap" }}>{fecha(c.created_at)}</td>
                        <td style={{ ...tdStyle, fontWeight: 700 }}>{c.nombre}</td>
                        <td style={{ ...tdStyle, maxWidth: 420 }}>
                          <span style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.pregunta}</span>
                          {c.error && <span style={{ display: "block", color: "#f87171", fontSize: 11 }}>Error: {c.error}</span>}
                        </td>
                        <td style={tdStyle}>{c.piezas}</td>
                        <td style={tdStyle}>{usd(c.coste_usd, 4)}</td>
                        <td style={{ ...tdStyle, color: "#94a3b8" }}>{c.segundos != null ? `${c.segundos} s` : "—"}</td>
                      </tr>
                      {abierta === c.id && (
                        <tr style={trStyle}>
                          <td colSpan={6} style={{ ...tdStyle, background: "rgba(0,0,0,0.25)" }}>
                            <p style={{ margin: "0 0 6px", fontSize: 12, color: "#94a3b8" }}>Pregunta</p>
                            <p style={{ margin: "0 0 12px", whiteSpace: "pre-wrap" }}>{c.pregunta}</p>
                            <p style={{ margin: "0 0 6px", fontSize: 12, color: "#94a3b8" }}>Respuesta</p>
                            <p style={{ margin: "0 0 12px", whiteSpace: "pre-wrap", color: "#cbd5e1" }}>{c.respuesta || "—"}</p>
                            <p style={{ margin: 0, fontSize: 12, color: "#94a3b8" }}>
                              {c.vehiculo ? `Vehículo: ${c.vehiculo} · ` : ""}Pasos: {(c.herramientas || []).join(" → ") || "ninguno"}
                            </p>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>
            {ultimas.length === 0 && <p style={{ color: "#94a3b8", margin: "12px 0 0" }}>Sin consultas.</p>}
          </div>
        </>
      )}
    </div>
  );
}
