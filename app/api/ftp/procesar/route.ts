// app/api/ftp/procesar/route.ts
// Importa el catálogo FTP de cada proveedor (cron diario 05:00 UTC).
//
// CÓMO FUNCIONA (24/11/2026):
//   1. Lee el fichero (detecta UTF-8 o Windows-1252 para no romper tildes/Ñ).
//   2. Inserta TODAS las piezas del fichero como filas nuevas (origen = 'ftp').
//   3. Solo si TODO se ha insertado bien → borra las filas FTP anteriores de ese proveedor.
//      Si algo falla → borra lo recién insertado y deja intacto el stock del día anterior.
//   Así nunca hay duplicados y desaparece el stock que ya no viene en el fichero.
//   Las piezas subidas a mano por el proveedor (origen distinto de 'ftp') NO se tocan.
//
// Antes se intentaba "actualizar" por id (falla: id es GENERATED ALWAYS) y solo se leían
// 1.000 piezas existentes (límite de Supabase), lo que duplicaba todo el stock cada día.

import { createClient } from "@supabase/supabase-js";
import * as XLSX from "xlsx";
import iconv from "iconv-lite";
import { verificarAdmin } from "@/app/lib/adminAuth";

export const maxDuration = 300;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const ELEKTRA_ID = "72fe848e-3025-4e30-9dc6-1d883eb9aaca";
const BATCH_SIZE = 500;
const TRAMO_BORRADO = 50000; // borrar por tramos de id para no pasar el timeout de 8 s

function normalizarCabecera(header: string): string {
  const h = (header || "").toLowerCase().trim()
    .normalize("NFD").replace(/[̀-ͯ]/g, "");
  if (["referencia", "referencia cat logo", "referencia catalogo", "ref", "codigo", "cod", "partno", "part_no", "part number"].includes(h)) return "referencia";
  if (["descripcion", "description", "desc", "nombre", "articulo"].includes(h)) return "descripcion";
  if (["precio", "precio venta neto", "precio venta", "price", "pvp", "pvd", "tarifa", "p.venta", "pventa"].includes(h)) return "precio";
  if (["stock", "stocks", "stocks disponible", "cantidad", "qty", "quantity", "existencias", "unidades"].includes(h)) return "stock";
  if (["marca", "descripcion marca", "brand", "fabricante", "manufacturer"].includes(h)) return "marca";
  if (["importe casco", "precio_casco", "casco", "p.casco", "pcasco", "importe_casco"].includes(h)) return "precio_casco";
  if (["descuento", "dto", "discount"].includes(h)) return "descuento";
  if (h === "almacen_codigo") return "almacen_codigo";
  if (h === "almacen_descripcion") return "almacen_descripcion";
  return h;
}

/** Decodifica texto: UTF-8 si el fichero es UTF-8 válido, si no Windows-1252 */
function decodificarTexto(buffer: Buffer): string {
  let b = buffer;
  if (b.length >= 3 && b[0] === 0xef && b[1] === 0xbb && b[2] === 0xbf) b = b.subarray(3); // BOM UTF-8
  const utf8 = b.toString("utf8");
  const tieneMultibyte = /[^\x00-\x7f]/.test(utf8);
  if (tieneMultibyte && !utf8.includes("�")) return utf8;
  return iconv.decode(b, "win1252");
}

function parsearArchivo(buffer: Buffer): any[] {
  try {
    const esExcel = buffer.length > 2 && buffer[0] === 0x50 && buffer[1] === 0x4b; // .xlsx (zip "PK")
    const esXlsAntiguo = buffer.length > 2 && buffer[0] === 0xd0 && buffer[1] === 0xcf; // .xls (OLE)

    let workbook: XLSX.WorkBook;
    if (esExcel || esXlsAntiguo) {
      workbook = XLSX.read(buffer, { type: "buffer", raw: false });
    } else {
      const texto = decodificarTexto(buffer);
      const primeraLinea = texto.split("\n")[0];
      const esTabulador = primeraLinea.includes("\t");
      const esPuntoYComa = primeraLinea.includes(";");
      workbook = XLSX.read(texto, {
        type: "string",
        raw: false,
        ...(esTabulador ? { FS: "\t" } : esPuntoYComa ? { FS: ";" } : {}),
      });
    }

    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const raw = XLSX.utils.sheet_to_json(sheet, { defval: "" }) as any[];

    return raw.map(row => {
      const newRow: any = {};
      for (const key of Object.keys(row)) {
        newRow[normalizarCabecera(key)] = row[key];
      }
      return newRow;
    });
  } catch (e) {
    throw new Error("Error al parsear el archivo: " + String(e));
  }
}

function procesarFilasConCasco(filas: any[]): any[] {
  const resultado: any[] = [];
  for (const fila of filas) {
    const descripcion = String(fila.descripcion || "").toUpperCase().trim();
    const precioCasco = parseFloat(String(fila.precio_casco || "0").replace(",", "."));
    if (descripcion.includes("CASCO") && precioCasco === 0) continue;
    resultado.push({ ...fila, precio_casco: precioCasco > 0 ? precioCasco : null });
  }
  return resultado;
}

