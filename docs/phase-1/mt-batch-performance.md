# MT Batch Performance

**Route:** `/mt-batch-performance`  
**Purpose:** Monitor live and historical performance of Capacity Building batches.

## Snapshot

Left-hand metrics:

- Batches Conducted
- Average Process Score (out of 8)
- Average Pre Score (out of 10)
- Average Post Score (out of 10)

Learning snapshots are shown for Day 1, Day 2, and Overall. Each row presents Average Score and Score Distribution side by side, with the score and red/orange/green visual below their labels.

The right-hand panel lists active batches.

## Sections and tables

### Division Summary

Hierarchical geography table: Division → District → Taluka.

Columns: Batches Conducted, Day 1 Avg., Day 2 Avg., Red %, Orange %, Green %, Process Adherence.

### Batch Performance

Participant and coach-level batch directory supplied by the shared Batch Performance table component.

## Business rules

- Day and Overall scores are averages of the batches in scope.
- Overall score is the average of Day 1 and Day 2 batch scores.
- Average Process Score is the mean number of modules adhered to, out of eight.

## Open questions

- Confirm whether active-batch status should use a programme calendar rather than the current mock date rule.
