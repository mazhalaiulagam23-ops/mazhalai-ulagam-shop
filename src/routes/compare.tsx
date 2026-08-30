import { createFileRoute, Link } from "@tanstack/react-router";
import { Scale, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/site/PageHeader";
import { Button } from "@/components/ui/button";
import { Stars } from "@/components/shop/ProductCard";
import { useCatalog } from "@/lib/db-products";
import { inr, useShop } from "@/lib/shop-store";
import { discountPercent } from "@/data/catalog";

export const Route = createFileRoute("/compare")({
  head: () => ({
    meta: [
      { title: "Compare Products | MazhalaiHub" },
      {
        name: "description",
        content:
          "Compare baby products, toys and gifts side by side — price, rating, age group, stock and material — before you buy at Mazhalai Ulagam.",
      },
      { property: "og:title", content: "Compare Products | MazhalaiHub" },
      { property: "og:description", content: "Side-by-side comparison of up to four baby and kids products." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://mazhalaihub.com/compare" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://mazhalaihub.com/compare" }],
  }),
  component: ComparePage,
});

function ComparePage() {
  const { products } = useCatalog();
  const { compare, toggleCompare, clearCompare, addToCart } = useShop();
  const items = compare.map((slug) => products.find((p) => p.slug === slug)).filter(Boolean) as typeof products;

  const rows: { label: string; render: (p: (typeof products)[number]) => React.ReactNode }[] = [
    { label: "Price", render: (p) => <span className="font-semibold">{inr(p.price)}</span> },
    { label: "MRP", render: (p) => <span className="text-muted-foreground line-through">{inr(p.mrp)}</span> },
    { label: "Discount", render: (p) => `${discountPercent(p)}%` },
    { label: "Rating", render: (p) => <Stars rating={p.rating} /> },
    { label: "Reviews", render: (p) => p.reviews },
    { label: "Age group", render: (p) => p.ageGroup },
    { label: "Category", render: (p) => p.category.replace(/-/g, " ") },
    { label: "Stock", render: (p) => (p.stock > 0 ? `${p.stock} in stock` : "Out of stock") },
  ];

  return (
    <>
      <PageHeader
        title="Compare Products"
        subtitle="Put up to four products side by side and pick the perfect one for your little one."
        crumbs={[{ label: "Compare" }]}
      />
      <div className="container-page py-10">
        {items.length === 0 ? (
          <div className="surface-card mx-auto max-w-md p-10 text-center">
            <Scale className="mx-auto h-10 w-10 text-primary" aria-hidden="true" />
            <h2 className="mt-4 font-display text-xl font-semibold">Nothing to compare yet</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Tap the compare icon on any product card to add it here.
            </p>
            <Button className="mt-6" asChild>
              <Link to="/shop">Browse products</Link>
            </Button>
          </div>
        ) : (
          <>
            <div className="mb-4 flex justify-end">
              <Button variant="outline" size="sm" onClick={clearCompare}>
                <Trash2 className="h-4 w-4" /> Clear all
              </Button>
            </div>
            <div className="overflow-x-auto rounded-3xl border border-border bg-card shadow-[var(--shadow-soft)]">
              <table className="w-full min-w-[640px] text-sm">
                <caption className="sr-only">Product comparison</caption>
                <thead>
                  <tr>
                    <th scope="col" className="w-32 p-4 text-left text-xs uppercase text-muted-foreground">
                      Product
                    </th>
                    {items.map((p) => (
                      <th key={p.slug} scope="col" className="p-4 text-left align-top">
                        <div className="relative">
                          <button
                            type="button"
                            aria-label={`Remove ${p.name} from compare`}
                            onClick={() => toggleCompare(p.slug)}
                            className="absolute right-0 top-0 rounded-full bg-secondary p-1 hover:bg-accent"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                          <img src={p.images[0]} alt="" className="h-24 w-24 rounded-2xl object-cover" />
                          <Link
                            to="/product/$slug"
                            params={{ slug: p.slug }}
                            className="mt-2 block max-w-40 font-display text-sm font-semibold hover:text-primary"
                          >
                            {p.name}
                          </Link>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.label} className="border-t border-border">
                      <th scope="row" className="p-4 text-left text-xs font-bold uppercase text-muted-foreground">
                        {row.label}
                      </th>
                      {items.map((p) => (
                        <td key={p.slug} className="p-4 capitalize">
                          {row.render(p)}
                        </td>
                      ))}
                    </tr>
                  ))}
                  <tr className="border-t border-border">
                    <th scope="row" className="p-4 text-left text-xs font-bold uppercase text-muted-foreground">
                      Buy
                    </th>
                    {items.map((p) => (
                      <td key={p.slug} className="p-4">
                        <Button
                          size="sm"
                          disabled={p.stock <= 0}
                          onClick={() => {
                            addToCart(p.slug);
                            toast.success("Added to cart");
                          }}
                        >
                          Add to cart
                        </Button>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </>
  );
}