/** id más alto y más bajo de las filas FTP actuales del proveedor (antes de importar) */
async function rangoIdsFtp(proveedorId: string): Promise<{ min: number; max: number } | null> {
  const { data: maxRow } = await supabase
    .from("piezas_publicadas").select("id")
    .eq("proveedor_id", proveedorId).eq("origen", "ftp")
    .order("id", { ascending: false }).limit(1).maybeSingle();
  if (!maxRow) return null;
  const { data: minRow } = await supabase
    .from("piezas_publicadas").select("id")
    .eq("proveedor_id", proveedorId).eq("origen", "ftp")
    .order("id", { ascending: true }).limit(1).maybeSingle();
  return { min: Number(minRow?.id ?? maxRow.id), max: Number(maxRow.id) };
}

/** Borra filas FTP del proveedor con id en [desde, hasta], por tramos */
async function borrarFtpPorRango(proveedorId: string, desde: number, hasta: number): Promise<string | null> {
  for (let a = desde; a <= hasta; a += TRAMO_BORRADO) {
    const b = Math.min(a + TRAMO_BORRADO - 1, hasta);
    const { error } = await supabase
      .from("piezas_publicadas").delete()
      .eq("proveedor_id", proveedorId).eq("origen", "ftp")
      .gte("id", a).lte("id", b);
    if (error) return error.message;
  }
  return null;
}

