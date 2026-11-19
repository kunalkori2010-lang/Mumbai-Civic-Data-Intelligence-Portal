# REST API Documentation

Full OpenAPI 3.0.3 JSON specification is served live at `GET /api/openapi.json`.

## Primary Endpoints
- `GET /api/dashboard?ward=&category=&meterStatus=&zone=&search=` — Filtered KPIs & chart series
- `GET /api/explorer?category=&zone=&search=&sortBy=&sortDir=&page=&pageSize=` — Paginated ward & category records
- `GET /api/wards` & `GET /api/wards/:code` — 24 ward breakdowns
- `GET /api/analytics/stats` — Mean, median, min, max, stdDev, Q1/Q3, IQR outlier flags
- `GET /api/etl/status` & `POST /api/etl/reprocess` — 10-stage ETL status & reprocessing
- `GET /api/quality` & `GET /api/quality/error-log.csv` — Quality metrics & validation log CSV
- `POST /api/import/preview` & `POST /api/import/commit` — Safe Excel/CSV upload preview & versioned commit
- `GET /api/surveys` & `POST /api/surveys` — Voluntary locality field observations
- `GET /api/businesses`, `POST /api/businesses`, `PATCH /api/businesses/:id`, `POST /api/businesses/:id/engage`, `POST /api/businesses/:id/enquiry`, `GET /api/business-impact`
- `GET /api/exports/cleaned.csv`, `GET /api/exports/workbook.xlsx`, `GET /api/exports/powerbi-csv/:filename`
