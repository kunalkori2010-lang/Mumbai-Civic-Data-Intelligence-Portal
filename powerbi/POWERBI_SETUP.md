# Power BI Desktop Setup & Construction Guide (`BMC_Water_Connections_Analytics.pbix`)

> **Important Transparency Note**: Binary `.pbix` files are proprietary Power BI Desktop archives that cannot be compiled programmatically inside a Linux web runtime without Power BI Desktop on Windows. Instead of fabricating an invalid binary placeholder, this repository provides the **exact refreshable star-schema CSV exports**, **Power Query M script**, **DAX measures**, and **BMC JSON Theme** generated directly from the portal's validated database.

---

## 1. Refreshable Data Sources (`/powerbi/exports/`)

All CSVs in `/powerbi/exports/` are automatically regenerated from SQLite whenever the portal boots, reprocesses ETL, or commits a new dataset version:

- `FactWaterConnections.csv` (144 rows = 24 wards × 3 categories × 2 meter statuses)
- `DimWard.csv` (24 official BMC administrative wards A–T + Zone Division + Localities)
- `DimConnectionType.csv` (Commercial, Domestic, Industrial)
- `DimMeterStatus.csv` (Metered, Non-Metered)
- `DimSource.csv` (Praja Foundation May 2025 / BMC RTI March 2025 citation)

## 2. Step-by-Step Build Instructions in Power BI Desktop

1. **Apply Theme**: In Power BI Desktop, go to **View → Themes → Browse for themes** and select `powerbi/BMC_PowerBI_Theme.json`.
2. **Load Star Schema Tables**:
   - **Get Data → Text/CSV** (or Folder) and load all 5 star-schema CSVs from `powerbi/exports/`, **or** use **Blank Query → Advanced Editor** and paste `powerbi/PowerQuery_Transformations.m` to read directly from `data/BMC_Water_Connections_Ward_Data.xlsx`.
3. **Verify Model Relationships**:
   - `DimWard[WardCode]` (1) → `FactWaterConnections[WardCode]` (*)
   - `DimConnectionType[ConnectionCategory]` (1) → `FactWaterConnections[ConnectionCategory]` (*)
   - `DimMeterStatus[MeterStatus]` (1) → `FactWaterConnections[MeterStatus]` (*)
   - `DimSource[SourceKey]` (1) → `FactWaterConnections[SourceKey]` (*)
4. **Create DAX Measures**: Create a dedicated `_Measures` table and add all measures from `powerbi/PowerBI_DAX_Measures.md`.
5. **Build the 7 Report Pages**:
   - **Page 1 — Executive Overview**: 4 KPI Cards (`Total Connections`, `Metered Connections`, `Non-Metered Connections`, `Ward Count`), Donut chart (Metering Split), Stacked Bar (Category × Status), Source footer.
   - **Page 2 — Ward Comparison**: All 24 wards clustered/stacked bar, Top-N slicer, dynamic `[Ward Ranking]` matrix with conditional formatting.
   - **Page 3 — Category Analysis**: Commercial vs Domestic vs Industrial contribution & Decomposition Tree.
   - **Page 4 — Metering Analysis**: `[Non-Metered Percentage]` by ward, highest & lowest non-metered share comparison.
   - **Page 5 — Ward Drill-Through**: Add `DimWard[WardCode]` to Drill-through filters; display single-ward breakdown cards and composition pie.
   - **Page 6 — Data Quality & Sources**: `[Data Validation Status]` card, record count (`144` fact rows / `24` wards), reference date (`March 2025`), Praja RTI citation.
   - **Page 7 — Business Intelligence**: Connect only after consented local business engagement CSV/API data is exported from `/api/business-impact`.
6. **Save As**: `powerbi/BMC_Water_Connections_Analytics.pbix`.
