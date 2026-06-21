import React from 'react';
import { CheckCircle2, LockKeyhole, ShieldCheck } from 'lucide-react';
import { getFindingReviewState, isAIFinding } from '@/lib/aiTrust';

export default function AIReviewTrustSummary({ findings = [], isReportFinalised = false }) {
  const aiFindings = findings.filter(isAIFinding);
  const counts = {
    approved: aiFindings.filter(finding => finding.approval_status === 'approved').length,
    edited: aiFindings.filter(finding => getFindingReviewState(finding) === 'edited').length,
    rejected: aiFindings.filter(finding => finding.approval_status === 'rejected').length,
  };
  const unresolved = aiFindings.filter(finding => !['approved', 'rejected'].includes(finding.approval_status)).length;
  const readyToShare = isReportFinalised && unresolved === 0;

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4" aria-label="AI review trust summary">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
            <ShieldCheck className="h-4 w-4 text-cyan-700" /> AI review summary
          </div>
          <p className="mt-1 text-[11px] leading-relaxed text-slate-600">
            AI suggestions remain drafts until a coach approves, edits, or rejects them.
          </p>
        </div>
        <div className={`inline-flex w-fit items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold ${
          readyToShare
            ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
            : 'border-amber-200 bg-amber-50 text-amber-800'
        }`}>
          {readyToShare ? <CheckCircle2 className="h-3 w-3" /> : <LockKeyhole className="h-3 w-3" />}
          {readyToShare ? 'Ready to share' : 'Public sharing disabled until coach approval'}
        </div>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {[
          ['AI drafts', aiFindings.length],
          ['Approved', counts.approved],
          ['Edited', counts.edited],
          ['Rejected', counts.rejected],
        ].map(([label, value]) => (
          <div key={label} className="rounded-lg bg-slate-50 px-3 py-2">
            <div className="text-base font-bold text-slate-900">{value}</div>
            <div className="text-[10px] font-medium text-slate-500">{label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
