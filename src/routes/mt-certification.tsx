import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";

import { PageHeader } from "@/components/dashboard/page-header";
import { Section, SectionCard } from "@/components/dashboard/section";
import { KpiCard, KpiGrid } from "@/components/dashboard/kpi-card";
import { StatusPill, type StatusTone } from "@/components/dashboard/status-pill";
import { DataTable, type Column } from "@/components/dashboard/data-table";
import { FunnelChart } from "@/components/dashboard/funnel-chart";
import {
  HierarchicalBreakdownTable,
  type HierRow,
} from "@/components/dashboard/hierarchical-breakdown-table";
import { PlaceholderMetric } from "@/components/dashboard/placeholder-metric";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

import {
  MT_CERTIFICATIONS,
  certFunnel,
  type MTCertification,
  type CertStatus,
} from "@/data/mt-certification";
import { DEPARTMENTS } from "@/data/geography";

export const Route = createFileRoute("/mt-certification")({
  head: () => ({
    meta: [
      { title: "MT Certification · Zilla Analytics" },
      {
        name: "description",
        content:
          "Master Trainer certification pipeline: readiness KPIs, progress funnel, geography and department breakdowns, individual certification directory.",
      },
    ],
  }),
  component: MTCertificationDashboard,
});

const CERT_TONE: Record<CertStatus, StatusTone> = {
  "Not Started": "neutral",
  "In Training": "info",
  "Assessment Pending": "warning",
  Certified: "success",
  Failed: "critical",
};

function MTCertificationDashboard() {
  const funnel = useMemo(() => certFunnel(MT_CERTIFICATIONS), []);
  const certRate = funnel.assessed
    ? Math.round((funnel.certified / funnel.assessed) * 1000) / 10
    : 0;
  const readyRate = funnel.total
    ? Math.round((funnel.certified / funnel.total) * 1000) / 10
    : 0;

  return (
    <div className="pb-16">
      <PageHeader
        title="Master Trainer Certification"
        description="Operational visibility into the Master Trainer certification stage. Track progress from selection to certified pool ready for Batch Operations."
      />
      <div className="px-8 pt-8 space-y-10">
        <Section title="Snapshot KPIs">
          <KpiGrid>
            <KpiCard
              title="Selected MTs"
              value={funnel.total.toLocaleString("en-IN")}
              context="Entering certification pipeline"
              accent="info"
            />
            <KpiCard
              title="In Certification"
              value={funnel.inTraining.toLocaleString("en-IN")}
              context="Training, assessment, or awaiting result"
              accent="info"
            />
            <KpiCard
              title="Certified MTs"
              value={funnel.certified.toLocaleString("en-IN")}
              context={`${readyRate}% of selected pool`}
              accent="success"
            />
            <KpiCard
              title="Certification Rate"
              value={`${certRate}%`}
              context="Certified / Assessed"
              accent={certRate >= 75 ? "success" : certRate >= 60 ? "warning" : "critical"}
            />
          </KpiGrid>
        </Section>

        <Section
          title="Selection to Certification Funnel"
          description="Progression of Selected Master Trainers through the certification stages."
        >
          <SectionCard>
            <FunnelChart
              stages={[
                { label: "Selected", value: funnel.total, tone: "info" },
                { label: "In Certification", value: funnel.inTraining, tone: "info" },
                { label: "Assessed", value: funnel.assessed, tone: "info" },
                { label: "Certified", value: funnel.certified, tone: "success" },
              ]}
            />
          </SectionCard>
        </Section>

        <Section
          title="Certification Progress Breakdown"
          description="Compare certification progress across organizational dimensions."
        >
          <Tabs defaultValue="geography">
            <TabsList>
              <TabsTrigger value="geography">Geography</TabsTrigger>
              <TabsTrigger value="department">Department</TabsTrigger>
            </TabsList>
            <TabsContent value="geography" className="mt-4">
              <GeographyBreakdown />
            </TabsContent>
            <TabsContent value="department" className="mt-4">
              <DepartmentBreakdown />
            </TabsContent>
          </Tabs>
        </Section>

        <Section
          title="Master Trainer Directory"
          description="Individual certification status across all Selected Master Trainers."
        >
          <MTCertDirectory />
        </Section>
      </div>
    </div>
  );
}

function progressCells(rows: MTCertification[]) {
  const total = rows.length;
  const certified = rows.filter((r) => r.certStatus === "Certified").length;
  const inProgress = rows.filter(
    (r) =>
      r.certStatus === "In Training" || r.certStatus === "Assessment Pending",
  ).length;
  const failed = rows.filter((r) => r.certStatus === "Failed").length;
  const rate = total ? Math.round((certified / total) * 1000) / 10 : 0;
  const tone: StatusTone = rate >= 75 ? "success" : rate >= 55 ? "warning" : "critical";
  return [
    total,
    inProgress,
    certified,
    failed,
    <StatusPill key="r" tone={tone}>
      {rate}%
    </StatusPill>,
  ];
}

const CERT_COLS = [
  { header: "Selected", align: "right" as const },
  { header: "In Progress", align: "right" as const },
  { header: "Certified", align: "right" as const },
  { header: "Failed", align: "right" as const },
  { header: "Certification Rate", align: "right" as const },
];

