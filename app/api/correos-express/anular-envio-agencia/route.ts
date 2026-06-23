import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { pedidoId } = await req.json();
    if (!pedidoId) return NextResponse.json({ error: "pedidoId requerido" }, { status: 400 });

    const { data: pedido, error } = await supabase
      .from("pedidos")
      .select("agencia, transporte, tracking, tracking_nacex, tracking_seur, collection_ref_seur, collection_ref_correos_express, estado_envio")
      .eq("id", pedidoId)
      .single();

    if (error || !pedido) return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 });

    const estadosNoAnulables = ["enviado", "entregado"];
    if (estadosNoAnulables.includes(pedido.estado_envio)) {
      return NextResponse.json({ error: "El pedido ya fue enviado o entregado, no se puede anular en la agencia" }, { status: 400 });
    }

    const agencia = (pedido.agencia || pedido.transporte || "").toLowerCase();
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://recambio-directo.vercel.app";

    // SEUR
    if (agencia.includes("seur")) {
      if (!pedido.collection_ref_seur) {
        return NextResponse.json({ ok: true, mensaje: "SEUR: sin referencia de recogida, nada que anular" });
      }
      const r = await fetch(`${baseUrl}/api/seur/anular`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ collectionRef: pedido.collection_ref_seur }),
      });
      const d = await r.json();
      return NextResponse.json({ ok: true, agencia: "seur", resultado: d });
    }

    // NACEX
    if (agencia.includes("nacex")) {
      if (!pedido.tracking_nacex) {
        return NextResponse.json({ ok: true, mensaje: "NACEX: sin tracking, nada que anular" });
      }
      const r = await fetch(`${baseUrl}/api/nacex/anular`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ localizador: pedido.tracking_nacex }),
      });
      const d = await r.json();
      return NextResponse.json({ ok: true, agencia: "nacex", resultado: d });
    }

    // MRW
    if (agencia.includes("mrw")) {
      if (!pedido.tracking) {
        return NextResponse.json({ ok: true, mensaje: "MRW: sin tracking, nada que anular" });
      }
      const r = await fetch(`${baseUrl}/api/mrw/anular`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ numeroEnvio: pedido.tracking }),
      });
      const d = await r.json();
      return NextResponse.json({ ok: true, agencia: "mrw", resultado: d });
    }

    // CORREOS EXPRESS
    if (agencia.includes("correos")) {
      if (!pedido.collection_ref_correos_express) {
        return NextResponse.json({ ok: true, mensaje: "Correos Express: sin referencia de recogida, nada que anular" });
      }
      const r = await fetch(`${baseUrl}/api/correos-express/anular`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyRecogida: pedido.collection_ref_correos_express }),
      });
      const d = await r.json();
      return NextResponse.json({ ok: true, agencia: "correos-express", resultado: d });
    }

    // GLS / Mis Medios / otras — gestión manual
    return NextResponse.json({ ok: true, mensaje: `${agencia || "agencia desconocida"}: gestiona la anulación manualmente` });

  } catch (e: any) {
    console.error("Error enrutador anulación:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}