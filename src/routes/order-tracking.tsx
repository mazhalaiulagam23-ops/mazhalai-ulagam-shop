import { createFileRoute } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { PackageSearch } from "lucide-react";
import { PageHeader } from "@/components/site/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/order-tracking")({
  head: () => ({
    meta: [
      { title: "Track Your Order | Mazhalai Ulagam" },
      { name: "description", content: "Enter your order ID to check the delivery status of your Mazhalai Ulagam order." },
      { property: "og:title", content: "Track Your Order | Mazhalai Ulagam" },
      { property: "og:description", content: "Check your order and shipment status." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: OrderTracking,
});

function OrderTracking() {
  const [status, setStatus] = useState<string | null>(null);

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const id = new FormData(e.currentTarget).get("orderId")?.toString().trim();
    setStatus(
      id
        ? `We could not find order ${id}. Order tracking goes live once the backend is connected.`
        : "Please enter your order ID.",
    );
  };

  return (
    <>
      <PageHeader title="Order Tracking" crumbs={[{ label: "Order Tracking" }]} />
      <div className="container-page py-10">
        <form onSubmit={submit} className="surface-card mx-auto max-w-md space-y-4 p-6">
          <PackageSearch className="h-8 w-8 text-teal" aria-hidden="true" />
          <div>
            <Label htmlFor="orderId">Order ID</Label>
            <Input id="orderId" name="orderId" placeholder="MU-2026-00123" className="mt-1.5" />
          </div>
          <Button type="submit" className="w-full">
            Track order
          </Button>
          {status && (
            <p role="status" className="rounded-xl bg-secondary p-3 text-sm text-muted-foreground">
              {status}
            </p>
          )}
        </form>
      </div>
    </>
  );
}
