import { createFileRoute } from "@tanstack/react-router";
import { CollectionEditor } from "@/components/admin/CollectionEditor";

export const Route = createFileRoute("/_authenticated/admin/homepage")({
  component: AdminHomepage,
});

function AdminHomepage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Homepage</h1>
        <p className="text-sm text-muted-foreground">
          Add, rename, hide, reorder and delete the blocks that make up your homepage.
        </p>
      </div>

      <CollectionEditor
        table="home_sections"
        title="Homepage sections"
        description="Use the arrows to reorder. Hidden sections disappear from the live site instantly."
        rowTitle={(r) => `${String(r.title || r.section_key)}${r.is_visible ? "" : "  (hidden)"}`}
        rowSubtitle={(r) => String(r.section_key)}
        defaults={{ section_key: "custom", title: "", subtitle: "", is_visible: true }}
        fields={[
          {
            key: "section_key",
            label: "Section type",
            help:
              "hero, categories, trust, bestsellers, new_arrivals, offers, promos, testimonials, instagram, blog — or any name for a custom text block.",
          },
          { key: "title", label: "Heading" },
          { key: "subtitle", label: "Sub heading / body text", type: "textarea" },
          { key: "is_visible", label: "Visible", type: "switch", help: "Show on the homepage" },
        ]}
      />

      <CollectionEditor
        table="banners"
        title="Hero banners & promos"
        description="Slides in the homepage carousel (placement: hero) and promo blocks (placement: promo)."
        rowTitle={(r) => String(r.title || "Untitled banner")}
        rowSubtitle={(r) => `${String(r.placement)} · ${r.is_active ? "active" : "hidden"}`}
        defaults={{
          placement: "hero",
          eyebrow: "",
          title: "",
          subtitle: "",
          image_url: "",
          cta_label: "Shop Now",
          cta_href: "/shop",
          is_active: true,
        }}
        fields={[
          { key: "placement", label: "Placement", help: "hero or promo" },
          { key: "eyebrow", label: "Small label above heading" },
          { key: "title", label: "Heading" },
          { key: "subtitle", label: "Subtitle", type: "textarea" },
          { key: "image_url", label: "Background image", type: "image" },
          { key: "cta_label", label: "Button text" },
          { key: "cta_href", label: "Button link", placeholder: "/shop" },
          { key: "is_active", label: "Active", type: "switch" },
        ]}
      />
    </div>
  );
}