/** Inserta en lotes. Devuelve insertadas, errores y el primer error */
async function batchInsert(filas: any[]) {
  let ok = 0, errores = 0;
  let primerError: string | null = null;
  for (let i = 0; i < filas.length; i += BATCH_SIZE) {
    const lote = filas.slice(i, i + BATCH_SIZE);
    const { error } = await supabase.from("piezas_publicadas").insert(lote);
    if (error) {
      console.error(`Error batch insert (${i}-${i + lote.length}):`, error.message);
      errores += lote.length;
      primerError = primerError || error.message;
    } else {
      ok += lote.length;
    }
  }
  return { ok, errores, primerError };
}

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const { searchParams } = new URL(request.url);
  const proveedorId = searchParams.get("proveedor_id");

  const esCron = !!process.env.CRON_SECRET && authHeader === `Bearer ${process.env.CRON_SECRET}`;
  if (!esCron) {
    const admin = await verificarAdmin(request);
    if (!admin.ok) return Response.json({ error: admin.error }, { status: admin.status });
  }

  try {
    let query = supabase.from("usuarios")
      .select("id, nombre_empresa, provincia, tipo_referencias_ftp, alias")
      .eq("ftp_activo", true)
      .eq("tipo", "proveedor");

    if (proveedorId) query = query.eq("id", proveedorId) as any;

    const { data: proveedores } = await query;

    if (!proveedores || proveedores.length === 0) {
      return Response.json({ ok: true, mensaje: "No hay proveedores con FTP activo", procesados: 0 });
    }

    // Cargar almacenes de Elektra una sola vez
    const { data: almacenesElektra } = await supabase
      .from("almacenes")
      .select("id, codigo, nombre")
      .eq("proveedor_id", ELEKTRA_ID);

    const almacenMap = new Map<string, { id: string; nombre: string }>();
    for (const a of almacenesElektra || []) {
      almacenMap.set(a.codigo, { id: a.id, nombre: a.nombre });
    }

    const resultados: any[] = [];

    for (const proveedor of proveedores) {
      try {
        const tipoFtp: "OEM" | "IAM" = proveedor.tipo_referencias_ftp === "OEM" ? "OEM" : "IAM";
        const esElektra = proveedor.id === ELEKTRA_ID;

        // ── Buscar archivo ──────────────────────────────────────────────
        let archivoPath: string | null = null;
        for (const ext of ["csv", "xlsx", "xls"]) {
          const { data } = await supabase.storage
            .from("ftp-stock")
            .list(proveedor.id, { search: `catalogo.${ext}` });
          if (data && data.length > 0) {
            archivoPath = `${proveedor.id}/catalogo.${ext}`;
            break;
          }
        }

        if (!archivoPath) {
          resultados.push({ proveedor: proveedor.nombre_empresa, estado: "sin_archivo" });
          continue;
        }

        // ── Descargar y parsear ─────────────────────────────────────────
        const { data: fileData, error: downloadError } = await supabase.storage
          .from("ftp-stock")
          .download(archivoPath);

        if (downloadError || !fileData) {
          resultados.push({ proveedor: proveedor.nombre_empresa, estado: "error_descarga", error: downloadError?.message });
          continue;
        }

        const buffer = Buffer.from(await fileData.arrayBuffer());
        const filasRaw = parsearArchivo(buffer);
        const filas = procesarFilasConCasco(filasRaw);

        if (filas.length === 0) {
          resultados.push({ proveedor: proveedor.nombre_empresa, estado: "archivo_vacio" });
          continue;
        }

        // ── Preparar filas (una por referencia + marca + sede) ──────────
        const paraInsertar: any[] = [];
        const vistas = new Set<string>();
        let descartadas = 0;
        let repetidasEnFichero = 0;

        for (const fila of filas) {
          const referencia = String(fila.referencia || "").toUpperCase().trim();
          const descripcion = String(fila.descripcion || "").toUpperCase().trim();
          const precio = parseFloat(String(fila.precio || "0").replace(",", "."));
          const stock = parseInt(String(fila.stock || "0"));
          const marca = String(fila.marca || "").toUpperCase().trim();
          const precioCasco = fila.precio_casco ? parseFloat(String(fila.precio_casco).replace(",", ".")) : null;

          if (!referencia || isNaN(precio) || precio <= 0) { descartadas++; continue; }

          // Elektra: obtener almacen_id y nombre de sucursal
          let almacenId: string | null = null;
          let proveedorNombre = proveedor.alias || proveedor.nombre_empresa;

          if (esElektra) {
            const almacenCodigo = String(fila.almacen_codigo || "").trim();
            const almacen = almacenMap.get(almacenCodigo);
            if (almacen) {
              almacenId = almacen.id;
              proveedorNombre = almacen.nombre;
            }
          }

          // Misma referencia + tipo + marca + sede repetida dentro del propio fichero → solo una
          const clave = `${referencia}|${tipoFtp}|${marca}|${almacenId || "-"}`;
          if (vistas.has(clave)) { repetidasEnFichero++; continue; }
          vistas.add(clave);

          paraInsertar.push({
            proveedor_id: proveedor.id,
            proveedor_nombre: proveedorNombre,
            referencia,
            descripcion: descripcion || referencia,
            precio,
            stock: isNaN(stock) ? 0 : stock,
            marca: marca || "",
            provincia: proveedor.provincia || null,
            tipo: tipoFtp,
            origen: "ftp",
            ...(precioCasco !== null && { precio_casco: precioCasco }),
            ...(almacenId && { almacen_id: almacenId }),
          });
        }

        if (paraInsertar.length === 0) {
          resultados.push({ proveedor: proveedor.nombre_empresa, estado: "sin_filas_validas", descartadas });
          continue;
        }

        // ── 1) Recordar qué filas FTP había antes ───────────────────────
        const anteriores = await rangoIdsFtp(proveedor.id);

        // ── 2) Insertar el catálogo nuevo ───────────────────────────────
        const resInsert = await batchInsert(paraInsertar);

        let resultado: string;
        if (resInsert.errores > 0) {
          // ── 3a) Algo falló → deshacer lo nuevo y conservar el stock anterior
          const desde = anteriores ? anteriores.max + 1 : 1;
          const errDeshacer = await borrarFtpPorRango(proveedor.id, desde, Number.MAX_SAFE_INTEGER > 9e15 ? 9e15 : Number.MAX_SAFE_INTEGER);
          resultado = `ERROR ${new Date().toLocaleDateString("es-ES")} — fallaron ${resInsert.errores} de ${paraInsertar.length} filas (${resInsert.primerError}). Se mantiene el stock anterior.${errDeshacer ? " Error al deshacer: " + errDeshacer : ""}`;
        } else {
          // ── 3b) Todo bien → borrar las filas FTP anteriores
          const errBorrado = anteriores ? await borrarFtpPorRango(proveedor.id, anteriores.min, anteriores.max) : null;
          resultado = `OK ${new Date().toLocaleDateString("es-ES")} — ${resInsert.ok} piezas cargadas (stock sustituido), ${descartadas} descartadas, ${repetidasEnFichero} repetidas en fichero (tipo ${tipoFtp})${errBorrado ? " — AVISO: no se pudo borrar el stock anterior: " + errBorrado : ""}`;
        }

        await supabase.from("usuarios")
          .update({ ftp_ultimo_proceso: new Date().toISOString(), ftp_ultimo_resultado: resultado })
          .eq("id", proveedor.id);

        resultados.push({
          proveedor: proveedor.nombre_empresa,
          tipo: tipoFtp,
          estado: resInsert.errores > 0 ? "error_insercion" : "ok",
          filas: filas.length,
          insertadas: resInsert.ok,
          errores: resInsert.errores,
          descartadas,
          repetidasEnFichero,
        });

      } catch (provError) {
        console.error(`Error procesando ${proveedor.nombre_empresa}:`, provError);
        resultados.push({ proveedor: proveedor.nombre_empresa, estado: "error", error: String(provError) });
        await supabase.from("usuarios")
          .update({ ftp_ultimo_resultado: `Error: ${String(provError)}` })
          .eq("id", proveedor.id);
      }
    }

    return Response.json({ ok: true, procesados: proveedores.length, resultados, timestamp: new Date().toISOString() });

  } catch (error) {
    return Response.json({ ok: false, error: String(error) }, { status: 500 });
  }
}
