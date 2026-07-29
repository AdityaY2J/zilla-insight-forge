# MT Selection

**Route:** `/mt-selection`  
**Purpose:** Track the Master Trainer pipeline from nomination through selection and provide a participant-level status directory.

## Snapshot

- Target
- Nominated
- Assessed
- Selected
- Target Completion = Selected ÷ Target
- Division Status lists Active, Completed, and Yet to Start divisions.

## Sections and tables

### Selection Summary

Hierarchical geography table: Division → District → Taluka.

Columns: Activation Status, Nominated, Assessed, Selected, Selection Rate, Target Completion, Last Date.

### MT Selection Status

Filters: Division, District, Selection Status.

Columns: MT ID, MT Name, Designation, Department, Division, District, Taluka, Selection Test Score, Selection Status.

## Business rules

- Assessed counts every participant whose Selection Status is not `Nominated`.
- Selected counts only `Selected` participants.
- Selection Rate = Selected ÷ Assessed.
- A nominated participant must display a blank MT ID. MT IDs are shown only after the participant progresses beyond nomination.

## Open questions

- Confirm whether rejected candidates should remain visible in the long-term stakeholder directory.
- Replace mock activation and target values when programme source data is available.
