import { useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";

import { PageHeader } from "@/components/dashboard/page-header";
import { Section } from "@/components/dashboard/section";
import { StatusPill } from "@/components/dashboard/status-pill";
import { SplitSnapshotPanel } from "@/components/dashboard/split-snapshot-panel";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { MetricPanel } from "@/components/dashboard/metric-panel";
import { LearningScoreSnapshots } from "@/components/dashboard/learning-score-snapshot";
import { BatchPerformanceTable } from "@/components/dashboard/batch-performance-table";
import {
  HierarchicalBreakdownTable,
  type HierRow,
} from "@/components/dashboard/hierarchical-breakdown-table";

import { BATCHES, type Batch } from "@/data/capacity-building";
import { DISTRICTS, DIVISIONS } from "@/data/geography";
import { formatProgramAverage } from "@/lib/program-average";

export const Route = createFileRoute("/mt-batch-performance")({
  head: () => ({
    meta: [
      { title: "MT Batch Performance · Zilla Analytics" },
      {
        name: "description",
        content:
          "Live and historical MT batch performance: participation, assessment scores, score distribution, and process adherence.",
      },
      { property: "og:title", content: "MT Batch Performance · Zilla Analytics" },
      {
        property: "og:description",
        content:
          "Day 1, Day 2 and overall batch scores, score distribution, and process adherence across Maharashtra.",
      },
    ],
  }),
  component: MTBatchPerformanceDashboard,
});

function avg(nums: number[]) {
  if (nums.length === 0) return 0;
  return Math.round(nums.reduce((s, n) => s + n, 0) / nums.length);
}

function avgOneDecimal(nums: number[]) {
  if (nums.length === 0) return 0;
  return Math.round((nums.reduce((s, n) => s + n, 0) / nums.length) * 10) / 10;
}

function MTBatchPerformanceDashboard() {
  const stats = useMemo(() => {
    const n = BATCHES.length;
    const day1 = {
      score: avg(BATCHES.map((b) => b.day1AssessmentAvg)),
      red: avg(BATCHES.map((b) => b.day1RedPct)),
      orange: avg(BATCHES.map((b) => b.day1OrangePct)),
      green: avg(BATCHES.map((b) => b.day1GreenPct)),
    };
    const day2 = {
      score: avg(BATCHES.map((b) => b.day2AssessmentAvg)),
      red: avg(BATCHES.map((b) => b.day2RedPct)),
      orange: avg(BATCHES.map((b) => b.day2OrangePct)),
      green: avg(BATCHES.map((b) => b.day2GreenPct)),
    };
    const overall = {
      score: avg(
        BATCHES.map((b) => (b.day1AssessmentAvg + b.day2AssessmentAvg) / 2),
      ),
      red: avg(BATCHES.map((b) => b.redPct)),
      orange: avg(BATCHES.map((b) => b.orangePct)),
      green: avg(BATCHES.map((b) => b.greenPct)),
    };
    const processFraction =
      n === 0 ? 0 : BATCHES.reduce((s, b) => s + b.processAdherence, 0) / n;
    const pre = avgOneDecimal(BATCHES.map((b) => b.avgPreScore));
    const post = avgOneDecimal(BATCHES.map((b) => b.avgPostScore));
    return { n, day1, day2, overall, processFraction, pre, post };
  }, []);

  const activeBatches = useMemo(() => BATCHES.filter((b) => b.active), []);

  return (
    <div className="pb-16">
      <PageHeader
        title="MT Batch Performance"
        description="Live and historical performance for every Master Trainer capacity-building batch."
      />

      <div className="px-8 pt-8 space-y-10">
        <Section title="Snapshot">
          <SplitSnapshotPanel
            left={<div className="space-y-4"><MetricPanel title="Overall" groups={[{ items: [{ label: "Batches Conducted", value: stats.n.toLocaleString("en-IN") }, { label: "Average Process Score", value: `${stats.processFraction.toFixed(1)}/8` }] }]} /><LearningScoreSnapshots snapshots={[{ label: "Day 1", averageScore: stats.day1.score, red: stats.day1.red, orange: stats.day1.orange, green: stats.day1.green }, { label: "Day 2", averageScore: stats.day2.score, red: stats.day2.red, orange: stats.day2.orange, green: stats.day2.green }, { label: "Overall", averageScore: stats.overall.score, red: stats.overall.red, orange: stats.overall.orange, green: stats.overall.green }]} /><MetricPanel title="Cognitive" groups={[{ items: [{ label: "Average Cognitive Pre Score", value: `${stats.pre.toFixed(1)} / 10` }, { label: "Average Cognitive Post Score", value: `${stats.post.toFixed(1)} / 10` }] }]} /></div>}
            rightTitle={`Active Batches (${activeBatches.length})`}
            right={<ActiveBatchesList batches={activeBatches} />}
          />
        </Section>

        <Section title="Division Summary">
          <DivisionSummaryTable rows={BATCHES} />
        </Section>

        <Section title="Batch Performance">
          <BatchPerformanceTable rows={BATCHES} />
        </Section>
      </div>
    </div>
  );
}

function ActiveBatchesList({ batches }: { batches: Batch[] }) {
  if (batches.length === 0) {
    return (
      <p className="text-xs text-muted-foreground">
        No batches are running right now.
      </p>
    );
  }
  return (
    <ul className="space-y-2.5 max-h-[420px] overflow-auto pr-1">
      {batches.map((b) => (
        <li
          key={b.id}
          className="flex items-center justify-between gap-3 text-sm border-b border-dashed pb-2 last:border-b-0"
        >
          <div className="min-w-0">
            <p className="font-medium text-foreground truncate">{b.name}</p>
            <p className="text-xs text-muted-foreground truncate">
              {b.id} · {b.taluka}, {b.district}
            </p>
          </div>
          <StatusPill tone="info" dot>
            Live
          </StatusPill>
        </li>
      ))}
    </ul>
  );
}

function summaryRow(batches: Batch[]): (string | number)[] {
  if (batches.length === 0) return [0, "-", "-", "-", "-", "-", "-", "-"];
  const adherence =
    batches.reduce((s, b) => s + b.processAdherence, 0) / batches.length;
  const day1 = avg(batches.map((b) => b.day1AssessmentAvg));
  const day2 = avg(batches.map((b) => b.day2AssessmentAvg));
  return [
    batches.length,
    `${day1}%`,
    `${day2}%`,
    formatProgramAverage(day1, day2),
    `${avg(batches.map((b) => b.redPct))}%`,
    `${avg(batches.map((b) => b.orangePct))}%`,
    `${avg(batches.map((b) => b.greenPct))}%`,
    `${adherence.toFixed(1)}/8`,
  ];
}

function DivisionSummaryTable({ rows }: { rows: Batch[] }) {
  const hier = useMemo<HierRow[]>(
    () =>
      DIVISIONS.map((division) => {
        const divBatches = rows.filter((b) => b.division === division);
        return {
          key: division,
          label: `${division} (Division)`,
          values: summaryRow(divBatches),
          children: DISTRICTS.filter((d) => d.division === division).map(
            (dist) => {
              const dBatches = divBatches.filter(
                (b) => b.district === dist.name,
              );
              return {
                key: `${division}/${dist.name}`,
                label: `${dist.name} (District)`,
                values: summaryRow(dBatches),
                children: dist.talukas.map((tk) => ({
                  key: `${division}/${dist.name}/${tk}`,
                  label: tk,
                  values: summaryRow(
                    dBatches.filter((b) => b.taluka === tk),
                  ),
                })),
              };
            },
          ),
        };
      }),
    [rows],
  );
  return (
    <HierarchicalBreakdownTable
      rows={hier}
      firstColHeader="Geography"
      exportable
      exportFileName="division-summary.csv"
      columns={[
        { header: "Batches Conducted", align: "right" },
        { header: "Day 1 Avg.", align: "right" },
        { header: "Day 2 Avg.", align: "right" },
        { header: "Program Average", align: "right" },
        { header: "Red %", align: "right" },
        { header: "Orange %", align: "right" },
        { header: "Green %", align: "right" },
        { header: "Process Adherence", align: "right" },
      ]}
    />
  );
}
