import { useEffect, useState } from "react";
import { MessageCircle, X, Maximize2, Minus } from "lucide-react";
import { Link, useRouterState } from "@tanstack/react-router";
import { SupportChat } from "./SupportChat";
import { useAiChatDisplay } from "@/lib/ai-chat";
import logoFallback from "@/assets/logo.png";

/** Floating AI assistant available on every page. */
export function SupportChatWidget() {
  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [unread, setUnread] = useState(0);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { settings } = useAiChatDisplay();

  useEffect(() => {
    if (open && !minimized) setUnread(0);
  }, [open, minimized]);

  const hiddenRoute =
    pathname.startsWith("/support") || pathname.startsWith("/ai-chat") || pathname.startsWith("/admin");
  if (hiddenRoute || !settings.is_enabled || !settings.floating_enabled) return null;

  const side = settings.floating_position === "bottom-left" ? "left-4" : "right-4";
  const avatar = settings.ai_avatar_url || logoFallback;

  return (
    <>
      {open ? (
        <div
          className={`fixed bottom-4 ${side} z-50 flex w-[min(94vw,380px)] flex-col overflow-hidden rounded-2xl border bg-card shadow-[var(--shadow-lift)] ${
            minimized ? "h-auto" : "h-[min(78vh,560px)]"
          }`}
        >
          <header className="flex items-center gap-2 border-b bg-blush px-3 py-2">
            <img src={avatar} alt="" className="h-8 w-8 rounded-full object-contain" />
            <div className="min-w-0 flex-1">
              <p className="truncate font-display text-sm font-bold">{settings.ai_name}</p>
              <p className="text-[11px] text-muted-foreground">Usually replies instantly</p>
            </div>
            <button
              type="button"
              aria-label={minimized ? "Expand chat" : "Minimize chat"}
              className="rounded-full p-1.5 hover:bg-background/60"
              onClick={() => setMinimized((m) => !m)}
            >
              {minimized ? <Maximize2 className="h-4 w-4" /> : <Minus className="h-4 w-4" />}
            </button>
            <Link
              to="/ai-chat"
              aria-label="Open full page chat"
              className="rounded-full p-1.5 hover:bg-background/60"
              onClick={() => setOpen(false)}
            >
              <Maximize2 className="h-4 w-4" />
            </Link>
            <button
              type="button"
              aria-label="Close chat"
              className="rounded-full p-1.5 hover:bg-background/60"
              onClick={() => setOpen(false)}
            >
              <X className="h-4 w-4" />
            </button>
          </header>
          <div className={minimized ? "hidden" : "min-h-0 flex-1"}>
            <SupportChat
              compact
              onAssistantMessage={() => {
                if (minimized) setUnread((n) => n + 1);
              }}
            />
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => {
            setOpen(true);
            setMinimized(false);
          }}
          aria-label={`Chat with ${settings.ai_name}`}
          className={`fixed bottom-4 ${side} z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[var(--shadow-lift)] transition-transform hover:scale-105`}
        >
          <MessageCircle className="h-6 w-6" />
          {unread > 0 ? (
            <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-teal px-1 text-[10px] font-bold text-teal-foreground">
              {unread}
            </span>
          ) : null}
        </button>
      )}
    </>
  );
}
