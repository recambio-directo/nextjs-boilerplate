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

// ── Comparación de marcas tolerante a cómo las escriben los proveedores ──
// Ejemplos reales: "BOS-BOSCH", "CEV-CEVAM", "MAN-MANN", "PUR-PURFL", "MON-MONRO",
// "TRW-", "FAR-FARE CAUCHO", "TYC ESPEJOS", "UNIADVANCE (NEW)", "KAY-KAYABA AMORTIGUADORES"

// Palabras genéricas que no identifican una marca
const PALABRAS_GENERICAS = new Set([
  "FILTER", "FILTERS", "FILTRO", "FILTROS", "PARTS", "AUTO", "AUTOMOTIVE", "FRENOS", "CAUCHO",
  "ESPEJOS", "ILUMINACION", "INDUSTRIAL", "SERVICIO", "HERRAMIENTA", "HERRAMIENTAS", "ESPANA",
  "ESPAA", "ROTULAS", "BIELETAS", "AMORTIGUADORES", "GROUP", "GMBH", "NEW", "REMAND", "ORIGINAL",
  "OEM", "THE", "AND", "RECAMBIOS", "TURBO", "ELECTRO", "SPAIN", "IBERICA", "SA", "SL", "SPA", "CO",
]);

// Alias conocidos (clave normalizada → marca canónica normalizada)
const ALIAS_MARCAS: Record<string, string> = {
  KAYABA: "KYB",
  CONTITECH: "CONTINENTAL",
  SWAGFEBI: "SWAG",
  REINZ: "VICTORREINZ",
  MEATDORIA: "MEAT",
};

function soloAlfanum(s: string): string {
  return (s || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
}

// Genera las "claves" que identifican una marca escrita de cualquier forma
function clavesMarca(marca: string): string[] {
  const limpia = (marca || "")
    .toUpperCase()
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/\(.*?\)/g, " ")          // "(NEW)", "(REMAND)"
    .replace(/&/g, " ");
  const claves = new Set<string>();
  const add = (k: string, minLen: number) => {
    const n = soloAlfanum(k);
    if (n.length < minLen || PALABRAS_GENERICAS.has(n)) return;
    claves.add(ALIAS_MARCAS[n] || n);
  };

  // Si la marca entera es un alias conocido, manda el alias
  const entera = soloAlfanum(limpia);
  if (ALIAS_MARCAS[entera]) return [ALIAS_MARCAS[entera]];

  add(limpia, 2); // la marca entera

  // "BOS-BOSCH": código + nombre
  let partes = limpia.split("-").map((p) => p.trim()).filter(Boolean);
  if (partes.length >= 2) {
    const cod = soloAlfanum(partes[0]);
    const resto = soloAlfanum(partes[1].split(/\s+/)[0] || "");
    // Si el nombre empieza por el código (BOS-BOSCH, MAN-MANN, PUR-PURFL), el código sobra
    if (cod.length <= 4 && resto.startsWith(cod)) partes = partes.slice(1);
  }
  for (const parte of partes) {
    add(parte, 2);
    for (const palabra of parte.split(/\s+/)) add(palabra, 3);
  }
  return Array.from(claves);
}

// ¿Son la misma marca?
function mismaMarca(a: string, b: string): boolean {
  const ka = clavesMarca(a);
  const kb = clavesMarca(b);
  if (ka.length === 0 || kb.length === 0) return false;
  for (const x of ka) {
    for (const y of kb) {
      if (x === y) return true;
      // Nombres cortados por el proveedor: "PURFL"/"PURFLUX", "MONRO"/"MONROE"
      const [corta, larga] = x.length <= y.length ? [x, y] : [y, x];
      if (corta.length >= 5 && larga.startsWith(corta)) return true;
    }
  }
  return false;
}

