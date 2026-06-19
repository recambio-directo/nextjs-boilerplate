// app/api/nacex/crear-envio/route.ts
import { createClient } from "@supabase/supabase-js";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      pedidoId,
      pedidoCodigo,
      remitenteNombre,
      remitenteDireccion,
      remitenteCodigoPostal,
      remitentePoblacion,
      remitenteTelefono,
      destinatarioNombre,
      destinatarioDireccion,
      destinatarioCodigoPostal,
      destinatarioPoblacion,
      destinatarioTelefono,
      destinatarioEmail,
      pesoKg = 1,
      numBultos = 1,
      observaciones = "",
    } = body;

    if (!destinatarioNombre || !destinatarioDireccion || !destinatarioCodigoPostal || !destinatarioPoblacion) {
      return Response.json({ ok: false, error: "Faltan datos obligatorios de entrega" }, { status: 400 });
    }

    const baseUrl = "https://pda.nacex.com/nacex_ws/ws";
    const user = process.env.NACEX_USER || "";
    const pass = process.env.NACEX_PASS || "";
    const delCli = process.env.NACEX_DEL_CLI || "";
    const numCli = process.env.NACEX_NUM_CLI || "";
    const tipSer = process.env.NACEX_TIP_SER || "08";
    const tipCob = process.env.NACEX_TIP_COB || "O";
    const tipEnv = process.env.NACEX_TIP_ENV || "2";

    function limpiarTelefono(tel: string): string {
      if (!tel) return "";
      return tel.replace(/[\s\-\+]/g, "").replace(/^(0034|34)/, "").slice(0, 20);
    }

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

    const telDest = limpiarTelefono(destinatarioTelefono || "");
    if (telDest) dataParams.push(`tel_ent=${telDest}`);
    if (observaciones) dataParams.push(`obs1=${observaciones}`);
    if (remitenteNombre) dataParams.push(`nom_rec=${remitenteNombre}`);
    if (remitenteDireccion) dataParams.push(`dir_rec=${remitenteDireccion}`);
    if (remitenteCodigoPostal) dataParams.push(`cp_rec=${remitenteCodigoPostal}`);
    if (remitentePoblacion) dataParams.push(`pob_rec=${remitentePoblacion}`);
    if (remitenteTelefono) dataParams.push(`tel_rec=${limpiarTelefono(remitenteTelefono)}`);

    dataParams.push(`etiqueta=S`);
    dataParams.push(`modelo=PDF_B`);
    dataParams.push(`seguimiento=S`);

    const dataString = dataParams.join("|");
    const url = `${baseUrl}?method=putExpedicion&user=${encodeURIComponent(user)}&pass=${encodeURIComponent(pass)}&data=${encodeURIComponent(dataString)}`;

    const response = await fetch(url, { method: "GET" });
    const rawText = await response.text();

    console.log("NACEX putExpedicion (primeros 300 chars):", rawText.slice(0, 300));

    const partes = rawText.split("|");
    const localizador = partes[1] || null;
    const fechaPrevista = partes[10] || "";
    const linkSeguimiento = (partes[12] || "").replace(/&amp;/g, "&");
    const etiquetaPdfBase64 = partes[13] || "";

    if (!localizador || !localizador.includes("/")) {
      console.error("NACEX error en putExpedicion:", rawText);
      return Response.json({
        ok: false,
        error: "NACEX no devolvió un localizador válido",
        rawResponse: rawText,
      }, { status: 400 });
    }

    // Guardar etiqueta PDF de NACEX en Supabase Storage
    let etiquetaNacexUrl = "";
    if (etiquetaPdfBase64 && pedidoCodigo) {
      try {
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // Convertir base64 a buffer
        const pdfBuffer = Buffer.from(etiquetaPdfBase64, "base64");
        const etiquetaPath = `documentos/${pedidoCodigo}/etiqueta-nacex-${pedidoCodigo}.pdf`;

        await supabase.storage.from("FACTURAS").upload(etiquetaPath, pdfBuffer, {
          contentType: "application/pdf",
          upsert: true,
        });

        const { data: urlData } = supabase.storage.from("FACTURAS").getPublicUrl(etiquetaPath);
        etiquetaNacexUrl = urlData.publicUrl;

        // Guardar URL en el pedido
        if (pedidoId) {
          await supabase.from("pedidos")
            .update({ etiqueta_nacex_url: etiquetaNacexUrl })
            .eq("id", pedidoId);
        }
      } catch (storageErr) {
        console.error("Error guardando etiqueta NACEX en Storage:", storageErr);
        // No bloqueamos — el envío sí se creó aunque falle el almacenamiento
      }
    }

    return Response.json({
      ok: true,
      localizador,
      fechaPrevista,
      linkSeguimiento,
      etiquetaNacexUrl,
      etiquetaPdfBase64, // por si el frontend lo necesita
      rawResponse: rawText,
    });

  } catch (error) {
    console.error("Error NACEX crear-envio:", error);
    return Response.json({ ok: false, error: String(error) }, { status: 500 });
  }
}