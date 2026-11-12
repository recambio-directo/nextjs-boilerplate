// app/api/ctt/crear-envio/route.ts
import { NextRequest, NextResponse } from "next/server";
import {
  sbAdmin, cargarDatosEnvio, tieneEnvio, guardarPedido, subirEtiqueta,
  anotar, incidencia, fetchT, esperar, txt, hoyMadrid,
} from "@/app/lib/envios";

const supabase = sbAdmin();

const CTT_CLIENT_ID     = process.env.CTT_CLIENT_ID!;
const CTT_CLIENT_SECRET = process.env.CTT_CLIENT_SECRET!;
const CTT_USER          = process.env.CTT_USER!;
const CTT_PASSWORD      = process.env.CTT_PASSWORD!;
const CTT_CLIENT_CENTER = process.env.CTT_CLIENT_CENTER || "8032500001";
const CTT_BASE_URL      = "https://api.cttexpress.com"; // producción

// Cache del token en memoria — una petición al día como pide CTT
let cachedToken: string | null = null;
let tokenExpiresAt: number = 0;

async function getCTTToken(): Promise<string> {
  const ahora = Date.now();
  if (cachedToken && ahora < tokenExpiresAt - 300_000) return cachedToken;

  const params = new URLSearchParams({
    client_id:     CTT_CLIENT_ID,
    client_secret: CTT_CLIENT_SECRET,
    scope:         "urn:com:ctt-express:integration-clients:scopes:common/ALL",
    grant_type:    "client_credentials",
  });

  const res = await fetchT(`${CTT_BASE_URL}/integrations/oauth2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });

  if (!res.ok) throw new Error(`CTT token error ${res.status}: ${await res.text()}`);
  const data = await res.json();
  cachedToken = data.access_token;
  tokenExpiresAt = ahora + (data.expires_in || 86400) * 1000;
  return cachedToken!;
}

// Un intento de descarga de la etiqueta. CTT puede devolver PDF binario,
// PDF como texto, JSON con base64 o base64 directo.
async function pedirEtiquetaCTT(token: string, shippingCode: string): Promise<Buffer | null> {
  const labelRes = await fetchT(
    `${CTT_BASE_URL}/integrations/trf/labelling/v1.0/shippings/${shippingCode}/shipping-labels?label_type_code=PDF&model_type_code=SINGLE&label_offset=1`,
    {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`,
        "user_name":     CTT_USER,
        "password":      CTT_PASSWORD,
      },
    },
    7000
  );

  if (!labelRes.ok) {
    console.error("CTT etiqueta HTTP error:", labelRes.status, await labelRes.text().catch(() => ""));
    return null;
  }

  const contentType = labelRes.headers.get("content-type") || "";
  let pdfBuffer: Buffer | null = null;

  if (contentType.includes("application/pdf") || contentType.includes("octet-stream")) {
    pdfBuffer = Buffer.from(await labelRes.arrayBuffer());
  } else {
    const labelRaw = await labelRes.text();
    if (labelRaw.startsWith("%PDF")) {
      pdfBuffer = Buffer.from(labelRaw, "binary");
    } else {
      try {
        const labelData = JSON.parse(labelRaw);
        const base64 = labelData.data?.[0]?.label
          || labelData.labels?.[0]?.label_data
          || labelData.label_data
          || labelData.label
          || (Array.isArray(labelData) && labelData[0]?.label)
          || (Array.isArray(labelData) && labelData[0]?.label_data)
          || null;
        if (base64) pdfBuffer = Buffer.from(base64, "base64");
        else console.error("CTT etiqueta: JSON sin etiqueta. Claves:", JSON.stringify(Object.keys(labelData)).slice(0, 300));
      } catch {
        if (labelRaw.length > 100 && /^[A-Za-z0-9+/=\s]+$/.test(labelRaw.trim())) {
          pdfBuffer = Buffer.from(labelRaw.trim(), "base64");
        } else {
          console.error("CTT etiqueta: respuesta no reconocida:", labelRaw.substring(0, 300));
        }
      }
    }
  }

  return pdfBuffer && pdfBuffer.length > 100 ? pdfBuffer : null;
}

// Descarga la etiqueta con reintentos (CTT a veces tarda unos segundos en
// tenerla disponible tras grabar el envío) y la guarda en Storage.
async function obtenerEtiquetaCTT(token: string, shippingCode: string, pedidoId: unknown): Promise<string | null> {
  for (let intento = 1; intento <= 3; intento++) {
    try {
      const pdf = await pedirEtiquetaCTT(token, shippingCode);
      if (pdf) {
        const url = await subirEtiqueta(supabase, `etiquetas-ctt/${pedidoId}/${Date.now()}_etiqueta.pdf`, pdf);
        if (url) return url;
      }
    } catch (e) {
      console.error(`Error obteniendo etiqueta CTT (intento ${intento}):`, e);
    }
    if (intento < 3) await esperar(1500);
  }
  return null;
}

