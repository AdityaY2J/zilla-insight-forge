/**
 * Rollout Readiness mock data — isolated from every other dashboard dataset.
 *
 * Data contract (for later backend integration — conceptual mappings only):
 *   Participants Required = geography-level field-staff planning target;
 *   Batches Required      = geography-level required-batches planning target;
 *   Participants Uploaded = distinct uploaded field-staff records at their geography;
 *   Batches Scheduled     = distinct batch records with status "Scheduled" at their planned geography.
 */

import {
  DEPARTMENTS,
  DESIGNATIONS,
  DISTRICTS,
  mulberry32,
  personName,
  phoneNumber,
  pick,
  type Department,
  type Division,
} from "./geography";
import type { HierRow } from "@/components/dashboard/hierarchical-breakdown-table";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type RolloutBatchStatus = "Draft" | "Scheduled";

export type PlannedTaluka = {
  division: Division;
  district: string;
  taluka: string;
  participantsRequired: number;
  batchesRequired: number;
};

export type RolloutBatch = {
  id: string;
  name: string;
  status: RolloutBatchStatus;
  division: Division;
  district: string;
  taluka: string;
  coach1: string;
  /** Coach 2 is genuinely optional; do not fabricate one. */
  coach2: string | null;
  venue: string;
  /** dd/mm/yyyy */
  startDate: string;
  /** dd/mm/yyyy */
  endDate: string;
};

export type RolloutParticipant = {
  id: string;
  name: string;
  designation: string;
  department: Department;
  division: Division;
  district: string;
  taluka: string;
  /** Kept as text so leading digits are never altered. */
  phone: string;
  /** null = uploaded but not yet assigned to a batch. */
  batchId: string | null;
};

// ---------------------------------------------------------------------------
// Planning targets (mock)
// ---------------------------------------------------------------------------

function buildPlannedTalukas(): PlannedTaluka[] {
  const rnd = mulberry32(42017);
  return DISTRICTS.flatMap((district) =>
    district.talukas.map((taluka) => {
      const participantsRequired = 24 + Math.floor(rnd() * 10) * 8; // 24–96
      return {
        division: district.division,
        district: district.name,
        taluka,
        participantsRequired,
        batchesRequired: Math.max(1, Math.ceil(participantsRequired / 30)),
      };
    }),
  );
}

export const PLANNED_TALUKAS: PlannedTaluka[] = buildPlannedTalukas();

// ---------------------------------------------------------------------------
// Records (mock)
// ---------------------------------------------------------------------------

const VENUE_TEMPLATES = [
  (taluka: string) => `${taluka} Zilla Parishad Training Hall`,
  (taluka: string) => `${taluka} Panchayat Samiti Hall`,
  (taluka: string) => `${taluka} Community Training Centre`,
  (taluka: string) => `ZP Conference Room, ${taluka}`,
] as const;

