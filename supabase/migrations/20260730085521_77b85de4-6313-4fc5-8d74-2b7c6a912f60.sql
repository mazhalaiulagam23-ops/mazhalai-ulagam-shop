DROP POLICY IF EXISTS "Payment settings are public" ON public.payment_settings;

CREATE POLICY "Staff read payment settings"
ON public.payment_settings FOR SELECT TO authenticated
USING (public.is_staff(auth.uid()));

REVOKE SELECT ON public.payment_settings FROM anon;

CREATE OR REPLACE VIEW public.payment_config AS
SELECT
  id,
  mode,
  razorpay_enabled,
  upi_enabled,
  card_enabled,
  netbanking_enabled,
  wallet_enabled,
  cod_enabled,
  cod_min_order,
  cod_max_order,
  currency
FROM public.payment_settings;

GRANT SELECT ON public.payment_config TO anon, authenticated;

REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;