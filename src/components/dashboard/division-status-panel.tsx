import { cn } from "@/lib/utils";

export type ActiveDivisionEntry = {
  division: string;
  target: number;
  achieved: number;
  completion: number; // %
  lastDate: string;
};

/**
 * Categorized division panel used in the Section 1 RHS of MT Selection and
 * MT Certification dashboards. "Active" divisions render as a table; the
 * Completed / Yet to Start buckets remain simple lists.
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
          <div className="overflow-x-auto rounded-md border">
            <table className="w-full text-xs">
              <thead className="bg-muted/40 text-[10px] uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-2.5 py-2 text-left font-medium">Active</th>
                  <th className="px-2.5 py-2 text-right font-medium">Target</th>
                  <th className="px-2.5 py-2 text-right font-medium">
                    {achievedLabel}
                  </th>
                  <th className="px-2.5 py-2 text-right font-medium">
                    Completion
                    <span className="block normal-case text-[9px] font-normal text-muted-foreground/70">
                      ({achievedLabel}/Target)
                    </span>
                  </th>
                  <th className="px-2.5 py-2 text-right font-medium">Last Date</th>
                </tr>
              </thead>
              <tbody>
                {active.map((d) => (
                  <tr key={d.division} className="border-t">
                    <td className="px-2.5 py-2 font-medium text-foreground">
                      {d.division}
                    </td>
                    <td className="px-2.5 py-2 text-right tabular-nums">
                      {d.target}
                    </td>
                    <td className="px-2.5 py-2 text-right tabular-nums">
                      {d.achieved}
                    </td>
                    <td
                      className={cn(
                        "px-2.5 py-2 text-right tabular-nums font-medium",
                        d.completion >= 80
                          ? "text-success"
                          : d.completion >= 50
                            ? "text-warning-foreground"
                            : "text-critical",
                      )}
                    >
                      {d.completion}%
                    </td>
                    <td className="px-2.5 py-2 text-right tabular-nums text-muted-foreground">
                      {d.lastDate}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
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