function formatDate(d: Date): string {
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${dd}/${mm}/${d.getFullYear()}`;
}

function buildCoachPool(): string[] {
  const rnd = mulberry32(51501);
  return Array.from({ length: 40 }, () => personName(rnd));
}

type GeneratedRecords = {
  participants: RolloutParticipant[];
  batches: RolloutBatch[];
};

function buildRecords(): GeneratedRecords {
  const coachPool = buildCoachPool();
  const rnd = mulberry32(60123);
  const participants: RolloutParticipant[] = [];
  const batches: RolloutBatch[] = [];
  let participantSeq = 1;
  let batchSeq = 1;

  for (const planned of PLANNED_TALUKAS) {
    // ~10% of planned talukas have zero activity (no uploads, no batches).
    if (rnd() < 0.1) continue;

    const { participantsRequired, batchesRequired } = planned;
    const uploaded = Math.max(
      1,
      Math.round(participantsRequired * (0.25 + rnd() * 0.8)),
    );

    // Some talukas have uploads but no scheduled batch yet.
    const scheduledCount =
      rnd() < 0.22 ? 0 : 1 + Math.floor(rnd() * batchesRequired);
    const draftCount = rnd() < 0.4 ? (rnd() < 0.7 ? 1 : 2) : 0;

    const talukaBatches: RolloutBatch[] = [];
    for (let i = 0; i < scheduledCount + draftCount; i += 1) {
      const start = new Date(2026, 7, 3);
      start.setDate(start.getDate() + Math.floor(rnd() * 120));
      const end = new Date(start);
      end.setDate(end.getDate() + 2);
      talukaBatches.push({
        id: `RB${String(1000 + batchSeq).padStart(4, "0")}`,
        name: `FS-${planned.taluka}-B${String(i + 1).padStart(2, "0")}`,
        status: i < scheduledCount ? "Scheduled" : "Draft",
        division: planned.division,
        district: planned.district,
        taluka: planned.taluka,
        coach1: pick(rnd, coachPool),
        coach2: rnd() < 0.25 ? null : pick(rnd, coachPool),
        venue: pick(rnd, VENUE_TEMPLATES)(planned.taluka),
        startDate: formatDate(start),
        endDate: formatDate(end),
      });
      batchSeq += 1;
    }
    batches.push(...talukaBatches);

    const talukaParticipants: RolloutParticipant[] = [];
    for (let i = 0; i < uploaded; i += 1) {
      talukaParticipants.push({
        id: `FSR${String(10000 + participantSeq).padStart(5, "0")}`,
        name: personName(rnd),
        designation: pick(rnd, DESIGNATIONS),
        department: pick(rnd, DEPARTMENTS),
        division: planned.division,
        district: planned.district,
        taluka: planned.taluka,
        phone: phoneNumber(rnd),
        batchId: null,
      });
      participantSeq += 1;
    }

    // Assign most participants to a batch; the rest stay visible but unassigned.
    const assignedCount = talukaBatches.length
      ? Math.round(talukaParticipants.length * (0.7 + rnd() * 0.3))
      : 0;
    talukaParticipants.forEach((p, i) => {
      if (i < assignedCount) {
        p.batchId = talukaBatches[i % talukaBatches.length].id;
      }
    });
    participants.push(...talukaParticipants);
  }

  return { participants, batches };
}

const GENERATED = buildRecords();

export const ROLLOUT_PARTICIPANTS: RolloutParticipant[] = GENERATED.participants;
export const ROLLOUT_BATCHES: RolloutBatch[] = GENERATED.batches;

export const ROLLOUT_BATCH_BY_ID: Map<string, RolloutBatch> = new Map(
  ROLLOUT_BATCHES.map((b) => [b.id, b]),
);

// ---------------------------------------------------------------------------
// Snapshot calculations (isolated so production rules can replace them)
// ---------------------------------------------------------------------------

export type TalukaGeo = { division: Division; district: string; taluka: string };

export type RolloutSnapshot = {
  activeTalukas: number;
  totalPlannedTalukas: number;
  participantsUploaded: number;
  batchesScheduled: number;
};

/** A taluka is Active when it has ≥1 uploaded participant or ≥1 Scheduled batch. */
export function talukaIsActive(
  geo: TalukaGeo,
  participants: RolloutParticipant[],
  batches: RolloutBatch[],
): boolean {
  const hasParticipant = participants.some(
    (p) =>
      p.division === geo.division &&
      p.district === geo.district &&
      p.taluka === geo.taluka,
  );
  if (hasParticipant) return true;
  return batches.some(
    (b) =>
      b.status === "Scheduled" &&
      b.division === geo.division &&
      b.district === geo.district &&
      b.taluka === geo.taluka,
  );
}

export function computeSnapshot(
  participants: RolloutParticipant[] = ROLLOUT_PARTICIPANTS,
  batches: RolloutBatch[] = ROLLOUT_BATCHES,
): RolloutSnapshot {
  return {
    activeTalukas: PLANNED_TALUKAS.filter((g) =>
      talukaIsActive(g, participants, batches),
    ).length,
    totalPlannedTalukas: PLANNED_TALUKAS.length,
    // Distinct Field Staff IDs, assigned or not.
    participantsUploaded: new Set(participants.map((p) => p.id)).size,
    // Distinct batch IDs with status Scheduled; Draft does not count.
    batchesScheduled: new Set(
      batches.filter((b) => b.status === "Scheduled").map((b) => b.id),
    ).size,
  };
}

// ---------------------------------------------------------------------------
// Summary aggregation (Division → District → Taluka)
// ---------------------------------------------------------------------------

function geoKey(g: { division: string; district: string; taluka: string }) {
  return `${g.division}|${g.district}|${g.taluka}`;
}

export type SummaryCounts = {
  participantsRequired: number;
  participantsUploaded: number;
  batchesRequired: number;
  batchesScheduled: number;
};

function countsForTalukas(
  list: PlannedTaluka[],
  participants: RolloutParticipant[],
  batches: RolloutBatch[],
): SummaryCounts {
  const keys = new Set(list.map(geoKey));
  let participantsRequired = 0;
  let batchesRequired = 0;
  for (const t of list) {
    participantsRequired += t.participantsRequired;
    batchesRequired += t.batchesRequired;
  }
  const uploadedIds = new Set<string>();
  for (const p of participants) {
    if (keys.has(geoKey(p))) uploadedIds.add(p.id);
  }
  const scheduledIds = new Set<string>();
  for (const b of batches) {
    if (b.status === "Scheduled" && keys.has(geoKey(b))) scheduledIds.add(b.id);
  }
  return {
    participantsRequired,
    participantsUploaded: uploadedIds.size,
    batchesRequired,
    batchesScheduled: scheduledIds.size,
  };
}

function countsToRow(c: SummaryCounts): (number)[] {
  return [
    c.participantsRequired,
    c.participantsUploaded,
    c.batchesRequired,
    c.batchesScheduled,
  ];
}

export function buildRolloutSummaryRows(
  participants: RolloutParticipant[] = ROLLOUT_PARTICIPANTS,
  batches: RolloutBatch[] = ROLLOUT_BATCHES,
): HierRow[] {
  return DIVISION_ROWS(participants, batches);
}

function DIVISION_ROWS(
  participants: RolloutParticipant[],
  batches: RolloutBatch[],
): HierRow[] {
  return DIVISIONS.map((division) => {
    const divTalukas = PLANNED_TALUKAS.filter((t) => t.division === division);
    const districts: HierRow[] = DISTRICTS.filter(
      (d) => d.division === division,
    ).map((dist) => {
      const dTalukas = divTalukas.filter((t) => t.district === dist.name);
      const talukas: HierRow[] = dTalukas.map((t) => ({
        key: `${t.division}/${t.district}/${t.taluka}`,
        label: t.taluka,
        values: countsToRow(
          countsForTalukas([t], participants, batches),
        ),
      }));
      return {
        key: `${division}/${dist.name}`,
        label: `${dist.name} (District)`,
        values: countsToRow(
          countsForTalukas(dTalukas, participants, batches),
        ),
        children: talukas,
      };
    });
    return {
      key: division,
      label: `${division} (Division)`,
      values: countsToRow(countsForTalukas(divTalukas, participants, batches)),
      children: districts,
    };
  });
}

// ---------------------------------------------------------------------------
// Department composition (100% stacked chart source)
// ---------------------------------------------------------------------------

export type ChartViewLevel = "division" | "district" | "taluka";

export type DepartmentSegment = { department: Department; count: number };

export type GeographyComposition = {
  key: string;
  label: string;
  subLabel?: string;
  segments: DepartmentSegment[];
  total: number;
};

export function departmentComposition(
  level: ChartViewLevel,
  filters: { division?: string; district?: string; taluka?: string } = {},
  participants: RolloutParticipant[] = ROLLOUT_PARTICANTS_ALIAS,
): GeographyComposition[] {
  const scoped = participants.filter((p) => {
    if (filters.division && filters.division !== "All" && p.division !== filters.division)
      return false;
    if (filters.district && filters.district !== "All" && p.district !== filters.district)
      return false;
    if (filters.taluka && filters.taluka !== "All" && p.taluka !== filters.taluka)
      return false;
    return true;
  });

  const levelKey = (g: { division: string; district: string; taluka: string }) =>
    level === "division"
      ? g.division
      : level === "district"
        ? `${g.division}|${g.district}`
        : geoKey(g);

  const meta = new Map<
    string,
    { label: string; subLabel?: string; order: number; planned: PlannedTaluka }
  >();
  PLANNED_TALUKAS.forEach((planned, index) => {
    if (filters.division && filters.division !== "All" && planned.division !== filters.division)
      return;
    if (filters.district && filters.district !== "All" && planned.district !== filters.district)
      return;
    if (filters.taluka && filters.taluka !== "All" && planned.taluka !== filters.taluka)
      return;
    const key = levelKey(planned);
    if (meta.has(key)) return;
    meta.set(key, {
      label:
        level === "division"
          ? planned.division
          : level === "district"
            ? planned.district
            : planned.taluka,
      subLabel:
        level === "division"
          ? undefined
          : level === "district"
            ? planned.division
            : planned.district,
      order: index,
      planned,
    });
  });

  const counts = new Map<string, Map<Department, number>>();
  for (const p of scoped) {
    const key = levelKey(p);
    if (!meta.has(key)) continue;
    let perDept = counts.get(key);
    if (!perDept) {
      perDept = new Map();
      counts.set(key, perDept);
    }
    perDept.set(p.department, (perDept.get(p.department) ?? 0) + 1);
  }

  const columns: GeographyComposition[] = [...meta.entries()]
    .sort((a, b) => a[1].order - b[1].order)
    .map(([key, m]) => {
      const perDept = counts.get(key) ?? new Map<Department, number>();
      const segments: DepartmentSegment[] = [];
      let total = 0;
      for (const department of DEPARTMENTS) {
        const count = perDept.get(department) ?? 0;
        if (count > 0) {
          segments.push({ department, count });
          total += count;
        }
      }
      return { key, label: m.label, subLabel: m.subLabel, segments, total };
    });

  return columns;
}
