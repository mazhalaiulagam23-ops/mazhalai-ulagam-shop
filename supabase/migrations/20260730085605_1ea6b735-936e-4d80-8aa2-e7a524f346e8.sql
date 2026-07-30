ALTER VIEW public.payment_config SET (security_invoker = on);

DROP POLICY IF EXISTS "Staff read payment settings" ON public.payment_settings;

CREATE POLICY "Checkout config is readable"
ON public.payment_settings FOR SELECT TO anon, authenticated
USING (true);

REVOKE SELECT ON public.payment_settings FROM anon, authenticated;

GRANT SELECT (id, mode, razorpay_enabled, upi_enabled, card_enabled, netbanking_enabled, wallet_enabled, cod_enabled, cod_min_order, cod_max_order, currency)
ON public.payment_settings TO anon, authenticated;

GRANT SELECT ON public.payment_config TO anon, authenticated;
GRANT ALL ON public.payment_settings TO service_role;