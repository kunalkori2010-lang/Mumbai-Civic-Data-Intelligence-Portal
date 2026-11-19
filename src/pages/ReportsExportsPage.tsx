import { useEffect, useState } from 'react';
import { Code2, Database, Download, FileSpreadsheet, FileText } from 'lucide-react';
import { useRole } from '../context/RoleContext.tsx';

export function ReportsExportsPage() {
  const { apiFetch } = useRole();
  const [openApi, setOpenApi] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    apiFetch('/api/openapi.json').then((r) => r.json()).then(setOpenApi);
  }, [apiFetch]);

  const exportsList = [
    {
      title: 'Cleaned BMC Ward Dataset (CSV)',
      desc: 'All 24 validated BMC wards with calculated totals and non-metered percentages.',
      href: '/api/exports/cleaned.csv',
      icon: FileText,
    },
    {
      title: 'Original 4-Sheet Source Workbook (XLSX)',
      desc: 'Summary, Ward_Connections (with Grand Total), Data_Dictionary, and Locality_Survey sheets.',
      href: '/api/exports/workbook.xlsx',
      icon: FileSpreadsheet,
    },
    {
      title: 'Power BI Star-Schema Fact Table (FactWaterConnections.csv)',
      desc: '144 normalised ward × category × meter-status rows ready for Power BI Desktop refresh.',
      href: '/api/exports/powerbi-csv/FactWaterConnections.csv',
      icon: Database,
    },
    {
      title: 'Power BI Dimension Tables (DimWard.csv)',
      desc: '24 BMC administrative wards with Zone Divisions and Major Localities.',
      href: '/api/exports/powerbi-csv/DimWard.csv',
      icon: Database,
    },
    {
      title: 'Data Quality Reconciliation Log (CSV)',
      desc: '8 automated validation checks comparing actual database sums against published Praja totals.',
      href: '/api/quality/error-log.csv',
      icon: FileText,
    },
    {
      title: 'Python Pandas ETL Pipeline Script (.py)',
      desc: 'Executable Python script for offline workbook extraction, profiling, and unpivoting.',
      href: '/api/exports/python-etl',
      icon: Code2,
    },
    {
      title: 'Power Query M Script (.m)',
      desc: 'Power Query transformation script excluding Grand Total and unpivoting category columns.',
      href: '/api/exports/powerbi-asset/PowerQuery_Transformations.m',
      icon: Code2,
    },
    {
      title: 'Power BI DAX Measures & Theme JSON',
      desc: 'Documented DAX measures with DIVIDE() safety and official BMC JSON visual theme.',
      href: '/api/exports/powerbi-asset/PowerBI_DAX_Measures.md',
      icon: Code2,
    },
  ];

  return (
    <div className="space-y-5">
      <div className="bg-white border border-slate-200 rounded-lg p-5">
        <h1 className="text-xl font-bold text-slate-900">Reports, Exports &amp; OpenAPI Reference</h1>
        <p className="text-xs text-slate-600 mt-1">
          Download validated datasets, star-schema CSVs, Python ETL code, Power BI deliverables, and inspect live REST API endpoints.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {exportsList.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.title} className="bg-white border border-slate-200 rounded-lg p-4 flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-md bg-slate-100 text-[#1E3A8A] shrink-0">
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">{item.title}</h2>
                  <p className="text-xs text-slate-600 mt-0.5">{item.desc}</p>
                </div>
              </div>
              <a
                href={item.href}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-[#1E3A8A] text-white rounded hover:bg-[#172554] shrink-0"
              >
                <Download className="w-3.5 h-3.5" />
                Download
              </a>
            </div>
          );
        })}
      </div>

      {/* Live OpenAPI 3.0.3 JSON Preview */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900">REST API OpenAPI 3.0.3 Specification (`/api/openapi.json`)</h2>
          <a
            href="/api/openapi.json"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-semibold text-[#1E3A8A] hover:underline"
          >
            Open Raw JSON →
          </a>
        </div>
        <pre className="bg-[#0B111E] text-slate-100 p-4 rounded-md text-[11px] font-mono-tabular overflow-x-auto max-h-72">
          {openApi ? JSON.stringify(openApi, null, 2) : 'Loading OpenAPI spec...'}
        </pre>
      </div>
    </div>
  );
}
