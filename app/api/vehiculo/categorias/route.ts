import { NextRequest, NextResponse } from "next/server";
import { obtenerCategorias } from "../../../lib/ipda";

// GET /api/vehiculo/categorias?vehicleId=34941
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

    // IPDA devuelve: { tree: [...], list: [...] }
    // Cada nodo del tree: { label, node, generics: [{id, label}], records: [subnodos] }

    const ICONOS: Record<string, string> = {
      "motor": "🔧",
      "freno": "🛑",
      "suspens": "🔩",
      "direcci": "🔩",
      "embrague": "⚙️",
      "refriger": "❄️",
      "electr": "⚡",
      "escape": "💨",
      "filtro": "🔍",
      "ilumin": "💡",
      "carrocer": "🚗",
      "aceite": "🛢️",
      "neumat": "🛞",
      "climatiz": "❄️",
      "transmis": "⚙️",
      "combusti": "⛽",
      "accesori": "🎒",
      "rueda": "🛞",
      "correa": "⚙️",
      "junta": "🔧",
      "tubo": "🔧",
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
        // IPDA usa: label (nombre), node (id del nodo), records (subnodos), generics (piezas genéricas)
        const id = n.node || n.id || n.nodeId || "";
        const nombre = n.label || n.name || n.text || "";
        const hijos = normalizarNodos(n.records || n.children || []);

        // Si tiene generics, son las piezas genéricas de este nodo (hojas)
        const generics = Array.isArray(n.generics)
          ? n.generics.map((g: any) => ({
              id: String(g.id || ""),
              nombre: g.label || g.name || "",
            }))
          : [];

        return {
          id: String(id),
          nombre,
          hijos,
          generics,
          icono: inferirIcono(nombre),
          hasChildren: hijos.length > 0 || generics.length > 0,
        };
      });
    }

    let categorias: any[];
    if (data && typeof data === "object" && !Array.isArray(data)) {
      const arr = data.tree || data.categories || [];
      categorias = normalizarNodos(Array.isArray(arr) ? arr : []);
    } else if (Array.isArray(data)) {
      categorias = normalizarNodos(data);
    } else {
      categorias = [];
    }

    // LOG: debug para identificar nodos sin genéricos
    function logNodosSinGenerics(cats: any[], path: string = "") {
      for (const c of cats) {
        const fullPath = path ? `${path} > ${c.nombre}` : c.nombre;
        if (c.hijos.length === 0 && c.generics.length === 0) {
          console.log(`[Categorías] HOJA SIN GENERICS: ${fullPath} (id=${c.id})`);
        }
        logNodosSinGenerics(c.hijos, fullPath);
      }
    }
    logNodosSinGenerics(categorias);

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
