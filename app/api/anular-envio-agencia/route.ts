// app/api/anular-envio-agencia/route.ts
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

    const { data: pedido } = await supabase
      .from("pedidos")
      .select("agencia, transporte, tracking, tracking_nacex, tracking_seur, tracking_ctt, collection_ref_seur, collection_ref_correos_express, estado_envio")
      .eq("id", pedidoId)
      .single();

    if (!pedido) {
      return Response.json({ ok: false, error: "Pedido no encontrado" }, { status: 404 });
    }

    if (["enviado", "entregado"].includes(pedido.estado_envio || "")) {
      return Response.json({
        ok: false,
        error: "El envío ya está en tránsito, no se puede anular en la agencia",
        estadoEnvio: pedido.estado_envio,
      }, { status: 400 });
    }

    const agencia = (pedido.agencia || pedido.transporte || "").toLowerCase();
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://recambio-directo.com";

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

    // ── CORREOS EXPRESS ──────────────────────────────────────────────────────
    if (agencia.includes("correos") && pedido.collection_ref_correos_express) {
      const res = await fetch(`${baseUrl}/api/correos-express/anular`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyRecogida: pedido.collection_ref_correos_express }),
      });
      const data = await res.json();
      return Response.json({
        ok: data.ok,
        agencia: "Correos Express",
        referencia: pedido.collection_ref_correos_express,
        mensaje: data.ok ? "Recogida CEX anulada correctamente" : data.error,
      });
    }

    // ── CTT EXPRESS ──────────────────────────────────────────────────────────
    if (agencia.includes("ctt") && pedido.tracking_ctt) {
      const res = await fetch(`${baseUrl}/api/ctt/anular`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shippingCode: pedido.tracking_ctt }),
      });
      const data = await res.json();
      return Response.json({
        ok: data.ok,
        agencia: "CTT Express",
        referencia: pedido.tracking_ctt,
        mensaje: data.ok ? "Envío CTT Express anulado correctamente" : data.error,
      });
    }

    // ── DHL (pendiente integración) ──────────────────────────────────────────
    // Cuando lleguen las credenciales DHL, añadir aquí:
    // if (agencia.includes("dhl") && pedido.tracking_dhl) { ... }

    // ── GLS (pendiente integración) ──────────────────────────────────────────
    // Cuando lleguen las credenciales GLS, añadir aquí:
    // if (agencia.includes("gls") && pedido.tracking_gls) { ... }

    // Sin agencia integrada (GLS, DHL, Mis Medios, etc.)
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