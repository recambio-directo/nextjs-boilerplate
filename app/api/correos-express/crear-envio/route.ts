// app/api/correos-express/crear-envio/route.ts
import { NextRequest, NextResponse } from "next/server";
import {
  sbAdmin, cargarDatosEnvio, tieneEnvio, guardarPedido, subirEtiqueta,
  anotar, incidencia, fetchT, txt, hoyMadrid,
} from "@/app/lib/envios";

const supabase = sbAdmin();

const CEX_URL = "https://www.cexpr.es/wspsc/apiRestGrabacionEnviok8s/json/grabacionEnvio";
const CEX_USER = process.env.CEX_USUARIO!;
const CEX_PASS = process.env.CEX_PASSWORD!;
const CEX_SOLICITANTE = process.env.CEX_SOLICITANTE || ("I" + process.env.CEX_CODIGO_CLIENTE!);
const CEX_CODIGO_CLIENTE = process.env.CEX_CODIGO_CLIENTE!;
const CEX_PRODUCTO = "63"; // Paq 24

export async function POST(req: NextRequest) {
  let pedidoId: unknown = null;
  let codigo = "";
  try {
    const reqBody = await req.json();
    pedidoId = reqBody?.pedidoId;
    if (!pedidoId) return NextResponse.json({ ok: false, error: "pedidoId requerido" }, { status: 400 });

    const r = await cargarDatosEnvio(supabase, pedidoId, reqBody);
    if (!r.ok) {
      if (r.status !== 404) await incidencia(supabase, pedidoId, "", "Correos Express", r.error);
      return NextResponse.json({ ok: false, error: r.error }, { status: r.status });
    }
    const { pedido, remitente, destinatario, pesoKg, avisos } = r.datos;
    codigo = r.datos.codigo;

    // ── El pedido ya tiene envío de Correos Express: no se duplica
    if (tieneEnvio(pedido, "correos")) {
      return NextResponse.json({
        ok: true, yaExistia: true,
        numEnvio: txt(pedido.tracking),
        codUnico: "",
        numRecogida: txt(pedido.collection_ref_correos_express) || null,
        etiquetaUrl: txt(pedido.etiqueta_envio_url) || null,
      });
    }

    const productos = pedido.productos || [];
    const refs = productos.map((p: any) => p.referencia).join(", ").substring(0, 78);
    const kilos = Math.max(1, Math.ceil(pesoKg)).toFixed(3);
    const nomRte = remitente.nombre.substring(0, 40);
    const nomDest = destinatario.nombre.substring(0, 40);

    // ── Fecha ────────────────────────────────────────────────────────────────
    const hoy = hoyMadrid();
    const fechaStr = `${hoy.dd}${hoy.mm}${hoy.yyyy}`;

    const body = {
      solicitante:      CEX_SOLICITANTE,
      canalEntrada:     "",
      numEnvio:         "",
      ref:              codigo,
      refCliente:       String(pedidoId),
      fecha:            fechaStr,
      codRte:           CEX_CODIGO_CLIENTE,
      nomRte,
      nifRte:           "",
      dirRte:           remitente.direccion,
      pobRte:           remitente.poblacion.toUpperCase(),
      codPosNacRte:     remitente.cp,
      paisISORte:       "ES",
      codPosIntRte:     "",
      contacRte:        nomRte,
      telefRte:         remitente.telefono,
      emailRte:         remitente.email || "info@recambio-directo.com",
      codDest:          "",
      nomDest,
      nifDest:          "",
      dirDest:          destinatario.direccion,
      pobDest:          destinatario.poblacion.toUpperCase(),
      codPosNacDest:    destinatario.cp,
      paisISODest:      "",
      codPosIntDest:    "",
      contacDest:       nomDest,
      telefDest:        destinatario.telefono,
      emailDest:        destinatario.email.substring(0, 75),
      contacOtrs:       "",
      telefOtrs:        "",
      emailOtrs:        "",
      observac:         `Pedido ${codigo}`,
      numBultos:        "1",
      kilos,
      volumen:          "",
      alto:             "",
      largo:            "",
      ancho:            "",
      producto:         CEX_PRODUCTO,
      portes:           "P",
      reembolso:        "",
      entrSabado:       "",
      seguro:           "",
      numEnvioVuelta:   "",
      listaBultos: [
        {
          alto: "", ancho: "", codBultoCli: "", codUnico: "",
          descripcion: refs, kilos,
          largo: "", observaciones: "", orden: "1",
          referencia: codigo, volumen: ""
        }
      ],
      codDirecDestino: "",
      password: CEX_PASS,
      listaInformacionAdicional: [
        {
          tipoEtiqueta:         "1",
          etiquetaPDF:          "",
          creaRecogida:         "S",
          fechaRecogida:        "",
          horaDesdeRecogida:    "09:00",
          horaHastaRecogida:    "18:00",
          referenciaRecogida:   codigo,
          codificacionUnicaB64: "1",
        }
      ]
    };

    const authHeader = "Basic " + Buffer.from(`${CEX_USER}:${CEX_PASS}`).toString("base64");

    const resp = await fetchT(CEX_URL, {
      method: "POST",
      headers: {
        "Content-Type":  "application/json",
        "Accept":        "application/json",
        "Authorization": authHeader,
      },
      body: JSON.stringify(body),
    });

    const rawText = await resp.text();

    if (rawText.trim().startsWith("<")) {
      await incidencia(supabase, pedidoId, codigo, "Correos Express", "CEX devolvió HTML (autenticación o endpoint)", rawText.substring(0, 300));
      return NextResponse.json({
        ok: false,
        error: "CEX devolvió HTML. Error de autenticación o endpoint.",
        raw: rawText.substring(0, 300)
      }, { status: 400 });
    }

    let data: any = null;
    try { data = JSON.parse(rawText); } catch { data = null; }

    if (!data || data.codigoRetorno !== 0) {
      const motivo = data?.mensajeRetorno || "Error CEX";
      await incidencia(supabase, pedidoId, codigo, "Correos Express", `CEX rechazó el envío: ${motivo}`, rawText.substring(0, 600));
      return NextResponse.json({ ok: false, error: motivo, code: data?.codigoRetorno }, { status: 400 });
    }

    const numEnvio    = txt(data.datosResultado);
    const codUnico    = data.listaBultos?.[0]?.codUnico || "";
    const numRecogida = data.numRecogida ? String(data.numRecogida) : null;

    if (!numEnvio) {
      await incidencia(supabase, pedidoId, codigo, "Correos Express", "CEX no devolvió número de envío", rawText.substring(0, 600));
      return NextResponse.json({ ok: false, error: "CEX no devolvió número de envío" }, { status: 400 });
    }

    // Decodificar etiqueta PDF
    let etiquetaUrl: string | null = null;
    const etiquetaRaw = data.etiqueta?.[0]?.etiqueta1 || data.etiqueta?.[0]?.etiqueta2 || null;
    if (etiquetaRaw && !String(etiquetaRaw).includes("no se ha generado")) {
      try {
        etiquetaUrl = await subirEtiqueta(
          supabase,
          `etiquetas-cex/${pedidoId}/${Date.now()}_etiqueta.pdf`,
          Buffer.from(String(etiquetaRaw), "base64")
        );
      } catch (e) {
        console.error("Error decodificando etiqueta CEX:", e);
      }
    }

    // Solo se escribe etiqueta_envio_url si hay etiqueta (nunca se borra la existente)
    const g = await guardarPedido(supabase, pedidoId, {
      tracking:                       numEnvio,
      collection_ref_correos_express: numRecogida,
      ...(etiquetaUrl ? { etiqueta_envio_url: etiquetaUrl } : {}),
      estado_envio:                   "preparando",
      agencia:                        "Correos Express",
    });
    await anotar(supabase, pedidoId, `CEX OK — Envío ${numEnvio} — Recogida ${numRecogida || "-"} — ${kilos} kg${avisos.length ? " — Avisos: " + avisos.join("; ") : ""}`);
    if (g.error) await incidencia(supabase, pedidoId, codigo, "Correos Express", `Envío ${numEnvio} creado en CEX pero NO se pudo guardar en el pedido`, g.error);
    if (!etiquetaUrl) await incidencia(supabase, pedidoId, codigo, "Correos Express", `Envío ${numEnvio} creado pero CEX no devolvió la etiqueta`, txt(etiquetaRaw).substring(0, 200));

    return NextResponse.json({ ok: true, numEnvio, codUnico, numRecogida, etiquetaUrl });

  } catch (e: any) {
    console.error("Error crear envío CEX:", e);
    await incidencia(supabase, pedidoId, codigo, "Correos Express", "Error inesperado al crear el envío", String(e?.message || e));
    return NextResponse.json({ ok: false, error: e?.message || String(e) }, { status: 500 });
  }
}
