import { useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/dashboard/page-header";
import { Section } from "@/components/dashboard/section";
import { SplitSnapshotPanel } from "@/components/dashboard/split-snapshot-panel";
import { MetricPanel } from "@/components/dashboard/metric-panel";
import { DataTable, type Column } from "@/components/dashboard/data-table";
import { HierarchicalBreakdownTable, type HierRow } from "@/components/dashboard/hierarchical-breakdown-table";
import { FIELD_STAFF_BATCHES, FIELD_STAFF_ROLE_COUNT, largestRole, mixCategory, roleCount, type FieldStaffBatch } from "@/data/deployment-rollout";
import { DISTRICTS, DIVISIONS } from "@/data/geography";

export const Route = createFileRoute("/batch-composition")({ component: BatchCompositionDashboard });

function BatchCompositionDashboard() {
  const total = FIELD_STAFF_BATCHES.length;
  const averageRoles = total ? FIELD_STAFF_BATCHES.reduce((sum, batch) => sum + roleCount(batch), 0) / total : 0;
  const distribution = [
    ["Good Mix batches (≥ 5 roles)", "Good Mix"], ["Acceptable Mix batches (3–4 roles)", "Acceptable Mix"], ["Poor Mix batches (1–2 roles)", "Poor Mix"], ["Single Role batches", "Single Role"],
  ] as const;
  return <div className="pb-16"><PageHeader title="Batch Composition" description="Role balance and composition across Field Staff batches." /><div className="px-8 pt-8 space-y-10">
    <Section title="Snapshot"><SplitSnapshotPanel left={<MetricPanel title="Overall" groups={[{ items: [{ label: "Total Batches Conducted", value: total }, { label: "Avg. Roles per Batch", value: averageRoles.toFixed(1) }] }]} />} rightTitle="Role Mix Distribution" right={<table className="w-full text-sm"><thead className="text-left text-xs text-muted-foreground"><tr><th>Mix category</th><th className="text-right">No. of batches</th><th className="text-right">% of batches</th></tr></thead><tbody>{distribution.map(([label, category]) => { const count = FIELD_STAFF_BATCHES.filter((batch) => mixCategory(batch) === category).length; return <tr key={category} className="border-t"><td className="py-2">{label}</td><td className="py-2 text-right">{count}</td><td className="py-2 text-right">{total ? Math.round(count * 100 / total) : 0}%</td></tr>; })}</tbody></table>} /></Section>
    <Section title="Role Distribution Summary"><RoleDistribution /></Section>
    <Section title="Geography-wise Role Mix"><GeographyRoleMix /></Section>
    <Section title="Batch-wise Role Balance"><BatchRoleBalance /></Section>
  </div></div>;
}

function RoleDistribution() { const rows = Array.from({ length: FIELD_STAFF_ROLE_COUNT }, (_, index) => FIELD_STAFF_ROLE_COUNT - index).map((count) => { const batches = FIELD_STAFF_BATCHES.filter((batch) => roleCount(batch) === count).length; return { roles: `${count} roles`, batches, percentage: FIELD_STAFF_BATCHES.length ? Math.round(batches * 100 / FIELD_STAFF_BATCHES.length) : 0 }; }); rows.push({ roles: "Total", batches: FIELD_STAFF_BATCHES.length, percentage: 100 }); const columns: Column<(typeof rows)[number]>[] = [{ key: "roles", header: "No. of Roles", accessor: (r) => r.roles }, { key: "batches", header: "No. of Batches", accessor: (r) => r.batches, align: "right" }, { key: "percentage", header: "% of Batches", accessor: (r) => `${r.percentage}%`, align: "right" }]; return <DataTable data={rows} columns={columns} searchable={false} exportable={false} pageSize={10} getRowId={(row) => row.roles} />; }
function BatchRoleBalance() { const columns: Column<FieldStaffBatch>[] = [{ key: "id", header: "Batch ID", accessor: (r) => r.id }, { key: "name", header: "Batch Name", accessor: (r) => r.name }, { key: "district", header: "District", accessor: (r) => r.district }, { key: "taluka", header: "Taluka", accessor: (r) => r.taluka }, { key: "roles", header: "No. of Roles Covered", accessor: (r) => `${roleCount(r)}/${FIELD_STAFF_ROLE_COUNT}`, align: "right" }, { key: "largest", header: "Largest Role", accessor: (r) => largestRole(r) }, { key: "strength", header: "Largest Role Strength", accessor: (r) => `${r.roleCounts[largestRole(r)]}/${r.day1Participants}`, align: "right" }, { key: "percentage", header: "% of Batch", accessor: (r) => `${Math.round(r.roleCounts[largestRole(r)] * 100 / r.day1Participants)}%`, align: "right" }]; return <DataTable data={FIELD_STAFF_BATCHES} columns={columns} pageSize={15} getRowId={(row) => row.id} />; }
function GeographyRoleMix() {
  const row = (key: string, label: string, batches: FieldStaffBatch[]): HierRow => {
    const count = (category: ReturnType<typeof mixCategory>) => batches.filter((batch) => mixCategory(batch) === category).length;
    const categories: ReturnType<typeof mixCategory>[] = ["Good Mix", "Acceptable Mix", "Poor Mix", "Single Role"];
    const mixValues = categories.map((category) => { const value = count(category); return `${value}(${batches.length ? Math.round(value * 100 / batches.length) : 0}%)`; });
    return { key, label, values: [batches.length, batches.length ? (batches.reduce((sum, batch) => sum + roleCount(batch), 0) / batches.length).toFixed(1) : "–", ...mixValues], exportValues: [batches.length, batches.length ? (batches.reduce((sum, batch) => sum + roleCount(batch), 0) / batches.length).toFixed(1) : "–", ...categories.flatMap((category) => { const value = count(category); return [value, batches.length ? `${Math.round(value * 100 / batches.length)}%` : "–"]; })] };
  };
  const rows = useMemo<HierRow[]>(() => DIVISIONS.map((division) => { const divisionBatches = FIELD_STAFF_BATCHES.filter((batch) => batch.division === division); const divisionRow = row(division, `${division} (Division)`, divisionBatches); return { ...divisionRow, children: DISTRICTS.filter((district) => district.division === division).map((district) => { const districtBatches = divisionBatches.filter((batch) => batch.district === district.name); const districtRow = row(`${division}/${district.name}`, `${district.name} (District)`, districtBatches); return { ...districtRow, children: district.talukas.map((taluka) => row(`${division}/${district.name}/${taluka}`, taluka, districtBatches.filter((batch) => batch.taluka === taluka))) }; }) }; }), []);
  return <HierarchicalBreakdownTable rows={rows} firstColHeader="Geography" columns={[{ header: "Total Conducted Batches", align: "right" }, { header: "Average Roles per Batch", align: "right" }, { header: "Good Mix Batches", align: "right" }, { header: "Acceptable Mix Batches", align: "right" }, { header: "Poor Mix Batches", align: "right" }, { header: "Single Role Batches", align: "right" }]} exportColumns={[{ header: "Total Conducted Batches", align: "right" }, { header: "Average Roles per Batch", align: "right" }, ...["Good Mix", "Acceptable Mix", "Poor Mix", "Single Role"].flatMap((label) => [{ header: `${label} Count`, align: "right" as const }, { header: `${label} %`, align: "right" as const }])]} searchable exportable exportFileName="geography-role-mix.csv" />;
}
