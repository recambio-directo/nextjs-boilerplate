-- ============================================================
-- IVA / IGIC por pedido (Canarias, Ceuta y Melilla)
-- Ejecutar ANTES de desplegar el código nuevo: el checkout guarda estas columnas
-- y, sin ellas, la creación de pedidos fallaría.
-- Se puede repetir sin romper nada. Los pedidos existentes quedan como IVA 21 %.
-- ============================================================

alter table public.pedidos add column if not exists impuesto_tipo text not null default 'IVA';
alter table public.pedidos add column if not exists impuesto_pct  numeric not null default 21;
alter table public.pedidos add column if not exists impuesto_nota text;

alter table public.pedidos drop constraint if exists pedidos_impuesto_tipo_check;
alter table public.pedidos add constraint pedidos_impuesto_tipo_check
  check (impuesto_tipo in ('IVA', 'IGIC', 'EXENTO'));

-- Comprobación: deben salir 3 columnas
select column_name, data_type, column_default
from information_schema.columns
where table_schema = 'public' and table_name = 'pedidos' and column_name like 'impuesto\_%'
order by column_name;
