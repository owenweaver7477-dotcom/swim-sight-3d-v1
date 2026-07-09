import React from 'react';

// At-a-glance counts of pending drafts, approved findings, key moments and coach draws.
// Pure presentational — extracted from AIReportPage (Batch 9B maintainability).
export default function CoachStudioSnapshot({ pendingCount, approvedCount, keyStampCount, coachDrawCount, isReportFinalised }) {
  const rows = [
    { label: 'Pending AI drafts', value: pendingCount, status: pendingCount > 0 ? 'Needs coach decision' : 'Clear' },
    { label: 'Approved findings', value: approvedCount, status: approvedCount > 0 ? 'Report-ready' : 'None yet' },
    { label: 'Key moments', value: keyStampCount, status: keyStampCount > 0 ? 'Captured' : 'Optional' },
    { label: 'Coach Draw marks', value: coachDrawCount, status: coachDrawCount > 0 ? 'Saved' : 'Optional' },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
      {rows.map(row => (
        <div key={row.label} className="rounded-xl border border-slate-200 bg-white px-3 py-3">
          <div className="text-[10px] text-slate-500">{row.label}</div>
          <div className="flex items-end justify-between gap-2 mt-1">
            <div className="text-lg font-bold text-slate-900">{row.value}</div>
            <div className="text-[9px] text-slate-400 text-right">{row.status}</div>
          </div>
        </div>
      ))}
      {isReportFinalised && (
        <div className="sm:col-span-2 lg:col-span-4 rounded-xl border border-green-200 bg-green-50 px-3 py-2 text-xs text-green-800">
          This coach-approved report is finalised. Share and PDF actions are available in the final step.
        </div>
      )}
    </div>
  );
}
