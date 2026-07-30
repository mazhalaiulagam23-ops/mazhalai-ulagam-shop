-- SITE SETTINGS (singleton)
CREATE TABLE public.site_settings (
  id boolean PRIMARY KEY DEFAULT true,
  site_name text NOT NULL DEFAULT 'Mazhalai Ulagam',
  tagline text NOT NULL DEFAULT '',
  logo_url text,
  favicon_url text,
  phone text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  address text NOT NULL DEFAULT '',
  whatsapp text NOT NULL DEFAULT '',
  instagram text NOT NULL DEFAULT '',
  facebook text NOT NULL DEFAULT '',
  youtube text NOT NULL DEFAULT '',
  footer_note text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT site_settings_singleton CHECK (id)
);
GRANT SELECT ON public.site_settings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.site_settings TO authenticated;
GRANT ALL ON public.site_settings TO service_role;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Site settings are public" ON public.site_settings FOR SELECT USING (true);
CREATE POLICY "Staff manage site settings" ON public.site_settings FOR ALL TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE TRIGGER update_site_settings_updated_at BEFORE UPDATE ON public.site_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- HOME SECTIONS
CREATE TABLE public.home_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  section_key text NOT NULL,
  title text NOT NULL DEFAULT '',
  subtitle text NOT NULL DEFAULT '',
  position integer NOT NULL DEFAULT 0,
  is_visible boolean NOT NULL DEFAULT true,
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.home_sections TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.home_sections TO authenticated;
GRANT ALL ON public.home_sections TO service_role;
ALTER TABLE public.home_sections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Home sections are public" ON public.home_sections FOR SELECT USING (true);
CREATE POLICY "Staff manage home sections" ON public.home_sections FOR ALL TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE TRIGGER update_home_sections_updated_at BEFORE UPDATE ON public.home_sections
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- BANNERS
CREATE TABLE public.banners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  placement text NOT NULL DEFAULT 'hero',
  eyebrow text NOT NULL DEFAULT '',
  title text NOT NULL DEFAULT '',
  subtitle text NOT NULL DEFAULT '',
  image_url text,
  cta_label text NOT NULL DEFAULT '',
  cta_href text NOT NULL DEFAULT '/shop',
  position integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.banners TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.banners TO authenticated;
GRANT ALL ON public.banners TO service_role;
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Active banners are public" ON public.banners FOR SELECT USING (is_active);
CREATE POLICY "Staff manage banners" ON public.banners FOR ALL TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE TRIGGER update_banners_updated_at BEFORE UPDATE ON public.banners
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- TESTIMONIALS
CREATE TABLE public.testimonials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  city text NOT NULL DEFAULT '',
  rating integer NOT NULL DEFAULT 5,
  quote text NOT NULL DEFAULT '',
  position integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.testimonials TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.testimonials TO authenticated;
GRANT ALL ON public.testimonials TO service_role;
ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Active testimonials are public" ON public.testimonials FOR SELECT USING (is_active);
CREATE POLICY "Staff manage testimonials" ON public.testimonials FOR ALL TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE TRIGGER update_testimonials_updated_at BEFORE UPDATE ON public.testimonials
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- FAQS
CREATE TABLE public.faqs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question text NOT NULL,
  answer text NOT NULL DEFAULT '',
  position integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.faqs TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.faqs TO authenticated;
GRANT ALL ON public.faqs TO service_role;
ALTER TABLE public.faqs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Active faqs are public" ON public.faqs FOR SELECT USING (is_active);
CREATE POLICY "Staff manage faqs" ON public.faqs FOR ALL TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE TRIGGER update_faqs_updated_at BEFORE UPDATE ON public.faqs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- SITE PAGES (about, contact, etc.)
CREATE TABLE public.site_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL DEFAULT '',
  subtitle text NOT NULL DEFAULT '',
  body_html text NOT NULL DEFAULT '',
  seo_title text NOT NULL DEFAULT '',
  seo_description text NOT NULL DEFAULT '',
  is_published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.site_pages TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.site_pages TO authenticated;
GRANT ALL ON public.site_pages TO service_role;
ALTER TABLE public.site_pages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Published pages are public" ON public.site_pages FOR SELECT USING (is_published);
CREATE POLICY "Staff manage pages" ON public.site_pages FOR ALL TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE TRIGGER update_site_pages_updated_at BEFORE UPDATE ON public.site_pages
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- FOOTER LINKS
CREATE TABLE public.footer_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_name text NOT NULL DEFAULT 'Quick Links',
  label text NOT NULL,
  href text NOT NULL DEFAULT '/',
  position integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.footer_links TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.footer_links TO authenticated;
