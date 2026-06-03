export default function ChatDetalle() {
  return (
    <div
      style={{
        height: "calc(100vh - 90px)",
        display: "flex",
        flexDirection: "column",
        background: "#020b2d",
      }}
    >
      {/* CABECERA */}

      <div
        style={{
          height: "90px",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
          display: "flex",
          alignItems: "center",
          padding: "0 30px",
          background: "#081330",
          flexShrink: 0,
        }}
      >
        <div>
          <h1
            style={{
              margin: 0,
              color: "white",
              fontSize: "28px",
              fontWeight: 800,
            }}
          >
            FILTRO MANN
          </h1>

          <p
            style={{
              margin: "6px 0 0",
              color: "#94a3b8",
              fontSize: "14px",
            }}
          >
            Referencia: W79
          </p>
        </div>
      </div>

      {/* MENSAJES */}

      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "30px",
          display: "flex",
          flexDirection: "column",
          gap: "20px",
        }}
      >
        {/* MENSAJE PROVEEDOR */}

        <div
          style={{
            display: "flex",
            justifyContent: "flex-start",
          }}
        >
          <div
            style={{
              background: "#1a264f",
              color: "white",
              padding: "16px 20px",
              borderRadius: "18px",
              maxWidth: "500px",
              fontSize: "16px",
            }}
          >
            Buenos días, tenemos stock disponible para entrega inmediata.
          </div>
        </div>

        {/* MENSAJE TALLER */}

        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
          }}
        >
          <div
            style={{
              background: "#2563eb",
              color: "white",
              padding: "16px 20px",
              borderRadius: "18px",
              maxWidth: "500px",
              fontSize: "16px",
            }}
          >
            Perfecto, ¿qué precio tiene?
          </div>
        </div>

        {/* MENSAJE PROVEEDOR */}

        <div
          style={{
            display: "flex",
            justifyContent: "flex-start",
          }}
        >
          <div
            style={{
              background: "#1a264f",
              color: "white",
              padding: "16px 20px",
              borderRadius: "18px",
              maxWidth: "500px",
              fontSize: "16px",
            }}
          >
            5,42 € + IVA.
          </div>
        </div>
      </div>

      {/* CAJA ENVÍO */}

      <div
        style={{
          padding: "20px",
          borderTop: "1px solid rgba(255,255,255,0.08)",
          background: "#081330",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            display: "flex",
            gap: "12px",
          }}
        >
          <input
            type="text"
            placeholder="Escribe un mensaje..."
            style={{
              flex: 1,
              height: "54px",
              borderRadius: "14px",
              border: "1px solid rgba(255,255,255,0.1)",
              background: "#0f1c45",
              color: "white",
              padding: "0 16px",
              fontSize: "15px",
            }}
          />

          <button
            style={{
              width: "140px",
              border: "none",
              borderRadius: "14px",
              background:
                "linear-gradient(135deg,#2563eb,#1d4ed8)",
              color: "white",
              fontWeight: 800,
              fontSize: "15px",
              cursor: "pointer",
            }}
          >
            Enviar
          </button>
        </div>
      </div>
    </div>
  );
}