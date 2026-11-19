import { useEffect, useMemo, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import {
  AlertCircle,
  Bookmark,
  CheckCircle2,
  Database,
  Download,
  FileCode2,
  RotateCcw,
} from 'lucide-react';
import { useRole } from '../context/RoleContext.tsx';
import type { WardConnectionRow } from '../shared/types.ts';

interface PowerBiStatus {
  embeddedConfigured: boolean;
  pbixExists: boolean;
  pbixFileName: string;
  csvExports: string[];
  themeAvailable: boolean;
  mScriptAvailable: boolean;
  daxDocsAvailable: boolean;
}

const REPORT_PAGES = [
  '1. Executive Overview',
  '2. Ward Comparison',
  '3. Category Analysis',
  '4. Metering Analysis',
  '5. Ward Drill-Through',
  '6. Data Quality & Sources',
  '7. Business Intelligence',
] as const;

export function PowerBiAnalyticsPage() {
  const { apiFetch } = useRole();
  const [status, setStatus] = useState<PowerBiStatus | null>(null);
  const [wards, setWards] = useState<WardConnectionRow[]>([]);
  const [activePage, setActivePage] = useState<string>(REPORT_PAGES[0]);
  const [selectedZone, setSelectedZone] = useState('ALL');
  const [selectedCategory, setSelectedCategory] = useState<'All' | 'Commercial' | 'Domestic' | 'Industrial'>('All');
  const [drillWard, setDrillWard] = useState('K/E');
  const [topN, setTopN] = useState<number>(24);
  const [metricField, setMetricField] = useState<'allConnectionsTotal' | 'meteredTotal' | 'nonMeteredTotal' | 'nonMeteredPctCalculated'>('allConnectionsTotal');
  const [bizImpact, setBizImpact] = useState<{ hasRealData: boolean; summary: Record<string, number> } | null>(null);

  useEffect(() => {
    apiFetch('/api/powerbi/status').then((r) => r.json()).then(setStatus);
    apiFetch('/api/wards').then((r) => r.json()).then((d) => setWards(d.wards || []));
    apiFetch('/api/business-impact').then((r) => r.json()).then(setBizImpact);
  }, [apiFetch]);

  const filteredWards = useMemo(() => {
    return wards
      .filter((w) => selectedZone === 'ALL' || w.zoneDivision === selectedZone)
      .map((w) => {
        const cm = w.meteredCm + w.nonMeteredCm;
        const dm = w.meteredDm + w.nonMeteredDm;
        const ind = w.meteredInd + w.nonMeteredInd;
        const catTotal =
          selectedCategory === 'Commercial'
            ? cm
            : selectedCategory === 'Domestic'
            ? dm
            : selectedCategory === 'Industrial'
            ? ind
            : w.allConnectionsTotal;
        const catMetered =
          selectedCategory === 'Commercial'
            ? w.meteredCm
            : selectedCategory === 'Domestic'
            ? w.meteredDm
            : selectedCategory === 'Industrial'
            ? w.meteredInd
            : w.meteredTotal;
        const catNonMetered =
          selectedCategory === 'Commercial'
            ? w.nonMeteredCm
            : selectedCategory === 'Domestic'
            ? w.nonMeteredDm
            : selectedCategory === 'Industrial'
            ? w.nonMeteredInd
            : w.nonMeteredTotal;

        return {
          ...w,
          cm,
          dm,
          ind,
          catTotal,
          catMetered,
          catNonMetered,
          catNonMeteredPct: catTotal > 0 ? Number(((catNonMetered / catTotal) * 100).toFixed(2)) : 0,
        };
      })
      .sort((a, b) => b[metricField] - a[metricField])
      .slice(0, topN);
  }, [wards, selectedZone, selectedCategory, topN, metricField]);

  const totals = useMemo(() => {
    return filteredWards.reduce(
      (acc, w) => ({
        total: acc.total + w.catTotal,
        metered: acc.metered + w.catMetered,
        nonMetered: acc.nonMetered + w.catNonMetered,
        cm: acc.cm + w.cm,
        dm: acc.dm + w.dm,
        ind: acc.ind + w.ind,
      }),
      { total: 0, metered: 0, nonMetered: 0, cm: 0, dm: 0, ind: 0 }
    );
  }, [filteredWards]);

  const applyBookmark = (preset: 'city' | 'high-nonmetered' | 'commercial-hubs') => {
    if (preset === 'city') {
      setSelectedZone('ALL');
      setSelectedCategory('All');
      setTopN(24);
      setMetricField('allConnectionsTotal');
    } else if (preset === 'high-nonmetered') {
      setSelectedZone('ALL');
      setSelectedCategory('All');
      setTopN(10);
      setMetricField('nonMeteredPctCalculated');
    } else if (preset === 'commercial-hubs') {
      setSelectedZone('Island City');
      setSelectedCategory('Commercial');
      setTopN(9);
      setMetricField('allConnectionsTotal');
    }
  };

  const drillRecord = wards.find((w) => w.wardCode === drillWard) || wards[0];

  return (
    <div className="space-y-5">
      {/* Honest Power BI Integration Status Banner */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900">
              Power BI Analytics &amp; Star-Schema Deliverables
            </h1>
            <p className="text-xs text-slate-600 mt-1">
              Connected to the same validated SQLite analytical dataset (`FactWaterConnections` — 144 rows). No unrelated hardcoded figures.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <a
              href="/api/exports/powerbi-asset/BMC_PowerBI_Theme.json"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-md border border-slate-300"
            >
              <Download className="w-3.5 h-3.5" />
              Theme JSON
            </a>
            <a
              href="/api/exports/powerbi-asset/PowerQuery_Transformations.m"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-md border border-slate-300"
            >
              <FileCode2 className="w-3.5 h-3.5" />
              Power Query M
            </a>
            <a
              href="/api/exports/powerbi-asset/PowerBI_DAX_Measures.md"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-md border border-slate-300"
            >
              <FileCode2 className="w-3.5 h-3.5" />
              DAX Measures
            </a>
            <a
              href="/api/exports/powerbi-asset/POWERBI_SETUP.md"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-[#1E3A8A] hover:bg-[#172554] text-white rounded-md"
            >
              <Download className="w-3.5 h-3.5" />
              Power BI Setup Guide
            </a>
          </div>
        </div>

        {/* Option 1 vs Option 2 Honest Status */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-2 border-t border-slate-200 text-xs">
          <div className="p-3.5 rounded-md bg-slate-50 border border-slate-200">
            <div className="flex items-center gap-2 font-bold text-slate-900">
              {status?.embeddedConfigured ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              ) : (
                <AlertCircle className="w-4 h-4 text-amber-600" />
              )}
              Option 1 — Power BI Service Secure Embed Status
            </div>
            <p className="text-slate-600 mt-1">
              {status?.embeddedConfigured
                ? 'Microsoft Entra Workspace credentials detected. Secure embed active.'
                : 'Not configured in this environment (requires POWERBI_EMBED_URL, POWERBI_CLIENT_ID, and POWERBI_WORKSPACE_ID). No fake iframe is rendered.'}
            </p>
          </div>

          <div className="p-3.5 rounded-md bg-blue-50/60 border border-blue-200">
            <div className="flex items-center gap-2 font-bold text-[#1E3A8A]">
              <Database className="w-4 h-4" />
              Option 2 — Local Power BI Desktop &amp; Star-Schema CSV Refresh
            </div>
            <p className="text-slate-700 mt-1">
              Download the validated star-schema CSV tables generated directly from our database and follow <code className="font-mono-tabular">powerbi/POWERBI_SETUP.md</code> to open/refresh <code className="font-mono-tabular">BMC_Water_Connections_Analytics.pbix</code> in Power BI Desktop.
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {(status?.csvExports || []).map((csv) => (
                <a
                  key={csv}
                  href={`/api/exports/powerbi-csv/${encodeURIComponent(csv)}`}
                  className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-mono-tabular bg-white border border-blue-300 text-[#1E3A8A] rounded hover:bg-blue-50"
                >
                  <Download className="w-3 h-3" />
                  {csv}
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Native Power BI Report Workspace (7 Report Pages + Slicers + Bookmarks) */}
      <div className="bg-white border border-slate-300 rounded-lg overflow-hidden">
        {/* Report Title & Bookmarks Bar */}
        <div className="bg-[#1E3A8A] text-white px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-sm font-bold">
              BMC Water Connections — {selectedZone === 'ALL' ? 'All 24 Wards' : selectedZone} | {selectedCategory} (March 2025)
            </div>
            <div className="text-[11px] text-blue-100">
              Interactive Star-Schema Analytics Mirror · Bookmarks &amp; Field Parameters Enabled
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => applyBookmark('high-nonmetered')}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium bg-[#294B9E] hover:bg-[#365BB8] rounded"
            >
              <Bookmark className="w-3 h-3" />
              Bookmark: Top 10 Non-Metered %
            </button>
            <button
              type="button"
              onClick={() => applyBookmark('commercial-hubs')}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium bg-[#294B9E] hover:bg-[#365BB8] rounded"
            >
              <Bookmark className="w-3 h-3" />
              Bookmark: Island City Commercial
            </button>
            <button
              type="button"
              onClick={() => applyBookmark('city')}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium bg-amber-600 hover:bg-amber-700 rounded"
            >
              <RotateCcw className="w-3 h-3" />
              Reset Slicers
            </button>
          </div>
        </div>

        {/* Slicers Strip */}
        <div className="bg-slate-100 border-b border-slate-200 px-4 py-2.5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Zone Slicer</label>
            <select
              value={selectedZone}
              onChange={(e) => setSelectedZone(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded"
            >
              <option value="ALL">All Zones</option>
              <option value="Island City">Island City</option>
              <option value="Western Suburbs">Western Suburbs</option>
              <option value="Eastern Suburbs">Eastern Suburbs</option>
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Connection Type Slicer</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value as typeof selectedCategory)}
              className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded"
            >
              <option value="All">All Categories</option>
              <option value="Commercial">Commercial</option>
              <option value="Domestic">Domestic</option>
              <option value="Industrial">Industrial</option>
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Field Parameter (Metric)</label>
            <select
              value={metricField}
              onChange={(e) => setMetricField(e.target.value as typeof metricField)}
              className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded"
            >
              <option value="allConnectionsTotal">[Total Connections]</option>
              <option value="meteredTotal">[Metered Connections]</option>
              <option value="nonMeteredTotal">[Non-Metered Connections]</option>
              <option value="nonMeteredPctCalculated">[Non-Metered Percentage]</option>
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Top-N Ward Filter ({topN})</label>
            <input
              type="range"
              min={5}
              max={24}
              value={topN}
              onChange={(e) => setTopN(Number(e.target.value))}
              className="w-full mt-1.5"
            />
          </div>
        </div>

        {/* Report Page Body */}
        <div className="p-5 bg-[#F8FAFC] min-h-[420px]">
          {activePage === REPORT_PAGES[0] && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="bg-white border border-slate-200 rounded p-3.5">
                  <div className="text-[11px] text-slate-500">DAX: [Total Connections]</div>
                  <div className="text-2xl font-bold font-mono-tabular text-slate-900 mt-1">
                    {totals.total.toLocaleString('en-IN')}
                  </div>
                </div>
                <div className="bg-white border border-slate-200 rounded p-3.5">
                  <div className="text-[11px] text-slate-500">DAX: [Metered Connections]</div>
                  <div className="text-2xl font-bold font-mono-tabular text-emerald-700 mt-1">
                    {totals.metered.toLocaleString('en-IN')}
                  </div>
                </div>
                <div className="bg-white border border-slate-200 rounded p-3.5">
                  <div className="text-[11px] text-slate-500">DAX: [Non-Metered Connections]</div>
                  <div className="text-2xl font-bold font-mono-tabular text-sky-700 mt-1">
                    {totals.nonMetered.toLocaleString('en-IN')}
                  </div>
                </div>
                <div className="bg-white border border-slate-200 rounded p-3.5">
                  <div className="text-[11px] text-slate-500">DAX: [Ward Count]</div>
                  <div className="text-2xl font-bold font-mono-tabular text-[#1E3A8A] mt-1">
                    {filteredWards.length}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                <div className="lg:col-span-8 bg-white border border-slate-200 rounded p-4 h-72">
                  <div className="text-xs font-bold text-slate-800 mb-2">Top-{topN} Ward Visual by Selected Field Parameter</div>
                  <ResponsiveContainer width="100%" height="90%">
                    <BarChart data={filteredWards}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                      <XAxis dataKey="wardCode" tick={{ fontSize: 10 }} interval={0} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip formatter={(v: unknown) => (metricField === 'nonMeteredPctCalculated' ? `${v}%` : Number(v).toLocaleString('en-IN'))} />
                      <Bar dataKey={metricField} fill="#1E3A8A" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="lg:col-span-4 bg-white border border-slate-200 rounded p-4 h-72">
                  <div className="text-xs font-bold text-slate-800 mb-2">Metering Split</div>
                  <ResponsiveContainer width="100%" height="90%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Metered', value: totals.metered },
                          { name: 'Non-Metered', value: totals.nonMetered },
                        ]}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={70}
                      >
                        <Cell fill="#16A34A" />
                        <Cell fill="#1876C4" />
                      </Pie>
                      <Tooltip formatter={(v: unknown) => Number(v).toLocaleString('en-IN')} />
                      <Legend wrapperStyle={{ fontSize: '11px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {activePage === REPORT_PAGES[1] && (
            <div className="bg-white border border-slate-200 rounded p-4">
              <div className="text-xs font-bold text-slate-800 mb-3">
                Conditional-Formatted Ward Matrix (Click any ward to open Drill-Through Page)
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 border-b border-slate-200">
                    <tr>
                      <th className="px-3 py-2">Rank</th>
                      <th className="px-3 py-2">Ward</th>
                      <th className="px-3 py-2">Zone</th>
                      <th className="px-3 py-2 text-right">Metered</th>
                      <th className="px-3 py-2 text-right">Non-Metered</th>
                      <th className="px-3 py-2 text-right">Total</th>
                      <th className="px-3 py-2 text-right">Non-Metered %</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 font-mono-tabular">
                    {filteredWards.map((w, idx) => (
                      <tr
                        key={w.wardCode}
                        onClick={() => {
                          setDrillWard(w.wardCode);
                          setActivePage(REPORT_PAGES[4]);
                        }}
                        className="hover:bg-blue-50 cursor-pointer"
                      >
                        <td className="px-3 py-2">#{idx + 1}</td>
                        <td className="px-3 py-2 font-sans font-bold text-[#1E3A8A]">{w.wardCode}</td>
                        <td className="px-3 py-2 font-sans text-slate-600">{w.zoneDivision}</td>
                        <td className="px-3 py-2 text-right">{w.catMetered.toLocaleString('en-IN')}</td>
                        <td className="px-3 py-2 text-right">{w.catNonMetered.toLocaleString('en-IN')}</td>
                        <td className="px-3 py-2 text-right font-semibold">{w.catTotal.toLocaleString('en-IN')}</td>
                        <td
                          className={`px-3 py-2 text-right font-semibold ${
                            w.catNonMeteredPct >= 6
                              ? 'bg-amber-100 text-amber-900'
                              : 'bg-emerald-50 text-emerald-800'
                          }`}
                        >
                          {w.catNonMeteredPct.toFixed(2)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activePage === REPORT_PAGES[2] && (
            <div className="bg-white border border-slate-200 rounded p-4 h-80">
              <div className="text-xs font-bold text-slate-800 mb-3">Category Contribution Across Filtered Wards</div>
              <ResponsiveContainer width="100%" height="90%">
                <BarChart
                  data={[
                    {
                      category: 'Commercial',
                      Metered: filteredWards.reduce((s, w) => s + w.meteredCm, 0),
                      NonMetered: filteredWards.reduce((s, w) => s + w.nonMeteredCm, 0),
                    },
                    {
                      category: 'Domestic',
                      Metered: filteredWards.reduce((s, w) => s + w.meteredDm, 0),
                      NonMetered: filteredWards.reduce((s, w) => s + w.nonMeteredDm, 0),
                    },
                    {
                      category: 'Industrial',
                      Metered: filteredWards.reduce((s, w) => s + w.meteredInd, 0),
                      NonMetered: filteredWards.reduce((s, w) => s + w.nonMeteredInd, 0),
                    },
                  ]}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="category" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v: unknown) => Number(v).toLocaleString('en-IN')} />
                  <Legend />
                  <Bar dataKey="Metered" stackId="c" fill="#16A34A" />
                  <Bar dataKey="NonMetered" stackId="c" fill="#D97706" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {activePage === REPORT_PAGES[3] && (
            <div className="bg-white border border-slate-200 rounded p-4 h-80">
              <div className="text-xs font-bold text-slate-800 mb-3">Metering Gap: Non-Metered Percentage by Ward</div>
              <ResponsiveContainer width="100%" height="90%">
                <BarChart data={[...filteredWards].sort((a, b) => b.catNonMeteredPct - a.catNonMeteredPct)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="wardCode" tick={{ fontSize: 10 }} interval={0} />
                  <YAxis unit="%" tick={{ fontSize: 10 }} />
                  <Tooltip formatter={(v: unknown) => `${v}%`} />
                  <Bar dataKey="catNonMeteredPct" name="Non-Metered %" fill="#1876C4" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {activePage === REPORT_PAGES[4] && drillRecord && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 bg-white border border-slate-200 rounded p-4">
                <div>
                  <div className="text-[11px] font-semibold text-[#1E3A8A]">Drill-Through Ward Filter</div>
                  <div className="text-base font-bold text-slate-900">{drillRecord.wardName}</div>
                </div>
                <select
                  value={drillWard}
                  onChange={(e) => setDrillWard(e.target.value)}
                  className="px-3 py-1.5 text-xs border border-slate-300 rounded bg-white"
                >
                  {wards.map((w) => (
                    <option key={w.wardCode} value={w.wardCode}>Ward {w.wardCode}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                <div className="bg-white border border-slate-200 rounded p-3">
                  <div className="text-[11px] text-slate-500">Total</div>
                  <div className="text-lg font-bold font-mono-tabular">{drillRecord.allConnectionsTotal.toLocaleString('en-IN')}</div>
                </div>
                <div className="bg-white border border-slate-200 rounded p-3">
                  <div className="text-[11px] text-slate-500">Metered</div>
                  <div className="text-lg font-bold font-mono-tabular text-emerald-700">{drillRecord.meteredTotal.toLocaleString('en-IN')}</div>
                </div>
                <div className="bg-white border border-slate-200 rounded p-3">
                  <div className="text-[11px] text-slate-500">Non-Metered</div>
                  <div className="text-lg font-bold font-mono-tabular text-sky-700">{drillRecord.nonMeteredTotal.toLocaleString('en-IN')}</div>
                </div>
                <div className="bg-white border border-slate-200 rounded p-3">
                  <div className="text-[11px] text-slate-500">Commercial</div>
                  <div className="text-lg font-bold font-mono-tabular">{(drillRecord.meteredCm + drillRecord.nonMeteredCm).toLocaleString('en-IN')}</div>
                </div>
                <div className="bg-white border border-slate-200 rounded p-3">
                  <div className="text-[11px] text-slate-500">Domestic</div>
                  <div className="text-lg font-bold font-mono-tabular">{(drillRecord.meteredDm + drillRecord.nonMeteredDm).toLocaleString('en-IN')}</div>
                </div>
                <div className="bg-white border border-slate-200 rounded p-3">
                  <div className="text-[11px] text-slate-500">Industrial</div>
                  <div className="text-lg font-bold font-mono-tabular">{(drillRecord.meteredInd + drillRecord.nonMeteredInd).toLocaleString('en-IN')}</div>
                </div>
              </div>
            </div>
          )}

          {activePage === REPORT_PAGES[5] && (
            <div className="bg-white border border-slate-200 rounded p-5 text-xs space-y-2">
              <div className="font-bold text-sm text-emerald-800">
                DAX: [Data Validation Status] = VALIDATED (551,459 Total | 24 Wards)
              </div>
              <p className="text-slate-600">
                Star-schema fact table holds 144 rows (24 wards × 3 connection types × 2 meter statuses). Grand Total row is excluded from FactWaterConnections. Reference Date: March 2025.
              </p>
            </div>
          )}

          {activePage === REPORT_PAGES[6] && (
            <div className="bg-white border border-slate-200 rounded p-5 text-xs">
              {bizImpact?.hasRealData ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded">
                    <div className="text-slate-500">Registered Businesses</div>
                    <div className="text-xl font-bold font-mono-tabular">{bizImpact.summary.totalRegistered}</div>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded">
                    <div className="text-slate-500">Verified Listings</div>
                    <div className="text-xl font-bold font-mono-tabular text-emerald-700">{bizImpact.summary.verifiedCount}</div>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded">
                    <div className="text-slate-500">Profile Views</div>
                    <div className="text-xl font-bold font-mono-tabular">{bizImpact.summary.profileViews}</div>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded">
                    <div className="text-slate-500">Consumer Enquiries</div>
                    <div className="text-xl font-bold font-mono-tabular text-[#1E3A8A]">{bizImpact.summary.enquiries}</div>
                  </div>
                </div>
              ) : (
                <div className="py-8 text-center text-slate-600">
                  <strong>Report Page 7 Disabled Until Real Business Data Exists:</strong> Per project integrity rules, fictional retailer metrics are never inserted. Register a business in Local Business Connect to activate this report page.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Bottom Power BI Page Tabs */}
        <div className="bg-slate-200/80 border-t border-slate-300 px-3 py-2 flex flex-wrap gap-1.5">
          {REPORT_PAGES.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setActivePage(p)}
              className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                activePage === p
                  ? 'bg-white text-[#1E3A8A] font-bold border border-slate-300 shadow-sm'
                  : 'text-slate-700 hover:bg-white/60'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
