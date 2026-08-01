-- Role helpers -------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_staff(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role IN ('super_admin','admin','manager','staff')
  );
$$;

CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role IN ('super_admin','admin')
  );
$$;

REVOKE EXECUTE ON FUNCTION public.is_admin(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO authenticated;

-- Role permission matrix ----------------------------------------------------
CREATE TABLE public.role_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role public.app_role NOT NULL,
  module text NOT NULL,
  can_create boolean NOT NULL DEFAULT false,
  can_read boolean NOT NULL DEFAULT false,
  can_update boolean NOT NULL DEFAULT false,
  can_delete boolean NOT NULL DEFAULT false,
  can_export boolean NOT NULL DEFAULT false,
  can_settings boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (role, module)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.role_permissions TO authenticated;
GRANT ALL ON public.role_permissions TO service_role;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff can read role permissions" ON public.role_permissions
  FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "Admins manage role permissions" ON public.role_permissions
  FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE TRIGGER role_permissions_updated_at BEFORE UPDATE ON public.role_permissions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Per-user overrides --------------------------------------------------------
CREATE TABLE public.user_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  module text NOT NULL,
  can_create boolean NOT NULL DEFAULT false,
  can_read boolean NOT NULL DEFAULT false,
  can_update boolean NOT NULL DEFAULT false,
  can_delete boolean NOT NULL DEFAULT false,
  can_export boolean NOT NULL DEFAULT false,
  can_settings boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, module)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_permissions TO authenticated;
GRANT ALL ON public.user_permissions TO service_role;
ALTER TABLE public.user_permissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read their own permissions" ON public.user_permissions
  FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.is_staff(auth.uid()));
CREATE POLICY "Admins manage user permissions" ON public.user_permissions
  FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE TRIGGER user_permissions_updated_at BEFORE UPDATE ON public.user_permissions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Effective permission check ------------------------------------------------
CREATE OR REPLACE FUNCTION public.has_permission(_user_id uuid, _module text, _action text)
RETURNS boolean LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  result boolean := false;
BEGIN
  IF _user_id IS NULL THEN RETURN false; END IF;
  IF EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'super_admin') THEN
    RETURN true;
  END IF;

  SELECT CASE _action
    WHEN 'create' THEN bool_or(can_create)
    WHEN 'read' THEN bool_or(can_read)
    WHEN 'update' THEN bool_or(can_update)
    WHEN 'delete' THEN bool_or(can_delete)
    WHEN 'export' THEN bool_or(can_export)
    WHEN 'settings' THEN bool_or(can_settings)
    ELSE false END
  INTO result
  FROM public.user_permissions
  WHERE user_id = _user_id AND module = _module;

  IF result IS NOT NULL THEN RETURN result; END IF;

  SELECT CASE _action
    WHEN 'create' THEN bool_or(rp.can_create)
    WHEN 'read' THEN bool_or(rp.can_read)
    WHEN 'update' THEN bool_or(rp.can_update)
    WHEN 'delete' THEN bool_or(rp.can_delete)
    WHEN 'export' THEN bool_or(rp.can_export)
    WHEN 'settings' THEN bool_or(rp.can_settings)
    ELSE false END
  INTO result
  FROM public.role_permissions rp
  JOIN public.user_roles ur ON ur.role = rp.role
  WHERE ur.user_id = _user_id AND rp.module = _module;

  RETURN coalesce(result, false);
END; $$;
REVOKE EXECUTE ON FUNCTION public.has_permission(uuid, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_permission(uuid, text, text) TO authenticated;

-- Admin activity log --------------------------------------------------------
CREATE TABLE public.admin_activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_email text NOT NULL DEFAULT '',
  action text NOT NULL,
  module text NOT NULL DEFAULT '',
  entity_id text,
  summary text NOT NULL DEFAULT '',
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  ip_address text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX admin_activity_log_created_idx ON public.admin_activity_log (created_at DESC);
GRANT SELECT ON public.admin_activity_log TO authenticated;
GRANT ALL ON public.admin_activity_log TO service_role;
ALTER TABLE public.admin_activity_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff read activity log" ON public.admin_activity_log
  FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));

-- Login history -------------------------------------------------------------
CREATE TABLE public.login_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  email text NOT NULL DEFAULT '',
  success boolean NOT NULL DEFAULT false,
  method text NOT NULL DEFAULT 'password',
  reason text,
  ip_address text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX login_history_created_idx ON public.login_history (created_at DESC);
CREATE INDEX login_history_email_idx ON public.login_history (lower(email), created_at DESC);
GRANT SELECT ON public.login_history TO authenticated;
GRANT ALL ON public.login_history TO service_role;
ALTER TABLE public.login_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff read login history" ON public.login_history
  FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "Users read their own login history" ON public.login_history
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Account lockouts (server-only) --------------------------------------------
CREATE TABLE public.account_lockouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier text NOT NULL UNIQUE,
  failed_count integer NOT NULL DEFAULT 0,
  locked_until timestamptz,
  last_failure_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.account_lockouts TO service_role;
