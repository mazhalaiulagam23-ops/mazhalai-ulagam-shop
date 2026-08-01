import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/* ------------------------------------------------------------ shared utils */

async function assertAdmin(supabase: { rpc: (fn: "is_admin", args: { _user_id: string }) => PromiseLike<{ data: unknown }> }, userId: string) {
  const { data } = await supabase.rpc("is_admin", { _user_id: userId });
  if (data !== true) throw new Error("Forbidden: admin access required.");
}

async function assertStaff(supabase: { rpc: (fn: "is_staff", args: { _user_id: string }) => PromiseLike<{ data: unknown }> }, userId: string) {
  const { data } = await supabase.rpc("is_staff", { _user_id: userId });
  if (data !== true) throw new Error("Forbidden: staff access required.");
}

/* -------------------------------------------------- brute force + captcha */

const attemptSchema = z.object({
  email: z.string().trim().email().max(160),
  captchaToken: z.string().max(4000).optional(),
});

/** Called before a sign-in attempt: enforces CAPTCHA, IP rate limit and account lockout. */
export const preLoginCheck = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => attemptSchema.parse(data))
  .handler(async ({ data }) => {
    const { rateLimit, requestMeta, verifyRecaptcha } = await import("@/lib/security.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { ip } = requestMeta();
    const email = data.email.toLowerCase();

    const ipLimit = await rateLimit("login", ip ?? "unknown", 20, 300);
    if (!ipLimit.allowed) return { allowed: false, reason: "Too many attempts from this network. Please wait a few minutes." };

    const captcha = await verifyRecaptcha(data.captchaToken);
    if (!captcha.ok) return { allowed: false, reason: "We couldn't verify that you're human. Please try again." };

    const { data: lock } = await supabaseAdmin
      .from("account_lockouts")
      .select("locked_until")
      .eq("identifier", email)
      .maybeSingle();

    if (lock?.locked_until && new Date(lock.locked_until) > new Date()) {
      const mins = Math.max(1, Math.ceil((new Date(lock.locked_until).getTime() - Date.now()) / 60_000));
      return { allowed: false, reason: `Too many failed sign-ins. Try again in ${mins} minute(s).` };
    }

    return { allowed: true as const, reason: null };
  });

const resultSchema = z.object({
  email: z.string().trim().email().max(160),
  success: z.boolean(),
  method: z.enum(["password", "otp", "google", "reset"]).default("password"),
  reason: z.string().trim().max(200).optional(),
});

/** Records the outcome of a sign-in attempt and maintains the lockout counter. */
export const recordLoginResult = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => resultSchema.parse(data))
  .handler(async ({ data }) => {
    const { requestMeta, rateLimit } = await import("@/lib/security.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { ip, userAgent } = requestMeta();
    const email = data.email.toLowerCase();

    const writeLimit = await rateLimit("login-log", ip ?? "unknown", 60, 300);
    if (!writeLimit.allowed) return { ok: false };

    const { data: settings } = await supabaseAdmin
      .from("security_settings")
      .select("max_failed_attempts, lockout_minutes")
      .maybeSingle();

    await supabaseAdmin.from("login_history").insert({
      email,
      success: data.success,
      method: data.method,
      reason: data.reason ?? null,
      ip_address: ip,
      user_agent: userAgent,
    });

    if (data.success) {
      await supabaseAdmin.from("account_lockouts").delete().eq("identifier", email);
      return { ok: true };
    }

    const maxAttempts = settings?.max_failed_attempts ?? 5;
    const lockoutMinutes = settings?.lockout_minutes ?? 15;

    const { data: lock } = await supabaseAdmin
      .from("account_lockouts")
      .select("id, failed_count")
      .eq("identifier", email)
      .maybeSingle();

    const failed = (lock?.failed_count ?? 0) + 1;
    const lockedUntil = failed >= maxAttempts ? new Date(Date.now() + lockoutMinutes * 60_000).toISOString() : null;

    if (lock) {
      await supabaseAdmin
        .from("account_lockouts")
        .update({ failed_count: failed, locked_until: lockedUntil, last_failure_at: new Date().toISOString() })
        .eq("id", lock.id);
    } else {
      await supabaseAdmin
        .from("account_lockouts")
        .insert({ identifier: email, failed_count: failed, locked_until: lockedUntil });
    }

    if (lockedUntil) {
      await supabaseAdmin.from("error_logs").insert({
        level: "warning",
        source: "auth",
        message: `Account locked after ${failed} failed sign-in attempts`,
        meta: { email, ip },
      });
    }

    return { ok: true, locked: Boolean(lockedUntil) };
  });

/** Rate-limited wrapper around signup CAPTCHA verification. */
export const preSignupCheck = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => attemptSchema.parse(data))
  .handler(async ({ data }) => {
    const { rateLimit, requestMeta, verifyRecaptcha } = await import("@/lib/security.server");
    const { ip } = requestMeta();
    const limit = await rateLimit("signup", ip ?? "unknown", 10, 3600);
    if (!limit.allowed) return { allowed: false, reason: "Too many sign-ups from this network. Please try later." };
    const captcha = await verifyRecaptcha(data.captchaToken);
    if (!captcha.ok) return { allowed: false, reason: "We couldn't verify that you're human. Please try again." };
    return { allowed: true as const, reason: null };
  });

