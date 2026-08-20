// app/api/ftp/procesar/route.ts
import { createClient } from "@supabase/supabase-js";
import * as XLSX from "xlsx";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const ELEKTRA_ID = "72fe848e-3025-4e30-9dc6-1d883eb9aaca";

function normalizarCabecera(header: string): string {
  const h = (header || "").toLowerCase().trim()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "");
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

function parsearArchivo(buffer: Buffer): any[] {
  try {
    const texto = buffer.toString("latin1");
    const primeraLinea = texto.split("\n")[0];
    const esTabulador = primeraLinea.includes("\t");
    const esPuntoYComa = primeraLinea.includes(";");

    const workbook = XLSX.read(buffer, {
      type: "buffer",
      codepage: 1252,
      raw: false,
      ...(esTabulador ? { FS: "\t" } : esPuntoYComa ? { FS: ";" } : {}),
    });
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

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const { searchParams } = new URL(request.url);
  const proveedorId = searchParams.get("proveedor_id");

  if (authHeader !== `Bearer ${process.env.CRON_SECRET}` && !searchParams.get("admin")) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    let query = supabase.from("usuarios")
      .select("id, nombre_empresa, provincia, tipo_referencias_ftp")
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

        let insertadas = 0, actualizadas = 0, errores = 0;

        for (const fila of filas) {
          const referencia = String(fila.referencia || "").toUpperCase().trim();
          const descripcion = String(fila.descripcion || "").toUpperCase().trim();
          const precio = parseFloat(String(fila.precio || "0").replace(",", "."));
          const stock = parseInt(String(fila.stock || "0"));
          const marca = String(fila.marca || "").toUpperCase().trim();
          const precioCasco = fila.precio_casco ? parseFloat(String(fila.precio_casco).replace(",", ".")) : null;

          if (!referencia || isNaN(precio) || precio <= 0) { errores++; continue; }

          // Para Elektra: obtener almacen_id y nombre de sucursal
          let almacenId: string | null = null;
          let proveedorNombre = proveedor.nombre_empresa;

          if (esElektra) {
            const almacenCodigo = String(fila.almacen_codigo || "").trim();
            const almacen = almacenMap.get(almacenCodigo);
            if (almacen) {
              almacenId = almacen.id;
              proveedorNombre = almacen.nombre; // ej. "AUTOCENTRO ELEKTRA (ALICANTE)"
            }
          }

          const { data: existente } = await supabase
            .from("piezas_publicadas")
            .select("id")
            .eq("proveedor_id", proveedor.id)
            .eq("referencia", referencia)
            .eq("tipo", tipoFtp)
            .eq("almacen_id", almacenId || "00000000-0000-0000-0000-000000000000")
            .maybeSingle();

          const campos: any = {
            precio,
            stock: isNaN(stock) ? 0 : stock,
            descripcion: descripcion || undefined,
            marca: marca || undefined,
            proveedor_nombre: proveedorNombre,
          };
          if (precioCasco !== null) campos.precio_casco = precioCasco;
          if (almacenId) campos.almacen_id = almacenId;

          if (existente) {
            await supabase.from("piezas_publicadas").update(campos).eq("id", existente.id);
            actualizadas++;
          } else {
            await supabase.from("piezas_publicadas").insert({
              proveedor_id: proveedor.id,
              proveedor_nombre: proveedorNombre,
              referencia,
              descripcion: descripcion || referencia,
              precio,
              stock: isNaN(stock) ? 0 : stock,
              marca: marca || "",
              provincia: proveedor.provincia || null,
              tipo: tipoFtp,
              ...(precioCasco !== null && { precio_casco: precioCasco }),
              ...(almacenId && { almacen_id: almacenId }),
            });
            insertadas++;
          }
        }

        const resultado = `OK ${new Date().toLocaleDateString("es-ES")} — ${insertadas} nuevas, ${actualizadas} actualizadas, ${errores} errores (tipo ${tipoFtp})`;
        await supabase.from("usuarios")
          .update({ ftp_ultimo_proceso: new Date().toISOString(), ftp_ultimo_resultado: resultado })
          .eq("id", proveedor.id);

        resultados.push({ proveedor: proveedor.nombre_empresa, tipo: tipoFtp, estado: "ok", filas: filas.length, insertadas, actualizadas, errores });

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