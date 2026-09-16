import { NextRequest, NextResponse } from "next/server";
import { buscarVehiculo } from "../../lib/ipda";

// GET /api/vehiculo?busqueda=VF37ABHY6GN509536
// GET /api/vehiculo?busqueda=0097JTV
// Acepta VIN (17 chars) o matrícula
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const busqueda = searchParams.get("busqueda") || searchParams.get("vin") || "";

  if (!busqueda.trim()) {
    return NextResponse.json(
      { error: "Introduce un número de bastidor (VIN) o matrícula" },
      { status: 400 }
    );
  }

  const valor = busqueda.trim().toUpperCase().replace(/[\s\-]/g, "");

  if (valor.length < 4) {
    return NextResponse.json(
      { error: "La búsqueda es demasiado corta" },
      { status: 400 }
    );
  }

  try {
    const resultado = await buscarVehiculo(valor);

    if (!resultado.record || resultado.record.length === 0) {
      return NextResponse.json(
        { error: "No se encontraron vehículos para esta búsqueda. Verifica el VIN o matrícula." },
        { status: 404 }
      );
    }

    // Mapear datos del vehículo al formato del frontend
    const vehiculos = resultado.record.map((r) => ({
      id: r.id,
      nombre_completo: r.nombreVehiculo,
      marca: r.nombreMarca,
      modelo: r.nombreModelo,
      motor: r.nombreMotor,
      combustible: r.combustibleTipo || r.tipoMotor,
      potencia_kw: r.kw_desde,
      potencia_cv: r.cv_desde,
      cilindrada: r.cc_desde,
      cilindros: r.cilindros,
      traccion: r.traccion,
      carroceria: r.carroceria,
      inyeccion: r.combustibleMezcla,
      catalizador: r.catalizador,
      valvulas: r.valvulas,
      desde: r.aaaamm_desde,
      hasta: r.aaaamm_hasta,
      capacidad_motor: r.capacidadMotor,
      transmision: r.transmision,
    }));

    // Info general del vehículo (datos de la matrícula/VIN)
    const info = {
      vin: resultado.vin || "",
      matricula_info: resultado.mod || "",
      marca_dgt: resultado.mar || "",
      combustible_dgt: resultado.pro || "",
      fecha_matriculacion: resultado.fma || "",
      tipo_vehiculo: resultado.car || "",
      cilindrada_dgt: resultado.cc || "",
    };

    return NextResponse.json({
      info,
      vehiculos,
      total: vehiculos.length,
    });
  } catch (err) {
    console.error("Error búsqueda vehículo IPDA:", err);
    return NextResponse.json(
      { error: "Error al buscar el vehículo. Inténtalo de nuevo." },
      { status: 500 }
    );
  }
}
