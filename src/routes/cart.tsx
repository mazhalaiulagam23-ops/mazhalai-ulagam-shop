import { createFileRoute, Link } from "@tanstack/react-router";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/site/PageHeader";
import { Button } from "@/components/ui/button";
import { inr, useShop } from "@/lib/shop-store";

export const Route = createFileRoute("/cart")({
  head: () => ({
    meta: [
      { title: "Your Cart | MazhalaiHub" },
      { name: "description", content: "Review the baby products and gifts in your Mazhalai Ulagam cart before checkout." },
      { property: "og:title", content: "Your Cart | MazhalaiHub" },
      { property: "og:description", content: "Review your items and proceed to a secure checkout." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CartPage,
});

function CartPage() {
  const { cartItems, setQty, removeFromCart, subtotal } = useShop();
  const shipping = subtotal > 999 || subtotal === 0 ? 0 : 79;

  return (
    <>
      <PageHeader title="Shopping Cart" crumbs={[{ label: "Cart" }]} />
      <div className="container-page py-7 sm:py-10">
        {cartItems.length === 0 ? (
          <div className="surface-card mx-auto flex max-w-md flex-col items-center gap-3 p-7 text-center sm:p-12">
            <ShoppingBag className="h-10 w-10 text-muted-foreground" aria-hidden="true" />
            <h2 className="font-display text-xl font-bold">Your cart is empty</h2>
            <p className="text-sm text-muted-foreground">Add a few little treasures and come back here.</p>
            <Button asChild>
              <Link to="/shop">Start shopping</Link>
            </Button>
          </div>
        ) : (
          <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
            <ul className="space-y-4">
              {cartItems.map(({ product, qty }) => (
                <li key={product.slug} className="surface-card grid grid-cols-[72px_minmax(0,1fr)] gap-3 p-3 sm:flex sm:gap-4 sm:p-4">
                  <img
                    src={product.images[0]}
                    alt={product.name}
                    loading="lazy"
                    width={120}
                    height={120}
                    className="h-[72px] w-[72px] rounded-xl object-cover sm:h-24 sm:w-24"
                  />
                  <div className="min-w-0 flex-1">
                    <Link to="/product/$slug" params={{ slug: product.slug }} className="line-clamp-2 break-words text-sm font-semibold hover:text-primary sm:text-base">
                      {product.name}
                    </Link>
                    <p className="text-sm text-muted-foreground">{inr(product.price)} each</p>
                    <div className="mt-3 flex flex-wrap items-center gap-2 sm:gap-3">
                      <div className="flex items-center rounded-full border border-border">
                         <button onClick={() => setQty(product.slug, qty - 1)} aria-label="Decrease quantity" className="flex h-11 w-11 items-center justify-center">
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="w-8 text-center text-sm font-bold tabular-nums">{qty}</span>
                         <button onClick={() => setQty(product.slug, qty + 1)} aria-label="Increase quantity" className="flex h-11 w-11 items-center justify-center">
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <button
                        onClick={() => removeFromCart(product.slug)}
                     className="inline-flex min-h-11 items-center gap-1 px-1 text-xs text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Remove
                      </button>
                    </div>
                  </div>
                  <p className="col-start-2 font-bold sm:ml-auto">{inr(product.price * qty)}</p>
                </li>
              ))}
            </ul>

            <aside className="surface-card h-fit space-y-3 p-5 sm:p-6">
              <h2 className="font-display text-lg font-bold">Order Summary</h2>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-semibold">{inr(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Shipping</span>
                <span className="font-semibold">{shipping === 0 ? "Free" : inr(shipping)}</span>
              </div>
              <div className="flex justify-between border-t border-border pt-3 text-base font-bold">
                <span>Total</span>
                <span>{inr(subtotal + shipping)}</span>
              </div>
              <Button variant="hero" className="w-full" asChild>
                <Link to="/checkout">Proceed to Checkout</Link>
              </Button>
              <Button variant="outline" className="w-full" asChild>
                <Link to="/shop">Continue shopping</Link>
              </Button>
            </aside>
          </div>
        )}
      </div>
    </>
  );
}
