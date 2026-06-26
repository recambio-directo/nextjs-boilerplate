// app/api/nacex/anular/route.ts
export async function POST(request: Request) {
  try {
    const { localizador } = await request.json();
    if (!localizador) {
      return Response.json({ ok: false, error: "Falta localizador" }, { status: 400 });
    }

    const usuario = process.env.NACEX_USER || "";
    const password = process.env.NACEX_PASS || "";
    const baseUrl = "https://pda.nacex.com/nacex_ws/ws";

    // NACEX: agencia y número de albarán vienen en el localizador como "agencia/numAlbaran"
    const partes = localizador.split("/");
    const agencia = partes[0] || "";
    const numAlbaran = partes[1] || localizador;

    const params = new URLSearchParams({
      method:    "anularEnvio",
      user:      usuario,
      pass:      password,
      ag:        agencia,
      num_alb:   numAlbaran,
    });

    const url = `${baseUrl}?${params.toString()}`;
    console.log("NACEX anular URL:", url.replace(password, "***"));

    const res = await fetch(url, { method: "GET" });
    const rawText = await res.text();
    console.log("NACEX anular response:", rawText.substring(0, 300));

    const ok = !rawText.includes("ERROR=") && (rawText.includes("OK") || res.ok);

    return Response.json({ ok, localizador, rawResponse: rawText });

  } catch (error) {
    console.error("Error NACEX anular:", error);
    return Response.json({ ok: false, error: String(error) }, { status: 500 });
  }
}