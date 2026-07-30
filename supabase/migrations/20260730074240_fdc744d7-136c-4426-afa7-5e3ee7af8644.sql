CREATE TABLE public.nav_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id uuid REFERENCES public.nav_items(id) ON DELETE CASCADE,
  label text NOT NULL DEFAULT '',
  icon text NOT NULL DEFAULT '',
  link_type text NOT NULL DEFAULT 'custom',
  link_value text NOT NULL DEFAULT '/',
  open_new_tab boolean NOT NULL DEFAULT false,
  position integer NOT NULL DEFAULT 0,
  is_visible boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.nav_items TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.nav_items TO authenticated;
GRANT ALL ON public.nav_items TO service_role;
ALTER TABLE public.nav_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Visible nav items are public" ON public.nav_items FOR SELECT USING (is_visible);
CREATE POLICY "Staff manage nav items" ON public.nav_items FOR ALL TO authenticated USING (is_staff(auth.uid())) WITH CHECK (is_staff(auth.uid()));
CREATE TRIGGER update_nav_items_updated_at BEFORE UPDATE ON public.nav_items FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.social_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  platform text NOT NULL UNIQUE,
  label text NOT NULL DEFAULT '',
  url text NOT NULL DEFAULT '',
  qr_image_url text,
  is_visible boolean NOT NULL DEFAULT true,
  show_qr boolean NOT NULL DEFAULT false,
  placements text[] NOT NULL DEFAULT '{}'::text[],
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.social_links TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.social_links TO authenticated;
GRANT ALL ON public.social_links TO service_role;
ALTER TABLE public.social_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Social links are public" ON public.social_links FOR SELECT USING (true);
CREATE POLICY "Staff manage social links" ON public.social_links FOR ALL TO authenticated USING (is_staff(auth.uid())) WITH CHECK (is_staff(auth.uid()));
CREATE TRIGGER update_social_links_updated_at BEFORE UPDATE ON public.social_links FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS company_name text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS google_maps_url text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS business_hours text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS whatsapp_number text NOT NULL DEFAULT '';

INSERT INTO public.nav_items (label, icon, link_type, link_value, position) VALUES
  ('Home', 'Home', 'home', '/', 0),
  ('Shop', 'Store', 'custom', '/shop', 1),
  ('Offers', 'Tag', 'custom', '/offers', 2),
  ('Blog', 'BookOpen', 'custom', '/blog', 3),
  ('About Us', 'Info', 'page', '/about', 4),
  ('Contact Us', 'Phone', 'page', '/contact', 5);

INSERT INTO public.social_links (platform, label, url, position, placements, is_visible) VALUES
  ('instagram', 'Instagram', '', 0, '{header,footer,contact}', true),
  ('facebook', 'Facebook', '', 1, '{header,footer,contact}', true),
  ('whatsapp', 'WhatsApp', '', 2, '{header,footer,contact,floating}', true),
  ('youtube', 'YouTube', '', 3, '{footer}', true),
  ('twitter', 'X (Twitter)', '', 4, '{footer}', false),
  ('linkedin', 'LinkedIn', '', 5, '{footer}', false),
  ('telegram', 'Telegram', '', 6, '{footer}', false),
  ('pinterest', 'Pinterest', '', 7, '{footer}', false),
  ('google_review', 'Google Review', '', 8, '{contact}', false),
  ('upi', 'UPI Payment', '', 9, '{contact}', false);