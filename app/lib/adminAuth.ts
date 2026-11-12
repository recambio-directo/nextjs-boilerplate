// app/lib/adminAuth.ts
// Verificación de administrador para las rutas /api/admin/*.
// El panel envía la sesión de Supabase del admin en la cabecera Authorization.
import { sbAdmin } from "@/app/lib/envios";

export type AdminCheck =
  | { ok: true; adminId: string; adminEmail: string }
  | { ok: false; status: number; error: string };

export async function verificarAdmin(request: Request): Promise<AdminCheck> {
  const authHeader = request.headers.get("authorization") || "";
  if (!authHeader.startsWith("Bearer ")) return { ok: false, status: 401, error: "No autorizado" };
  const token = authHeader.slice(7).trim();
  if (!token) return { ok: false, status: 401, error: "No autorizado" };

  const supabase = sbAdmin();
  const { data, error } = await supabase.auth.getUser(token);
  const user = data?.user;
  if (error || !user) return { ok: false, status: 401, error: "Sesión inválida o caducada: vuelve a iniciar sesión" };

  const { data: perfil } = await supabase.from("usuarios").select("tipo").eq("id", user.id).maybeSingle();
  if (!perfil || perfil.tipo !== "admin") return { ok: false, status: 403, error: "Solo administradores" };

  return { ok: true, adminId: user.id, adminEmail: user.email || "" };
}
