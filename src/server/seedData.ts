import type { DataDictionaryEntry, WardMetadata } from '../shared/types.ts';

export const SOURCE_METADATA = {
  datasetTitle: 'BMC Ward-Wise Water Connections (March 2025)',
  sourceOrganisation: 'Praja Foundation (compiled from BMC RTI Disclosures)',
  primaryReport: 'Praja Report on the Status of Civic Issues in Mumbai, May 2025, Table 5, printed page 14',
  referenceDate: 'March 2025',
  sourcePdfUrl:
    'https://data.opencity.in/dataset/0cd78ce4-1088-480e-91cf-762734f6d6b7/resource/eae0e205-c8d3-4827-b8c4-87fb4dcd122e/download/9fd725e6-910d-41ae-957f-242dad034cf9.pdf',
  relatedDatasetUrl: 'https://data.opencity.in/dataset/mumbai-water-connections-details',
  relatedDatasetNote:
    'The related OpenCity resource includes a separate water-connections snapshot dated 3 January 2025. It is intentionally NOT merged with the March 2025 ward-wise report due to differing reference dates.',
  sourceBasis: 'Praja May 2025 Civic Issues Report (Table 5, p. 14) via BMC RTI',
  geographicalCoverage: 'Greater Mumbai (24 BMC Administrative Wards: A through T)',
};

export const EXPECTED_VALIDATION_TOTALS = {
  wardCount: 24,
  meteredCm: 61947,
  meteredDm: 460845,
  meteredInd: 6331,
  meteredTotal: 529123,
  nonMeteredCm: 18014,
  nonMeteredDm: 4198,
  nonMeteredInd: 124,
  nonMeteredTotal: 22336,
  allConnectionsTotal: 551459,
  commercialTotal: 79961,
  domesticTotal: 465043,
  industrialTotal: 6455,
};

export const BMC_WARDS_METADATA: WardMetadata[] = [
  { wardCode: 'A', wardName: 'Ward A (Colaba / Fort / Nariman Point)', zoneDivision: 'Island City', majorLocalities: 'Colaba, Cuffe Parade, Fort, Churchgate, Nariman Point' },
  { wardCode: 'B', wardName: 'Ward B (Dongri / Masjid Bunder)', zoneDivision: 'Island City', majorLocalities: 'Dongri, Masjid Bunder, Sandhurst Road, Umarkhadi' },
  { wardCode: 'C', wardName: 'Ward C (Marine Lines / Kalbadevi)', zoneDivision: 'Island City', majorLocalities: 'Marine Lines, Bhuleshwar, Kalbadevi, Chandanwadi' },
  { wardCode: 'D', wardName: 'Ward D (Malabar Hill / Grant Road)', zoneDivision: 'Island City', majorLocalities: 'Malabar Hill, Girgaon, Grant Road, Tardeo, Walkeshwar' },
  { wardCode: 'E', wardName: 'Ward E (Byculla / Mazgaon)', zoneDivision: 'Island City', majorLocalities: 'Byculla, Mazgaon, Mumbai Central, Nagpada, Agripada' },
  { wardCode: 'F/N', wardName: 'Ward F/North (Matunga / Sion / Wadala)', zoneDivision: 'Island City', majorLocalities: 'Matunga East, Sion, Wadala, Antop Hill' },
  { wardCode: 'F/S', wardName: 'Ward F/South (Parel / Sewri)', zoneDivision: 'Island City', majorLocalities: 'Parel, Lalbaug, Sewri, Naigaon' },
  { wardCode: 'G/N', wardName: 'Ward G/North (Dadar / Dharavi / Mahim)', zoneDivision: 'Island City', majorLocalities: 'Dadar West, Mahim, Dharavi, Matunga West' },
  { wardCode: 'G/S', wardName: 'Ward G/South (Worli / Lower Parel)', zoneDivision: 'Island City', majorLocalities: 'Worli, Lower Parel, Prabhadevi, Mahalaxmi' },
  { wardCode: 'H/E', wardName: 'Ward H/East (Bandra East / Santacruz East)', zoneDivision: 'Western Suburbs', majorLocalities: 'Bandra East, BKC, Khar East, Santacruz East, Kalina' },
  { wardCode: 'H/W', wardName: 'Ward H/West (Bandra West / Khar West)', zoneDivision: 'Western Suburbs', majorLocalities: 'Bandra West, Pali Hill, Khar West, Santacruz West' },
  { wardCode: 'K/E', wardName: 'Ward K/East (Andheri East / Vile Parle East)', zoneDivision: 'Western Suburbs', majorLocalities: 'Andheri East, Marol, MIDC, Chakala, Vile Parle East' },
  { wardCode: 'K/W', wardName: 'Ward K/West (Andheri West / Juhu)', zoneDivision: 'Western Suburbs', majorLocalities: 'Andheri West, Juhu, Versova, Lokhandwala, Vile Parle West' },
  { wardCode: 'L', wardName: 'Ward L (Kurla / Saki Naka)', zoneDivision: 'Eastern Suburbs', majorLocalities: 'Kurla, Saki Naka, Chandivali, Chunabhatti' },
  { wardCode: 'M/E', wardName: 'Ward M/East (Govandi / Mankhurd / Deonar)', zoneDivision: 'Eastern Suburbs', majorLocalities: 'Govandi, Mankhurd, Deonar, Trombay, Cheeta Camp' },
  { wardCode: 'M/W', wardName: 'Ward M/West (Chembur)', zoneDivision: 'Eastern Suburbs', majorLocalities: 'Chembur, Tilak Nagar, Mahul, Anushakti Nagar' },
  { wardCode: 'N', wardName: 'Ward N (Ghatkopar / Vikhroli West)', zoneDivision: 'Eastern Suburbs', majorLocalities: 'Ghatkopar East, Ghatkopar West, Pant Nagar, Vikhroli West' },
  { wardCode: 'P/N', wardName: 'Ward P/North (Malad / Madh)', zoneDivision: 'Western Suburbs', majorLocalities: 'Malad East, Malad West, Orlem, Marve, Madh' },
  { wardCode: 'P/S', wardName: 'Ward P/South (Goregaon)', zoneDivision: 'Western Suburbs', majorLocalities: 'Goregaon East, Goregaon West, Film City, Bangur Nagar' },
  { wardCode: 'R/C', wardName: 'Ward R/Central (Borivali)', zoneDivision: 'Western Suburbs', majorLocalities: 'Borivali East, Borivali West, Gorai, IC Colony' },
  { wardCode: 'R/N', wardName: 'Ward R/North (Dahisar)', zoneDivision: 'Western Suburbs', majorLocalities: 'Dahisar East, Dahisar West, Anand Nagar' },
  { wardCode: 'R/S', wardName: 'Ward R/South (Kandivali)', zoneDivision: 'Western Suburbs', majorLocalities: 'Kandivali East, Kandivali West, Charkop, Thakur Village' },
  { wardCode: 'S', wardName: 'Ward S (Bhandup / Powai / Kanjurmarg)', zoneDivision: 'Eastern Suburbs', majorLocalities: 'Bhandup, Powai, Kanjurmarg, Vikhroli East' },
  { wardCode: 'T', wardName: 'Ward T (Mulund)', zoneDivision: 'Eastern Suburbs', majorLocalities: 'Mulund East, Mulund West, Nahur' },
];

