import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ============================================================
// CONFIG
// ============================================================
const RAPIDAPI_HOST = "auto-parts-catalog.p.rapidapi.com";
const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY!;
const CACHE_DIAS_VALIDEZ = 30;

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

interface EquivalenciaCache {
  id: string;
  oem_buscado: string;
  article_id: number;
  articulo_no: string;
  marca_iam: string;
  descripcion: string | null;
  fecha_consulta: string;
}

// ============================================================
// HELPERS
// ============================================================

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalizar(referencia: string): string {
  return referencia.toUpperCase().replace(/[\s\-_./]/g, "");
}

// ---------- CRUCES LOCALES (tabla cruces_referencias) ----------

/**
 * Busca en nuestra tabla local de cruces OEM↔IAM (1,5M+ registros).
 * Es instantánea y gratuita — se consulta ANTES de RapidAPI.
 * Devuelve las equivalencias IAM encontradas para un OEM dado.
 */
async function buscarCrucesLocales(
  referenciaNormalizada: string
): Promise<{ articulo_no: string; marca: string }[]> {
  const [{ data: data1 }, { data: data2 }] = await Promise.all([
    supabase.from("cruces_referencias").select("marca_iam, referencia_iam").eq("referencia_oem_norm", referenciaNormalizada).limit(500),
    supabase.from("cruces_referencias").select("marca_oem, referencia_oem").eq("referencia_iam_norm", referenciaNormalizada).limit(500),
  ]);
  const resultados: { articulo_no: string; marca: string }[] = [];
  if (data1) for (const d of data1) resultados.push({ articulo_no: d.referencia_iam, marca: d.marca_iam });
  if (data2) for (const d of data2) resultados.push({ articulo_no: d.referencia_oem, marca: d.marca_oem });
  const vistos = new Set<string>();
  return resultados.filter((r) => {
    const k = `${normalizar(r.marca)}|${normalizar(r.articulo_no)}`;
    if (vistos.has(k)) return false;
    vistos.add(k);
    return true;
  });
}

// ---------- RAPIDAPI (fallback si no hay cruces locales) ----------

async function buscarEquivalenciasEnRapidAPI(oem: string): Promise<number[]> {
  const url = `https://${RAPIDAPI_HOST}/articles-oem/search-all-equal-oem-no/lang-id/4/article-oem-no/${encodeURIComponent(oem)}`;
  const res = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "x-rapidapi-host": RAPIDAPI_HOST,
      "x-rapidapi-key": RAPIDAPI_KEY,
    },
  });
  if (!res.ok) {
    console.error("Error RapidAPI search-all-equal-oem-no:", res.status, await res.text());
    return [];
  }
  const data = await res.json();
  if (!Array.isArray(data)) return [];
  const idsUnicos = new Set<number>(data.map((item: any) => item.articleId));
  return Array.from(idsUnicos);
}

async function obtenerDetalleArticulo(
  articleId: number
): Promise<{ articulo_no: string; marca: string; descripcion: string } | null> {
  const url = `https://${RAPIDAPI_HOST}/articles/article-complete-details/type-id/1?langId=4&countryFilterId=63&articleId=${articleId}`;
  const res = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "x-rapidapi-host": RAPIDAPI_HOST,
      "x-rapidapi-key": RAPIDAPI_KEY,
    },
  });
  if (!res.ok) {
    console.error("Error RapidAPI article-complete-details:", res.status, await res.text());
    return null;
  }
  const data = await res.json();
  const art = data?.article;
  if (!art) return null;
  return {
    articulo_no: art.articleNo,
    marca: art.supplierName,
    descripcion: art.articleProductName,
  };
}

// ---------- CACHE DE RAPIDAPI ----------

async function obtenerCache(oem: string): Promise<EquivalenciaCache[] | null> {
  const fechaLimite = new Date();
  fechaLimite.setDate(fechaLimite.getDate() - CACHE_DIAS_VALIDEZ);
  const { data, error } = await supabase
    .from("equivalencias_oem")
    .select("*")
    .eq("oem_buscado", oem)
    .gte("fecha_consulta", fechaLimite.toISOString());
  if (error) {
    console.error("Error leyendo cache equivalencias_oem:", error);
    return null;
  }
  return data && data.length > 0 ? (data as EquivalenciaCache[]) : null;
}

