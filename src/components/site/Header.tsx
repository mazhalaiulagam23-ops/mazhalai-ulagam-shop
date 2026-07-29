import { Link, useNavigate } from "@tanstack/react-router";
import {
  Facebook,
  Heart,
  Instagram,
  Mail,
  MapPin,
  Menu,
  Phone,
  Search,
  ShoppingCart,
  User,
} from "lucide-react";
import { useState, type FormEvent } from "react";
import { categories, store } from "@/data/catalog";
import { useShop } from "@/lib/shop-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import logo from "@/assets/hero-1.jpg";

const mainNav = [
  { label: "Home", to: "/" },
  { label: "Shop", to: "/shop" },
  { label: "Offers", to: "/offers" },
  { label: "Blog", to: "/blog" },
  { label: "About Us", to: "/about" },
  { label: "Contact Us", to: "/contact" },
] as const;

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91S17.5 2 12.04 2Zm5.8 14.1c-.24.68-1.42 1.32-1.95 1.36-.5.05-.98.24-3.3-.69-2.78-1.1-4.53-3.95-4.67-4.13-.13-.18-1.11-1.48-1.11-2.82 0-1.34.7-2 .95-2.28.24-.27.53-.34.71-.34h.5c.16 0 .38-.06.59.45.24.55.8 1.9.87 2.04.07.14.12.3.02.48-.09.18-.14.29-.28.45l-.42.49c-.14.14-.29.3-.12.58.16.28.72 1.19 1.55 1.93 1.07.95 1.97 1.25 2.25 1.39.28.14.44.12.6-.07.17-.18.7-.81.88-1.09.18-.28.36-.23.6-.14.25.09 1.58.75 1.85.88.27.14.45.21.52.32.06.11.06.63-.18 1.3Z" />
    </svg>
  );
}

