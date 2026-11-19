import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Calculator, Info, TrendingUp } from 'lucide-react';
import { useRole } from '../context/RoleContext.tsx';

interface BusinessImpactResponse {
  hasRealData: boolean;
  summary: {
    totalRegistered: number;
    verifiedCount: number;
    pendingCount: number;
    categoriesCount: number;
    profileViews: number;
    consumerSearches: number;
    contactActions: number;
    enquiries: number;
  };
  byCategory: Array<{ category: string; count: number }>;
  byWard: Array<{ wardCode: string; businessCount: number; bmcCommercialConnections: number }>;
}

export function BusinessImpactPage() {
  const { apiFetch } = useRole();
  const [impact, setImpact] = useState<BusinessImpactResponse | null>(null);

  // Interactive ROI Calculator State
  const [avgOrderValue, setAvgOrderValue] = useState<number>(850);
  const [additionalEnquiries, setAdditionalEnquiries] = useState<number>(15);
  const [conversionPct, setConversionPct] = useState<number>(25);
  const [grossMarginPct, setGrossMarginPct] = useState<number>(30);
  const [additionalCosts, setAdditionalCosts] = useState<number>(500);

  useEffect(() => {
    apiFetch('/api/business-impact').then((r) => r.json()).then(setImpact);
  }, [apiFetch]);

  const estimatedAdditionalRevenue = additionalEnquiries * (conversionPct / 100) * avgOrderValue;
  const estimatedGrossProfit = estimatedAdditionalRevenue * (grossMarginPct / 100);
  const estimatedNetBenefit = estimatedGrossProfit - additionalCosts;

  return (
    <div className="space-y-5">
      <div className="bg-white border border-slate-200 rounded-lg p-5">
        <h1 className="text-xl font-bold text-slate-900">Business Benefit &amp; ROI Analysis</h1>
        <p className="text-xs text-slate-600 mt-1">
          Live engagement telemetry from participating consented retailers alongside a transparent Retailer ROI Estimator.
        </p>
      </div>

      {/* Live Business Metrics or Honest No-Data State */}
      {!impact?.hasRealData ? (
        <div className="bg-white border border-dashed border-slate-300 rounded-lg p-8 text-center space-y-2.5">
          <TrendingUp className="w-8 h-8 text-slate-400 mx-auto" />
          <h2 className="text-sm font-bold text-slate-900">
            No Participating Retailer Records Yet (Zero-Fabrication Policy)
          </h2>
          <p className="text-xs text-slate-600 max-w-lg mx-auto">
            Actual business impact metrics remain at zero until real participating businesses register in Business Connect. We never fabricate customer counts or retailer sales figures.
          </p>
          <div className="pt-1">
            <Link
              to="/businesses"
              className="inline-block px-4 py-2 text-xs font-semibold bg-[#1E3A8A] text-white rounded-md hover:bg-[#172554]"
            >
              Go to Business Connect
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-200 rounded-lg p-4">
            <div className="text-xs text-slate-500">Registered Businesses</div>
            <div className="text-2xl font-bold font-mono-tabular mt-1">{impact.summary.totalRegistered}</div>
            <div className="text-[11px] text-emerald-700 mt-0.5">{impact.summary.verifiedCount} Verified · {impact.summary.pendingCount} Pending</div>
          </div>
          <div className="bg-white border border-slate-200 rounded-lg p-4">
            <div className="text-xs text-slate-500">Categories Covered</div>
            <div className="text-2xl font-bold font-mono-tabular mt-1">{impact.summary.categoriesCount}</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Active local retail sectors</div>
          </div>
          <div className="bg-white border border-slate-200 rounded-lg p-4">
            <div className="text-xs text-slate-500">Profile Views &amp; Contact Clicks</div>
            <div className="text-2xl font-bold font-mono-tabular mt-1">{impact.summary.profileViews}</div>
            <div className="text-[11px] text-slate-500 mt-0.5">{impact.summary.contactActions} direct contact actions</div>
          </div>
          <div className="bg-white border border-slate-200 rounded-lg p-4">
            <div className="text-xs text-slate-500">Consumer Enquiries</div>
            <div className="text-2xl font-bold font-mono-tabular text-[#1E3A8A] mt-1">{impact.summary.enquiries}</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Logged via portal enquiry form</div>
          </div>
        </div>
      )}

      {/* Interactive Retailer ROI Calculator */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2">
            <Calculator className="w-4 h-4 text-[#1E3A8A]" />
            <h2 className="text-sm font-bold text-slate-900">
              Retailer Incremental ROI Estimator (Interactive What-If Model)
            </h2>
          </div>
          <span className="text-[11px] font-semibold text-amber-700">
            Estimate Only — Not Guaranteed Earnings
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Average Order Value (INR ₹)</label>
              <input
                type="number"
                min={0}
                value={avgOrderValue}
                onChange={(e) => setAvgOrderValue(Number(e.target.value))}
                className="w-full px-3 py-1.5 border border-slate-300 rounded-md font-mono-tabular"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Attributable Enquiries / Month</label>
              <input
                type="number"
                min={0}
                value={additionalEnquiries}
                onChange={(e) => setAdditionalEnquiries(Number(e.target.value))}
                className="w-full px-3 py-1.5 border border-slate-300 rounded-md font-mono-tabular"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Estimated Conversion Rate (%)</label>
              <input
                type="number"
                min={0}
                max={100}
                value={conversionPct}
                onChange={(e) => setConversionPct(Number(e.target.value))}
                className="w-full px-3 py-1.5 border border-slate-300 rounded-md font-mono-tabular"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Gross Margin (%)</label>
              <input
                type="number"
                min={0}
                max={100}
                value={grossMarginPct}
                onChange={(e) => setGrossMarginPct(Number(e.target.value))}
                className="w-full px-3 py-1.5 border border-slate-300 rounded-md font-mono-tabular"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">Additional Platform / Fulfillment Costs (INR ₹)</label>
              <input
                type="number"
                min={0}
                value={additionalCosts}
                onChange={(e) => setAdditionalCosts(Number(e.target.value))}
                className="w-full px-3 py-1.5 border border-slate-300 rounded-md font-mono-tabular"
              />
            </div>
          </div>

          <div className="lg:col-span-6 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-md">
                <div className="text-[11px] text-slate-500">Est. Additional Revenue</div>
                <div className="text-lg font-bold font-mono-tabular text-slate-900 mt-1">
                  ₹{estimatedAdditionalRevenue.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                </div>
              </div>
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                <div className="text-[11px] text-[#1E3A8A]">Est. Gross Profit</div>
                <div className="text-lg font-bold font-mono-tabular text-[#1E3A8A] mt-1">
                  ₹{estimatedGrossProfit.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                </div>
              </div>
              <div className={`p-3 border rounded-md ${estimatedNetBenefit >= 0 ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
                <div className="text-[11px] text-slate-700">Est. Incremental Net Benefit</div>
                <div className={`text-lg font-bold font-mono-tabular mt-1 ${estimatedNetBenefit >= 0 ? 'text-emerald-800' : 'text-red-800'}`}>
                  ₹{estimatedNetBenefit.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                </div>
              </div>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-md text-[11px] text-slate-600 space-y-1">
              <div className="font-bold text-slate-800 inline-flex items-center gap-1">
                <Info className="w-3.5 h-3.5" /> Explicit Calculation Formulas:
              </div>
              <div>1. Estimated Additional Revenue = Enquiries × (Conversion Rate / 100) × Average Order Value</div>
              <div>2. Estimated Gross Profit = Estimated Additional Revenue × (Gross Margin / 100)</div>
              <div>3. Estimated Incremental Net Benefit = Estimated Gross Profit − Additional Business Costs</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
