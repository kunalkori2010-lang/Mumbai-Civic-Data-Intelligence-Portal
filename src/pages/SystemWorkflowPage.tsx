import { useState } from 'react';
import { ArrowDown, ArrowRight, CheckCircle2, GitBranch } from 'lucide-react';

interface WorkflowNode {
  id: number;
  title: string;
  description: string;
  input: string;
  tech: string;
  transformation: string;
  output: string;
  status: string;
}

const FLOW_NODES: WorkflowNode[] = [
  { id: 1, title: 'BMC & Government Data Sources', description: 'Public RTI water connection disclosures compiled in Praja Civic Issues Report (May 2025, Table 5, p. 14).', input: 'OpenCity PDF Report', tech: 'RTI Public Disclosure', transformation: 'Source verification & reference date locking (March 2025)', output: 'Verified source citation & URL', status: 'Completed' },
  { id: 2, title: 'Raw Data Collection', description: 'Structured multi-sheet Excel workbook capturing Summary, Ward_Connections, Data_Dictionary, and Locality_Survey.', input: 'Table 5 Ward Figures', tech: 'Excel (.xlsx)', transformation: 'Preservation of raw column schema', output: 'BMC_Water_Connections_Ward_Data.xlsx', status: 'Completed' },
  { id: 3, title: 'Excel / CSV / PDF Extraction', description: 'Reads workbook sheets and identifies 24 ward rows + 1 Grand Total row.', input: '4-sheet XLSX workbook', tech: 'Python Pandas / OpenPyXL / SheetJS', transformation: 'Header promotion & Grand Total separation', output: '24 raw ward objects', status: 'Completed' },
  { id: 4, title: 'Data Profiling', description: 'Counts rows, columns, missing cells, duplicate ward codes, and numeric validity before modification.', input: 'Extracted raw rows', tech: 'Python / TypeScript Profiler', transformation: 'Null, type & uniqueness scanning', output: 'Pre-cleaning Data Profile Report', status: 'Completed' },
  { id: 5, title: 'Data Cleaning', description: 'Trims whitespace, uppercases ward codes, casts counts to non-negative integers.', input: 'Profiled ward table', tech: 'Pandas / ETL Engine', transformation: 'Deterministic type casting without dropping valid wards', output: '24 cleaned ward records', status: 'Completed' },
  { id: 6, title: 'Data Standardisation', description: 'Maps Zone Divisions (Island City, Western Suburbs, Eastern Suburbs) and retains original vs calculated percentages.', input: 'Cleaned ward records', tech: 'Domain Taxonomy', transformation: 'Standardised column identifiers & zone mapping', output: 'Standardised wide ward dataset', status: 'Completed' },
  { id: 7, title: 'Data Validation', description: 'Reconciles sum totals against 529,123 metered, 22,336 non-metered, 551,459 total, and 24 wards.', input: 'Standardised dataset', tech: 'Automated Reconciliation Suite', transformation: '8 assertion checks across categories & metering', output: '8/8 Validation Checks Passed', status: 'Completed' },
  { id: 8, title: 'Central Database', description: 'Stores versioned metadata, raw snapshots, 144 normalised fact rows, surveys, businesses, and audit logs.', input: 'Validated datasets', tech: 'SQLite Relational DB (WAL + Indexes)', transformation: 'Star-schema normalization & FK indexing', output: 'data/civic_portal.db', status: 'Completed' },
  { id: 9, title: 'Power Query', description: 'Unpivots 6 category/status columns into tidy long-format analytical rows and removes Grand Total.', input: 'Ward_Connections / CSVs', tech: 'Power Query M', transformation: 'Table.UnpivotOtherColumns & column split', output: '144-row FactWaterConnections', status: 'Completed' },
  { id: 10, title: 'Power BI Data Model', description: 'Connects FactWaterConnections to DimWard, DimConnectionType, DimMeterStatus, and DimSource.', input: 'Star-schema CSVs', tech: 'Power BI Star Schema', transformation: '1-to-many single-direction relationships', output: 'Relational BI Model', status: 'Completed' },
  { id: 11, title: 'DAX Analytics', description: 'Calculates DIVIDE()-safe percentages, RANKX ward rankings, and Data Validation Status measure.', input: 'Power BI Data Model', tech: 'DAX', transformation: 'Dynamic filter-context aggregations', output: '14 Reusable DAX Measures', status: 'Completed' },
  { id: 12, title: 'Power BI Reports', description: '7-page analytical specification with slicers, bookmarks, drill-through, and BMC JSON Theme.', input: 'DAX Measures + Theme JSON', tech: 'Microsoft Power BI Desktop', transformation: 'Visual layout & conditional formatting', output: '7-Page BI Report + CSV Bundle', status: 'Completed' },
  { id: 13, title: 'Website Dashboard', description: 'Government-style React & Express portal displaying interactive KPIs, charts, explorer, and ETL telemetry.', input: 'Express REST APIs', tech: 'React + TypeScript + Recharts', transformation: 'Dynamic filtering, pagination & CSV export', output: '15-Module Web Application', status: 'Completed' },
  { id: 14, title: 'Local Business Connect', description: 'Links Mumbai wards to consented local retailers for consumer discovery and admin moderation.', input: '24 BMC Wards + Retailer Submissions', tech: 'REST API + SQLite', transformation: 'Consent verification & engagement tracking', output: 'Searchable Locality Directory', status: 'Completed' },
  { id: 15, title: 'Community Insights & Business Benefits', description: 'Combines civic literacy, voluntary field observations, and transparent retailer ROI estimation.', input: 'Engagement events + ROI inputs', tech: 'Analytics & ROI Engine', transformation: 'Transparent revenue & benefit formula evaluation', output: 'Actionable Community Insights', status: 'Completed' },
];

