"use client";

import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { Usuario, kpiCard, kpiLabel, kpiNum, seccionCard, tableContainer, tableStyle, thStyle, trStyle, tdStyle, btnAccion, titleStyle, descStyle } from "./types";

type Props = {
  usuarios: Usuario[];
};

type ApiKeyInfo = {
  id: string;
  proveedor_id: string;
  nombre: string;
  activa: boolean;
  creado_en: string;
  ultimo_uso: string | null;
  total_peticiones: number;
};

export default function SeccionAPI({ usuarios }: Props) {
  const [proveedorId, setProveedorId] = useState("");
  const [generando, setGenerando] = useState(false);
  const [resultado, setResultado] = useState<{ api_key: string; empresa: string } | null>(null);
  const [keysActivas, setKeysActivas] = useState<ApiKeyInfo[]>([]);
  const [cargando, setCargando] = useState(true);

  const proveedores = usuarios.filter(u => u.tipo === "proveedor");

  useEffect(() => {
    cargarKeys();
  }, []);

  async function cargarKeys() {
    setCargando(true);
    const { data } = await (supabase
      .from("api_keys_proveedores") as any)
      .select("id, proveedor_id, nombre, activa, creado_en, ultimo_uso, total_peticiones")
      .eq("activa", true)
      .order("creado_en", { ascending: false });
    setKeysActivas((data as ApiKeyInfo[]) || []);
    setCargando(false);
  }

  async function generarKey() {
    if (!proveedorId) return;
    setGenerando(true);
    setResultado(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch("/api/admin/generar-api-key", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ proveedorId }),
      });
      const data = await res.json();
      if (data.ok) {
        setResultado({ api_key: data.api_key, empresa: data.empresa });
        setProveedorId("");
        cargarKeys();
      } else {
        alert("Error: " + data.error);
      }
    } catch {
      alert("Error de conexión");
    }
    setGenerando(false);
  }

  async function revocarKey(keyId: string) {
    if (!confirm("¿Revocar esta API key? El proveedor dejará de poder usar la API.")) return;
    await (supabase
      .from("api_keys_proveedores") as any)
      .update({ activa: false })
      .eq("id", keyId);
    cargarKeys();
  }

  function descargarCredenciales(apiKey: string, empresa: string) {
    const contenido = `CREDENCIALES API STOCK — RECAMBIO DIRECTO
=============================================
Empresa: ${empresa}
Fecha: ${new Date().toLocaleDateString("es-ES")}

URL Base: https://www.recambio-directo.com/api/v1
API Key: ${apiKey}

ENDPOINTS DISPONIBLES:
─────────────────────
1. Comprobar conexión:
   GET /api/v1/health
   Header: X-API-Key: ${apiKey}

2. Ver tu stock:
   GET /api/v1/stock
   Header: X-API-Key: ${apiKey}

3. Actualizar stock de una referencia:
   PUT /api/v1/stock/{referencia}
   Header: X-API-Key: ${apiKey}
   Body: {"cantidad": 5, "precio_neto": 12.50}

4. Actualización masiva:
   POST /api/v1/stock/bulk
   Header: X-API-Key: ${apiKey}
   Body: {
     "modo": "parcial",
     "referencias": [
       {"referencia": "ABC123", "cantidad": 10},
       {"referencia": "DEF456", "cantidad": 0}
     ]
   }

5. Eliminar referencia:
   DELETE /api/v1/stock/{referencia}
   Header: X-API-Key: ${apiKey}

NOTAS:
- Todas las peticiones necesitan la cabecera X-API-Key
- Las cantidades deben ser números enteros >= 0
- Modo "completo" en bulk pone a 0 las refs no enviadas
- Máximo 5000 referencias por llamada bulk

Soporte: info@recambio-directo.com
=============================================`;
    const blob = new Blob([contenido], { type: "text/plain;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `credenciales-api-${empresa.replace(/\s+/g, "-").toLowerCase()}.txt`;
    a.click();
  }

  function copiarAlPortapapeles(apiKey: string, empresa: string) {
    const texto = `API Stock Recambio Directo — ${empresa}\nURL: https://www.recambio-directo.com/api/v1\nAPI Key: ${apiKey}\nDocumentación: Incluida en el archivo de credenciales`;
    navigator.clipboard.writeText(texto);
    alert("Copiado al portapapeles");
  }

  function getNombreProveedor(provId: string) {
    const u = usuarios.find(u => u.id === provId);
    return u?.nombre_empresa || u?.email || provId.substring(0, 8) + "...";
  }

  return (
    <div>
      <h1 style={titleStyle}>API STOCK</h1>
      <p style={descStyle}>Genera credenciales API para que los proveedores sincronicen su stock desde sus ERPs.</p>

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 20, marginBottom: 32 }}>
        <div style={kpiCard}>
          <p style={kpiLabel}>PROVEEDORES TOTALES</p>
          <h2 style={{ ...kpiNum, color: "#60a5fa" }}>{proveedores.length}</h2>
        </div>
        <div style={kpiCard}>
          <p style={kpiLabel}>CON API ACTIVA</p>
          <h2 style={{ ...kpiNum, color: "#4ade80" }}>{keysActivas.length}</h2>
        </div>
        <div style={kpiCard}>
          <p style={kpiLabel}>PETICIONES TOTALES</p>
          <h2 style={{ ...kpiNum, color: "#a78bfa" }}>{keysActivas.reduce((sum, k) => sum + (k.total_peticiones || 0), 0)}</h2>
        </div>
      </div>

      {/* Formulario generar key */}
      <div style={{ ...seccionCard, border: "1px solid rgba(234,179,8,0.3)", marginBottom: 28 }}>
        <h2 style={{ fontSize: 22, fontWeight: 900, marginBottom: 6 }}>🔑 Generar API Key</h2>
        <p style={{ color: "#94a3b8", fontSize: 14, marginBottom: 24 }}>
          Selecciona el proveedor. Se generará una clave única que podrás enviarle junto con las instrucciones.
          {" "}Si el proveedor ya tiene una key activa, la anterior se desactivará automáticamente.
        </p>
        <div style={{ marginBottom: 20 }}>
          <p style={{ color: "#94a3b8", fontSize: 13, marginBottom: 8 }}>Proveedor</p>
          <select
            value={proveedorId}
            onChange={e => setProveedorId(e.target.value)}
            style={{
              width: "100%", maxWidth: 500, background: "#0f172a", color: "white",
              border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12,
              padding: "14px 16px", fontSize: 14, outline: "none",
            }}
          >
            <option value="">— Selecciona proveedor —</option>
            {proveedores.map(u => {
              const tieneKey = keysActivas.some(k => k.proveedor_id === u.id);
              return (
                <option key={u.id} value={u.id}>
                  {u.nombre_empresa || u.email} {tieneKey ? "✓ (ya tiene API)" : ""}
                </option>
              );
            })}
          </select>
        </div>
        <button
          onClick={generarKey}
          disabled={generando || !proveedorId}
          style={{
            background: !proveedorId ? "rgba(255,255,255,0.05)" : "linear-gradient(135deg,#eab308,#ca8a04)",
            border: "none",
            color: !proveedorId ? "#64748b" : "#000",
            padding: "16px 32px", borderRadius: 14, fontWeight: 900,
            cursor: generando || !proveedorId ? "not-allowed" : "pointer",
            fontSize: 15, opacity: generando ? 0.7 : 1,
          }}
        >
          {generando ? "⏳ Generando..." : "🔑 Generar API Key"}
        </button>
      </div>

      {/* Resultado de key generada */}
      {resultado && (
        <div style={{
          background: "rgba(22,163,74,0.1)", border: "1px solid rgba(22,163,74,0.3)",
          borderRadius: 20, padding: 28, marginBottom: 28,
        }}>
          <h3 style={{ color: "#4ade80", fontWeight: 900, fontSize: 18, marginBottom: 16 }}>
            ✅ API Key generada para {resultado.empresa}
          </h3>
          <div style={{
            background: "rgba(0,0,0,0.3)", borderRadius: 12, padding: 20, marginBottom: 20,
            border: "1px solid rgba(74,222,128,0.2)",
          }}>
            <p style={{ color: "#94a3b8", fontSize: 11, fontWeight: 700, marginBottom: 8 }}>API KEY (cópiala ahora, no se volverá a mostrar)</p>
            <p style={{ color: "#4ade80", fontWeight: 800, fontSize: 16, fontFamily: "monospace", margin: 0, wordBreak: "break-all" as const }}>
              {resultado.api_key}
            </p>
          </div>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" as const }}>
            <button
              onClick={() => descargarCredenciales(resultado.api_key, resultado.empresa)}
              style={{
                background: "linear-gradient(135deg,#16a34a,#15803d)", border: "none",
                color: "white", padding: "12px 24px", borderRadius: 12,
                fontWeight: 700, cursor: "pointer", fontSize: 14,
              }}
            >
              ⬇️ Descargar credenciales TXT
            </button>
            <button
              onClick={() => copiarAlPortapapeles(resultado.api_key, resultado.empresa)}
              style={{
                background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)",
                color: "white", padding: "12px 24px", borderRadius: 12,
                fontWeight: 700, cursor: "pointer", fontSize: 14,
              }}
            >
              📋 Copiar al portapapeles
            </button>
            <button
              onClick={() => setResultado(null)}
              style={{
                background: "transparent", border: "none", color: "#94a3b8",
                padding: "12px 16px", borderRadius: 12, cursor: "pointer",
                fontWeight: 700, fontSize: 14,
              }}
            >
              ✕ Cerrar
            </button>
          </div>
        </div>
      )}

      {/* Tabla de keys activas */}
      <div style={seccionCard}>
        <h2 style={{ fontSize: 20, fontWeight: 900, marginBottom: 20 }}>
          📋 Proveedores con API activa ({keysActivas.length})
        </h2>
        {cargando ? (
          <p style={{ color: "#94a3b8", textAlign: "center", padding: 40 }}>Cargando...</p>
        ) : keysActivas.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 0", color: "#94a3b8" }}>
            <p style={{ fontSize: 40, marginBottom: 12 }}>🔑</p>
            <p>Ningún proveedor tiene API activa todavía</p>
          </div>
        ) : (
          <div style={tableContainer}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  {["EMPRESA", "NOMBRE KEY", "CREADA", "ÚLTIMO USO", "PETICIONES", "ACCIONES"].map(h => (
                    <th key={h} style={thStyle}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {keysActivas.map(k => (
                  <tr key={k.id} style={trStyle}>
                    <td style={tdStyle}><strong>{getNombreProveedor(k.proveedor_id)}</strong></td>
                    <td style={{ ...tdStyle, color: "#94a3b8", fontSize: 13 }}>{k.nombre || "-"}</td>
                    <td style={tdStyle}>
                      <span style={{ fontSize: 12, color: "#60a5fa" }}>
                        {k.creado_en ? new Date(k.creado_en).toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "2-digit" }) : "-"}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      {k.ultimo_uso ? (
                        <span style={{ fontSize: 12, color: "#4ade80" }}>
                          {new Date(k.ultimo_uso).toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" })}
                        </span>
                      ) : (
                        <span style={{ color: "#475569", fontSize: 12 }}>Nunca</span>
                      )}
                    </td>
                    <td style={tdStyle}>
                      <span style={{
                        background: "rgba(167,139,250,0.15)", color: "#a78bfa",
                        padding: "3px 10px", borderRadius: 999, fontSize: 12, fontWeight: 700,
                      }}>
                        {k.total_peticiones || 0}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button
                          onClick={() => { setProveedorId(k.proveedor_id); window.scrollTo(0, 0); }}
                          style={{ ...btnAccion, fontSize: 12 }}
                        >
                          🔄 Regenerar
                        </button>
                        <button
                          onClick={() => revocarKey(k.id)}
                          style={{
                            background: "rgba(239,68,68,0.15)", border: "none",
                            color: "#f87171", padding: "6px 10px", borderRadius: 8,
                            cursor: "pointer", fontWeight: 700, fontSize: 12,
                          }}
                        >
                          ✕ Revocar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Proveedores sin API */}
      {proveedores.filter(u => !keysActivas.some(k => k.proveedor_id === u.id)).length > 0 && (
        <div style={{ ...seccionCard, marginTop: 20, border: "1px solid rgba(245,158,11,0.2)" }}>
          <h2 style={{ fontSize: 18, fontWeight: 900, marginBottom: 16, color: "#fbbf24" }}>
            ⚠️ Proveedores sin API ({proveedores.filter(u => !keysActivas.some(k => k.proveedor_id === u.id)).length})
          </h2>
          <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 10 }}>
            {proveedores.filter(u => !keysActivas.some(k => k.proveedor_id === u.id)).map(u => (
              <div key={u.id} style={{
                background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)",
                borderRadius: 10, padding: "10px 16px", display: "flex", alignItems: "center", gap: 12,
              }}>
                <span style={{ fontWeight: 700, fontSize: 14 }}>{u.nombre_empresa || u.email}</span>
                <button
                  onClick={() => { setProveedorId(u.id); window.scrollTo(0, 0); }}
                  style={{
                    background: "rgba(245,158,11,0.2)", border: "none", color: "#fbbf24",
                    padding: "4px 10px", borderRadius: 6, cursor: "pointer", fontWeight: 700, fontSize: 12,
                  }}
                >
                  + Generar API
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
