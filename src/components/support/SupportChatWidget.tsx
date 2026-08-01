import { useState } from "react";
import { MessageCircle, X, Maximize2 } from "lucide-react";
import { Link, useRouterState } from "@tanstack/react-router";
import { SupportChat } from "./SupportChat";
import logo from "@/assets/logo.png";

/** Floating support assistant available on every page. */
export function SupportChatWidget() {
  const [open, setOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  if (pathname.startsWith("/support") || pathname.startsWith("/admin")) return null;



  return (
    <>
      {open ? (
        <div className="fixed bottom-4 right-4 z-50 flex h-[min(78vh,560px)] w-[min(94vw,380px)] flex-col overflow-hidden rounded-2xl border bg-card shadow-[var(--shadow-lift)]">
          <header className="flex items-center gap-2 border-b bg-blush px-3 py-2">
            <img src={logo} alt="" className="h-8 w-8 rounded-full object-contain" />
            <div className="min-w-0 flex-1">
              <p className="truncate font-display text-sm font-bold">Mazhalai Support</p>
              <p className="text-[11px] text-muted-foreground">Usually replies instantly</p>
            </div>
            <Link
              to="/support"
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
          <div className="min-h-0 flex-1">
            <SupportChat compact />
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Chat with Mazhalai Ulagam support"
          className="fixed bottom-4 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[var(--shadow-lift)] transition-transform hover:scale-105"
        >
          <MessageCircle className="h-6 w-6" />
        </button>
      )}
    </>
  );
}
