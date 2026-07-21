import { mulberry32 } from "./geography";
import { CERTIFIED_MTS } from "./mt-certification";
import { BATCHES } from "./batches";
import { STUDENTS } from "./students";

export type TrainerRecord = {
  id: string;
  name: string;
  department: string;
  division: string;
  district: string;
  taluka: string;
  designation: string;
  batchesConducted: number;
  studentsTrained: number;
  studentsCertified: number;
  certificationRate: number;
  avgAttendancePct: number;
  avgStudentScore: number | null;
};

function generate(): TrainerRecord[] {
  const rnd = mulberry32(20260725);
  return CERTIFIED_MTS.map((mt) => {
    const trainerBatches = BATCHES.filter(
      (b) => b.trainerId === mt.id && b.type === "Deployment Rollout",
    );
    const completed = trainerBatches.filter((b) => b.status === "Completed");
    const batchCodes = new Set(completed.map((b) => b.code));
    const students = STUDENTS.filter((s) => batchCodes.has(s.batchCode));
    const certified = students.filter((s) => s.status === "Certified").length;
    const trained = students.filter(
      (s) => s.status !== "Enrolled" && s.status !== "Dropped Out",
    ).length;
    const scores = students
      .map((s) => s.finalScore)
      .filter((v): v is number => typeof v === "number");
    const avgScore =
      scores.length > 0
        ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) /
          10
        : null;
    const avgAttendance =
      students.length > 0
        ? Math.round(
            students.reduce((a, b) => a + b.attendancePct, 0) / students.length,
          )
        : 0;
    // Introduce mild variance so the roster isn't flat
    const jitter = Math.floor(rnd() * 3);
    return {
      id: mt.id,
      name: mt.name,
      department: mt.department,
      division: mt.division,
      district: mt.district,
      taluka: mt.taluka,
      designation: mt.designation,
      batchesConducted: completed.length,
      studentsTrained: trained,
      studentsCertified: certified,
      certificationRate:
        trained > 0
          ? Math.round((certified / trained) * 1000) / 10
          : 0,
      avgAttendancePct: Math.min(100, avgAttendance + jitter),
      avgStudentScore: avgScore,
    };
  }).filter((t) => t.batchesConducted > 0);
}

export const TRAINER_RECORDS: TrainerRecord[] = generate();
