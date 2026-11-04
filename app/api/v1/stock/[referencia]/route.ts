// app/api/v1/stock/[referencia]/route.ts
// GET  — consultar stock de una referencia
// PUT  — actualizar stock/precio de una referencia
// DELETE — eliminar referencia del catálogo (permanente)
import { NextRequest, NextResponse } from "next/server";
import {
  validarApiKey,
  noAutorizado,
  apiError,
  normalizarReferencia,
  supabase,
} from "../../../../../lib/apiAuth";

interface Params {
  params: Promise<{ referencia: string }>;
}

// ============================================================
// GET /api/v1/stock/:referencia
// ============================================================
export async function GET(request: NextRequest, { params }: Params) {
  const auth = await validarApiKey(request);
  if (!auth) return noAutorizado();

  const { referencia } = await params;
  const refNorm = normalizarReferencia(decodeURIComponent(referencia));

  const { data: pieza } = await supabase
    .from("piezas_publicadas")
    .select("referencia, marca, descripcion, precio, stock, tipo, precio_casco, referencia_normalizada, id")
    .eq("proveedor_id", auth.proveedor_id)
    .eq("referencia_normalizada", refNorm)
    .maybeSingle();

  if (!pieza) {
    return apiError(
      "NO_ENCONTRADO",
      `La referencia '${decodeURIComponent(referencia)}' no existe en tu catálogo`,
      404
    );
  }

  return NextResponse.json({
    referencia: pieza.referencia,
    fabricante: pieza.marca || "",
    descripcion: pieza.descripcion || "",
    cantidad: pieza.stock || 0,
    precio_neto: pieza.precio,
    tipo: pieza.tipo,
    precio_casco: pieza.precio_casco || null,
    actualizado_en: null,
  });
}

// ============================================================
// PUT /api/v1/stock/:referencia
// ============================================================
export async function PUT(request: NextRequest, { params }: Params) {
  const auth = await validarApiKey(request);
  if (!auth) return noAutorizado();

  const { referencia } = await params;
  const refNorm = normalizarReferencia(decodeURIComponent(referencia));

  let body: any;
  try {
    body = await request.json();
  } catch {
    return apiError("VALIDACION_ERROR", "El body debe ser JSON válido", 400);
  }

  const cantidad = body.cantidad;
  if (cantidad === undefined || cantidad === null) {
    return apiError(
      "VALIDACION_ERROR",
      "El campo 'cantidad' es obligatorio",
      400
    );
  }
  if (typeof cantidad !== "number" || cantidad < 0 || !Number.isInteger(cantidad)) {
    return apiError(
      "VALIDACION_ERROR",
      "La cantidad debe ser un número entero >= 0",
      400
    );
  }

  if (body.precio_neto !== undefined) {
    if (typeof body.precio_neto !== "number" || body.precio_neto < 0) {
      return apiError(
        "VALIDACION_ERROR",
        "El precio_neto debe ser un número >= 0",
        400
      );
    }
  }

  if (body.plazo_entrega_horas !== undefined) {
    if (
      typeof body.plazo_entrega_horas !== "number" ||
      body.plazo_entrega_horas < 0
    ) {
      return apiError(
        "VALIDACION_ERROR",
        "El plazo_entrega_horas debe ser un número >= 0",
        400
      );
    }
  }

  // Buscar la pieza existente
  const { data: pieza } = await supabase
    .from("piezas_publicadas")
    .select("id, referencia, marca, precio, stock")
    .eq("proveedor_id", auth.proveedor_id)
    .eq("referencia_normalizada", refNorm)
    .maybeSingle();

  if (!pieza) {
    return apiError(
      "NO_ENCONTRADO",
      `La referencia '${decodeURIComponent(referencia)}' no existe en tu catálogo`,
      404
    );
  }

  // Construir campos a actualizar
  const campos: any = { stock: cantidad };
  if (body.precio_neto !== undefined) campos.precio = body.precio_neto;
  // plazo_entrega_horas: lo guardamos como campo extra si lo quieres añadir a la tabla,
  // por ahora se ignora silenciosamente ya que no existe la columna

  const { error } = await supabase
    .from("piezas_publicadas")
    .update(campos)
    .eq("id", pieza.id);

  if (error) {
    return NextResponse.json(
      { codigo: "ERROR_INTERNO", mensaje: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    referencia: pieza.referencia,
    fabricante: pieza.marca || "",
    cantidad: cantidad,
    precio_neto: body.precio_neto !== undefined ? body.precio_neto : pieza.precio,
    actualizado_en: new Date().toISOString(),
  });
}

// ============================================================
// DELETE /api/v1/stock/:referencia
// ============================================================
export async function DELETE(request: NextRequest, { params }: Params) {
  const auth = await validarApiKey(request);
  if (!auth) return noAutorizado();

  const { referencia } = await params;
  const refNorm = normalizarReferencia(decodeURIComponent(referencia));

  const { data: pieza } = await supabase
    .from("piezas_publicadas")
    .select("id")
    .eq("proveedor_id", auth.proveedor_id)
    .eq("referencia_normalizada", refNorm)
    .maybeSingle();

  if (!pieza) {
    return apiError(
      "NO_ENCONTRADO",
      `La referencia '${decodeURIComponent(referencia)}' no existe en tu catálogo`,
      404
    );
  }

  await supabase.from("piezas_publicadas").delete().eq("id", pieza.id);

  return new NextResponse(null, { status: 204 });
}
