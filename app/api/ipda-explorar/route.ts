// app/api/ipda-explorar/route.ts
// Ruta temporal para descubrir qué endpoints de cruces tiene IPDA
// BORRAR DESPUÉS DE PROBAR

import { NextRequest, NextResponse } from "next/server";
import { getIpdaToken } from "../../lib/ipda";

const IPDA_BASE = "https://rgranvia-backend.isicondal.com/public/api/v1";

async function probarEndpoint(token: string, endpoint: string, body: Record<string, any>) {
  try {
    const res = await fetch(`${IPDA_BASE}${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "App-Token": token },
      body: JSON.stringify(body),
    });
    const text = await res.text();
    let json: any = null;
    try { json = JSON.parse(text); } catch {}
    return {
      endpoint,
      status: res.status,
      ok: res.ok,
      success: json?.success ?? null,
      dataKeys: json?.data ? (Array.isArray(json.data) ? `array[${json.data.length}]` : Object.keys(json.data)) : null,
      preview: (json ? JSON.stringify(json) : text).slice(0, 800),
    };
  } catch (e: any) {
    return { endpoint, error: e.message };
  }
}

export async function GET(req: NextRequest) {
  const ref = req.nextUrl.searchParams.get("ref") || "04465-33450"; // OEM Toyota de prueba

  try {
    const token = await getIpdaToken();

    // Probar todos los endpoints típicos de TecDoc/IPDA para cruces
    const resultados = await Promise.all([
      // Búsqueda de artículo por número OEM
      probarEndpoint(token, "/article/search", { articleNo: ref, language: 8 }),
      probarEndpoint(token, "/article/search", { oem: ref, language: 8 }),
      probarEndpoint(token, "/article/search", { query: ref, language: 8 }),
      probarEndpoint(token, "/article/search", { searchText: ref, area: 1, language: 8 }),

      // Búsqueda OEM directa
      probarEndpoint(token, "/oem/search", { oemNo: ref, language: 8 }),
      probarEndpoint(token, "/oem/search", { articleNo: ref, language: 8 }),
      probarEndpoint(token, "/oem/list", { oemNo: ref, language: 8 }),

      // Cross-references / equivalencias
      probarEndpoint(token, "/reference/search", { reference: ref, language: 8, area: 1 }),
      probarEndpoint(token, "/reference/search", { articleNo: ref, language: 8, area: 1 }),
      probarEndpoint(token, "/reference/oem", { oem: ref, language: 8 }),
      probarEndpoint(token, "/reference/cross", { reference: ref, language: 8 }),
      probarEndpoint(token, "/reference/equivalences", { reference: ref, language: 8 }),

      // Artículo completo
      probarEndpoint(token, "/article/details", { articleNo: ref, language: 8 }),
      probarEndpoint(token, "/article/info", { articleNo: ref, language: 8 }),

      // Search genérico
      probarEndpoint(token, "/search/article", { query: ref, language: 8, area: 1 }),
      probarEndpoint(token, "/search/reference", { query: ref, language: 8, area: 1 }),
      probarEndpoint(token, "/search/oem", { query: ref, language: 8, area: 1 }),

      // Otros endpoints comunes
      probarEndpoint(token, "/catalog/search", { query: ref, language: 8 }),
      probarEndpoint(token, "/product/search", { reference: ref }),
      probarEndpoint(token, "/article/oem-cross", { oemNo: ref, language: 8 }),
    ]);

    // Separar los que devolvieron algo útil de los que dieron error/404
    const exitosos = resultados.filter(r => r.ok || (r.status && r.status < 404));
    const fallidos = resultados.filter(r => !r.ok && (!r.status || r.status >= 404));

    return NextResponse.json({
      referencia_probada: ref,
      token_ok: true,
      exitosos,
      fallidos_resumen: fallidos.map(f => `${f.endpoint} → ${f.status || f.error}`),
    }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
