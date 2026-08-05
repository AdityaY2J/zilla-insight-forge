import { useMemo, useState } from "react";
import { FilterSelect } from "@/components/dashboard/filter-bar";
import { Section, SectionCard } from "@/components/dashboard/section";
import { ViewSwitch, type SummaryView } from "@/components/dashboard/view-switch";
import { DEPARTMENTS, DISTRICTS, DIVISIONS } from "@/data/geography";

export type LearningCognitiveAnalyticsRow = {
  division: string;
  district: string;
  taluka: string;
  department: string;
  learningScore: number;
  cognitivePostScore: number;
};

const SELECT_PROMPT = "__select__";

const average = (values: number[]) => values.length
  ? Math.round(values.reduce((sum, value) => sum + value, 0) * 10 / values.length) / 10
  : 0;

function BenchmarkColumnChart({
  title,
  data,
  benchmark,
  benchmarkLabel,
  suffix,
  color,
}: {
  title: string;
  data: { label: string; value: number }[];
  benchmark: number;
  benchmarkLabel: string;
  suffix: string;
  color: string;
}) {
  const max = Math.max(10, benchmark, ...data.map((item) => item.value));
  const yMax = Math.ceil(max / 10) * 10;
  const chartMinWidth = Math.max(620, data.length * 72 + 32);
  return (
    <SectionCard>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-sm font-semibold">{title}</h3>
        <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground"><span className="w-6 border-t-2 border-dashed border-foreground/60" />{benchmarkLabel}: {benchmark}{suffix}</span>
      </div>
      <div className="mt-5 overflow-x-auto">
        <div style={{ minWidth: chartMinWidth }}>
          <div className="relative h-56 border-l border-b">
            <div className="pointer-events-none absolute inset-0 flex flex-col justify-between"><span className="border-t border-dashed border-border/60" /><span className="border-t border-dashed border-border/60" /><span className="border-t border-dashed border-border/60" /><span className="border-t border-dashed border-border/60" /><span className="border-t border-dashed border-border/60" /></div>
            <div className="pointer-events-none absolute inset-x-0 border-t-2 border-dashed border-foreground/60" style={{ bottom: `${(benchmark / yMax) * 100}%` }} />
            <div className="relative flex h-full items-end gap-3 px-4 pt-6">{data.map((item) => <div key={item.label} className="flex h-full min-w-[58px] flex-1 flex-col items-center justify-end"><span className="mb-1 text-xs font-medium tabular-nums">{item.value}{suffix}</span><div className="w-full max-w-10 rounded-t-sm" style={{ height: `${(item.value / yMax) * 100}%`, backgroundColor: color }} /></div>)}</div>
          </div>
          <div className="flex gap-3 px-4 pt-2">{data.map((item) => <span key={item.label} className="min-w-[58px] flex-1 text-center text-[10px] text-muted-foreground">{item.label}</span>)}</div>
        </div>
      </div>
    </SectionCard>
  );
}

export function LearningCognitiveAnalytics({ rows }: { rows: LearningCognitiveAnalyticsRow[] }) {
  const [view, setView] = useState<SummaryView>("geography");
  const [division, setDivision] = useState("All");
  const [district, setDistrict] = useState(SELECT_PROMPT);
  const [taluka, setTaluka] = useState(SELECT_PROMPT);
  const districts = useMemo(() => DISTRICTS.filter((item) => division === "All" || item.division === division), [division]);
  const talukas = useMemo(() => districts.flatMap((item) => (district === "All" || district === SELECT_PROMPT || item.name === district) ? item.talukas : []), [districts, district]);
  const scopedRows = useMemo(() => rows.filter((row) => (division === "All" || row.division === division) && (district === "All" || district === SELECT_PROMPT || row.district === district) && (taluka === "All" || taluka === SELECT_PROMPT || row.taluka === taluka)), [rows, division, district, taluka]);
  const chartData = useMemo(() => {
    const geographyLevel = taluka === "All" || taluka !== SELECT_PROMPT
      ? "taluka"
      : district === "All" || division !== "All"
        ? "district"
        : district !== SELECT_PROMPT
          ? "taluka"
          : "division";
    const labels = view === "department"
      ? DEPARTMENTS
      : geographyLevel === "division"
        ? DIVISIONS
        : geographyLevel === "district"
          ? districts.map((item) => item.name)
          : taluka !== SELECT_PROMPT && taluka !== "All"
            ? [taluka]
            : talukas;
    return labels.map((label) => {
      const group = scopedRows.filter((row) => view === "department" ? row.department === label : row[geographyLevel] === label);
      return { label, learningScore: average(group.map((row) => row.learningScore)), cognitivePostScore: average(group.map((row) => row.cognitivePostScore)) };
    });
  }, [scopedRows, view, division, district, taluka, talukas, districts]);
  const actions = <div className="flex w-full flex-wrap items-end justify-between gap-3"><ViewSwitch value={view} onChange={setView} />{view === "geography" ? <div className="flex flex-wrap items-end gap-3"><FilterSelect label="Division" value={division} onChange={(value) => { setDivision(value); setDistrict(SELECT_PROMPT); setTaluka(SELECT_PROMPT); }} options={[{ label: "All Divisions", value: "All" }, ...DIVISIONS.map((item) => ({ label: item, value: item }))]} /><FilterSelect label="District" value={district} onChange={(value) => { setDistrict(value); setTaluka(SELECT_PROMPT); }} width={220} options={[{ label: "Select District", value: SELECT_PROMPT }, { label: "All Districts", value: "All" }, ...districts.map((item) => ({ label: division === "All" ? `${item.division} — ${item.name}` : item.name, value: item.name }))]} /><FilterSelect label="Taluka" value={taluka} onChange={setTaluka} width={200} options={[{ label: "Select Taluka", value: SELECT_PROMPT }, { label: "All Talukas", value: "All" }, ...talukas.map((item) => ({ label: item, value: item }))]} /></div> : null}</div>;
  return <Section title="Learning & Cognitive Analytics" actionsClassName="w-full" actions={actions}><div className="grid gap-4 xl:grid-cols-2"><BenchmarkColumnChart title="Learning Analytics" data={chartData.map((item) => ({ label: item.label, value: item.learningScore }))} benchmark={average(scopedRows.map((row) => row.learningScore))} benchmarkLabel="Program Learning Average" suffix="%" color="var(--primary)" /><BenchmarkColumnChart title="Cognitive Analytics" data={chartData.map((item) => ({ label: item.label, value: item.cognitivePostScore }))} benchmark={average(scopedRows.map((row) => row.cognitivePostScore))} benchmarkLabel="Avg. Program Post Score" suffix=" / 10" color="var(--success)" /></div></Section>;
}
