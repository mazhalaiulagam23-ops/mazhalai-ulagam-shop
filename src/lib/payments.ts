import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type PaymentSettings = Tables<"payment_settings">;

export const PAYMENT_SETTINGS_KEY = ["cms", "payment_settings"] as const;

/**
 * Public checkout configuration (methods enabled, COD limits, mode).
 * Reads the `payment_config` view, which exposes only non-sensitive fields —
 * gateway key IDs and capture/retry settings stay staff-only.
 */
export function usePaymentSettings() {
  return useQuery({
    queryKey: PAYMENT_SETTINGS_KEY,
    queryFn: async () => {
      const { data, error } = await supabase.from("payment_config").select("*").maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

let scriptPromise: Promise<boolean> | null = null;

/** Loads the Razorpay Checkout script once. */
export function loadRazorpay(): Promise<boolean> {
  if (typeof window === "undefined") return Promise.resolve(false);
  if ((window as any).Razorpay) return Promise.resolve(true);
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise((resolve) => {
    const el = document.createElement("script");
    el.src = "https://checkout.razorpay.com/v1/checkout.js";
    el.onload = () => resolve(true);
    el.onerror = () => {
      scriptPromise = null;
      resolve(false);
    };
    document.body.appendChild(el);
  });
  return scriptPromise;
}

export type RazorpaySession = {
  keyId: string;
  razorpayOrderId: string;
  amount: number;
  currency: string;
  checkoutName: string;
  checkoutDescription: string;
  orderNumber: string;
  prefill: { name: string; email: string; contact: string };
};

export type RazorpayResult = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

/** Opens the Razorpay modal and resolves with the handler payload (or null if dismissed). */
export async function openRazorpayCheckout(
  session: RazorpaySession,
  opts: { methods?: Record<string, boolean>; onFailed?: (code?: string, reason?: string) => void } = {},
): Promise<RazorpayResult | null> {
  const ok = await loadRazorpay();
  if (!ok) throw new Error("Could not load the payment window. Check your connection and retry.");

  return new Promise((resolve) => {
    const rzp = new (window as any).Razorpay({
      key: session.keyId,
      amount: session.amount,
      currency: session.currency,
      name: session.checkoutName,
      description: `${session.checkoutDescription} · ${session.orderNumber}`,
      order_id: session.razorpayOrderId,
      prefill: session.prefill,
      theme: { color: "#f2687a" },
      ...(opts.methods ? { config: { display: { blocks: {}, sequence: [], preferences: {} } } } : {}),
      method: opts.methods,
      modal: { ondismiss: () => resolve(null) },
      handler: (res: RazorpayResult) => resolve(res),
    });
    rzp.on("payment.failed", (res: any) => {
      opts.onFailed?.(res?.error?.code, res?.error?.description);
    });
    rzp.open();
  });
}
