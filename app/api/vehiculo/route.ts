import { NextRequest, NextResponse } from "next/server";

// Usa el Auto Parts Catalog (PRO $29/mes) para decodificar VIN
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
    // Probar todas las versiones del decoder
    const versiones = ["decoder-v5", "decoder-v3", "decoder-v2", "decoder-v1", "all-in-one"];
    let respuestaOk: any = null;

    for (const version of versiones) {
      try {
        const url = `https://${RAPIDAPI_HOST}/vin/${version}/${encodeURIComponent(vinClean)}`;
        console.log(`Probando VIN ${version}: ${url}`);

        const res = await fetch(url, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "x-rapidapi-host": RAPIDAPI_HOST,
            "x-rapidapi-key": RAPIDAPI_KEY,
          },
        });

        const json = await res.json();
        console.log(`VIN ${version} status:${res.status} keys:${JSON.stringify(Object.keys(json)).slice(0,200)}`);
        console.log(`VIN ${version} sample:${JSON.stringify(json).slice(0,500)}`);

        if (res.ok && json) {
          respuestaOk = { version, json };
          // Si esta versión tiene datos útiles, usarla
          const str = JSON.stringify(json);
          if (str.length > 100) break; // Tiene contenido real
        }
      } catch (e) {
        console.error(`VIN ${version} error:`, e);
      }
    }

    if (!respuestaOk) {
      return NextResponse.json(
        { error: "No se pudo decodificar el bastidor. Verifica que el VIN es correcto." },
        { status: 400 }
      );
    }

    const { version, json } = respuestaOk;
    // Aplanar: puede ser json directamente, json.data, json.decode, etc.
    const d = json.data || json.decode || json.result || json;

    console.log(`VIN usando ${version}, tipo datos: ${typeof d}, keys: ${JSON.stringify(Object.keys(d)).slice(0,300)}`);

    // Mapeo exhaustivo — probamos todos los nombres posibles de cada campo
    const vehiculo = {
      vin: extraer(d, ["vin", "VIN"]) || vinClean,
      marca: extraer(d, ["make", "Make", "marque", "manufacturer", "brand", "Manufacturer", "mfrName"]),
      modelo: extraer(d, ["model", "Model", "modele", "modele_en", "modelName"]),
      version: extraer(d, ["version", "trim", "Trim", "variant", "subModel", "series"]),
      motor: extraer(d, ["engine_code", "engineCode", "code_moteur", "Engine", "engineType"]),
      combustible: extraer(d, ["fuel_type", "fuelType", "fuel", "energieNGC", "type_moteur", "FuelType", "fuelTypePrimary"]),
      potencia_kw: extraer(d, ["power_kw", "powerKw", "puisFiscReelKW", "kw", "enginePowerKw"]),
      potencia_cv: extraer(d, ["power_hp", "powerHp", "power_ps", "puisFiscReelCH", "hp", "cv", "horsepower", "enginePowerHp"]),
      cilindrada: extraer(d, ["displacement", "Displacement", "ccm", "engine_displacement", "capacity", "engineDisplacement", "DisplacementCC"]),
      cilindros: extraer(d, ["cylinders", "Cylinders", "cylindres", "number_of_cylinders", "numberOfCylinders"]),
      transmision: extraer(d, ["drive_type", "driveType", "type_transmission", "drive", "DriveType"]),
      caja_cambios: normalizarCaja(extraer(d, ["transmission", "Transmission", "gearbox", "boite_vitesse", "transmissionStyle"])),
      carroceria: extraer(d, ["body_type", "bodyType", "body", "carrosserie", "BodyClass", "bodyClass"]),
      color: extraer(d, ["color", "Color", "colour", "couleur", "exteriorColor"]),
      puertas: extraer(d, ["doors", "Doors", "nb_portes", "number_of_doors", "numberOfDoors"]),
      plazas: extraer(d, ["seats", "Seats", "nr_passagers", "number_of_seats", "numberOfSeats"]),
      peso: extraer(d, ["weight", "Weight", "poids", "curb_weight", "curbWeight"]),
      co2: formatCO2(extraer(d, ["co2", "CO2", "co2_emission"])),
      fecha_inicio_modelo: extraer(d, ["model_start", "modelStart", "debut_modele", "year_from", "ModelYear", "modelYear", "year"]),
      fecha_primera_matriculacion: extraer(d, ["first_registration", "firstRegistration", "date1erCir_fr", "registration_date"]),
      pais: extraer(d, ["country", "Country", "pays", "market", "PlantCountry"]),
      placa: extraer(d, ["plate", "Plate", "plaque", "license_plate"]),
      logo_marca: extraer(d, ["logo", "logo_marque", "manufacturer_logo", "makeLogo"]),
      foto_modelo: extraer(d, ["image", "photo", "photo_modele", "vehicle_image", "modelImage"]),
      tecdoc_car_id: extraer(d, ["tecdoc_car_id", "tecdocCarId", "k_type", "ktype", "ktypnr", "kType"]),
      tecdoc_manu_id: extraer(d, ["tecdoc_manu_id", "tecdocManuId", "manufacturer_id"]),
      tecdoc_model_id: extraer(d, ["tecdoc_model_id", "tecdocModelId", "model_id"]),
      pneus: extraerArray(d, ["tires", "pneus", "tyres", "Tires"]),
      _debug_version: version,
      _debug_keys: Object.keys(d).slice(0, 30),
    };

    return NextResponse.json(vehiculo);
  } catch (err) {
    console.error("Error VIN Decoder:", err);
    return NextResponse.json({ error: "Error de conexión con el decodificador de bastidor" }, { status: 500 });
  }
}

// Extrae el primer valor no vacío de una lista de posibles keys (también busca anidado)
function extraer(obj: any, keys: string[]): string {
  if (!obj || typeof obj !== "object") return "";
  for (const key of keys) {
    if (obj[key] !== undefined && obj[key] !== null && obj[key] !== "") {
      return String(obj[key]);
    }
  }
  // Buscar un nivel anidado
  for (const val of Object.values(obj)) {
    if (val && typeof val === "object" && !Array.isArray(val)) {
      for (const key of keys) {
        const nested = val as Record<string, any>;
        if (nested[key] !== undefined && nested[key] !== null && nested[key] !== "") {
          return String(nested[key]);
        }
      }
    }
  }
  return "";
}

function extraerArray(obj: any, keys: string[]): any[] {
  if (!obj || typeof obj !== "object") return [];
  for (const key of keys) {
    if (Array.isArray(obj[key])) return obj[key];
  }
  return [];
}

function normalizarCaja(valor: string): string {
  if (!valor) return "";
  const v = valor.toUpperCase();
  if (v === "M" || v.includes("MANUAL")) return "Manual";
  if (v === "A" || v.includes("AUTO")) return "Automática";
  return valor;
}

function formatCO2(val: string): string {
  if (!val) return "";
  return val.includes("g/km") ? val : `${val} g/km`;
}
