import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/site/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useAuth } from "@/lib/auth";
import { checkPassword, useRecaptcha } from "@/lib/security";
import { preLoginCheck, preSignupCheck, recordLoginResult } from "@/lib/security.functions";

export const Route = createFileRoute("/auth")({
  validateSearch: (search: Record<string, unknown>) => ({
    redirect: typeof search.redirect === "string" ? search.redirect : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Sign In or Register | MazhalaiHub" },
      {
        name: "description",
        content: "Sign in to Mazhalai Ulagam to track orders, save favourites and manage your store account.",
      },
      { property: "og:title", content: "Sign In or Register | MazhalaiHub" },
      { property: "og:description", content: "Access your Mazhalai Ulagam account securely." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthPage,
});

const emailSchema = z.string().trim().email("Enter a valid email").max(160);

const safePath = (value: string | undefined) =>
  value && value.startsWith("/") && !value.startsWith("//") ? value : "/account";

function PasswordMeter({ value }: { value: string }) {
  if (!value) return null;
  const result = checkPassword(value);
  const tone = result.score >= 5 ? "bg-emerald-500" : result.score >= 3 ? "bg-amber-500" : "bg-destructive";
  return (
    <div className="mt-2 space-y-1">
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
        <div className={`h-full ${tone}`} style={{ width: `${(result.score / 5) * 100}%` }} />
      </div>
      <p className="text-xs text-muted-foreground">
        {result.label}
        {result.problems.length ? ` — ${result.problems[0]}` : ""}
      </p>
    </div>
  );
}

function AuthPage() {
  const navigate = useNavigate();
  const search = useSearch({ from: "/auth" });
  const { user, loading } = useAuth();
  const [pending, setPending] = useState(false);
  const [password, setPassword] = useState("");
  const [siteKey, setSiteKey] = useState<string | undefined>();
  const [otpSent, setOtpSent] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const getCaptchaToken = useRecaptcha(siteKey);

  useEffect(() => {
    void supabase
      .from("site_settings")
      .select("recaptcha_site_key")
      .maybeSingle()
      .then(({ data }) => setSiteKey(data?.recaptcha_site_key || undefined));
  }, []);

  useEffect(() => {
    if (!loading && user) navigate({ to: safePath(search.redirect), replace: true });
  }, [loading, user, navigate, search.redirect]);

  const signIn = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>;
    const email = emailSchema.safeParse(form.email);
    if (!email.success) return toast.error(email.error.issues[0]!.message);
    if (!form.password) return toast.error("Enter your password");

    setPending(true);
    try {
      const captchaToken = await getCaptchaToken("login");
      const gate = await preLoginCheck({ data: { email: email.data, captchaToken } });
      if (!gate.allowed) {
        toast.error(gate.reason ?? "Sign-in blocked.");
        return;
      }

      const { error } = await supabase.auth.signInWithPassword({ email: email.data, password: form.password });
      await recordLoginResult({
        data: { email: email.data, success: !error, method: "password", reason: error?.message?.slice(0, 200) },
      });
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success("Welcome back!");
      navigate({ to: safePath(search.redirect), replace: true });
    } finally {
      setPending(false);
    }
  };

  const signUp = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>;
    const email = emailSchema.safeParse(form.email);
    if (!email.success) return toast.error(email.error.issues[0]!.message);
    const strength = checkPassword(form.password ?? "");
    if (!strength.valid) return toast.error(strength.problems[0] ?? "Choose a stronger password");

    setPending(true);
    try {
      const captchaToken = await getCaptchaToken("signup");
      const gate = await preSignupCheck({ data: { email: email.data, captchaToken } });
      if (!gate.allowed) {
        toast.error(gate.reason ?? "Sign-up blocked.");
        return;
      }

      const { data, error } = await supabase.auth.signUp({
        email: email.data,
        password: form.password!,
        options: {
          emailRedirectTo: `${window.location.origin}/auth`,
          data: {
            full_name: (form.full_name ?? "").trim().slice(0, 80),
            phone: (form.phone ?? "").trim().slice(0, 15),
          },
        },
      });
      if (error) {
        toast.error(error.message);
        return;
      }
      if (!data.session) {
        setNotice(`We've sent a verification link to ${email.data}. Please confirm your email to activate the account.`);
        toast.success("Check your email to verify your account.");
        return;
      }
      navigate({ to: safePath(search.redirect), replace: true });
    } finally {
      setPending(false);
    }
  };

  const sendOtp = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>;
    const email = emailSchema.safeParse(form.email);
    if (!email.success) return toast.error(email.error.issues[0]!.message);

    setPending(true);
    try {
      const captchaToken = await getCaptchaToken("otp");
      const gate = await preLoginCheck({ data: { email: email.data, captchaToken } });
      if (!gate.allowed) {
        toast.error(gate.reason ?? "Sign-in blocked.");
        return;
      }
      const { error } = await supabase.auth.signInWithOtp({
        email: email.data,
        options: { emailRedirectTo: `${window.location.origin}/auth`, shouldCreateUser: false },
      });
      if (error) {
        toast.error(error.message);
        return;
      }
      setOtpSent(email.data);
      toast.success("We've emailed you a 6-digit code.");
    } finally {
      setPending(false);
    }
  };

  const verifyOtp = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>;
    if (!otpSent) return;
    setPending(true);
    try {
      const { error } = await supabase.auth.verifyOtp({
        email: otpSent,
        token: (form.token ?? "").trim(),
        type: "email",
      });
      await recordLoginResult({
        data: { email: otpSent, success: !error, method: "otp", reason: error?.message?.slice(0, 200) },
      });
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success("Signed in!");
      navigate({ to: safePath(search.redirect), replace: true });
    } finally {
      setPending(false);
    }
  };

  const forgotPassword = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>;
    const email = emailSchema.safeParse(form.email);
    if (!email.success) return toast.error(email.error.issues[0]!.message);

    setPending(true);
    try {
      const captchaToken = await getCaptchaToken("reset");
      const gate = await preLoginCheck({ data: { email: email.data, captchaToken } });
      if (!gate.allowed) {
        toast.error(gate.reason ?? "Request blocked.");
        return;
      }
      const { error } = await supabase.auth.resetPasswordForEmail(email.data, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) {
        toast.error(error.message);
        return;
      }
      setNotice(`If an account exists for ${email.data}, a secure password reset link is on its way.`);
      toast.success("Password reset link sent.");
    } finally {
      setPending(false);
    }
  };

  const googleSignIn = async () => {
    const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (result.error) return toast.error("Google sign-in failed. Please try again.");
    if (result.redirected) return;
    navigate({ to: safePath(search.redirect), replace: true });
  };

  return (
    <>
      <PageHeader title="My Account" crumbs={[{ label: "Sign in" }]} />
      <div className="container-page py-10">
        <div className="surface-card mx-auto max-w-md p-6">
          {notice ? (
            <p className="mb-4 rounded-xl bg-secondary p-3 text-sm text-muted-foreground">{notice}</p>
          ) : null}

          <Tabs defaultValue="login">
            <TabsList className="w-full">
              <TabsTrigger value="login" className="flex-1">
                Login
              </TabsTrigger>
              <TabsTrigger value="otp" className="flex-1">
                Email code
              </TabsTrigger>
              <TabsTrigger value="register" className="flex-1">
                Register
              </TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={signIn} className="space-y-4 pt-4" noValidate>
                <div>
                  <Label htmlFor="login-email">Email</Label>
                  <Input id="login-email" name="email" type="email" required className="mt-1.5" autoComplete="email" />
                </div>
                <div>
                  <Label htmlFor="login-password">Password</Label>
                  <Input
                    id="login-password"
                    name="password"
                    type="password"
                    required
                    className="mt-1.5"
                    autoComplete="current-password"
                  />
                </div>
                <Button type="submit" className="w-full" disabled={pending}>
                  Login
                </Button>
              </form>

              <details className="mt-4 rounded-xl bg-secondary/60 p-3">
                <summary className="cursor-pointer text-sm font-semibold">Forgot your password?</summary>
                <form onSubmit={forgotPassword} className="mt-3 space-y-3" noValidate>
                  <Input name="email" type="email" placeholder="you@example.com" required />
                  <Button type="submit" variant="outline" size="sm" className="w-full" disabled={pending}>
                    Email me a reset link
                  </Button>
                </form>
              </details>
            </TabsContent>

            <TabsContent value="otp">
              {otpSent ? (
                <form onSubmit={verifyOtp} className="space-y-4 pt-4" noValidate>
                  <p className="text-sm text-muted-foreground">Enter the 6-digit code we emailed to {otpSent}.</p>
                  <div>
                    <Label htmlFor="otp-token">Verification code</Label>
                    <Input id="otp-token" name="token" inputMode="numeric" maxLength={8} required className="mt-1.5" />
                  </div>
                  <Button type="submit" className="w-full" disabled={pending}>
                    Verify and sign in
                  </Button>
                  <Button type="button" variant="ghost" size="sm" className="w-full" onClick={() => setOtpSent(null)}>
                    Use a different email
                  </Button>
                </form>
              ) : (
                <form onSubmit={sendOtp} className="space-y-4 pt-4" noValidate>
                  <p className="text-sm text-muted-foreground">
                    Sign in without a password — we'll email you a one-time code.
                  </p>
                  <div>
                    <Label htmlFor="otp-email">Email</Label>
                    <Input id="otp-email" name="email" type="email" required className="mt-1.5" />
                  </div>
                  <Button type="submit" className="w-full" disabled={pending}>
                    Send code
                  </Button>
                </form>
              )}
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
                  <Input
                    id="reg-password"
                    name="password"
                    type="password"
                    required
                    className="mt-1.5"
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <PasswordMeter value={password} />
                </div>
                <Button type="submit" className="w-full" disabled={pending}>
                  Create account
                </Button>
                <p className="text-xs text-muted-foreground">
                  You'll receive a verification email — confirm it to activate your account.
                </p>
              </form>
            </TabsContent>
          </Tabs>

          <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="h-px flex-1 bg-border" /> or <span className="h-px flex-1 bg-border" />
          </div>
          <Button variant="outline" className="w-full" onClick={googleSignIn}>
            Continue with Google
          </Button>

          <p className="mt-5 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5" aria-hidden /> Protected by CAPTCHA, encryption and brute-force
            protection. <Link to="/privacy-policy" className="underline">Privacy</Link>
          </p>
        </div>
      </div>
    </>
  );
}
