import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { listEnquiries, updateEnquiryStatus, type EnquiryRow } from "@/lib/enquiries.functions";

export const Route = createFileRoute("/_authenticated/admin/enquiries")({
  head: () => ({
    meta: [
      { title: "Enquiries & Complaints | MazhalaiHub Admin" },
      { name: "description", content: "Review customer product enquiries and complaints and update their status." },
      { property: "og:title", content: "Enquiries & Complaints | MazhalaiHub Admin" },
      { property: "og:description", content: "Customer enquiry and complaint desk for the MazhalaiHub store team." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: EnquiriesPage,
});

const STATUS_LABEL: Record<EnquiryRow["status"], string> = {
  new: "New",
  in_progress: "In Progress",
  resolved: "Resolved",
};

function EnquiriesPage() {
  const [rows, setRows] = useState<EnquiryRow[]>([]);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | EnquiryRow["status"]>("all");
  const [typeFilter, setTypeFilter] = useState<"all" | EnquiryRow["type"]>("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void listEnquiries()
      .then(setRows)
      .catch((e: Error) => toast.error(e.message))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter(
      (r) =>
        (statusFilter === "all" || r.status === statusFilter) &&
        (typeFilter === "all" || r.type === typeFilter) &&
        (!q ||
          `${r.reference} ${r.customer_name} ${r.email} ${r.mobile} ${r.product} ${r.order_number} ${r.message}`
            .toLowerCase()
            .includes(q)),
    );
  }, [rows, query, statusFilter, typeFilter]);

  const setStatus = (row: EnquiryRow, status: EnquiryRow["status"]) => {
    const prev = row.status;
    setRows((rs) => rs.map((r) => (r.id === row.id ? { ...r, status } : r)));
    void updateEnquiryStatus({ data: { id: row.id, status } })
      .then(() => toast.success(`#${row.reference} marked ${STATUS_LABEL[status]}`))
      .catch((e: Error) => {
        toast.error(e.message);
        setRows((rs) => rs.map((r) => (r.id === row.id ? { ...r, status: prev } : r)));
      });
  };

  const counts = {
    all: rows.length,
    new: rows.filter((r) => r.status === "new").length,
    in_progress: rows.filter((r) => r.status === "in_progress").length,
    resolved: rows.filter((r) => r.status === "resolved").length,
  };

  return (
    <div className="min-w-0 space-y-5">
      <div>
        <h1 className="font-display text-xl font-bold sm:text-2xl">Enquiries & Complaints</h1>
        <p className="text-sm text-muted-foreground">Customer product enquiries and complaints with reference numbers.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {(["all", "new", "in_progress", "resolved"] as const).map((k) => (
          <div key={k} className="rounded-2xl border border-border bg-card p-3">
            <p className="text-xs text-muted-foreground">{k === "all" ? "Total" : STATUS_LABEL[k]}</p>
            <p className="font-display text-xl font-bold">{counts[k]}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search reference, customer, product…"
          className="h-11 sm:max-w-sm"
        />
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}>
          <SelectTrigger className="h-11 sm:w-44">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="new">New</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as typeof typeFilter)}>
          <SelectTrigger className="h-11 sm:w-44">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            <SelectItem value="enquiry">Enquiry</SelectItem>
            <SelectItem value="complaint">Complaint</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading enquiries…</p>
      ) : filtered.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          No enquiries or complaints yet.
        </p>
      ) : (
        <div className="space-y-3">
          {filtered.map((r) => (
            <article key={r.id} className="min-w-0 rounded-2xl border border-border bg-card p-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-display font-bold">#{r.reference}</span>
                <Badge variant={r.type === "complaint" ? "destructive" : "secondary"}>
                  {r.type === "complaint" ? "Complaint" : "Enquiry"}
                </Badge>
                <Badge variant="outline">{STATUS_LABEL[r.status]}</Badge>
                <span className="ml-auto text-xs text-muted-foreground">
                  {new Date(r.created_at).toLocaleString("en-IN")}
                </span>
              </div>

              <div className="mt-3 grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
                <p className="break-words">
                  <span className="text-muted-foreground">Customer: </span>
                  {r.customer_name}
                </p>
                <p className="break-words">
                  <span className="text-muted-foreground">Product: </span>
                  {r.product}
                </p>
                <p className="break-words">
                  <span className="text-muted-foreground">Mobile: </span>
                  <a href={`tel:${r.mobile}`} className="hover:text-primary">
                    {r.mobile}
                  </a>
                </p>
                <p className="break-words">
                  <span className="text-muted-foreground">Order: </span>
                  {r.order_number || "—"}
                </p>
                <p className="break-all sm:col-span-2">
                  <span className="text-muted-foreground">Email: </span>
                  <a href={`mailto:${r.email}`} className="hover:text-primary">
                    {r.email}
                  </a>
                </p>
              </div>

              <p className="mt-3 whitespace-pre-wrap break-words rounded-xl bg-muted/40 p-3 text-sm">{r.message}</p>

              <div className="mt-3 flex flex-wrap gap-2">
                {(["new", "in_progress", "resolved"] as const).map((s) => (
                  <Button
                    key={s}
                    size="sm"
                    variant={r.status === s ? "default" : "outline"}
                    onClick={() => setStatus(r, s)}
                  >
                    {STATUS_LABEL[s]}
                  </Button>
                ))}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
