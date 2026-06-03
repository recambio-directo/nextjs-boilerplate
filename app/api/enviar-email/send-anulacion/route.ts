import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      pedidoCodigo, pedidoId, pedidoTotal, pedidoFecha,
      anuladorTipo, anuladorNombre,
      clienteEmail, clienteNombre,
      proveedorEmail, proveedorNombre,
      productos, motivoAnulacion,
    } = body;

    const fechaFormateada = pedidoFecha
      ? new Date(pedidoFecha).toLocaleDateString("es-ES")
      : new Date().toLocaleDateString("es-ES");

    const productosHtml = (productos || []).map((p: any) =>
      `<li style="font-size:14px;margin-bottom:4px;">${p.descripcion || p.referencia} — <strong>${Number(p.precio).toFixed(2)}€</strong></li>`
    ).join("");

    const motivoHtml = motivoAnulacion ? `
      <div style="background:#fef2f2;border-left:4px solid #dc2626;padding:14px 18px;margin-bottom:20px;">
        <p style="margin:0 0 6px;font-size:13px;font-weight:700;color:#991b1b;">MOTIVO DE ANULACIÓN</p>
        <p style="margin:0;color:#374151;font-size:14px;">${motivoAnulacion}</p>
      </div>` : "";

    // EMAIL AL PROVEEDOR
    if (proveedorEmail) {
      await resend.emails.send({
        from: "Recambio Directo <noreply@recambio-directo.com>",
        to: [proveedorEmail],
        subject: `❌ Pedido anulado — ${pedidoCodigo}`,
        html: `
          <div style="font-family:Arial;padding:30px;background:#f3f4f6;">
            <div style="background:white;padding:32px;border-radius:12px;max-width:600px;margin:auto;">
              <h1 style="color:#dc2626;margin-bottom:8px;font-size:24px;">❌ Pedido anulado</h1>
              <p style="color:#6b7280;font-size:14px;margin-bottom:24px;">
                El pedido <strong>${pedidoCodigo}</strong> ha sido anulado por el <strong>${anuladorTipo === "taller" ? "taller" : "proveedor"}</strong>.
              </p>
              <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:20px;margin-bottom:20px;">
                <p style="margin:0 0 8px;font-size:14px;"><strong>Código:</strong> ${pedidoCodigo}</p>
                <p style="margin:0 0 8px;font-size:14px;"><strong>Fecha:</strong> ${fechaFormateada}</p>
                <p style="margin:0 0 8px;font-size:14px;"><strong>Cliente:</strong> ${clienteNombre}</p>
                <p style="margin:0;font-size:14px;"><strong>Total:</strong> ${Number(pedidoTotal).toFixed(2)} €</p>
              </div>
              ${motivoHtml}
              ${productosHtml ? `<div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:20px;margin-bottom:20px;">
                <p style="margin:0 0 12px;font-size:14px;font-weight:700;color:#111827;">Productos del pedido:</p>
                <ul style="margin:0;padding-left:20px;">${productosHtml}</ul>
              </div>` : ""}
              <div style="background:#fef3c7;border-left:4px solid #f59e0b;padding:14px 18px;margin-bottom:20px;">
                <p style="margin:0;color:#92400e;font-size:13px;">
                  ⚠️ <strong>No prepares este pedido.</strong> Ha sido anulado y no debe ser enviado.
                </p>
              </div>
              <hr style="margin:24px 0;border:none;border-top:1px solid #e5e7eb;" />
              <p style="color:#9ca3af;font-size:12px;text-align:center;margin:0;">Recambio Directo — Marketplace B2B de recambios de automoción</p>
            </div>
          </div>`,
      });
    }

    // EMAIL AL CLIENTE
    if (clienteEmail) {
      await resend.emails.send({
        from: "Recambio Directo <noreply@recambio-directo.com>",
        to: [clienteEmail],
        subject: `❌ Pedido anulado — ${pedidoCodigo}`,
        html: `
          <div style="font-family:Arial;padding:30px;background:#f3f4f6;">
            <div style="background:white;padding:32px;border-radius:12px;max-width:600px;margin:auto;">
              <h1 style="color:#dc2626;margin-bottom:8px;font-size:24px;">❌ Pedido anulado</h1>
              <p style="color:#374151;font-size:15px;line-height:1.7;margin-bottom:20px;">
                El pedido <strong>${pedidoCodigo}</strong> ha sido anulado por el <strong>${anuladorTipo === "proveedor" ? "proveedor" : "taller"}</strong>.
              </p>
              <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:20px;margin-bottom:20px;">
                <p style="margin:0 0 8px;font-size:14px;"><strong>Código:</strong> ${pedidoCodigo}</p>
                <p style="margin:0 0 8px;font-size:14px;"><strong>Fecha:</strong> ${fechaFormateada}</p>
                <p style="margin:0 0 8px;font-size:14px;"><strong>Proveedor:</strong> ${proveedorNombre}</p>
                <p style="margin:0;font-size:14px;"><strong>Total:</strong> ${Number(pedidoTotal).toFixed(2)} €</p>
              </div>
              ${motivoHtml}
              ${productosHtml ? `<div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:20px;margin-bottom:20px;">
                <p style="margin:0 0 12px;font-size:14px;font-weight:700;color:#111827;">Productos anulados:</p>
                <ul style="margin:0;padding-left:20px;">${productosHtml}</ul>
              </div>` : ""}
              <div style="background:#eff6ff;border-left:4px solid #3b82f6;padding:14px 18px;margin-bottom:24px;">
                <p style="margin:0;color:#1e40af;font-size:13px;">
                  ℹ️ Si tienes dudas contacta con el proveedor por el chat de la plataforma o escríbenos a
                  <a href="mailto:info@recambio-directo.com" style="color:#2563eb;">info@recambio-directo.com</a>
                </p>
              </div>
              <div style="text-align:center;margin:28px 0;">
                <a href="https://recambio-directo.com/dashboard/pedidos"
                  style="background:linear-gradient(135deg,#2563eb,#1d4ed8);color:white;padding:14px 32px;border-radius:10px;text-decoration:none;font-weight:700;font-size:15px;">
                  Ver mis pedidos →
                </a>
              </div>
              <hr style="margin:24px 0;border:none;border-top:1px solid #e5e7eb;" />
              <p style="color:#9ca3af;font-size:12px;text-align:center;margin:0;">Recambio Directo · Marketplace B2B de recambios de automoción · España</p>
            </div>
          </div>`,
      });
    }

    return Response.json({ ok: true });
  } catch (error) {
    console.error("Error enviando email anulación:", error);
    return Response.json({ error: String(error) }, { status: 500 });
  }
}