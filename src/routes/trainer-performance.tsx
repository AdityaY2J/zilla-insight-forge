import { Info } from "lucide-react";
import type { ReactNode } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/dashboard/page-header";
import { Section } from "@/components/dashboard/section";
import { MetricPanel } from "@/components/dashboard/metric-panel";
import { DataTable, type Column } from "@/components/dashboard/data-table";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { LEARNING_BENCHMARK, PROCESS_BENCHMARK, TRAINER_PERFORMANCE, consistencyBucket, type TrainerPerformanceRow } from "@/data/trainer-performance";

export const Route = createFileRoute("/trainer-performance")({ component: TrainerPerformanceDashboard });
const average = (values: number[]) => values.length ? Math.round(values.reduce((sum, value) => sum + value, 0) * 10 / values.length) / 10 : 0;
const count = (predicate: (trainer: TrainerPerformanceRow) => boolean) => TRAINER_PERFORMANCE.filter(predicate).length;

const TOOLTIP_COPY = {
  learningSnapshot: <>Learning performance is calculated at the trainer level based on all batches conducted by the trainer. Each batch has a learning score, and the trainer&apos;s overall learning score is the average of these batch scores. Trainers are then classified as <strong>Above Benchmark</strong>, <strong>Meeting Benchmark</strong>, or <strong>Below Benchmark</strong> based on configurable benchmark thresholds defined in the backend.</>,
  learningConsistency: <><p>Learning consistency measures how consistently a trainer&apos;s batches achieve the learning benchmark. For each trainer, the percentage of batches meeting or exceeding the benchmark is calculated. Based on this percentage, trainers are classified as:</p><p className="mt-2"><strong>Mostly Above Boundary:</strong> More than 75% of batches meet the benchmark.<br /><strong>Fluctuating:</strong> 50–75% of batches meet the benchmark.<br /><strong>Mostly Below:</strong> Fewer than 50% of batches meet the benchmark.<br /><strong>Always Below:</strong> None of the batches meet the benchmark.</p><p className="mt-2 italic">Example: If a trainer has conducted 5 batches and 3 batches meet or exceed the benchmark, the consistency is <strong>60%</strong>, placing the trainer in the <strong>Fluctuating</strong> category.</p></>,
  processSnapshot: <>Process performance is calculated at the trainer level based on all batches conducted by the trainer. Each batch receives a process adherence score (for example, 6/8 or 7/8), and the trainer&apos;s overall process score is the average of these batch scores. Trainers are then classified into <strong>Green</strong>, <strong>Orange</strong>, or <strong>Red</strong> zones based on configurable process score thresholds defined in the backend.</>,
  processConsistency: <><p>Process consistency measures how consistently a trainer&apos;s batches achieve the required process benchmark. For each trainer, the percentage of batches meeting or exceeding the benchmark is calculated. Based on this percentage, trainers are classified as:</p><p className="mt-2"><strong>Mostly Above Boundary:</strong> More than 75% of batches meet the benchmark.<br /><strong>Fluctuating:</strong> 50–75% of batches meet the benchmark.<br /><strong>Mostly Below:</strong> Fewer than 50% of batches meet the benchmark.<br /><strong>Always Below:</strong> None of the batches meet the benchmark.</p><p className="mt-2 italic">Example: If a trainer has conducted 5 batches and 4 batches achieve the required process benchmark, the consistency is <strong>80%</strong>, placing the trainer in the <strong>Mostly Above Boundary</strong> category.</p></>,
};

function PanelTitle({ title, children }: { title: string; children: ReactNode }) {
  return <span className="inline-flex items-center gap-1.5"><span>{title}</span><Tooltip><TooltipTrigger asChild><button type="button" aria-label={`About ${title}`} className="normal-case text-muted-foreground transition-colors hover:text-foreground"><Info className="h-3.5 w-3.5" /></button></TooltipTrigger><TooltipContent side="top" className="max-w-md p-3 text-xs leading-relaxed normal-case tracking-normal">{children}</TooltipContent></Tooltip></span>;
}

