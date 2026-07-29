# MT Learning & Cognitive

**Route:** `/mt-learning-cognitive`  
**Purpose:** Monitor learning results and cognitive / belief-shift outcomes for Capacity Building batches.

## Snapshot

### Learning

Day 1, Day 2, and Overall each present Average Score and Score Distribution side by side, with values and the red/orange/green visual below the metric labels.

### Cognitive

- Avg. Cognitive Pre Score, shown as `x.x / 10`
- Avg. Cognitive Post Score, shown as `x.x / 10`
- Cognitive Shift, displayed below the post score
- Disabling, Confused, and Enabling Belief Shift metrics

## Learning & Cognitive Summary

Defaults to **Geography** view. The Geography/Department switch stays left-aligned; Geography filters are right-aligned and disappear in Department view.

### Geography view

Filters: Division, District, Taluka.

Hierarchical drill-down: Division → District → Taluka.

### Department view

One flat row per department; no drill-down or geography filters.

Columns in both views: D1 Part., D2 Part., D1 Avg., D2 Avg., Red %, Orange %, Green %, Pre, Post, Disabling, Confused, Enabling.

## Additional tables

- Batch-wise Learning & Cognitive Summary
- Master Trainer-wise Learning & Cognitive Summary

## Business rules and assumptions

- Overall learning score is the average of Day 1 and Day 2 average scores.
- Cognitive Shift = (Post − Pre) ÷ 10.
- Department rows currently group a batch by Coach 1’s department because batches do not yet carry their own department field.

## Open questions

- Confirm whether batches should have a direct department assignment.
- Per-MT Pre, Post, and belief-shift values remain placeholders until source data is available.
