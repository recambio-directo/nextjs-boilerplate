"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";

// ── TIPOS ──
interface VehiculoVariante {
  id: string;
  nombre_completo: string;
  marca: string;
  modelo: string;
  motor: string;
  combustible: string;
  potencia_kw: string;
  potencia_cv: string;
  cilindrada: string;
  cilindros: string;
  traccion: string;
  carroceria: string;
  inyeccion: string;
  catalizador: string;
  valvulas: string;
  desde: string;
  hasta: string;
  capacidad_motor: string;
  transmision: string;
}

interface InfoVehiculo {
  vin: string;
  matricula_info: string;
  marca_dgt: string;
  combustible_dgt: string;
  fecha_matriculacion: string;
  tipo_vehiculo: string;
  cilindrada_dgt: string;
}

interface GenericoPieza {
  id: string;
  nombre: string;
}

interface Categoria {
  id: string;
  nombre: string;
  hijos: Categoria[];
  generics?: GenericoPieza[];
  icono?: string;
  genericId?: string;
  hasChildren?: boolean;
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
  referencia: string;
  referencia_propia: string;
  marca: string;
  nombre: string;
  descripcion: string;
  imagen: string;
  imagen_logo: string;
  pvp: number | null;
  pvp_neto: number | null;
  descuento: string;
  ean: string;
  stock_ipda: { cantidad: number; color: string; texto: string };
  en_stock_marketplace: boolean;
  stock_marketplace: PiezaStock[];
  precio_marketplace_desde: number | null;
}


