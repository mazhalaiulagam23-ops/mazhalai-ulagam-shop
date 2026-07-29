import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { PageHeader } from "@/components/site/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/auth")({
  validateSearch: (search: Record<string, unknown>) => ({
    redirect: typeof search.redirect === "string" ? search.redirect : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Sign In or Register | Mazhalai Ulagam" },
      {
        name: "description",
        content: "Sign in to Mazhalai Ulagam to track orders, save favourites and manage your store account.",
      },
      { property: "og:title", content: "Sign In or Register | Mazhalai Ulagam" },
      { property: "og:description", content: "Access your Mazhalai Ulagam account securely." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthPage,
});

const credentials = z.object({
  email: z.string().trim().email("Enter a valid email").max(160),
  password: z.string().min(6, "Password must be at least 6 characters").max(72),
});

const safePath = (value: string | undefined) =>
  value && value.startsWith("/") && !value.startsWith("//") ? value : "/account";

function AuthPage() {
  const navigate = useNavigate();
  const search = useSearch({ from: "/auth" });
  const { user, loading } = useAuth();
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!loading && user) navigate({ to: safePath(search.redirect), replace: true });
  }, [loading, user, navigate, search.redirect]);

  const signIn = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>;
    const parsed = credentials.safeParse(form);
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);

    setPending(true);
    const { error } = await supabase.auth.signInWithPassword(parsed.data);
    setPending(false);
    if (error) return toast.error(error.message);
    toast.success("Welcome back!");
    navigate({ to: safePath(search.redirect), replace: true });
  };

  const signUp = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>;
    const parsed = credentials.safeParse(form);
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);
    const fullName = (form.full_name ?? "").trim().slice(0, 80);

    setPending(true);
    const { error } = await supabase.auth.signUp({
      ...parsed.data,
      options: {
        emailRedirectTo: window.location.origin,
        data: { full_name: fullName, phone: (form.phone ?? "").trim().slice(0, 15) },
      },
    });
    setPending(false);
    if (error) return toast.error(error.message);
    toast.success("Account created. You're signed in!");
    navigate({ to: safePath(search.redirect), replace: true });
  };

  const googleSignIn = async () => {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) return toast.error("Google sign-in failed. Please try again.");
    if (result.redirected) return;
    navigate({ to: safePath(search.redirect), replace: true });
  };

  return (
    <>
      <PageHeader title="My Account" crumbs={[{ label: "Sign in" }]} />
      <div className="container-page py-10">
        <div className="surface-card mx-auto max-w-md p-6">
          <Tabs defaultValue="login">
            <TabsList className="w-full">
              <TabsTrigger value="login" className="flex-1">
                Login
              </TabsTrigger>
              <TabsTrigger value="register" className="flex-1">
                Register
              </TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={signIn} className="space-y-4 pt-4" noValidate>
                <div>
                  <Label htmlFor="login-email">Email</Label>
                  <Input id="login-email" name="email" type="email" required className="mt-1.5" />
                </div>
                <div>
                  <Label htmlFor="login-password">Password</Label>
                  <Input id="login-password" name="password" type="password" required className="mt-1.5" />
                </div>
                <Button type="submit" className="w-full" disabled={pending}>
                  Login
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="register">
              <form onSubmit={signUp} className="space-y-4 pt-4" noValidate>
                <div>
                  <Label htmlFor="reg-name">Full name</Label>
                  <Input id="reg-name" name="full_name" required className="mt-1.5" />
                </div>
                <div>
                  <Label htmlFor="reg-phone">Mobile number</Label>
                  <Input id="reg-phone" name="phone" type="tel" className="mt-1.5" />
                </div>
                <div>
                  <Label htmlFor="reg-email">Email</Label>
                  <Input id="reg-email" name="email" type="email" required className="mt-1.5" />
                </div>
                <div>
                  <Label htmlFor="reg-password">Password</Label>
                  <Input id="reg-password" name="password" type="password" required className="mt-1.5" />
                </div>
                <Button type="submit" className="w-full" disabled={pending}>
                  Create account
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="h-px flex-1 bg-border" /> or <span className="h-px flex-1 bg-border" />
          </div>
          <Button variant="outline" className="w-full" onClick={googleSignIn}>
            Continue with Google
          </Button>
        </div>
      </div>
    </>
  );
}
