// app/api/enviar-email/route.ts
// Nuevo flujo de emails al confirmar pedido:
// Mail 1 → Proveedor: albarán PDF adjunto
// Mail 2 → Cliente: albarán PDF adjunto
// Mail 3 → Proveedor: etiqueta PDF + dossier embalaje PDF

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
      proveedorEmail, proveedorNombre,
      productos, cliente, clienteEmail, telefono, cif, direccion,
      agencia, formaPago, subtotal, iva, total,
      codigo, fecha, pedidoId,
    } = body;

    // Obtener datos completos del proveedor y cliente desde Supabase
    let proveedorCif = "", proveedorTelefono = "", proveedorDireccion = "";
    let proveedorCiudad = "", proveedorCodigoPostal = "", proveedorProvincia = "";
    let clienteCiudad = "", clienteCodigoPostal = "", clienteProvincia = "";

    // Buscar proveedor por email
    const { data: provPerfil } = await supabase
      .from("usuarios")
      .select("cif, telefono, direccion, ciudad, codigo_postal, provincia")
      .eq("email", proveedorEmail)
      .maybeSingle();

    if (provPerfil) {
      proveedorCif = provPerfil.cif || "";
      proveedorTelefono = provPerfil.telefono || "";
      proveedorDireccion = provPerfil.direccion || "";
      proveedorCiudad = provPerfil.ciudad || "";
      proveedorCodigoPostal = provPerfil.codigo_postal || "";
      proveedorProvincia = provPerfil.provincia || "";
    }

    // Buscar cliente por email
    const { data: clientePerfil } = await supabase
      .from("usuarios")
      .select("ciudad, codigo_postal, provincia")
      .eq("email", clienteEmail)
      .maybeSingle();

    if (clientePerfil) {
      clienteCiudad = clientePerfil.ciudad || "";
      clienteCodigoPostal = clientePerfil.codigo_postal || "";
      clienteProvincia = clientePerfil.provincia || "";
    }

    // Obtener URLs de los PDFs guardados en Supabase Storage
    const { data: pedidoData } = await supabase
      .from("pedidos")
      .select("albaran_url, etiqueta_envio_url")
      .eq("id", pedidoId)
      .single();

    const albaranUrl = pedidoData?.albaran_url || null;
    const etiquetaUrl = pedidoData?.etiqueta_envio_url || null;

    // Descargar PDFs como base64 para adjuntar
    async function urlToBase64(url: string): Promise<string | null> {
      try {
        const res = await fetch(url);
        const buffer = await res.arrayBuffer();
        return Buffer.from(buffer).toString("base64");
      } catch { return null; }
    }

    const albaranBase64 = albaranUrl ? await urlToBase64(albaranUrl) : null;
    const etiquetaBase64 = etiquetaUrl ? await urlToBase64(etiquetaUrl) : null;

    const fechaFormateada = fecha
      ? new Date(fecha).toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric" })
      : new Date().toLocaleDateString("es-ES");

    const refsTexto = (productos || []).map((p: any) => `${p.referencia} — ${p.descripcion || ""}`).join("\n");
    const agenciaUpper = (agencia || "").toUpperCase();

    // ── MAIL 1: PROVEEDOR — Nuevo pedido + albarán ────────────────────────────
    const mailProveedor = await resend.emails.send({
      from: "Recambio Directo <info@recambio-directo.com>",
      to: proveedorEmail,
      subject: `📦 Nuevo pedido ${codigo} — Recambio Directo`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#f8fafc;padding:24px">
          <div style="background:#0b1736;padding:24px;border-radius:12px 12px 0 0;text-align:center">
            <h1 style="color:white;margin:0;font-size:24px;letter-spacing:1px">RECAMBIO DIRECTO</h1>
            <p style="color:#94a3b8;margin:6px 0 0;font-size:13px">Marketplace B2B de Recambios de Automocion</p>
          </div>
          <div style="background:white;padding:28px;border-radius:0 0 12px 12px;border:1px solid #e2e8f0;border-top:none">
            <div style="background:#dcfce7;border-left:4px solid #16a34a;padding:14px 18px;border-radius:0 8px 8px 0;margin-bottom:24px">
              <p style="color:#15803d;font-weight:700;margin:0;font-size:15px">✅ Nuevo pedido recibido — ${codigo}</p>
            </div>
            <p style="color:#374151;font-size:15px">Hola <strong>${proveedorNombre}</strong>,</p>
            <p style="color:#374151">Has recibido un nuevo pedido a través de Recambio Directo. Adjunto encontrarás el albarán con todos los detalles.</p>

            <div style="background:#f1f5f9;border-radius:10px;padding:18px;margin:20px 0">
              <p style="font-weight:700;color:#0b1736;margin:0 0 12px;font-size:14px">📋 RESUMEN DEL PEDIDO</p>
              <table style="width:100%;font-size:13px;color:#374151">
                <tr><td style="padding:4px 0;color:#64748b;width:140px">Código pedido:</td><td><strong style="color:#2563eb">${codigo}</strong></td></tr>
                <tr><td style="padding:4px 0;color:#64748b">Fecha:</td><td>${fechaFormateada}</td></tr>
                <tr><td style="padding:4px 0;color:#64748b">Comprador:</td><td><strong>${cliente}</strong></td></tr>
                <tr><td style="padding:4px 0;color:#64748b">Email comprador:</td><td>${clienteEmail}</td></tr>
                <tr><td style="padding:4px 0;color:#64748b">Teléfono:</td><td>${telefono || "-"}</td></tr>
                <tr><td style="padding:4px 0;color:#64748b">Dirección entrega:</td><td>${direccion}${clienteCiudad ? ", " + clienteCiudad : ""}${clienteCodigoPostal ? " " + clienteCodigoPostal : ""}${clienteProvincia ? ", " + clienteProvincia : ""}</td></tr>
                <tr><td style="padding:4px 0;color:#64748b">Agencia envío:</td><td><strong>${agenciaUpper}</strong></td></tr>
                <tr><td style="padding:4px 0;color:#64748b">Forma de pago:</td><td>${formaPago === "rd_pago" ? "RD Pago" : "Tarjeta bancaria"}</td></tr>
              </table>
            </div>

            <div style="background:#f8fafc;border-radius:10px;padding:16px;margin:20px 0">
              <p style="font-weight:700;color:#0b1736;margin:0 0 10px;font-size:13px">📦 REFERENCIAS</p>
              ${(productos || []).map((p: any) => `
                <div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #e2e8f0;font-size:13px">
                  <span><strong style="color:#0b1736">${p.referencia}</strong> — ${p.descripcion || ""}</span>
                  <span style="color:#16a34a;font-weight:700">${(Number(p.precio) + Number(p.impuesto || 0)).toFixed(2)}€</span>
                </div>
              `).join("")}
              <div style="text-align:right;margin-top:12px;font-size:14px">
                <strong style="color:#0b1736">TOTAL: ${Number(total).toFixed(2)}€ (IVA incl.)</strong>
              </div>
            </div>

            <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:10px;padding:16px;margin:20px 0">
              <p style="color:#1e40af;font-size:13px;margin:0">
                📧 Recibirás un segundo email con la <strong>etiqueta de envío</strong> y las <strong>instrucciones de embalaje</strong>.
                Por favor, prepara el pedido y espera la recogida de <strong>${agenciaUpper}</strong>.
              </p>
            </div>

            <p style="color:#64748b;font-size:12px;margin-top:24px">
              Gestiona este pedido desde tu panel: <a href="https://www.recambio-directo.com/dashboard/proveedor" style="color:#2563eb">Panel Proveedor</a>
            </p>
          </div>
          <p style="text-align:center;color:#94a3b8;font-size:11px;margin-top:16px">Recambio Directo — info@recambio-directo.com — www.recambio-directo.com</p>
        </div>
      `,
      attachments: albaranBase64 ? [{
        filename: `albaran-${codigo}.pdf`,
        content: albaranBase64,
      }] : [],
    });

    // ── MAIL 2: CLIENTE — Confirmación + albarán ──────────────────────────────
    const mailCliente = await resend.emails.send({
      from: "Recambio Directo <info@recambio-directo.com>",
      to: clienteEmail,
      subject: `✅ Tu pedido ${codigo} está confirmado — Recambio Directo`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#f8fafc;padding:24px">
          <div style="background:#0b1736;padding:24px;border-radius:12px 12px 0 0;text-align:center">
            <h1 style="color:white;margin:0;font-size:24px;letter-spacing:1px">RECAMBIO DIRECTO</h1>
            <p style="color:#94a3b8;margin:6px 0 0;font-size:13px">Marketplace B2B de Recambios de Automocion</p>
          </div>
          <div style="background:white;padding:28px;border-radius:0 0 12px 12px;border:1px solid #e2e8f0;border-top:none">
            <div style="background:#dcfce7;border-left:4px solid #16a34a;padding:14px 18px;border-radius:0 8px 8px 0;margin-bottom:24px">
              <p style="color:#15803d;font-weight:700;margin:0;font-size:15px">✅ Pedido confirmado — ${codigo}</p>
            </div>
            <p style="color:#374151;font-size:15px">Hola <strong>${cliente}</strong>,</p>
            <p style="color:#374151">Tu pedido ha sido confirmado y el proveedor ha sido notificado. Adjunto encontrarás el albarán del pedido.</p>

            <div style="background:#f1f5f9;border-radius:10px;padding:18px;margin:20px 0">
              <p style="font-weight:700;color:#0b1736;margin:0 0 12px;font-size:14px">📋 TU PEDIDO</p>
              <table style="width:100%;font-size:13px;color:#374151">
                <tr><td style="padding:4px 0;color:#64748b;width:140px">Código pedido:</td><td><strong style="color:#2563eb">${codigo}</strong></td></tr>
                <tr><td style="padding:4px 0;color:#64748b">Fecha:</td><td>${fechaFormateada}</td></tr>
                <tr><td style="padding:4px 0;color:#64748b">Proveedor:</td><td><strong>${proveedorNombre}</strong></td></tr>
                <tr><td style="padding:4px 0;color:#64748b">Agencia envío:</td><td><strong>${agenciaUpper}</strong></td></tr>
                <tr><td style="padding:4px 0;color:#64748b">Dirección entrega:</td><td>${direccion}${clienteCiudad ? ", " + clienteCiudad : ""}${clienteCodigoPostal ? " " + clienteCodigoPostal : ""}${clienteProvincia ? ", " + clienteProvincia : ""}</td></tr>
                <tr><td style="padding:4px 0;color:#64748b">Forma de pago:</td><td>${formaPago === "rd_pago" ? "RD Pago" : "Tarjeta bancaria"}</td></tr>
              </table>
            </div>

            <div style="background:#f8fafc;border-radius:10px;padding:16px;margin:20px 0">
              <p style="font-weight:700;color:#0b1736;margin:0 0 10px;font-size:13px">📦 REFERENCIAS</p>
              ${(productos || []).map((p: any) => `
                <div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #e2e8f0;font-size:13px">
                  <span><strong style="color:#0b1736">${p.referencia}</strong> — ${p.descripcion || ""}</span>
                  <span style="color:#16a34a;font-weight:700">${(Number(p.precio) + Number(p.impuesto || 0)).toFixed(2)}€</span>
                </div>
              `).join("")}
              <div style="text-align:right;margin-top:12px;font-size:14px">
                <strong style="color:#0b1736">TOTAL: ${Number(total).toFixed(2)}€ (IVA incl.)</strong>
              </div>
            </div>

            <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:10px;padding:16px;margin:20px 0">
              <p style="color:#1e40af;font-size:13px;margin:0">
                🚚 Recibirás una notificación cuando tu pedido sea enviado con el número de seguimiento de <strong>${agenciaUpper}</strong>.
              </p>
            </div>

            <p style="color:#64748b;font-size:12px;margin-top:24px">
              Sigue tu pedido desde tu panel: <a href="https://www.recambio-directo.com/dashboard/pedidos" style="color:#2563eb">Ver mis pedidos</a>
            </p>
          </div>
          <p style="text-align:center;color:#94a3b8;font-size:11px;margin-top:16px">Recambio Directo — info@recambio-directo.com — www.recambio-directo.com</p>
        </div>
      `,
      attachments: albaranBase64 ? [{
        filename: `albaran-${codigo}.pdf`,
        content: albaranBase64,
      }] : [],
    });

    // ── MAIL 3: PROVEEDOR — Etiqueta + dossier embalaje ───────────────────────
    const mailEmbalaje = await resend.emails.send({
      from: "Recambio Directo <info@recambio-directo.com>",
      to: proveedorEmail,
      subject: `📦 Instrucciones de embalaje y etiqueta — Pedido ${codigo}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#f8fafc;padding:24px">
          <div style="background:#0b1736;padding:24px;border-radius:12px 12px 0 0;text-align:center">
            <h1 style="color:white;margin:0;font-size:24px;letter-spacing:1px">RECAMBIO DIRECTO</h1>
            <p style="color:#94a3b8;margin:6px 0 0;font-size:13px">Instrucciones de embalaje — Pedido ${codigo}</p>
          </div>
          <div style="background:white;padding:28px;border-radius:0 0 12px 12px;border:1px solid #e2e8f0;border-top:none">
            <div style="background:#fef3c7;border-left:4px solid #f59e0b;padding:14px 18px;border-radius:0 8px 8px 0;margin-bottom:24px">
              <p style="color:#92400e;font-weight:700;margin:0;font-size:15px">📦 Instrucciones de embalaje — ${codigo}</p>
            </div>
            <p style="color:#374151;font-size:15px">Hola <strong>${proveedorNombre}</strong>,</p>
            <p style="color:#374151">Adjunto encontrarás la <strong>etiqueta de envío</strong> y el <strong>dossier de instrucciones de embalaje</strong> para el pedido <strong>${codigo}</strong>.</p>

            <div style="background:#f1f5f9;border-radius:10px;padding:18px;margin:20px 0">
              <p style="font-weight:700;color:#0b1736;margin:0 0 14px;font-size:14px">📋 INSTRUCCIONES RÁPIDAS</p>

              <div style="display:flex;gap:12px;margin-bottom:12px">
                <div style="width:28px;height:28px;background:#0b1736;border-radius:50%;display:flex;align-items:center;justify-content:center;color:white;font-weight:700;font-size:13px;flex-shrink:0">1</div>
                <div>
                  <p style="font-weight:700;color:#0b1736;margin:0 0 4px;font-size:13px">Prepara el embalaje</p>
                  <p style="color:#64748b;font-size:12px;margin:0">Usa una caja de cartón resistente. No reutilices cajas dañadas o deterioradas.</p>
                </div>
              </div>

              <div style="display:flex;gap:12px;margin-bottom:12px">
                <div style="width:28px;height:28px;background:#0b1736;border-radius:50%;display:flex;align-items:center;justify-content:center;color:white;font-weight:700;font-size:13px;flex-shrink:0">2</div>
                <div>
                  <p style="font-weight:700;color:#0b1736;margin:0 0 4px;font-size:13px">Protege la mercancía</p>
                  <p style="color:#64748b;font-size:12px;margin:0">Envuelve cada pieza con plástico de burbujas o papel de relleno. Las piezas metálicas deben ir separadas para evitar golpes.</p>
                </div>
              </div>

              <div style="display:flex;gap:12px;margin-bottom:12px">
                <div style="width:28px;height:28px;background:#0b1736;border-radius:50%;display:flex;align-items:center;justify-content:center;color:white;font-weight:700;font-size:13px;flex-shrink:0">3</div>
                <div>
                  <p style="font-weight:700;color:#0b1736;margin:0 0 4px;font-size:13px">Incluye el albarán dentro</p>
                  <p style="color:#64748b;font-size:12px;margin:0">Mete una copia del albarán dentro del paquete antes de cerrarlo.</p>
                </div>
              </div>

              <div style="display:flex;gap:12px;margin-bottom:12px">
                <div style="width:28px;height:28px;background:#0b1736;border-radius:50%;display:flex;align-items:center;justify-content:center;color:white;font-weight:700;font-size:13px;flex-shrink:0">4</div>
                <div>
                  <p style="font-weight:700;color:#0b1736;margin:0 0 4px;font-size:13px">Pega la etiqueta</p>
                  <p style="color:#64748b;font-size:12px;margin:0">Imprime y pega la etiqueta adjunta en la parte superior de la caja. Debe ser visible y no estar doblada.</p>
                </div>
              </div>

              <div style="display:flex;gap:12px">
                <div style="width:28px;height:28px;background:#16a34a;border-radius:50%;display:flex;align-items:center;justify-content:center;color:white;font-weight:700;font-size:13px;flex-shrink:0">5</div>
                <div>
                  <p style="font-weight:700;color:#16a34a;margin:0 0 4px;font-size:13px">Espera la recogida de ${agenciaUpper}</p>
                  <p style="color:#64748b;font-size:12px;margin:0">La agencia pasará a recoger el paquete. Consérva el resguardo de entrega como justificante.</p>
                </div>
              </div>
            </div>

            <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:10px;padding:14px 16px;margin:16px 0">
              <p style="color:#dc2626;font-size:13px;font-weight:700;margin:0 0 6px">⚠️ IMPORTANTE</p>
              <ul style="color:#7f1d1d;font-size:12px;margin:0;padding-left:18px">
                <li style="margin-bottom:4px">No uses celo ni cinta de pintor para cerrar la caja — usa cinta de embalar resistente</li>
                <li style="margin-bottom:4px">Los líquidos deben ir en bolsa hermética dentro de la caja</li>
                <li style="margin-bottom:4px">Si el paquete supera 30 kg avisa a Recambio Directo antes del envío</li>
                <li>Cualquier daño por embalaje deficiente puede reclamarse al remitente</li>
              </ul>
            </div>

            <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:14px 16px;margin:16px 0">
              <p style="color:#166534;font-size:13px;margin:0">
                📎 Adjuntos a este email: <strong>etiqueta de envío (PDF)</strong> y <strong>dossier de instrucciones completo (PDF)</strong>.
              </p>
            </div>

            <p style="color:#64748b;font-size:12px;margin-top:20px">
              ¿Tienes algún problema con el pedido? Contáctanos en 
              <a href="mailto:info@recambio-directo.com" style="color:#2563eb">info@recambio-directo.com</a>
              o desde tu <a href="https://www.recambio-directo.com/dashboard/proveedor" style="color:#2563eb">panel de proveedor</a>.
            </p>
          </div>
          <p style="text-align:center;color:#94a3b8;font-size:11px;margin-top:16px">Recambio Directo — info@recambio-directo.com — www.recambio-directo.com</p>
        </div>
      `,
      attachments: [
        ...(etiquetaBase64 ? [{
          filename: `etiqueta-envio-${codigo}.pdf`,
          content: etiquetaBase64,
        }] : []),
      ],
    });

    // ── RESTAR STOCK EN SERVIDOR ──────────────────────────────────────────────
    try {
      for (const prod of (productos || [])) {
        const cant = prod.cantidad || 1;
        const provId = prod.proveedor_id;
        const ref = prod.referencia;
        if (!provId || !ref) continue;
        const { data: pieza } = await supabase
          .from("piezas_publicadas")
          .select("id, stock")
          .eq("proveedor_id", provId)
          .ilike("referencia", ref)
          .single();
        if (pieza) {
          await supabase.from("piezas_publicadas")
            .update({ stock: Math.max(0, (pieza.stock || 0) - cant) })
            .eq("id", pieza.id);
        }
      }
    } catch (stockErr) {
      console.error("Error restando stock:", stockErr);
    }

    return Response.json({
      ok: true,
      mails: {
        proveedor: mailProveedor.data?.id || null,
        cliente: mailCliente.data?.id || null,
        embalaje: mailEmbalaje.data?.id || null,
      }
    });

  } catch (error) {
    console.error("Error enviando emails:", error);
    return Response.json({ ok: false, error: String(error) }, { status: 500 });
  }
}