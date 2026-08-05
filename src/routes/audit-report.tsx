import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";

import { PageHeader } from "@/components/dashboard/page-header";
import { Section } from "@/components/dashboard/section";
import { DataTable, type Column } from "@/components/dashboard/data-table";
import { StatusPill, type StatusTone } from "@/components/dashboard/status-pill";
import { MetricPanel } from "@/components/dashboard/metric-panel";
import {
  AUDIT_ROWS,
  auditSummary,
  pct,
  type AuditRow,
  type AuditStatus,
} from "@/data/audit-analytics";

export const Route = createFileRoute("/audit-report")({
  head: () => ({
    meta: [
      { title: "Audit Report — Zilla Analytics" },
      {
        name: "description",
        content:
          "Taluka-level audit eligibility, scheduling, completion and delays across the Maharashtra Zilla programme.",
      },
      { property: "og:title", content: "Audit Report — Zilla Analytics" },
      {
        property: "og:description",
        content:
          "Track taluka-level audit eligibility, scheduling, completion and delays.",
      },
    ],
  }),
  component: AuditReport,
});

const STATUS_TONE: Record<AuditStatus["kind"], StatusTone> = {
  completed: "success",
  scheduled: "info",
  toBeScheduled: "warning",
  delayed: "critical",
  none: "neutral",
};

function AuditStatusCell({ status }: { status: AuditStatus }) {
  if (status.kind === "none") {
    return <span className="text-muted-foreground">-</span>;
  }
  return (
    <StatusPill tone={STATUS_TONE[status.kind]}>{status.label}</StatusPill>
  );
}

type AuditView = "all" | "active";

function AuditViewSwitch({
  value,
  onChange,
}: {
  value: AuditView;
  onChange: (value: AuditView) => void;
}) {
  return (
    <div
      className="inline-flex rounded-md border bg-muted/30 p-0.5"
      role="group"
      aria-label="Detailed view scope"
    >
      {([
        ["all", "All"],
        ["active", "Active Districts"],
      ] as const).map(([option, label]) => (
        <button
          key={option}
          type="button"
          onClick={() => onChange(option)}
          className={
            "rounded px-3 py-1.5 text-xs font-medium transition-colors " +
            (value === option
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground")
          }
          aria-pressed={value === option}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

function AuditReport() {
  const s = auditSummary();
  const [view, setView] = useState<AuditView>("all");

  const rows = useMemo(
    () =>
      view === "active"
        ? AUDIT_ROWS.filter((r) => r.districtActivationStatus === "Active")
        : AUDIT_ROWS,
    [view],
  );

  const columns: Column<AuditRow>[] = [
    {
      key: "division",
      header: "Division",
      accessor: (r) => r.division,
      sortValue: (r) => r.division,
      exportValue: (r) => r.division,
    },
    {
      key: "district",
      header: "District",
      accessor: (r) => r.district,
      sortValue: (r) => r.district,
      exportValue: (r) => r.district,
    },
    {
      key: "taluka",
      header: "Taluka",
      accessor: (r) => <span className="font-medium">{r.taluka}</span>,
      sortValue: (r) => r.taluka,
      exportValue: (r) => r.taluka,
    },
    {
      key: "batches",
      header: "Batches Conducted",
      align: "right",
      accessor: (r) => <span className="tabular-nums">{r.batchesConducted}</span>,
      sortValue: (r) => r.batchesConducted,
      exportValue: (r) => r.batchesConducted,
    },
    {
      key: "audit1",
      header: "Audit 1 Status",
      accessor: (r) => <AuditStatusCell status={r.audit1} />,
      sortValue: (r) => r.audit1.label,
      exportValue: (r) => r.audit1.label,
    },
    {
      key: "audit2",
      header: "Audit 2 Status",
      accessor: (r) => <AuditStatusCell status={r.audit2} />,
      sortValue: (r) => r.audit2.label,
      exportValue: (r) => r.audit2.label,
    },
    {
      key: "total",
      header: "Total Audits Conducted",
      align: "right",
      accessor: (r) => <span className="tabular-nums">{r.totalAudits}</span>,
      sortValue: (r) => r.totalAudits,
      exportValue: (r) => r.totalAudits,
    },
    {
      key: "districtActivationStatus",
      header: "District Activation Status",
      accessor: (r) => r.districtActivationStatus,
      sortValue: (r) => r.districtActivationStatus,
      exportValue: (r) => r.districtActivationStatus,
    },
  ];

  return (
    <div className="pb-16">
      <PageHeader
        title="Audit Report"
        description="Track taluka-level audit eligibility, scheduling, completion, and delays."
      />
      <div className="px-8 pt-8 space-y-10">
        <Section title="Snapshot">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 [&_dt]:text-sm [&_dd_span]:text-lg">
            <MetricPanel
              title="State Snapshot"
              groups={[
                {
                  items: [
                    {
                      label: "Talukas Eligible for Audit",
                      formula: "Active + Completed",
                      value: s.eligible,
                    },
                    {
                      label: "Talukas Audited Once",
                      value: `${s.auditedOnce} (${pct(s.auditedOnce, s.eligible)})`,
                    },
                    {
                      label: "Talukas Audited Twice",
                      value: `${s.auditedTwice} (${pct(s.auditedTwice, s.eligible)})`,
                    },
                    {
                      label: "Total Audits Conducted",
                      formula: "Audit 1 + Audit 2",
                      value: s.totalAudits,
                    },
                  ],
                },
              ]}
            />
            <MetricPanel
              title="Active Taluka Snapshot"
              groups={[
                {
                  items: [
                    { label: "Talukas Active", value: s.active },
                    {
                      label: "Audit 1 Completed In",
                      value: `${s.activeAudit1Completed} (${pct(s.activeAudit1Completed, s.active)})`,
                    },
                    {
                      label: "Audit 2 Completed In",
                      value: `${s.activeAudit2Completed} (${pct(s.activeAudit2Completed, s.active)})`,
                    },
                  ],
                },
              ]}
            />
          </div>
        </Section>

        <Section
          title="Detailed View"
          actions={<AuditViewSwitch value={view} onChange={setView} />}
        >
          <DataTable
            data={rows}
            columns={columns}
            headerCase="capitalize"
            searchKeys={["taluka", "district", "division"]}
            pageSize={15}
            getRowId={(r) => `${r.district}-${r.taluka}`}
          />
        </Section>
      </div>
    </div>
  );
}
