import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const revalidate = 3600; // cache 1 h

// Contadores públicos de la home: solo cifras reales.
// (Talleres, proveedores y pedidos se volverán a mostrar cuando sean cifras que interese enseñar.)
export async function GET() {
  try {
    const [refs, marcas, cruces] = await Promise.all([
      // Referencias distintas con stock (una por referencia + marca, aunque la tengan varios proveedores)
      supabase.from("refs_seo").select("rn", { count: "exact", head: true }),
      // Marcas con alguna referencia en stock
      supabase.from("refs_seo_marcas").select("marca_slug", { count: "exact", head: true }),
      // Equivalencias OEM↔IAM: tabla de millones de filas → recuento estimado de Postgres (rápido)
      supabase.from("cruces_referencias").select("*", { count: "estimated", head: true }),
    ]);

    return NextResponse.json({
      referencias: refs.count ?? 0,
      marcas: marcas.count ?? 0,
      equivalencias: cruces.count ?? 0,
    });
  } catch {
    return NextResponse.json({ referencias: 0, marcas: 0, equivalencias: 0 }, { status: 500 });
  }
}
