// app/api/nacex/anular/route.ts
// Anula un envío NACEX por su localizador (tracking_nacex)

export async function POST(request: Request) {
  try {
    const { localizador } = await request.json();
    if (!localizador) {
      return Response.json({ ok: false, error: "Falta localizador" }, { status: 400 });
    }

    const usuario = process.env.NACEX_USUARIO || "";
    const password = process.env.NACEX_PASSWORD || "";
    const baseUrl = "https://nacexapi.nacex.com/api_nacex.php";

    // NACEX usa el método anularEnvio
    const params = new URLSearchParams({
      método: "anularEnvio",
      user: usuario,
      pass: password,
      ag: localizador.split("/")[0] || "",
      num_alb: localizador.split("/")[1] || localizador,
    });

    const res = await fetch(`${baseUrl}?${params.toString()}`, {
      method: "GET",
    });

    const rawText = await res.text();
    console.log("NACEX anular response:", rawText.substring(0, 300));

    // NACEX devuelve ERROR= o OK=
    const ok = !rawText.includes("ERROR=") && (rawText.includes("OK") || res.ok);

    return Response.json({ ok, localizador, rawResponse: rawText });

  } catch (error) {
    console.error("Error NACEX anular:", error);
    return Response.json({ ok: false, error: String(error) }, { status: 500 });
  }
}