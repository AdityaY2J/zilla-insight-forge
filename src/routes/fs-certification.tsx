import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/dashboard/page-header";
import { Section } from "@/components/dashboard/section";
import { SplitSnapshotPanel } from "@/components/dashboard/split-snapshot-panel";
import { MetricPanel } from "@/components/dashboard/metric-panel";
import { DivisionStatusPanel } from "@/components/dashboard/division-status-panel";
import { DataTable, type Column } from "@/components/dashboard/data-table";
import { HierarchicalBreakdownTable, type HierRow } from "@/components/dashboard/hierarchical-breakdown-table";
import { StatusPill } from "@/components/dashboard/status-pill";
import { ViewSwitch, type SummaryView } from "@/components/dashboard/view-switch";
import { FIELD_STAFF, type FieldStaff } from "@/data/deployment-rollout";
import { DEPARTMENTS, DISTRICTS, DIVISIONS } from "@/data/geography";

export const Route = createFileRoute("/fs-certification")({ component: FieldStaffCertificationDashboard });

const lastDateFor = (rows: FieldStaff[]) => rows.length
  ? `${String(10 + (rows.length % 18)).padStart(2, "0")}/${String(4 + (rows.length % 5)).padStart(2, "0")}/2026`
  : "–";

function FieldStaffCertificationDashboard() {
  const [view, setView] = useState<SummaryView>("geography");
  const totals = useMemo(() => ({ trained: FIELD_STAFF.filter((row) => row.trained).length, certified: FIELD_STAFF.filter((row) => row.certificationStatus === "Certified").length, target: FIELD_STAFF.length }), []);
  const divisions = useMemo(() => DIVISIONS.map((division) => {
    const rows = FIELD_STAFF.filter((row) => row.division === division);
    const certified = rows.filter((row) => row.certificationStatus === "Certified").length;
    return { division, target: rows.length, certified, trained: rows.filter((row) => row.trained).length, completion: rows.length ? Math.round(certified * 100 / rows.length) : 0, lastDate: lastDateFor(rows) };
  }), []);
  const active = divisions.filter((row) => row.completion > 0 && row.completion < 100).map((row) => ({ division: row.division, target: row.target, achieved: row.certified, completion: row.completion, lastDate: row.lastDate }));
  return <div className="pb-16"><PageHeader title="Field Staff Certification" description="Certification progress across Field Staff and geographies." /><div className="px-8 pt-8 space-y-10">
    <Section title="Snapshot"><SplitSnapshotPanel left={<MetricPanel title="Overall" groups={[{ items: [{ label: "Target", value: totals.target }, { label: "Trained", value: totals.trained }, { label: "Certified", value: totals.certified }, { label: "Target Completion", formula: "Certified/Target", value: `${Math.round(totals.certified * 100 / totals.target)}%` }] }]} />} rightTitle="Division Status" right={<DivisionStatusPanel achievedLabel="Certified" active={active} completed={divisions.filter((row) => row.completion >= 100).map((row) => row.division)} yetToStart={divisions.filter((row) => row.completion === 0).map((row) => row.division)} />} /></Section>
    <Section title="Certification Summary" actions={<ViewSwitch value={view} onChange={setView} />}>{view === "geography" ? <GeographySummary /> : <DepartmentSummary />}</Section>
    <Section title="Field Staff Certification Status" description="Individual Field Staff certification records."><FieldStaffDirectory /></Section>
  </div></div>;
}

function certificationValues(rows: FieldStaff[]): (React.ReactNode | number | string)[] {
  const trained = rows.filter((row) => row.trained).length;
  const certified = rows.filter((row) => row.certificationStatus === "Certified").length;
  const target = rows.length;
  return [<StatusPill key="status" tone={target ? "success" : "neutral"}>{target ? "Active" : "Not Active"}</StatusPill>, target || "–", trained || "–", certified || "–", trained ? `${Math.round(certified * 100 / trained)}%` : "–", target ? `${Math.round(certified * 100 / target)}%` : "–", lastDateFor(rows)];
}

const CERTIFICATION_COLUMNS = [
  { header: "Activation Status" }, { header: "Target", align: "right" as const }, { header: "Trained", align: "right" as const }, { header: "Certified", align: "right" as const },
  { header: "Certification Rate", formula: "Certified/Trained", align: "right" as const }, { header: "Target Completion", formula: "Certified/Target", align: "right" as const }, { header: "Last Date", align: "right" as const },
];

function GeographySummary() {
  const rows = useMemo<HierRow[]>(() => DIVISIONS.map((division) => {
    const divisionRows = FIELD_STAFF.filter((row) => row.division === division);
    return { key: division, label: `${division} (Division)`, values: certificationValues(divisionRows), children: DISTRICTS.filter((district) => district.division === division).map((district) => {
      const districtRows = divisionRows.filter((row) => row.district === district.name);
      return { key: `${division}/${district.name}`, label: `${district.name} (District)`, values: certificationValues(districtRows), children: district.talukas.map((taluka) => {
        const talukaRows = districtRows.filter((row) => row.taluka === taluka);
        return { key: `${division}/${district.name}/${taluka}`, label: taluka, values: certificationValues(talukaRows) };
      }) };
    }) };
  }), []);
  return <HierarchicalBreakdownTable rows={rows} firstColHeader="Geography" columns={CERTIFICATION_COLUMNS} exportable exportFileName="field-staff-certification-summary.csv" />;
}

function DepartmentSummary() {
  const rows = useMemo<HierRow[]>(() => DEPARTMENTS.map((department) => {
    const staff = FIELD_STAFF.filter((row) => row.department === department);
    return { key: department, label: department, values: certificationValues(staff) };
  }), []);
  return <HierarchicalBreakdownTable rows={rows} firstColHeader="Department" columns={CERTIFICATION_COLUMNS} exportable exportFileName="field-staff-certification-department-summary.csv" />;
}

function FieldStaffDirectory() {
  const columns: Column<FieldStaff>[] = [
    { key: "id", header: "F ID", accessor: (r) => r.id, exportValue: (r) => r.id }, { key: "name", header: "FS Name", accessor: (r) => <span className="font-medium">{r.name}</span>, exportValue: (r) => r.name }, { key: "designation", header: "Designation", accessor: (r) => r.designation }, { key: "department", header: "Department", accessor: (r) => r.department }, { key: "division", header: "Division", accessor: (r) => r.division }, { key: "district", header: "District", accessor: (r) => r.district }, { key: "taluka", header: "Taluka", accessor: (r) => r.taluka }, { key: "phone", header: "Phone No.", accessor: (r) => r.phone }, { key: "a1", header: "Assessment 1", accessor: (r) => r.assessment1 != null ? `${r.assessment1}%` : "–", align: "right" }, { key: "a2", header: "Assessment 2", accessor: (r) => r.assessment2 != null ? `${r.assessment2}%` : "–", align: "right" }, { key: "status", header: "Certification Status", accessor: (r) => <StatusPill tone={r.certificationStatus === "Certified" ? "success" : "neutral"}>{r.certificationStatus}</StatusPill> },
  ];
  return <DataTable data={FIELD_STAFF} columns={columns} searchKeys={["id", "name", "department", "district"]} pageSize={15} getRowId={(row) => row.id} />;
}
