// app/api/seur/crear-envio/route.ts
// Dos usos:
//  · Pedido normal (pedidoId): los datos se leen del pedido en Supabase.
//  · Devoluciones (pedidoId 0): se usan los datos que llegan en la petición.
import {
  sbAdmin, cargarDatosEnvio, tieneEnvio, guardarPedido, subirEtiqueta,
  anotar, incidencia, fetchT, esperar, txt, telefono9, cp5,
} from "@/app/lib/envios";

const supabase = sbAdmin();

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
  const res = await fetchT("https://servicios.api.seur.io/pic_token", {
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

// Pide la etiqueta PDF de la recogida, con reintentos (SEUR puede tardar unos
// segundos en tenerla disponible). Devuelve el PDF en base64 o null.
async function pedirEtiquetaSEUR(token: string, collectionRef: string): Promise<string | null> {
  for (let intento = 1; intento <= 3; intento++) {
    try {
      const labelRes = await fetchT(
        `https://servicios.api.seur.io/pic/v1/labels?code=${encodeURIComponent(collectionRef)}&type=PDF&entity=COLLECTIONS&templateType=NORMAL`,
        { headers: { "Authorization": `Bearer ${token}` } },
        8000
      );
      if (labelRes.ok) {
        const labelJson = await labelRes.json();
        const primerBulto = Array.isArray(labelJson) ? labelJson[0] : (labelJson?.data?.[0] || labelJson);
        const pdf = primerBulto?.pdf || null;
        if (pdf) return String(pdf);
        console.error(`SEUR etiqueta sin PDF (intento ${intento})`);
      } else {
        console.error(`SEUR etiqueta error (intento ${intento}):`, labelRes.status, await labelRes.text().catch(() => ""));
      }
    } catch (labelErr) {
      console.error(`Error etiqueta SEUR (intento ${intento}):`, labelErr);
    }
    if (intento < 3) await esperar(1500);
  }
  return null;
}

export async function POST(request: Request) {
  let pedidoId: unknown = null;
  let codigo = "";
  try {
    const body = await request.json();
    pedidoId = body?.pedidoId || null;
    const numBultos = Number(body?.numBultos) > 0 ? Math.floor(Number(body.numBultos)) : 1;
    const observaciones = txt(body?.observaciones);

    let pedidoCodigo = txt(body?.pedidoCodigo);
    let pesoKg = Number(body?.pesoKg) > 0 ? Number(body.pesoKg) : 1;
    let avisos: string[] = [];
    let rem = {
      nombre: txt(body?.remitenteNombre), cif: txt(body?.remitenteCif), direccion: txt(body?.remitenteDireccion),
      cp: cp5(body?.remitenteCodigoPostal), poblacion: txt(body?.remitentePoblacion),
      telefono: telefono9(body?.remitenteTelefono), email: txt(body?.remitenteEmail),
    };
    let dest = {
      nombre: txt(body?.destinatarioNombre), direccion: txt(body?.destinatarioDireccion),
      cp: cp5(body?.destinatarioCodigoPostal), poblacion: txt(body?.destinatarioPoblacion),
      telefono: telefono9(body?.destinatarioTelefono), email: txt(body?.destinatarioEmail),
    };

    if (pedidoId) {
      // ── Pedido normal: datos desde Supabase
      const r = await cargarDatosEnvio(supabase, pedidoId, body);
      if (!r.ok) {
        if (r.status !== 404) await incidencia(supabase, pedidoId, "", "SEUR", r.error);
        return Response.json({ ok: false, error: r.error }, { status: r.status });
      }
      const d = r.datos;
      codigo = d.codigo;
      pedidoCodigo = d.codigo;
      pesoKg = d.pesoKg;
      avisos = d.avisos;
      rem = { nombre: d.remitente.nombre, cif: d.remitente.cif, direccion: d.remitente.direccion, cp: d.remitente.cp, poblacion: d.remitente.poblacion, telefono: d.remitente.telefono, email: d.remitente.email };
      dest = { nombre: d.destinatario.nombre, direccion: d.destinatario.direccion, cp: d.destinatario.cp, poblacion: d.destinatario.poblacion, telefono: d.destinatario.telefono, email: d.destinatario.email };

      // El pedido ya tiene envío SEUR: no se duplica. Si falta la etiqueta, se reintenta.
      if (tieneEnvio(d.pedido, "seur", d.pedido.tracking_seur)) {
        const collectionRef = txt(d.pedido.collection_ref_seur);
        const tracking = txt(d.pedido.tracking_seur) || txt(d.pedido.tracking);
        let etiquetaSeurUrl: string | null = txt(d.pedido.etiqueta_seur_url) || null;
        if (!etiquetaSeurUrl && collectionRef) {
          const pdf = await pedirEtiquetaSEUR(await getSeurToken(), collectionRef);
          if (pdf) {
            etiquetaSeurUrl = await subirEtiqueta(supabase, `documentos/${pedidoCodigo}/etiqueta-seur-${pedidoCodigo}.pdf`, Buffer.from(pdf, "base64"));
            if (etiquetaSeurUrl) await guardarPedido(supabase, pedidoId, { etiqueta_seur_url: etiquetaSeurUrl });
          }
        }
        return Response.json({
          ok: true, yaExistia: true, collectionRef: collectionRef || tracking, tracking,
          etiquetaSeurUrl, etiquetaUrl: etiquetaSeurUrl, etiquetaPdfBase64: null,
        });
      }
    } else if (!rem.nombre || !rem.direccion || !rem.cp || !dest.nombre || !dest.direccion || !dest.cp) {
      return Response.json({ ok: false, error: "Faltan datos obligatorios" }, { status: 400 });
    }

    const cuenta = {
      accountNumber: process.env.SEUR_ACCOUNT_NUMBER || "",
      name: process.env.SEUR_CUSTOMER_NAME || "",
      idNumber: process.env.SEUR_CUSTOMER_ID || "",
      email: process.env.SEUR_CUSTOMER_EMAIL || "",
    };
    if (!cuenta.accountNumber || !cuenta.name || !cuenta.idNumber) {
      await incidencia(supabase, pedidoId, codigo, "SEUR", "Faltan variables de entorno de la cuenta SEUR en Vercel (SEUR_ACCOUNT_NUMBER / SEUR_CUSTOMER_NAME / SEUR_CUSTOMER_ID)");
      return Response.json({ ok: false, error: "SEUR no está configurado (datos de cuenta)" }, { status: 500 });
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
      ref: pedidoCodigo || `RD-${Date.now()}`,
      label: true,
      collectionDate,
      payer: "ORD",
      customer: cuenta,
      sender: {
        name: rem.nombre.toUpperCase(),
        idNumber: rem.cif || "",
        phone: rem.telefono,
        email: rem.email || "",
        contactName: rem.nombre.toUpperCase(),
        address: {
          streetName: rem.direccion.toUpperCase(),
          cityName: rem.poblacion.toUpperCase(),
          postalCode: rem.cp,
          country: "ES",
        },
      },
      receiver: {
        name: dest.nombre.toUpperCase(),
        idNumber: "",
        phone: dest.telefono,
        contactName: dest.nombre.toUpperCase(),
        email: dest.email || "",
        address: {
          streetName: dest.direccion.toUpperCase(),
          cityName: dest.poblacion.toUpperCase(),
          postalCode: dest.cp,
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

    const res = await fetchT("https://servicios.api.seur.io/pic/v1/collections", {
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
      await incidencia(supabase, pedidoId, codigo, "SEUR", `SEUR rechazó la recogida (HTTP ${res.status})`, rawText.substring(0, 600));
      return Response.json({ ok: false, error: `SEUR error ${res.status}`, rawResponse: rawText.substring(0, 2000) }, { status: 400 });
    }

    let responseJson: any = null;
    try { responseJson = JSON.parse(rawText); } catch { responseJson = null; }
    // SEUR devuelve { data: { collectionRef, fRec, reference, ecbs, parcelNumbers } }
    const seurData = responseJson?.data || responseJson || {};
    const collectionRef: string = txt(seurData.collectionRef || seurData.code);
    const parcelNumbers: string[] = seurData.parcelNumbers || seurData.ecbs || [];
    const tracking = txt(parcelNumbers[0]) || collectionRef;

    if (!collectionRef) {
      await incidencia(supabase, pedidoId, codigo, "SEUR", "SEUR no devolvió localizador", rawText.substring(0, 600));
      return Response.json({ ok: false, error: "SEUR no devolvió localizador", rawResponse: rawText.substring(0, 2000) }, { status: 400 });
    }

    // Guardar tracking, collection_ref, estado y agencia en pedido
    if (pedidoId) {
      const g1 = await guardarPedido(supabase, pedidoId, {
        tracking: tracking,
        tracking_seur: tracking,
        collection_ref_seur: collectionRef,
        estado_envio: "preparando",
        agencia: "SEUR",
      });
      await anotar(supabase, pedidoId, `SEUR OK — Recogida ${collectionRef} — Envío ${tracking} — Fecha ${collectionDate}${avisos.length ? " — Avisos: " + avisos.join("; ") : ""}`);
      if (g1.error) await incidencia(supabase, pedidoId, codigo, "SEUR", `Recogida ${collectionRef} creada en SEUR pero NO se pudo guardar en el pedido`, g1.error);
    }

    // Pedir etiqueta PDF
    let etiquetaSeurUrl: string | null = null;
    const etiquetaPdfBase64 = await pedirEtiquetaSEUR(token, collectionRef);

    if (etiquetaPdfBase64 && pedidoCodigo) {
      etiquetaSeurUrl = await subirEtiqueta(
        supabase,
        `documentos/${pedidoCodigo}/etiqueta-seur-${pedidoCodigo}.pdf`,
        Buffer.from(etiquetaPdfBase64, "base64")
      );
      if (etiquetaSeurUrl && pedidoId) {
        const g2 = await guardarPedido(supabase, pedidoId, { etiqueta_seur_url: etiquetaSeurUrl });
        if (g2.error) await incidencia(supabase, pedidoId, codigo, "SEUR", `Etiqueta de la recogida ${collectionRef} generada pero no guardada en el pedido`, `${g2.error} — ${etiquetaSeurUrl}`);
      }
    }
    if (!etiquetaSeurUrl && pedidoId) {
      await incidencia(supabase, pedidoId, codigo, "SEUR", `Recogida ${collectionRef} creada pero SEUR no devolvió la etiqueta tras 3 intentos`);
    }

    return Response.json({
      ok: true,
      collectionRef,
      tracking,
      collectionDate,
      etiquetaSeurUrl,
      etiquetaUrl: etiquetaSeurUrl, // lo lee el módulo de devoluciones
      etiquetaPdfBase64,
    });

  } catch (error) {
    console.error("Error SEUR crear-envio:", error);
    await incidencia(supabase, pedidoId, codigo, "SEUR", "Error inesperado al crear la recogida", String(error));
    return Response.json({ ok: false, error: String(error) }, { status: 500 });
  }
}
