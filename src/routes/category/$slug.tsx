import { createFileRoute, notFound } from "@tanstack/react-router";
import { getCategory } from "@/data/catalog";
import { useCatalog } from "@/lib/db-products";
import { ProductListing } from "@/components/shop/ProductListing";
import { PageHeader } from "@/components/site/PageHeader";

export const Route = createFileRoute("/category/$slug")({
  loader: ({ params }) => {
    const category = getCategory(params.slug);
    if (!category) throw notFound();
    return { category };
  },
  head: ({ loaderData }) => {
    const name = loaderData?.category.name ?? "Category";
    const desc = `${loaderData?.category.tagline ?? ""} Shop ${name.toLowerCase()} at Mazhalai Ulagam, Coimbatore with pan-India delivery.`;
    return {
      meta: [
        { title: `${name} | Mazhalai Ulagam Coimbatore` },
        { name: "description", content: desc },
        { property: "og:title", content: `${name} | Mazhalai Ulagam` },
        { property: "og:description", content: desc },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  errorComponent: () => (
    <div className="container-page py-20 text-center">
      <h1 className="font-display text-2xl font-bold">This category didn't load</h1>
      <p className="mt-2 text-sm text-muted-foreground">Please refresh the page or browse the full shop.</p>
    </div>
  ),
  notFoundComponent: () => (
    <div className="container-page py-20 text-center">
      <h1 className="font-display text-2xl font-bold">Category not found</h1>
      <p className="mt-2 text-sm text-muted-foreground">The category you are looking for doesn't exist.</p>
    </div>
  ),
  component: CategoryPage,
});

function CategoryPage() {
  const { category } = Route.useLoaderData();
  const { products } = useCatalog();
  const items = products.filter((p) => p.category === category.slug);

  return (
    <>
      <PageHeader
        title={category.name}
        subtitle={category.tagline}
        crumbs={[{ label: "Shop", to: "/shop" }, { label: category.name }]}
      />
      <div className="container-page py-10">
        <ProductListing items={items} showCategoryFilter={false} />
      </div>
    </>
  );
}
