import { BATCHES, MASTER_TRAINERS, type Batch, type CertificationGrade, type MasterTrainer } from "./capacity-building";
import { DISTRICTS, mulberry32 } from "./geography";

export const LEARNING_BENCHMARK = 80;
export const PROCESS_BENCHMARK = 6;
const avg = (values: number[]) => values.length ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length) : 0;
const avgDecimal = (values: number[]) => values.length ? Math.round(values.reduce((sum, value) => sum + value, 0) * 10 / values.length) / 10 : 0;
export const batchLearningScore = (batch: Batch) => (batch.day1AssessmentAvg + batch.day2AssessmentAvg) / 2;

export type TrainerPerformanceRow = MasterTrainer & {
  batches: Batch[];
  averageLearningScore: number;
  averageProcessScore: number;
  learningRedPct: number;
  learningOrangePct: number;
  learningGreenPct: number;
  batchesAboveLearningBenchmark: number;
  batchesAtLearningBenchmark: number;
  batchesWithProcessAbove6: number;
  learningConsistencyPct: number;
  processConsistencyPct: number;
};

const certifiedTrainers = MASTER_TRAINERS.filter((trainer) => trainer.certificationStatus === "Certified" && trainer.certificationGrade);

// Trainer analytics needs a denser operating history than the Phase 1 batch
// dashboard, while leaving the original Phase 1 dataset unchanged.
export const TRAINER_ANALYTICS_BATCHES: Batch[] = [
  ...BATCHES,
  ...BATCHES.map((source, index) => {
    const trainer1 = certifiedTrainers[index % certifiedTrainers.length];
    const trainer2 = certifiedTrainers[(index * 7 + 11) % certifiedTrainers.length];
    return {
      ...source,
      id: `TPB${String(index + 1).padStart(4, "0")}`,
      name: `Trainer Analytics Batch ${index + 1}`,
      division: trainer1.division,
      district: trainer1.district,
      taluka: trainer1.taluka,
      coach1Id: trainer1.id,
      coach1Name: trainer1.name,
      coach2Id: trainer2.id,
      coach2Name: trainer2.name,
      active: index % 4 !== 0,
    };
  }),
];

export const TRAINER_PERFORMANCE: TrainerPerformanceRow[] = certifiedTrainers.map((trainer) => {
  const batches = TRAINER_ANALYTICS_BATCHES.filter((batch) => batch.coach1Id === trainer.id || batch.coach2Id === trainer.id);
  const learningScores = batches.map(batchLearningScore);
  const processScores = batches.map((batch) => batch.processAdherence);
  const above = learningScores.filter((score) => score > LEARNING_BENCHMARK).length;
  const at = learningScores.filter((score) => score === LEARNING_BENCHMARK).length;
  return {
    ...trainer,
    batches,
    averageLearningScore: avg(learningScores),
    averageProcessScore: avgDecimal(processScores),
    learningRedPct: avg(batches.map((batch) => batch.redPct)),
    learningOrangePct: avg(batches.map((batch) => batch.orangePct)),
    learningGreenPct: avg(batches.map((batch) => batch.greenPct)),
    batchesAboveLearningBenchmark: above,
    batchesAtLearningBenchmark: at,
    batchesWithProcessAbove6: processScores.filter((score) => score > 6).length,
    learningConsistencyPct: batches.length ? Math.round((above + at) * 100 / batches.length) : 0,
    processConsistencyPct: batches.length ? Math.round(processScores.filter((score) => score >= PROCESS_BENCHMARK).length * 100 / batches.length) : 0,
  };
});

export const ACTIVE_TRAINERS = TRAINER_PERFORMANCE.filter((trainer) => trainer.batches.length > 0);

export function consistencyBucket(value: number) {
  if (value > 75) return "Mostly Above Boundary";
  if (value >= 50) return "Fluctuating";
  if (value > 0) return "Mostly Below Boundary";
  return "Always Below";
}

const gradeFor = (id: string): CertificationGrade => TRAINER_PERFORMANCE.find((trainer) => trainer.id === id)?.certificationGrade ?? "C";
export type TrainerCombinationBatch = Batch & { trainer1Grade: CertificationGrade; trainer2Grade: CertificationGrade; gradeCombination: string; averageLearningScore: number };
export const TRAINER_COMBINATION_BATCHES: TrainerCombinationBatch[] = TRAINER_ANALYTICS_BATCHES.map((batch) => {
  const trainer1Grade = gradeFor(batch.coach1Id);
  const trainer2Grade = gradeFor(batch.coach2Id);
  return { ...batch, trainer1Grade, trainer2Grade, gradeCombination: [trainer1Grade, trainer2Grade].sort().join("-"), averageLearningScore: batchLearningScore(batch) };
});

const GRADE_COMBINATIONS = ["A-A", "A-B", "A-C", "A-D", "B-B", "B-C", "B-D", "C-C", "C-D", "D-D", "undefined-B"];
export const TRAINER_GRADE_COMBINATIONS = GRADE_COMBINATIONS.map((combination) => {
  const batches = TRAINER_COMBINATION_BATCHES.filter((batch) => batch.gradeCombination === combination);
  return {
    combination,
    batches,
    averageProcessScore: avgDecimal(batches.map((batch) => batch.processAdherence)),
    averageLearningScore: avg(batches.map((batch) => batch.averageLearningScore)),
    learningRedPct: avg(batches.map((batch) => batch.redPct)),
    learningOrangePct: avg(batches.map((batch) => batch.orangePct)),
    learningGreenPct: avg(batches.map((batch) => batch.greenPct)),
  };
});

const districtStatus = new Map(DISTRICTS.map((district, index) => [district.name, index % 7 === 0 ? "Yet to Start" : index % 5 === 0 ? "Completed" : "Active"] as const));
export type ImprovementReportRow = TrainerPerformanceRow & { averageReportUsage: number; usagePct: number; lastBatchDate: string; lastViewingDate: string; districtActivationStatus: "Yet to Start" | "Active" | "Completed" };
export const IMPROVEMENT_REPORT_USAGE: ImprovementReportRow[] = TRAINER_PERFORMANCE.map((trainer, index) => {
  const random = mulberry32(92000 + index);
  const averageReportUsage = trainer.batches.length ? Math.floor(random() * (trainer.batches.length + 1)) : 0;
  const latestBatch = trainer.batches.map((batch) => batch.date).sort().at(-1);
  const lastViewing = latestBatch ? new Date(`${latestBatch}T00:00:00`) : null;
  if (lastViewing) lastViewing.setDate(lastViewing.getDate() + 2 + Math.floor(random() * 10));
  const date = (value: Date | null) => value ? `${String(value.getDate()).padStart(2, "0")}/${String(value.getMonth() + 1).padStart(2, "0")}/${value.getFullYear()}` : "–";
  const districtActivationStatus = districtStatus.get(trainer.district) ?? "Completed";
  const unavailable = districtActivationStatus === "Yet to Start";
  return { ...trainer, averageReportUsage, usagePct: trainer.batches.length ? Math.round(averageReportUsage * 100 / trainer.batches.length) : 0, lastBatchDate: unavailable ? "-" : latestBatch ? latestBatch.split("-").reverse().join("/") : "-", lastViewingDate: unavailable ? "-" : date(lastViewing), districtActivationStatus };
});