ALTER TABLE public.account_lockouts ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER account_lockouts_updated_at BEFORE UPDATE ON public.account_lockouts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Rate limit counters (server-only) -----------------------------------------
CREATE TABLE public.rate_limit_counters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bucket text NOT NULL,
  identifier text NOT NULL,
  window_start timestamptz NOT NULL,
  hits integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (bucket, identifier, window_start)
);
GRANT ALL ON public.rate_limit_counters TO service_role;
ALTER TABLE public.rate_limit_counters ENABLE ROW LEVEL SECURITY;

-- Error logs ----------------------------------------------------------------
CREATE TABLE public.error_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  level text NOT NULL DEFAULT 'error',
  source text NOT NULL DEFAULT 'app',
  message text NOT NULL,
  stack text,
  path text,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX error_logs_created_idx ON public.error_logs (created_at DESC);
GRANT SELECT ON public.error_logs TO authenticated;
GRANT ALL ON public.error_logs TO service_role;
ALTER TABLE public.error_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff read error logs" ON public.error_logs
  FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));

-- Two-factor authentication (server-only) ------------------------------------
CREATE TABLE public.user_2fa (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  secret text NOT NULL,
  enabled boolean NOT NULL DEFAULT false,
  recovery_codes text[] NOT NULL DEFAULT '{}',
  confirmed_at timestamptz,
  last_verified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.user_2fa TO service_role;
ALTER TABLE public.user_2fa ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER user_2fa_updated_at BEFORE UPDATE ON public.user_2fa
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Security settings singleton -----------------------------------------------
CREATE TABLE public.security_settings (
  id boolean PRIMARY KEY DEFAULT true CHECK (id),
  session_timeout_minutes integer NOT NULL DEFAULT 30,
  session_warning_seconds integer NOT NULL DEFAULT 60,
  max_failed_attempts integer NOT NULL DEFAULT 5,
  lockout_minutes integer NOT NULL DEFAULT 15,
  captcha_enabled boolean NOT NULL DEFAULT true,
  require_2fa_for_admins boolean NOT NULL DEFAULT false,
  ip_restriction_enabled boolean NOT NULL DEFAULT false,
  admin_ip_allowlist text[] NOT NULL DEFAULT '{}',
  failed_login_alerts boolean NOT NULL DEFAULT true,
  alert_email text NOT NULL DEFAULT '',
  low_stock_alerts boolean NOT NULL DEFAULT true,
  cookie_banner_enabled boolean NOT NULL DEFAULT true,
  cookie_banner_text text NOT NULL DEFAULT 'We use cookies to keep your cart working, remember your preferences and understand how our store is used.',
  retention_login_history_days integer NOT NULL DEFAULT 180,
  retention_activity_log_days integer NOT NULL DEFAULT 365,
  retention_error_log_days integer NOT NULL DEFAULT 90,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.security_settings TO authenticated;
GRANT ALL ON public.security_settings TO service_role;
ALTER TABLE public.security_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff read security settings" ON public.security_settings
  FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE TRIGGER security_settings_updated_at BEFORE UPDATE ON public.security_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.security_settings (id) VALUES (true) ON CONFLICT (id) DO NOTHING;

-- Public cookie banner config (anon readable, no sensitive columns) ----------
CREATE VIEW public.cookie_banner_config
WITH (security_invoker = false) AS
  SELECT cookie_banner_enabled, cookie_banner_text FROM public.security_settings WHERE id;
GRANT SELECT ON public.cookie_banner_config TO anon, authenticated;

-- Default permissions per role ----------------------------------------------
INSERT INTO public.role_permissions (role, module, can_create, can_read, can_update, can_delete, can_export, can_settings)
VALUES
  ('super_admin','products',true,true,true,true,true,true),
  ('super_admin','orders',true,true,true,true,true,true),
  ('super_admin','customers',true,true,true,true,true,true),
  ('super_admin','content',true,true,true,true,true,true),
  ('super_admin','payments',true,true,true,true,true,true),
  ('super_admin','reports',true,true,true,true,true,true),
  ('super_admin','settings',true,true,true,true,true,true),
  ('super_admin','security',true,true,true,true,true,true),
  ('admin','products',true,true,true,true,true,true),
  ('admin','orders',true,true,true,true,true,true),
  ('admin','customers',true,true,true,true,true,false),
  ('admin','content',true,true,true,true,true,true),
  ('admin','payments',false,true,true,false,true,true),
  ('admin','reports',false,true,false,false,true,false),
  ('admin','settings',false,true,true,false,false,true),
  ('admin','security',false,true,true,false,true,false),
  ('manager','products',true,true,true,false,true,false),
  ('manager','orders',false,true,true,false,true,false),
  ('manager','customers',false,true,false,false,false,false),
  ('manager','content',false,true,true,false,false,false),
  ('manager','payments',false,true,false,false,false,false),
  ('manager','reports',false,true,false,false,true,false),
  ('manager','settings',false,false,false,false,false,false),
  ('manager','security',false,false,false,false,false,false),
  ('staff','products',false,true,true,false,false,false),
  ('staff','orders',false,true,true,false,false,false),
  ('staff','customers',false,false,false,false,false,false),
  ('staff','content',false,false,false,false,false,false),
  ('staff','payments',false,false,false,false,false,false),
  ('staff','reports',false,false,false,false,false,false),
  ('staff','settings',false,false,false,false,false,false),
  ('staff','security',false,false,false,false,false,false)
ON CONFLICT (role, module) DO NOTHING;