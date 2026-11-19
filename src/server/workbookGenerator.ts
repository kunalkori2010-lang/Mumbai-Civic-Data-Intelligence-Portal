import fs from 'fs';
import path from 'path';
import XLSX from 'xlsx';
import {
  BMC_WARDS_METADATA,
  DATA_DICTIONARY_ENTRIES,
  EXPECTED_VALIDATION_TOTALS,
  SEED_WARD_ROWS,
  SOURCE_METADATA,
} from './seedData.ts';
import type { FactWaterConnectionRow, WardConnectionRow } from '../shared/types.ts';

export const DATA_DIR = path.resolve(process.cwd(), 'data');
export const WORKBOOK_PATH = path.join(DATA_DIR, 'BMC_Water_Connections_Ward_Data.xlsx');
export const POWERBI_EXPORTS_DIR = path.resolve(process.cwd(), 'powerbi', 'exports');

export function ensureDirectories() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(POWERBI_EXPORTS_DIR)) {
    fs.mkdirSync(POWERBI_EXPORTS_DIR, { recursive: true });
  }
}

export function generateCanonicalWorkbookIfMissing(): string {
  ensureDirectories();
  if (fs.existsSync(WORKBOOK_PATH)) {
    return WORKBOOK_PATH;
  }

  const wb = XLSX.utils.book_new();

  // Sheet 1: Summary
  const summaryRows = [
    { Metric: 'Dataset Title', Value: SOURCE_METADATA.datasetTitle, Notes: SOURCE_METADATA.primaryReport },
    { Metric: 'Reference Date', Value: SOURCE_METADATA.referenceDate, Notes: 'Cross-sectional RTI snapshot' },
    { Metric: 'Number of BMC Wards', Value: EXPECTED_VALIDATION_TOTALS.wardCount, Notes: 'Wards A through T (Grand Total excluded)' },
    { Metric: 'Metered Connections', Value: EXPECTED_VALIDATION_TOTALS.meteredTotal, Notes: 'Commercial + Domestic + Industrial metered' },
    { Metric: 'Non-Metered Connections', Value: EXPECTED_VALIDATION_TOTALS.nonMeteredTotal, Notes: 'Commercial + Domestic + Industrial non-metered' },
    { Metric: 'Total Water Connections', Value: EXPECTED_VALIDATION_TOTALS.allConnectionsTotal, Notes: 'Metered + Non-Metered' },
    { Metric: 'Non-Metered Share (%)', Value: 4.05, Notes: '22,336 / 551,459 * 100' },
    { Metric: 'Commercial Connections (Total)', Value: EXPECTED_VALIDATION_TOTALS.commercialTotal, Notes: 'Metered: 61,947 | Non-Metered: 18,014' },
    { Metric: 'Domestic Connections (Total)', Value: EXPECTED_VALIDATION_TOTALS.domesticTotal, Notes: 'Metered: 460,845 | Non-Metered: 4,198' },
    { Metric: 'Industrial Connections (Total)', Value: EXPECTED_VALIDATION_TOTALS.industrialTotal, Notes: 'Metered: 6,331 | Non-Metered: 124' },
  ];
  const summarySheet = XLSX.utils.json_to_sheet(summaryRows);
  XLSX.utils.book_append_sheet(wb, summarySheet, 'Summary');

  // Sheet 2: Ward_Connections (24 wards + Grand Total row)
  const wardRows = SEED_WARD_ROWS.map((r) => {
    const meteredTotal = r.Metered_CM + r.Metered_DM + r.Metered_IND;
    const nonMeteredTotal = r.NonMetered_CM + r.NonMetered_DM + r.NonMetered_IND;
    const allTotal = meteredTotal + nonMeteredTotal;
    const nonMeteredPct = Number(((nonMeteredTotal / allTotal) * 100).toFixed(2));
    return {
      Ward: r.Ward,
      Metered_CM: r.Metered_CM,
      Metered_DM: r.Metered_DM,
      Metered_IND: r.Metered_IND,
      Metered_Total: meteredTotal,
      NonMetered_CM: r.NonMetered_CM,
      NonMetered_DM: r.NonMetered_DM,
      NonMetered_IND: r.NonMetered_IND,
      NonMetered_Total: nonMeteredTotal,
      All_Connections_Total: allTotal,
      'NonMetered_%_Calculated': nonMeteredPct,
      'NonMetered_%_Source': nonMeteredPct,
      Reference_Date: SOURCE_METADATA.referenceDate,
      Source_Basis: SOURCE_METADATA.sourceBasis,
      Source_URL: SOURCE_METADATA.sourcePdfUrl,
    };
  });

  wardRows.push({
    Ward: 'Grand Total',
    Metered_CM: EXPECTED_VALIDATION_TOTALS.meteredCm,
    Metered_DM: EXPECTED_VALIDATION_TOTALS.meteredDm,
    Metered_IND: EXPECTED_VALIDATION_TOTALS.meteredInd,
    Metered_Total: EXPECTED_VALIDATION_TOTALS.meteredTotal,
    NonMetered_CM: EXPECTED_VALIDATION_TOTALS.nonMeteredCm,
    NonMetered_DM: EXPECTED_VALIDATION_TOTALS.nonMeteredDm,
    NonMetered_IND: EXPECTED_VALIDATION_TOTALS.nonMeteredInd,
    NonMetered_Total: EXPECTED_VALIDATION_TOTALS.nonMeteredTotal,
    All_Connections_Total: EXPECTED_VALIDATION_TOTALS.allConnectionsTotal,
    'NonMetered_%_Calculated': 4.05,
    'NonMetered_%_Source': 4.05,
    Reference_Date: SOURCE_METADATA.referenceDate,
    Source_Basis: SOURCE_METADATA.sourceBasis,
    Source_URL: SOURCE_METADATA.sourcePdfUrl,
  });

  const wardSheet = XLSX.utils.json_to_sheet(wardRows);
  XLSX.utils.book_append_sheet(wb, wardSheet, 'Ward_Connections');

  // Sheet 3: Data_Dictionary
  const dictSheet = XLSX.utils.json_to_sheet(
    DATA_DICTIONARY_ENTRIES.map((d) => ({
      Field_Name: d.fieldName,
      Description: d.description,
      Data_Type: d.dataType,
      Status: d.status,
      Processing_Rule: d.processingRule,
      Dashboard_Usage: d.dashboardUsage,
    }))
  );
  XLSX.utils.book_append_sheet(wb, dictSheet, 'Data_Dictionary');

  // Sheet 4: Locality_Survey (Blank template headers only)
  const surveyHeaders = [[
    'Survey_Date',
    'Locality_or_Block',
    'Ward_Code',
    'Respondent_Type',
    'Water_Source',
    'Is_Metered',
    'Typical_Supply_Hours_Per_Day',
    'Supply_Regularity',
    'Reported_Interruptions_Per_Month',
    'Pressure_Adequacy',
    'Main_Water_Issue',
    'Observation_or_Notes',
  ]];
  const surveySheet = XLSX.utils.aoa_to_sheet(surveyHeaders);
  XLSX.utils.book_append_sheet(wb, surveySheet, 'Locality_Survey');

  XLSX.writeFile(wb, WORKBOOK_PATH);
  return WORKBOOK_PATH;
}

