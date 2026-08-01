import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/site/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { checkPassword } from "@/lib/security";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Reset Your Password | Mazhalai Ulagam" },
      { name: "description", content: "Choose a new password for your Mazhalai Ulagam account." },
      { property: "og:title", content: "Reset Your Password | Mazhalai Ulagam" },
      { property: "og:description", content: "Securely set a new password for your store account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [pending, setPending] = useState(false);
  const [password, setPassword] = useState("");

  useEffect(() => {
    const hash = window.location.hash;
    const isRecovery = hash.includes("type=recovery");
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || (session && isRecovery)) setReady(true);
    });
    void supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const strength = checkPassword(password);
    if (!strength.valid) return toast.error(strength.problems[0] ?? "Choose a stronger password");
    const confirm = new FormData(e.currentTarget).get("confirm");
    if (confirm !== password) return toast.error("Passwords do not match");

    setPending(true);
    const { error } = await supabase.auth.updateUser({ password });
    setPending(false);
    if (error) return toast.error(error.message);
    toast.success("Password updated. Please sign in again.");
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };

  const result = checkPassword(password);

  return (
    <>
      <PageHeader title="Reset password" crumbs={[{ label: "Reset password" }]} />
      <div className="container-page py-10">
        <div className="surface-card mx-auto max-w-md p-6">
          {!ready ? (
            <p className="text-sm text-muted-foreground">
              Open the reset link from your email on this device to set a new password. Links expire for your safety.
            </p>
          ) : (
            <form onSubmit={submit} className="space-y-4" noValidate>
              <div>
                <Label htmlFor="new-password">New password</Label>
                <Input
                  id="new-password"
                  type="password"
                  autoComplete="new-password"
                  className="mt-1.5"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                {password ? (
                  <p className="mt-1.5 text-xs text-muted-foreground">
                    {result.label}
                    {result.problems.length ? ` — ${result.problems[0]}` : ""}
                  </p>
                ) : null}
              </div>
              <div>
                <Label htmlFor="confirm-password">Confirm password</Label>
                <Input id="confirm-password" name="confirm" type="password" className="mt-1.5" required />
              </div>
              <Button type="submit" className="w-full" disabled={pending}>
                Update password
              </Button>
            </form>
          )}
        </div>
      </div>
    </>
  );
}
