import { NextRequest, NextResponse } from "next/server";

const CEX_ANULAR_URL = "https://www.cexpr.es/wspsc/apiRestGrabacionRecogidaEnviok8s/json/anularRecogida";
const CEX_USER = process.env.CEX_USUARIO!;
const CEX_PASS = process.env.CEX_PASSWORD!;
const CEX_SOLICITANTE = process.env.CEX_CODIGO_CLIENTE!;

export async function POST(req: NextRequest) {
  try {
    const { keyRecogida } = await req.json();
    if (!keyRecogida) return NextResponse.json({ error: "keyRecogida requerido" }, { status: 400 });

    const authHeader = "Basic " + Buffer.from(`${CEX_USER}:${CEX_PASS}`).toString("base64");

    const body = {
      solicitante: CEX_SOLICITANTE,
      password: CEX_PASS,
      keyRecogida: String(keyRecogida),
      strTextoAnulacion: "Pedido anulado por el cliente en Recambio Directo",
      strUsuario: "",
      strReferencia: "",
      strCodCliente: "",
      strFRecogida: "",
    };

    const resp = await fetch(CEX_ANULAR_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: authHeader },
      body: JSON.stringify(body),
    });

    const data = await resp.json();

    // código 0 = OK, 20 = ya anulada (ambos son aceptables)
    if (data.codError !== 0 && data.codError !== 20) {
      console.error("CEX anular error:", data);
      return NextResponse.json({ error: data.mensError || "Error anulando en CEX", code: data.codError }, { status: 400 });
    }

    return NextResponse.json({ ok: true, codError: data.codError, mensaje: data.mensError });

  } catch (e: any) {
    console.error("Error anular recogida CEX:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}