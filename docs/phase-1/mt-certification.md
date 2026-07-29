# MT Certification

**Route:** `/mt-certification`  
**Purpose:** Track training and certification progress for selected Master Trainers.

## Snapshot

- Target
- Trained
- Certified
- Target Completion = Certified ÷ Target
- Division Status lists Active, Completed, and Yet to Start divisions.

## Certification Summary

The section has no subtitle and defaults to **Geography** view.

### Geography view

Hierarchical drill-down: Division → District → Taluka.

### Department view

One flat row per department; no drill-down.

Columns in both views: Activation Status, Target, Trained, Certified, Certification Rate, Target Completion, Last Date.

Department targets and Department target completion are shown as `–`, because targets are defined only at geography level.

## MT Certification Status

Directory columns: MT ID, MT Name, Designation, Department, Division, District, Taluka, Phone No., Assessment 1, Assessment 2, Certification Grade, Certification Status.

Grade-to-status mapping:

| Grade | Certification Status |
| --- | --- |
| A | Recommended |
| B | Recommended |
| C | Not Recommended |
| D | Not Recommended-Pending |
| No grade | Pending |

## Business rules

- Certified counts the programme’s stored `Certified` outcome.
- Certification Rate = Certified ÷ Trained.
- Target Completion = Certified ÷ Target where a target exists.

## Open questions

- Confirm whether Department-level targets will be supplied later; if so, replace the `–` values.
