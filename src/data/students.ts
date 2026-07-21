import {
  DEPARTMENTS,
  DESIGNATIONS,
  DISTRICTS,
  mulberry32,
  personName,
  pick,
} from "./geography";
import type { Department, Division } from "./geography";
import { BATCHES } from "./batches";

export type StudentStatus =
  | "Enrolled"
  | "In Training"
  | "Assessment Pending"
  | "Certified"
  | "Failed"
  | "Dropped Out";

export type Student = {
  id: string;
  name: string;
  department: Department;
  designation: string;
  division: Division;
  district: string;
  taluka: string;
  batchCode: string;
  status: StudentStatus;
  attendancePct: number;
  finalScore: number | null;
};

function generate(): Student[] {
  const rnd = mulberry32(20260724);
  const drBatches = BATCHES.filter((b) => b.type === "Deployment Rollout");
  const out: Student[] = [];
  let counter = 1;
  for (const b of drBatches) {
    const size = b.enrolledParticipants || 0;
    for (let i = 0; i < size; i++) {
      const roll = rnd();
      let status: StudentStatus;
      let score: number | null = null;
      let attendance = 60 + Math.floor(rnd() * 40);
      if (b.status === "Planned" || b.status === "Scheduled") {
        status = "Enrolled";
        attendance = 0;
      } else if (b.status === "In Progress") {
        status = roll < 0.05 ? "Dropped Out" : "In Training";
      } else if (b.status === "Cancelled") {
        status = "Dropped Out";
        attendance = 0;
      } else {
        // Completed
        if (roll < 0.04) {
          status = "Dropped Out";
        } else if (roll < 0.12) {
          status = "Assessment Pending";
          attendance = 75 + Math.floor(rnd() * 20);
        } else if (roll < 0.22) {
          status = "Failed";
          score = 30 + Math.floor(rnd() * 30);
        } else {
          status = "Certified";
          score = 60 + Math.floor(rnd() * 35);
        }
      }
      const district = DISTRICTS.find((d) => d.name === b.district)!;
      out.push({
        id: `ST-${String(counter).padStart(6, "0")}`,
        name: personName(rnd),
        department: pick(rnd, DEPARTMENTS),
        designation: pick(rnd, DESIGNATIONS),
        division: district.division,
        district: b.district,
        taluka: b.taluka,
        batchCode: b.code,
        status,
        attendancePct: attendance,
        finalScore: score,
      });
      counter++;
    }
  }
  return out;
}

export const STUDENTS: Student[] = generate();

export function studentFunnel(rows: Student[]) {
  const enrolled = rows.length;
  const inTraining = rows.filter(
    (r) => r.status !== "Enrolled" && r.status !== "Dropped Out",
  ).length;
  const assessed = rows.filter(
    (r) => r.status === "Certified" || r.status === "Failed",
  ).length;
  const certified = rows.filter((r) => r.status === "Certified").length;
  return { enrolled, inTraining, assessed, certified };
}
