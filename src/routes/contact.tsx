import { createFileRoute } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { Clock, Mail, MapPin, Phone } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { PageHeader } from "@/components/site/PageHeader";
import { useSitePage, useSiteSettings } from "@/lib/cms";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { WhatsAppIcon } from "@/components/site/Header";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact Mazhalai Ulagam | Coimbatore Baby Store" },
      { name: "description", content: "Call, WhatsApp or email Mazhalai Ulagam in Coimbatore for orders, wholesale return gifts and product enquiries." },
      { property: "og:title", content: "Contact Mazhalai Ulagam" },
      { property: "og:description", content: "Reach our Coimbatore team for orders and wholesale enquiries." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Contact,
});

const schema = z.object({
  name: z.string().trim().min(2, "Please enter your name").max(80),
  email: z.string().trim().email("Enter a valid email").max(120),
  phone: z.string().trim().regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit mobile number"),
  message: z.string().trim().min(10, "Tell us a little more").max(1000),
});

function Contact() {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { settings } = useSiteSettings();
  const { data: page } = useSitePage("contact");
  const store = {
    address: settings.address,
    phone: settings.phone,
    phoneHref: `tel:${settings.phone.replace(/[^+\d]/g, "")}`,
    email: settings.email,
    hours: "Mon-Sun, 9 AM - 8 PM",
    whatsapp: settings.whatsapp,
  };

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const parsed = schema.safeParse(Object.fromEntries(new FormData(e.currentTarget)));
    if (!parsed.success) {
      const next: Record<string, string> = {};
      parsed.error.issues.forEach((i) => (next[String(i.path[0])] = i.message));
      setErrors(next);
      return;
    }
    setErrors({});
    e.currentTarget.reset();
    toast.success("Thanks! We'll get back to you within one working day.");
  };

  return (
    <>
      <PageHeader
        title={page?.title || "Contact Us"}
        subtitle={page?.subtitle || "Questions about a product, a bulk order or a delivery? We're here."}
        crumbs={[{ label: "Contact Us" }]}
      />
      {page?.body_html ? (
        <div
          className="container-page pt-10 text-sm leading-relaxed text-muted-foreground [&_p]:mb-3"
          dangerouslySetInnerHTML={{ __html: page.body_html }}
        />
      ) : null}
      <div className="container-page grid gap-8 py-12 lg:grid-cols-[1fr_1fr]">
        <form onSubmit={submit} className="surface-card space-y-4 p-6" noValidate>
          <h2 className="font-display text-lg font-bold">Send us a message</h2>
          {[
            { id: "name", label: "Your name", type: "text" },
            { id: "email", label: "Email", type: "email" },
            { id: "phone", label: "Mobile number", type: "tel" },
          ].map((f) => (
            <div key={f.id}>
              <Label htmlFor={f.id}>{f.label}</Label>
              <Input id={f.id} name={f.id} type={f.type} className="mt-1.5" aria-invalid={!!errors[f.id]} />
              {errors[f.id] && <p className="mt-1 text-xs text-destructive">{errors[f.id]}</p>}
            </div>
          ))}
          <div>
            <Label htmlFor="message">Message</Label>
            <Textarea id="message" name="message" rows={5} className="mt-1.5" aria-invalid={!!errors.message} />
            {errors.message && <p className="mt-1 text-xs text-destructive">{errors.message}</p>}
          </div>
          <Button type="submit" variant="hero" className="w-full">
            Send message
          </Button>
        </form>

        <aside className="space-y-4">
          <div className="surface-card space-y-3 p-6 text-sm">
            <h2 className="font-display text-lg font-bold">Store details</h2>
            <p className="flex gap-2 text-muted-foreground">
              <MapPin className="h-4 w-4 shrink-0 text-primary" /> {store.address}
            </p>
            <p className="flex gap-2 text-muted-foreground">
              <Phone className="h-4 w-4 shrink-0 text-primary" />
              <a href={store.phoneHref} className="hover:text-primary">
                {store.phone}
              </a>
            </p>
            <p className="flex gap-2 text-muted-foreground">
              <Mail className="h-4 w-4 shrink-0 text-primary" />
              <a href={`mailto:${store.email}`} className="hover:text-primary">
                {store.email}
              </a>
            </p>
            <p className="flex gap-2 text-muted-foreground">
              <Clock className="h-4 w-4 shrink-0 text-primary" /> {store.hours}
            </p>
            <Button variant="teal" asChild>
              <a href={store.whatsapp} target="_blank" rel="noreferrer">
                <WhatsAppIcon className="h-4 w-4" /> Chat on WhatsApp
              </a>
            </Button>
          </div>
          <div className="surface-card overflow-hidden">
            <iframe
              title="Mazhalai Ulagam location in Coimbatore"
              src="https://www.google.com/maps?q=Coimbatore,Tamil%20Nadu&output=embed"
              loading="lazy"
              className="h-72 w-full border-0"
            />
          </div>
        </aside>
      </div>
    </>
  );
}
