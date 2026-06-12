// app/api/send-solicitud-factura/route.ts
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
      proveedorNombre, emailProveedor, productos, emailFacturasCliente,
    } = body;

    const fechaFormateada = pedidoFecha
      ? new Date(pedidoFecha).toLocaleDateString("es-ES")
      : new Date().toLocaleDateString("es-ES");

    // Tabla de productos con referencia y descripción
    const productosHtml = (productos || []).map((p: any) =>
      `<tr>
        <td style="padding:8px 12px;font-size:13px;font-weight:700;color:#0b1736;border-bottom:1px solid #f3f4f6;">${p.referencia || "-"}</td>
        <td style="padding:8px 12px;font-size:13px;color:#374151;border-bottom:1px solid #f3f4f6;">${p.descripcion || p.producto || "-"}</td>
        <td style="padding:8px 12px;font-size:13px;font-weight:700;color:#16a34a;border-bottom:1px solid #f3f4f6;text-align:right;">${Number(p.precio).toFixed(2)}€</td>
      </tr>`
    ).join("");

    const productosTabla = productosHtml ? `
      <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;margin-bottom:20px;">
        <p style="margin:0;padding:10px 12px;font-size:13px;font-weight:700;color:#111827;border-bottom:1px solid #e5e7eb;">Piezas del pedido</p>
        <table style="width:100%;border-collapse:collapse;">
          <thead>
            <tr style="background:#f3f4f6;">
              <th style="padding:8px 12px;font-size:12px;color:#6b7280;text-align:left;font-weight:700;">REFERENCIA</th>
              <th style="padding:8px 12px;font-size:12px;color:#6b7280;text-align:left;font-weight:700;">DESCRIPCIÓN</th>
              <th style="padding:8px 12px;font-size:12px;color:#6b7280;text-align:right;font-weight:700;">PRECIO</th>
            </tr>
          </thead>
          <tbody>${productosHtml}</tbody>
        </table>
      </div>` : "";

    // ── 1. EMAIL AL PROVEEDOR ──
    await resend.emails.send({
      from: "Recambio Directo <info@recambio-directo.com>",
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
            ${productosTabla}
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
                ⚠️ <strong>Acción requerida:</strong> Puedes subir la factura PDF en el panel de pedidos para que el cliente la descargue desde la plataforma, o bien enviársela directamente por email a:
              </p>
              <p style="margin:8px 0 0;color:#92400e;font-size:14px;font-weight:700;">
                📧 <a href="mailto:${emailFacturasCliente || clienteEmail}" style="color:#92400e;">${emailFacturasCliente || clienteEmail}</a>
                ${emailFacturasCliente && emailFacturasCliente !== clienteEmail ? `<span style="font-size:11px;font-weight:400;"> (email de facturación)</span>` : ""}
              </p>
            </div>
            <div style="text-align:center;margin:20px 0;">
              <a href="https://www.recambio-directo.com/dashboard/proveedor"
                style="background:linear-gradient(135deg,#2563eb,#1d4ed8);color:white;padding:14px 32px;border-radius:10px;text-decoration:none;font-weight:700;font-size:15px;">
                Ir al panel de pedidos →
              </a>
            </div>
            <hr style="margin:24px 0;border:none;border-top:1px solid #e5e7eb;" />
            <p style="color:#9ca3af;font-size:12px;text-align:center;margin:0;">Recambio Directo — Marketplace B2B de recambios de automoción</p>
          </div>
        </div>
      `,
    });

    // ── 2. EMAIL DE CONFIRMACIÓN AL CLIENTE ──
    await resend.emails.send({
      from: "Recambio Directo <info@recambio-directo.com>",
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
            ${productosTabla}
            <p style="color:#6b7280;font-size:13px;">El proveedor puede subir la factura a la plataforma o enviártela directamente por email.</p>
            <hr style="margin:24px 0;border:none;border-top:1px solid #e5e7eb;" />
            <p style="color:#9ca3af;font-size:12px;text-align:center;margin:0;">Recambio Directo — Marketplace B2B de recambios de automoción</p>
          </div>
        </div>
      `,
    });

    // ── 3. NOTIFICACIÓN CAMPANITA AL PROVEEDOR ──
    if (pedidoId) {
      try {
        const { data: clienteUser } = await supabase.from("usuarios").select("id").eq("email", clienteEmail).single();
        const { data: proveedorUser } = await supabase.from("usuarios").select("id").eq("email", emailProveedor).single();
        if (clienteUser?.id && proveedorUser?.id) {
          let convId: number | null = null;
          const { data: convExistente } = await supabase.from("conversaciones").select("id").eq("pedido_id", pedidoId).maybeSingle();
          if (convExistente?.id) {
            convId = convExistente.id;
          } else {
            const { data: nuevaConv } = await supabase.from("conversaciones").insert({
              user1_id: clienteUser.id, user2_id: proveedorUser.id, pedido_id: pedidoId,
              referencia: `Pedido ${pedidoCodigo}`, ultimo_mensaje: "", updated_at: new Date().toISOString(),
            }).select("id").single();
            if (nuevaConv?.id) convId = nuevaConv.id;
          }
          if (convId) {
            const textoNotif = `🧾 ${clienteNombre} solicita factura del pedido ${pedidoCodigo}`;
            await supabase.from("mensajes").insert({ conversacion_id: convId, user_id: clienteUser.id, mensaje: textoNotif, emisor: "sistema", leido: false });
            await supabase.from("conversaciones").update({ ultimo_mensaje: textoNotif, updated_at: new Date().toISOString() }).eq("id", convId);
          }
        }
      } catch (notifError) { console.error("Error campanita:", notifError); }
    }

    return Response.json({ ok: true });
  } catch (error) {
    console.error("Error enviando solicitud factura:", error);
    return Response.json({ error: String(error) }, { status: 500 });
  }
}