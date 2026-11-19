import { useEffect, useState } from 'react';
import { AlertTriangle, BookOpen, CheckCircle2, ExternalLink } from 'lucide-react';
import { useRole } from '../context/RoleContext.tsx';
import type { MunicipalDataset } from '../shared/types.ts';

interface SourcesResponse {
  sourceMetadata: {
    datasetTitle: string;
    sourceOrganisation: string;
    primaryReport: string;
    referenceDate: string;
    sourcePdfUrl: string;
    relatedDatasetUrl: string;
    relatedDatasetNote: string;
    sourceBasis: string;
    geographicalCoverage: string;
  };
  activeDataset: MunicipalDataset;
  validations: Array<{ checkName: string; expectedValue: string; actualValue: string; passed: number; checkedAt: string }>;
}

export function DataSourcesPage() {
  const { apiFetch } = useRole();
  const [data, setData] = useState<SourcesResponse | null>(null);

  useEffect(() => {
    apiFetch('/api/sources').then((r) => r.json()).then(setData);
  }, [apiFetch]);

  const m = data?.sourceMetadata;
  const ds = data?.activeDataset;

  return (
    <div className="space-y-5">
      <div className="bg-white border border-slate-200 rounded-lg p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Data Sources &amp; Data Provenance</h1>
          <p className="text-xs text-slate-600 mt-1">
            Complete citation, RTI origin, snapshot reference date, processing history, and methodological boundaries. Not a live connection to BMC.
          </p>
        </div>
        {m && (
          <a
            href={m.sourcePdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-[#1E3A8A] text-white rounded-md hover:bg-[#172554] self-start lg:self-auto"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Open Original Source Report (PDF)
          </a>
        )}
      </div>

      {/* Date Separation Warning */}
      <div className="bg-amber-50 border border-amber-300 rounded-lg p-4 flex items-start gap-3 text-xs text-amber-950">
        <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-700" />
        <div>
          <strong>Snapshot Reference Date Policy:</strong>{' '}
          {m?.relatedDatasetNote ||
            'The related OpenCity resource includes a separate water-connections snapshot dated 3 January 2025. It is intentionally NOT merged with the March 2025 ward-wise report without explicit reference-date separation.'}
        </div>
      </div>

      {/* Primary Provenance Metadata Table */}
      {m && ds && (
        <div className="bg-white border border-slate-200 rounded-lg p-5">
          <h2 className="text-sm font-bold text-slate-900 mb-3 inline-flex items-center gap-1.5">
            <BookOpen className="w-4 h-4 text-[#1E3A8A]" />
            Primary Source Traceability Matrix
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-md space-y-2">
              <div><span className="font-semibold text-slate-500">Dataset Title:</span> <span className="font-bold text-slate-900">{m.datasetTitle}</span></div>
              <div><span className="font-semibold text-slate-500">Source Organisation:</span> <span className="text-slate-900">{m.sourceOrganisation}</span></div>
              <div><span className="font-semibold text-slate-500">Primary Citation:</span> <span className="text-slate-900">{m.primaryReport}</span></div>
              <div><span className="font-semibold text-slate-500">Reference Date:</span> <span className="font-mono-tabular font-semibold text-[#1E3A8A]">{m.referenceDate}</span></div>
              <div><span className="font-semibold text-slate-500">Geographical Coverage:</span> <span className="text-slate-900">{m.geographicalCoverage}</span></div>
            </div>

            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-md space-y-2">
              <div><span className="font-semibold text-slate-500">File Format:</span> <span className="text-slate-900">{ds.fileFormat}</span></div>
              <div><span className="font-semibold text-slate-500">Original / Processed Ward Count:</span> <span className="font-mono-tabular text-slate-900">25 raw rows (24 wards + 1 Grand Total) → 24 validated ward records</span></div>
              <div><span className="font-semibold text-slate-500">Last Import Timestamp:</span> <span className="font-mono-tabular text-slate-900">{new Date(ds.importDate).toLocaleString()}</span></div>
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-slate-500">Verification Status:</span>
                <span className="inline-flex items-center gap-1 font-semibold text-emerald-700">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {ds.status} ({ds.version})
                </span>
              </div>
              <div>
                <span className="font-semibold text-slate-500">Related Dataset:</span>{' '}
                <a href={m.relatedDatasetUrl} target="_blank" rel="noopener noreferrer" className="text-[#1E3A8A] underline break-all">
                  OpenCity Mumbai Water Connections Details
                </a>
              </div>
            </div>
          </div>

          <div className="mt-4 p-4 border border-slate-200 rounded-md text-xs text-slate-700 space-y-1.5">
            <div className="font-bold text-slate-900">Data Limitations &amp; Scope Boundaries</div>
            <ul className="list-disc pl-5 space-y-1">
              <li>This prototype is an independent academic community engagement project and is NOT an official BMC application or live feed.</li>
              <li>Connection counts reflect administrative metering counts at ward level as of March 2025; they do not measure water pressure, daily supply hours, contamination, or equity of distribution.</li>
              <li>Commercial, Domestic, and Industrial category totals reconcile to 79,961 CM, 465,043 DM, and 6,455 IND (551,459 total; 529,123 metered; 22,336 non-metered).</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
