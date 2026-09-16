import { NextRequest, NextResponse } from "next/server";

const VIN_API_HOST = "vin-decoder-mega-api.p.rapidapi.com";
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
    const res = await fetch(`https://${VIN_API_HOST}/vin.php`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "x-rapidapi-host": VIN_API_HOST,
        "x-rapidapi-key": RAPIDAPI_KEY,
      },
      body: `vin=${encodeURIComponent(vinClean)}`,
    });

    const json = await res.json();

    if (!res.ok || json.code_erreur !== 200 || json.data?.erreur) {
      return NextResponse.json(
        { error: json.data?.erreur || json.message || "Error al decodificar el bastidor" },
        { status: res.ok ? 400 : res.status }
      );
    }

    const d = json.data;

    const vehiculo = {
      vin: d.vin || vinClean,
      marca: d.marque || "",
      modelo: d.modele_en || d.modele || "",
      version: d.version || "",
      motor: d.code_moteur || "",
      combustible: d.energieNGC || d.type_moteur || "",
      potencia_kw: d.puisFiscReelKW || "",
      potencia_cv: d.puisFiscReelCH || "",
      cilindrada: d.ccm || "",
      cilindros: d.cylindres || "",
      transmision: d.type_transmission || "",
      caja_cambios: d.boite_vitesse === "M" ? "Manual" : d.boite_vitesse === "A" ? "Automática" : d.boite_vitesse || "",
      carroceria: d.carrosserie || "",
      color: d.couleur || "",
      puertas: d.nb_portes || "",
      plazas: d.nr_passagers || "",
      peso: d.poids || "",
      co2: d.co2 ? `${d.co2} g/km` : "",
      fecha_inicio_modelo: d.debut_modele || "",
      fecha_primera_matriculacion: d.date1erCir_fr || "",
      pais: d.pays || "",
      placa: d.plaque || "",
      logo_marca: d.logo_marque || "",
      foto_modelo: d.photo_modele || "",
      tecdoc_car_id: d.tecdoc_car_id || d.k_type || "",
      tecdoc_manu_id: d.tecdoc_manu_id || "",
      tecdoc_model_id: d.tecdoc_model_id || "",
      pneus: d.pneus || [],
    };

    return NextResponse.json(vehiculo);
  } catch (err) {
    console.error("Error VIN Decoder:", err);
    return NextResponse.json({ error: "Error de conexión con el decodificador de bastidor" }, { status: 500 });
  }
}
