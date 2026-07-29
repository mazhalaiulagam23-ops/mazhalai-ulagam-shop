import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Download, Search, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import type { Enums } from "@/integrations/supabase/types";

export const Route = createFileRoute("/_authenticated/admin/orders")({
  component: AdminOrders,
});

type OrderStatus = Enums<"order_status">;
const STATUSES: OrderStatus[] = ["pending", "confirmed", "packed", "shipped", "delivered", "cancelled"];

const inr = (n: number) => `₹${Number(n).toLocaleString("en-IN")}`;

function AdminOrders() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"all" | OrderStatus>("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["admin", "orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*, order_items(id, product_name, qty, unit_price)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status: next }: { id: string; status: OrderStatus }) => {
      const { error } = await supabase.from("orders").update({ status: next }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Order status updated");
      void qc.invalidateQueries({ queryKey: ["admin", "orders"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const fromTime = from ? new Date(`${from}T00:00:00`).getTime() : null;
    const toTime = to ? new Date(`${to}T23:59:59`).getTime() : null;

    return orders.filter((o) => {
      if (status !== "all" && o.status !== status) return false;

      const created = new Date(o.created_at).getTime();
      if (fromTime !== null && created < fromTime) return false;
      if (toTime !== null && created > toTime) return false;

      if (!q) return true;
      const haystack = [
        o.order_number,
        o.customer_name,
        o.customer_email,
        o.customer_phone,
        o.city,
        o.pincode,
        ...o.order_items.map((i) => i.product_name),
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [orders, search, status, from, to]);

  const revenue = filtered.reduce((sum, o) => sum + Number(o.total ?? 0), 0);
  const hasFilters = Boolean(search || from || to) || status !== "all";

  const clearFilters = () => {
    setSearch("");
    setStatus("all");
    setFrom("");
    setTo("");
  };

  const exportCsv = () => {
    if (filtered.length === 0) return toast.error("No orders to export");

    const esc = (value: unknown) => `"${String(value ?? "").replace(/"/g, '""')}"`;
    const headers = [
      "Order Number",
      "Date",
      "Status",
      "Customer",
      "Email",
      "Phone",
      "Address",
      "City",
      "Pincode",
      "Payment",
      "Items",
      "Subtotal",
      "Shipping",
      "Total",
    ];
    const rows = filtered.map((o) =>
      [
        o.order_number,
        new Date(o.created_at).toLocaleString("en-IN"),
        o.status,
        o.customer_name,
        o.customer_email,
        o.customer_phone,
        o.address,
        o.city,
        o.pincode,
        o.payment_method,
        o.order_items.map((i) => `${i.product_name} x${i.qty}`).join("; "),
        o.subtotal,
        o.shipping,
        o.total,
      ]
        .map(esc)
        .join(","),
    );

    const csv = [headers.map(esc).join(","), ...rows].join("\r\n");
    const url = URL.createObjectURL(new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `mazhalai-orders-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${filtered.length} order${filtered.length === 1 ? "" : "s"}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-bold">Orders</h1>
        <Button onClick={exportCsv} variant="outline">
          <Download className="mr-1 h-4 w-4" /> Export CSV
        </Button>
      </div>

      <div className="surface-card space-y-3 p-4">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value.slice(0, 80))}
              placeholder="Search order no, name, phone, product…"
              className="pl-9"
              aria-label="Search orders"
            />
          </div>

          <Select value={status} onValueChange={(v) => setStatus(v as "all" | OrderStatus)}>
            <SelectTrigger aria-label="Filter by status">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {STATUSES.map((s) => (
                <SelectItem key={s} value={s} className="capitalize">
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex items-center gap-2">
            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} aria-label="From date" />
            <span className="text-xs text-muted-foreground">to</span>
            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} aria-label="To date" />
          </div>

          <div className="flex items-center justify-between gap-2 text-sm">
            <span className="text-muted-foreground">
              <strong className="text-foreground">{filtered.length}</strong> order
              {filtered.length === 1 ? "" : "s"} · {inr(revenue)}
            </span>
            {hasFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X className="mr-1 h-3.5 w-3.5" /> Clear
              </Button>
            )}
          </div>
        </div>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading orders…</p>
      ) : orders.length === 0 ? (
        <div className="surface-card p-6 text-sm text-muted-foreground">
          No orders yet. Customer orders will appear here as soon as checkout is completed.
        </div>
      ) : filtered.length === 0 ? (
        <div className="surface-card p-6 text-sm text-muted-foreground">
          No orders match these filters.{" "}
          <button onClick={clearFilters} className="font-semibold text-primary">
            Clear filters
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((order) => (
            <div key={order.id} className="surface-card p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-display text-base font-bold">#{order.order_number}</p>
                  <p className="text-sm text-muted-foreground">
                    {order.customer_name} · {order.customer_phone} · {order.customer_email}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {order.address}, {order.city} – {order.pincode}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {new Date(order.created_at).toLocaleString("en-IN")} · {order.payment_method}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-display text-lg font-bold">{inr(order.total)}</p>
                  <div className="mt-2 w-40">
                    <Select
                      value={order.status}
                      onValueChange={(v) => updateStatus.mutate({ id: order.id, status: v as OrderStatus })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUSES.map((s) => (
                          <SelectItem key={s} value={s} className="capitalize">
                            {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {order.order_items.length > 0 && (
                <ul className="mt-3 space-y-1 border-t border-border/60 pt-3 text-sm">
                  {order.order_items.map((item) => (
                    <li key={item.id} className="flex justify-between">
                      <span>
                        {item.product_name} × {item.qty}
                      </span>
                      <span>{inr(item.unit_price * item.qty)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
