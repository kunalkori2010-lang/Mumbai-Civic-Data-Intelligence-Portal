// ============================================================================
// MUMBAI CIVIC DATA INTELLIGENCE PORTAL — POWER QUERY M TRANSFORMATIONS
// Source Workbook: BMC_Water_Connections_Ward_Data.xlsx (Sheet: Ward_Connections)
// Output Star Schema: FactWaterConnections (144 rows = 24 wards x 3 categories x 2 statuses)
// ============================================================================

// 1. FactWaterConnections (Unpivoted Analytical Fact Table)
let
    Source = Excel.Workbook(File.Contents(".\data\BMC_Water_Connections_Ward_Data.xlsx"), null, true),
    WardSheet = Source{[Item="Ward_Connections", Kind="Sheet"]}[Data],
    PromotedHeaders = Table.PromoteHeaders(WardSheet, [PromoteAllScalars=true]),
    TrimmedWards = Table.TransformColumns(PromotedHeaders, {{"Ward", each Text.Upper(Text.Trim(Text.From(_))), type text}}),
    // Exclude Grand Total row strictly to prevent double counting
    FilteredWardsOnly = Table.SelectRows(TrimmedWards, each [Ward] <> null and [Ward] <> "" and not Text.Contains(Text.Lower([Ward]), "grand total") and Text.Lower([Ward]) <> "total"),
    SelectedCategoryCols = Table.SelectColumns(
        FilteredWardsOnly,
        {"Ward", "Metered_CM", "Metered_DM", "Metered_IND", "NonMetered_CM", "NonMetered_DM", "NonMetered_IND", "Reference_Date"}
    ),
    TypedNumeric = Table.TransformColumnTypes(
        SelectedCategoryCols,
        {
            {"Metered_CM", Int64.Type},
            {"Metered_DM", Int64.Type},
            {"Metered_IND", Int64.Type},
            {"NonMetered_CM", Int64.Type},
            {"NonMetered_DM", Int64.Type},
            {"NonMetered_IND", Int64.Type},
            {"Reference_Date", type text}
        }
    ),
    UnpivotedAttributes = Table.UnpivotOtherColumns(TypedNumeric, {"Ward", "Reference_Date"}, "Attribute", "ConnectionCount"),
    SplitMeterAndCategory = Table.SplitColumn(
        UnpivotedAttributes,
        "Attribute",
        Splitter.SplitTextByDelimiter("_", QuoteStyle.Csv),
        {"MeterStatusRaw", "CategoryCode"}
    ),
    StandardisedMeterStatus = Table.AddColumn(
        SplitMeterAndCategory,
        "MeterStatus",
        each if [MeterStatusRaw] = "Metered" then "Metered" else "Non-Metered",
        type text
    ),
    StandardisedCategory = Table.AddColumn(
        StandardisedMeterStatus,
        "ConnectionCategory",
        each if [CategoryCode] = "CM" then "Commercial"
             else if [CategoryCode] = "DM" then "Domestic"
             else "Industrial",
        type text
    ),
    AddedSourceKey = Table.AddColumn(StandardisedCategory, "SourceKey", each 1, Int64.Type),
    FinalFactTable = Table.SelectColumns(
        AddedSourceKey,
        {"Ward", "ConnectionCategory", "MeterStatus", "ConnectionCount", "Reference_Date", "SourceKey"}
    ),
    RenamedFinal = Table.RenameColumns(FinalFactTable, {{"Ward", "WardCode"}, {"Reference_Date", "ReferenceDate"}})
in
    RenamedFinal
