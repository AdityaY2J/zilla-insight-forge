import { useState, type ReactNode } from "react";
import { ChevronDown, ChevronRight, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type HierRow = {
  key: string;
  label: string;
  values: (ReactNode | number | string)[];
  /** Plain-text values used for CSV export (falls back to `values` when strings). */
  exportValues?: (string | number)[];
  children?: HierRow[];
};

export type HierColumn = {
  header: string;
  /** Formula shown under the header for calculated rate/ratio columns. */
  formula?: string;
  align?: "left" | "right" | "center";
};


/**
 * Generic expandable hierarchical breakdown table. Used across dashboards
 * (Geography → Division → District → Taluka, Department, etc.). Presentation
 * is uniform; consumers decide the columns and cell renderers.
 */
export function HierarchicalBreakdownTable({
  rows,
  firstColHeader,
  columns,
  allowExpand = true,
  defaultExpanded = false,
}: {
  rows: HierRow[];
  firstColHeader: string;
  columns: HierColumn[];
  allowExpand?: boolean;
  defaultExpanded?: boolean;
}) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>(() => {
    if (!defaultExpanded) return {};
    const out: Record<string, boolean> = {};
    const walk = (list: HierRow[]) => {
      for (const r of list) {
        out[r.key] = true;
        if (r.children) walk(r.children);
      }
    };
    walk(rows);
    return out;
  });
  const toggle = (key: string) => setExpanded((p) => ({ ...p, [key]: !p[key] }));

  const flat: Array<{ row: HierRow; depth: number }> = [];
  const walk = (list: HierRow[], depth: number) => {
    for (const r of list) {
      flat.push({ row: r, depth });
      if (allowExpand && expanded[r.key] && r.children?.length) {
        walk(r.children, depth + 1);
      }
    }
  };
  walk(rows, 0);

  return (
    <div className="rounded-lg border bg-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-2.5 text-left font-medium">{firstColHeader}</th>
              {columns.map((c, i) => (
                <th
                  key={i}
                  className={cn(
                    "px-4 py-2.5 font-medium",
                    c.align === "right"
                      ? "text-right"
                      : c.align === "center"
                        ? "text-center"
                        : "text-left",
                  )}
                >
                  {c.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {flat.map(({ row, depth }) => {
              const hasChildren = allowExpand && !!row.children?.length;
              const isOpen = expanded[row.key];
              return (
                <tr key={row.key} className="border-t hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-2.5">
                    <div
                      className="flex items-center gap-1.5"
                      style={{ paddingLeft: `${depth * 20}px` }}
                    >
                      {hasChildren ? (
                        <button
                          type="button"
                          onClick={() => toggle(row.key)}
                          className="h-5 w-5 inline-flex items-center justify-center rounded hover:bg-muted"
                          aria-label={isOpen ? "Collapse" : "Expand"}
                        >
                          {isOpen ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </button>
                      ) : (
                        <span className="w-5" />
                      )}
                      <span
                        className={cn(
                          depth === 0
                            ? "font-medium text-foreground"
                            : depth === 1
                              ? "text-foreground"
                              : "text-muted-foreground",
                        )}
                      >
                        {row.label}
                      </span>
                    </div>
                  </td>
                  {row.values.map((v, i) => {
                    const c = columns[i];
                    return (
                      <td
                        key={i}
                        className={cn(
                          "px-4 py-2.5",
                          c?.align === "right"
                            ? "text-right tabular-nums"
                            : c?.align === "center"
                              ? "text-center"
                              : "text-left",
                        )}
                      >
                        {v as ReactNode}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
