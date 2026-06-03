"use client";

import { useState } from "react";
import { supabase } from "../lib/supabase";

export default function Buscador() {
  const [referencia, setReferencia] = useState("");
  const [ofertas, setOfertas] = useState<any[]>([]);
  const [cargando, setCargando] = useState(false);

  async function buscar() {
    if (!referencia) return;

    setCargando(true);

    const { data, error } = await supabase
      .from("piezas_publicadas")
      .select("*")
      .ilike("referencia", `%${referencia}%`);

    if (error) {
      console.error(error);
      alert("Error buscando");
      setCargando(false);
      return;
    }

    setOfertas(data || []);
    setCargando(false);
  }

  async function comprar(pieza: any) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      alert("Debes iniciar sesión");
      return;
    }

    const { data: perfil } = await supabase
      .from("usuarios")
      .select("*")
      .eq("id", user.id)
      .single();

    const codigo =
      "RF-" +
      Math.floor(Math.random() * 1000000);

    const { error } = await supabase
      .from("pedidos")
      .insert({
        cliente_id: user.id,

        cliente_email: user.email,

        cliente_nombre:
          perfil?.empresa ||
          perfil?.email ||
          "CLIENTE",

        referencia: pieza.referencia,

        producto:
          pieza.nombre ||
          pieza.nombre_pieza,

        proveedor:
          pieza.proveedor ||
          pieza.empresa ||
          "VILENGU",

        subtotal: pieza.precio,

        total: pieza.precio,

        estado: "pendiente",

        codigo,

        transporte: "Correos Express",

        metodo_pago: "pagofacil",
      });

    if (error) {
      console.error(error);
      alert("Error creando pedido");
      return;
    }

    alert("Pedido creado correctamente");

    location.href =
      "/dashboard/pedidos";
  }

  return (
    <main style={mainStyle}>
      <div style={cardStyle}>
        <h1 style={tituloStyle}>
          BUSCADOR DE RECAMBIOS
        </h1>

        <input
          placeholder="Ejemplo: HU726/2X"
          value={referencia}
          onChange={(e) =>
            setReferencia(e.target.value)
          }
          style={inputStyle}
        />

        <button
          onClick={buscar}
          style={botonStyle}
        >
          BUSCAR
        </button>

        {cargando && <p>Buscando...</p>}

        {ofertas.map((pieza) => (
          <div
            key={pieza.id}
            style={ofertaStyle}
          >
            <h2>{pieza.nombre}</h2>

            <p>
              Referencia:{" "}
              {pieza.referencia}
            </p>

            <p>
              Precio:{" "}
              {pieza.precio}€
            </p>

            <p>
              Stock:{" "}
              {pieza.stock}
            </p>

            <p>
              Entrega:{" "}
              {pieza.entrega_horas}h
            </p>

            <p>
              Categoría:{" "}
              {pieza.categoria}
            </p>

            <button
              style={comprarStyle}
              onClick={() =>
                comprar(pieza)
              }
            >
              COMPRAR
            </button>
          </div>
        ))}
      </div>
    </main>
  );
}

const mainStyle = {
  minHeight: "100vh",
  background: "#f5f5f5",
  padding: "40px",
};

const cardStyle = {
  maxWidth: "900px",
  margin: "0 auto",
  background: "white",
  padding: "40px",
  borderRadius: "20px",
};

const tituloStyle = {
  fontSize: "50px",
  fontWeight: "900" as const,
  marginBottom: "30px",
  color: "#0b1736",
};

const inputStyle = {
  width: "100%",
  padding: "20px",
  borderRadius: "12px",
  border: "2px solid #ddd",
  marginBottom: "20px",
  fontSize: "18px",
};

const botonStyle = {
  background: "#2563eb",
  color: "white",
  border: "none",
  padding: "15px 30px",
  borderRadius: "12px",
  cursor: "pointer",
  fontWeight: "bold" as const,
};

const comprarStyle = {
  background: "#16a34a",
  color: "white",
  border: "none",
  padding: "12px 24px",
  borderRadius: "10px",
  cursor: "pointer",
  marginTop: "10px",
  fontWeight: "bold" as const,
};

const ofertaStyle = {
  border: "1px solid #ddd",
  borderRadius: "12px",
  padding: "20px",
  marginTop: "20px",
};