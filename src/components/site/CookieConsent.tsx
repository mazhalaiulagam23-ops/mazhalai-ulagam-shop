import { useEffect, useState } from "react";
import { Cookie } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { COOKIE_CONSENT_KEY, readConsent, useCookieSettings } from "@/lib/security";

export function CookieConsent() {
  const settings = useCookieSettings();
  const [choice, setChoice] = useState<string | null>("pending");

  useEffect(() => {
    setChoice(readConsent());
  }, []);

  if (choice === "pending" || choice || !settings?.enabled) return null;

  const decide = (value: "accepted" | "essential") => {
    window.localStorage.setItem(COOKIE_CONSENT_KEY, value);
    setChoice(value);
  };

  return (
    <div className="fixed inset-x-3 bottom-[calc(4.75rem+env(safe-area-inset-bottom))] z-50 md:inset-x-auto md:bottom-6 md:right-6 md:max-w-md">
      <div className="surface-card border border-border/70 p-4 shadow-lg">
        <div className="flex items-start gap-3">
          <Cookie className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
          <div className="text-sm">
            <p className="font-semibold">We value your privacy</p>
            <p className="mt-1 text-muted-foreground">{settings.message}</p>
            <Link to={settings.policy_href} className="mt-1 inline-block text-xs font-semibold text-primary underline">
              Read our privacy policy
            </Link>
          </div>
        </div>
        <div className="mt-3 flex gap-2">
          <Button size="sm" className="flex-1" onClick={() => decide("accepted")}>
            Accept all
          </Button>
          <Button size="sm" variant="outline" className="flex-1" onClick={() => decide("essential")}>
            Essential only
          </Button>
        </div>
      </div>
    </div>
  );
}
