import { useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";

import { PageHeader } from "@/components/dashboard/page-header";
import { Section } from "@/components/dashboard/section";
import { FunnelChart, type FunnelStage } from "@/components/dashboard/funnel-chart";
import {
  HierarchicalBreakdownTable,
  type HierRow,
} from "@/components/dashboard/hierarchical-breakdown-table";

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
      { property: "og:title", content: "Capacity Building Funnel · Zilla Analytics" },
      {
        property: "og:description",
        content:
          "Nomination → Assessment → Selection → Certification conversion for Master Trainers across Maharashtra.",
      },
    ],
  }),
  component: CapacityFunnelDashboard,
});

function CapacityFunnelDashboard() {
  const stages = useMemo<FunnelStage[]>(() => {
    return [
      { label: "Nominated", value: MASTER_TRAINERS.length },
      {
        label: "Assessed",
        value: MASTER_TRAINERS.filter((m) => m.selectionStatus !== "Nominated")
          .length,
      },
      {
        label: "Selected",
        value: MASTER_TRAINERS.filter((m) => m.selectionStatus === "Selected")
          .length,
      },
      {
        label: "Certified",
        value: MASTER_TRAINERS.filter(
          (m) => m.certificationStatus === "Certified",
        ).length,
      },
    ];
  }, []);

  return (
    <div className="pb-16">
      <PageHeader
        title="MT Capacity Building Funnel"
        description="End-to-end view of the Master Trainer pipeline — Nomination → Assessment → Selection → Certification."
      />

      <div className="px-8 pt-8 space-y-10">
        <Section title="Snapshot">
          <FunnelChart stages={stages} />
        </Section>

        <Section title="Geography-wise Capacity Building Funnel">
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
  const nom = trainers.length;
  const asd = trainers.filter((m) => m.selectionStatus !== "Nominated").length;
  const sel = trainers.filter((m) => m.selectionStatus === "Selected").length;
  const cert = trainers.filter((m) => m.certificationStatus === "Certified").length;
  return [
    nom,
    asd,
    sel,
    cert,
    nom ? `${Math.round((cert / nom) * 100)}%` : "-",
  ];
}

function exportRow(
  targets: TalukaTarget[],
  trainers: MasterTrainer[],
): (string | number)[] {
  return [
    trainers.length,
    trainers.filter((m) => m.selectionStatus !== "Nominated").length,
    trainers.filter((m) => m.selectionStatus === "Selected").length,
    trainers.filter((m) => m.certificationStatus === "Certified").length,
    trainers.length ? `${Math.round((trainers.filter((m) => m.certificationStatus === "Certified").length / trainers.length) * 100)}%` : "-",
  ];
}

function FunnelGeographyTable() {
  const rows = useMemo<HierRow[]>(() => {
    const stateRow: HierRow = {
      key: "MH",
      label: "Maharashtra (State)",
      values: pipelineRow(TALUKA_TARGETS, MASTER_TRAINERS),
      exportValues: exportRow(TALUKA_TARGETS, MASTER_TRAINERS),
      children: DIVISIONS.map((division) => {
        const divTargets = TALUKA_TARGETS.filter((t) => t.division === division);
        const divTrainers = MASTER_TRAINERS.filter(
          (m) => m.division === division,
        );
        return {
          key: division,
          label: `${division} (Division)`,
          values: pipelineRow(divTargets, divTrainers),
          exportValues: exportRow(divTargets, divTrainers),
          children: DISTRICTS.filter((d) => d.division === division).map(
            (dist) => {
              const dTargets = divTargets.filter((t) => t.district === dist.name);
              const dTrainers = divTrainers.filter(
                (m) => m.district === dist.name,
              );
              return {
                key: `${division}/${dist.name}`,
                label: `${dist.name} (District)`,
                values: pipelineRow(dTargets, dTrainers),
                exportValues: exportRow(dTargets, dTrainers),
                children: dist.talukas.map((tk) => {
                  const tTargets = dTargets.filter((t) => t.taluka === tk);
                  const tTrainers = dTrainers.filter((m) => m.taluka === tk);
                  return {
                    key: `${division}/${dist.name}/${tk}`,
                    label: tk,
                    values: pipelineRow(tTargets, tTrainers),
                    exportValues: exportRow(tTargets, tTrainers),
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
      exportable
      exportFileName="capacity-building-funnel.csv"
      columns={[
        { header: "Nominated", align: "right" },
        { header: "Assessed", align: "right" },
        { header: "Selected", align: "right" },
        { header: "Certified", align: "right" },
        { header: "Conversion %", formula: "Certified/Nominated", align: "right" },
      ]}
    />
  );
}
