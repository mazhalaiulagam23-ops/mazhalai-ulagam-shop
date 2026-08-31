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

    const label = payload.type === "complaint" ? "Product Complaint" : "Product Enquiry";
    const subject = `New ${label} – MazhalaiHub – #${payload.reference}`;

    // Delivery is wired through Lovable's managed email service once the
    // sender domain is verified; until then the notification is logged.
    let sendTemplateEmail:
      | ((name: string, to: string, opts: { templateData: Record<string, unknown>; idempotencyKey?: string }) => Promise<unknown>)
      | null = null;
    try {
      const mod = (await import(/* @vite-ignore */ "@/lib/email-templates/send-email")) as {
        sendTemplateEmail?: typeof sendTemplateEmail;
      };
      sendTemplateEmail = mod.sendTemplateEmail ?? null;
    } catch {
      sendTemplateEmail = null;
    }

    if (!sendTemplateEmail) {
      console.warn(`[enquiry] email not configured, would notify ${to}: ${subject}`);
      return { sent: false, reason: "email_not_configured" as const };
    }

    await sendTemplateEmail("enquiry-notification", to, {
      templateData: { ...payload, subject, label },
      idempotencyKey: `enquiry-${payload.reference}`,
    });
    return { sent: true as const };
  } catch (error) {
    console.error("[enquiry] notification failed", error);
    return { sent: false, reason: "error" as const };
  }
}
