import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";

import { PageHeader } from "@/components/dashboard/page-header";
import { Section, SectionCard } from "@/components/dashboard/section";
import { KpiCard, KpiGrid } from "@/components/dashboard/kpi-card";
import { StatusPill, type StatusTone } from "@/components/dashboard/status-pill";
import { DataTable, type Column } from "@/components/dashboard/data-table";
import { FilterSelect } from "@/components/dashboard/filter-bar";
import { PlaceholderMetric } from "@/components/dashboard/placeholder-metric";

import { TRAINER_RECORDS, type TrainerRecord } from "@/data/trainer-performance";
import { BATCHES } from "@/data/batches";
import { DIVISIONS } from "@/data/geography";

export const Route = createFileRoute("/trainer-performance")({
  head: () => ({
    meta: [
      { title: "Trainer Performance · Zilla Analytics" },
      {
        name: "description",
        content:
          "Performance and utilization of Master Trainers during Deployment Rollout: top performers, performance distribution, and individual trainer profiles.",
      },
    ],
  }),
  component: TrainerPerformanceDashboard,
});

function rateBand(rate: number): "high" | "mid" | "low" {
  if (rate >= 75) return "high";
  if (rate >= 55) return "mid";
  return "low";
}
const BAND_TONE: Record<"high" | "mid" | "low", StatusTone> = {
  high: "success",
  mid: "warning",
  low: "critical",
};

function TrainerPerformanceDashboard() {
  const [division, setDivision] = useState<string>("All");
  const filtered = useMemo(
    () =>
      TRAINER_RECORDS.filter((t) =>
        division === "All" ? true : t.division === division,
      ),
    [division],
  );

  const summary = useMemo(() => {
    const total = filtered.length;
    const totalBatches = filtered.reduce((s, t) => s + t.batchesConducted, 0);
    const totalStudents = filtered.reduce((s, t) => s + t.studentsTrained, 0);
    const rates = filtered
      .map((t) => t.certificationRate)
      .filter((r) => !Number.isNaN(r));
    const avgRate =
      rates.length > 0
        ? Math.round((rates.reduce((a, b) => a + b, 0) / rates.length) * 10) /
          10
        : 0;
    return { total, totalBatches, totalStudents, avgRate };
  }, [filtered]);

  const distribution = useMemo(() => {
    let high = 0;
    let mid = 0;
    let low = 0;
    for (const t of filtered) {
      const b = rateBand(t.certificationRate);
      if (b === "high") high++;
      else if (b === "mid") mid++;
      else low++;
    }
    return { high, mid, low };
  }, [filtered]);

  const topPerformers = useMemo(
    () =>
      [...filtered]
        .filter((t) => t.studentsTrained >= 20)
        .sort((a, b) => b.certificationRate - a.certificationRate)
        .slice(0, 10),
    [filtered],
  );

  return (
    <div className="pb-16">
      <PageHeader
        title="Trainer Performance"
        description="Performance and utilization of Master Trainers during Deployment Rollout. Identify top performers and trainers requiring additional support."
        filters={
          <FilterSelect
            label="Division"
            value={division}
            onChange={setDivision}
            options={[
              { label: "All Divisions", value: "All" },
              ...DIVISIONS.map((d) => ({ label: d, value: d })),
            ]}
          />
        }
      />
      <div className="px-8 pt-8 space-y-10">
        <Section title="Snapshot KPIs">
          <KpiGrid>
            <KpiCard
              title="Active Trainers"
              value={summary.total.toLocaleString("en-IN")}
              context="Trainers with at least one completed batch"
              accent="info"
            />
            <KpiCard
              title="Batches Conducted"
              value={summary.totalBatches.toLocaleString("en-IN")}
              accent="info"
            />
            <KpiCard
              title="Students Trained"
              value={summary.totalStudents.toLocaleString("en-IN")}
              accent="info"
            />
            <KpiCard
              title="Avg Certification Rate"
              value={`${summary.avgRate}%`}
              context="Weighted equally per trainer"
              accent={
                summary.avgRate >= 70
                  ? "success"
                  : summary.avgRate >= 55
                    ? "warning"
                    : "critical"
              }
            />
          </KpiGrid>
        </Section>

        <Section
          title="Performance Distribution"
          description="Distribution of trainers by certification rate band. Low performers need review."
        >
          <SectionCard>
            <DistributionBars distribution={distribution} total={summary.total} />
          </SectionCard>
        </Section>

        <Section
          title="Top Performers"
          description="Highest-certifying trainers (minimum 20 students trained)."
        >
          <TrainerTable rows={topPerformers} rowIdPrefix="top" />
        </Section>

        <Section
          title="Trainer Directory"
          description="All active Master Trainers. Click through to see the batches they have conducted."
        >
          <TrainerTable rows={filtered} rowIdPrefix="all" showDrilldown />
        </Section>
      </div>
    </div>
  );
}

