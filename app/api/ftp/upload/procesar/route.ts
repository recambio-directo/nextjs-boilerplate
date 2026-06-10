// app/api/ftp/procesar/route.ts
// Procesa los archivos de stock subidos por FTP
// Llamado por el cron a las 5AM
// También puede llamarse manualmente desde el panel admin

import { createClient } from "@supabase/supabase-js";
import * as XLSX from "xlsx";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Normalizar cabeceras del archivo para aceptar distintos formatos de ERP
function normalizarCabecera(header: string): string {
  const h = (header || "").toLowerCase().trim()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, ""); // quitar tildes
  if (["referencia", "ref", "codigo", "cod", "partno", "part_no", "part number"].includes(h)) return "referencia";
  if (["descripcion", "descripción", "description", "desc", "nombre", "articulo"].includes(h)) return "descripcion";
  if (["precio", "price", "pvp", "pvd", "tarifa", "coste", "importe"].includes(h)) return "precio";
  if (["stock", "cantidad", "qty", "quantity", "existencias", "unidades"].includes(h)) return "stock";
  if (["marca", "brand", "fabricante", "manufacturer"].includes(h)) return "marca";
  return h;
}

function parsearArchivo(buffer: Buffer, ext: string): any[] {
  try {
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const raw = XLSX.utils.sheet_to_json(sheet, { defval: "" }) as any[];
    
    // Normalizar cabeceras
    return raw.map(row => {
      const newRow: any = {};
      for (const key of Object.keys(row)) {
        const normalKey = normalizarCabecera(key);
        newRow[normalKey] = row[key];
      }
      return newRow;
    });
  } catch (e) {
    throw new Error("Error al parsear el archivo: " + String(e));
  }
}

export async function GET(request: Request) {
  // Verificar autorización (cron o admin)
  const authHeader = request.headers.get("authorization");
  const { searchParams } = new URL(request.url);
  const proveedorId = searchParams.get("proveedor_id"); // opcional: procesar solo uno

  if (authHeader !== `Bearer ${process.env.CRON_SECRET}` && !searchParams.get("admin")) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Buscar proveedores con FTP activo
    let query = supabase.from("usuarios")
      .select("id, nombre_empresa, provincia")
      .eq("ftp_activo", true)
      .eq("tipo", "proveedor");

    if (proveedorId) query = query.eq("id", proveedorId) as any;

    const { data: proveedores } = await query;

    if (!proveedores || proveedores.length === 0) {
      return Response.json({ ok: true, mensaje: "No hay proveedores con FTP activo", procesados: 0 });
    }

    const resultados: any[] = [];

    for (const proveedor of proveedores) {
      try {
        // Buscar archivo en Storage — acepta csv, xlsx o xls
        let archivoPath: string | null = null;
        let ext = "csv";

        for (const e of ["csv", "xlsx", "xls"]) {
          const { data } = await supabase.storage
            .from("ftp-stock")
            .list(proveedor.id, { search: `catalogo.${e}` });
          if (data && data.length > 0) {
            archivoPath = `${proveedor.id}/catalogo.${e}`;
            ext = e;
            break;
          }
        }

        if (!archivoPath) {
          resultados.push({ proveedor: proveedor.nombre_empresa, estado: "sin_archivo" });
          continue;
        }

        // Descargar archivo
        const { data: fileData, error: downloadError } = await supabase.storage
          .from("ftp-stock")
          .download(archivoPath);

        if (downloadError || !fileData) {
          resultados.push({ proveedor: proveedor.nombre_empresa, estado: "error_descarga", error: downloadError?.message });
          continue;
        }

        const buffer = Buffer.from(await fileData.arrayBuffer());
        const filas = parsearArchivo(buffer, ext);

        if (filas.length === 0) {
          resultados.push({ proveedor: proveedor.nombre_empresa, estado: "archivo_vacio" });
          continue;
        }

        let insertadas = 0;
        let actualizadas = 0;
        let errores = 0;

        for (const fila of filas) {
          const referencia = String(fila.referencia || "").toUpperCase().trim();
          const descripcion = String(fila.descripcion || "").toUpperCase().trim();
          const precio = parseFloat(String(fila.precio || "0").replace(",", "."));
          const stock = parseInt(String(fila.stock || "0"));
          const marca = String(fila.marca || "").toUpperCase().trim();

          if (!referencia || isNaN(precio) || precio <= 0) { errores++; continue; }

          // Buscar si ya existe la pieza
          const { data: existente } = await supabase
            .from("piezas_publicadas")
            .select("id")
            .eq("proveedor_id", proveedor.id)
            .eq("referencia", referencia)
            .maybeSingle();

          if (existente) {
            // Actualizar precio y stock
            await supabase.from("piezas_publicadas")
              .update({ precio, stock, descripcion: descripcion || undefined, marca: marca || undefined })
              .eq("id", existente.id);
            actualizadas++;
          } else {
            // Insertar nueva
            await supabase.from("piezas_publicadas").insert({
              proveedor_id: proveedor.id,
              proveedor_nombre: proveedor.nombre_empresa,
              referencia,
              descripcion: descripcion || referencia,
              precio,
              stock,
              marca: marca || "",
              provincia: proveedor.provincia || null,
              tipo: "OEM",
            });
            insertadas++;
          }
        }

        // Actualizar timestamp y resultado
        const resultado = `✅ ${new Date().toLocaleDateString("es-ES")} — ${insertadas} nuevas, ${actualizadas} actualizadas, ${errores} errores`;
        await supabase.from("usuarios")
          .update({ ftp_ultimo_proceso: new Date().toISOString(), ftp_ultimo_resultado: resultado })
          .eq("id", proveedor.id);

        resultados.push({
          proveedor: proveedor.nombre_empresa,
          estado: "ok",
          filas: filas.length,
          insertadas,
          actualizadas,
          errores,
        });

        console.log(`FTP procesado: ${proveedor.nombre_empresa} — ${insertadas} nuevas, ${actualizadas} actualizadas`);

      } catch (provError) {
        console.error(`Error procesando ${proveedor.nombre_empresa}:`, provError);
        resultados.push({ proveedor: proveedor.nombre_empresa, estado: "error", error: String(provError) });
        await supabase.from("usuarios")
          .update({ ftp_ultimo_resultado: `❌ Error: ${String(provError)}` })
          .eq("id", proveedor.id);
      }
    }

    return Response.json({
      ok: true,
      procesados: proveedores.length,
      resultados,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error("Error cron FTP:", error);
    return Response.json({ ok: false, error: String(error) }, { status: 500 });
  }
}