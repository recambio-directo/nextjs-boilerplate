import { useState } from "react";
import { kpiCard, kpiLabel, kpiNum, seccionCard, tableContainer, tableStyle, thStyle, trStyle, tdStyle } from "./types";

const CRONS = [
  { agencia: "MRW",              endpoint: "/api/mrw/cron",              trackingEndpoint: "/api/mrw/tracking" },
  { agencia: "NACEX",            endpoint: "/api/nacex/cron",            trackingEndpoint: "/api/nacex/tracking" },
  { agencia: "SEUR",             endpoint: "/api/seur/cron",             trackingEndpoint: "/api/seur/tracking" },
  { agencia: "CTT Express",      endpoint: "/api/ctt/cron",              trackingEndpoint: "/api/ctt/tracking" },
  { agencia: "GLS",              endpoint: "/api/gls/cron",              trackingEndpoint: "/api/gls/tracking" },
  { agencia: "Correos Express",  endpoint: "/api/correos-express/cron",  trackingEndpoint: "/api/correos-express/tracking" },
  { agencia: "DHL",              endpoint: "/api/dhl/cron",              trackingEndpoint: "/api/dhl/tracking" },
  { agencia: "Devoluciones",     endpoint: "/api/devolucion/cron",       trackingEndpoint: null },
];

const FTP_ENDPOINT = "/api/ftp/procesar?admin=1";

type CronResult = { agencia: string; status: "ok" | "error" | "running"; message: string; time?: number };