// ── Fabricantes de vehículo ──
// En cruces_referencias la columna "OEM" mezcla números de fabricante de coche con números
// de otras marcas aftermarket (CIFAM, METELLI, NK, MINTEX...). Esos últimos se repiten entre
// productos distintos (un disco y un termostato con el mismo "800574"), así que las
// equivalencias SOLO cruzan por números de fabricante de vehículo, dentro del mismo grupo.
const GRUPOS_FABRICANTE: Record<string, string> = {
  VAG: "VAG", VW: "VAG", VOLKSWAGEN: "VAG", AUDI: "VAG", SEAT: "VAG", SKODA: "VAG", CUPRA: "VAG", PORSCHE: "PORSCHE",
  PSA: "PSA", PEUGEOT: "PSA", CITROEN: "PSA", DS: "PSA", STELLANTIS: "PSA",
  RENAULT: "RENAULT", DACIA: "RENAULT", ALPINE: "RENAULT",
  GM: "GM", OPEL: "GM", VAUXHALL: "GM", CHEVROLET: "GM", DAEWOO: "GM", CADILLAC: "GM", SAAB: "SAAB",
  FORD: "FORD",
  FIAT: "FIAT", ALFAROMEO: "FIAT", ALFA: "FIAT", LANCIA: "FIAT", ABARTH: "FIAT",
  BMW: "BMW", MINI: "BMW",
  MERCEDES: "MERCEDES", MERCEDESBENZ: "MERCEDES", SMART: "MERCEDES",
  LANDROVER: "ROVER", ROVER: "ROVER", MG: "ROVER", JAGUAR: "JAGUAR",
  TOYOTA: "TOYOTA", LEXUS: "TOYOTA", DAIHATSU: "TOYOTA",
  NISSAN: "NISSAN", INFINITI: "NISSAN",
  HONDA: "HONDA", MAZDA: "MAZDA", MITSUBISHI: "MITSUBISHI", SUBARU: "SUBARU", SUZUKI: "SUZUKI", ISUZU: "ISUZU",
  HYUNDAI: "HYUNDAI", KIA: "HYUNDAI", SSANGYONG: "SSANGYONG", KGMOBILITY: "SSANGYONG",
  VOLVO: "VOLVO", CHRYSLER: "CHRYSLER", JEEP: "CHRYSLER", DODGE: "CHRYSLER",
  TESLA: "TESLA", LADA: "LADA", TATA: "TATA", IVECO: "IVECO", MAN: "MAN", DAF: "DAF", SCANIA: "SCANIA",
};

