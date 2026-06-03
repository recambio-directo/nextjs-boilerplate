import { Resend } from "resend";
import { renderToBuffer } from "@react-pdf/renderer";
import React from "react";
import { AlbaranPDF, EtiquetaEnvioPDF } from "../../lib/AlbaranPDF";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      proveedorEmail, proveedorNombre,
      productos, cliente, clienteEmail,
      telefono, cif, direccion, agencia,
      subtotal, iva, total, codigo, fecha, formaPago,
      pedidoId,
    } = body;

    const fechaFormateada = fecha
      ? new Date(fecha).toLocaleDateString("es-ES")
      : new Date().toLocaleDateString("es-ES");

    const props = {
      codigo, fecha: fecha || new Date().toISOString(),
      proveedorNombre: proveedorNombre || "Proveedor",
      proveedorEmail: proveedorEmail || "",
      cliente, clienteEmail, telefono, cif, direccion, agencia,
      formaPago: formaPago || "transferencia",
      productos: productos || [],
      subtotal: Number(subtotal),
      iva: Number(iva),
      total: Number(total),
    };

    // Generar PDF albarán para el cliente
    const albaranBuffer = await renderToBuffer(
      React.createElement(AlbaranPDF, props) as any
    );

    // Generar PDF etiqueta de envio para el proveedor
    const etiquetaBuffer = await renderToBuffer(
      React.createElement(EtiquetaEnvioPDF, props) as any
    );

    // Subir PDFs a Supabase Storage y guardar URLs en el pedido
    if (pedidoId) {
      try {
        const { createClient } = await import("@supabase/supabase-js");
        const supabaseAdmin = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        const albaranPath = `documentos/${codigo}/albaran-${codigo}.pdf`;
        const etiquetaPath = `documentos/${codigo}/etiqueta-envio-${codigo}.pdf`;

        const uploadAlbaran = await supabaseAdmin.storage
          .from("FACTURAS")
          .upload(albaranPath, albaranBuffer, { contentType: "application/pdf", upsert: true });
        
        const uploadPacking = await supabaseAdmin.storage
          .from("FACTURAS")
          .upload(etiquetaPath, etiquetaBuffer, { contentType: "application/pdf", upsert: true });

        if (uploadAlbaran.error) {
          console.error("Error subiendo albaran:", uploadAlbaran.error);
        }
        if (uploadPacking.error) {
          console.error("Error subiendo packing:", uploadPacking.error);
        }

        if (!uploadAlbaran.error && !uploadPacking.error) {
          const { data: albaranUrl } = supabaseAdmin.storage.from("FACTURAS").getPublicUrl(albaranPath);
          const { data: etiquetaUrl } = supabaseAdmin.storage.from("FACTURAS").getPublicUrl(etiquetaPath);

          const { error: updateError } = await supabaseAdmin.from("pedidos").update({
            albaran_url: albaranUrl.publicUrl,
            etiqueta_envio_url: etiquetaUrl.publicUrl,
          }).eq("id", pedidoId);

          if (updateError) {
            console.error("Error guardando URLs en pedido:", updateError);
          } else {
            console.log("PDFs guardados correctamente para pedido", pedidoId);
          }
        }
      } catch (storageErr) {
        console.error("Error en storage PDFs:", storageErr);
      }
    } else {
      console.warn("No se recibio pedidoId — PDFs no guardados en BD");
    }

    const productosHtml = (productos || []).map((p: any) =>
      `<tr>
        <td style="padding:8px 12px;border-bottom:1px solid #f3f4f6;font-weight:700;color:#0b1736;">${p.referencia}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #f3f4f6;color:#374151;">${p.descripcion || "-"}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #f3f4f6;text-align:center;">1</td>
        <td style="padding:8px 12px;border-bottom:1px solid #f3f4f6;text-align:right;font-weight:700;">${Number(p.precio).toFixed(2)} EUR</td>
      </tr>`
    ).join("");

    // ===== EMAIL AL PROVEEDOR con Etiqueta de envio =====
    if (proveedorEmail) {
      await resend.emails.send({
        from: "Recambio Directo <noreply@recambio-directo.com>",
        to: [proveedorEmail],
        subject: `📦 Nuevo pedido — ${codigo}`,
        attachments: [
          { filename: `etiqueta-envio-${codigo}.pdf`, content: etiquetaBuffer },
        ],
        html: `
          <div style="font-family:Arial;padding:30px;background:#f3f4f6;">
            <div style="background:white;padding:32px;border-radius:12px;max-width:600px;margin:auto;">
              <h1 style="color:#dc2626;margin-bottom:8px;font-size:24px;">📦 Nuevo pedido recibido</h1>
              <p style="color:#374151;font-size:15px;line-height:1.6;margin-bottom:20px;">
                Hola <strong>${proveedorNombre}</strong>, has recibido un nuevo pedido en Recambio Directo.
                Encontraras el <strong>etiqueta de envio</strong> adjunto con todas las referencias a preparar.
              </p>
              <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:20px;margin-bottom:20px;">
                <p style="margin:0 0 8px;font-size:14px;"><strong>Pedido:</strong> ${codigo}</p>
                <p style="margin:0 0 8px;font-size:14px;"><strong>Fecha:</strong> ${fechaFormateada}</p>
                <p style="margin:0 0 8px;font-size:14px;"><strong>Cliente:</strong> ${cliente}</p>
                <p style="margin:0 0 8px;font-size:14px;"><strong>Transporte:</strong> ${agencia}</p>
                <p style="margin:0;font-size:14px;"><strong>Total:</strong> ${Number(total).toFixed(2)} EUR</p>
              </div>
              <table style="width:100%;border-collapse:collapse;margin-bottom:20px;font-size:13px;">
                <thead>
                  <tr style="background:#1e293b;color:white;">
                    <th style="padding:10px 12px;text-align:left;">Referencia</th>
                    <th style="padding:10px 12px;text-align:left;">Descripcion</th>
                    <th style="padding:10px 12px;text-align:center;">Cant.</th>
                    <th style="padding:10px 12px;text-align:right;">Precio</th>
                  </tr>
                </thead>
                <tbody>${productosHtml}</tbody>
              </table>
              <div style="background:#fef3c7;border-left:4px solid #f59e0b;padding:14px 18px;margin-bottom:20px;">
                <p style="margin:0;color:#92400e;font-size:13px;">
                  Prepara el material del etiqueta de envio adjunto. La etiqueta de transporte <strong>${agencia}</strong> llegara en breve.
                </p>
              </div>
              <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:14px 18px;">
                <p style="margin:0;color:#166534;font-size:13px;">
                  Recambio Directo gestionara el cobro y te transferira el importe a los 7 dias de la entrega confirmada.
                </p>
              </div>
              <hr style="margin:24px 0;border:none;border-top:1px solid #e5e7eb;" />
              <p style="color:#9ca3af;font-size:12px;text-align:center;margin:0;">Recambio Directo — Marketplace B2B de recambios de automociOn</p>
            </div>
          </div>`,
      });
    }

    // ===== EMAIL AL CLIENTE con Albarán =====
    if (clienteEmail) {
      await resend.emails.send({
        from: "Recambio Directo <noreply@recambio-directo.com>",
        to: [clienteEmail],
        subject: `Pedido confirmado — ${codigo}`,
        attachments: [
          { filename: `albaran-${codigo}.pdf`, content: albaranBuffer },
        ],
        html: `
          <div style="font-family:Arial;padding:30px;background:#f3f4f6;">
            <div style="background:white;padding:32px;border-radius:12px;max-width:600px;margin:auto;">
              <h1 style="color:#0b1736;margin-bottom:8px;font-size:24px;">Pedido confirmado</h1>
              <p style="color:#374151;font-size:15px;line-height:1.6;margin-bottom:20px;">
                Hola <strong>${cliente}</strong>, tu pedido ha sido confirmado.
                Encontraras el <strong>albaran</strong> adjunto en PDF.
              </p>
              <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:20px;margin-bottom:20px;">
                <p style="margin:0 0 8px;font-size:14px;"><strong>Codigo:</strong> ${codigo}</p>
                <p style="margin:0 0 8px;font-size:14px;"><strong>Fecha:</strong> ${fechaFormateada}</p>
                <p style="margin:0 0 8px;font-size:14px;"><strong>Proveedor:</strong> ${proveedorNombre}</p>
                <p style="margin:0 0 8px;font-size:14px;"><strong>Transporte:</strong> ${agencia}</p>
                <p style="margin:0;font-size:14px;"><strong>Total:</strong> ${Number(total).toFixed(2)} EUR</p>
              </div>
              <div style="background:#eff6ff;border-left:4px solid #3b82f6;padding:14px 18px;margin-bottom:24px;">
                <p style="margin:0;color:#1e40af;font-size:13px;">
                  El proveedor esta preparando tu pedido. Recibiras una notificacion cuando sea enviado con el numero de seguimiento.
                </p>
              </div>
              <div style="text-align:center;margin:28px 0;">
                <a href="https://recambio-directo.com/dashboard/pedidos"
                  style="background:linear-gradient(135deg,#2563eb,#1d4ed8);color:white;padding:14px 32px;border-radius:10px;text-decoration:none;font-weight:700;font-size:15px;">
                  Ver mis pedidos
                </a>
              </div>
              <hr style="margin:24px 0;border:none;border-top:1px solid #e5e7eb;" />
              <p style="color:#9ca3af;font-size:12px;text-align:center;margin:0;">Recambio Directo — Marketplace B2B de recambios de automociOn</p>
            </div>
          </div>`,
      });
    }

    return Response.json({ ok: true });

  } catch (error) {
    console.error("Error enviando emails:", error);
    return Response.json({ error: String(error) }, { status: 500 });
  }
}