import { useEffect, useMemo, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Check, Copy, Loader2, Mic, MicOff, RotateCcw, ThumbsDown, ThumbsUp } from "lucide-react";
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
import { useAiChatDisplay } from "@/lib/ai-chat";
import logoFallback from "@/assets/logo.png";

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

/** Browser speech-to-text, when the browser supports it. */
function useVoiceInput(onResult: (text: string) => void) {
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    const w = window as any;
    const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    if (!Ctor) return;
    setSupported(true);
    const rec = new Ctor();
    rec.lang = "en-IN";
    rec.interimResults = false;
    rec.continuous = false;
    rec.onresult = (e: any) => {
      const text = e.results?.[0]?.[0]?.transcript as string | undefined;
      if (text) onResult(text);
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    recognitionRef.current = rec;
    return () => {
      try {
        rec.abort();
      } catch {
        /* ignore */
      }
    };
  }, [onResult]);

  const toggle = () => {
    const rec = recognitionRef.current;
    if (!rec) return;
    if (listening) {
      rec.stop();
      setListening(false);
      return;
    }
    try {
      rec.start();
      setListening(true);
    } catch {
      setListening(false);
    }
  };

  return { supported, listening, toggle };
}

export function SupportChat({
  compact = false,
  onAssistantMessage,
}: {
  compact?: boolean;
  onAssistantMessage?: () => void;
}) {
  const { user, loading } = useAuth();
  const qc = useQueryClient();
  const { settings } = useAiChatDisplay();
  const { data: history, isLoading: historyLoading } = useSupportHistory(user?.id);
  const [ready, setReady] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Record<string, 1 | -1>>({});
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const avatar = settings.ai_avatar_url || logoFallback;

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        headers: async (): Promise<Record<string, string>> => {
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
    onFinish: () => onAssistantMessage?.(),
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

  const voice = useVoiceInput((text) => send(text));

  const copy = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId((c) => (c === id ? null : c)), 1500);
    } catch {
      toast.error("Could not copy the message.");
    }
  };

  const rate = async (id: string, value: 1 | -1) => {
    setFeedback((f) => ({ ...f, [id]: value }));
    if (!user) return;
    await supabase
      .from("support_messages")
      .update({ feedback: value })
      .eq("user_id", user.id)
      .eq("client_message_id", id);
  };

  const clearChat = async () => {
    setMessages([]);
    setFeedback({});
    if (user) {
      const { error: delError } = await supabase
        .from("support_messages")
        .delete()
        .eq("user_id", user.id);
      if (delError) toast.error("Could not clear the saved conversation.");
      else void qc.invalidateQueries({ queryKey: HISTORY_KEY });
    }
  };

  if (!settings.is_enabled) {
    return (
      <div className="flex h-full items-center justify-center p-6 text-center text-sm text-muted-foreground">
        Our AI assistant is currently offline. Please{" "}
        <Link to="/contact" className="mx-1 underline">
          contact our team
        </Link>{" "}
        for help.
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <Conversation className="min-h-0 flex-1">
        <ConversationContent className="gap-4">
          {messages.length === 0 ? (
            <ConversationEmptyState
              icon={
                <img
                  src={avatar}
                  alt={settings.ai_name}
                  className="h-14 w-14 rounded-full object-contain"
                />
              }
              title={settings.welcome_title}
              description={settings.welcome_message}
            />
          ) : null}

          {messages.map((m) => {
            const text = m.parts
              .map((p) => (p.type === "text" ? p.text : ""))
              .join("")
              .trim();
            if (!text) return null;
            const mine = m.role === "user";
            return (
              <div key={m.id}>
                <Message from={m.role}>
                  <MessageContent
                    className={
                      mine
                        ? "bg-primary text-primary-foreground"
                        : "bg-transparent p-0 text-foreground"
                    }
                  >
                    <MessageResponse>{text}</MessageResponse>
                  </MessageContent>
                </Message>
                {!mine ? (
                  <div className="mt-1 flex items-center gap-1 pl-1">
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      aria-label="Copy response"
                       className="h-11 w-11 p-0 text-muted-foreground sm:h-7 sm:w-7"
                      onClick={() => void copy(m.id, text)}
                    >
                      {copiedId === m.id ? (
                        <Check className="h-3.5 w-3.5" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      aria-label="Helpful"
                       className={`h-11 w-11 p-0 sm:h-7 sm:w-7 ${feedback[m.id] === 1 ? "text-teal" : "text-muted-foreground"}`}
                      onClick={() => void rate(m.id, 1)}
                    >
                      <ThumbsUp className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      aria-label="Not helpful"
                       className={`h-11 w-11 p-0 sm:h-7 sm:w-7 ${feedback[m.id] === -1 ? "text-destructive" : "text-muted-foreground"}`}
                      onClick={() => void rate(m.id, -1)}
                    >
                      <ThumbsDown className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ) : null}
              </div>
            );
          })}

          {status === "submitted" ? (
            <Message from="assistant">
              <MessageContent className="bg-transparent p-0">
                <Shimmer>{`${settings.ai_name} is typing…`}</Shimmer>
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
          {settings.suggested_questions.map((q) => (
            <Button
              key={q}
              size="sm"
              variant="soft"
               className="min-h-11 whitespace-normal px-3 py-2 text-[11px] sm:h-7 sm:min-h-0 sm:whitespace-nowrap sm:py-0"
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
            <div className="flex items-center gap-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                   className="min-h-11 gap-1 px-2 text-[11px] text-muted-foreground sm:h-7 sm:min-h-0"
                onClick={() => void clearChat()}
              >
                <RotateCcw className="h-3 w-3" /> Clear chat
              </Button>
              {voice.supported ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  aria-label={voice.listening ? "Stop voice input" : "Start voice input"}
                   className={`h-11 w-11 p-0 sm:h-7 sm:w-7 ${voice.listening ? "text-primary" : "text-muted-foreground"}`}
                  onClick={voice.toggle}
                >
                  {voice.listening ? <MicOff className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5" />}
                </Button>
              ) : null}
            </div>
            <PromptInputSubmit status={status} disabled={busy} />
          </PromptInputFooter>
        </PromptInput>
        {settings.business_hours_enabled && settings.business_hours_note ? (
          <p className="mt-2 text-center text-[11px] text-muted-foreground">
            {settings.business_hours_note}
          </p>
        ) : null}
        {!user && !loading ? (
          <p className="mt-2 text-center text-[11px] text-muted-foreground">
            <Link to="/auth" search={{ redirect: "/ai-chat" }} className="underline">
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
