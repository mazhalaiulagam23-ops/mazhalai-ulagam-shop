import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Eye, EyeOff, GripVertical, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { NAV_ICON_NAMES, NavIcon } from "@/lib/nav-icons";
import { NAV_LINK_TYPES, navHref, type NavItem } from "@/lib/cms";

export const Route = createFileRoute("/_authenticated/admin/navigation")({
  component: AdminNavigation,
});

type Draft = {
  id?: string;
  label: string;
  icon: string;
  link_type: string;
  link_value: string;
  parent_id: string | null;
  open_new_tab: boolean;
  is_visible: boolean;
};

const emptyDraft: Draft = {
  label: "",
  icon: "",
  link_type: "custom",
  link_value: "/",
  parent_id: null,
  open_new_tab: false,
  is_visible: true,
};

const valueHint: Record<string, string> = {
  home: "No value needed — always links to the homepage.",
  category: "Category slug, e.g. return-gifts",
  product: "Product slug, e.g. wooden-stacking-rings",
  page: "Page path, e.g. /about",
  external: "Full URL, e.g. https://instagram.com/yourstore",
  custom: "Page path, e.g. /shop",
};

function isValidValue(d: Draft) {
  if (d.link_type === "home") return true;
  const v = d.link_value.trim();
  if (!v) return false;
  if (d.link_type === "external") return /^https?:\/\/\S+\.\S+/.test(v);
  return true;
}

