// app/api/health/route.ts
// Comprobación de estado para el panel admin (Sistema). No expone datos.
import { sbAdmin } from "@/app/lib/envios";

export const dynamic = "force-dynamic";

export async function GET() {
  let baseDatos = "error";
  try {
    const { error } = await sbAdmin().from("usuarios").select("id", { count: "exact", head: true }).limit(1);
    baseDatos = error ? "error" : "ok";
  } catch { baseDatos = "error"; }
  const ok = baseDatos === "ok";
  return Response.json({ ok, baseDatos, email: process.env.RESEND_API_KEY ? "ok" : "sin configurar", hora: new Date().toISOString() }, { status: ok ? 200 : 503 });
}
