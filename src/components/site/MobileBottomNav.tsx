import { Link } from "@tanstack/react-router";
import { Heart, Home, Search, ShoppingBag, User } from "lucide-react";
import { useShop } from "@/lib/shop-store";

const items = [
  { label: "Home", to: "/", icon: Home },
  { label: "Shop", to: "/shop", icon: Search },
  { label: "Wishlist", to: "/wishlist", icon: Heart },
  { label: "Cart", to: "/cart", icon: ShoppingBag },
  { label: "Account", to: "/account", icon: User },
] as const;

export function MobileBottomNav() {
  const { cartCount, wishlist } = useShop();

  return (
    <nav
      aria-label="Mobile navigation"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden"
    >
      <div className="grid h-16 grid-cols-5">
        {items.map((item) => {
          const Icon = item.icon;
          const count = item.to === "/cart" ? cartCount : item.to === "/wishlist" ? wishlist.length : 0;
          return (
            <Link
              key={item.to}
              to={item.to}
              activeOptions={{ exact: item.to === "/" }}
              activeProps={{ className: "text-primary" }}
              className="relative flex min-w-0 flex-col items-center justify-center gap-1 px-1 text-[10px] font-semibold text-muted-foreground"
            >
              <span className="relative">
                <Icon className="h-5 w-5" aria-hidden="true" />
                {count > 0 ? (
                  <span className="absolute -right-2.5 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-sale px-1 text-[9px] font-bold text-primary-foreground">
                    {count > 99 ? "99+" : count}
                  </span>
                ) : null}
              </span>
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}