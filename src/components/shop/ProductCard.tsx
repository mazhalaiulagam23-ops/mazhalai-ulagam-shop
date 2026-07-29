import { Link } from "@tanstack/react-router";
import { Heart, Eye, ShoppingCart, Star } from "lucide-react";
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

export function ProductCard({ product }: { product: Product }) {
  const { addToCart, toggleWishlist, inWishlist } = useShop();
  const [quickView, setQuickView] = useState(false);
  const off = discountPercent(product);
  const wished = inWishlist(product.slug);

  return (
    <article className="group surface-card relative flex flex-col overflow-hidden transition-shadow hover:shadow-[var(--shadow-lift)]">
      <div className="absolute left-3 top-3 z-10 flex flex-col gap-1">
        {product.badge && (
          <span className="rounded-full bg-teal px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-teal-foreground">
            {product.badge}
          </span>
        )}
        {off > 0 && (
          <span className="rounded-full bg-sale px-2.5 py-1 text-[11px] font-bold text-primary-foreground">
            {off}% OFF
          </span>
        )}
      </div>

      <div className="absolute right-3 top-3 z-10 flex flex-col gap-2 opacity-100 sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100">
        <button
          type="button"
          onClick={() => {
            toggleWishlist(product.slug);
            toast.success(wished ? "Removed from wishlist" : "Added to wishlist");
          }}
          aria-label={wished ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`}
          className="rounded-full bg-card p-2 shadow-[var(--shadow-soft)] transition-colors hover:bg-secondary"
        >
          <Heart className={cn("h-4 w-4", wished ? "fill-primary text-primary" : "text-muted-foreground")} />
        </button>
        <button
          type="button"
          onClick={() => setQuickView(true)}
          aria-label={`Quick view ${product.name}`}
          className="rounded-full bg-card p-2 shadow-[var(--shadow-soft)] transition-colors hover:bg-secondary"
        >
          <Eye className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>

      <Link to="/product/$slug" params={{ slug: product.slug }} className="block bg-secondary/40">
        <img
          src={product.images[0]}
          alt={product.name}
          loading="lazy"
          width={800}
          height={800}
          className="aspect-square w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      </Link>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <Link
          to="/category/$slug"
          params={{ slug: product.category }}
          className="text-[11px] font-semibold uppercase tracking-wide text-teal hover:underline"
        >
          {product.category.replace(/-/g, " ")}
        </Link>
        <Link
          to="/product/$slug"
          params={{ slug: product.slug }}
          className="line-clamp-2 text-sm font-semibold text-foreground hover:text-primary"
        >
          {product.name}
        </Link>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Stars rating={product.rating} />
          <span>({product.reviews})</span>
        </div>
        <div className="mt-auto flex items-baseline gap-2">
          <span className="text-lg font-bold text-foreground">{inr(product.price)}</span>
          {product.mrp > product.price && (
            <span className="text-sm text-muted-foreground line-through">{inr(product.mrp)}</span>
          )}
        </div>
        <Button
          variant="soft"
          size="sm"
          className="mt-2 w-full"
          onClick={() => {
            addToCart(product.slug);
            toast.success(`${product.name} added to cart`);
          }}
        >
          <ShoppingCart className="h-4 w-4" /> Add to Cart
        </Button>
      </div>

      <Dialog open={quickView} onOpenChange={setQuickView}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{product.name}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-5 sm:grid-cols-2">
            <img
              src={product.images[0]}
              alt={product.name}
              loading="lazy"
              className="aspect-square w-full rounded-xl object-cover"
            />
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Stars rating={product.rating} /> ({product.reviews} reviews)
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold">{inr(product.price)}</span>
                <span className="text-sm text-muted-foreground line-through">{inr(product.mrp)}</span>
              </div>
              <p className="text-sm text-muted-foreground">{product.shortDescription}</p>
              <p className="text-sm">
                {product.stock > 0 ? (
                  <span className="font-medium text-teal">In stock ({product.stock} left)</span>
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
