/**
 * Phase 1 — Capacity Building
 * Deterministic mock dataset generated per Maharashtra Zilla taxonomy.
 * A single source of truth for MT records, batches, adherence, learning,
 * and cognitive metrics used across all 6 dashboards.
 */
import {
  DEPARTMENTS,
  DESIGNATIONS,
  DISTRICTS,
  DIVISIONS,
  type Department,
  type Division,
  mulberry32,
  personName,
  phoneNumber,
  pick,
  talukaList,
} from "./geography";

export type SelectionStatus = "Nominated" | "Assessed" | "Selected" | "Rejected";
/** Certification categories per Phase 1 change set: Certified / Pending / Not Certified. */
export type CertificationStatus = "Pending" | "Certified" | "Not Certified";
export type CertificationGrade = "A" | "B" | "C" | "D";

export type MasterTrainer = {
  id: string;
  name: string;
  designation: string;
  department: Department;
  division: Division;
  district: string;
  taluka: string;
  phone: string;
  selectionScore: number | null;
  selectionStatus: SelectionStatus;
  assessment1: number | null;
  assessment2: number | null;
  /** Has attended MT training (independent of certification outcome). */
  trained: boolean;
  certificationGrade: CertificationGrade | null;
  certificationStatus: CertificationStatus;
};

export type TalukaTarget = {
  division: Division;
  district: string;
  taluka: string;
  active: boolean;
  targetNominated: number;
  targetSelected: number;
  targetCertified: number;
  targetTrained: number;
  lastDate: string; // dd/mm/yyyy
};

export type ModuleId = "M1" | "M2" | "M3" | "M4" | "M5" | "M6" | "M7" | "M8";
export const MODULES: { id: ModuleId; name: string }[] = [
  { id: "M1", name: "Opening & Context" },
  { id: "M2", name: "Program Vision" },
  { id: "M3", name: "Adult Learning Principles" },
  { id: "M4", name: "Facilitation Techniques" },
  { id: "M5", name: "Role Play & Practice" },
  { id: "M6", name: "Assessment Design" },
  { id: "M7", name: "Feedback & Reflection" },
  { id: "M8", name: "Closing & Commitments" },
];

export type Batch = {
  id: string;
  name: string;
  division: Division;
  district: string;
  taluka: string;
  coach1Id: string;
  coach1Name: string;
  coach2Id: string;
  coach2Name: string;
  day1Participants: number;
  day2Participants: number;
  day1AssessmentAvg: number; // %
  day2AssessmentAvg: number; // %
  day1RedPct: number;
  day1OrangePct: number;
  day1GreenPct: number;
  day2RedPct: number;
  day2OrangePct: number;
  day2GreenPct: number;
  redPct: number;
  orangePct: number;
  greenPct: number;
  moduleMet: Record<ModuleId, boolean>;
  processAdherence: number; // 0..8
  active: boolean;
  date: string; // ISO
  // Learning & Cognitive
  avgPreScore: number; // 0..10
  avgPostScore: number; // 0..10
  disablingShift: number; // signed %
  confusedShift: number; // signed %
  enablingShift: number; // signed %
};

