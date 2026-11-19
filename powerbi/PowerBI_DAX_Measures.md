# Power BI DAX Measures — BMC Water Connections Analytics

All measures are designed to operate cleanly over the **FactWaterConnections** (144 rows) star schema connected to **DimWard**, **DimConnectionType**, **DimMeterStatus**, and **DimSource**, using `DIVIDE()` for safe division and never double-counting the excluded Grand Total row.

---

## Display Folder: `01. Core Connection Counts`

```dax
Total Connections =
SUM( FactWaterConnections[ConnectionCount] )

Metered Connections =
CALCULATE(
    [Total Connections],
    DimMeterStatus[MeterStatus] = "Metered"
)

Non-Metered Connections =
CALCULATE(
    [Total Connections],
    DimMeterStatus[MeterStatus] = "Non-Metered"
)

Commercial Connections =
CALCULATE(
    [Total Connections],
    DimConnectionType[ConnectionCategory] = "Commercial"
)

Domestic Connections =
CALCULATE(
    [Total Connections],
    DimConnectionType[ConnectionCategory] = "Domestic"
)

Industrial Connections =
CALCULATE(
    [Total Connections],
    DimConnectionType[ConnectionCategory] = "Industrial"
)
```

---

## Display Folder: `02. Shares & Percentages`

```dax
Metered Percentage =
DIVIDE( [Metered Connections], [Total Connections], 0 )

Non-Metered Percentage =
DIVIDE( [Non-Metered Connections], [Total Connections], 0 )

Connection Category Share =
DIVIDE(
    [Total Connections],
    CALCULATE( [Total Connections], ALL( DimConnectionType[ConnectionCategory] ) ),
    0
)
```

---

## Display Folder: `03. Ward Coverage & Ranking`

```dax
Ward Count =
DISTINCTCOUNT( FactWaterConnections[WardCode] )

Average Connections per Ward =
DIVIDE( [Total Connections], [Ward Count], 0 )

Ward Ranking =
IF(
    HASONEVALUE( DimWard[WardCode] ),
    RANKX(
        ALLSELECTED( DimWard[WardCode] ),
        [Total Connections],
        ,
        DESC,
        DENSE
    ),
    BLANK()
)

Ward Non-Metered Share Rank =
IF(
    HASONEVALUE( DimWard[WardCode] ),
    RANKX(
        ALLSELECTED( DimWard[WardCode] ),
        [Non-Metered Percentage],
        ,
        DESC,
        DENSE
    ),
    BLANK()
)
```

---

## Display Folder: `04. Data Validation & Audit`

```dax
Data Validation Status =
VAR ActualTotal = CALCULATE( [Total Connections], ALL( FactWaterConnections ) )
VAR ActualMetered = CALCULATE( [Metered Connections], ALL( FactWaterConnections ) )
VAR ActualNonMetered = CALCULATE( [Non-Metered Connections], ALL( FactWaterConnections ) )
VAR ActualWards = CALCULATE( [Ward Count], ALL( FactWaterConnections ) )
RETURN
IF(
    ActualTotal = 551459 &&
    ActualMetered = 529123 &&
    ActualNonMetered = 22336 &&
    ActualWards = 24,
    "VALIDATED (551,459 Total | 24 Wards)",
    "RECONCILIATION MISMATCH"
)

Dynamic Report Title =
VAR SelectedWard = SELECTEDVALUE( DimWard[WardCode], "All 24 BMC Wards" )
VAR SelectedCat = SELECTEDVALUE( DimConnectionType[ConnectionCategory], "All Categories" )
RETURN
"BMC Water Connections — " & SelectedWard & " | " & SelectedCat & " (March 2025)"
```
