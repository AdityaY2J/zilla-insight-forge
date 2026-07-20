import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ChevronDown, ChevronRight } from "lucide-react";

import { PageHeader } from "@/components/dashboard/page-header";
import { Section, SectionCard } from "@/components/dashboard/section";
import { KpiCard, KpiGrid } from "@/components/dashboard/kpi-card";
import { StatusPill } from "@/components/dashboard/status-pill";
import { DataTable, type Column } from "@/components/dashboard/data-table";
import { FunnelChart } from "@/components/dashboard/funnel-chart";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

import {
  MT_NOMINATIONS,
  SELECTED_MTS,
  selectionFunnel,
  geographyBreakdown,
  departmentBreakdown,
  type BreakdownRow,
  type MTNomination,
} from "@/data/mt-selection";

export const Route = createFileRoute("/mt-selection")({
  head: () => ({
    meta: [
      { title: "MT Selection · Zilla Analytics" },
      {
        name: "description",
        content:
          "Master Trainer nomination and selection pipeline: KPIs, conversion funnel, geography and department performance, selected MT directory.",
      },
    ],
  }),
  component: MTSelectionDashboard,
});

function MTSelectionDashboard() {
  const funnel = useMemo(() => selectionFunnel(MT_NOMINATIONS), []);
  const selectionRate = funnel.nominated
    ? Math.round((funnel.selected / funnel.nominated) * 1000) / 10
    : 0;

  return (
    <div className="pb-16">
      <PageHeader
        title="Master Trainer Selection"
        description="Visibility into the MT Nomination and Selection stage. Monitor the health of the selection pipeline and identify Master Trainers ready to progress into Certification."
      />

      <div className="px-8 pt-8 space-y-10">
        {/* Section 1 — Snapshot KPIs */}
        <Section title="Snapshot KPIs">
          <KpiGrid>
            <KpiCard
              title="Total Nominated MTs"
              value={funnel.nominated.toLocaleString("en-IN")}
              context="Across all divisions and departments"
              accent="info"
            />
            <KpiCard
              title="Total Assessed MTs"
              value={funnel.appeared.toLocaleString("en-IN")}
              context={`${Math.round((funnel.appeared / funnel.nominated) * 100)}% of nominated`}
              accent="info"
            />
            <KpiCard
              title="Total Selected MTs"
              value={funnel.selected.toLocaleString("en-IN")}
              context={`${Math.round((funnel.selected / (funnel.appeared || 1)) * 100)}% of assessed`}
              accent="success"
            />
            <KpiCard
              title="Overall Selection Rate"
              value={`${selectionRate}%`}
              context="Selected / Nominated"
              accent={selectionRate >= 50 ? "success" : selectionRate >= 35 ? "warning" : "critical"}
            />
          </KpiGrid>
        </Section>

        {/* Section 2 — Funnel */}
        <Section
          title="Nomination to Selection Funnel"
          description="Conversion through each stage of the selection process. Drop-offs indicate stages requiring intervention."
        >
          <SectionCard>
            <FunnelChart
              stages={[
                { label: "Nominated", value: funnel.nominated, tone: "info" },
                { label: "Appeared for Assessment", value: funnel.appeared, tone: "info" },
                { label: "Selected", value: funnel.selected, tone: "success" },
                { label: "Not Selected", value: funnel.notSelected, tone: "critical" },
              ]}
            />
          </SectionCard>
        </Section>

        {/* Section 3 — Breakdown */}
        <Section
          title="Selection Performance Breakdown"
          description="Compare selection performance across organizational dimensions to quickly identify areas performing well or requiring intervention."
        >
          <Tabs defaultValue="geography">
            <TabsList>
              <TabsTrigger value="geography">Geography</TabsTrigger>
              <TabsTrigger value="department">Department</TabsTrigger>
            </TabsList>
            <TabsContent value="geography" className="mt-4">
              <GeographyBreakdownTable />
            </TabsContent>
            <TabsContent value="department" className="mt-4">
              <DepartmentBreakdownTable />
            </TabsContent>
          </Tabs>
        </Section>

        {/* Section 4 — Directory */}
        <Section
          title="Selected Master Trainer Directory"
          description="Master Trainers who have successfully cleared the assessment and are ready to progress into MT Certification."
        >
          <SelectedMTDirectory />
        </Section>
      </div>
    </div>
  );
}

