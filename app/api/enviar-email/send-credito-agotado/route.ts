import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const { clienteEmail, clienteNombre } = await request.json();

    // Email al cliente
    if (clienteEmail) {
      await resend.emails.send({
        from: "Recambio Directo <noreply@recambio-directo.com>",
        to: [clienteEmail],
        subject: "Tu credito RD Pago se ha agotado",
        html: `
          <div style="font-family:Arial;padding:30px;background:#f3f4f6;">
            <div style="background:white;padding:32px;border-radius:12px;max-width:600px;margin:auto;">
              <h1 style="color:#dc2626;font-size:24px;margin-bottom:8px;">Saldo RD Pago agotado</h1>
              <p style="color:#374151;font-size:15px;line-height:1.7;margin-bottom:20px;">
                Hola <strong>${clienteNombre}</strong>, tu credito RD Pago se ha agotado tras tu ultimo pedido.
              </p>
              <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:20px;margin-bottom:24px;">
                <p style="margin:0;font-size:14px;color:#991b1b;font-weight:700;">Saldo actual: 0,00 EUR</p>
                <p style="margin:8px 0 0;font-size:13px;color:#374151;">Para seguir usando RD Pago necesitas recargar tu credito.</p>
              </div>
              <div style="background:#eff6ff;border-left:4px solid #3b82f6;padding:14px 18px;margin-bottom:24px;">
                <p style="margin:0;color:#1e40af;font-size:14px;">
                  Contacta con nosotros para ampliar tu linea de credito:<br/>
                  <a href="mailto:info@recambio-directo.com" style="color:#2563eb;font-weight:700;">info@recambio-directo.com</a>
                  &nbsp;o llamanos al <strong>900 000 000</strong>
                </p>
              </div>
              <p style="color:#374151;font-size:14px;margin-bottom:20px;">
                Mientras tanto puedes seguir realizando pedidos con <strong>tarjeta bancaria</strong> o <strong>transferencia</strong>.
              </p>
              <div style="text-align:center;margin:28px 0;">
                <a href="https://recambio-directo.com/dashboard"
                  style="background:linear-gradient(135deg,#2563eb,#1d4ed8);color:white;padding:14px 32px;border-radius:10px;text-decoration:none;font-weight:700;font-size:15px;">
                  Ir al marketplace
                </a>
              </div>
              <hr style="margin:24px 0;border:none;border-top:1px solid #e5e7eb;" />
              <p style="color:#9ca3af;font-size:12px;text-align:center;margin:0;">
                Recambio Directo - Marketplace B2B de recambios de automocion
              </p>
            </div>
          </div>
        `,
      });
    }

    // Email al admin para que sepa que un cliente se ha quedado sin credito
    await resend.emails.send({
      from: "Recambio Directo <noreply@recambio-directo.com>",
      to: ["vicente@rgranvia.es"],
      subject: "Cliente sin credito RD Pago: " + clienteNombre,
      html: `
        <div style="font-family:Arial;padding:30px;background:#f3f4f6;">
          <div style="background:white;padding:32px;border-radius:12px;max-width:600px;margin:auto;">
            <h1 style="color:#f59e0b;font-size:22px;margin-bottom:16px;">Aviso: Cliente sin credito</h1>
            <p style="font-size:15px;color:#374151;">El cliente <strong>${clienteNombre}</strong> (${clienteEmail}) ha agotado su credito RD Pago.</p>
            <p style="font-size:14px;color:#6b7280;margin-top:12px;">Puedes recargar su credito desde el panel admin en la seccion Financiero.</p>
            <div style="text-align:center;margin:24px 0;">
              <a href="https://recambio-directo.com/admin"
                style="background:linear-gradient(135deg,#dc2626,#991b1b);color:white;padding:12px 28px;border-radius:10px;text-decoration:none;font-weight:700;">
                Ir al panel admin
              </a>
            </div>
          </div>
        </div>
      `,
    });

    return Response.json({ ok: true });
  } catch (error) {
    console.error("Error email credito agotado:", error);
    return Response.json({ error: String(error) }, { status: 500 });
  }
}