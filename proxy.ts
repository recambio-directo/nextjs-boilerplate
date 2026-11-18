// proxy.ts
// Portero de toda la API (/api/*). Se ejecuta antes de cada ruta.
//  · Rutas públicas: pasan sin sesión.
//  · Llamadas internas y crons: pasan con CRON_SECRET.
//  · Todo lo demás: exige la sesión de Supabase del usuario (Authorization: Bearer <token>).
// Las rutas reciben el usuario verificado en la cabecera x-rd-user-id (nunca la que mande el navegador).
import { NextResponse, type NextRequest } from "next/server";

// Rutas que cualquiera puede llamar (tienen su propia protección o no exponen nada)
const PUBLICAS = [
  "/api/buscar-publico",
  "/api/stats-publico",
  "/api/tecdoc-img",               // se carga en <img>, no puede enviar sesión
  "/api/health",
  "/api/v1/",                      // API de stock: se protege con X-API-Key
  "/api/ftp/upload",               // ERP del proveedor: se protege con api_key
  "/api/enviar-email/send-registro", // alta nueva: se valida dentro de la ruta
];

// Rutas de pruebas que no deben existir en producción
const BLOQUEADAS = ["/api/debug", "/api/mrw/test"];

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://gharfhzqowuyxighnqbz.supabase.co";
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "sb_publishable_bh_LpFWtInmkCkZZVS2UIw_IImUDyb1";

// Pequeña caché para no preguntar a Supabase en cada llamada con el mismo token
const cache = new Map<string, { id: string; hasta: number }>();

async function usuarioDelToken(token: string): Promise<string | null> {
  const ahora = Date.now();
  const c = cache.get(token);
  if (c && c.hasta > ahora) return c.id;
  try {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!res.ok) return null;
    const u = await res.json();
    if (!u?.id) return null;
    if (cache.size > 500) cache.clear();
    cache.set(token, { id: u.id, hasta: ahora + 60_000 });
    return u.id;
  } catch {
    return null;
  }
}

function empiezaPor(path: string, lista: string[]) {
  return lista.some((p) => path === p || path.startsWith(p.endsWith("/") ? p : p + "/") || path.startsWith(p + "?"));
}

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;

  if (empiezaPor(path, BLOQUEADAS)) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }

  // Nunca se acepta del exterior la identidad que ponemos nosotros
  const headers = new Headers(request.headers);
  headers.delete("x-rd-user-id");
  headers.delete("x-rd-interno");

  if (empiezaPor(path, PUBLICAS)) {
    return NextResponse.next({ request: { headers } });
  }

  const secreto = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization") || "";

  // Crons de Vercel y llamadas internas entre rutas
  if (secreto && (auth === `Bearer ${secreto}` || request.headers.get("x-rd-key") === secreto)) {
    headers.set("x-rd-interno", "1");
    return NextResponse.next({ request: { headers } });
  }

  // Usuario con sesión
  if (auth.startsWith("Bearer ")) {
    const id = await usuarioDelToken(auth.slice(7).trim());
    if (id) {
      headers.set("x-rd-user-id", id);
      return NextResponse.next({ request: { headers } });
    }
  }

  return NextResponse.json({ ok: false, error: "No autorizado: inicia sesión" }, { status: 401 });
}

export const config = {
  matcher: "/api/:path*",
};
