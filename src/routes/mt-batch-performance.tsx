import { useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";

import { PageHeader } from "@/components/dashboard/page-header";
import { Section, SectionCard } from "@/components/dashboard/section";
import { KpiCard, KpiGrid } from "@/components/dashboard/kpi-card";
import { StatusPill } from "@/components/dashboard/status-pill";
import { DataTable, type Column } from "@/components/dashboard/data-table";
import { SplitSnapshotPanel } from "@/components/dashboard/split-snapshot-panel";
import {
  ScoreDistribution,
  ScoreDistributionBar,
} from "@/components/dashboard/score-distribution";

import { BATCHES, type Batch } from "@/data/capacity-building";

export const Route = createFileRoute("/mt-batch-performance")({
  head: () => ({
    meta: [
      { title: "MT Batch Performance · Zilla Analytics" },
      {
        name: "description",
        content:
          "Live and historical MT batch performance: participation, assessment scores, score distribution, and process adherence.",
      },
    ],
  }),
  component: MTBatchPerformanceDashboard,
});

function MTBatchPerformanceDashboard() {
  const stats = useMemo(() => {
    const n = BATCHES.length;
    const avgScore =
      n === 0
        ? 0
        : Math.round(
            BATCHES.reduce(
              (s, b) => s + (b.day1AssessmentAvg + b.day2AssessmentAvg) / 2,
              0,
            ) / n,
          );
    const red = Math.round(BATCHES.reduce((s, b) => s + b.redPct, 0) / (n || 1));
    const orange = Math.round(
      BATCHES.reduce((s, b) => s + b.orangePct, 0) / (n || 1),
    );
    const green = Math.max(0, 100 - red - orange);
    const avgProcess =
      n === 0
        ? 0
        : Math.round(
            (BATCHES.reduce((s, b) => s + b.processAdherence, 0) / (n * 8)) *
              100,
          );
    return { n, avgScore, red, orange, green, avgProcess };
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
            left={
              <KpiGrid cols={4}>
                <KpiCard
                  title="Batches Conducted"
                  value={stats.n.toLocaleString("en-IN")}
                  accent="info"
                />
                <KpiCard
                  title="Average Score"
                  value={`${stats.avgScore}%`}
                  accent={stats.avgScore >= 80 ? "success" : "warning"}
                />
                <KpiCard
                  title="Score Distribution"
                  value={
                    <ScoreDistribution
                      red={stats.red}
                      orange={stats.orange}
                      green={stats.green}
                      size="md"
                    />
                  }
                  context={
                    <ScoreDistributionBar
                      red={stats.red}
                      orange={stats.orange}
                      green={stats.green}
                    />
                  }
                />
                <KpiCard
                  title="Average Process Score"
                  value={`${stats.avgProcess}%`}
                  accent={
                    stats.avgProcess >= 80
                      ? "success"
                      : stats.avgProcess >= 60
                        ? "warning"
                        : "critical"
                  }
                />
              </KpiGrid>
            }
            rightTitle={`Active Batches (${activeBatches.length})`}
            right={<ActiveBatchesList batches={activeBatches} />}
          />
        </Section>

        <Section
          title="Batch Summary"
          description="Operational-detail view of every batch — coaches, participation, scores, and process adherence."
        >
          <BatchTable rows={BATCHES} />
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
    <ul className="space-y-2.5 max-h-[280px] overflow-auto pr-1">
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

function BatchTable({ rows }: { rows: Batch[] }) {
  const columns: Column<Batch>[] = [
    {
      key: "id",
      header: "Batch ID",
      accessor: (r) => <span className="text-xs tabular-nums">{r.id}</span>,
      sortValue: (r) => r.id,
      exportValue: (r) => r.id,
    },
    {
      key: "name",
      header: "Batch Name",
      accessor: (r) => <span className="font-medium">{r.name}</span>,
      sortValue: (r) => r.name,
      exportValue: (r) => r.name,
    },
    {
      key: "c1id",
      header: "Coach 1 ID",
      accessor: (r) => <span className="text-xs tabular-nums">{r.coach1Id}</span>,
      exportValue: (r) => r.coach1Id,
    },
    {
      key: "c2id",
      header: "Coach 2 ID",
      accessor: (r) => <span className="text-xs tabular-nums">{r.coach2Id}</span>,
      exportValue: (r) => r.coach2Id,
    },
    {
      key: "c1",
      header: "Coach 1 Name",
      accessor: (r) => r.coach1Name,
      sortValue: (r) => r.coach1Name,
      exportValue: (r) => r.coach1Name,
    },
    {
      key: "c2",
      header: "Coach 2 Name",
      accessor: (r) => r.coach2Name,
      exportValue: (r) => r.coach2Name,
    },
    {
      key: "d1p",
      header: "Day 1 Part.",
      accessor: (r) => <span className="tabular-nums">{r.day1Participants}</span>,
      sortValue: (r) => r.day1Participants,
      exportValue: (r) => r.day1Participants,
      align: "right",
    },
    {
      key: "d2p",
      header: "Day 2 Part.",
      accessor: (r) => <span className="tabular-nums">{r.day2Participants}</span>,
      sortValue: (r) => r.day2Participants,
      exportValue: (r) => r.day2Participants,
      align: "right",
    },
    {
      key: "d1a",
      header: "Day 1 Avg.",
      accessor: (r) => <span className="tabular-nums">{r.day1AssessmentAvg}%</span>,
      sortValue: (r) => r.day1AssessmentAvg,
      exportValue: (r) => r.day1AssessmentAvg,
      align: "right",
    },
    {
      key: "d2a",
      header: "Day 2 Avg.",
      accessor: (r) => <span className="tabular-nums">{r.day2AssessmentAvg}%</span>,
      sortValue: (r) => r.day2AssessmentAvg,
      exportValue: (r) => r.day2AssessmentAvg,
      align: "right",
    },
    {
      key: "red",
      header: "Red %",
      accessor: (r) => <span className="tabular-nums text-critical">{r.redPct}%</span>,
      sortValue: (r) => r.redPct,
      exportValue: (r) => r.redPct,
      align: "right",
    },
    {
      key: "orange",
      header: "Orange %",
      accessor: (r) => (
        <span className="tabular-nums text-warning-foreground">{r.orangePct}%</span>
      ),
      sortValue: (r) => r.orangePct,
      exportValue: (r) => r.orangePct,
      align: "right",
    },
    {
      key: "green",
      header: "Green %",
      accessor: (r) => <span className="tabular-nums text-success">{r.greenPct}%</span>,
      sortValue: (r) => r.greenPct,
      exportValue: (r) => r.greenPct,
      align: "right",
    },
    {
      key: "adh",
      header: "Process Adherence",
      accessor: (r) => (
        <span className="tabular-nums font-medium">{r.processAdherence}/8</span>
      ),
      sortValue: (r) => r.processAdherence,
      exportValue: (r) => `${r.processAdherence}/8`,
      align: "right",
    },
  ];
  return (
    <DataTable
      data={rows}
      columns={columns}
      searchKeys={["id", "name", "coach1Name", "coach2Name", "district"]}
      pageSize={15}
      getRowId={(r) => r.id}
    />
  );
}
// SectionCard imported for future filter-panel additions
void SectionCard;
