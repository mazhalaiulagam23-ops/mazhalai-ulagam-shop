import { createFileRoute } from "@tanstack/react-router";
import { Heart, Leaf, ShieldCheck, Store } from "lucide-react";
import { PageHeader } from "@/components/site/PageHeader";
import { useSitePage, useSiteSettings } from "@/lib/cms";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About Mazhalai Ulagam | Baby Store in Coimbatore" },
      { name: "description", content: "Mazhalai Ulagam is a Coimbatore-based store for baby products, return gifts and kids essentials, trusted by thousands of Tamil Nadu families." },
      { property: "og:title", content: "About Mazhalai Ulagam" },
      { property: "og:description", content: "Our story, values and promise to Coimbatore families." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://mazhalaihub.com/about" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://mazhalaihub.com/about" }],
  }),
  component: About,
});

const FALLBACK_BODY = `<h2>Our story</h2><p>Mazhalai Ulagam began in Coimbatore with a simple idea — parents shouldn't have to choose between safe, good-looking baby products and a fair price. What started as a small return-gift counter has grown into a complete store for baby essentials, toys, kids fashion, organic care and stationery.</p><p>Every product we list is checked for material safety, finish and everyday practicality.</p>`;

function About() {
  const { data: page } = useSitePage("about");
  const { settings } = useSiteSettings();

  return (
    <>
      <PageHeader
        title={page?.title || "About Mazhalai Ulagam"}
        subtitle={page?.subtitle || settings.tagline}
        crumbs={[{ label: "About Us" }]}
      />
      <div className="container-page grid gap-8 py-12 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-4 text-sm leading-relaxed text-muted-foreground">
          <div
            className="prose-sm space-y-4 [&_h2]:font-display [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:text-foreground [&_ul]:list-disc [&_ul]:pl-5"
            dangerouslySetInnerHTML={{ __html: page?.body_html || FALLBACK_BODY }}
          />
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
          <p className="text-muted-foreground">{settings.address}</p>
          <a
            href={`tel:${settings.phone.replace(/[^+\d]/g, "")}`}
            className="block font-semibold text-primary hover:underline"
          >
            {settings.phone}
          </a>
          <a href={`mailto:${settings.email}`} className="block font-semibold text-primary hover:underline">
            {settings.email}
          </a>
        </aside>
      </div>
    </>
  );
}
