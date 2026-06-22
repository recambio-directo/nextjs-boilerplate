// app/api/anular-envio-agencia/route.ts
// Anula la recogida/envío en la agencia cuando se anula un pedido
// Llamado desde confirmarAnulacion() en los paneles

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const { pedidoId } = await request.json();
    if (!pedidoId) {
      return Response.json({ ok: false, error: "Falta pedidoId" }, { status: 400 });
    }

    // Leer el pedido para saber qué agencia tiene y qué referencias de envío
    const { data: pedido } = await supabase
      .from("pedidos")
      .select("agencia, transporte, tracking, tracking_nacex, tracking_seur, collection_ref_seur, estado_envio")
      .eq("id", pedidoId)
      .single();

    if (!pedido) {
      return Response.json({ ok: false, error: "Pedido no encontrado" }, { status: 404 });
    }

    // Solo anular si el envío no ha salido todavía
    if (["enviado", "entregado"].includes(pedido.estado_envio || "")) {
      return Response.json({
        ok: false,
        error: "El envío ya está en tránsito, no se puede anular en la agencia",
        estadoEnvio: pedido.estado_envio,
      }, { status: 400 });
    }

    const agencia = (pedido.agencia || pedido.transporte || "").toLowerCase();
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://recambio-directo.com";

    // ── SEUR ────────────────────────────────────────────────────────────────
    if (agencia.includes("seur") && pedido.collection_ref_seur) {
      const res = await fetch(`${baseUrl}/api/seur/anular`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ collectionRef: pedido.collection_ref_seur }),
      });
      const data = await res.json();
      return Response.json({
        ok: data.ok,
        agencia: "SEUR",
        referencia: pedido.collection_ref_seur,
        mensaje: data.ok ? "Recogida SEUR anulada correctamente" : data.rawResponse,
      });
    }

    // ── NACEX ───────────────────────────────────────────────────────────────
    if (agencia.includes("nacex") && pedido.tracking_nacex) {
      const res = await fetch(`${baseUrl}/api/nacex/anular`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ localizador: pedido.tracking_nacex }),
      });
      const data = await res.json();
      return Response.json({
        ok: data.ok,
        agencia: "NACEX",
        referencia: pedido.tracking_nacex,
        mensaje: data.ok ? "Envío NACEX anulado correctamente" : data.rawResponse,
      });
    }

    // ── MRW ─────────────────────────────────────────────────────────────────
    if (agencia.includes("mrw") && pedido.tracking) {
      const res = await fetch(`${baseUrl}/api/mrw/anular`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ numeroEnvio: pedido.tracking }),
      });
      const data = await res.json();
      return Response.json({
        ok: data.ok,
        agencia: "MRW",
        referencia: pedido.tracking,
        mensaje: data.ok ? "Envío MRW anulado correctamente" : data.mensaje,
      });
    }

    // Sin agencia integrada (GLS, Correos Express, Mis Medios)
    return Response.json({
      ok: true,
      agencia: agencia || "sin_agencia",
      mensaje: "Agencia sin integración de anulación automática — gestiona manualmente si es necesario",
    });

  } catch (error) {
    console.error("Error anular-envio-agencia:", error);
    return Response.json({ ok: false, error: String(error) }, { status: 500 });
  }
}