export async function POST(req: NextRequest) {
  let pedidoId: unknown = null;
  let codigo = "";
  try {
    const reqBody = await req.json();
    pedidoId = reqBody?.pedidoId;
    if (!pedidoId) return NextResponse.json({ ok: false, error: "pedidoId requerido" }, { status: 400 });

    const r = await cargarDatosEnvio(supabase, pedidoId, reqBody);
    if (!r.ok) {
      if (r.status !== 404) await incidencia(supabase, pedidoId, "", "CTT Express", r.error);
      return NextResponse.json({ ok: false, error: r.error }, { status: r.status });
    }
    const { pedido, remitente, destinatario, pesoKg, avisos } = r.datos;
    codigo = r.datos.codigo;

    // ── El pedido ya tiene envío CTT: no se duplica. Si falta la etiqueta, se reintenta.
    if (tieneEnvio(pedido, "ctt", pedido.tracking_ctt)) {
      const shippingCode = txt(pedido.tracking_ctt) || txt(pedido.tracking);
      let etiquetaUrl: string | null = txt(pedido.etiqueta_envio_url) || null;
      if (!etiquetaUrl) {
        etiquetaUrl = await obtenerEtiquetaCTT(await getCTTToken(), shippingCode, pedidoId);
        if (etiquetaUrl) await guardarPedido(supabase, pedidoId, { etiqueta_envio_url: etiquetaUrl });
      }
      return NextResponse.json({
        ok: true, yaExistia: true, shippingCode,
        trackingUrl: `https://www.cttexpress.com/localizador-de-envios/?sc=${shippingCode}`,
        etiquetaUrl,
      });
    }

    const productos = pedido.productos || [];
    const hoy = hoyMadrid();
    const fechaHoy = `${hoy.yyyy}-${hoy.mm}-${hoy.dd}`; // YYYY-MM-DD
    const kilos = Math.max(1, Math.ceil(pesoKg));
    const refs = productos.map((p: any) => p.referencia).join(", ").substring(0, 30);
    const nomDest = destinatario.nombre.substring(0, 40);

    const token = await getCTTToken();

    const body = {
      client_center_code:          CTT_CLIENT_CENTER,
      shipping_type_code:          "C24",
      client_bar_code:             "",
      client_references:           [codigo, ""],
      shipping_weight_declared:    kilos,
      item_count:                  1,
      sender_name:                 remitente.nombre.substring(0, 40),
      sender_country_code:         "ES",
      sender_postal_code:          remitente.cp,
      sender_address:              remitente.direccion.substring(0, 100),
      sender_town:                 remitente.poblacion.substring(0, 40),
      sender_email_notify_address: remitente.email || "info@recambio-directo.com",
      sender_phones:               [`+34 ${remitente.telefono}`, ""],
      recipient_name:              nomDest,
      recipient_country_code:      "ES",
      recipient_postal_code:       destinatario.cp,
      recipient_address:           destinatario.direccion.substring(0, 100),
      recipient_town:              destinatario.poblacion.substring(0, 40),
      recipient_email_notify_address: destinatario.email.substring(0, 75),
      recipient_phones:            [`+34 ${destinatario.telefono}`, ""],
      shipping_date:               fechaHoy,
      delivery: {
        contact_name:  nomDest,
        referral_name: "",
        comments:      `Pedido RD ${codigo}`,
      },
      items: [
        {
          item_synonym_code:     "",
          item_weight_declared:  kilos,
          item_length_declared:  30,
          item_width_declared:   20,
          item_height_declared:  15,
          item_comments:         refs,
        },
      ],
    };

    const res = await fetchT(`${CTT_BASE_URL}/integrations/manifest/v2.0/shippings`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
        "user_name":     CTT_USER,
        "password":      CTT_PASSWORD,
      },
      body: JSON.stringify(body),
    });

    const rawText = await res.text();
    if (!res.ok) {
      await incidencia(supabase, pedidoId, codigo, "CTT Express", `CTT rechazó el envío (HTTP ${res.status})`, rawText);
      return NextResponse.json({ ok: false, error: "Error CTT", raw: rawText }, { status: 400 });
    }

    let data: any = null;
    try { data = JSON.parse(rawText); } catch { data = null; }
    const shippingCode = txt(data?.shipping_data?.shipping_code || data?.shipping_code || data?.code || data?.id);

    if (!shippingCode) {
      await incidencia(supabase, pedidoId, codigo, "CTT Express", "CTT no devolvió código de envío", rawText);
      return NextResponse.json({ ok: false, error: "CTT no devolvió código de envío", raw: rawText.substring(0, 600) }, { status: 400 });
    }

    // Primero se guarda el envío (lo importante); después la etiqueta
    const trackingUrl = `https://www.cttexpress.com/localizador-de-envios/?sc=${shippingCode}`;
    const g1 = await guardarPedido(supabase, pedidoId, {
      tracking:     shippingCode,
      tracking_ctt: shippingCode,
      estado_envio: "preparando",
      agencia:      "CTT Express",
    });
    await anotar(supabase, pedidoId, `CTT OK — Envío ${shippingCode} — ${kilos} kg${avisos.length ? " — Avisos: " + avisos.join("; ") : ""}`);
    if (g1.error) await incidencia(supabase, pedidoId, codigo, "CTT Express", `Envío ${shippingCode} creado en CTT pero NO se pudo guardar en el pedido`, g1.error);

    const etiquetaUrl = await obtenerEtiquetaCTT(token, shippingCode, pedidoId);
    if (etiquetaUrl) {
      const g2 = await guardarPedido(supabase, pedidoId, { etiqueta_envio_url: etiquetaUrl });
      if (g2.error) await incidencia(supabase, pedidoId, codigo, "CTT Express", `Etiqueta del envío ${shippingCode} generada pero no guardada en el pedido`, `${g2.error} — ${etiquetaUrl}`);
    } else {
      await incidencia(supabase, pedidoId, codigo, "CTT Express", `Envío ${shippingCode} creado pero CTT no devolvió la etiqueta tras 3 intentos`);
    }

    return NextResponse.json({ ok: true, shippingCode, trackingUrl, etiquetaUrl });

  } catch (e: any) {
    console.error("Error crear envío CTT:", e);
    await incidencia(supabase, pedidoId, codigo, "CTT Express", "Error inesperado al crear el envío", String(e?.message || e));
    return NextResponse.json({ ok: false, error: e?.message || String(e) }, { status: 500 });
  }
}
