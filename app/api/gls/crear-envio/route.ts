// app/api/gls/crear-envio/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const GLS_URL  = "https://ws-customer.gls-spain.es/b2b.asmx";
const GLS_GUID = process.env.GLS_GUID || "fd2252c2-f36a-4e26-a2d7-b7ec0167fce7";

// Servicio BusinessParcel 24/48h (peninsular)
const GLS_SERVICIO = "96";
const GLS_HORARIO  = "18";

export async function POST(req: NextRequest) {
  try {
    const { pedidoId } = await req.json();
    if (!pedidoId) return NextResponse.json({ error: "pedidoId requerido" }, { status: 400 });

    const { data: pedido, error } = await supabase
      .from("pedidos")
      .select("*")
      .eq("id", pedidoId)
      .single();

    if (error || !pedido) return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 });

    const productos = pedido.productos || [];
    const kilos     = Math.max(1, productos.length * 2);
    const referencia = pedido.codigo || `RD-${pedidoId}`;

    // ── Datos del PROVEEDOR (remitente) ──────────────────────────────────────
    let nomRte  = "RECAMBIO DIRECTO";
    let dirRte  = "C/ SOLA 16";
    let pobRte  = "CEHEGIN";
    let cpRte   = "30430";
    let tlfRte  = "";

    const proveedorId = productos[0]?.proveedor_id || null;
    if (proveedorId) {
      const { data: prov } = await supabase
        .from("usuarios")
        .select("nombre_empresa, direccion, ciudad, codigo_postal, telefono")
        .eq("id", proveedorId)
        .single();
      if (prov) {
        nomRte = (prov.nombre_empresa || nomRte).toUpperCase().substring(0, 40);
        dirRte = (prov.direccion     || dirRte).toUpperCase().substring(0, 100);
        pobRte = (prov.ciudad        || pobRte).toUpperCase().substring(0, 40);
        cpRte  = prov.codigo_postal  || cpRte;
        tlfRte = (prov.telefono      || "").replace(/\D/g, "").substring(0, 15);
      }
    }

    // ── Datos del TALLER (destinatario) ──────────────────────────────────────
    let nomDest   = (pedido.cliente_nombre || pedido.cliente_email || "CLIENTE").toUpperCase().substring(0, 40);
    let dirDest   = "VER PEDIDO";
    let pobDest   = "ESPAÑA";
    let cpDest    = "28001";
    let tlfDest   = "";
    let emailDest = (pedido.cliente_email || "").substring(0, 75);

    if (pedido.cliente_id) {
      const { data: taller } = await supabase
        .from("usuarios")
        .select("nombre_empresa, direccion, ciudad, codigo_postal, telefono")
        .eq("id", pedido.cliente_id)
        .single();
      if (taller) {
        nomDest = (taller.nombre_empresa || nomDest).toUpperCase().substring(0, 40);
        dirDest = (taller.direccion      || dirDest).toUpperCase().substring(0, 100);
        pobDest = (taller.ciudad         || pobDest).toUpperCase().substring(0, 40);
        cpDest  = taller.codigo_postal   || cpDest;
        tlfDest = (taller.telefono       || "").replace(/\D/g, "").substring(0, 15);
      }
    } else {
      const partes = (pedido.direccion || "").split(",");
      dirDest = (partes[0]?.trim() || dirDest).toUpperCase();
      pobDest = (partes[1]?.trim() || pobDest).toUpperCase();
    }

    cpDest = cpDest.replace(/\D/g, "").substring(0, 5) || "28001";
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
        <Servicios uidcliente="${GLS_GUID}">
          <Envio>
            <Portes>P</Portes>
            <Servicio>${GLS_SERVICIO}</Servicio>
            <Horario>${GLS_HORARIO}</Horario>
            <Bultos>1</Bultos>
            <Peso>${kilos}</Peso>
            <Remite>
              <Nombre><![CDATA[${nomRte}]]></Nombre>
              <Direccion><![CDATA[${dirRte}]]></Direccion>
              <Poblacion><![CDATA[${pobRte}]]></Poblacion>
              <Pais>${paisOrig}</Pais>
              <CP>${cpRte}</CP>
              <Telefono>${tlfRte}</Telefono>
            </Remite>
            <Destinatario>
              <Nombre><![CDATA[${nomDest}]]></Nombre>
              <Direccion><![CDATA[${dirDest}]]></Direccion>
              <Poblacion><![CDATA[${pobDest}]]></Poblacion>
              <Pais>${paisDest}</Pais>
              <CP>${cpDest}</CP>
              <Telefono>${tlfDest}</Telefono>
              <Movil>${tlfDest}</Movil>
              <Email>${emailDest}</Email>
              <Observaciones><![CDATA[Pedido ${referencia}]]></Observaciones>
            </Destinatario>
            <Referencias>
              <Referencia tipo="0">${referencia.substring(0, 10).padStart(10, "0")}</Referencia>
              <Referencia tipo="C">${referencia}</Referencia>
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

    const res = await fetch(GLS_URL, {
      method: "POST",
      headers: { "Content-Type": "text/xml; charset=UTF-8" },
      body: xml,
    });

    const rawText = await res.text();
    console.log("GLS crear envío response:", rawText.substring(0, 500));

    // Extraer codbarras del atributo en el XML de respuesta
    const codbarrasMatch = rawText.match(/codbarras="([^"]+)"/);
    const codbarras = codbarrasMatch?.[1] || null;

    // Log específico para diagnóstico de etiqueta
    const tieneEtiquetas = rawText.includes("<Etiquetas>");
    const tieneEtiqueta  = rawText.includes("<Etiqueta ");
    const posEtiquetas   = rawText.indexOf("<Etiquetas>");
    console.log("GLS etiqueta diagnóstico — tieneEtiquetas:", tieneEtiquetas, "tieneEtiqueta:", tieneEtiqueta, "posición:", posEtiquetas);
    if (posEtiquetas > 0) {
      console.log("GLS etiqueta contenido:", rawText.substring(posEtiquetas, posEtiquetas + 200));
    }

    if (!codbarras) {
      const errorMatch = rawText.match(/<Error[^>]*>([\s\S]*?)<\/Error>/);
      const retornoMatch = rawText.match(/return="([^"]+)"/);
      console.error("GLS no devolvió codbarras. Retorno:", retornoMatch?.[1], "Error:", errorMatch?.[1]);
      return NextResponse.json({
        error: "GLS no devolvió código de envío",
        retorno: retornoMatch?.[1],
        glsError: errorMatch?.[1],
        raw: rawText.substring(0, 600),
      }, { status: 400 });
    }

    // Extraer etiqueta PDF en base64
    let etiquetaUrl: string | null = null;
    const etiquetaMatch = rawText.match(/<Etiquetas>([\s\S]*?)<\/Etiquetas>/);
    const etiquetaBase64 = etiquetaMatch?.[1]?.trim() || null;

    if (etiquetaBase64) {
      try {
        const pdfBuffer = Buffer.from(etiquetaBase64, "base64");
        const path = `etiquetas-gls/${pedidoId}/${Date.now()}_etiqueta.pdf`;
        const { error: uploadErr } = await supabase.storage
          .from("FACTURAS")
          .upload(path, pdfBuffer, { contentType: "application/pdf" });
        if (!uploadErr) {
          const { data: urlData } = supabase.storage.from("FACTURAS").getPublicUrl(path);
          etiquetaUrl = urlData.publicUrl;
        }
      } catch (e) {
        console.error("Error decodificando etiqueta GLS:", e);
      }
    }

    // URL de tracking pública para el taller
    const trackingUrl = `https://mygls.gls-spain.es/e/${codbarras}/${cpDest}/es`;

    await supabase.from("pedidos").update({
      tracking:           codbarras,
      tracking_gls:       codbarras,
      etiqueta_envio_url: etiquetaUrl,
      estado_envio:       "preparando",
      agencia:            "GLS",
    }).eq("id", pedidoId);

    return NextResponse.json({
      ok: true,
      codbarras,
      trackingUrl,
      etiquetaUrl,
    });

  } catch (e: any) {
    console.error("Error crear envío GLS:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}