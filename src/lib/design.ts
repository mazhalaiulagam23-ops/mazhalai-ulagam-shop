import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type ThemeSettings = Tables<"theme_settings">;

export const THEME_KEY = ["cms", "theme_settings"] as const;

export const FONT_CHOICES = [
  "Fraunces",
  "Plus Jakarta Sans",
  "Playfair Display",
  "Poppins",
  "Inter",
  "Nunito",
  "Baloo 2",
  "DM Serif Display",
  "Manrope",
  "Outfit",
] as const;

export const THEME_PRESETS: Record<
  string,
  Pick<
    ThemeSettings,
    "primary_color" | "secondary_color" | "accent_color" | "background_color" | "foreground_color" | "heading_font" | "body_font" | "base_radius"
  > & { label: string }
> = {
  luxury: {
    label: "Luxury Emerald",
    primary_color: "#0F766E",
    secondary_color: "#D4AF37",
    accent_color: "#FF8A80",
    background_color: "#FFFBF5",
    foreground_color: "#1C2B2A",
    heading_font: "Fraunces",
    body_font: "Plus Jakarta Sans",
    base_radius: 16,
  },
  playful: {
    label: "Playful Coral",
    primary_color: "#FF6F61",
    secondary_color: "#37B6A9",
    accent_color: "#FFC857",
    background_color: "#FFF7F2",
    foreground_color: "#2B2431",
    heading_font: "Baloo 2",
    body_font: "Nunito",
    base_radius: 24,
  },
  minimal: {
    label: "Minimal Ink",
    primary_color: "#111827",
    secondary_color: "#6B7280",
    accent_color: "#2563EB",
    background_color: "#FFFFFF",
    foreground_color: "#0B1220",
    heading_font: "Inter",
    body_font: "Inter",
    base_radius: 8,
  },
  royal: {
    label: "Royal Plum",
    primary_color: "#5B21B6",
    secondary_color: "#F59E0B",
    accent_color: "#EC4899",
    background_color: "#FAF7FF",
    foreground_color: "#241A38",
    heading_font: "Playfair Display",
    body_font: "Manrope",
    base_radius: 18,
  },
};

/** Converts a #rrggbb hex string into an `oklch(l c h)` CSS colour. */
export function hexToOklch(hex: string): string {
  const clean = hex.replace("#", "").trim();
  const full = clean.length === 3 ? clean.split("").map((c) => c + c).join("") : clean;
  if (!/^[0-9a-fA-F]{6}$/.test(full)) return "oklch(0.5 0 0)";

  const toLinear = (v: number) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
  const r = toLinear(parseInt(full.slice(0, 2), 16) / 255);
  const g = toLinear(parseInt(full.slice(2, 4), 16) / 255);
  const b = toLinear(parseInt(full.slice(4, 6), 16) / 255);

  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);

  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
  const A = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const B = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;

  const C = Math.sqrt(A * A + B * B);
  let H = (Math.atan2(B, A) * 180) / Math.PI;
  if (H < 0) H += 360;

  return `oklch(${L.toFixed(4)} ${C.toFixed(4)} ${H.toFixed(2)})`;
}

/** Picks a readable foreground (near-white or near-black) for a hex background. */
export function readableOn(hex: string): string {
  const clean = hex.replace("#", "");
  const full = clean.length === 3 ? clean.split("").map((c) => c + c).join("") : clean;
  if (!/^[0-9a-fA-F]{6}$/.test(full)) return "oklch(0.99 0 0)";
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16) / 255);
  const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return lum > 0.6 ? "oklch(0.18 0.02 260)" : "oklch(0.99 0.01 95)";
}

const RADIUS_BY_BUTTON: Record<string, string> = {
  sharp: "0px",
  rounded: "0.9rem",
  pill: "9999px",
};

const SHADOWS: Record<string, { soft: string; lift: string }> = {
  none: { soft: "none", lift: "none" },
  soft: {
    soft: "0 2px 8px -2px oklch(0.31 0.03 260 / 0.06), 0 10px 30px -14px oklch(0.31 0.03 260 / 0.14)",
    lift: "0 8px 20px -8px oklch(0.31 0.03 260 / 0.1), 0 30px 60px -26px oklch(0.31 0.03 260 / 0.24)",
  },
  dramatic: {
    soft: "0 6px 16px -4px oklch(0.31 0.03 260 / 0.16), 0 18px 44px -16px oklch(0.31 0.03 260 / 0.28)",
    lift: "0 16px 34px -10px oklch(0.31 0.03 260 / 0.22), 0 48px 90px -30px oklch(0.31 0.03 260 / 0.4)",
  },
};

/** Builds the CSS override block for the storefront from saved design settings. */
export function themeCss(t: Partial<ThemeSettings> | null | undefined): string {
  if (!t) return "";
  const shadows = SHADOWS[t.shadow_style ?? "soft"] ?? SHADOWS.soft;
  const lines = [
    t.primary_color && `--primary: ${hexToOklch(t.primary_color)};`,
    t.primary_color && `--primary-foreground: ${readableOn(t.primary_color)};`,
    t.primary_color && `--ring: ${hexToOklch(t.primary_color)};`,
    t.secondary_color && `--gold: ${hexToOklch(t.secondary_color)};`,
    t.secondary_color && `--gold-foreground: ${readableOn(t.secondary_color)};`,
    t.accent_color && `--accent: ${hexToOklch(t.accent_color)};`,
    t.accent_color && `--accent-foreground: ${readableOn(t.accent_color)};`,
    t.background_color && `--background: ${hexToOklch(t.background_color)};`,
    t.foreground_color && `--foreground: ${hexToOklch(t.foreground_color)};`,
    t.base_radius != null && `--radius: ${Number(t.base_radius) / 16}rem;`,
    `--shadow-soft: ${shadows.soft};`,
    `--shadow-lift: ${shadows.lift};`,
  ].filter(Boolean);

  const fonts = [
    t.heading_font && `--font-display: "${t.heading_font}", Georgia, serif;`,
    t.body_font && `--font-sans: "${t.body_font}", system-ui, sans-serif;`,
  ].filter(Boolean);

  const btnRadius = RADIUS_BY_BUTTON[t.button_style ?? "rounded"];
  const container = t.container_width ? `.container-page{max-width:${t.container_width}px;}` : "";
  const motion = t.animations_enabled === false ? `*,*::before,*::after{animation:none!important;transition:none!important;}` : "";

  return [
    `:root{${lines.join("")}}`,
    `:root,.dark{${fonts.join("")}}`,
    btnRadius ? `button,.btn,[data-slot="button"]{border-radius:${btnRadius};}` : "",
    container,
    motion,
    t.custom_css ?? "",
  ]
    .filter(Boolean)
    .join("\n");
}

/** Google Fonts href for the currently selected typography pair. */
export function fontHref(heading?: string | null, body?: string | null): string {
  const families = Array.from(new Set([heading, body].filter(Boolean) as string[]));
  if (!families.length) return "";
  const q = families.map((f) => `family=${f.replace(/ /g, "+")}:wght@400;500;600;700;800`).join("&");
  return `https://fonts.googleapis.com/css2?${q}&display=swap`;
}

export function useThemeSettings() {
  return useQuery({
    queryKey: THEME_KEY,
    queryFn: async () => {
      const { data, error } = await supabase.from("theme_settings").select("*").maybeSingle();
      if (error) throw error;
      return data;
    },
    staleTime: 30_000,
  });
}
