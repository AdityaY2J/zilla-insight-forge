import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";

import { PageHeader } from "@/components/dashboard/page-header";
import { Section, SectionCard } from "@/components/dashboard/section";
import { KpiCard, KpiGrid } from "@/components/dashboard/kpi-card";
import { FilterSelect } from "@/components/dashboard/filter-bar";
import { BatchPerformanceTable } from "@/components/dashboard/batch-performance-table";
import {
  HierarchicalBreakdownTable,
  type HierRow,
} from "@/components/dashboard/hierarchical-breakdown-table";
import {
  ColumnChart,
  StackedColumnChart100,
} from "@/components/dashboard/column-chart";
import { Input } from "@/components/ui/input";

import {
  BATCHES,
  MODULES,
  MODULE_EXERCISE_ADHERENCE,
  type Batch,
  type ModuleId,
} from "@/data/capacity-building";
import { DISTRICTS, DIVISIONS } from "@/data/geography";

export const Route = createFileRoute("/mt-process-adherence")({
  head: () => ({
    meta: [
      { title: "MT Process Adherence · Zilla Analytics" },
      {
        name: "description",
        content:
          "Process adherence analytics across MT capacity-building batches — module benchmarks, exercise timings and geography breakdown.",
      },
      { property: "og:title", content: "MT Process Adherence · Zilla Analytics" },
      {
        property: "og:description",
        content:
          "Average process adherence, defaulting modules, and exercise-wise benchmark timings across MT batches.",
      },
    ],
  }),
  component: MTProcessAdherenceDashboard,
});

type DateMode = "Overall" | "Single" | "Range";

function MTProcessAdherenceDashboard() {
  const [dateMode, setDateMode] = useState<DateMode>("Overall");
  const [singleDate, setSingleDate] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const filtered = useMemo(() => {
    if (dateMode === "Overall") return BATCHES;
    if (dateMode === "Single" && singleDate) {
      return BATCHES.filter((b) => b.date === singleDate);
    }
    if (dateMode === "Range" && fromDate && toDate) {
      return BATCHES.filter((b) => b.date >= fromDate && b.date <= toDate);
    }
    return BATCHES;
  }, [dateMode, singleDate, fromDate, toDate]);

  const avgAdherence = useMemo(() => {
    if (filtered.length === 0) return 0;
    return filtered.reduce((s, b) => s + b.processAdherence, 0) / filtered.length;
  }, [filtered]);

  const mostDefaulting = useMemo(() => {
    if (filtered.length === 0) return null;
    let worst: { id: ModuleId; name: string; missed: number } | null = null;
    for (const m of MODULES) {
      const missed = filtered.filter((b) => !b.moduleMet[m.id]).length;
      if (!worst || missed > worst.missed) worst = { ...m, missed };
    }
    if (!worst) return null;
    return {
      ...worst,
      pct: Math.round((worst.missed / filtered.length) * 100),
    };
  }, [filtered]);

  const distribution = useMemo(() => {
    const total = filtered.length || 1;
    return Array.from({ length: MODULES.length + 1 }).map((_, i) => {
      const count = filtered.filter((b) => b.processAdherence === i).length;
      const pct = Math.round((count / total) * 100);
      const label =
        i === MODULES.length
          ? "8 Modules"
          : `${i} Module${i === 1 ? "" : "s"}`;
      return { label, value: pct, labelText: `${count} (${pct}%)` };
    });
  }, [filtered]);

  const moduleBench = useMemo(
    () =>
      MODULES.map((m) => {
        const met = filtered.filter((b) => b.moduleMet[m.id]).length;
        return { label: `Module ${m.id.slice(1)}`, met, notMet: filtered.length - met };
      }),
    [filtered],
  );

  return (
    <div className="pb-16">
      <PageHeader
        title="MT Process Adherence"
        description="Facilitation process-adherence analytics across MT capacity-building batches."
        actions={
          <div className="flex flex-wrap items-end gap-3">
            <FilterSelect
              label="Date"
              value={dateMode}
              onChange={(v) => setDateMode(v as DateMode)}
              options={[
                { label: "Overall", value: "Overall" },
                { label: "Single Date", value: "Single" },
                { label: "Date Range", value: "Range" },
              ]}
            />
            {dateMode === "Single" ? (
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Date
                </span>
                <Input
                  type="date"
                  value={singleDate}
                  onChange={(e) => setSingleDate(e.target.value)}
                  className="h-9 w-[170px]"
                />
              </div>
            ) : null}
            {dateMode === "Range" ? (
              <>
                <div className="flex flex-col gap-1.5">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    From
                  </span>
                  <Input
                    type="date"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    className="h-9 w-[170px]"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    To
                  </span>
                  <Input
                    type="date"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    className="h-9 w-[170px]"
                  />
                </div>
              </>
            ) : null}
          </div>
        }
      />

      <div className="px-8 pt-8 space-y-10">
        <Section title="Snapshot">
          <KpiGrid cols={3}>
            <KpiCard
              title="Average Process Adherence"
              value={`${avgAdherence.toFixed(1)}/8`}
              context={`based on ${filtered.length} batches`}
              accent={
                avgAdherence >= 6.4
                  ? "success"
                  : avgAdherence >= 4.8
                    ? "warning"
                    : "critical"
              }
            />
            <KpiCard
              title="Most Defaulting Module"
              value={mostDefaulting ? mostDefaulting.name : "—"}
              context={
                mostDefaulting
                  ? `${mostDefaulting.missed}/${filtered.length} batches below benchmark`
                  : "No batches in scope"
              }
              accent="critical"
            />
          </KpiGrid>
        </Section>

        <Section title={`Process Adherence (N = ${filtered.length} Batches)`}>
          <SectionCard>
            <ColumnChart
              data={distribution}
              xAxisTitle="No. of Modules Adhered To"
              yAxisTitle="% of batches"
            />
          </SectionCard>
        </Section>

        <Section title={`Batch Benchmark Adherence by Module (N = ${filtered.length} Batches)`}>
          <SectionCard>
            <StackedColumnChart100
              data={moduleBench}
              xAxisTitle="Module"
              primaryLabel="Batches Meeting Benchmark"
              secondaryLabel="Batches Not Meeting Benchmark"
            />
          </SectionCard>
        </Section>

        <Section title="Process Adherence Summary by Geography">
          <GeographyAdherenceTable rows={filtered} />
        </Section>

        <Section title="Exercise-wise Process Adherence">
          <ExerciseAdherenceTable />
        </Section>

        <Section title="Batch Performance">
          <BatchPerformanceTable rows={filtered} />
        </Section>
      </div>
    </div>
  );
}

