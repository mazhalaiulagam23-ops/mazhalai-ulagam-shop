import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { createClient } from "@supabase/supabase-js";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";
import { SUPPORT_SYSTEM_PROMPT, buildStoreContext } from "@/lib/support-prompt";
import type { Database } from "@/integrations/supabase/types";

type ChatRequestBody = { messages?: unknown };

function makeClient(accessToken?: string) {
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
  return createClient<Database>(process.env["SUPABASE_URL"]!, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        h.set("apikey", key);
        if (accessToken) h.set("Authorization", `Bearer ${accessToken}`);
        else if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`)
          h.delete("Authorization");
        return fetch(input, { ...init, headers: h });
      },
    },
  });
}

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = (await request.json()) as ChatRequestBody;
        const messages = body.messages;
        if (!Array.isArray(messages)) {
          return new Response("Messages are required", { status: 400 });
        }

        const apiKey = process.env["LOVABLE_API_KEY"];
        if (!apiKey) return new Response("AI is not configured", { status: 500 });

        const authHeader = request.headers.get("Authorization") ?? "";
        const accessToken = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : undefined;

        const anon = makeClient();
        const user = accessToken ? makeClient(accessToken) : null;

        let userId: string | null = null;
        let customerName: string | null = null;
        if (user && accessToken) {
          const { data } = await user.auth.getUser(accessToken);
          userId = data.user?.id ?? null;
          customerName = (data.user?.user_metadata?.["full_name"] as string | undefined) ?? null;
        }

        const [{ data: products }, ordersRes] = await Promise.all([
          anon
            .from("products")
            .select(
              "name, slug, category_slug, price, mrp, offer_price, stock, age_group, short_description",
            )
            .eq("is_active", true)
            .eq("status", "active")
            .order("created_at", { ascending: false })
            .limit(120),
          user
            ? user
                .from("orders")
                .select("order_number, status, payment_status, total, created_at")
                .order("created_at", { ascending: false })
                .limit(10)
            : Promise.resolve({ data: [] as never[] }),
        ]);

        const uiMessages = messages as UIMessage[];

        const gateway = createLovableAiGatewayProvider(apiKey);
        const result = streamText({
          model: gateway("google/gemini-3-flash-preview"),
          system: `${SUPPORT_SYSTEM_PROMPT}\n\n${buildStoreContext({
            products: products ?? [],
            orders: (ordersRes.data ?? []) as never[],
            customerName,
          })}`,
          messages: await convertToModelMessages(uiMessages),
        });

        return result.toUIMessageStreamResponse({
          originalMessages: uiMessages,
          onFinish: async ({ responseMessage }) => {
            if (!user || !userId) return;
            const last = uiMessages[uiMessages.length - 1];
            const rows: Array<Database["public"]["Tables"]["support_messages"]["Insert"]> = [];
            if (last && last.role === "user") {
              rows.push({
                user_id: userId,
                role: "user",
                client_message_id: last.id,
                parts: last.parts as never,
              });
            }
            rows.push({
              user_id: userId,
              role: "assistant",
              client_message_id: responseMessage.id,
              parts: responseMessage.parts as never,
            });
            const { error } = await user.from("support_messages").insert(rows);
            if (error) console.error("support_messages insert failed", error);
          },
        });
      },
    },
  },
});
