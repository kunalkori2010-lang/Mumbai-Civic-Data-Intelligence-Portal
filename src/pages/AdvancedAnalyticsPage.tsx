import { useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Cpu, Layers, PieChart as PieIcon, Trophy } from 'lucide-react';
import { useRole } from '../context/RoleContext.tsx';
import type { WardConnectionRow } from '../shared/types.ts';

interface DescriptiveMetric {
  count: number;
  mean: number;
  median: number;
  min: number;
  max: number;
  range: number;
  stdDev: number;
  q1: number;
  q3: number;
  iqr: number;
  lowerFence: number;
  upperFence: number;
}

interface StatsResponse {
  descriptiveStats: Record<string, DescriptiveMetric>;
  zoneSummary: Array<{ zone: string; wards: number; metered: number; nonMetered: number; total: number; nonMeteredPct: number }>;
  outlierAnalysis: Array<{
    wardCode: string;
    wardName: string;
    zoneDivision: string;
    allConnectionsTotal: number;
    nonMeteredPctCalculated: number;
    totalOutlier: boolean;
    pctOutlier: boolean;
    verificationNote: string;
  }>;
}

export function AdvancedAnalyticsPage() {
  const { apiFetch } = useRole();
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [wards, setWards] = useState<WardConnectionRow[]>([]);
  const [rankBy, setRankBy] = useState<'allConnectionsTotal' | 'meteredTotal' | 'nonMeteredTotal' | 'nonMeteredPctCalculated'>('allConnectionsTotal');

  useEffect(() => {
    apiFetch('/api/analytics/stats').then((r) => r.json()).then(setStats);
    apiFetch('/api/wards').then((r) => r.json()).then((d) => setWards(d.wards || []));
  }, [apiFetch]);

  const rankedWards = [...wards].sort((a, b) => b[rankBy] - a[rankBy]);

  const rankLabels: Record<typeof rankBy, string> = {
    allConnectionsTotal: 'Total Connection Count (highest total municipal connections in ward)',
    meteredTotal: 'Metered Connection Count (highest metered volume)',
    nonMeteredTotal: 'Non-Metered Connection Count (highest un-metered volume)',
    nonMeteredPctCalculated: 'Non-Metered Share % (highest proportion of un-metered connections)',
  };

  return (
    <div className="space-y-5">
      <div className="bg-white border border-slate-200 rounded-lg p-5">
        <h1 className="text-xl font-bold text-slate-900">Advanced Data Science Analytics</h1>
        <p className="text-xs text-slate-600 mt-1">
          Descriptive statistical profiling, dynamic ward rankings, IQR outlier verification flags, zone aggregation, and machine learning readiness boundaries.
        </p>
      </div>

      {/* Feature 1: Dynamic Ward Ranking */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900 inline-flex items-center gap-1.5">
              <Trophy className="w-4 h-4 text-[#D97706]" />
              Dynamic Ward Ranking
            </h2>
            <p className="text-xs text-slate-600 mt-0.5">{rankLabels[rankBy]}</p>
          </div>
          <select
            value={rankBy}
            onChange={(e) => setRankBy(e.target.value as typeof rankBy)}
            className="px-3 py-1.5 text-xs border border-slate-300 rounded-md bg-white"
          >
            <option value="allConnectionsTotal">Rank by Total Connections</option>
            <option value="meteredTotal">Rank by Metered Connections</option>
            <option value="nonMeteredTotal">Rank by Non-Metered Connections</option>
            <option value="nonMeteredPctCalculated">Rank by Non-Metered Share (%)</option>
          </select>
        </div>

        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={rankedWards}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="wardCode" tick={{ fontSize: 10 }} interval={0} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip
                formatter={(v: unknown) =>
                  rankBy === 'nonMeteredPctCalculated' ? `${v}%` : Number(v).toLocaleString('en-IN')
                }
              />
              <Bar dataKey={rankBy} fill="#1E3A8A" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Feature 2 & 3: Descriptive Statistics Table */}
      <div className="bg-white border border-slate-200 rounded-lg p-5">
        <h2 className="text-sm font-bold text-slate-900 mb-3 inline-flex items-center gap-1.5">
          <PieIcon className="w-4 h-4 text-[#1E3A8A]" />
          Descriptive Statistics Across 24 BMC Wards
        </h2>
        <div className="overflow-x-auto border border-slate-200 rounded-md">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-700 border-b border-slate-200">
              <tr>
                <th className="px-3 py-2 font-semibold">Metric</th>
                <th className="px-3 py-2 font-semibold text-right">Mean</th>
                <th className="px-3 py-2 font-semibold text-right">Median</th>
                <th className="px-3 py-2 font-semibold text-right">Min</th>
                <th className="px-3 py-2 font-semibold text-right">Max</th>
                <th className="px-3 py-2 font-semibold text-right">Range</th>
                <th className="px-3 py-2 font-semibold text-right">Std Dev</th>
                <th className="px-3 py-2 font-semibold text-right">Q1 (25%)</th>
                <th className="px-3 py-2 font-semibold text-right">Q3 (75%)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-mono-tabular">
              {stats &&
                Object.entries(stats.descriptiveStats).map(([key, m]) => (
                  <tr key={key} className="hover:bg-slate-50">
                    <td className="px-3 py-2 font-sans font-semibold text-slate-800">{key}</td>
                    <td className="px-3 py-2 text-right">{m.mean.toLocaleString('en-IN')}</td>
                    <td className="px-3 py-2 text-right">{m.median.toLocaleString('en-IN')}</td>
                    <td className="px-3 py-2 text-right">{m.min.toLocaleString('en-IN')}</td>
                    <td className="px-3 py-2 text-right">{m.max.toLocaleString('en-IN')}</td>
                    <td className="px-3 py-2 text-right">{m.range.toLocaleString('en-IN')}</td>
                    <td className="px-3 py-2 text-right">{m.stdDev.toLocaleString('en-IN')}</td>
                    <td className="px-3 py-2 text-right">{m.q1.toLocaleString('en-IN')}</td>
                    <td className="px-3 py-2 text-right">{m.q3.toLocaleString('en-IN')}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Zone Summary + IQR Outlier Verification Flags */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-lg p-5">
          <h2 className="text-sm font-bold text-slate-900 mb-3 inline-flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-[#1E3A8A]" />
            Administrative Zone Aggregation
          </h2>
          <div className="overflow-x-auto border border-slate-200 rounded-md">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 border-b border-slate-200">
                <tr>
                  <th className="px-3 py-2">Zone</th>
                  <th className="px-3 py-2 text-right">Wards</th>
                  <th className="px-3 py-2 text-right">Total</th>
                  <th className="px-3 py-2 text-right">Non-Metered %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-mono-tabular">
                {(stats?.zoneSummary || []).map((z) => (
                  <tr key={z.zone}>
                    <td className="px-3 py-2 font-sans font-semibold">{z.zone}</td>
                    <td className="px-3 py-2 text-right">{z.wards}</td>
                    <td className="px-3 py-2 text-right">{z.total.toLocaleString('en-IN')}</td>
                    <td className="px-3 py-2 text-right">{z.nonMeteredPct.toFixed(2)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-lg p-5">
          <h2 className="text-sm font-bold text-slate-900 mb-1">
            IQR Statistical Outlier Check (Verification Indicators Only)
          </h2>
          <p className="text-[11px] text-slate-500 mb-3">
            Outlier flags highlight statistical extremes (outside Q1 - 1.5×IQR to Q3 + 1.5×IQR) for administrative verification, not proof of service problems.
          </p>
          <div className="max-h-60 overflow-y-auto border border-slate-200 rounded-md">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 border-b border-slate-200 sticky top-0">
                <tr>
                  <th className="px-3 py-2">Ward</th>
                  <th className="px-3 py-2 text-right">Total</th>
                  <th className="px-3 py-2 text-right">Non-Metered %</th>
                  <th className="px-3 py-2">Statistical Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-mono-tabular">
                {(stats?.outlierAnalysis || []).map((o) => (
                  <tr key={o.wardCode}>
                    <td className="px-3 py-2 font-sans font-semibold text-[#1E3A8A]">{o.wardCode}</td>
                    <td className="px-3 py-2 text-right">{o.allConnectionsTotal.toLocaleString('en-IN')}</td>
                    <td className="px-3 py-2 text-right">{o.nonMeteredPctCalculated.toFixed(2)}%</td>
                    <td className={`px-3 py-2 font-sans ${o.totalOutlier || o.pctOutlier ? 'text-amber-700 font-semibold' : 'text-slate-600'}`}>
                      {o.verificationNote}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Feature 7: Machine Learning Scope & Ethics Boundary */}
      <div className="bg-white border border-slate-200 rounded-lg p-5">
        <div className="flex items-start gap-3">
          <Cpu className="w-5 h-5 text-[#1E3A8A] shrink-0 mt-0.5" />
          <div>
            <h2 className="text-sm font-bold text-slate-900">Future Machine Learning Architecture &amp; Scientific Boundaries</h2>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              The 24-row cross-sectional water connections snapshot (March 2025) is intentionally NOT used to train predictive water-quality or demand-forecasting models. Future ML modules are architected for longitudinal multi-quarter time-series datasets, locality clustering, and consented Local Business Connect engagement pattern analysis once sufficient records accumulate.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
