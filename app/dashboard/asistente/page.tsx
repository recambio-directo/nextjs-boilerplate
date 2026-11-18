"use client";

// ════════════════════════════════════════════════════════════════════
// ASISTENTE DE RECAMBIOS — Fase 1: página completa
// ────────────────────────────────────────────────────────────────────
// Página dedicada en /dashboard/asistente.
// Mantiene la misma API (/api/asistente) y lógica de cesta que el
// panel original, pero con diseño de página completa:
//   • Barra lateral con historial de consultas recientes
//   • Área principal con buscador, pasos, resultados en tabla y sugerencias
// ════════════════════════════════════════════════════════════════════

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import { supabase } from "../../lib/supabase";

/* ── Tipos ─────────────────────────────────────────────────────── */
type Producto = {
  id: string; referencia: string; marca: string; descripcion: string; tipo: string;
  precio: number; impuesto: number; stock: number; proveedor_id: string;
  proveedor_nombre: string; poblacion: string; detalle: string;
};
type Bloque = { tipo: "productos"; titulo: string; items: Producto[] };
type Vehiculo = { id: string; nombre: string; detalle: string };
type Mensaje = { rol: "usuario" | "asistente"; texto: string; bloques?: Bloque[]; vehiculo?: Vehiculo | null; error?: boolean };

type Consulta = {
  id: string;
  titulo: string;
  fecha: string;
  mensajes: Mensaje[];
  vehiculo: Vehiculo | null;
};

const CLAVE_HISTORIAL = "rd_asistente_historial_v1";

const SUGERENCIAS_INICIALES = [
  { texto: "Buscar por matrícula", icono: "🔍", placeholder: true },
  { texto: "Diagnosticar una avería", icono: "🔧", placeholder: true },
  { texto: "Comprobar compatibilidad", icono: "✅", placeholder: true },
];

const SUGERENCIAS_EJEMPLO = [
  "Pastillas de freno delanteras para la matrícula 1234ABC",
  "Me da el código P0401 y tirones al acelerar",
  "¿Qué equivalencias hay en stock de esta referencia?",
];

