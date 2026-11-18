// app/lib/seguridad.ts
// Comprobaciones de acceso para las rutas de la API (servidor).
// El usuario lo verifica proxy.ts y llega en la cabecera x-rd-user-id.
import { sbAdmin } from "@/app/lib/envios";

export type Quien = { interno: boolean; userId: string | null };

/** Quién hace la llamada: interna (cron / otra ruta) o un usuario con sesión. */
export function quienLlama(request: Request): Quien {
  return {
    interno: request.headers.get("x-rd-interno") === "1",
    userId: request.headers.get("x-rd-user-id"),
  };
}

/** Cabecera que hay que añadir cuando una ruta llama a otra ruta de /api. */
export function cabeceraInterna(): Record<string, string> {
  return { "x-rd-key": process.env.CRON_SECRET || "" };
}

function denegado(msg = "No tienes acceso a este pedido") {
  return Response.json({ ok: false, error: msg }, { status: 403 });
}

async function esAdmin(userId: string): Promise<boolean> {
  const { data } = await sbAdmin().from("usuarios").select("tipo").eq("id", userId).maybeSingle();
  return data?.tipo === "admin";
}

/**
 * Comprueba que quien llama puede operar sobre el pedido:
 * llamada interna, admin, el taller que lo hizo o un proveedor del pedido.
 * Devuelve null si tiene acceso, o la respuesta de error a devolver.
 */
export async function accesoPedido(request: Request, pedidoId: unknown): Promise<Response | null> {
  const q = quienLlama(request);
  if (q.interno) return null;
  if (!q.userId) return denegado("No autorizado: inicia sesión");
  if (pedidoId === null || pedidoId === undefined || pedidoId === "") return denegado();

  const { data: pedido } = await sbAdmin()
    .from("pedidos")
    .select("cliente_id, productos")
    .eq("id", pedidoId as any)
    .maybeSingle();
  if (!pedido) return Response.json({ ok: false, error: "Pedido no encontrado" }, { status: 404 });

  if (pedido.cliente_id === q.userId) return null;
  const productos = Array.isArray(pedido.productos) ? pedido.productos : [];
  if (productos.some((p: any) => p?.proveedor_id === q.userId)) return null;
  if (await esAdmin(q.userId)) return null;
  return denegado();
}

/** Igual que accesoPedido pero para una devolución (solicitante, proveedor o admin). */
export async function accesoDevolucion(request: Request, devolucionId: unknown): Promise<Response | null> {
  const q = quienLlama(request);
  if (q.interno) return null;
  if (!q.userId) return denegado("No autorizado: inicia sesión");

  const { data: dev } = await sbAdmin()
    .from("devoluciones")
    .select("solicitante_id, proveedor_id")
    .eq("id", devolucionId as any)
    .maybeSingle();
  if (!dev) return Response.json({ ok: false, error: "Devolución no encontrada" }, { status: 404 });

  if (dev.solicitante_id === q.userId || dev.proveedor_id === q.userId) return null;
  if (await esAdmin(q.userId)) return null;
  return denegado("No tienes acceso a esta devolución");
}

/** Solo llamadas internas (crons u otras rutas del servidor). */
export function soloInterno(request: Request): Response | null {
  return quienLlama(request).interno ? null : denegado("Operación no permitida");
}

/** Solo llamadas internas o administradores (anulaciones y seguimientos directos en la agencia). */
export async function soloInternoOAdmin(request: Request): Promise<Response | null> {
  const q = quienLlama(request);
  if (q.interno) return null;
  if (q.userId && (await esAdmin(q.userId))) return null;
  return denegado("Operación no permitida");
}
