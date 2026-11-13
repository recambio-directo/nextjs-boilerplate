// app/lib/envios.ts
// Utilidades comunes de las rutas /api/<agencia>/crear-envio.
// Solo se usa en servidor (usa la service role key).
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export const ADMIN_EMAIL = "info@recambio-directo.com";
// Teléfono de Recambio Directo: se usa solo cuando una parte no tiene teléfono
// y la agencia lo exige. Nunca se inventan direcciones ni códigos postales.
export const TELEFONO_RD = "650495270";

export type ParteEnvio = {
  nombre: string;
  direccion: string;
  poblacion: string;
  cp: string;
  telefono: string;
  email: string;
  cif: string;
};

export type DatosEnvio = {
  pedido: any;
  codigo: string;
  remitente: ParteEnvio;
  destinatario: ParteEnvio;
  pesoKg: number;
  avisos: string[];
};

export type ResultadoDatos =
  | { ok: true; datos: DatosEnvio }
  | { ok: false; status: number; error: string };

export function sbAdmin(): SupabaseClient {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// ── Texto ────────────────────────────────────────────────────────────────────

export function txt(v: unknown): string {
  return v === null || v === undefined ? "" : String(v).replace(/\s+/g, " ").trim();
}

export function escXml(v: unknown): string {
  return txt(v)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/** Teléfono español en 9 dígitos, sin prefijo. "" si no es utilizable. */
export function telefono9(v: unknown): string {
  let d = txt(v).replace(/\D/g, "");
  if (d.length > 9 && d.startsWith("0034")) d = d.slice(4);
  if (d.length > 9 && d.startsWith("34")) d = d.slice(2);
  return d.length >= 9 ? d.slice(0, 9) : "";
}

export function cp5(v: unknown): string {
  const d = txt(v).replace(/\D/g, "");
  return d.length === 5 ? d : "";
}

/** Fecha de hoy en horario peninsular (el servidor trabaja en UTC). */
export function hoyMadrid(): { dd: string; mm: string; yyyy: string } {
  const partes = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Madrid", day: "2-digit", month: "2-digit", year: "numeric",
  }).formatToParts(new Date());
  const v = (t: string) => partes.find((p) => p.type === t)?.value || "";
  return { dd: v("day"), mm: v("month"), yyyy: v("year") };
}