function GeographyBreakdown() {
  const rows = useMemo<HierRow[]>(() => {
    const byDiv = new Map<string, MTCertification[]>();
    for (const r of MT_CERTIFICATIONS) {
      const arr = byDiv.get(r.division) ?? [];
      arr.push(r);
      byDiv.set(r.division, arr);
    }
    return Array.from(byDiv.entries()).map(([division, divRows]) => {
      const byDist = new Map<string, MTCertification[]>();
      for (const r of divRows) {
        const arr = byDist.get(r.district) ?? [];
        arr.push(r);
        byDist.set(r.district, arr);
      }
      const distRows = Array.from(byDist.entries()).map(([district, dRows]) => {
        const byTal = new Map<string, MTCertification[]>();
        for (const r of dRows) {
          const arr = byTal.get(r.taluka) ?? [];
          arr.push(r);
          byTal.set(r.taluka, arr);
        }
        const talRows = Array.from(byTal.entries()).map(([taluka, tRows]) => ({
          key: `${division}/${district}/${taluka}`,
          label: taluka,
          values: progressCells(tRows),
        }));
        return {
          key: `${division}/${district}`,
          label: district,
          values: progressCells(dRows),
          children: talRows,
        };
      });
      return {
        key: division,
        label: division,
        values: progressCells(divRows),
        children: distRows,
      };
    });
  }, []);
  return (
    <HierarchicalBreakdownTable
      rows={rows}
      firstColHeader="Geography (Division → District → Taluka)"
      columns={CERT_COLS}
    />
  );
}

function DepartmentBreakdown() {
  const rows = useMemo<HierRow[]>(() => {
    return DEPARTMENTS.map((dept) => {
      const dRows = MT_CERTIFICATIONS.filter((r) => r.department === dept);
      return { key: dept, label: dept, values: progressCells(dRows) };
    });
  }, []);
  return (
    <HierarchicalBreakdownTable
      rows={rows}
      firstColHeader="Department"
      columns={CERT_COLS}
      allowExpand={false}
    />
  );
}

function MTCertDirectory() {
  const [statusFilter, setStatusFilter] = useState<CertStatus | "All">("All");
  const data = useMemo(
    () =>
      statusFilter === "All"
        ? MT_CERTIFICATIONS
        : MT_CERTIFICATIONS.filter((r) => r.certStatus === statusFilter),
    [statusFilter],
  );

  const columns: Column<MTCertification>[] = [
    {
      key: "name",
      header: "Master Trainer",
      accessor: (r) => (
        <div className="flex flex-col">
          <span className="font-medium text-foreground">{r.name}</span>
          <span className="text-xs text-muted-foreground">{r.designation}</span>
        </div>
      ),
      sortValue: (r) => r.name,
      exportValue: (r) => r.name,
    },
    {
      key: "department",
      header: "Department",
      accessor: (r) => r.department,
      sortValue: (r) => r.department,
      exportValue: (r) => r.department,
    },
    {
      key: "division",
      header: "Division",
      accessor: (r) => r.division,
      sortValue: (r) => r.division,
      exportValue: (r) => r.division,
    },
    {
      key: "district",
      header: "District",
      accessor: (r) => r.district,
      sortValue: (r) => r.district,
      exportValue: (r) => r.district,
    },
    {
      key: "score",
      header: "Final Score",
      accessor: (r) => (
        <span className="tabular-nums font-medium">{r.finalScore ?? "—"}</span>
      ),
      sortValue: (r) => r.finalScore ?? -1,
      exportValue: (r) => r.finalScore ?? "",
      align: "right",
    },
    {
      key: "batches",
      header: "Batches Taught",
      accessor: (r) => <span className="tabular-nums">{r.batchesTaught}</span>,
      sortValue: (r) => r.batchesTaught,
      exportValue: (r) => r.batchesTaught,
      align: "right",
    },
    {
      key: "status",
      header: "Certification Status",
      accessor: (r) => (
        <StatusPill tone={CERT_TONE[r.certStatus]}>{r.certStatus}</StatusPill>
      ),
      sortValue: (r) => r.certStatus,
      exportValue: (r) => r.certStatus,
    },
    {
      key: "overall",
      header: "Overall Score",
      accessor: () => <PlaceholderMetric />,
      exportValue: () => "pending",
    },
  ];

  const options: Array<CertStatus | "All"> = [
    "All",
    "Not Started",
    "In Training",
    "Assessment Pending",
    "Certified",
    "Failed",
  ];

  return (
    <DataTable
      data={data}
      columns={columns}
      searchKeys={["name", "department", "district", "taluka"]}
      pageSize={12}
      getRowId={(r) => r.id}
      toolbar={
        <div className="flex items-center gap-1">
          {options.map((o) => (
            <button
              key={o}
              type="button"
              onClick={() => setStatusFilter(o)}
              className={
                "h-8 px-2.5 rounded-md text-xs font-medium transition-colors " +
                (statusFilter === o
                  ? "bg-secondary text-secondary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted")
              }
            >
              {o}
            </button>
          ))}
        </div>
      }
    />
  );
}
