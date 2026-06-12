// app/api/mrw/crear-envio/route.ts
// SOAP 1.1 con text/xml — según WSDL oficial sagec-test.mrw.es/MRWEnvio.asmx?op=TransmEnvio

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      pedidoId, pedidoCodigo,
      remitenteNombre, remitenteDireccion, remitenteCodigoPostal, remitentePoblacion, remitenteTelefono,
      destinatarioNombre, destinatarioDireccion, destinatarioCodigoPostal, destinatarioPoblacion, destinatarioTelefono, destinatarioEmail,
      pesoKg = 5, numBultos = 1, fechaRecogida, observaciones = "",
    } = body;

    const entorno = process.env.MRW_ENTORNO === "test"
      ? "https://sagec-test.mrw.es/MRWEnvio.asmx"
      : "https://sagec.mrw.es/MRWEnvio.asmx";

    const franquicia   = process.env.MRW_FRANQUICIA    || "";
    const abonado      = process.env.MRW_ABONADO       || "";
    const departamento = process.env.MRW_DEPARTAMENTO  || "";
    const username     = process.env.MRW_USERNAME      || "";
    const password     = process.env.MRW_PASSWORD      || "";

    const hoy = new Date();
    const fechaStr = fechaRecogida || [
      String(hoy.getDate()).padStart(2, "0"),
      String(hoy.getMonth() + 1).padStart(2, "0"),
      String(hoy.getFullYear()),
    ].join("/");

    function limpiarTelefono(tel: string): string {
      if (!tel) return "";
      return tel.replace(/[\s\-\+]/g, "").replace(/^(0034|34|\+34)/, "").slice(0, 9);
    }

    const telRemitente    = limpiarTelefono(remitenteTelefono    || "");
    const telDestinatario = limpiarTelefono(destinatarioTelefono || "");

    // Estructura EXACTA del técnico MRW — sin prefijo soap:, namespace en Envelope
    const soapBody = `<?xml version="1.0" encoding="utf-8"?>
<Envelope xmlns="http://www.w3.org/2003/05/soap-envelope">
  <Header>
    <AuthInfo xmlns="http://www.mrw.es/">
      <CodigoFranquicia>${franquicia}</CodigoFranquicia>
      <CodigoAbonado>${abonado}</CodigoAbonado>
      <CodigoDepartamento>${departamento}</CodigoDepartamento>
      <UserName>${username}</UserName>
      <Password>${password}</Password>
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
            <Via>${remitenteDireccion}</Via>
            <Numero></Numero>
            <Resto></Resto>
            <CodigoPostal>${remitenteCodigoPostal}</CodigoPostal>
            <Poblacion>${remitentePoblacion}</Poblacion>
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
          <Nombre>${remitenteNombre}</Nombre>
          <Telefono>${telRemitente}</Telefono>
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
            <Via>${destinatarioDireccion}</Via>
            <Numero></Numero>
            <Resto></Resto>
            <CodigoPostal>${destinatarioCodigoPostal}</CodigoPostal>
            <Poblacion>${destinatarioPoblacion}</Poblacion>
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
          <Nombre>${destinatarioNombre}</Nombre>
          <Telefono>${telDestinatario}</Telefono>
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
          <Observaciones>${observaciones || pedidoCodigo}</Observaciones>
        </DatosEntrega>
        <DatosServicio>
          <Fecha>${fechaStr}</Fecha>
          <NumeroAlbaran></NumeroAlbaran>
          <Referencia>${pedidoCodigo}</Referencia>
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
          <Peso>${Math.ceil(pesoKg)}</Peso>
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

    // Usar proxy VPS con IP fija para evitar bloqueo de SAGEC
    const proxyUrl = "http://168.231.83.226:3000";
    const targetUrl = entorno;

    const response = await fetch(proxyUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/soap+xml; charset=utf-8",
        "x-proxy-secret": "rd-mrw-proxy-2026",
        "x-target-url": targetUrl,
      },
      body: soapBody,
    });

    const xmlText = await response.text();

    // Guardar respuesta en Supabase para debug
    const { createClient } = await import("@supabase/supabase-js");
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    await supabaseAdmin.from("pedidos")
      .update({ notas_internas: `MRW [${new Date().toISOString()}]: ${xmlText.substring(0, 800)}` })
      .eq("id", pedidoId);

    // Respuesta SOAP 1.1: <NumeroEnvio> directamente en TransmEnvioResult
    const numeroEnvio     = xmlText.match(/<NumeroEnvio>(.*?)<\/NumeroEnvio>/)?.[1]         || null;
    const numeroSolicitud = xmlText.match(/<NumeroSolicitud>(.*?)<\/NumeroSolicitud>/)?.[1]   || null;
    const urlResultado    = xmlText.match(/<Url>(.*?)<\/Url>/)?.[1]                           || "";

    if (numeroEnvio && numeroEnvio.trim() !== "") {
      await supabaseAdmin.from("pedidos").update({
        tracking: numeroEnvio.trim(),
        estado_envio: "preparando",
        notas_internas: `MRW OK — Envio: ${numeroEnvio.trim()} — Solicitud: ${numeroSolicitud || ""}`,
      }).eq("id", pedidoId);

      // Obtener etiqueta oficial MRW (PDF con Code128)
      let etiquetaMrwUrl: string | null = null;
      try {
        const etiquetaXml = `<?xml version="1.0" encoding="utf-8"?>
