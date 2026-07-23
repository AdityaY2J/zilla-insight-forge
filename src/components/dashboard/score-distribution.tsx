import { cn } from "@/lib/utils";

/** Compact inline Red | Orange | Green distribution used in KPI cards & tables. */
export function ScoreDistribution({
  red,
  orange,
  green,
  size = "sm",
}: {
  red: number;
  orange: number;
  green: number;
  size?: "sm" | "md";
}) {
  const text = size === "md" ? "text-sm" : "text-xs";
  return (
    <span className={cn("inline-flex items-center gap-1.5 tabular-nums", text)}>
      <Segment color="bg-critical" value={red} />
      <span className="text-muted-foreground/60">|</span>
      <Segment color="bg-warning" value={orange} />
      <span className="text-muted-foreground/60">|</span>
      <Segment color="bg-success" value={green} />
    </span>
  );
}

function Segment({ color, value }: { color: string; value: number }) {
  return (
    <span className="inline-flex items-center gap-1">
      <span className={cn("h-2 w-2 rounded-sm", color)} />
      <span className="font-medium">{value}%</span>
    </span>
  );
}

/** Horizontal stacked bar used for the KPI-scale distribution visual. */
export function ScoreDistributionBar({
  red,
  orange,
  green,
}: {
  red: number;
  orange: number;
  green: number;
}) {
  const total = red + orange + green || 1;
  return (
    <div className="w-full h-2 rounded-full overflow-hidden flex bg-muted">
      <div style={{ width: `${(red / total) * 100}%` }} className="bg-critical" />
      <div style={{ width: `${(orange / total) * 100}%` }} className="bg-warning" />
      <div style={{ width: `${(green / total) * 100}%` }} className="bg-success" />
    </div>
  );
}
