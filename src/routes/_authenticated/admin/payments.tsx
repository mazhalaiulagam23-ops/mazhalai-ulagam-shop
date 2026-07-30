import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/lib/auth";
import { PAYMENT_SETTINGS_KEY, type PaymentSettings } from "@/lib/payments";
import { getPaymentSettings, savePaymentSettings } from "@/lib/payments.functions";

export const Route = createFileRoute("/_authenticated/admin/payments")({
  component: AdminPayments,
});

type Form = Omit<PaymentSettings, "created_at" | "updated_at" | "id">;

const empty: Form = {
  mode: "test",
  razorpay_key_id_test: "",
  razorpay_key_id_live: "",
  razorpay_enabled: true,
  upi_enabled: true,
  card_enabled: true,
  netbanking_enabled: true,
  wallet_enabled: true,
  cod_enabled: true,
  cod_min_order: 0,
  cod_max_order: 20000,
  currency: "INR",
  checkout_name: "Mazhalai Ulagam",
  checkout_description: "Order payment",
  auto_capture: true,
  max_retries: 3,
};

function Toggle({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-border p-3">
      <div>
        <p className="text-sm font-semibold">{label}</p>
        {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

function AdminPayments() {
  const { isAdmin } = useAuth();
  const qc = useQueryClient();
  const [form, setForm] = useState<Form>(empty);
  const loadSettings = useServerFn(getPaymentSettings);
  const persistSettings = useServerFn(savePaymentSettings);

  const { data, isLoading } = useQuery({
    queryKey: [...PAYMENT_SETTINGS_KEY, "admin"],
    queryFn: () => loadSettings(),
  });

  useEffect(() => {
    if (!data) return;
    const { created_at, updated_at, id, ...rest } = data as PaymentSettings;
    setForm(rest as Form);
  }, [data]);

  const save = useMutation({
    mutationFn: async () => {
      await persistSettings({ data: { ...form, mode: form.mode === "live" ? "live" : "test" } });
    },
    onSuccess: () => {
      toast.success("Payment settings saved");
      void qc.invalidateQueries({ queryKey: PAYMENT_SETTINGS_KEY });
      void qc.invalidateQueries({ queryKey: [...PAYMENT_SETTINGS_KEY, "admin"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not save"),
  });

  const set = <K extends keyof Form>(key: K, value: Form[K]) => setForm((f) => ({ ...f, [key]: value }));

  if (!isAdmin) {
    return (
      <div className="surface-card p-6 text-sm text-muted-foreground">
        Only store owners and admins can change payment settings.
      </div>
    );
  }

  if (isLoading) {
    return <div className="p-6 text-sm text-muted-foreground">Loading payment settings…</div>;
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold">Payment settings</h1>
          <p className="text-sm text-muted-foreground">
            Razorpay, UPI, cards, net banking, wallets and cash on delivery.
          </p>
        </div>
        <Button onClick={() => save.mutate()} disabled={save.isPending} variant="hero">
          {save.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Save changes
        </Button>
      </header>

      <section className="surface-card space-y-4 p-6">
        <h2 className="font-display text-lg font-bold">Environment</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Mode</Label>
            <Select value={form.mode} onValueChange={(v) => set("mode", v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="test">Test mode (no real money)</SelectItem>
                <SelectItem value="live">Live mode (real payments)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Currency</Label>
            <Input value={form.currency} onChange={(e) => set("currency", e.target.value.toUpperCase())} />
          </div>
        </div>
        <div className="flex items-start gap-2 rounded-xl bg-secondary p-3 text-xs text-muted-foreground">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            Your Razorpay API keys are stored encrypted in the backend, never in the page. Switching to Live
            mode uses the live key pair. Webhook URL:{" "}
            <code className="font-mono">/api/public/razorpay-webhook</code>
          </p>
        </div>
      </section>

      <section className="surface-card space-y-3 p-6">
        <h2 className="font-display text-lg font-bold">Payment methods</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <Toggle
            label="Razorpay online payments"
            hint="Master switch for all online methods"
            checked={form.razorpay_enabled}
            onChange={(v) => set("razorpay_enabled", v)}
          />
          <Toggle label="UPI" checked={form.upi_enabled} onChange={(v) => set("upi_enabled", v)} />
          <Toggle
            label="Credit / Debit cards"
            checked={form.card_enabled}
            onChange={(v) => set("card_enabled", v)}
          />
          <Toggle
            label="Net banking"
            checked={form.netbanking_enabled}
            onChange={(v) => set("netbanking_enabled", v)}
          />
          <Toggle label="Wallets" checked={form.wallet_enabled} onChange={(v) => set("wallet_enabled", v)} />
          <Toggle
            label="Cash on delivery"
            checked={form.cod_enabled}
            onChange={(v) => set("cod_enabled", v)}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>COD minimum order (₹)</Label>
            <Input
              type="number"
              value={form.cod_min_order}
              onChange={(e) => set("cod_min_order", Number(e.target.value) || 0)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>COD maximum order (₹)</Label>
            <Input
              type="number"
              value={form.cod_max_order}
              onChange={(e) => set("cod_max_order", Number(e.target.value) || 0)}
            />
          </div>
        </div>
      </section>

      <section className="surface-card space-y-4 p-6">
        <h2 className="font-display text-lg font-bold">Checkout &amp; retries</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Business name on payment screen</Label>
            <Input value={form.checkout_name} onChange={(e) => set("checkout_name", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Payment description</Label>
            <Input
              value={form.checkout_description}
              onChange={(e) => set("checkout_description", e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Maximum retry attempts</Label>
            <Input
              type="number"
              min={0}
              max={10}
              value={form.max_retries}
              onChange={(e) => set("max_retries", Number(e.target.value) || 0)}
            />
          </div>
        </div>
        <Toggle
          label="Capture payments automatically"
          hint="Turn off to authorise now and capture manually later"
          checked={form.auto_capture}
          onChange={(v) => set("auto_capture", v)}
        />
      </section>
    </div>
  );
}
