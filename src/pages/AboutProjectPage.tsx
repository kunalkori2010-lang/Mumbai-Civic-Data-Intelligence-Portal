import { useEffect, useState } from 'react';
import { CheckCircle2, Lock, ShieldCheck } from 'lucide-react';
import { useRole } from '../context/RoleContext.tsx';
import type { AuditLogEntry } from '../shared/types.ts';

export function AboutProjectPage() {
  const { role, apiFetch } = useRole();
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [auditError, setAuditError] = useState('');

  useEffect(() => {
    setAuditError('');
    apiFetch('/api/audit-logs')
      .then(async (r) => {
        if (!r.ok) {
          const j = await r.json();
          setAuditError(j.error || 'Restricted');
          setAuditLogs([]);
        } else {
          const j = await r.json();
          setAuditLogs(j.logs || []);
        }
      })
      .catch(() => {});
  }, [role, apiFetch]);

  return (
    <div className="space-y-5">
      <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-3">
        <h1 className="text-xl font-bold text-slate-900">
          About the Mumbai Civic Data Intelligence Portal
        </h1>
        <p className="text-xs text-slate-700 leading-relaxed">
          Developed as a <strong>Semester 4 Data Science Community Engagement Project</strong>, this platform demonstrates how scattered municipal disclosures can be extracted, profiled, cleaned, validated, stored in a relational database, analysed in Power BI, and linked to consented local businesses across Mumbai&apos;s 24 BMC wards.
        </p>
        <div className="p-3 bg-blue-50 border border-blue-200 rounded text-xs text-[#1E3A8A] font-semibold">
          Academic Community Engagement Project | Independent Prototype — This platform is NOT an official Brihanmumbai Municipal Corporation (BMC) portal and maintains no live BMC database connection.
        </div>
      </div>

      {/* Role-Based Access Matrix */}
      <div className="bg-white border border-slate-200 rounded-lg p-5">
        <h2 className="text-sm font-bold text-slate-900 mb-3 inline-flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-[#1E3A8A]" />
          Role-Based Access Control (RBAC) Matrix
        </h2>
        <div className="overflow-x-auto border border-slate-200 rounded-md">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 border-b border-slate-200">
              <tr>
                <th className="px-3 py-2">Role</th>
                <th className="px-3 py-2">Public Dashboards &amp; Verified Businesses</th>
                <th className="px-3 py-2">ETL Reprocess &amp; File Preview</th>
                <th className="px-3 py-2">Commit Dataset &amp; Approve Retailers</th>
                <th className="px-3 py-2">Audit Logs</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              <tr>
                <td className="px-3 py-2 font-semibold">Public Visitor</td>
                <td className="px-3 py-2 text-emerald-700">Allowed</td>
                <td className="px-3 py-2 text-slate-400">Restricted</td>
                <td className="px-3 py-2 text-slate-400">Restricted</td>
                <td className="px-3 py-2 text-slate-400">Restricted</td>
              </tr>
              <tr>
                <td className="px-3 py-2 font-semibold">Retailer</td>
                <td className="px-3 py-2 text-emerald-700">Allowed + Register Listing</td>
                <td className="px-3 py-2 text-slate-400">Restricted</td>
                <td className="px-3 py-2 text-slate-400">Restricted</td>
                <td className="px-3 py-2 text-slate-400">Restricted</td>
              </tr>
              <tr>
                <td className="px-3 py-2 font-semibold">Data Analyst</td>
                <td className="px-3 py-2 text-emerald-700">Allowed</td>
                <td className="px-3 py-2 text-emerald-700">Allowed</td>
                <td className="px-3 py-2 text-slate-400">Restricted</td>
                <td className="px-3 py-2 text-emerald-700">Allowed</td>
              </tr>
              <tr>
                <td className="px-3 py-2 font-semibold">Administrator</td>
                <td className="px-3 py-2 text-emerald-700">Allowed</td>
                <td className="px-3 py-2 text-emerald-700">Allowed</td>
                <td className="px-3 py-2 text-emerald-700">Allowed</td>
                <td className="px-3 py-2 text-emerald-700">Allowed</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Role-Restricted Audit Logs */}
      <div className="bg-white border border-slate-200 rounded-lg p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-slate-900">System Audit Logs (Role-Protected)</h2>
          <span className="text-xs text-slate-500">Current Role: {role}</span>
        </div>

        {auditError ? (
          <div className="p-4 bg-slate-50 border border-slate-200 rounded text-xs text-slate-600 flex items-center gap-2">
            <Lock className="w-4 h-4 text-slate-400" />
            <span>{auditError} Switch to Data Analyst or Administrator in the header to inspect audit entries.</span>
          </div>
        ) : (
          <div className="max-h-72 overflow-y-auto border border-slate-200 rounded-md">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 border-b border-slate-200 sticky top-0">
                <tr>
                  <th className="px-3 py-2">Timestamp</th>
                  <th className="px-3 py-2">Actor Role</th>
                  <th className="px-3 py-2">Action</th>
                  <th className="px-3 py-2">Resource</th>
                  <th className="px-3 py-2">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {auditLogs.map((log) => (
                  <tr key={log.id}>
                    <td className="px-3 py-2 font-mono-tabular whitespace-nowrap">{new Date(log.createdAt).toLocaleString()}</td>
                    <td className="px-3 py-2 font-semibold text-[#1E3A8A]">{log.actorRole}</td>
                    <td className="px-3 py-2 font-mono-tabular">
                      <span className="inline-flex items-center gap-1 text-emerald-700">
                        <CheckCircle2 className="w-3 h-3" /> {log.action}
                      </span>
                    </td>
                    <td className="px-3 py-2 font-mono-tabular">{log.resource}</td>
                    <td className="px-3 py-2 text-slate-600">{log.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
