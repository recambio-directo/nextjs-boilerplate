// app/api/ctt/tracking/route.ts
import { NextRequest, NextResponse } from "next/server";

const CTT_CLIENT_ID     = process.env.CTT_CLIENT_ID!;
const CTT_CLIENT_SECRET = process.env.CTT_CLIENT_SECRET!;
const CTT_USER          = process.env.CTT_USER!;
const CTT_PASSWORD      = process.env.CTT_PASSWORD!;
const CTT_BASE_URL      = "https://api.cttexpress.com";

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

  if (!res.ok) throw new Error(`CTT token error ${res.status}`);
  const data = await res.json();
  cachedToken = data.access_token;
  tokenExpiresAt = ahora + (data.expires_in || 86400) * 1000;
  return cachedToken!;
}

// Mapear estado CTT a estado interno RD
function mapearEstado(eventos: any[]): string {
  if (!eventos || eventos.length === 0) return "preparando";

  for (const evento of eventos) {
    const desc = (evento.eventDescription || evento.description || evento.statusDescription || "").toLowerCase();
    const code = (evento.eventCode || evento.statusCode || evento.code || "").toUpperCase();

    // Entregado
    if (desc.includes("entregado") || desc.includes("entrega realizada") || desc.includes("delivered") ||
        code === "H02" || code === "H01" || code.startsWith("I")) {
      return "entregado";
    }
  }

  for (const evento of eventos) {
    const desc = (evento.eventDescription || evento.description || evento.statusDescription || "").toLowerCase();
    const code = (evento.eventCode || evento.statusCode || evento.code || "").toUpperCase();

    // En tránsito
    if (desc.includes("tránsito") || desc.includes("transito") || desc.includes("reparto") ||
        desc.includes("clasificación") || desc.includes("salida") || desc.includes("llegada") ||
        desc.includes("en ruta") || desc.includes("camino") ||
        code.startsWith("C") || code.startsWith("D") || code.startsWith("E") || code.startsWith("G")) {
      return "enviado";
    }
  }

  for (const evento of eventos) {
    const desc = (evento.eventDescription || evento.description || evento.statusDescription || "").toLowerCase();

    if (desc.includes("recogido") || desc.includes("recogida") || desc.includes("admitido") ||
        desc.includes("pre-registro") || desc.includes("registro")) {
      return "enviado";
    }
  }

  return "preparando";
}

export async function POST(req: NextRequest) {
  try {
    const { shippingCode } = await req.json();
    if (!shippingCode) return NextResponse.json({ error: "shippingCode requerido" }, { status: 400 });

    const token = await getCTTToken();

    const res = await fetch(
      `${CTT_BASE_URL}/integrations/trf/item-history-api/history/${shippingCode}?view=APITRACK&showItems=false`,
      {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
          "user_name":     CTT_USER,
          "password":      CTT_PASSWORD,
        },
      }
    );

    const rawText = await res.text();
    if (!res.ok) {
      return NextResponse.json({ error: "CTT tracking error", raw: rawText }, { status: 400 });
    }

    const data = JSON.parse(rawText);

    // Extraer eventos del historial
    const eventos = data.events || data.history || data.trackingEvents || [];
    const estadoRD = mapearEstado(Array.isArray(eventos) ? eventos : []);

    const trackingUrl = `https://www.cttexpress.com/localizador-de-envios/?sc=${shippingCode}`;

    return NextResponse.json({
      ok:          true,
      shippingCode,
      estadoRD,
      trackingUrl,
      data,
    });

  } catch (e: any) {
    console.error("Error tracking CTT:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
