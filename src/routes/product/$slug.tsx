import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { Heart, Minus, Plus, RefreshCcw, ShieldCheck, Truck } from "lucide-react";
import { toast } from "sonner";
import { discountPercent, getCategory, getProduct, products, type Product } from "@/data/catalog";
import { ProductCard, Stars } from "@/components/shop/ProductCard";
import { PageHeader } from "@/components/site/PageHeader";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { inr, useShop } from "@/lib/shop-store";

export const Route = createFileRoute("/product/$slug")({
  loader: async ({ params }) => {
    const staticProduct = getProduct(params.slug);
    if (staticProduct) return { product: staticProduct };
    const { data } = await supabase
      .from("products")
      .select("*")
      .eq("slug", params.slug)
      .eq("is_active", true)
      .eq("status", "active")
      .maybeSingle();
    if (!data) throw notFound();
    return { product: mapDbProduct(data) };
  },
  head: ({ loaderData }) => {
    const p = loaderData?.product;
    if (!p) return {};
    return {
      meta: [
        { title: `${p.name} | Mazhalai Ulagam` },
        { name: "description", content: p.shortDescription },
        { property: "og:title", content: `${p.name} | Mazhalai Ulagam` },
        { property: "og:description", content: p.shortDescription },
        { property: "og:type", content: "product" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Product",
            name: p.name,
            description: p.description,
            aggregateRating: {
              "@type": "AggregateRating",
              ratingValue: p.rating,
              reviewCount: p.reviews,
            },
            offers: {
              "@type": "Offer",
              price: p.price,
              priceCurrency: "INR",
              availability: p.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
            },
          }),
        },
      ],
    };
  },
  errorComponent: () => (
    <div className="container-page py-20 text-center">
      <h1 className="font-display text-2xl font-bold">This product didn't load</h1>
      <p className="mt-2 text-sm text-muted-foreground">Please refresh or browse other products.</p>
    </div>
  ),
  notFoundComponent: () => (
    <div className="container-page py-20 text-center">
      <h1 className="font-display text-2xl font-bold">Product not found</h1>
      <Link to="/shop" className="mt-3 inline-block text-sm font-semibold text-primary hover:underline">
        Back to shop
      </Link>
    </div>
  ),
  component: ProductPage,
});

const reviewsSample = [
  { name: "Anitha M.", rating: 5, text: "Exactly as shown. Quality is genuinely premium." },
  { name: "Ramesh K.", rating: 4, text: "Good product, delivery took 3 days to Chennai." },
  { name: "Shalini P.", rating: 5, text: "My little one loves it. Will order again." },
];

