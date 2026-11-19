import { useEffect, useState } from 'react';
import {
  ArrowUpDown,
  BookOpen,
  CheckCircle2,
  Clock,
  Download,
  FileSpreadsheet,
  Search,
} from 'lucide-react';
import { useRole } from '../context/RoleContext.tsx';
import type { DataDictionaryEntry } from '../shared/types.ts';

interface ExplorerItem {
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
  commercialTotal: number;
  domesticTotal: number;
  industrialTotal: number;
  focusValue: number;
  referenceDate: string;
  sourceBasis: string;
}

const CATEGORIES = [
  { key: 'total', label: 'Total Connections', desc: 'Combined metered & non-metered water connections across all 24 wards.' },
  { key: 'commercial', label: 'Commercial Water Connections', desc: 'Metered and non-metered commercial establishments (City Total: 79,961).' },
  { key: 'domestic', label: 'Domestic Water Connections', desc: 'Metered and non-metered residential households (City Total: 465,043).' },
  { key: 'industrial', label: 'Industrial Water Connections', desc: 'Metered and non-metered industrial units (City Total: 6,455).' },
  { key: 'metered', label: 'Metered Connections', desc: 'All metered connections across Commercial, Domestic & Industrial (529,123).' },
  { key: 'non_metered', label: 'Non-Metered Connections', desc: 'All un-metered connections across Commercial, Domestic & Industrial (22,336).' },
  { key: 'ward_wise', label: 'Ward-Wise Connections', desc: 'Complete 24-ward breakdown with original vs calculated fields.' },
];

const FUTURE_DEPARTMENTS = [
  { dept: 'Roads & Traffic (Concretization)', status: 'Pending Import', note: 'Schema placeholder ready for BMC road length & completion status CSV/XLSX.' },
  { dept: 'Municipal Education', status: 'Pending Import', note: 'Awaiting verified ward-wise BMC school & enrolment dataset.' },
  { dept: 'Public Healthcare Facilities', status: 'Pending Import', note: 'Awaiting verified BMC hospital, dispensary & maternity home registry.' },
  { dept: 'Water Infrastructure & Reservoirs', status: 'Pending Import', note: 'Separate infrastructure dataset; not merged with connection counts.' },
  { dept: 'Solid Waste Management', status: 'Pending Import', note: 'Awaiting ward-level collection & processing tonnage disclosures.' },
];

