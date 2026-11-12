// app/api/nacex/crear-envio/route.ts
import {
  sbAdmin, cargarDatosEnvio, tieneEnvio, guardarPedido, subirEtiqueta,
  anotar, incidencia, fetchT, txt,
} from "@/app/lib/envios";

const supabase = sbAdmin();

// Los campos de NACEX van separados por "|": no puede aparecer dentro de un valor
function campo(v: unknown): string {
  return txt(v).replace(/\|/g, " ");
}

function urlSeguimiento(localizador: string): string {
  return `https://www.nacex.com/seguimientoDetalle.do?agencia_origen=${localizador.split("/")[0]}&numero_albaran=${localizador.split("/")[1]}&externo=N`;
}

export async function POST(request: Request) {
  let pedidoId: unknown = null;
  let codigo = "";
  try {
    const body = await request.json();
    pedidoId = body?.pedidoId;

    if (!pedidoId) {
      return Response.json({ ok: false, error: "pedidoId requerido" }, { status: 400 });
    }

    const r = await cargarDatosEnvio(supabase, pedidoId, body);
    if (!r.ok) {
      if (r.status !== 404) await incidencia(supabase, pedidoId, "", "NACEX", r.error);
      return Response.json({ ok: false, error: r.error }, { status: r.status });
    }
    const { pedido, remitente, destinatario, pesoKg, avisos } = r.datos;
    codigo = r.datos.codigo;
    const pedidoCodigo = codigo;

    // ── El pedido ya tiene envío NACEX: no se duplica
    if (tieneEnvio(pedido, "nacex", pedido.tracking_nacex)) {
      const localizador = txt(pedido.tracking_nacex) || txt(pedido.tracking);
      const etiquetaNacexUrl = txt(pedido.etiqueta_nacex_url) || txt(pedido.etiqueta_envio_url);
      return Response.json({
        ok: true, yaExistia: true, localizador,
        fechaPrevista: "",
        linkSeguimiento: localizador.includes("/") ? urlSeguimiento(localizador) : "",
        etiquetaNacexUrl,
        etiquetaPdfBase64: "",
      });
    }

    const kilos = Math.max(1, Math.ceil(pesoKg));
    const numBultos = Number(body?.numBultos) > 0 ? Math.floor(Number(body.numBultos)) : 1;
    const observaciones = campo(body?.observaciones);

    // ── NACEX API ──
    const baseUrl = "https://pda.nacex.com/nacex_ws/ws";
    const user = process.env.NACEX_USER || "";
    const pass = process.env.NACEX_PASS || "";
    const delCli = process.env.NACEX_DEL_CLI || "";
    const numCli = process.env.NACEX_NUM_CLI || "";
    const tipSer = process.env.NACEX_TIP_SER || "08";
    const tipCob = process.env.NACEX_TIP_COB || "T";
    const tipEnv = process.env.NACEX_TIP_ENV || "2";

    const dataParams: string[] = [
      `del_cli=${delCli}`,
      `num_cli=${numCli}`,
      `tip_ser=${tipSer}`,
      `tip_cob=${tipCob}`,
      `ref_cli=${campo(pedidoCodigo)}`,
      `tip_env=${tipEnv}`,
      `bul=${String(numBultos).padStart(3, "0")}`,
      `kil=${kilos}`,
      `nom_ent=${campo(destinatario.nombre).substring(0, 40)}`,
      `dir_ent=${campo(destinatario.direccion).substring(0, 100)}`,
      `pais_ent=ES`,
      `cp_ent=${destinatario.cp}`,
      `pob_ent=${campo(destinatario.poblacion).substring(0, 40)}`,
      `tel_ent=${destinatario.telefono}`,
    ];

    if (observaciones) dataParams.push(`obs1=${observaciones}`);
    dataParams.push(`nom_rec=${campo(remitente.nombre)}`);
    dataParams.push(`dir_rec=${campo(remitente.direccion)}`);
    dataParams.push(`cp_rec=${remitente.cp}`);
    dataParams.push(`pob_rec=${campo(remitente.poblacion)}`);
    dataParams.push(`tel_rec=${remitente.telefono}`);

    dataParams.push(`etiqueta=S`);
    dataParams.push(`modelo=PDF_B`);
    dataParams.push(`seguimiento=S`);

    const dataString = dataParams.join("|");
    const url = `${baseUrl}?method=putExpedicion&user=${encodeURIComponent(user)}&pass=${encodeURIComponent(pass)}&data=${encodeURIComponent(dataString)}`;

    console.log("NACEX putExpedicion data:", dataString.substring(0, 200));

    const response = await fetchT(url, { method: "GET" });
    const rawText = await response.text();

    console.log("NACEX putExpedicion (primeros 300 chars):", rawText.slice(0, 300));

    const partesResp = rawText.split("|");
    const localizador = partesResp[1] || null;
    const fechaPrevista = partesResp[10] || "";
    const linkSeguimiento = (partesResp[12] || "").replace(/&amp;/g, "&");
    const etiquetaPdfBase64 = partesResp[13] || "";

    if (!localizador || !localizador.includes("/")) {
      await incidencia(supabase, pedidoId, codigo, "NACEX", "NACEX no devolvió un localizador válido", rawText.substring(0, 600));
      return Response.json({
        ok: false,
        error: "NACEX no devolvió un localizador válido",
        rawResponse: rawText.substring(0, 2000),
      }, { status: 400 });
    }

    // ── Guardar etiqueta PDF en Supabase Storage ──
    let etiquetaNacexUrl = "";
    if (etiquetaPdfBase64) {
      try {
        etiquetaNacexUrl = (await subirEtiqueta(
          supabase,
          `documentos/${pedidoCodigo}/etiqueta-nacex-${pedidoCodigo}.pdf`,
          Buffer.from(etiquetaPdfBase64, "base64")
        )) || "";
      } catch (storageErr) {
        console.error("Error guardando etiqueta NACEX en Storage:", storageErr);
      }
    }

    // ── Actualizar pedido en Supabase ──
    const trackingUrl = urlSeguimiento(localizador);

    const g = await guardarPedido(supabase, pedidoId, {
      tracking: localizador,
      tracking_nacex: localizador,
      ...(etiquetaNacexUrl ? { etiqueta_nacex_url: etiquetaNacexUrl, etiqueta_envio_url: etiquetaNacexUrl } : {}),
      estado_envio: "preparando",
      agencia: "NACEX",
      codigo_postal_destino: destinatario.cp,
    });
    await anotar(supabase, pedidoId, `NACEX OK — Envío ${localizador} — ${kilos} kg — tip_cob ${tipCob}${avisos.length ? " — Avisos: " + avisos.join("; ") : ""}`);
    if (g.error) await incidencia(supabase, pedidoId, codigo, "NACEX", `Envío ${localizador} creado en NACEX pero NO se pudo guardar en el pedido`, g.error);
    if (!etiquetaNacexUrl) await incidencia(supabase, pedidoId, codigo, "NACEX", `Envío ${localizador} creado pero NACEX no devolvió la etiqueta`);

    return Response.json({
      ok: true,
      localizador,
      fechaPrevista,
      linkSeguimiento: linkSeguimiento || trackingUrl,
      etiquetaNacexUrl,
      etiquetaPdfBase64,
    });

  } catch (error) {
    console.error("Error NACEX crear-envio:", error);
    await incidencia(supabase, pedidoId, codigo, "NACEX", "Error inesperado al crear el envío", String(error));
    return Response.json({ ok: false, error: String(error) }, { status: 500 });
  }
}
