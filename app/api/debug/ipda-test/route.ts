import { NextRequest, NextResponse } from "next/server";

// ═══════════════════════════════════════════════════════════════════
// DIAGNÓSTICO IPDA — Prueba múltiples estrategias para obtener
// referencias de nodos que NO tienen genéricos en el árbol
// ═══════════════════════════════════════════════════════════════════

const IPDA_BASE = "https://rgranvia-backend.isicondal.com/public/api/v1";
const IPDA_USER = process.env.IPDA_USER!;
const IPDA_PASS = process.env.IPDA_PASS!;
const IPDA_CK = process.env.IPDA_CK || "3950753949";
const IPDA_CUSTOMER = parseInt(process.env.IPDA_CUSTOMER || "10811", 10);

let cachedToken: string | null = null;
let tokenExpiry: number = 0;

async function getToken(): Promise<string> {
  if (cachedToken && Date.now() < tokenExpiry - 300_000) return cachedToken;
  const res = await fetch(`${IPDA_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ usr: IPDA_USER, pss: IPDA_PASS, force: 1, ck: IPDA_CK, language: "es", userType: "standard" }),
  });
  const json = await res.json();
  if (!res.ok || !json.success) throw new Error(`Login failed: ${JSON.stringify(json).slice(0, 300)}`);
  cachedToken = json.data.token;
  try {
    const payload = JSON.parse(Buffer.from(json.data.token.split(".")[1], "base64").toString());
    tokenExpiry = (payload.exp || 0) * 1000;
  } catch { tokenExpiry = Date.now() + 12 * 3600_000; }
  return cachedToken!;
}

async function post(endpoint: string, body: Record<string, any>): Promise<any> {
  const token = await getToken();
  const res = await fetch(`${IPDA_BASE}${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "App-Token": token },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text.slice(0, 500), status: res.status };
  }
}

