import { createFileRoute } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { CheckCircle2, Copy, LifeBuoy } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/site/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { enquiryInputSchema, submitEnquiry } from "@/lib/enquiries.functions";

export const Route = createFileRoute("/enquiry")({
  head: () => ({
    meta: [
      { title: "Product Enquiry & Complaint | MazhalaiHub" },
      {
        name: "description",
        content:
          "Raise a product enquiry or complaint with MazhalaiHub. Share your order and product details and our team will contact you shortly.",
      },
      { property: "og:title", content: "Product Enquiry & Complaint | MazhalaiHub" },
      { property: "og:description", content: "Submit a product enquiry or complaint to the MazhalaiHub support team." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://mazhalaihub.com/enquiry" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://mazhalaihub.com/enquiry" }],
  }),
  component: EnquiryPage,
});

function EnquiryPage() {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [reference, setReference] = useState<string | null>(null);

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const parsed = enquiryInputSchema.safeParse(Object.fromEntries(new FormData(form)));
    if (!parsed.success) {
      const next: Record<string, string> = {};
      parsed.error.issues.forEach((i) => (next[String(i.path[0])] = i.message));
      setErrors(next);
      return;
    }
    setErrors({});
    setBusy(true);
    try {
      const res = await submitEnquiry({ data: parsed.data });
      setReference(res.reference);
      form.reset();
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Enquiry & Complaint"
        subtitle="Tell us about a product question or an issue with your order — our team responds within one working day."
        crumbs={[{ label: "Enquiry & Complaint" }]}
      />

      <div className="container-page grid gap-6 py-8 sm:py-12 lg:grid-cols-[1.4fr_1fr]">
        <div className="min-w-0">
          {reference ? (
            <div className="surface-card space-y-4 p-5 text-center sm:p-8">
              <CheckCircle2 className="mx-auto h-10 w-10 text-primary" aria-hidden="true" />
              <h2 className="font-display text-lg font-bold sm:text-xl">
                Thank you! Your enquiry/complaint has been received. Our team will contact you shortly.
              </h2>
              <div className="mx-auto w-full max-w-xs rounded-2xl border border-border bg-muted/40 p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Reference number</p>
                <p className="mt-1 break-all font-display text-2xl font-bold text-primary">#{reference}</p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-3 w-full"
                  onClick={() => {
                    void navigator.clipboard?.writeText(reference);
                    toast.success("Reference number copied");
                  }}
                >
                  <Copy className="h-4 w-4" /> Copy reference
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                Please quote this reference number in any follow-up so we can find your request instantly.
              </p>
              <Button variant="hero" className="w-full sm:w-auto" onClick={() => setReference(null)}>
                Submit another request
              </Button>
            </div>
          ) : (
            <form onSubmit={(e) => void submit(e)} className="surface-card space-y-4 p-5 sm:p-6" noValidate>
              <h2 className="font-display text-lg font-bold">Raise a request</h2>

              <div className="grid gap-4 sm:grid-cols-2">
                {[
                  { id: "customer_name", label: "Customer name", type: "text", placeholder: "Your full name" },
                  { id: "mobile", label: "Mobile number", type: "tel", placeholder: "10-digit mobile" },
                  { id: "email", label: "Email address", type: "email", placeholder: "you@example.com" },
                  { id: "order_number", label: "Order number (optional)", type: "text", placeholder: "MU-1024" },
                ].map((f) => (
                  <div key={f.id} className="min-w-0">
                    <Label htmlFor={f.id}>{f.label}</Label>
                    <Input
                      id={f.id}
                      name={f.id}
                      type={f.type}
                      placeholder={f.placeholder}
                      className="mt-1.5 h-11"
                      aria-invalid={!!errors[f.id]}
                    />
                    {errors[f.id] && <p className="mt-1 text-xs text-destructive">{errors[f.id]}</p>}
                  </div>
                ))}
              </div>

              <div>
                <Label htmlFor="product">Product name / product ID</Label>
                <Input id="product" name="product" className="mt-1.5 h-11" placeholder="Wooden puzzle set / MU-TOY-12" aria-invalid={!!errors.product} />
                {errors.product && <p className="mt-1 text-xs text-destructive">{errors.product}</p>}
              </div>

              <fieldset>
                <legend className="text-sm font-medium">Request type</legend>
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  {[
                    { value: "enquiry", label: "Enquiry", hint: "Question about a product" },
                    { value: "complaint", label: "Complaint", hint: "Issue with a product or order" },
                  ].map((opt, i) => (
                    <label
                      key={opt.value}
                      className="flex min-h-11 cursor-pointer items-start gap-3 rounded-2xl border border-border p-3 text-sm has-[:checked]:border-primary has-[:checked]:bg-primary/5"
                    >
                      <input
                        type="radio"
                        name="type"
                        value={opt.value}
                        defaultChecked={i === 0}
                        className="mt-0.5 h-4 w-4 accent-[hsl(var(--primary))]"
                      />
                      <span className="min-w-0">
                        <span className="block font-semibold">{opt.label}</span>
                        <span className="block text-xs text-muted-foreground">{opt.hint}</span>
                      </span>
                    </label>
                  ))}
                </div>
                {errors.type && <p className="mt-1 text-xs text-destructive">{errors.type}</p>}
              </fieldset>

              <div>
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  name="message"
                  rows={5}
                  className="mt-1.5"
                  placeholder="Describe your enquiry or complaint in detail"
                  aria-invalid={!!errors.message}
                />
                {errors.message && <p className="mt-1 text-xs text-destructive">{errors.message}</p>}
              </div>

              <Button type="submit" variant="hero" className="h-11 w-full" disabled={busy}>
                {busy ? "Submitting…" : "Submit"}
              </Button>
            </form>
          )}
        </div>

        <aside className="surface-card h-fit space-y-3 p-5 text-sm sm:p-6">
          <h2 className="flex items-center gap-2 font-display text-lg font-bold">
            <LifeBuoy className="h-5 w-5 text-primary" aria-hidden="true" /> How it works
          </h2>
          <ol className="list-decimal space-y-2 pl-4 text-muted-foreground">
            <li>Fill in your details and describe the product enquiry or complaint.</li>
            <li>You get a unique reference number instantly.</li>
            <li>Our support team is notified by email and gets back to you within one working day.</li>
          </ol>
        </aside>
      </div>
    </>
  );
}
