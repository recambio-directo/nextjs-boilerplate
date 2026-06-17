import { NextRequest, NextResponse } from "next/server";
import { supabase } from "../../lib/supabase"; // ajusta la ruta según donde esté tu cliente de Supabase

// ============================================================
// CONFIG
// ============================================================
const RAPIDAPI_HOST = "auto-parts-catalog.p.rapidapi.com";
const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY!; // ponla en variables de entorno de Vercel, NUNCA hardcodeada
const CACHE_DIAS_VALIDEZ = 30; // pasados estos días, se vuelve a consultar la API externa

// ============================================================
// TIPOS
// ============================================================
interface PiezaPublicada {
  id: string;
  proveedor_id: string;
  referencia: string;
  tipo: "OEM" | "IAM";
  precio: number;
  // añade aquí más campos según tu esquema real (descripcion, marca, stock, etc.)
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

/**
 * Normaliza una referencia para poder compararla de forma fiable:
 * quita espacios, guiones, puntos y pasa todo a mayúsculas.
 * Así "1K0 615 301 AA", "1k0-615-301-aa" y "1K0615301AA" se
 * consideran la misma referencia.
 */
function normalizar(referencia: string): string {
  return referencia
    .toUpperCase()
    .replace(/[\s\-_.]/g, ""); // quita espacios, guiones, guion bajo y puntos
}

/**
 * Llama al endpoint de RapidAPI que, dado un número OEM, devuelve
 * los articleId de aftermarket equivalentes (deduplicados).
 */
async function buscarEquivalenciasEnRapidAPI(oem: string): Promise<number[]> {
  const url = `https://${RAPIDAPI_HOST}/articles-oem/search-all-equal-oem-no/lang-id/4/article-oem-no/${encodeURIComponent(
    oem
  )}`;

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

  // Deduplicar por articleId (la API devuelve filas repetidas)
  const idsUnicos = new Set<number>(data.map((item: any) => item.articleId));
  return Array.from(idsUnicos);
}

/**
 * Llama al endpoint de detalles de artículo para obtener marca y descripción.
 */
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

/**
 * Busca en la tabla caché 'equivalencias_oem' si ya tenemos las
 * equivalencias para este OEM y siguen siendo válidas (no caducadas).
 */
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

/**
 * Guarda en caché las equivalencias recién obtenidas de la API externa.
 */
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

  // Borra cache antigua de este OEM antes de insertar la nueva (evita duplicados)
  await supabase.from("equivalencias_oem").delete().eq("oem_buscado", oem);

  const { error } = await supabase.from("equivalencias_oem").insert(filas);
  if (error) console.error("Error guardando cache equivalencias_oem:", error);
}

/**
 * Dado un listado de referencias (textos), busca en piezas_publicadas
 * cuáles están realmente en stock de tus proveedores, filtrando por tipo
 * y ordenando por precio ascendente (el más barato primero).
 *
 * IMPORTANTE: compara contra la columna 'referencia_normalizada' (sin
 * espacios/guiones, en mayúsculas) en vez de 'referencia' directa, para
 * que dé igual cómo cada proveedor haya tecleado el código original.
 */
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
    .order("precio", { ascending: true }); // <-- más barato primero

  if (error) {
    console.error("Error buscando en piezas_publicadas:", error);
    return [];
  }

  return data as PiezaPublicada[];
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

  // Normalizamos lo que escribió el taller para comparar contra TU base de datos
  // (da igual si puso espacios, guiones, mayúsculas o minúsculas).
  // OJO: para la llamada a RapidAPI usamos la referencia ORIGINAL (sin normalizar),
  // porque esa API externa espera el formato real del fabricante, con guiones
  // incluidos (ej. "28113-2H000"). Si se la mandamos normalizada ("281132H000"),
  // no la encuentra y devuelve cero resultados.
  const referenciaBuscada = normalizar(referenciaOriginal);

  // -----------------------------------------------------------
  // PASO 1: ¿Esta referencia exacta existe directamente en
  // piezas_publicadas? Esto nos dice si el taller buscó algo que
  // ya es OEM o ya es IAM en tu propia base.
  // -----------------------------------------------------------
  const { data: coincidenciaDirecta } = await supabase
    .from("piezas_publicadas")
    .select("tipo")
    .eq("referencia_normalizada", referenciaBuscada)
    .limit(1)
    .maybeSingle();

  // -----------------------------------------------------------
  // PASO 2: Stock OEM — proveedores que tienen esta referencia
  // exacta publicada como OEM (independientemente de si el taller
  // buscó por OEM o por IAM, mostramos el OEM exacto si coincide).
  // -----------------------------------------------------------
  const stockOEM = await buscarEnPiezasPublicadas([referenciaBuscada], "OEM");

  // -----------------------------------------------------------
  // PASO 3: Stock IAM — equivalencias.
  // Si lo que buscó coincide con un OEM (en tu base o no), buscamos
  // sus equivalentes aftermarket vía caché o RapidAPI.
  // -----------------------------------------------------------
  let equivalenciasIAM: { articulo_no: string; marca: string; descripcion: string }[] = [];

  // ¿Tenemos cache válida para este OEM? Usamos la referencia ORIGINAL
  // (con guiones) como clave, igual que se la pasamos a RapidAPI.
  let cache = await obtenerCache(referenciaOriginal);

  if (!cache) {
    // No hay cache (o caducó): consultamos RapidAPI con el formato ORIGINAL
    const articleIds = await buscarEquivalenciasEnRapidAPI(referenciaOriginal);

    if (articleIds.length > 0) {
      // Pedimos detalle (marca + descripción) de cada articleId
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

      // Guardamos en caché para no volver a llamar a la API la próxima vez
      // (misma clave ORIGINAL con la que se consulta arriba)
      await guardarCache(referenciaOriginal, detallesValidos);

      equivalenciasIAM = detallesValidos.map((d) => ({
        articulo_no: d.articulo_no,
        marca: d.marca,
        descripcion: d.descripcion,
      }));
    }
  } else {
    // Usamos lo que ya teníamos en caché
    equivalenciasIAM = cache.map((c) => ({
      articulo_no: c.articulo_no,
      marca: c.marca_iam,
      descripcion: c.descripcion || "",
    }));
  }

  // Referencias IAM equivalentes (solo los códigos, para buscar en piezas_publicadas)
  const referenciasIAMEquivalentes = equivalenciasIAM.map((e) => e.articulo_no);

  // Buscamos en tu base qué proveedores tienen esas referencias IAM publicadas,
  // ya ordenado por precio ascendente.
  const stockIAM = await buscarEnPiezasPublicadas(referenciasIAMEquivalentes, "IAM");

  // Enriquecemos cada resultado de stockIAM con la marca/descripción de la equivalencia
  // (por si tu tabla piezas_publicadas no guarda ya esos datos)
  const stockIAMEnriquecido = stockIAM.map((pieza) => {
    const infoEquivalencia = equivalenciasIAM.find(
      (e) => normalizar(e.articulo_no) === normalizar(pieza.referencia)
    );
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
    tipo_detectado: coincidenciaDirecta?.tipo || null, // "OEM" | "IAM" | null si no está en tu base
    stock_oem: {
      total: stockOEM.length,
      proveedores: stockOEM, // ya ordenado por precio ascendente
    },
    stock_iam: {
      total: stockIAMEnriquecido.length,
      proveedores: stockIAMEnriquecido, // ya ordenado por precio ascendente
    },
  });
}