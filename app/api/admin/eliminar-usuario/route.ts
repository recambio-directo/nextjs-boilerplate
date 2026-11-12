// app/api/admin/eliminar-usuario/route.ts
// Ruta antigua, ahora protegida: solo un administrador puede borrar un acceso.
// El panel usa /api/admin/usuario (accion "eliminar"), que además limpia sus datos.
import { sbAdmin } from "@/app/lib/envios";
import { verificarAdmin } from "@/app/lib/adminAuth";

const supabase = sbAdmin();

export async function POST(request: Request) {
  const admin = await verificarAdmin(request);
  if (!admin.ok) return Response.json({ ok: false, error: admin.error }, { status: admin.status });
  try {
    const { userId } = await request.json();
    if (!userId) return Response.json({ ok: false, error: "Falta userId" }, { status: 400 });
    if (userId === admin.adminId) return Response.json({ ok: false, error: "No puedes eliminar tu propio usuario" }, { status: 400 });
    const { error } = await supabase.auth.admin.deleteUser(userId);
    if (error) return Response.json({ ok: false, error: error.message }, { status: 500 });
    return Response.json({ ok: true });
  } catch (e: any) {
    return Response.json({ ok: false, error: e.message }, { status: 500 });
  }
}