export default function SeccionSistema() {
  const [cronResults, setCronResults] = useState<Record<string, CronResult>>({});
  const [ejecutandoTodos, setEjecutandoTodos] = useState(false);
  const [ftpResult, setFtpResult] = useState<{ status: string; message: string } | null>(null);
  const [healthCheck, setHealthCheck] = useState<{ supabase: string; api: string; checked: boolean }>({ supabase: "pending", api: "pending", checked: false });
  const [checkingHealth, setCheckingHealth] = useState(false);

  async function ejecutarCron(cron: typeof CRONS[0]) {
    setCronResults(prev => ({ ...prev, [cron.agencia]: { agencia: cron.agencia, status: "running", message: "Ejecutando..." } }));
    const start = Date.now();
    try {
      const res = await fetch(cron.endpoint, { method: "GET" });
      const data = await res.json().catch(() => ({}));
      const elapsed = Date.now() - start;
      if (res.ok) {
        setCronResults(prev => ({ ...prev, [cron.agencia]: { agencia: cron.agencia, status: "ok", message: data.message || data.resultado || `OK (${res.status})`, time: elapsed } }));
      } else {
        setCronResults(prev => ({ ...prev, [cron.agencia]: { agencia: cron.agencia, status: "error", message: data.error || `HTTP ${res.status}`, time: elapsed } }));
      }
    } catch (e: any) {
      setCronResults(prev => ({ ...prev, [cron.agencia]: { agencia: cron.agencia, status: "error", message: e.message || "Error de conexión" } }));
    }
  }

  async function ejecutarTodosCrons() {
    setEjecutandoTodos(true);
    for (const cron of CRONS) {
      await ejecutarCron(cron);
    }
    setEjecutandoTodos(false);
  }

  async function ejecutarFTP() {
    setFtpResult({ status: "running", message: "Procesando catálogos FTP..." });
    try {
      const res = await fetch(FTP_ENDPOINT);
      const data = await res.json().catch(() => ({}));
      setFtpResult({ status: res.ok ? "ok" : "error", message: data.message || data.error || `HTTP ${res.status}` });
    } catch (e: any) {
      setFtpResult({ status: "error", message: e.message });
    }
  }

  async function checkHealth() {
    setCheckingHealth(true);
    let supabaseStatus = "error";
    let apiStatus = "error";
    try {
      const { supabase } = await import("../lib/supabase");
      const { data, error } = await supabase.from("usuarios").select("id").limit(1);
      supabaseStatus = error ? "error" : "ok";
    } catch { supabaseStatus = "error"; }
    try {
      const res = await fetch("/api/health", { method: "GET" }).catch(() => null);
      apiStatus = res && res.ok ? "ok" : (res ? "warning" : "error");
    } catch { apiStatus = "error"; }
    setHealthCheck({ supabase: supabaseStatus, api: apiStatus, checked: true });
    setCheckingHealth(false);
  }

  const cronsOk = Object.values(cronResults).filter(r => r.status === "ok").length;
  const cronsError = Object.values(cronResults).filter(r => r.status === "error").length;
  const cronsRunning = Object.values(cronResults).filter(r => r.status === "running").length;

  return (
    <div>
      <h1 style={{ fontSize: 56, fontWeight: 900, lineHeight: 1, marginBottom: 12 }}>SISTEMA</h1>
      <p style={{ color: "#94a3b8", fontSize: 18, marginBottom: 36 }}>Monitorización de crons, estado del sistema y acciones de mantenimiento.</p>

      {/* HEALTH CHECK */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 20, marginBottom: 32 }}>
        <div style={kpiCard}>
          <p style={kpiLabel}>SUPABASE</p>
          <h2 style={{ ...kpiNum, fontSize: 28, color: healthCheck.supabase === "ok" ? "#4ade80" : healthCheck.supabase === "error" ? "#f87171" : "#94a3b8" }}>
            {healthCheck.checked ? (healthCheck.supabase === "ok" ? "✅ OK" : "❌ Error") : "— Sin verificar"}
          </h2>
        </div>
        <div style={kpiCard}>
          <p style={kpiLabel}>API / VERCEL</p>
          <h2 style={{ ...kpiNum, fontSize: 28, color: healthCheck.api === "ok" ? "#4ade80" : healthCheck.api === "error" ? "#f87171" : healthCheck.api === "warning" ? "#fbbf24" : "#94a3b8" }}>
            {healthCheck.checked ? (healthCheck.api === "ok" ? "✅ OK" : healthCheck.api === "warning" ? "⚠️ Warning" : "❌ Error") : "— Sin verificar"}
          </h2>
        </div>
        <div style={{ ...kpiCard, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center" }}>
          <button onClick={checkHealth} disabled={checkingHealth} style={{ background: "linear-gradient(135deg,#2563eb,#1d4ed8)", border: "none", color: "white", padding: "14px 28px", borderRadius: 14, fontWeight: 900, cursor: checkingHealth ? "not-allowed" : "pointer", fontSize: 15, opacity: checkingHealth ? 0.7 : 1 }}>
            {checkingHealth ? "⏳ Verificando..." : "🔍 Health Check"}
          </button>
        </div>
      </div>

      {/* CRONS */}
      <div style={seccionCard}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 900 }}>⏱️ Crons de agencias de transporte</h2>
            <p style={{ color: "#94a3b8", fontSize: 13, marginTop: 4 }}>
              Horario automático: <strong style={{ color: "#60a5fa" }}>8:00, 13:00, 17:00</strong> ·
              {cronsOk > 0 && <span style={{ color: "#4ade80", marginLeft: 8 }}>✅ {cronsOk} OK</span>}
              {cronsError > 0 && <span style={{ color: "#f87171", marginLeft: 8 }}>❌ {cronsError} Error</span>}
              {cronsRunning > 0 && <span style={{ color: "#fbbf24", marginLeft: 8 }}>⏳ {cronsRunning} Ejecutando</span>}
            </p>
          </div>
          <button onClick={ejecutarTodosCrons} disabled={ejecutandoTodos} style={{ background: "linear-gradient(135deg,#dc2626,#991b1b)", border: "none", color: "white", padding: "14px 24px", borderRadius: 14, fontWeight: 900, cursor: ejecutandoTodos ? "not-allowed" : "pointer", fontSize: 15, opacity: ejecutandoTodos ? 0.7 : 1 }}>
            {ejecutandoTodos ? "⏳ Ejecutando todos..." : "🚀 Ejecutar TODOS los crons"}
          </button>
        </div>
        <div style={tableContainer}>
          <table style={tableStyle}>
            <thead><tr>{["AGENCIA", "ENDPOINT", "ESTADO", "MENSAJE", "TIEMPO", "ACCIÓN"].map(h => <th key={h} style={thStyle}>{h}</th>)}</tr></thead>
            <tbody>
              {CRONS.map(cron => {
                const result = cronResults[cron.agencia];
                return (
                  <tr key={cron.agencia} style={trStyle}>
                    <td style={tdStyle}><strong style={{ color: "white" }}>{cron.agencia}</strong></td>
                    <td style={{ ...tdStyle, fontFamily: "monospace", fontSize: 12, color: "#94a3b8" }}>{cron.endpoint}</td>
                    <td style={tdStyle}>
                      {result ? (
                        <span style={{
                          background: result.status === "ok" ? "rgba(22,163,74,0.2)" : result.status === "error" ? "rgba(239,68,68,0.2)" : "rgba(245,158,11,0.2)",
                          color: result.status === "ok" ? "#4ade80" : result.status === "error" ? "#f87171" : "#fbbf24",
                          padding: "4px 10px", borderRadius: 999, fontSize: 12, fontWeight: 700,
                        }}>
                          {result.status === "ok" ? "✅ OK" : result.status === "error" ? "❌ Error" : "⏳ Running"}
                        </span>
                      ) : (
                        <span style={{ color: "#475569", fontSize: 12 }}>Sin ejecutar</span>
                      )}
                    </td>
                    <td style={{ ...tdStyle, color: "#94a3b8", fontSize: 13, maxWidth: 300, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>
                      {result?.message || "—"}
                    </td>
                    <td style={{ ...tdStyle, color: "#94a3b8", fontSize: 13 }}>
                      {result?.time ? `${(result.time / 1000).toFixed(1)}s` : "—"}
                    </td>
                    <td style={tdStyle}>
                      <button onClick={() => ejecutarCron(cron)} disabled={result?.status === "running"} style={{
                        background: result?.status === "running" ? "rgba(255,255,255,0.05)" : "rgba(37,99,235,0.15)",
                        border: "1px solid rgba(37,99,235,0.3)", color: "#60a5fa", padding: "6px 14px",
                        borderRadius: 8, cursor: result?.status === "running" ? "not-allowed" : "pointer", fontWeight: 700, fontSize: 12,
                      }}>
                        {result?.status === "running" ? "..." : "▶ Ejecutar"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* FTP */}
      <div style={{ ...seccionCard, marginTop: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 900 }}>🔄 Procesamiento FTP de catálogos</h2>
            <p style={{ color: "#94a3b8", fontSize: 13, marginTop: 4 }}>Ejecuta el procesamiento de todos los catálogos FTP pendientes.</p>
          </div>
          <button onClick={ejecutarFTP} disabled={ftpResult?.status === "running"} style={{ background: "linear-gradient(135deg,#7c3aed,#6d28d9)", border: "none", color: "white", padding: "14px 24px", borderRadius: 14, fontWeight: 900, cursor: ftpResult?.status === "running" ? "not-allowed" : "pointer", fontSize: 15 }}>
            {ftpResult?.status === "running" ? "⏳ Procesando..." : "🔄 Procesar catálogos FTP"}
          </button>
        </div>
        {ftpResult && (
          <div style={{
            background: ftpResult.status === "ok" ? "rgba(22,163,74,0.1)" : ftpResult.status === "error" ? "rgba(239,68,68,0.1)" : "rgba(245,158,11,0.1)",
            border: `1px solid ${ftpResult.status === "ok" ? "rgba(22,163,74,0.3)" : ftpResult.status === "error" ? "rgba(239,68,68,0.3)" : "rgba(245,158,11,0.3)"}`,
            borderRadius: 12, padding: "12px 18px", fontSize: 14, fontWeight: 700,
            color: ftpResult.status === "ok" ? "#4ade80" : ftpResult.status === "error" ? "#f87171" : "#fbbf24",
          }}>
            {ftpResult.message}
          </div>
        )}
      </div>

      {/* INFO BOX */}
      <div style={{ marginTop: 24, background: "rgba(37,99,235,0.06)", border: "1px solid rgba(37,99,235,0.15)", borderRadius: 16, padding: "20px 24px" }}>
        <h3 style={{ fontWeight: 800, fontSize: 16, marginBottom: 12, color: "#60a5fa" }}>ℹ️ Información del sistema</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, fontSize: 13, color: "#94a3b8" }}>
          <div>
            <p><strong style={{ color: "white" }}>Crons automáticos:</strong> 3 veces/día (8:00, 13:00, 17:00)</p>
            <p><strong style={{ color: "white" }}>Agencias integradas:</strong> MRW, NACEX, SEUR, CTT, GLS, Correos Express, DHL</p>
            <p><strong style={{ color: "white" }}>FTP Server:</strong> 168.231.83.226:21</p>
          </div>
          <div>
            <p><strong style={{ color: "white" }}>Hosting:</strong> Vercel (Next.js)</p>
            <p><strong style={{ color: "white" }}>Base de datos:</strong> Supabase (PostgreSQL)</p>
            <p><strong style={{ color: "white" }}>Suscripción:</strong> 25€/mes + FTP 10€ + portes RD Pago</p>
          </div>
        </div>
      </div>
    </div>
  );
}
