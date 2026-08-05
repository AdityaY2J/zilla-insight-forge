import { DataTable, type Column } from "@/components/dashboard/data-table";
import type { Batch } from "@/data/capacity-building";
import { formatProgramAverage, programAverage } from "@/lib/program-average";

/**
 * Shared "Batch Performance" table — used by the MT Batch Performance
 * dashboard and replicated as-is on MT Process Adherence.
 */
export function BatchPerformanceTable({ rows }: { rows: Batch[] }) {
  const columns: Column<Batch>[] = [
    {
      key: "id",
      header: "Batch ID",
      accessor: (r) => <span className="text-xs tabular-nums">{r.id}</span>,
      sortValue: (r) => r.id,
      exportValue: (r) => r.id,
    },
    {
      key: "name",
      header: "Batch Name",
      accessor: (r) => <span className="font-medium">{r.name}</span>,
      sortValue: (r) => r.name,
      exportValue: (r) => r.name,
    },
    {
      key: "date",
      header: "Batch Date",
      accessor: (r) => r.date.split("-").reverse().join("/"),
      sortValue: (r) => r.date,
      exportValue: (r) => r.date.split("-").reverse().join("/"),
    },
    {
      key: "division",
      header: "Division",
      accessor: (r) => r.division,
      sortValue: (r) => r.division,
      exportValue: (r) => r.division,
    },
    {
      key: "c1id",
      header: "Coach 1 ID",
      accessor: (r) => <span className="text-xs tabular-nums">{r.coach1Id}</span>,
      exportValue: (r) => r.coach1Id,
    },
    {
      key: "c2id",
      header: "Coach 2 ID",
      accessor: (r) => <span className="text-xs tabular-nums">{r.coach2Id}</span>,
      exportValue: (r) => r.coach2Id,
    },
    {
      key: "c1",
      header: "Coach 1 Name",
      accessor: (r) => r.coach1Name,
      sortValue: (r) => r.coach1Name,
      exportValue: (r) => r.coach1Name,
    },
    {
      key: "c2",
      header: "Coach 2 Name",
      accessor: (r) => r.coach2Name,
      exportValue: (r) => r.coach2Name,
    },
    {
      key: "d1p",
      header: "Day 1 Part.",
      accessor: (r) => <span className="tabular-nums">{r.day1Participants}</span>,
      sortValue: (r) => r.day1Participants,
      exportValue: (r) => r.day1Participants,
      align: "right",
    },
    {
      key: "d2p",
      header: "Day 2 Part.",
      accessor: (r) => <span className="tabular-nums">{r.day2Participants}</span>,
      sortValue: (r) => r.day2Participants,
      exportValue: (r) => r.day2Participants,
      align: "right",
    },
    {
      key: "d1a",
      header: "Day 1 Avg.",
      accessor: (r) => <span className="tabular-nums">{r.day1AssessmentAvg}%</span>,
      sortValue: (r) => r.day1AssessmentAvg,
      exportValue: (r) => r.day1AssessmentAvg,
      align: "right",
    },
    {
      key: "d2a",
      header: "Day 2 Avg.",
      accessor: (r) => <span className="tabular-nums">{r.day2AssessmentAvg}%</span>,
      sortValue: (r) => r.day2AssessmentAvg,
      exportValue: (r) => r.day2AssessmentAvg,
      align: "right",
    },
    {
      key: "programAverage",
      header: "Program Average",
      accessor: (r) => <span className="tabular-nums">{formatProgramAverage(r.day1AssessmentAvg, r.day2AssessmentAvg)}</span>,
      sortValue: (r) => programAverage(r.day1AssessmentAvg, r.day2AssessmentAvg) ?? -1,
      exportValue: (r) => programAverage(r.day1AssessmentAvg, r.day2AssessmentAvg) ?? "",
      align: "right",
    },
    {
      key: "red",
      header: "Red %",
      accessor: (r) => <span className="tabular-nums text-critical">{r.redPct}%</span>,
      sortValue: (r) => r.redPct,
      exportValue: (r) => r.redPct,
      align: "right",
    },
    {
      key: "orange",
      header: "Orange %",
      accessor: (r) => (
        <span className="tabular-nums text-warning-foreground">{r.orangePct}%</span>
      ),
      sortValue: (r) => r.orangePct,
      exportValue: (r) => r.orangePct,
      align: "right",
    },
    {
      key: "green",
      header: "Green %",
      accessor: (r) => <span className="tabular-nums text-success">{r.greenPct}%</span>,
      sortValue: (r) => r.greenPct,
      exportValue: (r) => r.greenPct,
      align: "right",
    },
    {
      key: "adh",
      header: "Process Adherence",
      accessor: (r) => (
        <span className="tabular-nums font-medium">{r.processAdherence}/8</span>
      ),
      sortValue: (r) => r.processAdherence,
      exportValue: (r) => `${r.processAdherence}/8`,
      align: "right",
    },
  ];
  return (
    <DataTable
      data={rows}
      columns={columns}
      searchKeys={["id", "name", "coach1Name", "coach2Name", "district"]}
      pageSize={15}
      getRowId={(r) => r.id}
    />
  );
}
