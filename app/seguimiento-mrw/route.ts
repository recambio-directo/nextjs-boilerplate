// app/seguimiento-mrw/route.ts
// Enlace público de seguimiento MRW: /seguimiento-mrw?n=02804F086831
// MRW ya no admite enlaces directos con el número en la URL (su buscador funciona por formulario POST),
// así que esta página envía el número al buscador oficial de MRW automáticamente y muestra su resultado.

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const numero = (url.searchParams.get("n") || "").replace(/[^A-Za-z0-9]/g, "").slice(0, 30);

  if (!numero) {
    return Response.redirect("https://www.mrw.es/seguimiento/", 302);
  }

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="robots" content="noindex, nofollow" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Seguimiento MRW ${numero}</title>
</head>
<body style="font-family:Arial,sans-serif;background:#0b1736;color:#fff;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;">
  <form id="f" method="post" action="https://www.mrw.es/seguimiento/validar_seguimiento.asp" style="text-align:center;">
    <input type="hidden" name="mrw-finder-follow-code" value="${numero}" />
    <p style="font-size:16px;margin:0 0 16px;">Abriendo el seguimiento de MRW del envío <strong>${numero}</strong>…</p>
    <button type="submit" style="background:#E30613;color:#fff;border:0;border-radius:8px;padding:12px 24px;font-weight:700;font-size:15px;cursor:pointer;">Ver seguimiento en MRW</button>
  </form>
  <script>document.getElementById("f").submit();</script>
</body>
</html>`;

  return new Response(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "X-Robots-Tag": "noindex, nofollow",
      "Cache-Control": "no-store",
    },
  });
}
