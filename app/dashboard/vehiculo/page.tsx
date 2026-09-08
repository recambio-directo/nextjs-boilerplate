"use client";

import { useState } from "react";

// ── TIPOS ──
interface DatosVehiculo {
  plate?: string;
  vin?: string;
  brand?: string;
  model?: string;
  version?: string;
  firstRegistrationDateEs?: string;
  fuelType?: string;
  fuelCode?: number;
  vehicleType?: string;
  bodyType?: string;
  transmissionType?: string;
  gearboxType?: string;
  engineCode?: string;
  engineCapacityLiters?: string;
  displacementCcm?: string;
  cylinders?: string;
  valves?: string;
  powerKW?: string;
  powerHP?: string;
  co2?: string;
  fiscalPower?: string;
  weight?: string;
  grossVehicleWeight?: string;
  passengerCount?: number;
  doorCount?: number;
  fuelSystem?: string;
  platformCodes?: string;
  modelStartDate?: string;
  modelEndDate?: string;
  variant?: string;
  country?: string;
  tires?: { name: string; width: number; height: number; diameter: number; loadIndex: number; speedIndex: string }[];
}

// ── HELPERS ──
const fuelEmoji: Record<string, string> = {
  Diesel: "⛽",
  Gasoline: "⛽",
  Electric: "🔋",
  "Gasoline / Electric Hybrid": "🔋",
  "Gasoline / Electric Plug-in": "🔌",
  "Diesel / Electric Hybrid": "🔋",
  "Diesel / Electric Plug-in": "🔌",
  LPG: "🟢",
  "Natural Gas": "🟢",
  "Hydrogen / Electric": "💧",
};

const fuelLabel: Record<string, string> = {
  Diesel: "Diésel",
  Gasoline: "Gasolina",
  Electric: "Eléctrico",
  "Gasoline / Electric Hybrid": "Híbrido Gasolina",
  "Gasoline / Electric Plug-in": "PHEV Gasolina",
  "Diesel / Electric Hybrid": "Híbrido Diésel",
  "Diesel / Electric Plug-in": "PHEV Diésel",
  LPG: "GLP",
  "Natural Gas": "Gas Natural",
  "Gasoline + LPG": "Gasolina + GLP",
  "Hydrogen / Electric": "Hidrógeno",
};

const bodyLabel: Record<string, string> = {
  "Hatchback (3 or 5 doors)": "Hatchback",
  "Sedan (3 volumes)": "Berlina",
  "Estate / Station Wagon": "Familiar",
  SUV: "SUV",
  "Closed Off-road": "Todoterreno",
  "Minivan / MPV": "Monovolumen",
  Coupe: "Coupé",
  Convertible: "Cabrio",
  Pickup: "Pick-up",
  Van: "Furgoneta",
  "Light Van / Hatchback": "Furgoneta",
  "Van / Estate": "Furgoneta",
};

const transLabel: Record<string, string> = {
  FWD: "Tracción delantera",
  RWD: "Tracción trasera",
  AWD: "Tracción total (4x4)",
};

const gearLabel: Record<string, string> = {
  Manual: "Manual",
  Automatic: "Automático",
  Sequential: "Secuencial",
  "CVT (Continuously Variable)": "CVT",
  "Automated Manual (Robotic)": "Automatizado",
};

