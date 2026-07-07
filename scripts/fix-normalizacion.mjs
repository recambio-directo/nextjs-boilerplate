import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

const headers = {
  "apikey": key,
  "Authorization": `Bearer ${key}`,
  "Content-Type": "application/json",
};

// Paso 1: actualizar la funcion del trigger
const res1 = await fetch(`${url}/pg/query`, {
  method: "POST",
  headers,
  body: JSON.stringify({
    query: "CREATE OR REPLACE FUNCTION normalizar_referencia_pieza() RETURNS TRIGGER AS $fn$ BEGIN NEW.referencia_normalizada := UPPER(REGEXP_REPLACE(NEW.referencia, '[^A-Za-z0-9]', '', 'g')); RETURN NEW; END; $fn$ LANGUAGE plpgsql;"
  }),
});
console.log("Paso 1 (funcion):", res1.status, await res1.text());

// Paso 2: forzar recalculo
const res2 = await fetch(`${url}/pg/query`, {
  method: "POST",
  headers,
  body: JSON.stringify({
    query: "UPDATE piezas_publicadas SET referencia = referencia;"
  }),
});
console.log("Paso 2 (update):", res2.status, await res2.text());

// Paso 3: verificar
const sb = createClient(url, key);
const { data } = await sb
  .from("piezas_publicadas")
  .select("referencia, referencia_normalizada")
  .ilike("referencia", "%/%")
  .limit(5);
console.log("Paso 3 (verificar):", data);