/* ------------------------------------------------------------ error logging */

export const logClientError = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z
      .object({
        message: z.string().trim().min(1).max(500),
        stack: z.string().max(4000).optional(),
        path: z.string().max(300).optional(),
        level: z.enum(["error", "warning", "info"]).default("error"),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const { rateLimit, requestMeta } = await import("@/lib/security.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { ip } = requestMeta();
    const limit = await rateLimit("error-log", ip ?? "unknown", 30, 300);
    if (!limit.allowed) return { ok: false };
    await supabaseAdmin.from("error_logs").insert({
      level: data.level,
      source: "browser",
      message: data.message,
      stack: data.stack ?? null,
      path: data.path ?? null,
      meta: { ip },
    });
    return { ok: true };
  });

/* ---------------------------------------------------------- activity log */

export const logAdminActivity = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        action: z.string().trim().min(1).max(80),
        module: z.string().trim().max(40).default(""),
        entityId: z.string().trim().max(120).optional(),
        summary: z.string().trim().max(300).default(""),
        details: z.record(z.string(), z.unknown()).default({}),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId, claims } = context;
    await assertStaff(supabase, userId);
    const { requestMeta } = await import("@/lib/security.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { ip } = requestMeta();
    await supabaseAdmin.from("admin_activity_log").insert({
      actor_id: userId,
      actor_email: String(claims["email"] ?? ""),
      action: data.action,
      module: data.module,
      entity_id: data.entityId ?? null,
      summary: data.summary,
      details: data.details as never,
      ip_address: ip,
    });
    return { ok: true };
  });

/* --------------------------------------------------------- security config */

export const getSecuritySettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    await assertStaff(supabase, userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin.from("security_settings").select("*").maybeSingle();
    return data;
  });

const settingsSchema = z.object({
  session_timeout_minutes: z.number().int().min(5).max(720),
  session_warning_seconds: z.number().int().min(15).max(600),
  max_failed_attempts: z.number().int().min(3).max(20),
  lockout_minutes: z.number().int().min(1).max(1440),
  captcha_enabled: z.boolean(),
  require_2fa_for_admins: z.boolean(),
  ip_restriction_enabled: z.boolean(),
  admin_ip_allowlist: z.array(z.string().trim().max(60)).max(50),
  failed_login_alerts: z.boolean(),
  alert_email: z.string().trim().max(160),
  low_stock_alerts: z.boolean(),
  retention_login_history_days: z.number().int().min(7).max(3650),
  retention_activity_log_days: z.number().int().min(7).max(3650),
  retention_error_log_days: z.number().int().min(7).max(3650),
});

export const saveSecuritySettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => settingsSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { supabase, userId, claims } = context;
    await assertAdmin(supabase, userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("security_settings").update(data).eq("id", true);
    if (error) throw new Error(error.message);
    await supabaseAdmin.from("admin_activity_log").insert({
      actor_id: userId,
      actor_email: String(claims["email"] ?? ""),
      action: "update",
      module: "security",
      summary: "Updated security settings",
    });
    return { ok: true };
  });

/* ---------------------------------------------------------------- two-factor */

export const get2faStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin
      .from("user_2fa")
      .select("enabled, confirmed_at, last_verified_at")
      .eq("user_id", context.userId)
      .maybeSingle();
    return { enabled: data?.enabled ?? false, confirmedAt: data?.confirmed_at ?? null };
  });

export const start2faSetup = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId, claims } = context;
    const { generateTotpSecret, buildOtpAuthUrl } = await import("@/lib/security.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const secret = generateTotpSecret();
    await supabaseAdmin
      .from("user_2fa")
      .upsert({ user_id: userId, secret, enabled: false, confirmed_at: null }, { onConflict: "user_id" });
    return { secret, otpauthUrl: buildOtpAuthUrl(secret, String(claims["email"] ?? "admin")) };
  });

