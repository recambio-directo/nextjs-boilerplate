import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const RAPIDAPI_HOST = "auto-parts-catalog.p.rapidapi.com";
const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY!;

// Devuelve las piezas compatibles con un vehículo para una categoría dada
// GET /api/vehiculo/piezas?carId=18902&categoryId=100456
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const carId = searchParams.get("carId");
  const categoryId = searchParams.get("categoryId");

  if (!carId || !categoryId) {
    return NextResponse.json(
      { error: "Faltan parámetros 'carId' y/o 'categoryId'" },
      { status: 400 }
    );
  }

  try {
    // 1. Obtener artículos de TecDoc para este vehículo + categoría
    const url = `https://${RAPIDAPI_HOST}/api/articles/list/type-id/1/vehicle-id/${encodeURIComponent(carId)}/category-id/${encodeURIComponent(categoryId)}/lang-id/5`;

    const res = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "x-rapidapi-host": RAPIDAPI_HOST,
        "x-rapidapi-key": RAPIDAPI_KEY,
      },
    });

    if (!res.ok) {
      console.error("Error TecDoc piezas:", res.status, await res.text());
      return NextResponse.json(
        { error: "Error al obtener piezas del catálogo" },
        { status: res.status }
      );
    }

    const data = await res.json();

    // Normalizar artículos de TecDoc
    interface ArticuloRaw {
      articleId?: number;
      articleNo?: string;
      supplierName?: string;
      articleProductName?: string;
      oem?: string[];
      oemNumbers?: { articleNumber: string; mfrName: string }[];
      [key: string]: any;
    }

    const articulos: ArticuloRaw[] = Array.isArray(data) ? data : data?.articles || data?.data || [];

    // Extraer todas las referencias (OEM + IAM) para buscar en nuestro stock
    const referenciasOEM = new Set<string>();
    const referenciasIAM = new Set<string>();

    function normalizar(ref: string): string {
      return ref.toUpperCase().replace(/[\s\-_./]/g, "");
    }

    const articulosNormalizados = articulos.map((art) => {
      const refIAM = art.articleNo || "";
      const marca = art.supplierName || "";
      const nombre = art.articleProductName || "";

      if (refIAM) referenciasIAM.add(normalizar(refIAM));

      // Recoger OEMs asociados
      const oems: string[] = [];
      if (art.oemNumbers && Array.isArray(art.oemNumbers)) {
        for (const o of art.oemNumbers) {
          if (o.articleNumber) {
            oems.push(o.articleNumber);
            referenciasOEM.add(normalizar(o.articleNumber));
          }
        }
      }
      if (art.oem && Array.isArray(art.oem)) {
        for (const o of art.oem) {
          oems.push(o);
          referenciasOEM.add(normalizar(o));
        }
      }

      return {
        articleId: art.articleId,
        referencia: refIAM,
        marca,
        nombre,
        oems,
      };
    });

    // 2. Buscar en nuestro stock (piezas_publicadas) qué tenemos disponible
    const todasRefs = [...Array.from(referenciasOEM), ...Array.from(referenciasIAM)];

    let stockDisponible: any[] = [];
    if (todasRefs.length > 0) {
      // Supabase limita .in() a ~300 items, dividimos si es necesario
      const chunks: string[][] = [];
      for (let i = 0; i < todasRefs.length; i += 200) {
        chunks.push(todasRefs.slice(i, i + 200));
      }

      const resultados = await Promise.all(
        chunks.map((chunk) =>
          supabase
            .from("piezas_publicadas")
            .select("id, referencia, referencia_normalizada, marca, nombre, tipo, precio, proveedor_id")
            .in("referencia_normalizada", chunk)
            .order("precio", { ascending: true })
        )
      );

      for (const r of resultados) {
        if (r.data) stockDisponible.push(...r.data);
      }
    }

    // 3. Enriquecer artículos de TecDoc con info de nuestro stock
    const articulosEnriquecidos = articulosNormalizados.map((art) => {
      const refNorm = normalizar(art.referencia);
      const oemsNorm = art.oems.map(normalizar);

      // Stock que coincide con la referencia IAM o sus OEMs
      const enStock = stockDisponible.filter(
        (p) =>
          p.referencia_normalizada === refNorm ||
          oemsNorm.includes(p.referencia_normalizada)
      );

      return {
        ...art,
        en_stock: enStock.length > 0,
        stock: enStock,
        precio_desde: enStock.length > 0 ? Math.min(...enStock.map((p: any) => p.precio)) : null,
      };
    });

    // Ordenar: primero los que tenemos en stock, luego por nombre
    articulosEnriquecidos.sort((a, b) => {
      if (a.en_stock && !b.en_stock) return -1;
      if (!a.en_stock && b.en_stock) return 1;
      return (a.nombre || "").localeCompare(b.nombre || "");
    });

    return NextResponse.json({
      carId,
      categoryId,
      total_tecdoc: articulosNormalizados.length,
      total_en_stock: articulosEnriquecidos.filter((a) => a.en_stock).length,
      articulos: articulosEnriquecidos,
    });
  } catch (err) {
    console.error("Error piezas vehículo:", err);
    return NextResponse.json({ error: "Error de conexión con el catálogo de piezas" }, { status: 500 });
  }
}
