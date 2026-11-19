export type UserRole = 'Public Visitor' | 'Data Analyst' | 'Administrator' | 'Retailer';

export interface WardMetadata {
  wardCode: string;
  wardName: string;
  zoneDivision: 'Island City' | 'Western Suburbs' | 'Eastern Suburbs';
  majorLocalities: string;
}

export interface WardConnectionRow {
  id?: number;
  datasetId: number;
  wardCode: string;
  wardName: string;
  zoneDivision: string;
  majorLocalities: string;
  meteredCm: number;
  meteredDm: number;
  meteredInd: number;
  meteredTotal: number;
  nonMeteredCm: number;
  nonMeteredDm: number;
  nonMeteredInd: number;
  nonMeteredTotal: number;
  allConnectionsTotal: number;
  nonMeteredPctCalculated: number;
  nonMeteredPctSource: number;
  referenceDate: string;
  sourceBasis: string;
  sourceUrl: string;
}

export interface FactWaterConnectionRow {
  id?: number;
  datasetId: number;
  wardCode: string;
  connectionCategory: 'Commercial' | 'Domestic' | 'Industrial';
  meterStatus: 'Metered' | 'Non-Metered';
  connectionCount: number;
  referenceDate: string;
}

export interface DataDictionaryEntry {
  fieldName: string;
  description: string;
  dataType: string;
  status: 'Original' | 'Calculated' | 'Metadata';
  processingRule: string;
  dashboardUsage: string;
}

export interface ValidationCheckResult {
  id?: number;
  datasetId: number;
  checkName: string;
  expectedValue: string;
  actualValue: string;
  passed: boolean;
  details: string;
  checkedAt: string;
}

export interface EtlStageLog {
  stageNumber: number;
  stageKey: string;
  title: string;
  description: string;
  inputSummary: string;
  outputSummary: string;
  technologies: string[];
  status: 'Completed' | 'Pending' | 'Failed';
  executedAt: string;
  metrics?: Record<string, string | number>;
}

export interface MunicipalDataset {
  id: number;
  datasetName: string;
  version: string;
  source: string;
  sourceUrl: string;
  referenceDate: string;
  importDate: string;
  fileFormat: string;
  recordCount: number;
  status: 'Validated' | 'Imported' | 'Pending' | 'Failed';
  importedBy: string;
  changeSummary: string;
  isActive: number;
}

export interface LocalitySurvey {
  id?: number;
  surveyDate: string;
  wardCode: string;
  localityOrBlock: string;
  respondentType: string;
  waterSource: string;
  isMetered: string;
  supplyHoursPerDay: number;
  supplyRegularity: string;
  interruptionsPerMonth: number;
  pressureAdequacy: string;
  mainWaterIssue: string;
  observationNotes: string;
  submittedAt?: string;
}

export interface BusinessListing {
  id: number;
  businessName: string;
  category: string;
  wardCode: string;
  locality: string;
  address: string;
  description: string;
  productsServices: string;
  openingHours: string;
  contactPhone: string;
  contactEmail: string;
  consentGiven: number;
  verificationStatus: 'pending' | 'verified' | 'rejected';
  ownerEmail: string;
  createdAt: string;
  updatedAt: string;
  viewsCount?: number;
  enquiriesCount?: number;
  contactClicksCount?: number;
}

export interface BusinessEnquiry {
  id?: number;
  businessId: number;
  senderName: string;
  senderContact: string;
  message: string;
  createdAt?: string;
}

export interface AuditLogEntry {
  id: number;
  actorRole: string;
  action: string;
  resource: string;
  details: string;
  createdAt: string;
}
