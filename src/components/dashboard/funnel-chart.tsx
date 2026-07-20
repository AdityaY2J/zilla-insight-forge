import { cn } from "@/lib/utils";

export type FunnelStage = {
  label: string;
  value: number;
  tone?: "info" | "success" | "warning" | "critical" | "neutral";
};

const TONE_BG: Record<NonNullable<FunnelStage["tone"]>, string> = {
  info: "bg-primary",
  success: "bg-success",
  warning: "bg-warning",
  critical: "bg-critical",
  neutral: "bg-neutral",
};

/**
 * A readability-first funnel: horizontal bars proportional to the first stage,
 * with conversion vs previous stage shown alongside.
 */
export function FunnelChart({ stages }: { stages: FunnelStage[] }) {
  if (!stages.length) return null;
  const top = stages[0].value || 1;
  return (
    <div className="space-y-3">
      {stages.map((s, i) => {
        const pct = Math.max(2, Math.round((s.value / top) * 100));
        const prev = i === 0 ? null : stages[i - 1].value;
        const conv =
          prev && prev > 0 ? Math.round((s.value / prev) * 1000) / 10 : null;
        return (
          <div key={s.label} className="grid grid-cols-[180px_1fr_auto] gap-4 items-center">
            <div className="text-sm font-medium text-foreground">{s.label}</div>
            <div className="relative h-9 rounded-md bg-muted/50 overflow-hidden">
              <div
                className={cn(
                  "absolute inset-y-0 left-0 rounded-md flex items-center px-3 text-sm font-medium text-primary-foreground",
                  TONE_BG[s.tone ?? "info"],
                )}
                style={{ width: `${pct}%` }}
              >
                <span className="tabular-nums">{s.value.toLocaleString("en-IN")}</span>
              </div>
            </div>
            <div className="text-xs text-muted-foreground tabular-nums w-20 text-right">
              {conv === null ? "—" : `${conv}% conv.`}
            </div>
          </div>
        );
      })}
    </div>
  );
}
