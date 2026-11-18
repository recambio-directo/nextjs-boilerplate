-- ════════════════════════════════════════════════════════════════════
-- migration_seguridad.sql  ·  Recambio Directo
-- Cierra los accesos abiertos de la base de datos.
-- Ejecutar ENTERO en Supabase → SQL Editor. Se puede ejecutar más de una vez.
-- ════════════════════════════════════════════════════════════════════
begin;

-- ── 1. Función "¿es admin?" ─────────────────────────────────────────
-- Lee la tabla sin pasar por RLS (evita bucles en las políticas de usuarios).
create or replace function public.es_admin()
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (select 1 from public.usuarios where id = auth.uid() and tipo = 'admin');
$$;
revoke all on function public.es_admin() from public;
grant execute on function public.es_admin() to anon, authenticated;


-- ── 2. Quitar las políticas que dejaban leer TODO a cualquiera ──────
drop policy if exists "admin lee todo conversaciones" on public.conversaciones;
drop policy if exists "admin lee todo pedidos"        on public.pedidos;
drop policy if exists "admin lee todo piezas"         on public.piezas_publicadas;
drop policy if exists "admin lee todo usuarios"       on public.usuarios;

-- Las de admin pasan a usar es_admin()
drop policy if exists "admin acceso total pedidos"    on public.pedidos;
drop policy if exists "admin acceso total piezas"     on public.piezas_publicadas;
drop policy if exists "admin modifica todo usuarios"  on public.usuarios;
drop policy if exists "admin total conversaciones"    on public.conversaciones;
drop policy if exists "admin total mensajes"          on public.mensajes;
drop policy if exists "admin total usuarios"          on public.usuarios;

create policy "admin total pedidos"        on public.pedidos           for all to authenticated using (public.es_admin()) with check (public.es_admin());
create policy "admin total piezas"         on public.piezas_publicadas for all to authenticated using (public.es_admin()) with check (public.es_admin());
create policy "admin total usuarios"       on public.usuarios          for all to authenticated using (public.es_admin()) with check (public.es_admin());
create policy "admin total conversaciones" on public.conversaciones    for all to authenticated using (public.es_admin()) with check (public.es_admin());
create policy "admin total mensajes"       on public.mensajes          for all to authenticated using (public.es_admin()) with check (public.es_admin());

-- Usuarios: sin sesión ya no se ve nada. Con sesión: tu perfil y los de talleres/proveedores
-- (la web los necesita para albaranes, chat y checkout).
drop policy if exists "usuario ve su perfil" on public.usuarios;
create policy "usuario ve su perfil" on public.usuarios for select to authenticated
  using (auth.uid() = id or tipo = any (array['proveedor','taller']));


-- ── 3. Nadie puede tocarse los campos de control de su propio perfil ─
-- (hacerse admin, darse crédito RD Pago, activarse, cambiar la suscripción o el FTP…)
-- Si lo intenta, el cambio se ignora en silencio; el resto del perfil se guarda normal.
create or replace function public.proteger_campos_usuario()
returns trigger
language plpgsql security definer
set search_path = public
as $$
declare
  protegidos text[] := array['id','tipo','activo','suscripcion','credito_rd','credito_rd_maximo',
    'rd_pago_activo','ftp_activo','ftp_usuario','ftp_api_key','tipo_referencias_ftp',
    'notas_admin','vehiculo_activo','email','fecha_registro'];
  viejo jsonb;
  nuevo jsonb;
  k text;
