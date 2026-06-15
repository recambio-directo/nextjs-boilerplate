"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase";

export default function PublicarPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [nombreEmpresa, setNombreEmpresa] = useState("");
  const [provincia, setProvincia] = useState<string | null>(null);
  const [form, setForm] = useState({
    tipo: "OEM", referencia: "", nombre: "", precio: "", stock: "", categoria: "", imagen: null as File | null,
  });

  useEffect(() => {
    async function verificar() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/"); return; }
      const { data: perfil } = await supabase.from("usuarios").select("tipo, nombre_empresa, provincia").eq("id", user.id).single();
      if (!perfil || perfil.tipo !== "proveedor") { router.push("/"); return; }
      setUserId(user.id);
      setNombreEmpresa(perfil.nombre_empresa || "");
      setProvincia(perfil.provincia || null);
    }
    verificar();
  }, []);

  async function publicarPieza() {
    if (!form.referencia || !form.nombre || !form.precio || !form.stock) { alert("Completa todos los campos"); return; }
    if (!userId) { alert("No autenticado"); return; }
    setLoading(true);

    let imageUrl = "";
    if (form.tipo === "UNI" && form.imagen) {
      const fileName = `${Date.now()}-${form.imagen.name}`;
      const { error: uploadError } = await supabase.storage.from("imagenes").upload(fileName, form.imagen);
      if (!uploadError) {
        const { data } = supabase.storage.from("imagenes").getPublicUrl(fileName);
        imageUrl = data.publicUrl;
      }
    }

    const { error } = await supabase.from("piezas_publicadas").insert({
      proveedor_id: userId,
      proveedor_nombre: nombreEmpresa,
      provincia,
      referencia: form.referencia.trim().toUpperCase(),
      descripcion: form.nombre,
      nombre: form.nombre,
      precio: Number(form.precio),
      stock: Number(form.stock),
      categoria: form.tipo,
      tipo: form.tipo,
      imagen: imageUrl,
    });

    setLoading(false);
    if (error) { console.error(error); alert("Error publicando"); return; }
    alert("Referencia publicada correctamente");
    setForm({ tipo: "OEM", referencia: "", nombre: "", precio: "", stock: "", categoria: "", imagen: null });
  }

  if (!userId) return (
    <main style={mainStyle}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
        <p style={{ color: "#94a3b8" }}>Verificando acceso...</p>
      </div>
    </main>
  );

  return (
    <main style={mainStyle}>
      <div style={containerStyle}>
        <div style={badgeStyle}>PUBLICACIÓN MANUAL</div>
        <h1 style={titleStyle}>NUEVA REFERENCIA</h1>
        <p style={subtitleStyle}>Publica referencias OEM, IAM, CAT o UNI manualmente.</p>
        <div style={formCard}>
          <div style={fieldBlock}>
            <label style={labelStyle}>TIPO RECAMBIO</label>
            <select value={form.tipo} onChange={e => setForm({ ...form, tipo: e.target.value })} style={inputStyle}>
              <option value="OEM">OEM ORIGINAL</option>
              <option value="IAM">IAM EQUIVALENTE</option>
              <option value="CAT">CAT RECUPERADO</option>
              <option value="UNI">UNI UNIVERSAL</option>
            </select>
          </div>
          <div style={fieldBlock}>
            <label style={labelStyle}>REFERENCIA</label>
            <input value={form.referencia} onChange={e => setForm({ ...form, referencia: e.target.value })} placeholder="Ej: W79" style={inputStyle} />
          </div>
          <div style={fieldBlock}>
            <label style={labelStyle}>DESCRIPCIÓN</label>
            <input value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} placeholder="Ej: FILTRO MANN" style={inputStyle} />
          </div>
          <div style={gridStyle}>
            <div style={fieldBlock}>
              <label style={labelStyle}>PRECIO €</label>
              <input type="number" value={form.precio} onChange={e => setForm({ ...form, precio: e.target.value })} placeholder="0.00" style={inputStyle} />
            </div>
            <div style={fieldBlock}>
              <label style={labelStyle}>STOCK</label>
              <input type="number" value={form.stock} onChange={e => setForm({ ...form, stock: e.target.value })} placeholder="0" style={inputStyle} />
            </div>
          </div>
          {form.tipo === "UNI" && (
            <div style={fieldBlock}>
              <label style={labelStyle}>IMAGEN PRODUCTO</label>
              <input type="file" onChange={e => setForm({ ...form, imagen: e.target.files?.[0] || null })} style={fileInputStyle} />
            </div>
          )}
          <button onClick={publicarPieza} disabled={loading} style={buttonStyle}>
            {loading ? "PUBLICANDO..." : "PUBLICAR REFERENCIA"}
          </button>
        </div>
      </div>
    </main>
  );
}

const mainStyle = { minHeight: "100vh", background: "linear-gradient(180deg,#020617 0%,#020817 100%)", color: "white", padding: "60px 40px" };
const containerStyle = { maxWidth: "1100px", margin: "0 auto" };
const badgeStyle = { display: "inline-block", padding: "10px 18px", borderRadius: "999px", background: "rgba(37,99,235,0.18)", color: "#60a5fa", fontWeight: 700, marginBottom: "24px" };
const titleStyle = { fontSize: "72px", fontWeight: 900, lineHeight: 1 };
const subtitleStyle = { marginTop: "20px", fontSize: "20px", color: "#94a3b8" };
const formCard = { marginTop: "50px", background: "rgba(15,23,42,0.96)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "30px", padding: "40px" };
const fieldBlock = { marginBottom: "28px" };
const labelStyle = { display: "block", marginBottom: "12px", fontWeight: 700, color: "#e2e8f0" };
const inputStyle = { width: "100%", background: "#020617", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "18px", padding: "18px", color: "white", fontSize: "16px", outline: "none" };
const fileInputStyle = { width: "100%", background: "#020617", border: "1px dashed rgba(255,255,255,0.15)", borderRadius: "18px", padding: "18px", color: "#94a3b8", fontSize: "15px" };
const gridStyle = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" };
const buttonStyle = { width: "100%", marginTop: "10px", border: "none", borderRadius: "20px", padding: "22px", background: "linear-gradient(135deg,#16a34a,#22c55e)", color: "white", fontSize: "18px", fontWeight: 800, cursor: "pointer" };