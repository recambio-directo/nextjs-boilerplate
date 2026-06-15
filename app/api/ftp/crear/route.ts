// app/api/ftp/crear/route.ts
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const { proveedorId, nombreUsuario, password } = await request.json();
    if (!proveedorId || !nombreUsuario || !password) {
      return Response.json({ ok: false, error: "Faltan datos" }, { status: 400 });
    }

    // Llamar al proxy VPS que ejecuta los comandos en el servidor
    const res = await fetch("http://168.231.83.226:3000/ftp/crear", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-proxy-secret": "rd-mrw-proxy-2026",
      },
      body: JSON.stringify({ usuario: nombreUsuario, password }),
    });

    if (!res.ok) {
      const err = await res.text();
      return Response.json({ ok: false, error: err }, { status: 500 });
    }

    const data = await res.json();

    // Guardar credenciales FTP en Supabase
    await supabase.from("usuarios").update({
      ftp_activo: true,
      ftp_usuario: nombreUsuario,
      ftp_api_key: `rd-ftp-${proveedorId.substring(0, 8)}`,
    }).eq("id", proveedorId);

    return Response.json({ ok: true, usuario: data.usuario });
  } catch (error) {
    return Response.json({ ok: false, error: String(error) }, { status: 500 });
  }
}