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

    return NextResponse.json({
      referencias: refCount.count ?? 0,
      proveedores: provCount.count ?? 0,
      talleres: tallerCount.count ?? 0,
      pedidos: pedidoCount.count ?? 0,
    });
  } catch {
    return NextResponse.json(
      { referencias: 0, proveedores: 0, talleres: 0, pedidos: 0 },
      { status: 500 }
    );
  }
}
