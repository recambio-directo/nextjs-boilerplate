// app/api/ctt/crear-envio/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const CTT_CLIENT_ID     = process.env.CTT_CLIENT_ID!;
const CTT_CLIENT_SECRET = process.env.CTT_CLIENT_SECRET!;
const CTT_USER          = process.env.CTT_USER!;
const CTT_PASSWORD      = process.env.CTT_PASSWORD!;
const CTT_CLIENT_CENTER = process.env.CTT_CLIENT_CENTER || "8032500001";
const CTT_BASE_URL      = "https://api-test.cttexpress.com"; // cambiar a https://api.cttexpress.com en producción

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

  const res = await fetch(`${CTT_BASE_URL}/integrations/oauth2/token`, {
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

export async function POST(req: NextRequest) {
  try {
    const { pedidoId } = await req.json();
    if (!pedidoId) return NextResponse.json({ error: "pedidoId requerido" }, { status: 400 });

    const { data: pedido, error } = await supabase
      .from("pedidos")
      .select("*")
      .eq("id", pedidoId)
      .single();

    if (error || !pedido) return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 });

    // Datos del proveedor (remitente)
    let nomRte = "RECAMBIO DIRECTO";
    let dirRte = "C/ Sola, 16";
    let pobRte = "Cehegín";
    let cpRte  = "30430";
    let tlfRte = "744487895";
    let emailRte = "info@recambio-directo.com";

    const productos = pedido.productos || [];
    if (productos.length > 0 && productos[0].proveedor_id) {
      const { data: prov } = await supabase
        .from("usuarios")
        .select("nombre_empresa, direccion, ciudad, codigo_postal, telefono, email")
        .eq("id", productos[0].proveedor_id)
        .single();
      if (prov) {
        nomRte   = prov.nombre_empresa || nomRte;
        dirRte   = prov.direccion || dirRte;
        pobRte   = prov.ciudad || pobRte;
        cpRte    = prov.codigo_postal || cpRte;
        tlfRte   = prov.telefono || tlfRte;
        emailRte = prov.email || emailRte;
      }
    }

    // Datos del taller (destinatario)
    const nomDest   = (pedido.cliente_nombre || pedido.cliente_email || "CLIENTE").substring(0, 40);
    const dirDest   = (pedido.direccion_envio || pedido.cliente_direccion || "VER PEDIDO").substring(0, 100);
    const pobDest   = (pedido.ciudad_envio || pedido.cliente_ciudad || "ESPAÑA").substring(0, 40);
    const cpDest    = (pedido.cp_envio || pedido.cliente_cp || "28001").replace(/\D/g, "").substring(0, 10);
    const tlfDest   = (pedido.telefono_envio || pedido.cliente_telefono || "600000000").replace(/\D/g, "");
    const emailDest = (pedido.cliente_email || "").substring(0, 75);

    const fechaHoy = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
    const kilos = Math.max(1, productos.length * 2);
    const refs = productos.map((p: any) => p.referencia).join(", ").substring(0, 30);

    const token = await getCTTToken();

    const body = {
      client_center_code:          CTT_CLIENT_CENTER,
      shipping_type_code:          "C24",
      client_bar_code:             "",
      client_references:           [`RD-${pedido.codigo || pedidoId}`, ""],
      shipping_weight_declared:    kilos,
      item_count:                  1,
      sender_name:                 nomRte.substring(0, 40),
      sender_country_code:         "ES",
      sender_postal_code:          cpRte,
      sender_address:              dirRte.substring(0, 100),
      sender_town:                 pobRte.substring(0, 40),
      sender_email_notify_address: emailRte,
      sender_phones:               [`+34 ${tlfRte}`, ""],
      recipient_name:              nomDest,
      recipient_country_code:      "ES",
      recipient_postal_code:       cpDest,
      recipient_address:           dirDest,
      recipient_town:              pobDest,
      recipient_email_notify_address: emailDest,
      recipient_phones:            [tlfDest ? `+34 ${tlfDest}` : "", ""],
      shipping_date:               fechaHoy,
      delivery: {
        contact_name:  nomDest,
        referral_name: "",
        comments:      `Pedido RD ${pedido.codigo || pedidoId}`,
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

    const res = await fetch(`${CTT_BASE_URL}/integrations/manifest/v2.0/shippings`, {
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
      console.error("CTT crear envío error:", rawText);
      return NextResponse.json({ error: "Error CTT", raw: rawText }, { status: 400 });
    }

    const data = JSON.parse(rawText);
    const shippingCode = data.shipping_data?.shipping_code || data.shipping_code || data.code || data.id || "";

    if (!shippingCode) {
      console.error("CTT no devolvió shipping_code:", data);
      return NextResponse.json({ error: "CTT no devolvió código de envío", raw: data }, { status: 400 });
    }

    // Obtener etiqueta PDF
    let etiquetaUrl: string | null = null;
    try {
      const labelRes = await fetch(
        `${CTT_BASE_URL}/integrations/trf/labelling/v1.0/shippings/${shippingCode}/shipping-labels?label_type_code=PDF&model_type_code=SINGLE&label_offset=1`,
        {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${token}`,
            "user_name":     CTT_USER,
            "password":      CTT_PASSWORD,
          },
        }
      );

      if (labelRes.ok) {
        const labelData = await labelRes.json();
        const base64 = labelData.labels?.[0]?.label_data || labelData.label_data || null;
        if (base64) {
          const pdfBuffer = Buffer.from(base64, "base64");
          const path = `etiquetas-ctt/${pedidoId}/${Date.now()}_etiqueta.pdf`;
          const { error: uploadErr } = await supabase.storage
            .from("FACTURAS")
            .upload(path, pdfBuffer, { contentType: "application/pdf" });
          if (!uploadErr) {
            const { data: urlData } = supabase.storage.from("FACTURAS").getPublicUrl(path);
            etiquetaUrl = urlData.publicUrl;
          }
        }
      }
    } catch (e) {
      console.error("Error obteniendo etiqueta CTT:", e);
    }

    // Tracking URL para el taller
    const trackingUrl = `https://www.cttexpress.com/localizador-de-envios/?sc=${shippingCode}`;

    // Actualizar pedido
    await supabase.from("pedidos").update({
      tracking:              shippingCode,
      tracking_ctt:          shippingCode,
      etiqueta_envio_url:    etiquetaUrl,
      estado_envio:          "preparando",
      agencia:               "CTT Express",
    }).eq("id", pedidoId);

    return NextResponse.json({
      ok:          true,
      shippingCode,
      trackingUrl,
      etiquetaUrl,
    });

  } catch (e: any) {
    console.error("Error crear envío CTT:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}