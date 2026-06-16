import { Usuario, kpiCard, kpiLabel, kpiNum, seccionCard, tableContainer, tableStyle, thStyle, trStyle, tdStyle, btnAccion } from "./types";

type Props = {
  usuarios: Usuario[];
  ftpProveedorId: string;
  setFtpProveedorId: (id: string) => void;
  ftpPassword: string;
  setFtpPassword: (p: string) => void;
  ftpTipoReferencias: "OEM" | "IAM";
  setFtpTipoReferencias: (t: "OEM"|"IAM") => void;
  ftpCreando: boolean;
  ftpResultado: { usuario: string; password: string; empresa: string } | null;
  setFtpResultado: (r: any) => void;
  crearUsuarioFTP: () => void;
  descargarCredencialesFTP: (u: string, p: string, e: string) => void;
};

export default function SeccionFTP({ usuarios, ftpProveedorId, setFtpProveedorId, ftpPassword, setFtpPassword, ftpTipoReferencias, setFtpTipoReferencias, ftpCreando, ftpResultado, setFtpResultado, crearUsuarioFTP, descargarCredencialesFTP }: Props) {
  const proveedoresFTP = usuarios.filter(u => u.tipo === "proveedor");
  const ftpActivos = usuarios.filter(u => u.ftp_activo);

  return (
    <div>
      <h1 style={{ fontSize: 56, fontWeight: 900, lineHeight: 1, marginBottom: 12 }}>FTP SYNC</h1>
      <p style={{ color: "#94a3b8", fontSize: 18, marginBottom: 36 }}>Crea accesos FTP para que los proveedores suban su catálogo automáticamente.</p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 20, marginBottom: 32 }}>
        <div style={kpiCard}><p style={kpiLabel}>PROVEEDORES TOTALES</p><h2 style={{ ...kpiNum, color: "#60a5fa" }}>{proveedoresFTP.length}</h2></div>
        <div style={kpiCard}><p style={kpiLabel}>CON FTP ACTIVO</p><h2 style={{ ...kpiNum, color: "#4ade80" }}>{ftpActivos.length}</h2></div>
        <div style={kpiCard}><p style={kpiLabel}>SIN FTP</p><h2 style={{ ...kpiNum, color: "#f59e0b" }}>{proveedoresFTP.length - ftpActivos.length}</h2></div>
      </div>
      <div style={{ ...seccionCard, border: "1px solid rgba(139,92,246,0.3)", marginBottom: 28 }}>
        <h2 style={{ fontSize: 22, fontWeight: 900, marginBottom: 6 }}>➕ Crear acceso FTP</h2>
        <p style={{ color: "#94a3b8", fontSize: 14, marginBottom: 24 }}>Selecciona el proveedor y asigna una contraseña. El usuario FTP se genera automáticamente.</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
          <div><p style={{ color: "#94a3b8", fontSize: 13, marginBottom: 8 }}>Proveedor</p>
            <select value={ftpProveedorId} onChange={e => setFtpProveedorId(e.target.value)} style={{ width: "100%", background: "#0f172a", color: "white", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, padding: "14px 16px", fontSize: 14, outline: "none" }}>
              <option value="">— Selecciona proveedor —</option>
              {proveedoresFTP.map(u => (<option key={u.id} value={u.id}>{u.nombre_empresa || u.email} {u.ftp_activo ? "✓ (ya tiene FTP)" : ""}</option>))}
            </select>
          </div>
          <div><p style={{ color: "#94a3b8", fontSize: 13, marginBottom: 8 }}>Contraseña FTP</p>
            <input type="text" placeholder="Mínimo 8 caracteres" value={ftpPassword} onChange={e => setFtpPassword(e.target.value)} style={{ width: "100%", background: "#0f172a", color: "white", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, padding: "14px 16px", fontSize: 14, outline: "none", boxSizing: "border-box" as const }} />
          </div>
        </div>
        <div style={{ marginBottom: 20 }}>
          <p style={{ color: "#94a3b8", fontSize: 13, fontWeight: 700, marginBottom: 10 }}>TIPO DE REFERENCIAS</p>
          <div style={{ display: "flex", gap: 10 }}>
            {(["IAM", "OEM"] as const).map(t => (<button key={t} onClick={() => setFtpTipoReferencias(t)} style={{ flex: 1, padding: "12px 20px", borderRadius: 12, fontWeight: 700, cursor: "pointer", fontSize: 14, border: "none", background: ftpTipoReferencias===t ? (t==="OEM" ? "rgba(37,99,235,0.3)" : "rgba(139,92,246,0.3)") : "rgba(255,255,255,0.05)", color: ftpTipoReferencias===t ? (t==="OEM" ? "#60a5fa" : "#a78bfa") : "#94a3b8", outline: ftpTipoReferencias===t ? ("2px solid "+(t==="OEM" ? "#2563eb" : "#7c3aed")) : "none" }}>{t==="OEM" ? "🔵 OEM — Servicio oficial / Original" : "🟣 IAM — Distribuidor / Aftermarket"}</button>))}
          </div>
          <p style={{ color: "#64748b", fontSize: 12, marginTop: 6 }}>{ftpTipoReferencias==="OEM" ? "Las referencias se importarán como originales de fabricante" : "Las referencias se importarán como aftermarket / equivalentes"}</p>
        </div>
        {ftpProveedorId && (<div style={{ background: "rgba(37,99,235,0.08)", border: "1px solid rgba(37,99,235,0.2)", borderRadius: 10, padding: "10px 14px", marginBottom: 16 }}><p style={{ color: "#60a5fa", fontSize: 13, margin: 0 }}>Usuario que se creará: <strong>ftp_{(usuarios.find(u => u.id===ftpProveedorId)?.nombre_empresa||"").toLowerCase().replace(/[^a-z0-9]/g,"_").substring(0,20)}</strong></p></div>)}
        <button onClick={crearUsuarioFTP} disabled={ftpCreando || !ftpProveedorId || ftpPassword.length < 8} style={{ background: (!ftpProveedorId||ftpPassword.length<8) ? "rgba(255,255,255,0.05)" : "linear-gradient(135deg,#7c3aed,#6d28d9)", border: "none", color: (!ftpProveedorId||ftpPassword.length<8) ? "#64748b" : "white", padding: "16px 32px", borderRadius: 14, fontWeight: 900, cursor: ftpCreando||!ftpProveedorId||ftpPassword.length<8 ? "not-allowed" : "pointer", fontSize: 15, opacity: ftpCreando ? 0.7 : 1 }}>{ftpCreando ? "⏳ Creando usuario en servidor..." : "🔄 Crear acceso FTP"}</button>
      </div>
      {ftpResultado && (
        <div style={{ background: "rgba(22,163,74,0.1)", border: "1px solid rgba(22,163,74,0.3)", borderRadius: 20, padding: 28, marginBottom: 28 }}>
          <h3 style={{ color: "#4ade80", fontWeight: 900, fontSize: 18, marginBottom: 16 }}>✅ Acceso FTP creado para {ftpResultado.empresa}</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 20 }}>
            {[{label:"HOST",value:"168.231.83.226"},{label:"PUERTO",value:"21"},{label:"USUARIO",value:ftpResultado.usuario},{label:"CONTRASEÑA",value:ftpResultado.password}].map(({label,value}) => (<div key={label} style={{ background: "rgba(0,0,0,0.2)", borderRadius: 12, padding: 16 }}><p style={{ color: "#94a3b8", fontSize: 11, fontWeight: 700, marginBottom: 6 }}>{label}</p><p style={{ color: "white", fontWeight: 800, fontSize: 14, fontFamily: "monospace", margin: 0 }}>{value}</p></div>))}
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <button onClick={() => descargarCredencialesFTP(ftpResultado.usuario, ftpResultado.password, ftpResultado.empresa)} style={{ background: "linear-gradient(135deg,#16a34a,#15803d)", border: "none", color: "white", padding: "12px 24px", borderRadius: 12, fontWeight: 700, cursor: "pointer", fontSize: 14 }}>⬇️ Descargar credenciales TXT</button>
            <button onClick={() => { navigator.clipboard.writeText(`Host: 168.231.83.226 | Puerto: 21 | Usuario: ${ftpResultado.usuario} | Password: ${ftpResultado.password} | Carpeta: /catalogo`); alert("Copiado al portapapeles"); }} style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", color: "white", padding: "12px 24px", borderRadius: 12, fontWeight: 700, cursor: "pointer", fontSize: 14 }}>📋 Copiar al portapapeles</button>
            <button onClick={() => setFtpResultado(null)} style={{ background: "transparent", border: "none", color: "#94a3b8", padding: "12px 16px", borderRadius: 12, cursor: "pointer", fontWeight: 700, fontSize: 14 }}>✕ Cerrar</button>
          </div>
        </div>
      )}
      <div style={seccionCard}>
        <h2 style={{ fontSize: 20, fontWeight: 900, marginBottom: 20 }}>📋 Proveedores con FTP activo ({ftpActivos.length})</h2>
        {ftpActivos.length === 0 ? (<div style={{ textAlign: "center", padding: "40px 0", color: "#94a3b8" }}><p style={{ fontSize: 40, marginBottom: 12 }}>🔄</p><p>Ningún proveedor tiene FTP activo todavía</p></div>) : (
          <div style={tableContainer}><table style={tableStyle}><thead><tr>{["EMPRESA","EMAIL","USUARIO FTP","CARPETA","ACCIONES"].map(h => <th key={h} style={thStyle}>{h}</th>)}</tr></thead><tbody>{ftpActivos.map(u => (<tr key={u.id} style={trStyle}><td style={tdStyle}><strong>{u.nombre_empresa||"-"}</strong></td><td style={{ ...tdStyle, color: "#94a3b8", fontSize: 13 }}>{u.email}</td><td style={tdStyle}><span style={{ fontFamily: "monospace", color: "#a78bfa", fontWeight: 700 }}>{u.ftp_usuario||"-"}</span></td><td style={{ ...tdStyle, color: "#94a3b8", fontSize: 13, fontFamily: "monospace" }}>/catalogo</td><td style={tdStyle}><button onClick={() => { setFtpProveedorId(u.id); window.scrollTo(0,0); }} style={{ ...btnAccion, fontSize: 12 }}>🔑 Regenerar</button></td></tr>))}</tbody></table></div>
        )}
      </div>
      {proveedoresFTP.filter(u => !u.ftp_activo).length > 0 && (
        <div style={{ ...seccionCard, marginTop: 20, border: "1px solid rgba(245,158,11,0.2)" }}>
          <h2 style={{ fontSize: 18, fontWeight: 900, marginBottom: 16, color: "#fbbf24" }}>⚠️ Proveedores sin FTP ({proveedoresFTP.filter(u => !u.ftp_activo).length})</h2>
          <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 10 }}>
            {proveedoresFTP.filter(u => !u.ftp_activo).map(u => (<div key={u.id} style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: 10, padding: "10px 16px", display: "flex", alignItems: "center", gap: 12 }}><span style={{ fontWeight: 700, fontSize: 14 }}>{u.nombre_empresa||u.email}</span><button onClick={() => { setFtpProveedorId(u.id); window.scrollTo(0,0); }} style={{ background: "rgba(245,158,11,0.2)", border: "none", color: "#fbbf24", padding: "4px 10px", borderRadius: 6, cursor: "pointer", fontWeight: 700, fontSize: 12 }}>+ Activar FTP</button></div>))}
          </div>
        </div>
      )}
    </div>
  );
}