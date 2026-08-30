import { createFileRoute, Link } from "@tanstack/react-router";
import { blogPosts } from "@/data/catalog";
import { PageHeader } from "@/components/site/PageHeader";

export const Route = createFileRoute("/blog")({
  head: () => ({
    meta: [
      { title: "Parenting Tips & Baby Care Blog | MazhalaiHub" },
      { name: "description", content: "Practical parenting tips, newborn checklists, return gift ideas and educational toy guides from the Mazhalai Ulagam team in Coimbatore." },
      { property: "og:title", content: "Parenting Tips & Baby Care Blog | MazhalaiHub" },
      { property: "og:description", content: "Guides on baby care, gifting and educational play." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://mazhalaihub.com/blog" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://mazhalaihub.com/blog" }],
  }),
  component: Blog,
});

function Blog() {
  return (
    <>
      <PageHeader
        title="Parenting Tips & Guides"
        subtitle="Practical, India-specific advice on baby care, gifting and play."
        crumbs={[{ label: "Blog" }]}
      />
      <div className="container-page grid gap-6 py-12 md:grid-cols-2 lg:grid-cols-3">
        {blogPosts.map((post) => (
          <article key={post.slug} className="surface-card p-6">
            <p className="text-xs font-bold uppercase tracking-wide text-teal">{post.category}</p>
            <h2 className="mt-2 font-display text-lg font-bold">{post.title}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{post.excerpt}</p>
            <p className="mt-4 text-xs text-muted-foreground">
              {new Date(post.date).toLocaleDateString("en-IN", { dateStyle: "medium" })} · {post.readMinutes} min read
            </p>
            <Link to="/shop" className="mt-3 inline-block text-sm font-semibold text-primary hover:underline">
              Shop related products
            </Link>
          </article>
        ))}
      </div>
    </>
  );
}
