import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  Bot,
  IndianRupee,
  MessageSquare,
  Package,
  PackageX,
  RefreshCw,
  ShoppingBag,
  TrendingUp,
  Truck,
  Users,
  XCircle,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip as RTooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/admin/")({
  component: AdminDashboard,
});

const inr = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;

function startOf(daysAgo: number) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - daysAgo);
  return d;
}

type OrderRow = {
  id: string;
  order_number: string;
  total: number;
  status: string;
  payment_status: string;
  created_at: string;
  customer_name: string | null;
  user_id: string | null;
};

function useDashboard() {
  return useQuery({
    queryKey: ["admin", "dashboard", "v2"],
    refetchInterval: 60_000,
    queryFn: async () => {
      const since = startOf(29).toISOString();
      const [orders, items, products, customers, chats, logins] = await Promise.all([
        supabase
          .from("orders")
          .select("id, order_number, total, status, payment_status, created_at, customer_name, user_id")
          .order("created_at", { ascending: false }),
        supabase.from("order_items").select("product_name, product_slug, qty, unit_price"),
        supabase.from("products").select("id, name, slug, stock, low_stock_alert, status"),
        supabase.from("profiles").select("id, created_at"),
        supabase.from("support_messages").select("id, user_id, role, needs_human, feedback, created_at").gte("created_at", since),
        supabase.from("login_history").select("id, user_id, email, success, created_at").gte("created_at", since),
      ]);

      const rows = (orders.data ?? []) as OrderRow[];
      const paid = (o: OrderRow) => o.payment_status === "paid" || o.status !== "cancelled";
      const sumSince = (days: number) => {
        const from = startOf(days).getTime();
        return rows
          .filter((o) => new Date(o.created_at).getTime() >= from && paid(o))
          .reduce((s, o) => s + Number(o.total ?? 0), 0);
      };

      const byStatus = (s: string) => rows.filter((o) => o.status === s).length;

      // 14-day revenue trend
      const trend: { day: string; revenue: number; orders: number }[] = [];
      for (let i = 13; i >= 0; i--) {
        const from = startOf(i).getTime();
        const to = startOf(i - 1).getTime();
        const dayRows = rows.filter((o) => {
          const t = new Date(o.created_at).getTime();
          return t >= from && t < to;
        });
        trend.push({
          day: new Date(from).toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
          revenue: dayRows.filter(paid).reduce((s, o) => s + Number(o.total ?? 0), 0),
          orders: dayRows.length,
        });
      }

      const topMap = new Map<string, { name: string; qty: number; revenue: number }>();
      for (const it of items.data ?? []) {
        const key = it.product_slug ?? it.product_name;
        const prev = topMap.get(key) ?? { name: it.product_name, qty: 0, revenue: 0 };
        prev.qty += Number(it.qty ?? 0);
        prev.revenue += Number(it.qty ?? 0) * Number(it.unit_price ?? 0);
        topMap.set(key, prev);
      }
      const top = [...topMap.values()].sort((a, b) => b.qty - a.qty).slice(0, 6);

      const prods = products.data ?? [];
      const lowStock = prods.filter(
        (p) => Number(p.stock ?? 0) > 0 && Number(p.stock ?? 0) <= Number(p.low_stock_alert ?? 5),
      );
      const outOfStock = prods.filter((p) => Number(p.stock ?? 0) <= 0);

      const chatRows = chats.data ?? [];
      const loginRows = (logins.data ?? []).filter((l) => l.success);
      const liveWindow = Date.now() - 15 * 60_000;
      const liveVisitors = new Set(
        loginRows.filter((l) => new Date(l.created_at).getTime() >= liveWindow).map((l) => l.user_id ?? l.email),
      ).size;
      const visitors30d = new Set(loginRows.map((l) => l.user_id ?? l.email)).size;

      const customerCount = (customers.data ?? []).length;
      const buyers = new Set(rows.map((o) => o.user_id ?? o.order_number)).size;

      return {
        revenue: rows.filter(paid).reduce((s, o) => s + Number(o.total ?? 0), 0),
        today: sumSince(0),
        week: sumSince(6),
        month: sumSince(29),
        year: sumSince(364),
        orderCount: rows.length,
        pending: byStatus("pending"),
        processing: byStatus("confirmed") + byStatus("packed") + byStatus("shipped"),
        delivered: byStatus("delivered"),
        cancelled: byStatus("cancelled"),
        refunded: rows.filter((o) => o.payment_status === "refunded").length,
        customerCount,
        visitors30d,
        liveVisitors,
        conversion: visitors30d ? (buyers / visitors30d) * 100 : 0,
        chatMessages: chatRows.filter((c) => c.role === "user").length,
        chatUsers: new Set(chatRows.map((c) => c.user_id)).size,
        chatHandoffs: chatRows.filter((c) => c.needs_human).length,
        chatPositive: chatRows.filter((c) => c.feedback === 1).length,
        productCount: prods.length,
        lowStock,
        outOfStock,
        top,
        trend,
        recent: rows.slice(0, 8),
      };
    },
  });
}

