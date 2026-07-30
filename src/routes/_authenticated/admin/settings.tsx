import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Upload } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { uploadImage } from "@/lib/upload";

export const Route = createFileRoute("/_authenticated/admin/settings")({
  component: AdminSettings,
});

type Form = {
  site_name: string;
  tagline: string;
  logo_url: string;
  favicon_url: string;
  phone: string;
  email: string;
  address: string;
  whatsapp: string;
  instagram: string;
  facebook: string;
  youtube: string;
  footer_note: string;
};

const empty: Form = {
  site_name: "",
  tagline: "",
  logo_url: "",
  favicon_url: "",
  phone: "",
  email: "",
  address: "",
  whatsapp: "",
  instagram: "",
  facebook: "",
  youtube: "",
  footer_note: "",
};

function AssetField({
  label,
  value,
  onChange,
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  hint?: string;
}) {
  const [busy, setBusy] = useState(false);
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <div className="flex items-center gap-3">
        {value ? (
          <img src={value} alt="" className="h-12 w-12 rounded-lg border border-border object-contain" />
        ) : null}
        <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder="https://…" />
        <Button type="button" variant="outline" size="sm" disabled={busy} asChild>
          <label className="cursor-pointer">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                setBusy(true);
                try {
                  onChange(await uploadImage(file, "branding"));
                } catch (err) {
                  toast.error(err instanceof Error ? err.message : "Upload failed");
                } finally {
                  setBusy(false);
                  e.target.value = "";
                }
              }}
            />
          </label>
        </Button>
      </div>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function AdminSettings() {
  const qc = useQueryClient();
  const [form, setForm] = useState<Form>(empty);

  const { data, isLoading } = useQuery({
    queryKey: ["cms-admin", "site_settings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("site_settings").select("*").maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (!data) return;
    setForm({
      site_name: data.site_name ?? "",
      tagline: data.tagline ?? "",
      logo_url: data.logo_url ?? "",
      favicon_url: data.favicon_url ?? "",
      phone: data.phone ?? "",
      email: data.email ?? "",
      address: data.address ?? "",
      whatsapp: data.whatsapp ?? "",
      instagram: data.instagram ?? "",
      facebook: data.facebook ?? "",
      youtube: data.youtube ?? "",
      footer_note: data.footer_note ?? "",
    });
  }, [data]);

  const save = useMutation({
    mutationFn: async () => {
      const payload = {
        ...form,
        logo_url: form.logo_url || null,
        favicon_url: form.favicon_url || null,
      };
      const { error } = await supabase
        .from("site_settings")
        .upsert({ id: true, ...payload })
        .eq("id", true);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["cms"] });
      void qc.invalidateQueries({ queryKey: ["cms-admin", "site_settings"] });
      toast.success("Site settings saved");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const field = (key: keyof Form, label: string, placeholder?: string) => (
    <div className="space-y-1.5">
      <Label htmlFor={key}>{label}</Label>
      <Input
        id={key}
        value={form[key]}
        placeholder={placeholder}
        onChange={(e) => setForm((s) => ({ ...s, [key]: e.target.value }))}
      />
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Site settings</h1>
        <p className="text-sm text-muted-foreground">Website name, logo, favicon and contact details.</p>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : (
        <>
          <section className="surface-card space-y-4 p-5">
            <h2 className="font-display text-lg font-bold">Identity</h2>
            {field("site_name", "Website name")}
            <div className="space-y-1.5">
              <Label htmlFor="tagline">Tagline</Label>
              <Input
                id="tagline"
                value={form.tagline}
                onChange={(e) => setForm((s) => ({ ...s, tagline: e.target.value }))}
              />
            </div>
            <AssetField
              label="Logo"
              value={form.logo_url}
              onChange={(v) => setForm((s) => ({ ...s, logo_url: v }))}
              hint="Shown in the header and mobile menu."
            />
            <AssetField
              label="Favicon"
              value={form.favicon_url}
              onChange={(v) => setForm((s) => ({ ...s, favicon_url: v }))}
              hint="Square PNG or SVG, shown in the browser tab."
            />
          </section>

          <section className="surface-card grid gap-4 p-5 sm:grid-cols-2">
            <h2 className="font-display text-lg font-bold sm:col-span-2">Contact</h2>
            {field("phone", "Phone", "+91 …")}
            {field("email", "Email")}
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="address">Address</Label>
              <Textarea
                id="address"
                value={form.address}
                onChange={(e) => setForm((s) => ({ ...s, address: e.target.value }))}
              />
            </div>
            {field("whatsapp", "WhatsApp link", "https://wa.me/91…")}
            {field("instagram", "Instagram link")}
            {field("facebook", "Facebook link")}
            {field("youtube", "YouTube link")}
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="footer_note">Footer description</Label>
              <Textarea
                id="footer_note"
                value={form.footer_note}
                onChange={(e) => setForm((s) => ({ ...s, footer_note: e.target.value }))}
              />
            </div>
          </section>

          <Button onClick={() => save.mutate()} disabled={save.isPending}>
            {save.isPending && <Loader2 className="h-4 w-4 animate-spin" />} Save settings
          </Button>
        </>
      )}
    </div>
  );
}
