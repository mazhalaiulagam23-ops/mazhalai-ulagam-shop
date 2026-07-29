import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { IndianRupee, Package, ShoppingBag, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/admin/")({
  component: AdminDashboard,
});

const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;

function AdminDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "dashboard"],
    queryFn: async () => {
      const [products, orders, customers] = await Promise.all([
        supabase.from("products").select("id", { count: "exact", head: true }),
        supabase.from("orders").select("id, total_amount, status, created_at, customer_name").order("created_at", { ascending: false }),
        supabase.from("profiles").select("id", { count: "exact", head: true }),
      ]);
      const rows = orders.data ?? [];
      return {
        productCount: products.count ?? 0,
        customerCount: customers.count ?? 0,
        orderCount: rows.length,
        revenue: rows.reduce((sum, o) => sum + Number(o.total_amount ?? 0), 0),
        recent: rows.slice(0, 8),
      };
    },
  });

  const stats = [
    { label: "Revenue", value: inr(data?.revenue ?? 0), icon: IndianRupee },
    { label: "Orders", value: data?.orderCount ?? 0, icon: ShoppingBag },
    { label: "Products", value: data?.productCount ?? 0, icon: Package },
    { label: "Customers", value: data?.customerCount ?? 0, icon: Users },
  ];

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold">Dashboard</h1>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map(({ label, value, icon: Icon }) => (
          <div key={label} className="surface-card p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
              <Icon className="h-4 w-4 text-primary" />
            </div>
            <p className="mt-2 font-display text-2xl font-bold">{isLoading ? "…" : value}</p>
          </div>
        ))}
      </div>

      <div className="surface-card p-4">
        <h2 className="font-display text-lg font-bold">Recent orders</h2>
        {data?.recent.length ? (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="py-2">Customer</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th className="text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {data.recent.map((o) => (
                  <tr key={o.id} className="border-t border-border/60">
                    <td className="py-2 font-medium">{o.customer_name ?? "—"}</td>
                    <td className="capitalize">{o.status}</td>
                    <td>{new Date(o.created_at).toLocaleDateString("en-IN")}</td>
                    <td className="text-right">{inr(Number(o.total_amount ?? 0))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="mt-2 text-sm text-muted-foreground">
            {isLoading ? "Loading…" : "No orders yet. They'll appear here as customers check out."}
          </p>
        )}
      </div>
    </div>
  );
}
