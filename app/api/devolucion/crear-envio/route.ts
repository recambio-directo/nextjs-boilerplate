// app/api/devolucion/crear-envio/route.ts
// Crea envío de devolución — INVERTIDO: remitente=taller, destinatario=proveedor
// v2: envía etiqueta PDF adjunta al email del taller
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
const resend = new Resend(process.env.RESEND_API_KEY);

async function getDatosUsuario(userId: string) {
  const { data } = await supabase
    .from("usuarios")
    .select("nombre_empresa, direccion, ciudad, codigo_postal, telefono, email, cif, provincia")
    .eq("id", userId)
    .single();
  return data;
}

// Tipo de resultado que incluye el buffer de la etiqueta para adjuntar al email
type ResultadoEnvio = {
  ok: boolean;
  tracking?: string;
  etiquetaUrl?: string | null;
  etiquetaBuffer?: Buffer | null;
  error?: string;
  raw?: any;
};

// ── Subir etiqueta a Storage y devolver URL + buffer ─────────────────────────
async function subirEtiqueta(base64: string, prefix: string, devId: number): Promise<{ url: string | null; buffer: Buffer }> {
  const buf = Buffer.from(base64, "base64");
  const path = `etiquetas-dev/${prefix}-${devId}-${Date.now()}.pdf`;
  const { error } = await supabase.storage.from("FACTURAS").upload(path, buf, { contentType: "application/pdf" });
  if (error) return { url: null, buffer: buf };
  const { data: u } = supabase.storage.from("FACTURAS").getPublicUrl(path);
  return { url: u.publicUrl, buffer: buf };
}

