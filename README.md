# Mumbai Civic Data Intelligence Portal

**Subtitle:** BMC Data Management, Smart Locality Analytics & Business Connect  
**Disclaimer:** Academic Community Engagement Project | Independent Prototype (Semester 4 Data Science). Not an official BMC application.

## Quick Start

```bash
npm install
npm run dev       # Starts Express + Vite dev server on http://localhost:3000
npm run build     # Builds production React bundle into dist/
npm run start     # Serves production Express + API + React app on port 3000
```

### Python Data Science Pipeline (Optional Offline Verification)

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install pandas openpyxl numpy
python3 scripts/bmc_water_etl.py
```

## Core Modules

1. **BMC Data Intelligence**: Ward-wise Water Connections Dashboard (`551,459` total across `24` BMC wards), Categorised Data Explorer, Ward Analytics, 10-Stage ETL Management, Data Quality Monitoring, Data Sources & Provenance, Dataset Import Centre, and Locality Field Survey.
2. **Power BI & Advanced Analytics**: Star-schema CSV exports (`FactWaterConnections.csv` 144 rows, `DimWard.csv`, `DimConnectionType.csv`, `DimMeterStatus.csv`, `DimSource.csv`), Power Query M scripts (`powerbi/PowerQuery_Transformations.m`), DAX measures (`powerbi/PowerBI_DAX_Measures.md`), JSON theme (`powerbi/BMC_PowerBI_Theme.json`), and descriptive statistics + IQR outlier flags.
3. **Local Business Connect**: Consumer discovery directory, Retailer registration with consent, Admin approval workflow, Consumer enquiries, and ROI Calculator grounded in actual consented listings.

## Documentation Index

- `docs/DATA_SOURCES.md` — Primary Praja/OpenCity RTI source citation and date separation policy
- `docs/DATA_DICTIONARY.md` — Complete field definitions, types, and processing rules
- `docs/ETL_METHODOLOGY.md` — 10-stage extraction, profiling, cleaning, and validation specification
- `docs/DATA_QUALITY_REPORT.md` — Quality formulas, limitations, and reconciliation totals
- `docs/SYSTEM_ARCHITECTURE.md` — Relational database, REST API, Python ETL, and Power BI architecture
- `docs/BUSINESS_MODULE_GUIDE.md` — Consent-first Local Business Connect & ROI estimation formulas
- `docs/API_DOCUMENTATION.md` — REST endpoint reference & `/api/openapi.json`
- `powerbi/POWERBI_SETUP.md` — Step-by-step instructions to build/refresh `BMC_Water_Connections_Analytics.pbix`
