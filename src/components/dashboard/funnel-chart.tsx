import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export type FunnelStage = {
  label: string;
  value: number;
  /** Optional target/required figure shown under the value. */
  target?: number;
};

/**
 * Horizontal funnel: proportional bars per stage with the stage-to-stage
 * conversion shown between consecutive stages.
 */
export function FunnelChart({ stages }: { stages: FunnelStage[] }) {
  const max = Math.max(1, ...stages.map((s) => s.value));
  return (
    <div className="rounded-lg border bg-card p-6">
      <div className="space-y-1">
        {stages.map((s, i) => {
          const width = Math.max(8, (s.value / max) * 100);
          const prev = i > 0 ? stages[i - 1] : null;
          const conversion =
            prev && prev.value > 0
              ? Math.round((s.value / prev.value) * 100)
              : null;
          return (
            <div key={s.label}>
              {conversion != null ? (
                <div className="flex items-center gap-1.5 py-1 pl-[168px] text-[11px] text-muted-foreground">
                  <ChevronRight className="h-3 w-3" />
                  <span className="tabular-nums font-medium text-foreground">
                    {conversion}%
                  </span>
                  <span>
                    conversion from {prev!.label}
                  </span>
                </div>
              ) : null}
              <div className="flex items-center gap-4">
                <span className="w-[152px] shrink-0 text-sm font-medium text-foreground">
                  {s.label}
                </span>
                <div className="flex-1 min-w-0">
                  <div
                    className={cn(
                      "h-10 rounded-md flex items-center px-3 text-sm font-semibold text-primary-foreground transition-all",
                    )}
                    style={{
                      width: `${width}%`,
                      backgroundColor: `color-mix(in oklab, var(--primary) ${100 - i * 12}%, var(--success))`,
                    }}
                  >
                    <span className="tabular-nums">
                      {s.value.toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>
                <span className="w-[150px] shrink-0 text-right text-xs text-muted-foreground tabular-nums">
                  {s.target != null
                    ? `Required ${s.target.toLocaleString("en-IN")}`
                    : ""}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
