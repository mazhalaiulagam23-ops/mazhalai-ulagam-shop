import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

/* ------------------------------------------------------------- password */

export type PasswordCheck = {
  score: number; // 0-5
  label: string;
  problems: string[];
  valid: boolean;
};

/** Strong password policy: 10+ chars, upper, lower, number and symbol. */
export function checkPassword(password: string): PasswordCheck {
  const problems: string[] = [];
  if (password.length < 10) problems.push("Use at least 10 characters");
  if (!/[a-z]/.test(password)) problems.push("Add a lowercase letter");
  if (!/[A-Z]/.test(password)) problems.push("Add an uppercase letter");
  if (!/\d/.test(password)) problems.push("Add a number");
  if (!/[^A-Za-z0-9]/.test(password)) problems.push("Add a symbol");
  if (/(.)\1{3,}/.test(password)) problems.push("Avoid repeating characters");

  const score = Math.max(0, 5 - problems.length);
  const labels = ["Very weak", "Weak", "Fair", "Good", "Strong", "Excellent"];
  return { score, label: labels[score] ?? "Weak", problems, valid: problems.length === 0 && password.length <= 72 };
}

/* ----------------------------------------------------------- reCAPTCHA v3 */

declare global {
  interface Window {
    grecaptcha?: {
      ready: (cb: () => void) => void;
      execute: (siteKey: string, options: { action: string }) => Promise<string>;
    };
  }
}

let recaptchaPromise: Promise<void> | null = null;

function loadRecaptcha(siteKey: string) {
  if (typeof window === "undefined" || !siteKey) return Promise.resolve();
  if (!recaptchaPromise) {
    recaptchaPromise = new Promise<void>((resolve, reject) => {
      const script = document.createElement("script");
      script.src = `https://www.google.com/recaptcha/api.js?render=${siteKey}`;
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("reCAPTCHA failed to load"));
      document.head.appendChild(script);
    });
  }
  return recaptchaPromise;
}

/** Returns a function that produces a fresh reCAPTCHA v3 token for an action. */
export function useRecaptcha(siteKey: string | undefined) {
  useEffect(() => {
    if (siteKey) void loadRecaptcha(siteKey).catch(() => undefined);
  }, [siteKey]);

  return useCallback(
    async (action: string): Promise<string | undefined> => {
      if (!siteKey || typeof window === "undefined") return undefined;
      try {
        await loadRecaptcha(siteKey);
        const grecaptcha = window.grecaptcha;
        if (!grecaptcha) return undefined;
        return await new Promise<string>((resolve) => {
          grecaptcha.ready(() => {
            void grecaptcha.execute(siteKey, { action }).then(resolve).catch(() => resolve(""));
          });
        });
      } catch {
        return undefined;
      }
    },
    [siteKey],
  );
}

/* ------------------------------------------------------------ cookie consent */

export const COOKIE_CONSENT_KEY = "mu-cookie-consent";

export function readConsent(): "accepted" | "essential" | null {
  if (typeof window === "undefined") return null;
  const value = window.localStorage.getItem(COOKIE_CONSENT_KEY);
  return value === "accepted" || value === "essential" ? value : null;
}

export function useCookieSettings() {
  const [settings, setSettings] = useState<{ enabled: boolean; message: string; policy_href: string } | null>(null);
  useEffect(() => {
    let active = true;
    void supabase
      .from("cookie_settings")
      .select("enabled, message, policy_href")
      .maybeSingle()
      .then(({ data }) => {
        if (active && data) setSettings(data);
      });
    return () => {
      active = false;
    };
  }, []);
  return settings;
}

/* -------------------------------------------------------- session timeout */

type IdleOptions = { timeoutMinutes: number; warningSeconds: number; onTimeout: () => void; enabled: boolean };

