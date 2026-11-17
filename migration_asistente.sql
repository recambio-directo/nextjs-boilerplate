-- ============================================================
-- ASISTENTE DE RECAMBIOS — tabla propia (no toca nada existente)
-- Ejecutar una vez en Supabase > SQL Editor. Se puede repetir.
-- Guarda cada consulta: sirve para el límite diario, para ver el
-- coste (tokens) y para saber qué piden los talleres.
-- ============================================================

create table if not exists public.asistente_consultas (
  id                  bigint generated always as identity primary key,
  user_id             uuid not null references auth.users(id) on delete cascade,
  pregunta            text not null,
  respuesta           text,
  herramientas        jsonb,
  vehiculo            text,
  productos_mostrados int  not null default 0,
  modelo              text,
  tokens_entrada      int  not null default 0,
  tokens_salida       int  not null default 0,
  duracion_ms         int,
  error               text,
  created_at          timestamptz not null default now()
);

create index if not exists asistente_consultas_user_fecha_idx
  on public.asistente_consultas (user_id, created_at desc);

-- Solo el servidor (service role) lee y escribe. Nadie desde el navegador.
alter table public.asistente_consultas enable row level security;
revoke all on public.asistente_consultas from anon, authenticated;

-- Comprobación: debe salir 1 fila con rls = true
select relname as tabla, relrowsecurity as rls
from pg_class where relname = 'asistente_consultas';
