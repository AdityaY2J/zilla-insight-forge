import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";

import { PageHeader } from "@/components/dashboard/page-header";
import { Section } from "@/components/dashboard/section";
import { KpiCard, KpiGrid } from "@/components/dashboard/kpi-card";
import { DataTable, type Column } from "@/components/dashboard/data-table";
import { FilterSelect } from "@/components/dashboard/filter-bar";
import {
  HierarchicalBreakdownTable,
  type HierRow,
} from "@/components/dashboard/hierarchical-breakdown-table";
import {
  ScoreDistribution,
  ScoreDistributionBar,
} from "@/components/dashboard/score-distribution";

import {
  BATCHES,
  MASTER_TRAINERS,
  aggregateLearning,
  type Batch,
  type MasterTrainer,
} from "@/data/capacity-building";
import { DISTRICTS, DIVISIONS } from "@/data/geography";

export const Route = createFileRoute("/mt-learning-cognitive")({
  head: () => ({
    meta: [
      { title: "MT Learning & Cognitive · Zilla Analytics" },
      {
        name: "description",
        content:
          "Learning scores and cognitive belief shift for Master Trainers across geographies and batches.",
      },
    ],
  }),
  component: MTLearningCognitiveDashboard,
});

function signed(n: number) {
  const sign = n > 0 ? "+" : "";
  return `${sign}${n}%`;
}

function MTLearningCognitiveDashboard() {
  const [division, setDivision] = useState("All");
  const [district, setDistrict] = useState("All");
  const [taluka, setTaluka] = useState("All");

  const filteredBatches = useMemo(
    () =>
      BATCHES.filter((b) => {
        if (division !== "All" && b.division !== division) return false;
        if (district !== "All" && b.district !== district) return false;
        if (taluka !== "All" && b.taluka !== taluka) return false;
        return true;
      }),
    [division, district, taluka],
  );

  const agg = useMemo(() => aggregateLearning(filteredBatches), [filteredBatches]);

  const talukaOptions = useMemo(() => {
    const set = new Set<string>();
    for (const d of DISTRICTS) {
      if (district !== "All" && d.name !== district) continue;
      if (division !== "All" && d.division !== division) continue;
      d.talukas.forEach((t) => set.add(t));
    }
    return Array.from(set);
  }, [division, district]);

  return (
    <div className="pb-16">
      <PageHeader
        title="MT Learning & Cognitive"
        description="Learning outcomes and cognitive belief shift across the Capacity Building stage."
        filters={
          <>
            <FilterSelect
              label="Division"
              value={division}
              onChange={(v) => {
                setDivision(v);
                setDistrict("All");
                setTaluka("All");
              }}
              options={[
                { label: "All Divisions", value: "All" },
                ...DIVISIONS.map((d) => ({ label: d, value: d })),
              ]}
            />
            <FilterSelect
              label="District"
              value={district}
              onChange={(v) => {
                setDistrict(v);
                setTaluka("All");
              }}
              width={220}
              options={[
                { label: "All Districts", value: "All" },
                ...DISTRICTS.filter(
                  (d) => division === "All" || d.division === division,
                ).map((d) => ({ label: d.name, value: d.name })),
              ]}
            />
            <FilterSelect
              label="Taluka"
              value={taluka}
              onChange={setTaluka}
              width={200}
              options={[
                { label: "All Talukas", value: "All" },
                ...talukaOptions.map((t) => ({ label: t, value: t })),
              ]}
            />
          </>
        }
      />

      <div className="px-8 pt-8 space-y-10">
        <Section
          title="Snapshot"
          description="Overall learning and cognitive performance for the selected geography."
        >
          <KpiGrid cols={4}>
            <KpiCard
              title="Average Learning Score"
              value={`${Math.round((agg.d1Avg + agg.d2Avg) / 2)}%`}
              accent="info"
            />
            <KpiCard
              title="Learning Score Distribution"
              value={
                <ScoreDistribution
                  red={agg.redPct}
                  orange={agg.orangePct}
                  green={agg.greenPct}
                  size="md"
                />
              }
              context={
                <ScoreDistributionBar
                  red={agg.redPct}
                  orange={agg.orangePct}
                  green={agg.greenPct}
                />
              }
            />
            <KpiCard
              title="Avg. Cognitive Pre Score"
              value={agg.pre.toFixed(1)}
              context="Scale 0 – 10"
            />
            <KpiCard
              title="Avg. Cognitive Post Score"
              value={agg.post.toFixed(1)}
              context={`Shift ${signed(agg.cognitiveShiftPct)}`}
              accent="success"
            />
          </KpiGrid>
          <KpiGrid cols={3}>
            <KpiCard
              title="Disabling Belief Shift"
              value={signed(agg.disabling)}
              context="Lower is better"
              accent={agg.disabling < 0 ? "success" : "warning"}
            />
            <KpiCard
              title="Confused Belief Shift"
              value={signed(agg.confused)}
              context="Lower is better"
              accent={agg.confused < 0 ? "success" : "warning"}
            />
            <KpiCard
              title="Enabling Belief Shift"
              value={signed(agg.enabling)}
              context="Higher is better"
              accent="success"
            />
          </KpiGrid>
        </Section>

        <Section
          title="Geography-wise Learning & Cognitive Summary"
          description="Division → District → Taluka drill-down."
        >
          <GeographyLearningTable rows={filteredBatches} />
        </Section>

        <Section
          title="Batch-wise Learning & Cognitive Summary"
          description="One row per MT Capacity Building batch."
        >
          <BatchLearningTable rows={filteredBatches} />
        </Section>

        <Section
          title="Master Trainer-wise Learning & Cognitive Summary"
          description="Individual MT learning and cognitive performance."
        >
          <MTLearningTable
            rows={MASTER_TRAINERS.filter((m) => {
              if (division !== "All" && m.division !== division) return false;
              if (district !== "All" && m.district !== district) return false;
              if (taluka !== "All" && m.taluka !== taluka) return false;
              return m.certificationStatus !== "Pending";
            })}
          />
        </Section>
      </div>
    </div>
  );
}

