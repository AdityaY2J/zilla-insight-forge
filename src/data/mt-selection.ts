import {
  DEPARTMENTS,
  DISTRICTS,
  mulberry32,
  personName,
  pick,
} from "./geography";
import type { Department, Division } from "./geography";

export type SelectionStage = "Nominated" | "Appeared for Assessment" | "Selected" | "Not Selected";

export type MTNomination = {
  id: string;
  name: string;
  department: Department;
  division: Division;
  district: string;
  taluka: string;
  designation: string;
  assessmentScore: number | null;
  status: SelectionStage;
};

const DESIGNATIONS = [
  "Tehsildar",
  "Naib Tehsildar",
  "Block Development Officer",
  "Circle Officer",
  "Agriculture Officer",
  "Taluka Health Officer",
  "Block Education Officer",
  "Child Development Project Officer",
];

function generateNominations(): MTNomination[] {
  const rnd = mulberry32(20260720);
  const out: MTNomination[] = [];
  let counter = 1;
  // Roughly 3–6 nominations per taluka
  for (const d of DISTRICTS) {
    for (const taluka of d.talukas) {
      const count = 3 + Math.floor(rnd() * 4);
      for (let i = 0; i < count; i++) {
        const roll = rnd();
        // Funnel: 100% nominated → ~85% appeared → ~55% selected
        let status: SelectionStage;
        let score: number | null = null;
        if (roll < 0.15) {
          status = "Nominated"; // did not appear
        } else if (roll < 0.45) {
          status = "Not Selected";
          score = 30 + Math.floor(rnd() * 30); // 30–59
        } else if (roll < 0.55) {
          status = "Appeared for Assessment"; // result pending
          score = 55 + Math.floor(rnd() * 15);
        } else {
          status = "Selected";
          score = 65 + Math.floor(rnd() * 30); // 65–94
        }
        out.push({
          id: `MT-${String(counter).padStart(5, "0")}`,
          name: personName(rnd),
          department: pick(rnd, DEPARTMENTS),
          division: d.division,
          district: d.name,
          taluka,
          designation: pick(rnd, DESIGNATIONS),
          assessmentScore: score,
          status,
        });
        counter++;
      }
    }
  }
  return out;
}

export const MT_NOMINATIONS: MTNomination[] = generateNominations();

/** Convenience: only trainers who cleared the assessment. */
export const SELECTED_MTS = MT_NOMINATIONS.filter((n) => n.status === "Selected");

export function selectionFunnel(rows: MTNomination[]) {
  const nominated = rows.length;
  const appeared = rows.filter(
    (r) =>
      r.status === "Appeared for Assessment" ||
      r.status === "Selected" ||
      r.status === "Not Selected",
  ).length;
  const selected = rows.filter((r) => r.status === "Selected").length;
  const notSelected = rows.filter((r) => r.status === "Not Selected").length;
  return { nominated, appeared, selected, notSelected };
}

export type BreakdownRow = {
  key: string;
  label: string;
  nominated: number;
  assessed: number;
  selected: number;
  selectionRate: number;
  children?: BreakdownRow[];
};

function aggregate(rows: MTNomination[], label: string, key: string): BreakdownRow {
  const nominated = rows.length;
  const assessed = rows.filter(
    (r) => r.status !== "Nominated",
  ).length;
  const selected = rows.filter((r) => r.status === "Selected").length;
  return {
    key,
    label,
    nominated,
    assessed,
    selected,
    selectionRate: nominated ? Math.round((selected / nominated) * 1000) / 10 : 0,
  };
}

export function geographyBreakdown(rows: MTNomination[]): BreakdownRow[] {
  const byDivision = new Map<string, MTNomination[]>();
  for (const r of rows) {
    const list = byDivision.get(r.division) ?? [];
    list.push(r);
    byDivision.set(r.division, list);
  }
  return Array.from(byDivision.entries()).map(([division, divRows]) => {
    const byDistrict = new Map<string, MTNomination[]>();
    for (const r of divRows) {
      const list = byDistrict.get(r.district) ?? [];
      list.push(r);
      byDistrict.set(r.district, list);
    }
    const districts: BreakdownRow[] = Array.from(byDistrict.entries()).map(
      ([district, distRows]) => {
        const byTaluka = new Map<string, MTNomination[]>();
        for (const r of distRows) {
          const list = byTaluka.get(r.taluka) ?? [];
          list.push(r);
          byTaluka.set(r.taluka, list);
        }
        const talukas: BreakdownRow[] = Array.from(byTaluka.entries()).map(
          ([taluka, tRows]) => aggregate(tRows, taluka, `${division}/${district}/${taluka}`),
        );
        return {
          ...aggregate(distRows, district, `${division}/${district}`),
          children: talukas,
        };
      },
    );
    return {
      ...aggregate(divRows, division, division),
      children: districts,
    };
  });
}

export function departmentBreakdown(rows: MTNomination[]): BreakdownRow[] {
  const byDept = new Map<Department, MTNomination[]>();
  for (const r of rows) {
    const list = byDept.get(r.department) ?? [];
    list.push(r);
    byDept.set(r.department, list);
  }
  return Array.from(byDept.entries()).map(([dept, dRows]) =>
    aggregate(dRows, dept, dept),
  );
}
