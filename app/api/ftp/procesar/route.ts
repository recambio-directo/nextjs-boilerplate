// app/api/ftp/procesar/route.ts
// Procesa archivos de stock subidos por FTP
// Formato esperado: referencia, descripcion, precio, stock, marca, precio_casco (opcional)
// Regla casco: si precio = 0 → es casco de la referencia anterior → se asocia y no se inserta

import { createClient } from "@supabase/supabase-js";
import * as XLSX from "xlsx";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function normalizarCabecera(header: string): string {
  const h = (header || "").toLowerCase().trim()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  if (["referencia", "ref", "codigo", "cod", "partno", "part_no", "part number"].includes(h)) return "referencia";
  if (["descripcion", "descripcion", "description", "desc", "nombre", "articulo"].includes(h)) return "descripcion";
  if (["precio", "price", "pvp", "pvd", "tarifa", "precio venta", "p.venta", "pventa"].includes(h)) return "precio";
  if (["stock", "stocks", "cantidad", "qty", "quantity", "existencias", "unidades"].includes(h)) return "stock";
  if (["marca", "brand", "fabricante", "manufacturer"].includes(h)) return "marca";
  if (["precio_casco", "casco", "importe casco", "p.casco", "pcasco"].includes(h)) return "precio_casco";
  if (["descuento", "dto", "discount"].includes(h)) return "descuento";
  return h;
}

function parsearArchivo(buffer: Buffer): any[] {
  try {
    const workbook = XLSX.read(buffer, { type: "buffer" });
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
  // Regla: si precio = 0 → es casco de la referencia anterior
  // Se asocia precio_casco a la fila anterior y se descarta
  const resultado: any[] = [];

  for (let i = 0; i < filas.length; i++) {
    const fila = filas[i];
    const precio = parseFloat(String(fila.precio || "0").replace(",", "."));

    if (precio === 0) {
      // Es un casco — asociar a la fila anterior si existe
      if (resultado.length > 0) {
        const precioCasco = parseFloat(String(fila.precio_casco || fila.importe_casco || "0").replace(",", "."));
        resultado[resultado.length - 1].precio_casco = precioCasco > 0 ? precioCasco : null;
      }
      // No insertar esta fila
      continue;
    }

    resultado.push({ ...fila, precio_casco: null });
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
        // Buscar archivo en Storage
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

        // Descargar archivo
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

          const { data: existente } = await supabase
            .from("piezas_publicadas")
            .select("id")
            .eq("proveedor_id", proveedor.id)
            .eq("referencia", referencia)
            .maybeSingle();

          const campos: any = {
            precio,
            stock: isNaN(stock) ? 0 : stock,
            descripcion: descripcion || undefined,
            marca: marca || undefined,
          };
          if (precioCasco !== null) campos.precio_casco = precioCasco;

          if (existente) {
            await supabase.from("piezas_publicadas").update(campos).eq("id", existente.id);
            actualizadas++;
          } else {
            await supabase.from("piezas_publicadas").insert({
              proveedor_id: proveedor.id,
              proveedor_nombre: proveedor.nombre_empresa,
              referencia,
              descripcion: descripcion || referencia,
              precio,
              stock: isNaN(stock) ? 0 : stock,
              marca: marca || "",
              provincia: proveedor.provincia || null,
              tipo: "OEM",
              ...(precioCasco !== null && { precio_casco: precioCasco }),
            });
            insertadas++;
          }
        }

        const resultado = `OK ${new Date().toLocaleDateString("es-ES")} — ${insertadas} nuevas, ${actualizadas} actualizadas, ${errores} errores`;
        await supabase.from("usuarios")
          .update({ ftp_ultimo_proceso: new Date().toISOString(), ftp_ultimo_resultado: resultado })
          .eq("id", proveedor.id);

        resultados.push({ proveedor: proveedor.nombre_empresa, estado: "ok", filas: filas.length, insertadas, actualizadas, errores });

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