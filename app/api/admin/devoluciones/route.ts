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

  const { data } = await supabase.from("devoluciones").select("*").order("id", { ascending: false });
  return NextResponse.json(data || []);
}