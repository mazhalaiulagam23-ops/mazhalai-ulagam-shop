import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Prose } from "@/components/site/PageHeader";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms & Conditions | Mazhalai Ulagam" },
      { name: "description", content: "The terms that apply when you browse, order or use services on the Mazhalai Ulagam website." },
      { property: "og:title", content: "Terms & Conditions | Mazhalai Ulagam" },
      { property: "og:description", content: "Terms of use for the Mazhalai Ulagam store." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => (
    <>
      <PageHeader title="Terms & Conditions" crumbs={[{ label: "Terms & Conditions" }]} />
      <Prose title="Using this website">
        <p>By placing an order you confirm the details you provide are accurate and that you are authorised to use the chosen payment method.</p>
        <p>Product images are indicative. Slight variation in colour, print or packaging may occur between batches.</p>
        <p>Prices include applicable GST unless stated otherwise, and may change without notice. The price shown at checkout applies to your order.</p>
        <p>Offers and coupons are valid only for their stated period, cannot be combined unless mentioned, and are withdrawn automatically on expiry.</p>
        <p>We may cancel an order in case of stock unavailability, pricing errors or suspected fraud, with a full refund.</p>
        <p>These terms are governed by Indian law, with jurisdiction in Coimbatore, Tamil Nadu.</p>
      </Prose>
    </>
  ),
});
