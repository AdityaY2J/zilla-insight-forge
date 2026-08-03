import { useState, type ReactNode } from "react";
import { ChevronDown, ChevronRight, Download, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  exportColumns,
  allowExpand = true,
  defaultExpanded = false,
  exportable = false,
  searchable = false,
  headerCase = "uppercase",
  exportFileName = "export.csv",
}: {
  rows: HierRow[];
  firstColHeader: string;
  columns: HierColumn[];
  exportColumns?: HierColumn[];
  allowExpand?: boolean;
  defaultExpanded?: boolean;
  exportable?: boolean;
  searchable?: boolean;
  headerCase?: "uppercase" | "normal";
  exportFileName?: string;
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
  const [query, setQuery] = useState("");
  const toggle = (key: string) => setExpanded((p) => ({ ...p, [key]: !p[key] }));

  const filterRows = (list: HierRow[]): HierRow[] => {
    const needle = query.trim().toLowerCase();
    if (!needle) return list;
    return list.flatMap((row) => {
      const children = row.children ? filterRows(row.children) : undefined;
      return row.label.toLowerCase().includes(needle) || children?.length
        ? [{ ...row, children }]
        : [];
    });
  };
  const flat: Array<{ row: HierRow; depth: number }> = [];
  const walk = (list: HierRow[], depth: number) => {
    for (const r of list) {
      flat.push({ row: r, depth });
      if (allowExpand && expanded[r.key] && r.children?.length) {
        walk(r.children, depth + 1);
      }
    }
  };
  walk(filterRows(rows), 0);

  const handleExport = () => {
    const all: Array<{ row: HierRow; depth: number }> = [];
    const walkAll = (list: HierRow[], depth: number) => {
      for (const r of list) {
        all.push({ row: r, depth });
        if (r.children?.length) walkAll(r.children, depth + 1);
      }
    };
    walkAll(rows, 0);
    const esc = (v: unknown) => {
      const s = String(v ?? "");
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const header = [firstColHeader, ...(exportColumns ?? columns).map((c) => c.header)];
    const lines = all.map(({ row, depth }) => {
      const vals =
        row.exportValues ??
        row.values.map((v) => (typeof v === "object" ? "" : String(v ?? "")));
      return [`${"  ".repeat(depth)}${row.label}`, ...vals].map(esc).join(",");
    });
    const csv = [header.map(esc).join(","), ...lines].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = exportFileName;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="rounded-lg border bg-card overflow-hidden">
      {exportable || searchable ? (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3">
          {searchable ? <div className="relative w-full max-w-xs"><Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" /><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search geography..." className="h-9 pl-8" /></div> : <span />}
          {exportable ? <Button variant="outline" size="sm" onClick={handleExport} className="h-9"><Download className="h-4 w-4" />Export</Button> : null}
        </div>
      ) : null}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className={cn("bg-muted/40 text-xs tracking-wide text-muted-foreground", headerCase === "uppercase" && "uppercase")}>
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
                  {c.formula ? (
                    <span className="block normal-case text-[10px] font-normal text-muted-foreground/70">
                      ({c.formula})
                    </span>
                  ) : null}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {flat.map(({ row, depth }) => {
              const hasChildren = allowExpand && !!row.children?.length;
              const isOpen = expanded[row.key];
              return (
                <tr
                  key={row.key}
                  className={cn(
                    "border-t transition-colors hover:brightness-95",
                    depth === 0 && "bg-[#EDEDED]",
                    depth === 1 && "bg-[#F6F6F6]",
                    depth >= 2 && "bg-[#FFFFFF]",
                  )}
                >
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
