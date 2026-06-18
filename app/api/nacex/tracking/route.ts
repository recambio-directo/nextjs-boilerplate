// app/api/nacex/tracking/route.ts
// Consulta el estado de un envío NACEX usando getEstadoExpedicion3
// (origen + albarán + código postal destino). Documentación:
// https://pda.nacex.com/nacex_ws

export async function POST(request: Request) {
  try {
    const { localizador, codigoPostalDestino } = await request.json();

    if (!localizador || !localizador.includes("/")) {
      return Response.json({ ok: false, error: "Falta localizador válido (formato agencia/albaran)" }, { status: 400 });
    }
    if (!codigoPostalDestino) {
      return Response.json({ ok: false, error: "Falta codigoPostalDestino" }, { status: 400 });
    }

    const [origen, albaran] = localizador.split("/");

    const baseUrl = "https://pda.nacex.com/nacex_ws/ws";
    const user = process.env.NACEX_USER || "";
    const pass = process.env.NACEX_PASS || "";

    const dataString = [
      `origen=${origen}`,
      `albaran=${albaran}`,
      `codigo_postal_destino=${codigoPostalDestino}`,
    ].join("|");

    const url = `${baseUrl}?method=getEstadoExpedicion3&user=${encodeURIComponent(user)}&pass=${encodeURIComponent(pass)}&data=${encodeURIComponent(dataString)}`;

    const response = await fetch(url, { method: "GET" });
    const rawText = await response.text();

    // Formato esperado:
    // 0: identificador único expedición
    // 1: fecha del estado (dd/mm/yyyy)
    // 2: hora del estado (hh:mm)
    // 3: observaciones del estado
    // 4: estado (OK, RECOGIDO, TRANSITO, REPARTO, INCIDENCIA)
    // 5: código del estado/incidencia
    // 6: código agencia origen
    // 7: número albarán
    // 8: horario concertado / última incidencia / fecha-hora objetivo entrega

    const partes = rawText.split("|");
    const estadoNacex = partes[4] || "";

    if (!estadoNacex) {
      console.error("NACEX getEstadoExpedicion3 sin estado reconocible:", rawText);
      return Response.json({
        ok: false,
        error: "NACEX no devolvió un estado reconocible",
        rawResponse: rawText,
      }, { status: 400 });
    }

    // Mapear estado NACEX -> estado interno RD (mismo patrón que MRW)
    function mapearEstado(estado: string): string {
      const e = estado.toUpperCase();
      if (e === "OK") return "entregado";
      if (e === "REPARTO" || e === "TRANSITO") return "enviado";
      if (e === "RECOGIDO") return "preparando";
      if (e === "INCIDENCIA") return "enviado"; // con incidencia, sigue en curso pero hay que revisar
      return "enviado";
    }

    const estadoRD = mapearEstado(estadoNacex);

    return Response.json({
      ok: true,
      localizador,
      estadoNacex,
      estadoRD,
      observaciones: partes[3] || "",
      fecha: partes[1] || "",
      hora: partes[2] || "",
      infoAdicional: partes[8] || "", // horario concertado / incidencia / fecha-hora objetivo
      esIncidencia: estadoNacex.toUpperCase() === "INCIDENCIA",
      rawResponse: rawText,
    });

  } catch (error) {
    console.error("Error NACEX tracking:", error);
    return Response.json({ ok: false, error: String(error) }, { status: 500 });
  }
}