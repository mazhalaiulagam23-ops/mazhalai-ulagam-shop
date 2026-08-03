CREATE TABLE public.theme_settings (
  id boolean NOT NULL PRIMARY KEY DEFAULT true CHECK (id),
  preset text NOT NULL DEFAULT 'luxury',
  primary_color text NOT NULL DEFAULT '#0F766E',
  secondary_color text NOT NULL DEFAULT '#D4AF37',
  accent_color text NOT NULL DEFAULT '#FF8A80',
  background_color text NOT NULL DEFAULT '#FFFBF5',
  foreground_color text NOT NULL DEFAULT '#1C2B2A',
  heading_font text NOT NULL DEFAULT 'Fraunces',
  body_font text NOT NULL DEFAULT 'Plus Jakarta Sans',
  base_radius numeric NOT NULL DEFAULT 16,
  container_width integer NOT NULL DEFAULT 1280,
  button_style text NOT NULL DEFAULT 'rounded',
  shadow_style text NOT NULL DEFAULT 'soft',
  dark_mode_enabled boolean NOT NULL DEFAULT true,
  animations_enabled boolean NOT NULL DEFAULT true,
  custom_css text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.theme_settings TO anon;
GRANT SELECT, INSERT, UPDATE ON public.theme_settings TO authenticated;
GRANT ALL ON public.theme_settings TO service_role;

ALTER TABLE public.theme_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Theme settings are publicly readable"
  ON public.theme_settings FOR SELECT USING (true);

CREATE POLICY "Staff can insert theme settings"
  ON public.theme_settings FOR INSERT TO authenticated
  WITH CHECK (public.is_staff(auth.uid()));

CREATE POLICY "Staff can update theme settings"
  ON public.theme_settings FOR UPDATE TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

CREATE TRIGGER theme_settings_updated_at BEFORE UPDATE ON public.theme_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.theme_settings (id) VALUES (true) ON CONFLICT (id) DO NOTHING;