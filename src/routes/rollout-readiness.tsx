import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";

import { PageHeader } from "@/components/dashboard/page-header";
import { Section, SectionCard } from "@/components/dashboard/section";
import { SplitSnapshotPanel } from "@/components/dashboard/split-snapshot-panel";
import { MetricPanel } from "@/components/dashboard/metric-panel";
import { StatusPill } from "@/components/dashboard/status-pill";
import { DataTable, type Column } from "@/components/dashboard/data-table";
import { FilterSelect } from "@/components/dashboard/filter-bar";
import { DepartmentDiversityChart } from "@/components/dashboard/department-diversity-chart";
import {
  HierarchicalBreakdownTable,
  type HierRow,
} from "@/components/dashboard/hierarchical-breakdown-table";
import { cn } from "@/lib/utils";

import {
  PLANNED_TALUKAS,
  activeDistrictNames,
  ROLLOUT_BATCHES,
  ROLLOUT_BATCH_BY_ID,
  ROLLOUT_PARTICIPANTS,
  buildRolloutSummaryRows,
  computeSnapshot,
  departmentComposition,
  type ChartViewLevel,
  type RolloutBatch,
  type RolloutParticipant,
} from "@/data/rollout-readiness";
import { DEPARTMENTS, DISTRICTS, DIVISIONS } from "@/data/geography";

