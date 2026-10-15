import { NextRequest, NextResponse } from "next/server";
import { getIpdaToken } from "../../lib/ipda";

const IPDA_BASE = "https://rgranvia-backend.isicondal.com/public/api/v1";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  let img = request.nextUrl.searchParams.get("img");
  if (!img) {
    return NextResponse.json({ error: "Falta el parámetro img" }, { status: 400 });
  }

  // Si llega la URL completa de IPDA, extraer solo el token JWT
  if (img.startsWith("http")) {
    try {
      const parsed = new URL(img);
      img = parsed.searchParams.get("img") || img;
    } catch {
      // no es URL válida, usar tal cual
    }
  }

  try {
    const token = await getIpdaToken();
    const url = `${IPDA_BASE}/document/retrieve2?img=${img}`;
    console.log("[tecdoc-img] Fetching image, token start:", img.slice(0, 30));

    const res = await fetch(url, {
      headers: {
        "App-Token": token,
      },
    });

    console.log("[tecdoc-img] Response status:", res.status, "content-type:", res.headers.get("content-type"));

    if (!res.ok) {
      const text = await res.text();
      console.error("[tecdoc-img] Error response:", text.slice(0, 500));
      return NextResponse.json(
        { error: "Imagen no disponible", status: res.status, detail: text.slice(0, 200) },
        { status: res.status }
      );
    }

    const contentType = res.headers.get("content-type") || "image/jpeg";
    const buffer = await res.arrayBuffer();
    console.log("[tecdoc-img] Image OK, size:", buffer.byteLength, "type:", contentType);

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400, s-maxage=86400",
      },
    });
  } catch (err: any) {
    console.error("[tecdoc-img] Exception:", err.message);
    return NextResponse.json({ error: "Error obteniendo imagen", detail: err.message }, { status: 500 });
  }
}
