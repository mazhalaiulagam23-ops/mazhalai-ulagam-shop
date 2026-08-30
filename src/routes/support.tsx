import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/site/PageHeader";
import { SupportChat } from "@/components/support/SupportChat";

export const Route = createFileRoute("/support")({
  head: () => ({
    meta: [
      { title: "Customer Support Chat | MazhalaiHub" },
      {
        name: "description",
        content:
          "Chat with the Mazhalai Ulagam support assistant for product help, order tracking, delivery, returns, offers and payment questions. English and Tamil.",
      },
      { property: "og:title", content: "Customer Support Chat | MazhalaiHub" },
      {
        property: "og:description",
        content: "Instant help with products, orders, delivery, returns and payments.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://mazhalaihub.com/support" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://mazhalaihub.com/support" }],
  }),
  component: SupportPage,
});

function SupportPage() {
  return (
    <>
      <PageHeader
        title="Customer Support"
        subtitle="Ask us anything about products, orders, delivery, returns, offers or payments — in English or Tamil."
        crumbs={[{ label: "Support" }]}
      />
      <div className="container-page py-8">
        <div className="mx-auto flex h-[calc(100dvh-17rem)] min-h-[420px] max-w-3xl flex-col overflow-hidden rounded-2xl border bg-card shadow-[var(--shadow-soft)] sm:h-[70vh]">
          <SupportChat />
        </div>
      </div>
    </>
  );
}
