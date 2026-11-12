// app/api/mrw/crear-envio/route.ts
// SOAP 1.1 con text/xml — según WSDL oficial sagec-test.mrw.es/MRWEnvio.asmx?op=TransmEnvio
import {
  sbAdmin, cargarDatosEnvio, tieneEnvio, guardarPedido, subirEtiqueta,
  anotar, incidencia, fetchT, esperar, txt, escXml, hoyMadrid,
} from "@/app/lib/envios";

const supabase = sbAdmin();

// Proxy VPS con IP fija para evitar bloqueo de SAGEC.
// Se puede cambiar desde Vercel (MRW_PROXY_URL / MRW_PROXY_SECRET) sin tocar código.
const PROXY_URL    = process.env.MRW_PROXY_URL    || "http://168.231.83.226:3000";
const PROXY_SECRET = process.env.MRW_PROXY_SECRET || "rd-mrw-proxy-2026";

function credencialesMRW() {
  return {
    entorno: process.env.MRW_ENTORNO === "test"
      ? "https://sagec-test.mrw.es/MRWEnvio.asmx"
      : "https://sagec.mrw.es/MRWEnvio.asmx",
    franquicia:   process.env.MRW_FRANQUICIA    || "",
    abonado:      process.env.MRW_ABONADO       || "",
    departamento: process.env.MRW_DEPARTAMENTO  || "",
    username:     process.env.MRW_USERNAME      || "",
    password:     process.env.MRW_PASSWORD      || "",
  };
}

async function llamarMRW(xml: string, ms = 15000): Promise<string> {
  const { entorno } = credencialesMRW();
  const response = await fetchT(PROXY_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/soap+xml; charset=utf-8",
      "x-proxy-secret": PROXY_SECRET,
      "x-target-url": entorno,
    },
    body: xml,
  }, ms);
  return await response.text();
}

// Etiqueta oficial MRW (PDF con Code128), con reintento
async function obtenerEtiquetaMRW(numeroEnvio: string, pedidoCodigo: string): Promise<string | null> {
  const { franquicia, abonado, departamento, username, password } = credencialesMRW();
  const etiquetaXml = `<?xml version="1.0" encoding="utf-8"?>
<Envelope xmlns="http://www.w3.org/2003/05/soap-envelope">
  <Header>
    <AuthInfo xmlns="http://www.mrw.es/">
      <CodigoFranquicia>${escXml(franquicia)}</CodigoFranquicia>
      <CodigoAbonado>${escXml(abonado)}</CodigoAbonado>
      <CodigoDepartamento>${escXml(departamento)}</CodigoDepartamento>
      <UserName>${escXml(username)}</UserName>
      <Password>${escXml(password)}</Password>
    </AuthInfo>
  </Header>
  <Body>
    <GetEtiquetaEnvio xmlns="http://www.mrw.es/">
      <request>
        <NumeroEnvio>${escXml(numeroEnvio)}</NumeroEnvio>
        <TipoEtiquetaEnvio>0</TipoEtiquetaEnvio>
      </request>
    </GetEtiquetaEnvio>
  </Body>
</Envelope>`;

  for (let intento = 1; intento <= 3; intento++) {
    try {
      const etiquetaXmlText = await llamarMRW(etiquetaXml, 8000);
      const etiquetaBase64 = etiquetaXmlText.match(/<EtiquetaFile>([\s\S]*?)<\/EtiquetaFile>/)?.[1]?.trim() || null;
      if (etiquetaBase64) {
        const url = await subirEtiqueta(
          supabase,
          `documentos/${pedidoCodigo}/etiqueta-mrw-${pedidoCodigo}.pdf`,
          Buffer.from(etiquetaBase64, "base64")
        );
        if (url) return url;
      } else {
        console.error(`MRW etiqueta sin EtiquetaFile (intento ${intento}):`, etiquetaXmlText.substring(0, 300));
      }
    } catch (etiquetaErr) {
      console.error(`Error obteniendo etiqueta MRW (intento ${intento}):`, etiquetaErr);
    }
    if (intento < 3) await esperar(1500);
  }
  return null;
}

