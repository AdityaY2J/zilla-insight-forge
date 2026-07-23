import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";

import { PageHeader } from "@/components/dashboard/page-header";
import { Section, SectionCard } from "@/components/dashboard/section";
import { KpiCard, KpiGrid } from "@/components/dashboard/kpi-card";
import { FilterSelect } from "@/components/dashboard/filter-bar";
import {
  HierarchicalBreakdownTable,
  type HierRow,
} from "@/components/dashboard/hierarchical-breakdown-table";
import {
  ColumnChart,
  StackedColumnChart100,
} from "@/components/dashboard/column-chart";
import { Input } from "@/components/ui/input";

import { BATCHES, MODULES, type Batch, type ModuleId } from "@/data/capacity-building";
import { DISTRICTS, DIVISIONS } from "@/data/geography";

export const Route = createFileRoute("/mt-process-adherence")({
  head: () => ({
    meta: [
      { title: "MT Process Adherence · Zilla Analytics" },
      {
        name: "description",
        content:
          "Process adherence analytics across MT capacity-building batches — module benchmarks and geography breakdown.",
      },
    ],
  }),
  component: MTProcessAdherenceDashboard,
});

type DateMode = "Overall" | "Single" | "Range";

function MTProcessAdherenceDashboard() {
  const [dateMode, setDateMode] = useState<DateMode>("Overall");
  const [singleDate, setSingleDate] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const filtered = useMemo(() => {
    if (dateMode === "Overall") return BATCHES;
    if (dateMode === "Single" && singleDate) {
      return BATCHES.filter((b) => b.date === singleDate);
    }
    if (dateMode === "Range" && fromDate && toDate) {
      return BATCHES.filter((b) => b.date >= fromDate && b.date <= toDate);
    }
    return BATCHES;
  }, [dateMode, singleDate, fromDate, toDate]);

  const overallScore = useMemo(() => {
    if (filtered.length === 0) return 0;
    return Math.round(
      (filtered.reduce((s, b) => s + b.processAdherence, 0) /
        (filtered.length * 8)) *
        100,
    );
  }, [filtered]);

  const mostDefective = useMemo(() => {
    if (filtered.length === 0) return null;
    let worst: { id: ModuleId; name: string; missed: number } | null = null;
    for (const m of MODULES) {
      const missed = filtered.filter((b) => !b.moduleMet[m.id]).length;
      if (!worst || missed > worst.missed) worst = { ...m, missed };
    }
    if (!worst) return null;
    return {
      ...worst,
      pct: Math.round((worst.missed / filtered.length) * 100),
    };
  }, [filtered]);

  const distribution = useMemo(() => {
    const total = filtered.length || 1;
    return Array.from({ length: 9 }).map((_, i) => {
      const count = filtered.filter((b) => b.processAdherence === i).length;
      return { label: `${i}/8`, value: Math.round((count / total) * 100) };
    });
  }, [filtered]);

  const moduleBench = useMemo(
    () =>
      MODULES.map((m) => {
        const met = filtered.filter((b) => b.moduleMet[m.id]).length;
        return {
          label: m.id,
          met,
          notMet: filtered.length - met,
        };
      }),
    [filtered],
  );

  return (
    <div className="pb-16">
      <PageHeader
        title="MT Process Adherence"
        description="Facilitation process-adherence analytics across MT capacity-building batches."
        filters={
          <>
            <FilterSelect
              label="Date"
              value={dateMode}
              onChange={(v) => setDateMode(v as DateMode)}
              options={[
                { label: "Overall", value: "Overall" },
                { label: "Single Date", value: "Single" },
                { label: "Date Range", value: "Range" },
              ]}
            />
            {dateMode === "Single" ? (
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Date
                </span>
                <Input
                  type="date"
                  value={singleDate}
                  onChange={(e) => setSingleDate(e.target.value)}
                  className="h-9 w-[170px]"
                />
              </div>
            ) : null}
            {dateMode === "Range" ? (
              <>
                <div className="flex flex-col gap-1.5">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    From
                  </span>
                  <Input
                    type="date"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    className="h-9 w-[170px]"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    To
                  </span>
                  <Input
                    type="date"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    className="h-9 w-[170px]"
                  />
                </div>
              </>
            ) : null}
          </>
        }
      />

      <div className="px-8 pt-8 space-y-10">
        <Section title="Snapshot">
          <KpiGrid cols={3}>
            <KpiCard
              title="Overall Process Adherence"
              value={`${overallScore}%`}
              context={`${filtered.length} batches in scope`}
              accent={
                overallScore >= 80
                  ? "success"
                  : overallScore >= 60
                    ? "warning"
                    : "critical"
              }
            />
            <KpiCard
              title="Most Defective Module"
              value={mostDefective ? mostDefective.name : "—"}
              context={
                mostDefective
                  ? `${mostDefective.id} · ${mostDefective.pct}% of batches affected`
                  : "No batches in scope"
              }
              accent="critical"
            />
            <KpiCard
              title="Batches Analyzed"
              value={filtered.length.toLocaleString("en-IN")}
              accent="info"
            />
          </KpiGrid>
        </Section>

        <Section
          title="Process Adherence Distribution"
          description="% of batches at each adherence bucket, from 0/8 through 8/8."
        >
          <SectionCard>
            <ColumnChart data={distribution} />
          </SectionCard>
        </Section>

        <Section
          title="Module-wise Benchmark Adherence"
          description="For each module (M1–M8), % of batches meeting vs. not meeting the benchmark."
        >
          <SectionCard>
            <StackedColumnChart100 data={moduleBench} />
          </SectionCard>
        </Section>

        <Section
          title="Geography Process Adherence Summary"
          description="Distribution by adherence milestones (2/8, 4/8, 6/8, 8/8) with overall score. Drills down to Taluka."
        >
          <GeographyAdherenceTable rows={filtered} />
        </Section>
      </div>
    </div>
  );
}

