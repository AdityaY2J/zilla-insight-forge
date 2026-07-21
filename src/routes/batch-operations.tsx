import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";

import { PageHeader } from "@/components/dashboard/page-header";
import { Section } from "@/components/dashboard/section";
import { KpiCard, KpiGrid } from "@/components/dashboard/kpi-card";
import { StatusPill, type StatusTone } from "@/components/dashboard/status-pill";
import { DataTable, type Column } from "@/components/dashboard/data-table";
import { FilterSelect } from "@/components/dashboard/filter-bar";
import { PlaceholderMetric } from "@/components/dashboard/placeholder-metric";
import {
  HierarchicalBreakdownTable,
  type HierRow,
} from "@/components/dashboard/hierarchical-breakdown-table";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

import {
  BATCHES,
  batchSummary,
  type Batch,
  type BatchStatus,
  type BatchType,
} from "@/data/batches";
import { DIVISIONS } from "@/data/geography";

export const Route = createFileRoute("/batch-operations")({
  head: () => ({
    meta: [
      { title: "Batch Operations · Zilla Analytics" },
      {
        name: "description",
        content:
          "Unified operational view of all training batches. Toggle between Capacity Building and Deployment Rollout via the Batch Type filter.",
      },
    ],
  }),
  component: BatchOperationsDashboard,
});

const STATUS_TONE: Record<BatchStatus, StatusTone> = {
  Planned: "neutral",
  Scheduled: "info",
  "In Progress": "warning",
  Completed: "success",
  Cancelled: "critical",
};

function BatchOperationsDashboard() {
  const [batchType, setBatchType] = useState<BatchType | "All">("All");
  const [division, setDivision] = useState<string>("All");
  const [status, setStatus] = useState<BatchStatus | "All">("All");

  const filtered = useMemo(() => {
    return BATCHES.filter((b) => {
      if (batchType !== "All" && b.type !== batchType) return false;
      if (division !== "All" && b.division !== division) return false;
      if (status !== "All" && b.status !== status) return false;
      return true;
    });
  }, [batchType, division, status]);

  const s = useMemo(() => batchSummary(filtered), [filtered]);

  return (
    <div className="pb-16">
      <PageHeader
        title="Batch Operations"
        description="Operational visibility into every training batch across the program. Switch the Batch Type filter to move between Capacity Building and Deployment Rollout."
        filters={
          <>
            <FilterSelect
              label="Batch Type"
              value={batchType}
              onChange={(v) => setBatchType(v as BatchType | "All")}
              options={[
                { label: "All Types", value: "All" },
                { label: "Capacity Building", value: "Capacity Building" },
                { label: "Deployment Rollout", value: "Deployment Rollout" },
              ]}
              width={220}
            />
            <FilterSelect
              label="Division"
              value={division}
              onChange={setDivision}
              options={[
                { label: "All Divisions", value: "All" },
                ...DIVISIONS.map((d) => ({ label: d, value: d })),
              ]}
            />
            <FilterSelect
              label="Status"
              value={status}
              onChange={(v) => setStatus(v as BatchStatus | "All")}
              options={[
                { label: "All Statuses", value: "All" },
                { label: "Planned", value: "Planned" },
                { label: "Scheduled", value: "Scheduled" },
                { label: "In Progress", value: "In Progress" },
                { label: "Completed", value: "Completed" },
                { label: "Cancelled", value: "Cancelled" },
              ]}
            />
          </>
        }
      />
      <div className="px-8 pt-8 space-y-10">
        <Section title="Snapshot KPIs">
          <KpiGrid cols={5}>
            <KpiCard
              title="Total Batches"
              value={s.total.toLocaleString("en-IN")}
              context="Matching current filters"
              accent="info"
            />
            <KpiCard
              title="Completed"
              value={s.completed.toLocaleString("en-IN")}
              accent="success"
            />
            <KpiCard
              title="In Progress"
              value={s.inProgress.toLocaleString("en-IN")}
              accent="warning"
            />
            <KpiCard
              title="Upcoming"
              value={s.scheduled.toLocaleString("en-IN")}
              context="Planned + Scheduled"
              accent="info"
            />
            <KpiCard
              title="Attendance Rate"
              value={`${s.attendanceRate}%`}
              context="Attended / Planned participants"
              accent={
                s.attendanceRate >= 85
                  ? "success"
                  : s.attendanceRate >= 70
                    ? "warning"
                    : "critical"
              }
            />
          </KpiGrid>
        </Section>

        <Section
          title="Batch Performance Breakdown"
          description="Compare batch throughput and attendance across dimensions."
        >
          <Tabs defaultValue="geography">
            <TabsList>
              <TabsTrigger value="geography">Geography</TabsTrigger>
              <TabsTrigger value="status">Status</TabsTrigger>
            </TabsList>
            <TabsContent value="geography" className="mt-4">
              <GeographyBreakdown rows={filtered} />
            </TabsContent>
            <TabsContent value="status" className="mt-4">
              <StatusBreakdown rows={filtered} />
            </TabsContent>
          </Tabs>
        </Section>

        <Section
          title="Batch Directory"
          description="Every batch matching the current filters. Search across code, trainer, taluka, or venue."
        >
          <BatchDirectory rows={filtered} />
        </Section>
      </div>
    </div>
  );
}

