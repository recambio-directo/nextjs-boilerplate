import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const DHL_USER = process.env.DHL_USER!;
const DHL_KEY = process.env.DHL_KEY!;
const DHL_CUSTOMER = process.env.DHL_CUSTOMER!;
const DHL_BASE = "https://external.dhl.es/cimapi/api/v1/customer";

async function getToken(): Promise<string | null> {
  try {
    const res = await fetch(`${DHL_BASE}/authenticate`, {
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
  try {
    const { pedidoId } = await req.json();
    if (!pedidoId) return NextResponse.json({ ok: false, error: "pedidoId requerido" }, { status: 400 });

    // Cargar pedido
    const { data: pedido } = await supabase.from("pedidos").select("*").eq("id", pedidoId).single();
    if (!pedido) return NextResponse.json({ ok: false, error: "Pedido no encontrado" }, { status: 404 });

    // Cargar datos del proveedor (remitente)
    const productos = pedido.productos || [];
    const proveedorId = productos[0]?.proveedor_id;
    if (!proveedorId) return NextResponse.json({ ok: false, error: "Sin proveedor" }, { status: 400 });

    const { data: prov } = await supabase.from("usuarios").select("nombre_empresa, direccion, ciudad, codigo_postal, telefono, email").eq("id", proveedorId).single();
    if (!prov) return NextResponse.json({ ok: false, error: "Proveedor no encontrado" }, { status: 404 });

    // Cargar datos del taller (destinatario)
    const { data: taller } = await supabase.from("usuarios").select("nombre_empresa, direccion, ciudad, codigo_postal, telefono, email").eq("id", pedido.cliente_id).single();

    // Parsear dirección del taller desde pedido si no tenemos perfil
    const destNombre = taller?.nombre_empresa || pedido.cliente_nombre || pedido.cliente_email || "Cliente";
    const destDireccion = taller?.direccion || pedido.direccion?.split(",")[0] || "Sin dirección";
    const destCiudad = taller?.ciudad || pedido.direccion?.split(",")[1]?.trim() || "Sin ciudad";
    const destCP = taller?.codigo_postal || "28001";
    const destTelefono = taller?.telefono || pedido.cliente_telefono || "600000000";
    const destEmail = pedido.cliente_email || taller?.email || "info@recambio-directo.com";

    // Peso estimado
    const pesoKg = Math.max(1, productos.length * 2);

    // Obtener token
    const token = await getToken();
    if (!token) return NextResponse.json({ ok: false, error: "Error autenticación DHL" }, { status: 500 });

    // Crear envío
    const body = {
      Customer: DHL_CUSTOMER,
      Receiver: {
        Name: destNombre.substring(0, 40),
        Address: destDireccion.substring(0, 80),
        City: destCiudad.substring(0, 20),
        PostalCode: destCP.substring(0, 5),
        Country: "ES",
        Phone: destTelefono.replace(/\s/g, "").substring(0, 15),
        Email: destEmail.substring(0, 50),
      },
      Sender: {
        Name: (prov.nombre_empresa || "Proveedor").substring(0, 40),
        Address: (prov.direccion || "Sin dirección").substring(0, 40),
        City: (prov.ciudad || "Sin ciudad").substring(0, 20),
        PostalCode: (prov.codigo_postal || "30000").substring(0, 5),
        Country: "ES",
        Phone: (prov.telefono || "600000000").replace(/\s/g, "").substring(0, 9),
        Email: (prov.email || "").substring(0, 50),
      },
      Reference: pedido.codigo || `RD-${pedido.id}`,
      Quantity: 1,
      Weight: pesoKg,
      WeightVolume: 0,
      CODAmount: 0,
      CODExpenses: "P",
      CODCurrency: "EUR",
      InsuranceAmount: 0,
      InsuranceExpenses: "P",
      InsuranceCurrency: "EUR",
      DeliveryNote: "",
      Remarks1: `Pedido ${pedido.codigo || pedido.id}`,
      Remarks2: "",
      Incoterms: "CPT",
      ContactName: "",
      GoodsDescription: "",
      CustomsValue: 0,
      CustomsCurrency: "",
      Format: "PDF",
      Product: "B2B",
    };

    const shipRes = await fetch(`${DHL_BASE}/shipment`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "accept": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    const shipData = await shipRes.json();

    if (!shipRes.ok || !shipData.Tracking) {
      console.error("DHL error:", shipData);
      return NextResponse.json({ ok: false, error: shipData.Message || "Error DHL", dhlError: shipData }, { status: 500 });
    }

    // Guardar tracking en pedido
    await supabase.from("pedidos").update({
      tracking_dhl: shipData.Tracking,
      tracking: shipData.Tracking,
      estado_envio: "preparando",
      agencia: "DHL",
    }).eq("id", pedidoId);

    // Convertir etiqueta base64 a URL guardada en Storage
    let etiquetaUrl: string | null = null;
    if (shipData.Label) {
      try {
        const buffer = Buffer.from(shipData.Label, "base64");
        const path = `documentos/dhl-${pedido.codigo || pedidoId}/etiqueta-dhl.pdf`;
        await supabase.storage.from("FACTURAS").upload(path, buffer, { contentType: "application/pdf", upsert: true });
        const { data: urlData } = supabase.storage.from("FACTURAS").getPublicUrl(path);
        etiquetaUrl = urlData.publicUrl;
        await supabase.from("pedidos").update({ etiqueta_envio_url: etiquetaUrl }).eq("id", pedidoId);
      } catch (e) {
        console.error("Error guardando etiqueta DHL:", e);
      }
    }

    const trackingUrl = `https://www.dhlparcel.es/es/envio/${shipData.Tracking}`;

    return NextResponse.json({
      ok: true,
      trackingNumber: shipData.Tracking,
      lp: shipData.LP?.[0] || null,
      etiquetaUrl,
      trackingUrl,
    });

  } catch (e: any) {
    console.error("Error DHL crear-envio:", e);
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}