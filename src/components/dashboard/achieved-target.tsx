import { cn } from "@/lib/utils";

/** Renders "achieved / target" in tabular numerals; used in tables & KPIs. */
export function AchievedTarget({
  achieved,
  target,
  targetLabel,
  className,
}: {
  achieved: number;
  target?: number | null;
  targetLabel?: string;
  className?: string;
}) {
  if (target == null) {
    return <span className={cn("tabular-nums", className)}>{achieved}</span>;
  }
  return (
    <span className={cn("tabular-nums", className)}>
      <span className="text-foreground font-medium">{achieved}</span>
      <span className="text-muted-foreground"> / {target}</span>
      {targetLabel ? (
        <span className="ml-1 text-xs text-muted-foreground">{targetLabel}</span>
      ) : null}
    </span>
  );
}
