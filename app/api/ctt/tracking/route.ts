// app/api/ctt/tracking/route.ts
import { NextRequest, NextResponse } from "next/server";

const CTT_CLIENT_ID     = process.env.CTT_CLIENT_ID!;
const CTT_CLIENT_SECRET = process.env.CTT_CLIENT_SECRET!;
const CTT_USER          = process.env.CTT_USER!;
const CTT_PASSWORD      = process.env.CTT_PASSWORD!;
const CTT_BASE_URL      = "https://api-test.cttexpress.com"; // cambiar a https://api.cttexpress.com en producción

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

    // Tracking URL pública para el taller
    const trackingUrl = `https://www.cttexpress.com/localizador-de-envios/?sc=${shippingCode}`;

    return NextResponse.json({
      ok:          true,
      shippingCode,
      trackingUrl,
      data,
    });

  } catch (e: any) {
    console.error("Error tracking CTT:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}