import { BATCHES } from "./batches";
import { STUDENTS } from "./students";
import { DISTRICTS } from "./geography";

/**
 * Aggregate performance metrics per district for Deployment Rollout only.
 * Used by the Performance Insights dashboard to surface underperformers.
 */

export type DistrictInsight = {
  key: string;
  division: string;
  district: string;
  batchesCompleted: number;
  studentsTrained: number;
  certificationRate: number;
  attendanceRate: number;
  dropoutRate: number;
};

function generate(): DistrictInsight[] {
  return DISTRICTS.map((d) => {
    const districtBatches = BATCHES.filter(
      (b) =>
        b.type === "Deployment Rollout" &&
        b.district === d.name &&
        b.status === "Completed",
    );
    const codes = new Set(districtBatches.map((b) => b.code));
    const districtStudents = STUDENTS.filter((s) => codes.has(s.batchCode));
    const trained = districtStudents.filter(
      (s) => s.status !== "Enrolled" && s.status !== "Dropped Out",
    ).length;
    const certified = districtStudents.filter(
      (s) => s.status === "Certified",
    ).length;
    const dropped = districtStudents.filter(
      (s) => s.status === "Dropped Out",
    ).length;
    const plannedP = districtBatches.reduce(
      (s, b) => s + b.plannedParticipants,
      0,
    );
    const attendedP = districtBatches.reduce(
      (s, b) => s + b.attendedParticipants,
      0,
    );
    return {
      key: d.name,
      division: d.division,
      district: d.name,
      batchesCompleted: districtBatches.length,
      studentsTrained: trained,
      certificationRate:
        trained > 0 ? Math.round((certified / trained) * 1000) / 10 : 0,
      attendanceRate:
        plannedP > 0 ? Math.round((attendedP / plannedP) * 1000) / 10 : 0,
      dropoutRate:
        districtStudents.length > 0
          ? Math.round((dropped / districtStudents.length) * 1000) / 10
          : 0,
    };
  });
}

export const DISTRICT_INSIGHTS: DistrictInsight[] = generate();
