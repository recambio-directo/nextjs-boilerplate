// app/api/v1/stock/bulk/route.ts
// POST /api/v1/stock/bulk — Actualización masiva de stock
import { NextRequest, NextResponse } from "next/server";
import {
  validarApiKey,
  noAutorizado,
  apiError,
  normalizarReferencia,
  supabase,
} from "../../../../../lib/apiAuth";

const MAX_REFERENCIAS = 5000;

export async function POST(request: NextRequest) {
  const auth = await validarApiKey(request);
  if (!auth) return noAutorizado();

  let body: any;
  try {
    body = await request.json();
  } catch {
    return apiError("VALIDACION_ERROR", "El body debe ser JSON válido", 400);
  }

  const modo = body.modo || "parcial";
  if (modo !== "parcial" && modo !== "completo") {
    return apiError(
      "VALIDACION_ERROR",
      "El campo 'modo' debe ser 'parcial' o 'completo'",
      400
    );
  }

  const referencias = body.referencias;
  if (!Array.isArray(referencias) || referencias.length === 0) {
    return apiError(
      "VALIDACION_ERROR",
      "El campo 'referencias' debe ser un array con al menos un elemento",
      400
    );
  }

  if (referencias.length > MAX_REFERENCIAS) {
    return NextResponse.json(
      {
        codigo: "LIMITE_EXCEDIDO",
        mensaje: `Máximo ${MAX_REFERENCIAS} referencias por llamada. Has enviado ${referencias.length}.`,
      },
      { status: 413 }
    );
  }

  // Validar estructura básica de cada referencia
  for (let i = 0; i < referencias.length; i++) {
    const ref = referencias[i];
    if (!ref.referencia || typeof ref.referencia !== "string") {
      return apiError(
        "VALIDACION_ERROR",
        `Elemento ${i}: falta el campo 'referencia'`,
        400
      );
    }
    if (ref.cantidad === undefined || typeof ref.cantidad !== "number" || ref.cantidad < 0) {
      return apiError(
        "VALIDACION_ERROR",
        `Elemento ${i} (${ref.referencia}): 'cantidad' debe ser un número >= 0`,
        400
      );
    }
  }

  // Obtener todas las piezas del proveedor de una vez (para batch eficiente)
  const refsNormalizadas = referencias.map((r: any) =>
    normalizarReferencia(r.referencia)
  );
  const refsUnicas = [...new Set(refsNormalizadas)];

  // Cargar piezas existentes en bloques de 500 (límite de Supabase IN)
  const piezasMap = new Map<string, { id: string; referencia: string }>();
  for (let i = 0; i < refsUnicas.length; i += 500) {
    const bloque = refsUnicas.slice(i, i + 500);
    const { data } = await supabase
      .from("piezas_publicadas")
      .select("id, referencia, referencia_normalizada")
      .eq("proveedor_id", auth.proveedor_id)
      .in("referencia_normalizada", bloque);

    if (data) {
      for (const p of data) {
        piezasMap.set(p.referencia_normalizada, {
          id: p.id,
          referencia: p.referencia,
        });
      }
    }
  }

  let actualizadas = 0;
  const errores: { referencia: string; motivo: string }[] = [];

  // Procesar actualizaciones
  for (const ref of referencias) {
    const norm = normalizarReferencia(ref.referencia);
    const pieza = piezasMap.get(norm);

    if (!pieza) {
      errores.push({
        referencia: ref.referencia,
        motivo: "Referencia no encontrada en catálogo",
      });
      continue;
    }

    const campos: any = { stock: ref.cantidad };
    if (ref.precio_neto !== undefined && typeof ref.precio_neto === "number") {
      campos.precio = ref.precio_neto;
    }

    const { error } = await supabase
      .from("piezas_publicadas")
      .update(campos)
      .eq("id", pieza.id);

    if (error) {
      errores.push({ referencia: ref.referencia, motivo: error.message });
    } else {
      actualizadas++;
    }
  }

  // Modo completo: poner a 0 las referencias NO incluidas
  if (modo === "completo") {
    const refsEnviadasSet = new Set(refsNormalizadas);
    const noIncluidas: string[] = [];

    // Obtener TODAS las refs del proveedor
    let offset = 0;
    const batchSize = 1000;
    while (true) {
      const { data } = await supabase
        .from("piezas_publicadas")
        .select("id, referencia_normalizada")
        .eq("proveedor_id", auth.proveedor_id)
        .gt("stock", 0)
        .range(offset, offset + batchSize - 1);

      if (!data || data.length === 0) break;

      for (const p of data) {
        if (!refsEnviadasSet.has(p.referencia_normalizada)) {
          noIncluidas.push(p.id);
        }
      }

      if (data.length < batchSize) break;
      offset += batchSize;
    }

    // Poner a stock 0 en bloques
    for (let i = 0; i < noIncluidas.length; i += 500) {
      const bloque = noIncluidas.slice(i, i + 500);
      await supabase
        .from("piezas_publicadas")
        .update({ stock: 0 })
        .in("id", bloque);
    }
  }

  return NextResponse.json({
    total_recibidas: referencias.length,
    actualizadas,
    errores: errores.length > 0 ? errores : [],
    ...(modo === "completo" && {
      nota: "Modo completo: las referencias no incluidas se han puesto a stock 0",
    }),
  });
}
