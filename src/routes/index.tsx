import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  BadgeIndianRupee,
  Gift,
  Instagram,
  PackageCheck,
  RefreshCcw,
  ShieldCheck,
  Sparkles,
  Truck,
} from "lucide-react";
import { blogPosts, discountPercent, type Product } from "@/data/catalog";
import { ProductCard, Stars } from "@/components/shop/ProductCard";
import { useCatalog } from "@/lib/db-products";
import { useBanners, useHomeSections, useSiteCategories, useSiteSettings, useTestimonials } from "@/lib/cms";
import { Button } from "@/components/ui/button";
import hero1 from "@/assets/hero-1.jpg";
import hero2 from "@/assets/hero-2.jpg";
import hero3 from "@/assets/hero-3.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "MazhalaiHub – Baby & Kids Online Store" },
      {
        name: "description",
        content:
          "Shop safe, premium baby & kids products online at MazhalaiHub — toys, educational toys, baby care, kids fashion, stationery and return gifts with pan-India delivery from Coimbatore.",
      },
      {
        name: "keywords",
        content:
          "baby products online, kids toys, educational toys, baby care, kids fashion, return gifts, MazhalaiHub",
      },
      { property: "og:title", content: "MazhalaiHub – Baby & Kids Online Store" },
      {
        property: "og:description",
        content:
          "Cute, safe and premium baby & kids products — toys, fashion, care and return gifts. Fast pan-India delivery.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://mazhalaihub.com/" },
      { property: "og:image", content: "https://mazhalaihub.com/og-cover.jpg" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:image", content: "https://mazhalaihub.com/og-cover.jpg" },
    ],
    links: [{ rel: "canonical", href: "https://mazhalaihub.com/" }],
  }),
  component: Home,
});

const fallbackImages = [hero1, hero2, hero3];

const OFFER_WINDOW_MS = 1000 * 60 * 60 * 52;