// ── MRW ──────────────────────────────────────────────────────────────────────
async function crearEnvioMRW(dev: any, remitente: any, destinatario: any): Promise<ResultadoEnvio> {
  const entorno = process.env.MRW_ENTORNO === "test"
    ? "https://sagec-test.mrw.es/MRWEnvio.asmx"
    : "https://sagec.mrw.es/MRWEnvio.asmx";
  const franquicia = process.env.MRW_FRANQUICIA || "";
  const abonado = process.env.MRW_ABONADO || "";
  const departamento = process.env.MRW_DEPARTAMENTO || "";
  const username = process.env.MRW_USERNAME || "";
  const password = process.env.MRW_PASSWORD || "";
  const proxyUrl = "http://168.231.83.226:3000";

  function limpiarTel(tel: string) { return (tel || "").replace(/[\s\-\+]/g, "").replace(/^(0034|34|\+34)/, "").slice(0, 9); }

  const hoy = new Date();
  const fechaStr = [String(hoy.getDate()).padStart(2, "0"), String(hoy.getMonth() + 1).padStart(2, "0"), String(hoy.getFullYear())].join("/");

  const soapBody = `<?xml version="1.0" encoding="utf-8"?>
<Envelope xmlns="http://www.w3.org/2003/05/soap-envelope">
  <Header><AuthInfo xmlns="http://www.mrw.es/"><CodigoFranquicia>${franquicia}</CodigoFranquicia><CodigoAbonado>${abonado}</CodigoAbonado><CodigoDepartamento>${departamento}</CodigoDepartamento><UserName>${username}</UserName><Password>${password}</Password></AuthInfo></Header>
  <Body>
    <TransmEnvio xmlns="http://www.mrw.es/">
      <request>
        <ModificaDatosEnvio><NumeroEnvioOriginal></NumeroEnvioOriginal></ModificaDatosEnvio>
        <DatosRecogida>
          <Direccion><Via>${remitente.direccion || "VER DEVOLUCION"}</Via><CodigoPostal>${remitente.codigo_postal || "28001"}</CodigoPostal><Poblacion>${remitente.ciudad || "ESPAÑA"}</Poblacion><CodigoPais>ES</CodigoPais><Agencia></Agencia></Direccion>
          <Nombre>${(remitente.nombre_empresa || "TALLER").substring(0, 40)}</Nombre>
          <Telefono>${limpiarTel(remitente.telefono)}</Telefono>
        </DatosRecogida>
        <DatosEntrega>
          <Direccion><Via>${destinatario.direccion || "VER DEVOLUCION"}</Via><CodigoPostal>${destinatario.codigo_postal || "28001"}</CodigoPostal><Poblacion>${destinatario.ciudad || "ESPAÑA"}</Poblacion><CodigoPais>ES</CodigoPais><Agencia></Agencia></Direccion>
          <Nombre>${(destinatario.nombre_empresa || "PROVEEDOR").substring(0, 40)}</Nombre>
          <Telefono>${limpiarTel(destinatario.telefono)}</Telefono>
          <Observaciones>Devolución ${dev.codigo}</Observaciones>
        </DatosEntrega>
        <DatosServicio>
          <Fecha>${fechaStr}</Fecha><Referencia>${dev.codigo}</Referencia><CodigoServicio>0200</CodigoServicio>
          <Bultos><BultoRequest><Alto></Alto><Largo></Largo><Ancho></Ancho><Dimension></Dimension><Referencia></Referencia><Peso></Peso></BultoRequest></Bultos>
          <NumeroBultos>1</NumeroBultos><Peso>2</Peso>
          <Notificaciones><NotificacionRequest></NotificacionRequest></Notificaciones>
          <SeguroOpcional><CodigoNaturaleza></CodigoNaturaleza><ValorAsegurado></ValorAsegurado></SeguroOpcional>
        </DatosServicio>
      </request>
    </TransmEnvio>
  </Body>
</Envelope>`;

  const response = await fetch(proxyUrl, {
    method: "POST",
    headers: { "Content-Type": "application/soap+xml; charset=utf-8", "x-proxy-secret": "rd-mrw-proxy-2026", "x-target-url": entorno },
    body: soapBody,
  });
  const xmlText = await response.text();
  const numeroEnvio = xmlText.match(/<NumeroEnvio>(.*?)<\/NumeroEnvio>/)?.[1]?.trim() || null;
  if (!numeroEnvio) return { ok: false, error: "MRW no devolvió número de envío", raw: xmlText.substring(0, 400) };

  let etiquetaUrl: string | null = null;
  let etiquetaBuffer: Buffer | null = null;
  try {
    const etiquetaXml = `<?xml version="1.0" encoding="utf-8"?>
<Envelope xmlns="http://www.w3.org/2003/05/soap-envelope">
  <Header><AuthInfo xmlns="http://www.mrw.es/"><CodigoFranquicia>${franquicia}</CodigoFranquicia><CodigoAbonado>${abonado}</CodigoAbonado><CodigoDepartamento>${departamento}</CodigoDepartamento><UserName>${username}</UserName><Password>${password}</Password></AuthInfo></Header>
  <Body><GetEtiquetaEnvio xmlns="http://www.mrw.es/"><request><NumeroEnvio>${numeroEnvio}</NumeroEnvio><TipoEtiquetaEnvio>0</TipoEtiquetaEnvio></request></GetEtiquetaEnvio></Body>
</Envelope>`;
    const etRes = await fetch(proxyUrl, { method: "POST", headers: { "Content-Type": "application/soap+xml; charset=utf-8", "x-proxy-secret": "rd-mrw-proxy-2026", "x-target-url": entorno }, body: etiquetaXml });
    const etText = await etRes.text();
    const base64 = etText.match(/<EtiquetaFile>([\s\S]*?)<\/EtiquetaFile>/)?.[1]?.trim();
    if (base64) {
      const result = await subirEtiqueta(base64, "mrw", dev.id);
      etiquetaUrl = result.url;
      etiquetaBuffer = result.buffer;
    }
  } catch (e) { console.error("Error etiqueta MRW dev:", e); }

  return { ok: true, tracking: numeroEnvio, etiquetaUrl, etiquetaBuffer };
}

