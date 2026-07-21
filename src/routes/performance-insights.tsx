import { useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AlertTriangle, TrendingDown, Users } from "lucide-react";

import { PageHeader } from "@/components/dashboard/page-header";
import { Section, SectionCard } from "@/components/dashboard/section";
import { KpiCard, KpiGrid } from "@/components/dashboard/kpi-card";
import { StatusPill, type StatusTone } from "@/components/dashboard/status-pill";
import { DataTable, type Column } from "@/components/dashboard/data-table";
import { PlaceholderMetric } from "@/components/dashboard/placeholder-metric";

import { DISTRICT_INSIGHTS, type DistrictInsight } from "@/data/insights";
import { TRAINER_RECORDS, type TrainerRecord } from "@/data/trainer-performance";
import { BATCHES, type Batch } from "@/data/batches";
import { STUDENTS } from "@/data/students";

export const Route = createFileRoute("/performance-insights")({
  head: () => ({
    meta: [
      { title: "Performance Insights · Zilla Analytics" },
      {
        name: "description",
        content:
          "Identify operational areas requiring intervention during Deployment Rollout — underperforming geographies, trainers, and batches.",
      },
    ],
  }),
  component: PerformanceInsightsDashboard,
});

function PerformanceInsightsDashboard() {
  const underperformingDistricts = useMemo(
    () =>
      [...DISTRICT_INSIGHTS]
        .filter((d) => d.batchesCompleted > 0)
        .sort((a, b) => a.certificationRate - b.certificationRate)
        .slice(0, 8),
    [],
  );

  const underperformingTrainers = useMemo(
    () =>
      [...TRAINER_RECORDS]
        .filter((t) => t.studentsTrained >= 10)
        .sort((a, b) => a.certificationRate - b.certificationRate)
        .slice(0, 10),
    [],
  );

  const flaggedBatches = useMemo(() => {
    const completedDR = BATCHES.filter(
      (b) => b.type === "Deployment Rollout" && b.status === "Completed",
    );
    // Flag: low attendance OR low certification rate
    return completedDR
      .map((b) => {
        const students = STUDENTS.filter((s) => s.batchCode === b.code);
        const trained = students.filter(
          (s) => s.status !== "Enrolled" && s.status !== "Dropped Out",
        ).length;
        const cert = students.filter((s) => s.status === "Certified").length;
        const rate = trained > 0 ? Math.round((cert / trained) * 1000) / 10 : 0;
        const attRate =
          b.plannedParticipants > 0
            ? Math.round((b.attendedParticipants / b.plannedParticipants) * 1000) / 10
            : 0;
        return { batch: b, certRate: rate, attRate };
      })
      .filter((r) => r.certRate < 50 || r.attRate < 70)
      .sort((a, b) => a.certRate - b.certRate)
      .slice(0, 12);
  }, []);

  const totals = useMemo(() => {
    const districtsAtRisk = DISTRICT_INSIGHTS.filter(
      (d) => d.batchesCompleted > 0 && d.certificationRate < 60,
    ).length;
    const trainersAtRisk = TRAINER_RECORDS.filter(
      (t) => t.studentsTrained >= 10 && t.certificationRate < 55,
    ).length;
    return {
      districtsAtRisk,
      trainersAtRisk,
      batchesFlagged: flaggedBatches.length,
    };
  }, [flaggedBatches.length]);

  return (
    <div className="pb-16">
      <PageHeader
        title="Performance Insights"
        description="Identify geographies, trainers, and batches that need intervention. All insights are computed from completed Deployment Rollout data."
      />
      <div className="px-8 pt-8 space-y-10">
        <Section title="Areas Requiring Attention">
          <KpiGrid cols={3}>
            <KpiCard
              title="Districts At Risk"
              value={totals.districtsAtRisk.toString()}
              context="Certification rate < 60%"
              accent={totals.districtsAtRisk > 0 ? "critical" : "success"}
            />
            <KpiCard
              title="Trainers At Risk"
              value={totals.trainersAtRisk.toString()}
              context="Certification rate < 55%"
              accent={totals.trainersAtRisk > 0 ? "warning" : "success"}
            />
            <KpiCard
              title="Flagged Batches"
              value={totals.batchesFlagged.toString()}
              context="Low attendance or low certification"
              accent={totals.batchesFlagged > 0 ? "warning" : "success"}
            />
          </KpiGrid>
        </Section>

        <Section
          title="Underperforming Districts"
          description="Districts ranked by certification rate (lowest first) among those with completed batches."
          actions={<InsightBadge icon={TrendingDown} label="Bottom performers" />}
        >
          <DistrictTable rows={underperformingDistricts} />
        </Section>

        <Section
          title="Underperforming Trainers"
          description="Master Trainers with the lowest certification rates (minimum 10 students trained)."
          actions={<InsightBadge icon={Users} label="Requires coaching" />}
        >
          <TrainerInsightTable rows={underperformingTrainers} />
        </Section>

        <Section
          title="Flagged Batches"
          description="Completed batches where attendance was below 70% or certification below 50%."
          actions={<InsightBadge icon={AlertTriangle} label="Needs review" />}
        >
          <FlaggedBatchTable rows={flaggedBatches} />
        </Section>

        <Section
          title="Flashpoints"
          description="High-priority intersections requiring immediate attention (composite metric)."
        >
          <SectionCard>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <PlaceholderMetric label="Flashpoints" />
              <span>
                Flashpoint scoring combines district, trainer, and batch signals.
                Detection logic is pending finalization; the surface is ready to
                receive scored rows once the model is defined.
              </span>
            </div>
          </SectionCard>
        </Section>
      </div>
    </div>
  );
}

