import { NextRequest, NextResponse } from "next/server";

// Usa el Auto Parts Catalog (PRO $29/mes) en vez del VIN Decoder Mega API (gratuito agotado)
const RAPIDAPI_HOST = "auto-parts-catalog.p.rapidapi.com";
const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY!;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const vin = searchParams.get("vin");

  if (!vin) {
    return NextResponse.json({ error: "Indica un número de bastidor (VIN)" }, { status: 400 });
  }

  const vinClean = vin.trim().toUpperCase().replace(/[^A-HJ-NPR-Z0-9]/g, "");

  if (vinClean.length !== 17) {
    return NextResponse.json({ error: "El bastidor debe tener exactamente 17 caracteres" }, { status: 400 });
  }

  try {
    // Intentar v5 primero (más completo), luego v3, v2, v1
    const versiones = ["decoder-v5", "decoder-v3", "decoder-v2", "decoder-v1"];
    let datos: any = null;
    let vinData: any = null;

    for (const version of versiones) {
      try {
        const url = `https://${RAPIDAPI_HOST}/vin/${version}/${encodeURIComponent(vinClean)}`;
        const res = await fetch(url, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "x-rapidapi-host": RAPIDAPI_HOST,
            "x-rapidapi-key": RAPIDAPI_KEY,
          },
        });

        if (res.ok) {
          const json = await res.json();
          // La respuesta puede variar según la versión
          if (json && !json.error && !json.message?.includes("not found")) {
            vinData = json;
            // Puede ser un objeto directo o tener .data
            datos = json.data || json;
            break;
          }
        }
      } catch {
        // Intentar siguiente versión
      }
    }

    if (!datos) {
      return NextResponse.json(
        { error: "No se pudo decodificar el bastidor. Verifica que el VIN es correcto." },
        { status: 400 }
      );
    }

    // Normalizar campos — la estructura puede variar entre versiones
    // Intentamos múltiples nombres de campo para máxima compatibilidad
    const d = datos;

    const vehiculo = {
      vin: d.vin || d.VIN || vinClean,
      marca: d.make || d.marque || d.manufacturer || d.brand || "",
      modelo: d.model || d.modele || d.modele_en || "",
      version: d.version || d.trim || d.variant || "",
      motor: d.engine_code || d.code_moteur || d.engineCode || "",
      combustible: d.fuel_type || d.fuel || d.energieNGC || d.type_moteur || "",
      potencia_kw: d.power_kw || d.puisFiscReelKW || d.kw || "",
      potencia_cv: d.power_hp || d.power_ps || d.puisFiscReelCH || d.hp || d.cv || "",
      cilindrada: d.displacement || d.ccm || d.engine_displacement || d.capacity || "",
      cilindros: d.cylinders || d.cylindres || d.number_of_cylinders || "",
      transmision: d.drive_type || d.type_transmission || d.drive || "",
      caja_cambios: normalizarCaja(d.transmission || d.gearbox || d.boite_vitesse || ""),
      carroceria: d.body_type || d.body || d.carrosserie || "",
      color: d.color || d.colour || d.couleur || "",
      puertas: d.doors || d.nb_portes || d.number_of_doors || "",
      plazas: d.seats || d.nr_passagers || d.number_of_seats || "",
      peso: d.weight || d.poids || d.curb_weight || "",
      co2: d.co2 ? `${d.co2} g/km` : d.co2_emission ? `${d.co2_emission} g/km` : "",
      fecha_inicio_modelo: d.model_start || d.debut_modele || d.year_from || "",
      fecha_primera_matriculacion: d.first_registration || d.date1erCir_fr || d.registration_date || "",
      pais: d.country || d.pays || d.market || "",
      placa: d.plate || d.plaque || d.license_plate || "",
      logo_marca: d.logo || d.logo_marque || d.manufacturer_logo || "",
      foto_modelo: d.image || d.photo || d.photo_modele || d.vehicle_image || "",
      tecdoc_car_id: d.tecdoc_car_id || d.k_type || d.ktype || d.ktypnr || "",
      tecdoc_manu_id: d.tecdoc_manu_id || d.manufacturer_id || "",
      tecdoc_model_id: d.tecdoc_model_id || d.model_id || "",
      pneus: d.tires || d.pneus || d.tyres || [],
    };

    return NextResponse.json(vehiculo);
  } catch (err) {
    console.error("Error VIN Decoder:", err);
    return NextResponse.json({ error: "Error de conexión con el decodificador de bastidor" }, { status: 500 });
  }
}

function normalizarCaja(valor: string): string {
  if (!valor) return "";
  const v = valor.toUpperCase();
  if (v === "M" || v.includes("MANUAL")) return "Manual";
  if (v === "A" || v.includes("AUTO")) return "Automática";
  return valor;
}
