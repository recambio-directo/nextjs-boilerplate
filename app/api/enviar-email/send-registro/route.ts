import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { nombreEmpresa, cif, email, telefono, direccion, ciudad, codigoPostal, tipo } = body;

    const fechaFormateada = new Date().toLocaleDateString("es-ES", {
      day: "2-digit", month: "2-digit", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });

    const tipoLabel = tipo === "proveedor" ? "Proveedor" : "Taller";
    const tipoIcon = tipo === "proveedor" ? "🏭" : "🔧";

    // Validación básica de formato CIF/NIF
    const cifLimpio = (cif || "").trim().toUpperCase();
    const cifValido = /^[A-Z]\d{7}[A-Z0-9]$/.test(cifLimpio) || /^\d{8}[A-Z]$/.test(cifLimpio);

    // ===== EMAIL AL ADMIN =====
    await resend.emails.send({
      from: "Recambio Directo <noreply@recambio-directo.com>",
      to: ["vicente@rgranvia.es"],
      subject: `🆕 Nuevo registro — ${nombreEmpresa} (${tipoLabel})`,
      html: `
        <div style="font-family:Arial;padding:30px;background:#f3f4f6;">
          <div style="background:white;padding:32px;border-radius:12px;max-width:600px;margin:auto;">

            <h1 style="color:#0b1736;margin-bottom:4px;font-size:24px;">🆕 Nuevo registro</h1>
            <p style="color:#6b7280;font-size:13px;margin-bottom:24px;">${fechaFormateada}</p>

            <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:20px;margin-bottom:16px;">
              <p style="margin:0 0 12px;font-size:16px;font-weight:700;color:#1e40af;">${tipoIcon} ${tipoLabel}</p>
              <p style="margin:0 0 8px;font-size:14px;"><strong>Empresa:</strong> ${nombreEmpresa || "No indicado"}</p>
              <p style="margin:0 0 8px;font-size:14px;"><strong>Email:</strong> <a href="mailto:${email}" style="color:#2563eb;">${email}</a></p>
              <p style="margin:0 0 8px;font-size:14px;"><strong>Teléfono:</strong> ${telefono || "No indicado"}</p>
              <p style="margin:0 0 8px;font-size:14px;"><strong>Dirección:</strong> ${direccion || "No indicado"}, ${ciudad || ""} ${codigoPostal ? `(CP: ${codigoPostal})` : ""}</p>
            </div>

            <!-- CIF DESTACADO -->
            <div style="background:${cifValido ? "#f0fdf4" : "#fef2f2"};border:2px solid ${cifValido ? "#86efac" : "#fca5a5"};border-radius:8px;padding:16px 20px;margin-bottom:16px;">
              <p style="margin:0 0 6px;font-size:12px;font-weight:700;color:${cifValido ? "#166534" : "#991b1b"};">
                ${cifValido ? "✅ CIF/NIF con formato válido" : "⚠️ CIF/NIF — verificar manualmente"}
              </p>
              <p style="margin:0;font-size:22px;font-weight:900;color:${cifValido ? "#15803d" : "#dc2626"};letter-spacing:2px;">
                ${cifLimpio || "NO INDICADO"}
              </p>
              <p style="margin:6px 0 0;font-size:11px;color:#6b7280;">
                Verifica en: <a href="https://www.agenciatributaria.es/AEAT.internet/Inicio/Ayuda/Consultas_informaticas/Censo_de_obligados_tributarios_y_NIF/Consulta_del_NIF/Consulta_del_NIF.shtml" style="color:#2563eb;">AEAT — Consulta NIF</a>
              </p>
            </div>

            <div style="background:#fef3c7;border-left:4px solid #f59e0b;padding:12px 16px;margin-bottom:20px;">
              <p style="margin:0;color:#92400e;font-size:13px;">
                ⚠️ <strong>Acción requerida:</strong> Verifica el CIF, activa la cuenta en el panel admin y envía SEPA + condiciones a <strong>${email}</strong>
              </p>
            </div>

            <div style="text-align:center;margin:20px 0;">
              <a href="https://recambio-directo.com/admin"
                style="background:linear-gradient(135deg,#dc2626,#991b1b);color:white;padding:12px 28px;border-radius:10px;text-decoration:none;font-weight:700;font-size:14px;margin-right:10px;">
                Ir al panel admin →
              </a>
              <a href="https://www.agenciatributaria.es/AEAT.internet/Inicio/Ayuda/Consultas_informaticas/Censo_de_obligados_tributarios_y_NIF/Consulta_del_NIF/Consulta_del_NIF.shtml"
                style="background:linear-gradient(135deg,#2563eb,#1d4ed8);color:white;padding:12px 28px;border-radius:10px;text-decoration:none;font-weight:700;font-size:14px;">
                Verificar CIF →
              </a>
            </div>

            <hr style="margin:20px 0;border:none;border-top:1px solid #e5e7eb;" />
            <p style="color:#9ca3af;font-size:12px;text-align:center;margin:0;">Recambio Directo — Panel de administración</p>
          </div>
        </div>
      `,
    });

    // ===== EMAIL AL USUARIO =====
    await resend.emails.send({
      from: "Recambio Directo <noreply@recambio-directo.com>",
      to: [email],
      subject: `Bienvenido a Recambio Directo — ${nombreEmpresa}`,
      html: `
        <div style="font-family:Arial;padding:30px;background:#f3f4f6;">
          <div style="background:white;padding:32px;border-radius:12px;max-width:600px;margin:auto;">
            <h1 style="color:#0b1736;margin-bottom:8px;font-size:24px;">Bienvenido a Recambio Directo</h1>
            <p style="color:#374151;font-size:15px;line-height:1.7;margin-bottom:20px;">
              Hola <strong>${nombreEmpresa}</strong>, tu cuenta como <strong>${tipoLabel}</strong> ha sido creada correctamente.
            </p>

            <div style="background:#fef3c7;border:1px solid #fde68a;border-radius:8px;padding:16px 20px;margin-bottom:20px;">
              <p style="margin:0 0 6px;font-size:13px;font-weight:700;color:#92400e;">⏳ Cuenta pendiente de verificación</p>
              <p style="margin:0;font-size:13px;color:#78350f;">
                Nuestro equipo revisará tus datos en las próximas horas y recibirás un email de confirmación cuando tu cuenta esté lista.
              </p>
            </div>

            <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:20px;margin-bottom:20px;">
              <p style="margin:0 0 10px;font-size:14px;font-weight:700;color:#111827;">
                ${tipoLabel === "Taller" ? "🔧 Como taller podrás:" : "🏭 Como proveedor podrás:"}
              </p>
              ${tipoLabel === "Taller" ? `
              <ul style="margin:0;padding-left:20px;color:#374151;font-size:14px;line-height:2;">
                <li>Buscar referencias OEM e IAM entre múltiples proveedores</li>
                <li>Comparar precios y disponibilidad en tiempo real</li>
                <li>Realizar pedidos con seguimiento completo</li>
                <li>Comunicarte con proveedores por chat</li>
              </ul>` : `
              <ul style="margin:0;padding-left:20px;color:#374151;font-size:14px;line-height:2;">
                <li>Publicar tu catálogo con precios y stock</li>
                <li>Gestionar pedidos recibidos</li>
                <li>Importar tu catálogo desde Excel</li>
                <li>Comunicarte con talleres por chat</li>
              </ul>`}
            </div>

            <div style="background:#eff6ff;border-left:4px solid #3b82f6;padding:14px 18px;margin-bottom:24px;">
              <p style="margin:0;color:#1e40af;font-size:13px;">
                Recibirás en breve las condiciones comerciales y el formulario SEPA para establecer la relación comercial.
              </p>
            </div>

            <div style="text-align:center;margin:24px 0;">
              <a href="https://recambio-directo.com"
                style="background:linear-gradient(135deg,#2563eb,#1d4ed8);color:white;padding:14px 32px;border-radius:10px;text-decoration:none;font-weight:700;font-size:15px;">
                Acceder a la plataforma →
              </a>
            </div>

            <hr style="margin:24px 0;border:none;border-top:1px solid #e5e7eb;" />
            <p style="color:#9ca3af;font-size:12px;text-align:center;margin:0;">
              Recambio Directo · Marketplace B2B · España ·
              <a href="mailto:info@recambio-directo.com" style="color:#3b82f6;">info@recambio-directo.com</a>
            </p>
          </div>
        </div>
      `,
    });

    return Response.json({ ok: true });

  } catch (error) {
    console.error("Error enviando emails de registro:", error);
    return Response.json({ error: String(error) }, { status: 500 });
  }
}