// lib/apiAuth.ts
// Validación de API keys para la API de stock de proveedores
// NO MODIFICA ningún fichero existente — es un módulo nuevo

import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface ApiKeyData {
  proveedor_id: string;
  nombre_empresa: string;
  api_key_id: string;
}

function hashApiKey(key: string): string {
  return createHash("sha256").update(key).digest("hex");
}

/**
 * Valida la cabecera X-API-Key y devuelve los datos del proveedor.
 * Devuelve null si la key es inválida.
 */
export async function validarApiKey(
  request: NextRequest
): Promise<ApiKeyData | null> {
  const apiKey = request.headers.get("x-api-key");
  if (!apiKey) return null;

  const hash = hashApiKey(apiKey);

  const { data: keyData } = await supabase
    .from("api_keys_proveedores")
    .select("id, proveedor_id, total_peticiones")
    .eq("api_key_hash", hash)
    .eq("activa", true)
    .maybeSingle();

  if (!keyData) return null;

  // Obtener nombre de empresa
  const { data: usuario } = await supabase
    .from("usuarios")
    .select("nombre_empresa")
    .eq("id", keyData.proveedor_id)
    .maybeSingle();

  // Actualizar último uso (fire-and-forget)
  supabase
    .from("api_keys_proveedores")
    .update({
      ultimo_uso: new Date().toISOString(),
      total_peticiones: (keyData.total_peticiones || 0) + 1,
    })
    .eq("id", keyData.id)
    .then(() => {});

  return {
    proveedor_id: keyData.proveedor_id,
    nombre_empresa: usuario?.nombre_empresa || "Proveedor",
    api_key_id: keyData.id,
  };
}

/** Respuesta estándar de error */
export function apiError(
  codigo: string,
  mensaje: string,
  status: number
): NextResponse {
  return NextResponse.json({ codigo, mensaje }, { status });
}

/** Respuesta 401 */
export function noAutorizado(): NextResponse {
  return apiError(
    "NO_AUTORIZADO",
    "API key ausente o inválida. Incluye la cabecera X-API-Key.",
    401
  );
}

/** Helper: normalizar referencia igual que el trigger de Supabase */
export function normalizarReferencia(ref: string): string {
  return ref.toUpperCase().replace(/[\s\-_./]/g, "");
}

export { supabase };
