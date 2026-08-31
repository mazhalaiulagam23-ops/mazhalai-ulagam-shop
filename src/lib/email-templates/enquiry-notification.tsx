import React from "react";
import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import type { TemplateEntry } from "./registry";

interface Props {
  reference?: string;
  type?: "enquiry" | "complaint";
  customer_name?: string;
  mobile?: string;
  email?: string;
  order_number?: string;
  product?: string;
  message?: string;
  created_at?: string;
}

const EnquiryNotification = ({
  reference,
  type,
  customer_name,
  mobile,
  email,
  order_number,
  product,
  message,
  created_at,
}: Props) => {
  const label = type === "complaint" ? "Product Complaint" : "Product Enquiry";
  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>
        New {label.toLowerCase()} #{reference ?? ""} from {customer_name ?? "a customer"}
      </Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={brand}>MazhalaiHub</Heading>
          <Heading as="h2" style={title}>
            New {label}
          </Heading>
          <Text style={muted}>Reference: #{reference ?? "—"}</Text>

          <Section style={card}>
            {[
              ["Customer", customer_name],
              ["Mobile", mobile],
              ["Email", email],
              ["Order number", order_number || "—"],
              ["Product", product],
              ["Submitted", created_at ? new Date(created_at).toLocaleString("en-IN") : "—"],
            ].map(([k, v]) => (
              <Text key={k} style={row}>
                <span style={rowKey}>{k}:</span> {v ?? "—"}
              </Text>
            ))}
          </Section>

          <Section style={card}>
            <Text style={rowKey}>Message</Text>
            <Text style={messageStyle}>{message ?? ""}</Text>
          </Section>

          <Hr style={hr} />
          <Text style={footer}>
            Open Admin → Engagement → Enquiries to reply and update the status of this request.
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

export const template = {
  component: EnquiryNotification,
  subject: (d: Record<string, any>) =>
    `New ${d.type === "complaint" ? "Product Complaint" : "Product Enquiry"} – MazhalaiHub – #${d.reference ?? ""}`,
  displayName: "Admin enquiry notification",
  previewData: {
    reference: "MU-ENQ-1024",
    type: "complaint",
    customer_name: "Priya Sharma",
    mobile: "9876543210",
    email: "priya@example.com",
    order_number: "MU-1024",
    product: "Wooden puzzle set",
    message: "The puzzle arrived with a missing piece. Please help with a replacement.",
    created_at: new Date().toISOString(),
  },
} satisfies TemplateEntry;

const main = { backgroundColor: "#ffffff", fontFamily: "Arial, sans-serif" };
const container = { padding: "24px", maxWidth: "560px" };
const brand = { color: "#0d5c4d", fontSize: "22px", margin: "0 0 4px" };
const title = { color: "#1a1a1a", fontSize: "18px", margin: "0 0 4px" };
const muted = { color: "#6b7280", fontSize: "13px", margin: "0 0 16px" };
const card = {
  backgroundColor: "#f7f5f0",
  borderRadius: "8px",
  padding: "14px 16px",
  marginBottom: "12px",
};
const row = { color: "#1a1a1a", fontSize: "14px", margin: "4px 0" };
const rowKey = { color: "#6b7280", fontSize: "13px", fontWeight: "bold" as const };
const messageStyle = { color: "#1a1a1a", fontSize: "14px", whiteSpace: "pre-wrap" as const };
const hr = { borderColor: "#e5e7eb", margin: "20px 0" };
const footer = { color: "#6b7280", fontSize: "12px" };
