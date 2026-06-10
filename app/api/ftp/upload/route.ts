// app/api/ftp/upload/route.ts
// El ERP del proveedor llama a esta URL para subir su catálogo
// POST /api/ftp/upload?api_key=XXXX
// Body: multipart/form-data con campo "file" (CSV o Excel)

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const apiKey = searchParams.get("api_key");

    if (!apiKey) {
      return Response.json({ ok: false, error: "Falta api_key" }, { status: 401 });
    }

    // Buscar proveedor por api_key
    const { data: proveedor } = await supabase
      .from("usuarios")
      .select("id, nombre_empresa, ftp_activo")
      .eq("ftp_api_key", apiKey)
      .single();

    if (!proveedor) {
      return Response.json({ ok: false, error: "API key no válida" }, { status: 401 });
    }

    if (!proveedor.ftp_activo) {
      return Response.json({ ok: false, error: "Servicio FTP no activado para este proveedor" }, { status: 403 });
    }

    // Leer el archivo del body
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return Response.json({ ok: false, error: "No se ha enviado ningún archivo" }, { status: 400 });
    }

    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!["csv", "xlsx", "xls"].includes(ext || "")) {
      return Response.json({ ok: false, error: "Formato no válido. Solo CSV, XLSX o XLS" }, { status: 400 });
    }

    // Subir a Supabase Storage — carpeta del proveedor
    const path = `${proveedor.id}/catalogo.${ext}`;
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { error: uploadError } = await supabase.storage
      .from("ftp-stock")
      .upload(path, buffer, {
        contentType: file.type || "application/octet-stream",
        upsert: true, // reemplaza el anterior
      });

    if (uploadError) {
      return Response.json({ ok: false, error: uploadError.message }, { status: 500 });
    }

    // Registrar timestamp de subida
    await supabase.from("usuarios")
      .update({ ftp_ultimo_resultado: `Archivo recibido: ${file.name} (${(file.size / 1024).toFixed(0)} KB)` })
      .eq("id", proveedor.id);

    console.log(`FTP upload: ${proveedor.nombre_empresa} → ${file.name} (${file.size} bytes)`);

    return Response.json({
      ok: true,
      mensaje: `Archivo recibido correctamente. Se procesará a las 5:00 AM.`,
      archivo: file.name,
      tamaño: `${(file.size / 1024).toFixed(0)} KB`,
    });

  } catch (error) {
    console.error("Error FTP upload:", error);
    return Response.json({ ok: false, error: String(error) }, { status: 500 });
  }
}