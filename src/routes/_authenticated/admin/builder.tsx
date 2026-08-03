import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import {
  Eye,
  EyeOff,
  GripVertical,
  Monitor,
  Plus,
  RotateCcw,
  Smartphone,
  Tablet,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useHomeSections, type HomeSection } from "@/lib/cms";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/admin/builder")({
  component: AdminBuilder,
});

const LIBRARY = [
  { key: "hero", label: "Hero banner", hint: "Big carousel with call-to-action" },
  { key: "categories", label: "Category circles", hint: "Shop by category" },
  { key: "age", label: "Shop by age", hint: "0-12m, 1-3y, 3-5y, 5-10y" },
  { key: "trust", label: "Trust strip", hint: "Safe products, fast delivery" },
  { key: "bestsellers", label: "Bestsellers grid", hint: "Top-selling products" },
  { key: "new_arrivals", label: "New arrivals", hint: "Latest catalog additions" },
  { key: "offers", label: "Special offers", hint: "Discounted products" },
  { key: "promos", label: "Promo banners", hint: "Two-up marketing blocks" },
  { key: "testimonials", label: "Testimonials", hint: "Customer reviews" },
  { key: "instagram", label: "Instagram feed", hint: "Social gallery" },
  { key: "blog", label: "Blog teasers", hint: "Parenting tips" },
  { key: "custom", label: "Custom text block", hint: "Free heading + text" },
] as const;

const DEVICES = [
  { key: "desktop", label: "Desktop", icon: Monitor, width: "100%" },
  { key: "tablet", label: "Tablet", icon: Tablet, width: "820px" },
  { key: "mobile", label: "Mobile", icon: Smartphone, width: "400px" },
] as const;

