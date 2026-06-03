import { createClient } from "@supabase/supabase-js";
import { renderToBuffer } from "@react-pdf/renderer";
import React from "react";
import { AlbaranPDF, EtiquetaEnvioPDF } from "@/app/lib/AlbaranPDF";

export async function POST(request: Request) {
  try {
    const { pedidoId, codigo } = await request.json();

    if (!pedidoId) {
      return Response.json({ error: "pedidoId requerido" }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Obtener datos completos del pedido
    const { data: pedido, error: pedidoError } = await supabase
      .from("pedidos")
      .select("*")
      .eq("id", pedidoId)
      .single();

    if (pedidoError || !pedido) {
      return Response.json({ error: "Pedido no encontrado" }, { status: 404 });
    }

    // Obtener datos del proveedor del primer producto
    const productos = pedido.productos || [];
    let proveedorNombre = "Proveedor";
    let proveedorEmail = "";

    if (productos.length > 0 && productos[0].proveedor_id) {
      const { data: prov } = await supabase
        .from("usuarios")
        .select("nombre_empresa, email")
        .eq("id", productos[0].proveedor_id)
        .single();
      if (prov) {
        proveedorNombre = prov.nombre_empresa || "Proveedor";
        proveedorEmail = prov.email || "";
      }
    }

    const props = {
      codigo: pedido.codigo || String(pedidoId),
      fecha: pedido.created_at || new Date().toISOString(),
      proveedorNombre,
      proveedorEmail,
      cliente: pedido.cliente_nombre || "",
      clienteEmail: pedido.cliente_email || "",
      telefono: pedido.cliente_telefono || "",
      cif: "",
      direccion: pedido.direccion || "",
      agencia: pedido.agencia || pedido.transporte || "",
      formaPago: pedido.forma_pago || "transferencia",
      productos,
      subtotal: Number(pedido.subtotal || 0),
      iva: Number(pedido.subtotal || 0) * 0.21,
      total: Number(pedido.total || 0),
    };

    // Generar PDFs
    const albaranBuffer = await renderToBuffer(
      React.createElement(AlbaranPDF, props) as any
    );
    const etiquetaBuffer = await renderToBuffer(
      React.createElement(EtiquetaEnvioPDF, props) as any
    );

    const codigoPedido = pedido.codigo || String(pedidoId);
    const albaranPath = `documentos/${codigoPedido}/albaran-${codigoPedido}.pdf`;
    const etiquetaPath = `documentos/${codigoPedido}/etiqueta-envio-${codigoPedido}.pdf`;

    // Subir a Storage
    await supabase.storage.from("FACTURAS").upload(albaranPath, albaranBuffer, {
      contentType: "application/pdf", upsert: true,
    });
    await supabase.storage.from("FACTURAS").upload(etiquetaPath, etiquetaBuffer, {
      contentType: "application/pdf", upsert: true,
    });

    const { data: albaranUrl } = supabase.storage.from("FACTURAS").getPublicUrl(albaranPath);
    const { data: etiquetaUrl } = supabase.storage.from("FACTURAS").getPublicUrl(etiquetaPath);

    // Guardar URLs en el pedido
    await supabase.from("pedidos").update({
      albaran_url: albaranUrl.publicUrl,
      etiqueta_envio_url: etiquetaUrl.publicUrl,
    }).eq("id", pedidoId);

    console.log(`Documentos generados para pedido ${pedidoId}: ${albaranUrl.publicUrl}`);

    return Response.json({
      ok: true,
      albaran_url: albaranUrl.publicUrl,
      etiqueta_envio_url: etiquetaUrl.publicUrl,
    });

  } catch (error) {
    console.error("Error generando documentos:", error);
    return Response.json({ error: String(error) }, { status: 500 });
  }
}