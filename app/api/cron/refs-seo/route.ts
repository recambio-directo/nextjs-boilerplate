// app/api/cron/refs-seo/route.ts
// Cron diario (vercel.json): recalcula las vistas de las páginas públicas de referencias
// después de la importación FTP de las 5:00, para que Google vea el stock del día.
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: Request) {
  const secreto = process.env.CRON_SECRET;
  if (!secreto || request.headers.get("authorization") !== `Bearer ${secreto}`) {
    return NextResponse.json({ ok: false, error: "No autorizado" }, { status: 401 });
  }

  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const inicio = Date.now();
  const { error } = await supabase.rpc("refrescar_refs_seo");
  if (error) {
    console.error("refs-seo: error al refrescar:", error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true, segundos: Math.round((Date.now() - inicio) / 1000) });
}
