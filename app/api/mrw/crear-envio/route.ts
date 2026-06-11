// app/api/mrw/crear-envio/route.ts
// Registra una recogida en MRW via SAGEC WebService (SOAP)

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      // Datos del pedido
      pedidoId,
      pedidoCodigo,
      // Datos del remitente (proveedor — quien envía)
      remitenteNombre,
      remitenteDireccion,
      remitenteCodigoPostal,
      remitentePoblacion,
      remitenteTelefono,
      // Datos del destinatario (cliente — quien recibe)
      destinatarioNombre,
      destinatarioDireccion,
      destinatarioCodigoPostal,
      destinatarioPoblacion,
      destinatarioTelefono,
      destinatarioEmail,
      // Datos del envío
      pesoKg = 5,
      numBultos = 1,
      fechaRecogida, // DDMMYYYY
      observaciones = "",
    } = body;

    const entorno = process.env.MRW_ENTORNO === "test"
      ? "https://sagec-test.mrw.es/MRWEnvio.asmx"
      : "https://sagec.mrw.es/MRWEnvio.asmx";

    const franquicia = process.env.MRW_FRANQUICIA || "";
    const abonado = process.env.MRW_ABONADO || "";
    const departamento = process.env.MRW_DEPARTAMENTO || "";
    const username = process.env.MRW_USERNAME || "";
    const password = process.env.MRW_PASSWORD || "";

    // Fecha de recogida: hoy o la que venga, formato DDMMYYYY
    const hoy = new Date();
    const fechaStr = fechaRecogida || [
      String(hoy.getDate()).padStart(2, "0"),
      String(hoy.getMonth() + 1).padStart(2, "0"),
      String(hoy.getFullYear()),
    ].join("/");

    // Limpiar teléfono español — solo 9 dígitos sin prefijo
    function limpiarTelefono(tel: string): string {
      if (!tel) return "";
      return tel.replace(/[\s\-\+]/g, "").replace(/^(0034|34|\+34)/, "").slice(0, 9);
    }

    const telRemitente = limpiarTelefono(remitenteTelefono || "");
    const telDestinatario = limpiarTelefono(destinatarioTelefono || "");

    const soapBody = `<?xml version="1.0" encoding="utf-8"?>
<soap12:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
                 xmlns:xsd="http://www.w3.org/2001/XMLSchema"
                 xmlns:soap12="http://www.w3.org/2003/05/soap-envelope">
  <soap12:Body>
    <TransmEnvio xmlns="http://www.mrw.es/">
      <AuthInfo>
        <CodigoFranquicia>${franquicia}</CodigoFranquicia>
        <CodigoAbonado>${abonado}</CodigoAbonado>
        <CodigoDepartamento>${departamento}</CodigoDepartamento>
        <UserName>${username}</UserName>
        <Password>${password}</Password>
      </AuthInfo>
      <TransmEnvioRequest>
        <DatosRecogida>
          <Nombre>${remitenteNombre}</Nombre>
          <Direccion>
            <Via>${remitenteDireccion}</Via>
            <CodigoPostal>${remitenteCodigoPostal}</CodigoPostal>
            <Poblacion>${remitentePoblacion}</Poblacion>
          </Direccion>
          ${telRemitente ? `<Telefono>${telRemitente}</Telefono>` : ""}
        </DatosRecogida>
        <DatosEntrega>
          <Nif></Nif>
          <Nombre>${destinatarioNombre}</Nombre>
          <Direccion>
            <Via>${destinatarioDireccion}</Via>
            <CodigoPostal>${destinatarioCodigoPostal}</CodigoPostal>
            <Poblacion>${destinatarioPoblacion}</Poblacion>
          </Direccion>
          ${telDestinatario ? `<Telefono>${telDestinatario}</Telefono>` : ""}
          <Observaciones>${observaciones || pedidoCodigo}</Observaciones>
        </DatosEntrega>
        <DatosServicio>
          <Fecha>${fechaStr}</Fecha>
          <Referencia>${pedidoCodigo}</Referencia>
          <EnFranquicia>N</EnFranquicia>
          <CodigoServicio>0200</CodigoServicio>
          <NumeroBultos>${numBultos}</NumeroBultos>
          <Peso>${Math.ceil(pesoKg)}</Peso>
          <EntregaSabado>N</EntregaSabado>
          <Notificaciones>
            ${destinatarioEmail ? `
            <Notificacion>
              <CanalNotificacion>1</CanalNotificacion>
              <TipoNotificacion>4</TipoNotificacion>
              <MailSMS>${destinatarioEmail}</MailSMS>
            </Notificacion>` : ""}
            ${telDestinatario ? `
            <Notificacion>
              <CanalNotificacion>2</CanalNotificacion>
              <TipoNotificacion>4</TipoNotificacion>
              <MailSMS>${telDestinatario}</MailSMS>
            </Notificacion>` : ""}
          </Notificaciones>
        </DatosServicio>
      </TransmEnvioRequest>
    </TransmEnvio>
  </soap12:Body>
</soap12:Envelope>`;

    const response = await fetch(entorno, {
      method: "POST",
      headers: {
        "Content-Type": "application/soap+xml; charset=utf-8",
        "SOAPAction": "http://www.mrw.es/TransmEnvio",
      },
      body: soapBody,
    });

    const xmlText = await response.text();

    // Guardar respuesta raw en Supabase para debug
    const { createClient } = await import("@supabase/supabase-js");
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    await supabaseAdmin.from("pedidos").update({
      notas_internas: `MRW [${new Date().toISOString()}]: ${xmlText.substring(0, 500)}`
    }).eq("id", pedidoId);

    // Parsear respuesta XML
    const numeroEnvio = xmlText.match(/<NumeroEnvio>(.*?)<\/NumeroEnvio>/)?.[1] || null;
    const estado = xmlText.match(/<Estado>(.*?)<\/Estado>/)?.[1] || "0";
    const mensaje = xmlText.match(/<Mensaje>(.*?)<\/Mensaje>/)?.[1] || "";
    const urlResultado = xmlText.match(/<Url>(.*?)<\/Url>/)?.[1] || "";

    if (estado === "1" && numeroEnvio) {
      return Response.json({
        ok: true,
        numeroEnvio,
        urlResultado,
        mensaje,
      });
    } else {
      console.error("MRW error:", mensaje, xmlText);
      return Response.json({
        ok: false,
        error: mensaje || "Error al crear envío en MRW",
        xmlRaw: xmlText,
      }, { status: 400 });
    }

  } catch (error) {
    console.error("Error MRW crear-envio:", error);
    return Response.json({ ok: false, error: String(error) }, { status: 500 });
  }
}