function adherenceRow(batches: Batch[]): (React.ReactNode | number | string)[] {
  const n = batches.length;
  const bucketPct = (level: number) => {
    if (n === 0) return "-";
    const count = batches.filter((b) => b.processAdherence === level).length;
    return `${count} (${Math.round((count / n) * 100)}%)`;
  };
  const overall =
    n === 0
      ? "-"
      : `${Math.round(
          (batches.reduce((s, b) => s + b.processAdherence, 0) / (n * 8)) * 100,
        )}%`;
  return [bucketPct(2), bucketPct(4), bucketPct(6), bucketPct(8), overall];
}

function GeographyAdherenceTable({ rows }: { rows: Batch[] }) {
  const hier = useMemo<HierRow[]>(
    () =>
      DIVISIONS.map((division) => {
        const divBatches = rows.filter((b) => b.division === division);
        const districts = DISTRICTS.filter((d) => d.division === division).map(
          (dist) => {
            const dBatches = divBatches.filter((b) => b.district === dist.name);
            const talukas: HierRow[] = dist.talukas.map((tk) => {
              const tBatches = dBatches.filter((b) => b.taluka === tk);
              return {
                key: `${division}/${dist.name}/${tk}`,
                label: tk,
                values: adherenceRow(tBatches),
              };
            });
            return {
              key: `${division}/${dist.name}`,
              label: `${dist.name} (District)`,
              values: adherenceRow(dBatches),
              children: talukas,
            };
          },
        );
        return {
          key: division,
          label: `${division} (Division)`,
          values: adherenceRow(divBatches),
          children: districts,
        };
      }),
    [rows],
  );

  return (
    <HierarchicalBreakdownTable
      rows={hier}
      firstColHeader="Geography"
      columns={[
        { header: "2/8 Adherence", align: "right" },
        { header: "4/8 Adherence", align: "right" },
        { header: "6/8 Adherence", align: "right" },
        { header: "8/8 Adherence", align: "right" },
        { header: "Overall Score", align: "right" },
      ]}
    />
  );
}
