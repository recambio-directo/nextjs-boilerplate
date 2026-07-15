"use client";

import React, { useState } from "react";
import { supabase } from "../../lib/supabase";

const TIPOS_DEVOLUCION = [
  { valor: "arrepentimiento", emoji: "🔄", label: "Ya no lo necesito", desc: "Devolución por arrepentimiento" },
  { valor: "pieza_incorrecta", emoji: "❓", label: "Pieza incorrecta", desc: "No corresponde con lo pedido o no vale para el vehículo" },
  { valor: "rotura_desperfecto", emoji: "💥", label: "Rotura o desperfecto", desc: "Ha llegado dañada o defectuosa" },
  { valor: "otro", emoji: "✍️", label: "Otro motivo", desc: "Explícalo en el campo de texto" },
];

function generarCodigoDevolucion(pedidoId: number) {
  const sufijo = Date.now().toString(36).slice(-4).toUpperCase();
  return `DEV-${pedidoId}-${sufijo}`;
}

export default function ModalSolicitarDevolucion({ pedido, onClose, onCreated }: { pedido: any; onClose: () => void; onCreated?: () => void }) {
  const productos: any[] = pedido.productos || [];
  const [productoIdx, setProductoIdx] = useState<number>(productos.length === 1 ? 0 : -1);
  const [cantidad, setCantidad] = useState(1);
  const [tipo, setTipo] = useState<string>("");
  const [motivoTexto, setMotivoTexto] = useState("");
  const [enviando, setEnviando] = useState(false);

  const producto = productoIdx >= 0 ? productos[productoIdx] : null;
  const cantidadMax = producto ? Number(producto.cantidad || 1) : 1;
  const importe = producto ? Number(producto.precio || 0) * cantidad : 0;
  const puedeEnviar = producto && tipo && (tipo !== "otro" || motivoTexto.trim().length > 0) && !enviando;

  function fmt(n: any) {
    return Number(Number(n).toFixed(2)).toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  async function solicitarDevolucion() {
    if (!puedeEnviar || !producto) return;
    setEnviando(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { alert("Sesión no válida"); setEnviando(false); return; }

    // Evitar duplicados: comprobar si ya hay una devolución activa para esta referencia del pedido
    const { data: existentes } = await supabase
      .from("devoluciones")
      .select("id, estado")
      .eq("pedido_id", pedido.id)
      .eq("referencia", producto.referencia || "");
    const activa = (existentes || []).find(d => !["rechazada", "cancelada", "finalizada"].includes(d.estado));
    if (activa) {
      alert("⚠️ Ya existe una devolución en curso para esta referencia en este pedido.");
      setEnviando(false);
      return;
    }

    const { data: perfil } = await supabase.from("usuarios").select("nombre_empresa, email").eq("id", user.id).single();
    const proveedorId = producto.proveedor_id || null;
    if (!proveedorId) { alert("No se puede identificar al proveedor de esta pieza"); setEnviando(false); return; }

    let proveedorEmail = "";
    let proveedorNombre = producto.proveedor_nombre || producto.proveedor || "-";
    const { data: provPerfil } = await supabase.from("usuarios").select("email, nombre_empresa").eq("id", proveedorId).single();
    if (provPerfil) {
      proveedorEmail = provPerfil.email || "";
      proveedorNombre = provPerfil.nombre_empresa || proveedorNombre;
    }

    const nueva = {
      codigo: generarCodigoDevolucion(pedido.id),
      pedido_id: pedido.id,
      pedido_codigo: pedido.codigo || `RD-${pedido.id}`,
      solicitante_id: user.id,
      solicitante_nombre: perfil?.nombre_empresa || user.email || "",
      solicitante_email: perfil?.email || user.email || "",
      proveedor_id: proveedorId,
      proveedor_nombre: proveedorNombre,
      referencia: producto.referencia || "",
      descripcion: producto.descripcion || "",
      cantidad,
      importe,
      tipo,
      motivo_texto: motivoTexto.trim() || null,
      estado: "iniciada",
    };

    const { data: creada, error } = await supabase.from("devoluciones").insert(nueva).select("*").single();
    if (error) {
      alert("Error al crear la devolución: " + error.message);
      setEnviando(false);
      return;
    }

    try {
      await fetch("/api/send-devolucion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ evento: "solicitada", devolucion: creada, proveedorEmail }),
      });
    } catch (e) { console.error("Error enviando notificación:", e); }

    alert(`✅ Solicitud de devolución ${creada.codigo} enviada al proveedor.`);
    setEnviando(false);
    onCreated?.();
    onClose();
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 99999, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }} onClick={onClose}>
      <div style={{ background: "#0f172a", borderRadius: 24, padding: "clamp(20px,4vw,36px)", width: "min(520px,92vw)", maxHeight: "90vh", overflowY: "auto", border: "1px solid rgba(255,255,255,0.1)" }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <h2 style={{ fontSize: 20, fontWeight: 900, margin: 0 }}>🔄 Solicitar devolución</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: 20 }}>✕</button>
        </div>
        <div style={{ background: "rgba(37,99,235,0.08)", border: "1px solid rgba(37,99,235,0.2)", borderRadius: 10, padding: "6px 14px", marginBottom: 20, display: "inline-block" }}>
          <span style={{ color: "#60a5fa", fontSize: 13, fontWeight: 700 }}>Pedido {pedido.codigo || "#" + pedido.id}</span>
        </div>

        {/* PASO 1: referencia a devolver */}
        <p style={{ color: "#94a3b8", fontSize: 12, fontWeight: 700, marginBottom: 8 }}>1️⃣ ¿QUÉ REFERENCIA QUIERES DEVOLVER?</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
          {productos.map((p, i) => (
            <button key={i} onClick={() => { setProductoIdx(i); setCantidad(1); }} style={{ padding: "12px 16px", borderRadius: 10, textAlign: "left", cursor: "pointer", background: productoIdx === i ? "rgba(37,99,235,0.2)" : "rgba(255,255,255,0.05)", border: productoIdx === i ? "2px solid rgba(37,99,235,0.5)" : "1px solid rgba(255,255,255,0.08)", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
              <div>
                <span style={{ fontWeight: 700, color: "#60a5fa", fontSize: 14 }}>{p.referencia}</span>
                <span style={{ color: "#94a3b8", marginLeft: 8, fontSize: 12 }}>{(p.descripcion || "").substring(0, 32)}</span>
              </div>
              <span style={{ color: "#22c55e", fontWeight: 700, fontSize: 14, flexShrink: 0 }}>{fmt(p.precio)}€</span>
            </button>
          ))}
        </div>

        {producto && cantidadMax > 1 && (
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
            <p style={{ color: "#94a3b8", fontSize: 12, fontWeight: 700, margin: 0 }}>CANTIDAD:</p>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <button onClick={() => setCantidad(Math.max(1, cantidad - 1))} style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "white", cursor: "pointer", fontWeight: 900 }}>−</button>
              <span style={{ fontWeight: 900, fontSize: 16, minWidth: 24, textAlign: "center" }}>{cantidad}</span>
              <button onClick={() => setCantidad(Math.min(cantidadMax, cantidad + 1))} style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "white", cursor: "pointer", fontWeight: 900 }}>+</button>
              <span style={{ color: "#94a3b8", fontSize: 12 }}>de {cantidadMax}</span>
            </div>
          </div>
        )}

        {/* PASO 2: tipo */}
        <p style={{ color: "#94a3b8", fontSize: 12, fontWeight: 700, marginBottom: 8 }}>2️⃣ MOTIVO DE LA DEVOLUCIÓN</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
          {TIPOS_DEVOLUCION.map(t => (
            <button key={t.valor} onClick={() => setTipo(t.valor)} style={{ padding: "12px 16px", borderRadius: 10, textAlign: "left", cursor: "pointer", background: tipo === t.valor ? "rgba(37,99,235,0.2)" : "rgba(255,255,255,0.05)", border: tipo === t.valor ? "2px solid rgba(37,99,235,0.5)" : "1px solid rgba(255,255,255,0.08)" }}>
              <span style={{ fontWeight: 800, fontSize: 14, color: tipo === t.valor ? "#60a5fa" : "white" }}>{t.emoji} {t.label}</span>
              <p style={{ color: "#94a3b8", fontSize: 12, margin: 0, marginTop: 2 }}>{t.desc}</p>
            </button>
          ))}
        </div>

        {/* PASO 3: detalle */}
        <p style={{ color: "#94a3b8", fontSize: 12, fontWeight: 700, marginBottom: 8 }}>3️⃣ DETALLES {tipo === "otro" ? "(obligatorio)" : "(opcional)"}</p>
        <textarea value={motivoTexto} onChange={e => setMotivoTexto(e.target.value)} placeholder="Explica al proveedor el motivo con más detalle..." rows={3} style={{ width: "100%", background: "#020617", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, color: "white", padding: "10px 12px", fontSize: 13, outline: "none", resize: "vertical", boxSizing: "border-box", marginBottom: 20 }} />

        {producto && (
          <div style={{ background: "rgba(22,163,74,0.08)", border: "1px solid rgba(22,163,74,0.2)", borderRadius: 10, padding: "10px 14px", marginBottom: 20, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ color: "#94a3b8", fontSize: 12, fontWeight: 700 }}>IMPORTE A DEVOLVER</span>
            <span style={{ color: "#22c55e", fontWeight: 900, fontSize: 18 }}>{fmt(importe)}€</span>
          </div>
        )}

        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onClose} style={{ flex: 1, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#94a3b8", padding: "12px", borderRadius: 12, cursor: "pointer", fontWeight: 700 }}>Cancelar</button>
          <button onClick={solicitarDevolucion} disabled={!puedeEnviar} style={{ flex: 1, background: puedeEnviar ? "linear-gradient(135deg,#2563eb,#1d4ed8)" : "rgba(255,255,255,0.05)", border: "none", color: puedeEnviar ? "white" : "#94a3b8", padding: "12px", borderRadius: 12, cursor: puedeEnviar ? "pointer" : "not-allowed", fontWeight: 900 }}>{enviando ? "Enviando..." : "Solicitar devolución"}</button>
        </div>
      </div>
    </div>
  );
}