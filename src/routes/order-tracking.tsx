import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, PackageSearch } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/site/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { inr } from "@/lib/shop-store";
import { openRazorpayCheckout } from "@/lib/payments";
import { retryPayment, verifyPayment, recordPaymentFailure } from "@/lib/payments.functions";

export const Route = createFileRoute("/order-tracking")({
  head: () => ({
    meta: [
      { title: "Track Your Order | Mazhalai Ulagam" },
      { name: "description", content: "Check the status of your Mazhalai Ulagam orders and complete any pending payment." },
      { property: "og:title", content: "Track Your Order | Mazhalai Ulagam" },
      { property: "og:description", content: "Check your order, payment and shipment status." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: OrderTracking,
});

const paymentLabel: Record<string, string> = {
  unpaid: "Awaiting payment",
  created: "Payment pending",
  paid: "Paid",
  failed: "Payment failed",
  refunded: "Refunded",
  pending: "Confirming with bank",
};

function OrderTracking() {
  const { user, loading } = useAuth();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  const retry = useServerFn(retryPayment);
  const confirmPayment = useServerFn(verifyPayment);
  const reportFailure = useServerFn(recordPaymentFailure);

  const { data: orders, isLoading } = useQuery({
    queryKey: ["my-orders", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("id, order_number, total, status, payment_status, payment_method, created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const visible = (orders ?? []).filter((o) =>
    search.trim() ? o.order_number.toLowerCase().includes(search.trim().toLowerCase()) : true,
  );

  const payNow = async (orderId: string) => {
    setBusyId(orderId);
    try {
      const session = await retry({ data: { orderId } });
      const res = await openRazorpayCheckout(
        {
          keyId: session.keyId,
          razorpayOrderId: session.razorpayOrderId,
          amount: session.amount,
          currency: session.currency,
          checkoutName: session.checkoutName,
          checkoutDescription: session.checkoutDescription,
          orderNumber: session.orderNumber,
          prefill: session.prefill,
        },
        {
          onFailed: (code, reason) => {
            void reportFailure({ data: { orderId, code, reason } });
          },
        },
      );
      if (!res) {
        await reportFailure({ data: { orderId, reason: "Payment window closed before completion" } });
        toast.error("Payment not completed. You can try again any time.");
        return;
      }
      const verified = await confirmPayment({
        data: {
          orderId,
          razorpayOrderId: res.razorpay_order_id,
          razorpayPaymentId: res.razorpay_payment_id,
          signature: res.razorpay_signature,
        },
      });
      toast[verified.paid ? "success" : "info"](
        verified.paid ? "Payment received — your order is confirmed." : "Payment is being confirmed by the bank.",
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not start the payment.");
    } finally {
      setBusyId(null);
      void qc.invalidateQueries({ queryKey: ["my-orders"] });
    }
  };

  return (
    <>
      <PageHeader title="Order Tracking" crumbs={[{ label: "Order Tracking" }]} />
      <div className="container-page py-10">
        {!user && !loading ? (
          <div className="surface-card mx-auto max-w-md space-y-4 p-6 text-center">
            <PackageSearch className="mx-auto h-8 w-8 text-teal" aria-hidden="true" />
            <p className="text-sm text-muted-foreground">
              Sign in with the account you ordered with to see your orders and complete any pending payment.
            </p>
            <Button asChild className="w-full">
              <Link to="/auth" search={{ redirect: "/order-tracking" }}>Sign in</Link>
            </Button>
          </div>
        ) : (
          <div className="mx-auto max-w-2xl space-y-4">
            <div className="surface-card p-4">
              <Label htmlFor="orderId">Find an order</Label>
              <Input
                id="orderId"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="MU260730-12345"
                className="mt-1.5"
              />
            </div>

            {isLoading ? (
              <p className="text-center text-sm text-muted-foreground">Loading your orders…</p>
            ) : visible.length === 0 ? (
              <p className="surface-card p-6 text-center text-sm text-muted-foreground">
                No orders found yet.
              </p>
            ) : (
              visible.map((o) => (
                <article key={o.id} className="surface-card flex flex-wrap items-center gap-3 p-4">
                  <div className="min-w-0 flex-1">
                    <p className="font-display font-bold">{o.order_number}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(o.created_at).toLocaleDateString("en-IN")} · {o.status} ·{" "}
                      {paymentLabel[o.payment_status] ?? o.payment_status}
                    </p>
                  </div>
                  <span className="font-semibold">{inr(o.total)}</span>
                  {o.payment_method !== "cod" && o.payment_status !== "paid" ? (
                    <Button size="sm" disabled={busyId === o.id} onClick={() => void payNow(o.id)}>
                      {busyId === o.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                      Complete payment
                    </Button>
                  ) : null}
                </article>
              ))
            )}
          </div>
        )}
      </div>
    </>
  );
}
