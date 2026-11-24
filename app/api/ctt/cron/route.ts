// app/api/ctt/cron/route.ts
// Cron diario — revisa estado de pedidos enviados por CTT Express

import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { cabeceraInterna } from "@/app/lib/seguridad";
import { verificarAdmin } from "@/app/lib/adminAuth";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
const resend = new Resend(process.env.RESEND_API_KEY);

// Misma lógica que app/admin/page.tsx (crearPagoProveedorSiNoExiste + importesProveedor):
// por proveedor, (precio + impuesto) × cantidad + IVA 21 %, pago a 7 días desde la entrega.
async function crearPagoProveedorSiNoExiste(pedido: any) {
  if (!pedido?.id || !Array.isArray(pedido.productos)) return;
  const importes = new Map<string, number>();
  for (const prod of pedido.productos) {
    if (!prod?.proveedor_id) continue;
    const base = (Number(prod.precio || 0) + Number(prod.impuesto || 0)) * Number(prod.cantidad || 1);
    importes.set(prod.proveedor_id, (importes.get(prod.proveedor_id) || 0) + base);
  }
  const fechaEntrega = new Date().toISOString();
  const fechaPago = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  for (const [provId, base] of importes) {
    const importe = Math.round(base * 1.21 * 100) / 100;
    if (importe <= 0) continue;
    const { data: existe } = await supabase.from("pagos_proveedores").select("id")
      .eq("pedido_id", pedido.id).eq("proveedor_id", provId).maybeSingle();
    if (!existe) {
      await supabase.from("pagos_proveedores").insert({
        pedido_id: pedido.id, proveedor_id: provId, importe,
        estado: "esperando_7dias", fecha_entrega: fechaEntrega, fecha_pago_programado: fechaPago,
      });
    }
  }
}

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  // Autorizado: el cron de Vercel (CRON_SECRET) o un administrador desde el panel Sistema
  const esCron = !!process.env.CRON_SECRET && authHeader === `Bearer ${process.env.CRON_SECRET}`;
  if (!esCron) {
    const admin = await verificarAdmin(request);
    if (!admin.ok) return Response.json({ error: admin.error }, { status: admin.status });
  }

  try {
    // Buscar pedidos con tracking CTT activo
    const { data: pedidos } = await supabase
      .from("pedidos")
      .select("id, codigo, tracking, estado_envio, cliente_email, cliente_nombre, productos, entregado_at, agencia, transporte")
      .not("tracking", "is", null)
      // Incluye los estados que se pueden poner a mano desde el admin, para no dejar de revisarlos
      .in("estado_envio", ["preparando", "recogido", "enviado", "en_transito", "incidencia"])
      .eq("anulado", false)
      .or("agencia.ilike.%ctt%,transporte.ilike.%ctt%");

    if (!pedidos || pedidos.length === 0) {
      return Response.json({ ok: true, procesados: 0, mensaje: "No hay envíos CTT activos" });
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://recambio-directo.com";
    let actualizados = 0;
    let entregados = 0;

    for (const pedido of pedidos) {
      try {
        const trackingRes = await fetch(`${baseUrl}/api/ctt/tracking`, {
          method: "POST",
          headers: { "Content-Type": "application/json", ...cabeceraInterna() },
          body: JSON.stringify({ shippingCode: pedido.tracking }),
        });
        const trackingData = await trackingRes.json();
        if (!trackingData.ok || !trackingData.estadoRD) {
          console.warn(`CTT cron ${pedido.codigo}: sin estado (${trackingData.detalle || trackingData.error || "sin información"})`);
          continue;
        }

        const nuevoEstado = trackingData.estadoRD;
        // No "retroceder": un estado puesto a mano (en tránsito, recogido, incidencia) solo cambia si CTT dice ENTREGADO
        const estadoManual = ["recogido", "en_transito", "incidencia"].includes(pedido.estado_envio);
        const cambia = nuevoEstado !== pedido.estado_envio
          && !(estadoManual && nuevoEstado !== "entregado")
          && !(pedido.estado_envio === "enviado" && nuevoEstado === "preparando");
        console.log(`CTT cron ${pedido.codigo}: ${pedido.estado_envio} → CTT ${trackingData.ultimoEstadoCTT?.code || "?"} ${trackingData.ultimoEstadoCTT?.description || ""} (${nuevoEstado})${cambia ? " ACTUALIZADO" : ""}`);
        if (cambia) {
          const updateData: any = { estado_envio: nuevoEstado };

          if (nuevoEstado === "entregado" && pedido.estado_envio !== "entregado") {
            updateData.entregado_at = new Date().toISOString();
            updateData.fecha_entrega_confirmada = new Date().toISOString();
            entregados++;

            if (pedido.cliente_email) {
              try {
                await resend.emails.send({
                  from: "Recambio Directo <noreply@recambio-directo.com>",
                  to: [pedido.cliente_email],
                  subject: `✅ Pedido entregado — ${pedido.codigo}`,
                  html: `<div style="font-family:Arial;padding:30px;background:#f3f4f6;"><div style="background:white;padding:32px;border-radius:12px;max-width:600px;margin:auto;"><h1 style="color:#0b1736;font-size:24px;">✅ Tu pedido ha sido entregado</h1><p style="color:#374151;">El pedido <strong>${pedido.codigo}</strong> ha sido entregado por CTT Express.</p><p style="color:#6b7280;font-size:13px;">Si tienes algún problema contáctanos en info@recambio-directo.com</p></div></div>`,
                });
              } catch (e) { console.error("Error email entrega CTT:", e); }
            }

            try {
              const fechaPago = new Date();
              fechaPago.setDate(fechaPago.getDate() + 7);
              const proveedorNombre = (pedido.productos?.[0]?.proveedor_nombre) || "Proveedor";
              await resend.emails.send({
                from: "Recambio Directo <noreply@recambio-directo.com>",
                to: ["info@recambio-directo.com"],
                subject: `💰 Pagar proveedor en 7 días — ${pedido.codigo}`,
                html: `<div style="font-family:Arial;padding:30px;"><h2>💰 Pago a proveedor — CTT</h2><p>Pedido <strong>${pedido.codigo}</strong> entregado. Pagar a <strong>${proveedorNombre}</strong> antes del <strong>${fechaPago.toLocaleDateString("es-ES")}</strong>.</p></div>`,
              });
            } catch (e) { console.error("Error email admin CTT:", e); }
          }

          await supabase.from("pedidos").update(updateData).eq("id", pedido.id);
          actualizados++;

          // Igual que al marcar "Entregado" en el admin: programar el pago al proveedor a 7 días
          if (nuevoEstado === "entregado") {
            try { await crearPagoProveedorSiNoExiste(pedido); }
            catch (e) { console.error(`Error creando pago proveedor ${pedido.codigo}:`, e); }
          }
        }

        if (pedido.estado_envio === "entregado" && pedido.entregado_at) {
          const dias = Math.floor((Date.now() - new Date(pedido.entregado_at).getTime()) / (1000 * 60 * 60 * 24));
          if (dias >= 7) {
            await supabase.from("pedidos").update({ pago_proveedor_urgente: true }).eq("id", pedido.id).eq("pago_proveedor_completado", false);
          }
        }

      } catch (e) { console.error(`Error procesando pedido CTT ${pedido.id}:`, e); }
    }

    return Response.json({ ok: true, procesados: pedidos.length, actualizados, entregados, timestamp: new Date().toISOString() });

  } catch (error) {
    console.error("Error cron CTT:", error);
    return Response.json({ ok: false, error: String(error) }, { status: 500 });
  }
}