function escapeCsvValue(val: string | number): string {
  const str = String(val ?? '');
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function writeCsv(filePath: string, headers: string[], rows: (string | number)[][]) {
  const lines = [headers.map(escapeCsvValue).join(',')];
  for (const row of rows) {
    lines.push(row.map(escapeCsvValue).join(','));
  }
  fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
}

export function exportPowerBiStarSchemaCsvs(
  wards: WardConnectionRow[],
  facts: FactWaterConnectionRow[],
  referenceDate: string
) {
  ensureDirectories();

  const wardKeyMap = new Map<string, number>();
  BMC_WARDS_METADATA.forEach((w, idx) => wardKeyMap.set(w.wardCode, idx + 1));

  // DimWard.csv
  writeCsv(
    path.join(POWERBI_EXPORTS_DIR, 'DimWard.csv'),
    ['WardKey', 'WardCode', 'WardName', 'ZoneDivision', 'MajorLocalities'],
    wards.map((w, idx) => [
      wardKeyMap.get(w.wardCode) ?? idx + 1,
      w.wardCode,
      w.wardName,
      w.zoneDivision,
      w.majorLocalities,
    ])
  );

  // DimConnectionType.csv
  writeCsv(
    path.join(POWERBI_EXPORTS_DIR, 'DimConnectionType.csv'),
    ['ConnectionTypeKey', 'ConnectionTypeCode', 'ConnectionCategory', 'Description'],
    [
      [1, 'CM', 'Commercial', 'Commercial shops, offices, hospitality & establishments'],
      [2, 'DM', 'Domestic', 'Residential households and housing societies'],
      [3, 'IND', 'Industrial', 'Manufacturing, workshops and industrial units'],
    ]
  );

  // DimMeterStatus.csv
  writeCsv(
    path.join(POWERBI_EXPORTS_DIR, 'DimMeterStatus.csv'),
    ['MeterStatusKey', 'MeterStatus', 'IsMeteredFlag'],
    [
      [1, 'Metered', 1],
      [2, 'Non-Metered', 0],
    ]
  );

  // DimSource.csv
  writeCsv(
    path.join(POWERBI_EXPORTS_DIR, 'DimSource.csv'),
    ['SourceKey', 'SourceName', 'SourceBasis', 'SourceURL', 'ReferenceDate'],
    [
      [
        1,
        SOURCE_METADATA.sourceOrganisation,
        SOURCE_METADATA.sourceBasis,
        SOURCE_METADATA.sourcePdfUrl,
        referenceDate,
      ],
    ]
  );

  // FactWaterConnections.csv (144 tidy rows)
  const categoryKeyMap: Record<string, number> = { Commercial: 1, Domestic: 2, Industrial: 3 };
  const meterKeyMap: Record<string, number> = { Metered: 1, 'Non-Metered': 2 };

  writeCsv(
    path.join(POWERBI_EXPORTS_DIR, 'FactWaterConnections.csv'),
    ['WardKey', 'WardCode', 'ConnectionTypeKey', 'ConnectionCategory', 'MeterStatusKey', 'MeterStatus', 'ConnectionCount', 'ReferenceDate', 'SourceKey'],
    facts.map((f) => [
      wardKeyMap.get(f.wardCode) ?? 0,
      f.wardCode,
      categoryKeyMap[f.connectionCategory] ?? 0,
      f.connectionCategory,
      meterKeyMap[f.meterStatus] ?? 0,
      f.meterStatus,
      f.connectionCount,
      f.referenceDate,
      1,
    ])
  );

  // Also export wide cleaned table for direct inspection
  writeCsv(
    path.join(POWERBI_EXPORTS_DIR, 'Ward_Connections_Cleaned.csv'),
    [
      'Ward',
      'Zone_Division',
      'Metered_CM',
      'Metered_DM',
      'Metered_IND',
      'Metered_Total',
      'NonMetered_CM',
      'NonMetered_DM',
      'NonMetered_IND',
      'NonMetered_Total',
      'All_Connections_Total',
      'NonMetered_Pct_Calculated',
      'NonMetered_Pct_Source',
      'Reference_Date',
    ],
    wards.map((w) => [
      w.wardCode,
      w.zoneDivision,
      w.meteredCm,
      w.meteredDm,
      w.meteredInd,
      w.meteredTotal,
      w.nonMeteredCm,
      w.nonMeteredDm,
      w.nonMeteredInd,
      w.nonMeteredTotal,
      w.allConnectionsTotal,
      w.nonMeteredPctCalculated,
      w.nonMeteredPctSource,
      w.referenceDate,
    ])
  );
}