export function Header() {
  const { cartCount, wishlist } = useShop();
  const [query, setQuery] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  const submitSearch = (e: FormEvent) => {
    e.preventDefault();
    navigate({ to: "/shop", search: { q: query || undefined } });
  };

  return (
    <header className="sticky top-0 z-50 w-full">
      {/* Utility bar */}
      <div className="hidden bg-blush text-blush-foreground md:block">
        <div className="container-page flex h-10 items-center justify-between text-xs">
          <div className="flex items-center gap-5">
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5" /> {store.address}
            </span>
            <a href={store.phoneHref} className="inline-flex items-center gap-1.5 hover:underline">
              <Phone className="h-3.5 w-3.5" /> {store.phone}
            </a>
            <a href={`mailto:${store.email}`} className="inline-flex items-center gap-1.5 hover:underline">
              <Mail className="h-3.5 w-3.5" /> {store.email}
            </a>
          </div>
          <div className="flex items-center gap-3">
            <span>Follow us</span>
            <a href={store.instagram} aria-label="Instagram" target="_blank" rel="noreferrer">
              <Instagram className="h-4 w-4 hover:text-primary" />
            </a>
            <a href={store.facebook} aria-label="Facebook" target="_blank" rel="noreferrer">
              <Facebook className="h-4 w-4 hover:text-primary" />
            </a>
            <a href={store.whatsapp} aria-label="WhatsApp" target="_blank" rel="noreferrer">
              <WhatsAppIcon className="h-4 w-4 hover:text-teal" />
            </a>
          </div>
        </div>
      </div>

      {/* Main bar */}
      <div className="border-b border-border bg-card/95 backdrop-blur">
        <div className="container-page flex h-20 items-center gap-4">
          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open menu">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80 overflow-y-auto">
              <SheetHeader>
                <SheetTitle className="text-primary">{store.name}</SheetTitle>
              </SheetHeader>
              <nav className="mt-6 flex flex-col gap-1">
                {mainNav.map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => setMenuOpen(false)}
                    className="rounded-lg px-3 py-2 text-sm font-semibold hover:bg-secondary"
                  >
                    {item.label}
                  </Link>
                ))}
                <p className="mt-4 px-3 text-xs font-bold uppercase text-muted-foreground">Categories</p>
                {categories.map((c) => (
                  <Link
                    key={c.slug}
                    to="/category/$slug"
                    params={{ slug: c.slug }}
                    onClick={() => setMenuOpen(false)}
                    className="rounded-lg px-3 py-2 text-sm hover:bg-secondary"
                  >
                    {c.name}
                  </Link>
                ))}
              </nav>
            </SheetContent>
          </Sheet>

          <Link to="/" className="flex shrink-0 items-center gap-2">
            <img src={logo} alt="" aria-hidden="true" width={48} height={48} className="h-11 w-11 rounded-full object-cover" />
            <span className="leading-tight">
              <span className="block font-display text-xl font-bold text-primary sm:text-2xl">{store.name}</span>
              <span className="hidden text-[11px] text-muted-foreground sm:block">{store.tagline}</span>
            </span>
          </Link>

          <form onSubmit={submitSearch} className="mx-auto hidden w-full max-w-md md:block" role="search">
            <div className="flex overflow-hidden rounded-full border border-border bg-background">
              <label htmlFor="site-search" className="sr-only">
                Search for products
              </label>
              <Input
                id="site-search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search for products..."
                className="border-0 bg-transparent focus-visible:ring-0"
              />
              <button
                type="submit"
                aria-label="Search"
                className="gradient-primary px-5 text-primary-foreground transition-opacity hover:opacity-90"
              >
                <Search className="h-4 w-4" />
              </button>
            </div>
          </form>

          <div className="ml-auto flex items-center gap-1 sm:gap-3">
            <Link
              to="/account"
              className="hidden items-center gap-2 rounded-full px-2 py-1 text-sm hover:bg-secondary sm:flex"
            >
              <User className="h-5 w-5 text-teal" />
              <span className="hidden leading-tight lg:block">
                <span className="block text-xs font-semibold">My Account</span>
                <span className="block text-[11px] text-muted-foreground">Login / Register</span>
              </span>
            </Link>
            <Link to="/wishlist" className="relative rounded-full p-2 hover:bg-secondary" aria-label="Wishlist">
              <Heart className="h-5 w-5 text-primary" />
              <span className="absolute -right-0 -top-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-teal px-1 text-[10px] font-bold text-teal-foreground">
                {wishlist.length}
              </span>
            </Link>
            <Link to="/cart" className="relative rounded-full p-2 hover:bg-secondary" aria-label="Cart">
              <ShoppingCart className="h-5 w-5 text-primary" />
              <span className="absolute -right-0 -top-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-teal px-1 text-[10px] font-bold text-teal-foreground">
                {cartCount}
              </span>
            </Link>
          </div>
        </div>

        {/* Mobile search */}
        <form onSubmit={submitSearch} className="container-page pb-3 md:hidden" role="search">
          <div className="flex overflow-hidden rounded-full border border-border bg-background">
            <label htmlFor="site-search-mobile" className="sr-only">
              Search for products
            </label>
            <Input
              id="site-search-mobile"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for products..."
              className="border-0 bg-transparent focus-visible:ring-0"
            />
            <button type="submit" aria-label="Search" className="gradient-primary px-5 text-primary-foreground">
              <Search className="h-4 w-4" />
            </button>
          </div>
        </form>
      </div>

      {/* Category nav */}
      <nav aria-label="Categories" className="hidden gradient-teal lg:block">
        <div className="container-page flex h-12 items-center gap-1 overflow-x-auto text-sm font-semibold text-teal-foreground">
          {mainNav.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              activeOptions={{ exact: item.to === "/" }}
              activeProps={{ className: "bg-card/20" }}
              className="whitespace-nowrap rounded-full px-3 py-1.5 transition-colors hover:bg-card/20"
            >
              {item.label}
            </Link>
          ))}
          <span className="mx-2 h-5 w-px bg-card/30" aria-hidden="true" />
          {categories.slice(0, 5).map((c) => (
            <Link
              key={c.slug}
              to="/category/$slug"
              params={{ slug: c.slug }}
              activeProps={{ className: "bg-card/20" }}
              className="whitespace-nowrap rounded-full px-3 py-1.5 transition-colors hover:bg-card/20"
            >
              {c.name}
            </Link>
          ))}
          <a
            href={store.whatsapp}
            target="_blank"
            rel="noreferrer"
            className="ml-auto inline-flex items-center gap-2 whitespace-nowrap rounded-full bg-card/20 px-3 py-1.5"
          >
            <WhatsAppIcon className="h-4 w-4" /> Order on WhatsApp
          </a>
        </div>
      </nav>
    </header>
  );
}

export { WhatsAppIcon };
