import { useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";

import { PageHeader } from "@/components/dashboard/page-header";
import { Section } from "@/components/dashboard/section";
import { KpiCard, KpiGrid } from "@/components/dashboard/kpi-card";
import {
  HierarchicalBreakdownTable,
  type HierRow,
} from "@/components/dashboard/hierarchical-breakdown-table";
import { AchievedTarget } from "@/components/dashboard/achieved-target";

import {
  MASTER_TRAINERS,
  TALUKA_TARGETS,
  type MasterTrainer,
  type TalukaTarget,
} from "@/data/capacity-building";
import { DISTRICTS, DIVISIONS } from "@/data/geography";

export const Route = createFileRoute("/mt-capacity-funnel")({
  head: () => ({
    meta: [
      { title: "Capacity Building Funnel · Zilla Analytics" },
      {
        name: "description",
        content:
          "End-to-end Master Trainer pipeline — Nomination through Certification — across Maharashtra.",
      },
    ],
  }),
  component: CapacityFunnelDashboard,
});

function CapacityFunnelDashboard() {
  const totals = useMemo(() => {
    const requiredSelected = TALUKA_TARGETS.filter((t) => t.active).reduce(
      (s, t) => s + t.targetSelected,
      0,
    );
    const requiredCertified = TALUKA_TARGETS.filter((t) => t.active).reduce(
      (s, t) => s + t.targetCertified,
      0,
    );
    const nominated = MASTER_TRAINERS.length;
    const assessed = MASTER_TRAINERS.filter(
      (m) => m.selectionStatus !== "Nominated",
    ).length;
    const selected = MASTER_TRAINERS.filter(
      (m) => m.selectionStatus === "Selected",
    ).length;
    const certified = MASTER_TRAINERS.filter(
      (m) => m.certificationStatus === "Certified",
    ).length;
    return {
      nominated,
      assessed,
      selected,
      certified,
      requiredSelected,
      requiredCertified,
    };
  }, []);

  return (
    <div className="pb-16">
      <PageHeader
        title="MT Capacity Building Funnel"
        description="End-to-end view of the Master Trainer pipeline — Nomination → Assessment → Selection → Certification."
      />

      <div className="px-8 pt-8 space-y-10">
        <Section
          title="Snapshot"
          description="Overall pipeline progress across all active geographies."
        >
          <KpiGrid cols={4}>
            <KpiCard
              title="Nominated"
              value={totals.nominated.toLocaleString("en-IN")}
              accent="info"
            />
            <KpiCard
              title="Assessed"
              value={totals.assessed.toLocaleString("en-IN")}
              accent="info"
            />
            <KpiCard
              title="Selected"
              value={
                <AchievedTarget
                  achieved={totals.selected}
                  target={totals.requiredSelected}
                  targetLabel="Required"
                />
              }
              accent="success"
            />
            <KpiCard
              title="Certified"
              value={
                <AchievedTarget
                  achieved={totals.certified}
                  target={totals.requiredCertified}
                  targetLabel="Required"
                />
              }
              accent="success"
            />
          </KpiGrid>
        </Section>

        <Section
          title="Geography-wise Capacity Building Summary"
          description="Drill-down: State → Division → District → Taluka."
        >
          <FunnelGeographyTable />
        </Section>
      </div>
    </div>
  );
}

function pipelineRow(
  targets: TalukaTarget[],
  trainers: MasterTrainer[],
): (React.ReactNode | number | string)[] {
  const reqSel = targets.reduce((s, t) => s + (t.active ? t.targetSelected : 0), 0);
  const reqCert = targets.reduce((s, t) => s + (t.active ? t.targetCertified : 0), 0);
  const nom = trainers.length;
  const asd = trainers.filter((m) => m.selectionStatus !== "Nominated").length;
  const sel = trainers.filter((m) => m.selectionStatus === "Selected").length;
  const cert = trainers.filter((m) => m.certificationStatus === "Certified").length;
  return [
    nom,
    asd,
    <AchievedTarget key="s" achieved={sel} target={reqSel || undefined} />,
    <AchievedTarget key="c" achieved={cert} target={reqCert || undefined} />,
  ];
}

function FunnelGeographyTable() {
  const rows = useMemo<HierRow[]>(() => {
    const stateTargets = TALUKA_TARGETS;
    const stateTrainers = MASTER_TRAINERS;
    const stateRow: HierRow = {
      key: "MH",
      label: "Maharashtra (State)",
      values: pipelineRow(stateTargets, stateTrainers),
      children: DIVISIONS.map((division) => {
        const divTargets = stateTargets.filter((t) => t.division === division);
        const divTrainers = stateTrainers.filter((m) => m.division === division);
        return {
          key: division,
          label: `${division} (Division)`,
          values: pipelineRow(divTargets, divTrainers),
          children: DISTRICTS.filter((d) => d.division === division).map(
            (dist) => {
              const dTargets = divTargets.filter((t) => t.district === dist.name);
              const dTrainers = divTrainers.filter((m) => m.district === dist.name);
              return {
                key: `${division}/${dist.name}`,
                label: `${dist.name} (District)`,
                values: pipelineRow(dTargets, dTrainers),
                children: dist.talukas.map((tk) => {
                  const tTargets = dTargets.filter((t) => t.taluka === tk);
                  const tTrainers = dTrainers.filter((m) => m.taluka === tk);
                  return {
                    key: `${division}/${dist.name}/${tk}`,
                    label: tk,
                    values: pipelineRow(tTargets, tTrainers),
                  };
                }),
              };
            },
          ),
        };
      }),
    };
    return [stateRow];
  }, []);
  return (
    <HierarchicalBreakdownTable
      rows={rows}
      firstColHeader="Geography"
      columns={[
        { header: "Nominated", align: "right" },
        { header: "Assessed", align: "right" },
        { header: "Selected", align: "right" },
        { header: "Certified", align: "right" },
      ]}
    />
  );
}
