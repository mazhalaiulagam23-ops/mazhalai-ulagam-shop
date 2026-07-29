import { createFileRoute } from "@tanstack/react-router";
import { Heart, Leaf, ShieldCheck, Store } from "lucide-react";
import { PageHeader } from "@/components/site/PageHeader";
import { store } from "@/data/catalog";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About Mazhalai Ulagam | Baby Store in Coimbatore" },
      { name: "description", content: "Mazhalai Ulagam is a Coimbatore-based store for baby products, return gifts and kids essentials, trusted by thousands of Tamil Nadu families." },
      { property: "og:title", content: "About Mazhalai Ulagam" },
      { property: "og:description", content: "Our story, values and promise to Coimbatore families." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: About,
});

function About() {
  return (
    <>
      <PageHeader title="About Mazhalai Ulagam" subtitle={store.tagline} crumbs={[{ label: "About Us" }]} />
      <div className="container-page grid gap-8 py-12 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-4 text-sm leading-relaxed text-muted-foreground">
          <h2 className="font-display text-2xl font-bold text-foreground">Our story</h2>
          <p>
            Mazhalai Ulagam began in Coimbatore with a simple idea — parents shouldn't have to choose between safe,
            good-looking baby products and a fair price. What started as a small return-gift counter has grown into a
            complete store for baby essentials, toys, kids fashion, organic care and stationery.
          </p>
          <p>
            Every product we list is checked for material safety, finish and everyday practicality. We buy in volume so
            families and event organisers across Tamil Nadu can order in bulk at genuine wholesale rates.
          </p>
          <h2 className="font-display text-2xl font-bold text-foreground">What we promise</h2>
          <ul className="grid gap-4 sm:grid-cols-2">
            {[
              { icon: ShieldCheck, t: "Safety first", d: "BPA-free, non-toxic and skin-safe products only." },
              { icon: Heart, t: "Fair pricing", d: "Direct sourcing keeps our prices honest." },
              { icon: Leaf, t: "Gentle choices", d: "A growing range of organic and chemical-free care." },
              { icon: Store, t: "Local service", d: "Real people in Coimbatore answering your calls." },
            ].map((v) => (
              <li key={v.t} className="surface-card flex gap-3 p-4">
                <v.icon className="h-6 w-6 shrink-0 text-teal" aria-hidden="true" />
                <span>
                  <span className="block font-bold text-foreground">{v.t}</span>
                  {v.d}
                </span>
              </li>
            ))}
          </ul>
        </div>
        <aside className="surface-card h-fit space-y-2 p-6 text-sm">
          <h2 className="font-display text-lg font-bold">Visit or call us</h2>
          <p className="text-muted-foreground">{store.address}</p>
          <p className="text-muted-foreground">{store.hours}</p>
          <a href={store.phoneHref} className="block font-semibold text-primary hover:underline">
            {store.phone}
          </a>
          <a href={`mailto:${store.email}`} className="block font-semibold text-primary hover:underline">
            {store.email}
          </a>
        </aside>
      </div>
    </>
  );
}
