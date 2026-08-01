import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { logAdminActivity } from "@/lib/security.functions";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ImageUploader } from "@/components/admin/ImageUploader";
import { RichTextEditor } from "@/components/admin/RichTextEditor";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert } from "@/integrations/supabase/types";
import { categories } from "@/data/catalog";

export const Route = createFileRoute("/_authenticated/admin/products")({
  component: AdminProducts,
});

type Product = Tables<"products">;

const STATUSES = [
  { value: "active", label: "Active" },
  { value: "draft", label: "Draft" },
  { value: "hidden", label: "Hidden" },
  { value: "out_of_stock", label: "Out of stock" },
];

const inr = (n: number) => `₹${Number(n).toLocaleString("en-IN")}`;

const slugify = (s: string) =>
  s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const makeSku = (name: string, category: string) => {
  const part = (v: string) => (v.replace(/[^a-zA-Z0-9]/g, "").slice(0, 3) || "MU").toUpperCase();
  return `MU-${part(category)}-${part(name)}-${Math.floor(1000 + Math.random() * 9000)}`;
};

type FormState = {
  name: string;
  slug: string;
  category_slug: string;
  subcategory: string;
  brand: string;
  sku: string;
  barcode: string;
  hsn_code: string;
  gst_percent: string;
  price: string;
  mrp: string;
  cost_price: string;
  offer_price: string;
  discount_percent: string;
  tax_inclusive: boolean;
  stock: string;
  low_stock_alert: string;
  unit: string;
  weight_grams: string;
  dimensions: string;
  age_group: string;
  gender: string;
  size: string;
  color: string;
  material: string;
  tags: string;
  short_description: string;
  description: string;
  specifications: string;
  care_instructions: string;
  seo_title: string;
  seo_description: string;
  seo_keywords: string;
  status: string;
  is_active: boolean;
  is_featured: boolean;
  is_new_arrival: boolean;
  is_best_seller: boolean;
  is_trending: boolean;
  images: string[];
  cover_image: string | null;
};

const emptyForm: FormState = {
  name: "",
  slug: "",
  category_slug: categories[0]?.slug ?? "",
  subcategory: "",
  brand: "",
  sku: "",
  barcode: "",
  hsn_code: "",
  gst_percent: "0",
  price: "0",
  mrp: "0",
  cost_price: "0",
  offer_price: "",
  discount_percent: "0",
  tax_inclusive: true,
  stock: "0",
  low_stock_alert: "5",
  unit: "piece",
  weight_grams: "0",
  dimensions: "",
  age_group: "1-3y",
  gender: "unisex",
  size: "",
  color: "",
  material: "",
  tags: "",
  short_description: "",
  description: "",
  specifications: "",
  care_instructions: "",
  seo_title: "",
  seo_description: "",
  seo_keywords: "",
  status: "active",
  is_active: true,
  is_featured: false,
  is_new_arrival: false,
  is_best_seller: false,
  is_trending: false,
  images: [],
  cover_image: null,
};

const fromProduct = (p: Product): FormState => ({
  name: p.name,
  slug: p.slug,
  category_slug: p.category_slug,
  subcategory: p.subcategory ?? "",
  brand: p.brand ?? "",
  sku: p.sku ?? "",
  barcode: p.barcode ?? "",
  hsn_code: p.hsn_code ?? "",
  gst_percent: String(p.gst_percent ?? 0),
  price: String(p.price),
  mrp: String(p.mrp),
  cost_price: String(p.cost_price ?? 0),
  offer_price: p.offer_price ? String(p.offer_price) : "",
  discount_percent: String(p.discount_percent ?? 0),
  tax_inclusive: p.tax_inclusive ?? true,
  stock: String(p.stock),
  low_stock_alert: String(p.low_stock_alert ?? 5),
  unit: p.unit ?? "piece",
  weight_grams: String(p.weight_grams ?? 0),
  dimensions: p.dimensions ?? "",
  age_group: p.age_group,
  gender: p.gender ?? "unisex",
  size: p.size ?? "",
  color: p.color ?? "",
  material: p.material ?? "",
  tags: (p.tags ?? []).join(", "),
  short_description: p.short_description,
  description: p.description,
  specifications: p.specifications ?? "",
  care_instructions: p.care_instructions ?? "",
  seo_title: p.seo_title ?? "",
  seo_description: p.seo_description ?? "",
  seo_keywords: p.seo_keywords ?? "",
  status: p.status ?? "active",
  is_active: p.is_active,
  is_featured: p.is_featured ?? false,
  is_new_arrival: p.is_new_arrival ?? false,
  is_best_seller: p.is_best_seller ?? false,
  is_trending: p.is_trending ?? false,
  images: p.images ?? [],
  cover_image: p.cover_image,
});

