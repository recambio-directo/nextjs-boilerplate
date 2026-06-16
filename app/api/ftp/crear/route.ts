// app/api/ftp/crear/route.ts
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const { proveedorId, nombreUsuario, password, proveedorNombre, tipoReferencias } = await request.json();
    if (!proveedorId || !nombreUsuario || !password) {
      return Response.json({ ok: false, error: "Faltan datos" }, { status: 400 });
    }

    // 1. Crear usuario FTP en el servidor
    const resFtp = await fetch("http://168.231.83.226:3000/ftp/crear", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-proxy-secret": "rd-mrw-proxy-2026",
      },
      body: JSON.stringify({ usuario: nombreUsuario, password }),
    });

    if (!resFtp.ok) {
      const err = await resFtp.text();
      return Response.json({ ok: false, error: err }, { status: 500 });
    }

    const dataFtp = await resFtp.json();

    // 2. Añadir proveedor al cron script
    await fetch("http://168.231.83.226:3000/ftp/anadir-cron", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-proxy-secret": "rd-mrw-proxy-2026",
      },
      body: JSON.stringify({
        usuario: nombreUsuario,
        proveedorId,
        proveedorNombre: proveedorNombre || nombreUsuario,
      }),
    });

    // 3. Guardar en Supabase
    await supabase.from("usuarios").update({
      ftp_activo: true,
      ftp_usuario: nombreUsuario,
      ftp_api_key: `rd-ftp-${proveedorId.substring(0, 8)}`,
      tipo_referencias_ftp: tipoReferencias || "IAM",
    }).eq("id", proveedorId);

    return Response.json({ ok: true, usuario: dataFtp.usuario });
  } catch (error) {
    return Response.json({ ok: false, error: String(error) }, { status: 500 });
  }
}