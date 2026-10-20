// app/api/gls/tracking/route.ts
import { NextRequest, NextResponse } from "next/server";

const GLS_URL  = "https://ws-customer.gls-spain.es/b2b.asmx";
const GLS_GUID = process.env.GLS_GUID || "fd2252c2-f36a-4e26-a2d7-b7ec0167fce7";

// Mapear codEstado GLS a estado interno RD
// GLS Spain: 0=sin info, 1=grabado, 2=en tránsito, 3=en reparto, 7=entregado, 8=incidencia
function mapearEstado(codEstado: string | null): string {
  if (!codEstado) return "preparando";
  const cod = codEstado.trim();
  if (cod === "7") return "entregado";
  if (["2", "3", "5", "6"].includes(cod)) return "enviado";
  if (["0", "1"].includes(cod)) return "preparando";
  return "enviado"; // incidencia u otro = sigue en tránsito
}

export async function POST(req: NextRequest) {
  try {
    const { codbarras } = await req.json();
    if (!codbarras) return NextResponse.json({ error: "codbarras requerido" }, { status: 400 });

    const xml = `<?xml version="1.0" encoding="utf-8"?>
<soap12:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
                 xmlns:xsd="http://www.w3.org/2001/XMLSchema"
                 xmlns:soap12="http://www.w3.org/2003/05/soap-envelope">
  <soap12:Body>
    <GetExpCli xmlns="http://www.asmred.com/">
      <codigo>${codbarras}</codigo>
      <uid>${GLS_GUID}</uid>
    </GetExpCli>
  </soap12:Body>
</soap12:Envelope>`;

    const res = await fetch(`${GLS_URL}?op=GetExpCli`, {
      method: "POST",
      headers: { "Content-Type": "text/xml; charset=UTF-8" },
      body: xml,
    });

    const rawText = await res.text();

    const codEstadoMatch = rawText.match(/<codestado>([\s\S]*?)<\/codestado>/);
    const codEstado = codEstadoMatch?.[1]?.trim() || null;

    const estadoRD = mapearEstado(codEstado);

    const trackingUrl = `https://mygls.gls-spain.es/es/seguimiento?referencia=${codbarras}`;

    return NextResponse.json({
      ok: true,
      codbarras,
      codEstado,
      estadoRD,
      trackingUrl,
      raw: rawText.substring(0, 600),
    });

  } catch (e: any) {
    console.error("Error tracking GLS:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
