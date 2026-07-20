import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function KpiCard({
  title,
  value,
  context,
  accent,
}: {
  title: string;
  value: ReactNode;
  context?: ReactNode;
  accent?: "default" | "success" | "warning" | "critical" | "info";
}) {
  const accentBar: Record<NonNullable<typeof accent>, string> = {
    default: "bg-border",
    success: "bg-success",
    warning: "bg-warning",
    critical: "bg-critical",
    info: "bg-primary",
  };
  return (
    <div className="relative rounded-lg border bg-card p-5 overflow-hidden">
      <span
        aria-hidden
        className={cn(
          "absolute inset-y-0 left-0 w-[3px]",
          accentBar[accent ?? "default"],
        )}
      />
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {title}
      </p>
      <p className="mt-3 text-3xl font-semibold tracking-tight text-foreground tabular-nums">
        {value}
      </p>
      {context ? (
        <p className="mt-1.5 text-xs text-muted-foreground">{context}</p>
      ) : null}
    </div>
  );
}

export function KpiGrid({
  children,
  cols = 4,
}: {
  children: ReactNode;
  cols?: 3 | 4 | 5;
}) {
  const colClass = {
    3: "md:grid-cols-3",
    4: "md:grid-cols-2 lg:grid-cols-4",
    5: "md:grid-cols-2 lg:grid-cols-5",
  }[cols];
  return <div className={cn("grid grid-cols-1 gap-4", colClass)}>{children}</div>;
}
