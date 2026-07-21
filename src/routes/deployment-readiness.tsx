import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";

import { PageHeader } from "@/components/dashboard/page-header";
import { Section } from "@/components/dashboard/section";
import { KpiCard, KpiGrid } from "@/components/dashboard/kpi-card";
import { StatusPill, type StatusTone } from "@/components/dashboard/status-pill";
import { DataTable, type Column } from "@/components/dashboard/data-table";
import { FilterSelect } from "@/components/dashboard/filter-bar";
import {
  HierarchicalBreakdownTable,
  type HierRow,
} from "@/components/dashboard/hierarchical-breakdown-table";

import {
  READINESS,
  readinessSummary,
  type TalukaReadiness,
  type ReadinessStatus,
} from "@/data/deployment";
import { DIVISIONS } from "@/data/geography";

export const Route = createFileRoute("/deployment-readiness")({
  head: () => ({
    meta: [
      { title: "Deployment Readiness · Zilla Analytics" },
      {
        name: "description",
        content:
          "Taluka-level readiness for Deployment Rollout: trainer availability, batch planning, and venue confirmation.",
      },
    ],
  }),
  component: DeploymentReadinessDashboard,
});

const READY_TONE: Record<ReadinessStatus, StatusTone> = {
  Ready: "success",
  "At Risk": "warning",
  "Not Ready": "critical",
};

function DeploymentReadinessDashboard() {
  const [division, setDivision] = useState<string>("All");
  const [status, setStatus] = useState<ReadinessStatus | "All">("All");

  const filtered = useMemo(
    () =>
      READINESS.filter((r) => {
        if (division !== "All" && r.division !== division) return false;
        if (status !== "All" && r.status !== status) return false;
        return true;
      }),
    [division, status],
  );
  const s = useMemo(() => readinessSummary(filtered), [filtered]);

  return (
    <div className="pb-16">
      <PageHeader
        title="Deployment Readiness"
        description="Assess whether each geography is prepared to begin Deployment Rollout. Focus attention on At Risk and Not Ready talukas before batches begin."
        filters={
          <>
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
              label="Readiness"
              value={status}
              onChange={(v) => setStatus(v as ReadinessStatus | "All")}
              options={[
                { label: "All", value: "All" },
                { label: "Ready", value: "Ready" },
                { label: "At Risk", value: "At Risk" },
                { label: "Not Ready", value: "Not Ready" },
              ]}
            />
          </>
        }
      />
      <div className="px-8 pt-8 space-y-10">
        <Section title="Snapshot KPIs">
          <KpiGrid>
            <KpiCard
              title="Talukas Covered"
              value={s.total.toLocaleString("en-IN")}
              accent="info"
            />
            <KpiCard
              title="Ready"
              value={s.ready.toLocaleString("en-IN")}
              context={`${s.readyPct}% of talukas`}
              accent="success"
            />
            <KpiCard
              title="At Risk"
              value={s.atRisk.toLocaleString("en-IN")}
              context="Partial readiness — needs attention"
              accent="warning"
            />
            <KpiCard
              title="Not Ready"
              value={s.notReady.toLocaleString("en-IN")}
              context="Cannot begin rollout"
              accent="critical"
            />
          </KpiGrid>
        </Section>

        <Section
          title="Readiness by Division"
          description="Aggregate readiness status by division. Drill into individual talukas below."
        >
          <DivisionRollup rows={filtered} />
        </Section>

        <Section
          title="Taluka Readiness"
          description="Detailed readiness status per taluka including trainer, batch, and venue coverage."
        >
          <ReadinessTable rows={filtered} />
        </Section>
      </div>
    </div>
  );
}

function DivisionRollup({ rows }: { rows: TalukaReadiness[] }) {
  const hier = useMemo<HierRow[]>(() => {
    const byDiv = new Map<string, TalukaReadiness[]>();
    for (const r of rows) {
      const arr = byDiv.get(r.division) ?? [];
      arr.push(r);
      byDiv.set(r.division, arr);
    }
    return Array.from(byDiv.entries()).map(([division, divRows]) => {
      const total = divRows.length;
      const ready = divRows.filter((r) => r.status === "Ready").length;
      const atRisk = divRows.filter((r) => r.status === "At Risk").length;
      const notReady = divRows.filter((r) => r.status === "Not Ready").length;
      const rate = total ? Math.round((ready / total) * 1000) / 10 : 0;
      const tone: StatusTone =
        rate >= 80 ? "success" : rate >= 50 ? "warning" : "critical";
      return {
        key: division,
        label: division,
        values: [
          total,
          ready,
          atRisk,
          notReady,
          <StatusPill key="t" tone={tone}>
            {rate}% ready
          </StatusPill>,
        ],
      };
    });
  }, [rows]);
  return (
    <HierarchicalBreakdownTable
      rows={hier}
      firstColHeader="Division"
      columns={[
        { header: "Talukas", align: "right" },
        { header: "Ready", align: "right" },
        { header: "At Risk", align: "right" },
        { header: "Not Ready", align: "right" },
        { header: "Overall", align: "right" },
      ]}
      allowExpand={false}
    />
  );
}

function ReadinessTable({ rows }: { rows: TalukaReadiness[] }) {
  const columns: Column<TalukaReadiness>[] = [
    {
      key: "location",
      header: "Location",
      accessor: (r) => (
        <div className="flex flex-col">
          <span className="font-medium text-foreground">{r.taluka}</span>
          <span className="text-xs text-muted-foreground">
            {r.district} · {r.division}
          </span>
        </div>
      ),
      sortValue: (r) => `${r.division}${r.district}${r.taluka}`,
      exportValue: (r) => `${r.taluka}, ${r.district}, ${r.division}`,
    },
    {
      key: "trainers",
      header: "Trainers",
      accessor: (r) => (
        <span className="tabular-nums">
          {r.trainersAvailable}/{r.trainersRequired}
        </span>
      ),
      sortValue: (r) =>
        r.trainersRequired ? r.trainersAvailable / r.trainersRequired : 0,
      exportValue: (r) => `${r.trainersAvailable}/${r.trainersRequired}`,
      align: "right",
    },
    {
      key: "batches",
      header: "Batches Planned",
      accessor: (r) => <span className="tabular-nums">{r.batchesPlanned}</span>,
      sortValue: (r) => r.batchesPlanned,
      exportValue: (r) => r.batchesPlanned,
      align: "right",
    },
    {
      key: "venues",
      header: "Venues Confirmed",
      accessor: (r) => (
        <span className="tabular-nums">
          {r.venuesConfirmed}/{r.venuesRequired}
        </span>
      ),
      sortValue: (r) =>
        r.venuesRequired ? r.venuesConfirmed / r.venuesRequired : 0,
      exportValue: (r) => `${r.venuesConfirmed}/${r.venuesRequired}`,
      align: "right",
    },
    {
      key: "status",
      header: "Readiness",
      accessor: (r) => <StatusPill tone={READY_TONE[r.status]}>{r.status}</StatusPill>,
      sortValue: (r) => r.status,
      exportValue: (r) => r.status,
    },
  ];
  return (
    <DataTable
      data={rows}
      columns={columns}
      searchKeys={["taluka", "district", "division"]}
      pageSize={15}
      getRowId={(r) => r.key}
    />
  );
}
