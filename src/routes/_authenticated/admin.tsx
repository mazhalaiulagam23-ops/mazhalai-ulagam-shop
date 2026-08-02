import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import {
  Activity,
  Bot,
  BarChart3,
  Boxes,
  CreditCard,
  FileText,
  LayoutTemplate,
  LogOut,
  Menu,
  ScrollText,
  Settings,
  Share2,
  Shield,
  ShoppingCart,
  Store,
  UserCog,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { checkAdminAccess, verify2faCode } from "@/lib/security.functions";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

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

const links = [
  { to: "/admin", label: "Dashboard", icon: BarChart3 },
  { to: "/admin/products", label: "Products", icon: Boxes },
  { to: "/admin/orders", label: "Orders", icon: ShoppingCart },
  { to: "/admin/payments", label: "Payments", icon: CreditCard },

  { to: "/admin/homepage", label: "Homepage", icon: LayoutTemplate },
  { to: "/admin/navigation", label: "Navigation", icon: Menu },
  { to: "/admin/social", label: "Social & QR", icon: Share2 },
  { to: "/admin/ai-chat", label: "AI Chat", icon: Bot },
  { to: "/admin/content", label: "Content", icon: FileText },
  { to: "/admin/settings", label: "Site settings", icon: Settings },

  { to: "/admin/team", label: "Team & roles", icon: UserCog },
  { to: "/admin/security", label: "Security", icon: Shield },
  { to: "/admin/logs", label: "Audit logs", icon: ScrollText },
  { to: "/admin/health", label: "Health", icon: Activity },
] as const;



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


  return (
    <div className="container-page grid gap-6 py-8 lg:grid-cols-[220px_1fr]">
      <aside className="surface-card h-fit p-3">
        <p className="px-3 pb-2 pt-1 font-display text-sm font-bold uppercase tracking-wide text-muted-foreground">
          Store Admin
        </p>
        <nav className="space-y-1">
          {links.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className={cn(
                "flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition-colors",
                pathname === to ? "bg-primary text-primary-foreground" : "hover:bg-secondary",
              )}
            >
              <Icon className="h-4 w-4" /> {label}
            </Link>
          ))}
          <Link to="/" className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold hover:bg-secondary">
            <Store className="h-4 w-4" /> View storefront
          </Link>
          <button
            onClick={() => void signOut()}
            className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-destructive hover:bg-secondary"
          >
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </nav>
      </aside>
      <section className="min-w-0">
        <Outlet />
      </section>
    </div>
  );
}