function InsightBadge({
  icon: Icon,
  label,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-md bg-muted px-2 py-1 text-xs font-medium text-muted-foreground">
      <Icon className="h-3.5 w-3.5" />
      {label}
    </span>
  );
}

function rateTone(rate: number): StatusTone {
  if (rate >= 70) return "success";
  if (rate >= 50) return "warning";
  return "critical";
}

function DistrictTable({ rows }: { rows: DistrictInsight[] }) {
  const columns: Column<DistrictInsight>[] = [
    {
      key: "district",
      header: "District",
      accessor: (r) => (
        <div className="flex flex-col">
          <span className="font-medium text-foreground">{r.district}</span>
          <span className="text-xs text-muted-foreground">{r.division}</span>
        </div>
      ),
      sortValue: (r) => r.district,
      exportValue: (r) => r.district,
    },
    {
      key: "batches",
      header: "Batches Completed",
      accessor: (r) => <span className="tabular-nums">{r.batchesCompleted}</span>,
      sortValue: (r) => r.batchesCompleted,
      exportValue: (r) => r.batchesCompleted,
      align: "right",
    },
    {
      key: "trained",
      header: "Students Trained",
      accessor: (r) => <span className="tabular-nums">{r.studentsTrained}</span>,
      sortValue: (r) => r.studentsTrained,
      exportValue: (r) => r.studentsTrained,
      align: "right",
    },
    {
      key: "attendance",
      header: "Attendance",
      accessor: (r) => <span className="tabular-nums">{r.attendanceRate}%</span>,
      sortValue: (r) => r.attendanceRate,
      exportValue: (r) => r.attendanceRate,
      align: "right",
    },
    {
      key: "dropout",
      header: "Dropout",
      accessor: (r) => <span className="tabular-nums">{r.dropoutRate}%</span>,
      sortValue: (r) => r.dropoutRate,
      exportValue: (r) => r.dropoutRate,
      align: "right",
    },
    {
      key: "rate",
      header: "Certification Rate",
      accessor: (r) => (
        <StatusPill tone={rateTone(r.certificationRate)}>
          {r.certificationRate}%
        </StatusPill>
      ),
      sortValue: (r) => r.certificationRate,
      exportValue: (r) => r.certificationRate,
      align: "right",
    },
  ];
  return (
    <DataTable
      data={rows}
      columns={columns}
      searchable={false}
      pageSize={10}
      getRowId={(r) => r.key}
    />
  );
}

function TrainerInsightTable({ rows }: { rows: TrainerRecord[] }) {
  const columns: Column<TrainerRecord>[] = [
    {
      key: "name",
      header: "Trainer",
      accessor: (r) => (
        <div className="flex flex-col">
          <span className="font-medium text-foreground">{r.name}</span>
          <span className="text-xs text-muted-foreground">
            {r.department} · {r.district}
          </span>
        </div>
      ),
      sortValue: (r) => r.name,
      exportValue: (r) => r.name,
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
      header: "Students",
      accessor: (r) => <span className="tabular-nums">{r.studentsTrained}</span>,
      sortValue: (r) => r.studentsTrained,
      exportValue: (r) => r.studentsTrained,
      align: "right",
    },
    {
      key: "attendance",
      header: "Avg Attendance",
      accessor: (r) => <span className="tabular-nums">{r.avgAttendancePct}%</span>,
      sortValue: (r) => r.avgAttendancePct,
      exportValue: (r) => r.avgAttendancePct,
      align: "right",
    },
    {
      key: "rate",
      header: "Certification Rate",
      accessor: (r) => (
        <StatusPill tone={rateTone(r.certificationRate)}>
          {r.certificationRate}%
        </StatusPill>
      ),
      sortValue: (r) => r.certificationRate,
      exportValue: (r) => r.certificationRate,
      align: "right",
    },
  ];
  return (
    <DataTable
      data={rows}
      columns={columns}
      searchable={false}
      pageSize={10}
      getRowId={(r) => r.id}
    />
  );
}

function FlaggedBatchTable({
  rows,
}: {
  rows: Array<{ batch: Batch; certRate: number; attRate: number }>;
}) {
  const columns: Column<(typeof rows)[number]>[] = [
    {
      key: "code",
      header: "Batch",
      accessor: (r) => (
        <div className="flex flex-col">
          <span className="font-medium text-foreground">{r.batch.code}</span>
          <span className="text-xs text-muted-foreground">
            {r.batch.taluka}, {r.batch.district}
          </span>
        </div>
      ),
      sortValue: (r) => r.batch.code,
      exportValue: (r) => r.batch.code,
    },
    {
      key: "trainer",
      header: "Trainer",
      accessor: (r) => r.batch.trainerName,
      sortValue: (r) => r.batch.trainerName,
      exportValue: (r) => r.batch.trainerName,
    },
    {
      key: "dates",
      header: "Ended",
      accessor: (r) => (
        <span className="text-sm text-muted-foreground tabular-nums">
          {r.batch.endDate}
        </span>
      ),
      sortValue: (r) => r.batch.endDate,
      exportValue: (r) => r.batch.endDate,
    },
    {
      key: "attendance",
      header: "Attendance",
      accessor: (r) => (
        <StatusPill tone={rateTone(r.attRate)}>{r.attRate}%</StatusPill>
      ),
      sortValue: (r) => r.attRate,
      exportValue: (r) => r.attRate,
      align: "right",
    },
    {
      key: "cert",
      header: "Certification",
      accessor: (r) => (
        <StatusPill tone={rateTone(r.certRate)}>{r.certRate}%</StatusPill>
      ),
      sortValue: (r) => r.certRate,
      exportValue: (r) => r.certRate,
      align: "right",
    },
  ];
  return (
    <DataTable
      data={rows}
      columns={columns}
      searchable={false}
      pageSize={10}
      getRowId={(r) => r.batch.id}
    />
  );
}
