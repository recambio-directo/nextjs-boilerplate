import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { buscarEquivalenciasIPDA } from "../../lib/ipda";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ============================================================
// TIPOS
// ============================================================
interface PiezaPublicada {
  id: string;
  proveedor_id: string;
  referencia: string;
  tipo: "OEM" | "IAM";
  precio: number;
  [key: string]: any;
}

// ============================================================
// HELPERS
// ============================================================

function normalizar(referencia: string): string {
  return referencia.toUpperCase().replace(/[\s\-_./]/g, "");
}

// ---------- CRUCES LOCALES (tabla cruces_referencias) ----------

async function buscarCrucesLocales(
  referenciaNormalizada: string
): Promise<{ articulo_no: string; marca: string }[]> {
  const [{ data: data1 }, { data: data2 }] = await Promise.all([
    supabase
      .from("cruces_referencias")
      .select("marca_iam, referencia_iam")
      .eq("referencia_oem_norm", referenciaNormalizada)
      .limit(500),
    supabase
      .from("cruces_referencias")
      .select("marca_oem, referencia_oem")
      .eq("referencia_iam_norm", referenciaNormalizada)
      .limit(500),
  ]);
  const resultados: { articulo_no: string; marca: string }[] = [];
  if (data1)
    for (const d of data1)
      resultados.push({ articulo_no: d.referencia_iam, marca: d.marca_iam });
  if (data2)
    for (const d of data2)
      resultados.push({ articulo_no: d.referencia_oem, marca: d.marca_oem });
  const vistos = new Set<string>();
  return resultados.filter((r) => {
    const k = `${normalizar(r.marca)}|${normalizar(r.articulo_no)}`;
    if (vistos.has(k)) return false;
    vistos.add(k);
    return true;
  });
}

// ---------- BÚSQUEDA EN PIEZAS PUBLICADAS ----------

async function buscarEnPiezasPublicadas(
  referencias: string[],
  tipo: "OEM" | "IAM",
  proveedoresExcluidos: string[] = []
): Promise<PiezaPublicada[]> {
  if (referencias.length === 0) return [];
  const referenciasNormalizadas = referencias.map(normalizar);
  let query = supabase
    .from("piezas_publicadas")
    .select("*")
    .in("referencia_normalizada", referenciasNormalizadas)
    .eq("tipo", tipo)
    .order("precio", { ascending: true });
  if (proveedoresExcluidos.length > 0) {
    query = query.not(
      "proveedor_id",
      "in",
      `(${proveedoresExcluidos.join(",")})`
    );
  }
  const { data, error } = await query;
  if (error) {
    console.error("Error buscando en piezas_publicadas:", error);
    return [];
  }
  return data as PiezaPublicada[];
}

async function buscarStockIAM(
  equivalencias: { articulo_no: string; marca: string }[],
  proveedoresExcluidos: string[] = []
): Promise<PiezaPublicada[]> {
  if (equivalencias.length === 0) return [];
  const referenciasNormalizadas = Array.from(
    new Set(equivalencias.map((e) => normalizar(e.articulo_no)))
  );
  let query = supabase
    .from("piezas_publicadas")
    .select("*")
    .in("referencia_normalizada", referenciasNormalizadas)
    .eq("tipo", "IAM")
    .order("precio", { ascending: true });
  if (proveedoresExcluidos.length > 0) {
    query = query.not(
      "proveedor_id",
      "in",
      `(${proveedoresExcluidos.join(",")})`
    );
  }
  const { data, error } = await query;
  if (error) {
    console.error("Error buscando stock IAM:", error);
    return [];
  }
  const piezas = (data as PiezaPublicada[]) || [];
  return piezas.filter((pieza) => {
    const refPieza = normalizar(pieza.referencia);
    return equivalencias.some((eq) => normalizar(eq.articulo_no) === refPieza);
  });
}

