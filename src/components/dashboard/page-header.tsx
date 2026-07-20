import type { ReactNode } from "react";

export function PageHeader({
  title,
  description,
  filters,
  actions,
}: {
  title: string;
  description?: string;
  filters?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="border-b bg-background">
      <div className="px-8 pt-8 pb-6">
        <div className="flex items-start justify-between gap-6 flex-wrap">
          <div className="max-w-2xl">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              {title}
            </h1>
            {description ? (
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                {description}
              </p>
            ) : null}
          </div>
          {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
        </div>
        {filters ? (
          <div className="mt-6 flex flex-wrap items-end gap-3">{filters}</div>
        ) : null}
      </div>
    </div>
  );
}