function AdminBuilder() {
  const { data } = useHomeSections();
  const qc = useQueryClient();
  const [rows, setRows] = useState<HomeSection[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [device, setDevice] = useState<(typeof DEVICES)[number]["key"]>("desktop");
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    if (data) setRows(data);
  }, [data]);

  const refresh = async () => {
    await qc.invalidateQueries({ queryKey: ["cms", "home_sections"] });
    setNonce((n) => n + 1);
  };

  const saveOrder = useMutation({
    mutationFn: async (list: HomeSection[]) => {
      for (const [i, row] of list.entries()) {
        const { error } = await supabase.from("home_sections").update({ position: i }).eq("id", row.id);
        if (error) throw error;
      }
    },
    onSuccess: () => void refresh().then(() => toast.success("Layout order saved")),
    onError: (e: Error) => toast.error(e.message),
  });

  const updateRow = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<HomeSection> }) => {
      const { error } = await supabase.from("home_sections").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => void refresh(),
    onError: (e: Error) => toast.error(e.message),
  });

  const addSection = useMutation({
    mutationFn: async (key: string) => {
      const { error } = await supabase.from("home_sections").insert({
        section_key: key,
        title: "",
        subtitle: "",
        position: rows.length,
        is_visible: true,
      });
      if (error) throw error;
    },
    onSuccess: () => void refresh().then(() => toast.success("Section added")),
    onError: (e: Error) => toast.error(e.message),
  });

  const removeSection = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("home_sections").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => void refresh().then(() => toast.success("Section removed")),
    onError: (e: Error) => toast.error(e.message),
  });

  const onDrop = (targetId: string) => {
    if (!dragId || dragId === targetId) return;
    const from = rows.findIndex((r) => r.id === dragId);
    const to = rows.findIndex((r) => r.id === targetId);
    if (from < 0 || to < 0) return;
    const next = [...rows];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    setRows(next);
    setDragId(null);
    saveOrder.mutate(next);
  };

  const active = rows.find((r) => r.id === selected) ?? null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold">Page builder</h1>
          <p className="text-sm text-muted-foreground">
            Drag sections to reorder your homepage, edit their text, hide or delete them — changes go live instantly.
          </p>
        </div>
        <Button variant="outline" onClick={() => void refresh()}>
          <RotateCcw className="mr-2 h-4 w-4" /> Refresh preview
        </Button>
      </div>

      <div className="grid gap-6 xl:grid-cols-[300px_1fr_320px]">
        {/* Section list */}
        <div className="surface-card space-y-3 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Homepage layout</p>
          <div className="space-y-2">
            {rows.map((row) => (
              <div
                key={row.id}
                draggable
                onDragStart={() => setDragId(row.id)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => onDrop(row.id)}
                onClick={() => setSelected(row.id)}
                className={cn(
                  "flex cursor-grab items-center gap-2 rounded-xl border p-2 text-sm transition-colors active:cursor-grabbing",
                  selected === row.id ? "border-primary bg-secondary" : "border-border hover:bg-secondary/60",
                  !row.is_visible && "opacity-60",
                )}
              >
                <GripVertical className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold">
                    {row.title || LIBRARY.find((l) => l.key === row.section_key)?.label || row.section_key}
                  </span>
                  <span className="block truncate text-[11px] text-muted-foreground">{row.section_key}</span>
                </span>
                <button
                  aria-label={row.is_visible ? "Hide section" : "Show section"}
                  onClick={(e) => {
                    e.stopPropagation();
                    updateRow.mutate({ id: row.id, patch: { is_visible: !row.is_visible } });
                  }}
                  className="rounded-lg p-1 hover:bg-background"
                >
                  {row.is_visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                </button>
              </div>
            ))}
            {!rows.length && (
              <p className="text-xs text-muted-foreground">
                No sections saved yet — add one below to start customising the homepage.
              </p>
            )}
          </div>

          <div className="border-t border-border pt-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Add a section</p>
            <div className="mt-2 space-y-1.5">
              {LIBRARY.map((item) => (
                <button
                  key={item.key}
                  onClick={() => addSection.mutate(item.key)}
                  className="flex w-full items-center gap-2 rounded-xl border border-dashed border-border p-2 text-left text-xs hover:bg-secondary"
                >
                  <Plus className="h-3.5 w-3.5 text-primary" />
                  <span>
                    <span className="block font-semibold">{item.label}</span>
                    <span className="block text-[11px] text-muted-foreground">{item.hint}</span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Live preview */}
        <div className="surface-card overflow-hidden p-3">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-semibold">Live homepage preview</p>
            <div className="flex gap-1">
              {DEVICES.map((d) => (
                <Button key={d.key} size="sm" variant={device === d.key ? "default" : "ghost"} onClick={() => setDevice(d.key)}>
                  <d.icon className="h-4 w-4" />
                  <span className="sr-only">{d.label}</span>
                </Button>
              ))}
            </div>
          </div>
          <div className="flex justify-center rounded-2xl bg-muted/40 p-2">
            <div
              className="overflow-hidden rounded-xl border border-border bg-background"
              style={{ width: DEVICES.find((d) => d.key === device)!.width, height: "72vh" }}
            >
              <iframe key={`${device}-${nonce}`} title="Homepage preview" src="/" className="h-full w-full" />
            </div>
          </div>
        </div>

        {/* Inspector */}
        <div className="surface-card space-y-4 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Section settings</p>
          {active ? (
            <>
              <div className="space-y-1.5">
                <Label>Section type</Label>
                <Input
                  value={active.section_key}
                  onChange={(e) => setRows((r) => r.map((x) => (x.id === active.id ? { ...x, section_key: e.target.value } : x)))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Heading</Label>
                <Input
                  value={active.title ?? ""}
                  onChange={(e) => setRows((r) => r.map((x) => (x.id === active.id ? { ...x, title: e.target.value } : x)))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Sub heading / body</Label>
                <Textarea
                  rows={4}
                  value={active.subtitle ?? ""}
                  onChange={(e) => setRows((r) => r.map((x) => (x.id === active.id ? { ...x, subtitle: e.target.value } : x)))}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  className="flex-1"
                  onClick={() =>
                    updateRow.mutate(
                      {
                        id: active.id,
                        patch: {
                          section_key: active.section_key,
                          title: active.title,
                          subtitle: active.subtitle,
                        },
                      },
                      { onSuccess: () => toast.success("Section updated") },
                    )
                  }
                >
                  Save section
                </Button>
                <Button
                  variant="outline"
                  className="text-destructive"
                  onClick={() => removeSection.mutate(active.id)}
                  aria-label="Delete section"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">Select a section on the left to edit its content.</p>
          )}
        </div>
      </div>
    </div>
  );
}
