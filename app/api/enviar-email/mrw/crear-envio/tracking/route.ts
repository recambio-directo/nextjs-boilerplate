// app/api/mrw/tracking/route.ts
// Consulta el estado de un envío MRW por número de envío

export async function POST(request: Request) {
  try {
    const { numeroEnvio } = await request.json();
    if (!numeroEnvio) return Response.json({ ok: false, error: "Falta numeroEnvio" }, { status: 400 });

    const entorno = process.env.MRW_ENTORNO === "test"
      ? "https://sagec-test.mrw.es/MRWEnvio.asmx"
      : "https://sagec.mrw.es/MRWEnvio.asmx";

    const franquicia = process.env.MRW_FRANQUICIA || "";
    const abonado = process.env.MRW_ABONADO || "";
    const departamento = process.env.MRW_DEPARTAMENTO || "";
    const username = process.env.MRW_USERNAME || "";
    const password = process.env.MRW_PASSWORD || "";

    const soapBody = `<?xml version="1.0" encoding="utf-8"?>
<soap12:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
                 xmlns:xsd="http://www.w3.org/2001/XMLSchema"
                 xmlns:soap12="http://www.w3.org/2003/05/soap-envelope">
  <soap12:Body>
    <SeguimientoEnvio xmlns="http://www.mrw.es/">
      <AuthInfo>
        <CodigoFranquicia>${franquicia}</CodigoFranquicia>
        <CodigoAbonado>${abonado}</CodigoAbonado>
        <CodigoDepartamento>${departamento}</CodigoDepartamento>
        <UserName>${username}</UserName>
        <Password>${password}</Password>
      </AuthInfo>
      <NumeroEnvio>${numeroEnvio}</NumeroEnvio>
    </SeguimientoEnvio>
  </soap12:Body>
</soap12:Envelope>`;

    const response = await fetch(entorno, {
      method: "POST",
      headers: {
        "Content-Type": "application/soap+xml; charset=utf-8",
        "SOAPAction": "http://www.mrw.es/SeguimientoEnvio",
      },
      body: soapBody,
    });

    const xmlText = await response.text();

    // Extraer estado del envío
    const estadoMRW = xmlText.match(/<Estado>(.*?)<\/Estado>/)?.[1] || "";
    const descripcion = xmlText.match(/<Descripcion>(.*?)<\/Descripcion>/)?.[1] || "";
    const fecha = xmlText.match(/<Fecha>(.*?)<\/Fecha>/)?.[1] || "";

    // Mapear estado MRW a estado interno RD
    function mapearEstado(estadoMRW: string, descripcion: string): string {
      const desc = (descripcion || estadoMRW || "").toLowerCase();
      if (desc.includes("entregado") || desc.includes("entrega") && desc.includes("ok")) return "entregado";
      if (desc.includes("tránsito") || desc.includes("transito") || desc.includes("ruta") || desc.includes("salida")) return "enviado";
      if (desc.includes("recogido") || desc.includes("recogida") || desc.includes("almacén")) return "preparando";
      return "enviado"; // por defecto si hay movimiento
    }

    const estadoRD = mapearEstado(estadoMRW, descripcion);

    return Response.json({
      ok: true,
      numeroEnvio,
      estadoMRW,
      estadoRD,
      descripcion,
      fecha,
    });

  } catch (error) {
    console.error("Error MRW tracking:", error);
    return Response.json({ ok: false, error: String(error) }, { status: 500 });
  }
}