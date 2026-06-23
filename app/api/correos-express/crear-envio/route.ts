import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const CEX_URL = "https://www.cexpr.es/wspsc/apiRestGrabacionEnviok8s/json/grabacionEnvio";
const CEX_USER = process.env.CEX_USUARIO!;
const CEX_PASS = process.env.CEX_PASSWORD!;
const CEX_SOLICITANTE = process.env.CEX_CODIGO_CLIENTE!; // código de cliente 9 dígitos
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

    // Datos del destinatario (taller comprador)
    const nomDest = (pedido.cliente_nombre || pedido.cliente_email || "CLIENTE").substring(0, 40);
    const dirDest = (pedido.direccion_envio || pedido.cliente_direccion || "VER PEDIDO").substring(0, 100);
    const pobDest = (pedido.ciudad_envio || pedido.cliente_ciudad || "ESPAÑA").substring(0, 40);
    const cpDest  = (pedido.cp_envio || pedido.cliente_cp || "28001").replace(/\D/g, "").substring(0, 5);
    const tlfDest = (pedido.telefono_envio || pedido.cliente_telefono || "600000000").replace(/\D/g, "").substring(0, 15);
    const emailDest = (pedido.cliente_email || "").substring(0, 75);

    const fechaHoy = new Date();
    const dd = String(fechaHoy.getDate()).padStart(2, "0");
    const mm = String(fechaHoy.getMonth() + 1).padStart(2, "0");
    const yyyy = fechaHoy.getFullYear();
    const fechaStr = `${dd}${mm}${yyyy}`;

    const body = {
      solicitante: CEX_SOLICITANTE,
      canalEntrada: "",
      numEnvio: "",
      ref: `RD-${pedido.codigo || pedidoId}`,
      refCliente: String(pedidoId),
      fecha: fechaStr,
      codRte: CEX_SOLICITANTE,
      nomRte: "RECAMBIO DIRECTO",
      nifRte: "",
      dirRte: "C/ Sola, 16",
      pobRte: "CEHEGIN",
      codPosNacRte: "30430",
      paisISORte: "",
      codPosIntRte: "",
      contacRte: "RECAMBIO DIRECTO",
      telefRte: "",
      emailRte: "",
      codDest: "",
      nomDest,
      nifDest: "",
      dirDest,
      pobDest,
      codPosNacDest: cpDest,
      paisISODest: "",
      codPosIntDest: "",
      contacDest: nomDest,
      telefDest: tlfDest,
      emailDest,
      contacOtrs: "",
      telefOtrs: "",
      emailOtrs: "",
      observac: `Pedido RD ${pedido.codigo || pedidoId}`,
      numBultos: "1",
      kilos: kilosEstimados,
      volumen: "",
      alto: "",
      largo: "",
      ancho: "",
      producto: CEX_PRODUCTO,
      portes: "P",
      reembolso: "",
      entrSabado: "",
      seguro: "",
      numEnvioVuelta: "",
      listaBultos: [
        {
          alto: "", ancho: "", codBultoCli: "", codUnico: "",
          descripcion: refs, kilos: kilosEstimados,
          largo: "", observaciones: "", orden: "1", referencia: `RD-${pedidoId}`, volumen: ""
        }
      ],
      codDirecDestino: "",
      password: CEX_PASS,
      listaInformacionAdicional: [
        {
          tipoEtiqueta: "1", // PDF Base64
          etiquetaPDF: "",
          creaRecogida: "S",
          fechaRecogida: "",
          horaDesdeRecogida: "09:00",
          horaHastaRecogida: "18:00",
          referenciaRecogida: `RD-${pedidoId}`,
        }
      ]
    };

    const authHeader = "Basic " + Buffer.from(`${CEX_USER}:${CEX_PASS}`).toString("base64");

    const resp = await fetch(CEX_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: authHeader },
      body: JSON.stringify(body),
    });

    const data = await resp.json();

    if (data.codigoRetorno !== 0) {
      console.error("CEX error:", data);
      return NextResponse.json({ error: data.mensajeRetorno || "Error CEX", code: data.codigoRetorno }, { status: 400 });
    }

    const numEnvio = data.datosResultado; // número de envío CEX
    const codUnico = data.listaBultos?.[0]?.codUnico || "";
    const numRecogida = data.numRecogida ? String(data.numRecogida) : null;

    // Decodificar etiqueta PDF (doble base64 según docs CEX)
    let etiquetaUrl: string | null = null;
    const etiquetaRaw = data.etiqueta?.[0]?.etiqueta1 || data.etiqueta?.[0]?.etiqueta2 || null;
    if (etiquetaRaw && !etiquetaRaw.includes("no se ha generado")) {
      try {
        // Doble decodificación según documentación CEX
        const decoded1 = Buffer.from(etiquetaRaw, "base64").toString("binary");
        const decoded2 = Buffer.from(decoded1, "binary");
        const path = `etiquetas-cex/${pedidoId}/${Date.now()}_etiqueta.pdf`;
        const { error: uploadErr } = await supabase.storage
          .from("FACTURAS")
          .upload(path, decoded2, { contentType: "application/pdf" });
        if (!uploadErr) {
          const { data: urlData } = supabase.storage.from("FACTURAS").getPublicUrl(path);
          etiquetaUrl = urlData.publicUrl;
        }
      } catch (e) {
        console.error("Error decodificando etiqueta CEX:", e);
      }
    }

    // Actualizar pedido en Supabase
    await supabase.from("pedidos").update({
      tracking: numEnvio,
      collection_ref_correos_express: numRecogida,
      etiqueta_envio_url: etiquetaUrl,
      estado_envio: "preparando",
      agencia: "Correos Express",
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