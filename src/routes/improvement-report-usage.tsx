import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/dashboard/page-header";
import { Section } from "@/components/dashboard/section";
import { KpiCard, KpiGrid } from "@/components/dashboard/kpi-card";
import { DataTable, type Column } from "@/components/dashboard/data-table";
import { ACTIVE_TRAINERS, IMPROVEMENT_REPORT_USAGE, type ImprovementReportRow } from "@/data/trainer-performance";

export const Route = createFileRoute("/improvement-report-usage")({ component: ImprovementReportUsageDashboard });
type UsageView = "all" | "active";
const average = (values: number[]) => values.length ? Math.round(values.reduce((sum, value) => sum + value, 0) * 10 / values.length) / 10 : 0;

function ImprovementReportUsageDashboard() {
  const [view, setView] = useState<UsageView>("all");
  const rows = useMemo(() => {
    const statusOrder = { Active: 0, Inactive: 1, "Yet to Start": 2 } as const;
    const source = view === "all" ? IMPROVEMENT_REPORT_USAGE : IMPROVEMENT_REPORT_USAGE.filter((trainer) => trainer.districtActivationStatus === "Active");
    return [...source].sort((a, b) => statusOrder[a.districtActivationStatus] - statusOrder[b.districtActivationStatus]);
  }, [view]);
  const usingReports = ACTIVE_TRAINERS.filter((trainer) => IMPROVEMENT_REPORT_USAGE.find((usage) => usage.id === trainer.id)?.averageReportUsage > 0).length;
  const averageReportUsage = average(ACTIVE_TRAINERS.map((trainer) => IMPROVEMENT_REPORT_USAGE.find((usage) => usage.id === trainer.id)?.averageReportUsage ?? 0));
  const averageBatches = average(ACTIVE_TRAINERS.map((trainer) => trainer.batches.length));
  return <div className="pb-16"><PageHeader title="Improvement Report Usage" description="Improvement report adoption and usage across trainers." /><div className="px-8 pt-8 space-y-10"><Section title="Snapshot"><KpiGrid cols={4}><KpiCard title="Active Trainers" value={ACTIVE_TRAINERS.length} /><KpiCard title="Trainers Using Improvement Reports" value={usingReports} /><KpiCard title="Avg. report usage per trainer" value={averageReportUsage} /><KpiCard title="Avg. batches conducted per trainer" value={averageBatches} /></KpiGrid></Section><Section title="Usage by Trainers" actions={<div className="inline-flex rounded-md border bg-muted/30 p-1"><button type="button" onClick={() => setView("all")} className={`rounded px-3 py-1.5 text-sm ${view === "all" ? "bg-background shadow-sm font-medium" : "text-muted-foreground"}`}>All</button><button type="button" onClick={() => setView("active")} className={`rounded px-3 py-1.5 text-sm ${view === "active" ? "bg-background shadow-sm font-medium" : "text-muted-foreground"}`}>Active Districts</button></div>}><UsageTable rows={rows} /></Section></div></div>;
}

function UsageTable({ rows }: { rows: ImprovementReportRow[] }) {
  const columns: Column<ImprovementReportRow>[] = [
    { key: "id", header: "Trainer ID", accessor: (r) => r.id, sortValue: (r) => r.id, exportValue: (r) => r.id },
    { key: "name", header: "Trainer Name", accessor: (r) => <span className="font-medium">{r.name}</span>, sortValue: (r) => r.name },
    { key: "division", header: "Division", accessor: (r) => r.division, sortValue: (r) => r.division },
    { key: "district", header: "District", accessor: (r) => r.district, sortValue: (r) => r.district },
    { key: "taluka", header: "Taluka", accessor: (r) => r.taluka },
    { key: "phone", header: "Phone Number", accessor: (r) => r.phone },
    { key: "batches", header: "Number of Batches Conducted", accessor: (r) => r.districtActivationStatus === "Yet to Start" ? "-" : r.batches.length, align: "right", sortValue: (r) => r.batches.length },
    { key: "usage", header: "No. of reports viewed", accessor: (r) => r.districtActivationStatus === "Yet to Start" ? "-" : r.averageReportUsage, align: "right", sortValue: (r) => r.averageReportUsage },
    { key: "usagePct", header: "Usage %", accessor: (r) => r.districtActivationStatus === "Yet to Start" ? "-" : `${r.usagePct}%`, align: "right", sortValue: (r) => r.usagePct },
    { key: "lastBatch", header: "Last Batch Date", accessor: (r) => r.lastBatchDate },
    { key: "lastViewing", header: "Last Viewing Date", accessor: (r) => r.lastViewingDate },
    { key: "status", header: "District Activation Status", accessor: (r) => r.districtActivationStatus, sortValue: (r) => r.districtActivationStatus },
  ];
  return <DataTable data={rows} columns={columns} headerCase="normal" searchKeys={["id", "name", "district", "taluka"]} pageSize={15} getRowId={(row) => row.id} />;
}