// GET /api/debug/ipda-test?vehicleId=135598&nodoId=100261
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  // Auth temporal para diagnóstico — ELIMINAR después del test
  const secret = searchParams.get("key");
  if (secret !== "diag2026tmp") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const vehicleId = searchParams.get("vehicleId") || "135598";
  const nodoId = searchParams.get("nodoId") || "100261"; // Filtro combustible

  const results: Record<string, any> = { vehicleId, nodoId, tests: {} };

  // ── TEST 1: loadGeneric con genericoId vacío ──
  try {
    const r = await post("/reference/list", {
      area: "1", tipoBusqueda: "loadGeneric",
      userId: 83647, almacen: "01", customer: IPDA_CUSTOMER, company: 1,
      genericoId: "", nodoId, vehicleId,
      dlnr: null, dlnrLista: null, groups: null, nodo: null, nodoLista: null, showAll: 0,
    });
    results.tests["1_loadGeneric_emptyGenerico"] = {
      success: r.success, refsCount: r.data?.refs?.length || 0,
      keys: r.data ? Object.keys(r.data) : null,
      sample: r.data?.refs?.slice(0, 2) || null,
      error: r.error || r.message || null,
    };
  } catch (e: any) { results.tests["1_loadGeneric_emptyGenerico"] = { error: e.message }; }

  // ── TEST 2: loadGeneric con genericoId null ──
  try {
    const r = await post("/reference/list", {
      area: "1", tipoBusqueda: "loadGeneric",
      userId: 83647, almacen: "01", customer: IPDA_CUSTOMER, company: 1,
      genericoId: null, nodoId, vehicleId,
      dlnr: null, dlnrLista: null, groups: null, nodo: null, nodoLista: null, showAll: 0,
    });
    results.tests["2_loadGeneric_nullGenerico"] = {
      success: r.success, refsCount: r.data?.refs?.length || 0,
      keys: r.data ? Object.keys(r.data) : null,
      sample: r.data?.refs?.slice(0, 2) || null,
      error: r.error || r.message || null,
    };
  } catch (e: any) { results.tests["2_loadGeneric_nullGenerico"] = { error: e.message }; }

  // ── TEST 3: loadGeneric con showAll: 1 ──
  try {
    const r = await post("/reference/list", {
      area: "1", tipoBusqueda: "loadGeneric",
      userId: 83647, almacen: "01", customer: IPDA_CUSTOMER, company: 1,
      genericoId: "", nodoId, vehicleId,
      dlnr: null, dlnrLista: null, groups: null, nodo: null, nodoLista: null, showAll: 1,
    });
    results.tests["3_loadGeneric_showAll1"] = {
      success: r.success, refsCount: r.data?.refs?.length || 0,
      keys: r.data ? Object.keys(r.data) : null,
      sample: r.data?.refs?.slice(0, 2) || null,
      error: r.error || r.message || null,
    };
  } catch (e: any) { results.tests["3_loadGeneric_showAll1"] = { error: e.message }; }

  // ── TEST 4: tipoBusqueda "loadByNodo" ──
  try {
    const r = await post("/reference/list", {
      area: "1", tipoBusqueda: "loadByNodo",
      userId: 83647, almacen: "01", customer: IPDA_CUSTOMER, company: 1,
      genericoId: null, nodoId, vehicleId,
      dlnr: null, dlnrLista: null, groups: null, nodo: nodoId, nodoLista: null, showAll: 0,
    });
    results.tests["4_loadByNodo"] = {
      success: r.success, refsCount: r.data?.refs?.length || 0,
      keys: r.data ? Object.keys(r.data) : null,
      sample: r.data?.refs?.slice(0, 2) || null,
      error: r.error || r.message || null,
    };
  } catch (e: any) { results.tests["4_loadByNodo"] = { error: e.message }; }

  // ── TEST 5: tipoBusqueda "load" ──
  try {
    const r = await post("/reference/list", {
      area: "1", tipoBusqueda: "load",
      userId: 83647, almacen: "01", customer: IPDA_CUSTOMER, company: 1,
      genericoId: null, nodoId, vehicleId,
      dlnr: null, dlnrLista: null, groups: null, nodo: nodoId, nodoLista: null, showAll: 0,
    });
    results.tests["5_load"] = {
      success: r.success, refsCount: r.data?.refs?.length || 0,
      keys: r.data ? Object.keys(r.data) : null,
      sample: r.data?.refs?.slice(0, 2) || null,
      error: r.error || r.message || null,
    };
  } catch (e: any) { results.tests["5_load"] = { error: e.message }; }

  // ── TEST 6: /assemblygroup/generics endpoint ──
  try {
    const r = await post("/assemblygroup/generics", {
      area: 1, vehicle: vehicleId, node: nodoId, language: 8,
    });
    results.tests["6_assemblygroup_generics"] = {
      success: r.success,
      data: r.data ? (Array.isArray(r.data) ? r.data.slice(0, 10) : r.data) : null,
      error: r.error || r.message || null,
    };
  } catch (e: any) { results.tests["6_assemblygroup_generics"] = { error: e.message }; }

  // ── TEST 7: /generic/list endpoint ──
  try {
    const r = await post("/generic/list", {
      area: 1, vehicleId, node: nodoId, language: 8,
    });
    results.tests["7_generic_list"] = {
      success: r.success,
      data: r.data ? (Array.isArray(r.data) ? r.data.slice(0, 10) : r.data) : null,
      error: r.error || r.message || null,
    };
  } catch (e: any) { results.tests["7_generic_list"] = { error: e.message }; }

  // ── TEST 8: /assemblygroup/tree con node específico ──
  try {
    const r = await post("/assemblygroup/tree", {
      area: 1, vehicle: vehicleId, node: nodoId, language: 8,
    });
    const tree = r.data?.tree || r.data;
    results.tests["8_tree_with_node"] = {
      success: r.success,
      dataType: Array.isArray(tree) ? "array" : typeof tree,
      length: Array.isArray(tree) ? tree.length : null,
      sample: Array.isArray(tree) ? tree.slice(0, 3) : (tree ? JSON.stringify(tree).slice(0, 500) : null),
      error: r.error || r.message || null,
    };
  } catch (e: any) { results.tests["8_tree_with_node"] = { error: e.message }; }

  // ── TEST 9: /reference/list con nodoLista=[nodoId] ──
  try {
    const r = await post("/reference/list", {
      area: "1", tipoBusqueda: "loadGeneric",
      userId: 83647, almacen: "01", customer: IPDA_CUSTOMER, company: 1,
      genericoId: null, nodoId: null, vehicleId,
      dlnr: null, dlnrLista: null, groups: null, nodo: null, nodoLista: [nodoId], showAll: 0,
    });
    results.tests["9_loadGeneric_nodoLista"] = {
      success: r.success, refsCount: r.data?.refs?.length || 0,
      keys: r.data ? Object.keys(r.data) : null,
      sample: r.data?.refs?.slice(0, 2) || null,
      error: r.error || r.message || null,
    };
  } catch (e: any) { results.tests["9_loadGeneric_nodoLista"] = { error: e.message }; }

  // ── TEST 10: /assemblygroup/tree padre (100260 = Filtros) para ver si tiene generics ──
  try {
    const r = await post("/assemblygroup/tree", {
      area: 1, vehicle: vehicleId, language: 8,
    });
    // Buscar nodo 100261 recursivamente y mostrar su estructura completa
    function findNodeFull(nodes: any[], id: string): any {
      for (const n of nodes) {
        if (String(n.node || n.id) === id) return n;
        const found = findNodeFull(n.records || n.children || [], id);
        if (found) return found;
      }
      return null;
    }
    const tree = r.data?.tree || r.data || [];
    const nodo = findNodeFull(Array.isArray(tree) ? tree : [], nodoId);
    results.tests["10_full_tree_node_structure"] = {
      nodeFound: !!nodo,
      nodeKeys: nodo ? Object.keys(nodo) : null,
      generics: nodo?.generics || null,
      genericsLength: nodo?.generics?.length || 0,
      records: nodo?.records?.length || 0,
      label: nodo?.label || nodo?.name || null,
      fullNode: nodo ? JSON.stringify(nodo).slice(0, 1000) : null,
    };

    // También buscar el padre (100260) para ver sus genéricos
    const padre = findNodeFull(Array.isArray(tree) ? tree : [], "100260");
    results.tests["10b_parent_node_structure"] = {
      nodeFound: !!padre,
      label: padre?.label || null,
      genericsLength: padre?.generics?.length || 0,
      generics: padre?.generics?.slice(0, 5) || null,
      childrenCount: padre?.records?.length || 0,
      childrenLabels: padre?.records?.map((c: any) => ({ label: c.label, node: c.node, genericsCount: c.generics?.length || 0 })) || null,
    };
  } catch (e: any) { results.tests["10_full_tree_node_structure"] = { error: e.message }; }

  // ── TEST 11: probar IDs genéricos comunes de TecDoc para "Filtro combustible" ──
  // En TecDoc, los IDs genéricos estándar son bien conocidos:
  // 8 = Filtro de aire, 22 = Filtro de combustible, 25 = Filtro de aceite
  const genericosFiltro = ["22", "180", "181", "182", "183", "184", "32", "33"];
  for (const gId of genericosFiltro) {
    try {
      const r = await post("/reference/list", {
        area: "1", tipoBusqueda: "loadGeneric",
        userId: 83647, almacen: "01", customer: IPDA_CUSTOMER, company: 1,
        genericoId: gId, nodoId, vehicleId,
        dlnr: null, dlnrLista: null, groups: null, nodo: null, nodoLista: null, showAll: 0,
      });
      const count = r.data?.refs?.length || 0;
      if (count > 0) {
        results.tests[`11_known_generic_${gId}`] = {
          success: true, refsCount: count,
          sample: r.data?.refs?.slice(0, 1).map((ref: any) => ({ ref: ref.referencia, nombre: ref.nombre, marca: ref.nombreDlnr })),
        };
      }
    } catch {}
  }

  // ── TEST 12: /reference/generics endpoint ──
  try {
    const r = await post("/reference/generics", {
      area: 1, vehicleId, node: nodoId, language: 8,
    });
    results.tests["12_reference_generics"] = {
      success: r.success,
      data: r.data ? (Array.isArray(r.data) ? r.data.slice(0, 10) : JSON.stringify(r.data).slice(0, 500)) : null,
      error: r.error || r.message || null,
    };
  } catch (e: any) { results.tests["12_reference_generics"] = { error: e.message }; }

  // ── TEST 13: GET en vez de POST para assemblygroup/generics ──
  try {
    const token = await getToken();
    const url = `${IPDA_BASE}/assemblygroup/generics?area=1&vehicle=${vehicleId}&node=${nodoId}&language=8`;
    const res = await fetch(url, { headers: { "App-Token": token } });
    const text = await res.text();
    try {
      const r = JSON.parse(text);
      results.tests["13_assemblygroup_generics_GET"] = {
        success: r.success,
        data: r.data ? (Array.isArray(r.data) ? r.data.slice(0, 10) : JSON.stringify(r.data).slice(0, 500)) : null,
      };
    } catch {
      results.tests["13_assemblygroup_generics_GET"] = { raw: text.slice(0, 300) };
    }
  } catch (e: any) { results.tests["13_assemblygroup_generics_GET"] = { error: e.message }; }

  return NextResponse.json(results, { status: 200 });
}
