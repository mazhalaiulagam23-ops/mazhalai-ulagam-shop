import { createFileRoute } from "@tanstack/react-router";
import { faqs as staticFaqs } from "@/data/catalog";
import { useFaqs } from "@/lib/cms";
import { PageHeader } from "@/components/site/PageHeader";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export const Route = createFileRoute("/faq")({
  head: () => ({
    meta: [
      { title: "FAQ | Delivery, Returns & Wholesale | Mazhalai Ulagam" },
      { name: "description", content: "Answers about delivery timelines, wholesale return gift pricing, product safety, returns and payment options at Mazhalai Ulagam." },
      { property: "og:title", content: "Frequently Asked Questions | Mazhalai Ulagam" },
      { property: "og:description", content: "Delivery, returns, wholesale and payment questions answered." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: staticFaqs.map((f) => ({
            "@type": "Question",
            name: f.q,
            acceptedAnswer: { "@type": "Answer", text: f.a },
          })),
        }),
      },
    ],
  }),
  component: Faq,
});

function Faq() {
  const { data } = useFaqs();
  const items = data?.length
    ? data.map((f) => ({ q: f.question, a: f.answer }))
    : staticFaqs.map((f) => ({ q: f.q, a: f.a }));

  return (
    <>
      <PageHeader title="Frequently Asked Questions" crumbs={[{ label: "FAQ" }]} />
      <div className="container-page py-12">
        <Accordion type="single" collapsible className="surface-card mx-auto max-w-3xl p-6">
          {items.map((f, i) => (
            <AccordionItem key={`${f.q}-${i}`} value={`item-${i}`}>
              <AccordionTrigger className="text-left text-sm font-semibold">{f.q}</AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground">{f.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </>
  );
}
