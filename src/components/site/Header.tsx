import { Link, useNavigate } from "@tanstack/react-router";
import {
  Heart,
  Mail,
  MapPin,
  Menu,
  Phone,
  Search,
  ShoppingCart,
  User,
} from "lucide-react";
import { useState, type FormEvent } from "react";
import { useNavigationMenu, useSiteCategories, useSiteSettings, navHref, type NavTreeItem } from "@/lib/cms";
import { NavIcon } from "@/lib/nav-icons";
import { useShop } from "@/lib/shop-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import logoFallback from "@/assets/logo.png";
import { SocialIcons, WhatsAppIcon } from "./SocialIcons";

/** Renders a CMS menu link; external links use a plain anchor. */
function MenuLink({
  item,
  className,
  onNavigate,
}: {
  item: { label: string; icon: string | null; link_type: string; link_value: string; open_new_tab: boolean };
  className?: string;
  onNavigate?: () => void;
}) {
  const href = navHref(item);
  const content = (
    <>
      <NavIcon name={item.icon} className="h-4 w-4" />
      {item.label}
    </>
  );
  if (item.link_type === "external" || item.open_new_tab) {
    return (
      <a href={href} target="_blank" rel="noreferrer" className={className} onClick={onNavigate}>
        {content}
      </a>
    );
  }
  return (
    <Link
      to={href}
      activeOptions={{ exact: href === "/" }}
      activeProps={{ className: "bg-card/20" }}
      className={className}
      onClick={onNavigate}
    >
      {content}
    </Link>
  );
}

export function Header() {
  const { cartCount, wishlist } = useShop();
  const { settings } = useSiteSettings();
  const categories = useSiteCategories();
  const menu: NavTreeItem[] = useNavigationMenu();
  const store = {
    name: settings.siteName,
    tagline: settings.tagline,
    address: settings.address,
    phone: settings.phone,
    phoneHref: `tel:${settings.phone.replace(/[^+\d]/g, "")}`,
    email: settings.email,
    instagram: settings.instagram,
    facebook: settings.facebook,
    whatsapp: settings.whatsapp,
  };
  const logo = settings.logoUrl || logoFallback;
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
          <div className="flex items-center gap-2">
            <span>Follow us</span>
            <SocialIcons placement="header" iconClassName="h-4 w-4" className="gap-0" />
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
                {menu.map((item) => (
                  <div key={item.id}>
                    <MenuLink
                      item={item}
                      onNavigate={() => setMenuOpen(false)}
                      className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold hover:bg-secondary"
                    />
                    {item.children.map((child) => (
                      <MenuLink
                        key={child.id}
                        item={child}
                        onNavigate={() => setMenuOpen(false)}
                        className="ml-4 flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-secondary"
                      />
                    ))}
                  </div>
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
            <img src={logo} alt="" aria-hidden="true" width={512} height={512} className="h-12 w-12 object-contain" />
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

      {/* Main navigation (CMS managed) */}
      <nav aria-label="Main" className="hidden gradient-teal lg:block">
        <div className="container-page flex h-12 items-center gap-1 overflow-x-auto text-sm font-semibold text-teal-foreground">
          {menu.map((item) => (
            <div key={item.id} className="group relative">
              <MenuLink
                item={item}
                className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 transition-colors hover:bg-card/20"
              />
              {item.children.length > 0 && (
                <div className="invisible absolute left-0 top-full z-50 min-w-44 rounded-xl border border-border bg-card p-1 opacity-0 shadow-lg transition-opacity group-hover:visible group-hover:opacity-100">
                  {item.children.map((child) => (
                    <MenuLink
                      key={child.id}
                      item={child}
                      className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-foreground hover:bg-secondary"
                    />
                  ))}
                </div>
              )}
            </div>
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
