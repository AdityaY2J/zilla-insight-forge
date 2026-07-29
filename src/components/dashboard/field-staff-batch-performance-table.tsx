import { DataTable, type Column } from "@/components/dashboard/data-table";
import type { FieldStaffBatch } from "@/data/deployment-rollout";

export function FieldStaffBatchPerformanceTable({ rows }: { rows: FieldStaffBatch[] }) {
  const columns: Column<FieldStaffBatch>[] = [
    { key: "id", header: "Batch ID", accessor: (r) => r.id, exportValue: (r) => r.id },
    { key: "name", header: "Batch Name", accessor: (r) => <span className="font-medium">{r.name}</span>, exportValue: (r) => r.name },
    { key: "c1id", header: "Coach 1 ID", accessor: (r) => r.coach1Id, exportValue: (r) => r.coach1Id },
    { key: "c2id", header: "Coach 2 ID", accessor: (r) => r.coach2Id, exportValue: (r) => r.coach2Id },
    { key: "c1", header: "Coach 1 Name", accessor: (r) => r.coach1Name, exportValue: (r) => r.coach1Name },
    { key: "c2", header: "Coach 2 Name", accessor: (r) => r.coach2Name, exportValue: (r) => r.coach2Name },
    { key: "c1grade", header: "Coach 1 Grade", accessor: (r) => r.coach1Grade, exportValue: (r) => r.coach1Grade, align: "center" },
    { key: "c2grade", header: "Coach 2 Grade", accessor: (r) => r.coach2Grade, exportValue: (r) => r.coach2Grade, align: "center" },
    { key: "d1p", header: "Day 1 Part.", accessor: (r) => r.day1Participants, exportValue: (r) => r.day1Participants, align: "right" },
    { key: "d2p", header: "Day 2 Part.", accessor: (r) => r.day2Participants, exportValue: (r) => r.day2Participants, align: "right" },
    { key: "d1a", header: "Day 1 Avg.", accessor: (r) => `${r.day1AssessmentAvg}%`, exportValue: (r) => r.day1AssessmentAvg, align: "right" },
    { key: "d2a", header: "Day 2 Avg.", accessor: (r) => `${r.day2AssessmentAvg}%`, exportValue: (r) => r.day2AssessmentAvg, align: "right" },
    { key: "red", header: "Red %", accessor: (r) => `${r.redPct}%`, exportValue: (r) => r.redPct, align: "right" },
    { key: "orange", header: "Orange %", accessor: (r) => `${r.orangePct}%`, exportValue: (r) => r.orangePct, align: "right" },
    { key: "green", header: "Green %", accessor: (r) => `${r.greenPct}%`, exportValue: (r) => r.greenPct, align: "right" },
    { key: "adh", header: "Process Adherence", accessor: (r) => `${r.processAdherence}/8`, exportValue: (r) => `${r.processAdherence}/8`, align: "right" },
  ];
  return <DataTable data={rows} columns={columns} searchKeys={["id", "name", "coach1Name", "coach2Name", "district"]} pageSize={15} getRowId={(r) => r.id} />;
}
