import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type MetricItem = {
  label: string;
  /** Formula shown under the label, e.g. "Selected/Target". */
  formula?: string;
  value: ReactNode;
  sub?: ReactNode;
};

export type MetricGroup = {
  heading?: string;
  items: MetricItem[];
};

/**
 * Vertical metric panel — the card-style alternative to a KPI card grid.
 * Used for the LHS of the Snapshot split panel so it visually matches the RHS.
 */
export function MetricPanel({
  title,
  groups,
  className,
}: {
  title?: string;
  groups: MetricGroup[];
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-lg border bg-card overflow-hidden flex flex-col h-full",
        className,
      )}
    >
      {title ? (
        <div className="px-5 py-3 border-b bg-muted/30">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {title}
          </h3>
        </div>
      ) : null}
      <div className="flex-1 divide-y">
        {groups.map((g, gi) => (
          <div key={gi} className="px-5 py-3">
            {g.heading ? (
              <p className="text-[11px] font-semibold uppercase tracking-wide text-primary mb-2">
                {g.heading}
              </p>
            ) : null}
            <dl className="space-y-2.5">
              {g.items.map((it) => (
                <div
                  key={it.label}
                  className="flex items-start justify-between gap-4"
                >
                  <dt className="text-sm text-muted-foreground leading-tight">
                    {it.label}
                    {it.formula ? (
                      <span className="block text-[10px] text-muted-foreground/70">
                        ({it.formula})
                      </span>
                    ) : null}
                  </dt>
                  <dd className="text-right">
                    <span className="text-base font-semibold tabular-nums text-foreground">
                      {it.value}
                    </span>
                    {it.sub ? (
                      <div className="mt-1 min-w-[140px]">{it.sub}</div>
                    ) : null}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        ))}
      </div>
    </div>
  );
}
