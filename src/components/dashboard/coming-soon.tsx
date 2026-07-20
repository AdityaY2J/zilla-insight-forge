import type { ReactNode } from "react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Construction } from "lucide-react";

export function ComingSoonDashboard({
  title,
  description,
  note,
}: {
  title: string;
  description: string;
  note?: ReactNode;
}) {
  return (
    <div className="pb-16">
      <PageHeader title={title} description={description} />
      <div className="px-8 pt-10">
        <div className="rounded-lg border bg-card p-10 flex items-start gap-5">
          <div className="h-10 w-10 rounded-md bg-muted flex items-center justify-center shrink-0">
            <Construction className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="max-w-2xl">
            <h2 className="text-base font-semibold text-foreground">
              This dashboard will be built next
            </h2>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
              {note ??
                "The specification for this dashboard has been reviewed. It will be implemented in the next iteration, following the same design system and reusable components used across the application."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
