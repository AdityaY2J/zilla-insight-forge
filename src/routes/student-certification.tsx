import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";

import { PageHeader } from "@/components/dashboard/page-header";
import { Section, SectionCard } from "@/components/dashboard/section";
import { KpiCard, KpiGrid } from "@/components/dashboard/kpi-card";
import { StatusPill, type StatusTone } from "@/components/dashboard/status-pill";
import { DataTable, type Column } from "@/components/dashboard/data-table";
import { FilterSelect } from "@/components/dashboard/filter-bar";
import { FunnelChart } from "@/components/dashboard/funnel-chart";
import { PlaceholderMetric } from "@/components/dashboard/placeholder-metric";
import {
  HierarchicalBreakdownTable,
  type HierRow,
} from "@/components/dashboard/hierarchical-breakdown-table";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

import {
  STUDENTS,
  studentFunnel,
  type Student,
  type StudentStatus,
} from "@/data/students";
import { DEPARTMENTS, DIVISIONS } from "@/data/geography";

export const Route = createFileRoute("/student-certification")({
  head: () => ({
    meta: [
      { title: "Student Certification · Zilla Analytics" },
      {
        name: "description",
        content:
          "Field Staff certification progress across the Deployment Rollout stage: enrollment funnel, geography and department performance, participant directory.",
      },
    ],
  }),
  component: StudentCertificationDashboard,
});

const STATUS_TONE: Record<StudentStatus, StatusTone> = {
  Enrolled: "neutral",
  "In Training": "info",
  "Assessment Pending": "warning",
  Certified: "success",
  Failed: "critical",
  "Dropped Out": "critical",
};

function StudentCertificationDashboard() {
  const [division, setDivision] = useState<string>("All");
  const [department, setDepartment] = useState<string>("All");

  const filtered = useMemo(
    () =>
      STUDENTS.filter((s) => {
        if (division !== "All" && s.division !== division) return false;
        if (department !== "All" && s.department !== department) return false;
        return true;
      }),
    [division, department],
  );
  const f = useMemo(() => studentFunnel(filtered), [filtered]);
  const certRate = f.assessed
    ? Math.round((f.certified / f.assessed) * 1000) / 10
    : 0;
  const dropouts = filtered.filter((s) => s.status === "Dropped Out").length;

  return (
    <div className="pb-16">
      <PageHeader
        title="Student Certification"
        description="Track Field Staff certification across the Deployment Rollout stage. Identify geographies and departments where certification outcomes need intervention."
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
              label="Department"
              value={department}
              onChange={setDepartment}
              width={240}
              options={[
                { label: "All Departments", value: "All" },
                ...DEPARTMENTS.map((d) => ({ label: d, value: d })),
              ]}
            />
          </>
        }
      />

      <div className="px-8 pt-8 space-y-10">
        <Section title="Snapshot KPIs">
          <KpiGrid cols={5}>
            <KpiCard
              title="Enrolled"
              value={f.enrolled.toLocaleString("en-IN")}
              accent="info"
            />
            <KpiCard
              title="In Training"
              value={f.inTraining.toLocaleString("en-IN")}
              accent="info"
            />
            <KpiCard
              title="Certified"
              value={f.certified.toLocaleString("en-IN")}
              context={`${certRate}% of assessed`}
              accent="success"
            />
            <KpiCard
              title="Dropouts"
              value={dropouts.toLocaleString("en-IN")}
              accent={dropouts > 0 ? "critical" : "default"}
            />
            <KpiCard
              title="Certification Rate"
              value={`${certRate}%`}
              context="Certified / Assessed"
              accent={
                certRate >= 75 ? "success" : certRate >= 60 ? "warning" : "critical"
              }
            />
          </KpiGrid>
        </Section>

        <Section
          title="Enrollment to Certification Funnel"
          description="Progression of Field Staff through the certification stages."
        >
          <SectionCard>
            <FunnelChart
              stages={[
                { label: "Enrolled", value: f.enrolled, tone: "info" },
                { label: "In Training", value: f.inTraining, tone: "info" },
                { label: "Assessed", value: f.assessed, tone: "info" },
                { label: "Certified", value: f.certified, tone: "success" },
              ]}
            />
          </SectionCard>
        </Section>

        <Section
          title="Certification Performance Breakdown"
          description="Compare certification outcomes across organizational dimensions."
        >
          <Tabs defaultValue="geography">
            <TabsList>
              <TabsTrigger value="geography">Geography</TabsTrigger>
              <TabsTrigger value="department">Department</TabsTrigger>
            </TabsList>
            <TabsContent value="geography" className="mt-4">
              <GeographyBreakdown rows={filtered} />
            </TabsContent>
            <TabsContent value="department" className="mt-4">
              <DepartmentBreakdown rows={filtered} />
            </TabsContent>
          </Tabs>
        </Section>

        <Section
          title="Field Staff Directory"
          description="Individual certification records. Filter by division and department using the header filters."
        >
          <StudentDirectory rows={filtered} />
        </Section>
      </div>
    </div>
  );
}

