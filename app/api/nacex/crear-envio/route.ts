// app/api/nacex/crear-envio/route.ts
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      pedidoId,
      // Campos opcionales — si vienen del frontend se usan, si no se buscan en Supabase
      pedidoCodigo: pedidoCodigoParam,
      remitenteNombre: remitenteNombreParam,
      remitenteDireccion: remitenteDireccionParam,
      remitenteCodigoPostal: remitenteCPParam,
      remitentePoblacion: remitentePoblacionParam,
      remitenteTelefono: remitenteTelefonoParam,
      destinatarioNombre: destinatarioNombreParam,
      destinatarioDireccion: destinatarioDireccionParam,
      destinatarioCodigoPostal: destinatarioCPParam,
      destinatarioPoblacion: destinatarioPoblacionParam,
      destinatarioTelefono: destinatarioTelefonoParam,
      destinatarioEmail: destinatarioEmailParam,
      pesoKg: pesoKgParam,
      numBultos: numBultosParam,
      observaciones: observacionesParam,
    } = body;

    if (!pedidoId) {
      return Response.json({ ok: false, error: "pedidoId requerido" }, { status: 400 });
    }

    // ── Obtener pedido de Supabase ──
    const { data: pedido, error: pedidoError } = await supabase
      .from("pedidos")
      .select("*")
      .eq("id", pedidoId)
      .single();

    if (pedidoError || !pedido) {
      return Response.json({ ok: false, error: "Pedido no encontrado" }, { status: 404 });
    }

    const productos = pedido.productos || [];
    const proveedorId = productos[0]?.proveedor_id || null;

    // ── Datos del remitente (proveedor) ──
    let nomRte = remitenteNombreParam || "RECAMBIO DIRECTO";
    let dirRte = remitenteDireccionParam || "C/ Sola, 16";
    let pobRte = remitentePoblacionParam || "Cehegín";
    let cpRte = remitenteCPParam || "30430";
    let tlfRte = remitenteTelefonoParam || "744487895";

    if (!remitenteNombreParam && proveedorId) {
      const { data: prov } = await supabase
        .from("usuarios")
        .select("nombre_empresa, direccion, ciudad, codigo_postal, telefono, email")
        .eq("id", proveedorId)
        .single();
      if (prov) {
        nomRte = prov.nombre_empresa || nomRte;
        dirRte = prov.direccion || dirRte;
        pobRte = prov.ciudad || pobRte;
        cpRte = prov.codigo_postal || cpRte;
        tlfRte = prov.telefono || tlfRte;
      }
    }

    // ── Datos del destinatario (taller/cliente) ──
    let nomDest = destinatarioNombreParam || (pedido.cliente_nombre || pedido.cliente_email || "CLIENTE").substring(0, 40);
    let dirDest = destinatarioDireccionParam || "VER PEDIDO";
    let pobDest = destinatarioPoblacionParam || "ESPAÑA";
    let cpDest = destinatarioCPParam || "28001";
    let tlfDest = destinatarioTelefonoParam || "";
    const emailDest = destinatarioEmailParam || pedido.cliente_email || "";

    if (!destinatarioNombreParam && pedido.cliente_id) {
      const { data: taller } = await supabase
        .from("usuarios")
        .select("nombre_empresa, direccion, ciudad, codigo_postal, telefono")
        .eq("id", pedido.cliente_id)
        .single();
      if (taller) {
        nomDest = (taller.nombre_empresa || nomDest).substring(0, 40);
        dirDest = taller.direccion || dirDest;
        pobDest = taller.ciudad || pobDest;
        cpDest = taller.codigo_postal || cpDest;
        tlfDest = taller.telefono || tlfDest;
      }
    } else if (!destinatarioNombreParam && !pedido.cliente_id) {
      // Fallback: parsear dirección del pedido "calle, ciudad"
      const partes = (pedido.direccion || "").split(",");
      dirDest = partes[0]?.trim() || dirDest;
      pobDest = partes[1]?.trim() || pobDest;
    }

    dirDest = dirDest.substring(0, 100);
    pobDest = pobDest.substring(0, 40);
    cpDest = cpDest.replace(/\D/g, "").substring(0, 10) || "28001";

    // Validar datos obligatorios
    if (!nomDest || nomDest === "CLIENTE" || !dirDest || dirDest === "VER PEDIDO" || !cpDest || !pobDest || pobDest === "ESPAÑA") {
      console.error("NACEX faltan datos de entrega:", { nomDest, dirDest, cpDest, pobDest });
      return Response.json({ ok: false, error: `Faltan datos obligatorios de entrega (nombre: ${nomDest}, dir: ${dirDest}, cp: ${cpDest}, pob: ${pobDest})` }, { status: 400 });
    }

    const pedidoCodigo = pedidoCodigoParam || pedido.codigo || `RD-${pedidoId}`;
    const pesoKg = pesoKgParam || Math.max(1, productos.length * 2);
    const numBultos = numBultosParam || 1;
    const observaciones = observacionesParam || "";

    // ── NACEX API ──
    const baseUrl = "https://pda.nacex.com/nacex_ws/ws";
    const user = process.env.NACEX_USER || "";
    const pass = process.env.NACEX_PASS || "";
    const delCli = process.env.NACEX_DEL_CLI || "";
    const numCli = process.env.NACEX_NUM_CLI || "";
    const tipSer = process.env.NACEX_TIP_SER || "08";
    const tipCob = process.env.NACEX_TIP_COB || "O";
    const tipEnv = process.env.NACEX_TIP_ENV || "2";

    function limpiarTelefono(tel: string): string {
      if (!tel) return "";
      return tel.replace(/[\s\-\+]/g, "").replace(/^(0034|34)/, "").slice(0, 20);
    }

    const dataParams: string[] = [
      `del_cli=${delCli}`,
      `num_cli=${numCli}`,
      `tip_ser=${tipSer}`,
      `tip_cob=${tipCob}`,
      `ref_cli=${pedidoCodigo}`,
      `tip_env=${tipEnv}`,
      `bul=${String(numBultos).padStart(3, "0")}`,
      `kil=${pesoKg}`,
      `nom_ent=${nomDest}`,
      `dir_ent=${dirDest}`,
      `pais_ent=ES`,
      `cp_ent=${cpDest}`,
      `pob_ent=${pobDest}`,
    ];

    const telDestLimpio = limpiarTelefono(tlfDest);
    if (telDestLimpio) dataParams.push(`tel_ent=${telDestLimpio}`);
    if (observaciones) dataParams.push(`obs1=${observaciones}`);
    if (nomRte) dataParams.push(`nom_rec=${nomRte}`);
    if (dirRte) dataParams.push(`dir_rec=${dirRte}`);
    if (cpRte) dataParams.push(`cp_rec=${cpRte}`);
    if (pobRte) dataParams.push(`pob_rec=${pobRte}`);
    if (tlfRte) dataParams.push(`tel_rec=${limpiarTelefono(tlfRte)}`);

    dataParams.push(`etiqueta=S`);
    dataParams.push(`modelo=PDF_B`);
    dataParams.push(`seguimiento=S`);

    const dataString = dataParams.join("|");
    const url = `${baseUrl}?method=putExpedicion&user=${encodeURIComponent(user)}&pass=${encodeURIComponent(pass)}&data=${encodeURIComponent(dataString)}`;

    console.log("NACEX putExpedicion data:", dataString.substring(0, 200));

    const response = await fetch(url, { method: "GET" });
    const rawText = await response.text();

    console.log("NACEX putExpedicion (primeros 300 chars):", rawText.slice(0, 300));

    const partesResp = rawText.split("|");
    const localizador = partesResp[1] || null;
    const fechaPrevista = partesResp[10] || "";
    const linkSeguimiento = (partesResp[12] || "").replace(/&amp;/g, "&");
    const etiquetaPdfBase64 = partesResp[13] || "";

    if (!localizador || !localizador.includes("/")) {
      console.error("NACEX error en putExpedicion:", rawText);
      return Response.json({
        ok: false,
        error: "NACEX no devolvió un localizador válido",
        rawResponse: rawText,
      }, { status: 400 });
    }

    // ── Guardar etiqueta PDF en Supabase Storage ──
    let etiquetaNacexUrl = "";
    if (etiquetaPdfBase64) {
      try {
        const pdfBuffer = Buffer.from(etiquetaPdfBase64, "base64");
        const etiquetaPath = `documentos/${pedidoCodigo}/etiqueta-nacex-${pedidoCodigo}.pdf`;

        await supabase.storage.from("FACTURAS").upload(etiquetaPath, pdfBuffer, {
          contentType: "application/pdf",
          upsert: true,
        });

        const { data: urlData } = supabase.storage.from("FACTURAS").getPublicUrl(etiquetaPath);
        etiquetaNacexUrl = urlData.publicUrl;
      } catch (storageErr) {
        console.error("Error guardando etiqueta NACEX en Storage:", storageErr);
      }
    }

    // ── Actualizar pedido en Supabase (igual que CTT) ──
    const trackingUrl = `https://www.nacex.com/seguimientoDetalle.do?agencia_origen=${localizador.split("/")[0]}&numero_albaran=${localizador.split("/")[1]}&externo=N`;

    await supabase.from("pedidos").update({
      tracking: localizador,
      tracking_nacex: localizador,
      etiqueta_nacex_url: etiquetaNacexUrl || undefined,
      etiqueta_envio_url: etiquetaNacexUrl || undefined,
      estado_envio: "preparando",
      agencia: "NACEX",
    }).eq("id", pedidoId);

    return Response.json({
      ok: true,
      localizador,
      fechaPrevista,
      linkSeguimiento: linkSeguimiento || trackingUrl,
      etiquetaNacexUrl,
      etiquetaPdfBase64,
      rawResponse: rawText,
    });

  } catch (error) {
    console.error("Error NACEX crear-envio:", error);
    return Response.json({ ok: false, error: String(error) }, { status: 500 });
  }
}
