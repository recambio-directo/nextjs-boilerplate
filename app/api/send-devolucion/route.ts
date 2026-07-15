// app/api/send-devolucion/route.ts
import { Resend } from "resend";
import { createClient } from "@supabase/supabase-js";

const resend = new Resend(process.env.RESEND_API_KEY);
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const TIPO_LABEL: Record<string, string> = {
  arrepentimiento: "Ya no lo necesita",
  pieza_incorrecta: "Pieza incorrecta",
  rotura_desperfecto: "Rotura / desperfecto",
  otro: "Otro motivo",
};

const EVENTO_CONFIG: Record<string, {
  asunto: (codigo: string) => string;
  titulo: string;
  color: string;
  bgColor: string;
  borderColor: string;
  emoji: string;
  destinatario: "proveedor" | "solicitante" | "ambos";
}> = {
  solicitada: {
    asunto: c => `🔄 Nueva solicitud de devolución — ${c}`,
    titulo: "Nueva solicitud de devolución",
    color: "#f59e0b", bgColor: "#fffbeb", borderColor: "#fde68a",
    emoji: "🔄", destinatario: "proveedor",
  },
  aceptada: {
    asunto: c => `✅ Devolución aceptada — ${c}`,
    titulo: "Devolución aceptada",
    color: "#16a34a", bgColor: "#f0fdf4", borderColor: "#bbf7d0",
    emoji: "✅", destinatario: "solicitante",
  },
  rechazada: {
    asunto: c => `🚫 Devolución rechazada — ${c}`,
    titulo: "Devolución rechazada",
    color: "#dc2626", bgColor: "#fef2f2", borderColor: "#fecaca",
    emoji: "🚫", destinatario: "solicitante",
  },
  enviada: {
    asunto: c => `🚚 Pieza de devolución enviada — ${c}`,
    titulo: "Pieza de devolución enviada",
    color: "#2563eb", bgColor: "#eff6ff", borderColor: "#bfdbfe",
    emoji: "🚚", destinatario: "proveedor",
  },
  recibida: {
    asunto: c => `📥 Pieza de devolución recibida — ${c}`,
    titulo: "Pieza recibida por el proveedor",
    color: "#7c3aed", bgColor: "#f5f3ff", borderColor: "#ddd6fe",
    emoji: "📥", destinatario: "solicitante",
  },
  finalizada: {
    asunto: c => `🏁 Devolución finalizada — ${c}`,
    titulo: "Devolución finalizada",
    color: "#16a34a", bgColor: "#f0fdf4", borderColor: "#bbf7d0",
    emoji: "🏁", destinatario: "ambos",
  },
  cancelada: {
    asunto: c => `❌ Devolución cancelada — ${c}`,
    titulo: "Devolución cancelada por el taller",
    color: "#6b7280", bgColor: "#f9fafb", borderColor: "#e5e7eb",
    emoji: "❌", destinatario: "proveedor",
  },
  gestion_externa: {
    asunto: c => `🔁 Devolución derivada a gestión externa — ${c}`,
    titulo: "Devolución derivada a gestión externa",
    color: "#a855f7", bgColor: "#faf5ff", borderColor: "#e9d5ff",
    emoji: "🔁", destinatario: "solicitante",
  },
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { evento, devolucion, proveedorEmail: provEmailOverride } = body;

    if (!evento || !devolucion) {
      return Response.json({ error: "Faltan campos: evento, devolucion" }, { status: 400 });
    }

    const config = EVENTO_CONFIG[evento];
    if (!config) {
      return Response.json({ error: `Evento desconocido: ${evento}` }, { status: 400 });
    }

    const dev = devolucion;
    const codigo = dev.codigo || "DEV-???";
    const pedidoCodigo = dev.pedido_codigo || `#${dev.pedido_id}`;
    const tipoLabel = TIPO_LABEL[dev.tipo] || dev.tipo || "-";
    const fechaSolicitud = dev.created_at
      ? new Date(dev.created_at).toLocaleDateString("es-ES")
      : new Date().toLocaleDateString("es-ES");
    const importe = Number(dev.importe || 0).toFixed(2);

    // ── Resolver emails de las partes ──
    let solicitanteEmail = dev.solicitante_email || "";
    let solicitanteNombre = dev.solicitante_nombre || "";
    let proveedorEmail = provEmailOverride || "";
    let proveedorNombre = dev.proveedor_nombre || "";

    if (dev.solicitante_id && (!solicitanteEmail || !solicitanteNombre)) {
      const { data } = await supabase.from("usuarios").select("email, nombre_empresa").eq("id", dev.solicitante_id).single();
      if (data) {
        solicitanteEmail = solicitanteEmail || data.email || "";
        solicitanteNombre = solicitanteNombre || data.nombre_empresa || "";
      }
    }
    if (dev.proveedor_id && (!proveedorEmail || !proveedorNombre)) {
      const { data } = await supabase.from("usuarios").select("email, nombre_empresa").eq("id", dev.proveedor_id).single();
      if (data) {
        proveedorEmail = proveedorEmail || data.email || "";
        proveedorNombre = proveedorNombre || data.nombre_empresa || "";
      }
    }

    // ── Bloques HTML reutilizables ──
    const fichaHtml = `
      <div style="background:${config.bgColor};border:1px solid ${config.borderColor};border-radius:8px;padding:20px;margin-bottom:20px;">
        <p style="margin:0 0 8px;font-size:14px;"><strong>Devolución:</strong> ${codigo}</p>
        <p style="margin:0 0 8px;font-size:14px;"><strong>Pedido:</strong> ${pedidoCodigo}</p>
        <p style="margin:0 0 8px;font-size:14px;"><strong>Referencia:</strong> ${dev.referencia || "-"}${dev.cantidad > 1 ? ` ×${dev.cantidad}` : ""}</p>
        ${dev.descripcion ? `<p style="margin:0 0 8px;font-size:14px;"><strong>Descripción:</strong> ${dev.descripcion}</p>` : ""}
        <p style="margin:0 0 8px;font-size:14px;"><strong>Tipo:</strong> ${tipoLabel}</p>
        <p style="margin:0 0 8px;font-size:14px;"><strong>Fecha solicitud:</strong> ${fechaSolicitud}</p>
        <p style="margin:0;font-size:14px;"><strong>Importe:</strong> ${importe} €</p>
      </div>`;

    const motivoTextoHtml = dev.motivo_texto ? `
      <div style="background:#f9fafb;border-left:4px solid #6b7280;padding:14px 18px;margin-bottom:20px;">
        <p style="margin:0 0 6px;font-size:13px;font-weight:700;color:#374151;">MOTIVO DEL TALLER</p>
        <p style="margin:0;color:#374151;font-size:14px;">${dev.motivo_texto}</p>
      </div>` : "";

    const motivoRechazoHtml = (evento === "rechazada" && dev.motivo_rechazo) ? `
      <div style="background:#fef2f2;border-left:4px solid #dc2626;padding:14px 18px;margin-bottom:20px;">
        <p style="margin:0 0 6px;font-size:13px;font-weight:700;color:#991b1b;">MOTIVO DEL RECHAZO</p>
        <p style="margin:0;color:#374151;font-size:14px;">${dev.motivo_rechazo}</p>
      </div>` : "";

    const envioHtml = (dev.agencia_devolucion && ["enviada", "recibida", "finalizada"].includes(evento)) ? `
      <div style="background:#eff6ff;border-left:4px solid #3b82f6;padding:14px 18px;margin-bottom:20px;">
        <p style="margin:0 0 6px;font-size:13px;font-weight:700;color:#1e40af;">DATOS DEL ENVÍO DE VUELTA</p>
        <p style="margin:0;color:#374151;font-size:14px;">
          <strong>Agencia:</strong> ${dev.agencia_devolucion}
          ${dev.codigo_transporte ? `&nbsp;&nbsp;·&nbsp;&nbsp;<strong>Tracking:</strong> ${dev.codigo_transporte}` : ""}
        </p>
      </div>` : "";

    function buildEmail(destinatarioNombre: string, textoIntro: string, ctaUrl: string, ctaLabel: string) {
      return `
        <div style="font-family:Arial;padding:30px;background:#f3f4f6;">
          <div style="background:white;padding:32px;border-radius:12px;max-width:600px;margin:auto;">
            <h1 style="color:${config.color};margin-bottom:8px;font-size:24px;">${config.emoji} ${config.titulo}</h1>
            <p style="color:#374151;font-size:15px;line-height:1.7;margin-bottom:20px;">${textoIntro}</p>
            ${fichaHtml}
            ${motivoTextoHtml}
            ${motivoRechazoHtml}
            ${envioHtml}
            <div style="background:#f0f9ff;border-left:4px solid #3b82f6;padding:14px 18px;margin-bottom:24px;">
              <p style="margin:0;color:#1e40af;font-size:13px;">
                ℹ️ Si tienes dudas contacta con la otra parte por el chat de la plataforma o escríbenos a
                <a href="mailto:info@recambio-directo.com" style="color:#2563eb;">info@recambio-directo.com</a>
              </p>
            </div>
            <div style="text-align:center;margin:28px 0;">
              <a href="${ctaUrl}"
                style="background:linear-gradient(135deg,#2563eb,#1d4ed8);color:white;padding:14px 32px;border-radius:10px;text-decoration:none;font-weight:700;font-size:15px;">
                ${ctaLabel} →
              </a>
            </div>
            <hr style="margin:24px 0;border:none;border-top:1px solid #e5e7eb;" />
            <p style="color:#9ca3af;font-size:12px;text-align:center;margin:0;">Recambio Directo · Marketplace B2B · España</p>
          </div>
        </div>`;
    }

    // ── Textos específicos por evento y destinatario ──
    const TEXTOS: Record<string, { proveedor: string; solicitante: string }> = {
      solicitada: {
        proveedor: `<strong>${solicitanteNombre || "Un taller"}</strong> ha solicitado la devolución de una pieza del pedido <strong>${pedidoCodigo}</strong>. Revisa la solicitud y acepta o rechaza desde tu panel.`,
        solicitante: "",
      },
      aceptada: {
        proveedor: "",
        solicitante: `<strong>${proveedorNombre || "El proveedor"}</strong> ha aceptado tu solicitud de devolución <strong>${codigo}</strong>. Ahora tienes que enviar la pieza de vuelta y registrar el envío desde tu panel.`,
      },
      rechazada: {
        proveedor: "",
        solicitante: `<strong>${proveedorNombre || "El proveedor"}</strong> ha rechazado tu solicitud de devolución <strong>${codigo}</strong>. Puedes contactar con él por el chat de la plataforma si necesitas más información.`,
      },
      enviada: {
        proveedor: `<strong>${solicitanteNombre || "El taller"}</strong> ha enviado la pieza de la devolución <strong>${codigo}</strong>. Cuando la recibas, márcala como recibida desde tu panel.`,
        solicitante: "",
      },
      recibida: {
        proveedor: "",
        solicitante: `<strong>${proveedorNombre || "El proveedor"}</strong> ha confirmado la recepción de la pieza de la devolución <strong>${codigo}</strong>. La devolución está pendiente de finalización.`,
      },
      finalizada: {
        proveedor: `La devolución <strong>${codigo}</strong> del pedido <strong>${pedidoCodigo}</strong> ha sido finalizada. El abono al taller queda gestionado entre las partes.`,
        solicitante: `La devolución <strong>${codigo}</strong> del pedido <strong>${pedidoCodigo}</strong> ha sido finalizada por <strong>${proveedorNombre || "el proveedor"}</strong>. El abono queda gestionado entre las partes.`,
      },
      cancelada: {
        proveedor: `<strong>${solicitanteNombre || "El taller"}</strong> ha cancelado la solicitud de devolución <strong>${codigo}</strong> del pedido <strong>${pedidoCodigo}</strong>. No es necesaria ninguna acción.`,
        solicitante: "",
      },
      gestion_externa: {
        proveedor: "",
        solicitante: `<strong>${proveedorNombre || "El proveedor"}</strong> ha derivado la devolución <strong>${codigo}</strong> a gestión externa. La devolución se gestionará fuera de la plataforma. Contacta con el proveedor directamente si necesitas más información.`,
      },
    };

    const textos = TEXTOS[evento] || { proveedor: "", solicitante: "" };

    // ── 1. EMAIL AL PROVEEDOR ──
    if (proveedorEmail && ["proveedor", "ambos"].includes(config.destinatario) && textos.proveedor) {
      await resend.emails.send({
        from: "Recambio Directo <info@recambio-directo.com>",
        to: [proveedorEmail],
        subject: config.asunto(codigo),
        html: buildEmail(
          proveedorNombre,
          textos.proveedor,
          "https://www.recambio-directo.com/dashboard/panel",
          "Ver en mi panel"
        ),
      });
    }

    // ── 2. EMAIL AL SOLICITANTE (TALLER) ──
    if (solicitanteEmail && ["solicitante", "ambos"].includes(config.destinatario) && textos.solicitante) {
      await resend.emails.send({
        from: "Recambio Directo <info@recambio-directo.com>",
        to: [solicitanteEmail],
        subject: config.asunto(codigo),
        html: buildEmail(
          solicitanteNombre,
          textos.solicitante,
          "https://www.recambio-directo.com/dashboard/devoluciones",
          "Ver mis devoluciones"
        ),
      });
    }

    // ── 3. NOTIFICACIÓN CAMPANITA ──
    if (dev.pedido_id && dev.solicitante_id && dev.proveedor_id) {
      try {
        // Determinar quién recibe la notificación
        const destinatarioIds: string[] = [];
        if (["proveedor", "ambos"].includes(config.destinatario)) destinatarioIds.push(dev.proveedor_id);
        if (["solicitante", "ambos"].includes(config.destinatario)) destinatarioIds.push(dev.solicitante_id);

        // Buscar o crear conversación vinculada al pedido
        let convId: number | null = null;
        const { data: convExistente } = await supabase
          .from("conversaciones")
          .select("id")
          .eq("pedido_id", dev.pedido_id)
          .maybeSingle();

        if (convExistente?.id) {
          convId = convExistente.id;
        } else {
          const { data: nuevaConv } = await supabase.from("conversaciones").insert({
            user1_id: dev.solicitante_id,
            user2_id: dev.proveedor_id,
            pedido_id: dev.pedido_id,
            referencia: `Pedido ${pedidoCodigo}`,
            ultimo_mensaje: "",
            updated_at: new Date().toISOString(),
          }).select("id").single();
          if (nuevaConv?.id) convId = nuevaConv.id;
        }

        if (convId) {
          const textoNotif = `${config.emoji} Devolución ${codigo} — ${config.titulo}`;
          // Insertar mensaje de sistema
          await supabase.from("mensajes").insert({
            conversacion_id: convId,
            user_id: dev.solicitante_id,
            mensaje: textoNotif,
            emisor: "sistema",
            leido: false,
          });
          await supabase.from("conversaciones").update({
            ultimo_mensaje: textoNotif,
            updated_at: new Date().toISOString(),
          }).eq("id", convId);
        }
      } catch (notifError) {
        console.error("Error campanita devolución:", notifError);
      }
    }

    return Response.json({ ok: true });
  } catch (error) {
    console.error("Error enviando email devolución:", error);
    return Response.json({ error: String(error) }, { status: 500 });
  }
}