// ── NACEX ─────────────────────────────────────────────────────────────────────
async function crearEnvioNACEX(dev: any, remitente: any, destinatario: any): Promise<ResultadoEnvio> {
  const baseUrl = "https://pda.nacex.com/nacex_ws/ws";
  const user = process.env.NACEX_USER || "";
  const pass = process.env.NACEX_PASS || "";
  const delCli = process.env.NACEX_DEL_CLI || "";
  const numCli = process.env.NACEX_NUM_CLI || "";

  function limpiarTel(tel: string) { return (tel || "").replace(/[\s\-\+]/g, "").replace(/^(0034|34)/, "").slice(0, 20); }

  const params = [
    `del_cli=${delCli}`, `num_cli=${numCli}`, `tip_ser=${process.env.NACEX_TIP_SER || "08"}`,
    `tip_cob=${process.env.NACEX_TIP_COB || "O"}`, `ref_cli=${dev.codigo}`, `tip_env=${process.env.NACEX_TIP_ENV || "2"}`,
    `bul=001`, `kil=2`,
    `nom_ent=${(destinatario.nombre_empresa || "PROVEEDOR").substring(0, 40)}`,
    `dir_ent=${(destinatario.direccion || "VER DEVOLUCION").substring(0, 100)}`,
    `pais_ent=ES`, `cp_ent=${destinatario.codigo_postal || "28001"}`,
    `pob_ent=${(destinatario.ciudad || "ESPAÑA").substring(0, 40)}`,
    `tel_ent=${limpiarTel(destinatario.telefono)}`,
    `nom_rec=${(remitente.nombre_empresa || "TALLER").substring(0, 40)}`,
    `dir_rec=${(remitente.direccion || "").substring(0, 100)}`,
    `cp_rec=${remitente.codigo_postal || ""}`,
    `pob_rec=${(remitente.ciudad || "").substring(0, 40)}`,
    `tel_rec=${limpiarTel(remitente.telefono)}`,
    `etiqueta=S`, `modelo=PDF_B`, `seguimiento=S`,
  ].join("|");

  const url = `${baseUrl}?method=putExpedicion&user=${encodeURIComponent(user)}&pass=${encodeURIComponent(pass)}&data=${encodeURIComponent(params)}`;
  const response = await fetch(url);
  const rawText = await response.text();
  const partes = rawText.split("|");
  const localizador = partes[1] || null;
  const etiquetaB64 = partes[13] || "";

  if (!localizador || !localizador.includes("/"))
    return { ok: false, error: "NACEX no devolvió localizador", raw: rawText.substring(0, 300) };

  let etiquetaUrl: string | null = null;
  let etiquetaBuffer: Buffer | null = null;
  if (etiquetaB64) {
    try {
      const result = await subirEtiqueta(etiquetaB64, "nacex", dev.id);
      etiquetaUrl = result.url;
      etiquetaBuffer = result.buffer;
    } catch (e) { console.error("Error etiqueta NACEX dev:", e); }
  }

  return { ok: true, tracking: localizador, etiquetaUrl, etiquetaBuffer };
}

