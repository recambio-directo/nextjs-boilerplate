import { NextRequest, NextResponse } from "next/server";

const RAPIDAPI_HOST = "auto-parts-catalog.p.rapidapi.com";
const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY!;

// Devuelve el árbol de categorías de piezas compatibles con un vehículo
// GET /api/vehiculo/categorias?carId=18902
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const carId = searchParams.get("carId");

  if (!carId) {
    return NextResponse.json({ error: "Falta el parámetro 'carId' (tecdoc_car_id)" }, { status: 400 });
  }

  try {
    // Variant-2: árbol anidado JSON — ideal para UI
    const url = `https://${RAPIDAPI_HOST}/api/category/type-id/1/products-groups-variant-2/${encodeURIComponent(carId)}/lang-id/5`;

    const res = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "x-rapidapi-host": RAPIDAPI_HOST,
        "x-rapidapi-key": RAPIDAPI_KEY,
      },
    });

    if (!res.ok) {
      console.error("Error TecDoc categorías:", res.status, await res.text());
      return NextResponse.json(
        { error: "Error al obtener categorías del vehículo" },
        { status: res.status }
      );
    }

    const data = await res.json();

    // La API devuelve un array de categorías raíz con hijos anidados
    // Estructura: { assemblyGroupNodeId, assemblyGroupName, subGroups: [...] }
    // Normalizamos para simplificar el frontend
    interface CategoriaRaw {
      assemblyGroupNodeId?: number;
      id?: number;
      assemblyGroupName?: string;
      name?: string;
      subGroups?: CategoriaRaw[];
      children?: CategoriaRaw[];
      hasArticles?: boolean;
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

    return NextResponse.json({ carId, categorias });
  } catch (err) {
    console.error("Error categorías vehículo:", err);
    return NextResponse.json({ error: "Error de conexión con el catálogo de piezas" }, { status: 500 });
  }
}
