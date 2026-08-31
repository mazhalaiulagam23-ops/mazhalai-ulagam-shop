import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const ENQUIRY_TYPES = ["enquiry", "complaint"] as const;
export const ENQUIRY_STATUSES = ["new", "in_progress", "resolved"] as const;

export const enquiryInputSchema = z.object({
  customer_name: z.string().trim().min(2, "Please enter your name").max(80),
  mobile: z.string().trim().regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit mobile number"),
  email: z.string().trim().email("Enter a valid email").max(160),
  order_number: z.string().trim().max(40).optional().default(""),
  product: z.string().trim().min(2, "Enter the product name or ID").max(160),
  type: z.enum(ENQUIRY_TYPES),
  message: z.string().trim().min(10, "Please describe your enquiry or complaint").max(2000),
});

export type EnquiryInput = z.infer<typeof enquiryInputSchema>;

export type EnquiryRow = {
  id: string;
  reference: string;
  customer_name: string;
  mobile: string;
  email: string;
  order_number: string;
  product: string;
  type: (typeof ENQUIRY_TYPES)[number];
  message: string;
  status: (typeof ENQUIRY_STATUSES)[number];
  admin_notes: string;
  created_at: string;
};

/** Public: customers (guests included) submit an enquiry or complaint. */
export const submitEnquiry = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => enquiryInputSchema.parse(data))
  .handler(async ({ data }) => {
    const { rateLimit, requestMeta } = await import("@/lib/security.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { ip } = requestMeta();

    const limit = await rateLimit("enquiry", ip ?? "unknown", 5, 600);
    if (!limit.allowed) throw new Error("Too many submissions. Please try again in a few minutes.");

    const { data: row, error } = await supabaseAdmin
      .from("enquiries")
      .insert({
        customer_name: data.customer_name,
        mobile: data.mobile,
        email: data.email,
        order_number: data.order_number ?? "",
        product: data.product,
        type: data.type,
        message: data.message,
      })
      .select("reference, created_at")
      .single();

    if (error || !row) throw new Error("We couldn't save your request. Please try again.");

    const { notifyAdminOfEnquiry } = await import("@/lib/enquiry-notify.server");
    await notifyAdminOfEnquiry({ ...data, reference: row.reference, created_at: row.created_at });

    return { reference: row.reference };
  });

/** Staff: list all enquiries and complaints. */
export const listEnquiries = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("enquiries")
      .select("id, reference, customer_name, mobile, email, order_number, product, type, message, status, admin_notes, created_at")
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) throw new Error(error.message);
    return (data ?? []) as EnquiryRow[];
  });

/** Staff: update the workflow status / internal notes of an enquiry. */
export const updateEnquiryStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        status: z.enum(ENQUIRY_STATUSES),
        admin_notes: z.string().trim().max(2000).optional(),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("enquiries")
      .update({ status: data.status, ...(data.admin_notes === undefined ? {} : { admin_notes: data.admin_notes }) })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });
