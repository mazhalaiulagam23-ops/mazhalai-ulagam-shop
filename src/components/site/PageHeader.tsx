import { Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";

export type Crumb = { label: string; to?: string; params?: Record<string, string> };

export function PageHeader({ title, subtitle, crumbs = [] }: { title: string; subtitle?: string; crumbs?: Crumb[] }) {
  return (
    <div className="gradient-hero border-b border-border">
      <div className="container-page py-7 sm:py-10">
        <nav aria-label="Breadcrumb" className="mb-3 flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
          <Link to="/" className="hover:text-primary">
            Home
          </Link>
          {crumbs.map((c) => (
            <span key={c.label} className="flex items-center gap-1">
              <ChevronRight className="h-3 w-3" aria-hidden="true" />
              {c.to ? (
                <Link to={c.to} params={c.params as never} className="hover:text-primary">
                  {c.label}
                </Link>
              ) : (
                <span className="text-foreground">{c.label}</span>
              )}
            </span>
          ))}
        </nav>
        <h1 className="break-words font-display text-2xl font-bold text-foreground sm:text-4xl">{title}</h1>
        {subtitle && <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{subtitle}</p>}
      </div>
    </div>
  );
}

export function Prose({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="container-page py-8 sm:py-12">
      <div className="surface-card mx-auto max-w-3xl space-y-4 p-5 text-sm leading-relaxed text-muted-foreground sm:p-8">
        <h2 className="font-display text-xl font-bold text-foreground">{title}</h2>
        {children}
      </div>
    </div>
  );
}