begin
  -- Servidor (service_role), SQL Editor, admins y procesos internos: sin restricciones
  if auth.uid() is null or public.es_admin() or current_setting('rd.interno', true) = 'si' then
    return new;
  end if;

  nuevo := to_jsonb(new);

  if tg_op = 'INSERT' then
    if coalesce(nuevo->>'tipo','') not in ('taller','proveedor') then
      raise exception 'Tipo de usuario no permitido';
    end if;
    nuevo := nuevo
      || jsonb_build_object('activo', false)
      || jsonb_build_object('suscripcion', case when nuevo->>'tipo' = 'taller' then 'activo' else 'gratuito' end);
    foreach k in array array['credito_rd','credito_rd_maximo'] loop
      if nuevo ? k then nuevo := nuevo || jsonb_build_object(k, 0); end if;
    end loop;
    foreach k in array array['rd_pago_activo','ftp_activo'] loop
      if nuevo ? k then nuevo := nuevo || jsonb_build_object(k, false); end if;
    end loop;
    foreach k in array array['ftp_usuario','ftp_api_key','notas_admin'] loop
      if nuevo ? k then nuevo := nuevo || jsonb_build_object(k, null); end if;
    end loop;
  else
    viejo := to_jsonb(old);
    foreach k in array protegidos loop
      if viejo ? k then nuevo := nuevo || jsonb_build_object(k, viejo->k); end if;
    end loop;
  end if;

  new := jsonb_populate_record(new, nuevo);
  return new;
end;
$$;

drop trigger if exists trg_proteger_campos_usuario on public.usuarios;
create trigger trg_proteger_campos_usuario
  before insert or update on public.usuarios
  for each row execute function public.proteger_campos_usuario();


-- ── 4. RD Pago: el crédito se descuenta en la base de datos, no en el navegador ─
-- Al crear un pedido con RD Pago se comprueba que el taller tiene saldo suficiente
-- y se descuenta en el mismo momento. Si no hay saldo, el pedido no se crea.
create or replace function public.descontar_credito_rd()
returns trigger
language plpgsql security definer
set search_path = public
as $$
declare
  u record;
begin
  if new.forma_pago is distinct from 'rd_pago' then return new; end if;
  if auth.uid() is null or public.es_admin() then return new; end if;  -- creados por servidor/admin

  select * into u from public.usuarios where id = new.cliente_id for update;
  if not found then raise exception 'Usuario no encontrado'; end if;
  if coalesce(u.credito_rd, 0) < coalesce(new.total, 0) then
    raise exception 'Saldo RD Pago insuficiente';
  end if;

  perform set_config('rd.interno', 'si', true);
  update public.usuarios set credito_rd = round((coalesce(credito_rd,0) - coalesce(new.total,0))::numeric, 2)
   where id = new.cliente_id;
  perform set_config('rd.interno', '', true);
  return new;
end;
$$;

drop trigger if exists trg_descontar_credito_rd on public.pedidos;
create trigger trg_descontar_credito_rd
  after insert on public.pedidos
  for each row execute function public.descontar_credito_rd();


-- ── 5. Pedidos: talleres y proveedores no pueden cambiar importes ni quién pagó ─
-- (siguen pudiendo poner tracking, albarán, factura, estado de envío, anulación…)
create or replace function public.proteger_campos_pedido()
returns trigger
language plpgsql security definer
set search_path = public
as $$
declare
  protegidos text[] := array['cliente_id','cliente_email','productos','subtotal','total',
    'coste_transporte','gastos_gestion','forma_pago','metodo_pago','estado_pago',
    'impuesto_tipo','impuesto_pct','codigo'];
  viejo jsonb := to_jsonb(old);
  nuevo jsonb := to_jsonb(new);
  k text;
begin
  if auth.uid() is null or public.es_admin() then return new; end if;
  foreach k in array protegidos loop
    if viejo ? k then nuevo := nuevo || jsonb_build_object(k, viejo->k); end if;
  end loop;
  new := jsonb_populate_record(new, nuevo);
  return new;
end;
$$;

drop trigger if exists trg_proteger_campos_pedido on public.pedidos;
create trigger trg_proteger_campos_pedido
  before update on public.pedidos
  for each row execute function public.proteger_campos_pedido();


-- ── 6. Tablas que estaban sin protección ────────────────────────────
-- Devoluciones: solo las partes implicadas y el admin
alter table if exists public.devoluciones enable row level security;
drop policy if exists "dev partes ven"      on public.devoluciones;
drop policy if exists "dev taller crea"     on public.devoluciones;
drop policy if exists "dev partes editan"   on public.devoluciones;
drop policy if exists "dev admin total"     on public.devoluciones;
create policy "dev partes ven"    on public.devoluciones for select to authenticated using (auth.uid() = solicitante_id or auth.uid() = proveedor_id);
create policy "dev taller crea"   on public.devoluciones for insert to authenticated with check (auth.uid() = solicitante_id);
create policy "dev partes editan" on public.devoluciones for update to authenticated using (auth.uid() = solicitante_id or auth.uid() = proveedor_id);
create policy "dev admin total"   on public.devoluciones for all to authenticated using (public.es_admin()) with check (public.es_admin());

