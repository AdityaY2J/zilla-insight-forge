import { createFileRoute } from "@tanstack/react-router";

import { PageHeader } from "@/components/dashboard/page-header";
import { Section, SectionCard } from "@/components/dashboard/section";
import { MetricPanel } from "@/components/dashboard/metric-panel";
import { ColumnChart } from "@/components/dashboard/column-chart";
import { GroupedColumnChart } from "@/components/dashboard/grouped-column-chart";
import { DataTable, type Column } from "@/components/dashboard/data-table";
import { StatusPill } from "@/components/dashboard/status-pill";
import {
  PAST_14_DAYS,
  TODAY_BATCHES,
  TODAY_FLASHPOINT_SUMMARY,
  TODAY_SNAPSHOT,
  formatWatchlistDate,
  type WatchlistBatch,
} from "@/data/watchlist";

export const Route = createFileRoute("/todays-watchlist")({
  head: () => ({
    meta: [
      { title: "Today's Watchlist — Zilla Analytics" },
      {
        name: "description",
        content:
          "Live operational and learning watchlist for today's Zilla program batches: active geographies, flashpoints, and batch health.",
      },
      { property: "og:title", content: "Today's Watchlist — Zilla Analytics" },
      {
        property: "og:description",
        content: "Today's active batches, flashpoint summary, and batch health cards.",
      },
    ],
  }),
  component: TodaysWatchlist,
});

const pct = (value: number, total: number) =>
  total ? `${value} (${Math.round((value * 100) / total)}%)` : `${value} (0%)`;

const statusTone = (status: WatchlistBatch["status"]) =>
  status === "Critical" ? "critical" : status === "Moderate" ? "warning" : "success";

const learningTone = (score: number) => (score >= 80 ? "success" : "critical");

const cognitiveTone = (score: number) => (score >= 4 ? "success" : "critical");

const identityColumns: Column<WatchlistBatch>[] = [
  { key: "id", header: "Batch Id", accessor: (r) => <span className="text-xs tabular-nums">{r.id}</span>, sortValue: (r) => r.id, exportValue: (r) => r.id },
  { key: "name", header: "Batch Name", accessor: (r) => <span className="font-medium">{r.name}</span>, sortValue: (r) => r.name, exportValue: (r) => r.name },
  { key: "date", header: "Batch Date", accessor: (r) => formatWatchlistDate(r.date), sortValue: (r) => r.date, exportValue: (r) => formatWatchlistDate(r.date) },
  { key: "t1id", header: "Trainer 1 Id", accessor: (r) => <span className="text-xs tabular-nums">{r.trainer1.id}</span>, exportValue: (r) => r.trainer1.id },
  { key: "t1", header: "Trainer 1 Name", accessor: (r) => r.trainer1.name, sortValue: (r) => r.trainer1.name, exportValue: (r) => r.trainer1.name },
  { key: "t1p", header: "Trainer 1 Phone", accessor: (r) => <span className="tabular-nums">{r.trainer1.phone}</span>, exportValue: (r) => r.trainer1.phone },
  { key: "t2id", header: "Trainer 2 Id", accessor: (r) => <span className="text-xs tabular-nums">{r.trainer2?.id ?? "–"}</span>, exportValue: (r) => r.trainer2?.id ?? "" },
  { key: "t2", header: "Trainer 2 Name", accessor: (r) => r.trainer2?.name ?? "–", exportValue: (r) => r.trainer2?.name ?? "" },
  { key: "t2p", header: "Trainer 2 Phone", accessor: (r) => <span className="tabular-nums">{r.trainer2?.phone ?? "–"}</span>, exportValue: (r) => r.trainer2?.phone ?? "" },
  { key: "day", header: "Day", accessor: (r) => r.day, sortValue: (r) => r.day, exportValue: (r) => r.day },
];

