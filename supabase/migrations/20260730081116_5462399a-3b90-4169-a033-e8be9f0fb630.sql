CREATE TYPE public.payment_status AS ENUM ('created','pending','paid','failed','refunded','cancelled');

CREATE TABLE public.payment_settings (
  id boolean PRIMARY KEY DEFAULT true CHECK (id),
  mode text NOT NULL DEFAULT 'test',
  razorpay_key_id_test text NOT NULL DEFAULT '',
  razorpay_key_id_live text NOT NULL DEFAULT '',
  razorpay_enabled boolean NOT NULL DEFAULT true,
  upi_enabled boolean NOT NULL DEFAULT true,
  card_enabled boolean NOT NULL DEFAULT true,
  netbanking_enabled boolean NOT NULL DEFAULT true,
  wallet_enabled boolean NOT NULL DEFAULT true,
  cod_enabled boolean NOT NULL DEFAULT true,
  cod_min_order integer NOT NULL DEFAULT 0,
  cod_max_order integer NOT NULL DEFAULT 20000,
  currency text NOT NULL DEFAULT 'INR',
  checkout_name text NOT NULL DEFAULT 'Mazhalai Ulagam',
  checkout_description text NOT NULL DEFAULT 'Order payment',
  auto_capture boolean NOT NULL DEFAULT true,
  max_retries integer NOT NULL DEFAULT 3,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.payment_settings TO anon;
GRANT SELECT, INSERT, UPDATE ON public.payment_settings TO authenticated;
GRANT ALL ON public.payment_settings TO service_role;
ALTER TABLE public.payment_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Payment settings are public" ON public.payment_settings FOR SELECT USING (true);
CREATE POLICY "Staff manage payment settings" ON public.payment_settings FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE TRIGGER update_payment_settings_updated_at BEFORE UPDATE ON public.payment_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.payment_settings (id) VALUES (true) ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS payment_status public.payment_status NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS payment_attempts integer NOT NULL DEFAULT 0;

CREATE TABLE public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  provider text NOT NULL DEFAULT 'razorpay',
  mode text NOT NULL DEFAULT 'test',
  amount integer NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'INR',
  method text NOT NULL DEFAULT '',
  status public.payment_status NOT NULL DEFAULT 'created',
  razorpay_order_id text,
  razorpay_payment_id text,
  razorpay_signature text,
  attempt integer NOT NULL DEFAULT 1,
  error_code text,
  error_description text,
  raw jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX payments_order_id_idx ON public.payments(order_id);
CREATE UNIQUE INDEX payments_rzp_payment_id_idx ON public.payments(razorpay_payment_id) WHERE razorpay_payment_id IS NOT NULL;
CREATE INDEX payments_rzp_order_id_idx ON public.payments(razorpay_order_id);

GRANT SELECT ON public.payments TO authenticated;
GRANT ALL ON public.payments TO service_role;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own payments" ON public.payments FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = payments.order_id AND (o.user_id = auth.uid() OR public.is_staff(auth.uid()))));
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON public.payments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();