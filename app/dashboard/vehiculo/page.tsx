"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";

// ── TIPOS ──
interface DatosVehiculo {
  vin: string;
  marca: string;
  modelo: string;
  version: string;
  motor: string;
  combustible: string;
  potencia_kw: string;
  potencia_cv: string;
  cilindrada: string;
  cilindros: string;
  transmision: string;
  caja_cambios: string;
  carroceria: string;
  color: string;
  puertas: string;
  plazas: string;
  peso: string;
  co2: string;
  anyo_modelo: string;
  tipo_vehiculo: string;
  region: string;
  pais: string;
  fabricante_nombre: string;
  placa: string;
  logo_marca: string;
  foto_modelo: string;
  tecdoc_car_id: string;
  tecdoc_manu_id: string;
  tecdoc_model_id: string;
  pneus: any[];
}

interface Categoria {
  id: number;
  nombre: string;
  hijos: Categoria[];
  icono?: string;
}

interface PiezaStock {
  id: string;
  referencia: string;
  marca: string;
  nombre: string;
  tipo: string;
  precio: number;
  proveedor_id: string;
  proveedor_nombre: string;
}

interface ArticuloCatalogo {
  articleId: number;
  referencia: string;
  marca: string;
  nombre: string;
  oems: string[];
  en_stock: boolean;
  fuente: string;
  stock: PiezaStock[];
  precio_desde: number | null;
}

