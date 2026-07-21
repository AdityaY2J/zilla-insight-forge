import { Info } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Inline badge used wherever a composite metric (Overall Score, Batch Quality,
 * Flashpoints, Learning Score, Engagement Score, etc.) appears in the UI but
 * its business logic has not been finalized. Keeps the surface consistent
 * across dashboards.
 */
export function PlaceholderMetric({
  label,
  className,
}: {
  label?: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md bg-muted px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground",
        className,
      )}
      title="Composite metric — business logic pending finalization"
    >
      <Info className="h-3 w-3" />
      {label ?? "Pending"}
    </span>
  );
}
