import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { KeyRound, ShieldCheck, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import {
  confirm2faSetup,
  disable2fa,
  get2faStatus,
  getSecuritySettings,
  purgeExpiredLogs,
  saveSecuritySettings,
  start2faSetup,
} from "@/lib/security.functions";

export const Route = createFileRoute("/_authenticated/admin/security")({
  head: () => ({
    meta: [
      { title: "Security Settings | Mazhalai Ulagam Admin" },
      { name: "description", content: "Configure sessions, lockouts, two-factor authentication and data retention." },
      { property: "og:title", content: "Security Settings | Mazhalai Ulagam Admin" },
      { property: "og:description", content: "Production-grade security controls for the store." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SecurityPage,
});

type Settings = NonNullable<Awaited<ReturnType<typeof getSecuritySettings>>>;

function SecurityPage() {
  const { isAdmin } = useAuth();
  const [settings, setSettings] = useState<Settings | null>(null);
  const [siteKey, setSiteKey] = useState("");
  const [cookie, setCookie] = useState({ enabled: true, message: "", policy_href: "/privacy-policy" });
  const [saving, setSaving] = useState(false);

  const [twoFa, setTwoFa] = useState<{ enabled: boolean } | null>(null);
  const [setupSecret, setSetupSecret] = useState<{ secret: string; otpauthUrl: string } | null>(null);
  const [code, setCode] = useState("");
  const [recoveryCodes, setRecoveryCodes] = useState<string[] | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const [config, status, site, cookieRow] = await Promise.all([
          getSecuritySettings(),
          get2faStatus(),
          supabase.from("site_settings").select("recaptcha_site_key").maybeSingle(),
          supabase.from("cookie_settings").select("enabled, message, policy_href").maybeSingle(),
        ]);
        setSettings(config);
        setTwoFa(status);
        setSiteKey(site.data?.recaptcha_site_key ?? "");
        if (cookieRow.data) setCookie(cookieRow.data);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Could not load security settings");
      }
    })();
  }, []);

  if (!settings) return <div className="surface-card p-6 text-sm text-muted-foreground">Loading security settings…</div>;

  const update = <K extends keyof Settings>(key: K, value: Settings[K]) =>
    setSettings((prev) => (prev ? { ...prev, [key]: value } : prev));

  const save = async () => {
    setSaving(true);
    try {
      await saveSecuritySettings({
        data: {
          session_timeout_minutes: settings.session_timeout_minutes,
          session_warning_seconds: settings.session_warning_seconds,
          max_failed_attempts: settings.max_failed_attempts,
          lockout_minutes: settings.lockout_minutes,
          captcha_enabled: settings.captcha_enabled,
          require_2fa_for_admins: settings.require_2fa_for_admins,
          ip_restriction_enabled: settings.ip_restriction_enabled,
          admin_ip_allowlist: settings.admin_ip_allowlist ?? [],
          failed_login_alerts: settings.failed_login_alerts,
          alert_email: settings.alert_email ?? "",
          low_stock_alerts: settings.low_stock_alerts,
          retention_login_history_days: settings.retention_login_history_days,
          retention_activity_log_days: settings.retention_activity_log_days,
          retention_error_log_days: settings.retention_error_log_days,
        },
      });
      await supabase.from("site_settings").update({ recaptcha_site_key: siteKey.trim() }).eq("id", true);
      await supabase.from("cookie_settings").update(cookie).eq("id", true);
      toast.success("Security settings saved");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save settings");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Security</h1>
        <p className="text-sm text-muted-foreground">
          Sessions, brute-force protection, CAPTCHA, two-factor authentication, cookie consent and data retention.
        </p>
      </div>

      <section className="surface-card space-y-4 p-5">
        <h2 className="font-display text-sm font-bold uppercase tracking-wide">Sessions & lockouts</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label>Session timeout (minutes)</Label>
            <Input
              type="number"
              min={5}
              max={720}
              className="mt-1.5"
              value={settings.session_timeout_minutes}
              onChange={(e) => update("session_timeout_minutes", Number(e.target.value))}
            />
          </div>
          <div>
            <Label>Warning before logout (seconds)</Label>
            <Input
              type="number"
              min={15}
              max={600}
              className="mt-1.5"
              value={settings.session_warning_seconds}
              onChange={(e) => update("session_warning_seconds", Number(e.target.value))}
            />
          </div>
          <div>
            <Label>Failed attempts before lockout</Label>
            <Input
              type="number"
              min={3}
              max={20}
              className="mt-1.5"
              value={settings.max_failed_attempts}
              onChange={(e) => update("max_failed_attempts", Number(e.target.value))}
            />
          </div>
          <div>
            <Label>Lockout duration (minutes)</Label>
            <Input
              type="number"
              min={1}
              max={1440}
              className="mt-1.5"
              value={settings.lockout_minutes}
              onChange={(e) => update("lockout_minutes", Number(e.target.value))}
            />
          </div>
        </div>
      </section>

      <section className="surface-card space-y-4 p-5">
        <h2 className="font-display text-sm font-bold uppercase tracking-wide">Bot & access protection</h2>
        <div className="flex items-center justify-between gap-4">
          <div>
            <Label>Google reCAPTCHA v3 on login & registration</Label>
            <p className="text-xs text-muted-foreground">Requires the site key below and the server secret key.</p>
          </div>
          <Switch checked={settings.captcha_enabled} onCheckedChange={(v) => update("captcha_enabled", v)} />
        </div>
        <div>
          <Label>reCAPTCHA site key (public)</Label>
          <Input className="mt-1.5" value={siteKey} onChange={(e) => setSiteKey(e.target.value)} placeholder="6Lc..." />
        </div>
        <div className="flex items-center justify-between gap-4">
          <div>
            <Label>Restrict admin access by IP</Label>
            <p className="text-xs text-muted-foreground">Only the listed IP addresses may open the admin panel.</p>
          </div>
          <Switch
            checked={settings.ip_restriction_enabled}
            onCheckedChange={(v) => update("ip_restriction_enabled", v)}
          />
        </div>
        <div>
          <Label>Allowed admin IP addresses (one per line)</Label>
          <Textarea
            className="mt-1.5 font-mono text-xs"
            rows={3}
            value={(settings.admin_ip_allowlist ?? []).join("\n")}
            onChange={(e) =>
              update(
                "admin_ip_allowlist",
                e.target.value
                  .split("\n")
                  .map((v) => v.trim())
                  .filter(Boolean),
              )
            }
          />
        </div>
        <div className="flex items-center justify-between gap-4">
          <div>
            <Label>Require two-factor authentication for admins</Label>
            <p className="text-xs text-muted-foreground">Admins must confirm an authenticator code to open the admin.</p>
          </div>
          <Switch
            checked={settings.require_2fa_for_admins}
            onCheckedChange={(v) => update("require_2fa_for_admins", v)}
          />
        </div>
      </section>

      <section className="surface-card space-y-4 p-5">
        <h2 className="flex items-center gap-2 font-display text-sm font-bold uppercase tracking-wide">
          <KeyRound className="h-4 w-4" /> My two-factor authentication
        </h2>
        {twoFa?.enabled ? (
          <div className="space-y-3">
            <p className="text-sm text-emerald-600">Authenticator app is active on your account.</p>
            <div className="flex gap-2">
              <Input placeholder="Current 6-digit code" value={code} onChange={(e) => setCode(e.target.value)} className="max-w-[200px]" />
              <Button
                variant="destructive"
                onClick={() =>
                  void disable2fa({ data: { code } })
                    .then(() => {
                      setTwoFa({ enabled: false });
                      setCode("");
                      toast.success("Two-factor authentication disabled");
                    })
                    .catch((e: Error) => toast.error(e.message))
                }
              >
                <Trash2 className="mr-1.5 h-4 w-4" /> Turn off
              </Button>
            </div>
          </div>
        ) : setupSecret ? (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Scan this in Google Authenticator or Authy, then enter the 6-digit code to finish.
            </p>
            <img
              alt="Two-factor QR code"
              className="h-40 w-40 rounded-xl border bg-white p-2"
              src={`https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(setupSecret.otpauthUrl)}`}
            />
            <p className="font-mono text-xs text-muted-foreground">Manual key: {setupSecret.secret}</p>
            <div className="flex gap-2">
              <Input placeholder="6-digit code" value={code} onChange={(e) => setCode(e.target.value)} className="max-w-[200px]" />
              <Button
                onClick={() =>
                  void confirm2faSetup({ data: { code } })
                    .then((res) => {
                      setRecoveryCodes(res.recoveryCodes);
                      setTwoFa({ enabled: true });
                      setSetupSecret(null);
                      setCode("");
                      toast.success("Two-factor authentication enabled");
                    })
                    .catch((e: Error) => toast.error(e.message))
                }
              >
                Confirm
              </Button>
            </div>
          </div>
        ) : (
          <Button
            variant="outline"
            onClick={() =>
              void start2faSetup()
                .then(setSetupSecret)
                .catch((e: Error) => toast.error(e.message))
            }
          >
            <ShieldCheck className="mr-1.5 h-4 w-4" /> Set up authenticator app
          </Button>
        )}
        {recoveryCodes ? (
          <div className="rounded-xl bg-secondary p-3">
            <p className="text-xs font-semibold">Save these recovery codes somewhere safe — each works once:</p>
            <p className="mt-1 font-mono text-xs">{recoveryCodes.join("  ")}</p>
          </div>
        ) : null}
      </section>

      <section className="surface-card space-y-4 p-5">
        <h2 className="font-display text-sm font-bold uppercase tracking-wide">Alerts</h2>
        <div className="flex items-center justify-between gap-4">
          <Label>Failed login alerts</Label>
          <Switch checked={settings.failed_login_alerts} onCheckedChange={(v) => update("failed_login_alerts", v)} />
        </div>
        <div className="flex items-center justify-between gap-4">
          <Label>Low stock alerts</Label>
          <Switch checked={settings.low_stock_alerts} onCheckedChange={(v) => update("low_stock_alerts", v)} />
        </div>
        <div>
          <Label>Alert email</Label>
          <Input
            className="mt-1.5"
            value={settings.alert_email ?? ""}
            onChange={(e) => update("alert_email", e.target.value)}
            placeholder="alerts@yourstore.com"
          />
        </div>
      </section>

      <section className="surface-card space-y-4 p-5">
        <h2 className="font-display text-sm font-bold uppercase tracking-wide">Cookie consent</h2>
        <div className="flex items-center justify-between gap-4">
          <Label>Show cookie banner</Label>
          <Switch checked={cookie.enabled} onCheckedChange={(v) => setCookie({ ...cookie, enabled: v })} />
        </div>
        <div>
          <Label>Banner message</Label>
          <Textarea
            rows={3}
            className="mt-1.5"
            value={cookie.message}
            onChange={(e) => setCookie({ ...cookie, message: e.target.value })}
          />
        </div>
      </section>

      <section className="surface-card space-y-4 p-5">
        <h2 className="font-display text-sm font-bold uppercase tracking-wide">Data retention</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <Label>Login history (days)</Label>
            <Input
              type="number"
              className="mt-1.5"
              value={settings.retention_login_history_days}
              onChange={(e) => update("retention_login_history_days", Number(e.target.value))}
            />
          </div>
          <div>
            <Label>Activity log (days)</Label>
            <Input
              type="number"
              className="mt-1.5"
              value={settings.retention_activity_log_days}
              onChange={(e) => update("retention_activity_log_days", Number(e.target.value))}
            />
          </div>
          <div>
            <Label>Error log (days)</Label>
            <Input
              type="number"
              className="mt-1.5"
              value={settings.retention_error_log_days}
              onChange={(e) => update("retention_error_log_days", Number(e.target.value))}
            />
          </div>
        </div>
        <Button
          variant="outline"
          disabled={!isAdmin}
          onClick={() =>
            void purgeExpiredLogs()
              .then(() => toast.success("Expired log entries removed"))
              .catch((e: Error) => toast.error(e.message))
          }
        >
          Purge expired records now
        </Button>
      </section>

      <Button onClick={() => void save()} disabled={saving || !isAdmin} size="lg">
        {saving ? "Saving…" : "Save security settings"}
      </Button>
    </div>
  );
}
