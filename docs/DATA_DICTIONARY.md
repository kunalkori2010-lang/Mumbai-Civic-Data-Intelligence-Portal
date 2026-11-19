# Data Dictionary — BMC Ward-Wise Water Connections

| Field Name | Data Type | Status | Processing Rule | Dashboard Usage |
|---|---|---|---|---|
| `Ward` | String | Original | Uppercase, trim, exclude Grand Total | Primary ward filter & DimWard key |
| `Metered_CM` | Integer | Original | Non-negative int; sum = 61,947 | Commercial metered breakdown |
| `Metered_DM` | Integer | Original | Non-negative int; sum = 460,845 | Domestic metered breakdown |
| `Metered_IND` | Integer | Original | Non-negative int; sum = 6,331 | Industrial metered breakdown |
| `Metered_Total` | Integer | Calculated | `Metered_CM + Metered_DM + Metered_IND` (529,123) | Green KPI Card |
| `NonMetered_CM` | Integer | Original | Non-negative int; sum = 18,014 | Commercial non-metered gap |
| `NonMetered_DM` | Integer | Original | Non-negative int; sum = 4,198 | Domestic non-metered gap |
| `NonMetered_IND` | Integer | Original | Non-negative int; sum = 124 | Industrial non-metered gap |
| `NonMetered_Total` | Integer | Calculated | `NonMetered_CM + NonMetered_DM + NonMetered_IND` (22,336) | Blue KPI Card |
| `All_Connections_Total` | Integer | Calculated | `Metered_Total + NonMetered_Total` (551,459) | Orange KPI Card |
| `NonMetered_%_Calculated` | Decimal | Calculated | `(NonMetered_Total / All_Connections_Total) * 100` | Share comparison & IQR checks |
| `NonMetered_%_Source` | Decimal | Original | Retained verbatim from RTI table | Audit variance comparison |
| `Reference_Date` | String | Metadata | Standardised to `March 2025` | Freshness & source footer |
| `Source_Basis` | String | Metadata | Praja May 2025 / BMC RTI citation | Provenance traceability |
| `Source_URL` | URL | Metadata | OpenCity PDF link | Original report button |