/* -------------------- Breakdown tables -------------------- */

function GeographyBreakdownTable() {
  const rows = useMemo(() => geographyBreakdown(MT_NOMINATIONS), []);
  return <HierarchicalBreakdownTable rows={rows} firstColHeader="Geography (Division → District → Taluka)" />;
}

function DepartmentBreakdownTable() {
  const rows = useMemo(() => departmentBreakdown(MT_NOMINATIONS), []);
  return <HierarchicalBreakdownTable rows={rows} firstColHeader="Department" allowExpand={false} />;
}

function HierarchicalBreakdownTable({
  rows,
  firstColHeader,
  allowExpand = true,
}: {
  rows: BreakdownRow[];
  firstColHeader: string;
  allowExpand?: boolean;
}) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const toggle = (key: string) => setExpanded((p) => ({ ...p, [key]: !p[key] }));

  const flat: Array<{ row: BreakdownRow; depth: number }> = [];
  const walk = (list: BreakdownRow[], depth: number) => {
    for (const r of list) {
      flat.push({ row: r, depth });
      if (allowExpand && expanded[r.key] && r.children?.length) {
        walk(r.children, depth + 1);
      }
    }
  };
  walk(rows, 0);

  return (
    <div className="rounded-lg border bg-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-2.5 text-left font-medium">{firstColHeader}</th>
              <th className="px-4 py-2.5 text-right font-medium">Nominated</th>
              <th className="px-4 py-2.5 text-right font-medium">Assessed</th>
              <th className="px-4 py-2.5 text-right font-medium">Selected</th>
              <th className="px-4 py-2.5 text-right font-medium">Selection Rate</th>
            </tr>
          </thead>
          <tbody>
            {flat.map(({ row, depth }) => {
              const hasChildren = allowExpand && !!row.children?.length;
              const isOpen = expanded[row.key];
              return (
                <tr key={row.key} className="border-t hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-2.5">
                    <div
                      className="flex items-center gap-1.5"
                      style={{ paddingLeft: `${depth * 20}px` }}
                    >
                      {hasChildren ? (
                        <button
                          type="button"
                          onClick={() => toggle(row.key)}
                          className="h-5 w-5 inline-flex items-center justify-center rounded hover:bg-muted"
                          aria-label={isOpen ? "Collapse" : "Expand"}
                        >
                          {isOpen ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </button>
                      ) : (
                        <span className="w-5" />
                      )}
                      <span
                        className={cn(
                          depth === 0
                            ? "font-medium text-foreground"
                            : depth === 1
                              ? "text-foreground"
                              : "text-muted-foreground",
                        )}
                      >
                        {row.label}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{row.nominated}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{row.assessed}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{row.selected}</td>
                  <td className="px-4 py-2.5 text-right">
                    <RateBadge rate={row.selectionRate} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function RateBadge({ rate }: { rate: number }) {
  const tone = rate >= 55 ? "success" : rate >= 40 ? "warning" : "critical";
  return <StatusPill tone={tone}>{rate}%</StatusPill>;
}

/* -------------------- Directory -------------------- */

function SelectedMTDirectory() {
  const columns: Column<MTNomination>[] = [
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
      key: "taluka",
      header: "Taluka",
      accessor: (r) => r.taluka,
      sortValue: (r) => r.taluka,
      exportValue: (r) => r.taluka,
    },
    {
      key: "score",
      header: "Assessment Score",
      accessor: (r) => (
        <span className="tabular-nums font-medium text-foreground">
          {r.assessmentScore ?? "—"}
        </span>
      ),
      sortValue: (r) => r.assessmentScore ?? -1,
      exportValue: (r) => r.assessmentScore ?? "",
      align: "right",
    },
    {
      key: "status",
      header: "Selection Status",
      accessor: () => <StatusPill tone="success">Selected</StatusPill>,
      sortValue: (r) => r.status,
      exportValue: (r) => r.status,
    },
  ];

  return (
    <DataTable
      data={SELECTED_MTS}
      columns={columns}
      searchKeys={["name", "department", "division", "district", "taluka", "designation"]}
      pageSize={12}
      getRowId={(r) => r.id}
    />
  );
}