// ── GLS ───────────────────────────────────────────────────────────────────────
async function crearEnvioGLS(dev: any, remitente: any, destinatario: any): Promise<ResultadoEnvio> {
  const GLS_URL = "https://ws-customer.gls-spain.es/b2b.asmx";
  const GLS_GUID = process.env.GLS_GUID || "fd2252c2-f36a-4e26-a2d7-b7ec0167fce7";

  const nom = (s: string) => (s || "").toUpperCase().substring(0, 40);
  const dir = (s: string) => (s || "").toUpperCase().substring(0, 100);
  const cp = (s: string) => (s || "28001").replace(/\D/g, "").substring(0, 5) || "28001";
  const tel = (s: string) => (s || "").replace(/\D/g, "").substring(0, 15);

  const xml = `<?xml version="1.0" encoding="utf-8"?>
<soap12:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap12="http://www.w3.org/2003/05/soap-envelope">
  <soap12:Body>
    <GrabaServicios xmlns="http://www.asmred.com/">
      <docIn>
        <Servicios uidcliente="${GLS_GUID}">
          <Envio>
            <Portes>P</Portes><Servicio>96</Servicio><Horario>18</Horario><Bultos>1</Bultos><Peso>2</Peso>
            <Remite><Nombre><![CDATA[${nom(remitente.nombre_empresa)}]]></Nombre><Direccion><![CDATA[${dir(remitente.direccion)}]]></Direccion><Poblacion><![CDATA[${nom(remitente.ciudad)}]]></Poblacion><Pais>34</Pais><CP>${cp(remitente.codigo_postal)}</CP><Telefono>${tel(remitente.telefono)}</Telefono></Remite>
            <Destinatario><Nombre><![CDATA[${nom(destinatario.nombre_empresa)}]]></Nombre><Direccion><![CDATA[${dir(destinatario.direccion)}]]></Direccion><Poblacion><![CDATA[${nom(destinatario.ciudad)}]]></Poblacion><Pais>34</Pais><CP>${cp(destinatario.codigo_postal)}</CP><Telefono>${tel(destinatario.telefono)}</Telefono><Email>${destinatario.email || ""}</Email><Observaciones><![CDATA[Devolucion ${dev.codigo}]]></Observaciones></Destinatario>
            <Referencias><Referencia tipo="0">${(dev.codigo || "").substring(0, 10).padStart(10, "0")}</Referencia><Referencia tipo="C">${dev.codigo}</Referencia></Referencias>
            <DevuelveAdicionales><Etiqueta tipo="PDF"></Etiqueta></DevuelveAdicionales>
          </Envio>
          <Plataforma>RecambioDirecto</Plataforma>
        </Servicios>
      </docIn>
    </GrabaServicios>
  </soap12:Body>
</soap12:Envelope>`;

  const res = await fetch(GLS_URL, { method: "POST", headers: { "Content-Type": "text/xml; charset=UTF-8" }, body: xml });
  const rawText = await res.text();
  const codbarras = rawText.match(/codbarras="([^"]+)"/)?.[1] || null;
  if (!codbarras) return { ok: false, error: "GLS no devolvió código", raw: rawText.substring(0, 400) };

  let etiquetaUrl: string | null = null;
  let etiquetaBuffer: Buffer | null = null;
  const tagOpen = '<Etiqueta bulto="1">';
  const tagClose = "</Etiqueta>";
  const i1 = rawText.indexOf(tagOpen);
  const i2 = rawText.indexOf(tagClose, i1);
  if (i1 > -1 && i2 > i1) {
    const b64 = rawText.substring(i1 + tagOpen.length, i2).replace(/[\r\n\s]/g, "");
    if (b64) {
      try {
        const result = await subirEtiqueta(b64, "gls", dev.id);
        etiquetaUrl = result.url;
        etiquetaBuffer = result.buffer;
      } catch (e) { console.error("Error etiqueta GLS dev:", e); }
    }
  }

  return { ok: true, tracking: codbarras, etiquetaUrl, etiquetaBuffer };
}

