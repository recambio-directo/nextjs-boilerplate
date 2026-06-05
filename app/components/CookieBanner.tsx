"use client";

import { useState, useEffect } from "react";

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);
  const [detalle, setDetalle] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("rd_cookie_consent");
    if (!consent) setVisible(true);
  }, []);

  function aceptarTodas() {
    localStorage.setItem("rd_cookie_consent", "all");
    setVisible(false);
  }

  function soloNecesarias() {
    localStorage.setItem("rd_cookie_consent", "necessary");
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div style={{
      position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 99999,
      background: "rgba(2,6,23,0.97)",
      backdropFilter: "blur(16px)",
      borderTop: "1px solid rgba(255,255,255,0.08)",
      padding: "20px 24px",
      boxShadow: "0 -8px 40px rgba(0,0,0,0.5)",
    }}>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>

        {/* FILA PRINCIPAL */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: 20, flexWrap: "wrap" }}>

          {/* ICONO + TEXTO */}
          <div style={{ flex: 1, minWidth: 260 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <span style={{ fontSize: 22 }}>🍪</span>
              <p style={{ fontWeight: 800, fontSize: 15, color: "white", margin: 0 }}>
                Usamos cookies
              </p>
            </div>
            <p style={{ color: "#94a3b8", fontSize: 13, lineHeight: 1.6, margin: 0 }}>
              Utilizamos cookies propias y de terceros para mejorar tu experiencia, analizar el tráfico y recordar tus preferencias. Puedes aceptar todas o solo las necesarias para el funcionamiento de la plataforma.{" "}
              <button
                onClick={() => setDetalle(!detalle)}
                style={{ background: "none", border: "none", color: "#60a5fa", cursor: "pointer", fontSize: 13, padding: 0, textDecoration: "underline" }}
              >
                {detalle ? "Ocultar detalle" : "Ver más información"}
              </button>
            </p>
          </div>

          {/* BOTONES */}
          <div style={{ display: "flex", gap: 10, alignItems: "center", flexShrink: 0, flexWrap: "wrap" }}>
            <button
              onClick={soloNecesarias}
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", color: "#94a3b8", padding: "10px 20px", borderRadius: 10, cursor: "pointer", fontWeight: 700, fontSize: 13, whiteSpace: "nowrap" }}
            >
              Solo necesarias
            </button>
            <button
              onClick={aceptarTodas}
              style={{ background: "linear-gradient(135deg,#2563eb,#1d4ed8)", border: "none", color: "white", padding: "10px 24px", borderRadius: 10, cursor: "pointer", fontWeight: 800, fontSize: 13, whiteSpace: "nowrap", boxShadow: "0 4px 14px rgba(37,99,235,0.4)" }}
            >
              Aceptar todas
            </button>
          </div>
        </div>

        {/* DETALLE EXPANDIBLE */}
        {detalle && (
          <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid rgba(255,255,255,0.06)", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
            {[
              {
                icon: "⚙️",
                titulo: "Cookies necesarias",
                desc: "Imprescindibles para el funcionamiento de la plataforma: sesión de usuario, autenticación y seguridad. No se pueden desactivar.",
                siempre: true,
              },
              {
                icon: "📊",
                titulo: "Cookies analíticas",
                desc: "Vercel Analytics para medir el tráfico y mejorar la plataforma. No identifican usuarios individuales.",
                siempre: false,
              },
              {
                icon: "💳",
                titulo: "Cookies de pago",
                desc: "Stripe utiliza cookies para procesar pagos con tarjeta de forma segura.",
                siempre: false,
              },
            ].map(({ icon, titulo, desc, siempre }) => (
              <div key={titulo} style={{ background: "rgba(255,255,255,0.03)", borderRadius: 12, padding: "14px 16px", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <p style={{ fontWeight: 700, fontSize: 13, margin: 0 }}>{icon} {titulo}</p>
                  <span style={{ fontSize: 11, fontWeight: 700, color: siempre ? "#4ade80" : "#60a5fa", background: siempre ? "rgba(22,163,74,0.15)" : "rgba(37,99,235,0.15)", padding: "2px 8px", borderRadius: 999 }}>
                    {siempre ? "Siempre activas" : "Opcionales"}
                  </span>
                </div>
                <p style={{ color: "#94a3b8", fontSize: 12, lineHeight: 1.5, margin: 0 }}>{desc}</p>
              </div>
            ))}
            <div style={{ gridColumn: "1 / -1" }}>
              <p style={{ color: "#64748b", fontSize: 11, margin: 0 }}>
                Responsable: Vicente de Paco Cabeza — NIF: 77856096S — C/ Sola Nº16, 30430 Cehegín (Murcia) —{" "}
                <a href="mailto:info@recambio-directo.com" style={{ color: "#60a5fa", textDecoration: "none" }}>info@recambio-directo.com</a>
                {" "}— Puedes revocar tu consentimiento en cualquier momento borrando las cookies de tu navegador.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}