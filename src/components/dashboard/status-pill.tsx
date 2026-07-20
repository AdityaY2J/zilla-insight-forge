import { cn } from "@/lib/utils";

export type StatusTone = "success" | "warning" | "critical" | "info" | "neutral";

const TONE: Record<StatusTone, string> = {
  success: "bg-success-soft text-success ring-success/20",
  warning: "bg-warning-soft text-warning-foreground ring-warning/30",
  critical: "bg-critical-soft text-critical ring-critical/20",
  info: "bg-info-soft text-info ring-info/20",
  neutral: "bg-neutral-soft text-muted-foreground ring-border",
};

export function StatusPill({
  tone = "neutral",
  children,
  dot = true,
}: {
  tone?: StatusTone;
  children: React.ReactNode;
  dot?: boolean;
}) {
  const dotColor: Record<StatusTone, string> = {
    success: "bg-success",
    warning: "bg-warning",
    critical: "bg-critical",
    info: "bg-primary",
    neutral: "bg-muted-foreground",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset",
        TONE[tone],
      )}
    >
      {dot ? (
        <span className={cn("h-1.5 w-1.5 rounded-full", dotColor[tone])} />
      ) : null}
      {children}
    </span>
  );
}
