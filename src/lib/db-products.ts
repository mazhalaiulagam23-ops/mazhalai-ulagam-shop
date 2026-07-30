import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { products as staticProducts, type Product } from "@/data/catalog";
import type { Tables } from "@/integrations/supabase/types";

export type DbProduct = Tables<"products">;

const AGE_GROUPS = ["0-6m", "6-12m", "1-3y", "3-6y", "6y+"] as const;
type AgeGroup = (typeof AGE_GROUPS)[number];

const toAgeGroup = (value: string): AgeGroup =>
  (AGE_GROUPS as readonly string[]).includes(value) ? (value as AgeGroup) : "1-3y";

const toBadge = (row: DbProduct): Product["badge"] => {
  if (row.is_best_seller) return "Bestseller";
  if (row.is_new_arrival) return "New";
  if (row.offer_price && row.offer_price < row.price) return "Offer";
  if (row.badge === "Bestseller" || row.badge === "New" || row.badge === "Offer") return row.badge;
  return undefined;
};

/** Maps a database product row onto the shape the storefront components expect. */
export function mapDbProduct(row: DbProduct): Product {
  const images = row.cover_image
    ? [row.cover_image, ...row.images.filter((i) => i !== row.cover_image)]
    : row.images;

  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    category: row.category_slug,
    images: images.length ? images : ["/placeholder.svg"],
    price: row.offer_price && row.offer_price > 0 ? row.offer_price : row.price,
    mrp: row.mrp || row.price,
    rating: 4.6,
    reviews: 0,
    stock: row.stock,
    ageGroup: toAgeGroup(row.age_group),
    badge: toBadge(row),
    tags: row.tags ?? [],
    createdAt: row.created_at,
    shortDescription: row.short_description,
    description: row.description,
    specs: [
      row.brand ? { label: "Brand", value: row.brand } : null,
      row.material ? { label: "Material", value: row.material } : null,
      row.color ? { label: "Colour", value: row.color } : null,
      row.size ? { label: "Size", value: row.size } : null,
      row.dimensions ? { label: "Dimensions", value: row.dimensions } : null,
      row.weight_grams ? { label: "Weight", value: `${row.weight_grams} g` } : null,
      row.care_instructions ? { label: "Care", value: row.care_instructions } : null,
    ].filter(Boolean) as Product["specs"],
  };
}

/** Storefront catalog: live products from the database merged over the seed catalog. */
export function useCatalog() {
  const { data, isLoading } = useQuery({
    queryKey: ["catalog", "products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("is_active", true)
        .eq("status", "active")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data.map(mapDbProduct);
    },
  });

  const live = data ?? [];
  const liveSlugs = new Set(live.map((p) => p.slug));
  return { products: [...live, ...staticProducts.filter((p) => !liveSlugs.has(p.slug))], isLoading };
}