/* ── Helpers ────────────────────────────────────────────────────── */
function limpiarTexto(t: string): string {
  return (t || "").replace(/\*\*(.*?)\*\*/g, "$1").replace(/^#{1,6}\s*/gm, "").trim();
}

function euros(n: number): string {
  return n.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";
}

function generarId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function extraerTitulo(texto: string): string {
  const limpio = texto.replace(/^(buscar|busca|quiero|necesito|dame|dime)\s+/i, "").trim();
  return limpio.length > 50 ? limpio.slice(0, 47) + "…" : limpio;
}

function fechaCorta(iso: string): string {
  const d = new Date(iso);
  const hoy = new Date();
  if (d.toDateString() === hoy.toDateString()) return "Hoy";
  const ayer = new Date(hoy);
  ayer.setDate(ayer.getDate() - 1);
  if (d.toDateString() === ayer.toDateString()) return "Ayer";
  return d.toLocaleDateString("es-ES", { day: "numeric", month: "short" });
}

/* ── Componente principal ───────────────────────────────────────── */
export default function AsistentePage() {
  const [consultas, setConsultas] = useState<Consulta[]>([]);
  const [consultaActiva, setConsultaActiva] = useState<string | null>(null);
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [vehiculo, setVehiculo] = useState<Vehiculo | null>(null);
  const [texto, setTexto] = useState("");
  const [cargando, setCargando] = useState(false);
  const [restantes, setRestantes] = useState<number | null>(null);
  const [disponible, setDisponible] = useState(true);
  const [anadidos, setAnadidos] = useState<Record<string, "ok" | "error" | "cargando">>({});
  const [cesta, setCesta] = useState<{ unidades: number; total: number }>({ unidades: 0, total: 0 });
  const [recienAnadida, setRecienAnadida] = useState(false);
  const [sidebarAbierta, setSidebarAbierta] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const finRef = useRef<HTMLDivElement>(null);
  const entradaRef = useRef<HTMLTextAreaElement>(null);
  const iniciado = useRef(false);

  // Responsive
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Cargar historial
  useEffect(() => {
    try {
      const guardado = localStorage.getItem(CLAVE_HISTORIAL);
      if (guardado) {
        const parsed = JSON.parse(guardado) as Consulta[];
        setConsultas(parsed);
      }
    } catch {}
  }, []);

  // Guardar historial
  const guardarHistorial = useCallback((lista: Consulta[]) => {
    try { localStorage.setItem(CLAVE_HISTORIAL, JSON.stringify(lista.slice(0, 30))); } catch {}
  }, []);

  // Scroll al nuevo mensaje
  useEffect(() => {
    finRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensajes, cargando]);

  // Comprobar disponibilidad
  useEffect(() => {
    if (iniciado.current) return;
    iniciado.current = true;
    (async () => {
      cargarCesta();
      try {
        const t = await token();
        if (!t) return;
        const r = await fetch("/api/asistente", { headers: { Authorization: `Bearer ${t}` } });
        const d = await r.json().catch(() => ({}));
        if (r.ok) { setDisponible(!!d.activo); setRestantes(d.restantes ?? null); }
      } catch {}
    })();
  }, []);

  async function token(): Promise<string | null> {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token || null;
  }

  async function cargarCesta() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from("cesta").select("precio, impuesto, cantidad").eq("user_id", user.id);
      const filas = data || [];
      setCesta({
        unidades: filas.reduce((n: number, f: any) => n + (Number(f.cantidad) || 1), 0),
        total: filas.reduce((n: number, f: any) => n + (Number(f.precio || 0) + Number(f.impuesto || 0)) * (Number(f.cantidad) || 1), 0),
      });
    } catch {}
  }

  /* ── Nueva consulta ─────────────────────────────────────────── */
  function nuevaConsulta() {
    // Guardar la consulta actual si tiene mensajes
    if (consultaActiva && mensajes.length > 0) {
      setConsultas(prev => {
        const updated = prev.map(c => c.id === consultaActiva ? { ...c, mensajes, vehiculo } : c);
        guardarHistorial(updated);
        return updated;
      });
    }
    setConsultaActiva(null);
    setMensajes([]);
    setVehiculo(null);
    setAnadidos({});
    setTexto("");
    setSidebarAbierta(false);
    setTimeout(() => entradaRef.current?.focus(), 50);
  }

  /* ── Cargar consulta del historial ──────────────────────────── */
  function cargarConsulta(id: string) {
    // Guardar la actual primero
    if (consultaActiva && mensajes.length > 0) {
      setConsultas(prev => {
        const updated = prev.map(c => c.id === consultaActiva ? { ...c, mensajes, vehiculo } : c);
        guardarHistorial(updated);
        return updated;
      });
    }
    const consulta = consultas.find(c => c.id === id);
    if (!consulta) return;
    setConsultaActiva(id);
    setMensajes(consulta.mensajes);
    setVehiculo(consulta.vehiculo);
    setAnadidos({});
    setSidebarAbierta(false);
  }

  /* ── Enviar pregunta ────────────────────────────────────────── */
  async function enviar(contenido?: string) {
    const pregunta = (contenido ?? texto).trim();
    if (!pregunta || cargando) return;

    const historial = mensajes.filter((m) => !m.error).map((m) => ({ rol: m.rol, texto: m.texto }));
    const nuevosMensajes: Mensaje[] = [...mensajes, { rol: "usuario", texto: pregunta }];
    setMensajes(nuevosMensajes);
    setTexto("");
    setCargando(true);

    // Si es una consulta nueva, crearla
    let idConsulta = consultaActiva;
    if (!idConsulta) {
      idConsulta = generarId();
      const nueva: Consulta = {
        id: idConsulta,
        titulo: extraerTitulo(pregunta),
        fecha: new Date().toISOString(),
        mensajes: nuevosMensajes,
        vehiculo: null,
      };
      setConsultaActiva(idConsulta);
      setConsultas(prev => {
        const updated = [nueva, ...prev];
        guardarHistorial(updated);
        return updated;
      });
    }

    try {
      const t = await token();
      if (!t) {
        setMensajes(prev => [...prev, { rol: "asistente", texto: "Tu sesión ha caducado. Vuelve a iniciar sesión.", error: true }]);
        return;
      }
      const r = await fetch("/api/asistente", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${t}` },
        body: JSON.stringify({ pregunta, historial, vehiculo }),
      });
      const d = await r.json().catch(() => ({}));
      if (typeof d?.restantes === "number") setRestantes(d.restantes);
      if (!r.ok) {
        if (r.status === 503) setDisponible(false);
        setMensajes(prev => [...prev, { rol: "asistente", texto: d?.error || "No he podido responder. Inténtalo de nuevo.", error: true }]);
        return;
      }
      if (d.vehiculo) setVehiculo(d.vehiculo);
      const respuesta: Mensaje = { rol: "asistente", texto: d.texto || "", bloques: d.bloques || [], vehiculo: d.vehiculo || null };
      setMensajes(prev => {
        const updated = [...prev, respuesta];
        // Actualizar la consulta en el historial
        setConsultas(cs => {
          const updatedCs = cs.map(c => c.id === idConsulta ? { ...c, mensajes: updated, vehiculo: d.vehiculo || c.vehiculo } : c);
          guardarHistorial(updatedCs);
          return updatedCs;
        });
        return updated;
      });
    } catch {
      setMensajes(prev => [...prev, { rol: "asistente", texto: "Se ha cortado la conexión. Inténtalo de nuevo.", error: true }]);
    } finally {
      setCargando(false);
    }
  }

  /* ── Añadir a cesta ─────────────────────────────────────────── */
  async function anadirACesta(p: Producto) {
    if (anadidos[p.id] === "ok" || anadidos[p.id] === "cargando") return;
    setAnadidos(a => ({ ...a, [p.id]: "cargando" }));
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setAnadidos(a => ({ ...a, [p.id]: "error" })); return; }
    const { error } = await supabase.from("cesta").insert({
      user_id: user.id,
      referencia: p.referencia,
      descripcion: p.descripcion || p.referencia,
      precio: p.precio,
      impuesto: p.impuesto || 0,
      cantidad: 1,
      stock: p.stock || 99,
      proveedor_id: p.proveedor_id,
      proveedor_nombre: p.proveedor_nombre,
    });
    setAnadidos(a => ({ ...a, [p.id]: error ? "error" : "ok" }));
    if (!error) {
      await cargarCesta();
      setRecienAnadida(true);
      setTimeout(() => setRecienAnadida(false), 2500);
    }
  }

  /* ── Contar bloques de productos totales ─────────────────────── */
  const totalProductos = mensajes.reduce((n, m) => n + (m.bloques || []).reduce((nn, b) => nn + b.items.length, 0), 0);
  const tieneResultados = totalProductos > 0;
  const esNueva = mensajes.length === 0;

  /* ── Pasos del proceso ──────────────────────────────────────── */
  const pasos = [
    { label: "Matrícula identificado", completado: !!vehiculo },
    { label: "Referencias compatibles en TecDoc", completado: tieneResultados },
    { label: "Stock en la plataforma", completado: tieneResultados },
  ];

  /* ══════════════════════════════════════════════════════════════ */
  /*  RENDER                                                       */
  /* ══════════════════════════════════════════════════════════════ */
  return (
    <div style={{ display: "flex", minHeight: "calc(100vh - 90px)", background: "#020617", color: "#e2e8f0", fontFamily: "inherit" }}>

      {/* ── Sidebar: historial ────────────────────────────────── */}
      {(!isMobile || sidebarAbierta) && (
        <aside style={{
          width: isMobile ? "100%" : 280,
          minWidth: isMobile ? undefined : 280,
          background: "#0b1120",
          borderRight: "1px solid #1e293b",
          display: "flex",
          flexDirection: "column",
          position: isMobile ? "fixed" : "sticky",
          top: isMobile ? 72 : 90,
          height: isMobile ? undefined : "calc(100vh - 90px)",
          inset: isMobile ? "72px 0 0 0" : undefined,
          zIndex: isMobile ? 100 : undefined,
          alignSelf: "flex-start",
        }}>
          <div style={{ padding: "16px 14px", borderBottom: "1px solid #1e293b" }}>
            <button
              type="button"
              onClick={nuevaConsulta}
              style={{
                width: "100%", padding: "12px 14px", border: "1px solid #334155", borderRadius: 12,
                background: "rgba(37,99,235,0.1)", color: "#93c5fd", cursor: "pointer",
                fontWeight: 700, fontSize: 14, fontFamily: "inherit",
                display: "flex", alignItems: "center", gap: 8,
              }}
            >
              <span style={{ fontSize: 18 }}>+</span> Nueva consulta
            </button>
          </div>

          <div style={{ flex: 1, overflowY: "auto", padding: "8px 0" }}>
            <p style={{ padding: "8px 16px", margin: 0, fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: 1 }}>
              Consultas recientes
            </p>
            {consultas.length === 0 && (
              <p style={{ padding: "12px 16px", margin: 0, fontSize: 13, color: "#475569" }}>
                Aún no hay consultas
              </p>
            )}
            {consultas.map(c => (
              <button
                key={c.id}
                type="button"
                onClick={() => cargarConsulta(c.id)}
                style={{
                  width: "100%", textAlign: "left", border: "none", cursor: "pointer",
                  padding: "10px 16px", fontFamily: "inherit",
                  background: consultaActiva === c.id ? "rgba(37,99,235,0.15)" : "transparent",
                  borderLeft: consultaActiva === c.id ? "3px solid #3b82f6" : "3px solid transparent",
                }}
              >
                <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: consultaActiva === c.id ? "#93c5fd" : "#cbd5e1", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {c.titulo}
                </p>
                <p style={{ margin: "2px 0 0", fontSize: 11, color: "#64748b" }}>
                  {fechaCorta(c.fecha)}
                </p>
              </button>
            ))}
          </div>

          {restantes !== null && (
            <div style={{ padding: "12px 16px", borderTop: "1px solid #1e293b", fontSize: 12, color: "#64748b" }}>
              Consultas de hoy: {40 - restantes} de 40
            </div>
          )}
        </aside>
      )}

      {/* ── Área principal ────────────────────────────────────── */}
      <main style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>

        {/* Botón menú móvil */}
        {isMobile && (
          <div style={{ padding: "10px 16px 0", flexShrink: 0 }}>
            <button type="button" onClick={() => setSidebarAbierta(!sidebarAbierta)}
              style={{ background: "none", border: "none", color: "#cbd5e1", cursor: "pointer", fontSize: 20, padding: 4 }}>
              ☰
            </button>
          </div>
        )}

        {/* Contenido con scroll */}
        <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column" }}>
          <div style={{ maxWidth: 900, width: "100%", margin: "0 auto", padding: isMobile ? "20px 16px" : "32px 24px", display: "flex", flexDirection: "column", gap: 20, flex: 1 }}>

            {/* Estado vacío / bienvenida */}
            {esNueva && (
              <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", gap: 28 }}>
                <div style={{ textAlign: "center" }}>
                  <h1 style={{ margin: 0, fontSize: isMobile ? 22 : 28, fontWeight: 800, color: "#fff" }}>
                    ¿Qué pieza necesitas?
                  </h1>
                  <p style={{ margin: "8px 0 0", fontSize: 15, color: "#94a3b8", maxWidth: 500, marginInline: "auto" }}>
                    Dime la matrícula, el bastidor o una referencia y te busco las piezas disponibles en stock.
                  </p>
                </div>

                {/* Accesos rápidos */}
                <div style={{ display: "flex", justifyContent: "center", gap: 12, flexWrap: "wrap" }}>
                  {SUGERENCIAS_INICIALES.map(s => (
                    <button key={s.texto} type="button"
                      onClick={() => {
                        if (s.texto === "Buscar por matrícula") setTexto("Pastillas de freno para la matrícula ");
                        else if (s.texto === "Diagnosticar una avería") setTexto("Me da el código ");
                        else setTexto("¿Es compatible la referencia ");
                        setTimeout(() => entradaRef.current?.focus(), 50);
                      }}
                      style={{
                        background: "#0f1d3d", border: "1px solid #1e3a8a", borderRadius: 12,
                        padding: "14px 20px", cursor: "pointer", fontFamily: "inherit",
                        display: "flex", alignItems: "center", gap: 8,
                        color: "#bfdbfe", fontWeight: 600, fontSize: 14,
                      }}
                    >
                      <span>{s.icono}</span> {s.texto}
                    </button>
                  ))}
                </div>

                {/* Sugerencias de ejemplo */}
                <div style={{ display: "flex", flexDirection: "column", gap: 8, maxWidth: 600, marginInline: "auto", width: "100%" }}>
                  {SUGERENCIAS_EJEMPLO.map(s => (
                    <button key={s} type="button"
                      onClick={() => (s.includes("1234ABC") || s.includes("esta referencia") ? setTexto(s) : enviar(s))}
                      style={{
                        textAlign: "left", background: "#0b1736", border: "1px solid #1e293b",
                        color: "#cbd5e1", borderRadius: 12, padding: "12px 16px",
                        fontSize: 14, fontWeight: 500, cursor: "pointer", fontFamily: "inherit",
                      }}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Pasos del proceso */}
            {!esNueva && (
              <div style={{ display: "flex", alignItems: "center", gap: 0, flexWrap: "wrap" }}>
                {pasos.map((p, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{
                        width: 24, height: 24, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                        background: p.completado ? "#16a34a" : "#1e293b", color: p.completado ? "#fff" : "#64748b",
                        fontSize: 12, fontWeight: 700,
                      }}>
                        {p.completado ? "✓" : (i + 1)}
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 600, color: p.completado ? "#86efac" : "#64748b", whiteSpace: "nowrap" }}>
                        {p.label}
                      </span>
                    </div>
                    {i < pasos.length - 1 && (
                      <div style={{ width: 32, height: 1, background: "#334155", margin: "0 8px" }} />
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Tarjeta de vehículo */}
            {vehiculo && (
              <div style={{ background: "#0b1736", border: "1px solid #1e293b", borderRadius: 14, padding: "14px 18px", display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{ width: 42, height: 42, borderRadius: 10, background: "rgba(37,99,235,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>🚗</div>
                <div>
                  <p style={{ margin: 0, fontWeight: 700, color: "#fff", fontSize: 15 }}>{vehiculo.nombre}</p>
                  {vehiculo.detalle && <p style={{ margin: "2px 0 0", fontSize: 12, color: "#94a3b8" }}>{vehiculo.detalle}</p>}
                </div>
              </div>
            )}

            {/* Mensajes / conversación */}
            {mensajes.map((m, i) =>
              m.rol === "usuario" ? (
                <div key={i} style={{ alignSelf: "flex-end", maxWidth: "80%", background: "#1d4ed8", color: "#fff", padding: "10px 16px", borderRadius: "16px 16px 4px 16px", fontSize: 14, lineHeight: 1.5, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                  {m.texto}
                </div>
              ) : (
                <div key={i} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {m.texto && (
                    <div style={{ fontSize: 14, lineHeight: 1.7, whiteSpace: "pre-wrap", wordBreak: "break-word", color: m.error ? "#fca5a5" : "#e2e8f0" }}>
                      {limpiarTexto(m.texto)}
                    </div>
                  )}
                  {/* Bloques de productos como tabla */}
                  {(m.bloques || []).map((b, j) => (
                    <section key={j} aria-label={b.titulo} style={{ background: "#0b1736", border: "1px solid #1e293b", borderRadius: 14, overflow: "hidden" }}>
                      <div style={{ padding: "12px 16px", borderBottom: "1px solid #1e293b", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#fff" }}>{b.titulo}</p>
                        <span style={{ fontSize: 12, color: "#64748b" }}>{b.items.length} resultados</span>
                      </div>

                      {/* Tabla de resultados */}
                      <div style={{ overflowX: "auto" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                          <thead>
                            <tr style={{ background: "rgba(255,255,255,0.03)" }}>
                              <th style={{ padding: "10px 14px", textAlign: "left", fontWeight: 700, color: "#94a3b8", fontSize: 11, textTransform: "uppercase", letterSpacing: 0.5 }}>Marca / Ref.</th>
                              <th style={{ padding: "10px 14px", textAlign: "left", fontWeight: 700, color: "#94a3b8", fontSize: 11, textTransform: "uppercase", letterSpacing: 0.5 }}>Proveedor</th>
                              <th style={{ padding: "10px 14px", textAlign: "center", fontWeight: 700, color: "#94a3b8", fontSize: 11, textTransform: "uppercase", letterSpacing: 0.5 }}>Uds</th>
                              <th style={{ padding: "10px 14px", textAlign: "right", fontWeight: 700, color: "#94a3b8", fontSize: 11, textTransform: "uppercase", letterSpacing: 0.5 }}>Precio</th>
                              <th style={{ padding: "10px 14px", textAlign: "center", fontWeight: 700, color: "#94a3b8", fontSize: 11, textTransform: "uppercase", letterSpacing: 0.5 }}></th>
                            </tr>
                          </thead>
                          <tbody>
                            {b.items.map((p) => {
                              const estado = anadidos[p.id];
                              return (
                                <tr key={p.id} style={{ borderTop: "1px solid #1e293b" }}>
                                  <td style={{ padding: "12px 14px", verticalAlign: "top" }}>
                                    <p style={{ margin: 0, fontWeight: 700, color: "#fff", fontSize: 14 }}>
                                      {p.marca || "Sin marca"}
                                      {p.tipo === "OEM" && <span style={{ marginLeft: 6, fontSize: 10, color: "#93c5fd", background: "#0f2a5c", padding: "2px 6px", borderRadius: 6, verticalAlign: "middle" }}>OEM</span>}
                                    </p>
                                    <p style={{ margin: "2px 0 0", fontSize: 12, color: "#94a3b8" }}>{p.referencia}</p>
                                    {p.descripcion && <p style={{ margin: "1px 0 0", fontSize: 11, color: "#64748b" }}>{p.descripcion}</p>}
                                  </td>
                                  <td style={{ padding: "12px 14px", verticalAlign: "top" }}>
                                    <p style={{ margin: 0, fontSize: 13, color: "#cbd5e1" }}>{p.proveedor_nombre}</p>
                                    {p.poblacion && <p style={{ margin: "1px 0 0", fontSize: 11, color: "#64748b" }}>{p.poblacion}</p>}
                                  </td>
                                  <td style={{ padding: "12px 14px", textAlign: "center", verticalAlign: "top", color: "#cbd5e1", fontWeight: 600 }}>
                                    {p.stock}
                                  </td>
                                  <td style={{ padding: "12px 14px", textAlign: "right", verticalAlign: "top" }}>
                                    <p style={{ margin: 0, fontWeight: 800, color: "#fff", fontSize: 14 }}>{euros(p.precio)}</p>
                                    <p style={{ margin: 0, fontSize: 10, color: "#64748b" }}>sin IVA</p>
                                  </td>
                                  <td style={{ padding: "12px 14px", textAlign: "center", verticalAlign: "top" }}>
                                    <button type="button" onClick={() => anadirACesta(p)}
                                      disabled={estado === "ok" || estado === "cargando"}
                                      style={{
                                        border: "none", borderRadius: 8, padding: "8px 14px", cursor: estado === "ok" ? "default" : "pointer",
                                        fontWeight: 700, fontSize: 12, fontFamily: "inherit", color: "#fff", whiteSpace: "nowrap",
                                        background: estado === "ok" ? "#14532d" : estado === "error" ? "#7f1d1d" : "#16a34a",
                                      }}
                                    >
                                      {estado === "ok" ? "✓ Añadida" : estado === "cargando" ? "…" : estado === "error" ? "Reintentar" : "Añadir"}
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </section>
                  ))}
                </div>
              )
            )}

            {/* Indicador de carga */}
            {cargando && (
              <div style={{ display: "flex", alignItems: "center", gap: 10, color: "#94a3b8", fontSize: 14, padding: "8px 0" }}>
                <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#3b82f6", display: "inline-block", animation: "pulse 1.5s infinite" }} />
                Buscando en el catálogo y en el stock…
              </div>
            )}

            <div ref={finRef} />
          </div>
        </div>

        {/* Barra de cesta flotante */}
        {cesta.unidades > 0 && (
          <div style={{
            display: "flex", alignItems: "center", gap: 10, padding: "10px 20px",
            background: recienAnadida ? "#14532d" : "#052e1a", borderTop: "1px solid #166534",
            transition: "background 0.4s", flexShrink: 0,
          }}>
            <div style={{ flex: 1 }}>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: "#fff" }}>
                {recienAnadida ? "¡Añadida! " : ""}{cesta.unidades} {cesta.unidades === 1 ? "pieza" : "piezas"} en tu cesta
              </p>
              <p style={{ margin: "2px 0 0", fontSize: 12, color: "#86efac" }}>{euros(cesta.total)} sin IVA ni portes</p>
            </div>
            <Link href="/checkout"
              style={{ flexShrink: 0, background: "#16a34a", color: "#fff", textDecoration: "none", fontWeight: 800, fontSize: 13, borderRadius: 10, padding: "12px 16px", display: "flex", alignItems: "center" }}>
              Ver cesta y pedir →
            </Link>
          </div>
        )}

        {/* Entrada */}
        <div style={{ padding: "12px 20px", borderTop: "1px solid #1e293b", background: "#020617", flexShrink: 0 }}>
          {!disponible && (
            <div style={{ background: "#2a1d05", border: "1px solid #78350f", color: "#fde68a", borderRadius: 10, padding: 10, fontSize: 13, marginBottom: 10 }}>
              El asistente no está disponible en este momento.
            </div>
          )}
          <form onSubmit={e => { e.preventDefault(); enviar(); }}
            style={{ display: "flex", gap: 8, alignItems: "flex-end", background: "#0b1736", border: "1px solid #334155", borderRadius: 14, padding: "10px 10px 10px 16px", maxWidth: 900, marginInline: "auto" }}>
            <textarea
              ref={entradaRef}
              rows={1}
              value={texto}
              onChange={e => setTexto(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); enviar(); } }}
              placeholder="Matrícula, bastidor, referencia o describe la avería…"
              disabled={!disponible}
              style={{ flex: 1, minWidth: 0, resize: "none", background: "transparent", border: "none", outline: "none", color: "#e2e8f0", fontFamily: "inherit", fontSize: 15, lineHeight: 1.5 }}
            />
            <button type="submit" aria-label="Enviar consulta" disabled={cargando || !texto.trim() || !disponible}
              style={{
                width: 44, height: 44, flexShrink: 0, border: "none", borderRadius: 10,
                background: cargando || !texto.trim() ? "#1e3a8a" : "#2563eb",
                cursor: cargando || !texto.trim() ? "default" : "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
            </button>
          </form>
          <p style={{ margin: "8px auto 0", fontSize: 11, color: "#64748b", lineHeight: 1.4, maxWidth: 900, textAlign: "center" }}>
            Solo usa el catálogo de recambios y el stock publicado en Recambio Directo. Los diagnósticos son orientativos.
          </p>
        </div>

        <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }`}</style>
      </main>
    </div>
  );
}
