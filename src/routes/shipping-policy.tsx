import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Prose } from "@/components/site/PageHeader";

export const Route = createFileRoute("/shipping-policy")({
  head: () => ({
    meta: [
      { title: "Shipping Policy | MazhalaiHub" },
      { name: "description", content: "Dispatch timelines, shipping charges, serviceable pincodes and tracking details for Mazhalai Ulagam orders." },
      { property: "og:title", content: "Shipping Policy | MazhalaiHub" },
      { property: "og:description", content: "How and when we ship your order across India." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://mazhalaihub.com/shipping-policy" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://mazhalaihub.com/shipping-policy" }],
  }),
  component: () => (
    <>
      <PageHeader title="Shipping Policy" crumbs={[{ label: "Shipping Policy" }]} />
      <Prose title="How we ship">
        <p>Orders placed before 3 PM on working days are dispatched from Coimbatore the same day. Orders after that are dispatched the next working day.</p>
        <p>Shipping is free on orders above ₹999. Below that a flat charge of ₹79 applies. Bulk and wholesale orders are quoted separately based on weight and destination.</p>
        <p>Metro cities usually receive orders in 2-4 working days. Other pincodes take 4-7 working days. Remote pincodes may take longer.</p>
        <p>A tracking number is shared over SMS and email once the courier picks up your parcel. You can also check status on the Order Tracking page.</p>
        <p>If a pincode is not serviceable by our courier partners we will contact you and offer an alternative or a full refund.</p>
      </Prose>
    </>
  ),
});
