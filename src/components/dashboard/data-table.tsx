import { useMemo, useState, type ReactNode } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown, Download, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type Column<T> = {
  key: string;
  header: string;
  /** Formula shown under the header for calculated rate/ratio columns. */
  formula?: string;
  accessor: (row: T) => ReactNode;
  sortValue?: (row: T) => string | number;
  exportValue?: (row: T) => string | number;
  className?: string;
  align?: "left" | "right" | "center";
};

export function DataTable<T>({
  data,
  columns,
  searchable = true,
  searchKeys,
  exportable = true,
  pageSize = 10,
  emptyMessage = "No records to display.",
  toolbar,
  getRowId,
  stickyHeader = true,
}: {
  data: T[];
  columns: Column<T>[];
  searchable?: boolean;
  searchKeys?: (keyof T)[];
  exportable?: boolean;
  pageSize?: number;
  emptyMessage?: string;
  toolbar?: ReactNode;
  getRowId?: (row: T, i: number) => string;
  stickyHeader?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<{ key: string; dir: "asc" | "desc" } | null>(null);
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    if (!searchable || !query.trim()) return data;
    const q = query.toLowerCase();
    return data.filter((row) => {
      if (searchKeys && searchKeys.length) {
        return searchKeys.some((k) =>
          String(row[k] ?? "").toLowerCase().includes(q),
        );
      }
      return Object.values(row as Record<string, unknown>).some((v) =>
        String(v ?? "").toLowerCase().includes(q),
      );
    });
  }, [data, query, searchable, searchKeys]);

  const sorted = useMemo(() => {
    if (!sort) return filtered;
    const col = columns.find((c) => c.key === sort.key);
    if (!col || !col.sortValue) return filtered;
    const copy = [...filtered];
    copy.sort((a, b) => {
      const av = col.sortValue!(a);
      const bv = col.sortValue!(b);
      if (av < bv) return sort.dir === "asc" ? -1 : 1;
      if (av > bv) return sort.dir === "asc" ? 1 : -1;
      return 0;
    });
    return copy;
  }, [filtered, sort, columns]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paged = sorted.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleSort = (col: Column<T>) => {
    if (!col.sortValue) return;
    setSort((prev) => {
      if (!prev || prev.key !== col.key) return { key: col.key, dir: "asc" };
      if (prev.dir === "asc") return { key: col.key, dir: "desc" };
      return null;
    });
  };

  const handleExport = () => {
    const headers = columns.map((c) => c.header);
    const rows = sorted.map((row) =>
      columns.map((c) => {
        const raw = c.exportValue ? c.exportValue(row) : c.sortValue ? c.sortValue(row) : "";
        const s = String(raw ?? "");
        return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
      }),
    );
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "export.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="rounded-lg border bg-card">
      <div className="flex flex-wrap items-center gap-3 border-b px-4 py-3">
        {searchable ? (
          <div className="relative flex-1 min-w-[220px] max-w-sm">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
              }}
              placeholder="Search…"
              className="pl-8 h-9"
            />
          </div>
        ) : (
          <div className="flex-1" />
        )}
        <div className="flex items-center gap-2">
          {toolbar}
          {exportable ? (
            <Button variant="outline" size="sm" onClick={handleExport} className="h-9">
              <Download className="h-4 w-4" />
              Export
            </Button>
          ) : null}
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead
            className={cn(
              "bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground",
              stickyHeader && "sticky top-0 z-10",
            )}
          >
            <tr>
              {columns.map((col) => {
                const active = sort?.key === col.key;
                const alignClass =
                  col.align === "right"
                    ? "text-right"
                    : col.align === "center"
                      ? "text-center"
                      : "text-left";
                return (
                  <th
                    key={col.key}
                    className={cn("px-4 py-2.5 font-medium", alignClass, col.className)}
                  >
                    {col.sortValue ? (
                      <button
                        type="button"
                        onClick={() => handleSort(col)}
                        className={cn(
                          "inline-flex items-center gap-1.5 hover:text-foreground transition-colors",
                          active && "text-foreground",
                        )}
                      >
                        {col.header}
                        {active ? (
                          sort!.dir === "asc" ? (
                            <ArrowUp className="h-3 w-3" />
                          ) : (
                            <ArrowDown className="h-3 w-3" />
                          )
                        ) : (
                          <ArrowUpDown className="h-3 w-3 opacity-40" />
                        )}
                      </button>
                    ) : (
                      col.header
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {paged.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-12 text-center text-sm text-muted-foreground"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              paged.map((row, i) => (
                <tr
                  key={getRowId ? getRowId(row, i) : i}
                  className="border-t hover:bg-muted/30 transition-colors"
                >
                  {columns.map((col) => {
                    const alignClass =
                      col.align === "right"
                        ? "text-right"
                        : col.align === "center"
                          ? "text-center"
                          : "text-left";
                    return (
                      <td
                        key={col.key}
                        className={cn("px-4 py-3 text-foreground", alignClass, col.className)}
                      >
                        {col.accessor(row)}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {sorted.length > pageSize ? (
        <div className="flex items-center justify-between border-t px-4 py-3 text-xs text-muted-foreground">
          <span>
            Showing {(currentPage - 1) * pageSize + 1}–
            {Math.min(currentPage * pageSize, sorted.length)} of {sorted.length}
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === 1}
              onClick={() => setPage(currentPage - 1)}
              className="h-8"
            >
              Previous
            </Button>
            <span className="px-2 tabular-nums">
              {currentPage} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === totalPages}
              onClick={() => setPage(currentPage + 1)}
              className="h-8"
            >
              Next
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
