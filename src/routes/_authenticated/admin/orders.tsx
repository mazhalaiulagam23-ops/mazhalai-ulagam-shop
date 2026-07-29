import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
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

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["admin", "orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*, order_items(id, product_name, quantity, price)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: OrderStatus }) => {
      const { error } = await supabase.from("orders").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Order status updated");
      void qc.invalidateQueries({ queryKey: ["admin", "orders"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold">Orders</h1>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading orders…</p>
      ) : orders.length === 0 ? (
        <div className="surface-card p-6 text-sm text-muted-foreground">
          No orders yet. Customer orders will appear here as soon as checkout is completed.
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
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
                        {item.product_name} × {item.quantity}
                      </span>
                      <span>{inr(item.price * item.quantity)}</span>
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
