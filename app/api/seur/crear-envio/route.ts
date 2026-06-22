// app/api/seur/crear-envio/route.ts
import { createClient } from "@supabase/supabase-js";

let cachedToken: string | null = null;
let tokenExpiresAt: number = 0;

async function getSeurToken(): Promise<string> {
  const ahora = Date.now();
  if (cachedToken && ahora < tokenExpiresAt - 300_000) return cachedToken;
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
  if (!res.ok) throw new Error(`SEUR token error ${res.status}: ${await res.text()}`);
  const data = await res.json();
  cachedToken = data.access_token;
  tokenExpiresAt = ahora + (data.expires_in || 7200) * 1000;
  return cachedToken!;
}

function calcularFechaRecogida(): string {
  const testMode = process.env.SEUR_TEST_MODE === "true";
  const fecha = new Date();
  if (testMode) {
    fecha.setDate(fecha.getDate() + 14);
  } else {
    fecha.setDate(fecha.getDate() + 1);
    while (fecha.getDay() === 0 || fecha.getDay() === 6) {
      fecha.setDate(fecha.getDate() + 1);
    }
  }
  return fecha.toISOString().split("T")[0];
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

    const parcels = Array.from({ length: numBultos }, (_, i) => ({
      weight: Math.max(1, Math.ceil(pesoKg / numBultos)),
      width: 30,
      height: 20,
      length: 40,
      packReference: String(i + 1),
    }));

    const seurBody = {
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
          cityName: (remitentePoblacion || "").toUpperCase(),
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
          cityName: (destinatarioPoblacion || "").toUpperCase(),
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
      body: JSON.stringify(seurBody),
    });

    const rawText = await res.text();
    console.log("SEUR crear recogida:", rawText.substring(0, 500));

    if (!res.ok) {
      return Response.json({ ok: false, error: `SEUR error ${res.status}`, rawResponse: rawText }, { status: 400 });
    }

    const responseJson = JSON.parse(rawText);
    // SEUR devuelve { data: { collectionRef, fRec, reference, ecbs, parcelNumbers } }
    const seurData = responseJson.data || responseJson;
    const collectionRef: string = seurData.collectionRef || seurData.code || "";
    const parcelNumbers: string[] = seurData.parcelNumbers || seurData.ecbs || [];
    const tracking = parcelNumbers[0] || collectionRef;

    if (!collectionRef) {
      return Response.json({ ok: false, error: "SEUR no devolvió localizador", rawResponse: rawText }, { status: 400 });
    }

    // Pedir etiqueta PDF
    let etiquetaSeurUrl: string | null = null;
    let etiquetaPdfBase64: string | null = null;

    try {
      const labelRes = await fetch(
        `https://servicios.api.seur.io/pic/v1/labels?code=${collectionRef}&type=PDF&entity=COLLECTIONS&templateType=NORMAL`,
        { headers: { "Authorization": `Bearer ${token}` } }
      );
      if (labelRes.ok) {
        const labelJson = await labelRes.json();
        const primerBulto = Array.isArray(labelJson) ? labelJson[0] : (labelJson?.data?.[0] || labelJson);
        etiquetaPdfBase64 = primerBulto?.pdf || null;

        if (etiquetaPdfBase64 && pedidoCodigo) {
          const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
          );
          const pdfBuffer = Buffer.from(etiquetaPdfBase64, "base64");
          const etiquetaPath = `documentos/${pedidoCodigo}/etiqueta-seur-${pedidoCodigo}.pdf`;
          await supabase.storage.from("FACTURAS").upload(etiquetaPath, pdfBuffer, {
            contentType: "application/pdf", upsert: true,
          });
          const { data: urlData } = supabase.storage.from("FACTURAS").getPublicUrl(etiquetaPath);
          etiquetaSeurUrl = urlData.publicUrl;
          if (pedidoId) {
            await supabase.from("pedidos").update({ etiqueta_seur_url: etiquetaSeurUrl }).eq("id", pedidoId);
          }
        }
      } else {
        console.error("SEUR etiqueta error:", await labelRes.text());
      }
    } catch (labelErr) {
      console.error("Error etiqueta SEUR:", labelErr);
    }

    return Response.json({
      ok: true,
      collectionRef,
      tracking,
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