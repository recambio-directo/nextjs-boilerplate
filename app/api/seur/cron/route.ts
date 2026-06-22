// app/api/seur/cron/route.ts
// Cron diario — revisa estado de pedidos enviados por SEUR

import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
const resend = new Resend(process.env.RESEND_API_KEY);

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { data: pedidos } = await supabase
      .from("pedidos")
      .select("id, codigo, tracking_seur, collection_ref_seur, estado_envio, cliente_email, cliente_nombre, productos, entregado_at")
      .not("tracking_seur", "is", null)
      .in("estado_envio", ["enviado", "preparando"])
      .eq("anulado", false);

    if (!pedidos || pedidos.length === 0) {
      return Response.json({ ok: true, procesados: 0, mensaje: "No hay envíos SEUR activos" });
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://recambio-directo.com";
    let actualizados = 0;
    let entregados = 0;

    for (const pedido of pedidos) {
      try {
        const trackingRes = await fetch(`${baseUrl}/api/seur/tracking`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            collectionRef: pedido.collection_ref_seur,
            referencia: pedido.codigo,
          }),
        });
        const trackingData = await trackingRes.json();
        if (!trackingData.ok) continue;

        const nuevoEstado = trackingData.estadoRD;
        if (nuevoEstado !== pedido.estado_envio) {
          const updateData: any = { estado_envio: nuevoEstado };

          if (nuevoEstado === "entregado" && pedido.estado_envio !== "entregado") {
            updateData.entregado_at = new Date().toISOString();
            entregados++;

            if (pedido.cliente_email) {
              try {
                await resend.emails.send({
                  from: "Recambio Directo <noreply@recambio-directo.com>",
                  to: [pedido.cliente_email],
                  subject: `✅ Pedido entregado — ${pedido.codigo}`,
                  html: `<div style="font-family:Arial;padding:30px;background:#f3f4f6;"><div style="background:white;padding:32px;border-radius:12px;max-width:600px;margin:auto;"><h1 style="color:#0b1736;font-size:24px;">✅ Tu pedido ha sido entregado</h1><p style="color:#374151;">El pedido <strong>${pedido.codigo}</strong> ha sido entregado por SEUR.</p><p style="color:#6b7280;font-size:13px;">Si tienes algún problema contáctanos en info@recambio-directo.com</p></div></div>`,
                });
              } catch (e) { console.error("Error email entrega SEUR:", e); }
            }

            try {
              const fechaPago = new Date();
              fechaPago.setDate(fechaPago.getDate() + 7);
              const proveedorNombre = (pedido.productos?.[0]?.proveedor_nombre) || "Proveedor";
              await resend.emails.send({
                from: "Recambio Directo <noreply@recambio-directo.com>",
                to: ["info@recambio-directo.com"],
                subject: `💰 Pagar proveedor en 7 días — ${pedido.codigo}`,
                html: `<div style="font-family:Arial;padding:30px;"><h2>💰 Pago a proveedor — SEUR</h2><p>Pedido <strong>${pedido.codigo}</strong> entregado. Pagar a <strong>${proveedorNombre}</strong> antes del <strong>${fechaPago.toLocaleDateString("es-ES")}</strong>.</p></div>`,
              });
            } catch (e) { console.error("Error email admin SEUR:", e); }
          }

          await supabase.from("pedidos").update(updateData).eq("id", pedido.id);
          actualizados++;
        }

        if (pedido.estado_envio === "entregado" && pedido.entregado_at) {
          const dias = Math.floor((Date.now() - new Date(pedido.entregado_at).getTime()) / (1000 * 60 * 60 * 24));
          if (dias >= 7) {
            await supabase.from("pedidos").update({ pago_proveedor_urgente: true }).eq("id", pedido.id).eq("pago_proveedor_completado", false);
          }
        }

      } catch (e) { console.error(`Error procesando pedido SEUR ${pedido.id}:`, e); }
    }

    return Response.json({ ok: true, procesados: pedidos.length, actualizados, entregados, timestamp: new Date().toISOString() });

  } catch (error) {
    console.error("Error cron SEUR:", error);
    return Response.json({ ok: false, error: String(error) }, { status: 500 });
  }
}