import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export const Route = createFileRoute("/_authenticated/admin/products")({
  component: AdminProducts,
});

type Product = Tables<"products">;

const productSchema = z.object({
  name: z.string().trim().min(2, "Name is required").max(120),
  slug: z
    .string()
    .trim()
    .min(2, "Slug is required")
    .max(120)
    .regex(/^[a-z0-9-]+$/, "Slug can use lowercase letters, numbers and hyphens only"),
  category_slug: z.string().trim().min(2, "Category is required").max(60),
  price: z.coerce.number().min(0).max(1_000_000),
  mrp: z.coerce.number().min(0).max(1_000_000),
  stock: z.coerce.number().int().min(0).max(100_000),
  sku: z.string().trim().max(60).optional(),
  age_group: z.string().trim().max(40).optional(),
  short_description: z.string().trim().max(300).optional(),
  description: z.string().trim().max(2000).optional(),
  images: z.string().trim().max(2000).optional(),
});

const inr = (n: number) => `₹${Number(n).toLocaleString("en-IN")}`;

function AdminProducts() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Product | null>(null);
  const [open, setOpen] = useState(false);

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["admin", "products"],
    queryFn: async () => {
      const { data, error } = await supabase.from("products").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const save = useMutation({
    mutationFn: async (form: HTMLFormElement) => {
      const raw = Object.fromEntries(new FormData(form)) as Record<string, string>;
      const parsed = productSchema.safeParse(raw);
      if (!parsed.success) throw new Error(parsed.error.issues[0].message);
      const v = parsed.data;
      const payload = {
        name: v.name,
        slug: v.slug,
        category_slug: v.category_slug,
        price: v.price,
        mrp: v.mrp,
        stock: v.stock,
        sku: v.sku || null,
        age_group: v.age_group || "All ages",
        short_description: v.short_description || "",
        description: v.description || "",
        images: (v.images || "")
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
      };
      const query = editing
        ? supabase.from("products").update(payload).eq("id", editing.id)
        : supabase.from("products").insert(payload);
      const { error } = await query;
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(editing ? "Product updated" : "Product added");
      setOpen(false);
      setEditing(null);
      void qc.invalidateQueries({ queryKey: ["admin", "products"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from("products").update({ is_active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["admin", "products"] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Product deleted");
      void qc.invalidateQueries({ queryKey: ["admin", "products"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    save.mutate(e.currentTarget);
  };

  const openFor = (product: Product | null) => {
    setEditing(product);
    setOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-bold">Products</h1>
        <Dialog
          open={open}
          onOpenChange={(next) => {
            setOpen(next);
            if (!next) setEditing(null);
          }}
        >
          <DialogTrigger asChild>
            <Button onClick={() => openFor(null)}>
              <Plus className="mr-1 h-4 w-4" /> Add product
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>{editing ? "Edit product" : "Add product"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={onSubmit} className="space-y-3" noValidate>
              <Field label="Name" name="name" defaultValue={editing?.name} required />
              <div className="grid grid-cols-2 gap-3">
                <Field label="Slug" name="slug" defaultValue={editing?.slug} required />
                <Field label="Category slug" name="category_slug" defaultValue={editing?.category_slug} required />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <Field label="Price (₹)" name="price" type="number" defaultValue={editing?.price ?? 0} required />
                <Field label="MRP (₹)" name="mrp" type="number" defaultValue={editing?.mrp ?? 0} required />
                <Field label="Stock" name="stock" type="number" defaultValue={editing?.stock ?? 0} required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="SKU" name="sku" defaultValue={editing?.sku ?? ""} />
                <Field label="Age group" name="age_group" defaultValue={editing?.age_group ?? ""} />
              </div>
              <Field label="Short description" name="short_description" defaultValue={editing?.short_description ?? ""} />
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" name="description" rows={3} defaultValue={editing?.description ?? ""} className="mt-1.5" />
              </div>
              <Field
                label="Image URLs (comma separated)"
                name="images"
                defaultValue={(editing?.images ?? []).join(", ")}
              />
              <Button type="submit" className="w-full" disabled={save.isPending}>
                {editing ? "Save changes" : "Add product"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="surface-card overflow-x-auto p-4">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading products…</p>
        ) : products.length === 0 ? (
          <p className="text-sm text-muted-foreground">No products yet. Add your first product to get started.</p>
        ) : (
          <table className="w-full min-w-[720px] text-sm">
            <thead className="text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="py-2">Product</th>
                <th>Category</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Active</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} className="border-t border-border/60">
                  <td className="py-2 font-medium">{p.name}</td>
                  <td className="text-muted-foreground">{p.category_slug}</td>
                  <td>{inr(p.price)}</td>
                  <td className={p.stock === 0 ? "text-destructive" : ""}>{p.stock}</td>
                  <td>
                    <Switch
                      checked={p.is_active}
                      onCheckedChange={(v) => toggleActive.mutate({ id: p.id, is_active: v })}
                    />
                  </td>
                  <td className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => openFor(p)} aria-label="Edit product">
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Delete product"
                      onClick={() => {
                        if (confirm(`Delete "${p.name}"?`)) remove.mutate(p.id);
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function Field({
  label,
  name,
  type = "text",
  defaultValue,
  required,
}: {
  label: string;
  name: string;
  type?: string;
  defaultValue?: string | number;
  required?: boolean;
}) {
  return (
    <div>
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} type={type} defaultValue={defaultValue} required={required} className="mt-1.5" />
    </div>
  );
}
