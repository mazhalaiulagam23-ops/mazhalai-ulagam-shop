DROP VIEW IF EXISTS public.cookie_banner_config;

ALTER TABLE public.security_settings
  DROP COLUMN IF EXISTS cookie_banner_enabled,
  DROP COLUMN IF EXISTS cookie_banner_text;

CREATE TABLE public.cookie_settings (
  id boolean PRIMARY KEY DEFAULT true CHECK (id),
  enabled boolean NOT NULL DEFAULT true,
  message text NOT NULL DEFAULT 'We use cookies to keep your cart working, remember your preferences and understand how our store is used.',
  policy_href text NOT NULL DEFAULT '/privacy-policy',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.cookie_settings TO anon, authenticated;
GRANT INSERT, UPDATE ON public.cookie_settings TO authenticated;
GRANT ALL ON public.cookie_settings TO service_role;
ALTER TABLE public.cookie_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read cookie settings" ON public.cookie_settings
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins manage cookie settings" ON public.cookie_settings
  FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE TRIGGER cookie_settings_updated_at BEFORE UPDATE ON public.cookie_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.cookie_settings (id) VALUES (true) ON CONFLICT (id) DO NOTHING;