/** Signs the user out after a period of inactivity, warning them first. */
export function useIdleTimeout({ timeoutMinutes, warningSeconds, onTimeout, enabled }: IdleOptions) {
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const lastActivity = useRef(Date.now());

  useEffect(() => {
    if (!enabled || typeof window === "undefined") {
      setSecondsLeft(null);
      return;
    }
    const events = ["mousedown", "keydown", "touchstart", "scroll", "visibilitychange"] as const;
    const bump = () => {
      lastActivity.current = Date.now();
      setSecondsLeft(null);
    };
    events.forEach((e) => window.addEventListener(e, bump, { passive: true }));

    const timeoutMs = timeoutMinutes * 60_000;
    const interval = window.setInterval(() => {
      const idle = Date.now() - lastActivity.current;
      const remaining = Math.ceil((timeoutMs - idle) / 1000);
      if (remaining <= 0) {
        setSecondsLeft(null);
        onTimeout();
      } else if (remaining <= warningSeconds) {
        setSecondsLeft(remaining);
      }
    }, 1000);

    return () => {
      events.forEach((e) => window.removeEventListener(e, bump));
      window.clearInterval(interval);
    };
  }, [enabled, timeoutMinutes, warningSeconds, onTimeout]);

  const stayActive = useCallback(() => {
    lastActivity.current = Date.now();
    setSecondsLeft(null);
  }, []);

  return { secondsLeft, stayActive };
}

/* ------------------------------------------------------------- permissions */

export const ADMIN_MODULES = [
  { key: "products", label: "Products" },
  { key: "orders", label: "Orders" },
  { key: "customers", label: "Customers & team" },
  { key: "content", label: "Content & CMS" },
  { key: "payments", label: "Payments" },
  { key: "reports", label: "Reports" },
  { key: "settings", label: "Site settings" },
  { key: "security", label: "Security" },
] as const;

export const PERMISSION_ACTIONS = ["create", "read", "update", "delete", "export", "settings"] as const;
export type PermissionAction = (typeof PERMISSION_ACTIONS)[number];

export const MANAGED_ROLES = ["super_admin", "admin", "manager", "staff"] as const;
export type ManagedRole = (typeof MANAGED_ROLES)[number];

export const ROLE_LABELS: Record<string, string> = {
  super_admin: "Super Admin",
  admin: "Admin",
  manager: "Manager",
  staff: "Staff",
  customer: "Customer",
};

export type PermissionRow = {
  module: string;
  can_create: boolean;
  can_read: boolean;
  can_update: boolean;
  can_delete: boolean;
  can_export: boolean;
  can_settings: boolean;
};

/** Effective permissions for the signed-in user (role defaults + overrides). */
export function usePermissions(userId: string | undefined, roles: string[]) {
  const [rows, setRows] = useState<PermissionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const isSuper = roles.includes("super_admin");

  useEffect(() => {
    let active = true;
    if (!userId) {
      setRows([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    void (async () => {
      const [rolePerms, userPerms] = await Promise.all([
        supabase.from("role_permissions").select("*").in("role", (roles.length ? roles : ["customer"]) as ManagedRole[]),
        supabase.from("user_permissions").select("*").eq("user_id", userId),
      ]);
      if (!active) return;
      const merged = new Map<string, PermissionRow>();
      for (const row of rolePerms.data ?? []) {
        const current = merged.get(row.module);
        merged.set(row.module, {
          module: row.module,
          can_create: (current?.can_create ?? false) || row.can_create,
          can_read: (current?.can_read ?? false) || row.can_read,
          can_update: (current?.can_update ?? false) || row.can_update,
          can_delete: (current?.can_delete ?? false) || row.can_delete,
          can_export: (current?.can_export ?? false) || row.can_export,
          can_settings: (current?.can_settings ?? false) || row.can_settings,
        });
      }
      for (const row of userPerms.data ?? []) merged.set(row.module, row as PermissionRow);
      setRows([...merged.values()]);
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [userId, roles.join(",")]); // eslint-disable-line react-hooks/exhaustive-deps

  const can = useMemo(() => {
    return (module: string, action: PermissionAction) => {
      if (isSuper) return true;
      const row = rows.find((r) => r.module === module);
      if (!row) return false;
      return Boolean(row[`can_${action}` as keyof PermissionRow]);
    };
  }, [rows, isSuper]);

  return { can, rows, loading, isSuper };
}
