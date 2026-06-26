// app/api/gls/anular/route.ts
import { NextRequest, NextResponse } from "next/server";

const GLS_URL  = "https://ws-customer.gls-spain.es/b2b.asmx";
const GLS_GUID = process.env.GLS_GUID || "fd2252c2-f36a-4e26-a2d7-b7ec0167fce7";

export async function POST(req: NextRequest) {
  try {
    const { codbarras } = await req.json();
    if (!codbarras) return NextResponse.json({ error: "codbarras requerido" }, { status: 400 });

    // GLS anula mediante delete_insert con el código a anular
    const xml = `<?xml version="1.0" encoding="utf-8"?>
<soap12:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
                 xmlns:xsd="http://www.w3.org/2001/XMLSchema"
                 xmlns:soap12="http://www.w3.org/2003/05/soap-envelope">
  <soap12:Body>
    <GrabaServicios xmlns="http://www.asmred.com/">
      <docIn>
        <Servicios uidcliente="${GLS_GUID}">
          <Envio action="delete" codigoAnular="${codbarras}">
          </Envio>
        </Servicios>
      </docIn>
    </GrabaServicios>
  </soap12:Body>
</soap12:Envelope>`;

    const res = await fetch(GLS_URL, {
      method: "POST",
      headers: { "Content-Type": "text/xml; charset=UTF-8" },
      body: xml,
    });

    const rawText = await res.text();
    console.log("GLS anular response:", rawText.substring(0, 300));

    const retornoMatch = rawText.match(/return="([^"]+)"/);
    const retorno = retornoMatch?.[1] || null;
    const ok = retorno === "0";

    const errorMatch = rawText.match(/<Error[^>]*>([\s\S]*?)<\/Error>/);

    return NextResponse.json({
      ok,
      codbarras,
      retorno,
      glsError: errorMatch?.[1] || null,
      rawResponse: rawText.substring(0, 300),
    });

  } catch (e: any) {
    console.error("Error anular GLS:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}