/**
 * Watchlist datasets — fully isolated from Phase 1 / Phase 2 / Trainer
 * Performance Analytics data so no existing dashboard values change.
 * Deterministic pseudo-random generation (seeded) for stable mock data.
 */
import { DISTRICTS, mulberry32 } from "./geography";

const FIRST_NAMES = [
  "Amol", "Priya", "Sandeep", "Kavita", "Rahul", "Snehal", "Vikas", "Manisha",
  "Nitin", "Rupali", "Ganesh", "Swati", "Prashant", "Jyoti", "Sachin", "Meena",
  "Rohit", "Anita", "Sunil", "Pallavi", "Dattatray", "Shubhangi", "Kiran", "Nilima",
];
const LAST_NAMES = [
  "Patil", "Deshmukh", "Jadhav", "Kulkarni", "Shinde", "More", "Pawar", "Gaikwad",
  "Bhosale", "Sawant", "Kadam", "Chavan", "Wagh", "Salunkhe", "Thorat", "Ingle",
];

export type WatchlistTrainer = {
  id: string;
  name: string;
  phone: string;
  division: string;
  district: string;
  taluka: string;
  certified: boolean;
  /** ISO date of their first ever recorded batch. */
  firstBatchDate: string;
};

export const OPERATIONAL_FLASHPOINTS = [
  "Batch Size > 50",
  "Single Trainer",
  "Uncertified Trainer",
  "Program Duration < 3 Hours",
  "Missed End-of-day Assessment",
] as const;
export type OperationalFlashpoint = (typeof OPERATIONAL_FLASHPOINTS)[number];

export type WatchlistBatch = {
  id: string;
  name: string;
  date: string;
  day: "Day 1" | "Day 2";
  division: string;
  district: string;
  taluka: string;
  trainer1: WatchlistTrainer;
  trainer2: WatchlistTrainer | null;
  batchSize: number;
  durationHours: number;
  modulesAdhered: number;
  /** Modules defaulted out of the 4 core modules (moderate-status rule). */
  modulesDefaultedOf4: number;
  missedAssessment: boolean;
  avgLearningScore: number;
  flashpoints: OperationalFlashpoint[];
  status: "Critical" | "Moderate" | "Healthy";
  learningStatus: "Above Benchmark" | "Meets Benchmark" | "Below Benchmark";
};

const iso = (d: Date) => d.toISOString().slice(0, 10);
export const TODAY = new Date();
TODAY.setHours(0, 0, 0, 0);
export const TODAY_ISO = iso(TODAY);

const dayOffset = (n: number) => {
  const d = new Date(TODAY);
  d.setDate(d.getDate() + n);
  return iso(d);
};

export const formatWatchlistDate = (value: string) => {
  const [y, m, d] = value.split("-");
  return `${d}/${m}/${y}`;
};

const rnd = mulberry32(770425);
const pick = <T,>(list: readonly T[]) => list[Math.floor(rnd() * list.length)];
const between = (min: number, max: number) => min + Math.floor(rnd() * (max - min + 1));

export const WATCHLIST_TRAINERS: WatchlistTrainer[] = Array.from({ length: 48 }, (_, i) => {
  const district = DISTRICTS[i % DISTRICTS.length];
  return {
    id: `WT${String(i + 1).padStart(4, "0")}`,
    name: `${FIRST_NAMES[i % FIRST_NAMES.length]} ${LAST_NAMES[(i * 5 + 3) % LAST_NAMES.length]}`,
    phone: `+91 9${String(80000000 + i * 137911).slice(0, 9)}`,
    division: district.division,
    district: district.name,
    taluka: district.talukas[i % district.talukas.length],
    certified: i % 9 !== 0,
    firstBatchDate: i % 7 === 0 ? TODAY_ISO : dayOffset(-between(4, 60)),
  };
});

function buildBatch(index: number, date: string, day: "Day 1" | "Day 2"): WatchlistBatch {
  const t1 = WATCHLIST_TRAINERS[index % WATCHLIST_TRAINERS.length];
  const single = rnd() < 0.18;
  const t2 = single
    ? null
    : WATCHLIST_TRAINERS[(index * 7 + 13) % WATCHLIST_TRAINERS.length];
  const batchSize = pick([28, 33, 36, 41, 43, 45, 47, 52, 56, 38, 44, 49]);
  const durationHours = pick([2.5, 2.75, 3, 3.5, 4, 4.5, 5, 5.5, 6]);
  const modulesAdhered = between(3, 8);
  const modulesDefaultedOf4 = between(0, 3);
  const missedAssessment = rnd() < 0.14;
  const avgLearningScore = pick([62, 68, 71, 74, 76, 78, 80, 80, 82, 85, 88, 91]);

  const flashpoints: OperationalFlashpoint[] = [];
  if (batchSize > 50) flashpoints.push("Batch Size > 50");
  if (!t2) flashpoints.push("Single Trainer");
  if (!t1.certified || (t2 && !t2.certified)) flashpoints.push("Uncertified Trainer");
  if (durationHours < 3) flashpoints.push("Program Duration < 3 Hours");
  if (missedAssessment) flashpoints.push("Missed End-of-day Assessment");

  const moderate =
    (batchSize >= 40 && batchSize <= 45) ||
    (durationHours >= 3 && durationHours <= 5 && modulesDefaultedOf4 === 2);
  const status: WatchlistBatch["status"] = flashpoints.length
    ? "Critical"
    : moderate
      ? "Moderate"
      : "Healthy";

  const learningStatus: WatchlistBatch["learningStatus"] =
    avgLearningScore > 80
      ? "Above Benchmark"
      : avgLearningScore === 80
        ? "Meets Benchmark"
        : "Below Benchmark";

  return {
    id: `WB${String(index + 1).padStart(4, "0")}`,
    name: `${t1.district} ${day} Batch ${String(index + 1).padStart(3, "0")}`,
    date,
    day,
    division: t1.division,
    district: t1.district,
    taluka: t1.taluka,
    trainer1: t1,
    trainer2: t2,
    batchSize,
    durationHours,
    modulesAdhered,
    modulesDefaultedOf4,
    missedAssessment,
    avgLearningScore,
    flashpoints,
    status,
    learningStatus,
  };
}

