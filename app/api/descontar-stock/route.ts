import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { pedidoId } = await req.json();
    if (!pedidoId) return NextResponse.json({ ok: false }, { status: 400 });

    const { data: pedido } = await supabase.from("pedidos").select("productos").eq("id", pedidoId).single();
    if (!pedido?.productos) return NextResponse.json({ ok: false });

    for (const prod of pedido.productos) {
      const provId = prod.proveedor_id;
      const ref = prod.referencia;
      const cantidad = prod.cantidad || 1;
      if (!provId || !ref) continue;

      const { data: pieza } = await supabase
        .from("piezas_publicadas")
        .select("id, stock")
        .eq("proveedor_id", provId)
        .eq("referencia", ref)
        .maybeSingle();

      if (!pieza) continue;

      const nuevoStock = Math.max(0, (pieza.stock || 0) - cantidad);
      if (nuevoStock === 0) {
        await supabase.from("piezas_publicadas").delete().eq("id", pieza.id);
      } else {
        await supabase.from("piezas_publicadas").update({ stock: nuevoStock }).eq("id", pieza.id);
      }
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("Error descontando stock:", e);
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}