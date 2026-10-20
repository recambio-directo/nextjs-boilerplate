// app/api/dhl/tracking/route.ts
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

// Mapear estado DHL España a estado interno RD
function mapearEstado(data: any): string {
  if (!data) return "preparando";

  // DHL España API devuelve distintos formatos
  const eventos = data.events || data.Tracking?.Events || data.shipments?.[0]?.events || [];

  if (Array.isArray(eventos) && eventos.length > 0) {
    for (const evento of eventos) {
      const desc = (evento.description || evento.Description || evento.statusDescription || "").toLowerCase();
      const status = (evento.status || evento.StatusCode || "").toLowerCase();

      if (desc.includes("entregado") || desc.includes("entrega") || desc.includes("delivered") ||
          status.includes("delivered") || status === "ok") {
        return "entregado";
      }
    }
    // Si hay eventos pero ninguno es entrega → en tránsito
    return "enviado";
  }

  // Fallback: comprobar campos de nivel superior
  const estado = (data.Status || data.status || data.estadoEnvio || "").toLowerCase();
  if (estado.includes("entregado") || estado.includes("delivered")) return "entregado";
  if (estado.includes("tránsito") || estado.includes("transit") || estado.includes("reparto")) return "enviado";

  return "preparando";
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
    const estadoRD = mapearEstado(data);

    return NextResponse.json({ ok: true, estadoRD, data });

  } catch (e: any) {
    console.error("Error DHL tracking:", e);
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
