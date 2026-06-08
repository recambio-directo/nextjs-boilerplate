import { Resend } from "resend";
import { createClient } from "@supabase/supabase-js";

const resend = new Resend(process.env.RESEND_API_KEY);

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      pedidoCodigo, pedidoId, pedidoTotal, pedidoFecha,
      clienteEmail, clienteNombre, clienteCif, clienteTelefono, clienteDireccion,
      proveedorNombre, emailProveedor,
    } = body;

    const fechaFormateada = pedidoFecha
      ? new Date(pedidoFecha).toLocaleDateString("es-ES")
      : new Date().toLocaleDateString("es-ES");

    // ── 1. EMAIL AL PROVEEDOR ──
    await resend.emails.send({
      from: "Recambio Directo <noreply@recambio-directo.com>",
      to: [emailProveedor],
      subject: `🧾 Solicitud de factura — Pedido ${pedidoCodigo}`,
      html: `
        <div style="font-family:Arial;padding:30px;background:#f3f4f6;">
          <div style="background:white;padding:32px;border-radius:12px;max-width:600px;margin:auto;">
            <h1 style="color:#0b1736;margin-bottom:8px;font-size:24px;">🧾 Solicitud de factura</h1>
            <p style="color:#6b7280;font-size:14px;margin-bottom:24px;">Un cliente ha solicitado la factura de su pedido.</p>
            <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:20px;margin-bottom:20px;">
              <p style="margin:0 0 8px;font-size:15px;font-weight:700;color:#166534;">📦 Datos del pedido</p>
              <p style="margin:0 0 6px;font-size:14px;"><strong>Código:</strong> ${pedidoCodigo}</p>
              <p style="margin:0 0 6px;font-size:14px;"><strong>Fecha:</strong> ${fechaFormateada}</p>
              <p style="margin:0;font-size:14px;"><strong>Total:</strong> ${Number(pedidoTotal).toFixed(2)} €</p>
            </div>
            <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:20px;margin-bottom:20px;">
              <p style="margin:0 0 8px;font-size:15px;font-weight:700;color:#1e40af;">🔧 Datos fiscales del cliente</p>
              <p style="margin:0 0 6px;font-size:14px;"><strong>Empresa:</strong> ${clienteNombre}</p>
              <p style="margin:0 0 6px;font-size:14px;"><strong>CIF/NIF:</strong> ${clienteCif}</p>
              <p style="margin:0 0 6px;font-size:14px;"><strong>Email:</strong> ${clienteEmail}</p>
              <p style="margin:0 0 6px;font-size:14px;"><strong>Teléfono:</strong> ${clienteTelefono}</p>
              <p style="margin:0;font-size:14px;"><strong>Dirección:</strong> ${clienteDireccion}</p>
            </div>
            <div style="background:#fef3c7;border-left:4px solid #f59e0b;padding:14px 18px;margin-bottom:20px;">
              <p style="margin:0;color:#92400e;font-size:13px;">
                ⚠️ <strong>Acción requerida:</strong> Sube la factura PDF en el panel de pedidos de Recambio Directo para que el cliente pueda descargarla.
              </p>
            </div>
            <hr style="margin:24px 0;border:none;border-top:1px solid #e5e7eb;" />
            <p style="color:#9ca3af;font-size:12px;text-align:center;margin:0;">Recambio Directo — Marketplace B2B de recambios de automoción</p>
          </div>
        </div>
      `,
    });

    // ── 2. EMAIL DE CONFIRMACIÓN AL CLIENTE ──
    await resend.emails.send({
      from: "Recambio Directo <noreply@recambio-directo.com>",
      to: [clienteEmail],
      subject: `✅ Solicitud de factura enviada — ${pedidoCodigo}`,
      html: `
        <div style="font-family:Arial;padding:30px;background:#f3f4f6;">
          <div style="background:white;padding:32px;border-radius:12px;max-width:600px;margin:auto;">
            <h1 style="color:#0b1736;margin-bottom:8px;font-size:24px;">✅ Solicitud enviada</h1>
            <p style="color:#374151;font-size:15px;line-height:1.7;margin-bottom:20px;">
              Hemos enviado tu solicitud de factura a <strong>${proveedorNombre}</strong> para el pedido <strong>${pedidoCodigo}</strong>.
            </p>
            <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:20px;margin-bottom:20px;">
              <p style="margin:0 0 8px;font-size:14px;"><strong>Pedido:</strong> ${pedidoCodigo}</p>
              <p style="margin:0 0 8px;font-size:14px;"><strong>Proveedor:</strong> ${proveedorNombre}</p>
              <p style="margin:0;font-size:14px;"><strong>Total:</strong> ${Number(pedidoTotal).toFixed(2)} €</p>
            </div>
            <p style="color:#6b7280;font-size:13px;">Una vez el proveedor suba la factura, aparecerá disponible para descargar en tu panel de pedidos.</p>
            <hr style="margin:24px 0;border:none;border-top:1px solid #e5e7eb;" />
            <p style="color:#9ca3af;font-size:12px;text-align:center;margin:0;">Recambio Directo — Marketplace B2B de recambios de automoción</p>
          </div>
        </div>
      `,
    });

    // ── 3. NOTIFICACIÓN EN CAMPANITA DEL PROVEEDOR ──
    // Buscar o crear conversación vinculada al pedido
    if (pedidoId) {
      try {
        // Obtener el user_id del cliente por email
        const { data: clienteUser } = await supabase
          .from("usuarios")
          .select("id")
          .eq("email", clienteEmail)
          .single();

        // Obtener el user_id del proveedor por email
        const { data: proveedorUser } = await supabase
          .from("usuarios")
          .select("id")
          .eq("email", emailProveedor)
          .single();

        if (clienteUser?.id && proveedorUser?.id) {
          // Buscar conversación existente para este pedido
          let convId: number | null = null;
          const { data: convExistente } = await supabase
            .from("conversaciones")
            .select("id")
            .eq("pedido_id", pedidoId)
            .maybeSingle();

          if (convExistente?.id) {
            convId = convExistente.id;
          } else {
            // Crear conversación nueva vinculada al pedido
            const { data: nuevaConv } = await supabase
              .from("conversaciones")
              .insert({
                user1_id: clienteUser.id,
                user2_id: proveedorUser.id,
                pedido_id: pedidoId,
                referencia: `Pedido ${pedidoCodigo}`,
                ultimo_mensaje: "",
                updated_at: new Date().toISOString(),
              })
              .select("id")
              .single();
            if (nuevaConv?.id) convId = nuevaConv.id;
          }

          if (convId) {
            const textoNotif = `🧾 ${clienteNombre} solicita factura del pedido ${pedidoCodigo}`;
            // Insertar mensaje en la conversación — esto dispara el realtime del proveedor
            await supabase.from("mensajes").insert({
              conversacion_id: convId,
              user_id: clienteUser.id,
              mensaje: textoNotif,
              emisor: "sistema",
              leido: false,
            });
            // Actualizar último mensaje de la conversación
            await supabase.from("conversaciones")
              .update({ ultimo_mensaje: textoNotif, updated_at: new Date().toISOString() })
              .eq("id", convId);
          }
        }
      } catch (notifError) {
        // No bloqueamos la respuesta si falla la notificación
        console.error("Error creando notificación campanita:", notifError);
      }
    }

    return Response.json({ ok: true });
  } catch (error) {
    console.error("Error enviando solicitud factura:", error);
    return Response.json({ error: String(error) }, { status: 500 });
  }
}