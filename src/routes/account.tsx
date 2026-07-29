import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { LayoutDashboard, LogOut } from "lucide-react";
import { PageHeader } from "@/components/site/PageHeader";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/account")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "My Account | Mazhalai Ulagam" },
      { name: "description", content: "Track your Mazhalai Ulagam orders, manage your details and save favourites." },
      { property: "og:title", content: "My Account | Mazhalai Ulagam" },
      { property: "og:description", content: "Manage your orders and account details." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Account,
});

const inr = (n: number) => `₹${Number(n).toLocaleString("en-IN")}`;

function Account() {
  const navigate = useNavigate();
  const { user, loading, isStaff, signOut } = useAuth();

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth", replace: true });
  }, [loading, user, navigate]);

  const { data: orders = [] } = useQuery({
    queryKey: ["my-orders", user?.id],
    enabled: Boolean(user),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("id, order_number, status, total, created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  if (loading || !user) {
    return <div className="container-page py-20 text-center text-sm text-muted-foreground">Loading…</div>;
  }

  return (
    <>
      <PageHeader title="My Account" crumbs={[{ label: "My Account" }]} />
      <div className="container-page space-y-6 py-10">
        <div className="surface-card flex flex-wrap items-center justify-between gap-3 p-6">
          <div>
            <p className="font-display text-lg font-bold">Hello{user.user_metadata?.full_name ? `, ${user.user_metadata.full_name}` : ""}!</p>
            <p className="text-sm text-muted-foreground">{user.email}</p>
          </div>
          <div className="flex gap-2">
            {isStaff && (
              <Button asChild variant="outline">
                <Link to="/admin">
                  <LayoutDashboard className="mr-1 h-4 w-4" /> Store admin
                </Link>
              </Button>
            )}
            <Button
              variant="ghost"
              onClick={async () => {
                await signOut();
                navigate({ to: "/", replace: true });
              }}
            >
              <LogOut className="mr-1 h-4 w-4" /> Sign out
            </Button>
          </div>
        </div>

        <div className="surface-card p-6">
          <h2 className="font-display text-lg font-bold">My orders</h2>
          {orders.length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">
              No orders yet.{" "}
              <Link to="/shop" className="font-semibold text-primary">
                Start shopping
              </Link>
              .
            </p>
          ) : (
            <ul className="mt-3 divide-y divide-border/60 text-sm">
              {orders.map((o) => (
                <li key={o.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                  <div>
                    <p className="font-semibold">#{o.order_number}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(o.created_at).toLocaleDateString("en-IN")} · <span className="capitalize">{o.status}</span>
                    </p>
                  </div>
                  <span className="font-display font-bold">{inr(o.total)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </>
  );
}
