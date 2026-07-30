import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowDown, ArrowUp, Loader2, Pencil, Plus, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RichTextEditor } from "@/components/admin/RichTextEditor";
import { uploadImage } from "@/lib/upload";

export type FieldType = "text" | "textarea" | "number" | "switch" | "image" | "richtext";

export type FieldDef = {
  key: string;
  label: string;
  type?: FieldType;
  placeholder?: string;
  help?: string;
};

type Row = Record<string, unknown> & { id: string };

// The CMS tables share the same CRUD shape; a loosely typed client keeps this generic.
const db = supabase as unknown as {
  from: (table: string) => {
    select: (cols: string) => {
      order: (col: string, opts: { ascending: boolean }) => Promise<{ data: Row[] | null; error: unknown }>;
    };
    insert: (values: Record<string, unknown>) => Promise<{ error: { message: string } | null }>;
    update: (values: Record<string, unknown>) => {
      eq: (col: string, val: string) => Promise<{ error: { message: string } | null }>;
    };
    delete: () => { eq: (col: string, val: string) => Promise<{ error: { message: string } | null }> };
  };
};

function ImageField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [busy, setBusy] = useState(false);
  return (
    <div className="space-y-2">
      {value ? (
        <img src={value} alt="" className="h-20 w-20 rounded-lg border border-border object-cover" />
      ) : null}
      <div className="flex items-center gap-2">
        <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder="Image URL" />
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
                  onChange(await uploadImage(file));
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
    </div>
  );
}

/**
 * Generic add / edit / delete / reorder editor for a CMS table.
 * Reordering is enabled when the table has a `position` column.
 */
export function CollectionEditor({
  table,
  title,
  description,
  fields,
  defaults,
  rowTitle,
  rowSubtitle,
  orderBy = "position",
  reorder = true,
}: {
  table: string;
  title: string;
  description?: string;
  fields: FieldDef[];
  defaults: Record<string, unknown>;
  rowTitle: (row: Row) => string;
  rowSubtitle?: (row: Row) => string;
  orderBy?: string;
  reorder?: boolean;
}) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Row | null>(null);
  const [form, setForm] = useState<Record<string, unknown>>(defaults);

  const key = ["cms-admin", table];
  const { data: rows = [], isLoading } = useQuery({
    queryKey: key,
    queryFn: async () => {
      const { data, error } = await db.from(table).select("*").order(orderBy, { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: key });
    void qc.invalidateQueries({ queryKey: ["cms"] });
  };

  const save = useMutation({
    mutationFn: async () => {
      const payload = { ...form };
      if (editing) {
        const { error } = await db.from(table).update(payload).eq("id", editing.id);
        if (error) throw new Error(error.message);
      } else {
        if (reorder) payload.position = rows.length + 1;
        const { error } = await db.from(table).insert(payload);
        if (error) throw new Error(error.message);
      }
    },
    onSuccess: () => {
      invalidate();
      setOpen(false);
      toast.success(editing ? "Updated" : "Added");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await db.from(table).delete().eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      invalidate();
      toast.success("Deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const move = useMutation({
    mutationFn: async ({ index, dir }: { index: number; dir: -1 | 1 }) => {
      const a = rows[index];
      const b = rows[index + dir];
      if (!a || !b) return;
      await db.from(table).update({ position: index + dir + 1 }).eq("id", a.id);
      await db.from(table).update({ position: index + 1 }).eq("id", b.id);
    },
    onSuccess: invalidate,
  });

  const openNew = () => {
    setEditing(null);
    setForm(defaults);
    setOpen(true);
  };

  const openEdit = (row: Row) => {
    setEditing(row);
    const next: Record<string, unknown> = {};
    for (const f of fields) next[f.key] = row[f.key] ?? defaults[f.key];
    setForm(next);
    setOpen(true);
  };

  return (
    <section className="surface-card p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-bold">{title}</h2>
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </div>
        <Button size="sm" onClick={openNew}>
          <Plus className="h-4 w-4" /> Add
        </Button>
      </div>

      <ul className="mt-4 divide-y divide-border/60">
        {isLoading && <li className="py-3 text-sm text-muted-foreground">Loading…</li>}
        {!isLoading && rows.length === 0 && (
          <li className="py-3 text-sm text-muted-foreground">Nothing here yet.</li>
        )}
        {rows.map((row, i) => (
          <li key={row.id} className="flex items-center gap-3 py-3">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{rowTitle(row)}</p>
              {rowSubtitle && (
                <p className="truncate text-xs text-muted-foreground">{rowSubtitle(row)}</p>
              )}
            </div>
            {reorder && (
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Move up"
                  disabled={i === 0}
                  onClick={() => move.mutate({ index: i, dir: -1 })}
                >
                  <ArrowUp className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Move down"
                  disabled={i === rows.length - 1}
                  onClick={() => move.mutate({ index: i, dir: 1 })}
                >
                  <ArrowDown className="h-4 w-4" />
                </Button>
              </div>
            )}
            <Button variant="ghost" size="icon" aria-label="Edit" onClick={() => openEdit(row)}>
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Delete"
              className="text-destructive"
              onClick={() => {
                if (confirm("Delete this item?")) remove.mutate(row.id);
              }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </li>
        ))}
      </ul>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Edit" : "Add"} — {title}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {fields.map((f) => {
              const value = form[f.key];
              const id = `${table}-${f.key}`;
              return (
                <div key={f.key} className="space-y-1.5">
                  <Label htmlFor={id}>{f.label}</Label>
                  {f.type === "textarea" ? (
                    <Textarea
                      id={id}
                      value={String(value ?? "")}
                      placeholder={f.placeholder}
                      onChange={(e) => setForm((s) => ({ ...s, [f.key]: e.target.value }))}
                    />
                  ) : f.type === "richtext" ? (
                    <RichTextEditor
                      value={String(value ?? "")}
                      placeholder={f.placeholder}
                      onChange={(html) => setForm((s) => ({ ...s, [f.key]: html }))}
                    />
                  ) : f.type === "switch" ? (
                    <div className="flex items-center gap-2">
                      <Switch
                        id={id}
                        checked={Boolean(value)}
                        onCheckedChange={(v) => setForm((s) => ({ ...s, [f.key]: v }))}
                      />
                      <span className="text-sm text-muted-foreground">{f.help ?? "Enabled"}</span>
                    </div>
                  ) : f.type === "image" ? (
                    <ImageField
                      value={String(value ?? "")}
                      onChange={(v) => setForm((s) => ({ ...s, [f.key]: v }))}
                    />
                  ) : (
                    <Input
                      id={id}
                      type={f.type === "number" ? "number" : "text"}
                      value={String(value ?? "")}
                      placeholder={f.placeholder}
                      onChange={(e) =>
                        setForm((s) => ({
                          ...s,
                          [f.key]: f.type === "number" ? Number(e.target.value) : e.target.value,
                        }))
                      }
                    />
                  )}
                  {f.help && f.type !== "switch" && (
                    <p className="text-xs text-muted-foreground">{f.help}</p>
                  )}
                </div>
              );
            })}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => save.mutate()} disabled={save.isPending}>
              {save.isPending && <Loader2 className="h-4 w-4 animate-spin" />} Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
