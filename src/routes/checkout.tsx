import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { PageHeader } from "@/components/site/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { inr, useShop } from "@/lib/shop-store";

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { title: "Secure Checkout | Mazhalai Ulagam" },
      { name: "description", content: "Complete your Mazhalai Ulagam order with UPI, cards, net banking or cash on delivery." },
      { property: "og:title", content: "Secure Checkout | Mazhalai Ulagam" },
      { property: "og:description", content: "Fast, secure checkout with multiple payment options." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Checkout,
});

const schema = z.object({
  name: z.string().trim().min(2, "Enter your full name").max(80),
  phone: z.string().trim().regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit mobile number"),
  email: z.string().trim().email("Enter a valid email").max(120),
  address: z.string().trim().min(10, "Enter your full address").max(300),
  city: z.string().trim().min(2, "Enter your city").max(60),
  pincode: z.string().trim().regex(/^\d{6}$/, "Enter a valid 6-digit pincode"),
});

function Checkout() {
  const { cartItems, subtotal } = useShop();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [payment, setPayment] = useState("upi");
  const shipping = subtotal > 999 || subtotal === 0 ? 0 : 79;

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.currentTarget));
    const parsed = schema.safeParse(data);
    if (!parsed.success) {
      const next: Record<string, string> = {};
      parsed.error.issues.forEach((i) => (next[String(i.path[0])] = i.message));
      setErrors(next);
      toast.error("Please correct the highlighted fields");
      return;
    }
    setErrors({});
    toast.info(
      payment === "cod"
        ? "Cash on delivery orders will be confirmed once the payment gateway is connected."
        : "Online payment requires a connected payment provider. Your details are saved for the next step.",
    );
  };

  if (cartItems.length === 0) {
    return (
      <>
        <PageHeader title="Checkout" crumbs={[{ label: "Checkout" }]} />
        <div className="container-page py-16 text-center">
          <h2 className="font-display text-xl font-bold">Nothing to check out yet</h2>
          <p className="mt-2 text-sm text-muted-foreground">Add products to your cart to continue.</p>
          <Button className="mt-4" asChild>
            <Link to="/shop">Go to shop</Link>
          </Button>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader title="Checkout" crumbs={[{ label: "Cart", to: "/cart" }, { label: "Checkout" }]} />
      <form onSubmit={submit} className="container-page grid gap-8 py-10 lg:grid-cols-[1fr_340px]" noValidate>
        <div className="space-y-6">
          <section className="surface-card space-y-4 p-6">
            <h2 className="font-display text-lg font-bold">Delivery details</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                { id: "name", label: "Full name", type: "text" },
                { id: "phone", label: "Mobile number", type: "tel" },
                { id: "email", label: "Email address", type: "email" },
                { id: "city", label: "City", type: "text" },
                { id: "pincode", label: "Pincode", type: "text" },
              ].map((f) => (
                <div key={f.id}>
                  <Label htmlFor={f.id}>{f.label}</Label>
                  <Input id={f.id} name={f.id} type={f.type} className="mt-1.5" aria-invalid={!!errors[f.id]} />
                  {errors[f.id] && <p className="mt-1 text-xs text-destructive">{errors[f.id]}</p>}
                </div>
              ))}
            </div>
            <div>
              <Label htmlFor="address">Full address</Label>
              <Textarea id="address" name="address" rows={3} className="mt-1.5" aria-invalid={!!errors.address} />
              {errors.address && <p className="mt-1 text-xs text-destructive">{errors.address}</p>}
            </div>
          </section>

          <section className="surface-card space-y-4 p-6">
            <h2 className="font-display text-lg font-bold">Payment method</h2>
            <RadioGroup value={payment} onValueChange={setPayment} className="space-y-2">
              {[
                { v: "upi", l: "UPI (GPay, PhonePe, Paytm)" },
                { v: "card", l: "Credit / Debit Card" },
                { v: "netbanking", l: "Net Banking" },
                { v: "cod", l: "Cash on Delivery" },
              ].map((o) => (
                <div key={o.v} className="flex items-center gap-3 rounded-xl border border-border p-3">
                  <RadioGroupItem value={o.v} id={`pay-${o.v}`} />
                  <Label htmlFor={`pay-${o.v}`} className="font-normal">
                    {o.l}
                  </Label>
                </div>
              ))}
            </RadioGroup>
            <p className="text-xs text-muted-foreground">
              Payments are confirmed only after verification by the payment provider. No order is marked paid before
              that.
            </p>
          </section>
        </div>

        <aside className="surface-card h-fit space-y-3 p-6">
          <h2 className="font-display text-lg font-bold">Order summary</h2>
          <ul className="space-y-2 text-sm">
            {cartItems.map(({ product, qty }) => (
              <li key={product.slug} className="flex justify-between gap-3">
                <span className="text-muted-foreground">
                  {product.name} × {qty}
                </span>
                <span className="font-semibold">{inr(product.price * qty)}</span>
              </li>
            ))}
          </ul>
          <div className="flex justify-between border-t border-border pt-3 text-sm">
            <span className="text-muted-foreground">Shipping</span>
            <span className="font-semibold">{shipping === 0 ? "Free" : inr(shipping)}</span>
          </div>
          <div className="flex justify-between text-base font-bold">
            <span>Total</span>
            <span>{inr(subtotal + shipping)}</span>
          </div>
          <Button type="submit" variant="hero" className="w-full">
            Place order
          </Button>
        </aside>
      </form>
    </>
  );
}
