// app/api/nacex/cron/route.ts
// Cron job — llamado por Vercel cada 30 minutos
// Consulta el estado de todos los pedidos con tracking NACEX activo
// Si detecta "entregado" arranca el contador de 7 días para pago al proveedor

import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
const resend = new Resend(process.env.RESEND_API_KEY);

export async function GET(request: Request) {
  // Verificar que la llamada viene de Vercel Cron
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Buscar pedidos con tracking NACEX activo (estado enviado o preparando)
    const { data: pedidos } = await supabase
      .from("pedidos")
      .select("id, codigo, tracking_nacex, codigo_postal_destino, estado_envio, cliente_email, cliente_nombre, productos, entregado_at")
      .not("tracking_nacex", "is", null)
      .in("estado_envio", ["enviado", "preparando"])
      .eq("anulado", false);

    if (!pedidos || pedidos.length === 0) {
      return Response.json({ ok: true, procesados: 0, mensaje: "No hay envíos NACEX activos" });
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://recambio-directo.com";
    let actualizados = 0;
    let entregados = 0;

    for (const pedido of pedidos) {
      try {
        if (!pedido.codigo_postal_destino) continue; // NACEX lo necesita siempre

        // Consultar estado en NACEX
        const trackingRes = await fetch(`${baseUrl}/api/nacex/tracking`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            localizador: pedido.tracking_nacex,
            codigoPostalDestino: pedido.codigo_postal_destino,
          }),
        });
        const trackingData = await trackingRes.json();
        if (!trackingData.ok) continue;

        const nuevoEstado = trackingData.estadoRD;

        // Solo actualizar si el estado cambió
        if (nuevoEstado !== pedido.estado_envio) {
          const updateData: any = { estado_envio: nuevoEstado };

          // Si acaba de ser entregado → guardar fecha de entrega
          if (nuevoEstado === "entregado" && pedido.estado_envio !== "entregado") {
            updateData.entregado_at = new Date().toISOString();
            entregados++;

            // Notificar al cliente por email
            if (pedido.cliente_email) {
              try {
                await resend.emails.send({
                  from: "Recambio Directo <noreply@recambio-directo.com>",
                  to: [pedido.cliente_email],
                  subject: `✅ Pedido entregado — ${pedido.codigo}`,
                  html: `
                    <div style="font-family:Arial;padding:30px;background:#f3f4f6;">
                      <div style="background:white;padding:32px;border-radius:12px;max-width:600px;margin:auto;">
                        <h1 style="color:#0b1736;font-size:24px;">✅ Tu pedido ha sido entregado</h1>
                        <p style="color:#374151;font-size:15px;">El pedido <strong>${pedido.codigo}</strong> ha sido entregado correctamente.</p>
                        <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:16px;margin:20px 0;">
                          <p style="margin:0;color:#166534;font-size:14px;">
                            📦 Tracking NACEX: <strong>${pedido.tracking_nacex}</strong>
                          </p>
                        </div>
                        <p style="color:#6b7280;font-size:13px;">Si tienes algún problema con el pedido, contáctanos en info@recambio-directo.com</p>
                        <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;" />
                        <p style="color:#9ca3af;font-size:12px;text-align:center;">Recambio Directo — Marketplace B2B de recambios de automoción</p>
                      </div>
                    </div>
                  `,
                });
              } catch (emailErr) {
                console.error("Error email entrega:", emailErr);
              }
            }

            // Notificar al admin (Vicente) para pago al proveedor en 7 días
            try {
              const fechaPago = new Date();
              fechaPago.setDate(fechaPago.getDate() + 7);
              const productos = pedido.productos || [];
              const proveedorNombre = productos[0]?.proveedor_nombre || "Proveedor";

              await resend.emails.send({
                from: "Recambio Directo <noreply@recambio-directo.com>",
                to: ["info@recambio-directo.com"],
                subject: `💰 Pagar proveedor en 7 días — ${pedido.codigo}`,
                html: `
                  <div style="font-family:Arial;padding:30px;background:#f3f4f6;">
                    <div style="background:white;padding:32px;border-radius:12px;max-width:600px;margin:auto;">
                      <h1 style="color:#0b1736;font-size:22px;">💰 Recordatorio de pago a proveedor</h1>
                      <p style="color:#374151;font-size:15px;">El pedido <strong>${pedido.codigo}</strong> ha sido entregado (NACEX). Debes pagar al proveedor en 7 días.</p>
                      <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:16px;margin:20px 0;">
                        <p style="margin:0 0 8px;font-size:14px;"><strong>Pedido:</strong> ${pedido.codigo}</p>
                        <p style="margin:0 0 8px;font-size:14px;"><strong>Proveedor:</strong> ${proveedorNombre}</p>
                        <p style="margin:0 0 8px;font-size:14px;"><strong>Cliente:</strong> ${pedido.cliente_nombre || pedido.cliente_email}</p>
                        <p style="margin:0;font-size:14px;color:#1e40af;font-weight:700;"><strong>Fecha límite pago:</strong> ${fechaPago.toLocaleDateString("es-ES")}</p>
                      </div>
                      <p style="color:#6b7280;font-size:13px;">Accede al panel de administración para gestionar el pago.</p>
                    </div>
                  </div>
                `,
              });
            } catch (emailErr) {
              console.error("Error email admin pago:", emailErr);
            }
          }

          await supabase.from("pedidos").update(updateData).eq("id", pedido.id);
          actualizados++;
        }

        // Comprobar pedidos entregados hace más de 7 días sin pagar
        if (pedido.estado_envio === "entregado" && pedido.entregado_at) {
          const diasDesdeEntrega = Math.floor(
            (Date.now() - new Date(pedido.entregado_at).getTime()) / (1000 * 60 * 60 * 24)
          );
          if (diasDesdeEntrega >= 7) {
            await supabase.from("pedidos")
              .update({ pago_proveedor_urgente: true })
              .eq("id", pedido.id)
              .eq("pago_proveedor_completado", false);
          }
        }

      } catch (pedidoErr) {
        console.error(`Error procesando pedido NACEX ${pedido.id}:`, pedidoErr);
      }
    }

    return Response.json({
      ok: true,
      procesados: pedidos.length,
      actualizados,
      entregados,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error("Error cron NACEX:", error);
    return Response.json({ ok: false, error: String(error) }, { status: 500 });
  }
}