// ════════════════════════════════════════════════════════
// LANDING DE VENTA (si no tiene vehiculo_activo)
// ════════════════════════════════════════════════════════
function LandingVehiculo() {
  const ventajas = [
    { icon: "🔍", titulo: "Identifica cualquier vehiculo", desc: "Introduce el numero de bastidor (VIN) y obtén todos los datos técnicos al instante" },
    { icon: "🔧", titulo: "Datos de motor completos", desc: "Codigo motor, cilindrada, potencia, combustible, emisiones..." },
    { icon: "📦", titulo: "Catalogo de piezas", desc: "Navega por categorias de piezas compatibles con el vehiculo decodificado" },
    { icon: "💰", titulo: "Precios y stock en tiempo real", desc: "Ve directamente qué piezas hay disponibles en la red de proveedores y a qué precio" },
    { icon: "📋", titulo: "Ficha técnica completa", desc: "VIN, motor, transmision, carroceria, neumaticos, peso, emisiones..." },
    { icon: "⚡", titulo: "Conexion TecDoc", desc: "Catalogo profesional conectado a la base de datos TecDoc con millones de referencias" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#020617", padding: "24px" }}>
      <div style={{ maxWidth: "900px", margin: "0 auto" }}>
        <div style={{
          background: "linear-gradient(135deg, rgba(37,99,235,0.15) 0%, rgba(16,185,129,0.1) 100%)",
          border: "1px solid rgba(37,99,235,0.25)", borderRadius: "24px",
          padding: "48px 40px", textAlign: "center", marginBottom: "32px",
        }}>
          <div style={{ fontSize: "64px", marginBottom: "16px" }}>🚗</div>
          <h1 style={{ color: "#e2e8f0", fontSize: "36px", fontWeight: 900, margin: "0 0 12px", lineHeight: 1.2 }}>
            Catalogo de Vehiculos
          </h1>
          <p style={{ color: "#94a3b8", fontSize: "17px", margin: "0 0 28px", maxWidth: "600px", marginLeft: "auto", marginRight: "auto", lineHeight: 1.6 }}>
            Decodifica vehiculos por bastidor (VIN), consulta sus datos técnicos y navega el catalogo completo de piezas compatibles con precios en tiempo real.
          </p>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: "8px",
            background: "linear-gradient(135deg,#2563eb,#1d4ed8)", borderRadius: "16px",
            padding: "18px 36px", boxShadow: "0 8px 30px rgba(37,99,235,0.4)",
          }}>
            <span style={{ color: "white", fontSize: "32px", fontWeight: 900 }}>10€</span>
            <span style={{ color: "rgba(255,255,255,0.8)", fontSize: "15px", fontWeight: 600 }}>/mes</span>
          </div>
          <p style={{ color: "#64748b", fontSize: "13px", marginTop: "8px" }}>Adicional a tu suscripcion</p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "16px", marginBottom: "32px" }}>
          {ventajas.map((v, i) => (
            <div key={i} style={{
              background: "rgba(255,255,255,0.03)", border: "1px solid #1e293b",
              borderRadius: "16px", padding: "24px",
            }}>
              <div style={{ fontSize: "32px", marginBottom: "12px" }}>{v.icon}</div>
              <h3 style={{ color: "#e2e8f0", fontSize: "16px", fontWeight: 700, margin: "0 0 8px" }}>{v.titulo}</h3>
              <p style={{ color: "#64748b", fontSize: "13px", margin: 0, lineHeight: 1.5 }}>{v.desc}</p>
            </div>
          ))}
        </div>

        <div style={{
          background: "linear-gradient(135deg, rgba(22,163,74,0.1) 0%, rgba(37,99,235,0.1) 100%)",
          border: "1px solid rgba(22,163,74,0.25)", borderRadius: "20px",
          padding: "32px 40px", textAlign: "center",
        }}>
          <h2 style={{ color: "#e2e8f0", fontSize: "22px", fontWeight: 800, margin: "0 0 8px" }}>
            ¿Quieres activar este servicio?
          </h2>
          <p style={{ color: "#94a3b8", fontSize: "15px", margin: "0 0 24px" }}>
            Contacta con nosotros y lo activamos en tu cuenta en menos de 24h
          </p>
          <div style={{ display: "flex", gap: "16px", justifyContent: "center", flexWrap: "wrap" }}>
            <a href="mailto:info@recambiodirecto.com?subject=Activar%20catalogo%20de%20vehiculos" style={{
              display: "inline-flex", alignItems: "center", gap: "8px",
              background: "linear-gradient(135deg,#2563eb,#1d4ed8)", borderRadius: "12px",
              padding: "14px 28px", color: "white", textDecoration: "none", fontWeight: 700, fontSize: "15px",
              boxShadow: "0 4px 15px rgba(37,99,235,0.3)",
            }}>
              ✉️ info@recambiodirecto.com
            </a>
            <a href="tel:+34744487895" style={{
              display: "inline-flex", alignItems: "center", gap: "8px",
              background: "linear-gradient(135deg,#16a34a,#15803d)", borderRadius: "12px",
              padding: "14px 28px", color: "white", textDecoration: "none", fontWeight: 700, fontSize: "15px",
              boxShadow: "0 4px 15px rgba(22,163,74,0.3)",
            }}>
              📞 +34 744 487 895
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════
// COMPONENTE: Árbol de categorías (con iconos)
// ════════════════════════════════════════════════════════
function ArbolCategorias({
  categorias,
  categoriaSeleccionada,
  onSeleccionar,
  nivel = 0,
}: {
  categorias: Categoria[];
  categoriaSeleccionada: number | null;
  onSeleccionar: (id: number, nombre: string) => void;
  nivel?: number;
}) {
  const [expandidos, setExpandidos] = useState<Set<number>>(new Set());

  const toggleExpandir = (id: number) => {
    setExpandidos((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <>
      {categorias.map((cat) => {
        const tieneHijos = cat.hijos && cat.hijos.length > 0;
        const expandido = expandidos.has(cat.id);
        const seleccionado = categoriaSeleccionada === cat.id;
        const esRaiz = nivel === 0;

        return (
          <div key={cat.id}>
            <div
              style={{
                display: "flex", alignItems: "center", gap: "8px",
                padding: esRaiz ? "12px 12px" : "8px 12px",
                paddingLeft: `${12 + nivel * 20}px`,
                cursor: "pointer", borderRadius: "8px",
                background: seleccionado ? "rgba(37,99,235,0.15)" : "transparent",
                border: seleccionado ? "1px solid rgba(37,99,235,0.3)" : "1px solid transparent",
                transition: "all 0.15s",
                marginBottom: esRaiz ? "2px" : "0",
              }}
              onClick={() => {
                if (tieneHijos) toggleExpandir(cat.id);
                if (!tieneHijos) {
                  onSeleccionar(cat.id, cat.nombre);
                }
              }}
              onMouseEnter={(e) => {
                if (!seleccionado) e.currentTarget.style.background = "rgba(255,255,255,0.04)";
              }}
              onMouseLeave={(e) => {
                if (!seleccionado) e.currentTarget.style.background = "transparent";
              }}
            >
              {esRaiz && cat.icono ? (
                <span style={{ fontSize: "16px", width: "20px", textAlign: "center", flexShrink: 0 }}>
                  {cat.icono}
                </span>
              ) : tieneHijos ? (
                <span style={{ color: "#64748b", fontSize: "10px", width: "16px", textAlign: "center", flexShrink: 0 }}>
                  {expandido ? "▼" : "▶"}
                </span>
              ) : (
                <span style={{ width: "16px", flexShrink: 0 }} />
              )}
              <span style={{
                color: seleccionado ? "#93c5fd" : esRaiz ? "#e2e8f0" : "#cbd5e1",
                fontSize: esRaiz ? "14px" : "13px",
                fontWeight: seleccionado ? 700 : esRaiz ? 600 : 500,
                flex: 1,
              }}>
                {cat.nombre}
              </span>
              {esRaiz && tieneHijos && (
                <span style={{ color: "#475569", fontSize: "10px", flexShrink: 0 }}>
                  {expandido ? "▲" : "▼"}
                </span>
              )}
              {tieneHijos && !esRaiz && (
                <span style={{ color: "#475569", fontSize: "10px" }}>
                  {cat.hijos.length}
                </span>
              )}
            </div>
            {tieneHijos && expandido && (
              <ArbolCategorias
                categorias={cat.hijos}
                categoriaSeleccionada={categoriaSeleccionada}
                onSeleccionar={onSeleccionar}
                nivel={nivel + 1}
              />
            )}
          </div>
        );
      })}
    </>
  );
}

// ════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ════════════════════════════════════════════════════════
export default function VehiculoPage() {
  const [vehiculoActivo, setVehiculoActivo] = useState<boolean | null>(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [vehiculo, setVehiculo] = useState<DatosVehiculo | null>(null);

  // Catálogo
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loadingCategorias, setLoadingCategorias] = useState(false);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<number | null>(null);
  const [nombreCategoria, setNombreCategoria] = useState("");
  const [articulos, setArticulos] = useState<ArticuloCatalogo[]>([]);
  const [loadingArticulos, setLoadingArticulos] = useState(false);
  const [infoCatalogo, setInfoCatalogo] = useState<{ total_tecdoc: number; total_en_stock: number } | null>(null);
  const [mostrarFicha, setMostrarFicha] = useState(false);
  const [errorPiezas, setErrorPiezas] = useState<string | null>(null);

  useEffect(() => {
    const checkAcceso = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setVehiculoActivo(false); return; }
      const { data: perfil } = await supabase.from("usuarios").select("vehiculo_activo").eq("id", user.id).single();
      setVehiculoActivo(perfil?.vehiculo_activo === true);
    };
    checkAcceso();
  }, []);

  // Cargar categorías — ya no depende de tecdoc_car_id, usa carId "0" como fallback
  const cargarCategorias = async (carId: string) => {
    setLoadingCategorias(true);
    setCategorias([]);
    setCategoriaSeleccionada(null);
    setArticulos([]);
    setInfoCatalogo(null);
    setErrorPiezas(null);
    try {
      const res = await fetch(`/api/vehiculo/categorias?carId=${encodeURIComponent(carId || "0")}`);
      const json = await res.json();
      if (res.ok && json.categorias) {
        setCategorias(json.categorias);
      }
    } catch {
      console.error("Error cargando categorías");
    } finally {
      setLoadingCategorias(false);
    }
  };

  // Cargar piezas de una categoría — ya no requiere tecdoc_car_id
  const cargarPiezas = async (categoryId: number, nombre: string) => {
    setCategoriaSeleccionada(categoryId);
    setNombreCategoria(nombre);
    setLoadingArticulos(true);
    setArticulos([]);
    setInfoCatalogo(null);
    setErrorPiezas(null);
    try {
      const carId = vehiculo?.tecdoc_car_id || "0";
      const res = await fetch(
        `/api/vehiculo/piezas?carId=${encodeURIComponent(carId)}&categoryId=${encodeURIComponent(categoryId)}&nombre=${encodeURIComponent(nombre)}`
      );
      const json = await res.json();
      if (res.ok) {
        setArticulos(json.articulos || []);
        setInfoCatalogo({ total_tecdoc: json.total_tecdoc, total_en_stock: json.total_en_stock });
      } else {
        setErrorPiezas(json.error || "Error al buscar piezas");
      }
    } catch {
      setErrorPiezas("Error de conexion al buscar piezas");
    } finally {
      setLoadingArticulos(false);
    }
  };

  if (vehiculoActivo === null) {
    return (
      <div style={{ minHeight: "100vh", background: "#020617", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: "#94a3b8", fontSize: 16 }}>Cargando...</p>
      </div>
    );
  }

  if (!vehiculoActivo) {
    return <LandingVehiculo />;
  }

  const buscar = async () => {
    const valor = input.trim().toUpperCase().replace(/[^A-HJ-NPR-Z0-9]/g, "");
    if (!valor) return;
    setLoading(true);
    setError(null);
    setVehiculo(null);
    setCategorias([]);
    setCategoriaSeleccionada(null);
    setArticulos([]);
    setInfoCatalogo(null);
    setMostrarFicha(false);
    setErrorPiezas(null);

    try {
      const res = await fetch(`/api/vehiculo?vin=${encodeURIComponent(valor)}`);
      const json = await res.json();

      if (!res.ok) {
        setError(json.error || "No se pudo decodificar el bastidor");
      } else {
        setVehiculo(json);
        // Cargar categorías SIEMPRE — el endpoint de piezas busca por keywords, no necesita carId real
        cargarCategorias(json.tecdoc_car_id || "0");
      }
    } catch {
      setError("Error de conexion");
    } finally {
      setLoading(false);
    }
  };

  const Dato = ({ label, value, icon }: { label: string; value?: string | number | null; icon?: string }) => {
    if (!value && value !== 0) return null;
    return (
      <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 14px", background: "rgba(255,255,255,0.03)", borderRadius: "8px", border: "1px solid #1e293b" }}>
        {icon && <span style={{ fontSize: "18px" }}>{icon}</span>}
        <div>
          <div style={{ color: "#64748b", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: 600 }}>{label}</div>
          <div style={{ color: "#e2e8f0", fontSize: "14px", fontWeight: 600, marginTop: "1px" }}>{String(value)}</div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ minHeight: "100vh", background: "#020617", padding: "24px" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>

        {/* Header */}
        <div style={{ marginBottom: "24px" }}>
          <h1 style={{ color: "#e2e8f0", fontSize: "28px", fontWeight: 800, margin: "0 0 8px" }}>
            🚗 Catalogo de Vehiculos
          </h1>
          <p style={{ color: "#64748b", fontSize: "14px", margin: 0 }}>
            Decodifica por bastidor (VIN) y navega el catalogo de piezas compatibles
          </p>
        </div>

        {/* Buscador */}
        <div style={{
          background: "rgba(255,255,255,0.03)", border: "1px solid #1e293b",
          borderRadius: "16px", padding: "20px", marginBottom: "20px",
        }}>
          <div style={{ display: "flex", gap: "12px" }}>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === "Enter" && buscar()}
              placeholder="Introduce el bastidor (VIN) — Ej: WVWZZZ1KZAM123456"
              maxLength={17}
              style={{
                flex: 1, padding: "14px 16px", borderRadius: "10px",
                border: "1px solid #334155", background: "#0f172a", color: "#e2e8f0",
                fontSize: "16px", fontWeight: 600, letterSpacing: "2px",
                outline: "none", textTransform: "uppercase", fontFamily: "monospace",
              }}
            />
            <button
              onClick={buscar}
              disabled={loading || input.trim().length < 17}
              style={{
                padding: "14px 28px", borderRadius: "10px", border: "none",
                background: loading ? "#1e40af" : "#2563eb", color: "#fff",
                fontSize: "15px", fontWeight: 700, cursor: loading ? "wait" : "pointer",
                opacity: input.trim().length < 17 ? 0.5 : 1,
                display: "flex", alignItems: "center", gap: "8px", whiteSpace: "nowrap",
              }}
            >
              {loading ? (
                <span style={{ display: "inline-block", width: "18px", height: "18px", border: "2px solid rgba(255,255,255,0.3)", borderTop: "2px solid #fff", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
              ) : "🔍"} Decodificar
            </button>
          </div>
          <p style={{ color: "#475569", fontSize: "12px", margin: "8px 0 0", paddingLeft: "4px" }}>
            {input.trim().length}/17 caracteres
          </p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>

        {/* Error */}
        {error && (
          <div style={{
            background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)",
            borderRadius: "12px", padding: "16px 20px", marginBottom: "20px",
            color: "#fca5a5", fontSize: "14px", display: "flex", alignItems: "center", gap: "10px",
          }}>
            ⚠️ {error}
          </div>
        )}

        {/* Vehiculo decodificado */}
        {vehiculo && (
          <>
            {/* Cabecera vehiculo */}
            <div style={{
              background: "linear-gradient(135deg, rgba(37,99,235,0.1) 0%, rgba(16,185,129,0.1) 100%)",
              border: "1px solid rgba(37,99,235,0.2)", borderRadius: "16px",
              padding: "24px 28px", marginBottom: "20px",
            }}>
              <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", alignItems: "center" }}>
                {vehiculo.logo_marca && (
                  <img
                    src={vehiculo.logo_marca}
                    alt={vehiculo.marca}
                    style={{ width: "52px", height: "52px", objectFit: "contain", borderRadius: "10px", background: "rgba(255,255,255,0.1)", padding: "6px" }}
                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                  />
                )}
                <div style={{ flex: 1 }}>
                  <h2 style={{ color: "#e2e8f0", fontSize: "22px", fontWeight: 800, margin: "0 0 4px" }}>
                    {vehiculo.marca} {vehiculo.modelo}
                  </h2>
                  <p style={{ color: "#94a3b8", fontSize: "13px", margin: 0 }}>
                    {vehiculo.version}
                    {vehiculo.motor && ` · ${vehiculo.motor}`}
                    {vehiculo.anyo_modelo && ` · ${vehiculo.anyo_modelo}`}
                  </p>
                </div>
                {vehiculo.placa && (
                  <div style={{
                    background: "#2563eb", borderRadius: "10px", padding: "8px 16px",
                    color: "#fff", fontSize: "16px", fontWeight: 800, letterSpacing: "2px", fontFamily: "monospace",
                  }}>
                    {vehiculo.placa}
                  </div>
                )}
              </div>

              {/* Tags rápidos */}
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "16px", alignItems: "center" }}>
                {vehiculo.anyo_modelo && (
                  <span style={{ background: "rgba(37,99,235,0.15)", border: "1px solid rgba(37,99,235,0.3)", borderRadius: "8px", padding: "5px 12px", color: "#93c5fd", fontSize: "12px", fontWeight: 600 }}>
                    📅 {vehiculo.anyo_modelo}
                  </span>
                )}
                {vehiculo.combustible && (
                  <span style={{ background: "rgba(37,99,235,0.15)", border: "1px solid rgba(37,99,235,0.3)", borderRadius: "8px", padding: "5px 12px", color: "#93c5fd", fontSize: "12px", fontWeight: 600 }}>
                    ⛽ {vehiculo.combustible}
                  </span>
                )}
                {vehiculo.potencia_cv && (
                  <span style={{ background: "rgba(234,179,8,0.1)", border: "1px solid rgba(234,179,8,0.3)", borderRadius: "8px", padding: "5px 12px", color: "#fde047", fontSize: "12px", fontWeight: 600 }}>
                    ⚡ {vehiculo.potencia_cv}
                  </span>
                )}
                {vehiculo.caja_cambios && (
                  <span style={{ background: "rgba(22,163,106,0.1)", border: "1px solid rgba(22,163,106,0.3)", borderRadius: "8px", padding: "5px 12px", color: "#4ade80", fontSize: "12px", fontWeight: 600 }}>
                    ⚙️ {vehiculo.caja_cambios}
                  </span>
                )}
                {vehiculo.cilindrada && (
                  <span style={{ background: "rgba(168,85,247,0.1)", border: "1px solid rgba(168,85,247,0.3)", borderRadius: "8px", padding: "5px 12px", color: "#c084fc", fontSize: "12px", fontWeight: 600 }}>
                    📐 {vehiculo.cilindrada}
                  </span>
                )}
                {vehiculo.carroceria && (
                  <span style={{ background: "rgba(255,255,255,0.05)", border: "1px solid #334155", borderRadius: "8px", padding: "5px 12px", color: "#94a3b8", fontSize: "12px", fontWeight: 600 }}>
                    🚘 {vehiculo.carroceria}
                  </span>
                )}
                {vehiculo.tecdoc_car_id && (
                  <span style={{ background: "rgba(255,255,255,0.05)", border: "1px solid #334155", borderRadius: "8px", padding: "5px 12px", color: "#64748b", fontSize: "12px", fontWeight: 600 }}>
                    TecDoc: {vehiculo.tecdoc_car_id}
                  </span>
                )}

                <button
                  onClick={() => setMostrarFicha(!mostrarFicha)}
                  style={{
                    marginLeft: "auto", padding: "5px 14px", borderRadius: "8px",
                    border: "1px solid #334155", background: "transparent",
                    color: "#94a3b8", fontSize: "12px", fontWeight: 600, cursor: "pointer",
                  }}
                >
                  {mostrarFicha ? "▲ Ocultar ficha" : "▼ Ver ficha técnica"}
                </button>
              </div>
            </div>

            {/* Ficha técnica (colapsable) */}
            {mostrarFicha && (
              <div style={{ marginBottom: "20px" }}>
                {vehiculo.foto_modelo && (
                  <div style={{
                    background: "rgba(255,255,255,0.02)", border: "1px solid #1e293b",
                    borderRadius: "14px", padding: "16px", marginBottom: "16px", textAlign: "center",
                  }}>
                    <img
                      src={vehiculo.foto_modelo}
                      alt={`${vehiculo.marca} ${vehiculo.modelo}`}
                      style={{ maxWidth: "100%", maxHeight: "250px", objectFit: "contain", borderRadius: "8px" }}
                      onError={(e) => { (e.target as HTMLImageElement).parentElement!.style.display = "none"; }}
                    />
                  </div>
                )}

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "16px" }}>
                  {/* Motor */}
                  <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid #1e293b", borderRadius: "14px", padding: "20px" }}>
                    <h3 style={{ color: "#e2e8f0", fontSize: "14px", fontWeight: 700, margin: "0 0 12px" }}>🔧 Motor</h3>
                    <div style={{ display: "grid", gap: "8px" }}>
                      <Dato icon="🏷️" label="Codigo motor" value={vehiculo.motor} />
                      <Dato icon="⛽" label="Combustible" value={vehiculo.combustible} />
                      <Dato icon="📐" label="Cilindrada" value={vehiculo.cilindrada} />
                      <Dato icon="🔩" label="Cilindros" value={vehiculo.cilindros} />
                      <Dato icon="⚡" label="Potencia" value={vehiculo.potencia_cv && vehiculo.potencia_kw ? `${vehiculo.potencia_cv} (${vehiculo.potencia_kw})` : vehiculo.potencia_cv || vehiculo.potencia_kw} />
                      <Dato icon="🌿" label="CO2" value={vehiculo.co2} />
                    </div>
                  </div>

                  {/* Carrocería */}
                  <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid #1e293b", borderRadius: "14px", padding: "20px" }}>
                    <h3 style={{ color: "#e2e8f0", fontSize: "14px", fontWeight: 700, margin: "0 0 12px" }}>🚘 Carroceria</h3>
                    <div style={{ display: "grid", gap: "8px" }}>
                      <Dato icon="🏎️" label="Carroceria" value={vehiculo.carroceria} />
                      <Dato icon="⚙️" label="Cambio" value={vehiculo.caja_cambios} />
                      <Dato icon="🛞" label="Traccion" value={vehiculo.transmision} />
                      <Dato icon="🚪" label="Puertas" value={vehiculo.puertas} />
                      <Dato icon="👥" label="Plazas" value={vehiculo.plazas} />
                      <Dato icon="⚖️" label="Peso" value={vehiculo.peso} />
                      <Dato icon="🎨" label="Color" value={vehiculo.color} />
                      <Dato icon="🚗" label="Tipo vehiculo" value={vehiculo.tipo_vehiculo} />
                    </div>
                  </div>

                  {/* Identificación */}
                  <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid #1e293b", borderRadius: "14px", padding: "20px" }}>
                    <h3 style={{ color: "#e2e8f0", fontSize: "14px", fontWeight: 700, margin: "0 0 12px" }}>📋 Identificacion</h3>
                    <div style={{ display: "grid", gap: "8px" }}>
                      <Dato icon="🔠" label="VIN" value={vehiculo.vin} />
                      <Dato icon="🔢" label="Matricula" value={vehiculo.placa} />
                      <Dato icon="📅" label="Año modelo" value={vehiculo.anyo_modelo} />
                      <Dato icon="🌍" label="Region" value={vehiculo.region} />
                      <Dato icon="🏭" label="Pais fabricacion" value={vehiculo.pais} />
                      <Dato icon="🏢" label="Fabricante" value={vehiculo.fabricante_nombre} />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ═══════════════════════════════════════════════ */}
            {/* CATÁLOGO DE PIEZAS — SIEMPRE VISIBLE           */}
            {/* ═══════════════════════════════════════════════ */}
            <div>
              <div style={{
                display: "flex", alignItems: "center", gap: "12px",
                marginBottom: "16px", padding: "16px 20px",
                background: "linear-gradient(135deg, rgba(22,163,74,0.08) 0%, rgba(37,99,235,0.08) 100%)",
                border: "1px solid rgba(22,163,74,0.2)", borderRadius: "14px",
              }}>
                <span style={{ fontSize: "24px" }}>📦</span>
                <div>
                  <h2 style={{ color: "#e2e8f0", fontSize: "18px", fontWeight: 800, margin: 0 }}>
                    Catalogo de piezas
                  </h2>
                  <p style={{ color: "#64748b", fontSize: "12px", margin: "2px 0 0" }}>
                    Selecciona una categoria para ver las piezas disponibles en stock
                  </p>
                </div>
                {loadingCategorias && (
                  <span style={{
                    marginLeft: "auto", display: "inline-block", width: "20px", height: "20px",
                    border: "2px solid rgba(37,99,235,0.3)", borderTop: "2px solid #2563eb",
                    borderRadius: "50%", animation: "spin 0.8s linear infinite",
                  }} />
                )}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: "16px", minHeight: "400px" }}>
                {/* Panel izquierdo: Categorías */}
                <div style={{
                  background: "rgba(255,255,255,0.02)", border: "1px solid #1e293b",
                  borderRadius: "14px", padding: "12px", overflowY: "auto", maxHeight: "70vh",
                }}>
                  <div style={{ padding: "8px 12px", marginBottom: "8px", borderBottom: "1px solid #1e293b" }}>
                    <p style={{ color: "#94a3b8", fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", margin: 0 }}>
                      Categorias ({categorias.length})
                    </p>
                  </div>
                  {categorias.length > 0 ? (
                    <ArbolCategorias
                      categorias={categorias}
                      categoriaSeleccionada={categoriaSeleccionada}
                      onSeleccionar={cargarPiezas}
                    />
                  ) : loadingCategorias ? (
                    <p style={{ color: "#475569", fontSize: "13px", textAlign: "center", padding: "20px" }}>
                      Cargando categorias...
                    </p>
                  ) : (
                    <p style={{ color: "#475569", fontSize: "13px", textAlign: "center", padding: "20px" }}>
                      No se encontraron categorias
                    </p>
                  )}
                </div>

                {/* Panel derecho: Piezas */}
                <div style={{
                  background: "rgba(255,255,255,0.02)", border: "1px solid #1e293b",
                  borderRadius: "14px", padding: "20px", overflowY: "auto", maxHeight: "70vh",
                }}>
                  {!categoriaSeleccionada && !loadingArticulos && (
                    <div style={{ textAlign: "center", padding: "60px 20px", color: "#334155" }}>
                      <div style={{ fontSize: "48px", marginBottom: "12px" }}>👈</div>
                      <p style={{ fontSize: "15px", color: "#475569" }}>Selecciona una categoria para ver las piezas</p>
                    </div>
                  )}

                  {loadingArticulos && (
                    <div style={{ textAlign: "center", padding: "40px 20px" }}>
                      <span style={{
                        display: "inline-block", width: "28px", height: "28px",
                        border: "3px solid rgba(37,99,235,0.3)", borderTop: "3px solid #2563eb",
                        borderRadius: "50%", animation: "spin 0.8s linear infinite",
                      }} />
                      <p style={{ color: "#94a3b8", fontSize: "14px", marginTop: "12px" }}>Buscando piezas en stock...</p>
                    </div>
                  )}

                  {errorPiezas && !loadingArticulos && (
                    <div style={{
                      background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)",
                      borderRadius: "10px", padding: "16px", textAlign: "center",
                    }}>
                      <p style={{ color: "#fca5a5", fontSize: "13px", margin: 0 }}>⚠️ {errorPiezas}</p>
                      <p style={{ color: "#64748b", fontSize: "12px", margin: "8px 0 0" }}>
                        Es posible que esta categoria no tenga piezas en stock
                      </p>
                    </div>
                  )}

                  {categoriaSeleccionada && !loadingArticulos && !errorPiezas && (
                    <>
                      <div style={{ marginBottom: "16px", paddingBottom: "12px", borderBottom: "1px solid #1e293b" }}>
                        <h3 style={{ color: "#e2e8f0", fontSize: "16px", fontWeight: 700, margin: "0 0 6px" }}>
                          {nombreCategoria}
                        </h3>
                        {infoCatalogo && (
                          <div style={{ display: "flex", gap: "16px" }}>
                            <span style={{ color: infoCatalogo.total_en_stock > 0 ? "#4ade80" : "#64748b", fontSize: "12px", fontWeight: 600 }}>
                              ✅ {infoCatalogo.total_en_stock} en stock
                            </span>
                          </div>
                        )}
                      </div>

                      {articulos.length === 0 ? (
                        <div style={{ textAlign: "center", padding: "40px 20px", color: "#475569" }}>
                          <p style={{ fontSize: "14px" }}>No se encontraron piezas en stock para esta categoria</p>
                        </div>
                      ) : (
                        <div style={{ display: "grid", gap: "12px" }}>
                          {articulos.map((art, i) => (
                            <div
                              key={`${art.referencia}-${i}`}
                              style={{
                                borderRadius: "12px",
                                border: "1px solid rgba(22,163,74,0.3)",
                                background: "rgba(22,163,74,0.04)",
                                overflow: "hidden",
                              }}
                            >
                              {/* Cabecera del artículo */}
                              <div style={{
                                padding: "14px 16px",
                                borderBottom: "1px solid rgba(255,255,255,0.06)",
                                display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap",
                              }}>
                                <span style={{ color: "#e2e8f0", fontSize: "15px", fontWeight: 700, fontFamily: "monospace" }}>
                                  {art.referencia}
                                </span>
                                <span style={{
                                  background: "rgba(37,99,235,0.12)", borderRadius: "6px",
                                  padding: "2px 8px", color: "#93c5fd", fontSize: "11px", fontWeight: 600,
                                }}>
                                  {art.marca}
                                </span>
                                {art.fuente === "cruce" && (
                                  <span style={{
                                    background: "rgba(168,85,247,0.12)", borderRadius: "6px",
                                    padding: "2px 8px", color: "#c084fc", fontSize: "10px", fontWeight: 600,
                                  }}>
                                    CRUCE
                                  </span>
                                )}
                                {art.nombre && (
                                  <span style={{ color: "#94a3b8", fontSize: "12px", marginLeft: "4px" }}>
                                    {art.nombre}
                                  </span>
                                )}
                                {art.precio_desde !== null && (
                                  <span style={{ marginLeft: "auto", color: "#4ade80", fontSize: "16px", fontWeight: 800 }}>
                                    desde {art.precio_desde.toFixed(2)}€
                                  </span>
                                )}
                              </div>

                              {/* Lista de vendedores */}
                              {art.stock.length > 0 && (
                                <div style={{ padding: "0" }}>
                                  {/* Cabecera tabla */}
                                  <div style={{
                                    display: "grid", gridTemplateColumns: "1fr 100px 90px 100px",
                                    padding: "8px 16px", background: "rgba(255,255,255,0.03)",
                                    borderBottom: "1px solid rgba(255,255,255,0.05)",
                                  }}>
                                    <span style={{ color: "#64748b", fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>Vendedor</span>
                                    <span style={{ color: "#64748b", fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>Referencia</span>
                                    <span style={{ color: "#64748b", fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>Tipo</span>
                                    <span style={{ color: "#64748b", fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", textAlign: "right" }}>Precio</span>
                                  </div>
                                  {/* Filas de vendedores */}
                                  {art.stock.map((s: PiezaStock, j: number) => (
                                    <div
                                      key={j}
                                      style={{
                                        display: "grid", gridTemplateColumns: "1fr 100px 90px 100px",
                                        padding: "10px 16px", alignItems: "center",
                                        borderBottom: j < art.stock.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
                                        transition: "background 0.15s",
                                      }}
                                      onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.03)"; }}
                                      onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                                    >
                                      <div>
                                        <span style={{ color: "#e2e8f0", fontSize: "13px", fontWeight: 600 }}>
                                          {s.proveedor_nombre || s.proveedor_id || "Proveedor"}
                                        </span>
                                      </div>
                                      <span style={{ color: "#94a3b8", fontSize: "12px", fontFamily: "monospace" }}>
                                        {s.referencia}
                                      </span>
                                      <span style={{
                                        display: "inline-block", fontSize: "10px", fontWeight: 600, padding: "2px 8px",
                                        borderRadius: "4px",
                                        background: s.tipo === "OEM" ? "rgba(234,179,8,0.12)" : "rgba(37,99,235,0.1)",
                                        color: s.tipo === "OEM" ? "#fde047" : "#93c5fd",
                                        width: "fit-content",
                                      }}>
                                        {s.tipo || "IAM"}
                                      </span>
                                      <span style={{ color: "#4ade80", fontSize: "15px", fontWeight: 800, textAlign: "right" }}>
                                        {s.precio != null ? `${s.precio.toFixed(2)}€` : "—"}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          </>
        )}

        {/* Estado vacío */}
        {!vehiculo && !error && !loading && (
          <div style={{ textAlign: "center", padding: "60px 20px", color: "#334155" }}>
            <div style={{ fontSize: "64px", marginBottom: "16px" }}>🔍</div>
            <p style={{ fontSize: "16px", color: "#475569" }}>Introduce un numero de bastidor (VIN) para decodificar el vehiculo y consultar piezas compatibles</p>
          </div>
        )}

      </div>
    </div>
  );
}
