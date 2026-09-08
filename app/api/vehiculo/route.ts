import { NextRequest, NextResponse } from "next/server";

const API_BASE = "https://api.apivehiculo.com/v1";
const API_KEY = process.env.APIVEHICULO_API_KEY!;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const plate = searchParams.get("plate");
  const vin = searchParams.get("vin");

  if (!plate && !vin) {
    return NextResponse.json({ error: "Indica matrícula o VIN" }, { status: 400 });
  }
  if (plate && vin) {
    return NextResponse.json({ error: "Indica matrícula o VIN, no ambos" }, { status: 400 });
  }

  try {
    const query = plate ? `plate=${encodeURIComponent(plate)}` : `vin=${encodeURIComponent(vin!)}`;
    const res = await fetch(`${API_BASE}/vehicles/lookup?${query}&country=ES`, {
      headers: { Authorization: `Bearer ${API_KEY}` },
    });

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json(
        { error: data.message || "Error al consultar el vehículo" },
        { status: res.status }
      );
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error("Error APIVehículo:", err);
    return NextResponse.json({ error: "Error de conexión con APIVehículo" }, { status: 500 });
  }
}