function DistributionBars({
  distribution,
  total,
}: {
  distribution: { high: number; mid: number; low: number };
  total: number;
}) {
  const rows: Array<{ label: string; count: number; tone: StatusTone; desc: string }> = [
    {
      label: "High Performers",
      count: distribution.high,
      tone: "success",
      desc: "Certification rate ≥ 75%",
    },
    {
      label: "Mid Performers",
      count: distribution.mid,
      tone: "warning",
      desc: "Certification rate 55–74%",
    },
    {
      label: "Low Performers",
      count: distribution.low,
      tone: "critical",
      desc: "Certification rate < 55%",
    },
  ];
  const max = Math.max(1, ...rows.map((r) => r.count));
  return (
    <div className="space-y-3">
      {rows.map((r) => {
        const pct = Math.round((r.count / max) * 100);
        const share = total > 0 ? Math.round((r.count / total) * 1000) / 10 : 0;
        return (
          <div
            key={r.label}
            className="grid grid-cols-[220px_1fr_auto] gap-4 items-center"
          >
            <div>
              <div className="text-sm font-medium text-foreground">{r.label}</div>
              <div className="text-xs text-muted-foreground">{r.desc}</div>
            </div>
            <div className="relative h-8 rounded-md bg-muted/50 overflow-hidden">
              <div
                className={
                  "absolute inset-y-0 left-0 rounded-md flex items-center px-3 text-sm font-medium text-primary-foreground " +
                  (r.tone === "success"
                    ? "bg-success"
                    : r.tone === "warning"
                      ? "bg-warning"
                      : "bg-critical")
                }
                style={{ width: `${Math.max(4, pct)}%` }}
              >
                <span className="tabular-nums">{r.count}</span>
              </div>
            </div>
            <div className="text-xs text-muted-foreground tabular-nums w-16 text-right">
              {share}%
            </div>
          </div>
        );
      })}
    </div>
  );
}

