// app/api/mrw/anular/route.ts
export async function POST(request: Request) {
  try {
    const { numeroEnvio } = await request.json();
    if (!numeroEnvio) {
      return Response.json({ ok: false, error: "Falta numeroEnvio" }, { status: 400 });
    }

    const usuario         = process.env.MRW_USUARIO           || "";
    const password        = process.env.MRW_PASSWORD           || "";
    const codigoFranquicia = process.env.MRW_CODIGO_FRANQUICIA || "";
    const abonado         = process.env.MRW_ABONADO            || "";
    const targetUrl       = process.env.MRW_ENTORNO === "production"
      ? "https://sagec.mrw.es/MRWEnvio.asmx"
      : "https://sagec-test.mrw.es/MRWEnvio.asmx";

    const proxyUrl = "http://168.231.83.226:3000";

    const soap = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <AnularEnvio xmlns="http://www.mrw.es/">
      <ServiceParameters>
        <CodigoFranquicia>${codigoFranquicia}</CodigoFranquicia>
        <CodigoAbonado>${abonado}</CodigoAbonado>
        <CodigoUsuario>${usuario}</CodigoUsuario>
        <CodigoPassword>${password}</CodigoPassword>
        <NumeroEnvio>${numeroEnvio}</NumeroEnvio>
      </ServiceParameters>
    </AnularEnvio>
  </soap:Body>
</soap:Envelope>`;

    const res = await fetch(proxyUrl, {
      method: "POST",
      headers: {
        "Content-Type": "text/xml; charset=utf-8",
        "SOAPAction": "http://www.mrw.es/AnularEnvio",
        "x-proxy-secret": "rd-mrw-proxy-2026",
        "x-target-url": targetUrl,
      },
      body: soap,
    });

    const rawText = await res.text();
    console.log("MRW anular response:", rawText.substring(0, 400));

    const estadoMatch = rawText.match(/<Estado>(\d)<\/Estado>/);
    const ok = estadoMatch?.[1] === "1";
    const mensaje = rawText.match(/<Mensaje>(.*?)<\/Mensaje>/)?.[1] || "";

    return Response.json({ ok, numeroEnvio, mensaje, rawResponse: rawText.substring(0, 400) });

  } catch (error) {
    console.error("Error MRW anular:", error);
    return Response.json({ ok: false, error: String(error) }, { status: 500 });
  }
}