// Devuelve el grupo de fabricante de vehículo de una marca, o null si es una marca de recambio
function grupoFabricante(marca: string): string | null {
  const entera = soloAlfanum(marca);
  if (GRUPOS_FABRICANTE[entera]) return GRUPOS_FABRICANTE[entera];
  for (const k of clavesMarca(marca)) {
    if (GRUPOS_FABRICANTE[k]) return GRUPOS_FABRICANTE[k];
  }
  return null;
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
  "id, referencia, referencia_normalizada, marca, nombre, descripcion, tipo, precio, proveedor_id, proveedor_nombre, almacen_id, provincia, stock";

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

    // Quitar artículos TecDoc duplicados (IPDA a veces devuelve la misma marca+referencia varias veces)
    {
      const vistosTecdoc = new Set<string>();
      refsTecdoc = refsTecdoc.filter((ref: any) => {
        const k = `${soloAlfanum(ref.nombreDlnr || "")}|${normalizarRef(ref.referencia || ref.refprove || "")}`;
        if (vistosTecdoc.has(k)) return false;
        vistosTecdoc.add(k);
        return true;
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
    const oemPorArticulo: Map<number, Map<string, { marca: string; referencia: string; grupo: string }>> = new Map();
    claves.forEach((c, idx) => {
      const mapa = new Map<string, { marca: string; referencia: string; grupo: string }>();
      for (const f of filasIamOem) {
        if (f.referencia_iam_norm !== c.refPrincipal) continue;
        if (!mismaMarca(f.marca_iam, c.marca)) continue; // el "3519" de otra marca no vale
        const grupo = grupoFabricante(f.marca_oem || "");
        if (!grupo) continue; // solo números de fabricante de vehículo (no CIFAM, METELLI, NK...)
        const oemNorm = normalizarRef(f.referencia_oem_norm || f.referencia_oem || "");
        if (oemNorm.length < MIN_LONGITUD_OEM) continue;
        mapa.set(`${oemNorm}|${grupo}`, { marca: f.marca_oem || "", referencia: f.referencia_oem || oemNorm, grupo });
      }
      oemPorArticulo.set(idx, mapa);
    });

    const todosOem = Array.from(new Set<string>(
      Array.from(oemPorArticulo.values()).flatMap((m) => Array.from(m.keys()).map((k) => k.split("|")[0]))
    ));

    // 3b) OEM → otras marcas IAM equivalentes
    const filasOemIam = await enBloques<string, any>(todosOem, 10, 6, async (lote) => {
      const { data, error } = await supabase
        .from("cruces_referencias")
        .select("marca_iam, referencia_iam, referencia_iam_norm, marca_oem, referencia_oem_norm")
        .in("referencia_oem_norm", lote)
        .limit(1000);
      if (error) { console.error("[Piezas] Error cruces OEM→IAM:", error.message); return []; }
      return data || [];
    });

    // Equivalentes IAM por OEM
    const iamPorOem = new Map<string, { marca: string; refNorm: string; referencia: string }[]>();
    const refsEquivIamSet = new Set<string>();
    for (const f of filasOemIam) {
      const oem = normalizarRef(f.referencia_oem_norm || "");
      const refNorm = normalizarRef(f.referencia_iam_norm || f.referencia_iam || "");
      const grupo = grupoFabricante(f.marca_oem || "");
      if (!oem || !grupo || refNorm.length < 2) continue;
      const clave = `${oem}|${grupo}`;
      if (!iamPorOem.has(clave)) iamPorOem.set(clave, []);
      iamPorOem.get(clave)!.push({ marca: f.marca_iam || "", refNorm, referencia: f.referencia_iam || refNorm });
      refsEquivIamSet.add(refNorm);
    }

    const refsEquivIam = Array.from(refsEquivIamSet);

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
    // Si la marca no cuadra pero la referencia es larga e idéntica (p.ej. correas "6PK1180"),
    // se muestra como equivalente "misma referencia", no como la pieza exacta.
    const exactasPorArticulo = new Map<number, any[]>();
    const mismaRefOtraMarca = new Map<number, any[]>();
    const idsExactos = new Set<string>();
    claves.forEach((c, idx) => {
      const lista: any[] = [];
      const otras: any[] = [];
      const vistos = new Set<string>();
      for (const r of c.refs) {
        for (const p of piezasPorRef.get(r) || []) {
          if (vistos.has(p.id)) continue;
          if (mismaMarca(p.marca, c.marca)) {
            vistos.add(p.id);
            lista.push(p);
            idsExactos.add(p.id);
          } else if (r.length >= MIN_LONGITUD_SIN_MARCA) {
            vistos.add(p.id);
            otras.push(p);
          }
        }
      }
      exactasPorArticulo.set(idx, lista);
      mismaRefOtraMarca.set(idx, otras);
    });

    // ── PASO 6: Equivalencias en stock (OEM y otras marcas IAM) ──
    const equivPorArticulo = new Map<number, { pieza: any; via: string }[]>();
    claves.forEach((c, idx) => {
      const lista: { pieza: any; via: string }[] = [];
      const vistos = new Set<string>();
      for (const p of mismaRefOtraMarca.get(idx) || []) {
        if (idsExactos.has(p.id) || vistos.has(p.id)) continue;
        vistos.add(p.id);
        lista.push({ pieza: p, via: `misma referencia (${p.marca || "marca sin indicar"})` });
      }
      const oems = oemPorArticulo.get(idx) || new Map<string, { marca: string; referencia: string; grupo: string }>();

      for (const [claveOem, oemInfo] of Array.from(oems.entries())) {
        const oemNorm = claveOem.split("|")[0];
        const via = `OEM ${oemInfo.marca ? oemInfo.marca + " " : ""}${oemInfo.referencia}`.trim();

        // Piezas publicadas con ese número de fabricante (p.ej. ARVIGO NAD100580).
        // Número corto: la marca publicada debe ser del mismo fabricante.
        for (const p of piezasPorRef.get(oemNorm) || []) {
          if (idsExactos.has(p.id) || vistos.has(p.id)) continue;
          if (oemNorm.length < MIN_LONGITUD_SIN_MARCA && grupoFabricante(p.marca) !== oemInfo.grupo) continue;
          vistos.add(p.id);
          lista.push({ pieza: p, via });
        }

        // Otras marcas IAM que cruzan con ese OEM (referencia + marca)
        for (const eq of iamPorOem.get(claveOem) || []) {
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
      almacen_id: s.almacen_id || null,
      provincia: s.provincia || "",
      stock: s.stock ?? null,
      equivalente,
      equivalente_via: via,
    });

    const articulos: any[] = refsTecdoc.map((ref: any, idx: number) => {
      const exactas = (exactasPorArticulo.get(idx) || []).sort((a, b) => (a.precio ?? 999999) - (b.precio ?? 999999));
      const equivs = (equivPorArticulo.get(idx) || []).sort((a, b) => (a.pieza.precio ?? 999999) - (b.pieza.precio ?? 999999));

      const caracteristicas = (ref.caracteristicasList || [])
        .map((c: any) => `${c.txt}: ${c.value}${c.unit ? " " + c.unit : ""}`)
        .join(" | ");

      // Quitar ofertas repetidas: mismo proveedor, MISMA delegación (almacén), referencia y precio.
      // Delegaciones distintas del mismo proveedor (p.ej. las tiendas de Elektra) se mantienen.
      const ofertasVistas = new Set<string>();
      const stockMarketplace = [
        ...exactas.map((s) => mapearPieza(s, false)),
        ...equivs.map((e) => mapearPieza(e.pieza, true, e.via)),
      ].filter((s) => {
        const k = `${s.proveedor_id}|${s.almacen_id || "-"}|${normalizarRef(s.referencia || "")}|${s.precio}`;
        if (ofertasVistas.has(k)) return false;
        ofertasVistas.add(k);
        return true;
      });
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
