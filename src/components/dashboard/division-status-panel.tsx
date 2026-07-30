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
 * MT and Field Staff certification dashboards. All status buckets render as
 * compact division lists.
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
        <BucketList label="" items={active.map((division) => division.division)} tone="info" />
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
  tone: "success" | "muted" | "info";
}) {
  return (
    <div>
      {label ? <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">{label}</h4> : null}
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
                  : tone === "info"
                    ? "bg-primary/10 text-primary ring-primary/20"
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
