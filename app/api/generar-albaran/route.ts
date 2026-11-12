// app/api/generar-albaran/route.ts
// Genera el albarán PDF en servidor para un pedido existente y lo guarda en Storage
import { sbAdmin } from "@/app/lib/envios";
import { generarAlbaranes } from "@/app/lib/albaranServidor";

const supabase = sbAdmin();

export async function POST(request: Request) {
  try {
    const { pedidoId } = await request.json();
    if (!pedidoId) return Response.json({ ok: false, error: "pedidoId requerido" }, { status: 400 });

    const r = await generarAlbaranes(supabase, pedidoId);
    if (!r.ok) return Response.json({ ok: false, error: r.error }, { status: r.status });

    return Response.json({
      ok: true,
      codigo: r.codigo,
      albaran_url: r.albaran_url,
      albaran_proveedor_url: r.albaran_proveedor_url,
    });
  } catch (err) {
    console.error("Error generar-albaran:", err);
    return Response.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
