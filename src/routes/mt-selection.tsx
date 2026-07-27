import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";

import { PageHeader } from "@/components/dashboard/page-header";
import { Section } from "@/components/dashboard/section";
import { KpiCard, KpiGrid } from "@/components/dashboard/kpi-card";
import { StatusPill, type StatusTone } from "@/components/dashboard/status-pill";
import { DataTable, type Column } from "@/components/dashboard/data-table";
import { FilterSelect } from "@/components/dashboard/filter-bar";
import {
  HierarchicalBreakdownTable,
  type HierRow,
} from "@/components/dashboard/hierarchical-breakdown-table";
import { SplitSnapshotPanel } from "@/components/dashboard/split-snapshot-panel";
import {
  DivisionStatusPanel,
  type ActiveDivisionEntry,
} from "@/components/dashboard/division-status-panel";
import { AchievedTarget } from "@/components/dashboard/achieved-target";
import { MetricPanel } from "@/components/dashboard/metric-panel";

import {
  MASTER_TRAINERS,
  TALUKA_TARGETS,
  bucketDivision,
  divisionLastDate,
  divisionRollups,
  type MasterTrainer,
  type SelectionStatus,
} from "@/data/capacity-building";
import { DISTRICTS, DIVISIONS } from "@/data/geography";

export const Route = createFileRoute("/mt-selection")({
  head: () => ({
    meta: [
      { title: "MT Selection · Zilla Analytics" },
      {
        name: "description",
        content:
          "Nomination-to-Selection funnel and status across Master Trainer candidates in the Capacity Building stage.",
      },
    ],
  }),
  component: MTSelectionDashboard,
});

const SELECTION_TONE: Record<SelectionStatus, StatusTone> = {
  Nominated: "neutral",
  Assessed: "info",
  Selected: "success",
  Rejected: "critical",
};

function MTSelectionDashboard() {
  // Section 3 filters — independent per spec
  const [tblDivision, setTblDivision] = useState("All");
  const [tblDistrict, setTblDistrict] = useState("All");
  const [tblStatus, setTblStatus] = useState("All");

  const rollups = useMemo(() => divisionRollups(), []);
  const totals = useMemo(() => {
    const targets = TALUKA_TARGETS.filter((t) => t.active);
    const nominated = MASTER_TRAINERS.length;
    const assessed = MASTER_TRAINERS.filter(
      (m) => m.selectionStatus !== "Nominated",
    ).length;
    const selected = MASTER_TRAINERS.filter(
      (m) => m.selectionStatus === "Selected",
    ).length;
    const target = targets.reduce((s, t) => s + t.targetSelected, 0);
    const completion = target ? Math.round((selected / target) * 100) : 0;
    return { nominated, assessed, selected, target, completion };
  }, []);

  const activeList: ActiveDivisionEntry[] = rollups
    .filter((r) => bucketDivision(r, "selected") === "active")
    .map((r) => ({
      division: r.division,
      target: r.targetSelected,
      achieved: r.selected,
      completion: r.completionSelected,
      lastDate: divisionLastDate(r.division),
    }));
  const completedList = rollups
    .filter((r) => bucketDivision(r, "selected") === "completed")
    .map((r) => r.division);
  const yetToStartList = rollups
    .filter((r) => bucketDivision(r, "selected") === "yet_to_start")
    .map((r) => r.division);

  const filteredDirectory = useMemo(
    () =>
      MASTER_TRAINERS.filter((m) => {
        if (tblDivision !== "All" && m.division !== tblDivision) return false;
        if (tblDistrict !== "All" && m.district !== tblDistrict) return false;
        if (tblStatus !== "All" && m.selectionStatus !== tblStatus) return false;
        return true;
      }),
    [tblDivision, tblDistrict, tblStatus],
  );

  return (
    <div className="pb-16">
      <PageHeader
        title="MT Selection"
        description="Nomination to Selection funnel and division-level rollout status."
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
                        label: "Target",
                        value: totals.target.toLocaleString("en-IN"),
                      },
                      {
                        label: "Nominated",
                        value: totals.nominated.toLocaleString("en-IN"),
                      },
                      {
                        label: "Assessed",
                        value: totals.assessed.toLocaleString("en-IN"),
                      },
                      {
                        label: "Selected",
                        value: totals.selected.toLocaleString("en-IN"),
                      },
                      {
                        label: "Target Completion",
                        formula: "Selected/Target",
                        value: `${totals.completion}%`,
                      },
                    ],
                  },
                ]}
              />
            }
            rightTitle="Division Status"
            right={
              <DivisionStatusPanel
                achievedLabel="Selected"
                active={activeList}
                completed={completedList}
                yetToStart={yetToStartList}
              />
            }
          />
        </Section>

        {/* Section 2 — Selection Summary */}
        <Section title="Selection Summary">
          <SelectionSummaryTable />
        </Section>

        {/* Section 3 — MT Selection Status */}
        <Section title="MT Selection Status">
          <div className="flex flex-wrap items-end gap-3 mb-4">
            <FilterSelect
              label="Division"
              value={tblDivision}
              onChange={(v) => {
                setTblDivision(v);
                setTblDistrict("All");
              }}
              options={[
                { label: "All Divisions", value: "All" },
                ...DIVISIONS.map((d) => ({ label: d, value: d })),
              ]}
            />
            <FilterSelect
              label="District"
              value={tblDistrict}
              onChange={setTblDistrict}
              width={220}
              options={[
                { label: "All Districts", value: "All" },
                ...DISTRICTS.filter(
                  (d) => tblDivision === "All" || d.division === tblDivision,
                ).map((d) => ({ label: d.name, value: d.name })),
              ]}
            />
            <FilterSelect
              label="Selection Status"
              value={tblStatus}
              onChange={setTblStatus}
              width={200}
              options={[
                { label: "All", value: "All" },
                { label: "Nominated", value: "Nominated" },
                { label: "Assessed", value: "Assessed" },
                { label: "Selected", value: "Selected" },
                { label: "Rejected", value: "Rejected" },
              ]}
            />
          </div>
          <MTDirectory rows={filteredDirectory} />
        </Section>
      </div>
    </div>
  );
}

