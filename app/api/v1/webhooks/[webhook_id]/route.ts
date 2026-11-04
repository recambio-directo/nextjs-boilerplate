// app/api/v1/webhooks/[webhook_id]/route.ts
// DELETE — eliminar un webhook
import { NextRequest, NextResponse } from "next/server";
import {
  validarApiKey,
  noAutorizado,
  apiError,
  supabase,
} from "../../../../../lib/apiAuth";

interface Params {
  params: Promise<{ webhook_id: string }>;
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const auth = await validarApiKey(request);
  if (!auth) return noAutorizado();

  const { webhook_id } = await params;

  const { data: webhook } = await supabase
    .from("webhooks_proveedores")
    .select("id")
    .eq("id", webhook_id)
    .eq("proveedor_id", auth.proveedor_id)
    .maybeSingle();

  if (!webhook) {
    return apiError("NO_ENCONTRADO", "Webhook no encontrado", 404);
  }

  await supabase.from("webhooks_proveedores").delete().eq("id", webhook_id);

  return new NextResponse(null, { status: 204 });
}
