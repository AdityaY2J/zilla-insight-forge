import { createFileRoute } from "@tanstack/react-router";

import { PageHeader } from "@/components/dashboard/page-header";
import { Section } from "@/components/dashboard/section";
import { DataTable, type Column } from "@/components/dashboard/data-table";
import { StatusPill } from "@/components/dashboard/status-pill";
import { TRAINER_RISK_ROWS, type TrainerRiskRow } from "@/data/watchlist";

export const Route = createFileRoute("/repeat-default-watchlist")({
  head: () => ({
    meta: [
      { title: "Repeat Default Watchlist — Zilla Analytics" },
      {
        name: "description",
        content:
          "Trainer risk status across the last three batches: watch, repeat, and persistent defaulters with their dominant operational issues.",
      },
      { property: "og:title", content: "Repeat Default Watchlist — Zilla Analytics" },
      {
        property: "og:description",
        content: "Trainer risk status based on the last 3 batches.",
      },
    ],
  }),
  component: RepeatDefaultWatchlist,
});

const riskTone = (status: TrainerRiskRow["riskStatus"]) =>
  status === "Persistent" ? "critical" : status === "Repeat" ? "critical" : "warning";

function RepeatDefaultWatchlist() {
  const columns: Column<TrainerRiskRow>[] = [
    { key: "id", header: "Trainer Id", accessor: (r) => <span className="text-xs tabular-nums">{r.id}</span>, sortValue: (r) => r.id, exportValue: (r) => r.id },
    { key: "name", header: "Trainer Name", accessor: (r) => <span className="font-medium">{r.name}</span>, sortValue: (r) => r.name, exportValue: (r) => r.name },
    { key: "phone", header: "Trainer Phone", accessor: (r) => <span className="tabular-nums">{r.phone}</span>, exportValue: (r) => r.phone },
    {
      key: "last3",
      header: "Last 3 Batches",
      accessor: (r) => (
        <span className="text-xs">
          {r.lastThree.map((s, i) => (
            <span key={i}>
              <span className={s === "Risk" ? "text-critical font-medium" : "text-success"}>{s}</span>
              {i < r.lastThree.length - 1 ? <span className="text-muted-foreground">, </span> : null}
            </span>
          ))}
        </span>
      ),
      exportValue: (r) => r.lastThree.join(", "),
    },
    {
      key: "risk",
      header: "Risk Status",
      accessor: (r) => <StatusPill tone={riskTone(r.riskStatus)}>{r.riskStatus}</StatusPill>,
      sortValue: (r) => r.riskCount,
      exportValue: (r) => r.riskStatus,
    },
    {
      key: "issues",
      header: "Dominant Issues",
      accessor: (r) => (
        <span className="text-xs text-muted-foreground">{r.dominantIssues.join(", ") || "–"}</span>
      ),
      exportValue: (r) => r.dominantIssues.join(", "),
    },
  ];

  return (
    <div className="pb-16">
      <PageHeader
        title="Repeat Default Watchlist"
        description="Trainer risk status based on the last 3 batches"
      />
      <div className="px-8 pt-8 space-y-10">
        <Section title="Trainer Risk Status">
          <DataTable
            data={TRAINER_RISK_ROWS}
            columns={columns}
            headerCase="normal"
            searchKeys={["id", "name", "phone"]}
            pageSize={15}
            getRowId={(r) => r.id}
          />
        </Section>
      </div>
    </div>
  );
}
