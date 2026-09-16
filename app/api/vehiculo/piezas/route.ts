import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const RAPIDAPI_HOST = "auto-parts-catalog.p.rapidapi.com";
const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY!;

// Mapeo de categoryId a términos de búsqueda en piezas_publicadas.descripcion
const CATEGORIA_KEYWORDS: Record<number, string[]> = {
  // Motor
  100139: ["filtro aceite", "oil filter"],
  100140: ["filtro aire", "air filter"],
  100046: ["correa distribucion", "timing belt", "correa dentada"],
  100048: ["bujia", "spark plug"],
  100062: ["junta culata", "head gasket"],
  100009: ["bomba agua", "water pump"],
  100338: ["termostato", "thermostat"],
  // Frenos
  100118: ["pastilla freno", "brake pad", "pastillas delant"],
  100117: ["pastilla freno tras", "brake pad rear", "pastillas tras"],
  100110: ["disco freno", "brake disc", "disco delant"],
  100111: ["disco freno tras", "brake disc rear", "disco tras"],
  100437: ["pinza freno", "brake caliper"],
  100116: ["zapata freno", "brake shoe", "zapata"],
  // Suspensión
  100288: ["amortiguador delant", "shock absorber front"],
  100289: ["amortiguador tras", "shock absorber rear"],
  100349: ["rotula", "ball joint"],
  100343: ["silentblock", "silent block", "casquillo"],
  100292: ["muelle suspension", "spring", "muelle"],
  100308: ["bieleta estabilizador", "stabilizer link", "bieleta"],
  // Embrague
  100200: ["kit embrague", "clutch kit"],
  100204: ["volante motor", "flywheel", "volante bimasa"],
  100201: ["disco embrague", "clutch disc"],
  // Refrigeración
  100444: ["radiador", "radiator"],
  100446: ["ventilador", "fan", "electroventilador"],
  // Electricidad
  100378: ["bateria", "battery"],
  100379: ["alternador", "alternator"],
  100380: ["motor arranque", "starter motor", "arranque"],
  100049: ["bobina encendido", "ignition coil"],
  // Escape
  100468: ["catalizador", "catalytic converter"],
  100474: ["filtro particulas", "dpf", "fap"],
  100466: ["silenciador", "muffler", "escape"],
  100152: ["sonda lambda", "oxygen sensor", "lambda"],
  // Filtros
  100141: ["filtro combustible", "fuel filter", "filtro gasoil", "filtro gasolina"],
  100142: ["filtro habitaculo", "cabin filter", "filtro polen", "filtro interior"],
  // Iluminación
  100483: ["faro", "headlight", "faro delantero"],
  100484: ["piloto trasero", "tail light", "piloto"],
  100500: ["lampara", "bombilla", "bulb"],
  // Carrocería
  100520: ["espejo retrovisor", "mirror", "retrovisor"],
  100522: ["parachoques", "bumper"],
  100534: ["limpiaparabrisas", "wiper", "escobilla"],
};

// Normaliza una referencia para comparar: quita espacios, guiones, puntos, barras y pasa a mayúsculas
function normalizarRef(ref: string): string {
  return ref.toUpperCase().replace(/[\s\-_./]/g, "");
}

