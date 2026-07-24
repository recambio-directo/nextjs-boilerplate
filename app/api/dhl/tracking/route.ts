import { NextRequest, NextResponse } from "next/server";

const DHL_USER = process.env.DHL_USER!;
const DHL_KEY = process.env.DHL_KEY!;
const DHL_BASE = "https://external.dhl.es/cimapi/api/v1/customer";

async function getToken(): Promise<string | null> {
  try {
    const res = await fetch(`${DHL_BASE}/authenticate`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "accept": "application/json" },
      body: JSON.stringify({ Username: DHL_USER, Password: DHL_KEY }),
    });
    if (!res.ok) return null;
    const token = await res.text();
    return token.replace(/"/g, "").trim();
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  try {
    const tracking = req.nextUrl.searchParams.get("tracking");
    if (!tracking) return NextResponse.json({ ok: false, error: "tracking requerido" }, { status: 400 });

    const token = await getToken();
    if (!token) return NextResponse.json({ ok: false, error: "Error autenticación DHL" }, { status: 500 });

    const res = await fetch(
      `${DHL_BASE}/track?id=${tracking}&idioma=es&show=both`,
      {
        method: "GET",
        headers: {
          "accept": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      }
    );

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return NextResponse.json({ ok: false, error: err.Message || "Error tracking DHL" }, { status: 500 });
    }

    const data = await res.json();
    return NextResponse.json({ ok: true, data });

  } catch (e: any) {
    console.error("Error DHL tracking:", e);
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}