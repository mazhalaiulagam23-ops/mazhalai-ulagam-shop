import { createFileRoute } from "@tanstack/react-router";

/**
 * Razorpay webhook receiver. This is the authoritative source of truth for
 * payment state — the browser callback is only a fast path.
 */
export const Route = createFileRoute("/api/public/razorpay-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const raw = await request.text();
        const signature = request.headers.get("x-razorpay-signature") ?? "";

        const { verifyWebhookSignature } = await import("@/lib/razorpay.server");
        if (!signature || !verifyWebhookSignature(raw, signature)) {
          return new Response("Invalid signature", { status: 401 });
        }

        let body: any;
        try {
          body = JSON.parse(raw);
        } catch {
          return new Response("Bad payload", { status: 400 });
        }

        const event: string = body?.event ?? "";
        const payment = body?.payload?.payment?.entity;
        const rzpOrderId: string | undefined = payment?.order_id;
        if (!rzpOrderId) return new Response("ok");

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data: row } = await supabaseAdmin
          .from("payments")
          .select("id, order_id")
          .eq("razorpay_order_id", rzpOrderId)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        if (!row) return new Response("ok");

        const statusMap: Record<string, "paid" | "failed" | "refunded" | "pending"> = {
          "payment.captured": "paid",
          "order.paid": "paid",
          "payment.authorized": "pending",
          "payment.failed": "failed",
          "refund.processed": "refunded",
        };
        const status = statusMap[event];
        if (!status) return new Response("ok");

        await supabaseAdmin
          .from("payments")
          .update({
            status,
            razorpay_payment_id: payment?.id ?? null,
            method: String(payment?.method ?? ""),
            error_code: payment?.error_code ?? null,
            error_description: payment?.error_description ?? null,
            raw: payment ?? {},
          })
          .eq("id", row.id);

        await supabaseAdmin
          .from("orders")
          .update(
            status === "paid"
              ? { payment_status: status, status: "confirmed" as const }
              : { payment_status: status },
          )
          .eq("id", row.order_id);


        return new Response("ok");
      },
    },
  },
});