// Llama al API de cruces para una referencia aftermarket y devuelve referencias OEM y equivalentes
async function buscarCrucesAPI(referencia: string): Promise<string[]> {
  try {
    const url = `https://${RAPIDAPI_HOST}/artlookup/search-for-the-oem-cross-references-through-aftermarket-parts-references/article-oem-no/${encodeURIComponent(referencia)}`;
    const res = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "x-rapidapi-host": RAPIDAPI_HOST,
        "x-rapidapi-key": RAPIDAPI_KEY,
      },
    });

    if (!res.ok) return [];
    const data = await res.json();

    // Extraer todas las referencias de los resultados
    const refs = new Set<string>();
    if (Array.isArray(data)) {
      for (const item of data) {
        if (item.articleNo) refs.add(normalizarRef(item.articleNo));
        if (item.oemNo) refs.add(normalizarRef(item.oemNo));
        if (item.articleNumber) refs.add(normalizarRef(item.articleNumber));
        if (item.oemNumber) refs.add(normalizarRef(item.oemNumber));
        // Algunos formatos tienen nested arrays
        if (Array.isArray(item.crossReferences)) {
          for (const cr of item.crossReferences) {
            if (cr.articleNo) refs.add(normalizarRef(cr.articleNo));
            if (cr.oemNo) refs.add(normalizarRef(cr.oemNo));
          }
        }
      }
    } else if (typeof data === "object" && data !== null) {
      // Puede ser un objeto con arrays internos
      for (const key of Object.keys(data)) {
        const val = data[key];
        if (Array.isArray(val)) {
          for (const item of val) {
            if (item && typeof item === "object") {
              if (item.articleNo) refs.add(normalizarRef(item.articleNo));
              if (item.oemNo) refs.add(normalizarRef(item.oemNo));
              if (item.referenceNumber) refs.add(normalizarRef(item.referenceNumber));
            }
          }
        }
      }
    }

    return Array.from(refs);
  } catch (e) {
    console.error("Error API cruces:", e);
    return [];
  }
}

