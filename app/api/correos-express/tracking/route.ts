import { NextRequest, NextResponse } from "next/server";

const CEX_TRACKING_URL = "https://www.cexpr.es/wspsc/apiRestSeguimientoEnviosk8s/json/seguimientoEnvio";
const CEX_USER = process.env.CEX_USUARIO!;
const CEX_PASS = process.env.CEX_PASSWORD!;
const CEX_SOLICITANTE = process.env.CEX_CODIGO_CLIENTE!;

export async function POST(req: NextRequest) {
  try {
    const { numEnvio } = await req.json();
    if (!numEnvio) return NextResponse.json({ error: "numEnvio requerido" }, { status: 400 });

    const authHeader = "Basic " + Buffer.from(`${CEX_USER}:${CEX_PASS}`).toString("base64");

    const body = {
      codigoCliente: CEX_SOLICITANTE,
      dato: String(numEnvio),
      idioma: "ES",
    };

    const resp = await fetch(CEX_TRACKING_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: authHeader },
      body: JSON.stringify(body),
    });

    const data = await resp.json();

    if (data.error !== 0) {
      return NextResponse.json({ error: data.mensajeError || "Error tracking CEX", code: data.error }, { status: 400 });
    }

    // Estado más reciente
    const estados = data.estadoEnvios || [];
    const ultimoEstado = estados[estados.length - 1] || null;

    return NextResponse.json({
      ok: true,
      numEnvio: data.numEnvio,
      resultado: data.resultado,
      codEstado: data.codEstado,
      descEstado: data.descEstado,
      fechaEstado: data.fechaEstado,
      horaEstado: data.horaEstado,
      ultimoEstado,
      historial: estados,
    });

  } catch (e: any) {
    console.error("Error tracking CEX:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}