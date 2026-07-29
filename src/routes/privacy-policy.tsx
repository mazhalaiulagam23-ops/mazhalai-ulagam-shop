import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Prose } from "@/components/site/PageHeader";

export const Route = createFileRoute("/privacy-policy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy | Mazhalai Ulagam" },
      { name: "description", content: "How Mazhalai Ulagam collects, uses and protects your personal information when you shop with us." },
      { property: "og:title", content: "Privacy Policy | Mazhalai Ulagam" },
      { property: "og:description", content: "How we handle and protect your data." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => (
    <>
      <PageHeader title="Privacy Policy" crumbs={[{ label: "Privacy Policy" }]} />
      <Prose title="Your data, handled carefully">
        <p>We collect only what is needed to process your order: name, contact details, delivery address and order history.</p>
        <p>Payment details are handled entirely by our payment provider. We never store card numbers, UPI PINs or banking credentials.</p>
        <p>We use your contact details for order updates and, with your consent, for offers and new arrivals. You can unsubscribe at any time.</p>
        <p>We share data only with courier and payment partners needed to fulfil your order, and never sell it to third parties.</p>
        <p>To access, correct or delete your data, email info@mazhalaiulagam.com and we will act within 30 days.</p>
      </Prose>
    </>
  ),
});
