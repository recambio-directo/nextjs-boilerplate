// app/api/ctt/tracking/route.ts
// Consulta el historial de un envío CTT Express y lo traduce al estado de RD.
// Según el manual "API Get Shipping Tracking v2.0" de CTT:
//   GET https://api.cttexpress.com/integrations-info/trf/item-history-api/history/{shippingCode}?view=APITRACK&showItems=false
//   Respuesta: { data: { shipping_code, shipping_history: { events: [ { code, description, type, event_date, detail } ] }, delivery_date, ... } }
// Códigos de estado (STATUS_INCIDENTS_MANAGEMENTS.xlsx): 2100 = ENTREGADO, 3000 = ANULADO, 0000/0010/0300 = grabado/recogida asignada…
import { NextRequest, NextResponse } from "next/server";
import { soloInternoOAdmin } from "@/app/lib/seguridad";

const CTT_CLIENT_ID     = process.env.CTT_CLIENT_ID!;
const CTT_CLIENT_SECRET = process.env.CTT_CLIENT_SECRET!;
const CTT_USER          = process.env.CTT_USER!;
const CTT_PASSWORD      = process.env.CTT_PASSWORD!;
const CTT_BASE_URL      = "https://api.cttexpress.com";

// Ruta oficial del manual primero; la antigua como respaldo
const RUTAS_HISTORIAL = [
  "/integrations-info/trf/item-history-api/history/",
  "/integrations/trf/item-history-api/history/",
];

let cachedToken: string | null = null;
let tokenExpiresAt = 0;

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
    cache: "no-store",
  });

  if (!res.ok) throw new Error(`CTT token error ${res.status}`);
  const data = await res.json();
  cachedToken = data.access_token;
  tokenExpiresAt = ahora + (data.expires_in || 86400) * 1000;
  return cachedToken!;
}

type EventoCTT = { code?: string; description?: string; type?: string; event_date?: string; detail?: any };

/** Saca la lista de eventos venga como venga la respuesta */
function extraerEventos(data: any): EventoCTT[] {
  const candidatos = [
    data?.data?.shipping_history?.events,
    data?.shipping_history?.events,
    data?.data?.events,
    data?.events,
  ];
  for (const c of candidatos) if (Array.isArray(c)) return c;
  return [];
}

/**
 * Traduce el historial CTT a estado RD.
 * Devuelve null si no hay información o si el envío está anulado (no se toca el pedido).
 */
function mapearEstado(eventos: EventoCTT[], data: any): { estadoRD: string | null; ultimo: EventoCTT | null } {
  const estados = eventos
    .filter((e) => (e.type || "STATUS").toUpperCase() === "STATUS" && e.code)
    .sort((a, b) => new Date(a.event_date || 0).getTime() - new Date(b.event_date || 0).getTime());

  const ultimo = estados[estados.length - 1] || null;

  // Entregado si cualquier evento de estado es 2100 (ENTREGADO / DELIVERED)
  const entregado = estados.some((e) => String(e.code) === "2100" || /^(delivered|entregado)$/i.test((e.description || "").trim()));
  if (entregado) return { estadoRD: "entregado", ultimo };

  if (!ultimo) return { estadoRD: null, ultimo: null };

  const code = String(ultimo.code);
  if (code === "3000") return { estadoRD: null, ultimo };                           // anulado en CTT → no tocar
  if (["0000", "0010", "0020", "0300"].includes(code)) return { estadoRD: "preparando", ultimo }; // grabado / pendiente de recogida
  return { estadoRD: "enviado", ultimo };                                            // recogido, en tránsito, en reparto, reparto fallido…
}

async function consultarHistorial(shippingCode: string, token: string) {
  let ultimoError = "";
  for (const ruta of RUTAS_HISTORIAL) {
    const res = await fetch(
      `${CTT_BASE_URL}${ruta}${encodeURIComponent(shippingCode)}?view=APITRACK&showItems=false`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          user_name: CTT_USER,
          password: CTT_PASSWORD,
        },
        cache: "no-store",
      }
    );
    const rawText = await res.text();
    if (res.ok) {
      try { return { ok: true as const, data: JSON.parse(rawText), ruta }; }
      catch { ultimoError = `Respuesta no JSON (${ruta}): ${rawText.slice(0, 200)}`; continue; }
    }
    ultimoError = `HTTP ${res.status} (${ruta}): ${rawText.slice(0, 200)}`;
  }
  return { ok: false as const, error: ultimoError };
}

export async function POST(req: NextRequest) {
  { const sinAcceso = await soloInternoOAdmin(req); if (sinAcceso) return sinAcceso; }
  try {
    const { shippingCode } = await req.json();
    if (!shippingCode) return NextResponse.json({ error: "shippingCode requerido" }, { status: 400 });

    const codigo = String(shippingCode).trim();
    let token = await getCTTToken();
    let resp = await consultarHistorial(codigo, token);

    // Token caducado o rechazado → pedir uno nuevo y reintentar una vez
    if (!resp.ok && /HTTP 401|HTTP 403/.test(resp.error)) {
      cachedToken = null;
      token = await getCTTToken();
      resp = await consultarHistorial(codigo, token);
    }

    if (!resp.ok) {
      console.error(`CTT tracking ${codigo}: ${resp.error}`);
      return NextResponse.json({ ok: false, error: "CTT tracking error", detalle: resp.error }, { status: 400 });
    }

    const eventos = extraerEventos(resp.data);
    const { estadoRD, ultimo } = mapearEstado(eventos, resp.data);

    console.log(`CTT tracking ${codigo}: ${eventos.length} eventos, último=${ultimo?.code} ${ultimo?.description || ""} → ${estadoRD ?? "sin cambio"}`);

    return NextResponse.json({
      ok: estadoRD !== null,
      shippingCode: codigo,
      estadoRD,
      ultimoEstadoCTT: ultimo ? { code: ultimo.code, description: ultimo.description, fecha: ultimo.event_date } : null,
      fechaEntrega: resp.data?.data?.delivery_date || resp.data?.delivery_date || null,
      trackingUrl: `https://www.cttexpress.com/localizador-de-envios/?sc=${codigo}`,
      data: resp.data,
    });

  } catch (e: any) {
    console.error("Error tracking CTT:", e);
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