export function esperar(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

/** fetch con límite de tiempo: una agencia colgada no bloquea el pedido. */
export function fetchT(url: string, init: RequestInit = {}, ms = 15000): Promise<Response> {
  return fetch(url, { ...init, signal: AbortSignal.timeout(ms) });
}

// ── Lectura de datos del envío ───────────────────────────────────────────────

async function poblacionPorCP(sb: SupabaseClient, cp: string): Promise<string> {
  if (!cp) return "";
  try {
    const { data } = await sb.from("codigos_postales").select("poblacion").eq("cp", cp).limit(1);
    return txt(data?.[0]?.poblacion);
  } catch {
    return "";
  }
}

/**
 * El checkout guarda pedido.direccion como "calle, ciudad" con los datos que el
 * taller confirmó (puede haberlos editado respecto a su perfil).
 */
function separarDireccionPedido(direccionPedido: string, perfilDireccion: string, perfilCiudad: string) {
  const dp = txt(direccionPedido);
  if (!dp) return { calle: "", ciudad: "" };
  if (perfilCiudad && dp.toLowerCase().endsWith(", " + perfilCiudad.toLowerCase())) {
    return { calle: dp.slice(0, dp.length - perfilCiudad.length - 2).trim(), ciudad: perfilCiudad };
  }
  if (perfilDireccion && dp.toLowerCase() === perfilDireccion.toLowerCase()) {
    return { calle: perfilDireccion, ciudad: perfilCiudad };
  }
  const i = dp.lastIndexOf(", ");
  if (i > 0) {
    const cola = dp.slice(i + 2).trim();
    // Si la cola empieza por un número es el portal ("C/ Mayor, 12"), no una ciudad
    if (cola && !/^\d/.test(cola)) return { calle: dp.slice(0, i).trim(), ciudad: cola };
  }
  return { calle: dp, ciudad: perfilCiudad };
}

/**
 * Reúne remitente (proveedor), destinatario (taller) y peso de un pedido.
 * Prioridad destinatario: lo que envía el checkout > lo guardado en el pedido > perfil.
 * Prioridad remitente: perfil del proveedor en BD > lo que envía el checkout.
 * Si falta un dato obligatorio NO se inventa: devuelve error.
 */
export async function cargarDatosEnvio(sb: SupabaseClient, pedidoId: unknown, body: any): Promise<ResultadoDatos> {
  const b = body || {};
  const { data: pedido, error } = await sb.from("pedidos").select("*").eq("id", pedidoId).single();
  if (error || !pedido) return { ok: false, status: 404, error: "Pedido no encontrado" };

  const avisos: string[] = [];
  const productos: any[] = Array.isArray(pedido.productos) ? pedido.productos : [];
  const proveedorId = productos[0]?.proveedor_id || null;

  // Remitente
  let prov: any = null;
  if (proveedorId) {
    const r = await sb.from("usuarios")
      .select("nombre_empresa, direccion, ciudad, codigo_postal, telefono, email, cif")
      .eq("id", proveedorId).maybeSingle();
    prov = r.data || null;
  }
  const remCp = cp5(prov?.codigo_postal) || cp5(b.remitenteCodigoPostal);
  let remPob = txt(prov?.ciudad) || txt(b.remitentePoblacion);
  if (!remPob || /^\d/.test(remPob)) remPob = (await poblacionPorCP(sb, remCp)) || remPob;
  let remTel = telefono9(prov?.telefono) || telefono9(b.remitenteTelefono);
  if (!remTel) { remTel = TELEFONO_RD; avisos.push("proveedor sin teléfono válido"); }
  // Si la dirección del perfil ya termina en ", <ciudad>", se quita la ciudad repetida
  let remDir = txt(prov?.direccion) || txt(b.remitenteDireccion);
  if (remPob && remDir.toLowerCase().endsWith(", " + remPob.toLowerCase()) && remDir.length > remPob.length + 6) {
    remDir = remDir.slice(0, remDir.length - remPob.length - 2).trim();
  }
  const remitente: ParteEnvio = {
    nombre: txt(prov?.nombre_empresa) || txt(b.remitenteNombre),
    direccion: remDir,
    poblacion: remPob,
    cp: remCp,
    telefono: remTel,
    email: txt(prov?.email) || txt(b.remitenteEmail),
    cif: txt(prov?.cif) || txt(b.remitenteCif),
  };

  // Destinatario
  let taller: any = null;
  if (pedido.cliente_id) {
    const r = await sb.from("usuarios")
      .select("nombre_empresa, direccion, ciudad, codigo_postal, telefono, email, cif")
      .eq("id", pedido.cliente_id).maybeSingle();
    taller = r.data || null;
  }
  const delPedido = separarDireccionPedido(pedido.direccion, txt(taller?.direccion), txt(taller?.ciudad));
  const destCp = cp5(b.destinatarioCodigoPostal) || cp5(taller?.codigo_postal) || cp5(pedido.codigo_postal_destino);
  let destPob = txt(b.destinatarioPoblacion) || delPedido.ciudad || txt(taller?.ciudad);
  if (!destPob) destPob = await poblacionPorCP(sb, destCp);
  let destTel = telefono9(b.destinatarioTelefono) || telefono9(pedido.cliente_telefono) || telefono9(taller?.telefono);
  if (!destTel) { destTel = TELEFONO_RD; avisos.push("taller sin teléfono válido"); }
  const destinatario: ParteEnvio = {
    nombre: txt(b.destinatarioNombre) || txt(pedido.cliente_nombre) || txt(taller?.nombre_empresa) || txt(pedido.cliente_email),
    direccion: txt(b.destinatarioDireccion) || delPedido.calle || txt(taller?.direccion),
    poblacion: destPob,
    cp: destCp,
    telefono: destTel,
    email: txt(pedido.cliente_email) || txt(b.destinatarioEmail) || txt(taller?.email),
    cif: txt(taller?.cif),
  };

  // Peso: el que declaró el taller en el checkout (con él se calculó el porte)
  const pesoPedido = Number(pedido.peso_kg);
  const pesoBody = Number(b.pesoKg);
  const pesoKg = pesoPedido > 0 ? pesoPedido : pesoBody > 0 ? pesoBody : Math.max(1, productos.length * 2);

  const faltan: string[] = [];
  if (!proveedorId || !prov) faltan.push("proveedor del pedido");
  if (!remitente.nombre) faltan.push("nombre del proveedor");
  if (!remitente.direccion) faltan.push("dirección del proveedor");
  if (!remitente.cp) faltan.push("código postal del proveedor");
  if (!remitente.poblacion) faltan.push("población del proveedor");
  if (!destinatario.nombre) faltan.push("nombre del taller");
  if (!destinatario.direccion) faltan.push("dirección del taller");
  if (!destinatario.cp) faltan.push("código postal del taller");
  if (!destinatario.poblacion) faltan.push("población del taller");
  if (faltan.length) {
    return { ok: false, status: 400, error: "Faltan datos obligatorios para crear el envío: " + faltan.join(", ") };
  }

  return {
    ok: true,
    datos: { pedido, codigo: txt(pedido.codigo) || `RD-${pedido.id}`, remitente, destinatario, pesoKg, avisos },
  };
}

/**
 * true si el pedido ya tiene un envío vivo con esta agencia: no hay que crear
 * otro (evita envíos duplicados por doble clic o reintentos).
 */
export function tieneEnvio(pedido: any, claveAgencia: string, trackingAgencia?: unknown): boolean {
  const tracking = txt(trackingAgencia) || txt(pedido?.tracking);
  if (!tracking) return false;
  if (txt(pedido?.estado_envio).toLowerCase() === "anulado") return false;
  const agencia = (txt(pedido?.agencia) || txt(pedido?.transporte)).toLowerCase();
  return agencia.includes(claveAgencia.toLowerCase());
}

// ── Escritura ────────────────────────────────────────────────────────────────

/**
 * Actualiza el pedido comprobando el resultado. Si una columna no existe en la
 * tabla, la quita y reintenta para no perder el resto de campos (tracking,
 * etiqueta…). Devuelve las columnas descartadas y el error final, si lo hay.
 */
export async function guardarPedido(
  sb: SupabaseClient, pedidoId: unknown, campos: Record<string, unknown>
): Promise<{ error: string | null; descartadas: string[] }> {
  const pendientes: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(campos)) if (v !== undefined) pendientes[k] = v;
  const descartadas: string[] = [];
  for (let i = 0; i < 8; i++) {
    if (Object.keys(pendientes).length === 0) return { error: null, descartadas };
    const { error } = await sb.from("pedidos").update(pendientes).eq("id", pedidoId);
    if (!error) return { error: null, descartadas };
    const m = /'([a-z0-9_]+)' column/i.exec(error.message || "") || /column "?(?:pedidos\.)?([a-z0-9_]+)"? (?:of relation "pedidos" )?does not exist/i.exec(error.message || "");
    const col = m?.[1];
    if (col && col in pendientes) {
      delete pendientes[col];
      descartadas.push(col);
      console.error(`[envios] La columna pedidos.${col} no existe: se guarda el resto`);
      continue;
    }
    console.error("[envios] Error guardando pedido", pedidoId, error.message);
    return { error: error.message, descartadas };
  }
  return { error: "No se pudo guardar el pedido", descartadas };
}

