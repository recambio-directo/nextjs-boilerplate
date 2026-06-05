"use client";

import { useState, useEffect } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

const RECARGO_PORCENTAJE = 0.03; // 3% gastos de gestión

export function calcularRecargo(total: number) {
  const recargo = Math.round(total * RECARGO_PORCENTAJE * 100) / 100;
  const totalConRecargo = Math.round((total + recargo) * 100) / 100;
  return { recargo, totalConRecargo };
}

function CheckoutForm({ onSuccess, onError }: { onSuccess: () => void; onError: (msg: string) => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const [procesando, setProcesando] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;
    setProcesando(true);
    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: `${window.location.origin}/dashboard/pedidos` },
      redirect: "if_required",
    });
    if (error) {
      onError(error.message || "Error al procesar el pago");
      setProcesando(false);
    } else if (paymentIntent && paymentIntent.status === "succeeded") {
      onSuccess();
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ background: "#0f172a", borderRadius: 14, padding: 20, marginBottom: 16, border: "1px solid rgba(255,255,255,0.08)" }}>
        <PaymentElement options={{ layout: "tabs" }} />
      </div>
      <button
        type="submit"
        disabled={!stripe || procesando}
        style={{ width: "100%", background: procesando ? "rgba(37,99,235,0.5)" : "linear-gradient(135deg,#2563eb,#1d4ed8)", border: "none", color: "white", padding: "16px", borderRadius: 14, fontWeight: 900, fontSize: 16, cursor: procesando ? "not-allowed" : "pointer", boxShadow: "0 10px 30px rgba(37,99,235,0.35)" }}
      >
        {procesando ? "Procesando pago..." : "PAGAR CON TARJETA →"}
      </button>
    </form>
  );
}

export default function StripeCheckout({
  total,
  metadata,
  onSuccess,
  onCancel,
}: {
  total: number;
  metadata?: Record<string, string>;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(true);

  const { recargo, totalConRecargo } = calcularRecargo(total);

  useEffect(() => {
    async function crearIntent() {
      try {
        const res = await fetch("/api/enviar-email/stripe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          // Mandamos el total CON recargo a Stripe
          body: JSON.stringify({ amount: totalConRecargo, metadata }),
        });
        const data = await res.json();
        if (data.clientSecret) {
          setClientSecret(data.clientSecret);
        } else {
          setError("Error al iniciar el pago");
        }
      } catch (e) {
        setError("Error de conexión con el servidor de pagos");
      }
      setCargando(false);
    }
    crearIntent();
  }, [totalConRecargo]);

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 99999, display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "20px", overflowY: "auto" }}>
      <div style={{ background: "#0f172a", borderRadius: 24, padding: "clamp(20px,4vw,32px)", width: "100%", maxWidth: 480, border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 30px 80px rgba(0,0,0,0.8)", margin: "20px auto", flexShrink: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <h2 style={{ fontWeight: 900, fontSize: 22, margin: 0 }}>Pago con tarjeta</h2>
          <button onClick={onCancel} style={{ background: "rgba(255,255,255,0.06)", border: "none", color: "#94a3b8", width: 32, height: 32, borderRadius: "50%", cursor: "pointer", fontSize: 16 }}>✕</button>
        </div>

        {/* DESGLOSE */}
        <div style={{ background: "rgba(15,23,42,0.8)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: "14px 16px", marginBottom: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: 14, color: "#94a3b8" }}>
            <span>Pedido</span>
            <span>{total.toFixed(2)}€</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10, fontSize: 14, color: "#fbbf24" }}>
            <span>Gastos de gestión (3%)</span>
            <span>+{recargo.toFixed(2)}€</span>
          </div>
          <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ color: "#94a3b8", fontSize: 14 }}>Total a pagar</span>
            <span style={{ color: "#22c55e", fontWeight: 900, fontSize: 22 }}>{totalConRecargo.toFixed(2)}€</span>
          </div>
        </div>

        <div style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: 10, padding: "10px 14px", marginBottom: 20 }}>
          <p style={{ color: "#fbbf24", fontSize: 12, margin: 0, lineHeight: 1.5 }}>
            ℹ️ Los gastos de gestión (3%) cubren el procesamiento seguro del pago con tarjeta. Se incluirán en tu albarán.
          </p>
        </div>

        {cargando && (
          <div style={{ textAlign: "center", padding: "32px 0", color: "#94a3b8" }}>
            <p style={{ fontSize: 24, marginBottom: 8 }}>💳</p>
            <p>Preparando el pago seguro...</p>
          </div>
        )}

        {error && (
          <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#f87171", padding: "12px 16px", borderRadius: 12, marginBottom: 16 }}>{error}</div>
        )}

        {clientSecret && (
          <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: "night" } }}>
            <CheckoutForm onSuccess={onSuccess} onError={(msg) => setError(msg)} />
          </Elements>
        )}

        <p style={{ color: "#94a3b8", fontSize: 11, textAlign: "center", marginTop: 16 }}>
          🔒 Pago seguro procesado por Stripe. Recambio Directo no almacena datos de tarjeta.
        </p>
      </div>
    </div>
  );
}