// ════════════════════════════════════════════════════════
// COMPONENTE: Árbol de categorías
// ════════════════════════════════════════════════════════
function ArbolCategorias({
  categorias,
  categoriaSeleccionada,
  onSeleccionar,
  nivel = 0,
}: {
  categorias: Categoria[];
  categoriaSeleccionada: string | null;
  onSeleccionar: (cat: Categoria) => void;
  nivel?: number;
}) {
  const [expandidos, setExpandidos] = useState<Set<string>>(new Set());

  const toggleExpandir = (id: string) => {
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
        const tieneGenerics = cat.generics && cat.generics.length > 0;
        const esExpandible = tieneHijos || tieneGenerics;
        const expandido = expandidos.has(cat.id);
        const seleccionado = categoriaSeleccionada === cat.id;
        const esRaiz = nivel === 0;

        return (
          <div key={cat.id || cat.nombre}>
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
                if (tieneHijos) {
                  // Tiene subcategorías: expandir/colapsar
                  toggleExpandir(cat.id);
                } else if (tieneGenerics && cat.generics!.length === 1) {
                  // Un solo genérico: seleccionar directamente sin expandir
                  const gen = cat.generics![0];
                  onSeleccionar({
                    id: cat.id,
                    nombre: gen.nombre || cat.nombre,
                    hijos: [],
                    genericId: gen.id,
                    icono: cat.icono,
                    hasChildren: false,
                  });
                } else if (tieneGenerics) {
                  // Varios genéricos: expandir para mostrarlos
                  toggleExpandir(cat.id);
                } else {
                  // Hoja sin hijos ni genéricos: seleccionar directamente
                  onSeleccionar(cat);
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
              ) : esExpandible ? (
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
              {esExpandible && (
                <span style={{ color: "#475569", fontSize: "10px", flexShrink: 0 }}>
                  {expandido ? "▲" : "▼"}
                </span>
              )}
            </div>
            {expandido && tieneHijos && (
              <ArbolCategorias
                categorias={cat.hijos}
                categoriaSeleccionada={categoriaSeleccionada}
                onSeleccionar={onSeleccionar}
                nivel={nivel + 1}
              />
            )}
            {expandido && tieneGenerics && !tieneHijos && (
              <>
                {cat.generics!.map((gen) => {
                  const genKey = `${cat.id}_${gen.id}`;
                  const genSeleccionado = categoriaSeleccionada === genKey;
                  return (
                    <div
                      key={genKey}
                      style={{
                        display: "flex", alignItems: "center", gap: "8px",
                        padding: "7px 12px",
                        paddingLeft: `${12 + (nivel + 1) * 20}px`,
                        cursor: "pointer", borderRadius: "8px",
                        background: genSeleccionado ? "rgba(37,99,235,0.15)" : "transparent",
                        border: genSeleccionado ? "1px solid rgba(37,99,235,0.3)" : "1px solid transparent",
                        transition: "all 0.15s",
                      }}
                      onClick={() => {
                        onSeleccionar({
                          id: cat.id,
                          nombre: gen.nombre,
                          hijos: [],
                          genericId: gen.id,
                          icono: cat.icono,
                          hasChildren: false,
                        });
                      }}
                      onMouseEnter={(e) => {
                        if (!genSeleccionado) e.currentTarget.style.background = "rgba(255,255,255,0.04)";
                      }}
                      onMouseLeave={(e) => {
                        if (!genSeleccionado) e.currentTarget.style.background = "transparent";
                      }}
                    >
                      <span style={{ width: "16px", flexShrink: 0 }} />
                      <span style={{
                        color: genSeleccionado ? "#93c5fd" : "#94a3b8",
                        fontSize: "13px",
                        fontWeight: genSeleccionado ? 600 : 400,
                        flex: 1,
                      }}>
                        {gen.nombre}
                      </span>
                    </div>
                  );
                })}
              </>
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
  const [userId, setUserId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [tipoBusqueda, setTipoBusqueda] = useState<"vin" | "matricula">("matricula");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Resultados búsqueda
  const [infoVehiculo, setInfoVehiculo] = useState<InfoVehiculo | null>(null);
  const [variantes, setVariantes] = useState<VehiculoVariante[]>([]);
  const [varianteSeleccionada, setVarianteSeleccionada] = useState<VehiculoVariante | null>(null);

  // Catálogo
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loadingCategorias, setLoadingCategorias] = useState(false);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<string | null>(null);
  const [nombreCategoria, setNombreCategoria] = useState("");
  const [articulos, setArticulos] = useState<ArticuloCatalogo[]>([]);
  const [loadingArticulos, setLoadingArticulos] = useState(false);
  const [infoCatalogo, setInfoCatalogo] = useState<{ total_tecdoc: number; total_en_stock: number } | null>(null);
  const [mostrarFicha, setMostrarFicha] = useState(false);
  const [errorPiezas, setErrorPiezas] = useState<string | null>(null);
  const [cestaMensaje, setCestaMensaje] = useState<string | null>(null);
  const [abriendo, setAbriendo] = useState(false);

  useEffect(() => {
    const checkAcceso = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);
    };
    checkAcceso();
  }, []);

  // ── Auto-búsqueda desde query param ?q= ──
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const q = params.get("q")?.trim();
    if (q) {
      setInput(q.toUpperCase());
      // Detectar si es VIN (17 caracteres alfanuméricos)
      if (/^[A-HJ-NPR-Z0-9]{17}$/i.test(q)) {
        setTipoBusqueda("vin");
      } else {
        setTipoBusqueda("matricula");
      }
      buscar(q.toUpperCase());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Añadir pieza a la cesta (tabla cesta en Supabase) ──
  const pedirPieza = async (stock: PiezaStock, refTecdoc: string) => {
    if (!userId) { alert("Inicia sesión para añadir a la cesta"); return; }
    if (stock.proveedor_id === userId) { alert("No puedes añadir tus propias piezas"); return; }
    const { error: err } = await supabase.from("cesta").insert({
      user_id: userId,
      referencia: stock.referencia || refTecdoc,
      descripcion: stock.nombre || refTecdoc,
      precio: stock.precio,
      impuesto: 0,
      cantidad: 1,
      stock: 99,
      proveedor_id: stock.proveedor_id,
      proveedor_nombre: stock.proveedor_nombre,
    });
    if (err) { alert("Error al añadir a la cesta"); return; }
    setCestaMensaje(`${stock.referencia}_${stock.proveedor_id}`);
    setTimeout(() => setCestaMensaje(null), 2500);
  };

  // ── Abrir chat con proveedor ──
  const contactarProveedor = async (stock: PiezaStock) => {
    if (!userId) { alert("Inicia sesión para contactar"); return; }
    if (!stock.proveedor_id) return;
    setAbriendo(true);
    try {
      const { data: conv1 } = await supabase.from("conversaciones").select("id")
        .eq("user1_id", userId).eq("user2_id", stock.proveedor_id).maybeSingle();
      const { data: conv2 } = await supabase.from("conversaciones").select("id")
        .eq("user1_id", stock.proveedor_id).eq("user2_id", userId).maybeSingle();
      const convExistente = conv1 || conv2;
      if (convExistente) { window.open(`/chat?conv=${convExistente.id}`, '_blank'); return; }
      const { data: nuevaConv, error: err } = await supabase.from("conversaciones").insert({
        user1_id: userId,
        user2_id: stock.proveedor_id,
        referencia: stock.referencia,
        ultimo_mensaje: "",
        updated_at: new Date().toISOString(),
      }).select("id").single();
      if (!err && nuevaConv) window.open(`/chat?conv=${nuevaConv.id}`, '_blank');
    } finally {
      setAbriendo(false);
    }
  };

  // Cargar categorías para el vehículo seleccionado
  const cargarCategorias = async (vehicleId: string) => {
    setLoadingCategorias(true);
    setCategorias([]);
    setCategoriaSeleccionada(null);
    setArticulos([]);
    setInfoCatalogo(null);
    setErrorPiezas(null);
    try {
      const res = await fetch(`/api/vehiculo/categorias?vehicleId=${encodeURIComponent(vehicleId)}`);
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

  // Cargar piezas de una categoría
  const cargarPiezas = async (cat: Categoria) => {
    if (!varianteSeleccionada) return;
    // ID visual: nodoId_genericId para distinguir genéricos del mismo nodo
    const selKey = cat.genericId ? `${cat.id}_${cat.genericId}` : cat.id;
    setCategoriaSeleccionada(selKey);
    setNombreCategoria(cat.nombre);
    setLoadingArticulos(true);
    setArticulos([]);
    setInfoCatalogo(null);
    setErrorPiezas(null);
    try {
      const params = new URLSearchParams({
        vehicleId: varianteSeleccionada.id,
        nodoId: cat.id,
        genericoId: cat.genericId || "",
        nombre: cat.nombre,
      });
      const res = await fetch(`/api/vehiculo/piezas?${params.toString()}`);
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

  // Seleccionar variante del vehículo
  const seleccionarVariante = (v: VehiculoVariante) => {
    setVarianteSeleccionada(v);
    setCategorias([]);
    setCategoriaSeleccionada(null);
    setArticulos([]);
    setInfoCatalogo(null);
    setErrorPiezas(null);
    setMostrarFicha(false);
    cargarCategorias(v.id);
  };

  // Catálogo de vehículos incluido para todos los usuarios

  const buscar = async (valorDirecto?: string) => {
    const valor = (valorDirecto ?? input).trim();
    if (!valor) return;
    setLoading(true);
    setError(null);
    setInfoVehiculo(null);
    setVariantes([]);
    setVarianteSeleccionada(null);
    setCategorias([]);
    setCategoriaSeleccionada(null);
    setArticulos([]);
    setInfoCatalogo(null);
    setMostrarFicha(false);
    setErrorPiezas(null);

    try {
      const res = await fetch(`/api/vehiculo?busqueda=${encodeURIComponent(valor)}`);
      const json = await res.json();

      if (!res.ok) {
        setError(json.error || "No se pudo encontrar el vehículo");
      } else {
        setInfoVehiculo(json.info);
        setVariantes(json.vehiculos || []);

        // Si solo hay una variante, seleccionarla automáticamente
        if (json.vehiculos && json.vehiculos.length === 1) {
          seleccionarVariante(json.vehiculos[0]);
        }

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

        {/* Catálogo de vehículos — incluido en la suscripción */}

        {/* Header */}
        <div style={{ marginBottom: "24px" }}>
          <h1 style={{ color: "#e2e8f0", fontSize: "28px", fontWeight: 800, margin: "0 0 8px" }}>
            🚗 Catalogo de Vehiculos
          </h1>
          <p style={{ color: "#64748b", fontSize: "14px", margin: 0 }}>
            Busca por bastidor (VIN) o matricula y navega el catalogo de piezas compatibles
          </p>
        </div>

        {/* Buscador con toggle VIN/Matrícula */}
        <div style={{
          background: "rgba(255,255,255,0.03)", border: "1px solid #1e293b",
          borderRadius: "16px", padding: "20px", marginBottom: "20px",
        }}>
          {/* Toggle tipo búsqueda */}
          <div style={{ display: "flex", gap: "4px", marginBottom: "12px", background: "#0f172a", borderRadius: "10px", padding: "4px", width: "fit-content" }}>
            <button
              onClick={() => { setTipoBusqueda("matricula"); setInput(""); }}
              style={{
                padding: "8px 20px", borderRadius: "8px", border: "none",
                background: tipoBusqueda === "matricula" ? "#2563eb" : "transparent",
                color: tipoBusqueda === "matricula" ? "#fff" : "#64748b",
                fontSize: "13px", fontWeight: 700, cursor: "pointer",
              }}
            >
              🚘 Matricula
            </button>
            <button
              onClick={() => { setTipoBusqueda("vin"); setInput(""); }}
              style={{
                padding: "8px 20px", borderRadius: "8px", border: "none",
                background: tipoBusqueda === "vin" ? "#2563eb" : "transparent",
                color: tipoBusqueda === "vin" ? "#fff" : "#64748b",
                fontSize: "13px", fontWeight: 700, cursor: "pointer",
              }}
            >
              🔠 Bastidor (VIN)
            </button>
          </div>

          <div style={{ display: "flex", gap: "12px" }}>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === "Enter" && buscar()}
              placeholder={tipoBusqueda === "vin"
                ? "Introduce el bastidor (VIN) — Ej: VF37ABHY6GN509536"
                : "Introduce la matricula — Ej: 0097JTV"
              }
              maxLength={tipoBusqueda === "vin" ? 17 : 10}
              style={{
                flex: 1, padding: "14px 16px", borderRadius: "10px",
                border: "1px solid #334155", background: "#0f172a", color: "#e2e8f0",
                fontSize: "16px", fontWeight: 600, letterSpacing: tipoBusqueda === "vin" ? "2px" : "3px",
                outline: "none", textTransform: "uppercase", fontFamily: "monospace",
              }}
            />
            <button
              onClick={() => buscar()}
              disabled={loading || input.trim().length < (tipoBusqueda === "vin" ? 17 : 4)}
              style={{
                padding: "14px 28px", borderRadius: "10px", border: "none",
                background: loading ? "#1e40af" : "#2563eb", color: "#fff",
                fontSize: "15px", fontWeight: 700, cursor: loading ? "wait" : "pointer",
                opacity: input.trim().length < (tipoBusqueda === "vin" ? 17 : 4) ? 0.5 : 1,
                display: "flex", alignItems: "center", gap: "8px", whiteSpace: "nowrap",
              }}
            >
              {loading ? (
                <span style={{ display: "inline-block", width: "18px", height: "18px", border: "2px solid rgba(255,255,255,0.3)", borderTop: "2px solid #fff", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
              ) : "🔍"} Buscar
            </button>
          </div>
          {tipoBusqueda === "vin" && (
            <p style={{ color: "#475569", fontSize: "12px", margin: "8px 0 0", paddingLeft: "4px" }}>
              {input.trim().length}/17 caracteres
            </p>
          )}
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


        {/* Info DGT del vehículo */}
        {infoVehiculo && (
          <div style={{
            background: "rgba(255,255,255,0.02)", border: "1px solid #1e293b",
            borderRadius: "12px", padding: "16px 20px", marginBottom: "16px",
            display: "flex", gap: "16px", flexWrap: "wrap", alignItems: "center",
          }}>
            <span style={{ color: "#64748b", fontSize: "12px", fontWeight: 600 }}>📋 DGT:</span>
            {infoVehiculo.marca_dgt && <span style={{ color: "#e2e8f0", fontSize: "13px", fontWeight: 600 }}>{infoVehiculo.marca_dgt}</span>}
            {infoVehiculo.matricula_info && <span style={{ color: "#94a3b8", fontSize: "12px" }}>{infoVehiculo.matricula_info}</span>}
            {infoVehiculo.combustible_dgt && (
              <span style={{ background: "rgba(37,99,235,0.1)", borderRadius: "6px", padding: "2px 8px", color: "#93c5fd", fontSize: "11px" }}>
                ⛽ {infoVehiculo.combustible_dgt}
              </span>
            )}
            {infoVehiculo.cilindrada_dgt && (
              <span style={{ background: "rgba(168,85,247,0.1)", borderRadius: "6px", padding: "2px 8px", color: "#c084fc", fontSize: "11px" }}>
                📐 {infoVehiculo.cilindrada_dgt}cc
              </span>
            )}
            {infoVehiculo.fecha_matriculacion && (
              <span style={{ color: "#64748b", fontSize: "12px" }}>📅 {infoVehiculo.fecha_matriculacion}</span>
            )}
            {infoVehiculo.vin && (
              <span style={{ color: "#475569", fontSize: "11px", fontFamily: "monospace", marginLeft: "auto" }}>VIN: {infoVehiculo.vin}</span>
            )}
          </div>
        )}

        {/* Selector de variante (si hay más de una) */}
        {variantes.length > 1 && !varianteSeleccionada && (
          <div style={{
            background: "rgba(234,179,8,0.06)", border: "1px solid rgba(234,179,8,0.2)",
            borderRadius: "14px", padding: "20px", marginBottom: "20px",
          }}>
            <h3 style={{ color: "#fde047", fontSize: "15px", fontWeight: 700, margin: "0 0 4px" }}>
              ⚠️ Se encontraron {variantes.length} variantes
            </h3>
            <p style={{ color: "#94a3b8", fontSize: "13px", margin: "0 0 16px" }}>
              Selecciona la variante exacta de tu vehiculo:
            </p>
            <div style={{ display: "grid", gap: "8px" }}>
              {variantes.map((v) => (
                <button
                  key={v.id}
                  onClick={() => seleccionarVariante(v)}
                  style={{
                    display: "flex", alignItems: "center", gap: "12px",
                    padding: "14px 18px", borderRadius: "10px",
                    border: "1px solid #334155", background: "rgba(255,255,255,0.03)",
                    color: "#e2e8f0", fontSize: "14px", cursor: "pointer",
                    textAlign: "left", width: "100%",
                    transition: "all 0.15s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(37,99,235,0.1)";
                    e.currentTarget.style.borderColor = "rgba(37,99,235,0.3)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "rgba(255,255,255,0.03)";
                    e.currentTarget.style.borderColor = "#334155";
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, marginBottom: "4px" }}>{v.nombre_completo}</div>
                    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                      {v.motor && (
                        <span style={{ color: "#93c5fd", fontSize: "11px", background: "rgba(37,99,235,0.1)", borderRadius: "4px", padding: "1px 6px" }}>
                          🔧 {v.motor}
                        </span>
                      )}
                      {v.combustible && (
                        <span style={{ color: "#fde047", fontSize: "11px", background: "rgba(234,179,8,0.1)", borderRadius: "4px", padding: "1px 6px" }}>
                          ⛽ {v.combustible}
                        </span>
                      )}
                      {v.potencia_cv && (
                        <span style={{ color: "#4ade80", fontSize: "11px", background: "rgba(22,163,74,0.1)", borderRadius: "4px", padding: "1px 6px" }}>
                          ⚡ {v.potencia_cv} CV / {v.potencia_kw} kW
                        </span>
                      )}
                      {v.carroceria && (
                        <span style={{ color: "#94a3b8", fontSize: "11px", background: "rgba(255,255,255,0.05)", borderRadius: "4px", padding: "1px 6px" }}>
                          🚘 {v.carroceria}
                        </span>
                      )}
                      {v.traccion && (
                        <span style={{ color: "#c084fc", fontSize: "11px", background: "rgba(168,85,247,0.1)", borderRadius: "4px", padding: "1px 6px" }}>
                          🛞 {v.traccion}
                        </span>
                      )}
                      <span style={{ color: "#64748b", fontSize: "11px" }}>
                        {v.desde}{v.hasta ? ` — ${v.hasta}` : " →"}
                      </span>
                    </div>
                  </div>
                  <span style={{ color: "#2563eb", fontSize: "18px" }}>→</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Vehiculo seleccionado */}
        {varianteSeleccionada && (
          <>
            {/* Cabecera vehiculo */}
            <div style={{
              background: "linear-gradient(135deg, rgba(37,99,235,0.1) 0%, rgba(16,185,129,0.1) 100%)",
              border: "1px solid rgba(37,99,235,0.2)", borderRadius: "16px",
              padding: "24px 28px", marginBottom: "20px",
            }}>
              <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", alignItems: "center" }}>
                <div style={{ flex: 1 }}>
                  <h2 style={{ color: "#e2e8f0", fontSize: "22px", fontWeight: 800, margin: "0 0 4px" }}>
                    {varianteSeleccionada.nombre_completo}
                  </h2>
                  <p style={{ color: "#94a3b8", fontSize: "13px", margin: 0 }}>
                    Motor: {varianteSeleccionada.motor}
                    {varianteSeleccionada.desde && ` · Desde: ${varianteSeleccionada.desde}`}
                  </p>
                </div>
                {variantes.length > 1 && (
                  <button
                    onClick={() => {
                      setVarianteSeleccionada(null);
                      setCategorias([]);
                      setCategoriaSeleccionada(null);
                      setArticulos([]);
                    }}
                    style={{
                      padding: "8px 16px", borderRadius: "8px", border: "1px solid #334155",
                      background: "transparent", color: "#94a3b8", fontSize: "12px",
                      fontWeight: 600, cursor: "pointer",
                    }}
                  >
                    ← Cambiar variante
                  </button>
                )}
              </div>

              {/* Tags rápidos */}
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "16px", alignItems: "center" }}>
                {varianteSeleccionada.combustible && (
                  <span style={{ background: "rgba(37,99,235,0.15)", border: "1px solid rgba(37,99,235,0.3)", borderRadius: "8px", padding: "5px 12px", color: "#93c5fd", fontSize: "12px", fontWeight: 600 }}>
                    ⛽ {varianteSeleccionada.combustible}
                  </span>
                )}
                {varianteSeleccionada.potencia_cv && (
                  <span style={{ background: "rgba(234,179,8,0.1)", border: "1px solid rgba(234,179,8,0.3)", borderRadius: "8px", padding: "5px 12px", color: "#fde047", fontSize: "12px", fontWeight: 600 }}>
                    ⚡ {varianteSeleccionada.potencia_cv} CV / {varianteSeleccionada.potencia_kw} kW
                  </span>
                )}
                {varianteSeleccionada.cilindrada && (
                  <span style={{ background: "rgba(168,85,247,0.1)", border: "1px solid rgba(168,85,247,0.3)", borderRadius: "8px", padding: "5px 12px", color: "#c084fc", fontSize: "12px", fontWeight: 600 }}>
                    📐 {varianteSeleccionada.cilindrada} cc
                  </span>
                )}
                {varianteSeleccionada.carroceria && (
                  <span style={{ background: "rgba(255,255,255,0.05)", border: "1px solid #334155", borderRadius: "8px", padding: "5px 12px", color: "#94a3b8", fontSize: "12px", fontWeight: 600 }}>
                    🚘 {varianteSeleccionada.carroceria}
                  </span>
                )}
                {varianteSeleccionada.traccion && (
                  <span style={{ background: "rgba(255,255,255,0.05)", border: "1px solid #334155", borderRadius: "8px", padding: "5px 12px", color: "#94a3b8", fontSize: "12px", fontWeight: 600 }}>
                    🛞 {varianteSeleccionada.traccion}
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
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "16px" }}>
                  <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid #1e293b", borderRadius: "14px", padding: "20px" }}>
                    <h3 style={{ color: "#e2e8f0", fontSize: "14px", fontWeight: 700, margin: "0 0 12px" }}>🔧 Motor</h3>
                    <div style={{ display: "grid", gap: "8px" }}>
                      <Dato icon="🏷️" label="Codigo motor" value={varianteSeleccionada.motor} />
                      <Dato icon="⛽" label="Combustible" value={varianteSeleccionada.combustible} />
                      <Dato icon="💉" label="Inyeccion" value={varianteSeleccionada.inyeccion} />
                      <Dato icon="📐" label="Cilindrada" value={varianteSeleccionada.cilindrada ? `${varianteSeleccionada.cilindrada} cc` : ""} />
                      <Dato icon="🔩" label="Cilindros" value={varianteSeleccionada.cilindros} />
                      <Dato icon="⚡" label="Potencia" value={varianteSeleccionada.potencia_cv ? `${varianteSeleccionada.potencia_cv} CV / ${varianteSeleccionada.potencia_kw} kW` : ""} />
                      <Dato icon="🔧" label="Valvulas" value={varianteSeleccionada.valvulas} />
                      <Dato icon="🌿" label="Catalizador" value={varianteSeleccionada.catalizador} />
                    </div>
                  </div>
                  <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid #1e293b", borderRadius: "14px", padding: "20px" }}>
                    <h3 style={{ color: "#e2e8f0", fontSize: "14px", fontWeight: 700, margin: "0 0 12px" }}>🚘 Vehiculo</h3>
                    <div style={{ display: "grid", gap: "8px" }}>
                      <Dato icon="🏎️" label="Carroceria" value={varianteSeleccionada.carroceria} />
                      <Dato icon="🛞" label="Traccion" value={varianteSeleccionada.traccion} />
                      <Dato icon="⚙️" label="Transmision" value={varianteSeleccionada.transmision} />
                      <Dato icon="📐" label="Capacidad motor" value={varianteSeleccionada.capacidad_motor ? `${varianteSeleccionada.capacidad_motor} cc` : ""} />
                      <Dato icon="📅" label="Desde" value={varianteSeleccionada.desde} />
                      <Dato icon="📅" label="Hasta" value={varianteSeleccionada.hasta || "Actualidad"} />
                    </div>
                  </div>
                  {infoVehiculo && (
                    <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid #1e293b", borderRadius: "14px", padding: "20px" }}>
                      <h3 style={{ color: "#e2e8f0", fontSize: "14px", fontWeight: 700, margin: "0 0 12px" }}>📋 Identificacion</h3>
                      <div style={{ display: "grid", gap: "8px" }}>
                        <Dato icon="🔠" label="VIN / Bastidor" value={infoVehiculo.vin} />
                        <Dato icon="📅" label="Fecha matriculacion" value={infoVehiculo.fecha_matriculacion} />
                        <Dato icon="🏷️" label="Tipo" value={infoVehiculo.tipo_vehiculo} />
                        <Dato icon="🏢" label="Marca DGT" value={infoVehiculo.marca_dgt} />
                        <Dato icon="⛽" label="Combustible DGT" value={infoVehiculo.combustible_dgt} />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ═══════════════════════════════════════════════ */}
            {/* CATÁLOGO DE PIEZAS                              */}
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
                    Piezas compatibles verificadas para {varianteSeleccionada.nombre_completo}
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
                      <p style={{ color: "#94a3b8", fontSize: "14px", marginTop: "12px" }}>Buscando piezas compatibles...</p>
                    </div>
                  )}

                  {errorPiezas && !loadingArticulos && (
                    <div style={{
                      background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)",
                      borderRadius: "10px", padding: "16px", textAlign: "center",
                    }}>
                      <p style={{ color: "#fca5a5", fontSize: "13px", margin: 0 }}>⚠️ {errorPiezas}</p>
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
                            <span style={{ color: "#93c5fd", fontSize: "12px", fontWeight: 600 }}>
                              📋 {infoCatalogo.total_tecdoc} referencias
                            </span>
                            <span style={{ color: infoCatalogo.total_en_stock > 0 ? "#4ade80" : "#64748b", fontSize: "12px", fontWeight: 600 }}>
                              ✅ {infoCatalogo.total_en_stock} en stock marketplace
                            </span>
                          </div>
                        )}
                      </div>

                      {articulos.length === 0 ? (
                        <div style={{ textAlign: "center", padding: "40px 20px", color: "#475569" }}>
                          <p style={{ fontSize: "14px" }}>No se encontraron piezas para esta categoria</p>
                        </div>
                      ) : (
                        <div style={{ display: "grid", gap: "12px" }}>
                          {articulos.map((art, i) => (
                            <div
                              key={`${art.referencia}-${i}`}
                              style={{
                                borderRadius: "12px",
                                border: art.en_stock_marketplace
                                  ? "1px solid rgba(22,163,74,0.3)"
                                  : "1px solid #1e293b",
                                background: art.en_stock_marketplace
                                  ? "rgba(22,163,74,0.04)"
                                  : "rgba(255,255,255,0.02)",
                                overflow: "hidden",
                              }}
                            >
                              {/* Cabecera del artículo */}
                              <div style={{
                                padding: "14px 16px",
                                borderBottom: "1px solid rgba(255,255,255,0.06)",
                                display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap",
                              }}>
                                {art.imagen_logo && (
                                  <img
                                    src={art.imagen_logo}
                                    alt={art.marca}
                                    style={{ height: "24px", objectFit: "contain" }}
                                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                                  />
                                )}
                                <span style={{ color: "#e2e8f0", fontSize: "15px", fontWeight: 700, fontFamily: "monospace" }}>
                                  {art.referencia}
                                </span>
                                <span style={{
                                  background: "rgba(37,99,235,0.12)", borderRadius: "6px",
                                  padding: "2px 8px", color: "#93c5fd", fontSize: "11px", fontWeight: 600,
                                }}>
                                  {art.marca}
                                </span>
                                {art.nombre && (
                                  <span style={{ color: "#94a3b8", fontSize: "12px" }}>
                                    {art.nombre}
                                  </span>
                                )}
                                {art.en_stock_marketplace ? (
                                  <span style={{
                                    marginLeft: "auto", background: "rgba(22,163,74,0.15)",
                                    borderRadius: "6px", padding: "3px 10px",
                                    color: "#4ade80", fontSize: "12px", fontWeight: 700,
                                  }}>
                                    ✅ En stock
                                  </span>
                                ) : (
                                  <span style={{
                                    marginLeft: "auto", color: "#64748b", fontSize: "11px",
                                  }}>
                                    Sin stock marketplace
                                  </span>
                                )}
                              </div>

                              {/* Descripcion / características */}
                              {art.descripcion && (
                                <div style={{ padding: "8px 16px", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                                  <p style={{ color: "#64748b", fontSize: "11px", margin: 0, lineHeight: 1.5 }}>
                                    {art.descripcion}
                                  </p>
                                </div>
                              )}

                              {/* PVP del fabricante */}
                              {art.pvp_neto !== null && (
                                <div style={{
                                  padding: "8px 16px",
                                  borderBottom: art.stock_marketplace.length > 0 ? "1px solid rgba(255,255,255,0.04)" : "none",
                                  display: "flex", gap: "12px", alignItems: "center",
                                }}>
                                  <span style={{ color: "#64748b", fontSize: "11px" }}>PVP: {art.pvp !== null ? `${Number(art.pvp).toFixed(2)}€` : "—"}</span>
                                  {art.descuento && <span style={{ color: "#64748b", fontSize: "11px" }}>Dto: {art.descuento}%</span>}
                                  <span style={{ color: "#94a3b8", fontSize: "12px", fontWeight: 600 }}>Neto: {art.pvp_neto.toFixed(2)}€</span>
                                  {art.stock_ipda.cantidad > 0 && (
                                    <span style={{
                                      background: art.stock_ipda.color === "verde" ? "rgba(22,163,74,0.12)" : "rgba(234,179,8,0.12)",
                                      borderRadius: "4px", padding: "1px 8px",
                                      color: art.stock_ipda.color === "verde" ? "#4ade80" : "#fde047",
                                      fontSize: "11px", fontWeight: 600,
                                    }}>
                                      Stock: {art.stock_ipda.texto}
                                    </span>
                                  )}
                                </div>
                              )}

                              {/* Lista de vendedores del marketplace */}
                              {art.stock_marketplace.length > 0 && (
                                <div>
                                  <div style={{
                                    display: "grid", gridTemplateColumns: "1fr 110px 70px 90px 120px",
                                    padding: "8px 16px", background: "rgba(255,255,255,0.03)",
                                    borderBottom: "1px solid rgba(255,255,255,0.05)",
                                  }}>
                                    <span style={{ color: "#64748b", fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>Vendedor</span>
                                    <span style={{ color: "#64748b", fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>Referencia</span>
                                    <span style={{ color: "#64748b", fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>Tipo</span>
                                    <span style={{ color: "#64748b", fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", textAlign: "right" }}>Precio</span>
                                    <span style={{ color: "#64748b", fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", textAlign: "center" }}>Accion</span>
                                  </div>
                                  {art.stock_marketplace.map((s, j) => (
                                    <div
                                      key={j}
                                      style={{
                                        display: "grid", gridTemplateColumns: "1fr 110px 70px 90px 120px",
                                        padding: "10px 16px", alignItems: "center",
                                        borderBottom: j < art.stock_marketplace.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
                                        transition: "background 0.15s",
                                      }}
                                      onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.03)"; }}
                                      onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                                    >
                                      <span style={{ color: "#e2e8f0", fontSize: "13px", fontWeight: 600 }}>
                                        {s.proveedor_nombre || s.proveedor_id || "Proveedor"}
                                      </span>
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
                                      <div style={{ display: "flex", gap: "6px", justifyContent: "center" }}>
                                        <button
                                          onClick={() => pedirPieza(s, art.referencia)}
                                          disabled={cestaMensaje === `${s.referencia}_${s.proveedor_id}`}
                                          style={{
                                            padding: "5px 10px", borderRadius: "6px", border: "none",
                                            background: cestaMensaje === `${s.referencia}_${s.proveedor_id}`
                                              ? "#065f46" : "linear-gradient(135deg,#16a34a,#15803d)",
                                            color: "#fff",
                                            fontSize: "11px", fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap",
                                          }}
                                          title="Añadir al carrito"
                                        >
                                          {cestaMensaje === `${s.referencia}_${s.proveedor_id}` ? "✅ Añadido" : "🛒 Pedir"}
                                        </button>
                                        <button
                                          onClick={() => contactarProveedor(s)}
                                          disabled={abriendo}
                                          style={{
                                            padding: "5px 10px", borderRadius: "6px",
                                            border: "1px solid #334155", background: "transparent",
                                            color: "#94a3b8", fontSize: "11px", fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap",
                                          }}
                                          title="Contactar proveedor"
                                        >
                                          💬
                                        </button>
                                      </div>
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
        {!varianteSeleccionada && variantes.length === 0 && !error && !loading && (
          <div style={{ textAlign: "center", padding: "60px 20px", color: "#334155" }}>
            <div style={{ fontSize: "64px", marginBottom: "16px" }}>🔍</div>
            <p style={{ fontSize: "16px", color: "#475569" }}>Introduce un bastidor (VIN) o matricula para buscar el vehiculo y consultar piezas compatibles</p>
          </div>
        )}

      </div>
    </div>
  );
}
