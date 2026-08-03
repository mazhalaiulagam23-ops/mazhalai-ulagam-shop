import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { AdminSidebar, ADMIN_NAV } from "@/components/admin/AdminSidebar";
import { AdminCommandPalette } from "@/components/admin/AdminCommandPalette";
import { checkAdminAccess, verify2faCode } from "@/lib/security.functions";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Store Admin | Mazhalai Ulagam" },
      { name: "description", content: "Manage products, stock and customer orders for Mazhalai Ulagam." },
      { property: "og:title", content: "Store Admin | Mazhalai Ulagam" },
      { property: "og:description", content: "Internal dashboard for the Mazhalai Ulagam store team." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AdminLayout,
});

const TWOFA_SESSION_KEY = "mu-admin-2fa-ok";


function AdminLayout() {
  const { isStaff, loading, signOut, user } = useAuth();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [gate, setGate] = useState<Awaited<ReturnType<typeof checkAdminAccess>> | null>(null);
  const [gateError, setGateError] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [verified, setVerified] = useState(
    typeof window !== "undefined" && window.sessionStorage.getItem(TWOFA_SESSION_KEY) === "1",
  );

  useEffect(() => {
    if (!isStaff) return;
    void checkAdminAccess()
      .then(setGate)
      .catch((e: Error) => setGateError(e.message));
  }, [isStaff]);

  if (loading) {
    return <div className="container-page py-20 text-center text-sm text-muted-foreground">Loading admin…</div>;
  }

  if (!isStaff) {
    return (
      <div className="container-page py-20">
        <div className="surface-card mx-auto max-w-md p-8 text-center">
          <h1 className="font-display text-xl font-bold">Admin access required</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Your account ({user?.email}) doesn't have store admin permissions yet. Ask an existing admin to grant
            you the admin or staff role.
          </p>
          <Button className="mt-4" asChild>
            <Link to="/">Back to store</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (gateError || (gate && !gate.allowed)) {
    return (
      <div className="container-page py-20">
        <div className="surface-card mx-auto max-w-md p-8 text-center">
          <h1 className="font-display text-xl font-bold">Admin access blocked</h1>
          <p className="mt-2 text-sm text-muted-foreground">{gate?.reason ?? gateError}</p>
          <Button className="mt-4" variant="outline" onClick={() => void signOut()}>
            Sign out
          </Button>
        </div>
      </div>
    );
  }

  const mustChallenge = Boolean(gate?.needs2fa) && !verified && pathname !== "/admin/security";

  if (mustChallenge) {
    return (
      <div className="container-page py-20">
        <div className="surface-card mx-auto max-w-md p-8">
          <h1 className="font-display text-xl font-bold">Two-factor verification</h1>
          {gate?.has2fa ? (
            <>
              <p className="mt-2 text-sm text-muted-foreground">
                Enter the 6-digit code from your authenticator app to open the admin panel.
              </p>
              <Input
                className="mt-4"
                inputMode="numeric"
                placeholder="123456"
                value={code}
                onChange={(e) => setCode(e.target.value)}
              />
              <Button
                className="mt-3 w-full"
                onClick={() =>
                  void verify2faCode({ data: { code } })
                    .then(() => {
                      window.sessionStorage.setItem(TWOFA_SESSION_KEY, "1");
                      setVerified(true);
                    })
                    .catch((e: Error) => toast.error(e.message))
                }
              >
                Verify
              </Button>
            </>
          ) : (
            <>
              <p className="mt-2 text-sm text-muted-foreground">
                Two-factor authentication is required for admins. Set up your authenticator app to continue.
              </p>
              <Button className="mt-4 w-full" asChild>
                <Link to="/admin/security">Set up two-factor authentication</Link>
              </Button>
            </>
          )}
          <Button className="mt-2 w-full" variant="ghost" onClick={() => void signOut()}>
            Sign out
          </Button>
        </div>
      </div>
    );
  }
  const current = ADMIN_NAV.flatMap((g) => g.items.map((i) => ({ ...i, group: g.label }))).find(
    (i) => i.to === pathname,
  );

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-muted/30">
        <AdminSidebar onSignOut={() => void signOut()} />
        <SidebarInset className="min-w-0">
          <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-border/70 bg-background/85 px-4 backdrop-blur">
            <SidebarTrigger />
            <Separator orientation="vertical" className="h-5" />
            <nav className="hidden items-center gap-1.5 text-sm text-muted-foreground sm:flex">
              <Link to="/admin" className="hover:text-foreground">
                Admin
              </Link>
              {current && current.to !== "/admin" ? (
                <>
                  <span>/</span>
                  <span className="text-muted-foreground/80">{current.group}</span>
                  <span>/</span>
                  <span className="font-semibold text-foreground">{current.label}</span>
                </>
              ) : null}
            </nav>
            <div className="ml-auto flex items-center gap-2">
              <AdminCommandPalette />
            </div>
          </header>
          <main className="min-w-0 flex-1 p-4 md:p-6">
            <Outlet />
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );

}
