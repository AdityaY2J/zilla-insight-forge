import { DISTRICTS, mulberry32 } from "./geography";
import type { Division } from "./geography";
import { BATCHES } from "./batches";

export type ReadinessStatus = "Ready" | "At Risk" | "Not Ready";

export type TalukaReadiness = {
  key: string;
  division: Division;
  district: string;
  taluka: string;
  trainersAvailable: number;
  trainersRequired: number;
  batchesPlanned: number;
  venuesConfirmed: number;
  venuesRequired: number;
  status: ReadinessStatus;
};

function generate(): TalukaReadiness[] {
  const rnd = mulberry32(20260723);
  const out: TalukaReadiness[] = [];
  for (const d of DISTRICTS) {
    for (const taluka of d.talukas) {
      const drPlanned = BATCHES.filter(
        (b) =>
          b.type === "Deployment Rollout" &&
          b.district === d.name &&
          b.taluka === taluka,
      ).length;
      const trainersRequired = Math.max(1, Math.ceil(drPlanned / 2));
      const trainersAvailable = Math.max(
        0,
        trainersRequired - Math.floor(rnd() * 3),
      );
      const venuesRequired = drPlanned || 1;
      const venuesConfirmed = Math.max(
        0,
        venuesRequired - Math.floor(rnd() * 2),
      );
      const trainerPct = trainersAvailable / trainersRequired;
      const venuePct = venuesConfirmed / venuesRequired;
      const worst = Math.min(trainerPct, venuePct);
      let status: ReadinessStatus;
      if (worst >= 1) status = "Ready";
      else if (worst >= 0.6) status = "At Risk";
      else status = "Not Ready";
      out.push({
        key: `${d.name}/${taluka}`,
        division: d.division,
        district: d.name,
        taluka,
        trainersAvailable,
        trainersRequired,
        batchesPlanned: drPlanned,
        venuesConfirmed,
        venuesRequired,
        status,
      });
    }
  }
  return out;
}

export const READINESS: TalukaReadiness[] = generate();

export function readinessSummary(rows: TalukaReadiness[]) {
  const total = rows.length;
  const ready = rows.filter((r) => r.status === "Ready").length;
  const atRisk = rows.filter((r) => r.status === "At Risk").length;
  const notReady = rows.filter((r) => r.status === "Not Ready").length;
  const readyPct = total > 0 ? Math.round((ready / total) * 1000) / 10 : 0;
  return { total, ready, atRisk, notReady, readyPct };
}
