import { createFileRoute } from "@tanstack/react-router";
import { useCatalog } from "@/lib/db-products";
import { ProductListing } from "@/components/shop/ProductListing";
import { PageHeader } from "@/components/site/PageHeader";

type ShopSearch = { q?: string };

export const Route = createFileRoute("/shop")({
  validateSearch: (search: Record<string, unknown>): ShopSearch => ({
    q: typeof search.q === "string" && search.q ? search.q : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Shop All Baby Products & Gifts | Mazhalai Ulagam" },
      {
        name: "description",
        content:
          "Browse every product at Mazhalai Ulagam — baby essentials, return gifts, toys, kids fashion, organic care and stationery with filters by price and age group.",
      },
      { property: "og:title", content: "Shop All Products | Mazhalai Ulagam" },
      { property: "og:description", content: "Filter by category, price and age group. Pan-India delivery." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Shop,
});

function Shop() {
  const { q } = Route.useSearch();
  return (
    <>
      <PageHeader
        title="Shop All Products"
        subtitle="Everything for babies and kids — carefully chosen, safety checked and priced fairly."
        crumbs={[{ label: "Shop" }]}
      />
      <div className="container-page py-10">
        <ProductListing items={products} initialQuery={q ?? ""} />
      </div>
    </>
  );
}
