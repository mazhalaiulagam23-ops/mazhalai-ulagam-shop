import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Prose } from "@/components/site/PageHeader";

export const Route = createFileRoute("/returns-refunds")({
  head: () => ({
    meta: [
      { title: "Returns & Refunds | Mazhalai Ulagam" },
      { name: "description", content: "Our 7-day return window, refund timelines and what can and cannot be returned at Mazhalai Ulagam." },
      { property: "og:title", content: "Returns & Refunds | Mazhalai Ulagam" },
      { property: "og:description", content: "Simple 7-day returns on unused products." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => (
    <>
      <PageHeader title="Returns & Refunds" crumbs={[{ label: "Returns & Refunds" }]} />
      <Prose title="Returns made simple">
        <p>Unused products in their original packaging can be returned within 7 days of delivery. Raise the request from your account or by calling our team.</p>
        <p>Personalised return gifts, opened skincare and innerwear cannot be returned unless they arrive damaged or incorrect.</p>
        <p>Damaged or wrong items must be reported within 48 hours of delivery with an unboxing photo or video so we can replace them quickly.</p>
        <p>Approved refunds are processed to the original payment method within 5-7 working days of the returned item reaching our warehouse. Cash on delivery refunds are made by bank transfer.</p>
        <p>Shipping charges are refunded only when the return is due to our error.</p>
      </Prose>
    </>
  ),
});
