// app/api/mrw/test/route.ts
// Llamada de diagnóstico con XML fijo del técnico MRW
// Acceder a: /api/mrw/test

import { createClient } from "@supabase/supabase-js";

export async function GET() {
  const entorno = process.env.MRW_ENTORNO === "test"
    ? "https://sagec-test.mrw.es/MRWEnvio.asmx"
    : "https://sagec.mrw.es/MRWEnvio.asmx";

  const username = process.env.MRW_USERNAME || "";
  const password = process.env.MRW_PASSWORD || "";

  // XML exacto del técnico con credenciales reales
  const xml = `<?xml version="1.0" encoding="utf-8"?>
<Envelope xmlns="http://www.w3.org/2003/05/soap-envelope">
  <Header>
    <AuthInfo xmlns="http://www.mrw.es/">
      <CodigoFranquicia>02804</CodigoFranquicia>
      <CodigoAbonado>099960</CodigoAbonado>
      <CodigoDepartamento></CodigoDepartamento>
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
            <Via>C/ Sola 16</Via>
            <Numero></Numero>
            <Resto></Resto>
            <CodigoPostal>30430</CodigoPostal>
            <Poblacion>Cehegin</Poblacion>
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
          <Nombre>Auto Recambios Gran Via</Nombre>
          <Telefono>744487895</Telefono>
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
            <Via>Calle Mayor 1</Via>
            <Numero></Numero>
            <Resto></Resto>
            <CodigoPostal>28001</CodigoPostal>
            <Poblacion>MADRID</Poblacion>
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
          <Nombre>Taller Prueba</Nombre>
          <Telefono>600000000</Telefono>
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
          <Observaciones>RD-TEST-001</Observaciones>
        </DatosEntrega>
        <DatosServicio>
          <Fecha>11/06/2026</Fecha>
          <NumeroAlbaran></NumeroAlbaran>
          <Referencia>RD-TEST-001</Referencia>
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
          <NumeroBultos>1</NumeroBultos>
          <Peso>5</Peso>
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

  const results: any = { entorno, timestamp: new Date().toISOString(), intentos: [] };

  // Intento 1: application/soap+xml sin SOAPAction
  try {
    const r1 = await fetch(entorno, { method: "POST", headers: { "Content-Type": "application/soap+xml; charset=utf-8" }, body: xml });
    const t1 = await r1.text();
    results.intentos.push({ headers: "application/soap+xml sin SOAPAction", status: r1.status, esHTML: t1.includes("<!DOCTYPE"), primeros200: t1.substring(0, 200) });
  } catch(e) { results.intentos.push({ headers: "application/soap+xml sin SOAPAction", error: String(e) }); }

  // Intento 2: text/xml con SOAPAction
  try {
    const r2 = await fetch(entorno, { method: "POST", headers: { "Content-Type": "text/xml; charset=utf-8", "SOAPAction": "\"http://www.mrw.es/TransmEnvio\"" }, body: xml });
    const t2 = await r2.text();
    results.intentos.push({ headers: "text/xml con SOAPAction", status: r2.status, esHTML: t2.includes("<!DOCTYPE"), primeros200: t2.substring(0, 200) });
  } catch(e) { results.intentos.push({ headers: "text/xml con SOAPAction", error: String(e) }); }

  // Intento 3: application/soap+xml con SOAPAction
  try {
    const r3 = await fetch(entorno, { method: "POST", headers: { "Content-Type": "application/soap+xml; charset=utf-8", "SOAPAction": "http://www.mrw.es/TransmEnvio" }, body: xml });
    const t3 = await r3.text();
    results.intentos.push({ headers: "application/soap+xml con SOAPAction sin comillas", status: r3.status, esHTML: t3.includes("<!DOCTYPE"), primeros200: t3.substring(0, 200) });
  } catch(e) { results.intentos.push({ headers: "application/soap+xml con SOAPAction sin comillas", error: String(e) }); }

  // Guardar en Supabase
  try {
    const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
    await sb.from("pedidos").update({ notas_internas: `MRW TEST [${new Date().toISOString()}]: ${JSON.stringify(results, null, 2).substring(0, 1000)}` }).eq("id", 1);
  } catch(e) {}

  return Response.json(results);
}