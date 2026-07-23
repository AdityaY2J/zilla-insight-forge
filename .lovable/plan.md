
## Understanding

The v3 spec redefines the app as **Phase 1 — Capacity Building** only, with 6 dashboards. The previous 8 dashboards (Deployment Rollout, Batch Quality, Student Certification, Trainer Performance, Performance Insights, MT Selection old, Batch Operations, Deployment Readiness) are all scrapped. Only two names carry over (MT Selection, MT Certification) but their layouts change materially (new "Split Panel: LHS KPI stack + RHS Division Status Panel" pattern).

## New Dashboards (Phase 1)

1. **MT Selection** — Split-panel snapshot (4 KPIs + Division Status Panel with Active/Completed/Yet to Start), Selection Summary drill-down table (Geography → Taluka), MT Selection Status directory.
2. **MT Certification** — Same split-panel pattern (Target/Trained/Certified/Completion%), Certification Summary geography table, MT Certification directory.
3. **MT Batch Performance** — Split-panel (Batches, Avg Score, Score Distribution R/O/G, Avg Process Score) + Active Batches list, Batch Summary operational table.
4. **MT Process Adherence** — Date master filter (Overall/Single/Range); single KPI panel (Overall Adherence, Most Defective Module); Process Adherence Distribution column chart (0/8–8/8 buckets); Module-wise 100% stacked benchmark chart; Geography Process Adherence drill-down.
5. **MT Learning & Cognitive** — Geography master filter; KPI grid (learning avg, R/O/G distribution, pre/post cognitive, shift %, belief shifts Disabling/Confused/Enabling); Geography summary drill-down; Batch-wise table; MT-wise table.
6. **MT Capacity Building Funnel** — KPI grid (Nominated/Assessed/Selected/Certified with Required targets); Geography drill-down (State→Division→District→Taluka).

## Sidebar / Nav

Single "Capacity Building" group with 6 items in the order above. Root `/` redirects to `/mt-selection`. Remove old routes (`/batch-quality`, `/deployment-readiness`, `/student-certification`, `/trainer-performance`, `/performance-insights`, `/batch-operations`) and old data files (`students.ts`, `deployment.ts`, `trainer-performance.ts`, `insights.ts`, old `batches.ts`).

## Components (reuse, mostly kept)

- Keep: `PageHeader`, `Section`/`SectionCard`, `KpiCard`/`KpiGrid`, `StatusPill`, `DataTable`, `FilterSelect`, `HierarchicalBreakdownTable`, `PlaceholderMetric`.
- New shared components:
  - `SplitSnapshotPanel` — LHS KPI stack + RHS content slot (used by D1, D2, D3).
  - `DivisionStatusPanel` — categorized list (Active italic / Completed / Yet to Start).
  - `AchievedTargetCell` — renders `X / Y` values used in tables/KPIs.
  - `StackedColumnChart` / `ColumnChart` (lightweight, CSS/SVG, no new deps) for D4.
- Drop: `FunnelChart` (no longer used).

## Mock Data (Maharashtra program)

Rebuild `src/data/` with:
- `geography.ts` — keep taxonomy (divisions/districts/talukas).
- `mt-selection.ts` — nomination/assessment/selection per taluka + MT records with selection test score + status.
- `mt-certification.ts` — trained/certified/target per geography + MT records with Asmt1/Asmt2/status.
- `mt-batches.ts` — batches with coaches, D1/D2 participants+avg, R/O/G distribution, process adherence fraction, active flag, date.
- `mt-process-adherence.ts` — per-batch 0/8–8/8 bucket + per-module M1..M8 met/not-met flags, module names.
- `mt-learning.ts` — per-batch and per-MT learning + cognitive (pre/post + belief shifts).
- Derive Dashboard 6 funnel from selection + certification datasets.

## Unresolved (flagged in spec — will use placeholder rules)

- Active/Completed/Yet to Start thresholds → use: Completed = Target Completion ≥ 100%, Yet to Start = 0 Nominated (D1) / 0 Trained (D2), else Active. Comment in code.
- D2 drill-down assumed same Division→District→Taluka.
- D2 "Taluka" duplicate column → render only once (drop duplicate).
- D4 total modules → assume 8 (M1..M8), matching the 8/8 adherence scale.
- D4 geography table → keep 4 milestone buckets (2/8, 4/8, 6/8, 8/8) as spec-listed.

## Not doing

- No landing page / program overview.
- No composite metric formulas beyond what's explicit.
- No new nav features (command palette etc.).

Implementation is a single sweep: delete old files, add new shared components + data, rewrite the 2 kept routes and add 4 new routes, update sidebar, run typecheck.
