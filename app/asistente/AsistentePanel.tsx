"use client";

// ════════════════════════════════════════════════════════════════════
// ASISTENTE DE RECAMBIOS — botón flotante + panel (módulo aislado)
// ────────────────────────────────────────────────────────────────────
// Se monta con una sola línea en app/dashboard/layout.tsx.
// Habla solo con /api/asistente. Lo único que escribe en la plataforma
// es la cesta, y solo cuando el usuario pulsa "Añadir a la cesta"
// (mismo insert que la página Buscar).
// ════════════════════════════════════════════════════════════════════

import { useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabase";

type Producto = {
  id: string; referencia: string; marca: string; descripcion: string; tipo: string;
  precio: number; impuesto: number; stock: number; proveedor_id: string;
  proveedor_nombre: string; poblacion: string; detalle: string;
};
type Bloque = { tipo: "productos"; titulo: string; items: Producto[] };
type Vehiculo = { id: string; nombre: string; detalle: string };
type Mensaje = { rol: "usuario" | "asistente"; texto: string; bloques?: Bloque[]; vehiculo?: Vehiculo | null; error?: boolean };

const CLAVE = "rd_asistente_v1";
const SUGERENCIAS = [
  "Pastillas de freno delanteras para la matrícula 1234ABC",
  "¿Qué equivalencias hay en stock de esta referencia?",
  "Me da el código P0401 y tirones al acelerar",
];

function limpiarTexto(t: string): string {
  return (t || "").replace(/\*\*(.*?)\*\*/g, "$1").replace(/^#{1,6}\s*/gm, "").trim();
}

function euros(n: number): string {
  return n.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";
}

export default function AsistentePanel() {
  const [abierto, setAbierto] = useState(false);
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [vehiculo, setVehiculo] = useState<Vehiculo | null>(null);
  const [texto, setTexto] = useState("");
  const [cargando, setCargando] = useState(false);
  const [restantes, setRestantes] = useState<number | null>(null);
  const [disponible, setDisponible] = useState(true);
  const [anadidos, setAnadidos] = useState<Record<string, "ok" | "error" | "cargando">>({});
  const [movil, setMovil] = useState(false);
  const finRef = useRef<HTMLDivElement>(null);
  const entradaRef = useRef<HTMLTextAreaElement>(null);
  const cargadoRef = useRef(false);

  // Tamaño de pantalla
  useEffect(() => {
    const comprobar = () => setMovil(window.innerWidth < 768);
    comprobar();
    window.addEventListener("resize", comprobar);
    return () => window.removeEventListener("resize", comprobar);
  }, []);

  // Otras pantallas (p. ej. el banner del inicio) pueden abrir el panel con este evento
  useEffect(() => {
    const alAbrir = () => { abrir(); };
    window.addEventListener("rd-abrir-asistente", alAbrir);
    return () => window.removeEventListener("rd-abrir-asistente", alAbrir);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Recuperar la conversación de esta pestaña
  useEffect(() => {
    try {
      const guardado = sessionStorage.getItem(CLAVE);
      if (guardado) {
        const d = JSON.parse(guardado);
        if (Array.isArray(d?.mensajes)) setMensajes(d.mensajes);
        if (d?.vehiculo) setVehiculo(d.vehiculo);
      }
    } catch {}
  }, []);

  useEffect(() => {
    try { sessionStorage.setItem(CLAVE, JSON.stringify({ mensajes: mensajes.slice(-30), vehiculo })); } catch {}
  }, [mensajes, vehiculo]);

  useEffect(() => {
    if (abierto) finRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensajes, cargando, abierto]);

  async function token(): Promise<string | null> {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token || null;
  }

  async function abrir() {
    setAbierto(true);
    setTimeout(() => entradaRef.current?.focus(), 50);
    if (cargadoRef.current) return;
    cargadoRef.current = true;
    try {
      const t = await token();
      if (!t) return;
      const r = await fetch("/api/asistente", { headers: { Authorization: `Bearer ${t}` } });
      const d = await r.json().catch(() => ({}));
      if (r.ok) { setDisponible(!!d.activo); setRestantes(d.restantes ?? null); }
    } catch {}
  }

  function nuevaConsulta() {
    setMensajes([]);
    setVehiculo(null);
    setAnadidos({});
    setTexto("");
    entradaRef.current?.focus();
  }

  async function enviar(contenido?: string) {
    const pregunta = (contenido ?? texto).trim();
    if (!pregunta || cargando) return;
    const historial = mensajes.filter((m) => !m.error).map((m) => ({ rol: m.rol, texto: m.texto }));
    setMensajes((prev) => [...prev, { rol: "usuario", texto: pregunta }]);
    setTexto("");
    setCargando(true);
    try {
      const t = await token();
      if (!t) {
        setMensajes((prev) => [...prev, { rol: "asistente", texto: "Tu sesión ha caducado. Vuelve a iniciar sesión.", error: true }]);
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
        setMensajes((prev) => [...prev, { rol: "asistente", texto: d?.error || "No he podido responder. Inténtalo de nuevo.", error: true }]);
        return;
      }
      if (d.vehiculo) setVehiculo(d.vehiculo);
      setMensajes((prev) => [...prev, { rol: "asistente", texto: d.texto || "", bloques: d.bloques || [], vehiculo: d.vehiculo || null }]);
    } catch {
      setMensajes((prev) => [...prev, { rol: "asistente", texto: "Se ha cortado la conexión. Inténtalo de nuevo.", error: true }]);
    } finally {
      setCargando(false);
    }
  }

  async function anadirACesta(p: Producto) {
    if (anadidos[p.id] === "ok" || anadidos[p.id] === "cargando") return;
    setAnadidos((a) => ({ ...a, [p.id]: "cargando" }));
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setAnadidos((a) => ({ ...a, [p.id]: "error" })); return; }
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
    setAnadidos((a) => ({ ...a, [p.id]: error ? "error" : "ok" }));
  }

  // ── Botón flotante ────────────────────────────────────────────────
  if (!abierto) {
    return (
      <button
        type="button"
        onClick={abrir}
        aria-label="Abrir el asistente de recambios"
        style={{
          position: "fixed", right: movil ? 14 : 24, bottom: movil ? 84 : 24, zIndex: 10000,
          display: "flex", alignItems: "center", gap: 8, border: "none", cursor: "pointer",
          background: "#2563eb", color: "#fff", borderRadius: 999,
          padding: movil ? "0" : "0 18px 0 14px", width: movil ? 52 : "auto", height: 52,
          justifyContent: "center", boxShadow: "0 10px 30px rgba(37,99,235,0.45)",
          fontFamily: "inherit", fontWeight: 700, fontSize: 14,
        }}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.5 2.5-2.4-.6-.6-2.4z" />
        </svg>
        {!movil && <span>Pregúntale al asistente</span>}
      </button>
    );
  }

  // ── Panel ─────────────────────────────────────────────────────────
  return (
    <div
      role="dialog"
      aria-label="Asistente de recambios"
      onKeyDown={(e) => { if (e.key === "Escape") setAbierto(false); }}
      style={{
        position: "fixed", zIndex: 10001, background: "#020617", color: "#e2e8f0",
        display: "flex", flexDirection: "column", fontFamily: "inherit",
        ...(movil
          ? { inset: 0 }
          : { top: 0, right: 0, bottom: 0, width: 440, borderLeft: "1px solid #1e293b", boxShadow: "-20px 0 50px rgba(0,0,0,0.5)" }),
      }}
    >
      {/* Cabecera */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 16px", background: "#0b1736", borderBottom: "1px solid #1e293b" }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: 0, fontWeight: 800, fontSize: 16, color: "#fff" }}>Asistente de recambios</p>
          <p style={{ margin: "2px 0 0", fontSize: 12, color: "#94a3b8" }}>
            {restantes !== null ? `Te quedan ${restantes} consultas hoy` : "Solo stock real de la plataforma"}
          </p>
        </div>
        {mensajes.length > 0 && (
          <button type="button" onClick={nuevaConsulta} style={{ background: "transparent", border: "1px solid #334155", color: "#cbd5e1", borderRadius: 10, padding: "8px 10px", fontSize: 12, fontWeight: 600, cursor: "pointer", minHeight: 36 }}>
            Nueva consulta
          </button>
        )}
        <button type="button" onClick={() => setAbierto(false)} aria-label="Cerrar el asistente" style={{ background: "rgba(255,255,255,0.06)", border: "none", color: "#cbd5e1", width: 40, height: 40, borderRadius: 10, cursor: "pointer", fontSize: 18 }}>
          ✕
        </button>
      </div>

      {/* Conversación */}
      <div style={{ flex: 1, overflowY: "auto", padding: 16, display: "flex", flexDirection: "column", gap: 14 }}>
        {!disponible && (
          <div style={{ background: "#2a1d05", border: "1px solid #78350f", color: "#fde68a", borderRadius: 12, padding: 12, fontSize: 13 }}>
            El asistente no está disponible en este momento. El resto de la web funciona con normalidad.
          </div>
        )}

        {mensajes.length === 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <p style={{ margin: 0, lineHeight: 1.6, color: "#cbd5e1" }}>
              Dime la matrícula, el bastidor o una referencia y te busco las piezas en stock. También te oriento con averías y códigos de error.
            </p>
            {SUGERENCIAS.map((s) => (
              <button key={s} type="button" onClick={() => (s.includes("1234ABC") || s.includes("esta referencia") ? setTexto(s) : enviar(s))}
                style={{ textAlign: "left", background: "#0f1d3d", border: "1px solid #1e3a8a", color: "#bfdbfe", borderRadius: 12, padding: "12px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                {s}
              </button>
            ))}
          </div>
        )}

        {mensajes.map((m, i) =>
          m.rol === "usuario" ? (
            <div key={i} style={{ alignSelf: "flex-end", maxWidth: "85%", background: "#1d4ed8", color: "#fff", padding: "10px 14px", borderRadius: "16px 16px 4px 16px", fontSize: 14, lineHeight: 1.5, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
              {m.texto}
            </div>
          ) : (
            <div key={i} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {m.vehiculo && (i === 0 || mensajes[i - 2]?.vehiculo?.id !== m.vehiculo.id) && (
                <div style={{ background: "#0b1736", border: "1px solid #1e293b", borderRadius: 12, padding: "10px 12px" }}>
                  <p style={{ margin: 0, fontWeight: 700, color: "#fff", fontSize: 14 }}>{m.vehiculo.nombre}</p>
                  {m.vehiculo.detalle && <p style={{ margin: "2px 0 0", fontSize: 12, color: "#94a3b8" }}>{m.vehiculo.detalle}</p>}
                </div>
              )}
              {m.texto && (
                <div style={{ fontSize: 14, lineHeight: 1.6, whiteSpace: "pre-wrap", wordBreak: "break-word", color: m.error ? "#fca5a5" : "#e2e8f0" }}>
                  {limpiarTexto(m.texto)}
                </div>
              )}
              {(m.bloques || []).map((b, j) => (
                <section key={j} aria-label={b.titulo} style={{ background: "#0b1736", border: "1px solid #1e293b", borderRadius: 14, overflow: "hidden" }}>
                  <p style={{ margin: 0, padding: "10px 12px", fontSize: 13, fontWeight: 700, color: "#fff", borderBottom: "1px solid #1e293b" }}>{b.titulo}</p>
                  {b.items.map((p, k) => {
                    const estado = anadidos[p.id];
                    return (
                      <div key={p.id} style={{ padding: "10px 12px", borderBottom: k < b.items.length - 1 ? "1px solid #1e293b" : "none", display: "flex", flexDirection: "column", gap: 8 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                          <div style={{ minWidth: 0 }}>
                            <p style={{ margin: 0, fontWeight: 700, color: "#fff", fontSize: 14 }}>
                              {p.marca || "Sin marca"}{" "}
                              {p.tipo === "OEM" && <span style={{ fontSize: 10, color: "#93c5fd", background: "#0f2a5c", padding: "2px 6px", borderRadius: 6, verticalAlign: "middle" }}>OEM</span>}
                            </p>
                            <p style={{ margin: "2px 0 0", fontSize: 12, color: "#94a3b8" }}>Ref. {p.referencia}{p.descripcion ? ` · ${p.descripcion}` : ""}</p>
                            {p.detalle && <p style={{ margin: "2px 0 0", fontSize: 11, color: "#94a3b8" }}>{p.detalle}</p>}
                            <p style={{ margin: "2px 0 0", fontSize: 12, color: "#cbd5e1" }}>{p.proveedor_nombre}{p.poblacion ? ` · ${p.poblacion}` : ""} · {p.stock} uds</p>
                          </div>
                          <p style={{ margin: 0, fontWeight: 800, color: "#fff", fontSize: 15, textAlign: "right", whiteSpace: "nowrap" }}>
                            {euros(p.precio)}
                            <span style={{ display: "block", fontSize: 10, fontWeight: 500, color: "#94a3b8" }}>sin IVA</span>
                          </p>
                        </div>
                        <button type="button" onClick={() => anadirACesta(p)} disabled={estado === "ok" || estado === "cargando"}
                          style={{ border: "none", borderRadius: 10, padding: "10px 12px", minHeight: 44, cursor: estado === "ok" ? "default" : "pointer", fontWeight: 700, fontSize: 13, fontFamily: "inherit", color: "#fff", background: estado === "ok" ? "#14532d" : estado === "error" ? "#7f1d1d" : "#16a34a" }}>
                          {estado === "ok" ? "Añadida a la cesta ✓" : estado === "cargando" ? "Añadiendo…" : estado === "error" ? "No se pudo añadir · reintentar" : "Añadir a la cesta"}
                        </button>
                      </div>
                    );
                  })}
                </section>
              ))}
            </div>
          )
        )}

        {cargando && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#94a3b8", fontSize: 13 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#3b82f6", display: "inline-block" }} />
            Buscando en el catálogo y en el stock…
          </div>
        )}
        <div ref={finRef} />
      </div>

      {/* Entrada */}
      <div style={{ padding: 12, borderTop: "1px solid #1e293b", background: "#020617" }}>
        <form onSubmit={(e) => { e.preventDefault(); enviar(); }} style={{ display: "flex", gap: 8, alignItems: "flex-end", background: "#0b1736", border: "1px solid #334155", borderRadius: 14, padding: "8px 8px 8px 12px" }}>
          <label htmlFor="rd-asistente-entrada" style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)" }}>Tu consulta</label>
          <textarea
            id="rd-asistente-entrada"
            ref={entradaRef}
            rows={2}
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); enviar(); } }}
            placeholder="Matrícula, bastidor, referencia o describe la avería…"
            disabled={!disponible}
            style={{ flex: 1, minWidth: 0, resize: "none", background: "transparent", border: "none", outline: "none", color: "#e2e8f0", fontFamily: "inherit", fontSize: 14, lineHeight: 1.5 }}
          />
          <button type="submit" aria-label="Enviar consulta" disabled={cargando || !texto.trim() || !disponible}
            style={{ width: 44, height: 44, flexShrink: 0, border: "none", borderRadius: 10, background: cargando || !texto.trim() ? "#1e3a8a" : "#2563eb", cursor: cargando || !texto.trim() ? "default" : "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
          </button>
        </form>
        <p style={{ margin: "8px 2px 0", fontSize: 11, color: "#94a3b8", lineHeight: 1.4 }}>
          Solo usa el catálogo de recambios y el stock publicado en Recambio Directo. Nada va a la cesta sin que lo pulses tú. Los diagnósticos son orientativos: verifica siempre en el vehículo.
        </p>
      </div>
    </div>
  );
}
