import { cn } from "@/lib/utils";

export type SummaryView = "geography" | "department";

export function ViewSwitch({
  value,
  onChange,
}: {
  value: SummaryView;
  onChange: (value: SummaryView) => void;
}) {
  return (
    <div
      className="inline-flex rounded-md border bg-muted/30 p-0.5"
      role="group"
      aria-label="Summary view"
    >
      {([
        ["geography", "Geography"],
        ["department", "Department"],
      ] as const).map(([option, label]) => (
        <button
          key={option}
          type="button"
          onClick={() => onChange(option)}
          className={cn(
            "rounded px-3 py-1.5 text-xs font-medium transition-colors",
            value === option
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
          aria-pressed={value === option}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
