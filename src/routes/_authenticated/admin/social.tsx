import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { uploadImage } from "@/lib/upload";
import type { SocialLink } from "@/lib/cms";

export const Route = createFileRoute("/_authenticated/admin/social")({
  component: AdminSocial,
});

const PLACEMENTS = [
  { value: "header", label: "Header" },
  { value: "footer", label: "Footer" },
  { value: "contact", label: "Contact Page" },
  { value: "product", label: "Product Page" },
  { value: "floating", label: "Floating Buttons" },
] as const;

type ContactForm = {
  company_name: string;
  address: string;
  phone: string;
  email: string;
  google_maps_url: string;
  business_hours: string;
  whatsapp_number: string;
};

const emptyContact: ContactForm = {
  company_name: "",
  address: "",
  phone: "",
  email: "",
  google_maps_url: "",
  business_hours: "",
  whatsapp_number: "",
};

const isUrl = (v: string) => /^https?:\/\/\S+\.\S+/.test(v.trim());

function QrField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [busy, setBusy] = useState(false);
  return (
    <div className="flex items-center gap-2">
      {value ? (
        <div className="relative">
          <img src={value} alt="QR code" className="h-16 w-16 rounded-lg border border-border object-contain" />
          <button
            type="button"
            aria-label="Remove QR code"
            onClick={() => onChange("")}
            className="absolute -right-2 -top-2 rounded-full bg-destructive p-0.5 text-destructive-foreground"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      ) : null}
      <Button type="button" variant="outline" size="sm" disabled={busy} asChild>
        <label className="cursor-pointer">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          <span className="ml-1 text-xs">{value ? "Replace QR" : "Upload QR"}</span>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              setBusy(true);
              try {
                onChange(await uploadImage(file, "qr"));
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
  );
}