const schema = z.object({
  name: z.string().trim().min(2, "Product name is required").max(140),
  slug: z
    .string()
    .trim()
    .min(2, "Slug is required")
    .max(140)
    .regex(/^[a-z0-9-]+$/, "Slug can use lowercase letters, numbers and hyphens only"),
  category_slug: z.string().trim().min(2, "Category is required"),
  price: z.number().min(0).max(1_000_000),
  mrp: z.number().min(0).max(1_000_000),
  stock: z.number().int().min(0).max(100_000),
});

function AdminProducts() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Product | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["admin", "products"],
    queryFn: async () => {
      const { data, error } = await supabase.from("products").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Auto slug + SKU while creating a new product
  useEffect(() => {
    if (editing) return;
    setForm((f) => ({
      ...f,
      slug: slugify(f.name),
      sku: f.name.trim().length > 1 && !f.sku ? makeSku(f.name, f.category_slug) : f.sku,
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.name, editing]);

  const derivedDiscount = useMemo(() => {
    const mrp = Number(form.mrp) || 0;
    const sell = Number(form.offer_price) || Number(form.price) || 0;
    if (!mrp || sell >= mrp) return 0;
    return Math.round(((mrp - sell) / mrp) * 100);
  }, [form.mrp, form.price, form.offer_price]);

  const save = useMutation({
    mutationFn: async () => {
      const parsed = schema.safeParse({
        name: form.name,
        slug: form.slug,
        category_slug: form.category_slug,
        price: Number(form.price),
        mrp: Number(form.mrp),
        stock: Number(form.stock),
      });
      if (!parsed.success) throw new Error(parsed.error.issues[0].message);

      const payload: TablesInsert<"products"> = {
        name: form.name.trim(),
        slug: form.slug.trim(),
        category_slug: form.category_slug,
        subcategory: form.subcategory.trim(),
        brand: form.brand.trim(),
        sku: form.sku.trim() || makeSku(form.name, form.category_slug),
        barcode: form.barcode.trim() || null,
        hsn_code: form.hsn_code.trim() || null,
        gst_percent: Number(form.gst_percent) || 0,
        price: Number(form.price) || 0,
        mrp: Number(form.mrp) || 0,
        cost_price: Number(form.cost_price) || 0,
        offer_price: form.offer_price ? Number(form.offer_price) : null,
        discount_percent: Number(form.discount_percent) || derivedDiscount,
        tax_inclusive: form.tax_inclusive,
        stock: Number(form.stock) || 0,
        low_stock_alert: Number(form.low_stock_alert) || 0,
        unit: form.unit,
        weight_grams: Number(form.weight_grams) || 0,
        dimensions: form.dimensions.trim(),
        age_group: form.age_group,
        gender: form.gender,
        size: form.size.trim(),
        color: form.color.trim(),
        material: form.material.trim(),
        tags: form.tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        short_description: form.short_description.trim().slice(0, 300),
        description: form.description,
        specifications: form.specifications.trim(),
        care_instructions: form.care_instructions.trim(),
        seo_title: form.seo_title.trim().slice(0, 70),
        seo_description: form.seo_description.trim().slice(0, 180),
        seo_keywords: form.seo_keywords.trim(),
        status: form.status,
        is_active: form.is_active && form.status === "active",
        is_featured: form.is_featured,
        is_new_arrival: form.is_new_arrival,
        is_best_seller: form.is_best_seller,
        is_trending: form.is_trending,
        images: form.images,
        cover_image: form.cover_image ?? form.images[0] ?? null,
      };

      const query = editing
        ? supabase.from("products").update(payload).eq("id", editing.id)
        : supabase.from("products").insert(payload);
      const { error } = await query;
      if (error) throw error;
      await logAdminActivity({
        data: {
          action: editing ? "update" : "create",
          module: "products",
          entityId: editing?.id ?? payload.slug,
          summary: `${editing ? "Updated" : "Added"} product “${payload.name}”`,
        },
      }).catch(() => undefined);
    },
    onSuccess: () => {
      toast.success(editing ? "Product updated" : "Product added");
      setOpen(false);
      setEditing(null);
      setForm(emptyForm);
      void qc.invalidateQueries({ queryKey: ["admin", "products"] });
      void qc.invalidateQueries({ queryKey: ["catalog", "products"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from("products")
        .update({ is_active, status: is_active ? "active" : "hidden" })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["admin", "products"] });
      void qc.invalidateQueries({ queryKey: ["catalog", "products"] });
    },
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
      void qc.invalidateQueries({ queryKey: ["catalog", "products"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const openFor = (product: Product | null) => {
    setEditing(product);
    setForm(product ? fromProduct(product) : emptyForm);
    setOpen(true);
  };

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    save.mutate();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-bold">Products</h1>
        <Button onClick={() => openFor(null)}>
          <Plus className="mr-1 h-4 w-4" /> Add product
        </Button>
      </div>

      <Dialog
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) {
            setEditing(null);
            setForm(emptyForm);
          }
        }}
      >
        <DialogContent className="max-h-[88vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit product" : "Add product"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={onSubmit} className="space-y-4" noValidate>
            <Tabs defaultValue="basic">
              <TabsList className="flex w-full flex-wrap">
                <TabsTrigger value="basic">Basic</TabsTrigger>
                <TabsTrigger value="pricing">Pricing</TabsTrigger>
                <TabsTrigger value="inventory">Inventory</TabsTrigger>
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="images">Images</TabsTrigger>
                <TabsTrigger value="content">Description</TabsTrigger>
                <TabsTrigger value="seo">SEO</TabsTrigger>
                <TabsTrigger value="status">Status</TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-3 pt-4">
                <Field label="Product name" value={form.name} onChange={(v) => set("name", v)} />
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Slug (auto)" value={form.slug} onChange={(v) => set("slug", slugify(v))} />
                  <div>
                    <Label>Category</Label>
                    <Select value={form.category_slug} onValueChange={(v) => set("category_slug", v)}>
                      <SelectTrigger className="mt-1.5">
                        <SelectValue placeholder="Choose category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((c) => (
                          <SelectItem key={c.slug} value={c.slug}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Field label="Subcategory" value={form.subcategory} onChange={(v) => set("subcategory", v)} />
                  <Field label="Brand" value={form.brand} onChange={(v) => set("brand", v)} />
                  <div className="flex items-end gap-2">
                    <div className="flex-1">
                      <Field label="SKU" value={form.sku} onChange={(v) => set("sku", v)} />
                    </div>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => set("sku", makeSku(form.name || "product", form.category_slug))}
                    >
                      Generate
                    </Button>
                  </div>
                  <Field label="Barcode / EAN" value={form.barcode} onChange={(v) => set("barcode", v)} />
                  <Field label="HSN code" value={form.hsn_code} onChange={(v) => set("hsn_code", v)} />
                  <Field label="GST %" type="number" value={form.gst_percent} onChange={(v) => set("gst_percent", v)} />
                </div>
              </TabsContent>

              <TabsContent value="pricing" className="space-y-3 pt-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Selling price (₹)" type="number" value={form.price} onChange={(v) => set("price", v)} />
                  <Field label="MRP (₹)" type="number" value={form.mrp} onChange={(v) => set("mrp", v)} />
                  <Field label="Cost price (₹)" type="number" value={form.cost_price} onChange={(v) => set("cost_price", v)} />
                  <Field label="Offer price (₹)" type="number" value={form.offer_price} onChange={(v) => set("offer_price", v)} />
                  <div>
                    <Field
                      label="Discount %"
                      type="number"
                      value={form.discount_percent}
                      onChange={(v) => set("discount_percent", v)}
                    />
                    <button
                      type="button"
                      className="mt-1 text-xs text-primary underline"
                      onClick={() => set("discount_percent", String(derivedDiscount))}
                    >
                      Use calculated {derivedDiscount}%
                    </button>
                  </div>
                </div>
                <ToggleRow
                  label="Tax inclusive pricing"
                  description={form.tax_inclusive ? "Prices include GST" : "GST added at checkout"}
                  checked={form.tax_inclusive}
                  onChange={(v) => set("tax_inclusive", v)}
                />
              </TabsContent>

              <TabsContent value="inventory" className="space-y-3 pt-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Stock" type="number" value={form.stock} onChange={(v) => set("stock", v)} />
                  <Field
                    label="Low stock alert"
                    type="number"
                    value={form.low_stock_alert}
                    onChange={(v) => set("low_stock_alert", v)}
                  />
                  <div>
                    <Label>Unit</Label>
                    <Select value={form.unit} onValueChange={(v) => set("unit", v)}>
                      <SelectTrigger className="mt-1.5">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {["piece", "set", "pack", "pair", "box", "kg", "litre"].map((u) => (
                          <SelectItem key={u} value={u}>
                            {u}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Field label="Weight (grams)" type="number" value={form.weight_grams} onChange={(v) => set("weight_grams", v)} />
                  <Field
                    label="Dimensions (L × W × H cm)"
                    value={form.dimensions}
                    onChange={(v) => set("dimensions", v)}
                  />
                </div>
              </TabsContent>

              <TabsContent value="details" className="space-y-3 pt-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <Label>Age group</Label>
                    <Select value={form.age_group} onValueChange={(v) => set("age_group", v)}>
                      <SelectTrigger className="mt-1.5">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {["0-6m", "6-12m", "1-3y", "3-6y", "6y+"].map((a) => (
                          <SelectItem key={a} value={a}>
                            {a}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Gender</Label>
                    <Select value={form.gender} onValueChange={(v) => set("gender", v)}>
                      <SelectTrigger className="mt-1.5">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {["unisex", "boy", "girl"].map((g) => (
                          <SelectItem key={g} value={g}>
                            {g}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Field label="Size" value={form.size} onChange={(v) => set("size", v)} />
                  <Field label="Colour" value={form.color} onChange={(v) => set("color", v)} />
                  <Field label="Material" value={form.material} onChange={(v) => set("material", v)} />
                  <Field label="Tags (comma separated)" value={form.tags} onChange={(v) => set("tags", v)} />
                </div>
              </TabsContent>

              <TabsContent value="images" className="pt-4">
                <ImageUploader
                  images={form.images}
                  cover={form.cover_image}
                  onChange={(images, cover) => setForm((f) => ({ ...f, images, cover_image: cover }))}
                />
              </TabsContent>

              <TabsContent value="content" className="space-y-3 pt-4">
                <div>
                  <Label htmlFor="short_description">Short description</Label>
                  <Textarea
                    id="short_description"
                    rows={2}
                    maxLength={300}
                    className="mt-1.5"
                    value={form.short_description}
                    onChange={(e) => set("short_description", e.target.value)}
                  />
                </div>
                <div>
                  <Label>Full description</Label>
                  <RichTextEditor
                    className="mt-1.5"
                    value={form.description}
                    placeholder="Describe the product…"
                    onChange={(v) => set("description", v)}
                  />
                </div>
                <div>
                  <Label htmlFor="specifications">Specifications (one per line, e.g. Material: Cotton)</Label>
                  <Textarea
                    id="specifications"
                    rows={3}
                    className="mt-1.5"
                    value={form.specifications}
                    onChange={(e) => set("specifications", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="care_instructions">Care instructions</Label>
                  <Textarea
                    id="care_instructions"
                    rows={2}
                    className="mt-1.5"
                    value={form.care_instructions}
                    onChange={(e) => set("care_instructions", e.target.value)}
                  />
                </div>
              </TabsContent>

              <TabsContent value="seo" className="space-y-3 pt-4">
                <Field label="SEO title (max 70)" value={form.seo_title} onChange={(v) => set("seo_title", v)} />
                <div>
                  <Label htmlFor="seo_description">SEO description (max 180)</Label>
                  <Textarea
                    id="seo_description"
                    rows={2}
                    maxLength={180}
                    className="mt-1.5"
                    value={form.seo_description}
                    onChange={(e) => set("seo_description", e.target.value)}
                  />
                </div>
                <Field
                  label="SEO keywords (comma separated)"
                  value={form.seo_keywords}
                  onChange={(v) => set("seo_keywords", v)}
                />
              </TabsContent>

              <TabsContent value="status" className="space-y-3 pt-4">
                <div>
                  <Label>Product status</Label>
                  <Select
                    value={form.status}
                    onValueChange={(v) => setForm((f) => ({ ...f, status: v, is_active: v === "active" }))}
                  >
                    <SelectTrigger className="mt-1.5">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUSES.map((s) => (
                        <SelectItem key={s.value} value={s.value}>
                          {s.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="mt-1 text-xs text-muted-foreground">Only Active products appear on the storefront.</p>
                </div>
                <ToggleRow label="Featured product" checked={form.is_featured} onChange={(v) => set("is_featured", v)} />
                <ToggleRow label="New arrival" checked={form.is_new_arrival} onChange={(v) => set("is_new_arrival", v)} />
                <ToggleRow label="Best seller" checked={form.is_best_seller} onChange={(v) => set("is_best_seller", v)} />
                <ToggleRow label="Trending product" checked={form.is_trending} onChange={(v) => set("is_trending", v)} />
              </TabsContent>
            </Tabs>

            <Button type="submit" className="w-full" disabled={save.isPending}>
              {save.isPending ? "Saving…" : editing ? "Save changes" : "Add product"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <div className="surface-card overflow-x-auto p-4">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading products…</p>
        ) : products.length === 0 ? (
          <p className="text-sm text-muted-foreground">No products yet. Add your first product to get started.</p>
        ) : (
          <table className="w-full min-w-[760px] text-sm">
            <thead className="text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="py-2">Product</th>
                <th>Category</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Status</th>
                <th>Active</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} className="border-t border-border/60">
                  <td className="py-2">
                    <div className="flex items-center gap-2">
                      {(p.cover_image || p.images?.[0]) && (
                        <img
                          src={p.cover_image ?? p.images[0]}
                          alt={p.name}
                          className="h-9 w-9 rounded object-cover"
                        />
                      )}
                      <div>
                        <p className="font-medium">{p.name}</p>
                        <p className="text-xs text-muted-foreground">{p.sku}</p>
                      </div>
                    </div>
                  </td>
                  <td className="text-muted-foreground">{p.category_slug}</td>
                  <td>{inr(p.offer_price || p.price)}</td>
                  <td className={p.stock <= (p.low_stock_alert ?? 0) ? "text-destructive" : ""}>{p.stock}</td>
                  <td className="capitalize text-muted-foreground">{p.status?.replace("_", " ")}</td>
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
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  const id = label.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} type={type} value={value} onChange={(e) => onChange(e.target.value)} className="mt-1.5" />
    </div>
  );
}

function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-border p-3">
      <div>
        <p className="text-sm font-medium">{label}</p>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}
