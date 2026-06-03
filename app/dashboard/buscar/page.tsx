"use client";

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
};

const FILTROS_TIPO = ["TODOS", "OEM", "IAM", "UNIVERSAL"];

export default function BuscarPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const q = searchParams.get("q") || "";
  const [ofertas, setOfertas] = useState<Oferta[]>([]);
  const [loading, setLoading] = useState(true);
  const [menuAbierto, setMenuAbierto] = useState<number | null>(null);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
  const [cestaMensaje, setCestaMensaje] = useState<number | null>(null);
  const [filtroTipo, setFiltroTipo] = useState("TODOS");
  const [abriendo, setAbriendo] = useState(false);
  const [fotoVisor, setFotoVisor] = useState<string | null>(null);

  useEffect(() => { cargarOfertas(); }, [q]);

  useEffect(() => {
    function cerrar(e: MouseEvent) {
      const target = e.target as HTMLElement;
      if (!target.closest("[data-menu]")) setMenuAbierto(null);
    }
    document.addEventListener("click", cerrar);
    return () => document.removeEventListener("click", cerrar);
  }, []);

  // Cerrar visor con Escape
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setFotoVisor(null);
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, []);

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
          const excluidoPorCp = exclusiones.some(exc =>
            exc.proveedor_id === oferta.proveedor_id && exc.tipo === "cp" &&
            perfil.codigo_postal && exc.valor === perfil.codigo_postal
          );
          if (excluidoPorCp) return false;
          const excluidoPorCliente = exclusiones.some(exc =>
            exc.proveedor_id === oferta.proveedor_id && exc.tipo === "cliente" && exc.valor === perfil.email
          );
          if (excluidoPorCliente) return false;
          return true;
        });
      }
    }

    setOfertas(resultado);
    setLoading(false);
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
    if (oferta.proveedor_id === user.id) { alert("No puedes añadir tus propias piezas a la cesta"); return; }

    const descripcion = oferta.descripcion || oferta.nombre || oferta.referencia;
    const proveedorNombre = oferta.proveedor_nombre || oferta.proveedor || "Proveedor";

    const { data: piezaBD } = await supabase.from("piezas_publicadas").select("proveedor_id, proveedor_nombre").eq("id", oferta.id).single();
    const proveedorIdFinal = piezaBD?.proveedor_id || oferta.proveedor_id;
    const proveedorNombreFinal = piezaBD?.proveedor_nombre || proveedorNombre;

    const { error } = await supabase.from("cesta").insert({
      user_id: user.id, referencia: oferta.referencia, descripcion,
      precio: oferta.precio, impuesto: oferta.impuesto || 0, cantidad: 1,
      stock: oferta.stock || 99,
      proveedor_id: proveedorIdFinal, proveedor_nombre: proveedorNombreFinal,
    });

    if (error) { console.error(error); alert("Error al añadir a la cesta"); return; }
    setCestaMensaje(oferta.id);
    setTimeout(() => setCestaMensaje(null), 2000);
  }

  async function abrirChatConProveedor(ofertaId: number) {
    setMenuAbierto(null);
    setAbriendo(true);
    const oferta = ofertas.find(o => o.id === ofertaId);
    if (!oferta?.proveedor_id) { alert("No hay proveedor asignado"); setAbriendo(false); return; }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { alert("Debes iniciar sesión"); setAbriendo(false); return; }

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
    else alert("Error al abrir el chat");
  }

  async function verTelefono(ofertaId: number) {
    setMenuAbierto(null);
    const oferta = ofertas.find(o => o.id === ofertaId);
    if (!oferta?.proveedor_id) { alert("No hay información de contacto"); return; }
    const { data } = await supabase.from("usuarios").select("telefono, nombre_empresa, email").eq("id", oferta.proveedor_id).single();
    if (data) alert(`📞 ${data.nombre_empresa}\nTeléfono: ${data.telefono || "No disponible"}\nEmail: ${data.email || ""}`);
    else alert("No hay información de contacto disponible");
  }

  function toggleMenu(e: React.MouseEvent, id: number) {
    e.stopPropagation();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    if (menuAbierto === id) { setMenuAbierto(null); return; }
    setMenuPos({ top: rect.bottom + 8, left: rect.right - 210 });
    setTimeout(() => setMenuAbierto(id), 0);
  }

  function getTipoBadgeStyle(tipo?: string) {
    const t = (tipo || "").toUpperCase();
    if (t === "OEM") return badgeOEM;
    if (t === "IAM") return badgeIAM;
    if (t === "UNIVERSAL") return badgeUNIVERSAL;
    return badgeOEM;
  }

  return (
    <main style={mainStyle}>

      {/* LIGHTBOX FOTO */}
      {fotoVisor && (
        <div
          onClick={() => setFotoVisor(null)}
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.92)",
            zIndex: 999999, display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "zoom-out",
          }}
        >
          <div onClick={e => e.stopPropagation()} style={{ position: "relative", maxWidth: "90vw", maxHeight: "90vh" }}>
            <img
              src={fotoVisor}
              alt="Foto pieza"
              style={{ maxWidth: "90vw", maxHeight: "85vh", objectFit: "contain", borderRadius: 16, boxShadow: "0 30px 80px rgba(0,0,0,0.8)" }}
            />
            <button
              onClick={() => setFotoVisor(null)}
              style={{ position: "absolute", top: -16, right: -16, width: 36, height: 36, borderRadius: "50%", background: "rgba(239,68,68,0.9)", border: "none", color: "white", fontSize: 18, fontWeight: 900, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
            >
              ✕
            </button>
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, textAlign: "center", marginTop: 12 }}>
              Pulsa ESC o haz clic fuera para cerrar
            </p>
          </div>
        </div>
      )}

      {abriendo && (
        <div style={loadingOverlay}>
          <div style={loadingBox}>
            <p style={{ fontSize: 32, marginBottom: 12 }}>💬</p>
            <p style={{ fontWeight: 700 }}>Abriendo chat...</p>
          </div>
        </div>
      )}

      <div style={wrapper}>
        <div style={{ marginBottom: "32px" }}>
          <div style={badge}>MARKETPLACE B2B</div>
          <h1 style={titleStyle}>{q || "BUSCAR"}</h1>
          <p style={subtitleStyle}>
            {loading ? "Buscando..." : `${ofertasFiltradas.length} proveedores disponibles para esta referencia.`}
          </p>
        </div>

        <div style={filtrosRow}>
          {FILTROS_TIPO.map(f => (
            <button key={f} onClick={() => setFiltroTipo(f)} style={{
              ...btnFiltro,
              background: filtroTipo === f ? "linear-gradient(135deg,#2563eb,#1d4ed8)" : "rgba(255,255,255,0.05)",
              border: filtroTipo === f ? "none" : "1px solid rgba(255,255,255,0.08)",
              color: filtroTipo === f ? "white" : "#94a3b8",
            }}>{f}</button>
          ))}
          <span style={{ color: "#94a3b8", fontSize: 14, alignSelf: "center", marginLeft: 8 }}>
            {ofertasFiltradas.length} resultados
          </span>
        </div>

        <div style={tableContainer}>
          <div style={tableHeader}>
            <div>REFERENCIA</div>
            <div>DESCRIPCIÓN</div>
            <div>PROVEEDOR</div>
            <div>STOCK</div>
            <div>PROVINCIA</div>
            <div>PRECIO</div>
            <div>ACCIÓN</div>
          </div>

          {loading && <div style={emptyState}>Buscando...</div>}

          {!loading && ofertasFiltradas.length === 0 && (
            <div style={emptyState}>
              No hay resultados para <strong>"{q}"</strong>
              {filtroTipo !== "TODOS" && <span> con filtro <strong>{filtroTipo}</strong></span>}
            </div>
          )}

          {ofertasFiltradas.map((oferta) => {
            const descripcion = oferta.descripcion || oferta.nombre || "-";
            const proveedor = oferta.proveedor_nombre || oferta.proveedor || "-";
            const enCesta = cestaMensaje === oferta.id;
            const tipoUp = (oferta.tipo || "").toUpperCase();

            return (
              <div key={oferta.id} style={tableRow}>
                <div>
                  <div style={colRef}>{oferta.referencia}</div>
                  {oferta.tipo && (
                    <div style={getTipoBadgeStyle(oferta.tipo)}>{tipoUp}</div>
                  )}
                  {/* Miniatura foto para UNIVERSAL */}
                  {tipoUp === "UNIVERSAL" && oferta.foto_url && (
                    <div
                      onClick={() => setFotoVisor(oferta.foto_url!)}
                      style={{ marginTop: 6, cursor: "zoom-in", display: "inline-block" }}
                      title="Ver foto"
                    >
                      <img
                        src={oferta.foto_url}
                        alt="foto"
                        style={{ width: 48, height: 36, objectFit: "cover", borderRadius: 6, border: "1px solid rgba(255,255,255,0.15)" }}
                      />
                    </div>
                  )}
                </div>
                <div>
                  <div style={colDescTitle}>{descripcion}</div>
                  {oferta.marca && <div style={colDescSub}>{oferta.marca}</div>}
                </div>
                <div>
                  <div style={colProvNombre}>{proveedor}</div>
                  {oferta.poblacion && <div style={colProvSub}>{oferta.poblacion}</div>}
                </div>
                <div>
                  <div style={stockBadge}>{oferta.stock} uds</div>
                </div>
                <div style={colProvincia}>{oferta.provincia || "-"}</div>
                <div>
                  <div style={colPrecio}>{Number(oferta.precio).toFixed(2)}€</div>
                  {oferta.impuesto && Number(oferta.impuesto) > 0 && (
                    <div style={{ fontSize: 12, color: "#fbbf24", fontWeight: 700, marginTop: 2 }}>
                      + {Number(oferta.impuesto).toFixed(2)}€ ecotasa
                    </div>
                  )}
                  {oferta.impuesto && Number(oferta.impuesto) > 0 && (
                    <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 1 }}>
                      Total: {(Number(oferta.precio) + Number(oferta.impuesto)).toFixed(2)}€
                    </div>
                  )}
                </div>
                <div style={colAccion}>
                  {tipoUp === "UNIVERSAL" && oferta.foto_url && (
                    <button
                      onClick={() => setFotoVisor(oferta.foto_url!)}
                      style={btnVerFoto}
                      title="Ver foto de la pieza"
                    >
                      📸
                    </button>
                  )}
                  <button
                    onClick={() => pedirOferta(oferta)}
                    style={{
                      ...btnPedir,
                      background: enCesta ? "linear-gradient(135deg,#16a34a,#15803d)" : "linear-gradient(135deg,#2563eb,#1d4ed8)",
                    }}
                  >
                    {enCesta ? "✓ AÑADIDO" : "PEDIR"}
                  </button>
                  <button
                    data-menu="true"
                    onClick={(e) => toggleMenu(e, oferta.id)}
                    style={{ ...btnMenu, background: menuAbierto === oferta.id ? "rgba(37,99,235,0.3)" : "rgba(255,255,255,0.04)" }}
                  >
                    ⋮
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {menuAbierto !== null && (
        <div data-menu="true" style={{
          position: "fixed", top: menuPos.top, left: menuPos.left, width: 210,
          background: "#0f172a", borderRadius: 14, overflow: "hidden",
          border: "1px solid rgba(255,255,255,0.15)", zIndex: 99999, boxShadow: "0 20px 50px rgba(0,0,0,0.9)",
        }}>
          <button data-menu="true" style={dropdownItem} onClick={() => abrirChatConProveedor(menuAbierto!)}>💬 Abrir chat</button>
          <button data-menu="true" style={{ ...dropdownItem, borderBottom: "none" }} onClick={() => verTelefono(menuAbierto!)}>📞 Ver contacto</button>
        </div>
      )}

    </main>
  );
}