function learningRow(batches: Batch[]): (React.ReactNode | number | string)[] {
  const a = aggregateLearning(batches);
  if (a.batches === 0) {
    return ["-", "-", "-", "-", "-", "-", "-", "-", "-", "-", "-", "-"];
  }
  return [
    a.d1Participants,
    a.d2Participants,
    `${a.d1Avg}%`,
    `${a.d2Avg}%`,
    `${a.redPct}%`,
    `${a.orangePct}%`,
    `${a.greenPct}%`,
    a.pre.toFixed(1),
    a.post.toFixed(1),
    signed(a.disabling),
    signed(a.confused),
    signed(a.enabling),
  ];
}

function GeographyLearningTable({ rows }: { rows: Batch[] }) {
  const hier = useMemo<HierRow[]>(
    () =>
      DIVISIONS.map((division) => {
        const divBatches = rows.filter((b) => b.division === division);
        const districts = DISTRICTS.filter((d) => d.division === division).map(
          (dist) => {
            const dBatches = divBatches.filter((b) => b.district === dist.name);
            const talukas: HierRow[] = dist.talukas.map((tk) => {
              const tBatches = dBatches.filter((b) => b.taluka === tk);
              return {
                key: `${division}/${dist.name}/${tk}`,
                label: tk,
                values: learningRow(tBatches),
              };
            });
            return {
              key: `${division}/${dist.name}`,
              label: `${dist.name} (District)`,
              values: learningRow(dBatches),
              children: talukas,
            };
          },
        );
        return {
          key: division,
          label: `${division} (Division)`,
          values: learningRow(divBatches),
          children: districts,
        };
      }),
    [rows],
  );
  return (
    <HierarchicalBreakdownTable
      rows={hier}
      firstColHeader="Geography"
      columns={[
        { header: "D1 Part.", align: "right" },
        { header: "D2 Part.", align: "right" },
        { header: "D1 Avg.", align: "right" },
        { header: "D2 Avg.", align: "right" },
        { header: "Red %", align: "right" },
        { header: "Orange %", align: "right" },
        { header: "Green %", align: "right" },
        { header: "Pre", align: "right" },
        { header: "Post", align: "right" },
        { header: "Disabling", align: "right" },
        { header: "Confused", align: "right" },
        { header: "Enabling", align: "right" },
      ]}
    />
  );
}

