import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bot, Download, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { uploadImage } from "@/lib/upload";
import { logAdminActivity } from "@/lib/security.functions";

export const Route = createFileRoute("/_authenticated/admin/ai-chat")({
  component: AdminAiChat,
});

type DisplayForm = {
  is_enabled: boolean;
  floating_enabled: boolean;
  ai_name: string;
  ai_avatar_url: string;
  welcome_title: string;
  welcome_message: string;
  suggested_questions: string;
  accent_color: string;
  floating_position: string;
  business_hours_enabled: boolean;
  business_hours_note: string;
  live_chat_enabled: boolean;
};

type PrivateForm = {
  system_prompt: string;
  knowledge_notes: string;
  rate_limit_per_hour: number;
  auto_reply_enabled: boolean;
  email_notifications: boolean;
  whatsapp_notifications: boolean;
};

function AdminAiChat() {
  const qc = useQueryClient();
  const [display, setDisplay] = useState<DisplayForm | null>(null);
  const [priv, setPriv] = useState<PrivateForm | null>(null);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState("");

  const displayQuery = useQuery({
    queryKey: ["admin", "ai_chat_display"],
    queryFn: async () => {
      const { data, error } = await supabase.from("ai_chat_display").select("*").maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const privateQuery = useQuery({
    queryKey: ["admin", "ai_chat_settings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("ai_chat_settings").select("*").maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const messagesQuery = useQuery({
    queryKey: ["admin", "support_messages"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("support_messages")
        .select("id, user_id, role, parts, feedback, created_at")
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      return data ?? [];
    },
  });

  const blocksQuery = useQuery({
    queryKey: ["admin", "ai_chat_blocks"],
    queryFn: async () => {
      const { data, error } = await supabase.from("ai_chat_blocks").select("*");
      if (error) throw error;
      return data ?? [];
    },
  });

  useEffect(() => {
    const d = displayQuery.data;
    if (d && !display) {
      setDisplay({
        is_enabled: d.is_enabled,
        floating_enabled: d.floating_enabled,
        ai_name: d.ai_name,
        ai_avatar_url: d.ai_avatar_url ?? "",
        welcome_title: d.welcome_title,
        welcome_message: d.welcome_message,
        suggested_questions: (d.suggested_questions ?? []).join("\n"),
        accent_color: d.accent_color ?? "",
        floating_position: d.floating_position,
        business_hours_enabled: d.business_hours_enabled,
        business_hours_note: d.business_hours_note,
        live_chat_enabled: d.live_chat_enabled,
      });
    }
  }, [displayQuery.data, display]);

  useEffect(() => {
    const p = privateQuery.data;
    if (p && !priv) {
      setPriv({
        system_prompt: p.system_prompt ?? "",
        knowledge_notes: p.knowledge_notes ?? "",
        rate_limit_per_hour: p.rate_limit_per_hour ?? 60,
        auto_reply_enabled: p.auto_reply_enabled,
        email_notifications: p.email_notifications,
        whatsapp_notifications: p.whatsapp_notifications,
      });
    }
  }, [privateQuery.data, priv]);

  const save = useMutation({
    mutationFn: async () => {
      if (!display || !priv) return;
      const { error: dErr } = await supabase
        .from("ai_chat_display")
        .update({
          ...display,
          ai_avatar_url: display.ai_avatar_url || null,
          suggested_questions: display.suggested_questions
            .split("\n")
            .map((s) => s.trim())
            .filter(Boolean),
        })
        .eq("id", true);
      if (dErr) throw dErr;
      const { error: pErr } = await supabase.from("ai_chat_settings").update(priv).eq("id", true);
      if (pErr) throw pErr;
      await logAdminActivity({
        data: { action: "update", module: "ai_chat", summary: "Updated AI chat settings" },
      }).catch(() => undefined);
    },
    onSuccess: () => {
      toast.success("AI chat settings saved.");
      void qc.invalidateQueries({ queryKey: ["ai-chat"] });
      void qc.invalidateQueries({ queryKey: ["admin", "ai_chat_display"] });
      void qc.invalidateQueries({ queryKey: ["admin", "ai_chat_settings"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const unblock = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase.from("ai_chat_blocks").delete().eq("user_id", userId);
      if (error) throw error;
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["admin", "ai_chat_blocks"] }),
  });

  const block = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase
        .from("ai_chat_blocks")
        .insert({ user_id: userId, reason: "Spam / abuse" });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Customer blocked from the assistant.");
      void qc.invalidateQueries({ queryKey: ["admin", "ai_chat_blocks"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const rows = useMemo(() => {
    const all = (messagesQuery.data ?? []).map((m) => ({
      ...m,
      text: (Array.isArray(m.parts) ? (m.parts as Array<{ type?: string; text?: string }>) : [])
        .map((p) => (p.type === "text" ? (p.text ?? "") : ""))
        .join("")
        .trim(),
    }));
    const q = search.trim().toLowerCase();
    return q ? all.filter((m) => m.text.toLowerCase().includes(q) || m.user_id.includes(q)) : all;
  }, [messagesQuery.data, search]);

  const stats = useMemo(() => {
    const all = messagesQuery.data ?? [];
    return {
      total: all.length,
      conversations: new Set(all.map((m) => m.user_id)).size,
      likes: all.filter((m) => m.feedback === 1).length,
      dislikes: all.filter((m) => m.feedback === -1).length,
    };
  }, [messagesQuery.data]);

  const exportCsv = () => {
    const header = ["created_at", "user_id", "role", "feedback", "message"];
    const body = rows.map((r) => [
      r.created_at,
      r.user_id,
      r.role,
      String(r.feedback ?? 0),
      `"${r.text.replace(/"/g, '""')}"`,
    ]);
    const csv = [header.join(","), ...body.map((b) => b.join(","))].join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `ai-chat-history-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!display || !priv) {
    return (
      <div className="flex items-center gap-2 p-6 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading AI chat settings…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="flex items-center gap-2 font-display text-2xl font-bold">
          <Bot className="h-6 w-6 text-primary" /> AI Chat
        </h1>
        <Button onClick={() => save.mutate()} disabled={save.isPending}>
          {save.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} Save settings
        </Button>
      </div>

      {/* Analytics */}
      <div className="grid gap-3 sm:grid-cols-4">
        {[
          { label: "Messages", value: stats.total },
          { label: "Customers", value: stats.conversations },
          { label: "Likes", value: stats.likes },
          { label: "Dislikes", value: stats.dislikes },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border bg-card p-4">
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className="font-display text-2xl font-bold">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Appearance */}
        <section className="space-y-4 rounded-xl border bg-card p-5">
          <h2 className="font-display text-lg font-bold">Appearance & availability</h2>

          <ToggleRow
            label="Enable AI chat"
            checked={display.is_enabled}
            onChange={(v) => setDisplay({ ...display, is_enabled: v })}
          />
          <ToggleRow
            label="Show floating chat button"
            checked={display.floating_enabled}
            onChange={(v) => setDisplay({ ...display, floating_enabled: v })}
          />
          <ToggleRow
            label="Offer live human chat"
            checked={display.live_chat_enabled}
            onChange={(v) => setDisplay({ ...display, live_chat_enabled: v })}
          />
          <ToggleRow
            label="Show business hours note"
            checked={display.business_hours_enabled}
            onChange={(v) => setDisplay({ ...display, business_hours_enabled: v })}
          />

          <Field label="Assistant name">
            <Input
              value={display.ai_name}
              onChange={(e) => setDisplay({ ...display, ai_name: e.target.value })}
            />
          </Field>

          <Field label="Assistant avatar">
            <div className="flex items-center gap-3">
              {display.ai_avatar_url ? (
                <img
                  src={display.ai_avatar_url}
                  alt=""
                  className="h-12 w-12 rounded-full object-cover"
                />
              ) : null}
              <Input
                type="file"
                accept="image/*"
                disabled={uploading}
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  setUploading(true);
                  try {
                    const url = await uploadImage(file);
                    setDisplay({ ...display, ai_avatar_url: url });
                  } catch {
                    toast.error("Upload failed.");
                  } finally {
                    setUploading(false);
                  }
                }}
              />
            </div>
          </Field>

          <Field label="Welcome title">
            <Input
              value={display.welcome_title}
              onChange={(e) => setDisplay({ ...display, welcome_title: e.target.value })}
            />
          </Field>
          <Field label="Welcome message">
            <Textarea
              rows={3}
              value={display.welcome_message}
              onChange={(e) => setDisplay({ ...display, welcome_message: e.target.value })}
            />
          </Field>
          <Field label="Suggested questions (one per line)">
            <Textarea
              rows={6}
              value={display.suggested_questions}
              onChange={(e) => setDisplay({ ...display, suggested_questions: e.target.value })}
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Accent colour (CSS value, optional)">
              <Input
                placeholder="#e26a6a"
                value={display.accent_color}
                onChange={(e) => setDisplay({ ...display, accent_color: e.target.value })}
              />
            </Field>
            <Field label="Floating button position">
              <select
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={display.floating_position}
                onChange={(e) => setDisplay({ ...display, floating_position: e.target.value })}
              >
                <option value="bottom-right">Bottom right</option>
                <option value="bottom-left">Bottom left</option>
              </select>
            </Field>
          </div>
          <Field label="Business hours note">
            <Input
              value={display.business_hours_note}
              onChange={(e) => setDisplay({ ...display, business_hours_note: e.target.value })}
            />
          </Field>
        </section>

        {/* Brain */}
        <section className="space-y-4 rounded-xl border bg-card p-5">
          <h2 className="font-display text-lg font-bold">Knowledge & behaviour</h2>
          <Field label="Extra system prompt (added to the built-in store prompt)">
            <Textarea
              rows={8}
              value={priv.system_prompt}
              onChange={(e) => setPriv({ ...priv, system_prompt: e.target.value })}
              placeholder="Tone rules, escalation policy, store-specific instructions…"
            />
          </Field>
          <Field label="Knowledge notes (policies, FAQs, delivery details…)">
            <Textarea
              rows={10}
              value={priv.knowledge_notes}
              onChange={(e) => setPriv({ ...priv, knowledge_notes: e.target.value })}
              placeholder="Paste any documents or policy text the assistant should know."
            />
          </Field>
          <Field label="Message limit per customer per hour (spam / rate limiting)">
            <Input
              type="number"
              min={1}
              value={priv.rate_limit_per_hour}
              onChange={(e) =>
                setPriv({ ...priv, rate_limit_per_hour: Number(e.target.value) || 60 })
              }
            />
          </Field>
          <ToggleRow
            label="Auto replies"
            checked={priv.auto_reply_enabled}
            onChange={(v) => setPriv({ ...priv, auto_reply_enabled: v })}
          />
          <ToggleRow
            label="Email notifications for handoffs"
            checked={priv.email_notifications}
            onChange={(v) => setPriv({ ...priv, email_notifications: v })}
          />
          <ToggleRow
            label="WhatsApp notifications for handoffs"
            checked={priv.whatsapp_notifications}
            onChange={(v) => setPriv({ ...priv, whatsapp_notifications: v })}
          />
        </section>
      </div>

      {/* History */}
      <section className="space-y-3 rounded-xl border bg-card p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-lg font-bold">Chat history</h2>
          <div className="flex items-center gap-2">
            <Input
              placeholder="Search messages or customer id…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-64"
            />
            <Button variant="outline" onClick={exportCsv}>
              <Download className="mr-2 h-4 w-4" /> Export CSV
            </Button>
          </div>
        </div>
        <div className="max-h-[420px] overflow-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-secondary text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="p-2">When</th>
                <th className="p-2">Customer</th>
                <th className="p-2">Role</th>
                <th className="p-2">Message</th>
                <th className="p-2">Rating</th>
                <th className="p-2" />
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t align-top">
                  <td className="whitespace-nowrap p-2 text-xs text-muted-foreground">
                    {new Date(r.created_at).toLocaleString("en-IN")}
                  </td>
                  <td className="p-2 font-mono text-[11px]">{r.user_id.slice(0, 8)}…</td>
                  <td className="p-2 text-xs">{r.role}</td>
                  <td className="p-2">{r.text.slice(0, 220)}</td>
                  <td className="p-2 text-xs">
                    {r.feedback === 1 ? "👍" : r.feedback === -1 ? "👎" : "—"}
                  </td>
                  <td className="p-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 text-[11px] text-destructive"
                      onClick={() => block.mutate(r.user_id)}
                    >
                      Block
                    </Button>
                  </td>
                </tr>
              ))}
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-sm text-muted-foreground">
                    No chat messages yet.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      {/* Blocked users */}
      <section className="space-y-3 rounded-xl border bg-card p-5">
        <h2 className="font-display text-lg font-bold">Blocked customers</h2>
        {(blocksQuery.data ?? []).length === 0 ? (
          <p className="text-sm text-muted-foreground">Nobody is blocked from the assistant.</p>
        ) : (
          <ul className="space-y-2">
            {(blocksQuery.data ?? []).map((b) => (
              <li key={b.user_id} className="flex items-center justify-between rounded-lg border p-2">
                <span className="font-mono text-xs">{b.user_id}</span>
                <span className="text-xs text-muted-foreground">{b.reason}</span>
                <Button size="sm" variant="ghost" onClick={() => unblock.mutate(b.user_id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-semibold">{label}</Label>
      {children}
    </div>
  );
}

function ToggleRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border p-3">
      <span className="text-sm">{label}</span>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}