// -------- Selection Summary drill-down --------
function selectionRow(target: {
  targetNominated: number;
  targetSelected: number;
  active: boolean;
  lastDate: string;
}, rows: MasterTrainer[]): (React.ReactNode | number | string)[] {
  if (!target.active) {
    return [
      <StatusPill key="s" tone="neutral">
        Not Active
      </StatusPill>,
      "-",
      "-",
      "-",
      "-",
      "-",
      target.lastDate,
    ];
  }
  const nominated = rows.length;
  const assessed = rows.filter((r) => r.selectionStatus !== "Nominated").length;
  const selected = rows.filter((r) => r.selectionStatus === "Selected").length;
  const selectionRate = assessed ? Math.round((selected / assessed) * 100) : 0;
  const completion = target.targetSelected
    ? Math.round((selected / target.targetSelected) * 100)
    : 0;
  return [
    <StatusPill key="s" tone="success">
      Active
    </StatusPill>,
    <AchievedTarget key="n" achieved={nominated} target={target.targetNominated} />,
    assessed,
    <AchievedTarget key="sel" achieved={selected} target={target.targetSelected} />,
    `${selectionRate}%`,
    `${completion}%`,
    target.lastDate,
  ];
}

function SelectionSummaryTable() {
  const rows = useMemo<HierRow[]>(() => {
    return DIVISIONS.map((division) => {
      const divTalukas = TALUKA_TARGETS.filter((t) => t.division === division);
      const divTrainers = MASTER_TRAINERS.filter((m) => m.division === division);
      const divTargets = divTalukas.reduce(
        (acc, t) => {
          if (t.active) {
            acc.targetNominated += t.targetNominated;
            acc.targetSelected += t.targetSelected;
          }
          return acc;
        },
        { targetNominated: 0, targetSelected: 0 },
      );
      const divActive = divTalukas.some((t) => t.active);
      const divLast =
        divTalukas
          .map((t) => t.lastDate)
          .sort()
          .at(-1) ?? "-";

      const districts = DISTRICTS.filter((d) => d.division === division).map(
        (dist) => {
          const dTalukas = divTalukas.filter((t) => t.district === dist.name);
          const dTrainers = divTrainers.filter((m) => m.district === dist.name);
          const dTargets = dTalukas.reduce(
            (acc, t) => {
              if (t.active) {
                acc.targetNominated += t.targetNominated;
                acc.targetSelected += t.targetSelected;
              }
              return acc;
            },
            { targetNominated: 0, targetSelected: 0 },
          );
          const dActive = dTalukas.some((t) => t.active);
          const dLast =
            dTalukas
              .map((t) => t.lastDate)
              .sort()
              .at(-1) ?? "-";
          const talukas: HierRow[] = dTalukas.map((t) => {
            const tRows = dTrainers.filter((m) => m.taluka === t.taluka);
            return {
              key: `${division}/${dist.name}/${t.taluka}`,
              label: t.taluka,
              values: selectionRow(t, tRows),
            };
          });
          return {
            key: `${division}/${dist.name}`,
            label: `${dist.name} (District)`,
            values: selectionRow(
              {
                targetNominated: dTargets.targetNominated,
                targetSelected: dTargets.targetSelected,
                active: dActive,
                lastDate: dLast,
              },
              dTrainers,
            ),
            children: talukas,
          };
        },
      );

      return {
        key: division,
        label: `${division} (Division)`,
        values: selectionRow(
          {
            targetNominated: divTargets.targetNominated,
            targetSelected: divTargets.targetSelected,
            active: divActive,
            lastDate: divLast,
          },
          divTrainers,
        ),
        children: districts,
      };
    });
  }, []);

  return (
    <HierarchicalBreakdownTable
      rows={rows}
      firstColHeader="Geography"
      columns={[
        { header: "Activation Status" },
        { header: "Nominated", align: "right" },
        { header: "Assessed", align: "right" },
        { header: "Selected", align: "right" },
        { header: "Selection Rate", align: "right" },
        { header: "Target Completion", align: "right" },
        { header: "Last Date", align: "right" },
      ]}
    />
  );
}

function MTDirectory({ rows }: { rows: MasterTrainer[] }) {
  const columns: Column<MasterTrainer>[] = [
    {
      key: "name",
      header: "Master Trainer",
      accessor: (r) => (
        <div className="flex flex-col">
          <span className="font-medium text-foreground">{r.name}</span>
          <span className="text-xs text-muted-foreground">{r.id}</span>
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
      header: "Selection Test Score",
      accessor: (r) => (
        <span className="tabular-nums">
          {r.selectionScore != null ? `${r.selectionScore}%` : "—"}
        </span>
      ),
      sortValue: (r) => r.selectionScore ?? -1,
      exportValue: (r) => r.selectionScore ?? "",
      align: "right",
    },
    {
      key: "status",
      header: "Selection Status",
      accessor: (r) => (
        <StatusPill tone={SELECTION_TONE[r.selectionStatus]}>
          {r.selectionStatus}
        </StatusPill>
      ),
      sortValue: (r) => r.selectionStatus,
      exportValue: (r) => r.selectionStatus,
    },
  ];
  return (
    <DataTable
      data={rows}
      columns={columns}
      searchKeys={["name", "district", "taluka", "department"]}
      pageSize={15}
      getRowId={(r) => r.id}
    />
  );
}
