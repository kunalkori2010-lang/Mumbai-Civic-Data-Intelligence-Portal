"""
BMC Water Connections — 10-Stage Python Data Science & ETL Pipeline
Extracts data/BMC_Water_Connections_Ward_Data.xlsx, profiles raw rows,
cleans & standardises ward records, unpivots into a 144-row star-schema
fact table, and validates all totals against published Praja / BMC figures.
"""

from pathlib import Path
import json
import sys
import pandas as pd
import numpy as np

BASE_DIR = Path(__file__).resolve().parent.parent
WORKBOOK_PATH = BASE_DIR / "data" / "BMC_Water_Connections_Ward_Data.xlsx"
EXPORT_DIR = BASE_DIR / "powerbi" / "exports"

EXPECTED_TOTALS = {
    "ward_count": 24,
    "metered_cm": 61947,
    "metered_dm": 460845,
    "metered_ind": 6331,
    "metered_total": 529123,
    "non_metered_cm": 18014,
    "non_metered_dm": 4198,
    "non_metered_ind": 124,
    "non_metered_total": 22336,
    "all_connections_total": 551459,
}


def run_pipeline() -> dict:
    if not WORKBOOK_PATH.exists():
        raise FileNotFoundError(f"Workbook not found at {WORKBOOK_PATH}")

    # Stage 1 & 2: Collection & Extraction
    raw_df = pd.read_excel(WORKBOOK_PATH, sheet_name="Ward_Connections")
    summary_df = pd.read_excel(WORKBOOK_PATH, sheet_name="Summary")
    dict_df = pd.read_excel(WORKBOOK_PATH, sheet_name="Data_Dictionary")

    # Identify and isolate Grand Total row
    raw_df["Ward_Clean"] = raw_df["Ward"].astype(str).str.strip().str.upper()
    is_total_row = raw_df["Ward_Clean"].str.contains("GRAND TOTAL") | (raw_df["Ward_Clean"] == "TOTAL")
    ward_df = raw_df[~is_total_row].copy()

    # Stage 3: Profiling
    profile = {
        "raw_row_count": int(len(raw_df)),
        "ward_row_count": int(len(ward_df)),
        "column_count": int(len(ward_df.columns)),
        "missing_values": int(ward_df.isna().sum().sum()),
        "duplicate_wards": int(ward_df["Ward_Clean"].duplicated().sum()),
        "summary_rows": int(len(summary_df)),
        "dictionary_fields": int(len(dict_df)),
    }

    # Stage 4 & 5: Cleaning & Transformation
    numeric_cols = [
        "Metered_CM", "Metered_DM", "Metered_IND",
        "NonMetered_CM", "NonMetered_DM", "NonMetered_IND",
    ]
    for col in numeric_cols:
        ward_df[col] = pd.to_numeric(ward_df[col], errors="coerce").fillna(0).astype(int)

    ward_df["Metered_Total_Calc"] = ward_df["Metered_CM"] + ward_df["Metered_DM"] + ward_df["Metered_IND"]
    ward_df["NonMetered_Total_Calc"] = ward_df["NonMetered_CM"] + ward_df["NonMetered_DM"] + ward_df["NonMetered_IND"]
    ward_df["All_Connections_Calc"] = ward_df["Metered_Total_Calc"] + ward_df["NonMetered_Total_Calc"]
    ward_df["NonMetered_Pct_Calc"] = np.round(
        (ward_df["NonMetered_Total_Calc"] / ward_df["All_Connections_Calc"]) * 100.0, 2
    )

    # Stage 6: Validation
    checks = {
        "ward_count": int(len(ward_df)) == EXPECTED_TOTALS["ward_count"],
        "metered_cm": int(ward_df["Metered_CM"].sum()) == EXPECTED_TOTALS["metered_cm"],
        "metered_dm": int(ward_df["Metered_DM"].sum()) == EXPECTED_TOTALS["metered_dm"],
        "metered_ind": int(ward_df["Metered_IND"].sum()) == EXPECTED_TOTALS["metered_ind"],
        "metered_total": int(ward_df["Metered_Total_Calc"].sum()) == EXPECTED_TOTALS["metered_total"],
        "non_metered_cm": int(ward_df["NonMetered_CM"].sum()) == EXPECTED_TOTALS["non_metered_cm"],
        "non_metered_dm": int(ward_df["NonMetered_DM"].sum()) == EXPECTED_TOTALS["non_metered_dm"],
        "non_metered_ind": int(ward_df["NonMetered_IND"].sum()) == EXPECTED_TOTALS["non_metered_ind"],
        "non_metered_total": int(ward_df["NonMetered_Total_Calc"].sum()) == EXPECTED_TOTALS["non_metered_total"],
        "all_connections_total": int(ward_df["All_Connections_Calc"].sum()) == EXPECTED_TOTALS["all_connections_total"],
    }

    # Stage 7 & 9: Unpivot into 144-row Fact Table for Power BI
    melted = ward_df.melt(
        id_vars=["Ward_Clean", "Reference_Date"],
        value_vars=numeric_cols,
        var_name="Attribute",
        value_name="ConnectionCount",
    )
    melted[["MeterStatusRaw", "CategoryCode"]] = melted["Attribute"].str.split("_", expand=True)
    melted["MeterStatus"] = np.where(melted["MeterStatusRaw"] == "Metered", "Metered", "Non-Metered")
    melted["ConnectionCategory"] = melted["CategoryCode"].map(
        {"CM": "Commercial", "DM": "Domestic", "IND": "Industrial"}
    )

    EXPORT_DIR.mkdir(parents=True, exist_ok=True)
    melted[["Ward_Clean", "ConnectionCategory", "MeterStatus", "ConnectionCount", "Reference_Date"]].to_csv(
        EXPORT_DIR / "FactWaterConnections_Python.csv", index=False
    )

    return {"profile": profile, "validation_checks": checks, "all_passed": all(checks.values()), "fact_rows": len(melted)}


if __name__ == "__main__":
    report = run_pipeline()
    print(json.dumps(report, indent=2))
    sys.exit(0 if report["all_passed"] else 1)
