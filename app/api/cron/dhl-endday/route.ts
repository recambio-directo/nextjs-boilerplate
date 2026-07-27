import { NextRequest, NextResponse } from "next/server";

const DHL_USER = process.env.DHL_USER!;
const DHL_KEY = process.env.DHL_KEY!;
const DHL_CUSTOMER = process.env.DHL_CUSTOMER!;
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
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const token = await getToken();
    if (!token) return NextResponse.json({ ok: false, error: "Error autenticación DHL" }, { status: 500 });

    const res = await fetch(`${DHL_BASE}/endday`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "accept": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify({ Accounts: DHL_CUSTOMER, Report: "PDF", OnlyDayReport: 0 }),
    });

    const text = await res.text();
    console.log("DHL EndDay cron:", res.status, text.substring(0, 200));

    let data: any = {};
    try { data = JSON.parse(text); } catch {}

    return NextResponse.json({
      ok: res.ok,
      status: res.status,
      shipments: data.Shipments || [],
      hasReport: !!data.Report,
    });

  } catch (e: any) {
    console.error("DHL EndDay cron error:", e);
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}