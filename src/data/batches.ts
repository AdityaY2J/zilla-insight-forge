import {
  DEPARTMENTS,
  DISTRICTS,
  mulberry32,
  pick,
} from "./geography";
import type { Department, Division } from "./geography";
import { CERTIFIED_MTS } from "./mt-certification";

export type BatchType = "Capacity Building" | "Deployment Rollout";
export type BatchStatus =
  | "Planned"
  | "Scheduled"
  | "In Progress"
  | "Completed"
  | "Cancelled";

export type Batch = {
  id: string;
  code: string;
  type: BatchType;
  status: BatchStatus;
  startDate: string;
  endDate: string;
  division: Division;
  district: string;
  taluka: string;
  department: Department;
  venue: string;
  trainerId: string;
  trainerName: string;
  plannedParticipants: number;
  enrolledParticipants: number;
  attendedParticipants: number;
};

const VENUES = [
  "Zilla Parishad Auditorium",
  "Panchayat Samiti Hall",
  "District Training Centre",
  "Government Rest House",
  "Community Hall",
  "Tehsil Office",
];

function generate(): Batch[] {
  const rnd = mulberry32(20260722);
  const out: Batch[] = [];
  const trainers = CERTIFIED_MTS;
  if (!trainers.length) return out;
  let n = 1;
  const start = new Date(2026, 0, 1).getTime();
  const day = 86400000;

  for (const d of DISTRICTS) {
    for (const taluka of d.talukas) {
      // Capacity Building (3A) — 1–3 batches per taluka
      const cbCount = 1 + Math.floor(rnd() * 3);
      for (let i = 0; i < cbCount; i++) {
        out.push(buildBatch("Capacity Building", taluka, d, rnd, n++, trainers, start, day));
      }
      // Deployment Rollout (3B) — 2–4 per taluka
      const drCount = 2 + Math.floor(rnd() * 3);
      for (let i = 0; i < drCount; i++) {
        out.push(buildBatch("Deployment Rollout", taluka, d, rnd, n++, trainers, start, day));
      }
    }
  }
  return out;
}

function buildBatch(
  type: BatchType,
  taluka: string,
  d: { name: string; division: Division },
  rnd: () => number,
  n: number,
  trainers: typeof CERTIFIED_MTS,
  startBase: number,
  day: number,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Batch {
  const trainer = trainers[Math.floor(rnd() * trainers.length)];
  const dayOffset = Math.floor(rnd() * 210); // spread across ~7 months
  const durationDays = type === "Capacity Building" ? 4 : 3;
  const startDate = new Date(startBase + dayOffset * day);
  const endDate = new Date(startDate.getTime() + durationDays * day);
  const today = new Date(2026, 6, 21).getTime();

  let status: BatchStatus;
  if (rnd() < 0.04) status = "Cancelled";
  else if (endDate.getTime() < today) status = "Completed";
  else if (startDate.getTime() <= today) status = "In Progress";
  else if (dayOffset < 45) status = "Scheduled";
  else status = "Planned";

  const planned = type === "Capacity Building" ? 25 : 40;
  const enrolled =
    status === "Planned"
      ? 0
      : Math.max(0, planned - Math.floor(rnd() * 5));
  const attended =
    status === "Completed" || status === "In Progress"
      ? Math.max(0, enrolled - Math.floor(rnd() * 4))
      : 0;

  return {
    id: `B-${String(n).padStart(5, "0")}`,
    code: `${type === "Capacity Building" ? "CB" : "DR"}-${d.name.slice(0, 3).toUpperCase()}-${String(n).padStart(4, "0")}`,
    type,
    status,
    startDate: startDate.toISOString().slice(0, 10),
    endDate: endDate.toISOString().slice(0, 10),
    division: d.division,
    district: d.name,
    taluka,
    department: pick(rnd, DEPARTMENTS),
    venue: pick(rnd, VENUES),
    trainerId: trainer.id,
    trainerName: trainer.name,
    plannedParticipants: planned,
    enrolledParticipants: enrolled,
    attendedParticipants: attended,
  };
}

export const BATCHES: Batch[] = generate();

export function batchSummary(rows: Batch[]) {
  const total = rows.length;
  const completed = rows.filter((r) => r.status === "Completed").length;
  const inProgress = rows.filter((r) => r.status === "In Progress").length;
  const scheduled = rows.filter(
    (r) => r.status === "Scheduled" || r.status === "Planned",
  ).length;
  const cancelled = rows.filter((r) => r.status === "Cancelled").length;
  const plannedP = rows.reduce((s, r) => s + r.plannedParticipants, 0);
  const attendedP = rows.reduce((s, r) => s + r.attendedParticipants, 0);
  const attendanceRate =
    plannedP > 0
      ? Math.round((attendedP / plannedP) * 1000) / 10
      : 0;
  return { total, completed, inProgress, scheduled, cancelled, attendanceRate };
}
