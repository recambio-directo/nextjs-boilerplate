// app/api/mrw/crear-envio/route.ts
// Registra una recogida en MRW via SAGEC WebService (SOAP)
// Estructura validada por técnico MRW el 11/06/2026

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
      pesoKg = 5,
      numBultos = 1,
      fechaRecogida,
      observaciones = "",
    } = body;

    const entorno = process.env.MRW_ENTORNO === "test"
      ? "https://sagec-test.mrw.es/MRWEnvio.asmx"
      : "https://sagec.mrw.es/MRWEnvio.asmx";

    const franquicia  = process.env.MRW_FRANQUICIA   || "";
    const abonado     = process.env.MRW_ABONADO      || "";
    const departamento= process.env.MRW_DEPARTAMENTO || "";
    const username    = process.env.MRW_USERNAME     || "";
    const password    = process.env.MRW_PASSWORD     || "";

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

    const telRemitente   = limpiarTelefono(remitenteTelefono   || "");
    const telDestinatario= limpiarTelefono(destinatarioTelefono|| "");

    // XML exacto validado por técnico MRW
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
              ${destinatarioEmail ? `
              <CanalNotificacion>1</CanalNotificacion>
              <TipoNotificacion>4</TipoNotificacion>
              <MailSMS>${destinatarioEmail}</MailSMS>` : ""}
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

    const response = await fetch(entorno, {
      method: "POST",
      headers: {
        "Content-Type": "application/soap+xml; charset=utf-8",
        "SOAPAction": "http://www.mrw.es/TransmEnvio",
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
    await supabaseAdmin.from("pedidos").update({
      notas_internas: `MRW [${new Date().toISOString()}]: ${xmlText.substring(0, 800)}`
    }).eq("id", pedidoId);

    // Parsear respuesta XML
    const numeroEnvio  = xmlText.match(/<NumeroEnvio>(.*?)<\/NumeroEnvio>/)?.[1]   || null;
    const estado       = xmlText.match(/<Estado>(.*?)<\/Estado>/)?.[1]             || "0";
    const mensaje      = xmlText.match(/<Mensaje>(.*?)<\/Mensaje>/)?.[1]           || "";
    const urlResultado = xmlText.match(/<Url>(.*?)<\/Url>/)?.[1]                   || "";

    if (estado === "1" && numeroEnvio) {
      return Response.json({ ok: true, numeroEnvio, urlResultado, mensaje });
    } else {
      return Response.json({
        ok: false,
        error: mensaje || "Error al crear envío en MRW",
        xmlRaw: xmlText.substring(0, 500),
      }, { status: 400 });
    }

  } catch (error) {
    return Response.json({ ok: false, error: String(error) }, { status: 500 });
  }
}