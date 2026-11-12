// app/api/dhl/crear-envio/route.ts
import { NextRequest, NextResponse } from "next/server";
import {
  sbAdmin, cargarDatosEnvio, tieneEnvio, guardarPedido, subirEtiqueta,
  anotar, incidencia, fetchT, txt,
} from "@/app/lib/envios";

const supabase = sbAdmin();

const DHL_USER = process.env.DHL_USER!;
const DHL_KEY = process.env.DHL_KEY!;
const DHL_CUSTOMER = process.env.DHL_CUSTOMER!;
const DHL_BASE = "https://external.dhl.es/cimapi/api/v1/customer";

async function getToken(): Promise<string | null> {
  try {
    const res = await fetchT(`${DHL_BASE}/authenticate`, {
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

export async function POST(req: NextRequest) {
  let pedidoId: unknown = null;
  let codigo = "";
  try {
    const reqBody = await req.json();
    pedidoId = reqBody?.pedidoId;
    if (!pedidoId) return NextResponse.json({ ok: false, error: "pedidoId requerido" }, { status: 400 });

    const r = await cargarDatosEnvio(supabase, pedidoId, reqBody);
    if (!r.ok) {
      if (r.status !== 404) await incidencia(supabase, pedidoId, "", "DHL", r.error);
      return NextResponse.json({ ok: false, error: r.error }, { status: r.status });
    }
    const { pedido, remitente, destinatario, pesoKg, avisos } = r.datos;
    codigo = r.datos.codigo;

    // ── El pedido ya tiene envío DHL: no se duplica
    if (tieneEnvio(pedido, "dhl", pedido.tracking_dhl)) {
      const trackingNumber = txt(pedido.tracking_dhl) || txt(pedido.tracking);
      return NextResponse.json({
        ok: true, yaExistia: true, trackingNumber, lp: null,
        etiquetaUrl: txt(pedido.etiqueta_envio_url) || null,
        trackingUrl: `https://www.dhlparcel.es/es/envio/${trackingNumber}`,
      });
    }

    const kilos = Math.max(1, Math.ceil(pesoKg));

    // Obtener token
    const token = await getToken();
    if (!token) {
      await incidencia(supabase, pedidoId, codigo, "DHL", "Error de autenticación con DHL (no se obtuvo token)");
      return NextResponse.json({ ok: false, error: "Error autenticación DHL" }, { status: 500 });
    }

    // Crear envío
    const body = {
      Customer: DHL_CUSTOMER,
      Receiver: {
        Name: destinatario.nombre.substring(0, 40),
        Address: destinatario.direccion.substring(0, 80),
        City: destinatario.poblacion.substring(0, 20),
        PostalCode: destinatario.cp,
        Country: "ES",
        Phone: destinatario.telefono,
        Email: (destinatario.email || "info@recambio-directo.com").substring(0, 50),
      },
      Sender: {
        Name: remitente.nombre.substring(0, 40),
        Address: remitente.direccion.substring(0, 40),
        City: remitente.poblacion.substring(0, 20),
        PostalCode: remitente.cp,
        Country: "ES",
        Phone: remitente.telefono,
        Email: remitente.email.substring(0, 50),
      },
      Reference: codigo,
      Quantity: 1,
      Weight: kilos,
      WeightVolume: 0,
      CODAmount: 0,
      CODExpenses: "P",
      CODCurrency: "EUR",
      InsuranceAmount: 0,
      InsuranceExpenses: "P",
      InsuranceCurrency: "EUR",
      DeliveryNote: "",
      Remarks1: `Pedido ${codigo}`,
      Remarks2: "",
      Incoterms: "CPT",
      ContactName: "",
      GoodsDescription: "",
      CustomsValue: 0,
      CustomsCurrency: "",
      Format: "PDF",
      Product: "B2B",
    };

    const shipRes = await fetchT(`${DHL_BASE}/shipment`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "accept": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    const shipRaw = await shipRes.text();
    let shipData: any = null;
    try { shipData = JSON.parse(shipRaw); } catch { shipData = null; }

    if (!shipRes.ok || !shipData?.Tracking) {
      const motivo = shipData?.Message || "Error DHL";
      await incidencia(supabase, pedidoId, codigo, "DHL", `DHL rechazó el envío (HTTP ${shipRes.status}): ${motivo}`, shipRaw.substring(0, 600));
      return NextResponse.json({ ok: false, error: motivo, dhlError: shipData }, { status: 500 });
    }

    const trackingNumber = txt(shipData.Tracking);

    // Guardar tracking en pedido
    const g1 = await guardarPedido(supabase, pedidoId, {
      tracking_dhl: trackingNumber,
      tracking: trackingNumber,
      estado_envio: "preparando",
      agencia: "DHL",
    });
    await anotar(supabase, pedidoId, `DHL OK — Envío ${trackingNumber} — ${kilos} kg${avisos.length ? " — Avisos: " + avisos.join("; ") : ""}`);
    if (g1.error) await incidencia(supabase, pedidoId, codigo, "DHL", `Envío ${trackingNumber} creado en DHL pero NO se pudo guardar en el pedido`, g1.error);

    // Convertir etiqueta base64 a URL guardada en Storage
    let etiquetaUrl: string | null = null;
    if (shipData.Label) {
      try {
        etiquetaUrl = await subirEtiqueta(
          supabase,
          `documentos/dhl-${codigo}/etiqueta-dhl.pdf`,
          Buffer.from(String(shipData.Label), "base64")
        );
      } catch (e) {
        console.error("Error guardando etiqueta DHL:", e);
      }
    }
    if (etiquetaUrl) {
      const g2 = await guardarPedido(supabase, pedidoId, { etiqueta_dhl_url: etiquetaUrl, etiqueta_envio_url: etiquetaUrl });
      if (g2.error) await incidencia(supabase, pedidoId, codigo, "DHL", `Etiqueta del envío ${trackingNumber} generada pero no guardada en el pedido`, `${g2.error} — ${etiquetaUrl}`);
    } else {
      await incidencia(supabase, pedidoId, codigo, "DHL", `Envío ${trackingNumber} creado pero DHL no devolvió la etiqueta`);
    }

    const trackingUrl = `https://www.dhlparcel.es/es/envio/${trackingNumber}`;

    return NextResponse.json({
      ok: true,
      trackingNumber,
      lp: shipData.LP?.[0] || null,
      etiquetaUrl,
      trackingUrl,
    });

  } catch (e: any) {
    console.error("Error DHL crear-envio:", e);
    await incidencia(supabase, pedidoId, codigo, "DHL", "Error inesperado al crear el envío", String(e?.message || e));
    return NextResponse.json({ ok: false, error: e?.message || String(e) }, { status: 500 });
  }
}