// GET /api/vehiculo/piezas?carId=18902&categoryId=100118&nombre=Pastillas+de+freno+delanteras
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const carId = searchParams.get("carId");
  const categoryId = searchParams.get("categoryId");
  const nombreCategoria = searchParams.get("nombre") || "";

  if (!carId || !categoryId) {
    return NextResponse.json(
      { error: "Faltan parámetros 'carId' y/o 'categoryId'" },
      { status: 400 }
    );
  }

  const catId = parseInt(categoryId, 10);
  let keywords = CATEGORIA_KEYWORDS[catId] || [];

  // Si no hay keywords configuradas, usar el nombre de la categoría
  if (keywords.length === 0 && nombreCategoria) {
    keywords = [nombreCategoria.toLowerCase()];
  }

  // Añadir palabras individuales del nombre (>3 chars) como fallback
  if (nombreCategoria) {
    const palabras = nombreCategoria.toLowerCase().split(/\s+/).filter((p) => p.length > 3);
    for (const p of palabras) {
      if (!keywords.some((kw) => kw.includes(p))) {
        keywords.push(p);
      }
    }
  }

  if (keywords.length === 0) {
    return NextResponse.json({
      carId,
      categoryId,
      total_en_stock: 0,
      articulos: [],
      mensaje: "Categoría sin palabras clave configuradas",
    });
  }

  try {
    // ── PASO 1: Buscar en stock por keywords en descripcion ──
    const orConditions = keywords
      .map((kw) => {
        const escaped = kw.replace(/'/g, "''");
        return `descripcion.ilike.%${escaped}%`;
      })
      .join(",");

    console.log(`[Piezas] cat=${catId} keywords=${JSON.stringify(keywords)}`);

    const { data: piezasDirectas, error: dbError } = await supabase
      .from("piezas_publicadas")
      .select("id, referencia, referencia_normalizada, marca, nombre, descripcion, tipo, precio, proveedor_id, proveedor_nombre")
      .or(orConditions)
      .order("precio", { ascending: true })
      .limit(50);

    if (dbError) {
      console.error("Error Supabase piezas:", dbError);
      return NextResponse.json(
        { error: "Error al buscar piezas en stock" },
        { status: 500 }
      );
    }

    const directas = piezasDirectas || [];
    console.log(`[Piezas] Resultados directos por keyword: ${directas.length}`);

    // ── PASO 2: Recoger referencias únicas encontradas ──
    const refsEncontradas = new Set<string>();
    const refOriginales = new Set<string>(); // para no duplicar en cruce
    for (const p of directas) {
      const refNorm = normalizarRef(p.referencia || "");
      if (refNorm) {
        refsEncontradas.add(refNorm);
        refOriginales.add(refNorm);
      }
    }

    // ── PASO 3: Para las primeras N referencias, buscar cruces en la API ──
    // Limitamos a 5 llamadas API para no saturar
    const refsParaCruzar = Array.from(refsEncontradas).slice(0, 5);
    const refsCruzadas = new Set<string>();

    const crucesPromesas = refsParaCruzar.map(async (ref) => {
      const cruces = await buscarCrucesAPI(ref);
      for (const c of cruces) {
        // Solo añadir si no es una referencia que ya tenemos por búsqueda directa
        if (!refOriginales.has(c)) {
          refsCruzadas.add(c);
        }
      }
    });

    await Promise.all(crucesPromesas);

    console.log(`[Piezas] Referencias cruzadas encontradas: ${refsCruzadas.size}`);

    // ── PASO 4: Buscar las referencias cruzadas en stock ──
    let piezasCruzadas: any[] = [];
    if (refsCruzadas.size > 0) {
      const refsCruzadasArr = Array.from(refsCruzadas);
      // Buscar en lotes de 20 (límite práctico para OR conditions)
      const lotes = [];
      for (let i = 0; i < refsCruzadasArr.length; i += 20) {
        lotes.push(refsCruzadasArr.slice(i, i + 20));
      }

      for (const lote of lotes) {
        const orRefs = lote
          .map((ref) => `referencia_normalizada.eq.${ref}`)
          .join(",");

        const { data: cruzadas } = await supabase
          .from("piezas_publicadas")
          .select("id, referencia, referencia_normalizada, marca, nombre, descripcion, tipo, precio, proveedor_id, proveedor_nombre")
          .or(orRefs)
          .order("precio", { ascending: true })
          .limit(50);

        if (cruzadas && cruzadas.length > 0) {
          piezasCruzadas = piezasCruzadas.concat(cruzadas);
        }
      }

      console.log(`[Piezas] Piezas encontradas por cruce: ${piezasCruzadas.length}`);
    }

    // ── PASO 5: Combinar resultados y agrupar ──
    const todasLasPiezas = [...directas, ...piezasCruzadas];

    const agrupados = new Map<string, any>();
    for (const p of todasLasPiezas) {
      const refNorm = normalizarRef(p.referencia_normalizada || p.referencia || "");
      if (!agrupados.has(refNorm)) {
        agrupados.set(refNorm, {
          articleId: 0,
          referencia: p.referencia,
          marca: p.marca || "",
          nombre: p.descripcion || p.nombre || "",
          oems: [],
          en_stock: true,
          fuente: refOriginales.has(refNorm) ? "keyword" : "cruce",
          stock: [],
          precio_desde: null as number | null,
        });
      }
      const grupo = agrupados.get(refNorm)!;
      grupo.stock.push({
        id: p.id,
        referencia: p.referencia,
        marca: p.marca,
        nombre: p.descripcion || p.nombre || "",
        tipo: p.tipo || "IAM",
        precio: p.precio,
        proveedor_id: p.proveedor_id,
      });
      if (grupo.precio_desde === null || p.precio < grupo.precio_desde) {
        grupo.precio_desde = p.precio;
      }
    }

    const articulos = Array.from(agrupados.values());

    // Ordenar: primero los de cruce (más relevantes), luego por precio
    articulos.sort((a, b) => {
      // Priorizar los encontrados por cruce (compatibilidad verificada)
      if (a.fuente === "cruce" && b.fuente !== "cruce") return -1;
      if (a.fuente !== "cruce" && b.fuente === "cruce") return 1;
      return (a.precio_desde || 999999) - (b.precio_desde || 999999);
    });

    return NextResponse.json({
      carId,
      categoryId,
      total_en_stock: articulos.length,
      total_directos: directas.length,
      total_por_cruce: piezasCruzadas.length,
      refs_cruzadas: refsCruzadas.size,
      articulos,
      fuente: "hibrido_keyword_cruce",
    });
  } catch (err) {
    console.error("Error piezas vehículo:", err);
    return NextResponse.json(
      { error: "Error de conexión con la base de datos" },
      { status: 500 }
    );
  }
}
