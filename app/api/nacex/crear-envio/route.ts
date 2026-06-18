// app/api/nacex/crear-envio/route.ts
// Crea un envío en NACEX vía su Web Service REST (GET con parámetros pipe-separated)
// Documentación: https://pda.nacex.com/nacex_ws

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      // Datos del pedido
      pedidoId,
      pedidoCodigo,
      // Datos de recogida (proveedor — quien envía). Opcionales: si no se
      // informan, NACEX usa los datos de la delegación/abonado por defecto.
      remitenteNombre,
      remitenteDireccion,
      remitenteCodigoPostal,
      remitentePoblacion,
      remitenteTelefono,
      // Datos de entrega (cliente — quien recibe)
      destinatarioNombre,
      destinatarioDireccion,
      destinatarioCodigoPostal,
      destinatarioPoblacion,
      destinatarioTelefono,
      destinatarioEmail,
      // Datos del envío
      pesoKg = 1,
      numBultos = 1,
      observaciones = "",
    } = body;

    if (!destinatarioNombre || !destinatarioDireccion || !destinatarioCodigoPostal || !destinatarioPoblacion) {
      return Response.json({ ok: false, error: "Faltan datos obligatorios de entrega" }, { status: 400 });
    }

    const baseUrl = "https://pda.nacex.com/nacex_ws/ws";
    const user = process.env.NACEX_USER || "";
    const pass = process.env.NACEX_PASS || ""; // ya en formato MD5, tal como lo entrega NACEX

    const delCli = process.env.NACEX_DEL_CLI || ""; // delegación de cliente (agencia)
    const numCli = process.env.NACEX_NUM_CLI || ""; // nº abonado
    const tipSer = process.env.NACEX_TIP_SER || "08"; // código de servicio contratado
    const tipCob = process.env.NACEX_TIP_COB || "O";  // código de cobro contratado
    const tipEnv = process.env.NACEX_TIP_ENV || "2";  // código de envase

    // Limpiar teléfono español — solo dígitos
    function limpiarTelefono(tel: string): string {
      if (!tel) return "";
      return tel.replace(/[\s\-\+]/g, "").replace(/^(0034|34)/, "").slice(0, 20);
    }

    const telDestinatario = limpiarTelefono(destinatarioTelefono || "");

    // Construir array de parámetros clave=valor para "data" (separados por |)
    const dataParams: string[] = [
      `del_cli=${delCli}`,
      `num_cli=${numCli}`,
      `tip_ser=${tipSer}`,
      `tip_cob=${tipCob}`,
      `ref_cli=${pedidoCodigo || pedidoId || ""}`,
      `tip_env=${tipEnv}`,
      `bul=${String(numBultos).padStart(3, "0")}`,
      `kil=${pesoKg}`,
      `nom_ent=${destinatarioNombre}`,
      `dir_ent=${destinatarioDireccion}`,
      `pais_ent=ES`,
      `cp_ent=${destinatarioCodigoPostal}`,
      `pob_ent=${destinatarioPoblacion}`,
    ];

    if (telDestinatario) dataParams.push(`tel_ent=${telDestinatario}`);
    if (observaciones) dataParams.push(`obs1=${observaciones}`);

    // Datos de recogida — solo si se informan explícitamente
    if (remitenteNombre) dataParams.push(`nom_rec=${remitenteNombre}`);
    if (remitenteDireccion) dataParams.push(`dir_rec=${remitenteDireccion}`);
    if (remitenteCodigoPostal) dataParams.push(`cp_rec=${remitenteCodigoPostal}`);
    if (remitentePoblacion) dataParams.push(`pob_rec=${remitentePoblacion}`);
    if (remitenteTelefono) dataParams.push(`tel_rec=${limpiarTelefono(remitenteTelefono)}`);

    // Pedimos la etiqueta en PDF y el link de seguimiento en la misma llamada
    dataParams.push(`etiqueta=S`);
    dataParams.push(`modelo=PDF_B`);
    dataParams.push(`seguimiento=S`);

    const dataString = dataParams.join("|");

    const url = `${baseUrl}?method=putExpedicion&user=${encodeURIComponent(user)}&pass=${encodeURIComponent(pass)}&data=${encodeURIComponent(dataString)}`;

    const response = await fetch(url, { method: "GET" });
    const rawText = await response.text();

    console.log("NACEX putExpedicion response (primeros 300 chars):", rawText.slice(0, 300));

    // La API de NACEX devuelve un string separado por pipes.
    // Si hay error, normalmente devuelve un código de error en vez del
    // formato esperado (no hay un patrón 100% fijo documentado, así que
    // detectamos por longitud/forma del resultado).
    const partes = rawText.split("|");

    // Formato esperado cuando todo va bien (con etiqueta+seguimiento):
    // 0: código interno expedición
    // 1: agencia_origen/numero_albaran  <- localizador real
    // 2: color caja-ruta
    // 3: ruta
    // 4: código agencia entrega
    // 5: nombre agencia entrega
    // 6: teléfono agencia entrega
    // 7: nombre del servicio
    // 8: hora de entrega
    // 9: código de barras
    // 10: fecha prevista de entrega
    // 11: (vacío / parámetros modificados)
    // 12: link de seguimiento
    // 13: etiqueta en PDF, base64

    const localizador = partes[1] || null;
    const fechaPrevista = partes[10] || "";
    const linkSeguimiento = (partes[12] || "").replace(/&amp;/g, "&");
    const etiquetaPdfBase64 = partes[13] || partes[partes.length - 1] || "";

    // Heurística simple de error: si no hay barra "/" en partes[1],
    // no se generó expedición correctamente.
    if (!localizador || !localizador.includes("/")) {
      console.error("NACEX error en putExpedicion:", rawText);
      return Response.json({
        ok: false,
        error: "NACEX no devolvió un localizador válido",
        rawResponse: rawText,
      }, { status: 400 });
    }

    return Response.json({
      ok: true,
      localizador,           // ej: "9992/11865497"
      fechaPrevista,
      linkSeguimiento,
      etiquetaPdfBase64,      // listo para decodificar y mostrar/descargar
      rawResponse: rawText,   // útil para depurar mientras probamos
    });

  } catch (error) {
    console.error("Error NACEX crear-envio:", error);
    return Response.json({ ok: false, error: String(error) }, { status: 500 });
  }
}