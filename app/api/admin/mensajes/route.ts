import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { verificarAdmin } from "@/app/lib/adminAuth";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: Request) {
  const admin = await verificarAdmin(request);
  if (!admin.ok) return NextResponse.json({ error: admin.error }, { status: admin.status });

  const { searchParams } = new URL(request.url);
  const convId = searchParams.get("convId");
  if (!convId) return NextResponse.json([]);
  const { data } = await supabase
    .from("mensajes")
    .select("*")
    .eq("conversacion_id", convId)
    .order("created_at", { ascending: true });
  return NextResponse.json(data || []);
}