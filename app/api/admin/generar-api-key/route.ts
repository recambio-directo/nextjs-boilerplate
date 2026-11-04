// app/api/admin/generar-api-key/route.ts
// Genera una API key para un proveedor (solo admin)
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createHash, randomBytes } from "crypto";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  // Verificar que es admin via cookie de sesión
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ ok: false, error: "No autorizado" }, { status: 401 });
  }

  const token = authHeader.replace("Bearer ", "");
  const { data: { user } } = await supabase.auth.getUser(token);
  if (!user) {
    return NextResponse.json({ ok: false, error: "Sesión inválida" }, { status: 401 });
  }

  const { data: perfil } = await supabase
    .from("usuarios")
    .select("tipo")
    .eq("id", user.id)
    .single();

  if (!perfil || perfil.tipo !== "admin") {
    return NextResponse.json({ ok: false, error: "Solo administradores" }, { status: 403 });
  }

  // Leer body
  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Body inválido" }, { status: 400 });
  }

  const { proveedorId, nombre } = body;
  if (!proveedorId) {
    return NextResponse.json({ ok: false, error: "Falta proveedorId" }, { status: 400 });
  }

  // Verificar que el proveedor existe
  const { data: proveedor } = await supabase
    .from("usuarios")
    .select("id, nombre_empresa, tipo")
    .eq("id", proveedorId)
    .single();

  if (!proveedor) {
    return NextResponse.json({ ok: false, error: "Proveedor no encontrado" }, { status: 404 });
  }

  // Desactivar keys anteriores de este proveedor
  await (supabase
    .from("api_keys_proveedores") as any)
    .update({ activa: false })
    .eq("proveedor_id", proveedorId);

  // Generar nueva key
  const rawKey = "rd_live_" + randomBytes(20).toString("hex");
  const hash = createHash("sha256").update(rawKey).digest("hex");

  const { error } = await (supabase
    .from("api_keys_proveedores") as any)
    .insert({
      proveedor_id: proveedorId,
      api_key_hash: hash,
      api_key_prefix: rawKey.substring(0, 12),
      nombre: nombre || `Key de ${proveedor.nombre_empresa || "proveedor"}`,
      activa: true,
      total_peticiones: 0,
      ultimo_uso: null,
    });

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    api_key: rawKey,
    empresa: proveedor.nombre_empresa || proveedor.tipo,
  });
}
