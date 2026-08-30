import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useIdleTimeout } from "@/lib/security";
import { Button } from "@/components/ui/button";

/**
 * Signs a signed-in user out after a period of inactivity, with a countdown
 * warning so they can stay signed in.
 */
export function SessionGuard() {
  const { user, isStaff } = useAuth();
  const navigate = useNavigate();
  const [config, setConfig] = useState({ timeoutMinutes: 30, warningSeconds: 60 });

  useEffect(() => {
    if (!isStaff) return;
    void supabase
      .from("security_settings")
      .select("session_timeout_minutes, session_warning_seconds")
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setConfig({
            timeoutMinutes: data.session_timeout_minutes,
            warningSeconds: data.session_warning_seconds,
          });
        }
      });
  }, [isStaff]);

  const onTimeout = useCallback(() => {
    void (async () => {
      await supabase.auth.signOut();
      toast.info("You were signed out after a period of inactivity.");
      navigate({ to: "/auth", search: {}, replace: true });
    })();
  }, [navigate]);

  const { secondsLeft, stayActive } = useIdleTimeout({ ...config, onTimeout, enabled: Boolean(user) });

  if (!secondsLeft) return null;

  return (
    <div className="fixed inset-x-3 top-3 z-[60] mx-auto max-w-sm">
      <div className="surface-card border border-border/70 p-4 shadow-lg">
        <p className="text-sm font-semibold">Still there?</p>
        <p className="mt-1 text-sm text-muted-foreground">
          For your security you'll be signed out in {secondsLeft} second{secondsLeft === 1 ? "" : "s"}.
        </p>
        <Button size="sm" className="mt-3 w-full" onClick={stayActive}>
          Stay signed in
        </Button>
      </div>
    </div>
  );
}