GRANT ALL ON public.footer_links TO service_role;
ALTER TABLE public.footer_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Active footer links are public" ON public.footer_links FOR SELECT USING (is_active);
CREATE POLICY "Staff manage footer links" ON public.footer_links FOR ALL TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE TRIGGER update_footer_links_updated_at BEFORE UPDATE ON public.footer_links
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- SEED
INSERT INTO public.site_settings (id, site_name, tagline, phone, email, address, whatsapp, instagram, footer_note)
VALUES (true, 'Mazhalai Ulagam', 'Baby Products, Return Gifts & More', '+91 90000 00000', 'mazhalaiulagam23@gmail.com', 'Coimbatore, Tamil Nadu', 'https://wa.me/919000000000', 'https://instagram.com/', 'Cute, safe and premium products for your little ones.');

INSERT INTO public.home_sections (section_key, title, subtitle, position, is_visible) VALUES
  ('hero', 'Hero Carousel', '', 1, true),
  ('categories', 'Shop by Category', '', 2, true),
  ('trust', 'Why Shop With Us', '', 3, true),
  ('bestsellers', 'Our Bestsellers', '', 4, true),
  ('new_arrivals', 'New Arrivals', '', 5, true),
  ('offers', 'Special Offers', '', 6, true),
  ('promos', 'Promo Banners', '', 7, true),
  ('testimonials', 'Loved by Coimbatore Parents', '', 8, true),
  ('instagram', 'Follow Us on Instagram', '', 9, true),
  ('blog', 'Parenting Tips & Guides', '', 10, true);

INSERT INTO public.banners (placement, eyebrow, title, subtitle, cta_label, cta_href, position) VALUES
  ('hero', 'Best Quality', 'Baby Products, Return Gifts & More', 'Cute, safe and premium products for your little ones.', 'Shop Now', '/shop', 1),
  ('hero', 'Learning Through Play', 'Educational Toys That Grow With Them', 'Montessori-inspired wooden toys tested for toddler safety.', 'Explore Toys', '/category/educational-toys', 2),
  ('hero', 'Wholesale Available', 'Return Gifts For Every Celebration', 'Birthday, naming ceremony and festival gifting from Rs.99.', 'Shop Return Gifts', '/category/return-gifts', 3);

INSERT INTO public.testimonials (name, city, rating, quote, position) VALUES
  ('Divya R', 'Coimbatore', 5, 'Return gifts for my daughter''s birthday were a big hit. Great quality at wholesale rates!', 1),
  ('Karthik S', 'Tiruppur', 5, 'Ordered baby care essentials and they arrived in two days. Very happy with the packaging.', 2),
  ('Meena P', 'Erode', 4, 'The wooden toys are sturdy and safe. My toddler loves them.', 3);

INSERT INTO public.faqs (question, answer, position) VALUES
  ('How long does delivery take?', 'Orders within Coimbatore arrive in 1-2 days; pan-India delivery takes 3-6 working days.', 1),
  ('Do you offer wholesale pricing on return gifts?', 'Yes, bulk pricing starts at 25 pieces. Contact us on WhatsApp for a quote.', 2),
  ('Are your products safe for babies?', 'All products are non-toxic, BIS-compliant and tested for the listed age group.', 3),
  ('What is your return policy?', 'Unused items in original packaging can be returned within 7 days of delivery.', 4),
  ('Which payment methods do you accept?', 'UPI, cards, net banking and cash on delivery for select pincodes.', 5);

INSERT INTO public.site_pages (slug, title, subtitle, body_html, seo_title, seo_description) VALUES
  ('about', 'About Mazhalai Ulagam', 'A little world of joy for your little ones', '<p>Mazhalai Ulagam started in Coimbatore with a simple idea: safe, joyful and affordable products for children. Today we serve families across India with baby essentials, educational toys, return gifts and kids fashion.</p><p>Every product is hand-picked, quality-checked and priced fairly, with wholesale rates for bulk gifting.</p>', 'About Us | Mazhalai Ulagam', 'Learn about Mazhalai Ulagam, a Coimbatore-based store for baby products, toys and return gifts.'),
  ('contact', 'Contact Us', 'We would love to hear from you', '<p>Reach us on WhatsApp or phone between 9 AM and 8 PM, all days. For wholesale and bulk return gift orders, share your quantity and budget and we will send a quote.</p>', 'Contact Us | Mazhalai Ulagam', 'Contact Mazhalai Ulagam in Coimbatore for orders, wholesale return gifts and support.');

INSERT INTO public.footer_links (group_name, label, href, position) VALUES
  ('Quick Links', 'Shop', '/shop', 1),
  ('Quick Links', 'Offers', '/offers', 2),
  ('Quick Links', 'Blog', '/blog', 3),
  ('Quick Links', 'About Us', '/about', 4),
  ('Quick Links', 'Contact', '/contact', 5),
  ('Policies', 'Shipping Policy', '/shipping-policy', 1),
  ('Policies', 'Returns & Refunds', '/returns-refunds', 2),
  ('Policies', 'Privacy Policy', '/privacy-policy', 3),
  ('Policies', 'Terms & Conditions', '/terms', 4),
  ('Policies', 'FAQ', '/faq', 5);