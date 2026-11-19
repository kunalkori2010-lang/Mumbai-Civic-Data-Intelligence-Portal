# 10-Stage ETL Methodology

1. **Data Collection**: Ingest `BMC_Water_Connections_Ward_Data.xlsx` (4 sheets: `Summary`, `Ward_Connections`, `Data_Dictionary`, `Locality_Survey`).
2. **Data Extraction**: Parse worksheets and isolate the `Grand Total` row so it is never treated as a 25th ward.
3. **Data Profiling**: Inspect row counts, column headers, missing cells, duplicate ward codes, and numeric validity before transformation.
4. **Data Cleaning**: Trim strings, uppercase ward identifiers, cast numeric fields to non-negative integers without deleting valid records.
5. **Data Transformation**: Compute ward totals and unpivot the 6 category/status columns across 24 wards into 144 normalised star-schema fact rows.
6. **Data Validation**: Reconcile totals against published Praja May 2025 RTI totals (`529,123` metered, `22,336` non-metered, `551,459` total, `24` wards).
7. **Data Standardisation**: Assign zone divisions (`Island City`, `Western Suburbs`, `Eastern Suburbs`) and preserve original vs calculated values.
8. **Central Database**: Store versioned datasets, raw snapshots, fact records, validations, and audit logs in SQLite (`data/civic_portal.db`).
9. **Power BI Dataset Export**: Generate refreshable CSV tables in `powerbi/exports/`.
10. **Dashboard & Business Connect Output**: Expose validated REST APIs to React and Power BI.
