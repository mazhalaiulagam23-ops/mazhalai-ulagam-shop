import { Link } from "@tanstack/react-router";
import { Heart, Eye, Scale, ShoppingCart, Star, Truck, Zap } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import { discountPercent, type Product } from "@/data/catalog";
import { inr, useShop } from "@/lib/shop-store";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export function Stars({ rating, className }: { rating: number; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-0.5", className)} aria-label={`Rated ${rating} out of 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={cn("h-3.5 w-3.5", i <= Math.round(rating) ? "fill-gold text-gold" : "text-border")}
          aria-hidden="true"
        />
      ))}
    </span>
  );
}

/** Friendly delivery estimate, three days out. */
export function deliveryEstimate(days = 3) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
}

function IconAction({
  label,
  active,
  onClick,
  children,
}: {
  label: string;
  active?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={active}
      className={cn(
        "flex h-9 w-9 items-center justify-center rounded-full border border-border/70 backdrop-blur-md transition-all hover:scale-105",
        active ? "bg-primary text-primary-foreground" : "bg-card/85 text-muted-foreground hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

export function ProductCard({ product }: { product: Product }) {
  const { addToCart, toggleWishlist, inWishlist, toggleCompare, inCompare } = useShop();
  const [quickView, setQuickView] = useState(false);
  const off = discountPercent(product);
  const wished = inWishlist(product.slug);
  const compared = inCompare(product.slug);
  const lowStock = product.stock > 0 && product.stock <= 5;

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-[var(--shadow-soft)] transition-all duration-500 hover:-translate-y-1.5 hover:shadow-[var(--shadow-lift)]">
      <div className="pointer-events-none absolute left-3 top-3 z-10 flex flex-col items-start gap-1.5">
        {product.badge && (
          <span className="rounded-full bg-primary px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-primary-foreground">
            {product.badge}
          </span>
        )}
        {off > 0 && (
          <span className="rounded-full bg-sale px-2.5 py-1 text-[10px] font-bold text-primary-foreground">
            {off}% OFF
          </span>
        )}
      </div>

      <div className="absolute right-3 top-3 z-10 flex flex-col gap-2 sm:translate-x-2 sm:opacity-0 sm:transition-all sm:duration-300 sm:group-hover:translate-x-0 sm:group-hover:opacity-100">
        <IconAction
          label={wished ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`}
          active={wished}
          onClick={() => {
            toggleWishlist(product.slug);
            toast.success(wished ? "Removed from wishlist" : "Added to wishlist");
          }}
        >
          <Heart className={cn("h-4 w-4", wished && "fill-current")} />
        </IconAction>
        <IconAction
          label={`Compare ${product.name}`}
          active={compared}
          onClick={() => {
            const ok = toggleCompare(product.slug);
            if (!ok) toast.error("You can compare up to 4 products");
            else toast.success(compared ? "Removed from compare" : "Added to compare");
          }}
        >
          <Scale className="h-4 w-4" />
        </IconAction>
        <IconAction label={`Quick view ${product.name}`} onClick={() => setQuickView(true)}>
          <Eye className="h-4 w-4" />
        </IconAction>
      </div>

      <Link
        to="/product/$slug"
        params={{ slug: product.slug }}
        className="block overflow-hidden bg-secondary/40"
        aria-label={product.name}
      >
        <img
          src={product.images[0]}
          alt={product.name}
          loading="lazy"
          decoding="async"
          width={800}
          height={800}
          className="aspect-square w-full object-cover transition-transform duration-700 group-hover:scale-107"
        />
      </Link>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <Link
          to="/category/$slug"
          params={{ slug: product.category }}
          className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground hover:text-primary"
        >
          {product.category.replace(/-/g, " ")}
        </Link>
        <Link
          to="/product/$slug"
          params={{ slug: product.slug }}
          className="line-clamp-2 font-display text-[15px] font-semibold leading-snug text-foreground hover:text-primary"
        >
          {product.name}
        </Link>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Stars rating={product.rating} />
          <span>({product.reviews} reviews)</span>
        </div>

        <div className="mt-auto space-y-2 pt-1">
          <div className="flex items-baseline gap-2">
            <span className="font-display text-xl font-semibold text-foreground">{inr(product.price)}</span>
            {product.mrp > product.price && (
              <span className="text-sm text-muted-foreground line-through">{inr(product.mrp)}</span>
            )}
          </div>
          <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <Truck className="h-3.5 w-3.5 text-primary" /> Delivery by {deliveryEstimate()}
          </p>
          <p className="text-[11px] font-semibold">
            {product.stock <= 0 ? (
              <span className="text-destructive">Out of stock</span>
            ) : lowStock ? (
              <span className="text-sale">Only {product.stock} left</span>
            ) : (
              <span className="text-primary">In stock</span>
            )}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              disabled={product.stock <= 0}
              onClick={() => {
                addToCart(product.slug);
                toast.success(`${product.name} added to cart`);
              }}
            >
              <ShoppingCart className="h-4 w-4" /> Add
            </Button>
            <Button size="sm" className="flex-1" disabled={product.stock <= 0} asChild>
              <Link to="/checkout" onClick={() => addToCart(product.slug)}>
                <Zap className="h-4 w-4" /> Buy
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <Dialog open={quickView} onOpenChange={setQuickView}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-display">{product.name}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-5 sm:grid-cols-2">
            <img
              src={product.images[0]}
              alt={product.name}
              loading="lazy"
              className="aspect-square w-full rounded-2xl object-cover"
            />
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Stars rating={product.rating} /> ({product.reviews} reviews)
              </div>
              <div className="flex items-baseline gap-2">
                <span className="font-display text-2xl font-semibold">{inr(product.price)}</span>
                {product.mrp > product.price && (
                  <span className="text-sm text-muted-foreground line-through">{inr(product.mrp)}</span>
                )}
              </div>
              <p className="text-sm text-muted-foreground">{product.shortDescription}</p>
              <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Truck className="h-4 w-4 text-primary" /> Delivery by {deliveryEstimate()}
              </p>
              <p className="text-sm">
                {product.stock > 0 ? (
                  <span className="font-medium text-primary">In stock ({product.stock} left)</span>
                ) : (
                  <span className="font-medium text-destructive">Out of stock</span>
                )}
              </p>
              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={() => {
                    addToCart(product.slug);
                    toast.success("Added to cart");
                    setQuickView(false);
                  }}
                >
                  Add to Cart
                </Button>
                <Button variant="outline" asChild>
                  <Link to="/product/$slug" params={{ slug: product.slug }}>
                    View details
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </article>
  );
}
