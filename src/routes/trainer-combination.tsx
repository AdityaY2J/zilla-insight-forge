import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/dashboard/page-header";
import { Section } from "@/components/dashboard/section";
import { DataTable, type Column } from "@/components/dashboard/data-table";
import {
  TRAINER_COMBINATION_BATCHES,
  TRAINER_GRADE_COMBINATIONS,
  type TrainerCombinationBatch,
} from "@/data/trainer-performance";

export const Route = createFileRoute("/trainer-combination")({
  component: TrainerCombinationDashboard,
});

function TrainerCombinationDashboard() {
  return <div className="pb-16"><PageHeader title="Trainer Combination" description="Performance comparison across trainer grade combinations." /><div className="px-8 pt-8 space-y-10"><Section title="Certification Grade Combination Summary"><CombinationSummary /></Section><Section title="Batch Performance"><CombinationBatchTable /></Section></div></div>;
}

function CombinationSummary() {
  const columns: Column<(typeof TRAINER_GRADE_COMBINATIONS)[number]>[] = [
    { key: "combination", header: "Grade Combination", accessor: (r) => r.combination, sortValue: (r) => r.combination },
    { key: "process", header: "Average Process Score", accessor: (r) => r.batches.length ? `${r.averageProcessScore}/8` : "–", align: "right", sortValue: (r) => r.averageProcessScore },
    { key: "learning", header: "Average Learning Score", accessor: (r) => r.batches.length ? `${r.averageLearningScore}%` : "–", align: "right", sortValue: (r) => r.averageLearningScore },
    { key: "red", header: "Learning Red %", accessor: (r) => r.batches.length ? `${r.learningRedPct}%` : "–", align: "right" },
    { key: "orange", header: "Learning Orange %", accessor: (r) => r.batches.length ? `${r.learningOrangePct}%` : "–", align: "right" },
    { key: "green", header: "Learning Green %", accessor: (r) => r.batches.length ? `${r.learningGreenPct}%` : "–", align: "right" },
    { key: "batches", header: "Number of Batches Conducted", accessor: (r) => r.batches.length, align: "right", sortValue: (r) => r.batches.length },
  ];
  return <DataTable data={TRAINER_GRADE_COMBINATIONS} columns={columns} headerCase="normal" searchable={false} exportable={false} paginated={false} getRowId={(row) => row.combination} />;
}

function CombinationBatchTable() {
  const columns: Column<TrainerCombinationBatch>[] = [
    { key: "id", header: "Batch ID", accessor: (r) => r.id, sortValue: (r) => r.id, exportValue: (r) => r.id },
    { key: "name", header: "Batch Name", accessor: (r) => <span className="font-medium">{r.name}</span>, sortValue: (r) => r.name, exportValue: (r) => r.name },
    { key: "district", header: "District", accessor: (r) => r.district, sortValue: (r) => r.district },
    { key: "taluka", header: "Taluka", accessor: (r) => r.taluka },
    { key: "t1id", header: "Trainer 1 ID", accessor: (r) => r.coach1Id },
    { key: "t1name", header: "Trainer 1 Name", accessor: (r) => r.coach1Name },
    { key: "t1grade", header: "Trainer 1 Grade", accessor: (r) => r.trainer1Grade, align: "center" },
    { key: "t2id", header: "Trainer 2 ID", accessor: (r) => r.coach2Id },
    { key: "t2name", header: "Trainer 2 Name", accessor: (r) => r.coach2Name },
    { key: "t2grade", header: "Trainer 2 Grade", accessor: (r) => r.trainer2Grade, align: "center" },
    { key: "combination", header: "Grade Combination", accessor: (r) => r.gradeCombination, align: "center" },
    { key: "process", header: "Average Process Score", accessor: (r) => `${r.processAdherence}/8`, align: "right", sortValue: (r) => r.processAdherence },
    { key: "learning", header: "Average Learning Score", accessor: (r) => `${r.averageLearningScore}%`, align: "right", sortValue: (r) => r.averageLearningScore },
    { key: "red", header: "Learning Red %", accessor: (r) => `${r.redPct}%`, align: "right" },
    { key: "orange", header: "Learning Orange %", accessor: (r) => `${r.orangePct}%`, align: "right" },
    { key: "green", header: "Learning Green %", accessor: (r) => `${r.greenPct}%`, align: "right" },
    { key: "participants", header: "Number of Participants", accessor: (r) => r.day1Participants, align: "right", sortValue: (r) => r.day1Participants },
  ];
  return <DataTable data={TRAINER_COMBINATION_BATCHES} columns={columns} headerCase="normal" searchKeys={["id", "name", "coach1Name", "coach2Name", "district", "taluka"]} pageSize={15} getRowId={(row) => row.id} />;
}