export async function POST(request: Request) {
  let pedidoId: unknown = null;
  let codigo = "";
  try {
    const body = await request.json();
    pedidoId = body?.pedidoId;
    if (!pedidoId) return Response.json({ ok: false, error: "pedidoId requerido" }, { status: 400 });

    const r = await cargarDatosEnvio(supabase, pedidoId, body);
    if (!r.ok) {
      if (r.status !== 404) await incidencia(supabase, pedidoId, "", "MRW", r.error);
      return Response.json({ ok: false, error: r.error }, { status: r.status });
    }
    const { pedido, remitente, destinatario, pesoKg, avisos } = r.datos;
    codigo = r.datos.codigo;
    const pedidoCodigo = codigo;

    // ── El pedido ya tiene envío MRW: no se duplica. Si falta la etiqueta, se reintenta.
    if (tieneEnvio(pedido, "mrw", pedido.tracking_mrw)) {
      const numeroEnvio = txt(pedido.tracking_mrw) || txt(pedido.tracking);
      let etiquetaMrwUrl: string | null = txt(pedido.etiqueta_mrw_url) || txt(pedido.etiqueta_envio_url) || null;
      if (!etiquetaMrwUrl) {
        etiquetaMrwUrl = await obtenerEtiquetaMRW(numeroEnvio, pedidoCodigo);
        if (etiquetaMrwUrl) await guardarPedido(supabase, pedidoId, { etiqueta_mrw_url: etiquetaMrwUrl, etiqueta_envio_url: etiquetaMrwUrl });
      }
      return Response.json({ ok: true, yaExistia: true, numeroEnvio, numeroSolicitud: null, urlResultado: "", etiquetaMrwUrl });
    }

    const { franquicia, abonado, departamento, username, password } = credencialesMRW();
    const numBultos = Number(body?.numBultos) > 0 ? Math.floor(Number(body.numBultos)) : 1;
    const observaciones = txt(body?.observaciones);
    const kilos = Math.max(1, Math.ceil(pesoKg));
    const hoy = hoyMadrid();
    const fechaStr = txt(body?.fechaRecogida) || `${hoy.dd}/${hoy.mm}/${hoy.yyyy}`;

    // Estructura EXACTA del técnico MRW — sin prefijo soap:, namespace en Envelope
    const soapBody = `<?xml version="1.0" encoding="utf-8"?>
<Envelope xmlns="http://www.w3.org/2003/05/soap-envelope">
  <Header>
    <AuthInfo xmlns="http://www.mrw.es/">
      <CodigoFranquicia>${escXml(franquicia)}</CodigoFranquicia>
      <CodigoAbonado>${escXml(abonado)}</CodigoAbonado>
      <CodigoDepartamento>${escXml(departamento)}</CodigoDepartamento>
      <UserName>${escXml(username)}</UserName>
      <Password>${escXml(password)}</Password>
    </AuthInfo>
  </Header>
  <Body>
    <TransmEnvio xmlns="http://www.mrw.es/">
      <request>
        <ModificaDatosEnvio>
          <NumeroEnvioOriginal></NumeroEnvioOriginal>
        </ModificaDatosEnvio>
        <DatosRecogida>
          <Direccion>
            <CodigoDireccion></CodigoDireccion>
            <CodigoTipoVia></CodigoTipoVia>
            <Via>${escXml(remitente.direccion)}</Via>
            <Numero></Numero>
            <Resto></Resto>
            <CodigoPostal>${remitente.cp}</CodigoPostal>
            <Poblacion>${escXml(remitente.poblacion)}</Poblacion>
            <Provincia></Provincia>
            <Estado></Estado>
            <CodigoPais>ES</CodigoPais>
            <TipoPuntoEntrega></TipoPuntoEntrega>
            <CodigoPuntoEntrega></CodigoPuntoEntrega>
            <CodigoFranquiciaAsociadaPuntoEntrega/>
            <TipoPuntoRecogida></TipoPuntoRecogida>
            <CodigoPuntoRecogida/>
            <CodigoFranquiciaAsociadaPuntoRecogida/>
            <Agencia></Agencia>
          </Direccion>
          <Nif></Nif>
          <Nombre>${escXml(remitente.nombre)}</Nombre>
          <Telefono>${remitente.telefono}</Telefono>
          <Contacto></Contacto>
          <Horario>
            <Rangos>
              <HorarioRangoRequest>
                <Desde></Desde>
                <Hasta></Hasta>
              </HorarioRangoRequest>
            </Rangos>
          </Horario>
          <Observaciones></Observaciones>
        </DatosRecogida>
        <DatosEntrega>
          <Direccion>
            <CodigoDireccion></CodigoDireccion>
            <CodigoTipoVia></CodigoTipoVia>
            <Via>${escXml(destinatario.direccion)}</Via>
            <Numero></Numero>
            <Resto></Resto>
            <CodigoPostal>${destinatario.cp}</CodigoPostal>
            <Poblacion>${escXml(destinatario.poblacion)}</Poblacion>
            <Provincia></Provincia>
            <Estado></Estado>
            <CodigoPais>ES</CodigoPais>
            <TipoPuntoEntrega></TipoPuntoEntrega>
            <CodigoPuntoEntrega></CodigoPuntoEntrega>
            <CodigoFranquiciaAsociadaPuntoEntrega/>
            <TipoPuntoRecogida></TipoPuntoRecogida>
            <CodigoPuntoRecogida/>
            <CodigoFranquiciaAsociadaPuntoRecogida/>
            <Agencia></Agencia>
          </Direccion>
          <Nif></Nif>
          <Nombre>${escXml(destinatario.nombre)}</Nombre>
          <Telefono>${destinatario.telefono}</Telefono>
          <Contacto></Contacto>
          <ALaAtencionDe></ALaAtencionDe>
          <Horario>
            <Rangos>
              <HorarioRangoRequest>
                <Desde></Desde>
                <Hasta></Hasta>
              </HorarioRangoRequest>
            </Rangos>
          </Horario>
          <Observaciones>${escXml(observaciones || pedidoCodigo)}</Observaciones>
        </DatosEntrega>
        <DatosServicio>
          <Fecha>${fechaStr}</Fecha>
          <NumeroAlbaran></NumeroAlbaran>
          <Referencia>${escXml(pedidoCodigo)}</Referencia>
          <EnFranquicia></EnFranquicia>
          <CodigoServicio>0200</CodigoServicio>
          <DescripcionServicio></DescripcionServicio>
          <Frecuencia></Frecuencia>
          <CodigoPromocion></CodigoPromocion>
          <NumeroSobre></NumeroSobre>
          <Bultos>
            <BultoRequest>
              <Alto></Alto>
              <Largo></Largo>
              <Ancho></Ancho>
              <Dimension></Dimension>
              <Referencia></Referencia>
              <Peso></Peso>
            </BultoRequest>
          </Bultos>
          <NumeroBultos>${numBultos}</NumeroBultos>
          <Peso>${kilos}</Peso>
          <NumeroPuentes></NumeroPuentes>
          <EntregaSabado></EntregaSabado>
          <Entrega830></Entrega830>
          <EntregaPartirDe></EntregaPartirDe>
          <Gestion></Gestion>
          <Retorno></Retorno>
          <CodigoServicioRetorno></CodigoServicioRetorno>
          <ConfirmacionInmediata></ConfirmacionInmediata>
          <Reembolso></Reembolso>
          <ImporteReembolso></ImporteReembolso>
          <TipoMercancia></TipoMercancia>
          <ValorDeclarado></ValorDeclarado>
          <ServicioEspecial></ServicioEspecial>
          <CodigoMoneda></CodigoMoneda>
          <ValorEstadistico></ValorEstadistico>
          <ValorEstadisticoEuros></ValorEstadisticoEuros>
          <Notificaciones>
            <NotificacionRequest>
            </NotificacionRequest>
          </Notificaciones>
          <SeguroOpcional>
            <CodigoNaturaleza></CodigoNaturaleza>
            <ValorAsegurado></ValorAsegurado>
          </SeguroOpcional>
          <TramoHorario></TramoHorario>
          <PortesDebidos></PortesDebidos>
          <Mascara_Tipos></Mascara_Tipos>
          <Mascara_Campos></Mascara_Campos>
          <Asistente></Asistente>
        </DatosServicio>
      </request>
    </TransmEnvio>
  </Body>
</Envelope>`;

    const xmlText = await llamarMRW(soapBody);

    // Respuesta SOAP 1.1: <NumeroEnvio> directamente en TransmEnvioResult
    const numeroEnvio     = (xmlText.match(/<NumeroEnvio>(.*?)<\/NumeroEnvio>/)?.[1] || "").trim();
    const numeroSolicitud = xmlText.match(/<NumeroSolicitud>(.*?)<\/NumeroSolicitud>/)?.[1]   || null;
    const urlResultado    = xmlText.match(/<Url>(.*?)<\/Url>/)?.[1]                           || "";

    if (!numeroEnvio) {
      const mensaje = xmlText.match(/<Mensaje>([\s\S]*?)<\/Mensaje>/)?.[1]?.trim() || "";
      await incidencia(supabase, pedidoId, codigo, "MRW", `MRW no devolvió número de envío${mensaje ? ": " + mensaje : ""}`, xmlText.substring(0, 800));
      return Response.json({
        ok: false,
        error: "MRW no devolvió número de envío",
        xmlRaw: xmlText.substring(0, 600),
      }, { status: 400 });
    }

    // Primero se guarda el envío (lo importante); después la etiqueta
    const g1 = await guardarPedido(supabase, pedidoId, {
      tracking: numeroEnvio,
      tracking_mrw: numeroEnvio,
      estado_envio: "preparando",
      agencia: "MRW",
    });
    await anotar(supabase, pedidoId, `MRW OK — Envío ${numeroEnvio} — Solicitud ${numeroSolicitud || "-"} — ${kilos} kg${avisos.length ? " — Avisos: " + avisos.join("; ") : ""}`);
    if (g1.error) await incidencia(supabase, pedidoId, codigo, "MRW", `Envío ${numeroEnvio} creado en MRW pero NO se pudo guardar en el pedido`, g1.error);

    const etiquetaMrwUrl = await obtenerEtiquetaMRW(numeroEnvio, pedidoCodigo);
    if (etiquetaMrwUrl) {
      const g2 = await guardarPedido(supabase, pedidoId, {
        etiqueta_mrw_url: etiquetaMrwUrl,
        etiqueta_envio_url: etiquetaMrwUrl, // compatibilidad con panel proveedor
      });
      if (g2.error) await incidencia(supabase, pedidoId, codigo, "MRW", `Etiqueta del envío ${numeroEnvio} generada pero no guardada en el pedido`, `${g2.error} — ${etiquetaMrwUrl}`);
    } else {
      await incidencia(supabase, pedidoId, codigo, "MRW", `Envío ${numeroEnvio} creado pero MRW no devolvió la etiqueta tras 3 intentos`);
    }

    return Response.json({ ok: true, numeroEnvio, numeroSolicitud, urlResultado, etiquetaMrwUrl });

  } catch (error) {
    console.error("Error MRW crear-envio:", error);
    await incidencia(supabase, pedidoId, codigo, "MRW", "Error inesperado al crear el envío (¿proxy VPS caído?)", String(error));
    return Response.json({ ok: false, error: String(error) }, { status: 500 });
  }
}
