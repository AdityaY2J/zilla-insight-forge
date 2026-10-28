import { cn } from "@/lib/utils";

/**
 * Horizontal 100% stacked bar chart showing the department composition of
 * uploaded Field Staff per geography — one row per geography, with the total
 * surfaced in the axis label itself, e.g. "Konkan (570)".
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
  xAxisTitle,
}: {
  columns: CompositionColumn[];
  departments: string[];
  xAxisTitle?: string;
}) {
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
      <div className="max-h-[620px] space-y-5 overflow-y-auto pr-1">
        {columns.map((col) => (
          <Row key={col.key} column={col} colorFor={colorFor} />
        ))}
      </div>
      {xAxisTitle ? (
        <p className="mt-2 text-center text-[11px] font-medium text-muted-foreground">
          {xAxisTitle}
        </p>
      ) : null}
    </div>
  );
}

function Row({
  column,
  colorFor,
}: {
  column: CompositionColumn;
  colorFor: (department: string) => { bg: string; fg: string };
}) {
  const fullLabel = column.subLabel
    ? `${column.label} — ${column.subLabel}`
    : column.label;
  return (
    <div className="group/row relative flex items-center gap-3">
      <span
        className="w-48 shrink-0 truncate text-right text-[11px] text-muted-foreground"
        title={`${fullLabel} (${column.total})`}
      >
        {fullLabel}
        <span className="ml-1 font-medium tabular-nums text-foreground">
          ({column.total})
        </span>
      </span>
      <div className="h-10 min-w-0 flex-1">
        {column.total === 0 ? (
          <div className="flex h-full w-full items-center justify-center rounded-sm border border-dashed border-border/70">
            <span className="px-1 text-[9px] leading-tight text-muted-foreground">
              No participants
            </span>
          </div>
        ) : (
          <div className="flex h-full w-full overflow-hidden rounded-sm">
            {column.segments.map((seg, j) => {
              const style = colorFor(seg.department);
              const pct = Math.round((seg.count / column.total) * 100);
              const isLast = j === column.segments.length - 1;
              return (
                <div
                  key={seg.department}
                  className={cn(
                    "flex items-center justify-center overflow-hidden whitespace-nowrap",
                    isLast && "rounded-r-sm",
                  )}
                  style={{
                    flexBasis: 0,
                    flexGrow: seg.count,
                    backgroundColor: style.bg,
                    color: style.fg,
                  }}
                >
                  {pct >= 25 ? (
                    <span className="px-1 text-[10px] font-medium tabular-nums">
                      {seg.count} ({pct}%)
                    </span>
                  ) : pct >= 10 ? (
                    <span className="px-1 text-[10px] tabular-nums">
                      {pct}%
                    </span>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}
      </div>
      <div className="pointer-events-none absolute bottom-full left-52 z-20 mb-1 hidden w-56 -translate-x-1/2 rounded-md border bg-popover p-2.5 text-left shadow-md group-hover/row:block">
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