function AdminNavigation() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [dragId, setDragId] = useState<string | null>(null);
  const [preview, setPreview] = useState(false);

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["cms-admin", "nav_items"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("nav_items")
        .select("*")
        .order("position", { ascending: true });
      if (error) throw error;
      return data as NavItem[];
    },
  });

  const parents = useMemo(() => rows.filter((r) => !r.parent_id), [rows]);
  const childrenOf = (id: string) => rows.filter((r) => r.parent_id === id);

  const refresh = () => {
    void qc.invalidateQueries({ queryKey: ["cms-admin", "nav_items"] });
    void qc.invalidateQueries({ queryKey: ["cms", "nav_items"] });
  };

  const save = useMutation({
    mutationFn: async (d: Draft) => {
      const payload = {
        label: d.label.trim(),
        icon: d.icon,
        link_type: d.link_type,
        link_value: d.link_type === "home" ? "/" : d.link_value.trim(),
        parent_id: d.parent_id,
        open_new_tab: d.open_new_tab,
        is_visible: d.is_visible,
      };
      if (d.id) {
        const { error } = await supabase.from("nav_items").update(payload).eq("id", d.id);
        if (error) throw new Error(error.message);
      } else {
        const position = rows.length ? Math.max(...rows.map((r) => r.position)) + 1 : 0;
        const { error } = await supabase.from("nav_items").insert({ ...payload, position });
        if (error) throw new Error(error.message);
      }
    },
    onSuccess: () => {
      refresh();
      setOpen(false);
      toast.success("Menu saved — the site menu is updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("nav_items").delete().eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      refresh();
      toast.success("Menu item deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggle = useMutation({
    mutationFn: async ({ id, is_visible }: { id: string; is_visible: boolean }) => {
      const { error } = await supabase.from("nav_items").update({ is_visible }).eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: refresh,
    onError: (e: Error) => toast.error(e.message),
  });

  const reorder = useMutation({
    mutationFn: async (ordered: NavItem[]) => {
      for (let i = 0; i < ordered.length; i++) {
        const { error } = await supabase.from("nav_items").update({ position: i }).eq("id", ordered[i].id);
        if (error) throw new Error(error.message);
      }
    },
    onSuccess: () => {
      refresh();
      toast.success("Menu order updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const onDrop = (targetId: string) => {
    if (!dragId || dragId === targetId) return;
    const list = [...parents];
    const from = list.findIndex((r) => r.id === dragId);
    const to = list.findIndex((r) => r.id === targetId);
    if (from < 0 || to < 0) return;
    const [moved] = list.splice(from, 1);
    list.splice(to, 0, moved);
    setDragId(null);
    reorder.mutate(list);
  };

  const startEdit = (row: NavItem) => {
    setDraft({
      id: row.id,
      label: row.label,
      icon: row.icon ?? "",
      link_type: row.link_type,
      link_value: row.link_value,
      parent_id: row.parent_id,
      open_new_tab: row.open_new_tab,
      is_visible: row.is_visible,
    });
    setOpen(true);
  };

  const renderRow = (row: NavItem, isChild = false) => (
    <div
      key={row.id}
      draggable={!isChild}
      onDragStart={() => setDragId(row.id)}
      onDragOver={(e) => !isChild && e.preventDefault()}
      onDrop={() => !isChild && onDrop(row.id)}
      className={`flex items-center gap-3 rounded-xl border border-border bg-card p-3 ${isChild ? "ml-8" : ""}`}
    >
      {!isChild && <GripVertical className="h-4 w-4 shrink-0 cursor-grab text-muted-foreground" />}
      <NavIcon name={row.icon} className="h-4 w-4 text-teal" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">{row.label}</p>
        <p className="truncate text-xs text-muted-foreground">
          {NAV_LINK_TYPES.find((t) => t.value === row.link_type)?.label ?? "Custom"} · {navHref(row)}
        </p>
      </div>
      <Button
        variant="ghost"
        size="icon"
        aria-label={row.is_visible ? "Hide" : "Show"}
        onClick={() => toggle.mutate({ id: row.id, is_visible: !row.is_visible })}
      >
        {row.is_visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4 text-muted-foreground" />}
      </Button>
      <Button variant="ghost" size="icon" aria-label="Edit" onClick={() => startEdit(row)}>
        <Pencil className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        aria-label="Delete"
        onClick={() => {
          if (confirm(`Delete "${row.label}"?`)) remove.mutate(row.id);
        }}
      >
        <Trash2 className="h-4 w-4 text-destructive" />
      </Button>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold">Navigation</h1>
          <p className="text-sm text-muted-foreground">
            Build the green menu bar — drag to reorder, add submenus, pick icons and links.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setPreview((p) => !p)}>
            {preview ? "Hide preview" : "Preview"}
          </Button>
          <Button
            onClick={() => {
              setDraft(emptyDraft);
              setOpen(true);
            }}
          >
            <Plus className="h-4 w-4" /> Add menu item
          </Button>
        </div>
      </div>

      {preview && (
        <div className="overflow-hidden rounded-xl border border-border">
          <div className="gradient-teal flex flex-wrap items-center gap-1 p-3 text-sm font-semibold text-teal-foreground">
            {parents
              .filter((p) => p.is_visible)
              .map((p) => (
                <span key={p.id} className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5">
                  <NavIcon name={p.icon} className="h-4 w-4" />
                  {p.label}
                  {childrenOf(p.id).length > 0 && <span className="text-xs opacity-80">▾</span>}
                </span>
              ))}
          </div>
          <p className="bg-muted p-2 text-xs text-muted-foreground">
            This is how the menu bar looks with the currently saved items.
          </p>
        </div>
      )}

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : (
        <div className="space-y-2">
          {parents.map((p) => (
            <div key={p.id} className="space-y-2">
              {renderRow(p)}
              {childrenOf(p.id).map((c) => renderRow(c, true))}
            </div>
          ))}
          {parents.length === 0 && <p className="text-sm text-muted-foreground">No menu items yet.</p>}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{draft.id ? "Edit menu item" : "Add menu item"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="nav-label">Menu name</Label>
              <Input
                id="nav-label"
                value={draft.label}
                onChange={(e) => setDraft((d) => ({ ...d, label: e.target.value }))}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="nav-icon">Icon</Label>
              <select
                id="nav-icon"
                value={draft.icon}
                onChange={(e) => setDraft((d) => ({ ...d, icon: e.target.value }))}
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="">No icon</option>
                {NAV_ICON_NAMES.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                Preview: <NavIcon name={draft.icon} className="h-4 w-4 text-teal" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="nav-type">Links to</Label>
              <select
                id="nav-type"
                value={draft.link_type}
                onChange={(e) => setDraft((d) => ({ ...d, link_type: e.target.value }))}
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                {NAV_LINK_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            {draft.link_type !== "home" && (
              <div className="space-y-1.5">
                <Label htmlFor="nav-value">Link</Label>
                <Input
                  id="nav-value"
                  value={draft.link_value}
                  placeholder={valueHint[draft.link_type]}
                  onChange={(e) => setDraft((d) => ({ ...d, link_value: e.target.value }))}
                />
                <p className="text-xs text-muted-foreground">{valueHint[draft.link_type]}</p>
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="nav-parent">Parent menu (creates a dropdown)</Label>
              <select
                id="nav-parent"
                value={draft.parent_id ?? ""}
                onChange={(e) => setDraft((d) => ({ ...d, parent_id: e.target.value || null }))}
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="">Top level</option>
                {parents
                  .filter((p) => p.id !== draft.id)
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.label}
                    </option>
                  ))}
              </select>
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="nav-visible">Show in menu</Label>
              <Switch
                id="nav-visible"
                checked={draft.is_visible}
                onCheckedChange={(v) => setDraft((d) => ({ ...d, is_visible: v }))}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="nav-tab">Open in new tab</Label>
              <Switch
                id="nav-tab"
                checked={draft.open_new_tab}
                onCheckedChange={(v) => setDraft((d) => ({ ...d, open_new_tab: v }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={save.isPending}
              onClick={() => {
                if (!draft.label.trim()) return toast.error("Menu name is required");
                if (!isValidValue(draft)) return toast.error("Please enter a valid link");
                save.mutate(draft);
              }}
            >
              {save.isPending && <Loader2 className="h-4 w-4 animate-spin" />} Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
