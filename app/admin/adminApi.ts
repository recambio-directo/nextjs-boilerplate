// app/admin/adminApi.ts
// Utilidades compartidas del panel de administración.
import { supabase } from "../lib/supabase";

/** POST a una ruta /api/admin/* enviando la sesión del administrador. */
export async function adminPost(url: string, body: any): Promise<any> {
  try {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) return { ok: false, error: "Sesión caducada: vuelve a iniciar sesión" };
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
    });
    const json = await res.json().catch(() => null);
    return json || { ok: false, error: `Error ${res.status}` };
  } catch (e: any) {
    return { ok: false, error: e?.message || "Error de conexión" };
  }
}

export const IVA = 0.21;
export const r2 = (n: number) => Math.round((Number(n) || 0) * 100) / 100;
export const eur = (n: number) => `${r2(n).toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;

/**
 * Importe a pagar a cada proveedor de un pedido:
 * piezas × cantidad + IVA (lo que el proveedor factura al taller).
 */
export function importesProveedor(pedido: any): Map<string, number> {
  const mapa = new Map<string, number>();
  for (const prod of Array.isArray(pedido?.productos) ? pedido.productos : []) {
    if (!prod?.proveedor_id) continue;
    const base = (Number(prod.precio || 0) + Number(prod.impuesto || 0)) * Number(prod.cantidad || 1);
    mapa.set(prod.proveedor_id, (mapa.get(prod.proveedor_id) || 0) + base);
  }
  for (const [k, base] of mapa) mapa.set(k, r2(base * (1 + IVA)));
  return mapa;
}

/** Desglose económico de un pedido. Porte y recargo se tratan como base sin IVA. */
export function desglosePedido(p: any) {
  const piezas = r2(Number(p?.subtotal || 0));
  const ivaPiezas = r2(piezas * IVA);
  const porte = r2(Number(p?.coste_transporte || 0));
  const recargo = r2(Number(p?.gastos_gestion || 0));
  const total = r2(Number(p?.total || 0));
  return { piezas, ivaPiezas, porte, recargo, total, cobradoTaller: r2(total + recargo), proveedor: r2(piezas + ivaPiezas) };
}

/** Motivos por los que un pedido necesita la atención del administrador. */
export function incidenciasPedido(p: any): string[] {
  if (!p || p.anulado) return [];
  const motivos: string[] = [];
  const agencia = String(p.agencia || p.transporte || "").toLowerCase();
  const sinAgencia = !agencia || agencia.includes("medios");
  const tracking = p.tracking || p.tracking_nacex || p.tracking_seur || p.tracking_ctt || p.tracking_gls || p.tracking_dhl || p.tracking_mrw || p.tracking_number;
  const etiqueta = p.etiqueta_envio_url || p.etiqueta_nacex_url || p.etiqueta_seur_url || p.etiqueta_mrw_url || p.etiqueta_dhl_url;
  const entregado = p.estado_envio === "entregado";
  if (!sinAgencia && !tracking) motivos.push("Sin envío en agencia");
  if (!sinAgencia && tracking && !etiqueta && !entregado) motivos.push("Sin etiqueta");
  if (!p.albaran_url) motivos.push("Sin albarán");
  if (p.estado_envio === "incidencia") motivos.push("Incidencia de entrega");
  const notas = String(p.notas_internas || "");
  const ultimaInc = notas.lastIndexOf("INCIDENCIA");
  const ultimoOk = Math.max(notas.lastIndexOf(" OK —"), notas.lastIndexOf("resuelta"));
  if (ultimaInc > -1 && ultimaInc > ultimoOk && !motivos.length) motivos.push("Aviso anotado");
  if (!entregado && p.created_at && !["incidencia"].includes(p.estado_envio)) {
    const dias = (Date.now() - new Date(p.created_at).getTime()) / 86400000;
    if (dias > 5) motivos.push(`Sin entregar tras ${Math.floor(dias)} días`);
  }
  return motivos;
}

/** Datos que le faltan a un usuario para poder operar sin fallos. */
export function datosQueFaltan(u: any): string[] {
  const f: string[] = [];
  if (!u?.nombre_empresa) f.push("empresa");
  if (!u?.cif) f.push("CIF");
  if (!u?.telefono) f.push("teléfono");
  if (!u?.direccion) f.push("dirección");
  if (!u?.ciudad) f.push("ciudad");
  if (!/^\d{5}$/.test(String(u?.codigo_postal || ""))) f.push("código postal");
  if (!u?.provincia) f.push("provincia");
  if (u?.tipo === "proveedor" && !u?.iban) f.push("IBAN");
  return f;
}