export const confirm2faSetup = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ code: z.string().trim().min(6).max(8) }).parse(data))
  .handler(async ({ data, context }) => {
    const { userId, claims } = context;
    const { verifyTotp, generateRecoveryCodes, sha256 } = await import("@/lib/security.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: row } = await supabaseAdmin.from("user_2fa").select("secret").eq("user_id", userId).maybeSingle();
    if (!row?.secret) throw new Error("Start two-factor setup first.");
    if (!(await verifyTotp(row.secret, data.code))) throw new Error("That code is not valid. Try the next one.");

    const codes = generateRecoveryCodes();
    const hashed = await Promise.all(codes.map((c) => sha256(c)));
    await supabaseAdmin
      .from("user_2fa")
      .update({ enabled: true, confirmed_at: new Date().toISOString(), recovery_codes: hashed })
      .eq("user_id", userId);

    await supabaseAdmin.from("admin_activity_log").insert({
      actor_id: userId,
      actor_email: String(claims["email"] ?? ""),
      action: "enable",
      module: "security",
      summary: "Enabled two-factor authentication",
    });
    return { recoveryCodes: codes };
  });

export const verify2faCode = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ code: z.string().trim().min(6).max(12) }).parse(data))
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const { verifyTotp, sha256 } = await import("@/lib/security.server");
    const { rateLimit, requestMeta } = await import("@/lib/security.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { ip } = requestMeta();

    const limit = await rateLimit("2fa", `${userId}:${ip ?? ""}`, 10, 300);
    if (!limit.allowed) throw new Error("Too many attempts. Please wait a few minutes.");

    const { data: row } = await supabaseAdmin
      .from("user_2fa")
      .select("secret, recovery_codes")
      .eq("user_id", userId)
      .maybeSingle();
    if (!row?.secret) throw new Error("Two-factor authentication is not set up.");

    if (await verifyTotp(row.secret, data.code)) {
      await supabaseAdmin.from("user_2fa").update({ last_verified_at: new Date().toISOString() }).eq("user_id", userId);
      return { ok: true };
    }

    const hash = await sha256(data.code.toUpperCase());
    if ((row.recovery_codes ?? []).includes(hash)) {
      await supabaseAdmin
        .from("user_2fa")
        .update({
          recovery_codes: (row.recovery_codes ?? []).filter((c) => c !== hash),
          last_verified_at: new Date().toISOString(),
        })
        .eq("user_id", userId);
      return { ok: true, usedRecoveryCode: true };
    }

    throw new Error("Invalid authentication code.");
  });

export const disable2fa = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ code: z.string().trim().min(6).max(12) }).parse(data))
  .handler(async ({ data, context }) => {
    const { userId, claims } = context;
    const { verifyTotp } = await import("@/lib/security.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row } = await supabaseAdmin.from("user_2fa").select("secret").eq("user_id", userId).maybeSingle();
    if (!row?.secret || !(await verifyTotp(row.secret, data.code))) throw new Error("Invalid authentication code.");
    await supabaseAdmin.from("user_2fa").delete().eq("user_id", userId);
    await supabaseAdmin.from("admin_activity_log").insert({
      actor_id: userId,
      actor_email: String(claims["email"] ?? ""),
      action: "disable",
      module: "security",
      summary: "Disabled two-factor authentication",
    });
    return { ok: true };
  });

/* ------------------------------------------------------------ team / roles */

export const listTeam = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: roles } = await supabaseAdmin.from("user_roles").select("user_id, role");
    const { data: profiles } = await supabaseAdmin.from("profiles").select("id, full_name, phone");
    const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 200 });

    return (authUsers?.users ?? []).map((u) => ({
      id: u.id,
      email: u.email ?? "",
      createdAt: u.created_at,
      lastSignInAt: u.last_sign_in_at ?? null,
      emailConfirmed: Boolean(u.email_confirmed_at),
      fullName: profiles?.find((p) => p.id === u.id)?.full_name ?? "",
      roles: (roles ?? []).filter((r) => r.user_id === u.id).map((r) => r.role as string),
    }));
  });

