// app/lib/albaranServidor.ts
// Genera en servidor los dos albaranes PDF de un pedido (taller y proveedor),
// los guarda en Storage y anota sus URLs en el pedido.
// Lo usan /api/generar-albaran y /api/enviar-email (respaldo cuando el
// navegador del taller no llegó a guardarlos).
import type { SupabaseClient } from "@supabase/supabase-js";
import { PDFDocument, rgb, StandardFonts, type PDFFont, type PDFPage, type RGB } from "pdf-lib";
import { guardarPedido } from "@/app/lib/envios";

const FORMA_PAGO: Record<string, string> = {
  rd_pago: "RD Pago (crédito plataforma)",
  tarjeta: "Tarjeta bancaria",
  transferencia: "Transferencia bancaria",
};

// Las fuentes estándar del PDF solo admiten WinAnsi (Latin-1 + unos pocos signos).
// Cualquier otro carácter (griego, cirílico, emojis…) rompía la generación.
const EXTRA_WINANSI = "€‚ƒ„…†‡ˆ‰Š‹ŒŽ‘’“”•–—˜™š›œžŸ";
const PARECIDOS: Record<string, string> = {
  "Α": "A", "Β": "B", "Ε": "E", "Ζ": "Z", "Η": "H", "Ι": "I", "Κ": "K", "Μ": "M", "Ν": "N", "Ο": "O", "Ρ": "P", "Τ": "T", "Υ": "Y", "Χ": "X",
  "А": "A", "В": "B", "Е": "E", "К": "K", "М": "M", "Н": "H", "О": "O", "Р": "P", "С": "C", "Т": "T", "Х": "X",
  "µ": "u", "μ": "u", "Ω": "Ohm", "≤": "<=", "≥": ">=", "×": "x", "→": "->", "⌀": "Ø", "″": "\"", "′": "'",
};
export function winAnsi(v: unknown): string {
  let out = "";
  for (const ch of String(v ?? "").normalize("NFC")) {
    const c = ch.codePointAt(0)!;
    if ((c >= 0x20 && c <= 0x7e) || (c >= 0xa0 && c <= 0xff) || EXTRA_WINANSI.includes(ch)) { out += ch; continue; }
    if (c === 0x09 || c === 0x0a || c === 0x0d) { out += " "; continue; }
    if (PARECIDOS[ch]) { out += PARECIDOS[ch]; continue; }
    const base = ch.normalize("NFKD").replace(/[̀-ͯ]/g, "");
    out += base && /^[\x20-\x7e]+$/.test(base) ? base : "?";
  }
  return out;
}

function truncate(str: string, max: number) {
  return str.length > max ? str.substring(0, max) + "..." : str;
}

export type ResultadoAlbaranes =
  | { ok: true; codigo: string; albaran_url: string; albaran_proveedor_url: string; tallerBytes: Uint8Array; proveedorBytes: Uint8Array }
  | { ok: false; status: number; error: string };

