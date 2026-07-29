import { createFileRoute } from "@tanstack/react-router";
import { discountPercent, products } from "@/data/catalog";
import { ProductCard } from "@/components/shop/ProductCard";
import { PageHeader } from "@/components/site/PageHeader";

export const Route = createFileRoute("/offers")({
  head: () => ({
    meta: [
      { title: "Offers & Deals on Baby Products | Mazhalai Ulagam" },
      { name: "description", content: "Live discounts on baby products, return gifts, toys and kids essentials at Mazhalai Ulagam, Coimbatore." },
      { property: "og:title", content: "Offers & Deals | Mazhalai Ulagam" },
      { property: "og:description", content: "Save on bestsellers and bulk return gift orders." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Offers,
});

function Offers() {
  const items = products.filter((p) => discountPercent(p) >= 25).sort((a, b) => discountPercent(b) - discountPercent(a));

  return (
    <>
      <PageHeader
        title="Special Offers"
        subtitle="Limited-period discounts across baby care, gifting and toys. Offers end automatically on expiry."
        crumbs={[{ label: "Offers" }]}
      />
      <div className="container-page py-10">
        {items.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground">No live offers right now. Check back soon.</p>
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
