/**
 * Audit Analytics mock data — isolated from every other dashboard dataset.
 * A trainer conducts ~8 batches in their lifetime.
 *   Audit 1 window: batches 1–4
 *   Audit 2 window: batches 4–8
 */

import { mulberry32, talukaList, type Division } from "./geography";

export type AuditStatusKind =
  | "none"
  | "toBeScheduled"
  | "scheduled"
  | "completed"
  | "delayed";

export type AuditStatus = {
  kind: AuditStatusKind;
  label: string;
  /** dd/mm/yyyy when scheduled */
  date?: string;
};

export type TalukaProgress = "Active" | "Completed" | "Yet to Start";

export type Activation = "Active" | "Inactive";

export type AuditRow = {
  taluka: string;
  district: string;
  division: Division;
  /** Internal/backend field — not shown in the frontend table. */
  activation: Activation;
  progress: TalukaProgress;
  batchesConducted: number;
  audit1: AuditStatus;
  audit2: AuditStatus;
  totalAudits: number;
};

function formatDate(d: Date) {
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${dd}/${mm}/${d.getFullYear()}`;
}

function resolveStatus({
  completed,
  scheduledDate,
  eligible,
  pastWindow,
}: {
  completed: boolean;
  scheduledDate?: string;
  eligible: boolean;
  pastWindow: boolean;
}): AuditStatus {
  if (completed) return { kind: "completed", label: "Completed" };
  if (scheduledDate)
    return {
      kind: "scheduled",
      label: `Scheduled (${scheduledDate})`,
      date: scheduledDate,
    };
  if (pastWindow) return { kind: "delayed", label: "Delayed" };
  if (eligible) return { kind: "toBeScheduled", label: "To Be Scheduled" };
  return { kind: "none", label: "-" };
}

function buildRows(): AuditRow[] {
  const rnd = mulberry32(90210);
  const base = new Date(2026, 6, 1); // reference date for scheduling

  return talukaList().map(({ taluka, district, division }) => {
    const roll = rnd();
    const progress: TalukaProgress =
      roll < 0.14 ? "Yet to Start" : roll < 0.78 ? "Active" : "Completed";

    let batchesConducted = 0;
    if (progress === "Active") {
      batchesConducted = 1 + Math.floor(rnd() * 7); // 1–7
    } else if (progress === "Completed") {
      batchesConducted = 8 + Math.floor(rnd() * 2); // 8–9
    }

    const a1Eligible = batchesConducted >= 1 && batchesConducted <= 4;
    const a1Past = batchesConducted > 4;
    const a2Eligible = batchesConducted >= 4 && batchesConducted <= 8;
    const a2Past = batchesConducted > 8;

    // Completion likelihood grows with programme progress.
    const a1Completed = batchesConducted >= 2 && rnd() < 0.7;
    const a2Completed = a1Completed && batchesConducted >= 6 && rnd() < 0.55;

    const scheduleDate = (offsetDays: number) => {
      const d = new Date(base);
      d.setDate(d.getDate() + offsetDays);
      return formatDate(d);
    };

    const a1Scheduled =
      !a1Completed && batchesConducted >= 1 && rnd() < 0.35
        ? scheduleDate(3 + Math.floor(rnd() * 40))
        : undefined;
    const a2Scheduled =
      !a2Completed && batchesConducted >= 3 && rnd() < 0.3
        ? scheduleDate(10 + Math.floor(rnd() * 60))
        : undefined;

    const audit1 = resolveStatus({
      completed: a1Completed,
      scheduledDate: a1Scheduled,
      eligible: a1Eligible,
      pastWindow: a1Past,
    });
    const audit2 = resolveStatus({
      completed: a2Completed,
      scheduledDate: a2Scheduled,
      eligible: a2Eligible,
      pastWindow: a2Past,
    });

    const totalAudits = (a1Completed ? 1 : 0) + (a2Completed ? 1 : 0);

    return {
      taluka,
      district,
      division,
      progress,
      batchesConducted,
      audit1,
      audit2,
      totalAudits,
    };
  });
}

export const AUDIT_ROWS: AuditRow[] = buildRows();

export type AuditSummary = {
  active: number;
  completed: number;
  yetToStart: number;
  activeAudit1Completed: number;
  activeAudit2Completed: number;
  eligible: number;
  auditedOnce: number;
  auditedTwice: number;
  totalAudits: number;
};

export function auditSummary(rows: AuditRow[] = AUDIT_ROWS): AuditSummary {
  const active = rows.filter((r) => r.progress === "Active");
  const completed = rows.filter((r) => r.progress === "Completed");
  const yetToStart = rows.filter((r) => r.progress === "Yet to Start");
  const eligibleRows = [...active, ...completed];

  const isDone = (s: AuditStatus) => s.kind === "completed";

  return {
    active: active.length,
    completed: completed.length,
    yetToStart: yetToStart.length,
    activeAudit1Completed: active.filter((r) => isDone(r.audit1)).length,
    activeAudit2Completed: active.filter((r) => isDone(r.audit2)).length,
    eligible: eligibleRows.length,
    auditedOnce: eligibleRows.filter(
      (r) => isDone(r.audit1) && !isDone(r.audit2),
    ).length,
    auditedTwice: eligibleRows.filter((r) => isDone(r.audit1) && isDone(r.audit2))
      .length,
    totalAudits: eligibleRows.reduce((sum, r) => sum + r.totalAudits, 0),
  };
}

export function pct(n: number, d: number) {
  if (!d) return "0%";
  return `${Math.round((n / d) * 100)}%`;
}
