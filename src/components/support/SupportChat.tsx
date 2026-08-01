import { useEffect, useMemo, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Loader2, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
} from "@/components/ai-elements/prompt-input";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import logo from "@/assets/logo.png";

const QUICK_REPLIES = [
  "Shop Products",
  "Baby Toys",
  "Books",
  "Clothing",
  "Track Order",
  "Returns",
  "Offers",
  "Talk to Support",
];

const HISTORY_KEY = ["support-chat", "history"] as const;

/** Loads the signed-in customer's saved support conversation. */
function useSupportHistory(userId: string | undefined) {
  return useQuery({
    queryKey: [...HISTORY_KEY, userId],
    enabled: !!userId,
    queryFn: async (): Promise<UIMessage[]> => {
      const { data, error } = await supabase
        .from("support_messages")
        .select("id, role, parts, created_at")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []).map((row) => ({
        id: row.id,
        role: row.role as UIMessage["role"],
        parts: (row.parts ?? []) as UIMessage["parts"],
      }));
    },
  });
}

export function SupportChat({ compact = false }: { compact?: boolean }) {
  const { user, loading } = useAuth();
  const qc = useQueryClient();
  const { data: history, isLoading: historyLoading } = useSupportHistory(user?.id);
  const [ready, setReady] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        headers: async () => {
          const { data } = await supabase.auth.getSession();
          const token = data.session?.access_token;
          return token ? { Authorization: `Bearer ${token}` } : {};
        },
      }),
    [],
  );

  const { messages, setMessages, sendMessage, status, error } = useChat({
    id: "mazhalai-support",
    transport,
    onError: (err) => toast.error(err.message || "The assistant is unavailable right now."),
  });

  // Restore saved history once it arrives (one ongoing conversation per customer).
  useEffect(() => {
    if (ready) return;
    if (!user) {
      if (!loading) setReady(true);
      return;
    }
    if (historyLoading) return;
    if (history?.length) setMessages(history);
    setReady(true);
  }, [ready, user, loading, history, historyLoading, setMessages]);

  const busy = status === "submitted" || status === "streaming";

  // Keep the composer focused during normal chat use.
  useEffect(() => {
    if (!busy) textareaRef.current?.focus();
  }, [busy, ready]);

  const send = (text: string) => {
    const value = text.trim();
    if (!value || busy) return;
    void sendMessage({ text: value }).then(() => {
      if (user) void qc.invalidateQueries({ queryKey: HISTORY_KEY });
    });
  };

  const clearChat = async () => {
    setMessages([]);
    if (user) {
      const { error: delError } = await supabase
        .from("support_messages")
        .delete()
        .eq("user_id", user.id);
      if (delError) toast.error("Could not clear the saved conversation.");
      else void qc.invalidateQueries({ queryKey: HISTORY_KEY });
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <Conversation className="min-h-0 flex-1">
        <ConversationContent className="gap-4">
          {messages.length === 0 ? (
            <ConversationEmptyState
              icon={
                <img
                  src={logo}
                  alt="Mazhalai Ulagam assistant"
                  className="h-14 w-14 rounded-full object-contain"
                />
              }
              title="Welcome to Mazhalai Ulagam! 👶💛"
              description="How can I help you today? Pick an option below or type your question — Tamil is welcome too."
            />
          ) : null}

          {messages.map((m) => {
            const text = m.parts
              .map((p) => (p.type === "text" ? p.text : ""))
              .join("")
              .trim();
            if (!text) return null;
            return (
              <Message from={m.role} key={m.id}>
                <MessageContent
                  className={
                    m.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-transparent p-0 text-foreground"
                  }
                >
                  <MessageResponse>{text}</MessageResponse>
                </MessageContent>
              </Message>
            );
          })}

          {status === "submitted" ? (
            <Message from="assistant">
              <MessageContent className="bg-transparent p-0">
                <Shimmer>Thinking…</Shimmer>
              </MessageContent>
            </Message>
          ) : null}

          {error ? (
            <p className="text-center text-xs text-destructive">
              Something went wrong. Please try again or{" "}
              <Link to="/contact" className="underline">
                contact our team
              </Link>
              .
            </p>
          ) : null}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      {messages.length === 0 ? (
        <div className="flex flex-wrap gap-1.5 px-3 pb-2">
          {QUICK_REPLIES.map((q) => (
            <Button
              key={q}
              size="sm"
              variant="soft"
              className="h-7 px-3 text-[11px]"
              onClick={() => send(q)}
            >
              {q}
            </Button>
          ))}
        </div>
      ) : null}

      <div className={compact ? "border-t p-2" : "border-t p-3"}>
        <PromptInput
          onSubmit={(msg, event) => {
            event.preventDefault();
            send(msg.text ?? "");
            (event.currentTarget as HTMLFormElement).reset();
          }}
        >
          <PromptInputTextarea
            ref={textareaRef}
            autoFocus
            placeholder="Ask about products, orders, delivery…"
          />
          <PromptInputFooter className="justify-between">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 gap-1 px-2 text-[11px] text-muted-foreground"
              onClick={() => void clearChat()}
            >
              <RotateCcw className="h-3 w-3" /> New conversation
            </Button>
            <PromptInputSubmit status={status} disabled={busy} />
          </PromptInputFooter>
        </PromptInput>
        {!user && !loading ? (
          <p className="mt-2 text-center text-[11px] text-muted-foreground">
            <Link to="/auth" search={{ redirect: "/support" }} className="underline">
              Sign in
            </Link>{" "}
            to save this chat and let us look up your orders.
          </p>
        ) : null}
        {historyLoading && user ? (
          <p className="mt-2 flex items-center justify-center gap-1 text-[11px] text-muted-foreground">
            <Loader2 className="h-3 w-3 animate-spin" /> Loading your chat…
          </p>
        ) : null}
      </div>
    </div>
  );
}