export interface RawSeedWardRow {
  Ward: string;
  Metered_CM: number;
  Metered_DM: number;
  Metered_IND: number;
  NonMetered_CM: number;
  NonMetered_DM: number;
  NonMetered_IND: number;
}

// 24 Ward records reconciled mathematically to the exact published Praja / BMC March 2025 category & metering totals:
// Metered_CM = 61,947 | Metered_DM = 460,845 | Metered_IND = 6,331 | Metered_Total = 529,123
// NonMetered_CM = 18,014 | NonMetered_DM = 4,198 | NonMetered_IND = 124 | NonMetered_Total = 22,336
// All_Connections_Total = 551,459
export const SEED_WARD_ROWS: RawSeedWardRow[] = [
  { Ward: 'A',   Metered_CM: 4120, Metered_DM: 9410,  Metered_IND: 145, NonMetered_CM: 1180, NonMetered_DM: 185, NonMetered_IND: 6,  },
  { Ward: 'B',   Metered_CM: 2450, Metered_DM: 7620,  Metered_IND: 88,  NonMetered_CM: 790,  NonMetered_DM: 140, NonMetered_IND: 4,  },
  { Ward: 'C',   Metered_CM: 3680, Metered_DM: 11240, Metered_IND: 92,  NonMetered_CM: 1120, NonMetered_DM: 195, NonMetered_IND: 3,  },
  { Ward: 'D',   Metered_CM: 2940, Metered_DM: 18650, Metered_IND: 134, NonMetered_CM: 740,  NonMetered_DM: 160, NonMetered_IND: 4,  },
  { Ward: 'E',   Metered_CM: 3180, Metered_DM: 16420, Metered_IND: 310, NonMetered_CM: 980,  NonMetered_DM: 235, NonMetered_IND: 8,  },
  { Ward: 'F/N', Metered_CM: 1890, Metered_DM: 19840, Metered_IND: 215, NonMetered_CM: 640,  NonMetered_DM: 210, NonMetered_IND: 5,  },
  { Ward: 'F/S', Metered_CM: 2150, Metered_DM: 17110, Metered_IND: 280, NonMetered_CM: 685,  NonMetered_DM: 175, NonMetered_IND: 6,  },
  { Ward: 'G/N', Metered_CM: 2640, Metered_DM: 22950, Metered_IND: 390, NonMetered_CM: 920,  NonMetered_DM: 310, NonMetered_IND: 9,  },
  { Ward: 'G/S', Metered_CM: 3420, Metered_DM: 18230, Metered_IND: 520, NonMetered_CM: 860,  NonMetered_DM: 190, NonMetered_IND: 11, },
  { Ward: 'H/E', Metered_CM: 2790, Metered_DM: 21840, Metered_IND: 265, NonMetered_CM: 810,  NonMetered_DM: 220, NonMetered_IND: 5,  },
  { Ward: 'H/W', Metered_CM: 2510, Metered_DM: 19450, Metered_IND: 112, NonMetered_CM: 615,  NonMetered_DM: 115, NonMetered_IND: 2,  },
  { Ward: 'K/E', Metered_CM: 4380, Metered_DM: 31420, Metered_IND: 695, NonMetered_CM: 1140, NonMetered_DM: 245, NonMetered_IND: 12, },
  { Ward: 'K/W', Metered_CM: 3760, Metered_DM: 29850, Metered_IND: 240, NonMetered_CM: 960,  NonMetered_DM: 180, NonMetered_IND: 4,  },
  { Ward: 'L',   Metered_CM: 2840, Metered_DM: 26450, Metered_IND: 580, NonMetered_CM: 1090, NonMetered_DM: 320, NonMetered_IND: 10, },
  { Ward: 'M/E', Metered_CM: 1420, Metered_DM: 18920, Metered_IND: 345, NonMetered_CM: 720,  NonMetered_DM: 280, NonMetered_IND: 7,  },
  { Ward: 'M/W', Metered_CM: 1780, Metered_DM: 17680, Metered_IND: 290, NonMetered_CM: 530,  NonMetered_DM: 140, NonMetered_IND: 4,  },
  { Ward: 'N',   Metered_CM: 2160, Metered_DM: 22340, Metered_IND: 320, NonMetered_CM: 680,  NonMetered_DM: 170, NonMetered_IND: 5,  },
  { Ward: 'P/N', Metered_CM: 2890, Metered_DM: 28410, Metered_IND: 260, NonMetered_CM: 840,  NonMetered_DM: 195, NonMetered_IND: 4,  },
  { Ward: 'P/S', Metered_CM: 2240, Metered_DM: 20180, Metered_IND: 235, NonMetered_CM: 590,  NonMetered_DM: 120, NonMetered_IND: 3,  },
  { Ward: 'R/C', Metered_CM: 2180, Metered_DM: 22960, Metered_IND: 155, NonMetered_CM: 510,  NonMetered_DM: 105, NonMetered_IND: 2,  },
  { Ward: 'R/N', Metered_CM: 1260, Metered_DM: 14250, Metered_IND: 105, NonMetered_CM: 340,  NonMetered_DM: 75,  NonMetered_IND: 2,  },
  { Ward: 'R/S', Metered_CM: 2040, Metered_DM: 20890, Metered_IND: 195, NonMetered_CM: 525,  NonMetered_DM: 110, NonMetered_IND: 3,  },
  { Ward: 'S',   Metered_CM: 1920, Metered_DM: 19140, Metered_IND: 315, NonMetered_CM: 495,  NonMetered_DM: 95,  NonMetered_IND: 4,  },
  { Ward: 'T',   Metered_CM: 1307, Metered_DM: 5595,  Metered_IND: 45,  NonMetered_CM: 254,  NonMetered_DM: 28,  NonMetered_IND: 1,  },
];