function studentCells(rows: Student[]) {
  const total = rows.length;
  const inTraining = rows.filter(
    (r) => r.status !== "Enrolled" && r.status !== "Dropped Out",
  ).length;
  const certified = rows.filter((r) => r.status === "Certified").length;
  const dropped = rows.filter((r) => r.status === "Dropped Out").length;
  const rate = total ? Math.round((certified / total) * 1000) / 10 : 0;
  const tone: StatusTone =
    rate >= 55 ? "success" : rate >= 35 ? "warning" : "critical";
  return [
    total,
    inTraining,
    certified,
    dropped,
    <StatusPill key="r" tone={tone}>
      {rate}%
    </StatusPill>,
  ];
}

const COLS = [
  { header: "Enrolled", align: "right" as const },
  { header: "In Training", align: "right" as const },
  { header: "Certified", align: "right" as const },
  { header: "Dropped Out", align: "right" as const },
  { header: "Cert Rate", align: "right" as const },
];

function GeographyBreakdown({ rows }: { rows: Student[] }) {
  const hier = useMemo<HierRow[]>(() => {
    const byDiv = new Map<string, Student[]>();
    for (const r of rows) {
      const arr = byDiv.get(r.division) ?? [];
      arr.push(r);
      byDiv.set(r.division, arr);
    }
    return Array.from(byDiv.entries()).map(([division, divRows]) => {
      const byDist = new Map<string, Student[]>();
      for (const r of divRows) {
        const arr = byDist.get(r.district) ?? [];
        arr.push(r);
        byDist.set(r.district, arr);
      }
      const distRows = Array.from(byDist.entries()).map(([district, dRows]) => ({
        key: `${division}/${district}`,
        label: district,
        values: studentCells(dRows),
      }));
      return {
        key: division,
        label: division,
        values: studentCells(divRows),
        children: distRows,
      };
    });
  }, [rows]);
  return (
    <HierarchicalBreakdownTable
      rows={hier}
      firstColHeader="Geography (Division → District)"
      columns={COLS}
    />
  );
}

function DepartmentBreakdown({ rows }: { rows: Student[] }) {
  const hier = useMemo<HierRow[]>(
    () =>
      DEPARTMENTS.map((dept) => ({
        key: dept,
        label: dept,
        values: studentCells(rows.filter((r) => r.department === dept)),
      })),
    [rows],
  );
  return (
    <HierarchicalBreakdownTable
      rows={hier}
      firstColHeader="Department"
      columns={COLS}
      allowExpand={false}
    />
  );
}

function StudentDirectory({ rows }: { rows: Student[] }) {
  const columns: Column<Student>[] = [
    {
      key: "name",
      header: "Participant",
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
      key: "batch",
      header: "Batch",
      accessor: (r) => (
        <span className="text-xs tabular-nums">{r.batchCode}</span>
      ),
      sortValue: (r) => r.batchCode,
      exportValue: (r) => r.batchCode,
    },
    {
      key: "department",
      header: "Department",
      accessor: (r) => r.department,
      sortValue: (r) => r.department,
      exportValue: (r) => r.department,
    },
    {
      key: "location",
      header: "Location",
      accessor: (r) => (
        <span className="text-sm text-muted-foreground">
          {r.taluka}, {r.district}
        </span>
      ),
      sortValue: (r) => r.district,
      exportValue: (r) => `${r.taluka}, ${r.district}`,
    },
    {
      key: "attendance",
      header: "Attendance",
      accessor: (r) => <span className="tabular-nums">{r.attendancePct}%</span>,
      sortValue: (r) => r.attendancePct,
      exportValue: (r) => r.attendancePct,
      align: "right",
    },
    {
      key: "score",
      header: "Final Score",
      accessor: (r) => (
        <span className="tabular-nums">{r.finalScore ?? "—"}</span>
      ),
      sortValue: (r) => r.finalScore ?? -1,
      exportValue: (r) => r.finalScore ?? "",
      align: "right",
    },
    {
      key: "learning",
      header: "Learning Score",
      accessor: () => <PlaceholderMetric />,
      exportValue: () => "pending",
    },
    {
      key: "status",
      header: "Status",
      accessor: (r) => <StatusPill tone={STATUS_TONE[r.status]}>{r.status}</StatusPill>,
      sortValue: (r) => r.status,
      exportValue: (r) => r.status,
    },
  ];
  return (
    <DataTable
      data={rows}
      columns={columns}
      searchKeys={["name", "batchCode", "district", "taluka", "department"]}
      pageSize={15}
      getRowId={(r) => r.id}
    />
  );
}