// ── CORREOS EXPRESS ───────────────────────────────────────────────────────────
async function crearEnvioCEX(dev: any, remitente: any, destinatario: any): Promise<ResultadoEnvio> {
  const CEX_URL = "https://www.cexpr.es/wspsc/apiRestGrabacionEnviok8s/json/grabacionEnvio";
  const CEX_USER = process.env.CEX_USUARIO!;
  const CEX_PASS = process.env.CEX_PASSWORD!;
  const CEX_SOLICITANTE = process.env.CEX_SOLICITANTE || ("I" + process.env.CEX_CODIGO_CLIENTE!);
  const CEX_CODIGO_CLIENTE = process.env.CEX_CODIGO_CLIENTE!;

  const hoy = new Date();
  const fechaStr = `${String(hoy.getDate()).padStart(2, "0")}${String(hoy.getMonth() + 1).padStart(2, "0")}${hoy.getFullYear()}`;
  const cpDest = (destinatario.codigo_postal || "28001").replace(/\D/g, "").substring(0, 5) || "28001";

  const body = {
    solicitante: CEX_SOLICITANTE, canalEntrada: "", numEnvio: "",
    ref: dev.codigo, refCliente: String(dev.id), fecha: fechaStr,
    codRte: CEX_CODIGO_CLIENTE,
    nomRte: (remitente.nombre_empresa || "TALLER").substring(0, 40),
    nifRte: "", dirRte: remitente.direccion || "VER DEVOLUCION",
    pobRte: (remitente.ciudad || "ESPAÑA").toUpperCase(),
    codPosNacRte: remitente.codigo_postal || "28001", paisISORte: "ES", codPosIntRte: "",
    contacRte: (remitente.nombre_empresa || "").substring(0, 40),
    telefRte: (remitente.telefono || "").replace(/\D/g, "").substring(0, 15),
    emailRte: remitente.email || "info@recambio-directo.com",
    codDest: "",
    nomDest: (destinatario.nombre_empresa || "PROVEEDOR").substring(0, 40),
    nifDest: "", dirDest: destinatario.direccion || "VER DEVOLUCION",
    pobDest: (destinatario.ciudad || "ESPAÑA").toUpperCase(),
    codPosNacDest: cpDest, paisISODest: "", codPosIntDest: "",
    contacDest: (destinatario.nombre_empresa || "").substring(0, 40),
    telefDest: (destinatario.telefono || "600000000").replace(/\D/g, "").substring(0, 15),
    emailDest: (destinatario.email || "").substring(0, 75),
    contacOtrs: "", telefOtrs: "", emailOtrs: "",
    observac: `Devolucion ${dev.codigo}`, numBultos: "1", kilos: "2.000",
    volumen: "", alto: "", largo: "", ancho: "", producto: "63", portes: "P",
    reembolso: "", entrSabado: "", seguro: "", numEnvioVuelta: "",
    listaBultos: [{ alto: "", ancho: "", codBultoCli: "", codUnico: "", descripcion: dev.referencia || dev.codigo, kilos: "2.000", largo: "", observaciones: "", orden: "1", referencia: dev.codigo, volumen: "" }],
    codDirecDestino: "", password: CEX_PASS,
    listaInformacionAdicional: [{ tipoEtiqueta: "1", etiquetaPDF: "", creaRecogida: "S", fechaRecogida: "", horaDesdeRecogida: "09:00", horaHastaRecogida: "18:00", referenciaRecogida: dev.codigo, codificacionUnicaB64: "1" }],
  };

  const authHeader = "Basic " + Buffer.from(`${CEX_USER}:${CEX_PASS}`).toString("base64");
  const resp = await fetch(CEX_URL, { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json", Authorization: authHeader }, body: JSON.stringify(body) });
  const rawText = await resp.text();
  if (rawText.trim().startsWith("<")) return { ok: false, error: "CEX devolvió HTML", raw: rawText.substring(0, 300) };

  const data = JSON.parse(rawText);
  if (data.codigoRetorno !== 0) return { ok: false, error: data.mensajeRetorno || "Error CEX", raw: data };

  const numEnvio = data.datosResultado;
  let etiquetaUrl: string | null = null;
  let etiquetaBuffer: Buffer | null = null;
  const etRaw = data.etiqueta?.[0]?.etiqueta1 || data.etiqueta?.[0]?.etiqueta2 || null;
  if (etRaw && !etRaw.includes("no se ha generado")) {
    try {
      const result = await subirEtiqueta(etRaw, "cex", dev.id);
      etiquetaUrl = result.url;
      etiquetaBuffer = result.buffer;
    } catch (e) { console.error("Error etiqueta CEX dev:", e); }
  }

  return { ok: true, tracking: numEnvio, etiquetaUrl, etiquetaBuffer };
}

// ── CTT EXPRESS ───────────────────────────────────────────────────────────────
async function crearEnvioCTT(dev: any, remitente: any, destinatario: any): Promise<ResultadoEnvio> {
  const CTT_CLIENT_ID = process.env.CTT_CLIENT_ID!;
  const CTT_CLIENT_SECRET = process.env.CTT_CLIENT_SECRET!;
  const CTT_USER = process.env.CTT_USER!;
  const CTT_PASSWORD = process.env.CTT_PASSWORD!;
  const CTT_CLIENT_CENTER = process.env.CTT_CLIENT_CENTER || "8032500001";
  const CTT_BASE_URL = "https://api.cttexpress.com";

  const tokenParams = new URLSearchParams({ client_id: CTT_CLIENT_ID, client_secret: CTT_CLIENT_SECRET, scope: "urn:com:ctt-express:integration-clients:scopes:common/ALL", grant_type: "client_credentials" });
  const tokenRes = await fetch(`${CTT_BASE_URL}/integrations/oauth2/token`, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: tokenParams.toString() });
  if (!tokenRes.ok) return { ok: false, error: "CTT token error" };
  const tokenData = await tokenRes.json();
  const token = tokenData.access_token;

  const tel = (s: string) => (s || "").replace(/\D/g, "");
  const fechaHoy = new Date().toISOString().split("T")[0];

  const body = {
    client_center_code: CTT_CLIENT_CENTER, shipping_type_code: "C24", client_bar_code: "",
    client_references: [dev.codigo, ""], shipping_weight_declared: 2, item_count: 1,
    sender_name: (remitente.nombre_empresa || "TALLER").substring(0, 40),
    sender_country_code: "ES", sender_postal_code: remitente.codigo_postal || "28001",
    sender_address: (remitente.direccion || "").substring(0, 100),
    sender_town: (remitente.ciudad || "").substring(0, 40),
    sender_email_notify_address: remitente.email || "",
    sender_phones: [`+34 ${tel(remitente.telefono)}`, ""],
    recipient_name: (destinatario.nombre_empresa || "PROVEEDOR").substring(0, 40),
    recipient_country_code: "ES", recipient_postal_code: (destinatario.codigo_postal || "28001").replace(/\D/g, "").substring(0, 10),
    recipient_address: (destinatario.direccion || "").substring(0, 100),
    recipient_town: (destinatario.ciudad || "").substring(0, 40),
    recipient_email_notify_address: destinatario.email || "",
    recipient_phones: [tel(destinatario.telefono) ? `+34 ${tel(destinatario.telefono)}` : "", ""],
    shipping_date: fechaHoy,
    delivery: { contact_name: (destinatario.nombre_empresa || "").substring(0, 40), referral_name: "", comments: `Devolucion ${dev.codigo}` },
    items: [{ item_synonym_code: "", item_weight_declared: 2, item_length_declared: 30, item_width_declared: 20, item_height_declared: 15, item_comments: dev.referencia || dev.codigo }],
  };

  const res = await fetch(`${CTT_BASE_URL}/integrations/manifest/v2.0/shippings`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, user_name: CTT_USER, password: CTT_PASSWORD }, body: JSON.stringify(body) });
  const rawText = await res.text();
  if (!res.ok) return { ok: false, error: "Error CTT", raw: rawText.substring(0, 400) };

  const data = JSON.parse(rawText);
  const shippingCode = data.shipping_data?.shipping_code || data.shipping_code || "";
  if (!shippingCode) return { ok: false, error: "CTT no devolvió código", raw: data };

  let etiquetaUrl: string | null = null;
  let etiquetaBuffer: Buffer | null = null;
  try {
    const labelRes = await fetch(`${CTT_BASE_URL}/integrations/trf/labelling/v1.0/shippings/${shippingCode}/shipping-labels?label_type_code=PDF&model_type_code=SINGLE&label_offset=1`, { headers: { Authorization: `Bearer ${token}`, user_name: CTT_USER, password: CTT_PASSWORD } });
    if (labelRes.ok) {
      const labelData = JSON.parse(await labelRes.text());
      const b64 = labelData.data?.[0]?.label || labelData.labels?.[0]?.label_data || null;
      if (b64) {
        const result = await subirEtiqueta(b64, "ctt", dev.id);
        etiquetaUrl = result.url;
        etiquetaBuffer = result.buffer;
      }
    }
  } catch (e) { console.error("Error etiqueta CTT dev:", e); }

  return { ok: true, tracking: shippingCode, etiquetaUrl, etiquetaBuffer };
}

