import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/site/PageHeader";
import { SupportChat } from "@/components/support/SupportChat";

export const Route = createFileRoute("/ai-chat")({
  head: () => ({
    meta: [
      { title: "AI Chat Assistant | Mazhalai Ulagam" },
      {
        name: "description",
        content:
          "Chat with the Mazhalai Ulagam AI assistant for baby product picks, toys, books, gift ideas, order tracking, delivery, returns and offers — in English or Tamil.",
      },
      { property: "og:title", content: "AI Chat Assistant | Mazhalai Ulagam" },
      {
        property: "og:description",
        content: "Instant AI help with products, gifts by age and budget, orders, delivery and returns.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AiChatPage,
});

function AiChatPage() {
  return (
    <>
      <PageHeader
        title="AI Chat"
        subtitle="Ask our assistant about products, age-wise toy picks, gifts by budget, orders, delivery, returns or offers — in English or Tamil."
        crumbs={[{ label: "AI Chat" }]}
      />
      <div className="container-page py-4 sm:py-8">
        <div className="mx-auto flex h-[calc(100dvh-17rem)] min-h-[420px] max-w-3xl flex-col overflow-hidden rounded-2xl border bg-card shadow-[var(--shadow-soft)] sm:h-[72vh]">
          <SupportChat />
        </div>
      </div>
    </>
  );
}
