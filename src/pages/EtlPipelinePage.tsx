import { useEffect, useState } from 'react';
import { CheckCircle2, Download, Play, RefreshCw, XCircle } from 'lucide-react';
import { useRole } from '../context/RoleContext.tsx';
import type { EtlStageLog, ValidationCheckResult } from '../shared/types.ts';

export function EtlPipelinePage() {
  const { role, apiFetch } = useRole();
  const [stages, setStages] = useState<EtlStageLog[]>([]);
  const [validations, setValidations] = useState<ValidationCheckResult[]>([]);
  const [selectedStage, setSelectedStage] = useState<number>(1);
  const [datasetInfo, setDatasetInfo] = useState<{ datasetName: string; version: string; importDate: string } | null>(null);
  const [running, setRunning] = useState(false);
  const [message, setMessage] = useState('');

  const loadStatus = async () => {
    const res = await apiFetch('/api/etl/status');
    if (res.ok) {
      const json = await res.json();
      setStages(json.stages || []);
      setValidations(json.validations || []);
      setDatasetInfo(json.dataset || null);
    }
  };

  useEffect(() => {
    loadStatus();
  }, [apiFetch]);

  const handleReprocess = async () => {
    setRunning(true);
    setMessage('');
    try {
      const res = await apiFetch('/api/etl/reprocess', { method: 'POST' });
      const json = await res.json();
      if (!res.ok) {
        setMessage(json.error || 'Reprocessing denied.');
      } else {
        setMessage('10-Stage ETL pipeline executed successfully and Power BI CSVs refreshed.');
        await loadStatus();
      }
    } finally {
      setRunning(false);
    }
  };

  const activeStage = stages.find((s) => s.stageNumber === selectedStage) || stages[0];

  return (
    <div className="space-y-5">
      <div className="bg-white border border-slate-200 rounded-lg p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            BMC Data Extraction, Cleaning &amp; Standardisation System
          </h1>
          <p className="text-xs text-slate-600 mt-1">
            Complete 10-stage Data Engineering pipeline transforming raw 4-sheet Excel records into validated SQLite tables and Power BI CSVs.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <a
            href="/api/exports/python-etl"
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-white border border-slate-300 text-slate-800 rounded-md hover:bg-slate-50"
          >
            <Download className="w-3.5 h-3.5" />
            Download Python ETL Script (.py)
          </a>
          <button
            type="button"
            onClick={handleReprocess}
            disabled={running || (role !== 'Administrator' && role !== 'Data Analyst')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-[#1E3A8A] hover:bg-[#172554] text-white rounded-md disabled:opacity-50"
            title={role !== 'Administrator' && role !== 'Data Analyst' ? 'Switch role to Administrator or Data Analyst to reprocess' : undefined}
          >
            {running ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
            {running ? 'Running ETL...' : 'Re-Run 10-Stage ETL Pipeline'}
          </button>
        </div>
      </div>

      {message && (
        <div className="p-3 bg-blue-50 border border-blue-200 text-[#1E3A8A] text-xs rounded-md">
          {message}
        </div>
      )}

      {/* 10-Stage Interactive Stepper */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-lg p-4 space-y-1.5">
          <div className="text-xs font-bold text-slate-500 pb-2 border-b border-slate-200">
            Active Dataset: {datasetInfo?.datasetName} ({datasetInfo?.version})
          </div>
          {stages.map((s) => (
            <button
              key={s.stageNumber}
              type="button"
              onClick={() => setSelectedStage(s.stageNumber)}
              className={`w-full text-left px-3 py-2.5 rounded-md border flex items-center justify-between gap-2 transition-colors ${
                selectedStage === s.stageNumber
                  ? 'bg-[#1E3A8A] text-white border-[#1E3A8A]'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-200'
              }`}
            >
              <div className="min-w-0">
                <div className="text-xs font-bold truncate">{s.title}</div>
                <div className={`text-[11px] truncate ${selectedStage === s.stageNumber ? 'text-blue-100' : 'text-slate-500'}`}>
                  {s.outputSummary}
                </div>
              </div>
              <CheckCircle2 className={`w-4 h-4 shrink-0 ${selectedStage === s.stageNumber ? 'text-emerald-300' : 'text-emerald-600'}`} />
            </button>
          ))}
        </div>

        {/* Selected Stage Inspector + Validation Table */}
        <div className="lg:col-span-7 space-y-5">
          {activeStage && (
            <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-4">
              <div className="flex items-start justify-between gap-3 border-b border-slate-200 pb-3">
                <div>
                  <div className="text-xs font-semibold text-[#1E3A8A]">Stage {activeStage.stageNumber} of 10</div>
                  <h2 className="text-base font-bold text-slate-900">{activeStage.title}</h2>
                </div>
                <span className="text-xs font-semibold text-emerald-700">Status: {activeStage.status}</span>
              </div>

              <p className="text-xs text-slate-700 leading-relaxed">{activeStage.description}</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded">
                  <div className="text-[11px] font-semibold text-slate-500">Input Data</div>
                  <div className="text-slate-900 font-medium mt-0.5">{activeStage.inputSummary}</div>
                </div>
                <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded">
                  <div className="text-[11px] font-semibold text-emerald-700">Validated Output</div>
                  <div className="text-emerald-950 font-medium mt-0.5">{activeStage.outputSummary}</div>
                </div>
              </div>

              <div className="text-xs text-slate-600 flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
                <div>
                  <span className="font-semibold text-slate-800">Technologies: </span>
                  {activeStage.technologies.join(' · ')}
                </div>
                <div className="font-mono-tabular text-[11px]">
                  Executed: {new Date(activeStage.executedAt).toLocaleString()}
                </div>
              </div>
            </div>
          )}

          {/* Stage 6 Validation Reconciliation Results */}
          <div className="bg-white border border-slate-200 rounded-lg p-5">
            <h2 className="text-sm font-bold text-slate-900 mb-3">
              Stage 6 Automated Reconciliation Checks (Published Praja May 2025 Totals)
            </h2>
            <div className="overflow-x-auto border border-slate-200 rounded-md">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 border-b border-slate-200">
                  <tr>
                    <th className="px-3 py-2 font-semibold">Validation Check</th>
                    <th className="px-3 py-2 font-semibold text-right">Expected</th>
                    <th className="px-3 py-2 font-semibold text-right">Actual</th>
                    <th className="px-3 py-2 font-semibold">Result</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {validations.map((v) => (
                    <tr key={v.id}>
                      <td className="px-3 py-2 font-medium text-slate-800">
                        <div>{v.checkName}</div>
                        <div className="text-[11px] text-slate-500">{v.details}</div>
                      </td>
                      <td className="px-3 py-2 text-right font-mono-tabular">{v.expectedValue}</td>
                      <td className="px-3 py-2 text-right font-mono-tabular">{v.actualValue}</td>
                      <td className="px-3 py-2">
                        {v.passed ? (
                          <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Passed
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-red-700 font-semibold">
                            <XCircle className="w-3.5 h-3.5" /> Failed
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