function Stat({
  label,
  value,
  icon: Icon,
  hint,
  tone = "default",
}: {
  label: string;
  value: string | number;
  icon: typeof IndianRupee;
  hint?: string;
  tone?: "default" | "warn" | "danger" | "good";
}) {
  const tones: Record<string, string> = {
    default: "text-primary bg-primary/10",
    warn: "text-amber-600 bg-amber-500/10",
    danger: "text-destructive bg-destructive/10",
    good: "text-emerald-600 bg-emerald-500/10",
  };
  return (
    <div className="surface-card p-4">
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
        <span className={`flex h-8 w-8 items-center justify-center rounded-xl ${tones[tone]}`}>
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <p className="mt-2 font-display text-2xl font-bold">{value}</p>
      {hint ? <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

function AdminDashboard() {
  const { data, isLoading, isFetching, refetch } = useDashboard();

  if (isLoading || !data) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-2xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold">Command center</h1>
          <p className="text-sm text-muted-foreground">
            Live view of sales, fulfilment, catalog health and AI support.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="gap-1">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
            {data.liveVisitors} active now
          </Badge>
          <Button variant="outline" size="sm" onClick={() => void refetch()} disabled={isFetching}>
            <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${isFetching ? "animate-spin" : ""}`} /> Refresh
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Total revenue" value={inr(data.revenue)} icon={IndianRupee} hint="All non-cancelled orders" />
        <Stat label="Today" value={inr(data.today)} icon={TrendingUp} tone="good" />
        <Stat label="This week" value={inr(data.week)} icon={TrendingUp} hint="Last 7 days" />
        <Stat label="This month" value={inr(data.month)} icon={TrendingUp} hint="Last 30 days" />
        <Stat label="This year" value={inr(data.year)} icon={IndianRupee} hint="Last 365 days" />
        <Stat label="Orders" value={data.orderCount} icon={ShoppingBag} />
        <Stat label="Customers" value={data.customerCount} icon={Users} />
        <Stat
          label="Conversion"
          value={`${data.conversion.toFixed(1)}%`}
          icon={TrendingUp}
          hint="Buyers ÷ signed-in visitors (30d)"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <div className="surface-card p-4">
          <h2 className="font-display text-lg font-bold">Revenue · last 14 days</h2>
          <div className="mt-3 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.trend} margin={{ left: -18, right: 6, top: 6 }}>
                <defs>
                  <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={62} />
                <RTooltip
                  formatter={(v: number, k) => (k === "revenue" ? inr(Number(v)) : v)}
                  contentStyle={{
                    borderRadius: 12,
                    border: "1px solid var(--color-border)",
                    background: "var(--color-card)",
                    fontSize: 12,
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="var(--color-primary)"
                  strokeWidth={2}
                  fill="url(#rev)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="surface-card p-4">
          <h2 className="font-display text-lg font-bold">Order pipeline</h2>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <Stat label="Pending" value={data.pending} icon={ShoppingBag} tone="warn" />
            <Stat label="Processing" value={data.processing} icon={Truck} />
            <Stat label="Delivered" value={data.delivered} icon={Package} tone="good" />
            <Stat label="Cancelled" value={data.cancelled} icon={XCircle} tone="danger" />
          </div>
          <p className="mt-3 text-xs text-muted-foreground">{data.refunded} refunded payments recorded.</p>
          <Button asChild variant="outline" size="sm" className="mt-3 w-full">
            <Link to="/admin/orders">Open orders</Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="surface-card p-4">
          <h2 className="font-display text-lg font-bold">Top selling products</h2>
          {data.top.length ? (
            <ul className="mt-3 space-y-2 text-sm">
              {data.top.map((p) => (
                <li key={p.name} className="flex items-center justify-between gap-3">
                  <span className="truncate font-medium">{p.name}</span>
                  <span className="shrink-0 text-muted-foreground">
                    {p.qty} sold · {inr(p.revenue)}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-muted-foreground">No sales recorded yet.</p>
          )}
        </div>

        <div className="surface-card p-4">
          <h2 className="font-display text-lg font-bold">Stock alerts</h2>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <Stat label="Low stock" value={data.lowStock.length} icon={AlertTriangle} tone="warn" />
            <Stat label="Out of stock" value={data.outOfStock.length} icon={PackageX} tone="danger" />
          </div>
          <ul className="mt-3 space-y-1.5 text-sm">
            {[...data.outOfStock, ...data.lowStock].slice(0, 5).map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-3">
                <span className="truncate">{p.name}</span>
                <Badge variant={Number(p.stock) <= 0 ? "destructive" : "secondary"}>{p.stock} left</Badge>
              </li>
            ))}
            {!data.lowStock.length && !data.outOfStock.length ? (
              <li className="text-sm text-muted-foreground">All {data.productCount} products are well stocked.</li>
            ) : null}
          </ul>
        </div>

        <div className="surface-card p-4">
          <h2 className="font-display text-lg font-bold">AI chat · 30 days</h2>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <Stat label="Questions" value={data.chatMessages} icon={MessageSquare} />
            <Stat label="People" value={data.chatUsers} icon={Users} />
            <Stat label="Handoffs" value={data.chatHandoffs} icon={Bot} tone="warn" />
            <Stat label="Liked replies" value={data.chatPositive} icon={Bot} tone="good" />
          </div>
          <Button asChild variant="outline" size="sm" className="mt-3 w-full">
            <Link to="/admin/ai-chat">Open AI chat settings</Link>
          </Button>
        </div>
      </div>

      <div className="surface-card p-4">
        <h2 className="font-display text-lg font-bold">Recent orders</h2>
        {data.recent.length ? (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="py-2">Order</th>
                  <th>Customer</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th className="text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {data.recent.map((o) => (
                  <tr key={o.id} className="border-t border-border/60">
                    <td className="py-2 font-mono text-xs">{o.order_number}</td>
                    <td className="font-medium">{o.customer_name ?? "—"}</td>
                    <td className="capitalize">{o.status}</td>
                    <td>{new Date(o.created_at).toLocaleDateString("en-IN")}</td>
                    <td className="text-right">{inr(Number(o.total ?? 0))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="mt-2 text-sm text-muted-foreground">No orders yet — they'll appear here as customers check out.</p>
        )}
      </div>
    </div>
  );
}
