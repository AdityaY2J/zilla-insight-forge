import {
  BATCHES,
  TALUKA_TARGETS,
  type Batch,
  type ModuleId,
} from "./capacity-building";
import {
  DEPARTMENTS,
  DESIGNATIONS,
  DIVISIONS,
  mulberry32,
  personName,
  phoneNumber,
  pick,
  type Department,
  type Division,
} from "./geography";

export const FIELD_STAFF_ROLES = [
  "Gram Sevaks",
  "Talathis",
  "Krishi Sahayaks",
  "ANMs / MPWs",
  "MSEB Jan Mitras",
  "Animal Husbandry Vets",
  "Irrigation Canal Inspectors",
  "Forest Guard",
  "Statistical Officers",
] as const;
export type FieldStaffRole = (typeof FIELD_STAFF_ROLES)[number];
export const FIELD_STAFF_ROLE_COUNT = FIELD_STAFF_ROLES.length;

export type FieldStaffCertificationStatus = "Certified" | "Pending";
export type FieldStaff = {
  id: string;
  name: string;
  designation: string;
  department: Department;
  division: Division;
  district: string;
  taluka: string;
  phone: string;
  role: FieldStaffRole;
  trained: boolean;
  assessment1: number | null;
  assessment2: number | null;
  certificationStatus: FieldStaffCertificationStatus;
  preScore: number | null;
  postScore: number | null;
  disablingShift: number | null;
  confusedShift: number | null;
  enablingShift: number | null;
};

export type FieldStaffBatch = Batch & {
  coach1Grade: "A" | "B" | "C" | "D";
  coach2Grade: "A" | "B" | "C" | "D";
  department: Department;
  roleCounts: Record<FieldStaffRole, number>;
};

function generateFieldStaff(): FieldStaff[] {
  const rows: FieldStaff[] = [];
  let sequence = 1;
  for (const target of TALUKA_TARGETS.filter((item) => item.active)) {
    const random = mulberry32(70000 + sequence);
    const count = 18 + Math.floor(random() * 12);
    for (let index = 0; index < count; index += 1) {
      const recordRandom = mulberry32(71000 + sequence * 100 + index);
      const trained = recordRandom() > 0.12;
      const assessedTwice = trained && recordRandom() > 0.25;
      const assessment1 = trained ? 55 + Math.floor(recordRandom() * 40) : null;
      const assessment2 = assessedTwice ? 55 + Math.floor(recordRandom() * 40) : null;
      const certified = assessment1 != null && assessment2 != null &&
        (assessment1 + assessment2) / 2 >= 65;
      const pre = 3 + recordRandom() * 3;
      const post = Math.min(10, pre + 1.5 + recordRandom() * 3);
      rows.push({
        id: `FS${String(5000 + sequence * 100 + index).slice(-5)}`,
        name: personName(recordRandom),
        designation: pick(recordRandom, DESIGNATIONS),
        department: pick(recordRandom, DEPARTMENTS),
        division: target.division,
        district: target.district,
        taluka: target.taluka,
        phone: phoneNumber(recordRandom),
        role: pick(recordRandom, FIELD_STAFF_ROLES),
        trained,
        assessment1,
        assessment2,
        certificationStatus: certified ? "Certified" : "Pending",
        preScore: Math.round(pre * 10) / 10,
        postScore: Math.round(post * 10) / 10,
        disablingShift: -(10 + Math.floor(recordRandom() * 20)),
        confusedShift: -(5 + Math.floor(recordRandom() * 20)),
        enablingShift: 25 + Math.floor(recordRandom() * 30),
      });
    }
    sequence += 1;
  }
  return rows;
}

function roleCountsFor(batch: Batch, seed: number): Record<FieldStaffRole, number> {
  const random = mulberry32(seed);
  const shuffled = [...FIELD_STAFF_ROLES].sort(() => random() - 0.5);
  const rolesCovered = 1 + Math.floor(random() * FIELD_STAFF_ROLE_COUNT);
  const counts = Object.fromEntries(
    FIELD_STAFF_ROLES.map((role) => [role, 0]),
  ) as Record<FieldStaffRole, number>;
  let remaining = batch.day1Participants;
  shuffled.slice(0, rolesCovered).forEach((role, index) => {
    const rolesRemaining = rolesCovered - index;
    const value = rolesRemaining === 1
      ? remaining
      : 1 + Math.floor(random() * Math.max(1, remaining - rolesRemaining));
    counts[role] = value;
    remaining -= value;
  });
  return counts;
}

export const FIELD_STAFF: FieldStaff[] = generateFieldStaff();

export const FIELD_STAFF_BATCHES: FieldStaffBatch[] = BATCHES.map((batch, index) => {
  const random = mulberry32(80000 + index);
  return {
    ...batch,
    id: `FSB${String(4000 + index).padStart(4, "0")}`,
    name: batch.name.replace("Batch", "Field Staff Batch"),
    coach1Grade: pick(random, ["A", "B", "C", "D"] as const),
    coach2Grade: pick(random, ["A", "B", "C", "D"] as const),
    department: pick(random, DEPARTMENTS),
    roleCounts: roleCountsFor(batch, 81000 + index),
  };
});

export function roleCount(batch: FieldStaffBatch) {
  return FIELD_STAFF_ROLES.filter((role) => batch.roleCounts[role] > 0).length;
}

export function mixCategory(batch: FieldStaffBatch) {
  const count = roleCount(batch);
  if (count >= 5) return "Good Mix" as const;
  if (count >= 3) return "Acceptable Mix" as const;
  if (count === 2) return "Poor Mix" as const;
  return "Single Role" as const;
}

export function largestRole(batch: FieldStaffBatch) {
  return FIELD_STAFF_ROLES.reduce((largest, role) =>
    batch.roleCounts[role] > batch.roleCounts[largest] ? role : largest,
  FIELD_STAFF_ROLES[0]);
}

export function moduleMetCount(batch: FieldStaffBatch, module: ModuleId) {
  return batch.moduleMet[module] ? 1 : 0;
}

export { DIVISIONS };