async function guardarCache(
  oem: string,
  equivalencias: { articleId: number; articulo_no: string; marca: string; descripcion: string }[]
) {
  const filas = equivalencias.map((eq) => ({
    oem_buscado: oem,
    article_id: eq.articleId,
    articulo_no: eq.articulo_no,
    marca_iam: eq.marca,
    descripcion: eq.descripcion,
    fecha_consulta: new Date().toISOString(),
  }));
  await supabase.from("equivalencias_oem").delete().eq("oem_buscado", oem);
  const { error } = await supabase.from("equivalencias_oem").insert(filas);
  if (error) console.error("Error guardando cache equivalencias_oem:", error);
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
    query = query.not("proveedor_id", "in", `(${proveedoresExcluidos.join(",")})`);
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
    query = query.not("proveedor_id", "in", `(${proveedoresExcluidos.join(",")})`);
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
    return NextResponse.json({ error: "Falta el parámetro 'referencia'" }, { status: 400 });
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
        .filter((exc: any) =>
          (exc.tipo === "cp" && cpCliente && exc.valor === cpCliente) ||
          (exc.tipo === "cliente" && emailCliente && exc.valor === emailCliente)
        )
        .map((exc: any) => exc.proveedor_id);
    }
  }

  // -----------------------------------------------------------
  // PASO 2: Stock OEM directo
  // -----------------------------------------------------------
  const stockOEM = await buscarEnPiezasPublicadas([referenciaBuscada], "OEM", proveedoresExcluidos);

  // -----------------------------------------------------------
  // PASO 3: Equivalencias IAM
  //
  // Se ejecutan en PARALELO las dos fuentes gratuitas (Supabase):
  //   1. Cruces locales (tabla cruces_referencias, 1,5M+ registros)
  //   2. Caché de RapidAPI (tabla equivalencias_oem, 30 días)
  //
  // Si la caché está vacía → se llama a RapidAPI en vivo y se guarda.
  // Finalmente se hace MERGE + DEDUPLICACIÓN de ambas fuentes,
  // para que aparezcan todos los cruces posibles sin solapamientos.
  // -----------------------------------------------------------
  let equivalenciasIAM: { articulo_no: string; marca: string; descripcion: string }[] = [];

  if (exactMode) {
    // Modo exacto: no buscar cruces ni equivalencias, solo la referencia directa
  } else {
    // ---- PARALELO: Cruces locales + Caché RapidAPI (ambas Supabase, gratis) ----
    const [crucesLocales, cacheRapidAPI] = await Promise.all([
      buscarCrucesLocales(referenciaBuscada),
      obtenerCache(referenciaOriginal),
    ]);

    // Resultados de cruces locales
    const desdeLocales: { articulo_no: string; marca: string; descripcion: string }[] =
      crucesLocales.map((c) => ({
        articulo_no: c.articulo_no,
        marca: c.marca,
        descripcion: "",
      }));

    // Resultados de RapidAPI (caché o live)
    let desdeRapidAPI: { articulo_no: string; marca: string; descripcion: string }[] = [];

    if (cacheRapidAPI && cacheRapidAPI.length > 0) {
      // Caché válida — usarla directamente, sin llamada externa
      desdeRapidAPI = cacheRapidAPI.map((c) => ({
        articulo_no: c.articulo_no,
        marca: c.marca_iam,
        descripcion: c.descripcion || "",
      }));
    } else {
      // Sin caché — llamar a RapidAPI en vivo
      // Si ya tenemos cruces locales, no bloquear: guardar caché en background
      const articleIds = await buscarEquivalenciasEnRapidAPI(referenciaOriginal);

      if (articleIds.length > 0) {
        // Limitar a 30 artículos y lanzar TODOS en paralelo (una sola ronda)
        const idsLimitados = articleIds.slice(0, 30);
        const resultados = await Promise.all(
          idsLimitados.map(async (id) => {
            const detalle = await obtenerDetalleArticulo(id);
            return detalle ? { articleId: id, ...detalle } : null;
          })
        );
        const detallesValidos = resultados.filter(
          (r): r is { articleId: number; articulo_no: string; marca: string; descripcion: string } => r !== null
        );

        // Guardar caché sin bloquear la respuesta
        guardarCache(referenciaOriginal, detallesValidos).catch(() => {});

        desdeRapidAPI = detallesValidos.map((d) => ({
          articulo_no: d.articulo_no,
          marca: d.marca,
          descripcion: d.descripcion,
        }));
      }
    }

    // ---- MERGE + DEDUPLICACIÓN ----
    // Prioridad: si una misma ref+marca aparece en ambas fuentes,
    // preferimos la de RapidAPI porque tiene descripcion de TecDoc.
    const vistos = new Set<string>();
    const merged: typeof equivalenciasIAM = [];

    // Primero RapidAPI (tiene descripcion)
    for (const eq of desdeRapidAPI) {
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
    equivalenciasIAM.map((e) => ({ articulo_no: e.articulo_no, marca: e.marca })),
    proveedoresExcluidos
  );

  const stockIAMDirecto = await buscarEnPiezasPublicadas([referenciaBuscada], "IAM", proveedoresExcluidos);

  const idsYaIncluidos = new Set(stockIAMPorEquivalencia.map((p) => p.id));
  const stockIAM = [
    ...stockIAMPorEquivalencia,
    ...stockIAMDirecto.filter((p) => !idsYaIncluidos.has(p.id)),
  ].sort((a, b) => a.precio - b.precio);

  const stockIAMEnriquecido = stockIAM.map((pieza) => {
    const marcaPieza = normalizar(pieza.marca || "");
    const infoEquivalencia = equivalenciasIAM.find((e) => {
      const refCoincide = normalizar(e.articulo_no) === normalizar(pieza.referencia);
      const marcaEquivalencia = normalizar(e.marca);
      const marcaCoincide =
        marcaEquivalencia.includes(marcaPieza) || marcaPieza.includes(marcaEquivalencia);
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