function TodaysWatchlist() {
  const total = TODAY_FLASHPOINT_SUMMARY.total;

  const operationalColumns: Column<WatchlistBatch>[] = [
    ...identityColumns,
    {
      key: "fpCount",
      header: "No. Of Flashpoints",
      accessor: (r) => <span className="tabular-nums">{r.flashpoints.length}</span>,
      sortValue: (r) => r.flashpoints.length,
      exportValue: (r) => r.flashpoints.length,
      align: "right",
    },
    {
      key: "fpType",
      header: "Type Of Flashpoints",
      accessor: (r) => (
        <span className="text-xs text-muted-foreground">
          {r.flashpoints.length ? r.flashpoints.join(", ") : "–"}
        </span>
      ),
      exportValue: (r) => r.flashpoints.join(", "),
    },
    {
      key: "status",
      header: "Status",
      accessor: (r) => <StatusPill tone={statusTone(r.status)}>{r.status}</StatusPill>,
      sortValue: (r) => r.status,
      exportValue: (r) => r.status,
    },
  ];

  const learningColumns: Column<WatchlistBatch>[] = [
    ...identityColumns,
    {
      key: "score",
      header: "Avg. Learning Score",
      accessor: (r) => <span className="tabular-nums font-medium">{r.avgLearningScore}</span>,
      sortValue: (r) => r.avgLearningScore,
      exportValue: (r) => r.avgLearningScore,
      align: "right",
    },
    {
      key: "lstatus",
      header: "Status",
      accessor: (r) => (
        <StatusPill tone={learningTone(r.avgLearningScore)}>{r.avgLearningScore >= 80 ? "Meeting Benchmark" : "Below Benchmark"}</StatusPill>
      ),
      sortValue: (r) => r.avgLearningScore >= 80 ? "Meeting Benchmark" : "Below Benchmark",
      exportValue: (r) => r.avgLearningScore >= 80 ? "Meeting Benchmark" : "Below Benchmark",
    },
  ];

  const cognitiveColumns: Column<WatchlistBatch>[] = [
    ...identityColumns,
    {
      key: "cognitiveScore",
      header: "Avg. Cog. Post Score",
      accessor: (r) => <span className="tabular-nums font-medium">{r.avgCognitivePostScore.toFixed(1)} / 10</span>,
      sortValue: (r) => r.avgCognitivePostScore,
      exportValue: (r) => `${r.avgCognitivePostScore.toFixed(1)} / 10`,
      align: "right",
    },
    {
      key: "cognitiveStatus",
      header: "Status",
      accessor: (r) => (
        <StatusPill tone={cognitiveTone(r.avgCognitivePostScore)}>
          {r.avgCognitivePostScore >= 4 ? "Meets Benchmark" : "Below Benchmark"}
        </StatusPill>
      ),
      sortValue: (r) => r.avgCognitivePostScore >= 4 ? "Meets Benchmark" : "Below Benchmark",
      exportValue: (r) => r.avgCognitivePostScore >= 4 ? "Meets Benchmark" : "Below Benchmark",
    },
  ];

  return (
    <div className="pb-16">
      <PageHeader
        title="Today's Watchlist"
        description={`Live operational and learning view of batches scheduled today (${formatWatchlistDate(
          TODAY_BATCHES[0]?.date ?? "",
        )}).`}
      />
      <div className="px-8 pt-8 space-y-10">
        <Section title="Today's Snapshot">
          <div className="grid gap-4 lg:grid-cols-2">
            <MetricPanel
              title="Today's Snapshot"
              groups={[
                {
                  items: [
                    { label: "Active Divisions", value: TODAY_SNAPSHOT.activeDivisions },
                    { label: "Active Districts", value: TODAY_SNAPSHOT.activeDistricts },
                    { label: "Active Talukas", value: TODAY_SNAPSHOT.activeTalukas },
                    { label: "Active Day 1 Batches", value: TODAY_SNAPSHOT.activeDay1Batches },
                    { label: "Active Day 2 Batches", value: TODAY_SNAPSHOT.activeDay2Batches },
                    { label: "Active Master Trainers", value: TODAY_SNAPSHOT.activeMasterTrainers },
                  ],
                },
              ]}
            />
            <MetricPanel
              title="Participant & Trainer Snapshot"
              groups={[
                {
                  items: [
                    { label: "No. of First-time Trainers", value: TODAY_SNAPSHOT.firstTimeTrainers },
                    { label: "No. of Day 1 Participants", value: TODAY_SNAPSHOT.day1Participants },
                    { label: "No. of Day 2 Participants", value: TODAY_SNAPSHOT.day2Participants },
                  ],
                },
              ]}
            />
          </div>
        </Section>

        <Section title="Registration & Assessment Trend (past 14 days)">
          <div className="grid gap-4 lg:grid-cols-2">
            <SectionCard>
              <h3 className="text-sm font-semibold mb-4">Daily Registrations (last 14 days)</h3>
              <ColumnChart
                data={PAST_14_DAYS.map((d) => ({
                  label: d.label,
                  value: d.registrations,
                  labelText: String(d.registrations),
                }))}
                yFormat={(v) => String(v)}
                labelFormat={(v) => String(v)}
                yAxisTitle="No. of Registrations"
                barMaxWidth={16}
                alternateXAxisLabels
                rotateXAxisLabels
              />
            </SectionCard>
            <SectionCard>
              <h3 className="text-sm font-semibold mb-4">Daily Assessment Submissions (last 14 days)</h3>
              <GroupedColumnChart
                data={PAST_14_DAYS.map((d) => ({
                  label: d.label,
                  values: [d.day1Submissions, d.day2Submissions],
                }))}
                series={[
                  { name: "Day 1", color: "var(--primary)" },
                  { name: "Day 2", color: "var(--success)" },
                ]}
                yAxisTitle="No. of Assessment Submissions"
                barMaxWidth={6}
                alternateXAxisLabels
                rotateXAxisLabels
              />
            </SectionCard>
          </div>
        </Section>

        <Section title={`Today's Flashpoint Summary (based on ${total} active batches)`}>
          <div className="grid gap-4 lg:grid-cols-2">
            <MetricPanel
              title="Operational Flashpoint Summary"
              groups={[
                {
                  items: TODAY_FLASHPOINT_SUMMARY.operational.map((m) => ({
                    label: m.label,
                    value: pct(m.value, total),
                  })),
                },
              ]}
            />
            <MetricPanel
              title="Learning Flashpoint Summary"
              groups={[
                {
                  items: TODAY_FLASHPOINT_SUMMARY.learning.map((m) => ({
                    label: m.label,
                    value: pct(m.value, total),
                  })),
                },
              ]}
            />
          </div>
        </Section>

        <Section title="Operational Health Card">
          <DataTable
            data={[...TODAY_BATCHES].sort((a, b) => ({ Critical: 0, Moderate: 1, Healthy: 2 }[a.status] - { Critical: 0, Moderate: 1, Healthy: 2 }[b.status]))}
            columns={operationalColumns}
            headerCase="normal"
            searchKeys={["id", "name", "district"]}
            pageSize={15}
            getRowId={(r) => `op-${r.id}`}
          />
        </Section>

        <Section title="Learning Health Card">
          <DataTable
            data={[...TODAY_BATCHES].sort((a, b) => (a.avgLearningScore < 80 ? 0 : 1) - (b.avgLearningScore < 80 ? 0 : 1))}
            columns={learningColumns}
            headerCase="normal"
            searchKeys={["id", "name", "district"]}
            pageSize={15}
            getRowId={(r) => `ln-${r.id}`}
          />
        </Section>

        <Section title="Cognitive Health Card">
          <DataTable
            data={[...TODAY_BATCHES].sort((a, b) => (a.avgCognitivePostScore < 4 ? 0 : 1) - (b.avgCognitivePostScore < 4 ? 0 : 1))}
            columns={cognitiveColumns}
            headerCase="normal"
            searchKeys={["id", "name", "district"]}
            pageSize={15}
            getRowId={(r) => `cg-${r.id}`}
          />
        </Section>
      </div>
    </div>
  );
}
