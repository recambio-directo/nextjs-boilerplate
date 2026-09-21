import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { obtenerReferencias, obtenerReferenciasPorNodo, obtenerCategorias } from "../../../lib/ipda";

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
      console.log(`[Piezas] Búsqueda directa con genericoId=${genericoId}: ${refsTecdoc.length} refs`);
    }

    // Si no hay genericoId O la búsqueda directa dio 0 resultados, buscar genéricos del nodo
    if (refsTecdoc.length === 0) {
      console.log(`[Piezas] Sin resultados directos, buscando genéricos del nodo ${nodoId}...`);
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

        if (nodo) {
          // Recoger genéricos: del propio nodo Y de sus hijos directos (records)
          let allGenerics: any[] = [];

          // Genéricos del nodo encontrado
          if (Array.isArray(nodo.generics) && nodo.generics.length > 0) {
            allGenerics = allGenerics.concat(nodo.generics);
          }

          // Si no tiene genéricos propios, buscar en sus hijos (records)
          if (allGenerics.length === 0 && Array.isArray(nodo.records)) {
            for (const child of nodo.records) {
              if (Array.isArray(child.generics)) {
                allGenerics = allGenerics.concat(child.generics);
              }
            }
          }

          // Si aún no tiene genéricos, buscar en hijos de hijos (2 niveles)
          if (allGenerics.length === 0 && Array.isArray(nodo.records)) {
            for (const child of nodo.records) {
              if (Array.isArray(child.records)) {
                for (const grandchild of child.records) {
                  if (Array.isArray(grandchild.generics)) {
                    allGenerics = allGenerics.concat(grandchild.generics);
                  }
                }
              }
            }
          }

          if (allGenerics.length > 0) {
            // Buscar piezas para cada genérico (máximo 10 para cubrir más)
            const genericIds = [...new Set(allGenerics.slice(0, 10).map((g: any) => String(g.id)))];
            console.log(`[Piezas] Encontrados ${allGenerics.length} genéricos, buscando: ${genericIds.join(", ")}`);
            const resultados = await Promise.all(
              genericIds.map((gId: string) =>
                obtenerReferencias(vehicleId, nodoId, gId).catch((err) => {
                  console.error(`[Piezas] Error buscando genérico ${gId}:`, err.message);
                  return { refs: [] };
                })
              )
            );
            for (const r of resultados) {
              if (r?.refs) refsTecdoc = refsTecdoc.concat(r.refs);
            }
            console.log(`[Piezas] Total refs de genéricos del árbol: ${refsTecdoc.length}`);
          } else {
            console.log(`[Piezas] Nodo ${nodoId} encontrado pero sin genéricos en árbol`);

            // Último intento: probar con el nodoId como genericoId
            // En TecDoc algunos nodos hoja funcionan como su propio genérico
            try {
              console.log(`[Piezas] Intentando con nodoId como genericoId...`);
              const ipdaData = await obtenerReferencias(vehicleId, nodoId, nodoId);
              if (ipdaData?.refs && ipdaData.refs.length > 0) {
                refsTecdoc = ipdaData.refs;
                console.log(`[Piezas] nodoId como genericoId funcionó: ${refsTecdoc.length} refs`);
              }
            } catch (e: any) {
              console.log(`[Piezas] nodoId como genericoId no funcionó: ${e.message}`);
            }
          }
        } else {
          console.log(`[Piezas] Nodo ${nodoId} NO encontrado en el árbol`);

          // Si no encontramos el nodo, intentar búsqueda directa con nodoId como genérico
          try {
            const ipdaData = await obtenerReferencias(vehicleId, nodoId, nodoId);
            if (ipdaData?.refs && ipdaData.refs.length > 0) {
              refsTecdoc = ipdaData.refs;
              console.log(`[Piezas] Fallback nodoId=${nodoId} como genericoId: ${refsTecdoc.length} refs`);
            }
          } catch (e: any) {
            console.log(`[Piezas] Fallback nodoId como genericoId falló: ${e.message}`);
          }
        }
      } catch (catErr: any) {
        console.error(`[Piezas] Error obteniendo árbol de categorías:`, catErr.message);
      }
    }

    console.log(`[Piezas] TecDoc refs total (loadGeneric): ${refsTecdoc.length}`);

    // ── FALLBACK: tipoBusqueda "load" para nodos sin genéricos ──
    // Muchos nodos hoja (Filtro combustible, Sonda Lambda, Motor de arranque, etc.)
    // no tienen genéricos en el árbol pero sí devuelven datos con "load"
    if (refsTecdoc.length === 0) {
      try {
        console.log(`[Piezas] Intentando tipoBusqueda "load" para nodo ${nodoId}...`);
        const loadData = await obtenerReferenciasPorNodo(vehicleId, nodoId);
        if (loadData?.refs && loadData.refs.length > 0) {
          refsTecdoc = loadData.refs;
          console.log(`[Piezas] ✅ tipoBusqueda "load" devolvió ${refsTecdoc.length} refs para nodo ${nodoId}`);
        } else {
          console.log(`[Piezas] tipoBusqueda "load" también devolvió 0 refs`);
        }
      } catch (loadErr: any) {
        console.error(`[Piezas] Error con tipoBusqueda "load":`, loadErr.message);
      }
    }

    console.log(`[Piezas] TecDoc refs final: ${refsTecdoc.length}`);

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
