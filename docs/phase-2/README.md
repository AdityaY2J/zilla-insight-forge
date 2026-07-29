# Phase 2: Deployment Rollout

Phase 2 preserves Phase 1 and adds a separate `Phase 2 — Deployment Rollout` navigation group.

## Dashboards

| Dashboard | Route | Current scope |
| --- | --- | --- |
| Field Staff Certification | `/fs-certification` | Snapshot, division status, Geography/Department certification summary, Field Staff directory |
| Field Staff Batch Performance | `/fs-batch-performance` | Snapshot, active batches, division summary, batch performance with coach grades |
| Field Staff Process Adherence | `/fs-process-adherence` | Date filter, adherence charts, geography summary, exercise summary, batch performance |
| Field Staff Learning & Cognitive | `/fs-learning-cognitive` | Learning/cognitive snapshot, Geography/Department summary, batch and Field Staff tables |
| Batch Composition | `/batch-composition` | Role mix snapshot, role distribution, batch role balance, division summary |

## Batch Composition roles

1. Gram Sevaks
2. Talathis
3. Krishi Sahayaks
4. ANMs / MPWs
5. MSEB Jan Mitras
6. Animal Husbandry Vets
7. Irrigation Canal Inspectors
8. Forest Guard
9. Statistical Officers

All role-coverage ratios use a denominator of 9.

## Current mock-data assumptions

- Field Staff, Field Staff batches, coach grades, batch departments, and role distributions are deterministic mock data in `src/data/deployment-rollout.ts`.
- Department certification targets are not defined and display as `–`.
- Field Staff batch process adherence retains the Phase 1 eight-module benchmark.
