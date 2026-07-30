import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const itemSchema = z.object({
  slug: z.string().trim().min(1).max(120),
  name: z.string().trim().min(1).max(200),
  price: z.number().int().min(0).max(10_000_000),
  qty: z.number().int().min(1).max(99),
});

const checkoutSchema = z.object({
  name: z.string().trim().min(2).max(80),
  phone: z.string().trim().regex(/^[6-9]\d{9}$/),
  email: z.string().trim().email().max(120),
  address: z.string().trim().min(10).max(300),
  city: z.string().trim().min(2).max(60),
  pincode: z.string().trim().regex(/^\d{6}$/),
  notes: z.string().trim().max(500).optional(),
  method: z.enum(["razorpay", "cod"]),
  items: z.array(itemSchema).min(1).max(50),
});

/** Creates the order (and a Razorpay order when paying online). */
export const placeOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => checkoutSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: settings } = await supabaseAdmin.from("payment_settings").select("*").maybeSingle();
    if (!settings) throw new Error("Payments are not configured yet.");

    // Re-price against the live catalogue; never trust browser prices when we can help it.
    const slugs = data.items.map((i) => i.slug);
    const { data: dbProducts } = await supabase
      .from("products")
      .select("slug, name, price, offer_price")
      .in("slug", slugs);
    const priceOf = (slug: string, fallback: number) => {
      const row = dbProducts?.find((p) => p.slug === slug);
      if (!row) return fallback;
      return row.offer_price && row.offer_price > 0 ? row.offer_price : row.price;
    };

    const lines = data.items.map((i) => ({ ...i, unit_price: priceOf(i.slug, i.price) }));
    const subtotal = lines.reduce((sum, l) => sum + l.unit_price * l.qty, 0);
    const shipping = subtotal > 999 ? 0 : 79;
    const total = subtotal + shipping;

    if (data.method === "cod") {
      if (!settings.cod_enabled) throw new Error("Cash on delivery is currently unavailable.");
      if (total < settings.cod_min_order || total > settings.cod_max_order) {
        throw new Error("This order value is not eligible for cash on delivery.");
      }
    } else if (!settings.razorpay_enabled) {
      throw new Error("Online payments are currently unavailable.");
    }

    const { data: order, error: orderErr } = await supabase
      .from("orders")
      .insert({
        user_id: userId,
        customer_name: data.name,
        customer_email: data.email,
        customer_phone: data.phone,
        address: data.address,
        city: data.city,
        pincode: data.pincode,
        subtotal,
        shipping,
        total,
        payment_method: data.method,
        notes: data.notes ?? null,
      })
      .select("id, order_number, total")
      .single();
    if (orderErr || !order) throw new Error(orderErr?.message || "Could not create your order.");

    const { error: itemsErr } = await supabase.from("order_items").insert(
      lines.map((l) => ({
        order_id: order.id,
        product_slug: l.slug,
        product_name: l.name,
        unit_price: l.unit_price,
        qty: l.qty,
      })),
    );
    if (itemsErr) throw new Error(itemsErr.message);

    if (data.method === "cod") {
      return {
        orderId: order.id,
        orderNumber: order.order_number,
        total,
        cod: true as const,
      };
    }

    const mode = settings.mode === "live" ? ("live" as const) : ("test" as const);
    const { createRazorpayOrder } = await import("./razorpay.server");

    const rzp = await createRazorpayOrder({
      mode,
      amountPaise: total * 100,
      currency: settings.currency,
      receipt: order.order_number,
      notes: { order_id: order.id, order_number: order.order_number },
      autoCapture: settings.auto_capture,
    });

    await supabaseAdmin.from("payments").insert({
      order_id: order.id,
      mode,
      amount: total,
      currency: settings.currency,
      status: "created",
      razorpay_order_id: rzp.id,
      attempt: 1,
    });
    await supabaseAdmin
      .from("orders")
      .update({ payment_status: "created", payment_attempts: 1 })
      .eq("id", order.id);

    return {
      orderId: order.id,
      orderNumber: order.order_number,
      total,
      cod: false as const,
      keyId: rzp.keyId,
      razorpayOrderId: rzp.id,
      amount: rzp.amount,
      currency: settings.currency,
      checkoutName: settings.checkout_name,
      checkoutDescription: settings.checkout_description,
      prefill: { name: data.name, email: data.email, contact: data.phone },
    };
  });

