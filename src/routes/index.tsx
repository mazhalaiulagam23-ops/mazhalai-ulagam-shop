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
import { blogPosts, categories, discountPercent, products, store, testimonials } from "@/data/catalog";
import { ProductCard, Stars } from "@/components/shop/ProductCard";
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

const slides = [
  {
    image: hero1,
    eyebrow: "Best Quality",
    title: "Baby Products, Return Gifts & More",
    subtitle: "Cute, safe and premium products for your little ones.",
    cta: "Shop Now",
    to: "/shop",
  },
  {
    image: hero2,
    eyebrow: "Learning Through Play",
    title: "Educational Toys That Grow With Them",
    subtitle: "Montessori-inspired wooden toys tested for toddler safety.",
    cta: "Explore Toys",
    to: "/category/$slug",
    params: { slug: "educational-toys" },
  },
  {
    image: hero3,
    eyebrow: "Wholesale Available",
    title: "Return Gifts For Every Celebration",
    subtitle: "Birthday, naming ceremony and festival gifting from ₹99.",
    cta: "Shop Return Gifts",
    to: "/category/$slug",
    params: { slug: "return-gifts" },
  },
] as const;

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
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((v) => (v + 1) % slides.length), 6000);
    return () => clearInterval(t);
  }, []);
  const s = slides[i];

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
            <Button variant="hero" size="lg" asChild>
              {"params" in s ? (
                <Link to={s.to} params={s.params as never}>
                  {s.cta} <ArrowRight className="h-4 w-4" />
                </Link>
              ) : (
                <Link to={s.to}>
                  {s.cta} <ArrowRight className="h-4 w-4" />
                </Link>
              )}
            </Button>
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

function Grid({ items }: { items: typeof products }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-4">
      {items.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  );
}

function Home() {
  const bestsellers = products.filter((p) => p.badge === "Bestseller" || p.rating >= 4.5).slice(0, 4);
  const newArrivals = [...products].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 4);
  const offers = [...products].sort((a, b) => discountPercent(b) - discountPercent(a)).slice(0, 4);

  return (
    <>
      <HeroCarousel />

      {/* Categories */}
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

      {/* Trust strip */}
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

      <section className="container-page mt-14">
        <SectionHeading title="Our Bestsellers" link="/shop" linkLabel="View all products" />
        <Grid items={bestsellers} />
      </section>

      <section className="container-page mt-14">
        <SectionHeading title="New Arrivals" link="/shop" linkLabel="View all products" />
        <Grid items={newArrivals} />
      </section>

      <section className="container-page mt-14">
        <SectionHeading title="Special Offers" link="/offers" linkLabel="All offers" />
        <Grid items={offers} />
      </section>

      {/* Promo banners */}
      <section className="container-page mt-14 grid gap-5 md:grid-cols-2">
        <div className="flex items-center justify-between gap-4 rounded-3xl bg-blush p-8">
          <div>
            <h2 className="font-display text-2xl font-bold text-blush-foreground">Special Return Gifts</h2>
            <p className="mt-1 text-sm text-muted-foreground">For birthdays, naming ceremonies and festivals.</p>
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
      </section>

      {/* Testimonials */}
      <section className="container-page mt-14">
        <SectionHeading title="Loved by Coimbatore Parents" />
        <div className="grid gap-5 md:grid-cols-3">
          {testimonials.map((t) => (
            <figure key={t.name} className="surface-card p-6">
              <Stars rating={t.rating} />
              <blockquote className="mt-3 text-sm text-muted-foreground">"{t.text}"</blockquote>
              <figcaption className="mt-4 text-sm font-bold">
                {t.name}
                <span className="block text-xs font-normal text-muted-foreground">{t.city}</span>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      {/* Instagram gallery */}
      <section className="container-page mt-14">
        <SectionHeading title="Follow Us on Instagram" />
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
          {products.slice(0, 6).map((p) => (
            <a
              key={p.id}
              href={store.instagram}
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

      {/* Blog previews */}
      <section className="container-page mt-14">
        <SectionHeading title="Parenting Tips & Guides" link="/blog" linkLabel="Read the blog" />
        <div className="grid gap-5 md:grid-cols-3">
          {blogPosts.map((post) => (
            <article key={post.slug} className="surface-card p-6">
              <p className="text-xs font-bold uppercase tracking-wide text-teal">{post.category}</p>
              <h3 className="mt-2 font-display text-lg font-bold">{post.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{post.excerpt}</p>
              <p className="mt-4 text-xs text-muted-foreground">
                {new Date(post.date).toLocaleDateString("en-IN", { dateStyle: "medium" })} · {post.readMinutes} min read
              </p>
              <Link to="/blog" className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
                Read more <ArrowRight className="h-4 w-4" />
              </Link>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