function adherenceRow(batches: Batch[]): (string | number)[] {
  const n = batches.length;
  const bucket = (level: number) => {
    if (n === 0) return "-";
    const count = batches.filter((b) => b.processAdherence === level).length;
    return `${count} (${Math.round((count / n) * 100)}%)`;
  };
  const avgAdh =
    n === 0
      ? "-"
      : `${(batches.reduce((s, b) => s + b.processAdherence, 0) / n).toFixed(1)}/8`;
  return [
    n,
    ...Array.from({ length: 9 }).map((_, i) => bucket(i)),
    avgAdh,
  ];
}

const ADHERENCE_COLUMNS = [
  { header: "No. of Batches", align: "right" as const },
  ...Array.from({ length: 9 }).map((_, i) => ({ header: `${i}/8`, align: "right" as const })),
  { header: "Average Process Adherence", align: "right" as const },
];

function adherenceExportRow(batches: Batch[]): (string | number)[] {
  const n = batches.length;
  return [n, ...Array.from({ length: 9 }).flatMap((_, i) => { const count = batches.filter((batch) => batch.processAdherence === i).length; return [count, n ? `${Math.round(count * 100 / n)}%` : "-"]; }), n ? `${(batches.reduce((sum, batch) => sum + batch.processAdherence, 0) / n).toFixed(1)}/8` : "-"];
}

function GeographyAdherenceTable({ rows }: { rows: Batch[] }) {
  const hier = useMemo<HierRow[]>(
    () =>
      DIVISIONS.map((division) => {
        const divBatches = rows.filter((b) => b.division === division);
        const districts = DISTRICTS.filter((d) => d.division === division).map(
          (dist) => {
            const dBatches = divBatches.filter((b) => b.district === dist.name);
            const talukas: HierRow[] = dist.talukas.map((tk) => {
              const tBatches = dBatches.filter((b) => b.taluka === tk);
              return {
                key: `${division}/${dist.name}/${tk}`,
                label: tk,
                values: adherenceRow(tBatches),
                exportValues: adherenceExportRow(tBatches),
              };
            });
            return {
              key: `${division}/${dist.name}`,
              label: `${dist.name} (District)`,
              values: adherenceRow(dBatches),
              exportValues: adherenceExportRow(dBatches),
              children: talukas,
            };
          },
        );
        return {
          key: division,
          label: `${division} (Division)`,
          values: adherenceRow(divBatches),
          exportValues: adherenceExportRow(divBatches),
          children: districts,
        };
      }),
    [rows],
  );

  return (
    <HierarchicalBreakdownTable
      rows={hier}
      firstColHeader="Geography"
      exportable
      exportFileName="geography-process-adherence.csv"
      columns={ADHERENCE_COLUMNS}
      exportColumns={[
        { header: "No. of Batches", align: "right" },
        ...Array.from({ length: 9 }).flatMap((_, index) => [{ header: `${index}/8 Count`, align: "right" as const }, { header: `${index}/8 %`, align: "right" as const }]),
        { header: "Average Process Adherence", align: "right" },
      ]}
    />
  );
}

function ExerciseAdherenceTable() {
  const rows = useMemo<HierRow[]>(
    () =>
      MODULE_EXERCISE_ADHERENCE.map((m) => ({
        key: m.moduleId,
        label: m.name,
        values: [m.benchmarkMins, m.avgMins, `${m.pctBelowBenchmark}%`],
        children: m.exercises.map((e) => ({
          key: `${m.moduleId}/${e.name}`,
          label: e.name,
          values: [e.benchmarkMins, e.avgMins, `${e.pctBelowBenchmark}%`],
        })),
      })),
    [],
  );
  return (
    <HierarchicalBreakdownTable
      rows={rows}
      firstColHeader="Module/Exercise"
      exportable
      exportFileName="exercise-process-adherence.csv"
      columns={[
        { header: "Benchmark Timing (in mins)", align: "right" },
        { header: "Avg. Time Spent (in mins)", align: "right" },
        { header: "% of Batches Below Benchmark", align: "right" },
      ]}
    />
  );
}
