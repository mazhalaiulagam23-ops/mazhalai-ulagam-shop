import { createFileRoute } from "@tanstack/react-router";
import { CollectionEditor } from "@/components/admin/CollectionEditor";
import { SitePageEditor } from "@/components/admin/SitePageEditor";

export const Route = createFileRoute("/_authenticated/admin/content")({
  component: AdminContent,
});

function AdminContent() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Content</h1>
        <p className="text-sm text-muted-foreground">
          Categories, testimonials, FAQs, pages and footer links — all live on the site the moment you save.
        </p>
      </div>

      <CollectionEditor
        table="categories"
        title="Categories"
        description="Shown on the homepage, header menu and footer."
        reorder={false}
        orderBy="name"
        rowTitle={(r) => String(r.name)}
        rowSubtitle={(r) => String(r.slug)}
        defaults={{ slug: "", name: "", tagline: "", image_url: "" }}
        fields={[
          { key: "name", label: "Name" },
          { key: "slug", label: "URL slug", placeholder: "return-gifts" },
          { key: "tagline", label: "Tagline" },
          { key: "image_url", label: "Image", type: "image" },
        ]}
      />

      <CollectionEditor
        table="testimonials"
        title="Testimonials"
        rowTitle={(r) => String(r.name)}
        rowSubtitle={(r) => String(r.quote)}
        defaults={{ name: "", city: "", rating: 5, quote: "", is_active: true }}
        fields={[
          { key: "name", label: "Customer name" },
          { key: "city", label: "City" },
          { key: "rating", label: "Rating (1-5)", type: "number" },
          { key: "quote", label: "Testimonial", type: "textarea" },
          { key: "is_active", label: "Active", type: "switch" },
        ]}
      />

      <CollectionEditor
        table="faqs"
        title="FAQs"
        rowTitle={(r) => String(r.question)}
        rowSubtitle={(r) => String(r.answer)}
        defaults={{ question: "", answer: "", is_active: true }}
        fields={[
          { key: "question", label: "Question" },
          { key: "answer", label: "Answer", type: "textarea" },
          { key: "is_active", label: "Active", type: "switch" },
        ]}
      />

      <SitePageEditor slug="about" label="About Us" />
      <SitePageEditor slug="contact" label="Contact Us" />

      <CollectionEditor
        table="footer_links"
        title="Footer links"
        description="Group links under a column heading, e.g. Quick Links or Policies."
        rowTitle={(r) => `${String(r.group_name)} — ${String(r.label)}`}
        rowSubtitle={(r) => String(r.href)}
        defaults={{ group_name: "Quick Links", label: "", href: "/", is_active: true }}
        fields={[
          { key: "group_name", label: "Column heading" },
          { key: "label", label: "Link text" },
          { key: "href", label: "Link URL", placeholder: "/shop" },
          { key: "is_active", label: "Active", type: "switch" },
        ]}
      />
    </div>
  );
}
