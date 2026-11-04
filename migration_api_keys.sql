-- ============================================================
-- MIGRACIÓN: Tabla api_keys_proveedores
-- Ejecutar en Supabase SQL Editor
-- ============================================================

-- Tabla de API keys para proveedores
CREATE TABLE IF NOT EXISTS api_keys_proveedores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  proveedor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  api_key_hash TEXT NOT NULL UNIQUE,
  api_key_prefix TEXT NOT NULL,  -- primeros 8 chars para identificación visual (ej: "rd_live_a1")
  nombre TEXT DEFAULT 'Clave principal',
  activa BOOLEAN DEFAULT true,
  creada_en TIMESTAMPTZ DEFAULT now(),
  ultimo_uso TIMESTAMPTZ,
  total_peticiones INTEGER DEFAULT 0
);

-- Índice para búsqueda rápida por hash
CREATE INDEX IF NOT EXISTS idx_api_keys_hash ON api_keys_proveedores(api_key_hash) WHERE activa = true;

-- Índice por proveedor
CREATE INDEX IF NOT EXISTS idx_api_keys_proveedor ON api_keys_proveedores(proveedor_id);

-- Tabla de webhooks de proveedores
CREATE TABLE IF NOT EXISTS webhooks_proveedores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  proveedor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  eventos TEXT[] NOT NULL DEFAULT '{}',
  secreto TEXT,
  activo BOOLEAN DEFAULT true,
  fallos_consecutivos INTEGER DEFAULT 0,
  creado_en TIMESTAMPTZ DEFAULT now(),
  actualizado_en TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_webhooks_proveedor ON webhooks_proveedores(proveedor_id);

-- Tabla de log de actividad API (opcional, para debugging)
CREATE TABLE IF NOT EXISTS api_log (
  id BIGSERIAL PRIMARY KEY,
  proveedor_id UUID NOT NULL,
  endpoint TEXT NOT NULL,
  metodo TEXT NOT NULL,
  status INTEGER NOT NULL,
  duracion_ms INTEGER,
  timestamp TIMESTAMPTZ DEFAULT now()
);

-- Retención: auto-borrar logs de más de 30 días (ejecutar como cron)
-- DELETE FROM api_log WHERE timestamp < now() - interval '30 days';

-- ============================================================
-- FUNCIÓN: Generar API key (ejecutar desde admin)
-- Uso: SELECT generar_api_key('uuid-del-proveedor');
-- ============================================================
CREATE OR REPLACE FUNCTION generar_api_key(p_proveedor_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_key TEXT;
  v_hash TEXT;
  v_prefix TEXT;
BEGIN
  -- Generar key aleatoria: rd_live_ + 40 chars hex
  v_key := 'rd_live_' || encode(gen_random_bytes(20), 'hex');
  v_prefix := substring(v_key from 1 for 16);
  v_hash := encode(sha256(v_key::bytea), 'hex');

  INSERT INTO api_keys_proveedores (proveedor_id, api_key_hash, api_key_prefix, nombre)
  VALUES (p_proveedor_id, v_hash, v_prefix, 'Clave principal');

  -- Devuelve la key en claro (SOLO esta vez, luego solo se guarda el hash)
  RETURN v_key;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
