import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { obtenerReferencias, obtenerCategorias } from "../../../lib/ipda";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Normaliza una referencia para comparar: quita espacios, guiones, puntos, barras y pasa a mayúsculas
function normalizarRef(ref: string): string {
  return ref.toUpperCase().replace(/[\s\-_./]/g, "");
}

// GET /api/vehiculo/piezas?vehicleId=135598&nodoId=100260&genericoId=8&nombre=Filtro+de+aire
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const vehicleId = searchParams.get("vehicleId");
  const nodoId = searchParams.get("nodoId");
  const genericoId = searchParams.get("genericoId") || "";
  const nombre = searchParams.get("nombre") || "";

  if (!vehicleId || !nodoId) {
    return NextResponse.json(
      { error: "Faltan parámetros 'vehicleId' y/o 'nodoId'" },
      { status: 400 }
    );
  }

  try {
    // ── PASO 1: Obtener piezas TecDoc de IPDA ──
    console.log(`[Piezas] vehicleId=${vehicleId} nodoId=${nodoId} genericoId=${genericoId}`);

    let refsTecdoc: any[] = [];

    if (genericoId) {
      // Caso normal: tenemos el genérico, buscar directamente
      const ipdaData = await obtenerReferencias(vehicleId, nodoId, genericoId);
      refsTecdoc = ipdaData?.refs || [];
    } else {
      // Sin genericoId: obtener el árbol de categorías y buscar los genéricos de este nodo
      console.log(`[Piezas] Sin genericoId, buscando genéricos del nodo ${nodoId}...`);
      try {
        const catData = await obtenerCategorias(vehicleId);
        const tree = catData?.tree || catData?.categories || [];

        // Buscar el nodo en el árbol recursivamente
        function findNode(nodes: any[], targetId: string): any | null {
          for (const n of nodes) {
            if (String(n.node || n.id) === targetId) return n;
            const found = findNode(n.records || n.children || [], targetId);
            if (found) return found;
          }
          return null;
        }

        const nodo = findNode(Array.isArray(tree) ? tree : [], nodoId);
        const generics = nodo?.generics || [];

        if (generics.length > 0) {
          // Buscar piezas para cada genérico (máximo 5 para no sobrecargar)
          const genericIds = generics.slice(0, 5).map((g: any) => String(g.id));
          console.log(`[Piezas] Encontrados ${generics.length} genéricos, buscando: ${genericIds.join(", ")}`);
          const resultados = await Promise.all(
            genericIds.map((gId: string) =>
              obtenerReferencias(vehicleId, nodoId, gId).catch(() => ({ refs: [] }))
            )
          );
          for (const r of resultados) {
            if (r?.refs) refsTecdoc = refsTecdoc.concat(r.refs);
          }
        } else {
          console.log(`[Piezas] Nodo ${nodoId} no tiene genéricos`);
        }
      } catch (catErr: any) {
        console.error(`[Piezas] Error obteniendo genéricos del nodo:`, catErr.message);
      }
    }
    console.log(`[Piezas] TecDoc refs: ${refsTecdoc.length}`);

    if (refsTecdoc.length === 0) {
      return NextResponse.json({
        vehicleId,
        nodoId,
        nombre,
        total_tecdoc: 0,
        total_en_stock: 0,
        articulos: [],
        mensaje: "No se encontraron referencias TecDoc para este vehículo y categoría",
      });
    }

    // ── PASO 2: Recoger todas las referencias para buscar en stock ──
    // Cada ref de IPDA tiene: referencia, refpropia, refprove, ref_ean
    const refsParaBuscar = new Set<string>();
    const refMap = new Map<string, any>(); // refNormalizada → datos TecDoc

    for (const ref of refsTecdoc) {
      const refs = [
        ref.referencia,
        ref.refpropia,
        ref.refprove,
      ].filter(Boolean);

      for (const r of refs) {
        const norm = normalizarRef(r);
        if (norm.length >= 4) {
          refsParaBuscar.add(norm);
          if (!refMap.has(norm)) {
            refMap.set(norm, ref);
          }
        }
      }
    }

    console.log(`[Piezas] Refs únicas para buscar en stock: ${refsParaBuscar.size}`);

    // ── PASO 3: Buscar en piezas_publicadas por referencia_normalizada ──
    const refsArr = Array.from(refsParaBuscar);
    let todasLasPiezas: any[] = [];

    // Buscar en lotes de 30 (límite práctico para OR conditions en Supabase)
    for (let i = 0; i < refsArr.length; i += 30) {
      const lote = refsArr.slice(i, i + 30);
      const orConditions = lote
        .map((ref) => `referencia_normalizada.eq.${ref}`)
        .join(",");

      const { data: piezas, error: dbError } = await supabase
        .from("piezas_publicadas")
        .select("id, referencia, referencia_normalizada, marca, nombre, descripcion, tipo, precio, proveedor_id, proveedor_nombre")
        .or(orConditions)
        .order("precio", { ascending: true })
        .limit(50);

      if (dbError) {
        console.error("Error Supabase lote:", dbError);
        continue;
      }

      if (piezas && piezas.length > 0) {
        todasLasPiezas = todasLasPiezas.concat(piezas);
      }
    }

    // ── PASO 3b: Buscar también por referencia original (no normalizada) ──
    // Algunas piezas pueden no tener referencia_normalizada pero sí referencia
    if (todasLasPiezas.length < refsTecdoc.length) {
      const refsOriginales = refsTecdoc
        .map((r: any) => r.referencia || r.refprove || "")
        .filter((r: string) => r.length >= 4)
        .slice(0, 20); // limitar

      for (let i = 0; i < refsOriginales.length; i += 10) {
        const lote = refsOriginales.slice(i, i + 10);
        const orConditions = lote
          .map((ref: string) => {
            const escaped = ref.replace(/'/g, "''");
            return `referencia.ilike.%${escaped}%`;
          })
          .join(",");

        const { data: piezas } = await supabase
          .from("piezas_publicadas")
          .select("id, referencia, referencia_normalizada, marca, nombre, descripcion, tipo, precio, proveedor_id, proveedor_nombre")
          .or(orConditions)
          .order("precio", { ascending: true })
          .limit(30);

        if (piezas && piezas.length > 0) {
          // Evitar duplicados
          const idsExistentes = new Set(todasLasPiezas.map((p: any) => p.id));
          for (const p of piezas) {
            if (!idsExistentes.has(p.id)) {
              todasLasPiezas.push(p);
              idsExistentes.add(p.id);
            }
          }
        }
      }
    }

    console.log(`[Piezas] Piezas en stock encontradas: ${todasLasPiezas.length}`);

    // ── PASO 4: Construir artículos combinando TecDoc + Stock ──
    const articulos: any[] = [];

    for (const ref of refsTecdoc) {
      const refNorm = normalizarRef(ref.referencia || ref.refprove || "");
      const refPropiaNorm = normalizarRef(ref.refpropia || "");

      // Buscar piezas en stock que coincidan con esta referencia
      const stockCoincidente = todasLasPiezas.filter((p: any) => {
        const pRefNorm = normalizarRef(p.referencia_normalizada || p.referencia || "");
        return pRefNorm === refNorm || pRefNorm === refPropiaNorm ||
          (ref.referencia && normalizarRef(p.referencia || "").includes(normalizarRef(ref.referencia)));
      });

      const caracteristicas = (ref.caracteristicasList || [])
        .map((c: any) => `${c.txt}: ${c.value}${c.unit ? " " + c.unit : ""}`)
        .join(" | ");

      const articulo: any = {
        referencia: ref.referencia || ref.refprove || "",
        referencia_propia: ref.refpropia || "",
        marca: ref.nombreDlnr || "",
        nombre: ref.nombre || ref.txtrefpropia || "",
        descripcion: caracteristicas,
        imagen: ref.grafico || "",
        imagen_logo: ref.graficoLogo || "",
        pvp: parseFloat(ref.pvp) || null,
        pvp_neto: ref.pvpNeto || null,
        descuento: ref.dto1 || "",
        ean: ref.ref_ean || "",
        stock_ipda: {
          cantidad: ref.stockCantidad || 0,
          color: ref.stockColor || "",
          texto: ref.stockTexto || "",
        },
        en_stock_marketplace: stockCoincidente.length > 0,
        stock_marketplace: stockCoincidente.map((s: any) => ({
          id: s.id,
          referencia: s.referencia,
          marca: s.marca,
          nombre: s.descripcion || s.nombre || "",
          tipo: s.tipo || "IAM",
          precio: s.precio,
          proveedor_id: s.proveedor_id,
          proveedor_nombre: s.proveedor_nombre || "",
        })),
        precio_marketplace_desde: stockCoincidente.length > 0
          ? Math.min(...stockCoincidente.map((s: any) => s.precio).filter(Boolean))
          : null,
      };

      articulos.push(articulo);
    }

    // Ordenar: primero los que tienen stock en marketplace, luego por precio
    articulos.sort((a, b) => {
      if (a.en_stock_marketplace && !b.en_stock_marketplace) return -1;
      if (!a.en_stock_marketplace && b.en_stock_marketplace) return 1;
      const precioA = a.precio_marketplace_desde || a.pvp_neto || 999999;
      const precioB = b.precio_marketplace_desde || b.pvp_neto || 999999;
      return precioA - precioB;
    });

    return NextResponse.json({
      vehicleId,
      nodoId,
      nombre,
      total_tecdoc: refsTecdoc.length,
      total_en_stock: articulos.filter((a: any) => a.en_stock_marketplace).length,
      articulos,
      fuente: "ipda_tecdoc_stock",
    });
  } catch (err) {
    console.error("Error piezas IPDA:", err);
    return NextResponse.json(
      { error: "Error al buscar piezas" },
      { status: 500 }
    );
  }
}