export const Route = createFileRoute("/rollout-readiness")({
  head: () => ({
    meta: [
      { title: "Rollout Readiness · Zilla Analytics" },
      {
        name: "description",
        content:
          "Deployment Rollout stage readiness — participants uploaded, batches scheduled and department diversity across geographies.",
      },
      { property: "og:title", content: "Rollout Readiness · Zilla Analytics" },
      {
        property: "og:description",
        content:
          "Taluka-level rollout readiness: participants uploaded, batches scheduled and department composition of uploads.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: RolloutReadinessDashboard,
});

type DetailTab = "participants" | "batches";

function RolloutReadinessDashboard() {
  const snapshot = useMemo(() => computeSnapshot(), []);
  const summaryRows = useMemo<HierRow[]>(() => buildRolloutSummaryRows(), []);
  const activeDistricts = useMemo(() => activeDistrictNames(), []);

  // Department diversity chart controls
  const [chartView, setChartView] = useState<ChartViewLevel>("division");
  const [chartDivision, setChartDivision] = useState("All");
  const [chartDistrict, setChartDistrict] = useState("All");
  const [chartTaluka, setChartTaluka] = useState("All");

  const chartColumns = useMemo(
    () =>
      departmentComposition(chartView, {
        division: chartDivision,
        district: chartDistrict,
        taluka: chartTaluka,
      }),
    [chartView, chartDivision, chartDistrict, chartTaluka],
  );

  const [detailTab, setDetailTab] = useState<DetailTab>("participants");

  return (
    <div className="pb-16">
      <PageHeader
        title="Rollout Readiness"
        description="Deployment Rollout stage readiness — Field Staff uploads, batch scheduling and department mix across geographies."
      />

      <div className="px-8 pt-8 space-y-10">
        {/* Section 1 — Snapshot */}
        <Section title="Snapshot">
          <SplitSnapshotPanel
            left={
              <MetricPanel
                title="Overall"
                groups={[
                  {
                    items: [
                      {
                        label: "Districts Active",
                        value: snapshot.districtsActive.toLocaleString("en-IN"),
                      },
                      {
                        label: "Field Staff Required",
                        value: snapshot.fieldStaffRequired.toLocaleString(
                          "en-IN",
                        ),
                      },
                      {
                        label: "Field Staff Uploaded",
                        value: snapshot.participantsUploaded.toLocaleString(
                          "en-IN",
                        ),
                      },
                      {
                        label: "Batches Scheduled",
                        value: snapshot.batchesScheduled.toLocaleString("en-IN"),
                      },
                    ],
                  },
                ]}
              />
            }
            rightTitle="District Status"
            right={<ActiveDistrictsPanel districts={activeDistricts} />}
          />
        </Section>

        {/* Section 2 — Rollout Readiness Summary */}
        <Section title="Rollout Readiness Summary">
          <HierarchicalBreakdownTable
            rows={summaryRows}
            firstColHeader="Geography"
            exportable
            exportFileName="rollout-readiness-summary.csv"
            columns={[
              { header: "Field Staff Required", align: "right" },
              { header: "Field Staff Uploaded", align: "right" },
              { header: "Batches Required", align: "right" },
              { header: "Batches Scheduled", align: "right" },
            ]}
          />
        </Section>

        {/* Section 3 — Department Diversity within Geographies */}
        <Section title="Department Diversity within Geographies">
          <SectionCard>
            <div className="mb-5 flex flex-wrap items-end gap-3">
              <FilterSelect
                label="View"
                value={chartView}
                onChange={(v) => setChartView(v as ChartViewLevel)}
                width={170}
                options={[
                  { label: "Division-wise", value: "division" },
                  { label: "District-wise", value: "district" },
                  { label: "Taluka-wise", value: "taluka" },
                ]}
              />
              <FilterSelect
                label="Division"
                value={chartDivision}
                onChange={(v) => {
                  setChartDivision(v);
                  setChartDistrict("All");
                  setChartTaluka("All");
                }}
                options={[
                  { label: "All", value: "All" },
                  ...DIVISIONS.map((d) => ({ label: d, value: d })),
                ]}
              />
              <FilterSelect
                label="District"
                value={chartDistrict}
                onChange={(v) => {
                  setChartDistrict(v);
                  setChartTaluka("All");
                }}
                width={200}
                options={[
                  { label: "All", value: "All" },
                  ...DISTRICTS.filter(
                    (d) =>
                      chartDivision === "All" || d.division === chartDivision,
                  ).map((d) => ({ label: d.name, value: d.name })),
                ]}
              />
              <FilterSelect
                label="Taluka"
                value={chartTaluka}
                onChange={setChartTaluka}
                width={200}
                options={[
                  { label: "All", value: "All" },
                  ...PLANNED_TALUKAS.filter(
                    (t) =>
                      (chartDivision === "All" ||
                        t.division === chartDivision) &&
                      (chartDistrict === "All" ||
                        t.district === chartDistrict),
                  ).map((t) => ({ label: t.taluka, value: t.taluka })),
                ]}
              />
            </div>
            <DepartmentDiversityChart
              columns={chartColumns}
              departments={[...DEPARTMENTS]}
              xAxisTitle="Geography"
            />
          </SectionCard>
        </Section>

        {/* Section 4 — Detail View */}
        <Section
          title="Uploaded Participants / Batches Scheduled"
          actions={<DetailTabSwitch value={detailTab} onChange={setDetailTab} />}
        >
          {detailTab === "participants" ? (
            <ParticipantsDetail />
          ) : (
            <BatchesDetail />
          )}
        </Section>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Detail view — shared tab switch
// ---------------------------------------------------------------------------

function DetailTabSwitch({
  value,
  onChange,
}: {
  value: DetailTab;
  onChange: (tab: DetailTab) => void;
}) {
  const options: [DetailTab, string][] = [
    ["participants", "Uploaded Participants"],
    ["batches", "Batches Scheduled"],
  ];
  return (
    <div
      className="inline-flex rounded-md border bg-muted/30 p-0.5"
      role="group"
      aria-label="Detail view"
    >
      {options.map(([option, label]) => (
        <button
          key={option}
          type="button"
          onClick={() => onChange(option)}
          className={cn(
            "rounded px-3 py-1.5 text-xs font-medium transition-colors",
            value === option
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
          aria-pressed={value === option}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Detail view — cascading geography filters
// ---------------------------------------------------------------------------

function GeographyFilters({
  division,
  district,
  taluka,
  onDivision,
  onDistrict,
  onTaluka,
}: {
  division: string;
  district: string;
  taluka: string;
  onDivision: (v: string) => void;
  onDistrict: (v: string) => void;
  onTaluka: (v: string) => void;
}) {
  return (
    <div className="mb-4 flex flex-wrap items-end gap-3">
      <FilterSelect
        label="Division"
        value={division}
        onChange={(v) => {
          onDivision(v);
          onDistrict("All");
          onTaluka("All");
        }}
        options={[
          { label: "All", value: "All" },
          ...DIVISIONS.map((d) => ({ label: d, value: d })),
        ]}
      />
      <FilterSelect
        label="District"
        value={district}
        onChange={(v) => {
          onDistrict(v);
          onTaluka("All");
        }}
        width={200}
        options={[
          { label: "All", value: "All" },
          ...DISTRICTS.filter(
            (d) => division === "All" || d.division === division,
          ).map((d) => ({ label: d.name, value: d.name })),
        ]}
      />
      <FilterSelect
        label="Taluka"
        value={taluka}
        onChange={onTaluka}
        width={200}
        options={[
          { label: "All", value: "All" },
          ...PLANNED_TALUKAS.filter(
            (t) =>
              (division === "All" || t.division === division) &&
              (district === "All" || t.district === district),
          ).map((t) => ({ label: t.taluka, value: t.taluka })),
        ]}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Detail view — Uploaded Participants tab
// ---------------------------------------------------------------------------

type ParticipantRow = RolloutParticipant & {
  batchName: string | null;
  coach1: string | null;
  coach2: string | null;
  venue: string | null;
};

function ParticipantsDetail() {
  const [division, setDivision] = useState("All");
  const [district, setDistrict] = useState("All");
  const [taluka, setTaluka] = useState("All");

  const rows = useMemo<ParticipantRow[]>(() => {
    return ROLLOUT_PARTICIPANTS.filter(
      (p) =>
        (division === "All" || p.division === division) &&
        (district === "All" || p.district === district) &&
        (taluka === "All" || p.taluka === taluka),
    ).map((p) => {
      const batch = p.batchId ? ROLLOUT_BATCH_BY_ID.get(p.batchId) : undefined;
      return {
        ...p,
        batchName: batch?.name ?? null,
        coach1: batch?.coach1 ?? null,
        coach2: batch?.coach2 ?? null,
        venue: batch?.venue ?? null,
      };
    });
  }, [division, district, taluka]);

  const columns: Column<ParticipantRow>[] = [
    {
      key: "id",
      header: "Field Staff ID",
      accessor: (r) => <span className="text-xs tabular-nums">{r.id}</span>,
      sortValue: (r) => r.id,
      exportValue: (r) => r.id,
    },
    {
      key: "name",
      header: "Field Staff Name",
      accessor: (r) => (
        <span className="font-medium text-foreground">{r.name}</span>
      ),
      sortValue: (r) => r.name,
      exportValue: (r) => r.name,
    },
    {
      key: "designation",
      header: "Designation",
      accessor: (r) => r.designation,
      sortValue: (r) => r.designation,
      exportValue: (r) => r.designation,
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
      key: "phone",
      header: "Phone No",
      // Phone stays text so leading digits are never altered.
      accessor: (r) => <span className="text-xs tabular-nums">{r.phone}</span>,
      sortValue: (r) => r.phone,
      exportValue: (r) => r.phone,
    },
    {
      key: "batchName",
      header: "Batch Name",
      accessor: (r) => r.batchName ?? "—",
      sortValue: (r) => r.batchName ?? "",
      exportValue: (r) => r.batchName ?? "",
    },
    {
      key: "coach1",
      header: "Coach 1",
      accessor: (r) => r.coach1 ?? "—",
      sortValue: (r) => r.coach1 ?? "",
      exportValue: (r) => r.coach1 ?? "",
    },
    {
      key: "coach2",
      header: "Coach 2",
      accessor: (r) => r.coach2 ?? "—",
      sortValue: (r) => r.coach2 ?? "",
      exportValue: (r) => r.coach2 ?? "",
    },
    {
      key: "venue",
      header: "Venue",
      accessor: (r) => r.venue ?? "—",
      sortValue: (r) => r.venue ?? "",
      exportValue: (r) => r.venue ?? "",
    },
  ];

  return (
    <div>
      <GeographyFilters
        division={division}
        district={district}
        taluka={taluka}
        onDivision={setDivision}
        onDistrict={setDistrict}
        onTaluka={setTaluka}
      />
      <DataTable
        data={rows}
        columns={columns}
        searchKeys={[
          "id",
          "name",
          "designation",
          "department",
          "division",
          "district",
          "taluka",
          "phone",
          "batchName",
        ]}
        pageSize={15}
        getRowId={(r) => r.id}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Detail view — Batches Scheduled tab
// ---------------------------------------------------------------------------

type BatchRow = RolloutBatch & { participants: number };

function BatchesDetail() {
  const [division, setDivision] = useState("All");
  const [district, setDistrict] = useState("All");
  const [taluka, setTaluka] = useState("All");

  const rows = useMemo<BatchRow[]>(() => {
    const counts = new Map<string, number>();
    for (const p of ROLLOUT_PARTICIPANTS) {
      if (p.batchId) counts.set(p.batchId, (counts.get(p.batchId) ?? 0) + 1);
    }
    return ROLLOUT_BATCHES.filter(
      (b) =>
        (division === "All" || b.division === division) &&
        (district === "All" || b.district === district) &&
        (taluka === "All" || b.taluka === taluka),
    ).map((b) => ({ ...b, participants: counts.get(b.id) ?? 0 }));
  }, [division, district, taluka]);

  const columns: Column<BatchRow>[] = [
    {
      key: "name",
      header: "Batch Name",
      accessor: (r) => (
        <span className="font-medium text-foreground">{r.name}</span>
      ),
      sortValue: (r) => r.name,
      exportValue: (r) => r.name,
    },
    {
      key: "coach1",
      header: "Coach 1",
      accessor: (r) => r.coach1,
      sortValue: (r) => r.coach1,
      exportValue: (r) => r.coach1,
    },
    {
      key: "coach2",
      header: "Coach 2",
      accessor: (r) => r.coach2 ?? "—",
      sortValue: (r) => r.coach2 ?? "",
      exportValue: (r) => r.coach2 ?? "",
    },
    {
      key: "participants",
      header: "Participants",
      accessor: (r) => <span className="tabular-nums">{r.participants}</span>,
      sortValue: (r) => r.participants,
      exportValue: (r) => r.participants,
      align: "right",
    },
    {
      key: "venue",
      header: "Venue",
      accessor: (r) => r.venue,
      sortValue: (r) => r.venue,
      exportValue: (r) => r.venue,
    },
    {
      key: "status",
      header: "Status",
      accessor: (r) => (
        <StatusPill tone={r.status === "Scheduled" ? "info" : "neutral"}>
          {r.status}
        </StatusPill>
      ),
      sortValue: (r) => r.status,
      exportValue: (r) => r.status,
    },
    {
      key: "startDate",
      header: "Start Date",
      accessor: (r) => <span className="tabular-nums">{r.startDate}</span>,
      sortValue: (r) => r.startDate,
      exportValue: (r) => r.startDate,
    },
    {
      key: "endDate",
      header: "End Date",
      accessor: (r) => <span className="tabular-nums">{r.endDate}</span>,
      sortValue: (r) => r.endDate,
      exportValue: (r) => r.endDate,
    },
  ];

  return (
    <div>
      <GeographyFilters
        division={division}
        district={district}
        taluka={taluka}
        onDivision={setDivision}
        onDistrict={setDistrict}
        onTaluka={setTaluka}
      />
      <DataTable
        data={rows}
        columns={columns}
        searchKeys={["name", "coach1", "coach2", "venue", "status"]}
        pageSize={15}
        getRowId={(r) => r.id}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Snapshot RHS — districts with at least one Active taluka
// ---------------------------------------------------------------------------

function ActiveDistrictsPanel({ districts }: { districts: string[] }) {
  return (
    <div className="text-sm">
      <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Active
      </h4>
      {districts.length === 0 ? (
        <p className="text-xs text-muted-foreground">None.</p>
      ) : (
        <ul className="flex flex-wrap gap-1.5">
          {districts.map((d) => (
            <li
              key={d}
              className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs text-primary ring-1 ring-inset ring-primary/20"
            >
              {d}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
