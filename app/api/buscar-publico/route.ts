import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function normalizar(ref: string): string {
  return ref.toUpperCase().replace(/[\s\-_./]/g, "");
}

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim();
  if (!q || q.length < 3) {
    return NextResponse.json({ resultados: [], mensaje: "Mínimo 3 caracteres" });
  }

  const norm = normalizar(q);

  try {
    // Buscar en piezas_publicadas por referencia normalizada (like)
    const { data: piezas } = await supabase
      .from("piezas_publicadas")
      .select("referencia, marca, descripcion, proveedor_id, tipo")
      .ilike("referencia_normalizada", `%${norm}%`)
      .limit(200);

    if (!piezas || piezas.length === 0) {
      // Sin resultados exactos → mostrar referencias populares como sugerencia
      const { data: populares } = await supabase
        .from("piezas_publicadas")
        .select("referencia, marca, descripcion, proveedor_id, tipo")
        .limit(200);

      if (populares && populares.length > 0) {
        const gruposPop = new Map<string, {
          referencia: string;
          marca: string;
          descripcion: string;
          tipo: string;
          proveedores: Set<string>;
        }>();
        for (const p of populares) {
          const key = `${normalizar(p.referencia)}|${(p.marca || "").toUpperCase()}`;
          if (!gruposPop.has(key)) {
            gruposPop.set(key, {
              referencia: p.referencia,
              marca: p.marca || "",
              descripcion: p.descripcion || "",
              tipo: p.tipo || "IAM",
              proveedores: new Set(),
            });
          }
          gruposPop.get(key)!.proveedores.add(p.proveedor_id);
        }
        const sugerencias = Array.from(gruposPop.values())
          .map((g) => ({
            referencia: g.referencia,
            marca: g.marca,
            descripcion: g.descripcion,
            tipo: g.tipo,
            num_proveedores: g.proveedores.size,
          }))
          .sort((a, b) => b.num_proveedores - a.num_proveedores)
          .slice(0, 10);

        return NextResponse.json({
          resultados: sugerencias,
          total: sugerencias.length,
          mensaje: `No encontramos "${q}" exactamente, pero mira estas referencias disponibles. Regístrate para búsqueda avanzada por matrícula y bastidor.`,
          es_sugerencia: true,
        });
      }

      return NextResponse.json({
        resultados: [],
        mensaje: "No se encontraron resultados. Regístrate para acceder a búsqueda avanzada por matrícula y bastidor.",
      });
    }

    // Agrupar por referencia+marca → contar proveedores únicos
    const grupos = new Map<string, {
      referencia: string;
      marca: string;
      descripcion: string;
      tipo: string;
      proveedores: Set<string>;
    }>();

    for (const p of piezas) {
      const key = `${normalizar(p.referencia)}|${(p.marca || "").toUpperCase()}`;
      if (!grupos.has(key)) {
        grupos.set(key, {
          referencia: p.referencia,
          marca: p.marca || "",
          descripcion: p.descripcion || "",
          tipo: p.tipo || "IAM",
          proveedores: new Set(),
        });
      }
      grupos.get(key)!.proveedores.add(p.proveedor_id);
    }

    // Devolver máximo 20 resultados, sin precios
    const resultados = Array.from(grupos.values())
      .map((g) => ({
        referencia: g.referencia,
        marca: g.marca,
        descripcion: g.descripcion,
        tipo: g.tipo,
        num_proveedores: g.proveedores.size,
      }))
      .sort((a, b) => b.num_proveedores - a.num_proveedores)
      .slice(0, 20);

    return NextResponse.json({
      resultados,
      total: grupos.size,
      mensaje:
        grupos.size > 20
          ? `Mostrando 20 de ${grupos.size} resultados. Regístrate para ver todos con precios.`
          : null,
    });
  } catch (err) {
    console.error("buscar-publico error:", err);
    return NextResponse.json({ resultados: [], mensaje: "Error interno" }, { status: 500 });
  }
}
