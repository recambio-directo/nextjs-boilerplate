import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const DHL_USER = process.env.DHL_USER!;
const DHL_KEY = process.env.DHL_KEY!;
const DHL_BASE = "https://external.dhl.es/cimapi/api/v1/customer";

async function getToken(): Promise<string | null> {
  try {
    const res = await fetch(`${DHL_BASE}/authenticate`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "accept": "application/json" },
      body: JSON.stringify({ Username: DHL_USER, Password: DHL_KEY }),
    });
    if (!res.ok) return null;
    const token = await res.text();
    return token.replace(/"/g, "").trim();
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const { pedidoId } = await req.json();
    if (!pedidoId) return NextResponse.json({ ok: false, error: "pedidoId requerido" }, { status: 400 });

    const { data: pedido } = await supabase.from("pedidos").select("tracking_dhl").eq("id", pedidoId).single();
    if (!(pedido as any)?.tracking_dhl) return NextResponse.json({ ok: false, error: "Sin tracking DHL" });

    const token = await getToken();
    if (!token) return NextResponse.json({ ok: false, error: "Error autenticación DHL" }, { status: 500 });

    const res = await fetch(
      `${DHL_BASE}/shipment?Year=0&Tracking=${(pedido as any).tracking_dhl}&Action=DELETE`,
      {
        method: "GET",
        headers: {
          "accept": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      }
    );

    const text = await res.text().catch(() => "");
    if (!res.ok) {
      let err: any = {};
      try { err = JSON.parse(text); } catch {}
      return NextResponse.json({ ok: false, error: err.Message || text || "Error anulando DHL" }, { status: 500 });
    }

    await supabase.from("pedidos").update({ tracking_dhl: null, etiqueta_envio_url: null }).eq("id", pedidoId);

    return NextResponse.json({ ok: true });

  } catch (e: any) {
    console.error("Error DHL anular-envio:", e);
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}