import { createFileRoute, Link } from "@tanstack/react-router";
import { HeartOff } from "lucide-react";
import { products } from "@/data/catalog";
import { ProductCard } from "@/components/shop/ProductCard";
import { PageHeader } from "@/components/site/PageHeader";
import { Button } from "@/components/ui/button";
import { useShop } from "@/lib/shop-store";

export const Route = createFileRoute("/wishlist")({
  head: () => ({
    meta: [
      { title: "Your Wishlist | Mazhalai Ulagam" },
      { name: "description", content: "Save baby products, toys and return gifts you love and buy them later." },
      { property: "og:title", content: "Your Wishlist | Mazhalai Ulagam" },
      { property: "og:description", content: "Your saved baby products and gift ideas." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: WishlistPage,
});

function WishlistPage() {
  const { wishlist } = useShop();
  const items = products.filter((p) => wishlist.includes(p.slug));

  return (
    <>
      <PageHeader title="My Wishlist" crumbs={[{ label: "Wishlist" }]} />
      <div className="container-page py-10">
        {items.length === 0 ? (
          <div className="surface-card mx-auto flex max-w-md flex-col items-center gap-3 p-12 text-center">
            <HeartOff className="h-10 w-10 text-muted-foreground" aria-hidden="true" />
            <h2 className="font-display text-xl font-bold">Your wishlist is empty</h2>
            <p className="text-sm text-muted-foreground">Tap the heart on any product to save it here.</p>
            <Button asChild>
              <Link to="/shop">Browse products</Link>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-4">
            {items.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
