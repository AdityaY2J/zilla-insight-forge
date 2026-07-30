import { useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/dashboard/page-header";
import { Section } from "@/components/dashboard/section";
import { SplitSnapshotPanel } from "@/components/dashboard/split-snapshot-panel";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { MetricPanel } from "@/components/dashboard/metric-panel";
import { LearningScoreSnapshots } from "@/components/dashboard/learning-score-snapshot";
import { FieldStaffBatchPerformanceTable } from "@/components/dashboard/field-staff-batch-performance-table";
import { HierarchicalBreakdownTable, type HierRow } from "@/components/dashboard/hierarchical-breakdown-table";
import { FIELD_STAFF_BATCHES, type FieldStaffBatch } from "@/data/deployment-rollout";
import { DISTRICTS, DIVISIONS } from "@/data/geography";
import { formatProgramAverage } from "@/lib/program-average";

export const Route = createFileRoute("/fs-batch-performance")({ component: FieldStaffBatchPerformanceDashboard });

const average = (values: number[]) => values.length ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length) : 0;
const averageDecimal = (values: number[]) => values.length ? Math.round(values.reduce((sum, value) => sum + value, 0) * 10 / values.length) / 10 : 0;

function FieldStaffBatchPerformanceDashboard() {
  const stats = useMemo(() => {
    const batches = FIELD_STAFF_BATCHES;
    const snapshot = (score: (batch: FieldStaffBatch) => number, red: (batch: FieldStaffBatch) => number, orange: (batch: FieldStaffBatch) => number, green: (batch: FieldStaffBatch) => number) => ({ score: average(batches.map(score)), red: average(batches.map(red)), orange: average(batches.map(orange)), green: average(batches.map(green)) });
    return {
      day1: snapshot((b) => b.day1AssessmentAvg, (b) => b.day1RedPct, (b) => b.day1OrangePct, (b) => b.day1GreenPct),
      day2: snapshot((b) => b.day2AssessmentAvg, (b) => b.day2RedPct, (b) => b.day2OrangePct, (b) => b.day2GreenPct),
      overall: snapshot((b) => (b.day1AssessmentAvg + b.day2AssessmentAvg) / 2, (b) => b.redPct, (b) => b.orangePct, (b) => b.greenPct),
      pre: averageDecimal(batches.map((b) => b.avgPreScore)),
      post: averageDecimal(batches.map((b) => b.avgPostScore)),
      adherence: averageDecimal(batches.map((b) => b.processAdherence)),
    };
  }, []);

  return <div className="pb-16"><PageHeader title="Field Staff Batch Performance" description="Live and historical performance for every Field Staff batch." /><div className="px-8 pt-8 space-y-10">
    <Section title="Snapshot"><SplitSnapshotPanel left={<div className="space-y-4"><MetricPanel title="Overall" groups={[{ items: [{ label: "Batches Conducted", value: FIELD_STAFF_BATCHES.length }, { label: "Average Process Score", value: `${stats.adherence}/8` }] }]} /><LearningScoreSnapshots snapshots={[{ label: "Day 1", averageScore: stats.day1.score, ...stats.day1 }, { label: "Day 2", averageScore: stats.day2.score, ...stats.day2 }, { label: "Overall", averageScore: stats.overall.score, ...stats.overall }]} /><MetricPanel title="Cognitive" groups={[{ items: [{ label: "Average Cognitive Pre Score", value: `${stats.pre} / 10` }, { label: "Average Cognitive Post Score", value: `${stats.post} / 10` }] }]} /></div>} rightTitle={`Active Batches (${FIELD_STAFF_BATCHES.filter((b) => b.active).length})`} right={<ActiveBatches />} /></Section>
    <Section title="Division Summary"><DivisionSummary /></Section>
    <Section title="Batch Performance"><FieldStaffBatchPerformanceTable rows={FIELD_STAFF_BATCHES} /></Section>
  </div></div>;
}

function ActiveBatches() { const rows = FIELD_STAFF_BATCHES.filter((batch) => batch.active); return <ul className="space-y-2.5">{rows.length ? rows.map((batch) => <li key={batch.id} className="border-b border-dashed pb-2"><p className="font-medium text-sm">{batch.name}</p><p className="text-xs text-muted-foreground">{batch.id} · {batch.taluka}, {batch.district}</p></li>) : <li className="text-sm text-muted-foreground">No active batches.</li>}</ul>; }

function DivisionSummary() {
  const values = (batches: FieldStaffBatch[]): (number | string)[] => { if (!batches.length) return [0, "–", "–", "–", "–", "–", "–", "–"]; const day1 = average(batches.map((b) => b.day1AssessmentAvg)); const day2 = average(batches.map((b) => b.day2AssessmentAvg)); return [batches.length, `${day1}%`, `${day2}%`, formatProgramAverage(day1, day2), `${average(batches.map((b) => b.redPct))}%`, `${average(batches.map((b) => b.orangePct))}%`, `${average(batches.map((b) => b.greenPct))}%`, `${averageDecimal(batches.map((b) => b.processAdherence))}/8`]; };
  const rows = useMemo<HierRow[]>(() => DIVISIONS.map((division) => {
    const divisionBatches = FIELD_STAFF_BATCHES.filter((batch) => batch.division === division);
    return { key: division, label: `${division} (Division)`, values: values(divisionBatches), children: DISTRICTS.filter((district) => district.division === division).map((district) => {
      const districtBatches = divisionBatches.filter((batch) => batch.district === district.name);
      return { key: `${division}/${district.name}`, label: `${district.name} (District)`, values: values(districtBatches), children: district.talukas.map((taluka) => ({ key: `${division}/${district.name}/${taluka}`, label: taluka, values: values(districtBatches.filter((batch) => batch.taluka === taluka)) })) };
    }) };
  }), []);
  return <HierarchicalBreakdownTable rows={rows} firstColHeader="Geography" exportable exportFileName="field-staff-division-summary.csv" columns={[{ header: "Batches Conducted", align: "right" }, { header: "Day 1 Avg.", align: "right" }, { header: "Day 2 Avg.", align: "right" }, { header: "Program Average", align: "right" }, { header: "Red %", align: "right" }, { header: "Orange %", align: "right" }, { header: "Green %", align: "right" }, { header: "Process Adherence", align: "right" }]} />;
}