function TrainerTable({
  rows,
  rowIdPrefix,
  showDrilldown = false,
}: {
  rows: TrainerRecord[];
  rowIdPrefix: string;
  showDrilldown?: boolean;
}) {
  const [selected, setSelected] = useState<TrainerRecord | null>(null);
  const columns: Column<TrainerRecord>[] = [
    {
      key: "name",
      header: "Trainer",
      accessor: (r) => (
        <div className="flex flex-col">
          <span className="font-medium text-foreground">{r.name}</span>
          <span className="text-xs text-muted-foreground">
            {r.designation} · {r.department}
          </span>
        </div>
      ),
      sortValue: (r) => r.name,
      exportValue: (r) => r.name,
    },
    {
      key: "location",
      header: "Location",
      accessor: (r) => (
        <span className="text-sm text-muted-foreground">
          {r.district}, {r.division}
        </span>
      ),
      sortValue: (r) => r.division,
      exportValue: (r) => `${r.district}, ${r.division}`,
    },
    {
      key: "batches",
      header: "Batches",
      accessor: (r) => <span className="tabular-nums">{r.batchesConducted}</span>,
      sortValue: (r) => r.batchesConducted,
      exportValue: (r) => r.batchesConducted,
      align: "right",
    },
    {
      key: "students",
      header: "Students Trained",
      accessor: (r) => <span className="tabular-nums">{r.studentsTrained}</span>,
      sortValue: (r) => r.studentsTrained,
      exportValue: (r) => r.studentsTrained,
      align: "right",
    },
    {
      key: "attendance",
      header: "Avg Attendance",
      accessor: (r) => (
        <span className="tabular-nums">{r.avgAttendancePct}%</span>
      ),
      sortValue: (r) => r.avgAttendancePct,
      exportValue: (r) => r.avgAttendancePct,
      align: "right",
    },
    {
      key: "rate",
      header: "Certification Rate",
      accessor: (r) => (
        <StatusPill tone={BAND_TONE[rateBand(r.certificationRate)]}>
          {r.certificationRate}%
        </StatusPill>
      ),
      sortValue: (r) => r.certificationRate,
      exportValue: (r) => r.certificationRate,
      align: "right",
    },
    {
      key: "overall",
      header: "Overall Score",
      accessor: () => <PlaceholderMetric />,
      exportValue: () => "pending",
    },
  ];
  if (showDrilldown) {
    columns.push({
      key: "drill",
      header: "",
      accessor: (r) => (
        <button
          type="button"
          onClick={() => setSelected(r)}
          className="text-xs font-medium text-primary hover:underline"
        >
          View batches
        </button>
      ),
      exportValue: () => "",
      align: "right",
    });
  }
  return (
    <>
      <DataTable
        data={rows}
        columns={columns}
        searchKeys={["name", "department", "district", "division"]}
        pageSize={12}
        getRowId={(r, i) => `${rowIdPrefix}-${r.id}-${i}`}
      />
      {selected ? (
        <TrainerBatchesDrawer
          trainer={selected}
          onClose={() => setSelected(null)}
        />
      ) : null}
    </>
  );
}

function TrainerBatchesDrawer({
  trainer,
  onClose,
}: {
  trainer: TrainerRecord;
  onClose: () => void;
}) {
  const batches = useMemo(
    () =>
      BATCHES.filter(
        (b) => b.trainerId === trainer.id && b.type === "Deployment Rollout",
      ),
    [trainer.id],
  );
  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button
        type="button"
        className="absolute inset-0 bg-foreground/20"
        onClick={onClose}
        aria-label="Close"
      />
      <div className="relative w-full max-w-2xl bg-background border-l h-full overflow-y-auto">
        <div className="border-b px-6 py-4 flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              {trainer.name}
            </h2>
            <p className="text-sm text-muted-foreground">
              {trainer.designation} · {trainer.department} · {trainer.district}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Close
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <MiniStat label="Batches" value={trainer.batchesConducted} />
            <MiniStat label="Students" value={trainer.studentsTrained} />
            <MiniStat
              label="Cert Rate"
              value={`${trainer.certificationRate}%`}
            />
          </div>
          <div className="rounded-lg border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 text-left font-medium">Batch</th>
                  <th className="px-3 py-2 text-left font-medium">Dates</th>
                  <th className="px-3 py-2 text-right font-medium">Attended</th>
                  <th className="px-3 py-2 text-left font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {batches.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-3 py-8 text-center text-sm text-muted-foreground"
                    >
                      No Deployment Rollout batches recorded.
                    </td>
                  </tr>
                ) : (
                  batches.map((b) => (
                    <tr key={b.id} className="border-t">
                      <td className="px-3 py-2 font-medium">{b.code}</td>
                      <td className="px-3 py-2 text-muted-foreground tabular-nums">
                        {b.startDate}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums">
                        {b.attendedParticipants}/{b.plannedParticipants}
                      </td>
                      <td className="px-3 py-2">{b.status}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-md border bg-card p-3">
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-medium">
        {label}
      </p>
      <p className="mt-1 text-xl font-semibold tabular-nums">{value}</p>
    </div>
  );
}
