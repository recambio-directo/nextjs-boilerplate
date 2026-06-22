// app/api/seur/anular/route.ts
// Anula una recogida SEUR por su collectionRef

let cachedToken: string | null = null;
let tokenExpiresAt: number = 0;

async function getSeurToken(): Promise<string> {
  const ahora = Date.now();
  if (cachedToken && ahora < tokenExpiresAt - 300_000) return cachedToken;
  const params = new URLSearchParams({
    grant_type: "password",
    client_id: process.env.SEUR_CLIENT_ID || "",
    client_secret: process.env.SEUR_CLIENT_SECRET || "",
    username: process.env.SEUR_USERNAME || "",
    password: process.env.SEUR_PASSWORD || "",
  });
  const res = await fetch("https://servicios.api.seur.io/pic_token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });
  if (!res.ok) throw new Error(`SEUR token error ${res.status}`);
  const data = await res.json();
  cachedToken = data.access_token;
  tokenExpiresAt = ahora + (data.expires_in || 7200) * 1000;
  return cachedToken!;
}

export async function POST(request: Request) {
  try {
    const { collectionRef } = await request.json();
    if (!collectionRef) {
      return Response.json({ ok: false, error: "Falta collectionRef" }, { status: 400 });
    }

    const token = await getSeurToken();
    const res = await fetch("https://servicios.api.seur.io/pic/v1/collections/cancel", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify({ codes: [collectionRef] }),
    });

    const rawText = await res.text();
    console.log("SEUR anular response:", rawText);

    return Response.json({
      ok: res.ok,
      collectionRef,
      rawResponse: rawText,
    });

  } catch (error) {
    console.error("Error SEUR anular:", error);
    return Response.json({ ok: false, error: String(error) }, { status: 500 });
  }
}