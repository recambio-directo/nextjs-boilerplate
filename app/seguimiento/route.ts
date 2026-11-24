// app/seguimiento/route.ts
// Enlace público de seguimiento para TODAS las agencias:
//   /seguimiento?a=mrw&n=02804F086831
//   /seguimiento?a=ctt&n=0030100030109700853947
// Redirige a la página oficial de seguimiento de cada agencia con el número ya puesto.
// Si una agencia cambia su web, solo hay que tocar este archivo.
// Direcciones comprobadas el 24/11/2026.

export const dynamic = "force-dynamic";

const limpiar = (s: string) => s.replace(/[^A-Za-z0-9/\-]/g, "").slice(0, 40);

function paginaMRW(numero: string): Response {
  // MRW no admite el número en la URL: su buscador funciona por formulario POST
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
    headers: { "Content-Type": "text/html; charset=utf-8", "X-Robots-Tag": "noindex, nofollow", "Cache-Control": "no-store" },
  });
}

function urlAgencia(agencia: string, n: string): string | null {
  const a = agencia.toLowerCase();
  const e = encodeURIComponent(n);
  if (a.includes("nacex")) {
    // NACEX guarda el localizador como "agencia/albarán" (p. ej. 3003/12345678)
    const [ag, alb] = n.split("/");
    if (ag && alb) return `https://www.nacex.com/seguimientoDetalle.do?agencia_origen=${encodeURIComponent(ag)}&numero_albaran=${encodeURIComponent(alb)}&externo=N`;
    return "https://www.nacex.com/";
  }
  if (a.includes("seur")) return `https://www.seur.com/livetracking/?segOnlineIdentificador=${e}`;
  if (a.includes("ctt")) return `https://www.cttexpress.com/localizador-de-envios/?sc=${e}`;
  if (a.includes("gls")) return `https://gls-group.com/ES/es/seguimiento-envio?match=${e}`;
  if (a.includes("correos")) return `https://s.correosexpress.com/SeguimientoSinCP/search-es?tracking-number=${e}`;
  if (a.includes("dhl")) return `https://www.dhl.com/es-es/home/tracking.html?tracking-id=${e}&submit=1`;
  return null;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const agencia = (url.searchParams.get("a") || "").trim();
  const numero = limpiar(url.searchParams.get("n") || "");

  if (agencia.toLowerCase().includes("mrw")) {
    return numero ? paginaMRW(numero) : Response.redirect("https://www.mrw.es/seguimiento/", 302);
  }

  const destino = numero ? urlAgencia(agencia, numero) : null;
  if (destino) return Response.redirect(destino, 302);

  // Agencia desconocida o sin número: búsqueda genérica
  return Response.redirect(`https://www.google.com/search?q=${encodeURIComponent(`seguimiento ${agencia} ${numero}`.trim())}`, 302);
}
