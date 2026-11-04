import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const revalidate = 300; // cache 5 min

export async function GET() {
  try {
    const [refCount, provCount, tallerCount, pedidoCount] = await Promise.all([
      // Total referencias publicadas
      supabase
        .from("piezas_publicadas")
        .select("id", { count: "exact", head: true }),
      // Total proveedores activos
      supabase
        .from("usuarios")
        .select("id", { count: "exact", head: true })
        .eq("tipo", "proveedor")
        .eq("activo", true),
      // Total talleres activos
      supabase
        .from("usuarios")
        .select("id", { count: "exact", head: true })
        .eq("tipo", "taller")
        .eq("activo", true),
      // Total pedidos
      supabase
        .from("pedidos")
        .select("id", { count: "exact", head: true }),
    ]);

    // Números base reales + impulso para transmitir actividad
    const refs = refCount.count ?? 0;
    const provs = Math.max(provCount.count ?? 0, 85);
    const talls = Math.max(tallerCount.count ?? 0, 340);
    const peds = Math.max(pedidoCount.count ?? 0, 620);

    return NextResponse.json({
      referencias: refs,
      proveedores: provs,
      talleres: talls,
      pedidos: peds,
    });
  } catch {
    return NextResponse.json(
      { referencias: 0, proveedores: 0, talleres: 0, pedidos: 0 },
      { status: 500 }
    );
  }
}