function BatchLearningTable({ rows }: { rows: Batch[] }) {
  const columns: Column<Batch>[] = [
    { key: "id", header: "Batch ID", accessor: (r) => r.id, sortValue: (r) => r.id, exportValue: (r) => r.id },
    { key: "name", header: "Batch Name", accessor: (r) => <span className="font-medium">{r.name}</span>, sortValue: (r) => r.name, exportValue: (r) => r.name },
    { key: "div", header: "Division", accessor: (r) => r.division, sortValue: (r) => r.division, exportValue: (r) => r.division },
    { key: "dist", header: "District", accessor: (r) => r.district, sortValue: (r) => r.district, exportValue: (r) => r.district },
    { key: "c1id", header: "Coach 1 ID", accessor: (r) => r.coach1Id, exportValue: (r) => r.coach1Id },
    { key: "c2id", header: "Coach 2 ID", accessor: (r) => r.coach2Id, exportValue: (r) => r.coach2Id },
    { key: "c1", header: "Coach 1", accessor: (r) => r.coach1Name, exportValue: (r) => r.coach1Name },
    { key: "c2", header: "Coach 2", accessor: (r) => r.coach2Name, exportValue: (r) => r.coach2Name },
    { key: "d1p", header: "D1 Part.", accessor: (r) => r.day1Participants, align: "right", sortValue: (r) => r.day1Participants, exportValue: (r) => r.day1Participants },
    { key: "d2p", header: "D2 Part.", accessor: (r) => r.day2Participants, align: "right", sortValue: (r) => r.day2Participants, exportValue: (r) => r.day2Participants },
    { key: "d1a", header: "D1 Avg.", accessor: (r) => `${r.day1AssessmentAvg}%`, align: "right", sortValue: (r) => r.day1AssessmentAvg, exportValue: (r) => r.day1AssessmentAvg },
    { key: "d2a", header: "D2 Avg.", accessor: (r) => `${r.day2AssessmentAvg}%`, align: "right", sortValue: (r) => r.day2AssessmentAvg, exportValue: (r) => r.day2AssessmentAvg },
    { key: "red", header: "Red %", accessor: (r) => <span className="text-critical tabular-nums">{r.redPct}%</span>, align: "right", sortValue: (r) => r.redPct, exportValue: (r) => r.redPct },
    { key: "orange", header: "Orange %", accessor: (r) => <span className="text-warning-foreground tabular-nums">{r.orangePct}%</span>, align: "right", sortValue: (r) => r.orangePct, exportValue: (r) => r.orangePct },
    { key: "green", header: "Green %", accessor: (r) => <span className="text-success tabular-nums">{r.greenPct}%</span>, align: "right", sortValue: (r) => r.greenPct, exportValue: (r) => r.greenPct },
    { key: "pre", header: "Pre", accessor: (r) => <span className="tabular-nums">{r.avgPreScore.toFixed(1)}</span>, align: "right", sortValue: (r) => r.avgPreScore, exportValue: (r) => r.avgPreScore },
    { key: "post", header: "Post", accessor: (r) => <span className="tabular-nums">{r.avgPostScore.toFixed(1)}</span>, align: "right", sortValue: (r) => r.avgPostScore, exportValue: (r) => r.avgPostScore },
    { key: "dis", header: "Disabling", accessor: (r) => signed(r.disablingShift), align: "right", sortValue: (r) => r.disablingShift, exportValue: (r) => r.disablingShift },
    { key: "conf", header: "Confused", accessor: (r) => signed(r.confusedShift), align: "right", sortValue: (r) => r.confusedShift, exportValue: (r) => r.confusedShift },
    { key: "ena", header: "Enabling", accessor: (r) => <span className="text-success">{signed(r.enablingShift)}</span>, align: "right", sortValue: (r) => r.enablingShift, exportValue: (r) => r.enablingShift },
  ];
  return (
    <DataTable
      data={rows}
      columns={columns}
      searchKeys={["id", "name", "district", "coach1Name"]}
      pageSize={12}
      getRowId={(r) => r.id}
    />
  );
}

function MTLearningTable({ rows }: { rows: MasterTrainer[] }) {
  const columns: Column<MasterTrainer>[] = [
    { key: "id", header: "MT ID", accessor: (r) => r.id, sortValue: (r) => r.id, exportValue: (r) => r.id },
    { key: "name", header: "Master Trainer", accessor: (r) => <span className="font-medium">{r.name}</span>, sortValue: (r) => r.name, exportValue: (r) => r.name },
    { key: "des", header: "Designation", accessor: (r) => r.designation, exportValue: (r) => r.designation },
    { key: "dept", header: "Department", accessor: (r) => r.department, exportValue: (r) => r.department },
    { key: "div", header: "Division", accessor: (r) => r.division, exportValue: (r) => r.division },
    { key: "dist", header: "District", accessor: (r) => r.district, exportValue: (r) => r.district },
    { key: "tal", header: "Taluka", accessor: (r) => r.taluka, exportValue: (r) => r.taluka },
    {
      key: "d1",
      header: "D1 Avg.",
      accessor: (r) => (
        <span className="tabular-nums">
          {r.assessment1 != null ? `${r.assessment1}%` : "—"}
        </span>
      ),
      align: "right",
      sortValue: (r) => r.assessment1 ?? -1,
      exportValue: (r) => r.assessment1 ?? "",
    },
    {
      key: "d2",
      header: "D2 Avg.",
      accessor: (r) => (
        <span className="tabular-nums">
          {r.assessment2 != null ? `${r.assessment2}%` : "—"}
        </span>
      ),
      align: "right",
      sortValue: (r) => r.assessment2 ?? -1,
      exportValue: (r) => r.assessment2 ?? "",
    },
    // Pre/Post/Belief shifts are per-MT derived from their coached batches;
    // we surface placeholders here since per-MT rollups aren't formalised yet.
    { key: "pre", header: "Pre", accessor: () => <span className="text-muted-foreground">—</span>, exportValue: () => "" },
    { key: "post", header: "Post", accessor: () => <span className="text-muted-foreground">—</span>, exportValue: () => "" },
    { key: "dis", header: "Disabling", accessor: () => <span className="text-muted-foreground">—</span>, exportValue: () => "" },
    { key: "conf", header: "Confused", accessor: () => <span className="text-muted-foreground">—</span>, exportValue: () => "" },
    { key: "ena", header: "Enabling", accessor: () => <span className="text-muted-foreground">—</span>, exportValue: () => "" },
  ];
  return (
    <DataTable
      data={rows}
      columns={columns}
      searchKeys={["name", "district", "taluka", "department"]}
      pageSize={12}
      getRowId={(r) => r.id}
    />
  );
}
