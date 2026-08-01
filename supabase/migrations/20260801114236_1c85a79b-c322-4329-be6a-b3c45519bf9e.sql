ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS recaptcha_site_key text NOT NULL DEFAULT '';