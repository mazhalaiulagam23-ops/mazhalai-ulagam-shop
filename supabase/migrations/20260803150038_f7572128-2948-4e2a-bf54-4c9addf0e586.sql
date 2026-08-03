create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated, service_role;

create or replace function private.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role);
$$;

create or replace function private.is_admin(_user_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role in ('super_admin','admin'));
$$;

create or replace function private.is_staff(_user_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role in ('super_admin','admin','manager','staff'));
$$;

create or replace function private.has_permission(_user_id uuid, _module text, _action text)
returns boolean language plpgsql stable security definer set search_path = public as $$
DECLARE
  result boolean := false;
BEGIN
  IF _user_id IS NULL THEN RETURN false; END IF;
  IF EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'super_admin') THEN
    RETURN true;
  END IF;

  SELECT CASE _action
    WHEN 'create' THEN bool_or(can_create)
    WHEN 'read' THEN bool_or(can_read)
    WHEN 'update' THEN bool_or(can_update)
    WHEN 'delete' THEN bool_or(can_delete)
    WHEN 'export' THEN bool_or(can_export)
    WHEN 'settings' THEN bool_or(can_settings)
    ELSE false END
  INTO result
  FROM public.user_permissions
  WHERE user_id = _user_id AND module = _module;

  IF result IS NOT NULL THEN RETURN result; END IF;

  SELECT CASE _action
    WHEN 'create' THEN bool_or(rp.can_create)
    WHEN 'read' THEN bool_or(rp.can_read)
    WHEN 'update' THEN bool_or(rp.can_update)
    WHEN 'delete' THEN bool_or(rp.can_delete)
    WHEN 'export' THEN bool_or(rp.can_export)
    WHEN 'settings' THEN bool_or(rp.can_settings)
    ELSE false END
  INTO result
  FROM public.role_permissions rp
  JOIN public.user_roles ur ON ur.role = rp.role
  WHERE ur.user_id = _user_id AND rp.module = _module;

  RETURN coalesce(result, false);
END; $$;

revoke all on function private.has_role(uuid, public.app_role) from public;
revoke all on function private.is_admin(uuid) from public;
revoke all on function private.is_staff(uuid) from public;
revoke all on function private.has_permission(uuid, text, text) from public;
grant execute on function private.has_role(uuid, public.app_role) to authenticated, service_role;
grant execute on function private.is_admin(uuid) to authenticated, service_role;
grant execute on function private.is_staff(uuid) to authenticated, service_role;
grant execute on function private.has_permission(uuid, text, text) to authenticated, service_role;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security invoker set search_path = public as $$
  select private.has_role(_user_id, _role);
$$;

create or replace function public.is_admin(_user_id uuid)
returns boolean language sql stable security invoker set search_path = public as $$
  select private.is_admin(_user_id);
$$;

create or replace function public.is_staff(_user_id uuid)
returns boolean language sql stable security invoker set search_path = public as $$
  select private.is_staff(_user_id);
$$;

create or replace function public.has_permission(_user_id uuid, _module text, _action text)
returns boolean language sql stable security invoker set search_path = public as $$
  select private.has_permission(_user_id, _module, _action);
$$;

revoke all on function public.has_role(uuid, public.app_role) from public;
revoke all on function public.is_admin(uuid) from public;
revoke all on function public.is_staff(uuid) from public;
revoke all on function public.has_permission(uuid, text, text) from public;
grant execute on function public.has_role(uuid, public.app_role) to authenticated, service_role;
grant execute on function public.is_admin(uuid) to authenticated, service_role;
grant execute on function public.is_staff(uuid) to authenticated, service_role;
grant execute on function public.has_permission(uuid, text, text) to authenticated, service_role;

drop policy if exists "Checkout config is readable" on public.payment_settings;
revoke all on public.payment_settings from anon;

drop view if exists public.payment_config;
create view public.payment_config
with (security_invoker = off) as
  select id, mode, razorpay_enabled, upi_enabled, card_enabled, netbanking_enabled,
         wallet_enabled, cod_enabled, cod_min_order, cod_max_order, currency
  from public.payment_settings;

revoke all on public.payment_config from public;
revoke all on public.payment_config from anon;
revoke all on public.payment_config from authenticated;
grant select on public.payment_config to anon, authenticated;
grant all on public.payment_config to service_role;

drop policy if exists "Product images are readable" on storage.objects;
create policy "Staff read product images"
on storage.objects for select to authenticated
using (bucket_id = 'product-images' and public.is_staff(auth.uid()));