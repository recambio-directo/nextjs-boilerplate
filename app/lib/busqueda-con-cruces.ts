// lib/busqueda-con-cruces.ts
// ------------------------------------------------------------------
// Integración de cruces en el buscador de Recambio Directo.
//
// Idea: cuando el taller busca por referencia (OEM o IAM), expandimos
// la búsqueda con todas las equivalencias antes de consultar productos.
// Así, buscar "000 477 34 15" (OEM Mercedes) encuentra el MANN BF10181
// que tiene publicado un proveedor, aunque el anuncio no mencione el OEM.
//
// REQUISITO en la tabla de productos: una columna `referencia_norm`
// con la misma normalización (si no la tienes, ver SQL al final).
// ------------------------------------------------------------------

import { SupabaseClient } from '@supabase/supabase-js';

export function normalizarRef(ref: string): string {
  return ref.toUpperCase().replace(/[^A-Z0-9]/g, '');
}

/** Heurística: ¿parece el término de búsqueda una referencia y no texto libre? */
export function pareceReferencia(q: string): boolean {
  const norm = normalizarRef(q);
  // Al menos 4 alfanuméricos y con algún dígito → probable referencia
  return norm.length >= 4 && /\d/.test(norm);
}

export type ExpansionCruces = {
  refOriginalNorm: string;
  /** Todas las referencias normalizadas a buscar en productos (incluida la original) */
  refsExpandidas: string[];
  /** Detalle para mostrar en la UI: "también encontrado como equivalencia de..." */
  equivalencias: { marca: string; referencia: string; direccion: string }[];
};

/**
 * Expande una referencia con sus cruces en ambas direcciones.
 * Una sola llamada RPC — coste mínimo añadido al buscador.
 */
export async function expandirBusquedaPorCruces(
  supabase: SupabaseClient,
  query: string
): Promise<ExpansionCruces> {
  const refNorm = normalizarRef(query);
  const refs = new Set<string>([refNorm]);
  const equivalencias: ExpansionCruces['equivalencias'] = [];

  const { data, error } = await supabase.rpc('buscar_equivalencias', {
    ref_input: query,
  });

  if (!error && data) {
    for (const fila of data) {
      refs.add(normalizarRef(fila.referencia));
      equivalencias.push({
        marca: fila.marca,
        referencia: fila.referencia,
        direccion: fila.direccion,
      });
    }
  }

  return { refOriginalNorm: refNorm, refsExpandidas: [...refs], equivalencias };
}

/**
 * Ejemplo de uso en tu búsqueda de productos (server component o route handler):
 *
 *   const q = searchParams.q;
 *   let productos;
 *
 *   if (pareceReferencia(q)) {
 *     const { refsExpandidas, equivalencias } =
 *       await expandirBusquedaPorCruces(supabase, q);
 *
 *     const { data } = await supabase
 *       .from('productos')
 *       .select('*')
 *       .in('referencia_norm', refsExpandidas)   // ← búsqueda expandida
 *       .eq('estado', 'activo');
 *
 *     productos = data;
 *     // `equivalencias` te sirve para el banner de la UI:
 *     // "Mostrando también equivalencias de 000 477 34 15 (MERCEDES-BENZ)"
 *   } else {
 *     // búsqueda por texto libre (la que ya tienes)
 *   }
 */

// ------------------------------------------------------------------
// SQL para añadir referencia_norm a productos si aún no existe
// (columna generada: se mantiene sola, sin tocar el código de alta):
//
//   alter table public.productos
//     add column if not exists referencia_norm text
//     generated always as (public.normaliza_referencia(referencia)) stored;
//
//   create index if not exists idx_productos_ref_norm
//     on public.productos (referencia_norm);
//
// Ajusta "productos" y "referencia" a los nombres reales de tu tabla.
// ------------------------------------------------------------------