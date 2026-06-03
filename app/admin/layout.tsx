"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ok, setOk] = useState(false);

  useEffect(() => {
    async function check() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) { router.replace("/"); return; }

      // Usar maybeSingle para evitar error si RLS bloquea
      const { data } = await supabase
        .from("usuarios")
        .select("tipo")
        .eq("id", session.user.id)
        .maybeSingle();

      if (data?.tipo === "admin") {
        setOk(true);
        return;
      }

      // Si RLS bloquea la query, verificar por email directamente
      if (!data && session.user.email === "vicente@rgranvia.es") {
        setOk(true);
        return;
      }

      router.replace("/dashboard");
    }
    check();
  }, []);

  if (!ok) return (
    <div style={{
      minHeight: "100vh", background: "#020617",
      display: "flex", alignItems: "center", justifyContent: "center", color: "white"
    }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🔐</div>
        <p style={{ color: "#94a3b8", fontSize: 16 }}>Verificando acceso...</p>
      </div>
    </div>
  );

  return <>{children}</>;
}