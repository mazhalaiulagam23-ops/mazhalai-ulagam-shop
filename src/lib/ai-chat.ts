import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type AiChatDisplay = {
  is_enabled: boolean;
  floating_enabled: boolean;
  ai_name: string;
  ai_avatar_url: string | null;
  welcome_title: string;
  welcome_message: string;
  suggested_questions: string[];
  accent_color: string;
  floating_position: string;
  business_hours_enabled: boolean;
  business_hours_note: string;
  live_chat_enabled: boolean;
};

export const AI_CHAT_DEFAULTS: AiChatDisplay = {
  is_enabled: true,
  floating_enabled: true,
  ai_name: "Mazhalai Assistant",
  ai_avatar_url: null,
  welcome_title: "Welcome to Mazhalai Ulagam! 👶💛",
  welcome_message:
    "How can I help you today? Ask about products, orders, delivery, returns or offers — in English or Tamil.",
  suggested_questions: [
    "Toys for a 2 year old",
    "Gift under ₹500",
    "Track my order",
    "Return policy",
    "Organic baby products",
    "Talk to support",
  ],
  accent_color: "",
  floating_position: "bottom-right",
  business_hours_enabled: false,
  business_hours_note: "We reply 9 AM - 8 PM IST.",
  live_chat_enabled: false,
};

/** Public appearance/behaviour settings for the AI chat assistant. */
export function useAiChatDisplay() {
  const { data, isLoading } = useQuery({
    queryKey: ["ai-chat", "display"],
    queryFn: async () => {
      const { data, error } = await supabase.from("ai_chat_display").select("*").maybeSingle();
      if (error) throw error;
      return data;
    },
    staleTime: 60_000,
  });

  const settings: AiChatDisplay = {
    ...AI_CHAT_DEFAULTS,
    ...(data
      ? {
          is_enabled: data.is_enabled,
          floating_enabled: data.floating_enabled,
          ai_name: data.ai_name || AI_CHAT_DEFAULTS.ai_name,
          ai_avatar_url: data.ai_avatar_url,
          welcome_title: data.welcome_title || AI_CHAT_DEFAULTS.welcome_title,
          welcome_message: data.welcome_message || AI_CHAT_DEFAULTS.welcome_message,
          suggested_questions: data.suggested_questions?.length
            ? data.suggested_questions
            : AI_CHAT_DEFAULTS.suggested_questions,
          accent_color: data.accent_color || "",
          floating_position: data.floating_position || "bottom-right",
          business_hours_enabled: data.business_hours_enabled,
          business_hours_note: data.business_hours_note || "",
          live_chat_enabled: data.live_chat_enabled,
        }
      : {}),
  };

  return { settings, isLoading };
}
