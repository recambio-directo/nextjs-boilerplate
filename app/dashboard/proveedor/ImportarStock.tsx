"use client";

import { useState, useRef, useEffect } from "react";
import * as XLSX from "xlsx";
import { supabase } from "../../lib/supabase";

type ResultadoImport = {
  total: number;
  insertadas: number;
  actualizadas: number;
  errores: string[];
};

type MapeoColumnas = {
  referencia: string;
  descripcion: string;
  marca: string;
  precio: string;
  stock: string;
  impuesto?: string;
};

const CAMPOS_OBLIGATORIOS = ["referencia", "descripcion", "marca", "precio", "stock"];
const CAMPOS_OPCIONALES = ["impuesto"];
const CAMPOS_LABELS: Record<string, string> = {
  referencia: "Referencia *",
  descripcion: "Descripción *",
  marca: "Marca *",
  precio: "Precio neto *",
  stock: "Stock *",
  impuesto: "Impuesto / Ecotasa / Casco",
};

export default function ImportarStock({
  proveedorId,
  proveedorNombre,
  onImportado,
}: {
  proveedorId: string;
  proveedorNombre: string;
  onImportado: () => void;
}) {
  const [fase, setFase] = useState<"idle" | "mapeo" | "preview" | "importando" | "done">("idle");
  const [modoImport, setModoImport] = useState<"reemplazar" | "actualizar">("reemplazar");
  const [tipoDefecto, setTipoDefecto] = useState<"OEM" | "IAM" | "UNIVERSAL">("IAM");
  const [filas, setFilas] = useState<any[]>([]);
  const [columnas, setColumnas] = useState<string[]>([]);
  const [mapeo, setMapeo] = useState<MapeoColumnas>({ referencia: "", descripcion: "", marca: "", precio: "", stock: "", impuesto: "" });
  const [resultado, setResultado] = useState<ResultadoImport | null>(null);
  const [progreso, setProgreso] = useState(0);
  const [progresoTexto, setProgresoTexto] = useState("");
  const [nombreArchivo, setNombreArchivo] = useState("");
  const [provinciaPerfil, setProvinciaPerfil] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function cargarProvincia() {
      const { data } = await supabase.from("usuarios").select("provincia").eq("id", proveedorId).single();
      setProvinciaPerfil(data?.provincia || null);
    }
    cargarProvincia();
  }, [proveedorId]);

  function leerArchivo(file: File) {
    setNombreArchivo(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = e.target?.result;
      const wb = XLSX.read(data, { type: "binary" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json<any>(ws, { defval: "" });
      if (json.length === 0) { alert("El archivo está vacío"); return; }

      const cols = Object.keys(json[0]);
      setColumnas(cols);
      setFilas(json);

      // Auto-detectar columnas por nombre similar
      const autoMapeo: MapeoColumnas = { referencia: "", descripcion: "", marca: "", precio: "", stock: "" };
      const buscar = (terminos: string[]) => cols.find(c => terminos.some(t => c.toLowerCase().includes(t))) || "";
      autoMapeo.referencia = buscar(["ref", "codigo", "code", "part"]);
      autoMapeo.descripcion = buscar(["desc", "nombre", "name", "articulo", "detalle"]);
      autoMapeo.marca = buscar(["marca", "brand", "fabricante", "manufacturer"]);
      autoMapeo.precio = buscar(["precio", "price", "pvp", "coste", "neto", "importe"]);
      autoMapeo.stock = buscar(["stock", "cantidad", "qty", "units", "unidad", "disponible"]);
      autoMapeo.impuesto = buscar(["impuesto", "ecotasa", "casco", "eco", "tax", "tasa", "recargo"]);
      setMapeo(autoMapeo);
      setFase("mapeo");
    };
    reader.readAsBinaryString(file);
  }

  function mapeoCompleto() {
    return CAMPOS_OBLIGATORIOS.every(c => mapeo[c as keyof MapeoColumnas] !== "");
  }
  // impuesto es opcional — no bloquea

  function getVal(fila: any, col: string | undefined): string {
    if (!col) return "";
    return String(fila[col] ?? "").trim();
  }

  async function importar() {
    setFase("importando");
    setProgreso(0);

    const errores: string[] = [];
    let insertadas = 0;
    let actualizadas = 0;
    let eliminadas = 0;

    // MODO REEMPLAZAR: borrar todo el stock actual primero
    if (modoImport === "reemplazar") {
      setProgresoTexto("Eliminando stock anterior...");
      const { error: deleteError } = await supabase
        .from("piezas_publicadas")
        .delete()
        .eq("proveedor_id", proveedorId);
      if (deleteError) {
        alert("Error al limpiar el stock anterior: " + deleteError.message);
        setFase("preview");
        return;
      }
      eliminadas = 1; // marcamos que se limpió
    }

    // Preparar todas las filas válidas
    const filasValidas: any[] = [];
    const filasInvalidas: string[] = [];
    const mapaImpuestos = new Map<string, number>(); // refPrincipal -> precio casco

    // PRIMERA PASADA: identificar cascos (desc contiene "CASCO")
    for (let i = 0; i < filas.length; i++) {
      const fila = filas[i];
      const descripcion = getVal(fila, mapeo.descripcion).toUpperCase();
      const referencia = getVal(fila, mapeo.referencia).toUpperCase();
      const precioRaw = getVal(fila, mapeo.precio).replace(",", ".");
      const precio = parseFloat(precioRaw);

      if (descripcion.includes("CASCO") && referencia.endsWith("C") && !isNaN(precio) && precio > 0) {
        // La ref principal es la misma sin la C final
        const refPrincipal = referencia.slice(0, -1);
        mapaImpuestos.set(refPrincipal, precio);
      }
    }

    // SEGUNDA PASADA: procesar filas normales
    for (let i = 0; i < filas.length; i++) {
      const fila = filas[i];
      const referencia = getVal(fila, mapeo.referencia).toUpperCase();
      const descripcion = getVal(fila, mapeo.descripcion).toUpperCase();
      const marca = getVal(fila, mapeo.marca).toUpperCase();
      const precioRaw = getVal(fila, mapeo.precio).replace(",", ".");
      const stockRaw = getVal(fila, mapeo.stock);

      // Saltar las líneas de casco — ya las procesamos
      if (descripcion.includes("CASCO")) { continue; }

      if (!referencia) { filasInvalidas.push(`Fila ${i + 2}: Referencia vacía`); continue; }
      if (!descripcion) { filasInvalidas.push(`Fila ${i + 2}: Descripción vacía (${referencia})`); continue; }
      if (!marca) { filasInvalidas.push(`Fila ${i + 2}: Marca vacía (${referencia})`); continue; }

      const precio = parseFloat(precioRaw);
      const stock = parseInt(stockRaw);
      if (isNaN(precio) || precio <= 0) { filasInvalidas.push(`Fila ${i + 2}: Precio inválido (${referencia})`); continue; }
      if (isNaN(stock) || stock < 0) { filasInvalidas.push(`Fila ${i + 2}: Stock inválido (${referencia})`); continue; }

      // Impuesto: columna mapeada O casco detectado automáticamente
      const impuestoColumna = mapeo.impuesto ? parseFloat(getVal(fila, mapeo.impuesto as string).replace(",", ".")) || 0 : 0;
      const impuestoCasco = mapaImpuestos.get(referencia) || 0;
      const impuesto = impuestoColumna > 0 ? impuestoColumna : impuestoCasco;

      filasValidas.push({ referencia, descripcion, marca, precio, stock, impuesto });
    }

    // Info de cascos detectados
    if (mapaImpuestos.size > 0) {
      console.log(`Cascos detectados y vinculados: ${mapaImpuestos.size}`);
    }

    errores.push(...filasInvalidas);
    setProgresoTexto(`Validadas ${filasValidas.length} referencias...`);

    const paraInsertar: any[] = [];
    const paraActualizar: Array<{ id: number; datos: any }> = [];

    if (modoImport === "reemplazar") {
      // Todo es nuevo — insertar directamente
      for (const fila of filasValidas) {
        paraInsertar.push({
          proveedor_id: proveedorId,
          proveedor_nombre: proveedorNombre,
          referencia: fila.referencia,
          descripcion: fila.descripcion,
          marca: fila.marca,
          precio: fila.precio,
          stock: fila.stock,
          impuesto: fila.impuesto || 0,
          tipo: tipoDefecto,
          provincia: provinciaPerfil || null,
        });
      }
    } else {
      // MODO ACTUALIZAR: buscar existentes y decidir insert/update
      setProgresoTexto("Consultando stock existente...");
      const { data: existentes } = await supabase
        .from("piezas_publicadas")
        .select("id, referencia")
        .eq("proveedor_id", proveedorId);

      const mapaExistentes = new Map<string, number>();
      (existentes || []).forEach(e => mapaExistentes.set(e.referencia, e.id));

      for (const fila of filasValidas) {
        const existeId = mapaExistentes.get(fila.referencia);
        if (existeId) {
          paraActualizar.push({
            id: existeId,
            datos: { descripcion: fila.descripcion, marca: fila.marca, precio: fila.precio, stock: fila.stock, impuesto: fila.impuesto || 0, tipo: tipoDefecto, provincia: provinciaPerfil || null },
          });
        } else {
          paraInsertar.push({
            proveedor_id: proveedorId,
            proveedor_nombre: proveedorNombre,
            referencia: fila.referencia,
            descripcion: fila.descripcion,
            marca: fila.marca,
            precio: fila.precio,
            stock: fila.stock,
            impuesto: fila.impuesto || 0,
            provincia: provinciaPerfil || null,
          });
        }
      }
    }

    // INSERTAR en lotes de 500
    const LOTE = 500;
    const totalLotesInsert = Math.ceil(paraInsertar.length / LOTE);
    for (let i = 0; i < paraInsertar.length; i += LOTE) {
      const lote = paraInsertar.slice(i, i + LOTE);
      const { error } = await supabase.from("piezas_publicadas").insert(lote);
      if (error) errores.push(`Error insertando lote ${Math.floor(i / LOTE) + 1}: ${error.message}`);
      else insertadas += lote.length;
      const pct = Math.round(((i + lote.length) / (paraInsertar.length + paraActualizar.length)) * 100);
      setProgreso(Math.min(pct, 99));
      setProgresoTexto(`Insertando nuevas... ${insertadas} de ${paraInsertar.length}`);
    }

    // ACTUALIZAR en lotes de 500 usando upsert
    const lotesUpdate = [];
    for (let i = 0; i < paraActualizar.length; i += LOTE) {
      lotesUpdate.push(paraActualizar.slice(i, i + LOTE));
    }
    for (let li = 0; li < lotesUpdate.length; li++) {
      const lote = lotesUpdate[li];
      const upsertData = lote.map(u => ({ id: u.id, proveedor_id: proveedorId, proveedor_nombre: proveedorNombre, ...u.datos }));
      const { error } = await supabase.from("piezas_publicadas").upsert(upsertData, { onConflict: "id" });
      if (error) errores.push(`Error actualizando lote ${li + 1}: ${error.message}`);
      else actualizadas += lote.length;
      const baseProgress = Math.round((paraInsertar.length / (paraInsertar.length + paraActualizar.length)) * 100);
      const updateProgress = Math.round(((li + 1) / lotesUpdate.length) * (100 - baseProgress));
      setProgreso(Math.min(baseProgress + updateProgress, 99));
      setProgresoTexto(`Actualizando... ${actualizadas} de ${paraActualizar.length}`);
    }

    setProgreso(100);
    setProgresoTexto("¡Completado!");
    setResultado({ total: filas.length, insertadas, actualizadas, errores });
    setFase("done");
    onImportado();
  }

  function resetear() {
    setFase("idle");
    setFilas([]);
    setColumnas([]);
    setMapeo({ referencia: "", descripcion: "", marca: "", precio: "", stock: "", impuesto: "" });
    setResultado(null);
    setProgreso(0);
    setProgresoTexto("");
    setNombreArchivo("");
    if (inputRef.current) inputRef.current.value = "";
  }

  // Preview con mapeo aplicado
  const preview = filas.slice(0, 5).map(f => ({
    referencia: getVal(f, mapeo.referencia),
    descripcion: getVal(f, mapeo.descripcion),
    marca: getVal(f, mapeo.marca),
    precio: getVal(f, mapeo.precio),
    stock: getVal(f, mapeo.stock),
  }));

  function descargarPlantilla() {
    const wb = XLSX.utils.book_new();
    const datos = [["REFERENCIA", "DESCRIPCION", "MARCA", "PRECIO", "STOCK"]];
    const ws = XLSX.utils.aoa_to_sheet(datos);

    // Ancho de columnas
    ws["!cols"] = [
      { wch: 20 }, // REFERENCIA
      { wch: 45 }, // DESCRIPCION
      { wch: 20 }, // MARCA
      { wch: 14 }, // PRECIO
      { wch: 10 }, // STOCK
    ];

    XLSX.utils.book_append_sheet(wb, ws, "Stock");
    XLSX.writeFile(wb, "plantilla_importar_stock_recambiodirecto.xlsx");
  }

  return (
    <div>

      {/* IDLE */}
      {fase === "idle" && (
        <div>
          {/* Instrucciones */}
          <div style={instruccionesBox}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
              <h3 style={{ fontWeight: 800, fontSize: 16, color: "#60a5fa", margin: 0 }}>📋 Formato del Excel</h3>
              <button onClick={descargarPlantilla} style={btnPlantilla}>
                ⬇️ Descargar plantilla
              </button>
            </div>
            <p style={{ color: "#94a3b8", fontSize: 14, marginBottom: 12 }}>
              Descarga la plantilla o usa tu propio Excel — en el siguiente paso podrás indicar cuál columna corresponde a cada campo.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {CAMPOS_OBLIGATORIOS.map(campo => (
                <div key={campo} style={campoBadge}>
                  <span style={{ color: "#f87171", marginRight: 6 }}>*</span>
                  <strong>{CAMPOS_LABELS[campo]}</strong>
                </div>
              ))}
            </div>
            <p style={{ color: "#94a3b8", fontSize: 12, marginTop: 10 }}>* Campos obligatorios — las filas sin estos datos serán omitidas</p>
          </div>

          <div
            style={dropZone}
            onClick={() => inputRef.current?.click()}
            onDragOver={e => e.preventDefault()}
            onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) leerArchivo(f); }}
          >
            <div style={{ fontSize: 48, marginBottom: 16 }}>📂</div>
            <h3 style={{ fontSize: 22, fontWeight: 900, marginBottom: 10 }}>Arrastra tu Excel aquí</h3>
            <p style={{ color: "#94a3b8", marginBottom: 16 }}>o haz clic para seleccionar el archivo</p>
            {provinciaPerfil
              ? <div style={provinciaBadge}>📍 Provincia automática: <strong>{provinciaPerfil}</strong></div>
              : <div style={avisoSinProvincia}>⚠️ Sin provincia configurada en tu perfil</div>}
            <div style={{ ...dropBadge, marginTop: 12 }}>.xlsx / .xls / .csv</div>
            <input ref={inputRef} type="file" accept=".xlsx,.xls,.csv" style={{ display: "none" }}
              onChange={e => { const f = e.target.files?.[0]; if (f) leerArchivo(f); }} />
          </div>
        </div>
      )}

      {/* MAPEO DE COLUMNAS */}
      {fase === "mapeo" && (
        <div>
          <div style={mapeoHeader}>
            <div>
              <div style={{ color: "#60a5fa", fontWeight: 700, marginBottom: 4 }}>📄 {nombreArchivo}</div>
              <h3 style={{ fontSize: 22, fontWeight: 900 }}>{filas.length.toLocaleString()} filas detectadas</h3>
              <p style={{ color: "#94a3b8", marginTop: 4, fontSize: 14 }}>
                Asigna qué columna de tu Excel corresponde a cada campo
              </p>
            </div>
            <button onClick={resetear} style={btnCancelar}>← Cambiar archivo</button>
          </div>

          <div style={mapeoGrid}>
            {CAMPOS_OBLIGATORIOS.map(campo => (
              <div key={campo} style={mapeoCard}>
                <p style={mapeoLabel}>
                  <span style={{ color: "#f87171" }}>* </span>
                  {CAMPOS_LABELS[campo]}
                </p>
                <select
                  value={mapeo[campo as keyof MapeoColumnas]}
                  onChange={e => setMapeo(prev => ({ ...prev, [campo]: e.target.value }))}
                  style={mapeoSelect}
                >
                  <option value="">— Seleccionar columna —</option>
                  {columnas.map(col => (
                    <option key={col} value={col}>{col}</option>
                  ))}
                </select>
                {mapeo[campo as keyof MapeoColumnas] && (
                  <div style={mapeoPreviewVal}>
                    Vista previa: <strong>{getVal(filas[0], mapeo[campo as keyof MapeoColumnas]) || "—"}</strong>
                  </div>
                )}
              </div>
            ))}
            {/* Campo opcional impuesto */}
            <div style={{ ...mapeoCard, border: "1px solid rgba(245,158,11,0.3)" }}>
              <p style={mapeoLabel}>
                <span style={{ color: "#fbbf24", marginRight: 6 }}>○</span>
                {CAMPOS_LABELS["impuesto"]}
                <span style={{ color: "#94a3b8", fontSize: 11, marginLeft: 6 }}>(opcional)</span>
              </p>
              <select
                value={mapeo.impuesto}
                onChange={e => setMapeo(prev => ({ ...prev, impuesto: e.target.value }))}
                style={{ ...mapeoSelect, borderColor: "rgba(245,158,11,0.3)" }}
              >
                <option value="">— Sin impuesto —</option>
                {columnas.map(col => (
                  <option key={col} value={col}>{col}</option>
                ))}
              </select>
              {mapeo.impuesto && (
                <div style={mapeoPreviewVal}>
                  Vista previa: <strong>{getVal(filas[0], mapeo.impuesto || "") || "—"}€</strong>
                </div>
              )}
              <p style={{ color: "#94a3b8", fontSize: 11, marginTop: 8 }}>Ecotasa, casco, recargo especial...</p>
            </div>
          </div>

          {/* Preview tabla */}
          {mapeoCompleto() && (
            <div style={{ marginTop: 24 }}>
              <p style={{ color: "#94a3b8", fontSize: 13, marginBottom: 10, fontWeight: 700 }}>VISTA PREVIA (5 primeras filas)</p>
              <div style={tableWrap}>
                <table style={tableStyle}>
                  <thead>
                    <tr>{["REFERENCIA", "DESCRIPCIÓN", "MARCA", "PRECIO", "STOCK"].map(h => <th key={h} style={thStyle}>{h}</th>)}</tr>
                  </thead>
                  <tbody>
                    {preview.map((fila, i) => (
                      <tr key={i} style={i % 2 === 0 ? {} : { background: "rgba(255,255,255,0.02)" }}>
                        <td style={tdStyle}><strong>{fila.referencia || "⚠️"}</strong></td>
                        <td style={tdStyle}>{fila.descripcion || "⚠️"}</td>
                        <td style={{ ...tdStyle, color: fila.marca ? "white" : "#f87171" }}>{fila.marca || "⚠️ VACÍA"}</td>
                        <td style={{ ...tdStyle, color: "#22c55e", fontWeight: 700 }}>{fila.precio || "⚠️"}€</td>
                        <td style={tdStyle}><span style={stockBadge}>{fila.stock || "⚠️"} uds</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div style={{ marginTop: 24, display: "flex", justifyContent: "flex-end" }}>
            <button
              onClick={() => setFase("preview")}
              disabled={!mapeoCompleto()}
              style={{ ...btnImportar, opacity: mapeoCompleto() ? 1 : 0.4, cursor: mapeoCompleto() ? "pointer" : "not-allowed" }}
            >
              Continuar → Vista previa
            </button>
          </div>
        </div>
      )}

      {/* PREVIEW FINAL */}
      {fase === "preview" && (
        <div>
          <div style={mapeoHeader}>
            <div>
              <h3 style={{ fontSize: 22, fontWeight: 900 }}>Listo para importar</h3>
              <p style={{ color: "#94a3b8", marginTop: 6 }}>
                <strong style={{ color: "white" }}>{filas.length.toLocaleString()}</strong> referencias · Provincia: <strong style={{ color: "white" }}>{provinciaPerfil || "Sin configurar"}</strong>
              </p>
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              <button onClick={() => setFase("mapeo")} style={btnCancelar}>← Editar mapeo</button>
              <button onClick={importar} style={{
                ...btnImportar,
                background: modoImport === "reemplazar" ? "linear-gradient(135deg,#dc2626,#991b1b)" : "linear-gradient(135deg,#16a34a,#15803d)"
              }}>
                {modoImport === "reemplazar" ? "⚠️ REEMPLAZAR TODO" : "✓ ACTUALIZAR"} ({filas.length.toLocaleString()} refs)
              </button>
            </div>
          </div>

          {/* SELECTOR TIPO POR DEFECTO */}
          <div style={{ marginBottom: 16 }}>
            <p style={{ color: "#94a3b8", fontSize: 13, fontWeight: 700, marginBottom: 10 }}>TIPO DE REFERENCIA POR DEFECTO</p>
            <div style={{ display: "flex", gap: 10 }}>
              {(["OEM", "IAM", "UNIVERSAL"] as const).map(t => (
                <button key={t} onClick={() => setTipoDefecto(t)} style={{
                  padding: "10px 20px", borderRadius: 10, fontWeight: 700, cursor: "pointer", fontSize: 14, border: "none",
                  background: tipoDefecto === t
                    ? t === "OEM" ? "rgba(37,99,235,0.3)" : t === "IAM" ? "rgba(139,92,246,0.3)" : "rgba(22,163,74,0.3)"
                    : "rgba(255,255,255,0.05)",
                  color: tipoDefecto === t
                    ? t === "OEM" ? "#60a5fa" : t === "IAM" ? "#a78bfa" : "#4ade80"
                    : "#94a3b8",
                  outline: tipoDefecto === t ? "2px solid currentColor" : "none",
                }}>{t}</button>
              ))}
            </div>
            <p style={{ color: "#94a3b8", fontSize: 11, marginTop: 8 }}>
              Todas las referencias del fichero se importaran como {tipoDefecto}
            </p>
          </div>

          {/* SELECTOR MODO */}
          <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
            <button
              onClick={() => setModoImport("reemplazar")}
              style={{
                flex: 1, padding: "16px 20px", borderRadius: 14, fontWeight: 700, cursor: "pointer", fontSize: 14, border: "none",
                background: modoImport === "reemplazar" ? "rgba(239,68,68,0.2)" : "rgba(255,255,255,0.05)",
                color: modoImport === "reemplazar" ? "#f87171" : "#94a3b8",
                outline: modoImport === "reemplazar" ? "2px solid rgba(239,68,68,0.5)" : "none",
              }}
            >
              🔄 Reemplazar todo el stock
              <p style={{ fontSize: 12, fontWeight: 400, marginTop: 4, opacity: 0.8 }}>
                Borra todo lo actual e importa solo este fichero. Ideal para exportaciones diarias del ERP.
              </p>
            </button>
            <button
              onClick={() => setModoImport("actualizar")}
              style={{
                flex: 1, padding: "16px 20px", borderRadius: 14, fontWeight: 700, cursor: "pointer", fontSize: 14, border: "none",
                background: modoImport === "actualizar" ? "rgba(22,163,74,0.2)" : "rgba(255,255,255,0.05)",
                color: modoImport === "actualizar" ? "#4ade80" : "#94a3b8",
                outline: modoImport === "actualizar" ? "2px solid rgba(22,163,74,0.5)" : "none",
              }}
            >
              ➕ Añadir / Actualizar
              <p style={{ fontSize: 12, fontWeight: 400, marginTop: 4, opacity: 0.8 }}>
                Mantiene el stock actual, añade nuevas refs y actualiza precios de las existentes.
              </p>
            </button>
          </div>

          {modoImport === "reemplazar" && (
            <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 14, padding: "14px 18px", marginBottom: 16 }}>
              <p style={{ color: "#f87171", fontSize: 14, fontWeight: 700 }}>
                ⚠️ ATENCIÓN: Se eliminarán TODAS tus referencias actuales y se sustituirán por las de este fichero.
                Las refs que no estén en el fichero desaparecerán del marketplace.
              </p>
            </div>
          )}
          {modoImport === "actualizar" && (
            <div style={{ background: "rgba(22,163,74,0.08)", border: "1px solid rgba(22,163,74,0.2)", borderRadius: 14, padding: "14px 18px", marginBottom: 16 }}>
              <p style={{ color: "#4ade80", fontSize: 14 }}>
                ✅ Las referencias nuevas se <strong>añadirán</strong>. Las existentes se <strong>actualizarán</strong>. Las que no estén en el fichero se <strong>mantienen</strong>.
              </p>
            </div>
          )}

          <div style={tableWrap}>
            <table style={tableStyle}>
              <thead>
                <tr>{["REFERENCIA", "DESCRIPCIÓN", "MARCA", "PRECIO", "STOCK"].map(h => <th key={h} style={thStyle}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {preview.map((fila, i) => (
                  <tr key={i} style={i % 2 === 0 ? {} : { background: "rgba(255,255,255,0.02)" }}>
                    <td style={tdStyle}><strong>{fila.referencia || "—"}</strong></td>
                    <td style={tdStyle}>{fila.descripcion || "—"}</td>
                    <td style={tdStyle}>{fila.marca || "—"}</td>
                    <td style={{ ...tdStyle, color: "#22c55e", fontWeight: 700 }}>{fila.precio || "—"}€</td>
                    <td style={tdStyle}><span style={stockBadge}>{fila.stock || "—"} uds</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filas.length > 5 && <div style={masFilas}>... y {(filas.length - 5).toLocaleString()} referencias más</div>}
          </div>
        </div>
      )}

      {/* IMPORTANDO */}
      {fase === "importando" && (
        <div style={progressContainer}>
          <div style={{ fontSize: 48, marginBottom: 20 }}>⚙️</div>
          <h3 style={{ fontSize: 22, fontWeight: 900, marginBottom: 10 }}>Importando referencias...</h3>
          <p style={{ color: "#94a3b8", marginBottom: 8 }}>No cierres esta ventana</p>
          <p style={{ color: "#60a5fa", fontSize: 14, marginBottom: 28, fontWeight: 600 }}>{progresoTexto}</p>
          <div style={progressBar}>
            <div style={{ ...progressFill, width: `${progreso}%` }} />
          </div>
          <p style={{ marginTop: 16, fontSize: 28, fontWeight: 900, color: "#60a5fa" }}>{progreso}%</p>
        </div>
      )}

      {/* DONE */}
      {fase === "done" && resultado && (
        <div style={resultContainer}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>{resultado.errores.length === 0 ? "✅" : "⚠️"}</div>
          <h3 style={{ fontSize: 26, fontWeight: 900, marginBottom: 24 }}>Importación completada</h3>
          <div style={statsGrid}>
            <div style={statCard}><p style={statLabel}>TOTAL</p><p style={statNum}>{resultado.total.toLocaleString()}</p></div>
            <div style={{ ...statCard, borderColor: "rgba(22,163,74,0.3)" }}><p style={statLabel}>NUEVAS</p><p style={{ ...statNum, color: "#4ade80" }}>{resultado.insertadas.toLocaleString()}</p></div>
            <div style={{ ...statCard, borderColor: "rgba(37,99,235,0.3)" }}><p style={statLabel}>ACTUALIZADAS</p><p style={{ ...statNum, color: "#60a5fa" }}>{resultado.actualizadas.toLocaleString()}</p></div>
            <div style={{ ...statCard, borderColor: "rgba(239,68,68,0.3)" }}><p style={statLabel}>ERRORES</p><p style={{ ...statNum, color: "#f87171" }}>{resultado.errores.length}</p></div>
          </div>
          {resultado.errores.length > 0 && (
            <div style={erroresBox}>
              <p style={{ fontWeight: 700, marginBottom: 10, color: "#f87171" }}>Filas con errores ({resultado.errores.length}):</p>
              <div style={{ maxHeight: 200, overflowY: "auto" }}>
                {resultado.errores.slice(0, 50).map((e, i) => (
                  <p key={i} style={{ fontSize: 13, color: "#fca5a5", marginBottom: 4 }}>• {e}</p>
                ))}
                {resultado.errores.length > 50 && <p style={{ color: "#94a3b8", fontSize: 12 }}>... y {resultado.errores.length - 50} errores más</p>}
              </div>
            </div>
          )}
          <button onClick={resetear} style={btnImportar}>IMPORTAR OTRO FICHERO</button>
        </div>
      )}
    </div>
  );
}

/* STYLES */
const btnPlantilla = { background: "linear-gradient(135deg,#2563eb,#1d4ed8)", border: "none", color: "white", padding: "10px 18px", borderRadius: 10, fontWeight: 700, cursor: "pointer", fontSize: 13, whiteSpace: "nowrap" as const };
const instruccionesBox = { background: "rgba(37,99,235,0.06)", border: "1px solid rgba(37,99,235,0.2)", borderRadius: 16, padding: "20px 24px", marginBottom: 20 };
const campoBadge = { background: "rgba(15,23,42,0.8)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, padding: "8px 14px", fontSize: 13, color: "white" };
const dropZone = { border: "2px dashed rgba(37,99,235,0.4)", borderRadius: 24, padding: "50px 40px", textAlign: "center" as const, cursor: "pointer", background: "rgba(37,99,235,0.04)" };
const dropBadge = { display: "inline-block", background: "rgba(37,99,235,0.15)", color: "#60a5fa", padding: "8px 18px", borderRadius: 999, fontWeight: 700, fontSize: 13 };
const provinciaBadge = { display: "inline-block", background: "rgba(22,163,74,0.15)", border: "1px solid rgba(22,163,74,0.3)", color: "#4ade80", padding: "10px 18px", borderRadius: 12, fontSize: 14 };
const avisoSinProvincia = { display: "inline-block", background: "rgba(245,158,11,0.15)", border: "1px solid rgba(245,158,11,0.3)", color: "#fbbf24", padding: "10px 18px", borderRadius: 12, fontSize: 14 };
const mapeoHeader = { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 };
const mapeoGrid = { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16, marginBottom: 8 };
const mapeoCard = { background: "rgba(15,23,42,0.95)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: 18 };
const mapeoLabel = { color: "#94a3b8", fontSize: 13, fontWeight: 700, marginBottom: 10 };
const mapeoSelect = { width: "100%", background: "#020617", color: "white", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "10px 14px", fontSize: 14, outline: "none", cursor: "pointer", boxSizing: "border-box" as const };
const mapeoPreviewVal = { marginTop: 8, color: "#94a3b8", fontSize: 12, background: "rgba(255,255,255,0.04)", borderRadius: 6, padding: "4px 10px" };
const tableWrap = { background: "rgba(2,6,23,0.6)", borderRadius: 16, overflow: "hidden", border: "1px solid rgba(255,255,255,0.06)" };
const tableStyle = { width: "100%", borderCollapse: "collapse" as const };
const thStyle = { padding: "12px 16px", textAlign: "left" as const, color: "#94a3b8", fontSize: 11, fontWeight: 700, background: "rgba(0,0,0,0.3)", borderBottom: "1px solid rgba(255,255,255,0.06)" };
const tdStyle = { padding: "12px 16px", fontSize: 13, borderBottom: "1px solid rgba(255,255,255,0.04)" };
const stockBadge = { background: "rgba(22,163,74,0.2)", color: "#4ade80", padding: "3px 10px", borderRadius: 999, fontSize: 12, fontWeight: 700 };
const masFilas = { padding: "14px 16px", textAlign: "center" as const, color: "#94a3b8", fontSize: 13, borderTop: "1px solid rgba(255,255,255,0.06)" };
const btnImportar = { background: "linear-gradient(135deg,#16a34a,#15803d)", border: "none", color: "white", padding: "14px 28px", borderRadius: 14, fontWeight: 900, cursor: "pointer", fontSize: 15 };
const btnCancelar = { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#94a3b8", padding: "14px 24px", borderRadius: 14, cursor: "pointer", fontWeight: 700, fontSize: 14 };
const progressContainer = { textAlign: "center" as const, padding: "60px 40px" };
const progressBar = { width: "100%", height: 12, background: "rgba(255,255,255,0.08)", borderRadius: 999, overflow: "hidden" };
const progressFill = { height: "100%", background: "linear-gradient(90deg,#2563eb,#16a34a)", borderRadius: 999, transition: "width 0.3s ease" };
const resultContainer = { textAlign: "center" as const, padding: "40px" };
const statsGrid = { display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 28 };
const statCard = { background: "rgba(15,23,42,0.95)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: 20 };
const statLabel = { color: "#94a3b8", fontSize: 11, fontWeight: 700, marginBottom: 8 };
const statNum = { fontSize: 36, fontWeight: 900 };
const erroresBox = { background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 14, padding: 20, marginBottom: 24, textAlign: "left" as const };