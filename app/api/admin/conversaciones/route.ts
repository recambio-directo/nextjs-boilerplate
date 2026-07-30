import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  const { data: convs } = await supabase
    .from("conversaciones")
    .select("*")
    .order("updated_at", { ascending: false });

  if (!convs || convs.length === 0) return NextResponse.json([]);

  const userIds = [...new Set([...convs.map((c: any) => c.user1_id), ...convs.map((c: any) => c.user2_id)].filter(Boolean))];
  const { data: perfiles } = await supabase.from("usuarios").select("id, nombre_empresa, email").in("id", userIds);
  const perfilesMap = new Map((perfiles || []).map((p: any) => [p.id, p]));

  const resultado = convs.map((c: any) => ({
    ...c,
    user1_nombre: perfilesMap.get(c.user1_id)?.nombre_empresa || perfilesMap.get(c.user1_id)?.email || "—",
    user2_nombre: perfilesMap.get(c.user2_id)?.nombre_empresa || perfilesMap.get(c.user2_id)?.email || "—",
  }));

  return NextResponse.json(resultado);
}