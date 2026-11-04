// app/api/v1/health/route.ts
// Endpoint de salud — verifica conectividad y API key
import { NextRequest, NextResponse } from "next/server";
import { validarApiKey, noAutorizado } from "../../../../lib/apiAuth";

export async function GET(request: NextRequest) {
  const auth = await validarApiKey(request);
  if (!auth) return noAutorizado();

  return NextResponse.json({
    status: "ok",
    proveedor: auth.nombre_empresa,
    timestamp: new Date().toISOString(),
  });
}
