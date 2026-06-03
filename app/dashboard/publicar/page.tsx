"use client";

import { useState } from "react";
import { supabase } from "../../lib/supabase";

export default function PublicarPieza() {

  const [referencia, setReferencia] = useState("");
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");

  const [precio, setPrecio] = useState("");
  const [stock, setStock] = useState("");

  const [entrega, setEntrega] = useState("");

  const [categoria, setCategoria] = useState("");

  const [proveedor, setProveedor] = useState("");

  const [mensaje, setMensaje] = useState("");

  async function publicarPieza() {

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      alert("Debes iniciar sesión");
      return;
    }

    const { error } = await supabase
      .from("piezas_publicadas")
      .insert([
        {
          referencia,
          nombre,
          descripcion,

          precio: Number(precio),
          stock: Number(stock),

          entrega_horas: Number(entrega),

          categoria,

          proveedor,

          user_id: session.user.id,
        },
      ]);

    if (error) {
      console.log(error);
      setMensaje("ERROR AL PUBLICAR");
      return;
    }

    setMensaje("PIEZA PUBLICADA CORRECTAMENTE");

    setReferencia("");
    setNombre("");
    setDescripcion("");

    setPrecio("");
    setStock("");

    setEntrega("");

    setCategoria("");

    setProveedor("");
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f3f4f6",
        padding: "50px",
        fontFamily: "Arial",
      }}
    >
      <div
        style={{
          maxWidth: "900px",
          margin: "0 auto",
          background: "white",
          padding: "40px",
          borderRadius: "20px",
          boxShadow: "0 5px 20px rgba(0,0,0,0.05)",
        }}
      >
        <h1
          style={{
            fontSize: "48px",
            fontWeight: "bold",
            color: "#0f172a",
            marginBottom: "10px",
          }}
        >
          PUBLICAR PIEZA
        </h1>

        <p
          style={{
            color: "#64748b",
            marginBottom: "40px",
          }}
        >
          Marketplace B2B de recambios
        </p>

        <div
          style={{
            display: "grid",
            gap: "20px",
          }}
        >
          <input
            placeholder="Referencia"
            value={referencia}
            onChange={(e) => setReferencia(e.target.value)}
            style={input}
          />

          <input
            placeholder="Nombre pieza"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            style={input}
          />

          <textarea
            placeholder="Descripción"
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            style={{
              ...input,
              minHeight: "120px",
            }}
          />

          <input
            placeholder="Precio"
            value={precio}
            onChange={(e) => setPrecio(e.target.value)}
            style={input}
          />

          <input
            placeholder="Stock"
            value={stock}
            onChange={(e) => setStock(e.target.value)}
            style={input}
          />

          <input
            placeholder="Entrega horas"
            value={entrega}
            onChange={(e) => setEntrega(e.target.value)}
            style={input}
          />

          <input
            placeholder="Categoría"
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
            style={input}
          />

          <input
            placeholder="Proveedor"
            value={proveedor}
            onChange={(e) => setProveedor(e.target.value)}
            style={input}
          />

          <button
            onClick={publicarPieza}
            style={{
              background: "#16a34a",
              color: "white",
              border: "none",
              padding: "18px",
              borderRadius: "12px",
              fontSize: "18px",
              fontWeight: "bold",
              cursor: "pointer",
            }}
          >
            PUBLICAR PIEZA
          </button>

          {mensaje && (
            <div
              style={{
                background: "#eff6ff",
                padding: "20px",
                borderRadius: "10px",
                color: "#2563eb",
                fontWeight: "bold",
              }}
            >
              {mensaje}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

const input = {
  width: "100%",
  padding: "18px",
  borderRadius: "12px",
  border: "1px solid #d1d5db",
  fontSize: "16px",
};