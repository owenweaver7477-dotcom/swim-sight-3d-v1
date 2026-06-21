import React from 'react';
import { CheckCircle2, CircleAlert, LockKeyhole, ShieldCheck } from 'lucide-react';
import { findUnsafePublicReportPaths, sanitizePublicReportPayload } from '@/lib/sanitizeAIReport';
import { getFindingReviewState, isAIFinding } from '@/lib/aiTrust';

const FINAL_REPORT_STATUSES = ['coach_approved', 'finalised', 'published', 'shared'];

function SafetyRow({ label, value, safe = true }) {
  return (
    <div className="flex min-h-11 items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2">
      <span className="text-xs text-slate-600">{label}</span>
      <span className={`inline-flex items-center gap-1 text-xs font-bold ${safe ? 'text-emerald-700' : 'text-amber-700'}`}>
        {safe ? <CheckCircle2 className="h-3.5 w-3.5" /> : <CircleAlert className="h-3.5 w-3.5" />}
        {value}
      </span>
    </div>
  );
}

export default function PilotReportSafetySummary({ report, findings = [], annotations = [] }) {
  const aiFindings = findings.filter(isAIFinding);
  const approved = aiFindings.filter(finding => finding.approval_status === 'approved').length;
  const rejected = aiFindings.filter(finding => finding.approval_status === 'rejected').length;
  const edited = aiFindings.filter(finding => getFindingReviewState(finding) === 'edited').length;
  const unresolved = aiFindings.filter(finding => !['approved', 'rejected'].includes(finding.approval_status)).length;
  const isCoachApproved = FINAL_REPORT_STATUSES.includes(report?.status);
  const sanitized = report
    ? sanitizePublicReportPayload({ report, findings, annotations, swimmer: null, club: null, video_meta: {} })
    : null;
  const unsafePaths = sanitized ? findUnsafePublicReportPaths(sanitized) : [];
  const sanitisationSafe = unsafePaths.length === 0;
  const readyToShare = Boolean(isCoachApproved && unresolved === 0 && sanitized?.report && sanitisationSafe);

  return (
    <section id="report-safety" className="rounded-xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
            <ShieldCheck className="h-4 w-4 text-cyan-700" /> Pilot report safety
          </div>
          <p className="mt-1 text-xs leading-5 text-slate-600">
            Internal pre-share check. AI-assisted drafts still require an explicit coach decision.
          </p>
        </div>
        <span className={`inline-flex w-fit items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold ${
          readyToShare
            ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
            : 'border-amber-200 bg-amber-50 text-amber-800'
        }`}>
          {readyToShare ? <CheckCircle2 className="h-3 w-3" /> : <LockKeyhole className="h-3 w-3" />}
          {readyToShare ? 'Ready for controlled sharing' : 'Coach approval required'}
        </span>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <SafetyRow label="AI drafts approved by coach" value={approved} />
        <SafetyRow label="AI drafts edited by coach" value={edited} />
        <SafetyRow label="AI drafts rejected by coach" value={rejected} />
        <SafetyRow label="Unresolved AI drafts" value={unresolved} safe={unresolved === 0} />
        <SafetyRow label="Public report sanitisation" value="Active" safe={sanitisationSafe} />
        <SafetyRow label="Private URLs, raw pose and debug fields" value={sanitisationSafe ? 'Excluded' : 'Needs attention'} safe={sanitisationSafe} />
        <SafetyRow label="Report coach-approved" value={isCoachApproved ? 'Yes' : 'Not yet'} safe={isCoachApproved} />
      </div>

      <p className="mt-3 text-[10px] leading-4 text-slate-500">
        This summary is a workflow guardrail, not a legal or technical guarantee. Open the generated shared link logged out before sending it.
      </p>
    </section>
  );
}