const TECH_ROLES = [
  { name: 'Python & Pandas / OpenPyXL', role: 'Offline & batch Excel extraction, profiling, numeric verification, and CSV unpivoting.' },
  { name: 'SQLite Central Database', role: 'Relational storage with foreign keys, indexes, dataset versioning, surveys, businesses, and audit logs.' },
  { name: 'Power Query (M)', role: 'Data ingestion, header promotion, Grand Total filtering, and unpivoting into FactWaterConnections.' },
  { name: 'DAX', role: 'Filter-context analytical measures ([Total Connections], [Non-Metered Percentage], [Ward Ranking]).' },
  { name: 'Microsoft Power BI', role: 'Executive 7-page BI storytelling with slicers, drill-through, bookmarks, and BMC theme JSON.' },
  { name: 'Express.js Backend API', role: 'Serves validated queries, server-side pagination, RBAC checks, CSV/XLSX exports, and OpenAPI docs.' },
  { name: 'React & Recharts Frontend', role: 'Authentic government-style civic portal uniting dashboards, ETL transparency, and Business Connect.' },
];

export function SystemWorkflowPage() {
  const [selectedId, setSelectedId] = useState<number>(1);
  const activeNode = FLOW_NODES.find((n) => n.id === selectedId) || FLOW_NODES[0];

  return (
    <div className="space-y-5">
      <div className="bg-white border border-slate-200 rounded-lg p-5">
        <h1 className="text-xl font-bold text-slate-900">Interactive System Workflow &amp; Architecture</h1>
        <p className="text-xs text-slate-600 mt-1">
          Click any of the 15 stages below to inspect its exact inputs, transformations, technologies, and completion status.
        </p>
      </div>

      {/* Horizontal Architecture Overview Diagram */}
      <div className="bg-white border border-slate-200 rounded-lg p-5">
        <h2 className="text-sm font-bold text-slate-900 mb-3 inline-flex items-center gap-1.5">
          <GitBranch className="w-4 h-4 text-[#1E3A8A]" />
          End-to-End Architecture Pipeline
        </h2>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {['Data Sources (Praja RTI)', 'ETL Pipeline (Python/Node)', 'Central Database (SQLite)', 'Express REST API', 'React Dashboard / Power BI', 'Citizens & Local Businesses'].map((step, i, arr) => (
            <div key={step} className="flex items-center gap-2">
              <div className="px-3 py-2 rounded-md bg-[#1E3A8A] text-white font-semibold">{step}</div>
              {i < arr.length - 1 && <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" />}
            </div>
          ))}
        </div>
      </div>

      {/* Clickable 15-Stage Flow Diagram + Stage Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-lg p-4 space-y-1">
          {FLOW_NODES.map((node, idx) => (
            <div key={node.id} className="flex flex-col items-center">
              <button
                type="button"
                onClick={() => setSelectedId(node.id)}
                className={`w-full px-3 py-2 rounded-md border text-left flex items-center justify-between text-xs transition-colors ${
                  selectedId === node.id
                    ? 'bg-[#1E3A8A] text-white border-[#1E3A8A] font-bold'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-200 font-medium'
                }`}
              >
                <span>{node.id}. {node.title}</span>
                <CheckCircle2 className={`w-3.5 h-3.5 shrink-0 ${selectedId === node.id ? 'text-emerald-300' : 'text-emerald-600'}`} />
              </button>
              {idx < FLOW_NODES.length - 1 && <ArrowDown className="w-3.5 h-3.5 text-slate-400 my-0.5" />}
            </div>
          ))}
        </div>

        <div className="lg:col-span-7 space-y-5">
          <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <div className="text-xs font-semibold text-[#1E3A8A]">Stage {activeNode.id} of 15</div>
                <h2 className="text-base font-bold text-slate-900">{activeNode.title}</h2>
              </div>
              <span className="text-xs font-semibold text-emerald-700">Status: {activeNode.status}</span>
            </div>

            <p className="text-xs text-slate-700 leading-relaxed">{activeNode.description}</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded">
                <div className="text-[11px] font-semibold text-slate-500">Input Data</div>
                <div className="font-medium text-slate-900 mt-0.5">{activeNode.input}</div>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded">
                <div className="text-[11px] font-semibold text-slate-500">Technologies Used</div>
                <div className="font-medium text-slate-900 mt-0.5">{activeNode.tech}</div>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded">
                <div className="text-[11px] font-semibold text-slate-500">Transformation Performed</div>
                <div className="font-medium text-slate-900 mt-0.5">{activeNode.transformation}</div>
              </div>
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded">
                <div className="text-[11px] font-semibold text-emerald-700">Output Data</div>
                <div className="font-medium text-emerald-950 mt-0.5">{activeNode.output}</div>
              </div>
            </div>
          </div>

          {/* Separate Technology Roles */}
          <div className="bg-white border border-slate-200 rounded-lg p-5">
            <h2 className="text-sm font-bold text-slate-900 mb-3">Separate Roles Across the Technology Stack</h2>
            <div className="divide-y divide-slate-200 text-xs">
              {TECH_ROLES.map((t) => (
                <div key={t.name} className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <span className="font-bold text-[#1E3A8A] sm:w-56 shrink-0">{t.name}</span>
                  <span className="text-slate-700 flex-1">{t.role}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
