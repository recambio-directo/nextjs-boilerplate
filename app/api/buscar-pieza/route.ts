import { NextRequest, NextResponse } from "next/server";
import { supabase } from "../../lib/supabase";

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
  const { data, error } = await supabase
    .from("cruces_referencias")
    .select("marca_iam, referencia_iam")
    .eq("referencia_oem_norm", referenciaNormalizada)
    .limit(500);

  if (error) {
    console.error("Error buscando cruces locales:", error);
    return [];
  }

  if (!data || data.length === 0) return [];

  // Deduplicar por marca + referencia normalizada
  const vistos = new Set<string>();
  return data.filter((d) => {
    const k = `${normalizar(d.marca_iam)}|${normalizar(d.referencia_iam)}`;
    if (vistos.has(k)) return false;
    vistos.add(k);
    return true;
  }).map((d) => ({
    articulo_no: d.referencia_iam,
    marca: d.marca_iam,
  }));
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
  tipo: "OEM" | "IAM"
): Promise<PiezaPublicada[]> {
  if (referencias.length === 0) return [];
  const referenciasNormalizadas = referencias.map(normalizar);
  const { data, error } = await supabase
    .from("piezas_publicadas")
    .select("*")
    .in("referencia_normalizada", referenciasNormalizadas)
    .eq("tipo", tipo)
    .order("precio", { ascending: true });
  if (error) {
    console.error("Error buscando en piezas_publicadas:", error);
    return [];
  }
  return data as PiezaPublicada[];
}

async function buscarStockIAM(
  equivalencias: { articulo_no: string; marca: string }[]
): Promise<PiezaPublicada[]> {
  if (equivalencias.length === 0) return [];
  const referenciasNormalizadas = Array.from(
    new Set(equivalencias.map((e) => normalizar(e.articulo_no)))
  );
  const { data, error } = await supabase
    .from("piezas_publicadas")
    .select("*")
    .in("referencia_normalizada", referenciasNormalizadas)
    .eq("tipo", "IAM")
    .order("precio", { ascending: true });
  if (error) {
    console.error("Error buscando stock IAM:", error);
    return [];
  }
  const piezas = (data as PiezaPublicada[]) || [];
  return piezas.filter((pieza) => {
    const marcaPieza = normalizar(pieza.marca || "");
    if (!marcaPieza || marcaPieza.length < 3) return false;
    return equivalencias.some((eq) => {
      const refCoincide = normalizar(eq.articulo_no) === normalizar(pieza.referencia);
      const marcaEquivalencia = normalizar(eq.marca);
      if (!marcaEquivalencia || marcaEquivalencia.length < 3) return false;
      const marcaCoincide =
        marcaEquivalencia.includes(marcaPieza) || marcaPieza.includes(marcaEquivalencia);
      return refCoincide && marcaCoincide;
    });
  });
}

// ============================================================
// HANDLER PRINCIPAL
// ============================================================
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const referenciaOriginal = searchParams.get("referencia")?.trim();

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
  // PASO 2: Stock OEM directo
  // -----------------------------------------------------------
  const stockOEM = await buscarEnPiezasPublicadas([referenciaBuscada], "OEM");

  // -----------------------------------------------------------
  // PASO 3: Equivalencias IAM
  //
  // PRIMERO: buscamos en nuestra tabla local de cruces (1,5M+
  // registros, instantánea, gratis).
  // SOLO SI no hay cruces locales: caemos a RapidAPI (lenta, de pago).
  //
  // Esto ahorra llamadas a RapidAPI para la inmensa mayoría de
  // búsquedas, y el taller obtiene resultados más rápido.
  // -----------------------------------------------------------
  let equivalenciasIAM: { articulo_no: string; marca: string; descripcion: string }[] = [];
  const referenciaEsYaIAMDirecta = coincidenciaDirecta?.tipo === "IAM";

  if (!referenciaEsYaIAMDirecta) {
    // ---- INTENTO 1: Cruces locales (tabla cruces_referencias) ----
    const crucesLocales = await buscarCrucesLocales(referenciaBuscada);

    if (crucesLocales.length > 0) {
      // Tenemos cruces locales — los usamos directamente, sin RapidAPI.
      // No tenemos "descripcion" de TecDoc (eso lo pone el proveedor),
      // así que la dejamos vacía. El frontend ya usa la descripcion de
      // piezas_publicadas como fallback, así que no hay problema.
      equivalenciasIAM = crucesLocales.map((c) => ({
        articulo_no: c.articulo_no,
        marca: c.marca,
        descripcion: "",
      }));
    } else {
      // ---- INTENTO 2: RapidAPI (fallback) ----
      let cache = await obtenerCache(referenciaOriginal);

      if (!cache) {
        const articleIds = await buscarEquivalenciasEnRapidAPI(referenciaOriginal);

        if (articleIds.length > 0) {
          const detalles = await Promise.all(
            articleIds.map(async (id) => {
              const detalle = await obtenerDetalleArticulo(id);
              return detalle ? { articleId: id, ...detalle } : null;
            })
          );

          const detallesValidos = detalles.filter(
            (d): d is { articleId: number; articulo_no: string; marca: string; descripcion: string } =>
              d !== null
          );

          await guardarCache(referenciaOriginal, detallesValidos);

          equivalenciasIAM = detallesValidos.map((d) => ({
            articulo_no: d.articulo_no,
            marca: d.marca,
            descripcion: d.descripcion,
          }));
        }
      } else {
        equivalenciasIAM = cache.map((c) => ({
          articulo_no: c.articulo_no,
          marca: c.marca_iam,
          descripcion: c.descripcion || "",
        }));
      }
    }
  }

  // -----------------------------------------------------------
  // PASO 4: Buscar stock IAM real en piezas_publicadas
  // -----------------------------------------------------------
  const stockIAMPorEquivalencia = await buscarStockIAM(
    equivalenciasIAM.map((e) => ({ articulo_no: e.articulo_no, marca: e.marca }))
  );

  const stockIAMDirecto = await buscarEnPiezasPublicadas([referenciaBuscada], "IAM");

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