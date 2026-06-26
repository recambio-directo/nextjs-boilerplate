// app/api/correos-express/crear-envio/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const CEX_URL = "https://www.cexpr.es/wspsc/apiRestGrabacionEnviok8s/json/grabacionEnvio";
const CEX_USER = process.env.CEX_USUARIO!;
const CEX_PASS = process.env.CEX_PASSWORD!;
const CEX_SOLICITANTE = process.env.CEX_SOLICITANTE || ("I" + process.env.CEX_CODIGO_CLIENTE!);
const CEX_CODIGO_CLIENTE = process.env.CEX_CODIGO_CLIENTE!;
const CEX_PRODUCTO = "63"; // Paq 24

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
    const refs = productos.map((p: any) => p.referencia).join(", ").substring(0, 78);
    const kilosEstimados = Math.max(1, Math.ceil((productos.length * 0.5) * 10) / 10).toFixed(3);

    // ── Datos del PROVEEDOR (remitente) ──────────────────────────────────────
    let nomRte   = "RECAMBIO DIRECTO";
    let dirRte   = "C/ Sola, 16";
    let pobRte   = "CEHEGIN";
    let cpRte    = "30430";
    let tlfRte   = "";
    let emailRte = "info@recambio-directo.com";

    const proveedorId = productos[0]?.proveedor_id || null;
    if (proveedorId) {
      const { data: prov } = await supabase
        .from("usuarios")
        .select("nombre_empresa, direccion, ciudad, codigo_postal, telefono, email")
        .eq("id", proveedorId)
        .single();
      if (prov) {
        nomRte   = (prov.nombre_empresa || nomRte).substring(0, 40);
        dirRte   = prov.direccion || dirRte;
        pobRte   = (prov.ciudad || pobRte).toUpperCase();
        cpRte    = prov.codigo_postal || cpRte;
        tlfRte   = (prov.telefono || "").replace(/\D/g, "").substring(0, 15);
        emailRte = prov.email || emailRte;
      }
    }

    // ── Datos del TALLER (destinatario) ──────────────────────────────────────
    let nomDest   = (pedido.cliente_nombre || pedido.cliente_email || "CLIENTE").substring(0, 40);
    let dirDest   = "VER PEDIDO";
    let pobDest   = "ESPAÑA";
    let cpDest    = "28001";
    let tlfDest   = "600000000";
    const emailDest = (pedido.cliente_email || "").substring(0, 75);

    if (pedido.cliente_id) {
      const { data: taller } = await supabase
        .from("usuarios")
        .select("nombre_empresa, direccion, ciudad, codigo_postal, telefono")
        .eq("id", pedido.cliente_id)
        .single();
      if (taller) {
        nomDest = (taller.nombre_empresa || nomDest).substring(0, 40);
        dirDest = taller.direccion || dirDest;
        pobDest = (taller.ciudad || pobDest).toUpperCase();
        cpDest  = taller.codigo_postal || cpDest;
        tlfDest = (taller.telefono || tlfDest).replace(/\D/g, "").substring(0, 15);
      }
    } else {
      // Fallback: parsear el campo direccion del pedido "calle, ciudad"
      const partes = (pedido.direccion || "").split(",");
      dirDest = partes[0]?.trim() || dirDest;
      pobDest = (partes[1]?.trim() || pobDest).toUpperCase();
    }

    cpDest = cpDest.replace(/\D/g, "").substring(0, 5) || "28001";

    // ── Fecha ────────────────────────────────────────────────────────────────
    const fechaHoy = new Date();
    const dd   = String(fechaHoy.getDate()).padStart(2, "0");
    const mm   = String(fechaHoy.getMonth() + 1).padStart(2, "0");
    const yyyy = fechaHoy.getFullYear();
    const fechaStr = `${dd}${mm}${yyyy}`;

    const body = {
      solicitante:      CEX_SOLICITANTE,
      canalEntrada:     "",
      numEnvio:         "",
      ref:              pedido.codigo || `RD-${pedidoId}`,
      refCliente:       String(pedidoId),
      fecha:            fechaStr,
      codRte:           CEX_CODIGO_CLIENTE,
      nomRte,
      nifRte:           "",
      dirRte,
      pobRte,
      codPosNacRte:     cpRte,
      paisISORte:       "ES",
      codPosIntRte:     "",
      contacRte:        nomRte,
      telefRte:         tlfRte,
      emailRte,
      codDest:          "",
      nomDest,
      nifDest:          "",
      dirDest,
      pobDest,
      codPosNacDest:    cpDest,
      paisISODest:      "",
      codPosIntDest:    "",
      contacDest:       nomDest,
      telefDest:        tlfDest,
      emailDest,
      contacOtrs:       "",
      telefOtrs:        "",
      emailOtrs:        "",
      observac:         `Pedido ${pedido.codigo || pedidoId}`,
      numBultos:        "1",
      kilos:            kilosEstimados,
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
          descripcion: refs, kilos: kilosEstimados,
          largo: "", observaciones: "", orden: "1",
          referencia: pedido.codigo || `RD-${pedidoId}`, volumen: ""
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
          referenciaRecogida:   pedido.codigo || `RD-${pedidoId}`,
          codificacionUnicaB64: "1",
        }
      ]
    };

    const authHeader = "Basic " + Buffer.from(`${CEX_USER}:${CEX_PASS}`).toString("base64");

    const resp = await fetch(CEX_URL, {
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
      console.error("CEX devolvió HTML:", rawText.substring(0, 300));
      return NextResponse.json({
        error: "CEX devolvió HTML. Error de autenticación o endpoint.",
        raw: rawText.substring(0, 300)
      }, { status: 400 });
    }

    const data = JSON.parse(rawText);

    if (data.codigoRetorno !== 0) {
      console.error("CEX error:", data);
      return NextResponse.json({
        error: data.mensajeRetorno || "Error CEX",
        code: data.codigoRetorno
      }, { status: 400 });
    }

    const numEnvio    = data.datosResultado;
    const codUnico    = data.listaBultos?.[0]?.codUnico || "";
    const numRecogida = data.numRecogida ? String(data.numRecogida) : null;

    // Decodificar etiqueta PDF
    let etiquetaUrl: string | null = null;
    const etiquetaRaw = data.etiqueta?.[0]?.etiqueta1 || data.etiqueta?.[0]?.etiqueta2 || null;
    if (etiquetaRaw && !etiquetaRaw.includes("no se ha generado")) {
      try {
        const decoded = Buffer.from(etiquetaRaw, "base64");
        const path = `etiquetas-cex/${pedidoId}/${Date.now()}_etiqueta.pdf`;
        const { error: uploadErr } = await supabase.storage
          .from("FACTURAS")
          .upload(path, decoded, { contentType: "application/pdf" });
        if (!uploadErr) {
          const { data: urlData } = supabase.storage.from("FACTURAS").getPublicUrl(path);
          etiquetaUrl = urlData.publicUrl;
        }
      } catch (e) {
        console.error("Error decodificando etiqueta CEX:", e);
      }
    }

    await supabase.from("pedidos").update({
      tracking:                       numEnvio,
      collection_ref_correos_express: numRecogida,
      etiqueta_envio_url:             etiquetaUrl,
      estado_envio:                   "preparando",
      agencia:                        "Correos Express",
    }).eq("id", pedidoId);

    return NextResponse.json({
      ok: true,
      numEnvio,
      codUnico,
      numRecogida,
      etiquetaUrl,
    });

  } catch (e: any) {
    console.error("Error crear envío CEX:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}