/** Today's batches plus 45 days of history (used by the repeat-default view). */
export const WATCHLIST_BATCHES: WatchlistBatch[] = (() => {
  const out: WatchlistBatch[] = [];
  let i = 0;
  for (let back = 45; back >= 0; back--) {
    const date = dayOffset(-back);
    const count = back === 0 ? 26 : between(2, 5);
    for (let n = 0; n < count; n++) {
      out.push(buildBatch(i, date, i % 2 === 0 ? "Day 1" : "Day 2"));
      i++;
    }
  }
  return out;
})();

export const TODAY_BATCHES = WATCHLIST_BATCHES.filter((b) => b.date === TODAY_ISO);

const uniq = (values: string[]) => Array.from(new Set(values));

export const TODAY_SNAPSHOT = {
  activeDivisions: uniq(TODAY_BATCHES.map((b) => b.division)).length,
  activeDistricts: uniq(TODAY_BATCHES.map((b) => b.district)).length,
  activeTalukas: uniq(TODAY_BATCHES.map((b) => b.taluka)).length,
  activeDay1Batches: TODAY_BATCHES.filter((b) => b.day === "Day 1").length,
  activeDay2Batches: TODAY_BATCHES.filter((b) => b.day === "Day 2").length,
  activeMasterTrainers: uniq(
    TODAY_BATCHES.flatMap((b) => [b.trainer1.id, ...(b.trainer2 ? [b.trainer2.id] : [])]),
  ).length,
  firstTimeTrainers: uniq(
    TODAY_BATCHES.flatMap((b) => [b.trainer1, ...(b.trainer2 ? [b.trainer2] : [])])
      .filter((t) => t.firstBatchDate === TODAY_ISO)
      .map((t) => t.id),
  ).length,
  day1Participants: TODAY_BATCHES.filter((b) => b.day === "Day 1").reduce((s, b) => s + b.batchSize, 0),
  day2Participants: TODAY_BATCHES.filter((b) => b.day === "Day 2").reduce((s, b) => s + b.batchSize, 0),
};

/** Past 14 days (today −14 through today, inclusive). */
export const PAST_14_DAYS = Array.from({ length: 15 }, (_, i) => {
  const date = dayOffset(i - 14);
  const seed = mulberry32(41000 + i);
  return {
    date,
    label: formatWatchlistDate(date).slice(0, 5),
    registrations: 120 + Math.floor(seed() * 260),
    day1Submissions: 40 + Math.floor(seed() * 110),
    day2Submissions: 30 + Math.floor(seed() * 100),
  };
});

const countToday = (predicate: (b: WatchlistBatch) => boolean) =>
  TODAY_BATCHES.filter(predicate).length;

export const TODAY_FLASHPOINT_SUMMARY = {
  total: TODAY_BATCHES.length,
  operational: [
    { label: "Batches with No Flashpoints", value: countToday((b) => b.flashpoints.length === 0) },
    { label: "Batches with One or More Critical Flashpoints", value: countToday((b) => b.flashpoints.length > 0) },
    ...OPERATIONAL_FLASHPOINTS.map((fp) => ({
      label: fp,
      value: countToday((b) => b.flashpoints.includes(fp)),
    })),
  ],
  learning: [
    { label: "Batches Meeting Learning Benchmark", value: countToday((b) => b.avgLearningScore >= 80) },
    { label: "Batches Below Learning Benchmark", value: countToday((b) => b.avgLearningScore < 80) },
  ],
};

export type TrainerRiskRow = {
  id: string;
  name: string;
  phone: string;
  lastThree: ("Risk" | "Good")[];
  riskCount: number;
  riskStatus: "Watch" | "Repeat" | "Persistent";
  dominantIssues: OperationalFlashpoint[];
};

export const TRAINER_RISK_ROWS: TrainerRiskRow[] = WATCHLIST_TRAINERS.map((trainer) => {
  const batches = WATCHLIST_BATCHES.filter(
    (b) => b.trainer1.id === trainer.id || b.trainer2?.id === trainer.id,
  )
    .slice()
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
    .slice(0, 3);
  const lastThree = batches.map((b) => (b.status === "Critical" ? "Risk" : "Good") as "Risk" | "Good");
  const riskCount = lastThree.filter((s) => s === "Risk").length;
  const dominantIssues = OPERATIONAL_FLASHPOINTS.filter((fp) =>
    batches.some((b) => b.flashpoints.includes(fp)),
  );
  return {
    id: trainer.id,
    name: trainer.name,
    phone: trainer.phone,
    lastThree,
    riskCount,
    riskStatus: riskCount >= 3 ? "Persistent" : riskCount === 2 ? "Repeat" : "Watch",
    dominantIssues: [...dominantIssues],
  };
}).filter((row) => row.riskCount > 0);
