-- migration_refs_seo.sql
-- Páginas públicas de referencias (SEO): /referencia/[marca]/[ref]
-- Ejecutar UNA vez en Supabase → SQL Editor. No toca piezas_publicadas ni ningún dato existente:
-- solo crea dos vistas materializadas de solo lectura y una función para refrescarlas.

-- ── 1. Una fila por referencia + marca con stock publicado ───────────────────────
drop materialized view if exists public.refs_seo_marcas;
drop materialized view if exists public.refs_seo;

create materialized view public.refs_seo as
with base as (
  select
    referencia_normalizada                                                     as ref_norm,
    trim(both '-' from regexp_replace(lower(coalesce(nullif(trim(marca), ''), 'sin-marca')), '[^a-z0-9]+', '-', 'g')) as marca_slug,
    referencia,
    nullif(trim(marca), '')                                                    as marca,
    nullif(trim(descripcion), '')                                              as descripcion,
    tipo,
    proveedor_id
  from public.piezas_publicadas
  where referencia_normalizada is not null
    and length(referencia_normalizada) >= 4
)
select
  row_number() over (order by marca_slug, ref_norm)                            as rn,
  marca_slug,
  ref_norm,
  min(referencia)                                                              as referencia,
  coalesce(min(marca), 'Sin marca')                                            as marca,
  (array_agg(descripcion order by length(descripcion) desc nulls last))[1]     as descripcion,
  case when bool_or(tipo = 'OEM') then 'OEM' else 'IAM' end                    as tipo,
  count(distinct proveedor_id)                                                 as num_proveedores
from base
where marca_slug <> ''
group by marca_slug, ref_norm;

create unique index refs_seo_pk      on public.refs_seo (marca_slug, ref_norm);
create unique index refs_seo_rn      on public.refs_seo (rn);
create index        refs_seo_refnorm on public.refs_seo (ref_norm);

-- ── 2. Resumen por marca (para /referencia y /referencia/[marca]) ───────────────
create materialized view public.refs_seo_marcas as
select
  marca_slug,
  min(marca)                     as marca,
  count(*)                       as num_refs,
  count(*) filter (where descripcion is not null) as num_refs_con_desc
from public.refs_seo
group by marca_slug;

create unique index refs_seo_marcas_pk on public.refs_seo_marcas (marca_slug);

-- Solo el servidor (service role) lee estas vistas; nunca el navegador
revoke all on public.refs_seo        from anon, authenticated;
revoke all on public.refs_seo_marcas from anon, authenticated;

-- ── 3. Refresco diario (lo llama el cron /api/cron/refs-seo) ────────────────────
create or replace function public.refrescar_refs_seo()
returns void
language plpgsql
security definer
set search_path = public
set statement_timeout = '300s'
as $$
begin
  refresh materialized view concurrently public.refs_seo;
  refresh materialized view concurrently public.refs_seo_marcas;
end;
$$;

revoke all on function public.refrescar_refs_seo() from public, anon, authenticated;
grant execute on function public.refrescar_refs_seo() to service_role;

-- Comprobación rápida (debe devolver números > 0):
select (select count(*) from public.refs_seo) as referencias,
       (select count(*) from public.refs_seo_marcas) as marcas;
