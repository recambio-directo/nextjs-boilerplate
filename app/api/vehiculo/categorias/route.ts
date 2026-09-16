import { NextRequest, NextResponse } from "next/server";

const RAPIDAPI_HOST = "auto-parts-catalog.p.rapidapi.com";
const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY!;

// Categorías principales TecDoc (assemblyGroupNodeId estándar)
// Estas son las categorías más comunes para recambios de automóvil
const CATEGORIAS_PRINCIPALES = [
  {
    id: 100001,
    nombre: "Motor",
    icono: "🔧",
    hijos: [
      { id: 100139, nombre: "Filtro de aceite", hijos: [] },
      { id: 100140, nombre: "Filtro de aire", hijos: [] },
      { id: 100046, nombre: "Correa de distribución", hijos: [] },
      { id: 100048, nombre: "Bujías de encendido", hijos: [] },
      { id: 100062, nombre: "Junta de culata", hijos: [] },
      { id: 100009, nombre: "Bomba de agua", hijos: [] },
      { id: 100338, nombre: "Termostato", hijos: [] },
    ],
  },
  {
    id: 100002,
    nombre: "Frenos",
    icono: "🛑",
    hijos: [
      { id: 100118, nombre: "Pastillas de freno delanteras", hijos: [] },
      { id: 100117, nombre: "Pastillas de freno traseras", hijos: [] },
      { id: 100110, nombre: "Discos de freno delanteros", hijos: [] },
      { id: 100111, nombre: "Discos de freno traseros", hijos: [] },
      { id: 100437, nombre: "Pinzas de freno", hijos: [] },
      { id: 100116, nombre: "Zapatas de freno", hijos: [] },
    ],
  },
  {
    id: 100003,
    nombre: "Suspensión y dirección",
    icono: "🔩",
    hijos: [
      { id: 100288, nombre: "Amortiguadores delanteros", hijos: [] },
      { id: 100289, nombre: "Amortiguadores traseros", hijos: [] },
      { id: 100349, nombre: "Rótulas", hijos: [] },
      { id: 100343, nombre: "Silentblocks", hijos: [] },
      { id: 100292, nombre: "Muelles de suspensión", hijos: [] },
      { id: 100308, nombre: "Bieletas estabilizadoras", hijos: [] },
    ],
  },
  {
    id: 100005,
    nombre: "Embrague",
    icono: "⚙️",
    hijos: [
      { id: 100200, nombre: "Kit de embrague", hijos: [] },
      { id: 100204, nombre: "Volante motor", hijos: [] },
      { id: 100201, nombre: "Disco de embrague", hijos: [] },
    ],
  },
  {
    id: 100006,
    nombre: "Refrigeración",
    icono: "❄️",
    hijos: [
      { id: 100444, nombre: "Radiador", hijos: [] },
      { id: 100009, nombre: "Bomba de agua", hijos: [] },
      { id: 100338, nombre: "Termostato", hijos: [] },
      { id: 100446, nombre: "Ventilador", hijos: [] },
    ],
  },
  {
    id: 100007,
    nombre: "Electricidad",
    icono: "⚡",
    hijos: [
      { id: 100378, nombre: "Batería", hijos: [] },
      { id: 100379, nombre: "Alternador", hijos: [] },
      { id: 100380, nombre: "Motor de arranque", hijos: [] },
      { id: 100048, nombre: "Bujías", hijos: [] },
      { id: 100049, nombre: "Bobina de encendido", hijos: [] },
    ],
  },
  {
    id: 100008,
    nombre: "Escape",
    icono: "💨",
    hijos: [
      { id: 100468, nombre: "Catalizador", hijos: [] },
      { id: 100474, nombre: "Filtro de partículas", hijos: [] },
      { id: 100466, nombre: "Silenciador", hijos: [] },
      { id: 100152, nombre: "Sonda lambda", hijos: [] },
    ],
  },
  {
    id: 100009,
    nombre: "Filtros",
    icono: "🔍",
    hijos: [
      { id: 100139, nombre: "Filtro de aceite", hijos: [] },
      { id: 100140, nombre: "Filtro de aire", hijos: [] },
      { id: 100141, nombre: "Filtro de combustible", hijos: [] },
      { id: 100142, nombre: "Filtro de habitáculo", hijos: [] },
    ],
  },
  {
    id: 100010,
    nombre: "Iluminación",
    icono: "💡",
    hijos: [
      { id: 100483, nombre: "Faro delantero", hijos: [] },
      { id: 100484, nombre: "Piloto trasero", hijos: [] },
      { id: 100500, nombre: "Lámparas / bombillas", hijos: [] },
    ],
  },
  {
    id: 100011,
    nombre: "Carrocería",
    icono: "🚗",
    hijos: [
      { id: 100520, nombre: "Espejo retrovisor", hijos: [] },
      { id: 100522, nombre: "Parachoques", hijos: [] },
      { id: 100534, nombre: "Limpiaparabrisas", hijos: [] },
    ],
  },
];

// GET /api/vehiculo/categorias?carId=18902
// Intenta primero la API de TecDoc; si falla (404/plan no incluido),
// devuelve las categorías estándar predefinidas.
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const carId = searchParams.get("carId");

  if (!carId) {
    return NextResponse.json(
      { error: "Falta el parámetro 'carId' (tecdoc_car_id)" },
      { status: 400 }
    );
  }

  // Intentar TecDoc API primero (puede fallar si el plan no lo incluye)
  try {
    const variantes = [
      `https://${RAPIDAPI_HOST}/api/category/type-id/1/products-groups-variant-2/${encodeURIComponent(carId)}/lang-id/5`,
      `https://${RAPIDAPI_HOST}/api/category/type-id/1/products-groups-variant-1/${encodeURIComponent(carId)}/lang-id/5`,
    ];

    for (const url of variantes) {
      try {
        const res = await fetch(url, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "x-rapidapi-host": RAPIDAPI_HOST,
            "x-rapidapi-key": RAPIDAPI_KEY,
          },
        });

        if (res.ok) {
          const data = await res.json();

          interface CategoriaRaw {
            assemblyGroupNodeId?: number;
            id?: number;
            assemblyGroupName?: string;
            name?: string;
            subGroups?: CategoriaRaw[];
            children?: CategoriaRaw[];
          }

          function normalizarCategorias(cats: CategoriaRaw[]): any[] {
            if (!Array.isArray(cats)) return [];
            return cats.map((cat) => ({
              id: cat.assemblyGroupNodeId || cat.id,
              nombre: cat.assemblyGroupName || cat.name || "",
              hijos: normalizarCategorias(cat.subGroups || cat.children || []),
            }));
          }

          const categorias = normalizarCategorias(data);
          if (categorias.length > 0) {
            return NextResponse.json({ carId, categorias, fuente: "tecdoc" });
          }
        }
      } catch {
        // Continuar con la siguiente variante
      }
    }
  } catch {
    // Si TecDoc falla completamente, usamos categorías estándar
  }

  // Fallback: categorías estándar predefinidas
  console.log("TecDoc categorías no disponible, usando categorías estándar");
  return NextResponse.json({
    carId,
    categorias: CATEGORIAS_PRINCIPALES,
    fuente: "estandar",
  });
}
