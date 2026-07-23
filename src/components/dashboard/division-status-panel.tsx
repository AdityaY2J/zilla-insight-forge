import { cn } from "@/lib/utils";

export type ActiveDivisionEntry = {
  division: string;
  target: number;
  achieved: number;
  completion: number; // %
};

/**
 * Categorized division list used in the Section 1 RHS of MT Selection and
 * MT Certification dashboards. Each division falls into exactly one bucket.
 */
export function DivisionStatusPanel({
  achievedLabel,
  active,
  completed,
  yetToStart,
}: {
  achievedLabel: string; // "Selected" | "Certified"
  active: ActiveDivisionEntry[];
  completed: string[];
  yetToStart: string[];
}) {
  return (
    <div className="space-y-5 text-sm">
      <div>
        <h4 className="text-xs italic font-semibold text-muted-foreground uppercase tracking-wide mb-2">
          Active
        </h4>
        {active.length === 0 ? (
          <p className="text-xs text-muted-foreground">No active divisions.</p>
        ) : (
          <ul className="space-y-1.5">
            {active.map((d) => (
              <li
                key={d.division}
                className="flex items-baseline justify-between gap-3"
              >
                <span className="font-medium text-foreground">{d.division}</span>
                <span className="text-xs text-muted-foreground tabular-nums">
                  {d.target}
                  <span className="mx-1 opacity-40">|</span>
                  <span className="text-foreground">{d.achieved}</span>
                  <span className="mx-1 opacity-40">|</span>
                  <span
                    className={cn(
                      "font-medium",
                      d.completion >= 80
                        ? "text-success"
                        : d.completion >= 50
                          ? "text-warning"
                          : "text-critical",
                    )}
                  >
                    {d.completion}%
                  </span>
                </span>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-1.5 text-[10px] text-muted-foreground/70 uppercase tracking-wide">
          Target | {achievedLabel} | Target Completion
        </p>
      </div>

      <BucketList label="Completed" items={completed} tone="success" />
      <BucketList label="Yet to Start" items={yetToStart} tone="muted" />
    </div>
  );
}

function BucketList({
  label,
  items,
  tone,
}: {
  label: string;
  items: string[];
  tone: "success" | "muted";
}) {
  return (
    <div>
      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
        {label}
      </h4>
      {items.length === 0 ? (
        <p className="text-xs text-muted-foreground">None.</p>
      ) : (
        <ul className="flex flex-wrap gap-1.5">
          {items.map((d) => (
            <li
              key={d}
              className={cn(
                "rounded-full px-2.5 py-0.5 text-xs ring-1 ring-inset",
                tone === "success"
                  ? "bg-success-soft text-success ring-success/20"
                  : "bg-neutral-soft text-muted-foreground ring-border",
              )}
            >
              {d}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
