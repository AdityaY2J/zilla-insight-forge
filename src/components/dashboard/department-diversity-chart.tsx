import { cn } from "@/lib/utils";

/**
 * 100% stacked column chart showing the department composition of uploaded
 * participants per geography. Visual language matches the module-wise
 * process-adherence stacked chart, extended to N departments with per-column
 * hover tooltips and an explicit zero state for geographies with no uploads.
 */

export type CompositionSegment = { department: string; count: number };

export type CompositionColumn = {
  key: string;
  label: string;
  subLabel?: string;
  segments: CompositionSegment[];
  total: number;
};

/** Consistent color per department, derived from the theme's chart tokens. */
const SEGMENT_STYLES = [
  { bg: "var(--chart-1)", fg: "var(--primary-foreground)" },
  { bg: "var(--chart-2)", fg: "var(--success-foreground)" },
  { bg: "var(--chart-3)", fg: "var(--warning-foreground)" },
  { bg: "var(--chart-4)", fg: "var(--critical-foreground)" },
  { bg: "var(--chart-5)", fg: "var(--card)" },
  {
    bg: "color-mix(in oklab, var(--chart-1) 45%, white)",
    fg: "var(--foreground)",
  },
  {
    bg: "color-mix(in oklab, var(--chart-2) 45%, white)",
    fg: "var(--foreground)",
  },
  {
    bg: "color-mix(in oklab, var(--chart-4) 45%, white)",
    fg: "var(--foreground)",
  },
];

export function DepartmentDiversityChart({
  columns,
  departments,
  height = 260,
  xAxisTitle,
}: {
  columns: CompositionColumn[];
  departments: string[];
  height?: number;
  xAxisTitle?: string;
}) {
  const minWidth = 52;
  const scrollable = columns.length > 12;
  const colorFor = (department: string) => {
    const index = departments.indexOf(department);
    return SEGMENT_STYLES[(index >= 0 ? index : 0) % SEGMENT_STYLES.length];
  };

  return (
    <div className="w-full">
      <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs">
        {departments.map((dept) => {
          const style = colorFor(dept);
          return (
            <span
              key={dept}
              className="inline-flex items-center gap-1.5 text-muted-foreground"
            >
              <span
                className="h-2 w-2 rounded-sm"
                style={{ backgroundColor: style.bg }}
              />
              {dept}
            </span>
          );
        })}
      </div>
      <div className={cn("w-full", scrollable && "overflow-x-auto pb-1")}>
        <div
          className="flex gap-1 px-2"
          style={scrollable ? { minWidth: columns.length * minWidth + 16 } : undefined}
        >
          {columns.map((col) => (
            <Column
              key={col.key}
              column={col}
              height={height}
              colorFor={colorFor}
            />
          ))}
        </div>
      </div>
      {xAxisTitle ? (
        <p className="mt-2 text-center text-[11px] font-medium text-muted-foreground">
          {xAxisTitle}
        </p>
      ) : null}
    </div>
  );
}

function Column({
  column,
  height,
  colorFor,
}: {
  column: CompositionColumn;
  height: number;
  colorFor: (department: string) => { bg: string; fg: string };
}) {
  const fullLabel = column.subLabel
    ? `${column.label} — ${column.subLabel}`
    : column.label;
  return (
    <div
      className="group/col relative flex min-w-[52px] flex-1 flex-col items-center"
      style={{ height }}
    >
      <span className="mb-1 text-[10px] font-medium tabular-nums text-foreground">
        {column.total}
      </span>
      <div className="flex w-full flex-1 flex-col-reverse border-b border-l">
        {column.total === 0 ? (
          <div className="flex h-full items-center justify-center rounded-t-sm border border-dashed border-border/70">
            <span className="px-1 text-center text-[9px] leading-tight text-muted-foreground">
              No participants
            </span>
          </div>
        ) : (
          column.segments.map((seg, j) => {
            const style = colorFor(seg.department);
            const pct = Math.round((seg.count / column.total) * 100);
            const isTop = j === column.segments.length - 1;
            return (
              <div
                key={seg.department}
                className={cn(
                  "flex items-center justify-center",
                  isTop && "rounded-t-sm",
                )}
                style={{
                  height: `${pct}%`,
                  backgroundColor: style.bg,
                  color: style.fg,
                }}
              >
                {pct >= 12 ? (
                  <span className="text-[9px] font-medium tabular-nums whitespace-nowrap">
                    {seg.count} ({pct}%)
                  </span>
                ) : null}
              </div>
            );
          })
        )}
      </div>
      <div className="mt-1 w-full min-w-0 text-center">
        <span className="block truncate text-[10px] text-muted-foreground">
          {column.label}
        </span>
        {column.subLabel ? (
          <span className="block truncate text-[9px] text-muted-foreground/70">
            {column.subLabel}
          </span>
        ) : null}
      </div>
      <div className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-1 hidden w-48 -translate-x-1/2 rounded-md border bg-popover p-2.5 text-left shadow-md group-hover/col:block">
        <p className="text-[11px] font-semibold text-foreground">{fullLabel}</p>
        {column.total === 0 ? (
          <p className="mt-1 text-[10px] text-muted-foreground">
            No participants uploaded
          </p>
        ) : (
          <>
            <p className="mt-0.5 text-[10px] text-muted-foreground">
              Total uploaded: {column.total}
            </p>
            <div className="mt-1.5 space-y-1">
              {column.segments.map((seg) => {
                const style = colorFor(seg.department);
                const pct = Math.round((seg.count / column.total) * 100);
                return (
                  <div
                    key={seg.department}
                    className="flex items-center justify-between gap-2 text-[10px]"
                  >
                    <span className="flex min-w-0 items-center gap-1.5 text-popover-foreground">
                      <span
                        className="h-2 w-2 shrink-0 rounded-sm"
                        style={{ backgroundColor: style.bg }}
                      />
                      <span className="truncate">{seg.department}</span>
                    </span>
                    <span className="shrink-0 tabular-nums text-muted-foreground">
                      {seg.count} ({pct}%)
                    </span>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
