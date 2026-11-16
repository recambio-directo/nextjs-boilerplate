-- ============================================================
-- CAMPANITA: notificaciones guardadas en la base de datos
-- Ejecutar una vez en Supabase > SQL Editor. Se puede repetir sin romper nada.
-- No toca la tabla antigua "notificaciones" ni datos existentes.
-- ============================================================

-- 1) Tabla
create table if not exists public.notificaciones_usuario (
  id         bigint generated always as identity primary key,
  user_id    uuid not null references auth.users(id) on delete cascade,
  tipo       text not null,                 -- 'pedido' | 'chat'
  texto      text not null,
  leida      boolean not null default false,
  pedido_id  bigint,
  conv_id    bigint,
  created_at timestamptz not null default now()
);

create index if not exists notificaciones_usuario_user_idx
  on public.notificaciones_usuario (user_id, created_at desc);

-- 2) Seguridad: cada usuario solo ve, marca y borra las suyas.
--    Nadie puede insertar desde la web: solo las crean los triggers.
alter table public.notificaciones_usuario enable row level security;

revoke all on public.notificaciones_usuario from anon;
grant select, update, delete on public.notificaciones_usuario to authenticated;

drop policy if exists notif_usuario_select on public.notificaciones_usuario;
create policy notif_usuario_select on public.notificaciones_usuario
  for select to authenticated using (auth.uid() = user_id);

drop policy if exists notif_usuario_update on public.notificaciones_usuario;
create policy notif_usuario_update on public.notificaciones_usuario
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists notif_usuario_delete on public.notificaciones_usuario;
create policy notif_usuario_delete on public.notificaciones_usuario
  for delete to authenticated using (auth.uid() = user_id);

-- 3) Trigger de PEDIDOS
--    - Pedido nuevo            -> avisa a cada proveedor del pedido
--    - Cambio de estado_envio  -> avisa al taller y a los proveedores
--    Quien provoca el cambio no recibe su propio aviso.
--    Si algo falla aquí dentro, el pedido se guarda igualmente.
create or replace function public.notif_pedido()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor  uuid := auth.uid();
  v_codigo text;
  v_prod   jsonb;
  v_texto  text;
  v_dest   uuid;
begin
  begin
    v_codigo := coalesce(nullif(NEW.codigo, ''), '#' || NEW.id);

    v_prod := to_jsonb(NEW.productos);
    if jsonb_typeof(v_prod) = 'string' then v_prod := (v_prod #>> '{}')::jsonb; end if;
    if v_prod is null or jsonb_typeof(v_prod) <> 'array' then v_prod := '[]'::jsonb; end if;

    if TG_OP = 'INSERT' then
      v_texto := '🆕 Nuevo pedido ' || v_codigo;
    elsif NEW.estado_envio is distinct from OLD.estado_envio and NEW.estado_envio is not null then
      v_texto := '📦 Pedido ' || v_codigo || ' → ' ||
        case NEW.estado_envio
          when 'preparando'  then '🔧 en preparación'
          when 'recogido'    then '📦 recogido por la agencia'
          when 'en_transito' then '🚚 en tránsito'
          when 'enviado'     then '🚚 enviado'
          when 'entregado'   then '✅ entregado'
          when 'anulado'     then '❌ anulado'
          else NEW.estado_envio
        end;
      -- Aviso al taller que hizo el pedido
      if NEW.cliente_id is not null and NEW.cliente_id::text::uuid is distinct from v_actor then
        insert into notificaciones_usuario (user_id, tipo, texto, pedido_id)
        values (NEW.cliente_id::text::uuid, 'pedido', v_texto, NEW.id);
      end if;
    else
      return NEW;
    end if;

    -- Aviso a los proveedores del pedido
    for v_dest in
      select distinct (e->>'proveedor_id')::uuid
      from jsonb_array_elements(v_prod) e
      where e->>'proveedor_id' ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    loop
      if v_dest is distinct from v_actor
         and (NEW.cliente_id is null or v_dest is distinct from NEW.cliente_id::text::uuid) then
        insert into notificaciones_usuario (user_id, tipo, texto, pedido_id)
        values (v_dest, 'pedido', v_texto, NEW.id);
      end if;
    end loop;
  exception when others then
    raise warning 'notif_pedido: %', sqlerrm;
  end;
  return NEW;
end;
$$;

drop trigger if exists trg_notif_pedido on public.pedidos;
create trigger trg_notif_pedido
  after insert or update of estado_envio on public.pedidos
  for each row execute function public.notif_pedido();

-- 4) Trigger de MENSAJES del chat -> avisa al otro participante
create or replace function public.notif_mensaje()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_u1    uuid;
  v_u2    uuid;
  v_autor uuid;
  v_texto text;
begin
  begin
    if NEW.conversacion_id is null then return NEW; end if;

    select user1_id::text::uuid, user2_id::text::uuid into v_u1, v_u2
    from conversaciones where id = NEW.conversacion_id;

    v_autor := NEW.user_id::text::uuid;
    v_texto := '💬 ' || left(coalesce(NEW.mensaje, ''), 60);

    if v_u1 is not null and v_u1 is distinct from v_autor then
      insert into notificaciones_usuario (user_id, tipo, texto, conv_id)
      values (v_u1, 'chat', v_texto, NEW.conversacion_id);
    end if;
    if v_u2 is not null and v_u2 is distinct from v_autor and v_u2 is distinct from v_u1 then
      insert into notificaciones_usuario (user_id, tipo, texto, conv_id)
      values (v_u2, 'chat', v_texto, NEW.conversacion_id);
    end if;
  exception when others then
    raise warning 'notif_mensaje: %', sqlerrm;
  end;
  return NEW;
end;
$$;

drop trigger if exists trg_notif_mensaje on public.mensajes;
create trigger trg_notif_mensaje
  after insert on public.mensajes
  for each row execute function public.notif_mensaje();

-- 5) Avisos en directo (sin recargar la página)
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'notificaciones_usuario'
  ) then
    alter publication supabase_realtime add table public.notificaciones_usuario;
  end if;
end $$;

-- 6) Comprobación: debe devolver 2 triggers y 3 políticas
select 'triggers' as que, count(*) from pg_trigger where tgname in ('trg_notif_pedido', 'trg_notif_mensaje') and not tgisinternal
union all
select 'politicas', count(*) from pg_policies where schemaname = 'public' and tablename = 'notificaciones_usuario';
