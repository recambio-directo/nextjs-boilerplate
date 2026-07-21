// app/api/nacex/disponibilidad/route.ts
// Comprueba si NACEX tiene cobertura real para un código postal de
// origen (proveedor) y uno de destino (comprador), consultando getAgencia3.
// Si NACEX devuelve una agencia válida para ambos CPs, consideramos que
// hay servicio disponible. Esto es una heurística: el manual no expone
// un método dedicado de "check de cobertura", así que usamos getAgencia3
// como mejor proxy disponible.

async function consultarAgencia(cp: string, poblacion: string): Promise<boolean> {
  if (!cp) return false;

  const baseUrl = "https://pda.nacex.com/nacex_ws/ws";
  const user = process.env.NACEX_USER || "";
  const pass = process.env.NACEX_PASS || "";

  const dataString = [`cp=${cp}`, `pob=${poblacion || ""}`].join("|");
  const url = `${baseUrl}?method=getAgencia3&user=${encodeURIComponent(user)}&pass=${encodeURIComponent(pass)}&data=${encodeURIComponent(dataString)}`;

  try {
    const response = await fetch(url, { method: "GET" });
    const rawText = await response.text();
    const partes = rawText.split("|");

    // Formato esperado: codigo_agencia|nombre|direccion|telefono|...
    // Si no hay código de agencia reconocible, asumimos sin cobertura.
    const codigoAgencia = partes[0]?.trim();
    console.log("NACEX disponibilidad respuesta:", rawText.substring(0, 200), "| codigo:", codigoAgencia);
    return Boolean(codigoAgencia) && /^[A-Za-z0-9]+$/.test(codigoAgencia) && codigoAgencia.length <= 6;
  } catch (e) {
    console.error("Error consultando agencia NACEX:", e);
    return false;
  }
}

export async function POST(request: Request) {
  try {
    const { cpOrigen, poblacionOrigen, cpDestino, poblacionDestino } = await request.json();

    if (!cpOrigen || !cpDestino) {
      return Response.json({ ok: false, error: "Faltan códigos postales", disponible: false }, { status: 400 });
    }

    const [origenOk, destinoOk] = await Promise.all([
      consultarAgencia(cpOrigen, poblacionOrigen || ""),
      consultarAgencia(cpDestino, poblacionDestino || ""),
    ]);

    return Response.json({
      ok: true,
      disponible: origenOk && destinoOk,
      origenOk,
      destinoOk,
    });

  } catch (error) {
    console.error("Error NACEX disponibilidad:", error);
    return Response.json({ ok: false, error: String(error), disponible: false }, { status: 500 });
  }
}