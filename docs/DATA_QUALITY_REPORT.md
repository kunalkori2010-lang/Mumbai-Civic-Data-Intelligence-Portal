# Data Quality Report & Transparency Formulas

## Quality Formulas
- **Completeness Rate** = `(Filled Required Fields / Total Required Fields) × 100`
- **Duplicate Rate** = `(Duplicate Ward Records / Total Ward Records) × 100`
- **Validation Pass Rate** = `(Passed Reconciliation Checks / Total Validation Checks) × 100`
- **Ward Coverage Rate** = `(Distinct Valid BMC Ward Codes / 24 Official Wards) × 100`

## Score Limitations
1. Completeness and reconciliation checks verify internal consistency with the published RTI snapshot (March 2025), not physical meter accuracy in the field.
2. Ward-level aggregates cannot be used to infer household water pressure, supply duration, or water quality.
3. Voluntary Locality Survey submissions are stored separately from official BMC records.
