import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { BarChart3, Boxes, FileText, LayoutTemplate, LogOut, Settings, ShoppingCart, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
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
  { to: "/admin/homepage", label: "Homepage", icon: LayoutTemplate },
  { to: "/admin/content", label: "Content", icon: FileText },
  { to: "/admin/settings", label: "Site settings", icon: Settings },
] as const;


function AdminLayout() {
  const { isStaff, loading, signOut, user } = useAuth();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

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