function ProductPage() {
  const { product } = Route.useLoaderData() as { product: Product };
  const { addToCart, toggleWishlist, inWishlist } = useShop();
  const [qty, setQty] = useState(1);
  const [active, setActive] = useState(0);
  const category = getCategory(product.category);
  const related = products.filter((p) => p.category === product.category && p.slug !== product.slug).slice(0, 4);
  const wished = inWishlist(product.slug);

  return (
    <>
      <PageHeader
        title={product.name}
        crumbs={[
          { label: "Shop", to: "/shop" },
          { label: category?.name ?? "Category", to: "/category/$slug", params: { slug: product.category } },
          { label: product.name },
        ]}
      />

      <div className="container-page grid gap-10 py-10 lg:grid-cols-2">
        <div>
          <img
            src={product.images[active]}
            alt={product.name}
            width={800}
            height={800}
            className="aspect-square w-full rounded-3xl border border-border object-cover"
          />
          <div className="mt-3 flex gap-3">
            {product.images.map((img, i) => (
              <button
                key={img}
                onClick={() => setActive(i)}
                aria-label={`View image ${i + 1} of ${product.name}`}
                className={`overflow-hidden rounded-xl border-2 ${i === active ? "border-primary" : "border-border"}`}
              >
                <img src={img} alt="" loading="lazy" width={100} height={100} className="h-20 w-20 object-cover" />
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Stars rating={product.rating} /> {product.rating} ({product.reviews} reviews)
          </div>
          <div className="mt-4 flex flex-wrap items-baseline gap-3">
            <span className="text-3xl font-bold">{inr(product.price)}</span>
            <span className="text-lg text-muted-foreground line-through">{inr(product.mrp)}</span>
            <span className="rounded-full bg-sale px-2.5 py-1 text-xs font-bold text-primary-foreground">
              {discountPercent(product)}% OFF
            </span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Inclusive of all taxes</p>

          <p className="mt-4 text-sm text-muted-foreground">{product.shortDescription}</p>

          <p className="mt-4 text-sm font-semibold">
            {product.stock > 0 ? (
              <span className="text-teal">In stock — {product.stock} units available</span>
            ) : (
              <span className="text-destructive">Currently out of stock</span>
            )}
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <div className="flex items-center rounded-full border border-border">
              <button
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                aria-label="Decrease quantity"
                className="p-2.5 hover:text-primary"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="w-10 text-center text-sm font-bold tabular-nums">{qty}</span>
              <button
                onClick={() => setQty((q) => Math.min(product.stock, q + 1))}
                aria-label="Increase quantity"
                className="p-2.5 hover:text-primary"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <Button
              size="lg"
              disabled={product.stock === 0}
              onClick={() => {
                addToCart(product.slug, qty);
                toast.success("Added to cart");
              }}
            >
              Add to Cart
            </Button>
            <Button variant="hero" size="lg" disabled={product.stock === 0} asChild>
              <Link to="/checkout" onClick={() => addToCart(product.slug, qty)}>
                Buy Now
              </Link>
            </Button>
            <Button
              variant="outline"
              size="icon"
              aria-label={wished ? "Remove from wishlist" : "Add to wishlist"}
              onClick={() => {
                toggleWishlist(product.slug);
                toast.success(wished ? "Removed from wishlist" : "Added to wishlist");
              }}
            >
              <Heart className={wished ? "fill-primary text-primary" : ""} />
            </Button>
          </div>

          <ul className="mt-6 grid gap-3 rounded-2xl bg-accent/60 p-4 text-xs sm:grid-cols-3">
            <li className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-teal" /> Safety checked
            </li>
            <li className="flex items-center gap-2">
              <Truck className="h-5 w-5 text-teal" /> Ships in 24 hrs
            </li>
            <li className="flex items-center gap-2">
              <RefreshCcw className="h-5 w-5 text-teal" /> 7-day returns
            </li>
          </ul>
        </div>
      </div>

      <div className="container-page">
        <Tabs defaultValue="description">
          <TabsList className="flex-wrap">
            <TabsTrigger value="description">Description</TabsTrigger>
            <TabsTrigger value="specs">Specifications</TabsTrigger>
            <TabsTrigger value="shipping">Shipping & Returns</TabsTrigger>
            <TabsTrigger value="reviews">Reviews ({product.reviews})</TabsTrigger>
          </TabsList>
          <TabsContent value="description" className="surface-card mt-4 p-6 text-sm text-muted-foreground">
            {product.description}
          </TabsContent>
          <TabsContent value="specs" className="surface-card mt-4 p-6">
            <dl className="grid gap-3 sm:grid-cols-2">
              {product.specs.map((s) => (
                <div key={s.label} className="flex justify-between gap-4 border-b border-border pb-2 text-sm">
                  <dt className="text-muted-foreground">{s.label}</dt>
                  <dd className="font-semibold">{s.value}</dd>
                </div>
              ))}
            </dl>
          </TabsContent>
          <TabsContent value="shipping" className="surface-card mt-4 space-y-3 p-6 text-sm text-muted-foreground">
            <p>Dispatched from Coimbatore within 24 hours on working days. Free shipping on orders above ₹999.</p>
            <p>Metro cities: 2-4 working days. Other pincodes: 4-7 working days. Tracking shared over SMS and email.</p>
            <p>Returns accepted within 7 days of delivery for unused products in original packaging. Personalised items are non-returnable unless damaged.</p>
          </TabsContent>
          <TabsContent value="reviews" className="surface-card mt-4 space-y-4 p-6">
            {reviewsSample.map((r) => (
              <div key={r.name} className="border-b border-border pb-4 last:border-0">
                <div className="flex items-center gap-2">
                  <Stars rating={r.rating} />
                  <span className="text-sm font-bold">{r.name}</span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{r.text}</p>
              </div>
            ))}
          </TabsContent>
        </Tabs>
      </div>

      {related.length > 0 && (
        <section className="container-page mt-14">
          <h2 className="mb-6 font-display text-2xl font-bold">Related Products</h2>
          <div className="grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-4">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </>
  );
}
