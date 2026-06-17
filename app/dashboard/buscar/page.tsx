"use client";

import { Suspense } from "react";
import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

type Oferta = {
  id: number;
  referencia: string;
  descripcion: string;
  nombre?: string;
  proveedor_nombre: string;
  proveedor?: string;
  proveedor_id: string;
  provincia: string;
  poblacion?: string;
  precio: number;
  stock: number;
  marca?: string;
  tipo?: string;
  foto_url?: string;
  impuesto?: number;
  marca_iam?: string;
  descripcion_iam?: string;
};

const FILTROS_TIPO = ["TODOS", "OEM", "IAM", "UNIVERSAL"];

function BuscarPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const q = searchParams.get("q") || "";
  const [ofertas, setOfertas] = useState<Oferta[]>([]);
  const [stockOEM, setStockOEM] = useState<Oferta[]>([]);
  const [stockIAM, setStockIAM] = useState<Oferta[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingCruce, setLoadingCruce] = useState(true);
  const [menuAbierto, setMenuAbierto] = useState<number | null>(null);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
  const [cestaMensaje, setCestaMensaje] = useState<number | null>(null);
  const [filtroTipo, setFiltroTipo] = useState("TODOS");
  const [abriendo, setAbriendo] = useState(false);
  const [fotoVisor, setFotoVisor] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [contactoModal, setContactoModal] = useState<{ nombre: string; telefono: string; email: string } | null>(null);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => { cargarOfertas(); cargarStockOEMeIAM(); }, [q]);

  useEffect(() => {
    function cerrar(e: MouseEvent) {
      const target = e.target as HTMLElement;
      if (!target.closest("[data-menu]")) setMenuAbierto(null);
    }
    document.addEventListener("click", cerrar);
    return () => document.removeEventListener("click", cerrar);
  }, []);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") { setFotoVisor(null); setMenuAbierto(null); }
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, []);

  // Búsqueda original por texto libre (descripción / coincidencia parcial de referencia).
  // Se mantiene para cuando el usuario escribe algo ambiguo en vez de una referencia exacta.
  async function cargarOfertas() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from("piezas_publicadas")
      .select("*")
      .or(`referencia.ilike.%${q}%,descripcion.ilike.%${q}%`)
      .gt("stock", 0)
      .order("precio", { ascending: true });

    if (error) { console.error(error); setLoading(false); return; }
    let resultado = (data as Oferta[]) || [];

    if (user) {
      const { data: perfil } = await supabase.from("usuarios").select("codigo_postal, email").eq("id", user.id).single();
      const { data: exclusiones } = await supabase.from("exclusiones_proveedor").select("*");
      if (perfil && exclusiones && exclusiones.length > 0) {
        resultado = resultado.filter(oferta => {
          const excluidoPorCp = exclusiones.some(exc => exc.proveedor_id === oferta.proveedor_id && exc.tipo === "cp" && perfil.codigo_postal && exc.valor === perfil.codigo_postal);
          if (excluidoPorCp) return false;
          const excluidoPorCliente = exclusiones.some(exc => exc.proveedor_id === oferta.proveedor_id && exc.tipo === "cliente" && exc.valor === perfil.email);
          if (excluidoPorCliente) return false;
          return true;
        });
      }
    }

    setOfertas(resultado);
    setLoading(false);
  }

  // Cruce exacto OEM <-> IAM vía nuestro endpoint /api/buscar-pieza.
  // Este es el que rellena los dos paneles separados: Stock OEM y Stock IAM.
  async function cargarStockOEMeIAM() {
    if (!q) { setStockOEM([]); setStockIAM([]); setLoadingCruce(false); return; }
    setLoadingCruce(true);
    try {
      const res = await fetch(`/api/buscar-pieza?referencia=${encodeURIComponent(q)}`);
      if (!res.ok) {
        console.error("Error llamando a /api/buscar-pieza:", res.status);
        setStockOEM([]); setStockIAM([]);
        setLoadingCruce(false);
        return;
      }
      const data = await res.json();
      setStockOEM(data?.stock_oem?.proveedores || []);
      setStockIAM(data?.stock_iam?.proveedores || []);
    } catch (err) {
      console.error("Error de red llamando a /api/buscar-pieza:", err);
      setStockOEM([]); setStockIAM([]);
    } finally {
      setLoadingCruce(false);
    }
  }

  const ofertasFiltradas = ofertas.filter(o => {
    if (filtroTipo === "TODOS") return true;
    if (o.tipo) return o.tipo.toUpperCase() === filtroTipo;
    const ref = o.referencia.toUpperCase();
    if (filtroTipo === "OEM") return /^\d/.test(ref) || (ref.includes("-") && ref.length > 8);
    if (filtroTipo === "IAM") return /^[A-Z]{1,4}\d/.test(ref) || /^[A-Z]{2,6}/.test(ref);
    return true;
  });

  async function pedirOferta(oferta: Oferta) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { alert("Inicia sesión para añadir a la cesta"); return; }
    if (oferta.proveedor_id === user.id) { alert("No puedes añadir tus propias piezas"); return; }
    const descripcion = oferta.descripcion || oferta.nombre || oferta.referencia;
    const { error } = await supabase.from("cesta").insert({
      user_id: user.id,
      referencia: oferta.referencia,
      descripcion,
      precio: oferta.precio,
      impuesto: oferta.impuesto || 0,
      cantidad: 1,
      stock: oferta.stock || 99,
      proveedor_id: oferta.proveedor_id,
      proveedor_nombre: oferta.proveedor_nombre,
    });
    if (error) { alert("Error al añadir a la cesta"); return; }
    setCestaMensaje(oferta.id);
    setTimeout(() => setCestaMensaje(null), 2000);
  }

  async function abrirChatConProveedor(ofertaId: number) {
    setMenuAbierto(null);
    setAbriendo(true);
    const todasLasOfertas = [...ofertas, ...stockOEM, ...stockIAM];
    const oferta = todasLasOfertas.find(o => o.id === ofertaId);
    if (!oferta?.proveedor_id) { setAbriendo(false); return; }
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setAbriendo(false); return; }
    const { data: conv1 } = await supabase.from("conversaciones").select("id").eq("user1_id", user.id).eq("user2_id", oferta.proveedor_id).maybeSingle();
    const { data: conv2 } = await supabase.from("conversaciones").select("id").eq("user1_id", oferta.proveedor_id).eq("user2_id", user.id).maybeSingle();
    const convExistente = conv1 || conv2;
    if (convExistente) { setAbriendo(false); router.push(`/chat?conv=${convExistente.id}`); return; }
    const { data: nuevaConv, error } = await supabase.from("conversaciones").insert({
      user1_id: user.id, user2_id: oferta.proveedor_id,
      referencia: oferta.referencia, ultimo_mensaje: "", updated_at: new Date().toISOString(),
    }).select("id").single();
    setAbriendo(false);
    if (!error && nuevaConv) router.push(`/chat?conv=${nuevaConv.id}`);
  }

  async function verTelefono(ofertaId: number) {
    setMenuAbierto(null);
    const todasLasOfertas = [...ofertas, ...stockOEM, ...stockIAM];
    const oferta = todasLasOfertas.find(o => o.id === ofertaId);
    if (!oferta?.proveedor_id) return;
    const { data } = await supabase.from("usuarios").select("telefono, nombre_empresa, email").eq("id", oferta.proveedor_id).single();
    if (data) setContactoModal({ nombre: data.nombre_empresa || "-", telefono: data.telefono || "No disponible", email: data.email || "-" });
  }

  function toggleMenu(e: React.MouseEvent, id: number) {
    e.stopPropagation();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    if (menuAbierto === id) { setMenuAbierto(null); return; }
    setMenuPos({ top: rect.bottom + 8, left: Math.min(rect.right - 210, window.innerWidth - 220) });
    setTimeout(() => setMenuAbierto(id), 0);
  }

  function getTipoBadge(tipo?: string) {
    const t = (tipo || "").toUpperCase();
    if (t === "OEM")       return { bg: "rgba(37,99,235,0.2)",   color: "#60a5fa" };
    if (t === "IAM")       return { bg: "rgba(139,92,246,0.2)",  color: "#a78bfa" };
    if (t === "UNIVERSAL") return { bg: "rgba(22,163,74,0.2)",   color: "#4ade80" };
    return                        { bg: "rgba(37,99,235,0.2)",   color: "#60a5fa" };
  }

  // ---- Tarjeta/fila reutilizable para pintar una oferta dentro de un panel ----
  function renderOfertaMobile(oferta: Oferta) {
    const descripcion = oferta.descripcion || oferta.descripcion_iam || oferta.nombre || "-";
    const proveedor = oferta.proveedor_nombre || oferta.proveedor || "-";
    const enCesta = cestaMensaje === oferta.id;
    const tipoUp = (oferta.tipo || "").toUpperCase();
    const badge = getTipoBadge(oferta.tipo);
    return (
      <div key={oferta.id} style={{ background: "rgba(15,23,42,0.97)", borderRadius: 16, padding: 16, border: "1px solid rgba(255,255,255,0.07)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
          <div>
            <p style={{ fontWeight: 900, fontSize: 17, marginBottom: 4 }}>{oferta.referencia}</p>
            <span style={{ background: badge.bg, color: badge.color, padding: "2px 10px", borderRadius: 999, fontSize: 11, fontWeight: 700 }}>{tipoUp || "OEM"}</span>
            {oferta.marca_iam && <span style={{ marginLeft: 6, color: "#94a3b8", fontSize: 12, fontWeight: 700 }}>{oferta.marca_iam}</span>}
          </div>
          <div style={{ textAlign: "right" }}>
            <p style={{ fontSize: 22, fontWeight: 900, color: "#22c55e", lineHeight: 1 }}>{Number(oferta.precio).toFixed(2)}€</p>
            {oferta.impuesto && Number(oferta.impuesto) > 0 && (
              <p style={{ fontSize: 10, color: "#fbbf24", fontWeight: 700 }}>+{Number(oferta.impuesto).toFixed(2)}€ imp/casco</p>
            )}
          </div>
        </div>
        <p style={{ fontSize: 13, color: "#cbd5e1", marginBottom: 8 }}>{descripcion}{oferta.marca ? ` · ${oferta.marca}` : ""}</p>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12, fontSize: 12 }}>
          <span style={{ color: "#94a3b8" }}>🏭 {proveedor}</span>
          {oferta.provincia && <span style={{ color: "#94a3b8" }}>📍 {oferta.provincia}</span>}
          <span style={{ background: "rgba(22,163,74,0.15)", color: "#4ade80", padding: "1px 8px", borderRadius: 999, fontWeight: 700 }}>{oferta.stock} uds</span>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => pedirOferta(oferta)} style={{ flex: 1, border: "none", color: "white", padding: "13px", borderRadius: 12, fontWeight: 800, cursor: "pointer", fontSize: 14, background: enCesta ? "linear-gradient(135deg,#16a34a,#15803d)" : "linear-gradient(135deg,#2563eb,#1d4ed8)" }}>{enCesta ? "✓ Añadido" : "🛒 Pedir"}</button>
          <button data-menu="true" onClick={(e) => toggleMenu(e, oferta.id)} style={{ width: 44, height: 44, borderRadius: 12, border: "1px solid rgba(255,255,255,0.1)", background: menuAbierto === oferta.id ? "rgba(37,99,235,0.3)" : "rgba(255,255,255,0.05)", color: "white", fontSize: 20, cursor: "pointer", flexShrink: 0 }}>⋮</button>
        </div>
      </div>
    );
  }

  function renderOfertaDesktopRow(oferta: Oferta) {
    const descripcion = oferta.descripcion || oferta.descripcion_iam || oferta.nombre || "-";
    const proveedor = oferta.proveedor_nombre || oferta.proveedor || "-";
    const enCesta = cestaMensaje === oferta.id;
    const tipoUp = (oferta.tipo || "").toUpperCase();
    const badge = getTipoBadge(oferta.tipo);
    return (
      <div key={oferta.id} style={{ display: "grid", gridTemplateColumns: "1fr 2fr 2fr 1fr 1fr 1fr 1.5fr", gap: 20, padding: 24, alignItems: "center", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <div>
          <div style={{ fontWeight: 800, fontSize: 18, marginBottom: 4 }}>{oferta.referencia}</div>
          <span style={{ background: badge.bg, color: badge.color, padding: "2px 10px", borderRadius: 999, fontSize: 11, fontWeight: 700 }}>{tipoUp || "OEM"}</span>
          {oferta.marca_iam && <span style={{ marginLeft: 8, color: "#94a3b8", fontSize: 12, fontWeight: 700 }}>{oferta.marca_iam}</span>}
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>{descripcion}</div>
          {oferta.marca && <div style={{ color: "#94a3b8", fontSize: 13 }}>{oferta.marca}</div>}
        </div>
        <div>
          <div style={{ fontWeight: 800, fontSize: 16 }}>{proveedor}</div>
          {oferta.poblacion && <div style={{ color: "#94a3b8", fontSize: 13, marginTop: 4 }}>{oferta.poblacion}</div>}
        </div>
        <div><span style={{ background: "rgba(22,163,74,0.18)", color: "#4ade80", padding: "8px 14px", borderRadius: 999, fontWeight: 700, fontSize: 14 }}>{oferta.stock} uds</span></div>
        <div style={{ color: "#cbd5e1", fontWeight: 700 }}>{oferta.provincia || "-"}</div>
        <div>
          <div style={{ fontSize: 36, fontWeight: 900, color: "#22c55e" }}>{Number(oferta.precio).toFixed(2)}€</div>
          {oferta.impuesto && Number(oferta.impuesto) > 0 && <div style={{ fontSize: 12, color: "#fbbf24", fontWeight: 700 }}>+{Number(oferta.impuesto).toFixed(2)}€ imp/casco</div>}
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <button onClick={() => pedirOferta(oferta)} style={{ border: "none", color: "white", padding: "14px 20px", borderRadius: 14, fontWeight: 800, cursor: "pointer", fontSize: 14, minWidth: 90, background: enCesta ? "linear-gradient(135deg,#16a34a,#15803d)" : "linear-gradient(135deg,#2563eb,#1d4ed8)" }}>
            {enCesta ? "✓ AÑADIDO" : "PEDIR"}
          </button>
          <button data-menu="true" onClick={(e) => toggleMenu(e, oferta.id)} style={{ width: 42, height: 42, borderRadius: 12, border: "1px solid rgba(255,255,255,0.08)", background: menuAbierto === oferta.id ? "rgba(37,99,235,0.3)" : "rgba(255,255,255,0.04)", color: "white", fontSize: 20, cursor: "pointer" }}>⋮</button>
        </div>
      </div>
    );
  }

  // ---- Panel genérico (Stock OEM / Stock IAM) ----
  function renderPanel(titulo: string, icono: string, lista: Oferta[]) {
    if (loadingCruce) {
      return (
        <div style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: 18, fontWeight: 900, marginBottom: 12 }}>{icono} {titulo}</h2>
          <div style={{ padding: "30px", textAlign: "center", color: "#94a3b8", background: "rgba(15,23,42,0.6)", borderRadius: 16 }}>Buscando...</div>
        </div>
      );
    }
    if (lista.length === 0) {
      return (
        <div style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: 18, fontWeight: 900, marginBottom: 12 }}>{icono} {titulo}</h2>
          <div style={{ padding: "24px", textAlign: "center", color: "#64748b", background: "rgba(15,23,42,0.4)", borderRadius: 16, fontSize: 14 }}>Sin proveedores disponibles</div>
        </div>
      );
    }
    return (
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 18, fontWeight: 900, marginBottom: 12 }}>{icono} {titulo} <span style={{ color: "#94a3b8", fontWeight: 700, fontSize: 14 }}>({lista.length})</span></h2>
        {isMobile ? (
          <div style={{ display: "grid", gap: 10 }}>
            {lista.map(renderOfertaMobile)}
          </div>
        ) : (
          <div style={{ width: "100%", borderRadius: 28, overflow: "hidden", border: "1px solid rgba(255,255,255,0.06)", background: "rgba(15,23,42,0.95)" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr 2fr 1fr 1fr 1fr 1.5fr", gap: 20, padding: "20px 24px", background: "rgba(255,255,255,0.04)", fontWeight: 800, color: "#94a3b8", fontSize: 13 }}>
              {["REFERENCIA","DESCRIPCIÓN","PROVEEDOR","STOCK","PROVINCIA","PRECIO","ACCIÓN"].map(h => <div key={h}>{h}</div>)}
            </div>
            {lista.map(renderOfertaDesktopRow)}
          </div>
        )}
      </div>
    );
  }

  return (
    <main style={{ minHeight: "100vh", background: "linear-gradient(135deg,#020617,#020b2d)", color: "white", padding: isMobile ? "16px 12px" : "clamp(16px,4vw,40px)" }}>

      {/* MODAL CONTACTO */}
      {contactoModal && (
        <div onClick={() => setContactoModal(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 999999, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: "#0f172a", borderRadius: 24, padding: 28, width: "100%", maxWidth: 400, border: "1px solid rgba(255,255,255,0.1)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h3 style={{ fontWeight: 900, fontSize: 18, margin: 0 }}>Datos de contacto</h3>
              <button onClick={() => setContactoModal(null)} style={{ background: "rgba(255,255,255,0.06)", border: "none", color: "#94a3b8", width: 32, height: 32, borderRadius: "50%", cursor: "pointer", fontSize: 16 }}>✕</button>
            </div>
            <p style={{ fontWeight: 800, fontSize: 16, marginBottom: 16 }}>🏭 {contactoModal.nombre}</p>
            <a href={`tel:${contactoModal.telefono}`} style={{ display: "flex", alignItems: "center", gap: 10, background: "rgba(37,99,235,0.08)", border: "1px solid rgba(37,99,235,0.15)", borderRadius: 12, padding: "14px 16px", marginBottom: 10, textDecoration: "none" }}>
              <span style={{ fontSize: 20 }}>📞</span>
              <div>
                <p style={{ color: "#94a3b8", fontSize: 10, fontWeight: 700, margin: 0 }}>TELÉFONO</p>
                <p style={{ color: "#60a5fa", fontWeight: 800, fontSize: 16, margin: 0 }}>{contactoModal.telefono}</p>
              </div>
            </a>
            <a href={`mailto:${contactoModal.email}`} style={{ display: "flex", alignItems: "center", gap: 10, background: "rgba(139,92,246,0.08)", border: "1px solid rgba(139,92,246,0.15)", borderRadius: 12, padding: "14px 16px", textDecoration: "none" }}>
              <span style={{ fontSize: 20 }}>✉️</span>
              <div>
                <p style={{ color: "#94a3b8", fontSize: 10, fontWeight: 700, margin: 0 }}>EMAIL</p>
                <p style={{ color: "#a78bfa", fontWeight: 800, fontSize: 14, margin: 0 }}>{contactoModal.email}</p>
              </div>
            </a>
            <button onClick={() => setContactoModal(null)} style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#94a3b8", padding: "12px", borderRadius: 12, cursor: "pointer", fontWeight: 700, marginTop: 16 }}>Cerrar</button>
          </div>
        </div>
      )}

      {/* LIGHTBOX */}
      {fotoVisor && (
        <div onClick={() => setFotoVisor(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.92)", zIndex: 999999, display: "flex", alignItems: "center", justifyContent: "center", cursor: "zoom-out" }}>
          <div onClick={e => e.stopPropagation()} style={{ position: "relative", maxWidth: "90vw", maxHeight: "90vh" }}>
            <img src={fotoVisor} alt="Foto pieza" style={{ maxWidth: "90vw", maxHeight: "85vh", objectFit: "contain", borderRadius: 16 }} />
            <button onClick={() => setFotoVisor(null)} style={{ position: "absolute", top: -16, right: -16, width: 36, height: 36, borderRadius: "50%", background: "rgba(239,68,68,0.9)", border: "none", color: "white", fontSize: 18, fontWeight: 900, cursor: "pointer" }}>✕</button>
          </div>
        </div>
      )}

      {abriendo && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(2,6,23,0.8)", zIndex: 99998, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "#0f172a", borderRadius: 20, padding: "32px 48px", textAlign: "center", border: "1px solid rgba(255,255,255,0.1)" }}>
            <p style={{ fontSize: 32, marginBottom: 12 }}>💬</p>
            <p style={{ fontWeight: 700 }}>Abriendo chat...</p>
          </div>
        </div>
      )}

      <div style={{ maxWidth: 1700, margin: "0 auto" }}>

        {/* CABECERA */}
        <div style={{ marginBottom: isMobile ? 16 : 32 }}>
          <div style={{ display: "inline-block", padding: isMobile ? "6px 14px" : "10px 18px", borderRadius: 999, background: "rgba(37,99,235,0.15)", color: "#60a5fa", fontWeight: 700, marginBottom: 10, fontSize: isMobile ? 11 : 14 }}>MARKETPLACE B2B</div>
          <h1 style={{ fontSize: isMobile ? "28px" : "clamp(32px,8vw,70px)", fontWeight: 900, marginBottom: 6, lineHeight: 1 }}>{q || "BUSCAR"}</h1>
        </div>

        {/* PANEL STOCK OEM */}
        {renderPanel("Stock OEM", "🔧", stockOEM)}

        {/* PANEL STOCK IAM */}
        {renderPanel("Stock IAM", "⚙️", stockIAM)}

        {/* RESULTADOS DE TEXTO LIBRE (búsqueda por descripción / coincidencia parcial) */}
        <div style={{ marginBottom: isMobile ? 16 : 24, marginTop: 12 }}>
          <h2 style={{ fontSize: 18, fontWeight: 900, marginBottom: 4 }}>🔍 Otros resultados por texto</h2>
          <p style={{ color: "#94a3b8", fontSize: isMobile ? 13 : 15 }}>
            {loading ? "Buscando..." : `${ofertasFiltradas.length} resultado${ofertasFiltradas.length !== 1 ? "s" : ""}`}
          </p>
        </div>

        {/* FILTROS */}
        <div style={{ display: "flex", gap: 8, marginBottom: isMobile ? 14 : 20, alignItems: "center", flexWrap: "wrap", overflowX: "auto" }}>
          {FILTROS_TIPO.map(f => (
            <button key={f} onClick={() => setFiltroTipo(f)} style={{ padding: isMobile ? "8px 16px" : "10px 22px", borderRadius: 999, fontWeight: 700, cursor: "pointer", fontSize: isMobile ? 13 : 14, whiteSpace: "nowrap", background: filtroTipo === f ? "linear-gradient(135deg,#2563eb,#1d4ed8)" : "rgba(255,255,255,0.05)", border: filtroTipo === f ? "none" : "1px solid rgba(255,255,255,0.08)", color: filtroTipo === f ? "white" : "#94a3b8" }}>{f}</button>
          ))}
        </div>

        {loading && <div style={{ padding: "60px", textAlign: "center", color: "#94a3b8" }}>Buscando...</div>}
        {!loading && ofertasFiltradas.length === 0 && (
          <div style={{ padding: "60px", textAlign: "center", color: "#94a3b8", fontSize: 16 }}>
            No hay resultados para <strong style={{ color: "white" }}>"{q}"</strong>
          </div>
        )}

        {/* ── MÓVIL: tarjetas ── */}
        {isMobile && !loading && (
          <div style={{ display: "grid", gap: 10 }}>
            {ofertasFiltradas.map(renderOfertaMobile)}
          </div>
        )}

        {/* ── DESKTOP: tabla ── */}
        {!isMobile && !loading && ofertasFiltradas.length > 0 && (
          <div style={{ width: "100%", borderRadius: 28, overflow: "hidden", border: "1px solid rgba(255,255,255,0.06)", background: "rgba(15,23,42,0.95)" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr 2fr 1fr 1fr 1fr 1.5fr", gap: 20, padding: "20px 24px", background: "rgba(255,255,255,0.04)", fontWeight: 800, color: "#94a3b8", fontSize: 13 }}>
              {["REFERENCIA","DESCRIPCIÓN","PROVEEDOR","STOCK","PROVINCIA","PRECIO","ACCIÓN"].map(h => <div key={h}>{h}</div>)}
            </div>
            {ofertasFiltradas.map(renderOfertaDesktopRow)}
          </div>
        )}
      </div>

      {/* MENÚ CONTEXTUAL */}
      {menuAbierto !== null && (
        <div data-menu="true" style={{ position: "fixed", top: menuPos.top, left: menuPos.left, width: 210, background: "#0f172a", borderRadius: 14, overflow: "hidden", border: "1px solid rgba(255,255,255,0.15)", zIndex: 99999, boxShadow: "0 20px 50px rgba(0,0,0,0.9)" }}>
          <button data-menu="true" style={{ width: "100%", border: "none", background: "transparent", color: "white", padding: "14px 18px", textAlign: "left", cursor: "pointer", fontWeight: 700, borderBottom: "1px solid rgba(255,255,255,0.05)", fontSize: 14 }} onClick={() => abrirChatConProveedor(menuAbierto!)}>💬 Abrir chat</button>
          <button data-menu="true" style={{ width: "100%", border: "none", background: "transparent", color: "white", padding: "14px 18px", textAlign: "left", cursor: "pointer", fontWeight: 700, fontSize: 14 }} onClick={() => verTelefono(menuAbierto!)}>📞 Ver contacto</button>
        </div>
      )}
    </main>
  );
}

export default function BuscarPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", background: "linear-gradient(135deg,#020617,#020b2d)", display: "flex", alignItems: "center", justifyContent: "center", color: "white" }}><p>Cargando...</p></div>}>
      <BuscarPageInner />
    </Suspense>
  );
}