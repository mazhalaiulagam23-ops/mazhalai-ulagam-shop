import {
  BookOpen,
  Baby,
  Gift,
  Heart,
  Home,
  Info,
  LayoutGrid,
  Mail,
  Package,
  Percent,
  Phone,
  ShoppingBag,
  Sparkles,
  Star,
  Store,
  Tag,
  Truck,
  type LucideIcon,
} from "lucide-react";

/** Icons an admin can pick for a navigation item. */
export const NAV_ICONS: Record<string, LucideIcon> = {
  Home,
  Store,
  ShoppingBag,
  Package,
  Tag,
  Percent,
  Gift,
  Baby,
  Heart,
  Star,
  Sparkles,
  LayoutGrid,
  BookOpen,
  Info,
  Phone,
  Mail,
  Truck,
};

export const NAV_ICON_NAMES = Object.keys(NAV_ICONS);

export function NavIcon({ name, className }: { name?: string | null; className?: string }) {
  if (!name) return null;
  const Icon = NAV_ICONS[name];
  if (!Icon) return null;
  return <Icon className={className} aria-hidden="true" />;
}
