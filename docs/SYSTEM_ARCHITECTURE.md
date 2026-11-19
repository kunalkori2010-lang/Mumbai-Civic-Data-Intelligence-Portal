# System Architecture & Documentation Index

## Pipeline Flow
`BMC / Praja RTI Sources` → `Excel Workbook (4 Sheets)` → `10-Stage ETL Engine (Node/TS & Python Pandas)` → `Central SQLite Database` → `Express REST API & Power BI Star-Schema CSVs` → `React Portal & Power BI Desktop`

## Component Responsibilities
- **Python (Pandas / OpenPyXL / NumPy) & Server ETL:** Reads raw workbook sheets, isolates Grand Total row, profiles missing/duplicate cells, normalises 24 wide ward rows into 144 star-schema fact rows, and runs 8 reconciliation checks.
- **SQLite Relational Database (`data/civic_portal.db`):** Stores `municipal_datasets`, `wards`, `water_connections_raw`, `water_connections_fact`, `data_validations`, `etl_stages`, `locality_surveys`, `businesses`, `business_engagements`, `business_enquiries`, and `audit_logs`.
- **Power Query M (`powerbi/PowerQuery_Transformations.m`):** Unpivots wide ward columns into `FactWaterConnections` and joins dimension tables.
- **DAX (`powerbi/PowerBI_DAX_Measures.md`):** Evaluates `DIVIDE()`-safe metering shares, dynamic `RANKX()` ward rankings, and `[Data Validation Status]`.
- **Express REST API (`server.ts`):** Exposes paginated, filtered, role-aware endpoints documented at `/api/openapi.json`.
- **React Frontend (`src/`):** Government-style civic portal with 15 dedicated analytical, engineering, provenance, and business modules.
