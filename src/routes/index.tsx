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
      { title: "Mazhalai Ulagam | Baby Products & Return Gifts in Coimbatore" },
      {
        name: "description",
        content:
          "Baby products, return gifts, toys, educational toys, baby gear, kids fashion, organic baby care and stationery. Premium quality, wholesale rates, pan-India delivery from Coimbatore.",
      },
      { property: "og:title", content: "Mazhalai Ulagam | Baby Products & Return Gifts in Coimbatore" },
      {
        property: "og:description",
        content: "Cute, safe and premium products for your little ones. Wholesale available. Fast delivery.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

const fallbackImages = [hero1, hero2, hero3];

const offerEnd = new Date(Date.now() + 1000 * 60 * 60 * 52);

function Countdown() {
  const [left, setLeft] = useState(offerEnd.getTime() - Date.now());
  useEffect(() => {
    const t = setInterval(() => setLeft(offerEnd.getTime() - Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  if (left <= 0) return null;
  const parts = [
    { label: "Hrs", value: Math.floor(left / 3600000) },
    { label: "Min", value: Math.floor((left / 60000) % 60) },
    { label: "Sec", value: Math.floor((left / 1000) % 60) },
  ];
  return (
    <div className="flex items-center gap-2" aria-label="Offer ends in">
      <span className="text-xs font-semibold uppercase text-muted-foreground">Offer ends in</span>
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
      <img
        src={s.image}
        alt=""
        aria-hidden="true"
        width={1600}
        height={900}
        className="absolute inset-0 h-full w-full object-cover opacity-70"
      />
      <div className="container-page relative py-16 sm:py-24">
        <div className="max-w-xl rounded-3xl bg-card/80 p-7 backdrop-blur-sm sm:p-10">
          <p className="font-display text-lg text-primary">{s.eyebrow}</p>
          <h1 className="mt-1 font-display text-3xl font-extrabold leading-tight text-foreground sm:text-5xl">
            {s.title}
          </h1>
          <p className="mt-3 text-sm text-muted-foreground sm:text-base">{s.subtitle}</p>
          <div className="mt-6 flex flex-wrap items-center gap-4">
            {s.cta && (
              <Button variant="hero" size="lg" asChild>
                <a href={s.href}>
                  {s.cta} <ArrowRight className="h-4 w-4" />
                </a>
              </Button>
            )}
            <Countdown />
          </div>
          <div className="mt-6 flex flex-wrap gap-4 text-xs font-semibold text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-teal" /> Premium Quality
            </span>
            <span className="inline-flex items-center gap-1.5">
              <PackageCheck className="h-4 w-4 text-teal" /> Wholesale Available
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Truck className="h-4 w-4 text-teal" /> Fast Delivery
            </span>
          </div>
        </div>

        {slides.length > 1 && (
          <div className="mt-6 flex gap-2">
            {slides.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setI(idx)}
                aria-label={`Go to slide ${idx + 1}`}
                aria-current={idx === i}
                className={`h-2.5 rounded-full transition-all ${idx === i ? "w-8 bg-primary" : "w-2.5 bg-card"}`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function SectionHeading({ title, link, linkLabel }: { title: string; link?: string; linkLabel?: string }) {
  return (
    <div className="mb-6 flex items-end justify-between gap-4">
      <div>
        <h2 className="font-display text-2xl font-bold sm:text-3xl">{title}</h2>
        <span className="mt-2 block h-1 w-16 rounded-full gradient-primary" aria-hidden="true" />
      </div>
      {link && (
        <Link to={link} className="inline-flex items-center gap-1 text-sm font-semibold text-teal hover:underline">
          {linkLabel} <ArrowRight className="h-4 w-4" />
        </Link>
      )}
    </div>
  );
}

function Grid({ items }: { items: Product[] }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-4">
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
          <section className="container-page -mt-8 relative z-10">
            <div className="surface-card grid grid-cols-2 gap-2 p-5 sm:grid-cols-4 lg:grid-cols-8">
              {categories.map((c) => (
                <Link
                  key={c.slug}
                  to="/category/$slug"
                  params={{ slug: c.slug }}
                  className="group flex flex-col items-center gap-2 rounded-2xl p-3 text-center transition-colors hover:bg-secondary"
                >
                  <img
                    src={c.image}
                    alt={c.name}
                    loading="lazy"
                    width={200}
                    height={200}
                    className="h-16 w-16 rounded-full object-cover ring-2 ring-blush transition-transform group-hover:scale-105"
                  />
                  <span className="text-xs font-semibold">{c.name}</span>
                </Link>
              ))}
            </div>
          </section>
        );

      case "trust":
        return (
          <section className="container-page mt-8">
            <ul className="grid gap-3 rounded-3xl bg-accent/60 p-5 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { icon: ShieldCheck, title: "100% Safe Products", sub: "For your little ones" },
                { icon: BadgeIndianRupee, title: "Secure Payments", sub: "UPI, cards & net banking" },
                { icon: Truck, title: "Fast & Reliable Delivery", sub: "Pan-India shipping" },
                { icon: RefreshCcw, title: "Easy Returns", sub: "Hassle-free 7-day returns" },
              ].map((t) => (
                <li key={t.title} className="flex items-center gap-3">
                  <t.icon className="h-8 w-8 shrink-0 text-teal" aria-hidden="true" />
                  <span>
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
