import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Activity, AlertTriangle, DatabaseBackup, PackageSearch, ShieldAlert } from "lucide-react";
import { getHealthSnapshot } from "@/lib/security.functions";

export const Route = createFileRoute("/_authenticated/admin/health")({
  head: () => ({
    meta: [
      { title: "Website Health | Mazhalai Ulagam Admin" },
      { name: "description", content: "Live health, error, stock and backup status for the Mazhalai Ulagam store." },
      { property: "og:title", content: "Website Health | Mazhalai Ulagam Admin" },
      { property: "og:description", content: "Monitoring dashboard for store operations." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HealthPage,
});

type Snapshot = Awaited<ReturnType<typeof getHealthSnapshot>>;

function Stat({ label, value, icon: Icon, tone }: { label: string; value: string | number; icon: typeof Activity; tone?: string }) {
  return (
    <div className="surface-card p-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
        <Icon className={`h-4 w-4 ${tone ?? "text-primary"}`} aria-hidden />
      </div>
      <p className="mt-2 font-display text-2xl font-bold">{value}</p>
    </div>
  );
}

function HealthPage() {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void getHealthSnapshot()
      .then(setSnapshot)
      .catch((e: Error) => setError(e.message));
  }, []);

  if (error) return <div className="surface-card p-6 text-sm text-destructive">{error}</div>;
  if (!snapshot) return <div className="surface-card p-6 text-sm text-muted-foreground">Checking store health…</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Website health</h1>
        <p className="text-sm text-muted-foreground">
          Last checked {new Date(snapshot.checkedAt).toLocaleString()}.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Orders (24h)" value={snapshot.ordersLast24h} icon={Activity} />
        <Stat label="Successful sign-ins (24h)" value={snapshot.successfulLoginsLast24h} icon={Activity} />
        <Stat
          label="Failed sign-ins (24h)"
          value={snapshot.failedLoginsLast24h}
          icon={ShieldAlert}
          tone={snapshot.failedLoginsLast24h > 10 ? "text-destructive" : undefined}
        />
        <Stat
          label="Errors (24h)"
          value={snapshot.errorsLast24h}
          icon={AlertTriangle}
          tone={snapshot.errorsLast24h > 0 ? "text-destructive" : undefined}
        />
      </div>

      <section className="surface-card p-5">
        <h2 className="flex items-center gap-2 font-display text-sm font-bold uppercase tracking-wide">
          <PackageSearch className="h-4 w-4" /> Low stock ({snapshot.lowStockCount})
        </h2>
        {snapshot.lowStock.length ? (
          <table className="mt-3 w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="py-2">Product</th>
                <th>In stock</th>
                <th>Alert level</th>
              </tr>
            </thead>
            <tbody>
              {snapshot.lowStock.map((p) => (
                <tr key={p.id} className="border-b last:border-0">
                  <td className="py-2">{p.name}</td>
                  <td className={p.stock === 0 ? "font-semibold text-destructive" : "font-semibold"}>{p.stock}</td>
                  <td className="text-muted-foreground">{p.low_stock_alert}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="mt-2 text-sm text-muted-foreground">Every product is above its low-stock threshold.</p>
        )}
      </section>

      <section className="surface-card p-5">
        <h2 className="flex items-center gap-2 font-display text-sm font-bold uppercase tracking-wide">
          <DatabaseBackup className="h-4 w-4" /> Backups
        </h2>
        <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
          <li>
            <span className="font-semibold text-foreground">Automatic daily backups:</span> active — your database is
            backed up every day by the hosting platform and stored securely off-site.
          </li>
          <li>
            <span className="font-semibold text-foreground">Encryption in transit:</span> all traffic is served over
            HTTPS/TLS, including the admin panel and payment callbacks.
          </li>
          <li>
            <span className="font-semibold text-foreground">Restores:</span> handled by the platform team from the
            latest daily snapshot — no data export is required from you.
          </li>
          <li>
            <span className="font-semibold text-foreground">Your own copies:</span> use the CSV exports on the Orders
            and Audit pages any time you need an offline record.
          </li>
        </ul>
      </section>
    </div>
  );
}
