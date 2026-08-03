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

function AuditReport() {
  const s = auditSummary();

  const columns: Column<AuditRow>[] = [
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
  ];

  return (
    <div className="pb-16">
      <PageHeader
        title="Audit Report"
        description="Track taluka-level audit eligibility, scheduling, completion, and delays."
      />
      <div className="px-8 pt-8 space-y-10">
        <Section title="Snapshot">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 [&_dt]:text-[13px]">
            <MetricPanel
              title="Program Snapshot"
              groups={[
                {
                  items: [
                    { label: "Talukas Active", value: s.active },
                    { label: "Talukas Completed", value: s.completed },
                    { label: "Talukas Yet to Start", value: s.yetToStart },
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
          </div>
        </Section>

        <Section title="Detailed View">
          <DataTable
            data={AUDIT_ROWS}
            columns={columns}
            headerCase="normal"
            searchKeys={["taluka", "district", "division"]}
            pageSize={15}
            getRowId={(r) => `${r.district}-${r.taluka}`}
          />
        </Section>
      </div>
    </div>
  );
}
