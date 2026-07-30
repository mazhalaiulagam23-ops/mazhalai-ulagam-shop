import { createHmac, timingSafeEqual } from "crypto";

export type RazorpayMode = "test" | "live";

/** Reads the Razorpay credentials for the requested mode. */
export function razorpayCreds(mode: RazorpayMode) {
  const keyId =
    (mode === "live" ? process.env.RAZORPAY_KEY_ID_LIVE : process.env.RAZORPAY_KEY_ID_TEST) ||
    process.env.RAZORPAY_KEY_ID ||
    "";
  const keySecret =
    (mode === "live" ? process.env.RAZORPAY_KEY_SECRET_LIVE : process.env.RAZORPAY_KEY_SECRET_TEST) ||
    process.env.RAZORPAY_KEY_SECRET ||
    "";
  if (!keyId || !keySecret) {
    throw new Error(`Razorpay ${mode} keys are not configured yet.`);
  }
  return { keyId, keySecret };
}

function authHeader(keyId: string, keySecret: string) {
  return `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`;
}

/** Creates an order on Razorpay. Amount is in paise. */
export async function createRazorpayOrder(opts: {
  mode: RazorpayMode;
  amountPaise: number;
  currency: string;
  receipt: string;
  notes?: Record<string, string>;
  autoCapture: boolean;
}) {
  const { keyId, keySecret } = razorpayCreds(opts.mode);
  const res = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: { "content-type": "application/json", authorization: authHeader(keyId, keySecret) },
    body: JSON.stringify({
      amount: opts.amountPaise,
      currency: opts.currency,
      receipt: opts.receipt,
      notes: opts.notes ?? {},
      payment_capture: opts.autoCapture ? 1 : 0,
    }),
  });
  const json = (await res.json()) as Record<string, unknown>;
  if (!res.ok) {
    const err = json?.error as { description?: string } | undefined;
    throw new Error(err?.description || "Could not create the payment order.");
  }
  return { id: String(json.id), amount: Number(json.amount), keyId };
}

/** Fetches a payment from Razorpay so the server never trusts the browser. */
export async function fetchRazorpayPayment(mode: RazorpayMode, paymentId: string) {
  const { keyId, keySecret } = razorpayCreds(mode);
  const res = await fetch(`https://api.razorpay.com/v1/payments/${paymentId}`, {
    headers: { authorization: authHeader(keyId, keySecret) },
  });
  const json = (await res.json()) as Record<string, unknown>;
  if (!res.ok) throw new Error("Could not verify the payment with Razorpay.");
  return json;
}

function safeEqualHex(a: string, b: string) {
  const bufA = Buffer.from(a, "utf8");
  const bufB = Buffer.from(b, "utf8");
  return bufA.length === bufB.length && timingSafeEqual(bufA, bufB);
}

/** Verifies the checkout handler signature: HMAC(order_id|payment_id). */
export function verifyCheckoutSignature(
  mode: RazorpayMode,
  razorpayOrderId: string,
  razorpayPaymentId: string,
  signature: string,
) {
  const { keySecret } = razorpayCreds(mode);
  const expected = createHmac("sha256", keySecret)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest("hex");
  return safeEqualHex(expected, signature);
}

/** Verifies a webhook delivery signature over the raw body. */
export function verifyWebhookSignature(rawBody: string, signature: string) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) return false;
  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  return safeEqualHex(expected, signature);
}
