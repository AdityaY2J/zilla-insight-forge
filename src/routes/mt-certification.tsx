import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";

import { PageHeader } from "@/components/dashboard/page-header";
import { Section } from "@/components/dashboard/section";
import { StatusPill, type StatusTone } from "@/components/dashboard/status-pill";
import { DataTable, type Column } from "@/components/dashboard/data-table";
import {
  HierarchicalBreakdownTable,
  type HierRow,
} from "@/components/dashboard/hierarchical-breakdown-table";
import { SplitSnapshotPanel } from "@/components/dashboard/split-snapshot-panel";
import {
  DivisionStatusPanel,
  type ActiveDivisionEntry,
} from "@/components/dashboard/division-status-panel";
import { MetricPanel } from "@/components/dashboard/metric-panel";
import {
  ViewSwitch,
  type SummaryView,
} from "@/components/dashboard/view-switch";

import {
  MASTER_TRAINERS,
  TALUKA_TARGETS,
  bucketDivision,
  divisionLastDate,
  divisionRollups,
  type MasterTrainer,
} from "@/data/capacity-building";
import { DEPARTMENTS, DISTRICTS, DIVISIONS } from "@/data/geography";
import { formatProgramAverage, programAverage } from "@/lib/program-average";

export const Route = createFileRoute("/mt-certification")({
  head: () => ({
    meta: [
      { title: "MT Certification · Zilla Analytics" },
      {
        name: "description",
        content:
          "Certification progress and directory for Master Trainers in the Capacity Building stage.",
      },
    ],
  }),
  component: MTCertificationDashboard,
});

type CertificationRecommendation =
  | "Recommended"
  | "Not Recommended"
  | "Not Recommended-Pending"
  | "Pending";

const CERT_TONE: Record<CertificationRecommendation, StatusTone> = {
  Pending: "neutral",
  Recommended: "success",
  "Not Recommended": "critical",
  "Not Recommended-Pending": "warning",
};

function recommendationFor(
  trainer: MasterTrainer,
): CertificationRecommendation {
  switch (trainer.certificationGrade) {
    case "A":
    case "B":
      return "Recommended";
    case "C":
      return "Not Recommended";
    case "D":
      return "Not Recommended-Pending";
    default:
      return "Pending";
  }
}

function MTCertificationDashboard() {
  const [summaryView, setSummaryView] = useState<SummaryView>("geography");
  const rollups = useMemo(() => divisionRollups(), []);
  const totals = useMemo(() => {
    const target = TALUKA_TARGETS.filter((t) => t.active).reduce(
      (s, t) => s + t.targetCertified,
      0,
    );
    const trained = MASTER_TRAINERS.filter((m) => m.trained).length;
    const certified = MASTER_TRAINERS.filter(
      (m) => m.certificationStatus === "Certified",
    ).length;
    const completion = target ? Math.round((certified / target) * 100) : 0;
    return { target, trained, certified, completion };
  }, []);

  const activeList: ActiveDivisionEntry[] = rollups
    .filter((r) => bucketDivision(r, "certified") === "active")
    .map((r) => ({
      division: r.division,
      target: r.targetCertified,
      achieved: r.certified,
      completion: r.completionCertified,
      lastDate: divisionLastDate(r.division),
    }));
  const completedList = rollups
    .filter((r) => bucketDivision(r, "certified") === "completed")
    .map((r) => r.division);
  const yetToStartList = rollups
    .filter((r) => bucketDivision(r, "certified") === "yet_to_start")
    .map((r) => r.division);

  return (
    <div className="pb-16">
      <PageHeader
        title="MT Certification"
        description="Certification progress across Master Trainer cohorts and geographies."
      />

      <div className="px-8 pt-8 space-y-10">
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
                        label: "Trained",
                        value: totals.trained.toLocaleString("en-IN"),
                      },
                      {
                        label: "Certified",
                        value: totals.certified.toLocaleString("en-IN"),
                      },
                      {
                        label: "Target Completion",
                        formula: "Certified/Target",
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
                achievedLabel="Certified"
                active={activeList}
                completed={completedList}
                yetToStart={yetToStartList}
              />
            }
          />
        </Section>

        <Section
          title="Certification Summary"
          actions={
            <ViewSwitch value={summaryView} onChange={setSummaryView} />
          }
        >
          {summaryView === "geography" ? (
            <CertificationSummaryTable />
          ) : (
            <CertificationDepartmentTable />
          )}
        </Section>

        <Section
          title="MT Certification Status"
          description="Individual Master Trainer certification records."
        >
          <CertDirectory />
        </Section>
      </div>
    </div>
  );
}

function certRow(
  target: {
    active: boolean;
    targetCertified: number | null;
    lastDate: string;
  },
  rows: MasterTrainer[],
): (React.ReactNode | number | string)[] {
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
  const trained = rows.filter((r) => r.trained).length;
  const certified = rows.filter((r) => r.certificationStatus === "Certified").length;
  const completion = target.targetCertified != null
    ? Math.round((certified / target.targetCertified) * 100)
    : null;
  const certRate = trained ? Math.round((certified / trained) * 100) : 0;
  return [
    <StatusPill key="s" tone="success">
      Active
    </StatusPill>,
    target.targetCertified ?? "–",
    trained,
    certified,
    `${certRate}%`,
    completion != null ? `${completion}%` : "–",
    target.lastDate,
  ];
}

