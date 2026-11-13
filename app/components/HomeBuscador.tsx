"use client";
import { useState, useEffect, useRef } from "react";

interface Resultado {
  referencia: string;
  marca: string;
  descripcion: string;
  tipo: string;
  num_proveedores: number;
}

interface Stats {
  referencias: number;
  proveedores: number;
  talleres: number;
  pedidos: number;
}

// ── Animated counter ──
function AnimNum({ target }: { target: number }) {
  const [val, setVal] = useState(0);
  const ref = useRef(0);
  useEffect(() => {
    if (target <= 0) return;
    const duration = 1200;
    const start = performance.now();
    const from = ref.current;
    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - t, 3);
      const v = Math.round(from + (target - from) * ease);
      setVal(v);
      if (t < 1) requestAnimationFrame(tick);
      else ref.current = target;
    };
    requestAnimationFrame(tick);
  }, [target]);
  return <>{val.toLocaleString("es-ES")}</>;
}

export default function HomeBuscador() {
  const [query, setQuery] = useState("");
  const [resultados, setResultados] = useState<Resultado[]>([]);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [buscado, setBuscado] = useState(false);
  const [stats, setStats] = useState<Stats>({ referencias: 0, proveedores: 0, talleres: 0, pedidos: 0 });
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Fetch stats on mount
  useEffect(() => {
    fetch("/api/stats-publico")
      .then((r) => r.json())
      .then((d) => setStats(d))
      .catch(() => {});
  }, []);

  const buscar = () => {
    const q = query.trim();
    if (q.length < 3) return;
    setLoading(true);
    setBuscado(true);
    fetch(`/api/buscar-publico?q=${encodeURIComponent(q)}`)
      .then((r) => r.json())
      .then((d) => {
        setResultados(d.resultados || []);
        setMensaje(d.mensaje || null);
        setTotal(d.total || 0);
      })
      .catch(() => setMensaje("Error al buscar"))
      .finally(() => setLoading(false));
  };

  return (
    <div style={{ width: "100%" }}>
      {/* ── BUSCADOR ── */}
      <div style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 20, padding: "6px", display: "flex", gap: 0, marginBottom: 24 }}>
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (debounceRef.current) clearTimeout(debounceRef.current);
          }}
          onKeyDown={(e) => e.key === "Enter" && buscar()}
          aria-label="Buscar recambio por referencia OEM o IAM"
          placeholder="Referencia OEM o IAM"
          style={{
            flex: 1,
            background: "transparent",
            border: "none",
            outline: "none",
            color: "white",
            fontSize: 16,
            minWidth: 0,
            padding: "14px 18px",
            fontFamily: "inherit",
          }}
        />
        <button
          onClick={buscar}
          disabled={loading || query.trim().length < 3}
          className="home-buscador-btn"
          style={{
            background: "linear-gradient(135deg,#2563eb,#1d4ed8)",
            color: "white",
            border: "none",
            borderRadius: 16,
            padding: "14px 28px",
            fontSize: 15,
            fontWeight: 800,
            cursor: query.trim().length >= 3 ? "pointer" : "not-allowed",
            opacity: query.trim().length < 3 ? 0.5 : 1,
            whiteSpace: "nowrap" as const,
          }}
        >
          {loading ? "Buscando..." : "Buscar"}
        </button>
      </div>

      {/* ── RESULTADOS ── */}
      {buscado && (
        <div style={{ marginBottom: 24 }}>
          {resultados.length > 0 ? (
            <>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 340, overflowY: "auto" }}>
                {resultados.map((r, i) => (
                  <div
                    key={i}
                    style={{
                      background: "rgba(30,41,59,0.8)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      borderRadius: 14,
                      padding: "14px 18px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: 12,
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                        <span style={{ fontWeight: 800, fontSize: 15, color: "white", fontFamily: "monospace" }}>{r.referencia}</span>
                        <span style={{ background: r.tipo === "OEM" ? "rgba(37,99,235,0.2)" : "rgba(22,163,74,0.2)", color: r.tipo === "OEM" ? "#60a5fa" : "#4ade80", padding: "2px 8px", borderRadius: 6, fontSize: 11, fontWeight: 700 }}>{r.tipo}</span>
                      </div>
                      {r.marca && <div style={{ color: "#94a3b8", fontSize: 13, marginTop: 2 }}>{r.marca}{r.descripcion ? ` · ${r.descripcion}` : ""}</div>}
                    </div>
                    <div style={{ textAlign: "center", flexShrink: 0 }}>
                      <div style={{ fontSize: 20, fontWeight: 900, color: "#4ade80" }}>{r.num_proveedores}</div>
                      <div style={{ fontSize: 10, color: "#94a3b8" }}>proveedor{r.num_proveedores !== 1 ? "es" : ""}</div>
                    </div>
                  </div>
                ))}
              </div>
              {total > 20 && <p style={{ color: "#94a3b8", fontSize: 13, marginTop: 10, textAlign: "center" }}>Mostrando 20 de {total} resultados</p>}
              <div style={{ textAlign: "center", marginTop: 16 }}>
                <a
                  href="/registro"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    background: "linear-gradient(135deg,#2563eb,#1d4ed8)",
                    color: "white",
                    padding: "14px 32px",
                    borderRadius: 14,
                    fontSize: 15,
                    fontWeight: 800,
                    textDecoration: "none",
                    boxShadow: "0 8px 24px rgba(37,99,235,0.3)",
                  }}
                >
                  Regístrate para ver precios y comprar →
                </a>
              </div>
            </>
          ) : (
            !loading && (
              <div style={{ textAlign: "center", padding: "24px 0" }}>
                <p style={{ color: "#94a3b8", fontSize: 15 }}>No se encontraron resultados para &quot;{query}&quot;</p>
                <p style={{ color: "#64748b", fontSize: 13 }}>Regístrate para buscar por matrícula, bastidor o aplicación de vehículo</p>
              </div>
            )
          )}
        </div>
      )}

      {/* ── CONTADORES ── */}
      {/* Solo se muestran cuando la API ha respondido (evita ver "0" si falla) */}
      {stats.referencias > 0 && (
        <div className="home-contadores">
          {[
            { label: "Referencias", value: stats.referencias, color: "#60a5fa" },
            { label: "Proveedores", value: stats.proveedores, color: "#4ade80" },
            { label: "Talleres", value: stats.talleres, color: "#a78bfa" },
            { label: "Pedidos", value: stats.pedidos, color: "#fbbf24" },
          ].map(({ label, value, color }) => (
            <div
              key={label}
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 14,
                padding: "16px 12px",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: "clamp(20px, 2.2vw, 28px)", fontWeight: 900, color, fontVariantNumeric: "tabular-nums" }}>
                <AnimNum target={value} />
              </div>
              <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 4 }}>{label}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
