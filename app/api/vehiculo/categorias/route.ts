import { NextRequest, NextResponse } from "next/server";
import { obtenerCategorias } from "../../../lib/ipda";

// GET /api/vehiculo/categorias?vehicleId=135598
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const vehicleId = searchParams.get("vehicleId") || searchParams.get("carId");

  if (!vehicleId) {
    return NextResponse.json(
      { error: "Falta el parámetro 'vehicleId'" },
      { status: 400 }
    );
  }

  try {
    const data = await obtenerCategorias(vehicleId);

    // El tree de IPDA devuelve una estructura anidada
    // Normalizar a nuestro formato { id, nombre, hijos[], icono }
    interface NodoIPDA {
      id?: string | number;
      nodeId?: string | number;
      name?: string;
      text?: string;
      children?: NodoIPDA[];
      items?: NodoIPDA[];
      hasChildren?: boolean;
      genericId?: string;
    }

    const ICONOS: Record<string, string> = {
      "motor": "🔧",
      "freno": "🛑",
      "suspension": "🔩",
      "direccion": "🔩",
      "embrague": "⚙️",
      "refrigeracion": "❄️",
      "electric": "⚡",
      "escape": "💨",
      "filtro": "🔍",
      "ilumina": "💡",
      "carroceria": "🚗",
      "aceite": "🛢️",
      "neumatico": "🛞",
      "climatiza": "❄️",
      "transmis": "⚙️",
      "combustible": "⛽",
    };

    function inferirIcono(nombre: string): string {
      const n = nombre.toLowerCase();
      for (const [key, icon] of Object.entries(ICONOS)) {
        if (n.includes(key)) return icon;
      }
      return "📦";
    }

    function normalizarNodos(nodos: any[]): any[] {
      if (!Array.isArray(nodos)) return [];
      return nodos.map((n: any) => {
        const id = n.id || n.nodeId || n.assemblyGroupNodeId || "";
        const nombre = n.name || n.text || n.assemblyGroupName || "";
        const hijos = normalizarNodos(n.children || n.items || []);
        return {
          id: String(id),
          nombre,
          hijos,
          icono: hijos.length > 0 ? inferirIcono(nombre) : undefined,
          genericId: n.genericId || n.generic || undefined,
          hasChildren: n.hasChildren || hijos.length > 0,
        };
      });
    }

    let categorias: any[];
    if (Array.isArray(data)) {
      categorias = normalizarNodos(data);
    } else if (data && typeof data === "object") {
      // Puede venir como { tree: [...] } o directamente como array
      const arr = data.tree || data.categories || data.nodes || data.items || data;
      categorias = normalizarNodos(Array.isArray(arr) ? arr : []);
    } else {
      categorias = [];
    }

    return NextResponse.json({
      vehicleId,
      categorias,
      total: categorias.length,
      fuente: "ipda_tecdoc",
    });
  } catch (err) {
    console.error("Error categorías IPDA:", err);
    return NextResponse.json(
      { error: "Error al obtener categorías del vehículo" },
      { status: 500 }
    );
  }
}