function fmtDate(d: Date): string {
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${dd}/${mm}/${d.getFullYear()}`;
}

// --------------------------------------------------------------------------
// Taluka-level targets
// --------------------------------------------------------------------------
const TALUKAS = talukaList();

export const TALUKA_TARGETS: TalukaTarget[] = TALUKAS.map((t, i) => {
  const rnd = mulberry32(1000 + i);
  // ~20% inactive
  const active = rnd() > 0.2;
  const base = 8 + Math.floor(rnd() * 8);
  const lastDayOffset = Math.floor(rnd() * 90);
  const d = new Date(2026, 6, 12);
  d.setDate(d.getDate() - lastDayOffset);
  return {
    ...t,
    active,
    targetNominated: base + 2,
    targetSelected: base,
    targetCertified: base,
    targetTrained: base + 1,
    lastDate: fmtDate(d),
  };
});

// --------------------------------------------------------------------------
// Master Trainer records
// --------------------------------------------------------------------------
function generateMasterTrainers(): MasterTrainer[] {
  const list: MasterTrainer[] = [];
  let idx = 0;
  for (const t of TALUKA_TARGETS) {
    if (!t.active) continue;
    const rnd = mulberry32(5000 + idx);
    const nominated = Math.max(0, t.targetNominated - Math.floor(rnd() * 4));
    for (let i = 0; i < nominated; i++) {
      const r = mulberry32(9000 + idx * 100 + i);
      const roll = r();
      let selectionStatus: SelectionStatus = "Nominated";
      let selectionScore: number | null = null;
      let certificationStatus: CertificationStatus = "Pending";
      let certificationGrade: CertificationGrade | null = null;
      let trained = false;
      let asmt1: number | null = null;
      let asmt2: number | null = null;

      // ~92% assessed
      if (roll > 0.08) {
        selectionScore = 45 + Math.floor(r() * 50);
        selectionStatus = "Assessed";
        // Selected if score >= 60 (roughly 70% of assessed)
        if (selectionScore >= 60) {
          selectionStatus = "Selected";
          // Cert progression among selected
          const c = r();
          if (c > 0.35) {
            trained = true;
            asmt1 = 55 + Math.floor(r() * 40);
            if (c > 0.55) {
              asmt2 = 55 + Math.floor(r() * 40);
              const avg = (asmt1 + asmt2) / 2;
              certificationStatus = avg >= 65 ? "Certified" : "Not Certified";
              certificationGrade =
                avg >= 85 ? "A" : avg >= 75 ? "B" : avg >= 65 ? "C" : "D";
            } else {
              certificationStatus = "Pending";
            }
          } else {
            certificationStatus = "Pending";
          }
        } else {
          selectionStatus = "Rejected";
        }
      }

      list.push({
        id: `MT${String(2000 + idx * 100 + i).slice(-4)}${idx}`,
        name: personName(r),
        designation: pick(r, DESIGNATIONS),
        department: pick(r, DEPARTMENTS),
        division: t.division,
        district: t.district,
        taluka: t.taluka,
        phone: phoneNumber(r),
        selectionScore,
        selectionStatus,
        assessment1: asmt1,
        assessment2: asmt2,
        trained,
        certificationGrade,
        certificationStatus,
      });
    }
    idx++;
  }
  return list;
}

export const MASTER_TRAINERS: MasterTrainer[] = generateMasterTrainers();

// --------------------------------------------------------------------------
// Batches
// --------------------------------------------------------------------------
function generateBatches(): Batch[] {
  const selected = MASTER_TRAINERS.filter(
    (m) => m.selectionStatus === "Selected",
  );
  const list: Batch[] = [];
  const now = new Date(2026, 6, 15);
  let bid = 3000;
  // Group loosely by district
  const byDistrict = new Map<string, MasterTrainer[]>();
  for (const m of selected) {
    const arr = byDistrict.get(m.district) ?? [];
    arr.push(m);
    byDistrict.set(m.district, arr);
  }
  let batchIdx = 0;
  for (const [district, mts] of byDistrict) {
    const talukaBuckets = new Map<string, MasterTrainer[]>();
    for (const m of mts) {
      const arr = talukaBuckets.get(m.taluka) ?? [];
      arr.push(m);
      talukaBuckets.set(m.taluka, arr);
    }
    for (const [taluka, tmts] of talukaBuckets) {
      const r = mulberry32(20000 + batchIdx);
      const dayOffset = Math.floor(r() * 120) - 90;
      const date = new Date(now);
      date.setDate(date.getDate() + dayOffset);
      const active = dayOffset > -7 && dayOffset < 3;
      const d1 = 28 + Math.floor(r() * 12);
      const d2 = d1 - Math.floor(r() * 4);
      const d1Avg = 70 + Math.floor(r() * 25);
      const d2Avg = 65 + Math.floor(r() * 30);
      const d1Red = 5 + Math.floor(r() * 20);
      const d1Green = 40 + Math.floor(r() * 40);
      const d1Orange = Math.max(0, 100 - d1Red - d1Green);
      const d2Red = 3 + Math.floor(r() * 18);
      const d2Green = 45 + Math.floor(r() * 40);
      const d2Orange = Math.max(0, 100 - d2Red - d2Green);
      const red = Math.round((d1Red + d2Red) / 2);
      const green = Math.round((d1Green + d2Green) / 2);
      const orange = Math.max(0, 100 - red - green);
      const moduleMet = {} as Record<ModuleId, boolean>;
      let met = 0;
      for (const m of MODULES) {
        const pass = r() > 0.35;
        moduleMet[m.id] = pass;
        if (pass) met++;
      }
      const coach1 = tmts[0];
      const coach2 = tmts[1] ?? coach1;
      const pre = 3 + r() * 3;
      const post = pre + 1.5 + r() * 3;
      list.push({
        id: `BT${bid++}`,
        name: `Batch ${taluka}-${String(batchIdx + 1).padStart(2, "0")}`,
        division: coach1.division,
        district,
        taluka,
        coach1Id: coach1.id,
        coach1Name: coach1.name,
        coach2Id: coach2.id,
        coach2Name: coach2.name,
        day1Participants: d1,
        day2Participants: d2,
        day1AssessmentAvg: d1Avg,
        day2AssessmentAvg: d2Avg,
        day1RedPct: d1Red,
        day1OrangePct: d1Orange,
        day1GreenPct: d1Green,
        day2RedPct: d2Red,
        day2OrangePct: d2Orange,
        day2GreenPct: d2Green,
        redPct: red,
        orangePct: orange,
        greenPct: green,
        moduleMet,
        processAdherence: met,
        active,
        date: date.toISOString().slice(0, 10),
        avgPreScore: Math.round(pre * 10) / 10,
        avgPostScore: Math.round(Math.min(10, post) * 10) / 10,
        disablingShift: -(10 + Math.floor(r() * 20)),
        confusedShift: -(5 + Math.floor(r() * 20)),
        enablingShift: 25 + Math.floor(r() * 30),
      });
      batchIdx++;
    }
  }
  return list;
}

export const BATCHES: Batch[] = generateBatches();

// --------------------------------------------------------------------------
// Aggregations & helpers
// --------------------------------------------------------------------------
export function targetsForScope(scope: {
  division?: string;
  district?: string;
}) {
  return TALUKA_TARGETS.filter(
    (t) =>
      (!scope.division || scope.division === "All" || t.division === scope.division) &&
      (!scope.district || scope.district === "All" || t.district === scope.district),
  );
}

export function trainersForScope(scope: {
  division?: string;
  district?: string;
}) {
  return MASTER_TRAINERS.filter(
    (m) =>
      (!scope.division || scope.division === "All" || m.division === scope.division) &&
      (!scope.district || scope.district === "All" || m.district === scope.district),
  );
}

export type DivisionRollup = {
  division: Division;
  targetNominated: number;
  targetSelected: number;
  targetCertified: number;
  targetTrained: number;
  nominated: number;
  assessed: number;
  selected: number;
  trained: number;
  certified: number;
  completionSelected: number; // %
  completionCertified: number; // %
};

export function divisionRollups(): DivisionRollup[] {
  return DIVISIONS.map((division) => {
    const talukas = TALUKA_TARGETS.filter((t) => t.division === division);
    const trainers = MASTER_TRAINERS.filter((m) => m.division === division);
    const targetNominated = talukas.reduce(
      (s, t) => s + (t.active ? t.targetNominated : 0),
      0,
    );
    const targetSelected = talukas.reduce(
      (s, t) => s + (t.active ? t.targetSelected : 0),
      0,
    );
    const targetCertified = talukas.reduce(
      (s, t) => s + (t.active ? t.targetCertified : 0),
      0,
    );
    const targetTrained = talukas.reduce(
      (s, t) => s + (t.active ? t.targetTrained : 0),
      0,
    );
    const nominated = trainers.length;
    const assessed = trainers.filter((t) => t.selectionStatus !== "Nominated").length;
    const selected = trainers.filter(
      (t) =>
        t.selectionStatus === "Selected" ||
        t.certificationStatus !== "Pending" ||
        t.assessment1 != null,
    ).length;
    const trained = trainers.filter(
      (t) => t.certificationStatus !== "Pending",
    ).length;
    const certified = trainers.filter((t) => t.certificationStatus === "Certified").length;
    return {
      division,
      targetNominated,
      targetSelected,
      targetCertified,
      targetTrained,
      nominated,
      assessed,
      selected,
      trained,
      certified,
      completionSelected: targetSelected
        ? Math.round((selected / targetSelected) * 100)
        : 0,
      completionCertified: targetCertified
        ? Math.round((certified / targetCertified) * 100)
        : 0,
    };
  });
}

/** Bucket a division into Active / Completed / Yet to Start using the placeholder
 * rule agreed with product: Completed if completion % ≥ 100%, Yet to Start if
 * no activity, else Active. Metric name determines which completion applies. */
export type BucketMetric = "selected" | "certified";
export type DivisionBucket = "active" | "completed" | "yet_to_start";
export function bucketDivision(
  r: DivisionRollup,
  metric: BucketMetric,
): DivisionBucket {
  const activity = metric === "selected" ? r.nominated : r.trained;
  const completion =
    metric === "selected" ? r.completionSelected : r.completionCertified;
  if (activity === 0) return "yet_to_start";
  if (completion >= 100) return "completed";
  return "active";
}

// --------------------------------------------------------------------------
// Learning & Cognitive aggregates
// --------------------------------------------------------------------------
export type LearningAgg = {
  d1Participants: number;
  d2Participants: number;
  d1Avg: number;
  d2Avg: number;
  redPct: number;
  orangePct: number;
  greenPct: number;
  pre: number;
  post: number;
  disabling: number;
  confused: number;
  enabling: number;
  cognitiveShiftPct: number;
  batches: number;
};

export function aggregateLearning(batches: Batch[]): LearningAgg {
  if (batches.length === 0) {
    return {
      d1Participants: 0,
      d2Participants: 0,
      d1Avg: 0,
      d2Avg: 0,
      redPct: 0,
      orangePct: 0,
      greenPct: 0,
      pre: 0,
      post: 0,
      disabling: 0,
      confused: 0,
      enabling: 0,
      cognitiveShiftPct: 0,
      batches: 0,
    };
  }
  const n = batches.length;
  const sum = <K extends keyof Batch>(k: K) =>
    batches.reduce((s, b) => s + (b[k] as number), 0);
  const pre = sum("avgPreScore") / n;
  const post = sum("avgPostScore") / n;
  return {
    d1Participants: sum("day1Participants"),
    d2Participants: sum("day2Participants"),
    d1Avg: Math.round(sum("day1AssessmentAvg") / n),
    d2Avg: Math.round(sum("day2AssessmentAvg") / n),
    redPct: Math.round(sum("redPct") / n),
    orangePct: Math.round(sum("orangePct") / n),
    greenPct: Math.round(sum("greenPct") / n),
    pre: Math.round(pre * 10) / 10,
    post: Math.round(post * 10) / 10,
    disabling: Math.round(sum("disablingShift") / n),
    confused: Math.round(sum("confusedShift") / n),
    enabling: Math.round(sum("enablingShift") / n),
    cognitiveShiftPct: Math.round(((post - pre) / 10) * 100),
    batches: n,
  };
}
