import { ScoreDistribution, ScoreDistributionBar } from "./score-distribution";

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
}: {
  snapshots: LearningScoreSnapshot[];
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
              <p className="text-sm text-muted-foreground">Average Score</p>
              <p className="mt-1 text-xl font-semibold tabular-nums text-foreground">
                {snapshot.averageScore}%
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Score Distribution</p>
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
