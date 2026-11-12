// app/api/admin/usuario/route.ts
// Gestión completa de un usuario desde el panel admin (solo administradores).
//   accion "actualizar"      → cambia campos del perfil (y el email de acceso si cambia)
//   accion "eliminar"        → borra el usuario de la plataforma y su acceso
//   accion "enlace_password" → genera un enlace para que el usuario ponga contraseña nueva
//   accion "confirmar_email" → marca el email como verificado
import { sbAdmin } from "@/app/lib/envios";
import { verificarAdmin } from "@/app/lib/adminAuth";

const supabase = sbAdmin();

// Campos del perfil que el admin puede editar
const CAMPOS_EDITABLES = [
  "nombre_empresa", "cif", "telefono", "direccion", "ciudad", "codigo_postal", "provincia",
  "tipo", "suscripcion", "activo", "iban", "notas_admin",
  "credito_rd", "credito_rd_maximo", "rd_pago_activo", "vehiculo_activo", "email_facturas",
];

export async function POST(request: Request) {
  const admin = await verificarAdmin(request);
  if (!admin.ok) return Response.json({ ok: false, error: admin.error }, { status: admin.status });

  let body: any;
  try { body = await request.json(); } catch { return Response.json({ ok: false, error: "Petición inválida" }, { status: 400 }); }
  const { accion, userId } = body || {};
  if (!userId || typeof userId !== "string") return Response.json({ ok: false, error: "Falta userId" }, { status: 400 });
  if (userId === admin.adminId && accion === "eliminar") return Response.json({ ok: false, error: "No puedes eliminar tu propio usuario administrador" }, { status: 400 });

  try {
    const { data: perfil } = await supabase.from("usuarios").select("*").eq("id", userId).maybeSingle();

    // ── ACTUALIZAR ──────────────────────────────────────────────────────────
    if (accion === "actualizar") {
      if (!perfil) return Response.json({ ok: false, error: "Usuario no encontrado" }, { status: 404 });
      const entrada = body.campos || {};
      const campos: Record<string, any> = {};
      for (const k of CAMPOS_EDITABLES) if (k in entrada) campos[k] = entrada[k] === "" ? null : entrada[k];
      if ("tipo" in campos && !["taller", "proveedor"].includes(campos.tipo)) return Response.json({ ok: false, error: "Tipo de usuario no válido" }, { status: 400 });
      if (campos.codigo_postal && !/^\d{5}$/.test(String(campos.codigo_postal))) return Response.json({ ok: false, error: "El código postal debe tener 5 cifras" }, { status: 400 });
      for (const k of ["credito_rd", "credito_rd_maximo"]) {
        if (k in campos && campos[k] !== null) {
          const n = Number(campos[k]);
          if (!isFinite(n) || n < 0) return Response.json({ ok: false, error: "Importe de crédito no válido" }, { status: 400 });
          campos[k] = n;
        }
      }
      if (campos.iban) campos.iban = String(campos.iban).replace(/\s+/g, "").toUpperCase();

      // Cambio de email: primero en el acceso (auth), luego en el perfil
      const nuevoEmail = typeof entrada.email === "string" ? entrada.email.trim().toLowerCase() : "";
      if (nuevoEmail && nuevoEmail !== String(perfil.email || "").toLowerCase()) {
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(nuevoEmail)) return Response.json({ ok: false, error: "Email no válido" }, { status: 400 });
        const { error: eAuth } = await supabase.auth.admin.updateUserById(userId, { email: nuevoEmail, email_confirm: true });
        if (eAuth) return Response.json({ ok: false, error: `No se pudo cambiar el email de acceso: ${eAuth.message}` }, { status: 400 });
        campos.email = nuevoEmail;
      }

      if (Object.keys(campos).length === 0) return Response.json({ ok: true, usuario: perfil, sinCambios: true });

      // Si una columna no existe en la tabla, se descarta y se guarda el resto
      const descartados: string[] = [];
      for (let i = 0; i < 6; i++) {
        const { data, error } = await supabase.from("usuarios").update(campos).eq("id", userId).select("*").maybeSingle();
        if (!error) return Response.json({ ok: true, usuario: data, descartados });
        const col = /'([a-z0-9_]+)' column/i.exec(error.message || "")?.[1];
        if (col && col in campos) { delete campos[col]; descartados.push(col); continue; }
        return Response.json({ ok: false, error: error.message }, { status: 500 });
      }
      return Response.json({ ok: false, error: "No se pudo guardar" }, { status: 500 });
    }

    // ── ELIMINAR ────────────────────────────────────────────────────────────
    if (accion === "eliminar") {
      const avisos: string[] = [];

      // Datos que dependen del usuario y no tienen valor histórico
      const limpiezas: [string, string][] = [
        ["cesta", "user_id"],
        ["piezas_publicadas", "proveedor_id"],
        ["api_keys_proveedores", "proveedor_id"],
        ["webhooks_proveedores", "proveedor_id"],
      ];
      for (const [tabla, columna] of limpiezas) {
        const { error } = await supabase.from(tabla).delete().eq(columna, userId);
        if (error && !/does not exist|schema cache|Could not find/i.test(error.message)) avisos.push(`${tabla}: ${error.message}`);
      }

      // Los pedidos NO se borran: son el histórico contable
      const { count: comoCliente } = await supabase.from("pedidos").select("id", { count: "exact", head: true }).eq("cliente_id", userId);

      const { error: ePerfil } = await supabase.from("usuarios").delete().eq("id", userId);
      if (ePerfil) {
        return Response.json({ ok: false, error: `No se pudo borrar el perfil: ${ePerfil.message}`, avisos }, { status: 500 });
      }

      try {
        const { error: eAuth } = await supabase.auth.admin.deleteUser(userId);
        if (eAuth && !/not found/i.test(eAuth.message)) avisos.push(`El perfil se ha borrado pero su acceso (login) no: ${eAuth.message}. Bórralo en Supabase → Authentication.`);
      } catch (e: any) {
        avisos.push(`El perfil se ha borrado pero su acceso (login) no: ${e?.message || e}. Bórralo en Supabase → Authentication.`);
      }

      return Response.json({ ok: true, avisos, pedidosConservados: comoCliente || 0, email: perfil?.email || null });
    }

    // ── ENLACE PARA NUEVA CONTRASEÑA ────────────────────────────────────────
    if (accion === "enlace_password") {
      if (!perfil?.email) return Response.json({ ok: false, error: "Usuario sin email" }, { status: 404 });
      const { data, error } = await supabase.auth.admin.generateLink({
        type: "recovery",
        email: perfil.email,
        options: { redirectTo: "https://www.recambio-directo.com/auth/reset-password" },
      });
      if (error || !data?.properties?.action_link) return Response.json({ ok: false, error: error?.message || "No se pudo generar el enlace" }, { status: 500 });
      return Response.json({ ok: true, enlace: data.properties.action_link, email: perfil.email });
    }

    // ── CONFIRMAR EMAIL ─────────────────────────────────────────────────────
    if (accion === "confirmar_email") {
      const { error } = await supabase.auth.admin.updateUserById(userId, { email_confirm: true });
      if (error) return Response.json({ ok: false, error: error.message }, { status: 500 });
      return Response.json({ ok: true });
    }

    return Response.json({ ok: false, error: "Acción no reconocida" }, { status: 400 });
  } catch (e: any) {
    console.error("Error admin/usuario:", e);
    return Response.json({ ok: false, error: e?.message || String(e) }, { status: 500 });
  }
}
