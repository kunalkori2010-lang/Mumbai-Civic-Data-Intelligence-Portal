import React, { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, ClipboardList, Droplets } from 'lucide-react';
import { useRole } from '../context/RoleContext.tsx';
import type { LocalitySurvey } from '../shared/types.ts';

const WARDS = [
  'A', 'B', 'C', 'D', 'E', 'F/N', 'F/S', 'G/N', 'G/S',
  'H/E', 'H/W', 'K/E', 'K/W', 'L', 'M/E', 'M/W', 'N',
  'P/N', 'P/S', 'R/C', 'R/N', 'R/S', 'S', 'T',
];

export function WaterConnectionsPage() {
  const { apiFetch } = useRole();
  const [surveys, setSurveys] = useState<LocalitySurvey[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');

  const [form, setForm] = useState<LocalitySurvey>({
    surveyDate: new Date().toISOString().slice(0, 10),
    wardCode: 'K/E',
    localityOrBlock: '',
    respondentType: 'Resident',
    waterSource: 'BMC Piped Supply',
    isMetered: 'Yes',
    supplyHoursPerDay: 4,
    supplyRegularity: 'Daily',
    interruptionsPerMonth: 1,
    pressureAdequacy: 'Adequate',
    mainWaterIssue: 'None reported',
    observationNotes: '',
  });

  const loadSurveys = async () => {
    const res = await apiFetch('/api/surveys');
    if (res.ok) {
      const json = await res.json();
      setSurveys(json.surveys || []);
    }
  };

  useEffect(() => {
    loadSurveys();
  }, [apiFetch]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitMessage('');
    try {
      const res = await apiFetch('/api/surveys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const err = await res.json();
        setSubmitMessage(err.error || 'Submission failed');
      } else {
        setSubmitMessage('Voluntary locality field observation saved separately from official BMC records.');
        setForm({ ...form, localityOrBlock: '', observationNotes: '' });
        await loadSurveys();
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Category x Metering Validation Matrix */}
      <div className="bg-white border border-slate-200 rounded-lg p-5">
        <div className="flex items-start gap-3 mb-4">
          <div className="p-2 rounded-md bg-blue-50 text-[#1E3A8A] border border-blue-200">
            <Droplets className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">
              Water Connections Reconciliation &amp; Locality Field Survey
            </h1>
            <p className="text-xs text-slate-600 mt-0.5">
              Official March 2025 BMC category breakdown paired with Sheet 4 (Locality_Survey) voluntary community field observation capture.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto border border-slate-200 rounded-md">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#1E3A8A] text-white">
              <tr>
                <th className="px-4 py-2.5 font-semibold">Connection Category</th>
                <th className="px-4 py-2.5 font-semibold text-right">Metered Connections</th>
                <th className="px-4 py-2.5 font-semibold text-right">Non-Metered Connections</th>
                <th className="px-4 py-2.5 font-semibold text-right">Total Connections</th>
                <th className="px-4 py-2.5 font-semibold text-right">Non-Metered Share</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-mono-tabular">
              <tr>
                <td className="px-4 py-2.5 font-sans font-semibold">Commercial (CM)</td>
                <td className="px-4 py-2.5 text-right">61,947</td>
                <td className="px-4 py-2.5 text-right">18,014</td>
                <td className="px-4 py-2.5 text-right font-semibold">79,961</td>
                <td className="px-4 py-2.5 text-right text-amber-700 font-semibold">22.53%</td>
              </tr>
              <tr>
                <td className="px-4 py-2.5 font-sans font-semibold">Domestic (DM)</td>
                <td className="px-4 py-2.5 text-right">460,845</td>
                <td className="px-4 py-2.5 text-right">4,198</td>
                <td className="px-4 py-2.5 text-right font-semibold">465,043</td>
                <td className="px-4 py-2.5 text-right text-emerald-700 font-semibold">0.90%</td>
              </tr>
              <tr>
                <td className="px-4 py-2.5 font-sans font-semibold">Industrial (IND)</td>
                <td className="px-4 py-2.5 text-right">6,331</td>
                <td className="px-4 py-2.5 text-right">124</td>
                <td className="px-4 py-2.5 text-right font-semibold">6,455</td>
                <td className="px-4 py-2.5 text-right text-emerald-700 font-semibold">1.92%</td>
              </tr>
              <tr className="bg-slate-100 font-bold">
                <td className="px-4 py-2.5 font-sans">City Grand Total (24 Wards)</td>
                <td className="px-4 py-2.5 text-right text-emerald-800">529,123</td>
                <td className="px-4 py-2.5 text-right text-sky-800">22,336</td>
                <td className="px-4 py-2.5 text-right text-slate-900">551,459</td>
                <td className="px-4 py-2.5 text-right">4.05%</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Explicit Separation Notice */}
      <div className="bg-amber-50 border border-amber-300 rounded-lg p-4 flex items-start gap-3 text-xs text-amber-900">
        <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-700" />
        <div>
          <strong>Source Separation Notice:</strong> Sheet 4 (<em>Locality_Survey</em>) in the source workbook is a blank template. Submissions recorded below are <strong>voluntary community field observations</strong> and are stored separately from official BMC RTI water connection counts.
        </div>
      </div>

      {/* Locality Survey Form & Observations Table */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <form onSubmit={handleSubmit} className="lg:col-span-5 bg-white border border-slate-200 rounded-lg p-5 space-y-3">
          <div className="flex items-center gap-2 border-b border-slate-200 pb-2.5">
            <ClipboardList className="w-4 h-4 text-[#1E3A8A]" />
            <h2 className="text-sm font-bold text-slate-900">Submit Voluntary Locality Survey (Sheet 4)</h2>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Survey Date</label>
              <input
                type="date"
                required
                value={form.surveyDate}
                onChange={(e) => setForm({ ...form, surveyDate: e.target.value })}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Ward Code</label>
              <select
                value={form.wardCode}
                onChange={(e) => setForm({ ...form, wardCode: e.target.value })}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md"
              >
                {WARDS.map((w) => (
                  <option key={w} value={w}>Ward {w}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="text-xs">
            <label className="block font-semibold text-slate-700 mb-1">Locality or Block *</label>
            <input
              type="text"
              required
              placeholder="e.g., Marol Pipe Line / Dadar TT"
              value={form.localityOrBlock}
              onChange={(e) => setForm({ ...form, localityOrBlock: e.target.value })}
              className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md"
            />
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Respondent Type</label>
              <select
                value={form.respondentType}
                onChange={(e) => setForm({ ...form, respondentType: e.target.value })}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md"
              >
                <option>Resident</option>
                <option>Housing Society</option>
                <option>Retail Shop</option>
                <option>Commercial Office</option>
                <option>Student Volunteer</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Water Source</label>
              <select
                value={form.waterSource}
                onChange={(e) => setForm({ ...form, waterSource: e.target.value })}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md"
              >
                <option>BMC Piped Supply</option>
                <option>Borewell / Well</option>
                <option>Private Tanker</option>
                <option>Mixed Supply</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2.5 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Metered?</label>
              <select
                value={form.isMetered}
                onChange={(e) => setForm({ ...form, isMetered: e.target.value })}
                className="w-full px-2 py-1.5 border border-slate-300 rounded-md"
              >
                <option>Yes</option>
                <option>No</option>
                <option>Unsure</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Hours / Day</label>
              <input
                type="number"
                min={0}
                max={24}
                step={0.5}
                value={form.supplyHoursPerDay}
                onChange={(e) => setForm({ ...form, supplyHoursPerDay: Number(e.target.value) })}
                className="w-full px-2 py-1.5 border border-slate-300 rounded-md"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Interruptions/Mo</label>
              <input
                type="number"
                min={0}
                max={31}
                value={form.interruptionsPerMonth}
                onChange={(e) => setForm({ ...form, interruptionsPerMonth: Number(e.target.value) })}
                className="w-full px-2 py-1.5 border border-slate-300 rounded-md"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Supply Regularity</label>
              <select
                value={form.supplyRegularity}
                onChange={(e) => setForm({ ...form, supplyRegularity: e.target.value })}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md"
              >
                <option>Daily</option>
                <option>Alternate Days</option>
                <option>Irregular</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Pressure Adequacy</label>
              <select
                value={form.pressureAdequacy}
                onChange={(e) => setForm({ ...form, pressureAdequacy: e.target.value })}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md"
              >
                <option>Adequate</option>
                <option>Low Pressure</option>
                <option>High / Excess</option>
              </select>
            </div>
          </div>

          <div className="text-xs">
            <label className="block font-semibold text-slate-700 mb-1">Main Water Issue</label>
            <input
              type="text"
              value={form.mainWaterIssue}
              onChange={(e) => setForm({ ...form, mainWaterIssue: e.target.value })}
              className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md"
            />
          </div>

          <div className="text-xs">
            <label className="block font-semibold text-slate-700 mb-1">Observation or Notes</label>
            <textarea
              rows={2}
              value={form.observationNotes}
              onChange={(e) => setForm({ ...form, observationNotes: e.target.value })}
              placeholder="Field notes (no personal resident names or private flat numbers)"
              className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md"
            />
          </div>

          {submitMessage && (
            <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded text-xs flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{submitMessage}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2 px-4 bg-[#1E3A8A] hover:bg-[#172554] text-white text-xs font-semibold rounded-md transition-colors disabled:opacity-50"
          >
            {submitting ? 'Saving Observation...' : 'Record Field Survey Observation'}
          </button>
        </form>

        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-lg p-5">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2.5 mb-3">
            <h2 className="text-sm font-bold text-slate-900">
              Recorded Locality Field Observations ({surveys.length})
            </h2>
            <span className="text-xs text-slate-500">Voluntary Survey Log</span>
          </div>

          {surveys.length === 0 ? (
            <div className="py-12 text-center border border-dashed border-slate-300 rounded-md bg-slate-50">
              <p className="text-sm font-semibold text-slate-700">No Field Observations Recorded Yet</p>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                Sheet 4 in BMC_Water_Connections_Ward_Data.xlsx starts blank. Use the survey form on the left to log voluntary locality observations.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto border border-slate-200 rounded-md">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-700 border-b border-slate-200">
                  <tr>
                    <th className="px-3 py-2 font-semibold">Date</th>
                    <th className="px-3 py-2 font-semibold">Ward / Locality</th>
                    <th className="px-3 py-2 font-semibold">Source &amp; Meter</th>
                    <th className="px-3 py-2 font-semibold">Supply</th>
                    <th className="px-3 py-2 font-semibold">Issue &amp; Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {surveys.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50">
                      <td className="px-3 py-2 font-mono-tabular whitespace-nowrap">{s.surveyDate}</td>
                      <td className="px-3 py-2">
                        <div className="font-semibold text-[#1E3A8A]">Ward {s.wardCode}</div>
                        <div className="text-slate-600">{s.localityOrBlock}</div>
                      </td>
                      <td className="px-3 py-2">
                        <div>{s.waterSource}</div>
                        <div className="text-slate-500">Metered: {s.isMetered}</div>
                      </td>
                      <td className="px-3 py-2">
                        <div className="font-mono-tabular">{s.supplyHoursPerDay} hrs/day</div>
                        <div className="text-slate-500">{s.pressureAdequacy}</div>
                      </td>
                      <td className="px-3 py-2 text-slate-700">
                        <div className="font-medium">{s.mainWaterIssue}</div>
                        {s.observationNotes && <div className="text-slate-500">{s.observationNotes}</div>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