function Countdown() {
  // Computed only after mount so the server and client markup always match.
  const [left, setLeft] = useState<number | null>(null);
  useEffect(() => {
    const end = Date.now() + OFFER_WINDOW_MS;
    setLeft(end - Date.now());
    const t = setInterval(() => setLeft(end - Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  if (left === null || left <= 0) return null;

  const parts = [
    { label: "Hrs", value: Math.floor(left / 3600000) },
    { label: "Min", value: Math.floor((left / 60000) % 60) },
    { label: "Sec", value: Math.floor((left / 1000) % 60) },
  ];
  return (
    <div className="flex items-center gap-2" aria-label="Offer ends in">
      <span className="text-[10px] font-semibold uppercase text-muted-foreground sm:text-xs">Offer ends in</span>
      {parts.map((p) => (
        <span key={p.label} className="rounded-lg bg-card px-2 py-1 text-center shadow-[var(--shadow-soft)]">
          <span className="block text-sm font-bold tabular-nums text-primary">
            {String(p.value).padStart(2, "0")}
          </span>
          <span className="block text-[10px] text-muted-foreground">{p.label}</span>
        </span>
      ))}
    </div>
  );
}

function HeroCarousel() {
  const { data: banners = [] } = useBanners("hero");
  const [i, setI] = useState(0);

  const slides = banners.length
    ? banners.map((b, idx) => ({
        image: b.image_url || fallbackImages[idx % fallbackImages.length],
        eyebrow: b.eyebrow,
        title: b.title,
        subtitle: b.subtitle,
        cta: b.cta_label,
        href: b.cta_href || "/shop",
      }))
    : [
        {
          image: hero1,
          eyebrow: "Best Quality",
          title: "Baby Products, Return Gifts & More",
          subtitle: "Cute, safe and premium products for your little ones.",
          cta: "Shop Now",
          href: "/shop",
        },
      ];

  useEffect(() => {
    if (slides.length < 2) return;
    const t = setInterval(() => setI((v) => (v + 1) % slides.length), 6000);
    return () => clearInterval(t);
  }, [slides.length]);

  const s = slides[Math.min(i, slides.length - 1)];

  return (
    <section className="relative overflow-hidden gradient-hero">
      {/* Floating toy motifs */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute left-[6%] top-16 h-16 w-16 rounded-full bg-gold/25 blur-[2px] animate-float"
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute right-[12%] top-24 h-10 w-10 rounded-3xl bg-sale/25 animate-float-slow"
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute bottom-16 left-[42%] h-20 w-20 rounded-full bg-primary/10 animate-float-slow"
      />

      <div className="container-page relative grid items-center gap-8 py-10 sm:gap-10 sm:py-14 lg:grid-cols-[1.05fr_1fr] lg:py-24">
        <div className="animate-rise">
          <p className="inline-flex items-center gap-2 rounded-full border border-border bg-card/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground backdrop-blur">
            <Sparkles className="h-3.5 w-3.5 text-gold" /> {s.eyebrow || "Premium quality · Safe & non-toxic"}
          </p>
          <h1 className="mt-5 font-display text-3xl font-semibold leading-[1.08] tracking-tight min-[390px]:text-4xl sm:text-6xl">
            {s.title}
          </h1>
          <p className="mt-5 max-w-lg text-base leading-relaxed text-muted-foreground">{s.subtitle}</p>

           <div className="mt-7 grid gap-3 min-[390px]:grid-cols-2 sm:flex sm:flex-wrap sm:items-center">
             <Button size="lg" className="w-full px-5 sm:w-auto sm:px-8" asChild>
              <a href={s.href}>
                {s.cta || "Shop Now"} <ArrowRight className="h-4 w-4" />
              </a>
            </Button>
             <Button variant="outline" size="lg" className="w-full px-5 sm:w-auto sm:px-8" asChild>
              <Link to="/ai-chat">
                <Sparkles className="h-4 w-4 text-gold" /> Talk to AI Assistant
              </Link>
            </Button>
          </div>

          <div className="mt-7 grid grid-cols-2 gap-x-3 gap-y-3 text-[11px] font-semibold text-muted-foreground sm:flex sm:flex-wrap sm:gap-x-6 sm:text-xs">
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-primary" /> 100% Safe
            </span>
            <span className="inline-flex items-center gap-1.5">
              <PackageCheck className="h-4 w-4 text-primary" /> Premium Quality
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Truck className="h-4 w-4 text-primary" /> Fast Delivery
            </span>
            <span className="inline-flex items-center gap-1.5">
              <RefreshCcw className="h-4 w-4 text-primary" /> Easy Returns
            </span>
          </div>
          <div className="mt-6">
            <Countdown />
          </div>
        </div>

        <div className="relative">
           <div className="overflow-hidden rounded-2xl border border-border/60 shadow-[var(--shadow-lift)] sm:rounded-[2rem]">
            <img
              src={s.image}
              alt="Happy baby with soft toys from Mazhalai Ulagam"
              width={1200}
              height={1000}
              fetchPriority="high"
              className="aspect-[6/5] w-full object-cover"
            />
          </div>
          <div className="glass-panel absolute -bottom-5 left-3 w-52 p-3 sm:-bottom-6 sm:left-auto sm:right-6 sm:w-56 sm:p-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
              Limited time offer
            </p>
             <p className="mt-1 font-display text-2xl font-semibold text-gold-gradient sm:text-3xl">FLAT 30% OFF</p>
            <p className="text-xs text-muted-foreground">On selected items</p>
            <Button size="sm" className="mt-3 w-full" asChild>
              <Link to="/offers">Shop the sale</Link>
            </Button>
          </div>
        </div>

        {slides.length > 1 && (
          <div className="flex gap-2 lg:col-span-2">
            {slides.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setI(idx)}
                aria-label={`Go to slide ${idx + 1}`}
                aria-current={idx === i}
                className={`h-2 rounded-full transition-all ${idx === i ? "w-8 bg-primary" : "w-2 bg-border"}`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

const AGE_GROUPS = [
  { label: "0 – 12 Months", slug: "baby-products", tint: "bg-mint" },
  { label: "1 – 3 Years", slug: "toys-games", tint: "bg-blush" },
  { label: "3 – 5 Years", slug: "educational-toys", tint: "bg-cream" },
  { label: "5 – 10 Years", slug: "stationery", tint: "bg-secondary" },
  { label: "Gift Collections", slug: "return-gifts", tint: "bg-accent" },
];


function SectionHeading({ title, link, linkLabel }: { title: string; link?: string; linkLabel?: string }) {
  return (
    <div className="mb-5 grid grid-cols-[minmax(0,1fr)_auto] items-end gap-3 sm:mb-6 sm:gap-4">
      <div className="min-w-0">
        <h2 className="font-display text-xl font-semibold tracking-tight sm:text-[2rem]">{title}</h2>
        <span className="mt-2 block h-0.5 w-14 rounded-full gradient-gold" aria-hidden="true" />
      </div>
      {link && (
        <Link to={link} className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-primary hover:underline sm:text-sm">
          {linkLabel} <ArrowRight className="h-4 w-4" />
        </Link>
      )}
    </div>
  );
}

function Grid({ items }: { items: Product[] }) {
  return (
    <div className="grid grid-cols-2 gap-2.5 min-[390px]:gap-3 sm:gap-5 lg:grid-cols-4">
      {items.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  );
}

const DEFAULT_SECTIONS = [
  { id: "d1", section_key: "hero", title: "", subtitle: "", is_visible: true },
  { id: "d2", section_key: "categories", title: "", subtitle: "", is_visible: true },
  { id: "d3", section_key: "trust", title: "", subtitle: "", is_visible: true },
  { id: "d4", section_key: "bestsellers", title: "Our Bestsellers", subtitle: "", is_visible: true },
  { id: "d5", section_key: "new_arrivals", title: "New Arrivals", subtitle: "", is_visible: true },
  { id: "d6", section_key: "offers", title: "Special Offers", subtitle: "", is_visible: true },
  { id: "d7", section_key: "promos", title: "", subtitle: "", is_visible: true },
  { id: "d8", section_key: "testimonials", title: "Loved by Coimbatore Parents", subtitle: "", is_visible: true },
  { id: "d9", section_key: "instagram", title: "Follow Us on Instagram", subtitle: "", is_visible: true },
  { id: "d10", section_key: "blog", title: "Parenting Tips & Guides", subtitle: "", is_visible: true },
];

function Home() {
  const { products } = useCatalog();
  const categories = useSiteCategories();
  const { settings } = useSiteSettings();
  const { data: sections } = useHomeSections();
  const { data: cmsTestimonials = [] } = useTestimonials();
  const { data: promoBanners = [] } = useBanners("promo");

  const list = (sections?.length ? sections : DEFAULT_SECTIONS).filter((s) => s.is_visible);

  const bestsellers = products.filter((p) => p.badge === "Bestseller" || p.rating >= 4.5).slice(0, 4);
  const newArrivals = [...products].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 4);
  const offers = [...products].sort((a, b) => discountPercent(b) - discountPercent(a)).slice(0, 4);

  const render = (key: string, title: string, subtitle: string) => {
    switch (key) {
      case "hero":
        return <HeroCarousel />;

      case "categories":
        return (
          <>
            <section className="container-page mt-12 sm:mt-16">
              <SectionHeading title="Shop by Age" link="/shop" linkLabel="Browse all" />
              <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-5">
                {AGE_GROUPS.map((a) => (
                  <Link
                    key={a.label}
                    to="/category/$slug"
                    params={{ slug: a.slug }}
                    className={`hover-lift min-w-0 rounded-2xl ${a.tint} p-4 transition-colors sm:rounded-3xl sm:p-5`}
                  >
                    <span className="block font-display text-base font-semibold">{a.label}</span>
                    <span className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground">
                      Shop now <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                  </Link>
                ))}
              </div>
            </section>

            <section className="container-page mt-12 sm:mt-16">
              <SectionHeading title={title || "Shop by Category"} link="/shop" linkLabel="View all" />
               <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 sm:gap-4 lg:grid-cols-8">
                {categories.map((c) => (
                  <Link
                    key={c.slug}
                    to="/category/$slug"
                    params={{ slug: c.slug }}
                     className="group flex min-w-0 flex-col items-center gap-2 rounded-2xl border border-transparent p-2 text-center transition-all hover:border-border hover:bg-card hover:shadow-[var(--shadow-soft)] sm:gap-3 sm:rounded-3xl sm:p-3"
                  >
                    <img
                      src={c.image}
                      alt={c.name}
                      loading="lazy"
                      width={200}
                      height={200}
                       className="aspect-square w-full max-w-20 rounded-full object-cover ring-1 ring-border transition-transform duration-500 group-hover:scale-105"
                    />
                    <span className="text-xs font-semibold">{c.name}</span>
                  </Link>
                ))}
              </div>
            </section>
          </>
        );

      case "trust":
        return (
          <section className="container-page mt-16">
            <ul className="grid gap-6 rounded-3xl border border-border bg-card p-7 shadow-[var(--shadow-soft)] sm:grid-cols-2 lg:grid-cols-4">
              {[
                { icon: ShieldCheck, title: "100% Safe Products", sub: "Non-toxic & certified" },
                { icon: BadgeIndianRupee, title: "Secure Payments", sub: "UPI, cards & net banking" },
                { icon: Truck, title: "Fast Delivery", sub: "Same-day dispatch" },
                { icon: RefreshCcw, title: "Easy Returns", sub: "Hassle-free 7-day returns" },
              ].map((t) => (
                <li key={t.title} className="flex items-center gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-secondary">
                    <t.icon className="h-5 w-5 text-primary" aria-hidden="true" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-bold">{t.title}</span>
                    <span className="block text-xs text-muted-foreground">{t.sub}</span>
                  </span>
                </li>
              ))}
            </ul>
          </section>
        );

      case "bestsellers":
        return (
          <section className="container-page mt-14">
            <SectionHeading title={title || "Our Bestsellers"} link="/shop" linkLabel="View all products" />
            <Grid items={bestsellers} />
          </section>
        );

      case "new_arrivals":
        return (
          <section className="container-page mt-14">
            <SectionHeading title={title || "New Arrivals"} link="/shop" linkLabel="View all products" />
            <Grid items={newArrivals} />
          </section>
        );

      case "offers":
        return (
          <section className="container-page mt-14">
            <SectionHeading title={title || "Special Offers"} link="/offers" linkLabel="All offers" />
            <Grid items={offers} />
          </section>
        );

      case "promos":
        return (
          <section className="container-page mt-14 grid gap-5 md:grid-cols-2">
            {promoBanners.length ? (
              promoBanners.map((b) => (
                <div key={b.id} className="flex items-center justify-between gap-4 rounded-3xl bg-blush p-8">
                  <div>
                    <h2 className="font-display text-2xl font-bold text-blush-foreground">{b.title}</h2>
                    <p className="mt-1 text-sm text-muted-foreground">{b.subtitle}</p>
                    {b.cta_label && (
                      <Button variant="gold" className="mt-4" asChild>
                        <a href={b.cta_href || "/shop"}>{b.cta_label}</a>
                      </Button>
                    )}
                  </div>
                  {b.image_url ? (
                    <img src={b.image_url} alt="" className="hidden h-24 w-24 rounded-2xl object-cover sm:block" />
                  ) : (
                    <Gift className="hidden h-20 w-20 text-primary sm:block" aria-hidden="true" />
                  )}
                </div>
              ))
            ) : (
              <>
                <div className="flex items-center justify-between gap-4 rounded-3xl bg-blush p-8">
                  <div>
                    <h2 className="font-display text-2xl font-bold text-blush-foreground">Special Return Gifts</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      For birthdays, naming ceremonies and festivals.
                    </p>
                    <Button variant="gold" className="mt-4" asChild>
                      <Link to="/category/$slug" params={{ slug: "return-gifts" }}>
                        Shop collection
                      </Link>
                    </Button>
                  </div>
                  <Gift className="hidden h-20 w-20 text-primary sm:block" aria-hidden="true" />
                </div>
                <div className="flex items-center justify-between gap-4 rounded-3xl bg-accent p-8">
                  <div>
                    <h2 className="font-display text-2xl font-bold text-accent-foreground">New Born Essentials</h2>
                    <p className="mt-1 text-sm text-muted-foreground">Everything for your baby's first months.</p>
                    <Button variant="teal" className="mt-4" asChild>
                      <Link to="/category/$slug" params={{ slug: "baby-products" }}>
                        Shop now
                      </Link>
                    </Button>
                  </div>
                  <PackageCheck className="hidden h-20 w-20 text-teal sm:block" aria-hidden="true" />
                </div>
              </>
            )}
          </section>
        );

      case "testimonials":
        return (
          <section className="container-page mt-14">
            <SectionHeading title={title || "Loved by Coimbatore Parents"} />
            <div className="grid gap-5 md:grid-cols-3">
              {cmsTestimonials.map((t) => (
                <figure key={t.id} className="surface-card p-6">
                  <Stars rating={t.rating} />
                  <blockquote className="mt-3 text-sm text-muted-foreground">"{t.quote}"</blockquote>
                  <figcaption className="mt-4 text-sm font-bold">
                    {t.name}
                    <span className="block text-xs font-normal text-muted-foreground">{t.city}</span>
                  </figcaption>
                </figure>
              ))}
            </div>
          </section>
        );

      case "instagram":
        return (
          <section className="container-page mt-14">
            <SectionHeading title={title || "Follow Us on Instagram"} />
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
              {products.slice(0, 6).map((p) => (
                <a
                  key={p.id}
                  href={settings.instagram}
                  target="_blank"
                  rel="noreferrer"
                  className="group relative overflow-hidden rounded-2xl"
                >
                  <img
                    src={p.images[0]}
                    alt={`${p.name} on Instagram`}
                    loading="lazy"
                    width={400}
                    height={400}
                    className="aspect-square w-full object-cover transition-transform group-hover:scale-110"
                  />
                  <span className="absolute inset-0 flex items-center justify-center bg-foreground/40 opacity-0 transition-opacity group-hover:opacity-100">
                    <Instagram className="h-6 w-6 text-primary-foreground" aria-hidden="true" />
                  </span>
                </a>
              ))}
            </div>
          </section>
        );

      case "blog":
        return (
          <section className="container-page mt-14">
            <SectionHeading title={title || "Parenting Tips & Guides"} link="/blog" linkLabel="Read the blog" />
            <div className="grid gap-5 md:grid-cols-3">
              {blogPosts.map((post) => (
                <article key={post.slug} className="surface-card p-6">
                  <p className="text-xs font-bold uppercase tracking-wide text-teal">{post.category}</p>
                  <h3 className="mt-2 font-display text-lg font-bold">{post.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{post.excerpt}</p>
                  <p className="mt-4 text-xs text-muted-foreground">
                    {new Date(post.date).toLocaleDateString("en-IN", { dateStyle: "medium" })} · {post.readMinutes} min
                    read
                  </p>
                  <Link
                    to="/blog"
                    className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
                  >
                    Read more <ArrowRight className="h-4 w-4" />
                  </Link>
                </article>
              ))}
            </div>
          </section>
        );

      default:
        // Custom text block created from the admin CMS.
        if (!title && !subtitle) return null;
        return (
          <section className="container-page mt-14">
            <SectionHeading title={title} />
            <p className="max-w-3xl text-sm text-muted-foreground">{subtitle}</p>
          </section>
        );
    }
  };

  return <>{list.map((s) => <div key={s.id}>{render(s.section_key, s.title, s.subtitle)}</div>)}</>;
}
