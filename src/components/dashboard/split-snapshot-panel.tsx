import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Split-panel snapshot used by MT Selection, MT Certification, and MT Batch
 * Performance dashboards: a left-hand KPI stack alongside a right-hand
 * contextual panel (division status list, active batches list, etc.).
 */
export function SplitSnapshotPanel({
  left,
  right,
  rightTitle,
  className,
}: {
  left: ReactNode;
  right: ReactNode;
  rightTitle?: string;
  className?: string;
}) {
  return (
    <div className={cn("grid grid-cols-1 lg:grid-cols-5 gap-4", className)}>
      <div className="lg:col-span-3">{left}</div>
      <div className="lg:col-span-2 rounded-lg border bg-card overflow-hidden flex flex-col">
        {rightTitle ? (
          <div className="px-5 py-3 border-b bg-muted/30">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {rightTitle}
            </h3>
          </div>
        ) : null}
        <div className="flex-1 p-5">{right}</div>
      </div>
    </div>
  );
}
