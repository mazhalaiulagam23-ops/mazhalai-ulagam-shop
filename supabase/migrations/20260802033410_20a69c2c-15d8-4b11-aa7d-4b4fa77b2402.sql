DROP VIEW IF EXISTS public.ai_chat_public;

CREATE TABLE public.ai_chat_display (
  id boolean PRIMARY KEY DEFAULT true CHECK (id),
  is_enabled boolean NOT NULL DEFAULT true,
  floating_enabled boolean NOT NULL DEFAULT true,
  ai_name text NOT NULL DEFAULT 'Mazhalai Assistant',
  ai_avatar_url text,
  welcome_title text NOT NULL DEFAULT 'Welcome to Mazhalai Ulagam! 👶💛',
  welcome_message text NOT NULL DEFAULT 'How can I help you today? Ask about products, orders, delivery, returns or offers — in English or Tamil.',
  suggested_questions text[] NOT NULL DEFAULT ARRAY['Shop Products','Baby Toys','Books','Clothing','Track Order','Returns','Offers','Talk to Support'],
  accent_color text NOT NULL DEFAULT '',
  floating_position text NOT NULL DEFAULT 'bottom-right',
  business_hours_enabled boolean NOT NULL DEFAULT false,
  business_hours_note text NOT NULL DEFAULT 'We reply 9 AM - 8 PM IST.',
  live_chat_enabled boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.ai_chat_display TO anon;
GRANT SELECT, INSERT, UPDATE ON public.ai_chat_display TO authenticated;
GRANT ALL ON public.ai_chat_display TO service_role;
ALTER TABLE public.ai_chat_display ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read chat appearance" ON public.ai_chat_display
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins update chat appearance" ON public.ai_chat_display
  FOR UPDATE TO authenticated
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "Admins insert chat appearance" ON public.ai_chat_display
  FOR INSERT TO authenticated WITH CHECK (public.is_admin(auth.uid()));

CREATE TRIGGER ai_chat_display_updated_at BEFORE UPDATE ON public.ai_chat_display
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.ai_chat_display (id) VALUES (true);

ALTER TABLE public.ai_chat_settings
  DROP COLUMN IF EXISTS is_enabled,
  DROP COLUMN IF EXISTS floating_enabled,
  DROP COLUMN IF EXISTS ai_name,
  DROP COLUMN IF EXISTS ai_avatar_url,
  DROP COLUMN IF EXISTS welcome_title,
  DROP COLUMN IF EXISTS welcome_message,
  DROP COLUMN IF EXISTS suggested_questions,
  DROP COLUMN IF EXISTS accent_color,
  DROP COLUMN IF EXISTS floating_position,
  DROP COLUMN IF EXISTS business_hours_enabled,
  DROP COLUMN IF EXISTS business_hours_note,
  DROP COLUMN IF EXISTS live_chat_enabled;