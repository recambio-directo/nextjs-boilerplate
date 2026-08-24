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

type PestañaKey = "OEM" | "IAM" | "EQ";

function BuscarPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const q = searchParams.get("q") || "";
  const qSinEspacios = q.replace(/\s+/g, "");
  const [stockOEM, setStockOEM] = useState<Oferta[]>([]);
  const [stockIAM, setStockIAM] = useState<Oferta[]>([]);
  const [stockEQ, setStockEQ] = useState<Oferta[]>([]);
  const [loadingCruce, setLoadingCruce] = useState(true);
  const [menuAbierto, setMenuAbierto] = useState<number | null>(null);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
  const [cestaMensaje, setCestaMensaje] = useState<number | null>(null);
  const [abriendo, setAbriendo] = useState(false);
  const [fotoVisor, setFotoVisor] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [contactoModal, setContactoModal] = useState<{ nombre: string; telefono: string; email: string } | null>(null);
  const [pestañaActiva, setPestañaActiva] = useState<PestañaKey>("IAM");

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    cargarStockOEMeIAM();
    setPestañaActiva("IAM");
  }, [q]);

  useEffect(() => {
    if (!loadingCruce && stockIAM.length === 0 && stockOEM.length > 0) {
      setPestañaActiva("OEM");
    }
  }, [loadingCruce, stockIAM, stockOEM]);

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

  async function cargarStockOEMeIAM() {
    if (!qSinEspacios) { setStockOEM([]); setStockIAM([]); setStockEQ([]); setLoadingCruce(false); return; }
    setLoadingCruce(true);
    try {
      const { data: { user: userBuscar } } = await supabase.auth.getUser();
      const { data: perfilBuscar } = userBuscar ? await supabase.from("usuarios").select("codigo_postal, email").eq("id", userBuscar.id).single() : { data: null };
      const cpParam = perfilBuscar?.codigo_postal ? `&cp=${encodeURIComponent(perfilBuscar.codigo_postal)}` : "";
      const emailParam = perfilBuscar?.email ? `&email=${encodeURIComponent(perfilBuscar.email)}` : "";
      const res = await fetch(`/api/buscar-pieza?referencia=${encodeURIComponent(qSinEspacios)}${cpParam}${emailParam}`);
      if (!res.ok) {
        setStockOEM([]); setStockIAM([]); setStockEQ([]);
        setLoadingCruce(false);
        return;
      }
      const data = await res.json();
      let resultadoOEM: Oferta[] = data?.stock_oem?.proveedores || [];
      let resultadoIAMRaw: Oferta[] = data?.stock_iam?.proveedores || [];

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: perfil } = await supabase.from("usuarios").select("codigo_postal, email").eq("id", user.id).single();
        const { data: exclusiones } = await supabase.from("exclusiones_proveedor").select("*");
        if (perfil && exclusiones && exclusiones.length > 0) {
          const aplicarExclusiones = (lista: Oferta[]) =>
            lista.filter(oferta => {
              const excluidoPorCp = exclusiones.some((exc: any) => exc.proveedor_id === oferta.proveedor_id && exc.tipo === "cp" && perfil.codigo_postal && exc.valor === perfil.codigo_postal);
              if (excluidoPorCp) return false;
              const excluidoPorCliente = exclusiones.some((exc: any) => exc.proveedor_id === oferta.proveedor_id && exc.tipo === "cliente" && exc.valor === perfil.email);
              if (excluidoPorCliente) return false;
              return true;
            });
          resultadoOEM = aplicarExclusiones(resultadoOEM);
          resultadoIAMRaw = aplicarExclusiones(resultadoIAMRaw);
        }
      }

      const refNorm = qSinEspacios.toUpperCase().replace(/[\s\-_./]/g, "");
      const resultadoIAM = resultadoIAMRaw.filter(o => o.referencia.toUpperCase().replace(/[\s\-_./]/g, "") === refNorm);
      const resultadoEQ = resultadoIAMRaw.filter(o => o.referencia.toUpperCase().replace(/[\s\-_./]/g, "") !== refNorm);

      setStockOEM(resultadoOEM);
      setStockIAM(resultadoIAM);
      setStockEQ(resultadoEQ);
    } catch (err) {
      console.error("Error de red llamando a /api/buscar-pieza:", err);
      setStockOEM([]); setStockIAM([]); setStockEQ([]);
    } finally {
      setLoadingCruce(false);
    }
  }

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
    const todasLasOfertas = [...stockOEM, ...stockIAM, ...stockEQ];
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
    const todasLasOfertas = [...stockOEM, ...stockIAM, ...stockEQ];
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

  function renderOfertaMobile(oferta: Oferta) {
    const descripcion = oferta.descripcion || oferta.descripcion_iam || oferta.nombre || "-";
    const proveedor = oferta.proveedor_nombre || oferta.proveedor || "-";
    const enCesta = cestaMensaje === oferta.id;
    const tipoUp = (oferta.tipo || "").toUpperCase();
    const badge = getTipoBadge(oferta.tipo);
    return (
      <div key={oferta.id} style={{ background: "rgba(15,23,42,0.97)", borderRadius: 12, padding: 12, border: "1px solid rgba(255,255,255,0.07)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
          <div>
            <p style={{ fontWeight: 900, fontSize: 15, marginBottom: 3 }}>{oferta.referencia}</p>
            <span style={{ background: badge.bg, color: badge.color, padding: "2px 8px", borderRadius: 999, fontSize: 10, fontWeight: 700 }}>{tipoUp || "OEM"}</span>
            {oferta.marca_iam && <span style={{ marginLeft: 6, color: "#94a3b8", fontSize: 11, fontWeight: 700 }}>{oferta.marca_iam}</span>}
          </div>
          <div style={{ textAlign: "right" }}>
            <p style={{ fontSize: 18, fontWeight: 900, color: "#22c55e", lineHeight: 1 }}>{Number(oferta.precio).toFixed(2)}€</p>
            {oferta.impuesto && Number(oferta.impuesto) > 0 && (
              <p style={{ fontSize: 10, color: "#fbbf24", fontWeight: 700 }}>+{Number(oferta.impuesto).toFixed(2)}€</p>
            )}
          </div>
        </div>
        <p style={{ fontSize: 12, color: "#cbd5e1", marginBottom: 6 }}>{descripcion}{oferta.marca ? ` · ${oferta.marca}` : ""}</p>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10, fontSize: 11 }}>
          <span style={{ color: "#94a3b8" }}>🏭 {proveedor}</span>
          {oferta.provincia && <span style={{ color: "#94a3b8" }}>📍 {oferta.provincia}</span>}
          <span style={{ background: "rgba(22,163,74,0.15)", color: "#4ade80", padding: "1px 6px", borderRadius: 999, fontWeight: 700 }}>{oferta.stock} uds</span>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => pedirOferta(oferta)} style={{ flex: 1, border: "none", color: "white", padding: "10px", borderRadius: 10, fontWeight: 800, cursor: "pointer", fontSize: 13, background: enCesta ? "linear-gradient(135deg,#16a34a,#15803d)" : "linear-gradient(135deg,#2563eb,#1d4ed8)" }}>{enCesta ? "✓ Añadido" : "🛒 Pedir"}</button>
          <button data-menu="true" onClick={(e) => toggleMenu(e, oferta.id)} style={{ width: 40, height: 40, borderRadius: 10, border: "1px solid rgba(255,255,255,0.1)", background: menuAbierto === oferta.id ? "rgba(37,99,235,0.3)" : "rgba(255,255,255,0.05)", color: "white", fontSize: 18, cursor: "pointer", flexShrink: 0 }}>⋮</button>
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
      <div key={oferta.id} style={{ display: "grid", gridTemplateColumns: "1fr 2fr 2fr 0.7fr 0.8fr 0.9fr 1.2fr", gap: 12, padding: "10px 16px", alignItems: "center", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <div>
          <div style={{ fontWeight: 800, fontSize: 13, marginBottom: 2 }}>{oferta.referencia}</div>
          <span style={{ background: badge.bg, color: badge.color, padding: "1px 7px", borderRadius: 999, fontSize: 10, fontWeight: 700 }}>{tipoUp || "OEM"}</span>
          {oferta.marca_iam && <span style={{ marginLeft: 6, color: "#94a3b8", fontSize: 11, fontWeight: 700 }}>{oferta.marca_iam}</span>}
        </div>
        <div>
          <div style={{ fontWeight: 600, fontSize: 12, marginBottom: 1, color: "#e2e8f0" }}>{descripcion}</div>
          {oferta.marca && <div style={{ color: "#64748b", fontSize: 11 }}>{oferta.marca}</div>}
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 12, color: "#cbd5e1" }}>{proveedor}</div>
        </div>
        <div><span style={{ background: "rgba(22,163,74,0.18)", color: "#4ade80", padding: "3px 8px", borderRadius: 999, fontWeight: 700, fontSize: 12 }}>{oferta.stock}</span></div>
        <div style={{ color: "#94a3b8", fontWeight: 600, fontSize: 12 }}>{oferta.provincia || "-"}</div>
        <div>
          <div style={{ fontSize: 17, fontWeight: 900, color: "#22c55e" }}>{Number(oferta.precio).toFixed(2)}€</div>
          {oferta.impuesto && Number(oferta.impuesto) > 0 && <div style={{ fontSize: 10, color: "#fbbf24", fontWeight: 700 }}>+{Number(oferta.impuesto).toFixed(2)}€</div>}
        </div>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <button onClick={() => pedirOferta(oferta)} style={{ border: "none", color: "white", padding: "7px 12px", borderRadius: 9, fontWeight: 800, cursor: "pointer", fontSize: 12, background: enCesta ? "linear-gradient(135deg,#16a34a,#15803d)" : "linear-gradient(135deg,#2563eb,#1d4ed8)" }}>
            {enCesta ? "✓ AÑADIDO" : "PEDIR"}
          </button>
          <button data-menu="true" onClick={(e) => toggleMenu(e, oferta.id)} style={{ width: 32, height: 32, borderRadius: 8, border: "1px solid rgba(255,255,255,0.08)", background: menuAbierto === oferta.id ? "rgba(37,99,235,0.3)" : "rgba(255,255,255,0.04)", color: "white", fontSize: 15, cursor: "pointer" }}>⋮</button>
        </div>
      </div>
    );
  }

  function renderTabs() {
    const tabs: { key: PestañaKey; titulo: string; icono: string; lista: Oferta[]; colorActivo: string }[] = [
      { key: "OEM", titulo: "Stock OEM", icono: "🔧", lista: stockOEM, colorActivo: "linear-gradient(135deg,#2563eb,#1d4ed8)" },
      { key: "IAM", titulo: "Stock IAM", icono: "⚙️", lista: stockIAM, colorActivo: "linear-gradient(135deg,#7c3aed,#6d28d9)" },
      { key: "EQ",  titulo: "Equivalencias", icono: "🔄", lista: stockEQ, colorActivo: "linear-gradient(135deg,#0891b2,#0e7490)" },
    ];

    return (
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "nowrap" }}>
          {tabs.map((tab) => {
            const activa = pestañaActiva === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setPestañaActiva(tab.key)}
                style={{
                  flex: 1, minWidth: 0,
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                  padding: isMobile ? "14px 10px" : "16px 20px",
                  borderRadius: 12,
                  border: activa ? "none" : "1px solid rgba(255,255,255,0.08)",
                  background: activa ? tab.colorActivo : "rgba(15,23,42,0.6)",
                  color: activa ? "white" : "#94a3b8",
                  fontWeight: 900, fontSize: isMobile ? 13 : 15,
                  cursor: "pointer", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                }}
              >
                <span>{tab.icono}</span>
                <span>{tab.titulo}</span>
                <span style={{ opacity: 0.85, fontSize: isMobile ? 11 : 12 }}>
                  {loadingCruce ? "(...)" : `(${tab.lista.length})`}
                </span>
              </button>
            );
          })}
        </div>

        {(() => {
          const tabActiva = tabs.find((t) => t.key === pestañaActiva)!;
          const lista = tabActiva.lista;
          if (loadingCruce) {
            return <div style={{ padding: "30px", textAlign: "center", color: "#94a3b8", background: "rgba(15,23,42,0.6)", borderRadius: 14 }}>Buscando...</div>;
          }
          if (lista.length === 0) {
            return <div style={{ padding: "20px", textAlign: "center", color: "#64748b", background: "rgba(15,23,42,0.4)", borderRadius: 14, fontSize: 13 }}>Sin proveedores disponibles</div>;
          }
          if (isMobile) {
            return <div style={{ display: "grid", gap: 8 }}>{lista.map(renderOfertaMobile)}</div>;
          }
          return (
            <div style={{ width: "100%", borderRadius: 16, overflow: "hidden", border: "1px solid rgba(255,255,255,0.06)", background: "rgba(15,23,42,0.95)" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr 2fr 0.7fr 0.8fr 0.9fr 1.2fr", gap: 12, padding: "10px 16px", background: "rgba(255,255,255,0.04)", fontWeight: 800, color: "#64748b", fontSize: 11 }}>
                {["REFERENCIA","DESCRIPCIÓN","PROVEEDOR","STOCK","PROVINCIA","PRECIO","ACCIÓN"].map(h => <div key={h}>{h}</div>)}
              </div>
              {lista.map(renderOfertaDesktopRow)}
            </div>
          );
        })()}
      </div>
    );
  }

  return (
    <main style={{ minHeight: "100vh", background: "linear-gradient(135deg,#020617,#020b2d)", color: "white", padding: isMobile ? "16px 12px" : "clamp(16px,4vw,40px)" }}>

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
        <div style={{ marginBottom: isMobile ? 14 : 20 }}>
          <div style={{ display: "inline-block", padding: isMobile ? "6px 14px" : "8px 16px", borderRadius: 999, background: "rgba(37,99,235,0.15)", color: "#60a5fa", fontWeight: 700, marginBottom: 8, fontSize: isMobile ? 11 : 13 }}>MARKETPLACE B2B</div>
          <h1 style={{ fontSize: isMobile ? "18px" : "clamp(18px,3vw,32px)", fontWeight: 900, marginBottom: 4, lineHeight: 1 }}>{q || "BUSCAR"}</h1>
        </div>

        {renderTabs()}

        {!loadingCruce && stockOEM.length === 0 && stockIAM.length === 0 && stockEQ.length === 0 && (
          <div style={{ padding: "60px", textAlign: "center", color: "#94a3b8", fontSize: 16 }}>
            No hay resultados para <strong style={{ color: "white" }}>"{q}"</strong>
          </div>
        )}
      </div>

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