export function DataExplorerPage() {
  const { apiFetch } = useRole();
  const [category, setCategory] = useState('total');
  const [viewMode, setViewMode] = useState<'processed' | 'original' | 'dictionary'>('processed');
  const [zone, setZone] = useState('ALL');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('wardCode');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(12);

  const [items, setItems] = useState<ExplorerItem[]>([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [datasetStatus, setDatasetStatus] = useState('Validated');
  const [referenceDate, setReferenceDate] = useState('March 2025');
  const [dictionary, setDictionary] = useState<DataDictionaryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch('/api/data-dictionary')
      .then((r) => r.json())
      .then((d) => setDictionary(d.entries || []))
      .catch(() => {});
  }, [apiFetch]);

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          category,
          zone,
          search,
          sortBy,
          sortDir,
          page: String(page),
          pageSize: String(pageSize),
        });
        const res = await apiFetch(`/api/explorer?${params.toString()}`);
        if (!res.ok) return;
        const json = await res.json();
        if (active) {
          setItems(json.items || []);
          setTotalRecords(json.totalRecords || 0);
          setTotalPages(json.totalPages || 1);
          setDatasetStatus(json.dataset?.status || 'Validated');
          setReferenceDate(json.dataset?.referenceDate || 'March 2025');
        }
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [category, zone, search, sortBy, sortDir, page, pageSize, apiFetch]);

  const toggleSort = (col: string) => {
    if (sortBy === col) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(col);
      setSortDir('desc');
    }
    setPage(1);
  };

  const activeCategoryObj = CATEGORIES.find((c) => c.key === category) || CATEGORIES[0];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Categorised BMC Data Explorer</h1>
          <p className="text-xs text-slate-600 mt-1">
            Browse validated water connection datasets by category, compare original vs processed fields, inspect the Data Dictionary, or export CSV/XLSX.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <a
            href={`/api/exports/cleaned.csv?zone=${encodeURIComponent(zone)}`}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-[#1E3A8A] text-white rounded-md hover:bg-[#172554]"
          >
            <Download className="w-3.5 h-3.5" />
            Export Filtered CSV
          </a>
          <a
            href="/api/exports/workbook.xlsx"
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-white border border-slate-300 text-slate-800 rounded-md hover:bg-slate-50"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            Download Source Workbook (.xlsx)
          </a>
        </div>
      </div>

      {/* Category Selector Tabs */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-4">
        <div className="flex flex-wrap gap-1.5">
          {CATEGORIES.map((c) => (
            <button
              key={c.key}
              type="button"
              onClick={() => {
                setCategory(c.key);
                setPage(1);
              }}
              className={`px-3 py-1.5 text-xs font-medium rounded-md border transition-colors ${
                category === c.key
                  ? 'bg-[#1E3A8A] text-white border-[#1E3A8A]'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        {/* Selected Category Info Strip */}
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-md flex flex-col md:flex-row md:items-center justify-between gap-2 text-xs">
          <div>
            <span className="font-bold text-slate-900">{activeCategoryObj.label}: </span>
            <span className="text-slate-600">{activeCategoryObj.desc}</span>
          </div>
          <div className="flex items-center gap-3 shrink-0 text-slate-700">
            <span className="inline-flex items-center gap-1 font-semibold text-emerald-700">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Status: {datasetStatus}
            </span>
            <span aria-hidden="true">·</span>
            <span>Records: {totalRecords} wards</span>
            <span aria-hidden="true">·</span>
            <span>Ref: {referenceDate}</span>
          </div>
        </div>

        {/* Mode & Search Controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="inline-flex bg-slate-100 p-1 rounded-md border border-slate-200 self-start">
            <button
              type="button"
              onClick={() => setViewMode('processed')}
              className={`px-3 py-1 text-xs font-medium rounded ${
                viewMode === 'processed' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
              }`}
            >
              Processed Analytical View
            </button>
            <button
              type="button"
              onClick={() => setViewMode('original')}
              className={`px-3 py-1 text-xs font-medium rounded ${
                viewMode === 'original' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
              }`}
            >
              Original Workbook Columns
            </button>
            <button
              type="button"
              onClick={() => setViewMode('dictionary')}
              className={`px-3 py-1 text-xs font-medium rounded inline-flex items-center gap-1 ${
                viewMode === 'dictionary' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
              }`}
            >
              <BookOpen className="w-3 h-3" />
              Data Dictionary ({dictionary.length})
            </button>
          </div>

          {viewMode !== 'dictionary' && (
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  placeholder="Search ward or locality..."
                  className="pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-md bg-white w-52"
                />
              </div>
              <select
                value={zone}
                onChange={(e) => {
                  setZone(e.target.value);
                  setPage(1);
                }}
                className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-md bg-white"
              >
                <option value="ALL">All Zones</option>
                <option value="Island City">Island City</option>
                <option value="Western Suburbs">Western Suburbs</option>
                <option value="Eastern Suburbs">Eastern Suburbs</option>
              </select>
            </div>
          )}
        </div>

        {/* Table Content */}
        {viewMode === 'dictionary' ? (
          <div className="overflow-x-auto border border-slate-200 rounded-md">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 border-b border-slate-200">
                <tr>
                  <th className="px-3 py-2.5 font-semibold">Field Name</th>
                  <th className="px-3 py-2.5 font-semibold">Type</th>
                  <th className="px-3 py-2.5 font-semibold">Status</th>
                  <th className="px-3 py-2.5 font-semibold">Description</th>
                  <th className="px-3 py-2.5 font-semibold">Processing Rule</th>
                  <th className="px-3 py-2.5 font-semibold">Dashboard Usage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {dictionary.map((entry) => (
                  <tr key={entry.fieldName} className="hover:bg-slate-50">
                    <td className="px-3 py-2.5 font-mono-tabular font-semibold text-[#1E3A8A]">{entry.fieldName}</td>
                    <td className="px-3 py-2.5 text-slate-600">{entry.dataType}</td>
                    <td className="px-3 py-2.5 font-medium text-slate-800">{entry.status}</td>
                    <td className="px-3 py-2.5 text-slate-700">{entry.description}</td>
                    <td className="px-3 py-2.5 text-slate-600">{entry.processingRule}</td>
                    <td className="px-3 py-2.5 text-slate-600">{entry.dashboardUsage}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto border border-slate-200 rounded-md">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-700 border-b border-slate-200">
                  {viewMode === 'processed' ? (
                    <tr>
                      <th className="px-3 py-2.5 font-semibold cursor-pointer" onClick={() => toggleSort('wardCode')}>
                        <span className="inline-flex items-center gap-1">Ward <ArrowUpDown className="w-3 h-3" /></span>
                      </th>
                      <th className="px-3 py-2.5 font-semibold">Zone Division</th>
                      <th className="px-3 py-2.5 font-semibold text-right cursor-pointer" onClick={() => toggleSort('commercialTotal')}>
                        <span className="inline-flex items-center gap-1">Commercial <ArrowUpDown className="w-3 h-3" /></span>
                      </th>
                      <th className="px-3 py-2.5 font-semibold text-right cursor-pointer" onClick={() => toggleSort('domesticTotal')}>
                        <span className="inline-flex items-center gap-1">Domestic <ArrowUpDown className="w-3 h-3" /></span>
                      </th>
                      <th className="px-3 py-2.5 font-semibold text-right cursor-pointer" onClick={() => toggleSort('industrialTotal')}>
                        <span className="inline-flex items-center gap-1">Industrial <ArrowUpDown className="w-3 h-3" /></span>
                      </th>
                      <th className="px-3 py-2.5 font-semibold text-right cursor-pointer" onClick={() => toggleSort('meteredTotal')}>
                        <span className="inline-flex items-center gap-1">Metered <ArrowUpDown className="w-3 h-3" /></span>
                      </th>
                      <th className="px-3 py-2.5 font-semibold text-right cursor-pointer" onClick={() => toggleSort('nonMeteredTotal')}>
                        <span className="inline-flex items-center gap-1">Non-Metered <ArrowUpDown className="w-3 h-3" /></span>
                      </th>
                      <th className="px-3 py-2.5 font-semibold text-right cursor-pointer" onClick={() => toggleSort('allConnectionsTotal')}>
                        <span className="inline-flex items-center gap-1">All Total <ArrowUpDown className="w-3 h-3" /></span>
                      </th>
                      <th className="px-3 py-2.5 font-semibold text-right cursor-pointer" onClick={() => toggleSort('nonMeteredPctCalculated')}>
                        <span className="inline-flex items-center gap-1">Non-Metered % <ArrowUpDown className="w-3 h-3" /></span>
                      </th>
                    </tr>
                  ) : (
                    <tr>
                      <th className="px-3 py-2.5 font-semibold">Ward</th>
                      <th className="px-3 py-2.5 font-semibold text-right">Metered_CM</th>
                      <th className="px-3 py-2.5 font-semibold text-right">Metered_DM</th>
                      <th className="px-3 py-2.5 font-semibold text-right">Metered_IND</th>
                      <th className="px-3 py-2.5 font-semibold text-right">Metered_Total</th>
                      <th className="px-3 py-2.5 font-semibold text-right">NonMetered_CM</th>
                      <th className="px-3 py-2.5 font-semibold text-right">NonMetered_DM</th>
                      <th className="px-3 py-2.5 font-semibold text-right">NonMetered_IND</th>
                      <th className="px-3 py-2.5 font-semibold text-right">NonMetered_Total</th>
                      <th className="px-3 py-2.5 font-semibold text-right">All_Connections_Total</th>
                      <th className="px-3 py-2.5 font-semibold text-right">NonMetered_%_Source</th>
                    </tr>
                  )}
                </thead>
                <tbody className="divide-y divide-slate-200 font-mono-tabular">
                  {loading ? (
                    <tr>
                      <td colSpan={11} className="px-3 py-6 text-center text-slate-500 font-sans">
                        Loading records...
                      </td>
                    </tr>
                  ) : items.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="px-3 py-6 text-center text-slate-500 font-sans">
                        No matching ward records found.
                      </td>
                    </tr>
                  ) : viewMode === 'processed' ? (
                    items.map((r) => (
                      <tr key={r.wardCode} className="hover:bg-slate-50">
                        <td className="px-3 py-2 font-sans font-semibold text-[#1E3A8A]">
                          {r.wardCode} <span className="text-[11px] font-normal text-slate-500">({r.majorLocalities.split(',')[0]})</span>
                        </td>
                        <td className="px-3 py-2 font-sans text-slate-700">{r.zoneDivision}</td>
                        <td className="px-3 py-2 text-right">{r.commercialTotal.toLocaleString('en-IN')}</td>
                        <td className="px-3 py-2 text-right">{r.domesticTotal.toLocaleString('en-IN')}</td>
                        <td className="px-3 py-2 text-right">{r.industrialTotal.toLocaleString('en-IN')}</td>
                        <td className="px-3 py-2 text-right text-emerald-700">{r.meteredTotal.toLocaleString('en-IN')}</td>
                        <td className="px-3 py-2 text-right text-sky-700">{r.nonMeteredTotal.toLocaleString('en-IN')}</td>
                        <td className="px-3 py-2 text-right font-semibold text-slate-900">{r.allConnectionsTotal.toLocaleString('en-IN')}</td>
                        <td className="px-3 py-2 text-right">{r.nonMeteredPctCalculated.toFixed(2)}%</td>
                      </tr>
                    ))
                  ) : (
                    items.map((r) => (
                      <tr key={r.wardCode} className="hover:bg-slate-50">
                        <td className="px-3 py-2 font-sans font-semibold text-[#1E3A8A]">{r.wardCode}</td>
                        <td className="px-3 py-2 text-right">{r.meteredCm.toLocaleString('en-IN')}</td>
                        <td className="px-3 py-2 text-right">{r.meteredDm.toLocaleString('en-IN')}</td>
                        <td className="px-3 py-2 text-right">{r.meteredInd.toLocaleString('en-IN')}</td>
                        <td className="px-3 py-2 text-right font-semibold">{r.meteredTotal.toLocaleString('en-IN')}</td>
                        <td className="px-3 py-2 text-right">{r.nonMeteredCm.toLocaleString('en-IN')}</td>
                        <td className="px-3 py-2 text-right">{r.nonMeteredDm.toLocaleString('en-IN')}</td>
                        <td className="px-3 py-2 text-right">{r.nonMeteredInd.toLocaleString('en-IN')}</td>
                        <td className="px-3 py-2 text-right font-semibold">{r.nonMeteredTotal.toLocaleString('en-IN')}</td>
                        <td className="px-3 py-2 text-right font-semibold">{r.allConnectionsTotal.toLocaleString('en-IN')}</td>
                        <td className="px-3 py-2 text-right">{r.nonMeteredPctSource.toFixed(2)}%</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between text-xs text-slate-600 pt-1">
              <span>
                Page {page} of {totalPages} · Showing {items.length} of {totalRecords} ward records
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="px-2.5 py-1 border border-slate-300 rounded bg-white disabled:opacity-40"
                >
                  Previous
                </button>
                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="px-2.5 py-1 border border-slate-300 rounded bg-white disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Future Municipal Datasets Architecture (Honest Empty States) */}
      <div className="bg-white border border-slate-200 rounded-lg p-5">
        <div className="mb-3">
          <h2 className="text-base font-bold text-slate-900">Future BMC Department Datasets (Extensible Schema)</h2>
          <p className="text-xs text-slate-600">
            The portal is architected to onboard additional municipal departments without altering core pipelines. Unimported departments remain clearly labelled as pending rather than fabricated.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {FUTURE_DEPARTMENTS.map((f) => (
            <div key={f.dept} className="p-3.5 border border-dashed border-slate-300 rounded-md bg-slate-50/70">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-slate-800">{f.dept}</span>
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700 shrink-0">
                  <Clock className="w-3 h-3" />
                  {f.status}
                </span>
              </div>
              <p className="text-[11px] text-slate-600 mt-1.5">{f.note}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
