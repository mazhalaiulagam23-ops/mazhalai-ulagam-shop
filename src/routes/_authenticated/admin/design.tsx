import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { Monitor, RotateCcw, Save, Smartphone, Tablet, Wand2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FONT_CHOICES,
  THEME_KEY,
  THEME_PRESETS,
  fontHref,
  themeCss,
  useThemeSettings,
  type ThemeSettings,
} from "@/lib/design";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/admin/design")({
  component: AdminDesign,
});

type Draft = Partial<ThemeSettings>;

const DEVICES = [
  { key: "desktop", label: "Desktop", icon: Monitor, width: "100%" },
  { key: "tablet", label: "Tablet", icon: Tablet, width: "820px" },
  { key: "mobile", label: "Mobile", icon: Smartphone, width: "400px" },
] as const;

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</Label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-9 w-12 cursor-pointer rounded-lg border border-border bg-transparent p-1"
          aria-label={label}
        />
        <Input value={value} onChange={(e) => onChange(e.target.value)} className="font-mono text-xs" />
      </div>
    </div>
  );
}

function AdminDesign() {
  const { data } = useThemeSettings();
  const qc = useQueryClient();
  const [draft, setDraft] = useState<Draft>({});
  const [device, setDevice] = useState<(typeof DEVICES)[number]["key"]>("desktop");
  const [saving, setSaving] = useState(false);
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    if (data) setDraft(data);
  }, [data]);

  const set = <K extends keyof ThemeSettings>(key: K, value: ThemeSettings[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  const previewCss = useMemo(() => themeCss(draft), [draft]);
  const previewFonts = useMemo(() => fontHref(draft.heading_font, draft.body_font), [draft]);

  const save = async () => {
    setSaving(true);
    const { error } = await supabase.from("theme_settings").update(draft).eq("id", true);
    setSaving(false);
    if (error) return toast.error(error.message);
    await qc.invalidateQueries({ queryKey: THEME_KEY });
    setNonce((n) => n + 1);
    toast.success("Design published to the live site");
  };

  const applyPreset = (key: string) => {
    const preset = THEME_PRESETS[key];
    if (!preset) return;
    const { label: _label, ...values } = preset;
    setDraft((d) => ({ ...d, ...values, preset: key }));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold">Design studio</h1>
          <p className="text-sm text-muted-foreground">
            Change colours, fonts, corners and layout for the whole storefront — no code, live preview.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => data && setDraft(data)}>
            <RotateCcw className="mr-2 h-4 w-4" /> Reset
          </Button>
          <Button onClick={() => void save()} disabled={saving}>
            <Save className="mr-2 h-4 w-4" /> {saving ? "Publishing…" : "Publish design"}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[380px_1fr]">
        <div className="surface-card space-y-4 p-4">
          <Tabs defaultValue="colors">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="colors">Colours</TabsTrigger>
              <TabsTrigger value="type">Type</TabsTrigger>
              <TabsTrigger value="layout">Layout</TabsTrigger>
              <TabsTrigger value="code">CSS</TabsTrigger>
            </TabsList>

            <TabsContent value="colors" className="space-y-4 pt-4">
              <div>
                <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Style presets
                </Label>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {Object.entries(THEME_PRESETS).map(([key, preset]) => (
                    <button
                      key={key}
                      onClick={() => applyPreset(key)}
                      className={cn(
                        "rounded-xl border p-2 text-left text-xs font-semibold transition-colors hover:bg-secondary",
                        draft.preset === key ? "border-primary bg-secondary" : "border-border",
                      )}
                    >
                      <span className="flex gap-1">
                        {[preset.primary_color, preset.secondary_color, preset.accent_color].map((c) => (
                          <span key={c} className="h-4 w-4 rounded-full" style={{ background: c }} />
                        ))}
                      </span>
                      <span className="mt-1.5 block">{preset.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <ColorField label="Primary" value={draft.primary_color ?? "#0F766E"} onChange={(v) => set("primary_color", v)} />
              <ColorField label="Secondary / gold" value={draft.secondary_color ?? "#D4AF37"} onChange={(v) => set("secondary_color", v)} />
              <ColorField label="Accent" value={draft.accent_color ?? "#FF8A80"} onChange={(v) => set("accent_color", v)} />
              <ColorField label="Page background" value={draft.background_color ?? "#FFFBF5"} onChange={(v) => set("background_color", v)} />
              <ColorField label="Text" value={draft.foreground_color ?? "#1C2B2A"} onChange={(v) => set("foreground_color", v)} />

              <div className="flex items-center justify-between rounded-xl border border-border p-3">
                <div>
                  <p className="text-sm font-semibold">Dark mode toggle</p>
                  <p className="text-xs text-muted-foreground">Let shoppers switch to dark theme</p>
                </div>
                <Switch checked={draft.dark_mode_enabled ?? true} onCheckedChange={(v) => set("dark_mode_enabled", v)} />
              </div>
            </TabsContent>

            <TabsContent value="type" className="space-y-4 pt-4">
              {(
                [
                  ["heading_font", "Heading font"],
                  ["body_font", "Body font"],
                ] as const
              ).map(([key, label]) => (
                <div key={key} className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</Label>
                  <Select value={(draft[key] as string) ?? ""} onValueChange={(v) => set(key, v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a font" />
                    </SelectTrigger>
                    <SelectContent>
                      {FONT_CHOICES.map((f) => (
                        <SelectItem key={f} value={f}>
                          {f}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
              <div className="rounded-xl border border-border p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Preview</p>
                <p className="mt-1 text-2xl font-bold" style={{ fontFamily: `"${draft.heading_font}", serif` }}>
                  Mazhalai Ulagam
                </p>
                <p className="text-sm" style={{ fontFamily: `"${draft.body_font}", sans-serif` }}>
                  Safe, joyful products for every little one.
                </p>
              </div>
            </TabsContent>

            <TabsContent value="layout" className="space-y-5 pt-4">
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Corner roundness — {Number(draft.base_radius ?? 16)}px
                </Label>
                <Slider
                  min={0}
                  max={32}
                  step={1}
                  value={[Number(draft.base_radius ?? 16)]}
                  onValueChange={([v]) => set("base_radius", v)}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Content width — {draft.container_width ?? 1280}px
                </Label>
                <Slider
                  min={1024}
                  max={1600}
                  step={20}
                  value={[draft.container_width ?? 1280]}
                  onValueChange={([v]) => set("container_width", v)}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Button shape</Label>
                <Select value={draft.button_style ?? "rounded"} onValueChange={(v) => set("button_style", v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sharp">Sharp</SelectItem>
                    <SelectItem value="rounded">Rounded</SelectItem>
                    <SelectItem value="pill">Pill</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Shadow depth</Label>
                <Select value={draft.shadow_style ?? "soft"} onValueChange={(v) => set("shadow_style", v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Flat</SelectItem>
                    <SelectItem value="soft">Soft</SelectItem>
                    <SelectItem value="dramatic">Dramatic</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-border p-3">
                <div>
                  <p className="text-sm font-semibold">Animations</p>
                  <p className="text-xs text-muted-foreground">Motion, hover lifts and floating art</p>
                </div>
                <Switch checked={draft.animations_enabled ?? true} onCheckedChange={(v) => set("animations_enabled", v)} />
              </div>
            </TabsContent>

            <TabsContent value="code" className="space-y-2 pt-4">
              <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Custom CSS</Label>
              <Textarea
                rows={12}
                className="font-mono text-xs"
                placeholder=".hero { letter-spacing: -0.02em; }"
                value={draft.custom_css ?? ""}
                onChange={(e) => set("custom_css", e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Applied site-wide after the theme tokens. Leave empty if unsure.
              </p>
            </TabsContent>
          </Tabs>
        </div>

        <div className="surface-card overflow-hidden p-3">
          <div className="mb-3 flex items-center justify-between gap-2">
            <p className="flex items-center gap-2 text-sm font-semibold">
              <Wand2 className="h-4 w-4 text-primary" /> Live preview
            </p>
            <div className="flex gap-1">
              {DEVICES.map((d) => (
                <Button
                  key={d.key}
                  size="sm"
                  variant={device === d.key ? "default" : "ghost"}
                  onClick={() => setDevice(d.key)}
                >
                  <d.icon className="h-4 w-4" />
                  <span className="sr-only">{d.label}</span>
                </Button>
              ))}
            </div>
          </div>
          <div className="flex justify-center rounded-2xl bg-muted/40 p-2">
            <div
              className="relative overflow-hidden rounded-xl border border-border bg-background"
              style={{ width: DEVICES.find((d) => d.key === device)!.width, height: "70vh" }}
            >
              <iframe
                key={`${device}-${nonce}`}
                title="Storefront preview"
                src="/"
                className="h-full w-full"
                onLoad={(e) => {
                  const doc = e.currentTarget.contentDocument;
                  if (!doc) return;
                  doc.getElementById("design-preview-css")?.remove();
                  const style = doc.createElement("style");
                  style.id = "design-preview-css";
                  style.textContent = previewCss;
                  doc.head.appendChild(style);
                  if (previewFonts) {
                    const link = doc.createElement("link");
                    link.rel = "stylesheet";
                    link.href = previewFonts;
                    doc.head.appendChild(link);
                  }
                }}
              />
            </div>
          </div>
          <div className="mt-3 flex justify-end">
            <Button size="sm" variant="outline" onClick={() => setNonce((n) => n + 1)}>
              <RotateCcw className="mr-2 h-4 w-4" /> Refresh preview with current edits
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
