// app/api/admin/asistente/route.ts
// Estadísticas del asistente de recambios para el panel admin.
// Solo administradores (misma verificación que el resto de /api/admin/*).
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { verificarAdmin } from "@/app/lib/adminAuth";

export const dynamic = "force-dynamic";

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Precio de Claude Haiku 5.5 (USD por millón de tokens, peticiones de hasta 100.000 tokens).
// Es una estimación: la parte servida desde caché es más barata, así que el coste real es algo menor.
const PRECIO_ENTRADA = 0.10;
const PRECIO_SALIDA = 0.50;
const coste = (entrada: number, salida: number) => (entrada * PRECIO_ENTRADA + salida * PRECIO_SALIDA) / 1e6;

export async function GET(request: Request) {
  const admin = await verificarAdmin(request);
  if (!admin.ok) return NextResponse.json({ error: admin.error }, { status: admin.status });

  const url = new URL(request.url);
  const dias = Math.min(Math.max(parseInt(url.searchParams.get("dias") || "7", 10) || 7, 1), 90);
  const desde = new Date();
  if (dias === 1) desde.setUTCHours(0, 0, 0, 0);
  else desde.setTime(desde.getTime() - dias * 86400000);

  const { data: filas, error } = await db
    .from("asistente_consultas")
    .select("id, user_id, pregunta, respuesta, herramientas, vehiculo, productos_mostrados, modelo, tokens_entrada, tokens_salida, duracion_ms, error, created_at")
    .gte("created_at", desde.toISOString())
    .order("created_at", { ascending: false })
    .limit(5000);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const consultas = filas || [];
  const ids = [...new Set(consultas.map((c: any) => c.user_id))];
  const nombres = new Map<string, { nombre: string; tipo: string; provincia: string }>();
  for (let i = 0; i < ids.length; i += 200) {
    const { data } = await db.from("usuarios").select("id, nombre_empresa, email, tipo, provincia").in("id", ids.slice(i, i + 200));
    for (const u of data || []) nombres.set(u.id, { nombre: u.nombre_empresa || u.email || "—", tipo: u.tipo || "", provincia: u.provincia || "" });
  }
  const quien = (id: string) => nombres.get(id) || { nombre: "—", tipo: "", provincia: "" };

  // Resumen
  let tokensEntrada = 0, tokensSalida = 0, piezas = 0, conPiezas = 0, errores = 0, duracion = 0;
  for (const c of consultas as any[]) {
    tokensEntrada += c.tokens_entrada || 0;
    tokensSalida += c.tokens_salida || 0;
    piezas += c.productos_mostrados || 0;
    if ((c.productos_mostrados || 0) > 0) conPiezas++;
    if (c.error) errores++;
    duracion += c.duracion_ms || 0;
  }
  const n = consultas.length;

  // Por usuario
  const porUsuario = new Map<string, any>();
  for (const c of consultas as any[]) {
    const u = porUsuario.get(c.user_id) || { user_id: c.user_id, ...quien(c.user_id), consultas: 0, piezas: 0, entrada: 0, salida: 0, ultima: c.created_at };
    u.consultas++;
    u.piezas += c.productos_mostrados || 0;
    u.entrada += c.tokens_entrada || 0;
    u.salida += c.tokens_salida || 0;
    if (c.created_at > u.ultima) u.ultima = c.created_at;
    porUsuario.set(c.user_id, u);
  }

  return NextResponse.json({
    dias,
    resumen: {
      consultas: n,
      usuarios: porUsuario.size,
      coste_usd: coste(tokensEntrada, tokensSalida),
      coste_medio_usd: n ? coste(tokensEntrada, tokensSalida) / n : 0,
      piezas_mostradas: piezas,
      porcentaje_con_piezas: n ? Math.round((conPiezas / n) * 100) : 0,
      errores,
      segundos_medios: n ? Math.round(duracion / n / 100) / 10 : 0,
    },
    porUsuario: [...porUsuario.values()]
      .map((u) => ({ user_id: u.user_id, nombre: u.nombre, tipo: u.tipo, provincia: u.provincia, consultas: u.consultas, piezas: u.piezas, coste_usd: coste(u.entrada, u.salida), ultima: u.ultima }))
      .sort((a, b) => b.consultas - a.consultas),
    sinResultado: (consultas as any[])
      .filter((c) => !c.error && !(c.productos_mostrados > 0))
      .slice(0, 50)
      .map((c) => ({ id: c.id, nombre: quien(c.user_id).nombre, pregunta: c.pregunta, vehiculo: c.vehiculo, created_at: c.created_at })),
    ultimas: (consultas as any[]).slice(0, 100).map((c) => ({
      id: c.id,
      nombre: quien(c.user_id).nombre,
      pregunta: c.pregunta,
      respuesta: c.respuesta,
      vehiculo: c.vehiculo,
      herramientas: c.herramientas,
      piezas: c.productos_mostrados || 0,
      coste_usd: coste(c.tokens_entrada || 0, c.tokens_salida || 0),
      segundos: c.duracion_ms ? Math.round(c.duracion_ms / 100) / 10 : null,
      error: c.error,
      created_at: c.created_at,
    })),
  });
}
