import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState, type FormEvent } from "react";
import { Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { PageHeader } from "@/components/site/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/lib/auth";
import { inr, useShop } from "@/lib/shop-store";
import { openRazorpayCheckout, usePaymentSettings } from "@/lib/payments";
import { placeOrder, recordPaymentFailure, verifyPayment } from "@/lib/payments.functions";

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
  const { cartItems, subtotal, clearCart } = useShop();
  const { user, loading: authLoading } = useAuth();
  const { data: settings } = usePaymentSettings();
  const navigate = useNavigate();
  const createOrder = useServerFn(placeOrder);
  const confirmPayment = useServerFn(verifyPayment);
  const reportFailure = useServerFn(recordPaymentFailure);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [payment, setPayment] = useState<"razorpay" | "cod">("razorpay");
  const [busy, setBusy] = useState(false);
  const shipping = subtotal > 999 || subtotal === 0 ? 0 : 79;

  const onlineEnabled = settings ? settings.razorpay_enabled : true;
  const codEnabled = settings ? settings.cod_enabled : true;
  const methodChips = [
    settings?.upi_enabled !== false && "UPI",
    settings?.card_enabled !== false && "Cards",
    settings?.netbanking_enabled !== false && "Net Banking",
    settings?.wallet_enabled !== false && "Wallets",
  ].filter(Boolean) as string[];

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const raw = Object.fromEntries(new FormData(e.currentTarget));
    const parsed = schema.safeParse(raw);
    if (!parsed.success) {
      const next: Record<string, string> = {};
      parsed.error.issues.forEach((i) => (next[String(i.path[0])] = i.message));
      setErrors(next);
      toast.error("Please correct the highlighted fields");
      return;
    }
    setErrors({});

    if (!user) {
      toast.error("Please sign in to place your order");
      void navigate({ to: "/auth", search: { redirect: "/checkout" } });
      return;
    }

    setBusy(true);
    try {
      const result = await createOrder({
        data: {
          ...parsed.data,
          notes: String(raw.notes ?? "").slice(0, 500),
          method: payment,
          items: cartItems.map(({ product, qty }) => ({
            slug: product.slug,
            name: product.name,
            price: product.price,
            qty,
          })),
        },
      });

      if (result.cod) {
        clearCart();
        toast.success(`Order ${result.orderNumber} placed — pay cash on delivery.`);
        void navigate({ to: "/order-tracking" });
        return;
      }

      const res = await openRazorpayCheckout(
        {
          keyId: result.keyId,
          razorpayOrderId: result.razorpayOrderId,
          amount: result.amount,
          currency: result.currency,
          checkoutName: result.checkoutName,
          checkoutDescription: result.checkoutDescription,
          orderNumber: result.orderNumber,
          prefill: result.prefill,
        },
        {
          onFailed: (code, reason) => {
            void reportFailure({ data: { orderId: result.orderId, code, reason } });
          },
        },
      );

      if (!res) {
        await reportFailure({
          data: { orderId: result.orderId, reason: "Payment window closed before completion" },
        });
        toast.error(`Payment not completed. Order ${result.orderNumber} is saved — you can retry it from Order tracking.`);
        return;
      }

      const verified = await confirmPayment({
        data: {
          orderId: result.orderId,
          razorpayOrderId: res.razorpay_order_id,
          razorpayPaymentId: res.razorpay_payment_id,
          signature: res.razorpay_signature,
        },
      });

      if (verified.paid) {
        clearCart();
        toast.success(`Payment received — order ${result.orderNumber} confirmed.`);
        void navigate({ to: "/order-tracking" });
      } else {
        toast.info("Payment is being confirmed by the bank. We'll update your order shortly.");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
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
      <form onSubmit={submit} className="container-page grid gap-6 py-7 sm:gap-8 sm:py-10 lg:grid-cols-[1fr_340px]" noValidate>
        <div className="space-y-6">
          {!authLoading && !user ? (
            <div className="surface-card flex flex-wrap items-center justify-between gap-3 p-4 text-sm">
              <span className="text-muted-foreground">Sign in so we can save this order to your account.</span>
              <Button type="button" size="sm" variant="outline" asChild>
                <Link to="/auth" search={{ redirect: "/checkout" }}>Sign in</Link>
              </Button>
            </div>
          ) : null}

           <section className="surface-card space-y-4 p-4 sm:p-6">
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
                   <Input id={f.id} name={f.id} type={f.type} className="mt-1.5 h-11" aria-invalid={!!errors[f.id]} />
                  {errors[f.id] && <p className="mt-1 text-xs text-destructive">{errors[f.id]}</p>}
                </div>
              ))}
            </div>
            <div>
              <Label htmlFor="address">Full address</Label>
               <Textarea id="address" name="address" rows={3} className="mt-1.5 text-base md:text-sm" aria-invalid={!!errors.address} />
              {errors.address && <p className="mt-1 text-xs text-destructive">{errors.address}</p>}
            </div>
            <div>
              <Label htmlFor="notes">Delivery notes (optional)</Label>
               <Textarea id="notes" name="notes" rows={2} className="mt-1.5 text-base md:text-sm" />
            </div>
          </section>

           <section className="surface-card space-y-4 p-4 sm:p-6">
            <h2 className="font-display text-lg font-bold">Payment method</h2>
            <RadioGroup
              value={payment}
              onValueChange={(v) => setPayment(v as "razorpay" | "cod")}
              className="space-y-2"
            >
              {onlineEnabled ? (
                <div className="rounded-xl border border-border p-3">
                  <div className="flex items-center gap-3">
                    <RadioGroupItem value="razorpay" id="pay-razorpay" />
                    <Label htmlFor="pay-razorpay" className="font-normal">
                      Pay online — secured by Razorpay
                    </Label>
                  </div>
                   <div className="mt-2 flex flex-wrap gap-1.5 pl-7">
                     {methodChips.map((method) => <span key={method} className="rounded-full bg-secondary px-2 py-1 text-[11px] text-muted-foreground">{method}</span>)}
                   </div>
                </div>
              ) : null}
              {codEnabled ? (
                <div className="flex items-center gap-3 rounded-xl border border-border p-3">
                  <RadioGroupItem value="cod" id="pay-cod" />
                  <Label htmlFor="pay-cod" className="font-normal">
                    Cash on Delivery
                  </Label>
                </div>
              ) : null}
            </RadioGroup>
             <p className="flex items-start gap-2 text-xs text-muted-foreground">
               <ShieldCheck className="h-4 w-4 shrink-0" />
              Orders are marked paid only after the payment is verified with the bank.
              {settings?.mode === "test" ? " Test mode is on — no real money is charged." : ""}
            </p>
          </section>
        </div>

         <aside className="surface-card h-fit space-y-3 p-5 sm:p-6">
          <h2 className="font-display text-lg font-bold">Order summary</h2>
          <ul className="space-y-2 text-sm">
            {cartItems.map(({ product, qty }) => (
               <li key={product.slug} className="grid grid-cols-[minmax(0,1fr)_auto] gap-3">
                 <span className="min-w-0 break-words text-muted-foreground">
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
          <Button type="submit" variant="hero" className="w-full" disabled={busy}>
            {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {payment === "cod" ? "Place order" : `Pay ${inr(subtotal + shipping)}`}
          </Button>
        </aside>
      </form>
    </>
  );
}
