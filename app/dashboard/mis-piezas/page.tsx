"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

export default function MisPiezasPage() {
  const [piezas, setPiezas] = useState<any[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [nombreEmpresa, setNombreEmpresa] = useState("");
  const [cargando, setCargando] = useState(true);
  const [seccion, setSeccion] = useState<"lista" | "publicar">("lista");
  const [guardando, setGuardando] = useState(false);
  const [guardado, setGuardado] = useState(false);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [editPrecio, setEditPrecio] = useState("");
  const [editStock, setEditStock] = useState("");
  const [busqueda, setBusqueda] = useState("");

  // Formulario
  const [formReferencia, setFormReferencia] = useState("");
  const [formDescripcion, setFormDescripcion] = useState("");
  const [formMarca, setFormMarca] = useState("");
  const [formPrecio, setFormPrecio] = useState("");
  const [formStock, setFormStock] = useState("");
  const [formMotivo, setFormMotivo] = useState("devolucion");
  const [formTipo, setFormTipo] = useState("OEM");
  const [formFoto, setFormFoto] = useState<File | null>(null);
  const [formFotoPreview, setFormFotoPreview] = useState<string | null>(null);
  const [subiendoFoto, setSubiendoFoto] = useState(false);

  useEffect(() => { cargarDatos(); }, []);

  async function cargarDatos() {
    setCargando(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setUserId(user.id);

    const { data: perfil } = await supabase
      .from("usuarios")
      .select("nombre_empresa, provincia")
      .eq("id", user.id)
      .single();
    if (perfil?.nombre_empresa) setNombreEmpresa(perfil.nombre_empresa);

    const { data } = await supabase
      .from("piezas_publicadas")
      .select("*")
      .eq("proveedor_id", user.id)
      .eq("tipo_vendedor", "taller")
      .order("id", { ascending: false });

    setPiezas(data || []);
    setCargando(false);
  }

  async function publicarPieza() {
    if (!formReferencia || !formDescripcion || !formPrecio || !formStock) {
      alert("Rellena todos los campos obligatorios");
      return;
    }
    if (formTipo === "UNIVERSAL" && !formFoto) { alert("Las piezas universales requieren una foto"); return; }
    setGuardando(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: perfil } = await supabase
      .from("usuarios")
      .select("provincia")
      .eq("id", user.id)
      .single();

    // Subir foto si es UNIVERSAL
    let fotoUrl: string | null = null;
    if (formTipo === "UNIVERSAL" && formFoto) {
      setSubiendoFoto(true);
      const path = `piezas/${user.id}/${Date.now()}_${formFoto.name}`;
      const { error: uploadError } = await supabase.storage.from("piezas-fotos").upload(path, formFoto, { contentType: formFoto.type });
      if (uploadError) { alert("Error al subir la foto: " + uploadError.message); setGuardando(false); setSubiendoFoto(false); return; }
      const { data: urlData } = supabase.storage.from("piezas-fotos").getPublicUrl(path);
      fotoUrl = urlData.publicUrl;
      setSubiendoFoto(false);
    }

    const { error } = await supabase.from("piezas_publicadas").insert({
      proveedor_id: user.id,
      proveedor_nombre: nombreEmpresa,
      referencia: formReferencia.toUpperCase().trim(),
      descripcion: formDescripcion.toUpperCase().trim(),
      marca: formMarca.toUpperCase().trim() || null,
      precio: parseFloat(formPrecio),
      stock: parseInt(formStock),
      provincia: perfil?.provincia || null,
      tipo_vendedor: "taller",
      categoria: formMotivo,
      tipo: formTipo,
      foto_url: fotoUrl,
    });

    setGuardando(false);
    if (error) { alert("Error: " + error.message); return; }

    setFormReferencia(""); setFormDescripcion(""); setFormMarca("");
    setFormPrecio(""); setFormStock(""); setFormMotivo("devolucion");
    setFormTipo("OEM"); setFormFoto(null); setFormFotoPreview(null);
    setGuardado(true);
    setTimeout(() => setGuardado(false), 3000);
    cargarDatos();
    setSeccion("lista");
  }

  async function eliminarPieza(id: number) {
    if (!confirm("¿Eliminar esta pieza?")) return;
    await supabase.from("piezas_publicadas").delete().eq("id", id);
    cargarDatos();
  }

  async function guardarEdicion(id: number) {
    await supabase.from("piezas_publicadas")
      .update({ precio: parseFloat(editPrecio), stock: parseInt(editStock) })
      .eq("id", id);
    setEditandoId(null);
    cargarDatos();
  }

  const piezasFiltradas = piezas.filter(p => {
    if (!busqueda) return true;
    const q = busqueda.toLowerCase();
    return (
      p.referencia?.toLowerCase().includes(q) ||
      p.descripcion?.toLowerCase().includes(q) ||
      p.marca?.toLowerCase().includes(q)
    );
  });

  return (
    <main style={mainStyle}>

      <div style={topHeader}>
        <div>
          <div style={badgeStyle}>MI TALLER</div>
          <h1 style={titleStyle}>MIS PIEZAS SUELTAS</h1>
          <p style={subtitleStyle}>Publica piezas de devolución o excedente para venderlas a otros talleres y proveedores.</p>
        </div>
        <div style={statsBox}>
          <p style={statsLabel}>PUBLICADAS</p>
          <h2 style={statsValue}>{piezas.length}</h2>
        </div>
      </div>

      <div style={avisoBox}>
        <span style={{ fontSize: 20 }}>💡</span>
        <p style={{ fontSize: 14, lineHeight: 1.6 }}>
          Tus piezas aparecen en el buscador igual que las de los proveedores. Otros talleres y proveedores podrán encontrarlas y añadirlas a su cesta.
          Ideal para piezas de devolución que el proveedor no abona.
        </p>
      </div>

      <div style={tabsContainer}>
        <button onClick={() => setSeccion("lista")} style={seccion === "lista" ? tabActive : tabInactive}>
          📦 Mis piezas ({piezas.length})
        </button>
        <button onClick={() => setSeccion("publicar")} style={seccion === "publicar" ? tabActive : tabInactive}>
          ➕ Publicar pieza
        </button>
      </div>

      {/* ===== LISTA ===== */}
      {seccion === "lista" && (
        <div>
          {guardado && <div style={successBanner}>✅ Pieza publicada correctamente</div>}

          {piezas.length === 0 ? (
            <div style={emptyState}>
              <p style={{ fontSize: 60, marginBottom: 16 }}>🔧</p>
              <h2 style={{ fontSize: 24, fontWeight: 900 }}>No tienes piezas publicadas</h2>
              <p style={{ color: "#94a3b8", marginTop: 10, marginBottom: 24 }}>Publica tu primera pieza suelta y empieza a vender</p>
              <button onClick={() => setSeccion("publicar")} style={btnPublicar}>➕ PUBLICAR PIEZA</button>
            </div>
          ) : (
            <>
              <div style={searchBox}>
                <span style={{ fontSize: 18, marginRight: 10 }}>🔍</span>
                <input placeholder="Buscar por referencia, descripción o marca..." value={busqueda} onChange={e => setBusqueda(e.target.value)} style={searchInput} />
                {busqueda && <button onClick={() => setBusqueda("")} style={btnLimpiar}>✕</button>}
              </div>

              <div style={tableContainer}>
                <table style={tableStyle}>
                  <thead>
                    <tr>
                      {["REFERENCIA", "TIPO", "DESCRIPCIÓN", "MARCA", "MOTIVO", "PRECIO", "STOCK", "ACCIONES"].map(h => (
                        <th key={h} style={thStyle}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {piezasFiltradas.map(pieza => (
                      <tr key={pieza.id} style={trStyle}>
                        <td style={tdStyle}><strong style={{ color: "#60a5fa" }}>{pieza.referencia}</strong></td>
                        <td style={tdStyle}>
                          <span style={{
                            background: pieza.tipo === "OEM" ? "rgba(37,99,235,0.2)" : "rgba(139,92,246,0.2)",
                            color: pieza.tipo === "OEM" ? "#60a5fa" : "#a78bfa",
                            padding: "3px 10px", borderRadius: 999, fontSize: 12, fontWeight: 700
                          }}>
                            {pieza.tipo || "OEM"}
                          </span>
                        </td>
                        <td style={tdStyle}>{pieza.descripcion}</td>
                        <td style={tdStyle}>{pieza.marca || "-"}</td>
                        <td style={tdStyle}>
                          <span style={{
                            background: pieza.categoria === "devolucion" ? "rgba(239,68,68,0.15)" : "rgba(245,158,11,0.15)",
                            color: pieza.categoria === "devolucion" ? "#f87171" : "#fbbf24",
                            padding: "3px 10px", borderRadius: 999, fontSize: 12, fontWeight: 700
                          }}>
                            {pieza.categoria === "devolucion" ? "Devolución" : "Excedente"}
                          </span>
                        </td>
                        <td style={tdStyle}>
                          {editandoId === pieza.id
                            ? <input value={editPrecio} onChange={e => setEditPrecio(e.target.value)} style={miniInput} type="number" />
                            : <span style={{ color: "#22c55e", fontWeight: 900 }}>{pieza.precio}€</span>}
                        </td>
                        <td style={tdStyle}>
                          {editandoId === pieza.id
                            ? <input value={editStock} onChange={e => setEditStock(e.target.value)} style={miniInput} type="number" />
                            : <span style={stockBadge}>{pieza.stock} uds</span>}
                        </td>
                        <td style={tdStyle}>
                          {editandoId === pieza.id
                            ? <button onClick={() => guardarEdicion(pieza.id)} style={btnGuardar}>✓ OK</button>
                            : <button onClick={() => { setEditandoId(pieza.id); setEditPrecio(String(pieza.precio)); setEditStock(String(pieza.stock)); }} style={btnEditar}>✏️</button>}
                          <button onClick={() => eliminarPieza(pieza.id)} style={btnEliminar}>🗑️</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}

      {/* ===== PUBLICAR ===== */}
      {seccion === "publicar" && (
        <div style={formCard}>
          <h2 style={{ fontSize: 28, fontWeight: 900, marginBottom: 8 }}>Nueva pieza suelta</h2>
          <p style={{ color: "#94a3b8", fontSize: 15, marginBottom: 32 }}>Rellena los datos de la pieza que quieres vender.</p>

          {/* MOTIVO */}
          <div style={{ marginBottom: 28 }}>
            <p style={formLabel}>Motivo de venta *</p>
            <div style={{ display: "flex", gap: 12 }}>
              <button
                onClick={() => setFormMotivo("devolucion")}
                style={{ ...motivoBtn, background: formMotivo === "devolucion" ? "rgba(239,68,68,0.2)" : "rgba(255,255,255,0.05)", border: formMotivo === "devolucion" ? "1px solid rgba(239,68,68,0.4)" : "1px solid rgba(255,255,255,0.08)", color: formMotivo === "devolucion" ? "#f87171" : "#94a3b8" }}
              >
                🔄 Devolución
              </button>
              <button
                onClick={() => setFormMotivo("excedente")}
                style={{ ...motivoBtn, background: formMotivo === "excedente" ? "rgba(245,158,11,0.2)" : "rgba(255,255,255,0.05)", border: formMotivo === "excedente" ? "1px solid rgba(245,158,11,0.4)" : "1px solid rgba(255,255,255,0.08)", color: formMotivo === "excedente" ? "#fbbf24" : "#94a3b8" }}
              >
                📦 Excedente de stock
              </button>
            </div>
          </div>

          <div style={formGrid}>
            <div>
              <p style={formLabel}>Referencia *</p>
              <input placeholder="Ej: W79, HU716..." value={formReferencia} onChange={e => setFormReferencia(e.target.value)} style={formInput} />
            </div>
            {/* TIPO OEM / IAM / UNIVERSAL */}
            <div>
              <p style={formLabel}>Tipo de referencia *</p>
              <select
                value={formTipo}
                onChange={e => { setFormTipo(e.target.value); setFormFoto(null); setFormFotoPreview(null); }}
                style={selectInput}
              >
                <option value="OEM">OEM — Referencia original del fabricante</option>
                <option value="IAM">IAM — Aftermarket / Equivalente</option>
                <option value="UNIVERSAL">UNIVERSAL — Pieza universal (requiere foto)</option>
              </select>
            </div>
          </div>

          <div style={{ ...formGrid, marginTop: 20 }}>
            <div>
              <p style={formLabel}>Marca</p>
              <input placeholder="Ej: MANN, BOSCH..." value={formMarca} onChange={e => setFormMarca(e.target.value)} style={formInput} />
            </div>
            <div>
              {/* Info tipo seleccionado */}
              <div style={{
                background: formTipo === "OEM" ? "rgba(37,99,235,0.08)" : "rgba(139,92,246,0.08)",
                border: formTipo === "OEM" ? "1px solid rgba(37,99,235,0.2)" : "1px solid rgba(139,92,246,0.2)",
                borderRadius: 12, padding: "14px 16px", marginTop: 28,
              }}>
                {formTipo === "OEM" ? (
                  <>
                    <p style={{ color: "#60a5fa", fontWeight: 700, fontSize: 13, marginBottom: 4 }}>🔵 OEM — Original</p>
                    <p style={{ color: "#94a3b8", fontSize: 12 }}>Referencia del fabricante original del vehículo. Mayor valor de mercado.</p>
                  </>
                ) : (
                  <>
                    <p style={{ color: "#a78bfa", fontWeight: 700, fontSize: 13, marginBottom: 4 }}>🟣 IAM — Aftermarket</p>
                    <p style={{ color: "#94a3b8", fontSize: 12 }}>Pieza equivalente de fabricante aftermarket. Compatible con la referencia original.</p>
                  </>
                )}
              </div>
            </div>
          </div>

          <div style={{ marginTop: 20 }}>
            <p style={formLabel}>Descripción *</p>
            <input placeholder="Ej: FILTRO DE ACEITE MANN W79" value={formDescripcion} onChange={e => setFormDescripcion(e.target.value)} style={formInput} />
          </div>

          {/* FOTO — solo si UNIVERSAL */}
          {formTipo === "UNIVERSAL" && (
            <div style={{ marginTop: 20 }}>
              <p style={formLabel}>Foto de la pieza * <span style={{ color: "#f87171", fontSize: 12 }}>(obligatoria para Universal)</span></p>
              {formFotoPreview ? (
                <div style={{ position: "relative", display: "inline-block" }}>
                  <img src={formFotoPreview} alt="Preview" style={{ width: 200, height: 150, objectFit: "cover", borderRadius: 12, border: "1px solid rgba(255,255,255,0.1)" }} />
                  <button onClick={() => { setFormFoto(null); setFormFotoPreview(null); }} style={{ position: "absolute", top: 6, right: 6, background: "rgba(239,68,68,0.8)", border: "none", color: "white", width: 26, height: 26, borderRadius: "50%", cursor: "pointer", fontWeight: 900, fontSize: 14 }}>✕</button>
                </div>
              ) : (
                <label style={{ display: "flex", alignItems: "center", gap: 10, background: "rgba(22,163,74,0.1)", border: "2px dashed rgba(22,163,74,0.4)", borderRadius: 14, padding: "20px 24px", cursor: "pointer", color: "#4ade80", fontWeight: 700 }}>
                  📸 Subir foto (JPG, PNG)
                  <input type="file" accept="image/*" style={{ display: "none" }} onChange={e => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    setFormFoto(file);
                    setFormFotoPreview(URL.createObjectURL(file));
                  }} />
                </label>
              )}
              {formTipo === "UNIVERSAL" && !formFoto && (
                <p style={{ color: "#f87171", fontSize: 12, marginTop: 8 }}>⚠️ Debes subir una foto para continuar</p>
              )}
            </div>
          )}

          <div style={{ ...formGrid, marginTop: 24 }}>
            <div>
              <p style={formLabel}>Precio (€) *</p>
              <input placeholder="Ej: 5.42" value={formPrecio} onChange={e => setFormPrecio(e.target.value)} style={formInput} type="number" step="0.01" />
            </div>
            <div>
              <p style={formLabel}>Unidades disponibles *</p>
              <input placeholder="Ej: 1" value={formStock} onChange={e => setFormStock(e.target.value)} style={formInput} type="number" min="1" />
            </div>
          </div>

          <div style={{ marginTop: 32, display: "flex", gap: 16 }}>
            <button onClick={publicarPieza} disabled={guardando || subiendoFoto} style={{ ...btnPublicar, opacity: (guardando || subiendoFoto) ? 0.7 : 1 }}>
              {subiendoFoto ? "SUBIENDO FOTO..." : guardando ? "PUBLICANDO..." : "✓ PUBLICAR PIEZA"}
            </button>
            <button onClick={() => setSeccion("lista")} style={btnCancelar}>Cancelar</button>
          </div>
        </div>
      )}

    </main>
  );
}

/* STYLES */
const mainStyle = { padding: "50px", minHeight: "100vh", background: "linear-gradient(135deg,#020617,#020b2d)", color: "white" };
const topHeader = { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 };
const badgeStyle = { display: "inline-block", padding: "10px 18px", borderRadius: "999px", background: "rgba(139,92,246,0.18)", color: "#a78bfa", border: "1px solid rgba(139,92,246,0.3)", marginBottom: "16px", fontWeight: 700 };
const titleStyle = { fontSize: "60px", fontWeight: 900, lineHeight: 1, marginBottom: "16px" };
const subtitleStyle = { color: "#94a3b8", fontSize: "18px", maxWidth: "600px", lineHeight: 1.7 };
const statsBox = { background: "rgba(15,23,42,0.92)", borderRadius: "24px", padding: "24px 32px", border: "1px solid rgba(255,255,255,0.06)", textAlign: "center" as const };
const statsLabel = { color: "#94a3b8", marginBottom: "10px", fontSize: 13, fontWeight: 700 };
const statsValue = { fontSize: "48px", fontWeight: 900 };
const avisoBox = { display: "flex", gap: 14, alignItems: "flex-start", background: "rgba(139,92,246,0.08)", border: "1px solid rgba(139,92,246,0.2)", borderRadius: 16, padding: "16px 20px", marginBottom: 28, color: "#c4b5fd" };
const tabsContainer = { display: "flex", gap: 0, marginBottom: 28, background: "rgba(15,23,42,0.95)", borderRadius: 14, padding: 5, width: "fit-content", border: "1px solid rgba(255,255,255,0.06)" };
const tabActive = { padding: "12px 28px", borderRadius: 10, background: "linear-gradient(135deg,#2563eb,#1d4ed8)", border: "none", color: "white", fontWeight: 800, cursor: "pointer", fontSize: 15 };
const tabInactive = { padding: "12px 28px", borderRadius: 10, background: "transparent", border: "none", color: "#94a3b8", fontWeight: 700, cursor: "pointer", fontSize: 15 };
const successBanner = { background: "rgba(22,163,74,0.15)", border: "1px solid rgba(22,163,74,0.3)", color: "#4ade80", padding: "16px 24px", borderRadius: 16, marginBottom: 24, fontWeight: 700 };
const emptyState = { textAlign: "center" as const, padding: "80px 0" };
const searchBox = { display: "flex", alignItems: "center", background: "rgba(15,23,42,0.95)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: "0 16px", height: 52, marginBottom: 20, maxWidth: 500 };
const searchInput = { flex: 1, background: "transparent", border: "none", color: "white", fontSize: 15, outline: "none" };
const btnLimpiar = { background: "transparent", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: 16 };
const tableContainer = { background: "rgba(15,23,42,0.95)", borderRadius: 24, overflow: "hidden", border: "1px solid rgba(255,255,255,0.06)" };
const tableStyle = { width: "100%", borderCollapse: "collapse" as const };
const thStyle = { padding: "16px 20px", textAlign: "left" as const, color: "#94a3b8", fontSize: 12, fontWeight: 700, borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(0,0,0,0.2)" };
const trStyle = { borderBottom: "1px solid rgba(255,255,255,0.04)" };
const tdStyle = { padding: "16px 20px", fontSize: 15 };
const stockBadge = { background: "rgba(22,163,74,0.2)", color: "#4ade80", padding: "4px 12px", borderRadius: 999, fontWeight: 700, fontSize: 13 };
const miniInput = { background: "#020617", color: "white", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 8, padding: "6px 10px", width: 80, fontSize: 14, outline: "none" };
const btnEditar = { background: "rgba(37,99,235,0.2)", color: "#60a5fa", border: "none", padding: "6px 12px", borderRadius: 8, cursor: "pointer", fontWeight: 700, fontSize: 13, marginRight: 8 };
const btnGuardar = { background: "rgba(22,163,74,0.2)", color: "#4ade80", border: "none", padding: "6px 12px", borderRadius: 8, cursor: "pointer", fontWeight: 700, fontSize: 13, marginRight: 8 };
const btnEliminar = { background: "rgba(239,68,68,0.15)", color: "#f87171", border: "none", padding: "6px 10px", borderRadius: 8, cursor: "pointer", fontSize: 13 };
const formCard = { background: "rgba(15,23,42,0.95)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 28, padding: "40px", maxWidth: 800 };
const formGrid = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 };
const formLabel = { color: "#94a3b8", fontSize: 14, marginBottom: 10 };
const formInput = { width: "100%", background: "#020617", color: "white", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 14, padding: "16px 18px", fontSize: 15, outline: "none", boxSizing: "border-box" as const };
const selectInput = { width: "100%", background: "#020617", color: "white", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 14, padding: "16px 18px", fontSize: 15, outline: "none", boxSizing: "border-box" as const, cursor: "pointer" };
const motivoBtn = { padding: "12px 20px", borderRadius: 12, cursor: "pointer", fontWeight: 700, fontSize: 14 };
const btnPublicar = { background: "linear-gradient(135deg,#16a34a,#15803d)", border: "none", color: "white", padding: "18px 32px", borderRadius: 16, fontWeight: 900, cursor: "pointer", fontSize: 16 };
const btnCancelar = { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#94a3b8", padding: "18px 28px", borderRadius: 16, cursor: "pointer", fontWeight: 700, fontSize: 15 };