function aggCells(rows: Batch[]) {
  const total = rows.length;
  const completed = rows.filter((r) => r.status === "Completed").length;
  const inProgress = rows.filter((r) => r.status === "In Progress").length;
  const upcoming = rows.filter(
    (r) => r.status === "Planned" || r.status === "Scheduled",
  ).length;
  const planned = rows.reduce((s, r) => s + r.plannedParticipants, 0);
  const attended = rows.reduce((s, r) => s + r.attendedParticipants, 0);
  const attRate =
    planned > 0 ? Math.round((attended / planned) * 1000) / 10 : 0;
  const tone: StatusTone =
    attRate >= 85 ? "success" : attRate >= 70 ? "warning" : "critical";
  return [
    total,
    completed,
    inProgress,
    upcoming,
    <StatusPill key="r" tone={tone}>
      {attRate}%
    </StatusPill>,
  ];
}

const BATCH_COLS = [
  { header: "Total", align: "right" as const },
  { header: "Completed", align: "right" as const },
  { header: "In Progress", align: "right" as const },
  { header: "Upcoming", align: "right" as const },
  { header: "Attendance", align: "right" as const },
];

function GeographyBreakdown({ rows }: { rows: Batch[] }) {
  const hier = useMemo<HierRow[]>(() => {
    const byDiv = new Map<string, Batch[]>();
    for (const r of rows) {
      const arr = byDiv.get(r.division) ?? [];
      arr.push(r);
      byDiv.set(r.division, arr);
    }
    return Array.from(byDiv.entries()).map(([division, divRows]) => {
      const byDist = new Map<string, Batch[]>();
      for (const r of divRows) {
        const arr = byDist.get(r.district) ?? [];
        arr.push(r);
        byDist.set(r.district, arr);
      }
      const distRows = Array.from(byDist.entries()).map(([district, dRows]) => ({
        key: `${division}/${district}`,
        label: district,
        values: aggCells(dRows),
      }));
      return {
        key: division,
        label: division,
        values: aggCells(divRows),
        children: distRows,
      };
    });
  }, [rows]);
  return (
    <HierarchicalBreakdownTable
      rows={hier}
      firstColHeader="Geography (Division → District)"
      columns={BATCH_COLS}
    />
  );
}

function StatusBreakdown({ rows }: { rows: Batch[] }) {
  const statuses: BatchStatus[] = [
    "Planned",
    "Scheduled",
    "In Progress",
    "Completed",
    "Cancelled",
  ];
  const hier = useMemo<HierRow[]>(
    () =>
      statuses.map((st) => {
        const dRows = rows.filter((r) => r.status === st);
        const planned = dRows.reduce((s, r) => s + r.plannedParticipants, 0);
        const enrolled = dRows.reduce((s, r) => s + r.enrolledParticipants, 0);
        const attended = dRows.reduce((s, r) => s + r.attendedParticipants, 0);
        return {
          key: st,
          label: st,
          values: [
            dRows.length,
            planned,
            enrolled,
            attended,
            <StatusPill key="t" tone={STATUS_TONE[st]}>
              {st}
            </StatusPill>,
          ],
        };
      }),
    [rows],
  );
  return (
    <HierarchicalBreakdownTable
      rows={hier}
      firstColHeader="Status"
      columns={[
        { header: "Batches", align: "right" },
        { header: "Planned Participants", align: "right" },
        { header: "Enrolled", align: "right" },
        { header: "Attended", align: "right" },
        { header: "Status", align: "left" },
      ]}
      allowExpand={false}
    />
  );
}

function BatchDirectory({ rows }: { rows: Batch[] }) {
  const columns: Column<Batch>[] = [
    {
      key: "code",
      header: "Batch",
      accessor: (r) => (
        <div className="flex flex-col">
          <span className="font-medium text-foreground">{r.code}</span>
          <span className="text-xs text-muted-foreground">{r.type}</span>
        </div>
      ),
      sortValue: (r) => r.code,
      exportValue: (r) => r.code,
    },
    {
      key: "when",
      header: "Dates",
      accessor: (r) => (
        <span className="text-sm text-muted-foreground tabular-nums">
          {r.startDate} → {r.endDate}
        </span>
      ),
      sortValue: (r) => r.startDate,
      exportValue: (r) => `${r.startDate}–${r.endDate}`,
    },
    {
      key: "where",
      header: "Location",
      accessor: (r) => (
        <div className="flex flex-col">
          <span className="text-foreground">
            {r.taluka}, {r.district}
          </span>
          <span className="text-xs text-muted-foreground">{r.venue}</span>
        </div>
      ),
      sortValue: (r) => r.district,
      exportValue: (r) => `${r.taluka}, ${r.district}`,
    },
    {
      key: "trainer",
      header: "Trainer",
      accessor: (r) => r.trainerName,
      sortValue: (r) => r.trainerName,
      exportValue: (r) => r.trainerName,
    },
    {
      key: "attendance",
      header: "Attendance",
      accessor: (r) => (
        <span className="tabular-nums">
          {r.attendedParticipants}/{r.plannedParticipants}
        </span>
      ),
      sortValue: (r) =>
        r.plannedParticipants
          ? r.attendedParticipants / r.plannedParticipants
          : 0,
      exportValue: (r) =>
        `${r.attendedParticipants}/${r.plannedParticipants}`,
      align: "right",
    },
    {
      key: "quality",
      header: "Batch Quality",
      accessor: () => <PlaceholderMetric />,
      exportValue: () => "pending",
    },
    {
      key: "status",
      header: "Status",
      accessor: (r) => (
        <StatusPill tone={STATUS_TONE[r.status]}>{r.status}</StatusPill>
      ),
      sortValue: (r) => r.status,
      exportValue: (r) => r.status,
    },
  ];
  return (
    <DataTable
      data={rows}
      columns={columns}
      searchKeys={["code", "trainerName", "taluka", "district", "venue"]}
      pageSize={12}
      getRowId={(r) => r.id}
    />
  );
}
