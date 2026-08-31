// Server-only: sends the admin notification for a new enquiry / complaint.
// Email credentials never leave the server.

type Payload = {
  reference: string;
  created_at: string;
  customer_name: string;
  mobile: string;
  email: string;
  order_number?: string;
  product: string;
  type: "enquiry" | "complaint";
  message: string;
};

async function adminEmail(): Promise<string> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin.from("security_settings").select("alert_email").maybeSingle();
  if (data?.alert_email) return data.alert_email;
  const { data: site } = await supabaseAdmin.from("site_settings").select("email").maybeSingle();
  return site?.email ?? "";
}

export async function notifyAdminOfEnquiry(payload: Payload) {
  try {
    const to = await adminEmail();
    if (!to) return { sent: false, reason: "no_admin_email" as const };

    const { sendTemplateEmail } = await import("@/lib/email-templates/send-email");
    const result = await sendTemplateEmail("enquiry-notification", to, {
      templateData: {
        reference: payload.reference,
        type: payload.type,
        customer_name: payload.customer_name,
        mobile: payload.mobile,
        email: payload.email,
        order_number: payload.order_number ?? "",
        product: payload.product,
        message: payload.message,
        created_at: payload.created_at,
      },
      idempotencyKey: `enquiry-notification-${payload.reference}`,
    });

    return result;
  } catch (error) {
    // A failed notification must never fail the customer's submission.
    console.error("[enquiry] notification failed", error);
    return { sent: false, reason: "error" as const };
  }
}