<Envelope xmlns="http://www.w3.org/2003/05/soap-envelope">
  <Header>
    <AuthInfo xmlns="http://www.mrw.es/">
      <CodigoFranquicia>${franquicia}</CodigoFranquicia>
      <CodigoAbonado>${abonado}</CodigoAbonado>
      <CodigoDepartamento>${departamento}</CodigoDepartamento>
      <UserName>${username}</UserName>
      <Password>${password}</Password>
    </AuthInfo>
  </Header>
  <Body>
    <GetEtiquetaEnvio xmlns="http://www.mrw.es/">
      <request>
        <NumeroEnvio>${numeroEnvio.trim()}</NumeroEnvio>
        <TipoEtiquetaEnvio>0</TipoEtiquetaEnvio>
      </request>
    </GetEtiquetaEnvio>
  </Body>
</Envelope>`;

        const etiquetaRes = await fetch(proxyUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/soap+xml; charset=utf-8",
            "x-proxy-secret": "rd-mrw-proxy-2026",
            "x-target-url": targetUrl,
          },
          body: etiquetaXml,
        });

        const etiquetaXmlText = await etiquetaRes.text();
        const etiquetaBase64 = etiquetaXmlText.match(/<EtiquetaFile>([\s\S]*?)<\/EtiquetaFile>/)?.[1]?.trim() || null;

        if (etiquetaBase64) {
          // Convertir base64 a buffer y subir a Supabase Storage
          const pdfBuffer = Buffer.from(etiquetaBase64, "base64");
          const etiquetaPath = `documentos/${pedidoCodigo}/etiqueta-mrw-${pedidoCodigo}.pdf`;
          await supabaseAdmin.storage.from("FACTURAS").upload(etiquetaPath, pdfBuffer, {
            contentType: "application/pdf",
            upsert: true,
          });
          const { data: urlData } = supabaseAdmin.storage.from("FACTURAS").getPublicUrl(etiquetaPath);
          etiquetaMrwUrl = urlData.publicUrl;
          await supabaseAdmin.from("pedidos").update({ etiqueta_envio_url: etiquetaMrwUrl }).eq("id", pedidoId);
        }
      } catch (etiquetaErr) {
        console.error("Error obteniendo etiqueta MRW:", etiquetaErr);
      }

      return Response.json({ ok: true, numeroEnvio: numeroEnvio.trim(), numeroSolicitud, urlResultado, etiquetaMrwUrl });
    } else {
      return Response.json({
        ok: false,
        error: "MRW no devolvió número de envío",
        xmlRaw: xmlText.substring(0, 600),
      }, { status: 400 });
    }

  } catch (error) {
    return Response.json({ ok: false, error: String(error) }, { status: 500 });
  }
}