function TrainerPerformanceDashboard() {
  const consistencyPanel = (key: "learningConsistencyPct" | "processConsistencyPct") => [{ label: "Trainers mostly above benchmark (>75%)", value: count((trainer) => consistencyBucket(trainer[key]) === "Mostly Above Boundary") }, { label: "Trainers fluctuating (50–75%)", value: count((trainer) => consistencyBucket(trainer[key]) === "Fluctuating") }, { label: "Trainers mostly below benchmark (<50%)", value: count((trainer) => consistencyBucket(trainer[key]) === "Mostly Below Boundary") }, { label: "Trainers always below (0%)", value: count((trainer) => consistencyBucket(trainer[key]) === "Always Below") }];
  const learningSnapshot = [{ label: "Average Learning Score", value: `${average(TRAINER_PERFORMANCE.map((trainer) => trainer.averageLearningScore))}%` }, { label: "Trainers Above Benchmark", value: count((trainer) => trainer.averageLearningScore > LEARNING_BENCHMARK) }, { label: "Trainers Meeting Benchmark", value: count((trainer) => trainer.averageLearningScore === LEARNING_BENCHMARK) }, { label: "Trainers Below Benchmark", value: count((trainer) => trainer.averageLearningScore < LEARNING_BENCHMARK) }];
  const processSnapshot = [{ label: "Average Process Score", value: `${average(TRAINER_PERFORMANCE.map((trainer) => trainer.averageProcessScore))} / 8` }, { label: "Trainers in Green Zone (6–8)", value: count((trainer) => trainer.averageProcessScore >= PROCESS_BENCHMARK) }, { label: "Trainers in Orange Zone (4–5)", value: count((trainer) => trainer.averageProcessScore >= 4 && trainer.averageProcessScore < PROCESS_BENCHMARK) }, { label: "Trainers in Red Zone (<4)", value: count((trainer) => trainer.averageProcessScore < 4) }];
  return <div className="pb-16"><PageHeader title="Trainer Performance" description="Performance benchmarking of trainers based on learning and process quality." /><div className="px-8 pt-8 space-y-10"><Section title={<><span>Snapshot</span> <span className="text-sm font-medium text-muted-foreground">(based on 54 batches)</span></>}><div className="grid grid-cols-1 gap-4 lg:grid-cols-2"><MetricPanel title={<PanelTitle title="Learning Snapshot">{TOOLTIP_COPY.learningSnapshot}</PanelTitle>} groups={[{ items: learningSnapshot }]} /><MetricPanel title={<PanelTitle title="Learning Consistency">{TOOLTIP_COPY.learningConsistency}</PanelTitle>} groups={[{ items: consistencyPanel("learningConsistencyPct") }]} /><MetricPanel title={<PanelTitle title="Process Snapshot">{TOOLTIP_COPY.processSnapshot}</PanelTitle>} groups={[{ items: processSnapshot }]} /><MetricPanel title={<PanelTitle title="Process Consistency">{TOOLTIP_COPY.processConsistency}</PanelTitle>} groups={[{ items: consistencyPanel("processConsistencyPct") }]} /></div></Section><Section title="Trainer Performance Table"><TrainerPerformanceTable /></Section></div></div>;
}

function TrainerPerformanceTable() {
  const columns: Column<TrainerPerformanceRow>[] = [
    { key: "id", header: "Trainer ID", accessor: (r) => r.id, sortValue: (r) => r.id, exportValue: (r) => r.id },
    { key: "name", header: "Trainer Name", accessor: (r) => <span className="font-medium">{r.name}</span>, sortValue: (r) => r.name, exportValue: (r) => r.name },
    { key: "division", header: "Division", accessor: (r) => r.division, sortValue: (r) => r.division },
    { key: "district", header: "District", accessor: (r) => r.district, sortValue: (r) => r.district },
    { key: "taluka", header: "Taluka", accessor: (r) => r.taluka },
    { key: "selection", header: "Selection Test Score", accessor: (r) => r.selectionScore ?? "–", align: "right", sortValue: (r) => r.selectionScore ?? -1 },
    { key: "learning", header: "MT Learning Score", accessor: (r) => `${r.averageLearningScore}%`, align: "right", sortValue: (r) => r.averageLearningScore },
    { key: "grade", header: "Certification Grade", accessor: (r) => r.certificationGrade ?? "–", align: "center" },
    { key: "batches", header: "Number of Batches Conducted", accessor: (r) => r.batches.length, align: "right", sortValue: (r) => r.batches.length },
    { key: "batchLearning", header: "Average Batch Learning Score", accessor: (r) => `${r.averageLearningScore}%`, align: "right" },
    { key: "red", header: "Learning Red %", accessor: (r) => `${r.learningRedPct}%`, align: "right" },
    { key: "orange", header: "Learning Orange %", accessor: (r) => `${r.learningOrangePct}%`, align: "right" },
    { key: "green", header: "Learning Green %", accessor: (r) => `${r.learningGreenPct}%`, align: "right" },
    { key: "process", header: "Average Batch Process Score", accessor: (r) => `${r.averageProcessScore}/8`, align: "right" },
    { key: "aboveProcess", header: "Batches with Process Score > 6 / 8", accessor: (r) => r.batchesWithProcessAbove6, align: "right" },
    { key: "aboveLearning", header: "Batches Above Learning Benchmark", accessor: (r) => r.batchesAboveLearningBenchmark, align: "right" },
    { key: "learningConsistency", header: "Batches with Learning Consistency Above Benchmark", accessor: (r) => `${r.learningConsistencyPct}%`, align: "right" },
    { key: "processConsistency", header: "Batches with Process Consistency Above Benchmark", accessor: (r) => `${r.processConsistencyPct}%`, align: "right" },
  ];
  return <DataTable data={TRAINER_PERFORMANCE} columns={columns} headerCase="normal" stickyHeader searchKeys={["id", "name", "district", "taluka"]} pageSize={15} getRowId={(row) => row.id} />;
}
