# Phase 1: Capacity Building Dashboard Specifications

This folder documents the dashboard behaviour currently implemented in the application. It is the working reference for future design revisions and should be updated in the same change set as any material dashboard change.

| Dashboard | Route | Specification |
| --- | --- | --- |
| MT Selection | `/mt-selection` | [MT Selection](mt-selection.md) |
| MT Certification | `/mt-certification` | [MT Certification](mt-certification.md) |
| MT Batch Performance | `/mt-batch-performance` | [MT Batch Performance](mt-batch-performance.md) |
| MT Process Adherence | `/mt-process-adherence` | [MT Process Adherence](mt-process-adherence.md) |
| MT Learning & Cognitive | `/mt-learning-cognitive` | [MT Learning & Cognitive](mt-learning-cognitive.md) |
| MT Capacity Building Funnel | `/mt-capacity-funnel` | [MT Capacity Building Funnel](mt-capacity-building-funnel.md) |

## Shared rules

- The current app uses deterministic Maharashtra programme mock data from `src/data/capacity-building.ts` and `src/data/geography.ts`.
- Geography drill-down follows Division → District → Taluka unless a dashboard explicitly provides a Department view.
- Department views do not drill down.
- Division statuses use the current placeholder rule: **Completed** at at least 100% target completion; **Yet to Start** with no activity; otherwise **Active**.
- A dashboard change should update its matching specification page when it changes a KPI, table column, filter, business rule, or unresolved assumption.