const CERTIFICATION_SUMMARY_COLUMNS = [
  { header: "Activation Status" },
  { header: "Target", align: "right" as const },
  { header: "Trained", align: "right" as const },
  { header: "Certified", align: "right" as const },
  {
    header: "Certification Rate",
    formula: "(Certified/Trained)",
    align: "right" as const,
  },
  {
    header: "Target Completion",
    formula: "(Certified/Target)",
    align: "right" as const,
  },
  { header: "Last Date", align: "right" as const },
];

function CertificationSummaryTable() {
  const rows = useMemo<HierRow[]>(() => {
    return DIVISIONS.map((division) => {
      const divTalukas = TALUKA_TARGETS.filter((t) => t.division === division);
      const divTrainers = MASTER_TRAINERS.filter((m) => m.division === division);
      const divTarget = divTalukas.reduce(
        (s, t) => s + (t.active ? t.targetCertified : 0),
        0,
      );
      const divLast = divisionLastDate(division);

      const districts = DISTRICTS.filter((d) => d.division === division).map(
        (dist) => {
          const dTalukas = divTalukas.filter((t) => t.district === dist.name);
          const dTrainers = divTrainers.filter((m) => m.district === dist.name);
          const dTarget = dTalukas.reduce(
            (s, t) => s + (t.active ? t.targetCertified : 0),
            0,
          );
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
              values: certRow(t, tRows),
            };
          });
          return {
            key: `${division}/${dist.name}`,
            label: `${dist.name} (District)`,
            values: certRow(
              {
                active: dTalukas.some((t) => t.active),
                targetCertified: dTarget,
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
        values: certRow(
          {
            active: divTalukas.some((t) => t.active),
            targetCertified: divTarget,
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
      exportable
      exportFileName="mt-certification-summary"
      columns={CERTIFICATION_SUMMARY_COLUMNS}
    />
  );
}

function CertificationDepartmentTable() {
  const rows = useMemo<HierRow[]>(
    () =>
      DEPARTMENTS.map((department) => {
        const trainers = MASTER_TRAINERS.filter(
          (trainer) =>
            trainer.selectionStatus === "Selected" &&
            trainer.department === department,
        );
        // Targets exist only at geography level; department targets are not set.
        return {
          key: department,
          label: department,
          values: certRow(
            {
              active: trainers.length > 0,
              targetCertified: null,
              lastDate: "—",
            },
            trainers,
          ),
        };
      }),
    [],
  );

  return (
    <HierarchicalBreakdownTable
      rows={rows}
      firstColHeader="Department"
      exportable
      exportFileName="mt-certification-department-summary"
      columns={CERTIFICATION_SUMMARY_COLUMNS}
    />
  );
}

function CertDirectory() {
  const rows = useMemo(
    () => MASTER_TRAINERS.filter((m) => m.selectionStatus === "Selected"),
    [],
  );
  const columns: Column<MasterTrainer>[] = [
    {
      key: "id",
      header: "MT ID",
      accessor: (r) => <span className="text-xs tabular-nums">{r.id}</span>,
      sortValue: (r) => r.id,
      exportValue: (r) => r.id,
    },
    {
      key: "name",
      header: "MT Name",
      accessor: (r) => <span className="font-medium text-foreground">{r.name}</span>,
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
      header: "Phone No.",
      accessor: (r) => <span className="text-xs tabular-nums">{r.phone}</span>,
      exportValue: (r) => r.phone,
    },
    {
      key: "a1",
      header: "Assessment 1",
      accessor: (r) => (
        <span className="tabular-nums">
          {r.assessment1 != null ? `${r.assessment1}%` : "—"}
        </span>
      ),
      sortValue: (r) => r.assessment1 ?? -1,
      exportValue: (r) => r.assessment1 ?? "",
      align: "right",
    },
    {
      key: "a2",
      header: "Assessment 2",
      accessor: (r) => (
        <span className="tabular-nums">
          {r.assessment2 != null ? `${r.assessment2}%` : "—"}
        </span>
      ),
      sortValue: (r) => r.assessment2 ?? -1,
      exportValue: (r) => r.assessment2 ?? "",
      align: "right",
    },
    {
      key: "programAverage",
      header: "Program Average",
      accessor: (r) => <span className="tabular-nums">{formatProgramAverage(r.assessment1, r.assessment2)}</span>,
      sortValue: (r) => programAverage(r.assessment1, r.assessment2) ?? -1,
      exportValue: (r) => programAverage(r.assessment1, r.assessment2) ?? "",
      align: "right",
    },
    {
      key: "grade",
      header: "Certification Grade",
      accessor: (r) => (
        <span className="font-medium">{r.certificationGrade ?? "—"}</span>
      ),
      sortValue: (r) => r.certificationGrade ?? "Z",
      exportValue: (r) => r.certificationGrade ?? "",
      align: "center",
    },
    {
      key: "status",
      header: "Certification Status",
      accessor: (r) => {
        const recommendation = recommendationFor(r);
        return (
          <StatusPill tone={CERT_TONE[recommendation]}>
            {recommendation}
          </StatusPill>
        );
      },
      sortValue: (r) => recommendationFor(r),
      exportValue: (r) => recommendationFor(r),
    },
  ];
  return (
    <DataTable
      data={rows}
      columns={columns}
      searchKeys={["name", "district", "taluka", "department", "designation"]}
      pageSize={15}
      getRowId={(r) => r.id}
    />
  );
}
