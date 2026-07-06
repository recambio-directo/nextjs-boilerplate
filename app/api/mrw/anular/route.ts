// app/api/mrw/anular/route.ts
export async function POST(request: Request) {
  try {
    const { numeroEnvio } = await request.json();
    if (!numeroEnvio) {
      return Response.json({ ok: false, error: "Falta numeroEnvio" }, { status: 400 });
    }

    const usuario          = process.env.MRW_USUARIO           || "";
    const password         = process.env.MRW_PASSWORD           || "";
    const codigoFranquicia = process.env.MRW_CODIGO_FRANQUICIA  || "";
    const abonado          = process.env.MRW_ABONADO            || "";
    const departamento     = process.env.MRW_DEPARTAMENTO       || "";
    const targetUrl        = process.env.MRW_ENTORNO === "production"
      ? "https://sagec.mrw.es/MRWEnvio.asmx"
      : "https://sagec-test.mrw.es/MRWEnvio.asmx";

    const proxyUrl = "http://168.231.83.226:3000";

    const soap = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
               xmlns:xsd="http://www.w3.org/2001/XMLSchema"
               xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Header>
    <AuthInfo xmlns="http://www.mrw.es/">
      <CodigoFranquicia>${codigoFranquicia}</CodigoFranquicia>
      <CodigoAbonado>${abonado}</CodigoAbonado>
      <CodigoDepartamento>${departamento}</CodigoDepartamento>
      <UserName>${usuario}</UserName>
      <Password>${password}</Password>
    </AuthInfo>
  </soap:Header>
  <soap:Body>
    <CancelarEnvio xmlns="http://www.mrw.es/">
      <request>
        <CancelaEnvio>
          <NumeroEnvioOriginal>${numeroEnvio}</NumeroEnvioOriginal>
        </CancelaEnvio>
      </request>
    </CancelarEnvio>
  </soap:Body>
</soap:Envelope>`;

    const res = await fetch(proxyUrl, {
      method: "POST",
      headers: {
        "Content-Type":   "text/xml; charset=utf-8",
        "SOAPAction":     "http://www.mrw.es/CancelarEnvio",
        "x-proxy-secret": "rd-mrw-proxy-2026",
        "x-target-url":   targetUrl,
      },
      body: soap,
    });

    const rawText = await res.text();
    console.log("MRW cancelar response:", rawText.substring(0, 500));

    // MRW devuelve <Estado>1</Estado> si ok
    const estadoMatch = rawText.match(/<Estado>(\d+)<\/Estado>/);
    const ok = estadoMatch?.[1] === "1";
    const mensaje = rawText.match(/<Mensaje>(.*?)<\/Mensaje>/)?.[1] || "";

    return Response.json({ ok, numeroEnvio, mensaje, rawResponse: rawText.substring(0, 500) });

  } catch (error) {
    console.error("Error MRW cancelar:", error);
    return Response.json({ ok: false, error: String(error) }, { status: 500 });
  }
}