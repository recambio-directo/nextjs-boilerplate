// app/api/devolucion/cron/route.ts
// Cron job — consulta el tracking de devoluciones en tránsito
// Cuando detecta entrega → marca como "recibida" y notifica

import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
const resend = new Resend(process.env.RESEND_API_KEY);

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://recambio-directo.com";

// ── Consultar tracking según agencia ─────────────────────────────────────────
async function consultarTracking(agencia: string, tracking: string): Promise<{ entregado: boolean; estado?: string }> {
  const ag = (agencia || "").toLowerCase();

  try {
    // ── MRW ──
    if (ag.includes("mrw")) {
      const res = await fetch(`${BASE_URL}/api/mrw/tracking`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ numeroEnvio: tracking }),
      });
      const data = await res.json();
      if (!data.ok) return { entregado: false };
      return { entregado: data.estadoRD === "entregado", estado: data.estadoRD };
    }

    // ── NACEX ──
    if (ag.includes("nacex")) {
      // NACEX tracking via getEstadoExpedicion
      const user = process.env.NACEX_USER || "";
      const pass = process.env.NACEX_PASS || "";
      const url = `https://pda.nacex.com/nacex_ws/ws?method=getEstadoExpedicion&user=${encodeURIComponent(user)}&pass=${encodeURIComponent(pass)}&data=${encodeURIComponent(tracking)}`;
      const res = await fetch(url);
      const raw = await res.text();
      // NACEX devuelve campos separados por | — el campo 3 es el estado
      // Estados NACEX: "ENTREGADO", "EN REPARTO", "EN TRANSITO", etc.
      const esEntregado = raw.toUpperCase().includes("ENTREGADO");
      return { entregado: esEntregado, estado: esEntregado ? "entregado" : "en_transito" };
    }

    // ── GLS ──
    if (ag.includes("gls")) {
      const res = await fetch(`${BASE_URL}/api/gls/tracking`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ codbarras: tracking }),
      });
      const data = await res.json();
      if (!data.ok) return { entregado: false };
      // GLS codEstado: "2" = en tránsito, "3" = en reparto, "7" = entregado
      const entregado = data.codEstado === "7" || data.codEstado === "11";
      return { entregado, estado: entregado ? "entregado" : "en_transito" };
    }

    // ── CORREOS EXPRESS ──
    if (ag.includes("correos")) {
      const res = await fetch(`${BASE_URL}/api/correos-express/tracking`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ numEnvio: tracking }),
      });
      const data = await res.json();
      if (!data.ok) return { entregado: false };
      const entregado = (data.estado || "").toLowerCase().includes("entregado") || data.codEstado === "10";
      return { entregado, estado: entregado ? "entregado" : "en_transito" };
    }

    // ── CTT EXPRESS ──
    if (ag.includes("ctt")) {
      const res = await fetch(`${BASE_URL}/api/ctt/tracking`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shippingCode: tracking }),
      });
      const data = await res.json();
      if (!data.ok) return { entregado: false };
      const entregado = (data.estado || "").toLowerCase().includes("entregado") || (data.estado || "").toLowerCase().includes("delivered");
      return { entregado, estado: entregado ? "entregado" : "en_transito" };
    }

    // ── SEUR ──
    if (ag.includes("seur")) {
      // Si tienes endpoint de tracking SEUR, añádelo aquí
      // Por ahora devuelve no entregado para que se gestione manualmente
      return { entregado: false };
    }

  } catch (e) {
    console.error(`Error consultando tracking ${agencia} ${tracking}:`, e);
  }

  return { entregado: false };
}

