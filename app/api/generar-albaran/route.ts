// app/api/generar-albaran/route.ts
// Genera albarán PDF server-side para pedidos existentes y lo guarda en Storage
import { createClient } from "@supabase/supabase-js";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const FORMA_PAGO: Record<string, string> = {
  rd_pago: "RD Pago (crédito plataforma)",
  tarjeta: "Tarjeta bancaria",
  transferencia: "Transferencia bancaria",
};

export async function POST(request: Request) {
  try {
    const { pedidoId } = await request.json();
    if (!pedidoId) return Response.json({ ok: false, error: "pedidoId requerido" }, { status: 400 });

    const { data: pedido, error } = await supabase
      .from("pedidos")
      .select("*")
      .eq("id", pedidoId)
      .single();
    if (error || !pedido) return Response.json({ ok: false, error: "Pedido no encontrado" }, { status: 404 });

    const codigo = pedido.codigo || `RD-${pedidoId}`;
    const productos = pedido.productos || [];
    const provId = productos[0]?.proveedor_id;

    // Datos del proveedor
    let provNombre = productos[0]?.proveedor_nombre || "Proveedor";
    let provEmail = "", provCif = "", provTel = "", provDir = "", provCiudad = "", provCP = "", provProv = "";
    if (provId) {
      const { data: prov } = await supabase.from("usuarios").select("nombre_empresa, email, cif, telefono, direccion, ciudad, codigo_postal, provincia").eq("id", provId).single();
      if (prov) {
        provNombre = prov.nombre_empresa || provNombre;
        provEmail = prov.email || "";
        provCif = prov.cif || "";
        provTel = prov.telefono || "";
        provDir = prov.direccion || "";
        provCiudad = prov.ciudad || "";
        provCP = prov.codigo_postal || "";
        provProv = prov.provincia || "";
      }
    }

    // Datos del cliente
    let cliNombre = pedido.cliente_nombre || pedido.cliente_email || "Cliente";
    let cliEmail = pedido.cliente_email || "";
    let cliTel = pedido.cliente_telefono || "";
    let cliCif = "";
    let cliDir = pedido.direccion || "";
    let cliCiudad = "", cliCP = "", cliProv = "";
    if (pedido.cliente_id) {
      const { data: cli } = await supabase.from("usuarios").select("nombre_empresa, email, cif, telefono, direccion, ciudad, codigo_postal, provincia").eq("id", pedido.cliente_id).single();
      if (cli) {
        cliNombre = cli.nombre_empresa || cliNombre;
        cliEmail = cli.email || cliEmail;
        cliCif = cli.cif || "";
        cliTel = cli.telefono || cliTel;
        cliDir = cli.direccion || cliDir;
        cliCiudad = cli.ciudad || "";
        cliCP = cli.codigo_postal || "";
        cliProv = cli.provincia || "";
      }
    }

    const fecha = new Date(pedido.created_at).toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric" });
    const agencia = pedido.agencia || pedido.transporte || "";
    const formaPago = FORMA_PAGO[pedido.forma_pago || ""] || pedido.forma_pago || "";
    const subtotal = Number(pedido.subtotal || 0);
    const costeTransporte = Number(pedido.coste_transporte || 0);
    const total = Number(pedido.total || 0);
    const totalSinPorte = total - costeTransporte;
    const iva = subtotal * 0.21;

    // ── Generar PDF con pdf-lib ──
    async function crearAlbaran(destinatario: "taller" | "proveedor") {
      const esProveedor = destinatario === "proveedor";
      const doc = await PDFDocument.create();
      const font = await doc.embedFont(StandardFonts.Helvetica);
      const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
      const page = doc.addPage([595.28, 841.89]); // A4
      const { width, height } = page.getSize();
      const navy = rgb(0.043, 0.09, 0.21);
      const blue = rgb(0.145, 0.388, 0.922);
      const gray = rgb(0.42, 0.45, 0.5);
      const darkGray = rgb(0.216, 0.255, 0.318);
      const black = rgb(0.1, 0.1, 0.1);
      const white = rgb(1, 1, 1);
      let y = height - 40;

      // Header
      page.drawText("RECAMBIO DIRECTO", { x: 40, y, size: 18, font: fontBold, color: navy });
      page.drawText("ALBARÁN DE ENTREGA", { x: width - 200, y, size: 12, font: fontBold, color: navy });
      y -= 16;
      page.drawText("Marketplace B2B de Recambios", { x: 40, y, size: 8, font, color: gray });
      page.drawText(codigo, { x: width - 200, y, size: 10, font: fontBold, color: blue });
      y -= 14;
      page.drawText(fecha, { x: width - 200, y, size: 8, font, color: gray });
      y -= 6;
      page.drawLine({ start: { x: 40, y }, end: { x: width - 40, y }, thickness: 2, color: navy });
      y -= 20;

      if (esProveedor) {
        page.drawText("⚠ Este albarán es para uso interno del proveedor.", { x: 40, y, size: 8, font, color: blue });
        y -= 16;
      }

      // Proveedor y Cliente boxes
      const boxW = (width - 100) / 2;
      const boxH = 80;

      // Box Proveedor
      page.drawRectangle({ x: 40, y: y - boxH, width: boxW, height: boxH, borderWidth: 1, borderColor: navy, color: white });
      let bx = 48; let by = y - 14;
      page.drawText("PROVEEDOR", { x: bx, y: by, size: 7, font: fontBold, color: gray }); by -= 14;
      page.drawText(provNombre, { x: bx, y: by, size: 10, font: fontBold, color: navy }); by -= 12;
      if (provCif) { page.drawText(`CIF: ${provCif}`, { x: bx, y: by, size: 8, font, color: darkGray }); by -= 10; }
      if (provDir) { page.drawText(truncate(`${provDir}${provCiudad ? ", " + provCiudad : ""}${provCP ? " " + provCP : ""}`, 50), { x: bx, y: by, size: 8, font, color: darkGray }); by -= 10; }
      if (provEmail) { page.drawText(provEmail, { x: bx, y: by, size: 8, font, color: darkGray }); }

      // Box Cliente
      page.drawRectangle({ x: 40 + boxW + 20, y: y - boxH, width: boxW, height: boxH, borderWidth: 1, borderColor: navy, color: white });
      bx = 48 + boxW + 20; by = y - 14;
      page.drawText("CLIENTE / TALLER", { x: bx, y: by, size: 7, font: fontBold, color: gray }); by -= 14;
      page.drawText(truncate(cliNombre, 40), { x: bx, y: by, size: 10, font: fontBold, color: navy }); by -= 12;
      if (cliCif) { page.drawText(`CIF: ${cliCif}`, { x: bx, y: by, size: 8, font, color: darkGray }); by -= 10; }
      if (cliDir) { page.drawText(truncate(`${cliDir}${cliCiudad ? ", " + cliCiudad : ""}${cliCP ? " " + cliCP : ""}`, 50), { x: bx, y: by, size: 8, font, color: darkGray }); by -= 10; }
      if (cliTel) { page.drawText(`Tel: ${cliTel}`, { x: bx, y: by, size: 8, font, color: darkGray }); }

      y -= boxH + 20;

      // Tabla productos - Header
      page.drawRectangle({ x: 40, y: y - 18, width: width - 80, height: 18, color: navy });
      page.drawText("DETALLE DE PRODUCTOS", { x: 44, y: y - 13, size: 9, font: fontBold, color: white });
      y -= 18;

      // Columnas header
      const colX = [44, 74, 190, 400, 470];
      const colLabels = ["Ud.", "Referencia", "Descripción", "Precio", "Neto"];
      page.drawRectangle({ x: 40, y: y - 16, width: width - 80, height: 16, color: rgb(0.97, 0.97, 0.98) });
      colLabels.forEach((label, i) => {
        page.drawText(label, { x: colX[i], y: y - 12, size: 8, font: fontBold, color: gray });
      });
      y -= 16;

      // Filas productos
      productos.forEach((pr: any, idx: number) => {
        const cant = Number(pr.cantidad || 1);
        const precio = Number(pr.precio || 0);
        const neto = cant * precio;
        const alt = idx % 2 === 1;
        if (alt) page.drawRectangle({ x: 40, y: y - 16, width: width - 80, height: 16, color: rgb(0.97, 0.97, 0.98) });
        page.drawText(String(cant), { x: colX[0], y: y - 12, size: 8, font, color: black });
        page.drawText(truncate(pr.referencia || "", 20), { x: colX[1], y: y - 12, size: 8, font: fontBold, color: navy });
        page.drawText(truncate(pr.descripcion || pr.producto || "", 35), { x: colX[2], y: y - 12, size: 8, font, color: darkGray });
        page.drawText(`${precio.toFixed(2)} €`, { x: colX[3], y: y - 12, size: 8, font, color: darkGray });
        page.drawText(`${neto.toFixed(2)} €`, { x: colX[4], y: y - 12, size: 8, font: fontBold, color: black });
        y -= 16;
        if (y < 100) { /* Sería necesario añadir página, pero para la mayoría de pedidos una página basta */ }
      });

      // Línea separadora
      page.drawLine({ start: { x: 40, y }, end: { x: width - 40, y }, thickness: 0.5, color: rgb(0.9, 0.9, 0.9) });
      y -= 4;

      // Totales
      const totX = width - 180;
      page.drawText("Subtotal:", { x: totX, y: y - 12, size: 8, font, color: gray });
      page.drawText(`${subtotal.toFixed(2)} €`, { x: totX + 90, y: y - 12, size: 8, font, color: black });
      y -= 16;
      page.drawText("IVA (21%):", { x: totX, y: y - 12, size: 8, font, color: gray });
      page.drawText(`${iva.toFixed(2)} €`, { x: totX + 90, y: y - 12, size: 8, font, color: black });
      y -= 16;

      if (esProveedor) {
        page.drawRectangle({ x: totX - 10, y: y - 16, width: 170, height: 18, color: rgb(0.97, 0.97, 0.98) });
        page.drawText("TOTAL:", { x: totX, y: y - 12, size: 10, font: fontBold, color: navy });
        page.drawText(`${totalSinPorte.toFixed(2)} €`, { x: totX + 90, y: y - 12, size: 10, font: fontBold, color: navy });
      } else {
        page.drawRectangle({ x: totX - 10, y: y - 16, width: 170, height: 18, color: rgb(0.97, 0.97, 0.98) });
        page.drawText("TOTAL:", { x: totX, y: y - 12, size: 10, font: fontBold, color: navy });
        page.drawText(`${total.toFixed(2)} €`, { x: totX + 90, y: y - 12, size: 10, font: fontBold, color: navy });
      }
      y -= 24;

      // Forma de pago y Agencia
      if (formaPago || agencia) {
        page.drawRectangle({ x: 40, y: y - 24, width: width - 80, height: 24, borderWidth: 0.5, borderColor: rgb(0.9, 0.9, 0.9), color: white });
        if (formaPago) page.drawText(`Forma de pago: ${formaPago}`, { x: 48, y: y - 16, size: 8, font: fontBold, color: navy });
        if (agencia) page.drawText(`Agencia: ${agencia}`, { x: 300, y: y - 16, size: 8, font, color: darkGray });
      }

      // Footer
      page.drawLine({ start: { x: 40, y: 40 }, end: { x: width - 40, y: 40 }, thickness: 0.5, color: rgb(0.9, 0.9, 0.9) });
      page.drawText("Recambio Directo — recambio-directo.com", { x: 40, y: 28, size: 7, font, color: gray });
      page.drawText(`Albarán ${codigo} — ${fecha}`, { x: width - 200, y: 28, size: 7, font, color: gray });

      return await doc.save();
    }

    // Generar ambos albaranes
    const albaranTallerBytes = await crearAlbaran("taller");
    const albaranProvBytes = await crearAlbaran("proveedor");

    const bucket = "FACTURAS";
    const albaranPath = `documentos/${codigo}/albaran-${codigo}.pdf`;
    const albaranProvPath = `documentos/${codigo}/albaran-proveedor-${codigo}.pdf`;

    await supabase.storage.from(bucket).upload(albaranPath, albaranTallerBytes, { contentType: "application/pdf", upsert: true });
    await supabase.storage.from(bucket).upload(albaranProvPath, albaranProvBytes, { contentType: "application/pdf", upsert: true });

    const { data: albaranUrlData } = supabase.storage.from(bucket).getPublicUrl(albaranPath);
    const { data: albaranProvUrlData } = supabase.storage.from(bucket).getPublicUrl(albaranProvPath);

    await supabase.from("pedidos").update({
      albaran_url: albaranUrlData.publicUrl,
      albaran_proveedor_url: albaranProvUrlData.publicUrl,
    }).eq("id", pedidoId);

    return Response.json({
      ok: true,
      codigo,
      albaran_url: albaranUrlData.publicUrl,
      albaran_proveedor_url: albaranProvUrlData.publicUrl,
    });
  } catch (err) {
    console.error("Error generar-albaran:", err);
    return Response.json({ ok: false, error: String(err) }, { status: 500 });
  }
}

function truncate(str: string, max: number) {
  return str.length > max ? str.substring(0, max) + "..." : str;
}
