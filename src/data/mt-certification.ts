import { SELECTED_MTS, type MTNomination } from "./mt-selection";
import { mulberry32 } from "./geography";

export type CertStatus =
  | "Not Started"
  | "In Training"
  | "Assessment Pending"
  | "Certified"
  | "Failed";

export type MTCertification = MTNomination & {
  certStatus: CertStatus;
  batchesTaught: number;
  finalScore: number | null;
};

function generate(): MTCertification[] {
  const rnd = mulberry32(20260721);
  return SELECTED_MTS.map((m) => {
    const roll = rnd();
    let certStatus: CertStatus;
    let finalScore: number | null = null;
    if (roll < 0.1) certStatus = "Not Started";
    else if (roll < 0.35) certStatus = "In Training";
    else if (roll < 0.5) certStatus = "Assessment Pending";
    else if (roll < 0.9) {
      certStatus = "Certified";
      finalScore = 70 + Math.floor(rnd() * 25);
    } else {
      certStatus = "Failed";
      finalScore = 40 + Math.floor(rnd() * 25);
    }
    return {
      ...m,
      certStatus,
      batchesTaught:
        certStatus === "Certified" ? Math.floor(rnd() * 6) : 0,
      finalScore,
    };
  });
}

export const MT_CERTIFICATIONS: MTCertification[] = generate();

export const CERTIFIED_MTS: MTCertification[] = MT_CERTIFICATIONS.filter(
  (m) => m.certStatus === "Certified",
);

export function certFunnel(rows: MTCertification[]) {
  const total = rows.length;
  const inTraining = rows.filter(
    (r) =>
      r.certStatus === "In Training" ||
      r.certStatus === "Assessment Pending" ||
      r.certStatus === "Certified" ||
      r.certStatus === "Failed",
  ).length;
  const assessed = rows.filter(
    (r) => r.certStatus === "Certified" || r.certStatus === "Failed",
  ).length;
  const certified = rows.filter((r) => r.certStatus === "Certified").length;
  return { total, inTraining, assessed, certified };
}
