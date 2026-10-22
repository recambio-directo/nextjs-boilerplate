"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "../../lib/supabase";
import ImportarStock from "./ImportarStock";
import SeccionDevoluciones from "./SeccionDevoluciones";

/* ═══════════════════════════════════════════
   PROVEEDOR DASHBOARD — Recambio Directo
   Todo en viewport, sin scroll (salvo búsqueda)
   ═══════════════════════════════════════════ */

type SeccionActiva = "dashboard" | "almacen" | "publicar" | "pedidos" | "devoluciones" | "importar" | "horarios" | "exclusiones" | "cuenta";

export default function ProveedorDashboard() {
  const [autenticado, setAutenticado] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [nombreEmpresa, setNombreEmpresa] = useState("");
  const [alias, setAlias] = useState("");
  const [provincia, setProvincia] = useState("");
  const [direccion, setDireccion] = useState("");
  const [iban, setIban] = useState("");
  const [telefono, setTelefono] = useState("");
  const [isMobile, setIsMobile] = useState(false);
  const [seccionActiva, setSeccionActiva] = useState<SeccionActiva>("dashboard");

  // Dashboard KPIs
  const [totalPiezas, setTotalPiezas] = useState(0);
  const [totalPedidos, setTotalPedidos] = useState(0);
  const [facturacion, setFacturacion] = useState(0);
  const [pedidosPendientes, setPedidosPendientes] = useState(0);

  // Almacén
  const [piezas, setPiezas] = useState<any[]>([]);
  const [busquedaAlmacen, setBusquedaAlmacen] = useState("");
  const [paginaAlmacen, setPaginaAlmacen] = useState(0);
  const PIEZAS_POR_PAGINA = 15;

  // Publicar
  const [refPublicar, setRefPublicar] = useState("");
  const [descPublicar, setDescPublicar] = useState("");
  const [marcaPublicar, setMarcaPublicar] = useState("");
  const [precioPublicar, setPrecioPublicar] = useState("");
  const [stockPublicar, setStockPublicar] = useState("");
  const [tipoPublicar, setTipoPublicar] = useState<"OEM" | "IAM">("IAM");
  const [publicando, setPublicando] = useState(false);
  const [msgPublicar, setMsgPublicar] = useState("");

  // Pedidos
  const [pedidos, setPedidos] = useState<any[]>([]);
  const [filtroPedidos, setFiltroPedidos] = useState("todos");

  // Horarios
  const [horarios, setHorarios] = useState<Record<string, { abre: string; cierra: string; activo: boolean }>>({
    lunes: { abre: "08:00", cierra: "18:00", activo: true },
    martes: { abre: "08:00", cierra: "18:00", activo: true },
    miercoles: { abre: "08:00", cierra: "18:00", activo: true },
    jueves: { abre: "08:00", cierra: "18:00", activo: true },
    viernes: { abre: "08:00", cierra: "18:00", activo: true },
    sabado: { abre: "09:00", cierra: "14:00", activo: false },
    domingo: { abre: "", cierra: "", activo: false },
  });
  const [guardandoHorarios, setGuardandoHorarios] = useState(false);

  // Exclusiones
  const [exclusiones, setExclusiones] = useState<any[]>([]);
  const [nuevaExclusion, setNuevaExclusion] = useState("");
  const [tipoExclusion, setTipoExclusion] = useState<"provincia" | "cp">("provincia");

  // Cuenta
  const [editAlias, setEditAlias] = useState("");
  const [editDireccion, setEditDireccion] = useState("");
  const [editIban, setEditIban] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [passActual, setPassActual] = useState("");
  const [passNueva, setPassNueva] = useState("");
  const [passConfirm, setPassConfirm] = useState("");
  const [msgCuenta, setMsgCuenta] = useState("");

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => { iniciar(); }, []);

  async function iniciar() {
    setCargando(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { window.location.href = "/"; return; }
    const { data: perfil } = await supabase.from("usuarios").select("*").eq("id", user.id).single();
    if (!perfil || perfil.tipo !== "proveedor") { window.location.href = "/"; return; }
    await supabase.from("usuarios").update({ ultimo_acceso: new Date().toISOString() }).eq("id", user.id);
    setUserId(user.id);
    setUserEmail(user.email || null);
    setNombreEmpresa(perfil.nombre_empresa || "");
    setAlias(perfil.alias || "");
    setProvincia(perfil.provincia || "");
    setDireccion(perfil.direccion || "");
    setIban(perfil.iban || "");
    setTelefono(perfil.telefono || "");
    setEditAlias(perfil.alias || "");
    setEditDireccion(perfil.direccion || "");
    setEditIban(perfil.iban || "");
    setEditEmail(user.email || "");
    setAutenticado(true);
    setCargando(false);
    cargarDatos(user.id, user.email || "");
  }

  async function cargarDatos(uid: string, email: string) {
    // Piezas
    const { count: countPiezas } = await supabase.from("piezas_publicadas").select("*", { count: "exact", head: true }).eq("proveedor_id", uid);
    setTotalPiezas(countPiezas || 0);

    // Pedidos
    const { data: peds } = await supabase.from("pedidos").select("*").eq("proveedor_id", uid).order("created_at", { ascending: false });
    if (peds) {
      setPedidos(peds);
      setTotalPedidos(peds.filter(p => !p.anulado).length);
      setFacturacion(peds.filter(p => !p.anulado).reduce((acc, p) => acc + (Number(p.total) || 0), 0));
      setPedidosPendientes(peds.filter(p => !p.anulado && p.estado === "pendiente").length);
    }

    // Horarios
    const { data: h } = await supabase.from("usuarios").select("horarios").eq("id", uid).single();
    if (h?.horarios) setHorarios(h.horarios);

    // Exclusiones
    const { data: excl } = await supabase.from("exclusiones_envio").select("*").eq("proveedor_id", uid);
    setExclusiones(excl || []);
  }

  async function cargarPiezasAlmacen() {
    if (!userId) return;
    let query = supabase.from("piezas_publicadas").select("*").eq("proveedor_id", userId).order("id", { ascending: false }).range(paginaAlmacen * PIEZAS_POR_PAGINA, (paginaAlmacen + 1) * PIEZAS_POR_PAGINA - 1);
    if (busquedaAlmacen.trim()) {
      query = supabase.from("piezas_publicadas").select("*").eq("proveedor_id", userId).ilike("referencia", `%${busquedaAlmacen.trim()}%`).order("id", { ascending: false }).range(0, PIEZAS_POR_PAGINA - 1);
    }
    const { data } = await query;
    setPiezas(data || []);
  }

  useEffect(() => {
    if (seccionActiva === "almacen" && userId) cargarPiezasAlmacen();
  }, [seccionActiva, paginaAlmacen, userId]);

  async function publicarPieza() {
    if (!userId || !refPublicar.trim() || !precioPublicar.trim()) return;
    setPublicando(true);
    setMsgPublicar("");
    const provNombre = alias || nombreEmpresa;
    const { error } = await supabase.from("piezas_publicadas").insert({
      proveedor_id: userId,
      proveedor_nombre: provNombre.toUpperCase(),
      referencia: refPublicar.toUpperCase().trim(),
      descripcion: descPublicar.toUpperCase().trim() || refPublicar.toUpperCase().trim(),
      marca: marcaPublicar.toUpperCase().trim(),
      precio: parseFloat(precioPublicar.replace(",", ".")),
      stock: parseInt(stockPublicar) || 1,
      tipo: tipoPublicar,
      provincia: provincia || null,
    });
    if (error) {
      setMsgPublicar("❌ Error: " + error.message);
    } else {
      setMsgPublicar("✅ Referencia publicada");
      setRefPublicar(""); setDescPublicar(""); setMarcaPublicar(""); setPrecioPublicar(""); setStockPublicar("");
      setTotalPiezas(prev => prev + 1);
    }
    setPublicando(false);
  }

  async function eliminarPieza(id: number) {
    await supabase.from("piezas_publicadas").delete().eq("id", id);
    setPiezas(prev => prev.filter(p => p.id !== id));
    setTotalPiezas(prev => prev - 1);
  }

  async function guardarHorarios() {
    if (!userId) return;
    setGuardandoHorarios(true);
    await supabase.from("usuarios").update({ horarios }).eq("id", userId);
    setGuardandoHorarios(false);
  }

  async function agregarExclusion() {
    if (!userId || !nuevaExclusion.trim()) return;
    const { data, error } = await supabase.from("exclusiones_envio").insert({
      proveedor_id: userId,
      tipo: tipoExclusion,
      valor: nuevaExclusion.trim(),
    }).select().single();
    if (data) setExclusiones(prev => [...prev, data]);
    setNuevaExclusion("");
  }

  async function eliminarExclusion(id: number) {
    await supabase.from("exclusiones_envio").delete().eq("id", id);
    setExclusiones(prev => prev.filter(e => e.id !== id));
  }

  async function guardarCuenta(campo: string) {
    if (!userId) return;
    setMsgCuenta("");
    if (campo === "alias") {
      await supabase.from("usuarios").update({ alias: editAlias.trim() }).eq("id", userId);
      setAlias(editAlias.trim());
      setMsgCuenta("✅ Alias actualizado");
    } else if (campo === "direccion") {
      await supabase.from("usuarios").update({ direccion: editDireccion.trim() }).eq("id", userId);
      setDireccion(editDireccion.trim());
      setMsgCuenta("✅ Dirección actualizada");
    } else if (campo === "iban") {
      await supabase.from("usuarios").update({ iban: editIban.trim() }).eq("id", userId);
      setIban(editIban.trim());
      setMsgCuenta("✅ IBAN actualizado");
    } else if (campo === "email") {
      const { error } = await supabase.auth.updateUser({ email: editEmail.trim() });
      if (error) { setMsgCuenta("❌ " + error.message); return; }
      setMsgCuenta("✅ Email actualizado — verifica tu correo");
    } else if (campo === "password") {
      if (passNueva.length < 6) { setMsgCuenta("❌ Mínimo 6 caracteres"); return; }
      if (passNueva !== passConfirm) { setMsgCuenta("❌ Las contraseñas no coinciden"); return; }
      const { error } = await supabase.auth.updateUser({ password: passNueva });
      if (error) { setMsgCuenta("❌ " + error.message); return; }
      setPassActual(""); setPassNueva(""); setPassConfirm("");
      setMsgCuenta("✅ Contraseña actualizada");
    }
  }

  async function cerrarSesion() {
    await supabase.auth.signOut();
    location.href = "/";
  }

  if (cargando) return <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: "#0a0a1a", color: "white", fontSize: 18 }}>Cargando...</div>;
  if (!autenticado) return null;

  const displayName = alias || nombreEmpresa;
  const inicial = (displayName || "P")[0].toUpperCase();

  const SECCIONES: { id: SeccionActiva; label: string; icon: string }[] = [
    { id: "dashboard", label: "Dashboard", icon: "📊" },
    { id: "almacen", label: "Almacén", icon: "📦" },
    { id: "publicar", label: "Publicar", icon: "➕" },
    { id: "pedidos", label: "Pedidos", icon: "🛒" },
    { id: "devoluciones", label: "Devoluciones", icon: "↩️" },
    { id: "importar", label: "Importar", icon: "📥" },
    { id: "horarios", label: "Horarios", icon: "🕐" },
    { id: "exclusiones", label: "Exclusiones", icon: "🚫" },
    { id: "cuenta", label: "Cuenta", icon: "⚙️" },
  ];

  /* ── RENDER SECCIÓN ACTIVA ── */
  function renderContenido() {
    switch (seccionActiva) {
      case "dashboard":
        return (
          <div>
            <div style={S.badge}>PANEL DE PROVEEDOR</div>
            <h1 style={S.title}>Bienvenido, {displayName}</h1>
            <p style={S.desc}>Gestiona tu stock, pedidos y configuración desde aquí.</p>
            <div style={S.kpiGrid}>
              {[
                { label: "REFERENCIAS", value: totalPiezas.toLocaleString("es-ES"), color: "#3b82f6" },
                { label: "PEDIDOS", value: totalPedidos.toString(), color: "#22c55e" },
                { label: "FACTURACIÓN", value: facturacion.toFixed(2) + "€", color: "#a855f7" },
                { label: "PENDIENTES", value: pedidosPendientes.toString(), color: "#f59e0b" },
              ].map(kpi => (
                <div key={kpi.label} style={S.kpiCard}>
                  <div style={{ ...S.kpiLabel, color: kpi.color }}>{kpi.label}</div>
                  <div style={S.kpiNumber}>{kpi.value}</div>
                </div>
              ))}
            </div>
            <div style={S.quickGrid}>
              {SECCIONES.filter(s => s.id !== "dashboard").map(s => (
                <div key={s.id} style={S.quickCard} onClick={() => setSeccionActiva(s.id)}>
                  <div style={S.quickIcon}>{s.icon}</div>
                  <div style={S.quickTitle}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        );

      case "almacen":
        return (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, flexWrap: "wrap", gap: 8 }}>
              <div>
                <h2 style={{ ...S.title, marginBottom: 2 }}>Almacén</h2>
                <p style={{ ...S.desc, marginBottom: 0 }}>{totalPiezas.toLocaleString("es-ES")} referencias publicadas</p>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <button style={S.addButton} onClick={() => setSeccionActiva("publicar")}>➕ Publicar</button>
                <button style={S.importButton} onClick={() => setSeccionActiva("importar")}>📥 Importar</button>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
              <input style={S.searchInput} placeholder="Buscar referencia..." value={busquedaAlmacen} onChange={e => { setBusquedaAlmacen(e.target.value); setPaginaAlmacen(0); }} onKeyDown={e => e.key === "Enter" && cargarPiezasAlmacen()} />
              <button style={S.addButton} onClick={cargarPiezasAlmacen}>🔍</button>
            </div>
            <div style={S.tableContainer}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "rgba(255,255,255,0.03)" }}>
                    {["Referencia", "Descripción", "Marca", "Precio", "Stock", "Tipo", ""].map(h => (
                      <th key={h} style={S.thStyle}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {piezas.map(p => (
                    <tr key={p.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                      <td style={{ ...S.tdStyle, fontWeight: 700 }}>{p.referencia}</td>
                      <td style={S.tdStyle}>{(p.descripcion || "").substring(0, 40)}</td>
                      <td style={S.tdStyle}>{p.marca}</td>
                      <td style={{ ...S.tdStyle, color: "#22c55e" }}>{Number(p.precio).toFixed(2)}€</td>
                      <td style={S.tdStyle}>{p.stock}</td>
                      <td style={S.tdStyle}><span style={{ background: p.tipo === "OEM" ? "rgba(37,99,235,0.15)" : "rgba(168,85,247,0.15)", color: p.tipo === "OEM" ? "#60a5fa" : "#c084fc", padding: "2px 8px", borderRadius: 999, fontSize: 10, fontWeight: 700 }}>{p.tipo}</span></td>
                      <td style={S.tdStyle}><button onClick={() => eliminarPieza(p.id)} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: 14 }}>🗑️</button></td>
                    </tr>
                  ))}
                  {piezas.length === 0 && <tr><td colSpan={7} style={{ ...S.tdStyle, textAlign: "center", color: "#64748b" }}>Sin resultados</td></tr>}
                </tbody>
              </table>
            </div>
            <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 8 }}>
              <button style={S.addButton} onClick={() => setPaginaAlmacen(Math.max(0, paginaAlmacen - 1))} disabled={paginaAlmacen === 0}>← Anterior</button>
              <span style={{ color: "#94a3b8", fontSize: 12, padding: "6px 10px" }}>Pág. {paginaAlmacen + 1}</span>
              <button style={S.addButton} onClick={() => { setPaginaAlmacen(paginaAlmacen + 1); }} disabled={piezas.length < PIEZAS_POR_PAGINA}>Siguiente →</button>
            </div>
          </div>
        );

      case "publicar":
        return (
          <div style={S.formCard}>
            <h2 style={{ ...S.title, marginBottom: 4 }}>Publicar referencia</h2>
            <p style={{ ...S.desc, marginBottom: 14 }}>Añade una pieza a tu catálogo</p>
            {msgPublicar && <div style={{ background: msgPublicar.startsWith("✅") ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)", border: `1px solid ${msgPublicar.startsWith("✅") ? "rgba(34,197,94,0.3)" : "rgba(239,68,68,0.3)"}`, borderRadius: 8, padding: "6px 12px", marginBottom: 10, fontSize: 12 }}>{msgPublicar}</div>}
            <div style={S.formGrid}>
              <div>
                <label style={S.formLabel}>Referencia *</label>
                <input style={S.formInput} value={refPublicar} onChange={e => setRefPublicar(e.target.value)} placeholder="Ej: 0986494420" />
              </div>
              <div>
                <label style={S.formLabel}>Descripción</label>
                <input style={S.formInput} value={descPublicar} onChange={e => setDescPublicar(e.target.value)} placeholder="Ej: BOMBA DE COMBUSTIBLE" />
              </div>
              <div>
                <label style={S.formLabel}>Marca</label>
                <input style={S.formInput} value={marcaPublicar} onChange={e => setMarcaPublicar(e.target.value)} placeholder="Ej: BOSCH" />
              </div>
              <div>
                <label style={S.formLabel}>Precio neto (€) *</label>
                <input style={S.formInput} value={precioPublicar} onChange={e => setPrecioPublicar(e.target.value)} placeholder="Ej: 45.90" type="text" inputMode="decimal" />
              </div>
              <div>
                <label style={S.formLabel}>Stock</label>
                <input style={S.formInput} value={stockPublicar} onChange={e => setStockPublicar(e.target.value)} placeholder="1" type="number" />
              </div>
              <div>
                <label style={S.formLabel}>Tipo</label>
                <select style={S.formInput} value={tipoPublicar} onChange={e => setTipoPublicar(e.target.value as "OEM" | "IAM")}>
                  <option value="IAM">IAM</option>
                  <option value="OEM">OEM</option>
                </select>
              </div>
            </div>
            <button style={{ ...S.publishButton, opacity: publicando ? 0.5 : 1 }} onClick={publicarPieza} disabled={publicando}>
              {publicando ? "Publicando..." : "Publicar referencia"}
            </button>
          </div>
        );

      case "pedidos":
        const pedsFiltrados = filtroPedidos === "todos" ? pedidos : pedidos.filter(p => p.estado === filtroPedidos);
        return (
          <div>
            <h2 style={{ ...S.title, marginBottom: 4 }}>Pedidos</h2>
            <p style={{ ...S.desc, marginBottom: 10 }}>{totalPedidos} pedidos · {facturacion.toFixed(2)}€ facturados</p>
            <div style={{ display: "flex", gap: 4, marginBottom: 10, flexWrap: "wrap" }}>
              {["todos", "pendiente", "confirmado", "enviado", "entregado"].map(f => (
                <button key={f} style={filtroPedidos === f ? S.tabActive : S.tabInactive} onClick={() => setFiltroPedidos(f)}>
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
            <div style={S.tableContainer}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "rgba(255,255,255,0.03)" }}>
                    {["Fecha", "Ref.", "Cliente", "Total", "Estado"].map(h => (
                      <th key={h} style={S.thStyle}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pedsFiltrados.map(p => (
                    <tr key={p.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                      <td style={S.tdStyle}>{new Date(p.created_at).toLocaleDateString("es-ES")}</td>
                      <td style={{ ...S.tdStyle, fontWeight: 700 }}>{p.referencia || "—"}</td>
                      <td style={S.tdStyle}>{p.cliente_nombre || p.cliente_email || "—"}</td>
                      <td style={{ ...S.tdStyle, color: "#22c55e" }}>{Number(p.total || 0).toFixed(2)}€</td>
                      <td style={S.tdStyle}>
                        <span style={{ background: p.estado === "pendiente" ? "rgba(245,158,11,0.15)" : p.estado === "entregado" ? "rgba(34,197,94,0.15)" : "rgba(59,130,246,0.15)", color: p.estado === "pendiente" ? "#fbbf24" : p.estado === "entregado" ? "#4ade80" : "#60a5fa", padding: "2px 8px", borderRadius: 999, fontSize: 10, fontWeight: 700 }}>
                          {(p.estado || "pendiente").toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {pedsFiltrados.length === 0 && <tr><td colSpan={5} style={{ ...S.tdStyle, textAlign: "center", color: "#64748b" }}>Sin pedidos</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        );

      case "devoluciones":
        return <SeccionDevoluciones isMobile={isMobile} />;

      case "importar":
        return userId ? (
          <ImportarStock proveedorId={userId} proveedorNombre={alias || nombreEmpresa} onImportado={() => { cargarDatos(userId!, userEmail || ""); }} />
        ) : null;

      case "horarios":
        const dias = ["lunes", "martes", "miercoles", "jueves", "viernes", "sabado", "domingo"];
        const diasLabel: Record<string, string> = { lunes: "Lunes", martes: "Martes", miercoles: "Miércoles", jueves: "Jueves", viernes: "Viernes", sabado: "Sábado", domingo: "Domingo" };
        return (
          <div style={S.formCard}>
            <h2 style={{ ...S.title, marginBottom: 4 }}>Horarios de atención</h2>
            <p style={{ ...S.desc, marginBottom: 12 }}>Configura tu disponibilidad para envíos</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {dias.map(d => {
                const h = horarios[d];
                return (
                  <div key={d} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 10px", background: "rgba(255,255,255,0.03)", borderRadius: 8, border: "1px solid rgba(255,255,255,0.06)" }}>
                    <label style={{ display: "flex", alignItems: "center", gap: 6, width: 110, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                      <input type="checkbox" checked={h.activo} onChange={e => setHorarios({ ...horarios, [d]: { ...h, activo: e.target.checked } })} />
                      {diasLabel[d]}
                    </label>
                    {h.activo ? (
                      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <input type="time" value={h.abre} onChange={e => setHorarios({ ...horarios, [d]: { ...h, abre: e.target.value } })} style={{ ...S.formInput, width: 100, padding: "4px 8px", fontSize: 12 }} />
                        <span style={{ color: "#64748b", fontSize: 11 }}>a</span>
                        <input type="time" value={h.cierra} onChange={e => setHorarios({ ...horarios, [d]: { ...h, cierra: e.target.value } })} style={{ ...S.formInput, width: 100, padding: "4px 8px", fontSize: 12 }} />
                      </div>
                    ) : (
                      <span style={{ color: "#64748b", fontSize: 11 }}>Cerrado</span>
                    )}
                  </div>
                );
              })}
            </div>
            <button style={{ ...S.publishButton, marginTop: 12 }} onClick={guardarHorarios} disabled={guardandoHorarios}>
              {guardandoHorarios ? "Guardando..." : "Guardar horarios"}
            </button>
          </div>
        );

      case "exclusiones":
        return (
          <div style={S.formCard}>
            <h2 style={{ ...S.title, marginBottom: 4 }}>Exclusiones de envío</h2>
            <p style={{ ...S.desc, marginBottom: 12 }}>Provincias o códigos postales donde no envías</p>
            <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
              <select style={{ ...S.formInput, width: 120 }} value={tipoExclusion} onChange={e => setTipoExclusion(e.target.value as "provincia" | "cp")}>
                <option value="provincia">Provincia</option>
                <option value="cp">Código postal</option>
              </select>
              <input style={{ ...S.formInput, flex: 1 }} value={nuevaExclusion} onChange={e => setNuevaExclusion(e.target.value)} placeholder={tipoExclusion === "provincia" ? "Ej: Las Palmas" : "Ej: 35001"} />
              <button style={S.addButton} onClick={agregarExclusion}>Añadir</button>
            </div>
            <div style={{ maxHeight: 200, overflowY: "auto" }}>
              {exclusiones.length === 0 && <p style={{ color: "#64748b", fontSize: 12, textAlign: "center", padding: 16 }}>No hay exclusiones configuradas</p>}
              {exclusiones.map(e => (
                <div key={e.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 10px", background: "rgba(255,255,255,0.03)", borderRadius: 8, marginBottom: 4, border: "1px solid rgba(255,255,255,0.06)" }}>
                  <span style={{ fontSize: 12 }}><span style={{ background: e.tipo === "provincia" ? "rgba(59,130,246,0.15)" : "rgba(168,85,247,0.15)", color: e.tipo === "provincia" ? "#60a5fa" : "#c084fc", padding: "1px 6px", borderRadius: 4, fontSize: 10, marginRight: 6 }}>{e.tipo}</span>{e.valor}</span>
                  <button onClick={() => eliminarExclusion(e.id)} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: 12 }}>✕</button>
                </div>
              ))}
            </div>
          </div>
        );

      case "cuenta":
        return (
          <div>
            <h2 style={{ ...S.title, marginBottom: 4 }}>Mi cuenta</h2>
            <p style={{ ...S.desc, marginBottom: 12 }}>Gestiona los datos de tu empresa</p>
            {msgCuenta && <div style={{ background: msgCuenta.startsWith("✅") ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)", border: `1px solid ${msgCuenta.startsWith("✅") ? "rgba(34,197,94,0.3)" : "rgba(239,68,68,0.3)"}`, borderRadius: 8, padding: "6px 12px", marginBottom: 10, fontSize: 12 }}>{msgCuenta}</div>}
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 10 }}>
              {/* Alias */}
              <div style={S.cuentaCard}>
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6 }}>Alias (nombre visible)</div>
                <p style={{ color: "#64748b", fontSize: 11, marginBottom: 6 }}>Se muestra EN MAYÚSCULAS en tus publicaciones</p>
                <input style={S.formInput} value={editAlias} onChange={e => setEditAlias(e.target.value)} placeholder={nombreEmpresa} />
                <button style={{ ...S.addButton, marginTop: 6, width: "100%" }} onClick={() => guardarCuenta("alias")}>Guardar</button>
              </div>
              {/* Dirección */}
              <div style={S.cuentaCard}>
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6 }}>Dirección</div>
                <p style={{ color: "#64748b", fontSize: 11, marginBottom: 6 }}>Dirección para recogidas y envíos</p>
                <input style={S.formInput} value={editDireccion} onChange={e => setEditDireccion(e.target.value)} placeholder="Calle, nº, CP, Ciudad" />
                <button style={{ ...S.addButton, marginTop: 6, width: "100%" }} onClick={() => guardarCuenta("direccion")}>Guardar</button>
              </div>
              {/* IBAN */}
              <div style={S.cuentaCard}>
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6 }}>IBAN</div>
                <p style={{ color: "#64748b", fontSize: 11, marginBottom: 6 }}>Cuenta para recibir pagos</p>
                <input style={S.formInput} value={editIban} onChange={e => setEditIban(e.target.value)} placeholder="ES00 0000 0000 0000 0000 0000" />
                <button style={{ ...S.addButton, marginTop: 6, width: "100%" }} onClick={() => guardarCuenta("iban")}>Guardar</button>
              </div>
              {/* Email */}
              <div style={S.cuentaCard}>
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6 }}>Email</div>
                <p style={{ color: "#64748b", fontSize: 11, marginBottom: 6 }}>Se enviará verificación al nuevo email</p>
                <input style={S.formInput} value={editEmail} onChange={e => setEditEmail(e.target.value)} type="email" />
                <button style={{ ...S.addButton, marginTop: 6, width: "100%" }} onClick={() => guardarCuenta("email")}>Guardar</button>
              </div>
              {/* Password */}
              <div style={{ ...S.cuentaCard, gridColumn: isMobile ? undefined : "1 / -1" }}>
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6 }}>Cambiar contraseña</div>
                <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr 1fr", gap: 8 }}>
                  <input style={S.formInput} type="password" placeholder="Nueva contraseña" value={passNueva} onChange={e => setPassNueva(e.target.value)} />
                  <input style={S.formInput} type="password" placeholder="Confirmar contraseña" value={passConfirm} onChange={e => setPassConfirm(e.target.value)} />
                  <button style={S.addButton} onClick={() => guardarCuenta("password")}>Cambiar</button>
                </div>
              </div>
            </div>
            <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
              <button onClick={cerrarSesion} style={{ background: "rgba(239,68,68,0.1)", color: "#f87171", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 8, padding: "8px 16px", cursor: "pointer", fontSize: 12, fontWeight: 700 }}>Cerrar sesión</button>
            </div>
          </div>
        );

      default:
        return null;
    }
  }

  /* ── LAYOUT ── */
  if (isMobile) {
    return (
      <div style={{ minHeight: "100vh", background: "#0a0a1a", color: "white" }}>
        {/* Header mobile */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: "linear-gradient(135deg,#2563eb,#7c3aed)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 14 }}>{inicial}</div>
            <span style={{ fontWeight: 700, fontSize: 14 }}>{displayName}</span>
          </div>
        </div>
        {/* Tabs mobile */}
        <div style={{ display: "flex", overflowX: "auto", gap: 2, padding: "6px 10px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          {SECCIONES.map(s => (
            <button key={s.id} onClick={() => setSeccionActiva(s.id)} style={{
              background: seccionActiva === s.id ? "rgba(37,99,235,0.15)" : "transparent",
              color: seccionActiva === s.id ? "#60a5fa" : "#94a3b8",
              border: "none", borderRadius: 6, padding: "6px 10px", fontSize: 11, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0,
            }}>
              {s.icon} {s.label}
            </button>
          ))}
        </div>
        {/* Contenido */}
        <div style={{ padding: "14px" }}>
          {renderContenido()}
        </div>
      </div>
    );
  }

  /* Desktop */
  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#0a0a1a", color: "white" }}>
      {/* Sidebar */}
      <aside style={S.sidebar}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg,#2563eb,#7c3aed)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 16, flexShrink: 0 }}>{inicial}</div>
          <div style={{ overflow: "hidden" }}>
            <div style={{ fontWeight: 800, fontSize: 13, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{displayName}</div>
            <div style={{ fontSize: 10, color: "#64748b" }}>Proveedor</div>
          </div>
        </div>
        <nav style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {SECCIONES.map(s => (
            <button key={s.id} onClick={() => setSeccionActiva(s.id)} style={{
              display: "flex", alignItems: "center", gap: 8,
              background: seccionActiva === s.id ? "rgba(37,99,235,0.15)" : "transparent",
              color: seccionActiva === s.id ? "#60a5fa" : "#cbd5e1",
              border: "none", borderRadius: 8, padding: "7px 10px", fontSize: 12, fontWeight: seccionActiva === s.id ? 700 : 500, cursor: "pointer", textAlign: "left", width: "100%",
              transition: "all 0.15s",
            }}>
              <span style={{ fontSize: 14 }}>{s.icon}</span> {s.label}
            </button>
          ))}
        </nav>
        <div style={{ marginTop: "auto", paddingTop: 12 }}>
          <button onClick={cerrarSesion} style={{ width: "100%", background: "rgba(239,68,68,0.08)", color: "#f87171", border: "1px solid rgba(239,68,68,0.15)", borderRadius: 8, padding: "7px 10px", cursor: "pointer", fontSize: 11, fontWeight: 600 }}>Cerrar sesión</button>
        </div>
      </aside>
      {/* Contenido */}
      <main style={S.content}>
        {renderContenido()}
      </main>
    </div>
  );
}

/* ═══════════════════════════════════════════
   ESTILOS COMPACTOS — todo en viewport
   ═══════════════════════════════════════════ */
const S: Record<string, React.CSSProperties> = {
  sidebar: { width: 200, background: "rgba(15,23,42,0.95)", borderRight: "1px solid rgba(255,255,255,0.06)", padding: "14px 12px", display: "flex", flexDirection: "column", flexShrink: 0 },
  content: { flex: 1, padding: "16px 20px", overflowY: "auto" },
  badge: { display: "inline-block", background: "rgba(37,99,235,0.15)", color: "#60a5fa", padding: "4px 10px", borderRadius: 999, fontSize: 11, fontWeight: 700, marginBottom: 6, letterSpacing: "0.05em" },
  title: { fontSize: 22, fontWeight: 900, marginBottom: 4, lineHeight: 1.1 },
  desc: { color: "#94a3b8", fontSize: 13, marginBottom: 14 },
  kpiGrid: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 14 },
  kpiCard: { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: "10px 14px" },
  kpiLabel: { fontSize: 10, fontWeight: 700, letterSpacing: "0.05em", marginBottom: 4 },
  kpiNumber: { fontSize: 24, fontWeight: 900 },
  quickGrid: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 },
  quickCard: { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: "10px 12px", cursor: "pointer", textAlign: "center" as const, transition: "all 0.15s" },
  quickIcon: { fontSize: 20, marginBottom: 4 },
  quickTitle: { fontSize: 12, fontWeight: 600 },
  addButton: { background: "rgba(37,99,235,0.15)", color: "#60a5fa", border: "1px solid rgba(37,99,235,0.3)", borderRadius: 8, padding: "6px 14px", cursor: "pointer", fontSize: 12, fontWeight: 700 },
  importButton: { background: "rgba(22,163,74,0.15)", color: "#4ade80", border: "1px solid rgba(22,163,74,0.3)", borderRadius: 8, padding: "6px 14px", cursor: "pointer", fontSize: 12, fontWeight: 700 },
  tableContainer: { borderRadius: 12, border: "1px solid rgba(255,255,255,0.06)", overflow: "hidden" },
  thStyle: { padding: "8px 10px", textAlign: "left" as const, fontSize: 10, fontWeight: 700, color: "#64748b", textTransform: "uppercase" as const, letterSpacing: "0.05em" },
  tdStyle: { padding: "6px 10px", fontSize: 12, color: "#e2e8f0" },
  searchInput: { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "8px 12px", color: "white", fontSize: 13, outline: "none", flex: 1, maxWidth: 320 },
  tabActive: { background: "rgba(37,99,235,0.15)", color: "#60a5fa", border: "1px solid rgba(37,99,235,0.3)", borderRadius: 999, padding: "6px 16px", fontSize: 12, fontWeight: 700, cursor: "pointer" },
  tabInactive: { background: "transparent", color: "#94a3b8", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 999, padding: "6px 16px", fontSize: 12, fontWeight: 500, cursor: "pointer" },
  formCard: { background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, padding: 20, maxWidth: 700 },
  formGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 },
  formLabel: { display: "block", fontSize: 11, fontWeight: 700, color: "#94a3b8", marginBottom: 4, textTransform: "uppercase" as const, letterSpacing: "0.03em" },
  formInput: { width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "8px 12px", color: "white", fontSize: 13, outline: "none", boxSizing: "border-box" as const },
  publishButton: { width: "100%", background: "linear-gradient(135deg,#2563eb,#1d4ed8)", color: "white", border: "none", borderRadius: 8, padding: "10px 20px", fontSize: 13, fontWeight: 700, cursor: "pointer" },
  cuentaCard: { background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: 14 },
};
