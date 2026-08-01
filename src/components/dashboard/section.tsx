import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Section({
  title,
  description,
  actions,
  actionsClassName,
  children,
  className,
}: {
  title: ReactNode;
  description?: string;
  actions?: ReactNode;
  /** Optional layout class for the action wrapper. */
  actionsClassName?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("space-y-4", className)}>
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-base font-semibold text-foreground tracking-tight">
            {title}
          </h2>
          {description ? (
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          ) : null}
        </div>
        {actions ? (
          <div className={cn("flex items-center gap-2", actionsClassName)}>
            {actions}
          </div>
        ) : null}
      </div>
      {children}
    </section>
  );
}

export function SectionCard({
  children,
  className,
  padded = true,
}: {
  children: ReactNode;
  className?: string;
  padded?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-lg border bg-card",
        padded && "p-5",
        className,
      )}
    >
      {children}
    </div>
  );
}
