import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { buscarEquivalenciasIPDA } from "../../lib/ipda";

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
    // ── PASO 1: Búsqueda directa en piezas_publicadas ──
    const { data: piezas } = await supabase
      .from("piezas_publicadas")
      .select("referencia, marca, descripcion, proveedor_id, tipo")
      .ilike("referencia_normalizada", `%${norm}%`)
      .limit(200);

    // ── PASO 2: Cruces TecDoc (IPDA) en paralelo ──
    // Busca equivalencias para la referencia introducida
    let equivalenciasTecDoc: {
      referencia: string;
      marca: string;
      descripcion: string;
    }[] = [];

    try {
      const resultadosIPDA = await buscarEquivalenciasIPDA(q);
      equivalenciasTecDoc = resultadosIPDA.map((r) => ({
        referencia: r.referencia,
        marca: r.marca,
        descripcion: r.descripcion || r.nombre,
      }));
    } catch (err) {
      console.error("buscar-publico: error TecDoc:", err);
      // Continuar sin TecDoc si falla
    }

    // ── PASO 3: Buscar stock de las equivalencias TecDoc ──
    let piezasEquivalentes: typeof piezas = [];
    if (equivalenciasTecDoc.length > 0) {
      const refsNorm = Array.from(
        new Set(equivalenciasTecDoc.map((e) => normalizar(e.referencia)))
      );
      // Buscar en lotes de 50 para no exceder límites
      const lotes: string[][] = [];
      for (let i = 0; i < refsNorm.length; i += 50) {
        lotes.push(refsNorm.slice(i, i + 50));
      }
      for (const lote of lotes) {
        const { data } = await supabase
          .from("piezas_publicadas")
          .select("referencia, marca, descripcion, proveedor_id, tipo")
          .in("referencia_normalizada", lote)
          .limit(200);
        if (data) piezasEquivalentes = [...(piezasEquivalentes || []), ...data];
      }
    }

    // ── PASO 4: Combinar resultados directos + equivalencias ──
    const todasPiezas = [...(piezas || []), ...(piezasEquivalentes || [])];

    if (todasPiezas.length === 0 && equivalenciasTecDoc.length === 0) {
      return NextResponse.json({
        resultados: [],
        mensaje:
          "No se encontraron resultados. Regístrate para acceder a búsqueda avanzada por matrícula y bastidor.",
      });
    }

    // Agrupar por referencia+marca → contar proveedores únicos
    const grupos = new Map<
      string,
      {
        referencia: string;
        marca: string;
        descripcion: string;
        tipo: string;
        proveedores: Set<string>;
        es_equivalencia: boolean;
      }
    >();

    // Primero las piezas directas
    if (piezas) {
      for (const p of piezas) {
        const key = `${normalizar(p.referencia)}|${(p.marca || "").toUpperCase()}`;
        if (!grupos.has(key)) {
          grupos.set(key, {
            referencia: p.referencia,
            marca: p.marca || "",
            descripcion: p.descripcion || "",
            tipo: p.tipo || "IAM",
            proveedores: new Set(),
            es_equivalencia: false,
          });
        }
        grupos.get(key)!.proveedores.add(p.proveedor_id);
      }
    }

    // Luego las piezas de equivalencias (marcar como equivalencia)
    if (piezasEquivalentes) {
      for (const p of piezasEquivalentes) {
        const key = `${normalizar(p.referencia)}|${(p.marca || "").toUpperCase()}`;
        if (!grupos.has(key)) {
          // Buscar descripción de TecDoc si la pieza no tiene
          const infoTecDoc = equivalenciasTecDoc.find(
            (e) => normalizar(e.referencia) === normalizar(p.referencia)
          );
          grupos.set(key, {
            referencia: p.referencia,
            marca: p.marca || infoTecDoc?.marca || "",
            descripcion: p.descripcion || infoTecDoc?.descripcion || "",
            tipo: p.tipo || "IAM",
            proveedores: new Set(),
            es_equivalencia: true,
          });
        }
        grupos.get(key)!.proveedores.add(p.proveedor_id);
      }
    }

    // Si hay equivalencias TecDoc sin stock, mostrarlas igualmente (con 0 proveedores)
    if (todasPiezas.length === 0 && equivalenciasTecDoc.length > 0) {
      for (const eq of equivalenciasTecDoc.slice(0, 10)) {
        const key = `${normalizar(eq.referencia)}|${(eq.marca || "").toUpperCase()}`;
        if (!grupos.has(key)) {
          grupos.set(key, {
            referencia: eq.referencia,
            marca: eq.marca,
            descripcion: eq.descripcion,
            tipo: "IAM",
            proveedores: new Set(),
            es_equivalencia: true,
          });
        }
      }
    }

    // Devolver máximo 20 resultados, sin precios
    const resultados = Array.from(grupos.values())
      .map((g) => ({
        referencia: g.referencia,
        marca: g.marca,
        descripcion: g.descripcion,
        tipo: g.tipo,
        num_proveedores: g.proveedores.size,
        es_equivalencia: g.es_equivalencia,
      }))
      // Directos primero, luego por número de proveedores
      .sort((a, b) => {
        if (a.es_equivalencia !== b.es_equivalencia)
          return a.es_equivalencia ? 1 : -1;
        return b.num_proveedores - a.num_proveedores;
      })
      .slice(0, 20);

    const hayDirectos = resultados.some((r) => !r.es_equivalencia);
    const hayEquivalencias = resultados.some((r) => r.es_equivalencia);

    let mensaje: string | null = null;
    if (grupos.size > 20) {
      mensaje = `Mostrando 20 de ${grupos.size} resultados. Regístrate para ver todos con precios.`;
    } else if (!hayDirectos && hayEquivalencias) {
      mensaje = `No encontramos "${q}" directamente, pero estas son referencias equivalentes según TecDoc. Regístrate para ver precios y disponibilidad.`;
    }

    return NextResponse.json({
      resultados,
      total: grupos.size,
      mensaje,
      tiene_cruces_tecdoc: equivalenciasTecDoc.length > 0,
    });
  } catch (err) {
    console.error("buscar-publico error:", err);
    return NextResponse.json(
      { resultados: [], mensaje: "Error interno" },
      { status: 500 }
    );
  }
}
