import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { ArrowUpDown, MapPinned, Search } from 'lucide-react';
import { useRole } from '../context/RoleContext.tsx';
import type { WardConnectionRow } from '../shared/types.ts';

interface ExtendedWard extends WardConnectionRow {
  commercialTotal: number;
  domesticTotal: number;
  industrialTotal: number;
  meteredPct: number;
}

export function WardAnalyticsPage() {
  const { apiFetch } = useRole();
  const [searchParams] = useSearchParams();
  const [wards, setWards] = useState<ExtendedWard[]>([]);
  const [selectedCode, setSelectedCode] = useState<string>(searchParams.get('selected') || 'K/E');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'commercial' | 'domestic' | 'industrial'>('all');
  const [sortField, setSortField] = useState<keyof ExtendedWard>('allConnectionsTotal');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    apiFetch('/api/wards')
      .then((r) => r.json())
      .then((d) => {
        setWards(d.wards || []);
      });
  }, [apiFetch]);

  const filteredWards = useMemo(() => {
    return wards
      .filter((w) => {
        if (!search.trim()) return true;
        const q = search.toLowerCase();
        return `${w.wardCode} ${w.wardName} ${w.zoneDivision} ${w.majorLocalities}`.toLowerCase().includes(q);
      })
      .sort((a, b) => {
        const av = a[sortField];
        const bv = b[sortField];
        if (typeof av === 'number' && typeof bv === 'number') {
          return sortDir === 'asc' ? av - bv : bv - av;
        }
        return sortDir === 'asc'
          ? String(av).localeCompare(String(bv))
          : String(bv).localeCompare(String(av));
      });
  }, [wards, search, sortField, sortDir]);

  const top5 = useMemo(
    () => [...wards].sort((a, b) => b.allConnectionsTotal - a.allConnectionsTotal).slice(0, 5),
    [wards]
  );

  const bottom5 = useMemo(
    () => [...wards].sort((a, b) => a.allConnectionsTotal - b.allConnectionsTotal).slice(0, 5),
    [wards]
  );

  const selectedWard = wards.find((w) => w.wardCode === selectedCode) || wards[0];

  const handleSort = (field: keyof ExtendedWard) => {
    if (sortField === field) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  };

  const zones: Array<'Island City' | 'Western Suburbs' | 'Eastern Suburbs'> = [
    'Island City',
    'Western Suburbs',
    'Eastern Suburbs',
  ];

  return (
    <div className="space-y-5">
      {/* Header + Disclaimer */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            Advanced Ward Analytics (All 24 BMC Wards)
          </h1>
          <p className="text-xs text-slate-600 mt-1">
            Compare connection counts, metering share, and category composition across Wards A through T. Connection counts indicate municipal connection volume, not water supply quality or pressure.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search ward or locality..."
              className="pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-md bg-white w-52"
            />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as typeof categoryFilter)}
            className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-md bg-white"
          >
            <option value="all">All Categories</option>
            <option value="commercial">Commercial Focus</option>
            <option value="domestic">Domestic Focus</option>
            <option value="industrial">Industrial Focus</option>
          </select>
        </div>
      </div>

      {/* Interactive Mumbai 24-Ward Spatial Zone Grid + Selected Ward Detail Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-lg p-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2.5 mb-3">
            <h2 className="text-sm font-bold text-slate-900 inline-flex items-center gap-1.5">
              <MapPinned className="w-4 h-4 text-[#1E3A8A]" />
              BMC Administrative Zone &amp; Ward Selector (Click a Ward)
            </h2>
            <span className="text-[11px] text-slate-500">24 Official Wards (Grand Total Excluded)</span>
          </div>

          <div className="space-y-3">
            {zones.map((z) => {
              const zoneWards = wards.filter((w) => w.zoneDivision === z);
              return (
                <div key={z}>
                  <div className="text-[11px] font-semibold text-slate-500 mb-1.5">{z}</div>
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                    {zoneWards.map((w) => {
                      const active = w.wardCode === selectedCode;
                      return (
                        <button
                          key={w.wardCode}
                          type="button"
                          onClick={() => setSelectedCode(w.wardCode)}
                          className={`p-2 rounded-md border text-left transition-colors ${
                            active
                              ? 'bg-[#1E3A8A] text-white border-[#1E3A8A]'
                              : 'bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-200'
                          }`}
                        >
                          <div className="text-xs font-bold">{w.wardCode}</div>
                          <div className={`text-[11px] font-mono-tabular ${active ? 'text-blue-100' : 'text-slate-600'}`}>
                            {w.allConnectionsTotal.toLocaleString('en-IN')}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Ward Detail Panel */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-lg p-4 flex flex-col justify-between">
          {selectedWard ? (
            <>
              <div>
                <div className="border-b border-slate-200 pb-2.5 mb-3">
                  <div className="text-[11px] font-semibold text-[#1E3A8A]">{selectedWard.zoneDivision}</div>
                  <h2 className="text-base font-bold text-slate-900">{selectedWard.wardName}</h2>
                  <p className="text-xs text-slate-600 mt-0.5">Localities: {selectedWard.majorLocalities}</p>
                </div>

                <div className="grid grid-cols-3 gap-2.5 mb-3">
                  <div className="p-2.5 bg-slate-50 border border-slate-200 rounded">
                    <div className="text-[11px] text-slate-500">Total Connections</div>
                    <div className="text-sm font-bold font-mono-tabular text-slate-900">
                      {selectedWard.allConnectionsTotal.toLocaleString('en-IN')}
                    </div>
                  </div>
                  <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded">
                    <div className="text-[11px] text-emerald-700">Metered</div>
                    <div className="text-sm font-bold font-mono-tabular text-emerald-900">
                      {selectedWard.meteredTotal.toLocaleString('en-IN')}
                    </div>
                  </div>
                  <div className="p-2.5 bg-sky-50 border border-sky-200 rounded">
                    <div className="text-[11px] text-sky-700">Non-Metered ({selectedWard.nonMeteredPctCalculated}%)</div>
                    <div className="text-sm font-bold font-mono-tabular text-sky-900">
                      {selectedWard.nonMeteredTotal.toLocaleString('en-IN')}
                    </div>
                  </div>
                </div>

                <div className="h-44">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Domestic', value: selectedWard.domesticTotal },
                          { name: 'Commercial', value: selectedWard.commercialTotal },
                          { name: 'Industrial', value: selectedWard.industrialTotal },
                        ]}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={60}
                      >
                        <Cell fill="#1E3A8A" />
                        <Cell fill="#D97706" />
                        <Cell fill="#0F766E" />
                      </Pie>
                      <Tooltip formatter={(v: unknown) => Number(v).toLocaleString('en-IN')} />
                      <Legend wrapperStyle={{ fontSize: '11px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="text-[11px] text-slate-600 border-t border-slate-200 pt-2.5 flex justify-between font-mono-tabular">
                <span>CM: {selectedWard.commercialTotal.toLocaleString('en-IN')}</span>
                <span>DM: {selectedWard.domesticTotal.toLocaleString('en-IN')}</span>
                <span>IND: {selectedWard.industrialTotal.toLocaleString('en-IN')}</span>
              </div>
            </>
          ) : (
            <div className="text-xs text-slate-500">Select a ward to view details.</div>
          )}
        </div>
      </div>

      {/* 6 Ward Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Chart 1: Total Connections by Ward */}
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <h3 className="text-sm font-bold text-slate-900 mb-3">1. Total Water Connections by Ward</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={filteredWards}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="wardCode" tick={{ fontSize: 10 }} interval={0} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip formatter={(v: unknown) => Number(v).toLocaleString('en-IN')} />
                <Bar
                  dataKey={
                    categoryFilter === 'commercial'
                      ? 'commercialTotal'
                      : categoryFilter === 'domestic'
                      ? 'domesticTotal'
                      : categoryFilter === 'industrial'
                      ? 'industrialTotal'
                      : 'allConnectionsTotal'
                  }
                  name="Connections"
                  fill="#1E3A8A"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Metered vs Non-Metered by Ward */}
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <h3 className="text-sm font-bold text-slate-900 mb-3">2. Metered vs Non-Metered Connections by Ward</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={filteredWards}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="wardCode" tick={{ fontSize: 10 }} interval={0} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip formatter={(v: unknown) => Number(v).toLocaleString('en-IN')} />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Bar dataKey="meteredTotal" name="Metered" stackId="m" fill="#16A34A" />
                <Bar dataKey="nonMeteredTotal" name="Non-Metered" stackId="m" fill="#1876C4" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: Commercial, Domestic & Industrial Composition */}
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <h3 className="text-sm font-bold text-slate-900 mb-3">3. Commercial, Domestic &amp; Industrial Distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={filteredWards}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="wardCode" tick={{ fontSize: 10 }} interval={0} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip formatter={(v: unknown) => Number(v).toLocaleString('en-IN')} />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Bar dataKey="domesticTotal" name="Domestic" stackId="cat" fill="#1E3A8A" />
                <Bar dataKey="commercialTotal" name="Commercial" stackId="cat" fill="#D97706" />
                <Bar dataKey="industrialTotal" name="Industrial" stackId="cat" fill="#0F766E" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 4: Non-Metered Percentage by Ward */}
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <h3 className="text-sm font-bold text-slate-900 mb-3">4. Non-Metered Connection Share (%) by Ward</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={filteredWards}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="wardCode" tick={{ fontSize: 10 }} interval={0} />
                <YAxis unit="%" tick={{ fontSize: 10 }} />
                <Tooltip formatter={(v: unknown) => `${v}%`} />
                <Bar dataKey="nonMeteredPctCalculated" name="Non-Metered %" fill="#C43C4B" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 5: Top 5 Wards by Connection Count */}
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <h3 className="text-sm font-bold text-slate-900 mb-3">5A. Top 5 Wards by Total Connection Count</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={top5} layout="vertical" margin={{ left: 10, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis type="number" tick={{ fontSize: 10 }} />
                <YAxis type="category" dataKey="wardCode" tick={{ fontSize: 11 }} width={40} />
                <Tooltip formatter={(v: unknown) => Number(v).toLocaleString('en-IN')} />
                <Bar dataKey="allConnectionsTotal" name="Highest Connection Count" fill="#16A34A" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 6: Bottom 5 Wards by Connection Count */}
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <h3 className="text-sm font-bold text-slate-900 mb-3">5B. Bottom 5 Wards by Total Connection Count</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={bottom5} layout="vertical" margin={{ left: 10, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis type="number" tick={{ fontSize: 10 }} />
                <YAxis type="category" dataKey="wardCode" tick={{ fontSize: 11 }} width={40} />
                <Tooltip formatter={(v: unknown) => Number(v).toLocaleString('en-IN')} />
                <Bar dataKey="allConnectionsTotal" name="Lowest Connection Count" fill="#D97706" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Detailed Sortable Comparison Table */}
      <div className="bg-white border border-slate-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-slate-900">Complete 24-Ward Comparison Table (Click any row to inspect)</h2>
          <span className="text-xs text-slate-500">Click column headers to sort</span>
        </div>
        <div className="overflow-x-auto border border-slate-200 rounded-md">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-700 border-b border-slate-200">
              <tr>
                <th className="px-3 py-2 font-semibold cursor-pointer" onClick={() => handleSort('wardCode')}>
                  <span className="inline-flex items-center gap-1">Ward <ArrowUpDown className="w-3 h-3" /></span>
                </th>
                <th className="px-3 py-2 font-semibold">Zone</th>
                <th className="px-3 py-2 font-semibold text-right cursor-pointer" onClick={() => handleSort('meteredTotal')}>
                  <span className="inline-flex items-center gap-1">Metered <ArrowUpDown className="w-3 h-3" /></span>
                </th>
                <th className="px-3 py-2 font-semibold text-right cursor-pointer" onClick={() => handleSort('nonMeteredTotal')}>
                  <span className="inline-flex items-center gap-1">Non-Metered <ArrowUpDown className="w-3 h-3" /></span>
                </th>
                <th className="px-3 py-2 font-semibold text-right cursor-pointer" onClick={() => handleSort('commercialTotal')}>
                  <span className="inline-flex items-center gap-1">Commercial <ArrowUpDown className="w-3 h-3" /></span>
                </th>
                <th className="px-3 py-2 font-semibold text-right cursor-pointer" onClick={() => handleSort('domesticTotal')}>
                  <span className="inline-flex items-center gap-1">Domestic <ArrowUpDown className="w-3 h-3" /></span>
                </th>
                <th className="px-3 py-2 font-semibold text-right cursor-pointer" onClick={() => handleSort('industrialTotal')}>
                  <span className="inline-flex items-center gap-1">Industrial <ArrowUpDown className="w-3 h-3" /></span>
                </th>
                <th className="px-3 py-2 font-semibold text-right cursor-pointer" onClick={() => handleSort('allConnectionsTotal')}>
                  <span className="inline-flex items-center gap-1">All Total <ArrowUpDown className="w-3 h-3" /></span>
                </th>
                <th className="px-3 py-2 font-semibold text-right cursor-pointer" onClick={() => handleSort('nonMeteredPctCalculated')}>
                  <span className="inline-flex items-center gap-1">Non-Metered % <ArrowUpDown className="w-3 h-3" /></span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-mono-tabular">
              {filteredWards.map((w) => (
                <tr
                  key={w.wardCode}
                  onClick={() => setSelectedCode(w.wardCode)}
                  className={`cursor-pointer transition-colors ${
                    w.wardCode === selectedCode ? 'bg-blue-50' : 'hover:bg-slate-50'
                  }`}
                >
                  <td className="px-3 py-2 font-sans font-bold text-[#1E3A8A]">{w.wardCode}</td>
                  <td className="px-3 py-2 font-sans text-slate-600">{w.zoneDivision}</td>
                  <td className="px-3 py-2 text-right text-emerald-700">{w.meteredTotal.toLocaleString('en-IN')}</td>
                  <td className="px-3 py-2 text-right text-sky-700">{w.nonMeteredTotal.toLocaleString('en-IN')}</td>
                  <td className="px-3 py-2 text-right">{w.commercialTotal.toLocaleString('en-IN')}</td>
                  <td className="px-3 py-2 text-right">{w.domesticTotal.toLocaleString('en-IN')}</td>
                  <td className="px-3 py-2 text-right">{w.industrialTotal.toLocaleString('en-IN')}</td>
                  <td className="px-3 py-2 text-right font-bold">{w.allConnectionsTotal.toLocaleString('en-IN')}</td>
                  <td className="px-3 py-2 text-right">{w.nonMeteredPctCalculated.toFixed(2)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
