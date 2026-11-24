import { soloInternoOAdmin } from "@/app/lib/seguridad";
// app/api/mrw/tracking/route.ts
// Consulta el estado de un envío MRW por número de envío (albarán).
//
// IMPORTANTE: el servicio SAGEC (sagec.mrw.es/MRWEnvio.asmx) solo sirve para crear/anular envíos y etiquetas;
// NO tiene operación de seguimiento. El seguimiento está en un servicio aparte:
//   https://trackingservice.mrw.es/TrackingService.svc  →  operación GetEnvios (SOAP 1.1)
// Usa el mismo usuario/contraseña de MRW (MRW_USERNAME / MRW_PASSWORD), franquicia y abonado.
//
// Si MRW no devuelve un estado claro → ok:false, y el cron deja el pedido como estaba
// (antes se ponía "enviado" por defecto, lo que nunca marcaba entregas y pasaba "preparando" a "enviado").

const TRACKING_URL = "https://trackingservice.mrw.es/TrackingService.svc/TrackingServices";
const SOAP_ACTION = "http://tempuri.org/ITrackingService/GetEnvios";

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function tag(xml: string, nombre: string): string {
  // Acepta etiquetas con o sin prefijo de namespace: <Estado>, <a:Estado>, <b:Estado>…
  const m = xml.match(new RegExp(`<(?:\\w+:)?${nombre}(?:\\s[^>]*)?>([\\s\\S]*?)</(?:\\w+:)?${nombre}>`));
  return (m?.[1] || "").trim();
}

function mapearEstado(estado: string, descripcion: string, fechaEntrega: string): string | null {
  const d = `${estado} ${descripcion}`.toLowerCase();
  if (d.includes("no entregad") || d.includes("devuelt") || d.includes("devoluc") || d.includes("incidencia") || d.includes("ausente")) {
    return "enviado"; // sigue en curso (con incidencia), no entregado
  }
  if (d.includes("entregad") || fechaEntrega) return "entregado";
  if (d.trim()) return "enviado"; // cualquier otro estado conocido de MRW = en manos de MRW
  return null; // sin información → no tocar el pedido
}

async function llamarMRW(body: string): Promise<string> {
  const headers = {
    "Content-Type": "text/xml; charset=utf-8",
    SOAPAction: `"${SOAP_ACTION}"`,
  };

  // 1) Directo a MRW
  try {
    const r = await fetch(TRACKING_URL, { method: "POST", headers, body, cache: "no-store" });
    const txt = await r.text();
    if (r.ok || txt.includes("GetEnviosResponse")) return txt;
    console.warn("MRW tracking directo HTTP", r.status, txt.slice(0, 300));
  } catch (e) {
    console.warn("MRW tracking directo falló:", String(e));
  }

  // 2) A través del proxy VPS (por si MRW solo acepta la IP del VPS)
  const proxyUrl = process.env.MRW_PROXY_URL || "";
  if (!proxyUrl) return "";
  const r = await fetch(proxyUrl, {
    method: "POST",
    headers: {
      ...headers,
      "x-proxy-secret": process.env.MRW_PROXY_SECRET || "",
      "x-target-url": TRACKING_URL,
    },
    body,
    cache: "no-store",
  });
  return await r.text();
}

export async function POST(request: Request) {
  { const sinAcceso = await soloInternoOAdmin(request); if (sinAcceso) return sinAcceso; }
  try {
    const { numeroEnvio } = await request.json();
    if (!numeroEnvio) return Response.json({ ok: false, error: "Falta numeroEnvio" }, { status: 400 });

    const numero = String(numeroEnvio).trim();
    const login = process.env.MRW_USERNAME || "";
    const pass = process.env.MRW_PASSWORD || "";
    const abonado = process.env.MRW_ABONADO || "";
    const franquicia = process.env.MRW_FRANQUICIA || "";

    // tipoFiltro 0 = por número de envío · tipoInformacion 0 = último estado · idioma 3082 = español
    const soapBody = `<?xml version="1.0" encoding="utf-8"?>
<s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/">
  <s:Body>
    <GetEnvios xmlns="http://tempuri.org/">
      <login>${esc(login)}</login>
      <pass>${esc(pass)}</pass>
      <codigoIdioma>3082</codigoIdioma>
      <tipoFiltro>0</tipoFiltro>
      <valorFiltroDesde>${esc(numero)}</valorFiltroDesde>
      <valorFiltroHasta>${esc(numero)}</valorFiltroHasta>
      <fechaDesde></fechaDesde>
      <fechaHasta></fechaHasta>
      <tipoInformacion>0</tipoInformacion>
      <codigoAbonado>${esc(abonado)}</codigoAbonado>
      <codigoFranquicia>${esc(franquicia)}</codigoFranquicia>
    </GetEnvios>
  </s:Body>
</s:Envelope>`;

    const xml = await llamarMRW(soapBody);

    // Puede venir más de un <Seguimiento>; nos quedamos con el de este albarán (o el último)
    const bloques = [...xml.matchAll(/<(?:\w+:)?Seguimiento(?:\s[^>]*)?>([\s\S]*?)<\/(?:\w+:)?Seguimiento>/g)]
      .map((m) => m[1])
      .filter((b) => tag(b, "Estado") || tag(b, "EstadoDescripcion"));
    const bloque = bloques.find((b) => tag(b, "NumAlbaran").replace(/\s/g, "") === numero) || bloques[bloques.length - 1] || "";

    const estadoMRW = tag(bloque, "Estado");
    const descripcion = tag(bloque, "EstadoDescripcion");
    const fechaEntrega = tag(bloque, "FechaEntrega");
    const horaEntrega = tag(bloque, "HoraEntrega");
    const mensaje = tag(xml, "MensajeSeguimiento") || tag(xml, "faultstring");

    console.log(`MRW tracking ${numero}: estado="${estadoMRW}" desc="${descripcion}" entrega="${fechaEntrega} ${horaEntrega}" msg="${mensaje}"`);

    const estadoRD = mapearEstado(estadoMRW, descripcion, fechaEntrega);
    if (!estadoRD) {
      return Response.json({
        ok: false,
        numeroEnvio: numero,
        error: mensaje || "MRW no devolvió estado para este envío",
      });
    }

    return Response.json({
      ok: true,
      numeroEnvio: numero,
      estadoMRW,
      estadoRD,
      descripcion,
      fecha: [fechaEntrega, horaEntrega].filter(Boolean).join(" "),
    });
  } catch (error) {
    console.error("Error MRW tracking:", error);
    return Response.json({ ok: false, error: String(error) }, { status: 500 });
  }
}