function AdminSocial() {
  const qc = useQueryClient();
  const [contact, setContact] = useState<ContactForm>(emptyContact);
  const [rows, setRows] = useState<SocialLink[]>([]);

  const { data: settings, isLoading: loadingSettings } = useQuery({
    queryKey: ["cms-admin", "site_settings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("site_settings").select("*").maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: links, isLoading: loadingLinks } = useQuery({
    queryKey: ["cms-admin", "social_links"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("social_links")
        .select("*")
        .order("position", { ascending: true });
      if (error) throw error;
      return data as SocialLink[];
    },
  });

  useEffect(() => {
    if (!settings) return;
    setContact({
      company_name: settings.company_name || settings.site_name || "",
      address: settings.address ?? "",
      phone: settings.phone ?? "",
      email: settings.email ?? "",
      google_maps_url: settings.google_maps_url ?? "",
      business_hours: settings.business_hours ?? "",
      whatsapp_number: settings.whatsapp_number ?? "",
    });
  }, [settings]);

  useEffect(() => {
    if (links) setRows(links);
  }, [links]);

  const refresh = () => {
    void qc.invalidateQueries({ queryKey: ["cms"] });
    void qc.invalidateQueries({ queryKey: ["cms-admin", "social_links"] });
    void qc.invalidateQueries({ queryKey: ["cms-admin", "site_settings"] });
  };

  const saveContact = useMutation({
    mutationFn: async () => {
      if (contact.google_maps_url && !isUrl(contact.google_maps_url)) {
        throw new Error("Google Maps link must start with http:// or https://");
      }
      if (contact.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email)) {
        throw new Error("Please enter a valid email address");
      }
      const { error } = await supabase.from("site_settings").upsert({ id: true, ...contact }).eq("id", true);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      refresh();
      toast.success("Contact information saved");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const saveLinks = useMutation({
    mutationFn: async () => {
      for (const row of rows) {
        const url = (row.url ?? "").trim();
        if (url && row.platform !== "whatsapp" && !isUrl(url)) {
          throw new Error(`${row.label}: link must start with http:// or https://`);
        }
        const { error } = await supabase
          .from("social_links")
          .update({
            url,
            qr_image_url: row.qr_image_url || null,
            is_visible: row.is_visible,
            show_qr: row.show_qr,
            placements: row.placements ?? [],
          })
          .eq("id", row.id);
        if (error) throw new Error(error.message);
      }
    },
    onSuccess: () => {
      refresh();
      toast.success("Social media & QR codes saved");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const patch = (id: string, values: Partial<SocialLink>) =>
    setRows((list) => list.map((r) => (r.id === id ? { ...r, ...values } : r)));

  const field = (key: keyof ContactForm, label: string, placeholder?: string) => (
    <div className="space-y-1.5">
      <Label htmlFor={key}>{label}</Label>
      <Input
        id={key}
        value={contact[key]}
        placeholder={placeholder}
        onChange={(e) => setContact((s) => ({ ...s, [key]: e.target.value }))}
      />
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Social Media & QR Code</h1>
        <p className="text-sm text-muted-foreground">
          Links, QR codes and contact details — changes appear on the storefront as soon as you save.
        </p>
      </div>

      {loadingSettings || loadingLinks ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : (
        <>
          <section className="surface-card space-y-4 p-5">
            <h2 className="font-display text-lg font-bold">Social media & QR codes</h2>
            <div className="space-y-4">
              {rows.map((row) => (
                <div key={row.id} className="space-y-3 rounded-xl border border-border p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-semibold">{row.label}</p>
                    <div className="flex items-center gap-2">
                      <Label htmlFor={`vis-${row.id}`} className="text-xs text-muted-foreground">
                        Show icon
                      </Label>
                      <Switch
                        id={`vis-${row.id}`}
                        checked={row.is_visible}
                        onCheckedChange={(v) => patch(row.id, { is_visible: v })}
                      />
                    </div>
                  </div>

                  <Input
                    value={row.url ?? ""}
                    placeholder={
                      row.platform === "whatsapp" ? "https://wa.me/91XXXXXXXXXX" : "https://…"
                    }
                    onChange={(e) => patch(row.id, { url: e.target.value })}
                  />

                  <div className="flex flex-wrap items-center gap-4">
                    <QrField
                      value={row.qr_image_url ?? ""}
                      onChange={(v) => patch(row.id, { qr_image_url: v })}
                    />
                    <div className="flex items-center gap-2">
                      <Label htmlFor={`qr-${row.id}`} className="text-xs text-muted-foreground">
                        Show QR code
                      </Label>
                      <Switch
                        id={`qr-${row.id}`}
                        checked={row.show_qr}
                        onCheckedChange={(v) => patch(row.id, { show_qr: v })}
                      />
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    {PLACEMENTS.map((p) => {
                      const active = (row.placements ?? []).includes(p.value);
                      return (
                        <button
                          key={p.value}
                          type="button"
                          onClick={() =>
                            patch(row.id, {
                              placements: active
                                ? (row.placements ?? []).filter((x) => x !== p.value)
                                : [...(row.placements ?? []), p.value],
                            })
                          }
                          className={`rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${
                            active
                              ? "border-transparent bg-primary text-primary-foreground"
                              : "border-border text-muted-foreground hover:bg-secondary"
                          }`}
                        >
                          {p.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
            <Button onClick={() => saveLinks.mutate()} disabled={saveLinks.isPending}>
              {saveLinks.isPending && <Loader2 className="h-4 w-4 animate-spin" />} Save social & QR codes
            </Button>
          </section>

          <section className="surface-card grid gap-4 p-5 sm:grid-cols-2">
            <h2 className="font-display text-lg font-bold sm:col-span-2">Contact information</h2>
            {field("company_name", "Company name")}
            {field("phone", "Phone number", "+91 …")}
            {field("email", "Email")}
            {field("whatsapp_number", "WhatsApp number", "91XXXXXXXXXX")}
            {field("google_maps_url", "Google Maps link", "https://maps.google.com/…")}
            {field("business_hours", "Business hours", "Mon–Sun, 9 AM – 8 PM")}
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="social-address">Address</Label>
              <Textarea
                id="social-address"
                value={contact.address}
                onChange={(e) => setContact((s) => ({ ...s, address: e.target.value }))}
              />
            </div>
            <div className="sm:col-span-2">
              <Button onClick={() => saveContact.mutate()} disabled={saveContact.isPending}>
                {saveContact.isPending && <Loader2 className="h-4 w-4 animate-spin" />} Save contact info
              </Button>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
