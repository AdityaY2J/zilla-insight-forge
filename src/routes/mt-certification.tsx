import { useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";

import { PageHeader } from "@/components/dashboard/page-header";
import { Section } from "@/components/dashboard/section";
import { KpiCard, KpiGrid } from "@/components/dashboard/kpi-card";
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
import { AchievedTarget } from "@/components/dashboard/achieved-target";

import {
  MASTER_TRAINERS,
  TALUKA_TARGETS,
  bucketDivision,
  divisionRollups,
  type CertificationStatus,
  type MasterTrainer,
} from "@/data/capacity-building";
import { DISTRICTS, DIVISIONS } from "@/data/geography";

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

const CERT_TONE: Record<CertificationStatus, StatusTone> = {
  Pending: "neutral",
  "In Training": "info",
  Certified: "success",
  Failed: "critical",
};

function MTCertificationDashboard() {
  const rollups = useMemo(() => divisionRollups(), []);
  const totals = useMemo(() => {
    const target = TALUKA_TARGETS.filter((t) => t.active).reduce(
      (s, t) => s + t.targetCertified,
      0,
    );
    const trained = MASTER_TRAINERS.filter(
      (m) => m.certificationStatus !== "Pending",
    ).length;
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
              <KpiGrid cols={4}>
                <KpiCard title="Target" value={totals.target.toLocaleString("en-IN")} />
                <KpiCard
                  title="Trained"
                  value={totals.trained.toLocaleString("en-IN")}
                  accent="info"
                />
                <KpiCard
                  title="Certified"
                  value={totals.certified.toLocaleString("en-IN")}
                  accent="success"
                />
                <KpiCard
                  title="Target Completion"
                  value={`${totals.completion}%`}
                  accent={
                    totals.completion >= 75
                      ? "success"
                      : totals.completion >= 50
                        ? "warning"
                        : "critical"
                  }
                />
              </KpiGrid>
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
          description="Geography drill-down (Division → District → Taluka). Drill-down assumed per Dashboard 1 pattern (flagged in spec)."
        >
          <CertificationSummaryTable />
        </Section>

        <Section
          title="MT Certification Directory"
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
    targetCertified: number;
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
      target.lastDate,
    ];
  }
  const trained = rows.filter((r) => r.certificationStatus !== "Pending").length;
  const certified = rows.filter((r) => r.certificationStatus === "Certified").length;
  const completion = target.targetCertified
    ? Math.round((certified / target.targetCertified) * 100)
    : 0;
  return [
    <StatusPill key="s" tone="success">
      Active
    </StatusPill>,
    trained,
    certified,
    target.targetCertified,
    `${completion}%`,
    target.lastDate,
  ];
}

function CertificationSummaryTable() {
  const rows = useMemo<HierRow[]>(() => {
    return DIVISIONS.map((division) => {
      const divTalukas = TALUKA_TARGETS.filter((t) => t.division === division);
      const divTrainers = MASTER_TRAINERS.filter((m) => m.division === division);
      const divTarget = divTalukas.reduce(
        (s, t) => s + (t.active ? t.targetCertified : 0),
        0,
      );
      const divLast =
        divTalukas
          .map((t) => t.lastDate)
          .sort()
          .at(-1) ?? "-";

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
      columns={[
        { header: "Activation Status" },
        { header: "Trained", align: "right" },
        { header: "Certified", align: "right" },
        { header: "Target", align: "right" },
        { header: "Target Completion", align: "right" },
        { header: "Last Date", align: "right" },
      ]}
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
      key: "department",
      header: "Department",
      accessor: (r) => r.department,
      sortValue: (r) => r.department,
      exportValue: (r) => r.department,
    },
    {
      key: "designation",
      header: "Designation",
      accessor: (r) => r.designation,
      sortValue: (r) => r.designation,
      exportValue: (r) => r.designation,
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
      key: "status",
      header: "Certification Status",
      accessor: (r) => (
        <StatusPill tone={CERT_TONE[r.certificationStatus]}>
          {r.certificationStatus}
        </StatusPill>
      ),
      sortValue: (r) => r.certificationStatus,
      exportValue: (r) => r.certificationStatus,
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
