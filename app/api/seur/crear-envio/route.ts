// app/api/seur/crear-envio/route.ts
// Crea una recogida en SEUR via API PIC REST
// IMPORTANTE: SEUR es entorno de PRODUCCIÓN real.
// El campo collectionDate se calcula automáticamente.
// Las variables SEUR_TEST_MODE=true en Vercel ponen fecha +30 días (para pruebas).

import { createClient } from "@supabase/supabase-js";

// ── Cache del token en memoria (se reutiliza mientras sea válido) ─────────────
let cachedToken: string | null = null;
let tokenExpiresAt: number = 0;

async function getSeurToken(): Promise<string> {
  const ahora = Date.now();
  // Si el token sigue vigente (con 5 min de margen) lo reutilizamos
  if (cachedToken && ahora < tokenExpiresAt - 300_000) {
    return cachedToken;
  }

  const params = new URLSearchParams({
    grant_type: "password",
    client_id: process.env.SEUR_CLIENT_ID || "",
    client_secret: process.env.SEUR_CLIENT_SECRET || "",
    username: process.env.SEUR_USERNAME || "",
    password: process.env.SEUR_PASSWORD || "",
  });

  const res = await fetch("https://servicios.api.seur.io/pic_token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`SEUR token error ${res.status}: ${err}`);
  }

  const data = await res.json();
  cachedToken = data.access_token;
  // expires_in en segundos → convertir a ms
  tokenExpiresAt = ahora + (data.expires_in || 7200) * 1000;
  return cachedToken!;
}

