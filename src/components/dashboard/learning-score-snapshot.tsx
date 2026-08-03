import { ScoreDistribution, ScoreDistributionBar } from "./score-distribution";
import { Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export type LearningScoreSnapshot = {
  label: string;
  averageScore: number;
  red: number;
  orange: number;
  green: number;
};

/**
 * Reusable Day 1 / Day 2 / Overall learning comparison. Each period presents
 * its two measures side by side, with the value or visual below the label.
 */
export function LearningScoreSnapshots({
  snapshots,
  averageLabel = "Average Score",
}: {
  snapshots: LearningScoreSnapshot[];
  averageLabel?: string;
}) {
  return (
    <div className="overflow-hidden rounded-lg border bg-card divide-y">
      {snapshots.map((snapshot) => (
        <section key={snapshot.label} className="px-5 py-4">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-primary mb-3">
            {snapshot.label}
          </h3>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <p className="text-sm text-muted-foreground">{averageLabel}</p>
              <p className="mt-1 text-xl font-semibold tabular-nums text-foreground">
                {snapshot.averageScore}%
              </p>
            </div>
            <div>
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <span>Score Distribution</span>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button type="button" aria-label="About learning score distribution" className="transition-colors hover:text-foreground">
                      <Info className="h-3.5 w-3.5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-sm p-3 text-xs leading-relaxed">
                    <p className="mb-1.5 font-semibold">Score Distribution</p>
                    <p><strong>Red:</strong> Represents the percentage of participants scoring less than 60% in learning test.</p>
                    <p className="mt-1"><strong>Orange:</strong> Represents the percentage of participants scoring between 60–80% in learning test.</p>
                    <p className="mt-1"><strong>Green:</strong> Represents the percentage of participants scoring more than 80% in learning test.</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <div className="mt-1.5">
                <ScoreDistribution
                  red={snapshot.red}
                  orange={snapshot.orange}
                  green={snapshot.green}
                  size="md"
                />
                <div className="mt-2 max-w-[220px]">
                  <ScoreDistributionBar
                    red={snapshot.red}
                    orange={snapshot.orange}
                    green={snapshot.green}
                  />
                </div>
              </div>
            </div>
          </div>
        </section>
      ))}
    </div>
  );
}
