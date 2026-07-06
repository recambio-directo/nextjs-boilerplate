// app/api/send-rd-pago-solicitud/route.ts
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const { tallerNombre, tallerEmail, tallerCif, tallerTelefono, tallerIban, pedidosTotales, facturacionTotal, diasActivo } = await request.json();

    // Email a Vicente
    await resend.emails.send({
      from: "Recambio Directo <info@recambio-directo.com>",
      to: "info@recambio-directo.com",
      subject: `💳 Nueva solicitud RD Pago — ${tallerNombre}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#f8fafc;padding:24px">
          <div style="background:#0b1736;padding:24px;border-radius:12px 12px 0 0;text-align:center">
            <h1 style="color:white;margin:0;font-size:24px">RECAMBIO DIRECTO</h1>
            <p style="color:#94a3b8;margin:6px 0 0;font-size:13px">Nueva solicitud RD Pago</p>
          </div>
          <div style="background:white;padding:28px;border-radius:0 0 12px 12px;border:1px solid #e2e8f0;border-top:none">
            <div style="background:#dcfce7;border-left:4px solid #16a34a;padding:14px 18px;border-radius:0 8px 8px 0;margin-bottom:24px">
              <p style="color:#15803d;font-weight:700;margin:0">💳 Solicitud de RD Pago recibida</p>
            </div>
            <table style="width:100%;font-size:14px;color:#374151">
              <tr><td style="padding:6px 0;color:#64748b;width:160px">Empresa:</td><td><strong>${tallerNombre}</strong></td></tr>
              <tr><td style="padding:6px 0;color:#64748b">Email:</td><td>${tallerEmail}</td></tr>
              <tr><td style="padding:6px 0;color:#64748b">CIF:</td><td>${tallerCif || "No indicado"}</td></tr>
              <tr><td style="padding:6px 0;color:#64748b">Teléfono:</td><td>${tallerTelefono || "No indicado"}</td></tr>
              <tr><td style="padding:6px 0;color:#64748b">IBAN:</td><td style="font-family:monospace">${tallerIban || "No indicado"}</td></tr>
              <tr><td style="padding:6px 0;color:#64748b">Días activo:</td><td>${diasActivo} días</td></tr>
              <tr><td style="padding:6px 0;color:#64748b">Pedidos totales:</td><td>${pedidosTotales}</td></tr>
              <tr><td style="padding:6px 0;color:#64748b">Facturación total:</td><td><strong style="color:#16a34a">${Number(facturacionTotal).toFixed(2)}€</strong></td></tr>
            </table>
            <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:10px;padding:14px;margin-top:20px">
              <p style="color:#1e40af;font-size:13px;margin:0">Verifica el CIF en AEAT y activa el crédito desde el panel admin cuando lo tengas listo.</p>
            </div>
          </div>
        </div>
      `,
    });

    // Email de confirmación al taller
    await resend.emails.send({
      from: "Recambio Directo <info@recambio-directo.com>",
      to: tallerEmail,
      subject: "✅ Solicitud RD Pago recibida — Recambio Directo",
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#f8fafc;padding:24px">
          <div style="background:#0b1736;padding:24px;border-radius:12px 12px 0 0;text-align:center">
            <h1 style="color:white;margin:0;font-size:24px">RECAMBIO DIRECTO</h1>
          </div>
          <div style="background:white;padding:28px;border-radius:0 0 12px 12px;border:1px solid #e2e8f0;border-top:none">
            <p style="font-size:15px;color:#374151">Hola <strong>${tallerNombre}</strong>,</p>
            <p style="color:#374151">Hemos recibido tu solicitud de <strong>RD Pago</strong>. Revisaremos tu cuenta y te notificaremos por email en las próximas 24-48 horas.</p>
            <div style="background:#f1f5f9;border-radius:10px;padding:16px;margin:20px 0">
              <p style="font-weight:700;color:#0b1736;margin:0 0 8px">¿Qué es RD Pago?</p>
              <p style="color:#374151;font-size:13px;margin:0">Un crédito exclusivo para clientes verificados. Compra ahora y paga en 15 días sin recargos. Límite inicial de hasta 200€, ampliable según historial.</p>
            </div>
            <p style="color:#64748b;font-size:13px">¿Tienes dudas? Escríbenos a <a href="mailto:info@recambio-directo.com" style="color:#2563eb">info@recambio-directo.com</a></p>
          </div>
        </div>
      `,
    });

    return Response.json({ ok: true });
  } catch (e: any) {
    console.error("Error send-rd-pago-solicitud:", e);
    return Response.json({ ok: false, error: e.message }, { status: 500 });
  }
}