/** Verifies the signature returned by Razorpay Checkout and marks the order paid. */
export const verifyPayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        orderId: z.string().uuid(),
        razorpayOrderId: z.string().min(1).max(120),
        razorpayPaymentId: z.string().min(1).max(120),
        signature: z.string().min(1).max(300),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const { data: own } = await context.supabase
      .from("orders")
      .select("id")
      .eq("id", data.orderId)
      .maybeSingle();
    if (!own) throw new Error("Order not found.");

    const { data: payment } = await context.supabase
      .from("payments")
      .select("id, mode")
      .eq("razorpay_order_id", data.razorpayOrderId)
      .maybeSingle();
    if (!payment) throw new Error("Payment record not found.");

    const mode = payment.mode === "live" ? ("live" as const) : ("test" as const);
    const { verifyCheckoutSignature, fetchRazorpayPayment } = await import("./razorpay.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const valid = verifyCheckoutSignature(
      mode,
      data.razorpayOrderId,
      data.razorpayPaymentId,
      data.signature,
    );
    if (!valid) {
      await supabaseAdmin
        .from("payments")
        .update({ status: "failed", error_description: "Signature verification failed" })
        .eq("id", payment.id);
      throw new Error("We could not verify this payment. Please contact support.");
    }

    // Authoritative check straight from Razorpay.
    const remote = await fetchRazorpayPayment(mode, data.razorpayPaymentId);
    const captured = remote.status === "captured" || remote.status === "authorized";

    await supabaseAdmin
      .from("payments")
      .update({
        status: captured ? "paid" : "pending",
        razorpay_payment_id: data.razorpayPaymentId,
        razorpay_signature: data.signature,
        method: String(remote.method ?? ""),
        raw: remote as never,
      })
      .eq("id", payment.id);

    if (captured) {
      await supabaseAdmin
        .from("orders")
        .update({ payment_status: "paid", status: "confirmed" })
        .eq("id", data.orderId);
    }

    return { paid: captured };
  });

/** Records a dismissed or failed attempt so it can be retried later. */
export const recordPaymentFailure = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        orderId: z.string().uuid(),
        reason: z.string().max(300).optional(),
        code: z.string().max(80).optional(),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const { data: own } = await context.supabase
      .from("orders")
      .select("id")
      .eq("id", data.orderId)
      .maybeSingle();
    if (!own) throw new Error("Order not found.");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: latest } = await supabaseAdmin
      .from("payments")
      .select("id")
      .eq("order_id", data.orderId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (latest) {
      await supabaseAdmin
        .from("payments")
        .update({
          status: "failed",
          error_code: data.code ?? null,
          error_description: data.reason ?? "Payment was not completed",
        })
        .eq("id", latest.id);
    }
    await supabaseAdmin.from("orders").update({ payment_status: "failed" }).eq("id", data.orderId);
    return { ok: true };
  });

/** Starts a fresh Razorpay attempt for an unpaid order (failed payment recovery). */
export const retryPayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ orderId: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { data: order } = await context.supabase
      .from("orders")
      .select("id, order_number, total, payment_status, payment_attempts, customer_name, customer_email, customer_phone")
      .eq("id", data.orderId)
      .maybeSingle();
    if (!order) throw new Error("Order not found.");
    if (order.payment_status === "paid") throw new Error("This order is already paid.");

    const { data: settings } = await context.supabase.from("payment_settings").select("*").maybeSingle();
    if (!settings) throw new Error("Payments are not configured yet.");
    if (order.payment_attempts >= settings.max_retries + 1) {
      throw new Error("Maximum payment attempts reached. Please contact support.");
    }

    const mode = settings.mode === "live" ? ("live" as const) : ("test" as const);
    const { createRazorpayOrder } = await import("./razorpay.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const rzp = await createRazorpayOrder({
      mode,
      amountPaise: order.total * 100,
      currency: settings.currency,
      receipt: `${order.order_number}-r${order.payment_attempts + 1}`,
      notes: { order_id: order.id, order_number: order.order_number },
      autoCapture: settings.auto_capture,
    });

    await supabaseAdmin.from("payments").insert({
      order_id: order.id,
      mode,
      amount: order.total,
      currency: settings.currency,
      status: "created",
      razorpay_order_id: rzp.id,
      attempt: order.payment_attempts + 1,
    });
    await supabaseAdmin
      .from("orders")
      .update({ payment_status: "created", payment_attempts: order.payment_attempts + 1 })
      .eq("id", order.id);

    return {
      orderId: order.id,
      orderNumber: order.order_number,
      keyId: rzp.keyId,
      razorpayOrderId: rzp.id,
      amount: rzp.amount,
      currency: settings.currency,
      checkoutName: settings.checkout_name,
      checkoutDescription: settings.checkout_description,
      prefill: {
        name: order.customer_name,
        email: order.customer_email,
        contact: order.customer_phone,
      },
    };
  });