-- Pagos a proveedores: admin (y cada proveedor puede ver los suyos)
alter table if exists public.pagos_proveedores enable row level security;
drop policy if exists "pagos admin total"     on public.pagos_proveedores;
drop policy if exists "pagos proveedor ve"    on public.pagos_proveedores;
create policy "pagos admin total"  on public.pagos_proveedores for all to authenticated using (public.es_admin()) with check (public.es_admin());
create policy "pagos proveedor ve" on public.pagos_proveedores for select to authenticated using (auth.uid() = proveedor_id);

-- Exclusiones de proveedor: el buscador las lee; cada proveedor gestiona las suyas
alter table if exists public.exclusiones_proveedor enable row level security;
drop policy if exists "excl leer"            on public.exclusiones_proveedor;
drop policy if exists "excl proveedor crea"  on public.exclusiones_proveedor;
drop policy if exists "excl proveedor borra" on public.exclusiones_proveedor;
drop policy if exists "excl admin total"     on public.exclusiones_proveedor;
create policy "excl leer"            on public.exclusiones_proveedor for select to authenticated using (true);
create policy "excl proveedor crea"  on public.exclusiones_proveedor for insert to authenticated with check (auth.uid() = proveedor_id);
create policy "excl proveedor borra" on public.exclusiones_proveedor for delete to authenticated using (auth.uid() = proveedor_id);
create policy "excl admin total"     on public.exclusiones_proveedor for all to authenticated using (public.es_admin()) with check (public.es_admin());

-- Mensajes de pedido (chat de soporte): el autor, las partes del pedido y el admin
alter table if exists public.mensajes_pedido enable row level security;
drop policy if exists "msgped ver"         on public.mensajes_pedido;
drop policy if exists "msgped enviar"      on public.mensajes_pedido;
drop policy if exists "msgped admin total" on public.mensajes_pedido;
create policy "msgped ver" on public.mensajes_pedido for select to authenticated using (
  auth.uid() = user_id or exists (
    select 1 from public.pedidos p where p.id = mensajes_pedido.pedido_id
      and (p.cliente_id = auth.uid()
           or p.productos::jsonb @> jsonb_build_array(jsonb_build_object('proveedor_id', auth.uid()::text)))));
create policy "msgped enviar" on public.mensajes_pedido for insert to authenticated with check (auth.uid() = user_id);
create policy "msgped admin total" on public.mensajes_pedido for all to authenticated using (public.es_admin()) with check (public.es_admin());

-- Claves de la API de stock: solo admin (el servidor no se ve afectado)
alter table if exists public.api_keys_proveedores enable row level security;
drop policy if exists "apikeys admin total" on public.api_keys_proveedores;
create policy "apikeys admin total" on public.api_keys_proveedores for all to authenticated using (public.es_admin()) with check (public.es_admin());

-- Solo las usa el servidor: cerradas al navegador
alter table if exists public.webhooks_proveedores enable row level security;
alter table if exists public.ipda_sesiones        enable row level security;
alter table if exists public.almacenes            enable row level security;
alter table if exists public.asistente_consultas  enable row level security;

-- Datos de referencia: lectura libre, escritura solo servidor
alter table if exists public.codigos_postales    enable row level security;
alter table if exists public.cruces_referencias  enable row level security;
drop policy if exists "cp leer"     on public.codigos_postales;
drop policy if exists "cruces leer" on public.cruces_referencias;
create policy "cp leer"     on public.codigos_postales   for select using (true);
create policy "cruces leer" on public.cruces_referencias for select using (true);

commit;


-- ════════════════════════════════════════════════════════════════════
-- COMPROBACIÓN (ejecutar después y pegarme el resultado)
-- Tablas que siguen SIN protección (rowsecurity = false):
-- ════════════════════════════════════════════════════════════════════
select tablename, rowsecurity
from pg_tables
where schemaname = 'public'
order by rowsecurity, tablename;
