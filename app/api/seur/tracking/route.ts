// app/api/seur/tracking/route.ts
// Consulta el estado de una recogida/envío SEUR

// Reutiliza la misma cache de token que crear-envio
// En Next.js cada route.ts tiene su propio módulo, así que duplicamos
// la lógica del token aquí también (es pequeña)

let cachedToken: string | null = null;
let tokenExpiresAt: number = 0;

async function getSeurToken(): Promise<string> {
  const ahora = Date.now();
  if (cachedToken && ahora < tokenExpiresAt - 300_000) return cachedToken;

  const params = new URLSearchParams({
    grant_type: "password",
    client_id: process.env.SEUR_CLIENT_ID || "",
    client_secret: process.env.SEUR_CLIENT_SECRET || "",
    username: process.env.SEUR_USERNAME || "",
    password: process.env.SEUR_PASSWORD || "",
  });

  const res = await fetch("https://servicios.api.seur.io/pic_token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });

  if (!res.ok) throw new Error(`SEUR token error ${res.status}`);
  const data = await res.json();
  cachedToken = data.access_token;
  tokenExpiresAt = ahora + (data.expires_in || 7200) * 1000;
  return cachedToken!;
}

// Mapear estados SEUR → estados internos RD
function mapearEstado(situaciones: any[]): string {
  if (!situaciones || situaciones.length === 0) return "enviado";
  // Tomar el último estado
  const ultimo = situaciones[situaciones.length - 1];
  const desc = (ultimo.description || ultimo.situationDescription || "").toLowerCase();
  const code = String(ultimo.situationCode || ultimo.code || "");

  if (desc.includes("entregad") || desc.includes("delivered") || code === "101") return "entregado";
  if (desc.includes("repartid") || desc.includes("salida reparto") || code === "400") return "enviado";
  if (desc.includes("recogid") || desc.includes("en tr") || code === "200") return "preparando";
  if (desc.includes("incidencia") || desc.includes("intento")) return "enviado";
  return "enviado";
}

export async function POST(request: Request) {
  try {
    const { collectionRef, referencia } = await request.json();

    if (!collectionRef && !referencia) {
      return Response.json({ ok: false, error: "Falta collectionRef o referencia" }, { status: 400 });
    }

    const token = await getSeurToken();

    // Buscar por referencia del pedido (más fiable que el collectionRef para seguimiento)
    const ref = referencia || collectionRef;
    const refType = referencia ? "REFERENCE" : "COLLECTION_REF";

    const url = `https://servicios.api.seur.io/pic/v1/tracking-services/extended?refType=${refType}&businessUnit=30&ref=${encodeURIComponent(ref)}`;

    const res = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
    });

    const rawText = await res.text();
    console.log("SEUR tracking response:", rawText.substring(0, 300));

    if (!res.ok) {
      return Response.json({ ok: false, error: `SEUR tracking error ${res.status}`, rawResponse: rawText }, { status: 400 });
    }

    const data = JSON.parse(rawText);

    // La respuesta puede ser array o objeto con expeditions
    const expeditions = data.expeditions || data.expedition || (Array.isArray(data) ? data : [data]);
    const expedicion = expeditions[0] || {};
    const situaciones = expedicion.situations || expedicion.situationList || [];

    const estadoRD = mapearEstado(situaciones);
    const ultimaSituacion = situaciones[situaciones.length - 1] || {};

    return Response.json({
      ok: true,
      collectionRef,
      referencia: ref,
      estadoSeur: ultimaSituacion.description || ultimaSituacion.situationDescription || "",
      estadoRD,
      fecha: ultimaSituacion.date || ultimaSituacion.situationDate || "",
      hora: ultimaSituacion.time || ultimaSituacion.situationTime || "",
      esIncidencia: (ultimaSituacion.description || "").toLowerCase().includes("incidencia"),
      rawResponse: rawText,
    });

  } catch (error) {
    console.error("Error SEUR tracking:", error);
    return Response.json({ ok: false, error: String(error) }, { status: 500 });
  }
}