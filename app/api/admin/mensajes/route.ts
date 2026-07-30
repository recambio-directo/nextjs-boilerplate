import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: Request) {
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