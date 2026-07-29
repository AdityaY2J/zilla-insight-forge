# MT Capacity Building Funnel

**Route:** `/mt-capacity-funnel`  
**Purpose:** Show the end-to-end Master Trainer pipeline from nomination to certification.

## Snapshot Funnel

Stages:

1. Nominated
2. Assessed
3. Selected
4. Certified

Selected and Certified bars display achieved and required values inside the bar, for example `421 / 657`.

## Conversion logic

Nominated is the baseline at 100%.

| Stage | Conversion formula |
| --- | --- |
| Assessed | Assessed ÷ Nominated |
| Selected | Selected ÷ Nominated |
| Certified | Certified ÷ Nominated |

Every post-nomination label reads **Conversion from Nominated**. Conversion is not calculated from the immediately preceding stage.

## Geography-wise Capacity Building Summary

Hierarchical drill-down: Maharashtra (State) → Division → District → Taluka.

Columns: Nominated, Assessed, Selected / Target, Certified / Target.

## Open questions

- Confirm whether the funnel should also expose conversion targets, rather than only selected and certified required figures.
