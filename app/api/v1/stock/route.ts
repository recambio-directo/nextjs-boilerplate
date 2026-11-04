// app/api/v1/stock/route.ts
// GET /api/v1/stock — Listar todo el stock del proveedor (paginado)
import { NextRequest, NextResponse } from "next/server";
import {
  validarApiKey,
  noAutorizado,
  supabase,
} from "../../../../lib/apiAuth";

export async function GET(request: NextRequest) {
  const auth = await validarApiKey(request);
  if (!auth) return noAutorizado();

  const { searchParams } = new URL(request.url);
  const pagina = Math.max(1, parseInt(searchParams.get("pagina") || "1"));
  const porPagina = Math.min(
    500,
    Math.max(1, parseInt(searchParams.get("por_pagina") || "100"))
  );
  const soloConStock = searchParams.get("solo_con_stock") === "true";

  const from = (pagina - 1) * porPagina;
  const to = from + porPagina - 1;

  let query = supabase
    .from("piezas_publicadas")
    .select("referencia, marca, descripcion, precio, stock, tipo, precio_casco, updated_at", {
      count: "exact",
    })
    .eq("proveedor_id", auth.proveedor_id)
    .order("referencia", { ascending: true })
    .range(from, to);

  if (soloConStock) {
    query = query.gt("stock", 0);
  }

  const { data, count, error } = await query;

  if (error) {
    return NextResponse.json(
      { codigo: "ERROR_INTERNO", mensaje: error.message },
      { status: 500 }
    );
  }

  const totalReferencias = count || 0;

  return NextResponse.json({
    datos: (data || []).map((p: any) => ({
      referencia: p.referencia,
      fabricante: p.marca || "",
      descripcion: p.descripcion || "",
      cantidad: p.stock || 0,
      precio_neto: p.precio,
      tipo: p.tipo,
      precio_casco: p.precio_casco || null,
      actualizado_en: p.updated_at || null,
    })),
    paginacion: {
      pagina_actual: pagina,
      por_pagina: porPagina,
      total_referencias: totalReferencias,
      total_paginas: Math.ceil(totalReferencias / porPagina),
    },
  });
}