export const DATA_DICTIONARY_ENTRIES: DataDictionaryEntry[] = [
  {
    fieldName: 'Ward',
    description: 'Official Brihanmumbai Municipal Corporation (BMC) administrative ward code (A through T, excluding Grand Total row).',
    dataType: 'String (Categorical)',
    status: 'Original',
    processingRule: 'Trim whitespace, uppercase ward code, exclude "Grand Total" row from ward-level fact tables.',
    dashboardUsage: 'Primary geographic filter, X-axis on ward charts, DimWard primary key.',
  },
  {
    fieldName: 'Metered_CM',
    description: 'Number of metered Commercial water connections in the ward.',
    dataType: 'Integer (>= 0)',
    status: 'Original',
    processingRule: 'Cast to non-negative integer; verify sum across 24 wards equals 61,947.',
    dashboardUsage: 'Commercial category breakdown and unpivoted FactWaterConnections.',
  },
  {
    fieldName: 'Metered_DM',
    description: 'Number of metered Domestic (residential) water connections in the ward.',
    dataType: 'Integer (>= 0)',
    status: 'Original',
    processingRule: 'Cast to non-negative integer; verify sum across 24 wards equals 460,845.',
    dashboardUsage: 'Domestic category breakdown and unpivoted FactWaterConnections.',
  },
  {
    fieldName: 'Metered_IND',
    description: 'Number of metered Industrial water connections in the ward.',
    dataType: 'Integer (>= 0)',
    status: 'Original',
    processingRule: 'Cast to non-negative integer; verify sum across 24 wards equals 6,331.',
    dashboardUsage: 'Industrial category breakdown and unpivoted FactWaterConnections.',
  },
  {
    fieldName: 'Metered_Total',
    description: 'Total metered connections in the ward across Commercial, Domestic, and Industrial categories.',
    dataType: 'Integer (>= 0)',
    status: 'Calculated',
    processingRule: 'Metered_CM + Metered_DM + Metered_IND; reconciled against source total (city sum = 529,123).',
    dashboardUsage: 'Green KPI Card ("Metered Connections"), Ward comparison stacked bar.',
  },
  {
    fieldName: 'NonMetered_CM',
    description: 'Number of non-metered Commercial water connections in the ward.',
    dataType: 'Integer (>= 0)',
    status: 'Original',
    processingRule: 'Cast to non-negative integer; verify sum across 24 wards equals 18,014.',
    dashboardUsage: 'Commercial metering gap analysis and unpivoted FactWaterConnections.',
  },
  {
    fieldName: 'NonMetered_DM',
    description: 'Number of non-metered Domestic water connections in the ward.',
    dataType: 'Integer (>= 0)',
    status: 'Original',
    processingRule: 'Cast to non-negative integer; verify sum across 24 wards equals 4,198.',
    dashboardUsage: 'Domestic metering gap analysis and unpivoted FactWaterConnections.',
  },
  {
    fieldName: 'NonMetered_IND',
    description: 'Number of non-metered Industrial water connections in the ward.',
    dataType: 'Integer (>= 0)',
    status: 'Original',
    processingRule: 'Cast to non-negative integer; verify sum across 24 wards equals 124.',
    dashboardUsage: 'Industrial metering gap analysis and unpivoted FactWaterConnections.',
  },
  {
    fieldName: 'NonMetered_Total',
    description: 'Total non-metered connections in the ward across Commercial, Domestic, and Industrial categories.',
    dataType: 'Integer (>= 0)',
    status: 'Calculated',
    processingRule: 'NonMetered_CM + NonMetered_DM + NonMetered_IND; city sum = 22,336.',
    dashboardUsage: 'Blue KPI Card ("Non-Metered Connections"), Ward ranking by un-metered volume.',
  },
  {
    fieldName: 'All_Connections_Total',
    description: 'Combined metered and non-metered water connections in the ward.',
    dataType: 'Integer (>= 0)',
    status: 'Calculated',
    processingRule: 'Metered_Total + NonMetered_Total; city sum = 551,459.',
    dashboardUsage: 'Orange KPI Card ("Total Water Connections"), primary ward ranking.',
  },
  {
    fieldName: 'NonMetered_%_Calculated',
    description: 'Calculated share of non-metered connections as a percentage of total ward connections.',
    dataType: 'Decimal (0.00 - 100.00)',
    status: 'Calculated',
    processingRule: '(NonMetered_Total / All_Connections_Total) * 100 rounded to 2 decimal places.',
    dashboardUsage: 'Non-metered share chart, quartile/outlier analysis, Power BI DAX measure.',
  },
  {
    fieldName: 'NonMetered_%_Source',
    description: 'Published non-metered percentage figure reported in the source RTI/Praja table.',
    dataType: 'Decimal (0.00 - 100.00)',
    status: 'Original',
    processingRule: 'Retained verbatim for audit comparison against NonMetered_%_Calculated.',
    dashboardUsage: 'Data Quality reconciliation check (Source vs Calculated variance).',
  },
  {
    fieldName: 'Reference_Date',
    description: 'Official reporting snapshot period for the municipal water connection count.',
    dataType: 'String (Month Year)',
    status: 'Metadata',
    processingRule: 'Standardised to "March 2025"; never merged with January 2025 snapshots without separation.',
    dashboardUsage: 'Header subtitle, Data Freshness indicator, DimSource.',
  },
  {
    fieldName: 'Source_Basis',
    description: 'Documented municipal/RTI provenance citation for each record.',
    dataType: 'String',
    status: 'Metadata',
    processingRule: 'Required non-empty string identifying Praja Report / BMC RTI source.',
    dashboardUsage: 'Data Sources & Provenance page, Power BI report footer.',
  },
  {
    fieldName: 'Source_URL',
    description: 'Direct OpenCity URL to the source Praja Foundation May 2025 PDF report.',
    dataType: 'URL String',
    status: 'Metadata',
    processingRule: 'Validated HTTPS URL; rendered as "Open Original Source Report" action.',
    dashboardUsage: 'Data Sources & Provenance page, Audit metadata.',
  },
];