export async function generarAlbaranes(supabase: SupabaseClient, pedidoId: unknown): Promise<ResultadoAlbaranes> {
  const { data: pedido, error } = await supabase.from("pedidos").select("*").eq("id", pedidoId).single();
  if (error || !pedido) return { ok: false, status: 404, error: "Pedido no encontrado" };

  const codigo: string = pedido.codigo || `RD-${pedidoId}`;
  const productos: any[] = Array.isArray(pedido.productos) ? pedido.productos : [];
  const provId = productos[0]?.proveedor_id;

  // Datos del proveedor
  let provNombre = productos[0]?.proveedor_nombre || "Proveedor";
  let provEmail = "", provCif = "", provDir = "", provCiudad = "", provCP = "";
  if (provId) {
    const { data: prov } = await supabase.from("usuarios").select("nombre_empresa, email, cif, telefono, direccion, ciudad, codigo_postal, provincia").eq("id", provId).maybeSingle();
    if (prov) {
      provNombre = prov.nombre_empresa || provNombre;
      provEmail = prov.email || "";
      provCif = prov.cif || "";
      provDir = prov.direccion || "";
      provCiudad = prov.ciudad || "";
      provCP = prov.codigo_postal || "";
    }
  }

  // Datos del cliente
  let cliNombre = pedido.cliente_nombre || pedido.cliente_email || "Cliente";
  let cliTel = pedido.cliente_telefono || "";
  let cliCif = "";
  let cliDir = pedido.direccion || "";
  let cliCiudad = "", cliCP = "";
  if (pedido.cliente_id) {
    const { data: cli } = await supabase.from("usuarios").select("nombre_empresa, email, cif, telefono, direccion, ciudad, codigo_postal, provincia").eq("id", pedido.cliente_id).maybeSingle();
    if (cli) {
      cliNombre = pedido.cliente_nombre || cli.nombre_empresa || cliNombre;
      cliCif = cli.cif || "";
      cliTel = cliTel || cli.telefono || "";
      // La dirección del pedido (la que confirmó el taller) manda sobre la del perfil
      if (!cliDir) { cliDir = cli.direccion || ""; cliCiudad = cli.ciudad || ""; }
      cliCP = cli.codigo_postal || "";
    }
  }

  const fecha = new Date(pedido.created_at || Date.now()).toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "Europe/Madrid" });
  const agencia = pedido.agencia || pedido.transporte || "";
  const formaPago = FORMA_PAGO[pedido.forma_pago || ""] || pedido.forma_pago || "";
  const subtotal = Number(pedido.subtotal || 0);
  const costeTransporte = Number(pedido.coste_transporte || 0);
  const total = Number(pedido.total || 0);
  const totalSinPorte = total - costeTransporte;
  const iva = subtotal * 0.21;

  async function crearAlbaran(destinatario: "taller" | "proveedor"): Promise<Uint8Array> {
    const esProveedor = destinatario === "proveedor";
    const doc = await PDFDocument.create();
    const font = await doc.embedFont(StandardFonts.Helvetica);
    const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
    const TAM: [number, number] = [595.28, 841.89]; // A4
    let page: PDFPage = doc.addPage(TAM);
    const { width, height } = page.getSize();
    const navy = rgb(0.043, 0.09, 0.21);
    const blue = rgb(0.145, 0.388, 0.922);
    const gray = rgb(0.42, 0.45, 0.5);
    const darkGray = rgb(0.216, 0.255, 0.318);
    const black = rgb(0.1, 0.1, 0.1);
    const white = rgb(1, 1, 1);
    const gris = rgb(0.97, 0.97, 0.98);
    let y = height - 40;

    // Todo el texto pasa por aquí: nunca llega al PDF un carácter no admitido
    const t = (texto: unknown, o: { x: number; y: number; size: number; font: PDFFont; color: RGB }) => {
      page.drawText(winAnsi(texto), o);
    };
    const pie = () => {
      page.drawLine({ start: { x: 40, y: 40 }, end: { x: width - 40, y: 40 }, thickness: 0.5, color: rgb(0.9, 0.9, 0.9) });
      t("Recambio Directo — recambio-directo.com", { x: 40, y: 28, size: 7, font, color: gray });
      t(`Albarán ${codigo} — ${fecha}`, { x: width - 200, y: 28, size: 7, font, color: gray });
    };
    const colX = [44, 74, 190, 400, 470];
    const cabeceraTabla = () => {
      page.drawRectangle({ x: 40, y: y - 18, width: width - 80, height: 18, color: navy });
      t("DETALLE DE PRODUCTOS", { x: 44, y: y - 13, size: 9, font: fontBold, color: white });
      y -= 18;
      page.drawRectangle({ x: 40, y: y - 16, width: width - 80, height: 16, color: gris });
      ["Ud.", "Referencia", "Descripción", "Precio", "Neto"].forEach((label, i) => {
        t(label, { x: colX[i], y: y - 12, size: 8, font: fontBold, color: gray });
      });
      y -= 16;
    };
    const saltoSiHaceFalta = (necesario: number, conCabecera: boolean) => {
      if (y - necesario > 60) return;
      pie();
      page = doc.addPage(TAM);
      y = height - 50;
      if (conCabecera) cabeceraTabla();
    };

    // Header
    t("RECAMBIO DIRECTO", { x: 40, y, size: 18, font: fontBold, color: navy });
    t("ALBARÁN DE ENTREGA", { x: width - 200, y, size: 12, font: fontBold, color: navy });
    y -= 16;
    t("Marketplace B2B de Recambios", { x: 40, y, size: 8, font, color: gray });
    t(codigo, { x: width - 200, y, size: 10, font: fontBold, color: blue });
    y -= 14;
    t(fecha, { x: width - 200, y, size: 8, font, color: gray });
    y -= 6;
    page.drawLine({ start: { x: 40, y }, end: { x: width - 40, y }, thickness: 2, color: navy });
    y -= 20;

    if (esProveedor) {
      t("Este albarán es para uso interno del proveedor.", { x: 40, y, size: 8, font, color: blue });
      y -= 16;
    }

    // Proveedor y Cliente boxes
    const boxW = (width - 100) / 2;
    const boxH = 80;

    page.drawRectangle({ x: 40, y: y - boxH, width: boxW, height: boxH, borderWidth: 1, borderColor: navy, color: white });
    let bx = 48; let by = y - 14;
    t("PROVEEDOR", { x: bx, y: by, size: 7, font: fontBold, color: gray }); by -= 14;
    t(truncate(provNombre, 40), { x: bx, y: by, size: 10, font: fontBold, color: navy }); by -= 12;
    if (provCif) { t(`CIF: ${provCif}`, { x: bx, y: by, size: 8, font, color: darkGray }); by -= 10; }
    if (provDir) { t(truncate(`${provDir}${provCiudad ? ", " + provCiudad : ""}${provCP ? " " + provCP : ""}`, 50), { x: bx, y: by, size: 8, font, color: darkGray }); by -= 10; }
    if (provEmail) { t(truncate(provEmail, 50), { x: bx, y: by, size: 8, font, color: darkGray }); }

    page.drawRectangle({ x: 40 + boxW + 20, y: y - boxH, width: boxW, height: boxH, borderWidth: 1, borderColor: navy, color: white });
    bx = 48 + boxW + 20; by = y - 14;
    t("CLIENTE / TALLER", { x: bx, y: by, size: 7, font: fontBold, color: gray }); by -= 14;
    t(truncate(cliNombre, 40), { x: bx, y: by, size: 10, font: fontBold, color: navy }); by -= 12;
    if (cliCif) { t(`CIF: ${cliCif}`, { x: bx, y: by, size: 8, font, color: darkGray }); by -= 10; }
    if (cliDir) { t(truncate(`${cliDir}${cliCiudad ? ", " + cliCiudad : ""}${cliCP ? " " + cliCP : ""}`, 50), { x: bx, y: by, size: 8, font, color: darkGray }); by -= 10; }
    if (cliTel) { t(`Tel: ${cliTel}`, { x: bx, y: by, size: 8, font, color: darkGray }); }

    y -= boxH + 20;

    // Tabla de productos (con salto de página si el pedido es largo)
    cabeceraTabla();
    productos.forEach((pr: any, idx: number) => {
      saltoSiHaceFalta(16, true);
      const cant = Number(pr.cantidad || 1);
      const precio = Number(pr.precio || 0);
      const neto = cant * precio;
      if (idx % 2 === 1) page.drawRectangle({ x: 40, y: y - 16, width: width - 80, height: 16, color: gris });
      t(String(cant), { x: colX[0], y: y - 12, size: 8, font, color: black });
      t(truncate(String(pr.referencia || ""), 20), { x: colX[1], y: y - 12, size: 8, font: fontBold, color: navy });
      t(truncate(String(pr.descripcion || pr.producto || ""), 35), { x: colX[2], y: y - 12, size: 8, font, color: darkGray });
      t(`${precio.toFixed(2)} €`, { x: colX[3], y: y - 12, size: 8, font, color: darkGray });
      t(`${neto.toFixed(2)} €`, { x: colX[4], y: y - 12, size: 8, font: fontBold, color: black });
      y -= 16;
    });

    saltoSiHaceFalta(100, false);
    page.drawLine({ start: { x: 40, y }, end: { x: width - 40, y }, thickness: 0.5, color: rgb(0.9, 0.9, 0.9) });
    y -= 4;

    // Totales
    const totX = width - 180;
    t("Subtotal:", { x: totX, y: y - 12, size: 8, font, color: gray });
    t(`${subtotal.toFixed(2)} €`, { x: totX + 90, y: y - 12, size: 8, font, color: black });
    y -= 16;
    t("IVA (21%):", { x: totX, y: y - 12, size: 8, font, color: gray });
    t(`${iva.toFixed(2)} €`, { x: totX + 90, y: y - 12, size: 8, font, color: black });
    y -= 16;

    page.drawRectangle({ x: totX - 10, y: y - 16, width: 170, height: 18, color: gris });
    t("TOTAL:", { x: totX, y: y - 12, size: 10, font: fontBold, color: navy });
    t(`${(esProveedor ? totalSinPorte : total).toFixed(2)} €`, { x: totX + 90, y: y - 12, size: 10, font: fontBold, color: navy });
    y -= 24;

    // Forma de pago y Agencia
    if (formaPago || agencia) {
      page.drawRectangle({ x: 40, y: y - 24, width: width - 80, height: 24, borderWidth: 0.5, borderColor: rgb(0.9, 0.9, 0.9), color: white });
      if (formaPago) t(`Forma de pago: ${formaPago}`, { x: 48, y: y - 16, size: 8, font: fontBold, color: navy });
      if (agencia) t(`Agencia: ${agencia}`, { x: 300, y: y - 16, size: 8, font, color: darkGray });
    }

    pie();
    return await doc.save();
  }

  const tallerBytes = await crearAlbaran("taller");
  const proveedorBytes = await crearAlbaran("proveedor");

  const bucket = "FACTURAS";
  const albaranPath = `documentos/${codigo}/albaran-${codigo}.pdf`;
  const albaranProvPath = `documentos/${codigo}/albaran-proveedor-${codigo}.pdf`;

  const up1 = await supabase.storage.from(bucket).upload(albaranPath, Buffer.from(tallerBytes), { contentType: "application/pdf", upsert: true });
  if (up1.error) return { ok: false, status: 500, error: `No se pudo guardar el albarán del taller: ${up1.error.message}` };
  const up2 = await supabase.storage.from(bucket).upload(albaranProvPath, Buffer.from(proveedorBytes), { contentType: "application/pdf", upsert: true });
  if (up2.error) return { ok: false, status: 500, error: `No se pudo guardar el albarán del proveedor: ${up2.error.message}` };

  const albaran_url = supabase.storage.from(bucket).getPublicUrl(albaranPath).data.publicUrl;
  const albaran_proveedor_url = supabase.storage.from(bucket).getPublicUrl(albaranProvPath).data.publicUrl;

  const g = await guardarPedido(supabase, pedidoId, { albaran_url, albaran_proveedor_url });
  if (g.error) return { ok: false, status: 500, error: `Albaranes generados pero no anotados en el pedido: ${g.error}` };

  return { ok: true, codigo, albaran_url, albaran_proveedor_url, tallerBytes, proveedorBytes };
}