// ── Calcular fecha de recogida ────────────────────────────────────────────────
function calcularFechaRecogida(): string {
  const testMode = process.env.SEUR_TEST_MODE === "true";
  const fecha = new Date();
  // En modo test ponemos +30 días para no generar recogidas reales
  // En producción usamos el siguiente día hábil
  if (testMode) {
    fecha.setDate(fecha.getDate() + 30);
  } else {
    // Siguiente día hábil (lunes-viernes)
    fecha.setDate(fecha.getDate() + 1);
    while (fecha.getDay() === 0 || fecha.getDay() === 6) {
      fecha.setDate(fecha.getDate() + 1);
    }
  }
  return fecha.toISOString().split("T")[0]; // YYYY-MM-DD
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      pedidoId,
      pedidoCodigo,
      remitenteNombre,
      remitenteCif,
      remitenteDireccion,
      remitenteCodigoPostal,
      remitentePoblacion,
      remitenteTelefono,
      remitenteEmail,
      destinatarioNombre,
      destinatarioDireccion,
      destinatarioCodigoPostal,
      destinatarioPoblacion,
      destinatarioTelefono,
      destinatarioEmail,
      pesoKg = 1,
      numBultos = 1,
      observaciones = "",
    } = body;

    if (!remitenteNombre || !remitenteDireccion || !remitenteCodigoPostal ||
        !destinatarioNombre || !destinatarioDireccion || !destinatarioCodigoPostal) {
      return Response.json({ ok: false, error: "Faltan datos obligatorios" }, { status: 400 });
    }

    const token = await getSeurToken();
    const collectionDate = calcularFechaRecogida();

    // Construir bultos — un bulto por defecto, varios si numBultos > 1
    const parcels = Array.from({ length: numBultos }, (_, i) => ({
      weight: Math.max(1, Math.ceil(pesoKg / numBultos)),
      width: 30,
      height: 20,
      length: 40,
      packReference: String(i + 1),
    }));

    const payload = {
      serviceCode: 1,
      productCode: 2,
      ref: pedidoCodigo || pedidoId || `RD-${Date.now()}`,
      label: true,
      collectionDate,
      payer: "ORD",
      customer: {
        accountNumber: process.env.SEUR_ACCOUNT_NUMBER || "13087-30",
        name: process.env.SEUR_CUSTOMER_NAME || "VICENTE DE PACO CABEZA",
        idNumber: process.env.SEUR_CUSTOMER_ID || "77856096S",
        email: process.env.SEUR_CUSTOMER_EMAIL || "vicente@rgranvia.es",
      },
      sender: {
        name: remitenteNombre.toUpperCase(),
        idNumber: remitenteCif || "",
        phone: (remitenteTelefono || "").replace(/\s/g, ""),
        email: remitenteEmail || "",
        contactName: remitenteNombre.toUpperCase(),
        address: {
          streetName: remitenteDireccion.toUpperCase(),
          cityName: remitentePoblacion?.toUpperCase() || "",
          postalCode: remitenteCodigoPostal,
          country: "ES",
        },
      },
      receiver: {
        name: destinatarioNombre.toUpperCase(),
        idNumber: "",
        phone: (destinatarioTelefono || "").replace(/\s/g, ""),
        contactName: destinatarioNombre.toUpperCase(),
        email: destinatarioEmail || "",
        address: {
          streetName: destinatarioDireccion.toUpperCase(),
          cityName: destinatarioPoblacion?.toUpperCase() || "",
          postalCode: destinatarioCodigoPostal,
          country: "ES",
        },
      },
      restrictions: [{
        scheduleMorningTimeSlotFrom: "09:00:00",
        scheduleMorningTimeSlotTo: "13:00:00",
        scheduleEveningTimeSlotFrom: "16:00:00",
        scheduleEveningTimeSlotTo: "18:30:00",
      }],
      parcels,
      observations: observaciones || pedidoCodigo || "",
    };

    const res = await fetch("https://servicios.api.seur.io/pic/v1/collections", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    const rawText = await res.text();
    console.log("SEUR crear recogida response:", rawText.substring(0, 500));

    if (!res.ok) {
      return Response.json({
        ok: false,
        error: `SEUR error ${res.status}`,
        rawResponse: rawText,
      }, { status: 400 });
    }

    const data = JSON.parse(rawText);
    const collectionRef = data.collectionRef || data.code || null;

    if (!collectionRef) {
      return Response.json({
        ok: false,
        error: "SEUR no devolvió localizador de recogida",
        rawResponse: rawText,
      }, { status: 400 });
    }

    // Pedir etiqueta PDF inmediatamente
    let etiquetaPdfBase64: string | null = null;
    let etiquetaSeurUrl: string | null = null;

    try {
      const labelRes = await fetch(
        `https://servicios.api.seur.io/pic/v1/labels?code=${collectionRef}&type=PDF&entity=COLLECTIONS&templateType=NORMAL`,
        { headers: { "Authorization": `Bearer ${token}` } }
      );

      if (labelRes.ok) {
        const labelData = await labelRes.json();
        // La etiqueta viene en el array de bultos, campo pdf
        const primerBulto = labelData?.[0] || labelData?.parcels?.[0] || labelData;
        etiquetaPdfBase64 = primerBulto?.pdf || labelData?.pdf || null;

        // Guardar en Supabase Storage si tenemos el base64 y el pedidoId
        if (etiquetaPdfBase64 && pedidoCodigo) {
          try {
            const supabase = createClient(
              process.env.NEXT_PUBLIC_SUPABASE_URL!,
              process.env.SUPABASE_SERVICE_ROLE_KEY!
            );
            const pdfBuffer = Buffer.from(etiquetaPdfBase64, "base64");
            const etiquetaPath = `documentos/${pedidoCodigo}/etiqueta-seur-${pedidoCodigo}.pdf`;
            await supabase.storage.from("FACTURAS").upload(etiquetaPath, pdfBuffer, {
              contentType: "application/pdf",
              upsert: true,
            });
            const { data: urlData } = supabase.storage.from("FACTURAS").getPublicUrl(etiquetaPath);
            etiquetaSeurUrl = urlData.publicUrl;

            if (pedidoId) {
              await supabase.from("pedidos")
                .update({ etiqueta_seur_url: etiquetaSeurUrl })
                .eq("id", pedidoId);
            }
          } catch (storageErr) {
            console.error("Error guardando etiqueta SEUR en Storage:", storageErr);
          }
        }
      } else {
        console.error("SEUR etiqueta error:", await labelRes.text());
      }
    } catch (labelErr) {
      console.error("Error pidiendo etiqueta SEUR:", labelErr);
    }

    // Extraer parcelNumbers (códigos de seguimiento)
    const parcelNumbers = data.parcelNumbers || data.ecbs || [];
    const tracking = parcelNumbers[0] || collectionRef;

    return Response.json({
      ok: true,
      collectionRef,    // REC000XXXXXXXXX — localizador principal
      tracking,         // código de seguimiento para el cliente
      collectionDate,
      etiquetaSeurUrl,
      etiquetaPdfBase64,
      rawResponse: rawText,
    });

  } catch (error) {
    console.error("Error SEUR crear-envio:", error);
    return Response.json({ ok: false, error: String(error) }, { status: 500 });
  }
}