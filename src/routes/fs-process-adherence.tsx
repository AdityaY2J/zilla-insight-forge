import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/dashboard/page-header";
import { Section, SectionCard } from "@/components/dashboard/section";
import { KpiCard, KpiGrid } from "@/components/dashboard/kpi-card";
import { FilterSelect } from "@/components/dashboard/filter-bar";
import { ColumnChart, StackedColumnChart100 } from "@/components/dashboard/column-chart";
import { DataTable, type Column } from "@/components/dashboard/data-table";
import { HierarchicalBreakdownTable, type HierRow } from "@/components/dashboard/hierarchical-breakdown-table";
import { FieldStaffBatchPerformanceTable } from "@/components/dashboard/field-staff-batch-performance-table";
import { FIELD_STAFF_BATCHES, type FieldStaffBatch } from "@/data/deployment-rollout";
import { MODULES, MODULE_EXERCISE_ADHERENCE } from "@/data/capacity-building";
import { DISTRICTS, DIVISIONS } from "@/data/geography";

export const Route = createFileRoute("/fs-process-adherence")({ component: FieldStaffProcessAdherenceDashboard });
type DateMode = "Overall" | "Single" | "Range";

function FieldStaffProcessAdherenceDashboard() {
  const [dateMode, setDateMode] = useState<DateMode>("Overall");
  const [singleDate, setSingleDate] = useState(""); const [fromDate, setFromDate] = useState(""); const [toDate, setToDate] = useState("");
  const rows = useMemo(() => FIELD_STAFF_BATCHES.filter((batch) => dateMode === "Overall" || (dateMode === "Single" ? !singleDate || batch.date === singleDate : !fromDate || !toDate || (batch.date >= fromDate && batch.date <= toDate))), [dateMode, singleDate, fromDate, toDate]);
  const average = rows.length ? rows.reduce((sum, batch) => sum + batch.processAdherence, 0) / rows.length : 0;
  const mostDefaulting = useMemo(() => MODULES.map((module) => ({ ...module, missed: rows.filter((batch) => !batch.moduleMet[module.id]).length })).sort((a, b) => b.missed - a.missed)[0], [rows]);
  const distribution = useMemo(() => Array.from({ length: MODULES.length + 1 }, (_, index) => { const count = rows.filter((batch) => batch.processAdherence === index).length; const percentage = rows.length ? Math.round(count * 100 / rows.length) : 0; return { label: index === MODULES.length ? "Maximum Modules" : `${index} Module${index === 1 ? "" : "s"}`, value: percentage, labelText: `${count} (${percentage}%)` }; }), [rows]);
  const benchmarks = useMemo(() => MODULES.map((module) => { const met = rows.filter((batch) => batch.moduleMet[module.id]).length; return { label: module.id, met, notMet: rows.length - met }; }), [rows]);
  return <div className="pb-16"><PageHeader title="Field Staff Process Adherence" description="Facilitation process-adherence analytics across Field Staff batches." actions={<div className="flex flex-wrap gap-3"><FilterSelect label="Date" value={dateMode} onChange={(value) => setDateMode(value as DateMode)} options={[{ label: "Overall", value: "Overall" }, { label: "Single Date", value: "Single" }, { label: "Date Range", value: "Range" }]} />{dateMode === "Single" ? <input className="h-9 rounded-md border px-2 text-sm" type="date" value={singleDate} onChange={(event) => setSingleDate(event.target.value)} /> : null}{dateMode === "Range" ? <><input className="h-9 rounded-md border px-2 text-sm" type="date" value={fromDate} onChange={(event) => setFromDate(event.target.value)} /><input className="h-9 rounded-md border px-2 text-sm" type="date" value={toDate} onChange={(event) => setToDate(event.target.value)} /></> : null}</div>} /><div className="px-8 pt-8 space-y-10">
    <Section title="Snapshot"><KpiGrid cols={3}><KpiCard title="Average Process Adherence" value={`${average.toFixed(1)}/8`} context={`based on ${rows.length} batches`} /><KpiCard title="Most Defaulting Module" value={mostDefaulting?.name ?? "–"} context={mostDefaulting ? `${mostDefaulting.missed} batches below benchmark` : "No batches"} accent="critical" /></KpiGrid></Section>
    <Section title={`Process Adherence (N = ${rows.length} Batches)`}><SectionCard><ColumnChart data={distribution} xAxisTitle="No. of Modules Adhered To" yAxisTitle="% of batches" /></SectionCard></Section>
    <Section title={`Batch Benchmark Adherence by Module (N = ${rows.length} Batches)`}><SectionCard><StackedColumnChart100 data={benchmarks} primaryLabel="Batches Meeting Benchmark" secondaryLabel="Batches Not Meeting Benchmark" xAxisTitle="Module" /></SectionCard></Section>
    <Section title="Process Adherence Summary by Geography"><GeographySummary rows={rows} /></Section>
    <Section title="Exercise-wise Process Adherence"><ExerciseSummary /></Section>
    <Section title="Batch Performance"><FieldStaffBatchPerformanceTable rows={rows} /></Section>
  </div></div>;
}

function adherenceValues(batches: FieldStaffBatch[]): (string | number)[] {
  const total = batches.length;
  const bucket = (level: number) => total ? `${batches.filter((batch) => batch.processAdherence === level).length} (${Math.round(batches.filter((batch) => batch.processAdherence === level).length * 100 / total)}%)` : "–";
  return [total || "–", ...Array.from({ length: 9 }, (_, index) => bucket(index)), total ? `${(batches.reduce((sum, batch) => sum + batch.processAdherence, 0) / total).toFixed(1)}/8` : "–"];
}
const adherenceColumns = [{ header: "No. of Batches", align: "right" as const }, ...Array.from({ length: 9 }, (_, index) => ({ header: `${index}/8`, align: "right" as const })), { header: "Average Process Adherence", align: "right" as const }];
function GeographySummary({ rows }: { rows: FieldStaffBatch[] }) {
  const hierarchy = useMemo<HierRow[]>(() => DIVISIONS.map((division) => {
    const divisionRows = rows.filter((batch) => batch.division === division);
    return { key: division, label: `${division} (Division)`, values: adherenceValues(divisionRows), children: DISTRICTS.filter((district) => district.division === division).map((district) => {
      const districtRows = divisionRows.filter((batch) => batch.district === district.name);
      return { key: `${division}/${district.name}`, label: `${district.name} (District)`, values: adherenceValues(districtRows), children: district.talukas.map((taluka) => ({ key: `${division}/${district.name}/${taluka}`, label: taluka, values: adherenceValues(districtRows.filter((batch) => batch.taluka === taluka)) })) };
    }) };
  }), [rows]);
  return <HierarchicalBreakdownTable rows={hierarchy} firstColHeader="Geography" columns={adherenceColumns} exportable exportFileName="field-staff-geography-process-adherence.csv" />;
}
function ExerciseSummary() { const columns: Column<(typeof MODULE_EXERCISE_ADHERENCE)[number]>[] = [{ key: "name", header: "Module", accessor: (r) => r.name }, { key: "benchmark", header: "Benchmark Timing (in mins)", accessor: (r) => r.benchmarkMins, align: "right" }, { key: "average", header: "Avg. Time Spent (in mins)", accessor: (r) => r.avgMins, align: "right" }, { key: "below", header: "% of Batches Below Benchmark", accessor: (r) => `${r.pctBelowBenchmark}%`, align: "right" }]; return <DataTable data={MODULE_EXERCISE_ADHERENCE} columns={columns} pageSize={8} getRowId={(row) => row.moduleId} />; }
