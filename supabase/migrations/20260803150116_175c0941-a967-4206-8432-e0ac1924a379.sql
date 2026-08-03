drop view if exists public.payment_config;
create view public.payment_config
with (security_invoker = on) as
  select id, mode, razorpay_enabled, upi_enabled, card_enabled, netbanking_enabled,
         wallet_enabled, cod_enabled, cod_min_order, cod_max_order, currency
  from public.payment_settings;

revoke all on public.payment_config from public;
revoke all on public.payment_config from anon;
revoke all on public.payment_config from authenticated;
grant select on public.payment_config to anon, authenticated;
grant all on public.payment_config to service_role;

-- Column-level grants: sensitive payment columns stay unreadable for visitors
revoke all on public.payment_settings from anon;
revoke all on public.payment_settings from authenticated;
grant select (id, mode, razorpay_enabled, upi_enabled, card_enabled, netbanking_enabled,
              wallet_enabled, cod_enabled, cod_min_order, cod_max_order, currency)
  on public.payment_settings to anon, authenticated;
grant insert, update, delete on public.payment_settings to authenticated;
grant all on public.payment_settings to service_role;

create policy "Checkout config columns are readable"
on public.payment_settings for select
to anon, authenticated
using (true);