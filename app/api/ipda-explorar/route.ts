// app/api/ipda-explorar/route.ts
// Ruta temporal para descubrir endpoints de cruces IPDA — BORRAR DESPUÉS
import { NextRequest, NextResponse } from "next/server";
import { getIpdaToken } from "../../lib/ipda";

const IPDA_BASE = "https://rgranvia-backend.isicondal.com/public/api/v1";

async function probar(token: string, method: string, endpoint: string, body?: Record<string, any>) {
  try {
    const opts: RequestInit = {
      method,
      headers: { "Content-Type": "application/json", "App-Token": token },
    };
    if (method === "POST" && body) opts.body = JSON.stringify(body);
    const url = method === "GET" && body
      ? `${IPDA_BASE}${endpoint}?${new URLSearchParams(body as any).toString()}`
      : `${IPDA_BASE}${endpoint}`;
    const res = await fetch(url, opts);
    const text = await res.text();
    let json: any = null;
    try { json = JSON.parse(text); } catch {}
    return {
      method,
      endpoint,
      status: res.status,
      ok: res.ok,
      success: json?.success ?? null,
      preview: (json ? JSON.stringify(json) : text).slice(0, 1000),
    };
  } catch (e: any) {
    return { method, endpoint, error: e.message };
  }
}

export async function GET(req: NextRequest) {
  const ref = req.nextUrl.searchParams.get("ref") || "04465-33450";

  try {
    const token = await getIpdaToken();

    const resultados = await Promise.all([
      // ── GET endpoints (query params) ──
      probar(token, "GET", `/article/search`, { articleNo: ref, language: "8" }),
      probar(token, "GET", `/article/search`, { oem: ref, language: "8" }),
      probar(token, "GET", `/article/search`, { query: ref }),
      probar(token, "GET", `/oem/search`, { oemNo: ref }),
      probar(token, "GET", `/oem/list`, { oemNo: ref }),
      probar(token, "GET", `/reference/search`, { reference: ref }),
      probar(token, "GET", `/reference/oem`, { oem: ref }),
      probar(token, "GET", `/reference/cross`, { reference: ref }),
      probar(token, "GET", `/search/article`, { query: ref }),
      probar(token, "GET", `/search/oem`, { query: ref }),
      probar(token, "GET", `/search/reference`, { query: ref }),

      // ── Endpoints ya conocidos con params de cruce ──
      // reference/list sin vehicleId pero con referencia
      probar(token, "POST", `/reference/list`, {
        area: "1",
        tipoBusqueda: "searchByOem",
        userId: 83647,
        almacen: "01",
        customer: 10811,
        company: 1,
        oem: ref,
        language: 8,
      }),
      probar(token, "POST", `/reference/list`, {
        area: "1",
        tipoBusqueda: "searchByArticle",
        userId: 83647,
        almacen: "01",
        customer: 10811,
        company: 1,
        articleNo: ref,
        language: 8,
      }),
      probar(token, "POST", `/reference/list`, {
        area: "1",
        tipoBusqueda: "loadOem",
        userId: 83647,
        almacen: "01",
        customer: 10811,
        company: 1,
        oem: ref,
        language: 8,
      }),

      // ── Isi Condal specific patterns ──
      probar(token, "POST", `/search/article`, { query: ref, language: 8, area: 1 }),
      probar(token, "POST", `/search/oem`, { query: ref, language: 8, area: 1 }),
      probar(token, "POST", `/search/oem`, { oem: ref, language: 8, area: 1 }),
      probar(token, "POST", `/search/reference`, { query: ref, language: 8, area: 1 }),
      probar(token, "POST", `/search/article`, { oem: ref, language: 8, area: 1, customer: 10811, company: 1, userId: 83647, almacen: "01" }),

      // ── Probar el endpoint raíz para listar rutas disponibles ──
      probar(token, "GET", `/`, {}),
      probar(token, "GET", `/routes`, {}),
      probar(token, "GET", `/help`, {}),
      probar(token, "GET", `/api`, {}),

      // ── Equivalences / cross-references ──
      probar(token, "POST", `/equivalences/search`, { reference: ref, language: 8 }),
      probar(token, "POST", `/cross/search`, { oem: ref, language: 8 }),
      probar(token, "POST", `/oem/equivalences`, { oem: ref, language: 8 }),
      probar(token, "POST", `/article/oem`, { articleNo: ref, language: 8 }),
      probar(token, "POST", `/article/equivalences`, { articleNo: ref, language: 8 }),
      probar(token, "GET", `/article/oem`, { articleNo: ref, language: "8" }),
      probar(token, "GET", `/equivalences`, { reference: ref }),
    ]);

    // Separar por status
    const exitosos = resultados.filter(r => r.status && r.status < 400);
    const _405 = resultados.filter(r => r.status === 405);
    const _404 = resultados.filter(r => r.status === 404);
    const otros = resultados.filter(r => r.status && r.status >= 400 && r.status !== 404 && r.status !== 405);
    const errores = resultados.filter(r => r.error);

    return NextResponse.json({
      referencia_probada: ref,
      token_ok: true,
      resumen: {
        exitosos: exitosos.length,
        "405_method_not_allowed": _405.length,
        "404_not_found": _404.length,
        otros_errores: otros.length + errores.length,
      },
      exitosos,
      otros_interesantes: otros,
      _404: _404.map(r => `${r.method} ${r.endpoint}`),
      _405: _405.map(r => `${r.method} ${r.endpoint}`),
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
