-- AI Chat settings (singleton)
CREATE TABLE public.ai_chat_settings (
  id boolean PRIMARY KEY DEFAULT true CHECK (id),
  is_enabled boolean NOT NULL DEFAULT true,
  floating_enabled boolean NOT NULL DEFAULT true,
  ai_name text NOT NULL DEFAULT 'Mazhalai Assistant',
  ai_avatar_url text,
  welcome_title text NOT NULL DEFAULT 'Welcome to Mazhalai Ulagam! 👶💛',
  welcome_message text NOT NULL DEFAULT 'How can I help you today? Ask about products, orders, delivery, returns or offers — in English or Tamil.',
  system_prompt text NOT NULL DEFAULT '',
  suggested_questions text[] NOT NULL DEFAULT ARRAY['Shop Products','Baby Toys','Books','Clothing','Track Order','Returns','Offers','Talk to Support'],
  accent_color text NOT NULL DEFAULT '',
  floating_position text NOT NULL DEFAULT 'bottom-right',
  business_hours_enabled boolean NOT NULL DEFAULT false,
  business_hours_note text NOT NULL DEFAULT 'We reply 9 AM - 8 PM IST.',
  auto_reply_enabled boolean NOT NULL DEFAULT true,
  email_notifications boolean NOT NULL DEFAULT false,
  whatsapp_notifications boolean NOT NULL DEFAULT false,
  live_chat_enabled boolean NOT NULL DEFAULT false,
  rate_limit_per_hour integer NOT NULL DEFAULT 60,
  knowledge_notes text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.ai_chat_settings TO authenticated;
GRANT ALL ON public.ai_chat_settings TO service_role;
ALTER TABLE public.ai_chat_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage ai chat settings" ON public.ai_chat_settings
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

CREATE TRIGGER ai_chat_settings_updated_at BEFORE UPDATE ON public.ai_chat_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.ai_chat_settings (id) VALUES (true);

-- Public-safe view (no system prompt / knowledge notes)
CREATE VIEW public.ai_chat_public
WITH (security_invoker = off) AS
SELECT is_enabled, floating_enabled, ai_name, ai_avatar_url, welcome_title, welcome_message,
       suggested_questions, accent_color, floating_position, business_hours_enabled,
       business_hours_note, live_chat_enabled
FROM public.ai_chat_settings;

GRANT SELECT ON public.ai_chat_public TO anon, authenticated;

-- Message feedback + handoff flag
ALTER TABLE public.support_messages
  ADD COLUMN IF NOT EXISTS feedback smallint NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS needs_human boolean NOT NULL DEFAULT false;

-- Blocked (spam) chat users
CREATE TABLE public.ai_chat_blocks (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  reason text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, DELETE ON public.ai_chat_blocks TO authenticated;
GRANT ALL ON public.ai_chat_blocks TO service_role;
ALTER TABLE public.ai_chat_blocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage chat blocks" ON public.ai_chat_blocks
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- Staff can read all support messages for chat history / assignment
CREATE POLICY "Staff read support messages" ON public.support_messages
  FOR SELECT TO authenticated
  USING (public.is_staff(auth.uid()));

-- Nav item for AI Chat, placed just after Blog
INSERT INTO public.nav_items (label, icon, link_type, link_value, position, is_visible)
SELECT 'AI Chat', 'Sparkles', 'page', '/ai-chat',
       COALESCE((SELECT position FROM public.nav_items WHERE lower(label) = 'blog' AND parent_id IS NULL LIMIT 1), 0) + 1,
       true
WHERE NOT EXISTS (SELECT 1 FROM public.nav_items WHERE link_value = '/ai-chat');

UPDATE public.nav_items SET position = position + 1
WHERE parent_id IS NULL
  AND link_value <> '/ai-chat'
  AND position >= COALESCE((SELECT position FROM public.nav_items WHERE link_value = '/ai-chat' LIMIT 1), 999999);