import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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
  100200: ["kit embrague", "clutch kit", "embrague"],
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
    // Buscar en stock por keywords en descripcion
    const orConditions = keywords
      .map((kw) => {
        const escaped = kw.replace(/'/g, "''");
        return `descripcion.ilike.%${escaped}%`;
      })
      .join(",");

    console.log(`[Piezas] cat=${catId} keywords=${JSON.stringify(keywords)}`);

    const { data: piezas, error: dbError } = await supabase
      .from("piezas_publicadas")
      .select("id, referencia, referencia_normalizada, marca, nombre, descripcion, tipo, precio, proveedor_id, proveedor_nombre")
      .or(orConditions)
      .order("precio", { ascending: true })
      .limit(100);

    if (dbError) {
      console.error("Error Supabase piezas:", dbError);
      return NextResponse.json(
        { error: "Error al buscar piezas en stock" },
        { status: 500 }
      );
    }

    const resultados = piezas || [];
    console.log(`[Piezas] Resultados: ${resultados.length}`);

    // Agrupar por referencia_normalizada + marca para evitar duplicados
    const agrupados = new Map<string, any>();
    for (const p of resultados) {
      const refNorm = (p.referencia_normalizada || p.referencia || "").toUpperCase().replace(/[\s\-_./]/g, "");
      const clave = `${refNorm}_${(p.marca || "").toUpperCase()}`;
      if (!agrupados.has(clave)) {
        agrupados.set(clave, {
          referencia: p.referencia,
          marca: p.marca || "",
          nombre: p.descripcion || p.nombre || "",
          en_stock: true,
          stock: [],
          precio_desde: null as number | null,
        });
      }
      const grupo = agrupados.get(clave)!;
      grupo.stock.push({
        id: p.id,
        referencia: p.referencia,
        marca: p.marca,
        nombre: p.descripcion || p.nombre || "",
        tipo: p.tipo || "IAM",
        precio: p.precio,
        proveedor_id: p.proveedor_id,
        proveedor_nombre: p.proveedor_nombre || "",
      });
      if (grupo.precio_desde === null || (p.precio != null && p.precio < grupo.precio_desde)) {
        grupo.precio_desde = p.precio;
      }
    }

    const articulos = Array.from(agrupados.values());

    // Ordenar por precio
    articulos.sort((a, b) => (a.precio_desde || 999999) - (b.precio_desde || 999999));

    return NextResponse.json({
      carId,
      categoryId,
      total_en_stock: articulos.length,
      articulos,
      fuente: "stock_local",
    });
  } catch (err) {
    console.error("Error piezas vehículo:", err);
    return NextResponse.json(
      { error: "Error de conexión con la base de datos" },
      { status: 500 }
    );
  }
}
