// app/api/send-factura-subida/route.ts
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const {
      pedidoCodigo, pedidoId, pedidoTotal, pedidoFecha,
      clienteEmail, clienteNombre, proveedorNombre,
      facturaUrl, facturaNombre, productos,
    } = await request.json();

    const fechaFormateada = pedidoFecha
      ? new Date(pedidoFecha).toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric" })
      : new Date().toLocaleDateString("es-ES");

    // Descargar el PDF de factura para adjuntarlo
    let facturaBase64: string | null = null;
    try {
      const res = await fetch(facturaUrl);
      const buffer = await res.arrayBuffer();
      facturaBase64 = Buffer.from(buffer).toString("base64");
    } catch (e) {
      console.error("Error descargando factura para adjuntar:", e);
    }

    await resend.emails.send({
      from: "Recambio Directo <info@recambio-directo.com>",
      to: clienteEmail,
      subject: `🧾 Factura disponible — Pedido ${pedidoCodigo}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#f8fafc;padding:24px">
          <div style="background:#0b1736;padding:24px;border-radius:12px 12px 0 0;text-align:center">
            <h1 style="color:white;margin:0;font-size:24px;letter-spacing:1px">RECAMBIO DIRECTO</h1>
            <p style="color:#94a3b8;margin:6px 0 0;font-size:13px">Marketplace B2B de Recambios de Automocion</p>
          </div>
          <div style="background:white;padding:28px;border-radius:0 0 12px 12px;border:1px solid #e2e8f0;border-top:none">
            <div style="background:#dcfce7;border-left:4px solid #16a34a;padding:14px 18px;border-radius:0 8px 8px 0;margin-bottom:24px">
              <p style="color:#15803d;font-weight:700;margin:0;font-size:15px">🧾 Tu factura está disponible — ${pedidoCodigo}</p>
            </div>
            <p style="color:#374151;font-size:15px">Hola <strong>${clienteNombre}</strong>,</p>
            <p style="color:#374151">El proveedor <strong>${proveedorNombre}</strong> ha subido la factura del pedido <strong>${pedidoCodigo}</strong>. La encontrarás adjunta a este email.</p>
            <div style="background:#f1f5f9;border-radius:10px;padding:18px;margin:20px 0">
              <p style="font-weight:700;color:#0b1736;margin:0 0 12px;font-size:14px">📋 RESUMEN DEL PEDIDO</p>
              <table style="width:100%;font-size:13px;color:#374151">
                <tr><td style="padding:4px 0;color:#64748b;width:140px">Código pedido:</td><td><strong style="color:#2563eb">${pedidoCodigo}</strong></td></tr>
                <tr><td style="padding:4px 0;color:#64748b">Fecha:</td><td>${fechaFormateada}</td></tr>
                <tr><td style="padding:4px 0;color:#64748b">Proveedor:</td><td><strong>${proveedorNombre}</strong></td></tr>
                <tr><td style="padding:4px 0;color:#64748b">Total:</td><td><strong style="color:#16a34a">${Number(pedidoTotal).toFixed(2)}€</strong></td></tr>
              </table>
            </div>
            ${productos?.length > 0 ? `
            <div style="background:#f8fafc;border-radius:10px;padding:16px;margin:20px 0">
              <p style="font-weight:700;color:#0b1736;margin:0 0 10px;font-size:13px">📦 REFERENCIAS</p>
              ${productos.map((p: any) => `
                <div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #e2e8f0;font-size:13px">
                  <span><strong style="color:#0b1736">${p.referencia}</strong> — ${p.descripcion || ""}</span>
                  <span style="color:#16a34a;font-weight:700">${Number(p.precio || 0).toFixed(2)}€</span>
                </div>
              `).join("")}
            </div>
            ` : ""}
            <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:10px;padding:14px 16px;margin:16px 0">
              <p style="color:#1e40af;font-size:13px;margin:0">
                📎 La factura también está disponible en tu 
                <a href="https://www.recambio-directo.com/dashboard/pedidos" style="color:#2563eb;font-weight:700"> panel de pedidos</a>.
              </p>
            </div>
            <p style="color:#64748b;font-size:12px;margin-top:24px">
              ¿Tienes alguna duda? Escríbenos a <a href="mailto:info@recambio-directo.com" style="color:#2563eb">info@recambio-directo.com</a>
            </p>
          </div>
          <p style="text-align:center;color:#94a3b8;font-size:11px;margin-top:16px">Recambio Directo — info@recambio-directo.com — www.recambio-directo.com</p>
        </div>
      `,
      attachments: facturaBase64
        ? [{ filename: facturaNombre || `factura-${pedidoCodigo}.pdf`, content: facturaBase64 }]
        : [],
    });

    return Response.json({ ok: true });
  } catch (e: any) {
    console.error("Error send-factura-subida:", e);
    return Response.json({ ok: false, error: e.message }, { status: 500 });
  }
}