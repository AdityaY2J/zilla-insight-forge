import { cn } from "@/lib/utils";

/**
 * Grouped (clustered) column chart with a legend — used by the Watchlist
 * "Assessment Submissions Past 14 Days" chart. Isolated from existing charts.
 */
export function GroupedColumnChart({
  data,
  series,
  height = 260,
  yAxisTitle,
  xAxisTitle,
  scrollable = false,
  minChartWidth = 760,
  barMaxWidth = 8,
  alternateXAxisLabels = false,
  rotateXAxisLabels = false,
}: {
  data: { label: string; values: number[] }[];
  series: { name: string; color: string }[];
  height?: number;
  yAxisTitle?: string;
  xAxisTitle?: string;
  scrollable?: boolean;
  minChartWidth?: number;
  barMaxWidth?: number;
  alternateXAxisLabels?: boolean;
  rotateXAxisLabels?: boolean;
}) {
  const max = Math.max(10, ...data.flatMap((d) => d.values));
  const yMax = Math.ceil(max / 10) * 10;
  const gridLines = 5;
  return (
    <div className={cn("w-full", scrollable && "overflow-x-auto pb-1")}>
      <div className={cn(scrollable ? "min-w-[760px]" : "w-full")} style={scrollable ? { minWidth: minChartWidth } : undefined}>
      <div className="flex items-center gap-4 mb-3 text-xs">
        {series.map((s) => (
          <span key={s.name} className="inline-flex items-center gap-1.5">
            <span
              className="h-2.5 w-2.5 rounded-sm"
              style={{ backgroundColor: s.color }}
            />
            <span className="text-muted-foreground">{s.name}</span>
          </span>
        ))}
      </div>
      <div className="flex">
        {yAxisTitle ? (
          <div className="flex items-center justify-center pr-1">
            <span className="text-[11px] font-medium text-muted-foreground [writing-mode:vertical-rl] rotate-180">
              {yAxisTitle}
            </span>
          </div>
        ) : null}
        <div className="flex-1 min-w-0">
          <div className="w-full" style={{ height }}>
            <div className="flex h-full w-full">
              <div className="flex flex-col justify-between text-[10px] text-muted-foreground pr-2 py-4">
                {Array.from({ length: gridLines + 1 }).map((_, i) => (
                  <span key={i} className="tabular-nums">
                    {Math.round(yMax - (yMax * i) / gridLines)}
                  </span>
                ))}
              </div>
              <div className="relative flex-1 border-l border-b">
                <div className="absolute inset-0 flex flex-col justify-between py-4 pointer-events-none">
                  {Array.from({ length: gridLines + 1 }).map((_, i) => (
                    <div key={i} className="border-t border-dashed border-border/60" />
                  ))}
                </div>
                <div className="relative h-full flex items-end justify-around gap-1.5 px-2 pt-6 pb-1">
                  {data.map((d) => (
                    <div
                      key={d.label}
                      className="flex-1 min-w-0 h-full flex items-end justify-center gap-[2px]"
                    >
                      {d.values.map((v, i) => (
                        <div
                          key={i}
                          title={`${series[i]?.name}: ${v}`}
                          className="w-full rounded-t-sm"
                          style={{
                            height: `${(v / yMax) * 100}%`,
                            backgroundColor: series[i]?.color,
                            maxWidth: barMaxWidth,
                          }}
                        />
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div className={cn("flex justify-around gap-1.5 pl-8 pr-2 mt-1", rotateXAxisLabels && "h-10")}>
            {data.map((d, index) => (
              <span
                key={d.label}
              className={cn("flex-1 text-center text-[10px] text-muted-foreground whitespace-nowrap inline-block", rotateXAxisLabels && "origin-top-left")}
              style={rotateXAxisLabels ? { transform: "rotate(-90deg) translateX(-100%)" } : undefined}
              >
                {alternateXAxisLabels && index % 2 === 1 ? "\u00a0" : d.label}
              </span>
            ))}
          </div>
      {xAxisTitle ? (
            <p className="mt-2 text-center text-[11px] font-medium text-muted-foreground">
              {xAxisTitle}
            </p>
      ) : null}
      </div>
    </div>
      </div>
    </div>
  );
}
