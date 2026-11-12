// app/api/gls/crear-envio/route.ts
import { NextRequest, NextResponse } from "next/server";
import {
  sbAdmin, cargarDatosEnvio, tieneEnvio, guardarPedido, subirEtiqueta,
  anotar, incidencia, fetchT, txt, escXml,
} from "@/app/lib/envios";

const supabase = sbAdmin();

const GLS_URL  = "https://ws-customer.gls-spain.es/b2b.asmx";
const GLS_GUID = process.env.GLS_GUID || ""; // identificador de cliente: solo en variables de entorno

// Servicio BusinessParcel 24/48h (peninsular)
const GLS_SERVICIO = "96";
const GLS_HORARIO  = "18";

// Texto seguro dentro de un bloque CDATA
function cdata(v: string): string {
  return v.replace(/]]>/g, "]] >");
}

export async function POST(req: NextRequest) {
  let pedidoId: unknown = null;
  let codigo = "";
  try {
    const reqBody = await req.json();
    pedidoId = reqBody?.pedidoId;
    if (!pedidoId) return NextResponse.json({ ok: false, error: "pedidoId requerido" }, { status: 400 });

    const r = await cargarDatosEnvio(supabase, pedidoId, reqBody);
    if (!r.ok) {
      if (r.status !== 404) await incidencia(supabase, pedidoId, "", "GLS", r.error);
      return NextResponse.json({ ok: false, error: r.error }, { status: r.status });
    }
    const { pedido, remitente, destinatario, pesoKg, avisos } = r.datos;
    codigo = r.datos.codigo;
    const cpDest = destinatario.cp;

    // ── El pedido ya tiene envío GLS: no se duplica
    if (tieneEnvio(pedido, "gls", pedido.tracking_gls)) {
      const codbarras = txt(pedido.tracking_gls) || txt(pedido.tracking);
      return NextResponse.json({
        ok: true, yaExistia: true, codbarras,
        trackingUrl: `https://mygls.gls-spain.es/e/${codbarras}/${cpDest}/es`,
        etiquetaUrl: txt(pedido.etiqueta_envio_url) || null,
      });
    }

    if (!GLS_GUID) {
      await incidencia(supabase, pedidoId, codigo, "GLS", "Falta la variable de entorno GLS_GUID en Vercel");
      return NextResponse.json({ ok: false, error: "GLS no está configurado (GLS_GUID)" }, { status: 500 });
    }

    const kilos      = Math.max(1, Math.ceil(pesoKg));
    const referencia = codigo;

    const nomRte  = remitente.nombre.toUpperCase().substring(0, 40);
    const dirRte  = remitente.direccion.toUpperCase().substring(0, 100);
    const pobRte  = remitente.poblacion.toUpperCase().substring(0, 40);
    const nomDest = destinatario.nombre.toUpperCase().substring(0, 40);
    const dirDest = destinatario.direccion.toUpperCase().substring(0, 100);
    const pobDest = destinatario.poblacion.toUpperCase().substring(0, 40);
    const emailDest = destinatario.email.substring(0, 75);

    // GLS España usa código de país numérico 34
    const paisOrig = "34";
    const paisDest = "34";

    const xml = `<?xml version="1.0" encoding="utf-8"?>
<soap12:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
                 xmlns:xsd="http://www.w3.org/2001/XMLSchema"
                 xmlns:soap12="http://www.w3.org/2003/05/soap-envelope">
  <soap12:Body>
    <GrabaServicios xmlns="http://www.asmred.com/">
      <docIn>
        <Servicios uidcliente="${escXml(GLS_GUID)}">
          <Envio>
            <Portes>P</Portes>
            <Servicio>${GLS_SERVICIO}</Servicio>
            <Horario>${GLS_HORARIO}</Horario>
            <Bultos>1</Bultos>
            <Peso>${kilos}</Peso>
            <Remite>
              <Nombre><![CDATA[${cdata(nomRte)}]]></Nombre>
              <Direccion><![CDATA[${cdata(dirRte)}]]></Direccion>
              <Poblacion><![CDATA[${cdata(pobRte)}]]></Poblacion>
              <Pais>${paisOrig}</Pais>
              <CP>${remitente.cp}</CP>
              <Telefono>${remitente.telefono}</Telefono>
            </Remite>
            <Destinatario>
              <Nombre><![CDATA[${cdata(nomDest)}]]></Nombre>
              <Direccion><![CDATA[${cdata(dirDest)}]]></Direccion>
              <Poblacion><![CDATA[${cdata(pobDest)}]]></Poblacion>
              <Pais>${paisDest}</Pais>
              <CP>${cpDest}</CP>
              <Telefono>${destinatario.telefono}</Telefono>
              <Movil>${destinatario.telefono}</Movil>
              <Email>${escXml(emailDest)}</Email>
              <Observaciones><![CDATA[Pedido ${cdata(referencia)}]]></Observaciones>
            </Destinatario>
            <Referencias>
              <Referencia tipo="0">${escXml(referencia.substring(0, 10).padStart(10, "0"))}</Referencia>
              <Referencia tipo="C">${escXml(referencia)}</Referencia>
            </Referencias>
            <DevuelveAdicionales>
              <Etiqueta tipo="PDF"></Etiqueta>
            </DevuelveAdicionales>
          </Envio>
          <Plataforma>RecambioDirecto</Plataforma>
        </Servicios>
      </docIn>
    </GrabaServicios>
  </soap12:Body>
</soap12:Envelope>`;

    const res = await fetchT(GLS_URL, {
      method: "POST",
      headers: { "Content-Type": "text/xml; charset=UTF-8" },
      body: xml,
    });

    const rawText = await res.text();
    console.log("GLS crear envío response:", rawText.substring(0, 500));

    // Extraer codbarras del atributo en el XML de respuesta
    const codbarras = rawText.match(/codbarras="([^"]+)"/)?.[1] || null;

    if (!codbarras) {
      const errorMatch = rawText.match(/<Error[^>]*>([\s\S]*?)<\/Error>/);
      const retornoMatch = rawText.match(/return="([^"]+)"/);
      await incidencia(
        supabase, pedidoId, codigo, "GLS",
        `GLS no devolvió código de envío (retorno ${retornoMatch?.[1] || "?"}${errorMatch?.[1] ? ": " + errorMatch[1] : ""})`,
        rawText.substring(0, 600)
      );
      return NextResponse.json({
        ok: false,
        error: "GLS no devolvió código de envío",
        retorno: retornoMatch?.[1],
        glsError: errorMatch?.[1],
        raw: rawText.substring(0, 600),
      }, { status: 400 });
    }

    // Extraer etiqueta PDF en base64 — viene dentro de <Etiqueta bulto="1">...</Etiqueta>
    // Se usan índices de string: más fiable que regex para base64 largo
    let etiquetaUrl: string | null = null;
    let etiquetaBase64: string | null = null;
    const tagOpen  = "<Etiqueta bulto=\"1\">";
    const tagClose = "</Etiqueta>";
    const idxOpen  = rawText.indexOf(tagOpen);
    const idxClose = rawText.indexOf(tagClose, idxOpen);
    if (idxOpen > -1 && idxClose > idxOpen) {
      etiquetaBase64 = rawText.substring(idxOpen + tagOpen.length, idxClose).replace(/[\r\n\s]/g, "");
    }

    if (etiquetaBase64) {
      try {
        etiquetaUrl = await subirEtiqueta(
          supabase,
          `etiquetas-gls/${pedidoId}/${Date.now()}_etiqueta.pdf`,
          Buffer.from(etiquetaBase64, "base64")
        );
      } catch (e) {
        console.error("Error decodificando etiqueta GLS:", e);
      }
    }

    // URL de tracking pública para el taller
    const trackingUrl = `https://mygls.gls-spain.es/e/${codbarras}/${cpDest}/es`;

    // Solo se escribe etiqueta_envio_url si hay etiqueta (nunca se borra la existente)
    const g = await guardarPedido(supabase, pedidoId, {
      tracking:     codbarras,
      tracking_gls: codbarras,
      ...(etiquetaUrl ? { etiqueta_envio_url: etiquetaUrl } : {}),
      estado_envio: "preparando",
      agencia:      "GLS",
    });
    await anotar(supabase, pedidoId, `GLS OK — Envío ${codbarras} — ${kilos} kg${avisos.length ? " — Avisos: " + avisos.join("; ") : ""}`);
    if (g.error) await incidencia(supabase, pedidoId, codigo, "GLS", `Envío ${codbarras} creado en GLS pero NO se pudo guardar en el pedido`, g.error);
    if (!etiquetaUrl) await incidencia(supabase, pedidoId, codigo, "GLS", `Envío ${codbarras} creado pero GLS no devolvió la etiqueta`);

    return NextResponse.json({ ok: true, codbarras, trackingUrl, etiquetaUrl });

  } catch (e: any) {
    console.error("Error crear envío GLS:", e);
    await incidencia(supabase, pedidoId, codigo, "GLS", "Error inesperado al crear el envío", String(e?.message || e));
    return NextResponse.json({ ok: false, error: e?.message || String(e) }, { status: 500 });
  }
}
