// app/api/send-nuevo-pedido-admin/route.ts
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const ADMIN_EMAIL = "info@recambio-directo.com";

export async function POST(request: Request) {
  try {
    const { pedidoCodigo, pedidoId, pedidoTotal, pedidoFecha, clienteNombre, clienteEmail, proveedorNombre, productos, agencia, formaPago } = await request.json();

    const fechaFormateada = pedidoFecha
      ? new Date(pedidoFecha).toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })
      : new Date().toLocaleDateString("es-ES");

    await resend.emails.send({
      from: "Recambio Directo <info@recambio-directo.com>",
      to: ADMIN_EMAIL,
      subject: `📦 Nuevo pedido ${pedidoCodigo} — ${Number(pedidoTotal).toFixed(2)}€`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#f8fafc;padding:24px">
          <div style="background:#0b1736;padding:24px;border-radius:12px 12px 0 0;text-align:center">
            <h1 style="color:white;margin:0;font-size:24px">RECAMBIO DIRECTO</h1>
            <p style="color:#94a3b8;margin:6px 0 0;font-size:13px">Panel Administración — Nuevo pedido</p>
          </div>
          <div style="background:white;padding:28px;border-radius:0 0 12px 12px;border:1px solid #e2e8f0;border-top:none">
            <div style="background:#dcfce7;border-left:4px solid #16a34a;padding:14px 18px;border-radius:0 8px 8px 0;margin-bottom:24px">
              <p style="color:#15803d;font-weight:700;margin:0;font-size:18px">📦 ${pedidoCodigo} — ${Number(pedidoTotal).toFixed(2)}€</p>
              <p style="color:#166534;margin:4px 0 0;font-size:13px">${fechaFormateada}</p>
            </div>
            <table style="width:100%;font-size:14px;color:#374151;margin-bottom:20px">
              <tr><td style="padding:6px 0;color:#64748b;width:140px">Cliente:</td><td><strong>${clienteNombre || "-"}</strong></td></tr>
              <tr><td style="padding:6px 0;color:#64748b">Email:</td><td>${clienteEmail || "-"}</td></tr>
              <tr><td style="padding:6px 0;color:#64748b">Proveedor:</td><td><strong>${proveedorNombre || "-"}</strong></td></tr>
              <tr><td style="padding:6px 0;color:#64748b">Agencia:</td><td><strong>${(agencia || "-").toUpperCase()}</strong></td></tr>
              <tr><td style="padding:6px 0;color:#64748b">Forma de pago:</td><td>${formaPago === "rd_pago" ? "🔵 RD Pago" : "💳 Tarjeta"}</td></tr>
              <tr><td style="padding:6px 0;color:#64748b">Total:</td><td><strong style="color:#16a34a;font-size:16px">${Number(pedidoTotal).toFixed(2)}€</strong></td></tr>
            </table>
            ${productos?.length > 0 ? `
            <div style="background:#f8fafc;border-radius:10px;padding:16px;margin-bottom:20px">
              <p style="font-weight:700;color:#0b1736;margin:0 0 10px;font-size:13px">📦 REFERENCIAS</p>
              ${productos.map((p: any) => `
                <div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #e2e8f0;font-size:13px">
                  <span><strong>${p.referencia}</strong> — ${p.descripcion || ""}</span>
                  <span style="color:#16a34a;font-weight:700">${Number(p.precio || 0).toFixed(2)}€</span>
                </div>
              `).join("")}
            </div>
            ` : ""}
            <a href="https://www.recambio-directo.com/dashboard/admin" style="display:block;text-align:center;background:#0b1736;color:white;padding:14px;border-radius:10px;text-decoration:none;font-weight:700;font-size:15px">Ver en el panel admin →</a>
          </div>
        </div>
      `,
    });

    return Response.json({ ok: true });
  } catch (e: any) {
    console.error("Error send-nuevo-pedido-admin:", e);
    return Response.json({ ok: false, error: e.message }, { status: 500 });
  }
}