/* STYLES */
const mainStyle = { minHeight: "100vh", background: "linear-gradient(135deg,#020617,#020b2d)", padding: "40px", color: "white" };
const wrapper = { maxWidth: "1700px", margin: "0 auto" };
const loadingOverlay = { position: "fixed" as const, inset: 0, background: "rgba(2,6,23,0.8)", zIndex: 99998, display: "flex", alignItems: "center", justifyContent: "center" };
const loadingBox = { background: "#0f172a", borderRadius: 20, padding: "32px 48px", textAlign: "center" as const, border: "1px solid rgba(255,255,255,0.1)" };
const badge = { display: "inline-block", padding: "10px 18px", borderRadius: "999px", background: "rgba(37,99,235,0.15)", color: "#60a5fa", fontWeight: 700, marginBottom: "20px" };
const titleStyle = { fontSize: "70px", fontWeight: 900, marginBottom: "10px", lineHeight: 1 };
const subtitleStyle = { color: "#94a3b8", fontSize: "20px", marginBottom: "0" };
const filtrosRow = { display: "flex", gap: 10, marginBottom: 24, alignItems: "center" };
const btnFiltro = { padding: "10px 22px", borderRadius: 999, fontWeight: 700, cursor: "pointer", fontSize: 14, transition: "all 0.2s" };
const tableContainer = { width: "100%", borderRadius: "28px", overflow: "hidden", border: "1px solid rgba(255,255,255,0.06)", background: "rgba(15,23,42,0.95)" };
const tableHeader = { display: "grid", gridTemplateColumns: "1fr 2fr 2fr 1fr 1fr 1fr 1.5fr", gap: "20px", padding: "20px 24px", background: "rgba(255,255,255,0.04)", fontWeight: 800, color: "#94a3b8", fontSize: "13px" };
const tableRow = { display: "grid", gridTemplateColumns: "1fr 2fr 2fr 1fr 1fr 1fr 1.5fr", gap: "20px", padding: "24px", alignItems: "center", borderTop: "1px solid rgba(255,255,255,0.06)" };
const emptyState = { padding: "60px", textAlign: "center" as const, color: "#94a3b8", fontSize: "18px" };
const colRef = { fontWeight: 800, fontSize: "18px", marginBottom: 4 };
const badgeOEM = { display: "inline-block", background: "rgba(37,99,235,0.2)", color: "#60a5fa", padding: "2px 10px", borderRadius: 999, fontSize: 11, fontWeight: 700 };
const badgeIAM = { display: "inline-block", background: "rgba(139,92,246,0.2)", color: "#a78bfa", padding: "2px 10px", borderRadius: 999, fontSize: 11, fontWeight: 700 };
const badgeUNIVERSAL = { display: "inline-block", background: "rgba(22,163,74,0.2)", color: "#4ade80", padding: "2px 10px", borderRadius: 999, fontSize: 11, fontWeight: 700 };
const colDescTitle = { fontWeight: 700, fontSize: "16px", marginBottom: "4px" };
const colDescSub = { color: "#94a3b8", fontSize: "13px" };
const colProvNombre = { fontWeight: 800, fontSize: "16px" };
const colProvSub = { color: "#94a3b8", marginTop: "4px", fontSize: "13px" };
const stockBadge = { display: "inline-block", padding: "8px 14px", borderRadius: "999px", background: "rgba(22,163,74,0.18)", color: "#4ade80", fontWeight: 700, fontSize: "14px" };
const colProvincia = { color: "#cbd5e1", fontWeight: 700 };
const colPrecio = { fontSize: "36px", fontWeight: 900, color: "#22c55e" };
const colAccion = { display: "flex", gap: "10px", alignItems: "center" };
const btnPedir = { border: "none", color: "white", padding: "14px 20px", borderRadius: "14px", fontWeight: 800, cursor: "pointer", fontSize: "14px", minWidth: "90px" };
const btnVerFoto = { width: 42, height: 42, borderRadius: 10, background: "rgba(22,163,74,0.15)", border: "1px solid rgba(22,163,74,0.3)", color: "#4ade80", fontSize: 18, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 };
const btnMenu = { width: "42px", height: "42px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.08)", color: "white", fontSize: "20px", cursor: "pointer", flexShrink: 0 };
const dropdownItem = { width: "100%", border: "none", background: "transparent", color: "white", padding: "14px 18px", textAlign: "left" as const, cursor: "pointer", fontWeight: 700, borderBottom: "1px solid rgba(255,255,255,0.05)", fontSize: "14px" };