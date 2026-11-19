import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
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
  BarChart3,
  BookOpen,
  Download,
  Droplets,
  FilterX,
  Info,
  Search,
  X,
} from 'lucide-react';
import { useRole } from '../context/RoleContext.tsx';

interface DashboardResponse {
  dataset: {
    datasetName: string;
    version: string;
    referenceDate: string;
    source: string;
    status: string;
  };
  kpis: {
    totalConnections: number;
    meteredConnections: number;
    nonMeteredConnections: number;
    wardsCovered: number;
    totalWardsInDataset: number;
    meteredPct: number;
    nonMeteredPct: number;
  };
  meteringSplit: Array<{ name: string; value: number; share: number }>;
  categoryBreakdown: Array<{ category: string; metered: number; nonMetered: number; total: number }>;
  wardSeries: Array<{
    wardCode: string;
    wardName: string;
    zoneDivision: string;
    metered: number;
    nonMetered: number;
    commercial: number;
    domestic: number;
    industrial: number;
    total: number;
    nonMeteredPct: number;
  }>;
  allWardsMeta: Array<{
    wardCode: string;
    wardName: string;
    zoneDivision: string;
    majorLocalities: string;
  }>;
}

export function HomeDashboardPage() {
  const { apiFetch } = useRole();
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Interactive controls
  const [ward, setWard] = useState('ALL');
  const [category, setCategory] = useState('ALL');
  const [meterStatus, setMeterStatus] = useState('ALL');
  const [zone, setZone] = useState('ALL');
  const [search, setSearch] = useState('');
  const [showMethodology, setShowMethodology] = useState(false);

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const params = new URLSearchParams();
        if (ward !== 'ALL') params.set('ward', ward);
        if (category !== 'ALL') params.set('category', category);
        if (meterStatus !== 'ALL') params.set('meterStatus', meterStatus);
        if (zone !== 'ALL') params.set('zone', zone);
        if (search.trim()) params.set('search', search.trim());

        const res = await apiFetch(`/api/dashboard?${params.toString()}`);
        if (!res.ok) throw new Error('Failed to load dashboard statistics');
        const json = await res.json();
        if (active) setData(json);
      } catch (err) {
        if (active) setError((err as Error).message);
      } finally {
        if (active) setLoading(false);
      }
    };
    const t = setTimeout(load, 120);
    return () => {
      active = false;
      clearTimeout(t);
    };
  }, [ward, category, meterStatus, zone, search, apiFetch]);

  const clearFilters = () => {
    setWard('ALL');
    setCategory('ALL');
    setMeterStatus('ALL');
    setZone('ALL');
    setSearch('');
  };

  const hasActiveFilters =
    ward !== 'ALL' || category !== 'ALL' || meterStatus !== 'ALL' || zone !== 'ALL' || search.trim() !== '';

  const downloadFilteredCsv = () => {
    const params = new URLSearchParams();
    if (ward !== 'ALL') params.set('ward', ward);
    if (zone !== 'ALL') params.set('zone', zone);
    window.location.href = `/api/exports/cleaned.csv?${params.toString()}`;
  };

  return (
    <div className="space-y-5">
      {/* Government-style Main Dashboard Banner (Inspired by BMC Public Dashboard Screenshot) */}
      <section className="bg-[#CBD5E1]/70 border border-slate-300 rounded-lg p-4 sm:p-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-12 h-12 rounded-md bg-white border border-slate-300 flex items-center justify-center shrink-0 text-[#1E3A8A]">
              <Droplets className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-[#0F172A] tracking-tight">
                BMC Water Connections Dashboard
              </h1>
              <p className="text-xs sm:text-sm text-slate-700 mt-0.5">
                Ward-wise Water Connection Statistics | Reference: {data?.dataset.referenceDate || 'March 2025'} | Source: Praja May 2025 RTI Report (Table 5)
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative flex-1 sm:flex-initial">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Filter ward or locality..."
                className="w-full sm:w-56 pl-9 pr-3 py-2 text-xs bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
              />
            </div>

            <button
              type="button"
              onClick={downloadFilteredCsv}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-[#294370] hover:bg-[#1E3256] text-white rounded-md transition-colors whitespace-nowrap"
            >
              <Download className="w-3.5 h-3.5" />
              Download CSV
            </button>

            <button
              type="button"
              onClick={() => setShowMethodology(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-[#294370] hover:bg-[#1E3256] text-white rounded-md transition-colors whitespace-nowrap"
            >
              <Info className="w-3.5 h-3.5" />
              Methodology
            </button>

            <Link
              to="/powerbi"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-white hover:bg-slate-50 text-[#1E3A8A] border border-slate-300 rounded-md transition-colors whitespace-nowrap"
            >
              <BarChart3 className="w-3.5 h-3.5" />
              Power BI Analytics
            </Link>
          </div>
        </div>

        {/* Interactive Slicers & Filter Strip */}
        <div className="mt-4 pt-3.5 border-t border-slate-300/80 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
          <div>
            <label htmlFor="dash-ward" className="block text-[11px] font-semibold text-slate-700 mb-1">
              BMC Ward Selector
            </label>
            <select
              id="dash-ward"
              value={ward}
              onChange={(e) => setWard(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-md text-slate-900"
            >
              <option value="ALL">All 24 Wards (City Total)</option>
              {data?.allWardsMeta.map((w) => (
                <option key={w.wardCode} value={w.wardCode}>
                  {w.wardCode} — {w.zoneDivision}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="dash-zone" className="block text-[11px] font-semibold text-slate-700 mb-1">
              Zone Division
            </label>
            <select
              id="dash-zone"
              value={zone}
              onChange={(e) => setZone(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-md text-slate-900"
            >
              <option value="ALL">All Mumbai Zones</option>
              <option value="Island City">Island City (9 Wards)</option>
              <option value="Western Suburbs">Western Suburbs (9 Wards)</option>
              <option value="Eastern Suburbs">Eastern Suburbs (6 Wards)</option>
            </select>
          </div>

          <div>
            <label htmlFor="dash-category" className="block text-[11px] font-semibold text-slate-700 mb-1">
              Connection Category
            </label>
            <select
              id="dash-category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-md text-slate-900"
            >
              <option value="ALL">All Categories (CM + DM + IND)</option>
              <option value="Commercial">Commercial (CM)</option>
              <option value="Domestic">Domestic (DM)</option>
              <option value="Industrial">Industrial (IND)</option>
            </select>
          </div>

          <div>
            <label htmlFor="dash-meter" className="block text-[11px] font-semibold text-slate-700 mb-1">
              Metering Status
            </label>
            <select
              id="dash-meter"
              value={meterStatus}
              onChange={(e) => setMeterStatus(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-md text-slate-900"
            >
              <option value="ALL">Both Metered &amp; Non-Metered</option>
              <option value="Metered">Metered Only</option>
              <option value="Non-Metered">Non-Metered Only</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={clearFilters}
              disabled={!hasActiveFilters}
              className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FilterX className="w-3.5 h-3.5" />
              Clear Filters
            </button>
          </div>
        </div>
      </section>

      {error && (
        <div className="p-4 bg-red-50 border border-red-300 text-red-800 rounded-md text-sm">
          {error}
        </div>
      )}

      {/* 4 Government-Style Colored KPI Cards (Directly Inspired by Reference Screenshot) */}
      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Card 1: Orange — Total Water Connections */}
        <div className="bg-[#C87D18] text-white rounded-lg p-5 border border-[#B06D14] flex flex-col justify-between">
          <div>
            <div className="text-xs font-bold tracking-wide uppercase text-amber-100">
              Total Water Connections
            </div>
            <div className="mt-2 text-3xl font-bold font-mono-tabular">
              {loading ? '—' : data?.kpis.totalConnections.toLocaleString('en-IN')}
            </div>
            <div className="mt-1 text-xs text-amber-50">
              Filtered across {data?.kpis.wardsCovered ?? 24} BMC wards · March 2025
            </div>
          </div>
          <div className="mt-4 h-1.5 w-full bg-white/25 rounded-full overflow-hidden">
            <div className="h-full bg-white/90 rounded-full" style={{ width: '100%' }} />
          </div>
        </div>

        {/* Card 2: Green — Metered Connections */}
        <div className="bg-[#3E9C42] text-white rounded-lg p-5 border border-[#328536] flex flex-col justify-between">
          <div>
            <div className="text-xs font-bold tracking-wide uppercase text-emerald-100">
              Metered Connections
            </div>
            <div className="mt-2 text-3xl font-bold font-mono-tabular">
              {loading ? '—' : data?.kpis.meteredConnections.toLocaleString('en-IN')}
            </div>
            <div className="mt-1 text-xs text-emerald-50">
              {data ? `${data.kpis.meteredPct}% of filtered connections` : 'Calculating share...'}
            </div>
          </div>
          <div className="mt-4 h-1.5 w-full bg-white/25 rounded-full overflow-hidden">
            <div
              className="h-full bg-white/90 rounded-full"
              style={{ width: `${data?.kpis.meteredPct ?? 95.95}%` }}
            />
          </div>
        </div>

        {/* Card 3: Blue — Non-Metered Connections */}
        <div className="bg-[#1876C4] text-white rounded-lg p-5 border border-[#1463A6] flex flex-col justify-between">
          <div>
            <div className="text-xs font-bold tracking-wide uppercase text-sky-100">
              Non-Metered Connections
            </div>
            <div className="mt-2 text-3xl font-bold font-mono-tabular">
              {loading ? '—' : data?.kpis.nonMeteredConnections.toLocaleString('en-IN')}
            </div>
            <div className="mt-1 text-xs text-sky-50">
              {data ? `${data.kpis.nonMeteredPct}% non-metered share` : 'Calculating share...'}
            </div>
          </div>
          <div className="mt-4 h-1.5 w-full bg-white/25 rounded-full overflow-hidden">
            <div
              className="h-full bg-white/90 rounded-full"
              style={{ width: `${Math.max(4, data?.kpis.nonMeteredPct ?? 4.05)}%` }}
            />
          </div>
        </div>

        {/* Card 4: Crimson — BMC Wards Covered / Validation */}
        <div className="bg-[#C43C4B] text-white rounded-lg p-5 border border-[#A6303D] flex flex-col justify-between">
          <div>
            <div className="text-xs font-bold tracking-wide uppercase text-rose-100">
              BMC Wards Covered
            </div>
            <div className="mt-2 text-3xl font-bold font-mono-tabular">
              {loading ? '—' : `${data?.kpis.wardsCovered ?? 24} / ${data?.kpis.totalWardsInDataset ?? 24}`}
            </div>
            <div className="mt-1 text-xs text-rose-50">
              Status: {data?.dataset.status || 'Validated'} · Grand Total excluded
            </div>
          </div>
          <div className="mt-4 h-1.5 w-full bg-white/25 rounded-full overflow-hidden">
            <div
              className="h-full bg-white/90 rounded-full"
              style={{
                width: `${
                  data && data.kpis.totalWardsInDataset > 0
                    ? (data.kpis.wardsCovered / data.kpis.totalWardsInDataset) * 100
                    : 100
                }%`,
              }}
            />
          </div>
        </div>
      </section>

      {/* Main Analytical Charts (4 Interactive Charts) */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Chart 1: Ward-Wise Stacked Connections */}
        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-lg overflow-hidden">
          <div className="px-4 py-3 bg-[#E2E8F0] border-b border-slate-300 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900">
              Ward-Wise Water Connection Distribution (Metered vs Non-Metered)
            </h2>
            <span className="text-xs text-slate-600 font-mono-tabular">
              {data?.wardSeries.length || 0} wards shown
            </span>
          </div>
          <div className="p-4 h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.wardSeries || []} margin={{ top: 10, right: 12, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="wardCode" tick={{ fontSize: 11, fill: '#334155' }} interval={0} />
                <YAxis tick={{ fontSize: 11, fill: '#334155' }} />
                <Tooltip
                  formatter={(value: unknown) => Number(value).toLocaleString('en-IN')}
                  contentStyle={{ fontSize: '12px', borderRadius: '6px', borderColor: '#CBD5E1' }}
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Bar dataKey="metered" name="Metered" stackId="a" fill="#16A34A" />
                <Bar dataKey="nonMetered" name="Non-Metered" stackId="a" fill="#1876C4" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Metered vs Non-Metered Composition */}
        <div className="lg:col-span-4 bg-white border border-slate-200 rounded-lg overflow-hidden">
          <div className="px-4 py-3 bg-[#E2E8F0] border-b border-slate-300 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900">
              Metered vs Non-Metered Share
            </h2>
            <span className="text-xs text-slate-600">Filtered Scope</span>
          </div>
          <div className="p-4 h-80 flex flex-col">
            <div className="flex-1 min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data?.meteringSplit || []}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={52}
                    outerRadius={82}
                    paddingAngle={2}
                  >
                    <Cell fill="#16A34A" />
                    <Cell fill="#1876C4" />
                  </Pie>
                  <Tooltip formatter={(value: unknown) => Number(value).toLocaleString('en-IN')} />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="pt-2 border-t border-slate-100 text-xs text-slate-600 flex justify-between font-mono-tabular">
              <span>Metered: {data?.kpis.meteredPct ?? 0}%</span>
              <span>Non-Metered: {data?.kpis.nonMeteredPct ?? 0}%</span>
            </div>
          </div>
        </div>

        {/* Chart 3: Commercial, Domestic & Industrial Distribution */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-lg overflow-hidden">
          <div className="px-4 py-3 bg-[#E2E8F0] border-b border-slate-300 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900">
              Category Distribution (Commercial, Domestic, Industrial)
            </h2>
          </div>
          <div className="p-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.categoryBreakdown || []} layout="vertical" margin={{ top: 8, right: 20, left: 20, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#334155' }} />
                <YAxis type="category" dataKey="category" tick={{ fontSize: 12, fill: '#0F172A' }} width={82} />
                <Tooltip formatter={(value: unknown) => Number(value).toLocaleString('en-IN')} />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Bar dataKey="metered" name="Metered" stackId="cat" fill="#16A34A" />
                <Bar dataKey="nonMetered" name="Non-Metered" stackId="cat" fill="#D97706" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 4: Non-Metered Share (%) by Ward */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-lg overflow-hidden">
          <div className="px-4 py-3 bg-[#E2E8F0] border-b border-slate-300 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900">
              Non-Metered Connection Share (%) by Ward
            </h2>
            <span className="text-xs text-slate-600">City Baseline: 4.05%</span>
          </div>
          <div className="p-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.wardSeries || []} margin={{ top: 10, right: 12, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="wardCode" tick={{ fontSize: 11, fill: '#334155' }} interval={0} />
                <YAxis unit="%" tick={{ fontSize: 11, fill: '#334155' }} />
                <Tooltip formatter={(value: unknown) => `${value}%`} />
                <Bar dataKey="nonMeteredPct" name="Non-Metered %" fill="#D97706" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      {/* Source Footnote & Quick Links */}
      <section className="bg-white border border-slate-200 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-600">
        <div>
          <span className="font-semibold text-slate-800">Source Provenance: </span>
          {data?.dataset.source || 'Praja Foundation (compiled from BMC RTI Disclosures)'} · Reference: {data?.dataset.referenceDate || 'March 2025'} · Connection counts do not measure water pressure or supply quality.
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <Link to="/sources" className="text-[#1E3A8A] font-semibold hover:underline inline-flex items-center gap-1">
            <BookOpen className="w-3.5 h-3.5" />
            View Provenance
          </Link>
          <Link to="/wards" className="text-[#1E3A8A] font-semibold hover:underline">
            All 24 Wards →
          </Link>
        </div>
      </section>

      {/* Methodology Modal */}
      {showMethodology && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-lg max-w-xl w-full p-5 space-y-4 shadow-lg">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-base font-bold text-slate-900">
                Data Methodology &amp; Validation Rules
              </h3>
              <button
                type="button"
                onClick={() => setShowMethodology(false)}
                className="p-1 rounded hover:bg-slate-100 text-slate-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="text-xs text-slate-700 space-y-2.5 leading-relaxed">
              <p>
                <strong>1. Primary Data Source:</strong> Extracted from <em>Praja Report on the Status of Civic Issues in Mumbai (May 2025, Table 5, page 14)</em>, reproducing BMC RTI water connection counts as of <strong>March 2025</strong>.
              </p>
              <p>
                <strong>2. Grand Total Exclusion:</strong> The source sheet contains 24 administrative wards (A through T) plus 1 <em>Grand Total</em> row. The ETL pipeline separates the Grand Total row for reconciliation only so it is never counted as a 25th ward.
              </p>
              <p>
                <strong>3. Category Reconciliation:</strong> Commercial (79,961), Domestic (465,043), and Industrial (6,455) totals are summed from metered + non-metered columns and verified against 529,123 metered, 22,336 non-metered, and 551,459 total connections.
              </p>
              <p>
                <strong>4. Interpretation Boundary:</strong> High or low connection counts reflect infrastructure connections in a ward; they must not be interpreted as water supply quality, pressure adequacy, or service reliability.
              </p>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
              <Link
                to="/etl"
                onClick={() => setShowMethodology(false)}
                className="px-3 py-1.5 text-xs font-semibold bg-[#1E3A8A] text-white rounded-md hover:bg-[#172554]"
              >
                Inspect 10-Stage ETL
              </Link>
              <button
                type="button"
                onClick={() => setShowMethodology(false)}
                className="px-3 py-1.5 text-xs font-medium bg-slate-100 text-slate-700 rounded-md hover:bg-slate-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
