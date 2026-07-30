import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { store as staticStore, categories as staticCategories } from "@/data/catalog";

export type SiteSettings = Tables<"site_settings">;
export type HomeSection = Tables<"home_sections">;
export type Banner = Tables<"banners">;
export type Testimonial = Tables<"testimonials">;
export type Faq = Tables<"faqs">;
export type SitePage = Tables<"site_pages">;
export type FooterLink = Tables<"footer_links">;

export const CMS_KEY = ["cms"] as const;

/** Site identity + contact details, with the static catalog values as fallback. */
export function useSiteSettings() {
  const { data, isLoading } = useQuery({
    queryKey: ["cms", "site_settings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("site_settings").select("*").maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const settings = {
    siteName: data?.site_name || staticStore.name,
    tagline: data?.tagline || staticStore.tagline,
    logoUrl: data?.logo_url || null,
    faviconUrl: data?.favicon_url || null,
    phone: data?.phone || staticStore.phone,
    email: data?.email || staticStore.email,
    address: data?.address || staticStore.address,
    whatsapp: data?.whatsapp || staticStore.whatsapp,
    instagram: data?.instagram || staticStore.instagram,
    facebook: data?.facebook || staticStore.facebook,
    youtube: data?.youtube || "",
    footerNote: data?.footer_note || "",
    companyName: data?.company_name || data?.site_name || staticStore.name,
    googleMapsUrl: data?.google_maps_url || "",
    businessHours: data?.business_hours || "",
    whatsappNumber: data?.whatsapp_number || "",
  };

  return { settings, raw: data ?? null, isLoading };
}

export function useHomeSections() {
  return useQuery({
    queryKey: ["cms", "home_sections"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("home_sections")
        .select("*")
        .order("position", { ascending: true });
      if (error) throw error;
      return data;
    },
  });
}

export function useBanners(placement = "hero") {
  return useQuery({
    queryKey: ["cms", "banners", placement],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("banners")
        .select("*")
        .eq("placement", placement)
        .eq("is_active", true)
        .order("position", { ascending: true });
      if (error) throw error;
      return data;
    },
  });
}

export function useTestimonials() {
  return useQuery({
    queryKey: ["cms", "testimonials"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("testimonials")
        .select("*")
        .eq("is_active", true)
        .order("position", { ascending: true });
      if (error) throw error;
      return data;
    },
  });
}

export function useFaqs() {
  return useQuery({
    queryKey: ["cms", "faqs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("faqs")
        .select("*")
        .eq("is_active", true)
        .order("position", { ascending: true });
      if (error) throw error;
      return data;
    },
  });
}

export function useSitePage(slug: string) {
  return useQuery({
    queryKey: ["cms", "site_pages", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_pages")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function useFooterLinks() {
  return useQuery({
    queryKey: ["cms", "footer_links"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("footer_links")
        .select("*")
        .eq("is_active", true)
        .order("position", { ascending: true });
      if (error) throw error;
      return data;
    },
  });
}

/** Categories managed from the CMS (falls back to the seed list when empty). */
export function useCmsCategories() {
  return useQuery({
    queryKey: ["cms", "categories"],
    queryFn: async () => {
      const { data, error } = await supabase.from("categories").select("*").order("name");
      if (error) throw error;
      return data;
    },
  });
}

/** Storefront categories: CMS-managed rows merged over the seed list. */
export function useSiteCategories() {
  const { data } = useCmsCategories();
  const live = (data ?? []).map((c) => ({
    slug: c.slug,
    name: c.name,
    tagline: c.tagline ?? "",
    image: c.image_url || staticCategories.find((s) => s.slug === c.slug)?.image || "/placeholder.svg",
  }));
  const liveSlugs = new Set(live.map((c) => c.slug));
  return [...live, ...staticCategories.filter((c) => !liveSlugs.has(c.slug))];
}

export type NavItem = Tables<"nav_items">;
export type SocialLink = Tables<"social_links">;

export const NAV_LINK_TYPES = [
  { value: "home", label: "Home" },
  { value: "category", label: "Category" },
  { value: "product", label: "Product" },
  { value: "page", label: "Custom Page" },
  { value: "external", label: "External URL" },
] as const;

/** Turns a stored link type + value into a browsable href. */
export function navHref(item: Pick<NavItem, "link_type" | "link_value">) {
  const value = (item.link_value || "").trim();
  switch (item.link_type) {
    case "home":
      return "/";
    case "category":
      return `/category/${value.replace(/^\/+|^category\//g, "")}`;
    case "product":
      return `/product/${value.replace(/^\/+|^product\//g, "")}`;
    case "external":
      return value;
    default:
      return value.startsWith("/") || value.startsWith("http") ? value : `/${value}`;
  }
}

export type NavTreeItem = NavItem & { children: NavItem[] };

function toTree(rows: NavItem[]): NavTreeItem[] {
  const sorted = [...rows].sort((a, b) => a.position - b.position);
  const roots = sorted.filter((r) => !r.parent_id).map((r) => ({ ...r, children: [] as NavItem[] }));
  for (const row of sorted) {
    if (!row.parent_id) continue;
    roots.find((r) => r.id === row.parent_id)?.children.push(row);
  }
  return roots;
}

/** Visible navigation tree for the storefront. */
export function useNavigationMenu() {
  const { data } = useQuery({
    queryKey: ["cms", "nav_items"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("nav_items")
        .select("*")
        .eq("is_visible", true)
        .order("position", { ascending: true });
      if (error) throw error;
      return data;
    },
  });
  return toTree(data ?? []);
}

export { toTree as buildNavTree };

/** Social links / QR codes, optionally filtered by where they should show. */
export function useSocialLinks(placement?: string) {
  const query = useQuery({
    queryKey: ["cms", "social_links"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("social_links")
        .select("*")
        .order("position", { ascending: true });
      if (error) throw error;
      return data;
    },
  });
  const rows = query.data ?? [];
  const visible = rows.filter(
    (r) => r.is_visible && r.url && (!placement || (r.placements ?? []).includes(placement)),
  );
  return { all: rows, links: visible, isLoading: query.isLoading };
}

/** QR codes that should render in a given placement. */
export function useQrCodes(placement: string) {
  const { all } = useSocialLinks();
  return all.filter((r) => r.show_qr && r.qr_image_url && (r.placements ?? []).includes(placement));
}
