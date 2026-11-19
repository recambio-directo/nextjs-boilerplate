import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { obtenerReferencias, obtenerReferenciasPorNodo, obtenerCategorias } from "../../../lib/ipda";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Normaliza una referencia para comparar: quita espacios, guiones, puntos, barras y pasa a mayúsculas
// (misma normalización que referencia_normalizada en piezas_publicadas)
function normalizarRef(ref: string): string {
  return (ref || "").toUpperCase().replace(/[\s\-_./]/g, "");
}

// Normaliza una marca: solo letras y números en mayúsculas ("Febi Bilstein" → "FEBIBILSTEIN")
function normalizarMarca(marca: string): string {
  return (marca || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
}

// ¿Son la misma marca? Igual, o una contiene a la otra (p.ej. "CEVAM" / "CEVAMSA").
// Si alguna viene vacía o es demasiado corta, NO se considera coincidencia.
function mismaMarca(a: string, b: string): boolean {
  const x = normalizarMarca(a);
  const y = normalizarMarca(b);
  if (x.length < 2 || y.length < 2) return false;
  if (x === y) return true;
  if (x.length >= 3 && y.length >= 3) return x.includes(y) || y.includes(x);
  return false;
}

// Referencias a partir de esta longitud se aceptan con coincidencia exacta aunque
// la marca esté escrita distinto o vacía (es muy raro que dos fabricantes compartan
// un número tan largo). Por debajo se exige también la marca (caso "3519").
const MIN_LONGITUD_SIN_MARCA = 7;

// ¿Vale esta pieza publicada para la referencia/marca buscada?
function coincidePieza(refNorm: string, marcaPieza: string, marcaBuscada: string): boolean {
  if (refNorm.length >= MIN_LONGITUD_SIN_MARCA) return true;
  return mismaMarca(marcaPieza, marcaBuscada);
}

// Las referencias OEM equivalentes solo se usan si son suficientemente largas
// (evita que números cortos genéricos crucen con cualquier cosa)
const MIN_LONGITUD_OEM = 6;

const COLUMNAS_PIEZA =
  "id, referencia, referencia_normalizada, marca, nombre, descripcion, tipo, precio, proveedor_id, proveedor_nombre";

// Ejecuta tareas en paralelo por bloques para no saturar Supabase
async function enBloques<T, R>(items: T[], tam: number, paralelo: number, fn: (lote: T[]) => Promise<R[]>): Promise<R[]> {
  const lotes: T[][] = [];
  for (let i = 0; i < items.length; i += tam) lotes.push(items.slice(i, i + tam));
  let resultado: R[] = [];
  for (let i = 0; i < lotes.length; i += paralelo) {
    const partes = await Promise.all(lotes.slice(i, i + paralelo).map(fn));
    for (const p of partes) resultado = resultado.concat(p);
  }
  return resultado;
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

    // ── PASO 2: Datos clave de cada artículo TecDoc (referencia + marca) ──
    const claves = refsTecdoc.map((ref: any) => {
      const refsArticulo = [ref.referencia, ref.refprove, ref.refpropia]
        .filter(Boolean)
        .map((r: string) => normalizarRef(r))
        .filter((r: string) => r.length >= 2);
      return {
        refs: Array.from(new Set<string>(refsArticulo)),
        refPrincipal: normalizarRef(ref.referencia || ref.refprove || ""),
        marca: ref.nombreDlnr || "",
      };
    });

    const refsTecdocNorm = Array.from(new Set<string>(claves.flatMap((c) => c.refs)));

    // ── PASO 3: Equivalencias desde cruces_referencias ──
    // 3a) IAM del artículo → OEM (solo filas cuya marca IAM es la del artículo)
    const filasIamOem = await enBloques<string, any>(
      Array.from(new Set(claves.map((c) => c.refPrincipal).filter((r) => r.length >= 2))),
      40, 6,
      async (lote) => {
        const { data, error } = await supabase
          .from("cruces_referencias")
          .select("marca_iam, referencia_iam_norm, marca_oem, referencia_oem, referencia_oem_norm")
          .in("referencia_iam_norm", lote)
          .limit(1000);
        if (error) { console.error("[Piezas] Error cruces IAM→OEM:", error.message); return []; }
        return data || [];
      }
    );

    // OEM por artículo (índice = posición en refsTecdoc)
    const oemPorArticulo: Map<number, Map<string, { marca: string; referencia: string }>> = new Map();
    claves.forEach((c, idx) => {
      const mapa = new Map<string, { marca: string; referencia: string }>();
      for (const f of filasIamOem) {
        if (f.referencia_iam_norm !== c.refPrincipal) continue;
        if (!mismaMarca(f.marca_iam, c.marca)) continue; // el "3519" de otra marca no vale
        const oemNorm = normalizarRef(f.referencia_oem_norm || f.referencia_oem || "");
        if (oemNorm.length < MIN_LONGITUD_OEM) continue;
        mapa.set(oemNorm, { marca: f.marca_oem || "", referencia: f.referencia_oem || oemNorm });
      }
      oemPorArticulo.set(idx, mapa);
    });

    const todosOem = Array.from(new Set<string>(
      Array.from(oemPorArticulo.values()).flatMap((m) => Array.from(m.keys()))
    ));

    // 3b) OEM → otras marcas IAM equivalentes
    const filasOemIam = await enBloques<string, any>(todosOem, 10, 6, async (lote) => {
      const { data, error } = await supabase
        .from("cruces_referencias")
        .select("marca_iam, referencia_iam, referencia_iam_norm, referencia_oem_norm")
        .in("referencia_oem_norm", lote)
        .limit(1000);
      if (error) { console.error("[Piezas] Error cruces OEM→IAM:", error.message); return []; }
      return data || [];
    });

    // Equivalentes IAM por OEM
    const iamPorOem = new Map<string, { marca: string; refNorm: string; referencia: string }[]>();
    for (const f of filasOemIam) {
      const oem = normalizarRef(f.referencia_oem_norm || "");
      const refNorm = normalizarRef(f.referencia_iam_norm || f.referencia_iam || "");
      if (!oem || refNorm.length < 2) continue;
      if (!iamPorOem.has(oem)) iamPorOem.set(oem, []);
      iamPorOem.get(oem)!.push({ marca: f.marca_iam || "", refNorm, referencia: f.referencia_iam || refNorm });
    }

    const refsEquivIam = Array.from(new Set<string>(filasOemIam
      .map((f: any) => normalizarRef(f.referencia_iam_norm || f.referencia_iam || ""))
      .filter((r: string) => r.length >= 2)));

    console.log(`[Piezas] Equivalencias: ${todosOem.length} OEM, ${refsEquivIam.length} refs IAM`);

    // ── PASO 4: Buscar en piezas_publicadas SOLO por coincidencia exacta ──
    const refsABuscar = Array.from(new Set<string>([...refsTecdocNorm, ...todosOem, ...refsEquivIam]));

    const todasLasPiezas: any[] = await enBloques<string, any>(refsABuscar, 100, 6, async (lote) => {
      const { data, error } = await supabase
        .from("piezas_publicadas")
        .select(COLUMNAS_PIEZA)
        .in("referencia_normalizada", lote)
        .order("precio", { ascending: true })
        .limit(1000);
      if (error) { console.error("[Piezas] Error Supabase lote:", error.message); return []; }
      return data || [];
    });

    // Índice por referencia normalizada
    const piezasPorRef = new Map<string, any[]>();
    for (const p of todasLasPiezas) {
      const k = normalizarRef(p.referencia_normalizada || p.referencia || "");
      if (!piezasPorRef.has(k)) piezasPorRef.set(k, []);
      piezasPorRef.get(k)!.push(p);
    }

    console.log(`[Piezas] Piezas en stock encontradas (exactas + equivalencias): ${todasLasPiezas.length}`);

    // ── PASO 5: Coincidencias exactas (misma referencia + misma marca) ──
    const exactasPorArticulo = new Map<number, any[]>();
    const idsExactos = new Set<string>();
    claves.forEach((c, idx) => {
      const lista: any[] = [];
      const vistos = new Set<string>();
      for (const r of c.refs) {
        for (const p of piezasPorRef.get(r) || []) {
          if (vistos.has(p.id)) continue;
          if (!coincidePieza(r, p.marca, c.marca)) continue;
          vistos.add(p.id);
          lista.push(p);
          idsExactos.add(p.id);
        }
      }
      exactasPorArticulo.set(idx, lista);
    });

    // ── PASO 6: Equivalencias en stock (OEM y otras marcas IAM) ──
    const equivPorArticulo = new Map<number, { pieza: any; via: string }[]>();
    claves.forEach((c, idx) => {
      const lista: { pieza: any; via: string }[] = [];
      const vistos = new Set<string>();
      const oems = oemPorArticulo.get(idx) || new Map<string, { marca: string; referencia: string }>();

      for (const [oemNorm, oemInfo] of Array.from(oems.entries())) {
        const via = `OEM ${oemInfo.marca ? oemInfo.marca + " " : ""}${oemInfo.referencia}`.trim();

        // Piezas publicadas con esa referencia OEM (número largo y específico)
        for (const p of piezasPorRef.get(oemNorm) || []) {
          if (idsExactos.has(p.id) || vistos.has(p.id)) continue;
          vistos.add(p.id);
          lista.push({ pieza: p, via });
        }

        // Otras marcas IAM que cruzan con ese OEM (referencia + marca)
        for (const eq of iamPorOem.get(oemNorm) || []) {
          for (const p of piezasPorRef.get(eq.refNorm) || []) {
            if (idsExactos.has(p.id) || vistos.has(p.id)) continue;
            if (!coincidePieza(eq.refNorm, p.marca, eq.marca)) continue;
            vistos.add(p.id);
            lista.push({ pieza: p, via });
          }
        }
      }
      equivPorArticulo.set(idx, lista);
    });

    // ── PASO 7: Construir artículos ──
    const mapearPieza = (s: any, equivalente: boolean, via = "") => ({
      id: s.id,
      referencia: s.referencia,
      marca: s.marca,
      nombre: s.descripcion || s.nombre || "",
      tipo: s.tipo || "IAM",
      precio: s.precio,
      proveedor_id: s.proveedor_id,
      proveedor_nombre: s.proveedor_nombre || "",
      equivalente,
      equivalente_via: via,
    });

    const articulos: any[] = refsTecdoc.map((ref: any, idx: number) => {
      const exactas = (exactasPorArticulo.get(idx) || []).sort((a, b) => (a.precio ?? 999999) - (b.precio ?? 999999));
      const equivs = (equivPorArticulo.get(idx) || []).sort((a, b) => (a.pieza.precio ?? 999999) - (b.pieza.precio ?? 999999));

      const caracteristicas = (ref.caracteristicasList || [])
        .map((c: any) => `${c.txt}: ${c.value}${c.unit ? " " + c.unit : ""}`)
        .join(" | ");

      const stockMarketplace = [
        ...exactas.map((s) => mapearPieza(s, false)),
        ...equivs.map((e) => mapearPieza(e.pieza, true, e.via)),
      ];
      const precios = stockMarketplace.map((s) => s.precio).filter((p) => p != null);

      return {
        referencia: ref.referencia || ref.refprove || "",
        referencia_propia: ref.refpropia || "",
        marca: ref.nombreDlnr || "",
        nombre: ref.nombre || ref.txtrefpropia || "",
        descripcion: caracteristicas,
        imagen: ref.grafico ? `/api/tecdoc-img?img=${encodeURIComponent(ref.grafico)}` : "",
        imagen_logo: ref.graficoLogo ? `/api/tecdoc-img?img=${encodeURIComponent(ref.graficoLogo)}` : "",
        pvp: parseFloat(ref.pvp) || null,
        pvp_neto: ref.pvpNeto || null,
        descuento: ref.dto1 || "",
        ean: ref.ref_ean || "",
        stock_ipda: {
          cantidad: ref.stockCantidad || 0,
          color: ref.stockColor || "",
          texto: ref.stockTexto || "",
        },
        // "En stock" solo si está la pieza exacta (misma referencia y marca)
        en_stock_marketplace: exactas.length > 0,
        tiene_equivalentes: equivs.length > 0,
        stock_marketplace: stockMarketplace,
        precio_marketplace_desde: precios.length > 0 ? Math.min(...precios) : null,
      };
    });

    // Ordenar: primero con stock exacto, luego con equivalentes, luego el resto; dentro, por precio
    const rango = (a: any) => (a.en_stock_marketplace ? 0 : a.tiene_equivalentes ? 1 : 2);
    articulos.sort((a, b) => {
      const r = rango(a) - rango(b);
      if (r !== 0) return r;
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
      total_con_equivalentes: articulos.filter((a: any) => !a.en_stock_marketplace && a.tiene_equivalentes).length,
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