/** Sube la etiqueta a Storage comprobando el resultado. Devuelve la URL o null. */
export async function subirEtiqueta(sb: SupabaseClient, path: string, pdf: Buffer): Promise<string | null> {
  if (!pdf || pdf.length < 100) return null;
  const { error } = await sb.storage.from("FACTURAS").upload(path, pdf, { contentType: "application/pdf", upsert: true });
  if (error) {
    console.error("[envios] Error subiendo etiqueta", path, error.message);
    return null;
  }
  return sb.storage.from("FACTURAS").getPublicUrl(path).data.publicUrl;
}

/** Añade una línea a pedidos.notas_internas (queda rastro aunque no haya logs). */
export async function anotar(sb: SupabaseClient, pedidoId: unknown, texto: string): Promise<void> {
  if (!pedidoId) return;
  try {
    const { data } = await sb.from("pedidos").select("notas_internas").eq("id", pedidoId).maybeSingle();
    const previo = txt((data as any)?.notas_internas);
    const linea = `[${new Date().toISOString()}] ${texto}`.slice(0, 1200);
    const nuevo = (previo ? previo + "\n" : "") + linea;
    await sb.from("pedidos").update({ notas_internas: nuevo.slice(-6000) }).eq("id", pedidoId);
  } catch (e) {
    console.error("[envios] No se pudo anotar en el pedido", e);
  }
}

/** Deja la incidencia anotada en el pedido y avisa por email al administrador. */
export async function incidencia(
  sb: SupabaseClient, pedidoId: unknown, codigo: string, agencia: string, mensaje: string, detalle = ""
): Promise<void> {
  console.error(`[${agencia}] ${codigo || pedidoId}: ${mensaje}`, detalle.slice(0, 500));
  if (!pedidoId) return;
  await anotar(sb, pedidoId, `${agencia} INCIDENCIA: ${mensaje}${detalle ? " — " + detalle.slice(0, 600) : ""}`);
  try {
    if (!process.env.RESEND_API_KEY) return;
    const { Resend } = await import("resend");
    const resend = new Resend(process.env.RESEND_API_KEY);
    const seguro = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    await resend.emails.send({
      from: "Recambio Directo <info@recambio-directo.com>",
      to: ADMIN_EMAIL,
      subject: `⚠️ Incidencia ${agencia} — Pedido ${codigo || pedidoId}`,
      html: `<div style="font-family:Arial,sans-serif;font-size:14px;color:#111">
        <p><strong>Agencia:</strong> ${seguro(agencia)}<br/><strong>Pedido:</strong> ${seguro(codigo || String(pedidoId))}</p>
        <p><strong>Incidencia:</strong> ${seguro(mensaje)}</p>
        ${detalle ? `<pre style="white-space:pre-wrap;background:#f1f5f9;padding:12px;border-radius:8px;font-size:12px">${seguro(detalle.slice(0, 1500))}</pre>` : ""}
        <p>Revisa el pedido en el panel de administración. El detalle queda guardado en el pedido (notas internas).</p>
      </div>`,
    });
  } catch (e) {
    console.error("[envios] No se pudo enviar el aviso de incidencia", e);
  }
}
