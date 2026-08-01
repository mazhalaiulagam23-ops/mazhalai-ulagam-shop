import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/admin/logs")({
  head: () => ({
    meta: [
      { title: "Audit & Login Logs | Mazhalai Ulagam Admin" },
      { name: "description", content: "Review admin activity, sign-in history and application errors." },
      { property: "og:title", content: "Audit & Login Logs | Mazhalai Ulagam Admin" },
      { property: "og:description", content: "Full audit trail for the Mazhalai Ulagam store." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LogsPage,
});

type Activity = { id: string; actor_email: string; action: string; module: string; summary: string; ip_address: string | null; created_at: string };
type Login = { id: string; email: string; success: boolean; method: string; reason: string | null; ip_address: string | null; user_agent: string | null; created_at: string };
type ErrorRow = { id: string; level: string; source: string; message: string; path: string | null; created_at: string };

function toCsv(rows: Record<string, unknown>[]) {
  if (!rows.length) return "";
  const headers = Object.keys(rows[0]!);
  const escape = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  return [headers.join(","), ...rows.map((r) => headers.map((h) => escape(r[h])).join(","))].join("\n");
}

function download(name: string, rows: Record<string, unknown>[]) {
  const blob = new Blob([toCsv(rows)], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

function LogsPage() {
  const [activity, setActivity] = useState<Activity[]>([]);
  const [logins, setLogins] = useState<Login[]>([]);
  const [errors, setErrors] = useState<ErrorRow[]>([]);
  const [query, setQuery] = useState("");

  useEffect(() => {
    void (async () => {
      const [a, l, e] = await Promise.all([
        supabase.from("admin_activity_log").select("*").order("created_at", { ascending: false }).limit(300),
        supabase.from("login_history").select("*").order("created_at", { ascending: false }).limit(300),
        supabase.from("error_logs").select("*").order("created_at", { ascending: false }).limit(200),
      ]);
      setActivity((a.data ?? []) as Activity[]);
      setLogins((l.data ?? []) as Login[]);
      setErrors((e.data ?? []) as ErrorRow[]);
    })();
  }, []);

  const q = query.trim().toLowerCase();
  const match = (value: string) => !q || value.toLowerCase().includes(q);
  const filteredActivity = useMemo(
    () => activity.filter((r) => match(`${r.actor_email} ${r.action} ${r.module} ${r.summary}`)),
    [activity, q], // eslint-disable-line react-hooks/exhaustive-deps
  );
  const filteredLogins = useMemo(
    () => logins.filter((r) => match(`${r.email} ${r.method} ${r.ip_address ?? ""} ${r.reason ?? ""}`)),
    [logins, q], // eslint-disable-line react-hooks/exhaustive-deps
  );
  const filteredErrors = useMemo(
    () => errors.filter((r) => match(`${r.message} ${r.source} ${r.path ?? ""}`)),
    [errors, q], // eslint-disable-line react-hooks/exhaustive-deps
  );

  const failedCount = logins.filter((l) => !l.success).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Audit & monitoring</h1>
        <p className="text-sm text-muted-foreground">
          Who changed what, every sign-in attempt, and application errors. {failedCount} failed sign-in
          {failedCount === 1 ? "" : "s"} in the recent history.
        </p>
      </div>

      <Input placeholder="Search logs…" value={query} onChange={(e) => setQuery(e.target.value)} className="max-w-sm" />

      <Tabs defaultValue="activity">
        <TabsList>
          <TabsTrigger value="activity">Admin activity</TabsTrigger>
          <TabsTrigger value="logins">Login history</TabsTrigger>
          <TabsTrigger value="errors">Errors</TabsTrigger>
        </TabsList>

        <TabsContent value="activity" className="pt-4">
          <div className="surface-card p-4">
            <Button variant="outline" size="sm" className="mb-3" onClick={() => download("admin-activity.csv", filteredActivity)}>
              <Download className="mr-1.5 h-4 w-4" /> Export CSV
            </Button>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-sm">
                <thead>
                  <tr className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="py-2">When</th>
                    <th>Who</th>
                    <th>Action</th>
                    <th>Area</th>
                    <th>Details</th>
                    <th>IP</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredActivity.map((row) => (
                    <tr key={row.id} className="border-b last:border-0">
                      <td className="py-2 text-xs text-muted-foreground">{new Date(row.created_at).toLocaleString()}</td>
                      <td className="text-xs">{row.actor_email || "—"}</td>
                      <td className="text-xs font-semibold">{row.action}</td>
                      <td className="text-xs">{row.module || "—"}</td>
                      <td className="text-xs">{row.summary}</td>
                      <td className="text-xs text-muted-foreground">{row.ip_address ?? "—"}</td>
                    </tr>
                  ))}
                  {!filteredActivity.length ? (
                    <tr>
                      <td colSpan={6} className="py-6 text-center text-sm text-muted-foreground">
                        No activity recorded yet.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="logins" className="pt-4">
          <div className="surface-card p-4">
            <Button variant="outline" size="sm" className="mb-3" onClick={() => download("login-history.csv", filteredLogins)}>
              <Download className="mr-1.5 h-4 w-4" /> Export CSV
            </Button>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-sm">
                <thead>
                  <tr className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="py-2">When</th>
                    <th>Email</th>
                    <th>Result</th>
                    <th>Method</th>
                    <th>IP</th>
                    <th>Device</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLogins.map((row) => (
                    <tr key={row.id} className="border-b last:border-0">
                      <td className="py-2 text-xs text-muted-foreground">{new Date(row.created_at).toLocaleString()}</td>
                      <td className="text-xs">{row.email}</td>
                      <td className={`text-xs font-semibold ${row.success ? "text-emerald-600" : "text-destructive"}`}>
                        {row.success ? "Success" : "Failed"}
                      </td>
                      <td className="text-xs">{row.method}</td>
                      <td className="text-xs text-muted-foreground">{row.ip_address ?? "—"}</td>
                      <td className="max-w-[220px] truncate text-xs text-muted-foreground">{row.user_agent ?? "—"}</td>
                    </tr>
                  ))}
                  {!filteredLogins.length ? (
                    <tr>
                      <td colSpan={6} className="py-6 text-center text-sm text-muted-foreground">
                        No sign-in attempts recorded yet.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="errors" className="pt-4">
          <div className="surface-card p-4">
            <Button variant="outline" size="sm" className="mb-3" onClick={() => download("error-log.csv", filteredErrors)}>
              <Download className="mr-1.5 h-4 w-4" /> Export CSV
            </Button>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-sm">
                <thead>
                  <tr className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="py-2">When</th>
                    <th>Level</th>
                    <th>Source</th>
                    <th>Message</th>
                    <th>Path</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredErrors.map((row) => (
                    <tr key={row.id} className="border-b last:border-0">
                      <td className="py-2 text-xs text-muted-foreground">{new Date(row.created_at).toLocaleString()}</td>
                      <td className="text-xs font-semibold">{row.level}</td>
                      <td className="text-xs">{row.source}</td>
                      <td className="max-w-[320px] truncate text-xs">{row.message}</td>
                      <td className="text-xs text-muted-foreground">{row.path ?? "—"}</td>
                    </tr>
                  ))}
                  {!filteredErrors.length ? (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-sm text-muted-foreground">
                        No errors logged. 🎉
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
