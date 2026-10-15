import { NextRequest, NextResponse } from "next/server";

const IPDA_BASE = "https://rgranvia-backend.isicondal.com/public/api/v1";

export async function GET(request: NextRequest) {
  const img = request.nextUrl.searchParams.get("img");
  if (!img) {
    return NextResponse.json({ error: "Falta el parámetro img" }, { status: 400 });
  }

  try {
    const res = await fetch(`${IPDA_BASE}/document/retrieve2?img=${encodeURIComponent(img)}`, {
      headers: { "Accept": "image/*" },
    });

    if (!res.ok) {
      return NextResponse.json({ error: "Imagen no disponible" }, { status: res.status });
    }

    const contentType = res.headers.get("content-type") || "image/jpeg";
    const buffer = await res.arrayBuffer();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400, s-maxage=86400",
      },
    });
  } catch {
    return NextResponse.json({ error: "Error obteniendo imagen" }, { status: 500 });
  }
}
