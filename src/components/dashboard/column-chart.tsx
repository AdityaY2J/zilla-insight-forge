import { cn } from "@/lib/utils";

/**
 * Lightweight SVG column (bar) chart with data labels on every bar. Used for
 * the Process Adherence distribution (0/8 through 8/8).
 */
export function ColumnChart({
  data,
  yFormat = (v) => `${v}%`,
  labelFormat = (v) => `${v}%`,
  barColor = "hsl(var(--primary))",
  height = 260,
}: {
  data: { label: string; value: number }[];
  yFormat?: (v: number) => string;
  labelFormat?: (v: number) => string;
  barColor?: string;
  height?: number;
}) {
  const max = Math.max(10, ...data.map((d) => d.value));
  const yMax = Math.ceil(max / 10) * 10;
  const gridLines = 5;
  return (
    <div className="w-full" style={{ height }}>
      <div className="flex h-full w-full">
        <div className="flex flex-col justify-between text-[10px] text-muted-foreground pr-2 py-4">
          {Array.from({ length: gridLines + 1 }).map((_, i) => (
            <span key={i} className="tabular-nums">
              {yFormat(Math.round(yMax - (yMax * i) / gridLines))}
            </span>
          ))}
        </div>
        <div className="relative flex-1 border-l border-b">
          <div className="absolute inset-0 flex flex-col justify-between py-4 pointer-events-none">
            {Array.from({ length: gridLines + 1 }).map((_, i) => (
              <div key={i} className="border-t border-dashed border-border/60" />
            ))}
          </div>
          <div className="relative h-full flex items-end justify-around gap-2 px-3 pt-6 pb-1">
            {data.map((d) => {
              const h = (d.value / yMax) * 100;
              return (
                <div
                  key={d.label}
                  className="flex flex-col items-center flex-1 min-w-0 h-full justify-end"
                >
                  <span className="text-[10px] font-medium text-foreground tabular-nums mb-1">
                    {labelFormat(d.value)}
                  </span>
                  <div
                    className="w-full max-w-[40px] rounded-t-sm transition-colors"
                    style={{ height: `${h}%`, backgroundColor: barColor }}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <div className="flex justify-around gap-2 pl-8 pr-3 mt-1">
        {data.map((d) => (
          <span
            key={d.label}
            className={cn(
              "flex-1 text-center text-[10px] text-muted-foreground truncate",
            )}
          >
            {d.label}
          </span>
        ))}
      </div>
    </div>
  );
}

/**
 * 100% stacked column chart: two-part stack per category (met vs not-met).
 * Renders data labels for each segment.
 */
export function StackedColumnChart100({
  data,
  primaryLabel = "Met",
  secondaryLabel = "Not met",
  height = 260,
}: {
  data: { label: string; met: number; notMet: number }[];
  primaryLabel?: string;
  secondaryLabel?: string;
  height?: number;
}) {
  return (
    <div className="w-full">
      <div className="flex items-center gap-4 mb-3 text-xs">
        <LegendDot color="hsl(var(--success))" label={primaryLabel} />
        <LegendDot color="hsl(var(--critical))" label={secondaryLabel} />
      </div>
      <div className="w-full" style={{ height }}>
        <div className="flex h-full items-end justify-around gap-3 border-l border-b px-3 pt-2">
          {data.map((d) => {
            const total = d.met + d.notMet || 1;
            const metPct = Math.round((d.met / total) * 100);
            const notPct = 100 - metPct;
            return (
              <div
                key={d.label}
                className="flex flex-col items-center flex-1 min-w-0 h-full justify-end"
              >
                <div className="w-full max-w-[52px] flex flex-col h-full">
                  <div
                    className="flex items-center justify-center rounded-t-sm text-[10px] font-medium text-critical-foreground"
                    style={{
                      height: `${notPct}%`,
                      backgroundColor: "hsl(var(--critical))",
                    }}
                  >
                    {notPct >= 12 ? `${notPct}%` : ""}
                  </div>
                  <div
                    className="flex items-center justify-center rounded-b-sm text-[10px] font-medium text-success-foreground"
                    style={{
                      height: `${metPct}%`,
                      backgroundColor: "hsl(var(--success))",
                    }}
                  >
                    {metPct >= 12 ? `${metPct}%` : ""}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <div className="flex justify-around gap-3 pl-3 pr-3 mt-1">
        {data.map((d) => (
          <span
            key={d.label}
            className="flex-1 text-center text-[10px] text-muted-foreground truncate"
          >
            {d.label}
          </span>
        ))}
      </div>
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-muted-foreground">
      <span
        className="h-2 w-2 rounded-sm"
        style={{ backgroundColor: color }}
      />
      {label}
    </span>
  );
}