// ════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ════════════════════════════════════════════════════════
export default function VehiculoPage() {
  const [input, setInput] = useState("");
  const [modo, setModo] = useState<"plate" | "vin">("plate");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [vehiculo, setVehiculo] = useState<DatosVehiculo | null>(null);

  const buscar = async () => {
    const valor = input.trim().replace(/[\s-]/g, "").toUpperCase();
    if (!valor) return;
    setLoading(true);
    setError(null);
    setVehiculo(null);

    try {
      const param = modo === "plate" ? `plate=${encodeURIComponent(valor)}` : `vin=${encodeURIComponent(valor)}`;
      const res = await fetch(`/api/vehiculo?${param}`);
      const json = await res.json();

      if (!res.ok) {
        setError(json.error || "Vehículo no encontrado");
      } else {
        setVehiculo(json.data);
      }
    } catch {
      setError("Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  // ── Ficha dato ──
  const Dato = ({ label, value, icon }: { label: string; value?: string | number | null; icon?: string }) => {
    if (!value && value !== 0) return null;
    return (
      <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "12px 16px", background: "rgba(255,255,255,0.03)", borderRadius: "10px", border: "1px solid #1e293b" }}>
        {icon && <span style={{ fontSize: "20px" }}>{icon}</span>}
        <div>
          <div style={{ color: "#64748b", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: 600 }}>{label}</div>
          <div style={{ color: "#e2e8f0", fontSize: "15px", fontWeight: 600, marginTop: "2px" }}>{String(value)}</div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ minHeight: "100vh", background: "#020617", padding: "24px" }}>
      <div style={{ maxWidth: "1100px", margin: "0 auto" }}>

        {/* Header */}
        <div style={{ marginBottom: "32px" }}>
          <h1 style={{ color: "#e2e8f0", fontSize: "28px", fontWeight: 800, margin: "0 0 8px" }}>
            🚗 Identificación de Vehículo
          </h1>
          <p style={{ color: "#64748b", fontSize: "14px", margin: 0 }}>
            Busca por matrícula o número de bastidor (VIN) para obtener los datos técnicos completos
          </p>
        </div>

        {/* Buscador */}
        <div style={{
          background: "rgba(255,255,255,0.03)", border: "1px solid #1e293b",
          borderRadius: "16px", padding: "24px", marginBottom: "24px",
        }}>
          {/* Toggle matrícula / VIN */}
          <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
            {(["plate", "vin"] as const).map((m) => (
              <button
                key={m}
                onClick={() => { setModo(m); setInput(""); setError(null); setVehiculo(null); }}
                style={{
                  padding: "8px 20px", borderRadius: "8px", border: "1px solid",
                  borderColor: modo === m ? "#2563eb" : "#334155",
                  background: modo === m ? "rgba(37,99,235,0.15)" : "transparent",
                  color: modo === m ? "#93c5fd" : "#94a3b8",
                  fontSize: "13px", fontWeight: 700, cursor: "pointer",
                }}
              >
                {m === "plate" ? "🔢 Matrícula" : "🔠 Bastidor (VIN)"}
              </button>
            ))}
          </div>

          {/* Input + botón */}
          <div style={{ display: "flex", gap: "12px" }}>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && buscar()}
              placeholder={modo === "plate" ? "Ej: 1234ABC" : "Ej: WVWZZZ1KZAM123456"}
              style={{
                flex: 1, padding: "14px 16px", borderRadius: "10px",
                border: "1px solid #334155", background: "#0f172a", color: "#e2e8f0",
                fontSize: "16px", fontWeight: 600, letterSpacing: "1px",
                outline: "none", textTransform: "uppercase",
              }}
            />
            <button
              onClick={buscar}
              disabled={loading || !input.trim()}
              style={{
                padding: "14px 28px", borderRadius: "10px", border: "none",
                background: loading ? "#1e40af" : "#2563eb", color: "#fff",
                fontSize: "15px", fontWeight: 700, cursor: loading ? "wait" : "pointer",
                opacity: !input.trim() ? 0.5 : 1,
                display: "flex", alignItems: "center", gap: "8px",
              }}
            >
              {loading ? (
                <span style={{ display: "inline-block", width: "18px", height: "18px", border: "2px solid rgba(255,255,255,0.3)", borderTop: "2px solid #fff", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
              ) : "🔍"} Buscar
            </button>
          </div>

          {/* Spinner animation */}
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>

        {/* Error */}
        {error && (
          <div style={{
            background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)",
            borderRadius: "12px", padding: "16px 20px", marginBottom: "24px",
            color: "#fca5a5", fontSize: "14px", display: "flex", alignItems: "center", gap: "10px",
          }}>
            <span style={{ fontSize: "20px" }}>⚠️</span> {error}
          </div>
        )}

        {/* Resultados */}
        {vehiculo && (
          <div>
            {/* Cabecera vehículo */}
            <div style={{
              background: "linear-gradient(135deg, rgba(37,99,235,0.1) 0%, rgba(16,185,129,0.1) 100%)",
              border: "1px solid rgba(37,99,235,0.2)", borderRadius: "16px",
              padding: "28px 32px", marginBottom: "20px",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
                <div style={{
                  background: "#2563eb", borderRadius: "12px", padding: "12px 20px",
                  color: "#fff", fontSize: "20px", fontWeight: 800, letterSpacing: "2px",
                  fontFamily: "monospace",
                }}>
                  {vehiculo.plate || vehiculo.vin?.substring(0, 10) || "—"}
                </div>
                <div>
                  <h2 style={{ color: "#e2e8f0", fontSize: "24px", fontWeight: 800, margin: "0 0 4px" }}>
                    {vehiculo.brand} {vehiculo.model}
                  </h2>
                  <p style={{ color: "#94a3b8", fontSize: "14px", margin: 0 }}>
                    {vehiculo.version}
                    {vehiculo.firstRegistrationDateEs && ` · Matriculado ${vehiculo.firstRegistrationDateEs}`}
                  </p>
                </div>
              </div>

              {/* Tags rápidos */}
              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginTop: "20px" }}>
                {vehiculo.fuelType && (
                  <span style={{ background: "rgba(37,99,235,0.15)", border: "1px solid rgba(37,99,235,0.3)", borderRadius: "8px", padding: "6px 14px", color: "#93c5fd", fontSize: "13px", fontWeight: 600 }}>
                    {fuelEmoji[vehiculo.fuelType] || "⛽"} {fuelLabel[vehiculo.fuelType] || vehiculo.fuelType}
                  </span>
                )}
                {vehiculo.powerHP && (
                  <span style={{ background: "rgba(234,179,8,0.1)", border: "1px solid rgba(234,179,8,0.3)", borderRadius: "8px", padding: "6px 14px", color: "#fde047", fontSize: "13px", fontWeight: 600 }}>
                    ⚡ {vehiculo.powerHP} CV
                  </span>
                )}
                {vehiculo.bodyType && (
                  <span style={{ background: "rgba(168,85,247,0.1)", border: "1px solid rgba(168,85,247,0.3)", borderRadius: "8px", padding: "6px 14px", color: "#c084fc", fontSize: "13px", fontWeight: 600 }}>
                    🚘 {bodyLabel[vehiculo.bodyType] || vehiculo.bodyType}
                  </span>
                )}
                {vehiculo.gearboxType && (
                  <span style={{ background: "rgba(22,163,106,0.1)", border: "1px solid rgba(22,163,106,0.3)", borderRadius: "8px", padding: "6px 14px", color: "#4ade80", fontSize: "13px", fontWeight: 600 }}>
                    ⚙️ {gearLabel[vehiculo.gearboxType] || vehiculo.gearboxType}
                  </span>
                )}
              </div>
            </div>

            {/* Grid de datos */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "20px" }}>

              {/* Motor */}
              <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid #1e293b", borderRadius: "14px", padding: "24px" }}>
                <h3 style={{ color: "#e2e8f0", fontSize: "16px", fontWeight: 700, margin: "0 0 16px", display: "flex", alignItems: "center", gap: "8px" }}>
                  🔧 Motor y mecánica
                </h3>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "10px" }}>
                  <Dato icon="🏷️" label="Código motor" value={vehiculo.engineCode} />
                  <Dato icon="⛽" label="Combustible" value={vehiculo.fuelType ? (fuelLabel[vehiculo.fuelType] || vehiculo.fuelType) : undefined} />
                  <Dato icon="💉" label="Alimentación" value={vehiculo.fuelSystem} />
                  <Dato icon="📐" label="Cilindrada" value={vehiculo.displacementCcm ? `${vehiculo.displacementCcm} cc` : undefined} />
                  <Dato icon="🔩" label="Cilindros" value={vehiculo.cylinders} />
                  <Dato icon="🔩" label="Válvulas/cil." value={vehiculo.valves} />
                  <Dato icon="⚡" label="Potencia" value={vehiculo.powerHP ? `${vehiculo.powerHP} CV (${vehiculo.powerKW} kW)` : undefined} />
                  <Dato icon="🌿" label="CO₂" value={vehiculo.co2 ? `${vehiculo.co2} g/km` : undefined} />
                  <Dato icon="📊" label="Potencia fiscal" value={vehiculo.fiscalPower ? `${vehiculo.fiscalPower} CVF` : undefined} />
                </div>
              </div>

              {/* Transmisión y carrocería */}
              <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid #1e293b", borderRadius: "14px", padding: "24px" }}>
                <h3 style={{ color: "#e2e8f0", fontSize: "16px", fontWeight: 700, margin: "0 0 16px", display: "flex", alignItems: "center", gap: "8px" }}>
                  🚘 Carrocería y transmisión
                </h3>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "10px" }}>
                  <Dato icon="🚗" label="Tipo" value={vehiculo.vehicleType === "Passenger Car" ? "Turismo" : vehiculo.vehicleType} />
                  <Dato icon="🏎️" label="Carrocería" value={vehiculo.bodyType ? (bodyLabel[vehiculo.bodyType] || vehiculo.bodyType) : undefined} />
                  <Dato icon="⚙️" label="Cambio" value={vehiculo.gearboxType ? (gearLabel[vehiculo.gearboxType] || vehiculo.gearboxType) : undefined} />
                  <Dato icon="🛞" label="Tracción" value={vehiculo.transmissionType ? (transLabel[vehiculo.transmissionType] || vehiculo.transmissionType) : undefined} />
                  <Dato icon="🚪" label="Puertas" value={vehiculo.doorCount} />
                  <Dato icon="👥" label="Plazas" value={vehiculo.passengerCount} />
                  <Dato icon="⚖️" label="Peso" value={vehiculo.weight ? `${vehiculo.weight} kg` : undefined} />
                  <Dato icon="⚖️" label="PMA" value={vehiculo.grossVehicleWeight ? `${vehiculo.grossVehicleWeight} kg` : undefined} />
                  <Dato icon="🏗️" label="Plataforma" value={vehiculo.platformCodes} />
                </div>
              </div>

              {/* Identificación */}
              <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid #1e293b", borderRadius: "14px", padding: "24px" }}>
                <h3 style={{ color: "#e2e8f0", fontSize: "16px", fontWeight: 700, margin: "0 0 16px", display: "flex", alignItems: "center", gap: "8px" }}>
                  📋 Identificación
                </h3>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "10px" }}>
                  <Dato icon="🔢" label="Matrícula" value={vehiculo.plate} />
                  <Dato icon="🔠" label="Bastidor (VIN)" value={vehiculo.vin} />
                  <Dato icon="📅" label="Fecha matrícula" value={vehiculo.firstRegistrationDateEs} />
                  <Dato icon="📅" label="Periodo modelo" value={vehiculo.modelStartDate && vehiculo.modelEndDate ? `${vehiculo.modelStartDate} → ${vehiculo.modelEndDate}` : vehiculo.modelStartDate} />
                  <Dato icon="🏷️" label="Variante" value={vehiculo.variant} />
                  <Dato icon="🌍" label="País" value={vehiculo.country === "ES" ? "España" : vehiculo.country} />
                </div>
              </div>

              {/* Neumáticos */}
              {vehiculo.tires && vehiculo.tires.length > 0 && (
                <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid #1e293b", borderRadius: "14px", padding: "24px" }}>
                  <h3 style={{ color: "#e2e8f0", fontSize: "16px", fontWeight: 700, margin: "0 0 16px", display: "flex", alignItems: "center", gap: "8px" }}>
                    🛞 Neumáticos
                  </h3>
                  <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
                    {vehiculo.tires.map((t, i) => (
                      <div key={i} style={{
                        background: "rgba(37,99,235,0.08)", border: "1px solid rgba(37,99,235,0.2)",
                        borderRadius: "12px", padding: "16px 20px", minWidth: "200px",
                      }}>
                        <div style={{ color: "#64748b", fontSize: "11px", textTransform: "uppercase", fontWeight: 600, marginBottom: "6px" }}>
                          {t.name === "Front" ? "Delanteros" : t.name === "Rear" ? "Traseros" : t.name}
                        </div>
                        <div style={{ color: "#e2e8f0", fontSize: "20px", fontWeight: 800, fontFamily: "monospace" }}>
                          {t.width}/{t.height} R{t.diameter}
                        </div>
                        <div style={{ color: "#94a3b8", fontSize: "12px", marginTop: "4px" }}>
                          {t.loadIndex}{t.speedIndex}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          </div>
        )}

        {/* Empty state */}
        {!vehiculo && !error && !loading && (
          <div style={{ textAlign: "center", padding: "60px 20px", color: "#334155" }}>
            <div style={{ fontSize: "64px", marginBottom: "16px" }}>🔍</div>
            <p style={{ fontSize: "16px", color: "#475569" }}>Introduce una matrícula o número de bastidor para identificar el vehículo</p>
          </div>
        )}

      </div>
    </div>
  );
}