// ── SEUR ──────────────────────────────────────────────────────────────────────
async function crearEnvioSEUR(dev: any, remitente: any, destinatario: any): Promise<ResultadoEnvio> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || "https://www.recambio-directo.com"}/api/seur/crear-envio`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        pedidoId: 0,
        pedidoCodigo: dev.codigo,
        remitenteNombre: remitente.nombre_empresa || "TALLER",
        remitenteCif: remitente.cif || "",
        remitenteDireccion: remitente.direccion || "",
        remitenteCodigoPostal: remitente.codigo_postal || "",
        remitentePoblacion: remitente.ciudad || "",
        remitenteTelefono: remitente.telefono || "",
        remitenteEmail: remitente.email || "",
        destinatarioNombre: destinatario.nombre_empresa || "PROVEEDOR",
        destinatarioDireccion: destinatario.direccion || "",
        destinatarioCodigoPostal: destinatario.codigo_postal || "",
        destinatarioPoblacion: destinatario.ciudad || "",
        destinatarioTelefono: destinatario.telefono || "",
        destinatarioEmail: destinatario.email || "",
        pesoKg: 2,
      }),
    });
    const data = await res.json();
    if (!data.ok) return { ok: false, error: data.error || "Error SEUR" };

    // Para SEUR intentar descargar la etiqueta si hay URL
    let etiquetaBuffer: Buffer | null = null;
    if (data.etiquetaUrl) {
      try {
        const etRes = await fetch(data.etiquetaUrl);
        if (etRes.ok) {
          const arrBuf = await etRes.arrayBuffer();
          etiquetaBuffer = Buffer.from(arrBuf);
        }
      } catch (e) { console.error("Error descargando etiqueta SEUR:", e); }
    }

    return { ok: true, tracking: data.tracking || data.collectionRef || "", etiquetaUrl: data.etiquetaUrl || null, etiquetaBuffer };
  } catch (e: any) {
    return { ok: false, error: e.message };
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// RUTA PRINCIPAL
// ══════════════════════════════════════════════════════════════════════════════
export async function POST(req: NextRequest) {
  try {
    const { devolucionId, agencia } = await req.json();
    if (!devolucionId || !agencia) return NextResponse.json({ error: "devolucionId y agencia requeridos" }, { status: 400 });

    const { data: dev, error } = await supabase.from("devoluciones").select("*").eq("id", devolucionId).single();
    if (error || !dev) return NextResponse.json({ error: "Devolución no encontrada" }, { status: 404 });

    // Remitente = solicitante (taller que devuelve)
    const remitente = await getDatosUsuario(dev.solicitante_id);
    if (!remitente) return NextResponse.json({ error: "No se encontró el solicitante" }, { status: 404 });

    // Destinatario = proveedor (recibe la pieza de vuelta)
    const destinatario = await getDatosUsuario(dev.proveedor_id);
    if (!destinatario) return NextResponse.json({ error: "No se encontró el proveedor" }, { status: 404 });

    let resultado: ResultadoEnvio;

    const ag = agencia.toLowerCase();
    if (ag.includes("mrw"))           resultado = await crearEnvioMRW(dev, remitente, destinatario);
    else if (ag.includes("nacex"))    resultado = await crearEnvioNACEX(dev, remitente, destinatario);
    else if (ag.includes("gls"))      resultado = await crearEnvioGLS(dev, remitente, destinatario);
    else if (ag.includes("correos"))  resultado = await crearEnvioCEX(dev, remitente, destinatario);
    else if (ag.includes("ctt"))      resultado = await crearEnvioCTT(dev, remitente, destinatario);
    else if (ag.includes("seur"))     resultado = await crearEnvioSEUR(dev, remitente, destinatario);
    else return NextResponse.json({ error: `Agencia no soportada: ${agencia}` }, { status: 400 });

    if (!resultado.ok) {
      console.error(`Error creando envío devolución ${agencia}:`, resultado.error, resultado.raw);
      return NextResponse.json({ error: resultado.error, raw: resultado.raw }, { status: 400 });
    }

    // Actualizar devolución
    await supabase.from("devoluciones").update({
      estado: "en_transito",
      agencia_devolucion: agencia,
      codigo_transporte: resultado.tracking || null,
      etiqueta_devolucion_url: resultado.etiquetaUrl || null,
      fecha_envio: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }).eq("id", devolucionId);

    // ── EMAIL CON ETIQUETA ADJUNTA AL TALLER ─────────────────────────────────
    const solicitanteEmail = dev.solicitante_email || remitente.email || "";
    if (solicitanteEmail) {
      try {
        const attachments: any[] = [];
        if (resultado.etiquetaBuffer) {
          attachments.push({
            filename: `etiqueta-devolucion-${dev.codigo}.pdf`,
            content: resultado.etiquetaBuffer,
          });
        }

        await resend.emails.send({
          from: "Recambio Directo <info@recambio-directo.com>",
          to: [solicitanteEmail],
          subject: `🚚 Etiqueta de envío lista — Devolución ${dev.codigo}`,
          attachments,
          html: `
            <div style="font-family:Arial;padding:30px;background:#f3f4f6;">
              <div style="background:white;padding:32px;border-radius:12px;max-width:600px;margin:auto;">
                <h1 style="color:#2563eb;font-size:24px;">🚚 Tu etiqueta de envío está lista</h1>
                <p style="color:#374151;font-size:15px;line-height:1.7;">
                  El envío de devolución <strong>${dev.codigo}</strong> ha sido creado con <strong>${agencia}</strong>.
                  ${resultado.etiquetaBuffer ? "Encontrarás la etiqueta adjunta a este email en PDF." : ""}
                </p>
                <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:16px;margin:20px 0;">
                  <p style="margin:0 0 8px;font-size:14px;"><strong>Devolución:</strong> ${dev.codigo}</p>
                  <p style="margin:0 0 8px;font-size:14px;"><strong>Pedido original:</strong> ${dev.pedido_codigo || `#${dev.pedido_id}`}</p>
                  <p style="margin:0 0 8px;font-size:14px;"><strong>Referencia:</strong> ${dev.referencia || "-"}</p>
                  <p style="margin:0 0 8px;font-size:14px;"><strong>Agencia:</strong> ${agencia}</p>
                  <p style="margin:0;font-size:14px;"><strong>Tracking:</strong> ${resultado.tracking || "Pendiente"}</p>
                </div>
                <div style="background:#fef3c7;border-left:4px solid #f59e0b;padding:14px 18px;margin-bottom:20px;">
                  <p style="margin:0;color:#92400e;font-size:13px;">
                    📦 <strong>Imprime la etiqueta y pégala en el paquete.</strong> La agencia pasará a recogerlo en tu dirección.
                  </p>
                </div>
                ${resultado.etiquetaUrl ? `
                <div style="text-align:center;margin:24px 0;">
                  <a href="${resultado.etiquetaUrl}" target="_blank"
                    style="background:linear-gradient(135deg,#2563eb,#1d4ed8);color:white;padding:14px 32px;border-radius:10px;text-decoration:none;font-weight:700;font-size:15px;">
                    📄 Descargar etiqueta →
                  </a>
                </div>` : ""}
                <hr style="margin:24px 0;border:none;border-top:1px solid #e5e7eb;" />
                <p style="color:#9ca3af;font-size:12px;text-align:center;">Recambio Directo · Marketplace B2B · España</p>
              </div>
            </div>
          `,
        });
      } catch (emailErr) {
        console.error("Error enviando email con etiqueta:", emailErr);
      }
    }

    // Notificación general (campanita + email al proveedor)
    try {
      await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || "https://www.recambio-directo.com"}/api/send-devolucion`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ evento: "enviada", devolucion: { ...dev, agencia_devolucion: agencia, codigo_transporte: resultado.tracking } }),
      });
    } catch (e) { console.error("Error notificando envío devolución:", e); }

    return NextResponse.json({
      ok: true,
      tracking: resultado.tracking,
      etiquetaUrl: resultado.etiquetaUrl,
    });

  } catch (e: any) {
    console.error("Error crear envío devolución:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}