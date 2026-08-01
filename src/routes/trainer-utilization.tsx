import { useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/dashboard/page-header";
import { Section, SectionCard } from "@/components/dashboard/section";
import { KpiCard, KpiGrid } from "@/components/dashboard/kpi-card";
import { ColumnChart } from "@/components/dashboard/column-chart";
import { HierarchicalBreakdownTable, type HierRow } from "@/components/dashboard/hierarchical-breakdown-table";
import { ACTIVE_TRAINERS, TRAINER_PERFORMANCE } from "@/data/trainer-performance";
import { DISTRICTS, DIVISIONS } from "@/data/geography";

export const Route = createFileRoute("/trainer-utilization")({ component: TrainerUtilizationDashboard });
const average = (values: number[]) => values.length ? Math.round(values.reduce((sum, value) => sum + value, 0) * 10 / values.length) / 10 : 0;

function TrainerUtilizationDashboard() {
  const distribution = useMemo(() => { const max = Math.max(0, ...TRAINER_PERFORMANCE.map((trainer) => trainer.batches.length)); return Array.from({ length: max + 1 }, (_, count) => { const trainers = TRAINER_PERFORMANCE.filter((trainer) => trainer.batches.length === count).length; return { label: `${count} Batches`, value: trainers, labelText: `${trainers} (${TRAINER_PERFORMANCE.length ? Math.round(trainers * 100 / TRAINER_PERFORMANCE.length) : 0}%)` }; }); }, []);
  return <div className="pb-16"><PageHeader title="Trainer Utilization" description="Trainer deployment and utilization across the program." /><div className="px-8 pt-8 space-y-10"><Section title="Snapshot"><KpiGrid cols={3}><KpiCard title="Total Certified MTs" value={TRAINER_PERFORMANCE.length} /><KpiCard title="Total Active MTs (Atleast 1 batch conducted)" value={`${ACTIVE_TRAINERS.length}(${Math.round((ACTIVE_TRAINERS.length / TRAINER_PERFORMANCE.length) * 100)}%)`} /><KpiCard title="Average Batches per Active MT" value={average(ACTIVE_TRAINERS.map((trainer) => trainer.batches.length))} /></KpiGrid></Section><Section title="No. of Batches Conducted by Trainers"><SectionCard><ColumnChart data={distribution} yFormat={(value) => String(value)} labelFormat={(value) => String(value)} xAxisTitle="Number of batches conducted" yAxisTitle="Number of Trainers" /></SectionCard></Section><Section title="Geography-wise Summary"><GeographySummary /></Section></div></div>;
}

function utilizationValues(rows: typeof TRAINER_PERFORMANCE): (string | number)[] { const active = rows.filter((trainer) => trainer.batches.length > 0); return [rows.length, active.length, rows.length ? `${Math.round(active.length * 100 / rows.length)}%` : "–", average(active.map((trainer) => trainer.batches.length))]; }
function GeographySummary() { const rows = useMemo<HierRow[]>(() => DIVISIONS.map((division) => { const divisionRows = TRAINER_PERFORMANCE.filter((trainer) => trainer.division === division); return { key: division, label: `${division} (Division)`, values: utilizationValues(divisionRows), children: DISTRICTS.filter((district) => district.division === division).map((district) => { const districtRows = divisionRows.filter((trainer) => trainer.district === district.name); return { key: `${division}/${district.name}`, label: `${district.name} (District)`, values: utilizationValues(districtRows), children: district.talukas.map((taluka) => { const talukaRows = districtRows.filter((trainer) => trainer.taluka === taluka); return { key: `${division}/${district.name}/${taluka}`, label: taluka, values: utilizationValues(talukaRows) }; }) }; }) }; }), []); return <HierarchicalBreakdownTable rows={rows} firstColHeader="Geography" columns={[{ header: "Certified MTs", align: "right" }, { header: "Active MTs", align: "right" }, { header: "% Active MTs", align: "right" }, { header: "Average Batches per MT", align: "right" }]} headerCase="normal" searchable exportable exportFileName="trainer-utilization-geography.csv" />; }
