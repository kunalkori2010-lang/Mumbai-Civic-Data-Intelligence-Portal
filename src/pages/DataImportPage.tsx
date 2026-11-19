import React, { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, FileSpreadsheet, ShieldAlert, UploadCloud } from 'lucide-react';
import { useRole } from '../context/RoleContext.tsx';
import type { MunicipalDataset } from '../shared/types.ts';

interface PreviewResponse {
  fileName: string;
  fileSizeBytes: number;
  sheetNames: string[];
  detectedHeaders: string[];
  missingColumns: string[];
  compatible: boolean;
  rawRowCount: number;
  wardRowCount: number;
  hasGrandTotalRow: boolean;
  missingValuesCount: number;
  duplicateWards: string[];
  invalidNumericCells: number;
  totals: {
    meteredTotal: number;
    nonMeteredTotal: number;
    allConnectionsTotal: number;
  };
  sampleRows: Record<string, unknown>[];
}

export function DataImportPage() {
  const { role, apiFetch } = useRole();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<PreviewResponse | null>(null);
  const [datasetName, setDatasetName] = useState('BMC Ward-Wise Water Connections (Uploaded Update)');
  const [changeSummary, setChangeSummary] = useState('Uploaded updated municipal workbook via Dataset Import Centre');
  const [confirmed, setConfirmed] = useState(false);
  const [versions, setVersions] = useState<MunicipalDataset[]>([]);
  const [statusMsg, setStatusMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const loadVersions = async () => {
    const res = await apiFetch('/api/datasets');
    if (res.ok) {
      const json = await res.json();
      setVersions(json.versions || []);
    }
  };

  useEffect(() => {
    loadVersions();
  }, [apiFetch]);

  const handlePreview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;
    setLoading(true);
    setErrorMsg('');
    setStatusMsg('');
    setPreview(null);
    setConfirmed(false);

    try {
      const fd = new FormData();
      fd.append('file', selectedFile);
      const res = await apiFetch('/api/import/preview', { method: 'POST', body: fd });
      const json = await res.json();
      if (!res.ok) {
        setErrorMsg(json.error || 'Preview failed');
      } else {
        setPreview(json);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCommit = async () => {
    if (!selectedFile || !confirmed) return;
    setLoading(true);
    setErrorMsg('');
    setStatusMsg('');
    try {
      const fd = new FormData();
      fd.append('file', selectedFile);
      fd.append('confirmed', 'true');
      fd.append('datasetName', datasetName);
      fd.append('changeSummary', changeSummary);
      const res = await apiFetch('/api/import/commit', { method: 'POST', body: fd });
      const json = await res.json();
      if (!res.ok) {
        setErrorMsg(json.error || 'Commit failed');
      } else {
        setStatusMsg(
          `Dataset committed successfully (ID #${json.datasetId}). Prior workbook backed up as ${json.backupName}.`
        );
        setPreview(null);
        setSelectedFile(null);
        setConfirmed(false);
        await loadVersions();
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="bg-white border border-slate-200 rounded-lg p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Dataset Import Centre &amp; Version Control</h1>
          <p className="text-xs text-slate-600 mt-1">
            Upload `.xlsx` or `.csv` municipal water datasets. Preview schema compatibility, duplicates, and missing values before confirming backup &amp; commit.
          </p>
        </div>
        <a
          href="/api/exports/workbook.xlsx"
          className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-slate-100 border border-slate-300 rounded-md text-slate-800 hover:bg-slate-200 self-start"
        >
          <FileSpreadsheet className="w-3.5 h-3.5" />
          Download Template Workbook (.xlsx)
        </a>
      </div>

      {role !== 'Administrator' && role !== 'Data Analyst' && (
        <div className="p-4 bg-amber-50 border border-amber-300 rounded-lg text-xs text-amber-900 flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 shrink-0 text-amber-700" />
          <span>
            Current role is <strong>{role}</strong>. Switch to <strong>Data Analyst</strong> to preview files or <strong>Administrator</strong> to commit new dataset versions.
          </span>
        </div>
      )}

      {/* Upload & Preview Form */}
      <form onSubmit={handlePreview} className="bg-white border border-slate-200 rounded-lg p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <input
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={(e) => {
              setSelectedFile(e.target.files?.[0] || null);
              setPreview(null);
            }}
            className="text-xs file:mr-3 file:py-2 file:px-4 file:rounded-md file:border file:border-slate-300 file:text-xs file:font-semibold file:bg-slate-100 file:text-slate-800 hover:file:bg-slate-200"
          />
          <button
            type="submit"
            disabled={!selectedFile || loading || (role !== 'Administrator' && role !== 'Data Analyst')}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-[#1E3A8A] text-white rounded-md hover:bg-[#172554] disabled:opacity-50"
          >
            <UploadCloud className="w-4 h-4" />
            {loading ? 'Inspecting File...' : 'Preview & Validate File'}
          </button>
        </div>

        {errorMsg && <div className="p-3 bg-red-50 border border-red-200 text-red-800 text-xs rounded">{errorMsg}</div>}
        {statusMsg && <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded">{statusMsg}</div>}
      </form>

      {/* Preview Diagnostics & Confirmation */}
      {preview && (
        <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Pre-Import Inspection: {preview.fileName}</h2>
              <div className="text-[11px] text-slate-500">
                Sheets: {preview.sheetNames.join(', ')} · Ward Rows: {preview.wardRowCount} · Grand Total Detected: {preview.hasGrandTotalRow ? 'Yes (Isolated)' : 'No'}
              </div>
            </div>
            <span className={`text-xs font-bold ${preview.compatible ? 'text-emerald-700' : 'text-red-700'}`}>
              {preview.compatible ? 'Schema Compatible' : 'Schema Warnings'}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded">
              <div className="text-slate-500">Missing Values</div>
              <div className="text-lg font-bold font-mono-tabular">{preview.missingValuesCount}</div>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded">
              <div className="text-slate-500">Duplicate Wards</div>
              <div className="text-lg font-bold font-mono-tabular">{preview.duplicateWards.length}</div>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded">
              <div className="text-slate-500">Preview Metered Sum</div>
              <div className="text-lg font-bold font-mono-tabular text-emerald-700">{preview.totals.meteredTotal.toLocaleString('en-IN')}</div>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded">
              <div className="text-slate-500">Preview Total Sum</div>
              <div className="text-lg font-bold font-mono-tabular text-[#1E3A8A]">{preview.totals.allConnectionsTotal.toLocaleString('en-IN')}</div>
            </div>
          </div>

          {preview.missingColumns.length > 0 && (
            <div className="p-3 bg-amber-50 border border-amber-300 text-amber-900 text-xs rounded flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>Missing required columns: {preview.missingColumns.join(', ')}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-2 border-t border-slate-200">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Version Label / Dataset Name</label>
              <input
                type="text"
                value={datasetName}
                onChange={(e) => setDatasetName(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-300 rounded"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Change Summary</label>
              <input
                type="text"
                value={changeSummary}
                onChange={(e) => setChangeSummary(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-300 rounded"
              />
            </div>
          </div>

          <label className="flex items-start gap-2 text-xs text-slate-700 bg-slate-50 p-3 border border-slate-200 rounded cursor-pointer">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              className="mt-0.5"
            />
            <span>
              I confirm backing up the previous dataset version and activating this validated upload as the active portal dataset.
            </span>
          </label>

          <button
            type="button"
            disabled={!confirmed || !preview.compatible || role !== 'Administrator' || loading}
            onClick={handleCommit}
            className="px-4 py-2 text-xs font-semibold bg-emerald-700 hover:bg-emerald-800 text-white rounded-md disabled:opacity-50"
          >
            Confirm Backup &amp; Commit Dataset Version
          </button>
        </div>
      )}

      {/* Dataset Version Control History */}
      <div className="bg-white border border-slate-200 rounded-lg p-5">
        <h2 className="text-sm font-bold text-slate-900 mb-3">Dataset Version Control History</h2>
        <div className="overflow-x-auto border border-slate-200 rounded-md">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 border-b border-slate-200">
              <tr>
                <th className="px-3 py-2">Version</th>
                <th className="px-3 py-2">Dataset Name</th>
                <th className="px-3 py-2">Reference Date</th>
                <th className="px-3 py-2 text-right">Records</th>
                <th className="px-3 py-2">Imported By</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Change Summary</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {versions.map((v) => (
                <tr key={v.id} className={v.isActive ? 'bg-blue-50/40' : ''}>
                  <td className="px-3 py-2 font-mono-tabular font-bold text-[#1E3A8A]">{v.version}</td>
                  <td className="px-3 py-2 font-medium">{v.datasetName}</td>
                  <td className="px-3 py-2">{v.referenceDate}</td>
                  <td className="px-3 py-2 text-right font-mono-tabular">{v.recordCount}</td>
                  <td className="px-3 py-2">{v.importedBy}</td>
                  <td className="px-3 py-2">
                    <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {v.isActive ? 'Active' : 'Archived'} ({v.status})
                    </span>
                  </td>
                  <td className="px-3 py-2 text-slate-600">{v.changeSummary}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
