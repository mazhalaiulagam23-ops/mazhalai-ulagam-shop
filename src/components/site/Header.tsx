import { Link, useNavigate } from "@tanstack/react-router";
import {
  Bell,
  Camera,
  ChevronDown,
  Clock,
  Headphones,
  Heart,
  Menu,
  Mic,
  Moon,
  PackageSearch,
  Scale,
  Search,
  ShoppingBag,
  Sparkle,
  Sun,
  Tag,
  Truck,
  TrendingUp,
  User,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { useNavigationMenu, useSiteCategories, useSiteSettings, navHref, type NavTreeItem } from "@/lib/cms";
import { NavIcon } from "@/lib/nav-icons";
import { useShop } from "@/lib/shop-store";
import { useTheme } from "@/lib/theme";
import { useCatalog } from "@/lib/db-products";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import logoFallback from "@/assets/logo.png";
import { WhatsAppIcon } from "./SocialIcons";

const TRENDING = ["Return gift combos", "Montessori toys", "Organic baby wash", "Baby carrier", "Story books"];
const RECENT_KEY = "mu_recent_searches";

/** Renders a CMS menu link; external links use a plain anchor. */
function MenuLink({
  item,
  className,
  onNavigate,
  showIcon = true,
}: {
  item: { label: string; icon: string | null; link_type: string; link_value: string; open_new_tab: boolean };
  className?: string;
  onNavigate?: () => void;
  showIcon?: boolean;
}) {
  const href = navHref(item);
  const content = (
    <>
      {showIcon && <NavIcon name={item.icon} className="h-4 w-4" />}
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
      activeProps={{ className: "text-primary" }}
      className={className}
      onClick={onNavigate}
    >
      {content}
    </Link>
  );
}

function CountBadge({ value, tone = "gold" }: { value: number; tone?: "gold" | "coral" }) {
  if (value <= 0) return null;
  return (
    <span
      className={`absolute -right-1 -top-1 flex h-4.5 min-w-4.5 items-center justify-center rounded-full px-1 text-[10px] font-bold tabular-nums ${
        tone === "gold" ? "bg-gold text-gold-foreground" : "bg-sale text-primary-foreground"
      }`}
    >
      {value}
    </span>
  );
}

/** Intelligent search with autocomplete, recent + trending suggestions and voice input. */
function SmartSearch({ id, onDone }: { id: string; onDone?: () => void }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [recent, setRecent] = useState<string[]>([]);
  const [listening, setListening] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { products } = useCatalog();
  const categories = useSiteCategories();

  useEffect(() => {
    try {
      setRecent(JSON.parse(window.localStorage.getItem(RECENT_KEY) ?? "[]") as string[]);
    } catch {
      setRecent([]);
    }
  }, []);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return products.filter((p) => p.name.toLowerCase().includes(q)).slice(0, 6);
  }, [query, products]);

  const run = (term: string) => {
    const value = term.trim();
    if (!value) return;
    const next = [value, ...recent.filter((r) => r !== value)].slice(0, 5);
    setRecent(next);
    window.localStorage.setItem(RECENT_KEY, JSON.stringify(next));
    setOpen(false);
    onDone?.();
    navigate({ to: "/shop", search: { q: value } });
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    run(query);
  };

  const startVoice = () => {
    const w = window as unknown as { SpeechRecognition?: never; webkitSpeechRecognition?: never };
    const Ctor = (w.SpeechRecognition ?? w.webkitSpeechRecognition) as
      | (new () => {
          lang: string;
          start: () => void;
          onresult: (e: { results: { 0: { 0: { transcript: string } } } }) => void;
          onerror: () => void;
          onend: () => void;
        })
      | undefined;
    if (!Ctor) {
      toast.error("Voice search isn't supported in this browser");
      return;
    }
    const rec = new Ctor();
    rec.lang = "en-IN";
    setListening(true);
    rec.onresult = (e) => {
      const text = e.results[0][0].transcript;
      setQuery(text);
      run(text);
    };
    rec.onerror = () => setListening(false);
    rec.onend = () => setListening(false);
    rec.start();
  };

  return (
    <div ref={boxRef} className="relative w-full">
      <form onSubmit={submit} role="search">
        <div className="flex items-center gap-1 rounded-full border border-border bg-card py-1.5 pl-5 pr-1.5 shadow-[var(--shadow-soft)] transition-shadow focus-within:shadow-[var(--shadow-lift)]">
          <label htmlFor={id} className="sr-only">
            Search for products
          </label>
          <input
            id={id}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            placeholder="Search toys, books, clothing and more…"
            className="min-w-0 flex-1 bg-transparent py-1.5 text-sm outline-none placeholder:text-muted-foreground"
          />
          <button
            type="button"
            onClick={startVoice}
            aria-label="Search by voice"
            className={`hidden h-9 w-9 items-center justify-center rounded-full transition-colors sm:flex ${
              listening ? "bg-sale/20 text-sale" : "text-muted-foreground hover:bg-secondary"
            }`}
          >
            <Mic className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => toast.info("Image search is coming soon — snap a toy and we'll find it.")}
            aria-label="Search by image (coming soon)"
            className="hidden h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary sm:flex"
          >
            <Camera className="h-4 w-4" />
          </button>
          <button
            type="submit"
            aria-label="Search"
            className="flex h-9 w-9 items-center justify-center rounded-full gradient-primary text-primary-foreground transition-transform hover:scale-105"
          >
            <Search className="h-4 w-4" />
          </button>
        </div>
      </form>

      {open && (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border border-border bg-popover p-2 shadow-[var(--shadow-lift)]">
          {matches.length > 0 ? (
            <ul>
              {matches.map((p) => (
                <li key={p.id}>
                  <Link
                    to="/product/$slug"
                    params={{ slug: p.slug }}
                    onClick={() => {
                      setOpen(false);
                      onDone?.();
                    }}
                    className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm hover:bg-secondary"
                  >
                    <img src={p.images[0]} alt="" className="h-9 w-9 rounded-lg object-cover" />
                    <span className="line-clamp-1 flex-1">{p.name}</span>
                    <span className="text-xs text-muted-foreground">₹{p.price.toLocaleString("en-IN")}</span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <div className="space-y-3 p-2">
              {recent.length > 0 && (
                <div>
                  <p className="mb-1.5 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" /> Recent
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {recent.map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => run(r)}
                        className="rounded-full bg-secondary px-3 py-1 text-xs font-medium hover:bg-accent"
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <div>
                <p className="mb-1.5 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                  <TrendingUp className="h-3.5 w-3.5" /> Trending
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {TRENDING.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => run(t)}
                      className="rounded-full bg-secondary px-3 py-1 text-xs font-medium hover:bg-accent"
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                  Popular categories
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {categories.slice(0, 6).map((c) => (
                    <Link
                      key={c.slug}
                      to="/category/$slug"
                      params={{ slug: c.slug }}
                      onClick={() => {
                        setOpen(false);
                        onDone?.();
                      }}
                      className="rounded-full border border-border px-3 py-1 text-xs font-medium hover:bg-secondary"
                    >
                      {c.name}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function Header() {
  const { cartCount, wishlist, compare, subtotal } = useShop();
  const { settings } = useSiteSettings();
  const categories = useSiteCategories();
  const menu: NavTreeItem[] = useNavigationMenu();
  const { theme, toggleTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const [lang, setLang] = useState("English");

  const logo = settings.logoUrl || logoFallback;
  const whatsapp = settings.whatsapp;

  return (
    <header className="sticky top-0 z-50 w-full">
      {/* Level 1 — utility bar */}
      <div className="gradient-teal text-primary-foreground">
        <div className="container-page grid h-9 grid-cols-[minmax(0,1fr)_auto] items-center gap-2 text-[11px] font-medium sm:gap-4">
          <div className="flex min-w-0 items-center gap-5 overflow-hidden">
            <span className="inline-flex shrink-0 items-center gap-1.5">
              <Truck className="h-3.5 w-3.5 text-gold" /> Free shipping over ₹999
            </span>
            <span className="hidden shrink-0 items-center gap-1.5 sm:inline-flex">
              <Tag className="h-3.5 w-3.5 text-gold" /> Exclusive offers for you
            </span>
            <Link to="/order-tracking" className="hidden shrink-0 items-center gap-1.5 hover:underline md:inline-flex">
              <PackageSearch className="h-3.5 w-3.5 text-gold" /> Track order
            </Link>
            <Link to="/contact" className="hidden shrink-0 items-center gap-1.5 hover:underline md:inline-flex">
              <Headphones className="h-3.5 w-3.5 text-gold" /> Support
            </Link>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <label htmlFor="lang" className="sr-only">
              Language
            </label>
            <select
              id="lang"
              value={lang}
              onChange={(e) => setLang(e.target.value)}
              className="rounded-full bg-card/15 px-2 py-1 text-[11px] font-medium outline-none"
            >
              <option value="English">English</option>
              <option value="தமிழ்">தமிழ்</option>
            </select>
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              className="flex h-7 w-7 items-center justify-center rounded-full bg-card/15 transition-colors hover:bg-card/30"
            >
              {theme === "dark" ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Level 2 — brand, search, actions */}
      <div className="border-b border-border bg-card/85 backdrop-blur-xl">
        <div className="container-page grid h-16 grid-cols-[44px_minmax(0,1fr)] items-center gap-2 sm:flex sm:h-20 sm:gap-3 lg:gap-6">
          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="h-11 w-11 lg:hidden" aria-label="Open menu">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[min(88vw,320px)] overflow-y-auto pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
              <SheetHeader>
                <SheetTitle className="text-primary">{settings.siteName}</SheetTitle>
              </SheetHeader>
              <nav className="mt-6 flex flex-col gap-1 pb-10">
                {menu.map((item) => (
                  <div key={item.id}>
                    <MenuLink
                      item={item}
                      onNavigate={() => setMenuOpen(false)}
                      className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold hover:bg-secondary"
                    />
                    {item.children.map((child) => (
                      <MenuLink
                        key={child.id}
                        item={child}
                        onNavigate={() => setMenuOpen(false)}
                        className="ml-4 flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-muted-foreground hover:bg-secondary"
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
                    className="rounded-xl px-3 py-2 text-sm hover:bg-secondary"
                  >
                    {c.name}
                  </Link>
                ))}
              </nav>
            </SheetContent>
          </Sheet>

          <Link to="/" className="flex min-w-0 items-center gap-2 sm:shrink-0 sm:gap-2.5">
            <img
              src={logo}
              alt=""
              aria-hidden="true"
              width={512}
              height={512}
              className="h-9 w-9 shrink-0 rounded-xl object-contain sm:h-11 sm:w-11 sm:rounded-2xl"
            />
            <span className="min-w-0 leading-tight">
              <span className="block truncate font-display text-base font-semibold tracking-tight text-primary sm:text-xl">
                {settings.siteName}
              </span>
              <span className="hidden text-[10px] uppercase tracking-[0.18em] text-muted-foreground sm:block">
                {settings.tagline}
              </span>
            </span>
          </Link>

          <div className="mx-auto hidden w-full max-w-xl md:block">
            <SmartSearch id="site-search" />
          </div>

          <div className="ml-auto hidden items-center gap-1 sm:flex">
            <Link
              to="/ai-chat"
              className="hidden items-center gap-2 rounded-full border border-border bg-secondary/60 px-3 py-1.5 text-xs font-semibold transition-colors hover:bg-secondary xl:flex"
            >
              <Sparkle className="h-4 w-4 text-gold" />
              <span className="leading-tight">
                AI Chat
                <span className="block text-[10px] font-normal text-muted-foreground">Ask anything</span>
              </span>
            </Link>
            <Link
              to="/compare"
              className="relative hidden rounded-full p-2.5 transition-colors hover:bg-secondary sm:block"
              aria-label="Compare products"
            >
              <Scale className="h-5 w-5" />
              <CountBadge value={compare.length} />
            </Link>
            <button
              type="button"
              onClick={() => toast.info("No new notifications right now.")}
              className="relative hidden rounded-full p-2.5 transition-colors hover:bg-secondary sm:block"
              aria-label="Notifications"
            >
              <Bell className="h-5 w-5" />
            </button>
            <Link to="/wishlist" className="relative rounded-full p-2.5 hover:bg-secondary" aria-label="Wishlist">
              <Heart className="h-5 w-5" />
              <CountBadge value={wishlist.length} />
            </Link>
            <Link to="/cart" className="relative flex items-center gap-2 rounded-full p-2.5 hover:bg-secondary">
              <span className="relative">
                <ShoppingBag className="h-5 w-5" />
                <CountBadge value={cartCount} tone="coral" />
              </span>
              <span className="hidden leading-tight lg:block">
                <span className="block text-xs font-semibold">Cart</span>
                <span className="block text-[10px] text-muted-foreground tabular-nums">
                  ₹{subtotal.toLocaleString("en-IN")}
                </span>
              </span>
            </Link>
            <Link to="/account" className="flex items-center gap-2 rounded-full p-2.5 hover:bg-secondary">
              <User className="h-5 w-5" />
              <span className="hidden leading-tight lg:block">
                <span className="block text-xs font-semibold">Account</span>
                <span className="block text-[10px] text-muted-foreground">Login / Register</span>
              </span>
            </Link>
          </div>
        </div>

        <div className="container-page pb-3 md:hidden">
          <SmartSearch id="site-search-mobile" />
        </div>
      </div>

      {/* Level 3 — navigation with mega menu */}
      <nav aria-label="Main" className="hidden border-b border-border bg-background/80 backdrop-blur-xl lg:block">
        <div className="container-page flex h-12 items-center gap-1 text-sm font-semibold">
          <div className="group relative">
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-full gradient-gold px-4 py-1.5 text-gold-foreground"
            >
              <Menu className="h-4 w-4" /> All Categories <ChevronDown className="h-3.5 w-3.5" />
            </button>
            <div className="invisible absolute left-0 top-full z-50 w-[560px] translate-y-1 rounded-2xl border border-border bg-popover p-3 opacity-0 shadow-[var(--shadow-lift)] transition-all group-hover:visible group-hover:translate-y-0 group-hover:opacity-100">
              <div className="grid grid-cols-2 gap-1">
                {categories.map((c) => (
                  <Link
                    key={c.slug}
                    to="/category/$slug"
                    params={{ slug: c.slug }}
                    className="flex items-center gap-3 rounded-xl p-2 transition-colors hover:bg-secondary"
                  >
                    <img src={c.image} alt="" className="h-10 w-10 rounded-xl object-cover" />
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold">{c.name}</span>
                      <span className="block truncate text-[11px] font-normal text-muted-foreground">
                        {c.tagline}
                      </span>
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {menu.map((item) => (
            <div key={item.id} className="group relative">
              <MenuLink
                item={item}
                showIcon={false}
                className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-foreground/80 transition-colors hover:bg-secondary hover:text-primary"
              />
              {item.children.length > 0 && (
                <div className="invisible absolute left-0 top-full z-50 min-w-52 translate-y-1 rounded-2xl border border-border bg-popover p-2 opacity-0 shadow-[var(--shadow-lift)] transition-all group-hover:visible group-hover:translate-y-0 group-hover:opacity-100">
                  {item.children.map((child) => (
                    <MenuLink
                      key={child.id}
                      item={child}
                      className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-foreground hover:bg-secondary"
                    />
                  ))}
                </div>
              )}
            </div>
          ))}

          {whatsapp && (
            <a
              href={whatsapp}
              target="_blank"
              rel="noreferrer"
              className="ml-auto inline-flex items-center gap-2 whitespace-nowrap rounded-full bg-secondary px-3.5 py-1.5 text-xs text-secondary-foreground transition-colors hover:bg-accent"
            >
              <WhatsAppIcon className="h-4 w-4" /> Order on WhatsApp
            </a>
          )}
        </div>
      </nav>
    </header>
  );
}

export { WhatsAppIcon };
