import { useEffect, useState } from 'react';
import { CheckCircle2, Download, ShieldCheck } from 'lucide-react';
import { useRole } from '../context/RoleContext.tsx';
import type { MunicipalDataset } from '../shared/types.ts';

interface QualityResponse {
  dataset: MunicipalDataset;
  metrics: {
    completenessRate: number;
    filledCells: number;
    totalCells: number;
    duplicateRate: number;
    duplicateCount: number;
    validationPassRate: number;
    passedChecks: number;
    totalChecks: number;
    numericValidityRate: number;
    wardCoverageRate: number;
    wardsCovered: number;
    schemaConsistency: number;
    sourceVerified: boolean;
    referenceDateAvailable: boolean;
  };
  formulas: Array<{
    name: string;
    formula: string;
    result: string;
    limitation: string;
  }>;
  varianceRows: Array<{
    wardCode: string;
    sourcePct: number;
    calculatedPct: number;
    diff: number;
    meteredSumDiff: number;
    nonMeteredSumDiff: number;
  }>;
  versions: MunicipalDataset[];
}

export function DataQualityPage() {
  const { apiFetch } = useRole();
  const [quality, setQuality] = useState<QualityResponse | null>(null);

  useEffect(() => {
    apiFetch('/api/quality').then((r) => r.json()).then(setQuality);
  }, [apiFetch]);

  return (
    <div className="space-y-5">
      <div className="bg-white border border-slate-200 rounded-lg p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Data Quality &amp; Monitoring</h1>
          <p className="text-xs text-slate-600 mt-1">
            Transparent quality formulas, original vs calculated audit variance, freshness tracking, and version history.
          </p>
        </div>
        <a
          href="/api/quality/error-log.csv"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-[#1E3A8A] text-white rounded-md hover:bg-[#172554] self-start sm:self-auto"
        >
          <Download className="w-3.5 h-3.5" />
          Download Validation Log (.csv)
        </a>
      </div>

      {/* KPI Summary */}
      {quality && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-200 rounded-lg p-4">
            <div className="text-xs text-slate-500 font-semibold">Data Completeness</div>
            <div className="text-2xl font-bold font-mono-tabular text-emerald-700 mt-1">
              {quality.metrics.completenessRate}%
            </div>
            <div className="text-[11px] text-slate-600 mt-1">
              {quality.metrics.filledCells} / {quality.metrics.totalCells} required fields populated
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg p-4">
            <div className="text-xs text-slate-500 font-semibold">Duplicate Record Rate</div>
            <div className="text-2xl font-bold font-mono-tabular text-slate-900 mt-1">
              {quality.metrics.duplicateRate}%
            </div>
            <div className="text-[11px] text-slate-600 mt-1">
              {quality.metrics.duplicateCount} duplicates across {quality.metrics.wardsCovered} wards
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg p-4">
            <div className="text-xs text-slate-500 font-semibold">Validation Pass Rate</div>
            <div className="text-2xl font-bold font-mono-tabular text-[#1E3A8A] mt-1">
              {quality.metrics.validationPassRate}%
            </div>
            <div className="text-[11px] text-slate-600 mt-1">
              {quality.metrics.passedChecks} / {quality.metrics.totalChecks} reconciliation checks passed
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg p-4">
            <div className="text-xs text-slate-500 font-semibold">Data Freshness Snapshot</div>
            <div className="text-2xl font-bold font-mono-tabular text-amber-700 mt-1">
              {quality.dataset.referenceDate}
            </div>
            <div className="text-[11px] text-slate-600 mt-1">
              Static RTI snapshot (not live BMC stream)
            </div>
          </div>
        </div>
      )}

      {/* Formulas & Limitations */}
      <div className="bg-white border border-slate-200 rounded-lg p-5">
        <h2 className="text-sm font-bold text-slate-900 mb-3 inline-flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-[#1E3A8A]" />
          Quality Score Formulas &amp; Methodological Limitations
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {(quality?.formulas || []).map((f) => (
            <div key={f.name} className="p-3.5 border border-slate-200 rounded-md bg-slate-50 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900">{f.name}</span>
                <span className="text-xs font-mono-tabular font-semibold text-emerald-700">{f.result}</span>
              </div>
              <div className="text-[11px] font-mono-tabular text-[#1E3A8A]">{f.formula}</div>
              <div className="text-[11px] text-slate-600">
                <strong>Limitation:</strong> {f.limitation}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Original vs Calculated Audit Table & Version History */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-lg p-5">
          <h2 className="text-sm font-bold text-slate-900 mb-3">
            Original vs Calculated Audit Comparison (All 24 Wards)
          </h2>
          <div className="max-h-72 overflow-y-auto border border-slate-200 rounded-md">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 border-b border-slate-200 sticky top-0">
                <tr>
                  <th className="px-3 py-2">Ward</th>
                  <th className="px-3 py-2 text-right">Source %</th>
                  <th className="px-3 py-2 text-right">Calculated %</th>
                  <th className="px-3 py-2 text-right">Variance</th>
                  <th className="px-3 py-2 text-right">Sum Check Diff</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-mono-tabular">
                {(quality?.varianceRows || []).map((v) => (
                  <tr key={v.wardCode}>
                    <td className="px-3 py-1.5 font-sans font-semibold text-[#1E3A8A]">{v.wardCode}</td>
                    <td className="px-3 py-1.5 text-right">{v.sourcePct.toFixed(2)}%</td>
                    <td className="px-3 py-1.5 text-right">{v.calculatedPct.toFixed(2)}%</td>
                    <td className="px-3 py-1.5 text-right text-emerald-700">{v.diff.toFixed(2)}</td>
                    <td className="px-3 py-1.5 text-right">{v.meteredSumDiff + v.nonMeteredSumDiff}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-lg p-5">
          <h2 className="text-sm font-bold text-slate-900 mb-3">Dataset Version History</h2>
          <div className="space-y-2.5 max-h-72 overflow-y-auto">
            {(quality?.versions || []).map((ver) => (
              <div key={ver.id} className="p-3 border border-slate-200 rounded-md bg-slate-50 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#1E3A8A] font-mono-tabular">{ver.version}</span>
                  <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {ver.isActive ? 'Active' : 'Archived'} · {ver.status}
                  </span>
                </div>
                <div className="text-slate-700 mt-1">{ver.changeSummary}</div>
                <div className="text-[11px] text-slate-500 mt-1 font-mono-tabular">
                  {new Date(ver.importDate).toLocaleString()} · By: {ver.importedBy}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
