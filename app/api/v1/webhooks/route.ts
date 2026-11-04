// app/api/v1/webhooks/route.ts
// POST — registrar webhook
// GET  — listar webhooks del proveedor
import { NextRequest, NextResponse } from "next/server";
import {
  validarApiKey,
  noAutorizado,
  apiError,
  supabase,
} from "../../../../lib/apiAuth";

const EVENTOS_VALIDOS = [
  "pedido.creado",
  "pedido.confirmado",
  "stock.consumido",
  "stock.reservado",
];

// ============================================================
// POST /api/v1/webhooks
// ============================================================
export async function POST(request: NextRequest) {
  const auth = await validarApiKey(request);
  if (!auth) return noAutorizado();

  let body: any;
  try {
    body = await request.json();
  } catch {
    return apiError("VALIDACION_ERROR", "El body debe ser JSON válido", 400);
  }

  if (!body.url || typeof body.url !== "string") {
    return apiError("VALIDACION_ERROR", "El campo 'url' es obligatorio", 400);
  }

  if (!body.url.startsWith("https://")) {
    return apiError(
      "VALIDACION_ERROR",
      "La URL del webhook debe usar HTTPS",
      400
    );
  }

  if (
    !body.eventos ||
    !Array.isArray(body.eventos) ||
    body.eventos.length === 0
  ) {
    return apiError(
      "VALIDACION_ERROR",
      "El campo 'eventos' debe ser un array con al menos un evento",
      400
    );
  }

  for (const evento of body.eventos) {
    if (!EVENTOS_VALIDOS.includes(evento)) {
      return apiError(
        "VALIDACION_ERROR",
        `Evento '${evento}' no válido. Válidos: ${EVENTOS_VALIDOS.join(", ")}`,
        400
      );
    }
  }

  // Verificar límite de webhooks por proveedor (máx 5)
  const { count } = await supabase
    .from("webhooks_proveedores")
    .select("id", { count: "exact" })
    .eq("proveedor_id", auth.proveedor_id);

  if ((count || 0) >= 5) {
    return apiError(
      "LIMITE_EXCEDIDO",
      "Máximo 5 webhooks por proveedor. Elimina uno antes de crear otro.",
      400
    );
  }

  const { data, error } = await supabase
    .from("webhooks_proveedores")
    .insert({
      proveedor_id: auth.proveedor_id,
      url: body.url,
      eventos: body.eventos,
      secreto: body.secreto || null,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json(
      { codigo: "ERROR_INTERNO", mensaje: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json(
    {
      webhook_id: data.id,
      url: data.url,
      eventos: data.eventos,
      activo: data.activo,
      creado_en: data.creado_en,
    },
    { status: 201 }
  );
}

// ============================================================
// GET /api/v1/webhooks
// ============================================================
export async function GET(request: NextRequest) {
  const auth = await validarApiKey(request);
  if (!auth) return noAutorizado();

  const { data, error } = await supabase
    .from("webhooks_proveedores")
    .select("id, url, eventos, activo, creado_en, actualizado_en")
    .eq("proveedor_id", auth.proveedor_id)
    .order("creado_en", { ascending: false });

  if (error) {
    return NextResponse.json(
      { codigo: "ERROR_INTERNO", mensaje: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json(
    (data || []).map((w: any) => ({
      webhook_id: w.id,
      url: w.url,
      eventos: w.eventos,
      activo: w.activo,
      creado_en: w.creado_en,
    }))
  );
}
