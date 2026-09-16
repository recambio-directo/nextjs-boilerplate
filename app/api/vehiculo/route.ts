import { NextRequest, NextResponse } from "next/server";

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
    const versiones = ["decoder-v5", "decoder-v3", "decoder-v2", "decoder-v1", "all-in-one"];
    let merged: Record<string, any> = {};
    let usedVersion = "";

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

        if (!res.ok) continue;
        const json = await res.json();
        if (!json) continue;

        // La API devuelve { "vin-data-1": { content: "JSON_STRING" }, "vin-data-2": ..., "vin-data-3": ... }
        for (const [key, val] of Object.entries(json)) {
          const entry = val as any;
          if (entry && typeof entry === "object" && typeof entry.content === "string") {
            try {
              const parsed = JSON.parse(entry.content);

              // vin-data-3 es un array de { title, information: { key: value } }
              if (Array.isArray(parsed)) {
                for (const item of parsed) {
                  if (item && typeof item === "object" && item.information && typeof item.information === "object") {
                    // Aplanar: "Model year" → "Model year": "2016"
                    for (const [infoKey, infoVal] of Object.entries(item.information)) {
                      if (infoVal && typeof infoVal === "string") {
                        // Guardar con key normalizado (sin espacios, lowercase)
                        const normKey = infoKey.toLowerCase().replace(/\s+/g, "_");
                        if (!merged[normKey]) merged[normKey] = infoVal;
                      }
                    }
                  }
                }
              } else if (typeof parsed === "object" && parsed !== null) {
                merged = { ...merged, ...parsed };
              }
            } catch {
              // content no es JSON válido
            }
          }
        }

        // Si no tiene vin-data-* keys, puede ser un objeto plano directo
        if (!Object.keys(json).some((k: string) => k.startsWith("vin-data"))) {
          const d = json.data || json.decode || json.result || json;
          if (typeof d === "object" && !Array.isArray(d)) {
            merged = { ...merged, ...d };
          }
        }

        if (Object.keys(merged).length > 3) {
          usedVersion = version;
          break;
        }
      } catch (e) {
        console.error(`VIN ${version} error:`, e);
      }
    }

    if (Object.keys(merged).length === 0) {
      return NextResponse.json(
        { error: "No se pudo decodificar el bastidor. Verifica que el VIN es correcto." },
        { status: 400 }
      );
    }

    const d = merged;

    // Extraer modelo del año (puede ser array [1986,2016] o string)
    let anyoModelo = "";
    const my = d.modelYear || d.model_year || d.ModelYear || d.year || d.model_year_from || "";
    if (Array.isArray(my)) {
      anyoModelo = my.length > 1 ? String(my[my.length - 1]) : String(my[0]);
    } else if (my) {
      anyoModelo = String(my);
    }

    const vehiculo = {
      vin: d.vin || d.VIN || vinClean,
      marca: d.manufacturer || d.make || d.Make || d.marque || d.brand || d.mfrName || "",
      modelo: d.model || d.Model || d.modele || d.modele_en || d.modelName || "",
      version: d.version || d.trim || d.Trim || d.variant || d.subModel || d.series || "",
      motor: d.engine_code || d.engineCode || d.code_moteur || d.Engine || d.engineType || d.engine || "",
      combustible: d.fuel_type || d.fuelType || d.fuel || d.energieNGC || d.type_moteur || d.FuelType || d.fuelTypePrimary || "",
      potencia_kw: d.power_kw || d.powerKw || d.puisFiscReelKW || d.kw || d.enginePowerKw || "",
      potencia_cv: d.power_hp || d.powerHp || d.power_ps || d.puisFiscReelCH || d.hp || d.cv || d.horsepower || d.enginePowerHp || "",
      cilindrada: d.displacement || d.Displacement || d.ccm || d.engine_displacement || d.capacity || d.engineDisplacement || d.DisplacementCC || "",
      cilindros: d.cylinders || d.Cylinders || d.cylindres || d.number_of_cylinders || d.numberOfCylinders || "",
      transmision: d.drive_type || d.driveType || d.type_transmission || d.drive || d.DriveType || "",
      caja_cambios: normalizarCaja(d.transmission || d.Transmission || d.gearbox || d.boite_vitesse || d.transmissionStyle || ""),
      carroceria: d.body_type || d.bodyType || d.body || d.body_class || d.bodyClass || d.BodyClass || d.carrosserie || "",
      color: d.color || d.Color || d.colour || d.couleur || d.exteriorColor || "",
      puertas: d.doors || d.Doors || d.nb_portes || d.number_of_doors || d.numberOfDoors || "",
      plazas: d.seats || d.Seats || d.nr_passagers || d.number_of_seats || d.numberOfSeats || "",
      peso: d.weight || d.Weight || d.poids || d.curb_weight || d.curbWeight || "",
      co2: formatCO2(d.co2 || d.CO2 || d.co2_emission || ""),
      anyo_modelo: anyoModelo,
      tipo_vehiculo: d.vehicle_type || d.vehicleType || "",
      region: d.region || "",
      pais: d.country || d.Country || d.pays || d.market || d.PlantCountry || d.manufactured_in || "",
      fabricante_nombre: d.manufacturer_name || d.manufacturerName || "",
      placa: d.plate || d.Plate || d.plaque || d.license_plate || "",
      logo_marca: d.logo || d.logo_marque || d.manufacturer_logo || d.makeLogo || "",
      foto_modelo: d.image || d.photo || d.photo_modele || d.vehicle_image || d.modelImage || "",
      tecdoc_car_id: d.tecdoc_car_id || d.tecdocCarId || d.k_type || d.ktype || d.ktypnr || d.kType || "",
      tecdoc_manu_id: d.tecdoc_manu_id || d.tecdocManuId || d.manufacturer_id || "",
      tecdoc_model_id: d.tecdoc_model_id || d.tecdocModelId || d.model_id || "",
      pneus: extraerArray(d, ["tires", "pneus", "tyres", "Tires"]),
    };

    return NextResponse.json(vehiculo);
  } catch (err) {
    console.error("Error VIN Decoder:", err);
    return NextResponse.json({ error: "Error de conexión con el decodificador de bastidor" }, { status: 500 });
  }
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
  const s = String(val);
  return s.includes("g/km") ? s : `${s} g/km`;
}