// ══════════════════════════════════════════════════════════════════════════════
export async function GET(request: Request) {
  // Verificar que la llamada viene de Vercel Cron
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Buscar devoluciones en tránsito con tracking
    const { data: devoluciones } = await supabase
      .from("devoluciones")
      .select("id, codigo, pedido_id, pedido_codigo, solicitante_id, solicitante_nombre, solicitante_email, proveedor_id, proveedor_nombre, agencia_devolucion, codigo_transporte, estado, referencia, importe")
      .eq("estado", "en_transito")
      .not("codigo_transporte", "is", null)
      .not("agencia_devolucion", "is", null);

    if (!devoluciones || devoluciones.length === 0) {
      return Response.json({ ok: true, procesados: 0, mensaje: "No hay devoluciones en tránsito" });
    }

    let procesados = 0;
    let marcadasRecibidas = 0;

    for (const dev of devoluciones) {
      try {
        const resultado = await consultarTracking(dev.agencia_devolucion, dev.codigo_transporte);

        if (resultado.entregado) {
          // Marcar como recibida
          await supabase.from("devoluciones").update({
            estado: "recibida",
            fecha_recibida: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }).eq("id", dev.id);

          marcadasRecibidas++;

          // Notificar al solicitante (taller) que la pieza ha sido recibida
          if (dev.solicitante_email) {
            try {
              await resend.emails.send({
                from: "Recambio Directo <info@recambio-directo.com>",
                to: [dev.solicitante_email],
                subject: `📥 Pieza de devolución recibida — ${dev.codigo}`,
                html: `
                  <div style="font-family:Arial;padding:30px;background:#f3f4f6;">
                    <div style="background:white;padding:32px;border-radius:12px;max-width:600px;margin:auto;">
                      <h1 style="color:#7c3aed;font-size:24px;">📥 Pieza recibida por el proveedor</h1>
                      <p style="color:#374151;font-size:15px;line-height:1.7;">
                        La pieza de la devolución <strong>${dev.codigo}</strong> ha sido entregada al proveedor <strong>${dev.proveedor_nombre || ""}</strong>.
                      </p>
                      <div style="background:#f5f3ff;border:1px solid #ddd6fe;border-radius:8px;padding:16px;margin:20px 0;">
                        <p style="margin:0 0 8px;font-size:14px;"><strong>Devolución:</strong> ${dev.codigo}</p>
                        <p style="margin:0 0 8px;font-size:14px;"><strong>Pedido:</strong> ${dev.pedido_codigo || `#${dev.pedido_id}`}</p>
                        <p style="margin:0 0 8px;font-size:14px;"><strong>Referencia:</strong> ${dev.referencia || "-"}</p>
                        <p style="margin:0 0 8px;font-size:14px;"><strong>Agencia:</strong> ${dev.agencia_devolucion}</p>
                        <p style="margin:0;font-size:14px;"><strong>Tracking:</strong> ${dev.codigo_transporte}</p>
                      </div>
                      <p style="color:#374151;font-size:14px;">La devolución está pendiente de que el proveedor la finalice y gestione el abono.</p>
                      <div style="text-align:center;margin:28px 0;">
                        <a href="https://www.recambio-directo.com/dashboard/devoluciones"
                          style="background:linear-gradient(135deg,#2563eb,#1d4ed8);color:white;padding:14px 32px;border-radius:10px;text-decoration:none;font-weight:700;font-size:15px;">
                          Ver mis devoluciones →
                        </a>
                      </div>
                      <hr style="margin:24px 0;border:none;border-top:1px solid #e5e7eb;" />
                      <p style="color:#9ca3af;font-size:12px;text-align:center;">Recambio Directo · Marketplace B2B · España</p>
                    </div>
                  </div>
                `,
              });
            } catch (emailErr) {
              console.error("Error email entrega devolución:", emailErr);
            }
          }

          // Notificar al proveedor que ha recibido la pieza
          let proveedorEmail = "";
          if (dev.proveedor_id) {
            const { data: prov } = await supabase.from("usuarios").select("email").eq("id", dev.proveedor_id).single();
            proveedorEmail = prov?.email || "";
          }
          if (proveedorEmail) {
            try {
              await resend.emails.send({
                from: "Recambio Directo <info@recambio-directo.com>",
                to: [proveedorEmail],
                subject: `📥 Pieza de devolución recibida en tu almacén — ${dev.codigo}`,
                html: `
                  <div style="font-family:Arial;padding:30px;background:#f3f4f6;">
                    <div style="background:white;padding:32px;border-radius:12px;max-width:600px;margin:auto;">
                      <h1 style="color:#7c3aed;font-size:24px;">📥 Has recibido una pieza de devolución</h1>
                      <p style="color:#374151;font-size:15px;line-height:1.7;">
                        La agencia <strong>${dev.agencia_devolucion}</strong> ha entregado la pieza de la devolución <strong>${dev.codigo}</strong> en tu dirección.
                      </p>
                      <div style="background:#f5f3ff;border:1px solid #ddd6fe;border-radius:8px;padding:16px;margin:20px 0;">
                        <p style="margin:0 0 8px;font-size:14px;"><strong>Devolución:</strong> ${dev.codigo}</p>
                        <p style="margin:0 0 8px;font-size:14px;"><strong>Taller:</strong> ${dev.solicitante_nombre || "-"}</p>
                        <p style="margin:0 0 8px;font-size:14px;"><strong>Referencia:</strong> ${dev.referencia || "-"}</p>
                        <p style="margin:0;font-size:14px;"><strong>Importe:</strong> ${Number(dev.importe || 0).toFixed(2)} €</p>
                      </div>
                      <div style="background:#fef3c7;border-left:4px solid #f59e0b;padding:14px 18px;margin-bottom:20px;">
                        <p style="margin:0;color:#92400e;font-size:13px;">
                          ⚠️ <strong>Revisa la pieza y finaliza la devolución</strong> desde tu panel para confirmar que el abono queda gestionado.
                        </p>
                      </div>
                      <div style="text-align:center;margin:28px 0;">
                        <a href="https://www.recambio-directo.com/dashboard/proveedor"
                          style="background:linear-gradient(135deg,#2563eb,#1d4ed8);color:white;padding:14px 32px;border-radius:10px;text-decoration:none;font-weight:700;font-size:15px;">
                          Ver en mi panel →
                        </a>
                      </div>
                      <hr style="margin:24px 0;border:none;border-top:1px solid #e5e7eb;" />
                      <p style="color:#9ca3af;font-size:12px;text-align:center;">Recambio Directo · Marketplace B2B · España</p>
                    </div>
                  </div>
                `,
              });
            } catch (emailErr) {
              console.error("Error email proveedor recepción:", emailErr);
            }
          }

          // Notificación campanita via send-devolucion
          try {
            await fetch(`${BASE_URL}/api/send-devolucion`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ evento: "recibida", devolucion: { ...dev, estado: "recibida" } }),
            });
          } catch (e) {
            console.error("Error campanita devolución recibida:", e);
          }
        }

        procesados++;
      } catch (devErr) {
        console.error(`Error procesando devolución ${dev.id}:`, devErr);
      }
    }

    return Response.json({
      ok: true,
      procesados,
      marcadasRecibidas,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error("Error cron devoluciones:", error);
    return Response.json({ ok: false, error: String(error) }, { status: 500 });
  }
}