// ============================================================
// HANDLER PRINCIPAL
// ============================================================
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const referenciaOriginal = searchParams.get("referencia")?.trim();
  const exactMode = searchParams.get("exact") === "1";

  if (!referenciaOriginal) {
    return NextResponse.json(
      { error: "Falta el parámetro 'referencia'" },
      { status: 400 }
    );
  }

  const referenciaBuscada = normalizar(referenciaOriginal);

  // -----------------------------------------------------------
  // PASO 1: ¿Esta referencia existe en piezas_publicadas?
  // -----------------------------------------------------------
  const { data: coincidenciaDirecta } = await supabase
    .from("piezas_publicadas")
    .select("tipo")
    .eq("referencia_normalizada", referenciaBuscada)
    .limit(1)
    .maybeSingle();

  // -----------------------------------------------------------
  // OBTENER EXCLUSIONES
  // -----------------------------------------------------------
  const cpCliente = searchParams.get("cp") || "";
  const emailCliente = searchParams.get("email") || "";
  let proveedoresExcluidos: string[] = [];

  if (cpCliente || emailCliente) {
    const { data: exclusiones } = await supabase
      .from("exclusiones_proveedor")
      .select("proveedor_id, tipo, valor");

    if (exclusiones && exclusiones.length > 0) {
      proveedoresExcluidos = exclusiones
        .filter(
          (exc: any) =>
            (exc.tipo === "cp" && cpCliente && exc.valor === cpCliente) ||
            (exc.tipo === "cliente" &&
              emailCliente &&
              exc.valor === emailCliente)
        )
        .map((exc: any) => exc.proveedor_id);
    }
  }

  // -----------------------------------------------------------
  // PASO 2: Stock OEM directo
  // -----------------------------------------------------------
  const stockOEM = await buscarEnPiezasPublicadas(
    [referenciaBuscada],
    "OEM",
    proveedoresExcluidos
  );

  // -----------------------------------------------------------
  // PASO 3: Equivalencias IAM
  //
  // Se ejecutan en PARALELO las dos fuentes:
  //   1. IPDA (TecDoc) — tipoBusqueda=loadByReferencia con equivalencias
  //   2. Cruces locales (tabla cruces_referencias, 1,5M+ registros)
  //
  // Después se hace MERGE + DEDUPLICACIÓN de ambas fuentes.
  // -----------------------------------------------------------
  let equivalenciasIAM: {
    articulo_no: string;
    marca: string;
    descripcion: string;
  }[] = [];

  if (exactMode) {
    // Modo exacto: no buscar cruces ni equivalencias
  } else {
    // ---- PARALELO: IPDA (TecDoc) + Cruces locales (Supabase) ----
    const [resultadosIPDA, crucesLocales] = await Promise.all([
      buscarEquivalenciasIPDA(referenciaOriginal),
      buscarCrucesLocales(referenciaBuscada),
    ]);

    // Resultados de IPDA (TecDoc) — tienen descripcion y marca de TecDoc
    const desdeIPDA: typeof equivalenciasIAM = resultadosIPDA.map((r) => ({
      articulo_no: r.referencia,
      marca: r.marca,
      descripcion: r.descripcion || r.nombre,
    }));

    // Resultados de cruces locales
    const desdeLocales: typeof equivalenciasIAM = crucesLocales.map((c) => ({
      articulo_no: c.articulo_no,
      marca: c.marca,
      descripcion: "",
    }));

    // ---- MERGE + DEDUPLICACIÓN ----
    // Prioridad: IPDA primero porque tiene descripcion de TecDoc
    const vistos = new Set<string>();
    const merged: typeof equivalenciasIAM = [];

    // Primero IPDA (tiene descripcion)
    for (const eq of desdeIPDA) {
      const clave = `${normalizar(eq.marca)}|${normalizar(eq.articulo_no)}`;
      if (!vistos.has(clave)) {
        vistos.add(clave);
        merged.push(eq);
      }
    }
    // Luego locales (solo los que no estén ya)
    for (const eq of desdeLocales) {
      const clave = `${normalizar(eq.marca)}|${normalizar(eq.articulo_no)}`;
      if (!vistos.has(clave)) {
        vistos.add(clave);
        merged.push(eq);
      }
    }

    equivalenciasIAM = merged;
  }

  // -----------------------------------------------------------
  // PASO 4: Buscar stock IAM real en piezas_publicadas
  // -----------------------------------------------------------
  const stockIAMPorEquivalencia = await buscarStockIAM(
    equivalenciasIAM.map((e) => ({
      articulo_no: e.articulo_no,
      marca: e.marca,
    })),
    proveedoresExcluidos
  );

  const stockIAMDirecto = await buscarEnPiezasPublicadas(
    [referenciaBuscada],
    "IAM",
    proveedoresExcluidos
  );

  const idsYaIncluidos = new Set(stockIAMPorEquivalencia.map((p) => p.id));
  const stockIAM = [
    ...stockIAMPorEquivalencia,
    ...stockIAMDirecto.filter((p) => !idsYaIncluidos.has(p.id)),
  ].sort((a, b) => a.precio - b.precio);

  const stockIAMEnriquecido = stockIAM.map((pieza) => {
    const marcaPieza = normalizar(pieza.marca || "");
    const infoEquivalencia = equivalenciasIAM.find((e) => {
      const refCoincide =
        normalizar(e.articulo_no) === normalizar(pieza.referencia);
      const marcaEquivalencia = normalizar(e.marca);
      const marcaCoincide =
        marcaEquivalencia.includes(marcaPieza) ||
        marcaPieza.includes(marcaEquivalencia);
      return refCoincide && marcaCoincide;
    });
    return {
      ...pieza,
      marca_iam: infoEquivalencia?.marca || null,
      descripcion_iam: infoEquivalencia?.descripcion || null,
    };
  });

  // -----------------------------------------------------------
  // RESPUESTA FINAL
  // -----------------------------------------------------------
  return NextResponse.json({
    referencia_buscada: referenciaOriginal,
    referencia_normalizada: referenciaBuscada,
    tipo_detectado: coincidenciaDirecta?.tipo || null,
    stock_oem: {
      total: stockOEM.length,
      proveedores: stockOEM,
    },
    stock_iam: {
      total: stockIAMEnriquecido.length,
      proveedores: stockIAMEnriquecido,
    },
  });
}