export const setUserRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        userId: z.string().uuid(),
        role: z.enum(["super_admin", "admin", "manager", "staff", "customer"]),
        grant: z.boolean(),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId, claims } = context;
    await assertAdmin(supabase, userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Only a super admin may create or remove another super admin.
    if (data.role === "super_admin") {
      const { data: isSuper } = await supabaseAdmin
        .from("user_roles")
        .select("id")
        .eq("user_id", userId)
        .eq("role", "super_admin")
        .maybeSingle();
      if (!isSuper) throw new Error("Only a super admin can manage super admin access.");
    }

    if (data.grant) {
      await supabaseAdmin.from("user_roles").insert({ user_id: data.userId, role: data.role }).select();
    } else {
      if (data.role === "super_admin" && data.userId === userId) {
        throw new Error("You cannot remove your own super admin access.");
      }
      await supabaseAdmin.from("user_roles").delete().eq("user_id", data.userId).eq("role", data.role);
    }

    await supabaseAdmin.from("admin_activity_log").insert({
      actor_id: userId,
      actor_email: String(claims["email"] ?? ""),
      action: data.grant ? "grant-role" : "revoke-role",
      module: "customers",
      entity_id: data.userId,
      summary: `${data.grant ? "Granted" : "Revoked"} ${data.role}`,
    });
    return { ok: true };
  });

/* -------------------------------------------------------------- monitoring */

export const getHealthSnapshot = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    await assertStaff(supabase, userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const since = new Date(Date.now() - 24 * 3600_000).toISOString();

    const [products, lowStock, orders, errors, failedLogins, logins] = await Promise.all([
      supabaseAdmin.from("products").select("id", { count: "exact", head: true }),
      supabaseAdmin.from("products").select("id, name, slug, stock, low_stock_alert").order("stock", { ascending: true }).limit(200),
      supabaseAdmin.from("orders").select("id", { count: "exact", head: true }).gte("created_at", since),
      supabaseAdmin.from("error_logs").select("id", { count: "exact", head: true }).gte("created_at", since),
      supabaseAdmin
        .from("login_history")
        .select("id", { count: "exact", head: true })
        .eq("success", false)
        .gte("created_at", since),
      supabaseAdmin.from("login_history").select("id", { count: "exact", head: true }).eq("success", true).gte("created_at", since),
    ]);

    const low = (lowStock.data ?? []).filter((p) => p.stock <= (p.low_stock_alert ?? 5));

    return {
      products: products.count ?? 0,
      ordersLast24h: orders.count ?? 0,
      errorsLast24h: errors.count ?? 0,
      failedLoginsLast24h: failedLogins.count ?? 0,
      successfulLoginsLast24h: logins.count ?? 0,
      lowStock: low.slice(0, 25),
      lowStockCount: low.length,
      checkedAt: new Date().toISOString(),
    };
  });

/** Deletes log rows older than the configured retention windows. */
export const purgeExpiredLogs = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: settings } = await supabaseAdmin.from("security_settings").select("*").maybeSingle();
    if (!settings) return { ok: false };

    const cutoff = (days: number) => new Date(Date.now() - days * 86_400_000).toISOString();
    await supabaseAdmin.from("login_history").delete().lt("created_at", cutoff(settings.retention_login_history_days));
    await supabaseAdmin.from("admin_activity_log").delete().lt("created_at", cutoff(settings.retention_activity_log_days));
    await supabaseAdmin.from("error_logs").delete().lt("created_at", cutoff(settings.retention_error_log_days));
    await supabaseAdmin.from("rate_limit_counters").delete().lt("created_at", cutoff(1));
    return { ok: true, purgedAt: new Date().toISOString() };
  });

/* ---------------------------------------------------- admin access gating */

/** Checks IP allowlist + 2FA enforcement before the admin panel is shown. */
export const checkAdminAccess = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    await assertStaff(supabase, userId);
    const { requestMeta } = await import("@/lib/security.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { ip } = requestMeta();

    const { data: settings } = await supabaseAdmin
      .from("security_settings")
      .select("ip_restriction_enabled, admin_ip_allowlist, require_2fa_for_admins")
      .maybeSingle();

    if (settings?.ip_restriction_enabled && (settings.admin_ip_allowlist ?? []).length) {
      const allowed = (settings.admin_ip_allowlist ?? []).some((entry) => entry.trim() === ip);
      if (!allowed) {
        await supabaseAdmin.from("error_logs").insert({
          level: "warning",
          source: "admin",
          message: "Admin access blocked by IP allowlist",
          meta: { ip, userId },
        });
        return { allowed: false, reason: `Admin access is restricted to approved networks. Your IP (${ip ?? "unknown"}) is not on the allowlist.`, needs2fa: false };
      }
    }

    const { data: twoFa } = await supabaseAdmin
      .from("user_2fa")
      .select("enabled")
      .eq("user_id", userId)
      .maybeSingle();

    return {
      allowed: true,
      reason: null as string | null,
      needs2fa: Boolean(settings?.require_2fa_for_admins),
      has2fa: Boolean(twoFa?.enabled),
    };
  });
