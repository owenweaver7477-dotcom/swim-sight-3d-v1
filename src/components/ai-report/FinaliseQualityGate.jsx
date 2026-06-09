import React, { useState } from 'react';
import { CheckCircle2, AlertTriangle, X, ClipboardCheck, ClipboardList } from 'lucide-react';
import { Button } from '@/components/ui/button';

const FOCUS_LABEL = {
  body_line: 'Body line', kick: 'Kick', pull: 'Pull / catch',
  breathing: 'Breathing', timing: 'Timing', starts_turns: 'Starts & turns',
  drag_risk: 'Drag risk', general: 'General review',
};
const SESSION_LABEL = {
  training: 'Training', race: 'Race', skills: 'Skills / drills',
  test_set: 'Test set', other: 'Other',
};

function GateItem({ ok, label }) {
  return (
    <div className="flex items-center gap-2">
      {ok
        ? <CheckCircle2 className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
        : <AlertTriangle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
      }
      <span className={`text-xs ${ok ? 'text-foreground' : 'text-amber-700'}`}>{label}</span>
    </div>
  );
}

export default function FinaliseQualityGate({ report, swimmer, video, findings, onConfirm, onCancel, finalising }) {
  const [confirmNoFindings, setConfirmNoFindings] = useState(false);
  // review context from video
  const rc = video || {};
  const hasReviewContext = !!(rc.review_goal || rc.primary_focus || rc.coach_question || rc.session_type);
  const approvedFindings = findings.filter(f => f.approval_status === 'approved' && f.included_in_report);
  const pendingFindings = findings.filter(f => f.approval_status === 'pending');

  const analysisModeLabelOk = !!report.analysis_mode;
  const hasCoachSummary = !!(report.coach_summary || report.technical_summary);
  const hasNextFocus = !!report.next_focus;
  const hasFindingOrConfirmedNone = approvedFindings.length > 0 || confirmNoFindings;
  const publicSafeDrills = approvedFindings.every(f => !f.drill || typeof f.drill === 'string');

  const checks = [
    { ok: !!swimmer,                         label: 'Swimmer selected' },
    { ok: !!video?.stroke_type,              label: 'Stroke type selected' },
    { ok: pendingFindings.length === 0,      label: `All draft AI findings reviewed (${pendingFindings.length} pending)` },
    { ok: hasFindingOrConfirmedNone,         label: `At least one approved finding (${approvedFindings.length} found) or coach confirms none are needed` },
    { ok: approvedFindings.length === 0 || approvedFindings.every(f => f.cue || f.next_focus), label: 'All included findings have a cue or next focus' },
    { ok: hasCoachSummary,                   label: 'Coach summary present' },
    { ok: hasNextFocus,                      label: 'Next focus present' },
    { ok: publicSafeDrills,                  label: 'Selected drills are public-safe' },
    {
      ok: analysisModeLabelOk,
      label: `AI result labelled (${report.analysis_mode || 'not set'})`,
    },
    { ok: true,                              label: 'Public disclaimer is included on shared report' },
  ];

  const failures = checks.filter(c => !c.ok);
  const blockingFailures = checks.slice(0, 4).filter(c => !c.ok);
  const isIncomplete = failures.length > 0;
  const isBlocked = blockingFailures.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4" onClick={onCancel}>
      <div className="bg-card border border-border rounded-xl p-6 max-w-md w-full shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <ClipboardCheck className="w-4.5 h-4.5 text-primary" />
            </div>
            <div>
              <div className="text-sm font-bold text-foreground">Finalise Coach Report?</div>
              <div className="text-[10px] text-muted-foreground">Review quality checklist before sharing.</div>
            </div>
          </div>
          <button onClick={onCancel} className="text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-2 mb-5">
          {checks.map((c, i) => <GateItem key={i} ok={c.ok} label={c.label} />)}
        </div>

        {approvedFindings.length === 0 && (
          <label className="mb-4 flex items-start gap-2 p-3 rounded-lg bg-slate-50 border border-slate-200 cursor-pointer">
            <input
              type="checkbox"
              checked={confirmNoFindings}
              onChange={e => setConfirmNoFindings(e.target.checked)}
              className="mt-0.5"
            />
            <span className="text-xs text-slate-700 leading-relaxed">
              I have reviewed the video and intentionally want to finalise this report with no approved findings.
            </span>
          </label>
        )}

        {isIncomplete && (
          <div className="mb-4 p-3 rounded-lg bg-amber-50 border border-amber-200">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700 leading-relaxed">
                <strong>{isBlocked ? 'This report cannot be finalised yet.' : 'This report may be incomplete.'}</strong>
                {' '}
                {isBlocked
                  ? 'Resolve the required items above before sharing.'
                  : 'You can still finalise, but consider addressing the warnings above first.'}
              </p>
            </div>
          </div>
        )}

        {/* Review context summary */}
        {hasReviewContext && (
          <div className="mb-4 p-3 rounded-lg bg-blue-50 border border-blue-100 space-y-1.5">
            <div className="flex items-center gap-1.5 mb-1">
              <ClipboardList className="w-3.5 h-3.5 text-primary flex-shrink-0" />
              <div className="text-[10px] font-semibold text-blue-800">Review Context</div>
            </div>
            {rc.review_goal && <div className="text-[10px] text-blue-800"><span className="font-medium">Goal:</span> {rc.review_goal}</div>}
            {rc.session_type && <div className="text-[10px] text-blue-800"><span className="font-medium">Session:</span> {SESSION_LABEL[rc.session_type] || rc.session_type}</div>}
            {rc.primary_focus && <div className="text-[10px] text-blue-800"><span className="font-medium">Focus:</span> {FOCUS_LABEL[rc.primary_focus] || rc.primary_focus}</div>}
            {rc.coach_question && <div className="text-[10px] text-blue-800 italic">"{rc.coach_question}"</div>}
            {rc.injury_or_limitations_note && <div className="text-[10px] text-amber-700"><span className="font-medium">Injury note:</span> {rc.injury_or_limitations_note}</div>}
          </div>
        )}

        {/* Draft summary template — only if technical_summary is empty */}
        {!hasCoachSummary && (
          <div className="mb-4 p-3 rounded-lg bg-slate-50 border border-slate-200">
            <div className="text-[10px] font-semibold text-slate-700 mb-1.5">Coach Summary — suggested structure</div>
            <div className="text-[10px] text-slate-500 space-y-0.5 font-mono leading-relaxed">
              <div>Main focus: </div>
              <div>What we observed: </div>
              <div>Correction cue: </div>
              <div>Drill focus: </div>
              <div>Next review: </div>
            </div>
            <div className="text-[10px] text-slate-400 mt-1.5 italic">Add this to the Technical Summary field before finalising.</div>
          </div>
        )}

        <div className="text-[10px] text-muted-foreground mb-4 p-2.5 rounded bg-secondary/50">
          AI-assisted evidence supports coach review. Final report content is coach-approved and excludes private notes, rejected findings, and unapproved annotations.
        </div>

        <div className="flex gap-2 justify-end">
          <Button size="sm" variant="outline" className="h-8 text-xs" onClick={onCancel}>Go Back</Button>
          <Button
            size="sm"
            className="h-8 text-xs bg-green-700 hover:bg-green-600 text-white"
            onClick={onConfirm}
            disabled={finalising || isBlocked}
          >
            {finalising ? 'Finalising…' : isBlocked ? 'Resolve Required Items' : isIncomplete ? 'Finalise with Warnings' : 'Finalise Report'}
          </Button>
        </div>
      </div>
    </div>
  );
}
