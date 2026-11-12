// app/api/admin/pedido/route.ts
// Gestión de un pedido desde el panel admin (solo administradores).
//   accion "actualizar" → corrige campos del pedido
//   accion "anular"     → marca anulado; opcionalmente devuelve el crédito RD Pago
//   accion "reactivar"  → deshace una anulación
//   accion "eliminar"   → borra el pedido (solo para pruebas o duplicados)
import { sbAdmin, guardarPedido, anotar } from "@/app/lib/envios";
import { verificarAdmin } from "@/app/lib/adminAuth";

const supabase = sbAdmin();

const CAMPOS_EDITABLES = [
  "estado_envio", "estado_pago", "agencia", "transporte", "direccion",
  "cliente_nombre", "cliente_telefono", "tracking", "coste_transporte", "gastos_gestion",
  "peso_kg", "forma_pago", "notas_internas", "fecha_entrega_confirmada",
];

export async function POST(request: Request) {
  const admin = await verificarAdmin(request);
  if (!admin.ok) return Response.json({ ok: false, error: admin.error }, { status: admin.status });

  let body: any;
  try { body = await request.json(); } catch { return Response.json({ ok: false, error: "Petición inválida" }, { status: 400 }); }
  const { accion, pedidoId } = body || {};
  if (!pedidoId) return Response.json({ ok: false, error: "Falta pedidoId" }, { status: 400 });

  try {
    const { data: pedido } = await supabase.from("pedidos").select("*").eq("id", pedidoId).maybeSingle();
    if (!pedido) return Response.json({ ok: false, error: "Pedido no encontrado" }, { status: 404 });

    if (accion === "actualizar") {
      const entrada = body.campos || {};
      const campos: Record<string, any> = {};
      for (const k of CAMPOS_EDITABLES) if (k in entrada) campos[k] = entrada[k] === "" ? null : entrada[k];
      for (const k of ["coste_transporte", "gastos_gestion", "peso_kg"]) {
        if (k in campos && campos[k] !== null) {
          const n = Number(campos[k]);
          if (!isFinite(n) || n < 0) return Response.json({ ok: false, error: `Valor no válido en ${k}` }, { status: 400 });
          campos[k] = n;
        }
      }
      if ("agencia" in campos && !("transporte" in campos)) campos.transporte = campos.agencia;
      const g = await guardarPedido(supabase, pedidoId, campos);
      if (g.error) return Response.json({ ok: false, error: g.error }, { status: 500 });
      await anotar(supabase, pedidoId, `ADMIN (${admin.adminEmail}) modificó: ${Object.keys(campos).filter(k => k !== "notas_internas").join(", ") || "notas"}`);
      return Response.json({ ok: true, descartados: g.descartadas });
    }

    if (accion === "anular") {
      if (pedido.anulado) return Response.json({ ok: false, error: "El pedido ya está anulado" }, { status: 400 });
      const g = await guardarPedido(supabase, pedidoId, {
        anulado: true,
        estado_envio: "anulado",
        motivo_anulacion: String(body.motivo || "Anulado por administración").slice(0, 300),
      });
      if (g.error) return Response.json({ ok: false, error: g.error }, { status: 500 });

      // Pagos al proveedor aún no realizados: se eliminan
      const { error: ePagos } = await supabase.from("pagos_proveedores").delete().eq("pedido_id", pedidoId).neq("estado", "pagado");
      const avisos: string[] = [];
      if (ePagos && !/does not exist|schema cache/i.test(ePagos.message)) avisos.push(`Pagos proveedor: ${ePagos.message}`);

      // Devolución del crédito RD Pago consumido por este pedido
      let creditoDevuelto = 0;
      if (body.devolverCredito && pedido.forma_pago === "rd_pago" && pedido.cliente_id) {
        const { data: cli } = await supabase.from("usuarios").select("credito_rd, credito_rd_maximo").eq("id", pedido.cliente_id).maybeSingle();
        if (cli) {
          const actual = Number(cli.credito_rd || 0);
          const maximo = Number(cli.credito_rd_maximo || 0);
          let nuevo = actual + Number(pedido.total || 0);
          if (maximo > 0 && nuevo > maximo) nuevo = maximo;
          nuevo = Math.round(nuevo * 100) / 100;
          const { error: eCred } = await supabase.from("usuarios").update({ credito_rd: nuevo }).eq("id", pedido.cliente_id);
          if (eCred) avisos.push(`Crédito RD: ${eCred.message}`);
          else creditoDevuelto = Math.round((nuevo - actual) * 100) / 100;
        }
      }
      await anotar(supabase, pedidoId, `ADMIN (${admin.adminEmail}) anuló el pedido${creditoDevuelto ? ` y devolvió ${creditoDevuelto.toFixed(2)} € de crédito RD` : ""}`);
      return Response.json({ ok: true, creditoDevuelto, avisos, pagoTarjeta: pedido.forma_pago === "tarjeta" });
    }

    if (accion === "reactivar") {
      const g = await guardarPedido(supabase, pedidoId, {
        anulado: false,
        estado_envio: pedido.tracking ? "preparando" : "pendiente",
        motivo_anulacion: null,
      });
      if (g.error) return Response.json({ ok: false, error: g.error }, { status: 500 });
      await anotar(supabase, pedidoId, `ADMIN (${admin.adminEmail}) reactivó el pedido`);
      return Response.json({ ok: true });
    }

    if (accion === "eliminar") {
      const { data: pagados } = await supabase.from("pagos_proveedores").select("id").eq("pedido_id", pedidoId).eq("estado", "pagado");
      if (pagados && pagados.length > 0) return Response.json({ ok: false, error: "Este pedido tiene un pago al proveedor ya realizado: no se puede eliminar, anúlalo." }, { status: 400 });
      await supabase.from("pagos_proveedores").delete().eq("pedido_id", pedidoId);
      const { error } = await supabase.from("pedidos").delete().eq("id", pedidoId);
      if (error) return Response.json({ ok: false, error: error.message }, { status: 500 });
      return Response.json({ ok: true });
    }

    return Response.json({ ok: false, error: "Acción no reconocida" }, { status: 400 });
  } catch (e: any) {
    console.error("Error admin/pedido:", e);
    return Response.json({ ok: false, error: e?.message || String(e) }, { status: 500 });
  }
}
