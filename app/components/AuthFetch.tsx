"use client";
// app/components/AuthFetch.tsx
// Añade automáticamente la sesión del usuario (Authorization: Bearer <token>)
// a todas las llamadas del navegador a /api/* de esta misma web.
// Así la API puede exigir sesión sin tocar cada fetch de la aplicación.
import { supabase } from "../lib/supabase";

declare global {
  interface Window { __rdAuthFetch?: boolean }
}

if (typeof window !== "undefined" && !window.__rdAuthFetch) {
  window.__rdAuthFetch = true;
  const original = window.fetch.bind(window);

  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    try {
      const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
      const destino = new URL(url, window.location.origin);
      if (destino.origin === window.location.origin && destino.pathname.startsWith("/api/")) {
        const headers = new Headers(init?.headers ?? (input instanceof Request ? input.headers : undefined));
        if (!headers.has("authorization")) {
          const { data } = await supabase.auth.getSession();
          const token = data.session?.access_token;
          if (token) headers.set("authorization", `Bearer ${token}`);
        }
        if (input instanceof Request) return original(new Request(input, { ...init, headers }));
        return original(input, { ...init, headers });
      }
    } catch {
      // si algo falla aquí, se hace la llamada normal
    }
    return original(input, init);
  };
}

export default function AuthFetch() {
  return null;
}
