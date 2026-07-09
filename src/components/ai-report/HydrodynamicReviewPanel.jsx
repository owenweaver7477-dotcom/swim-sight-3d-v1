import React from 'react';

// Coach-reviewed drag/resistance summary derived from approved findings only.
// Pure presentational — extracted from AIReportPage (Batch 9B maintainability).
export default function HydrodynamicReviewPanel({ report, findings }) {
  const approved = findings.filter(f => f.approval_status === 'approved');
  const dragKeywords = /\b(drag|resistance|body line|streamline|hip|head lift|wide kick|knee width|frontal area|breakout)\b/i;
  const relevant = approved.filter(f => dragKeywords.test([
    f.finding_name,
    f.coach_sees,
    f.why_it_matters,
    f.cue,
    f.next_focus,
    f.phase,
  ].filter(Boolean).join(' ')));
  const highestSeverity = relevant.some(f => f.severity === 'high' || f.severity === 'critical')
    ? 'High attention'
    : relevant.some(f => f.severity === 'medium')
    ? 'Moderate attention'
    : relevant.length
    ? 'Monitor'
    : 'Not assessed';

  return (
    <div className="p-4 rounded-xl bg-card border border-border space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs font-bold text-foreground uppercase tracking-wider">Hydrodynamic Risk Review</div>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            Coach-reviewed resistance cues only. This is not a lab-measured value.
          </p>
        </div>
        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
          highestSeverity === 'High attention' ? 'bg-red-50 text-red-700 border-red-200'
            : highestSeverity === 'Moderate attention' ? 'bg-amber-50 text-amber-700 border-amber-200'
            : highestSeverity === 'Monitor' ? 'bg-green-50 text-green-700 border-green-200'
            : 'bg-slate-50 text-slate-500 border-slate-200'
        }`}>
          {highestSeverity}
        </span>
      </div>
      {relevant.length > 0 ? (
        <div className="space-y-1.5">
          {relevant.slice(0, 3).map(finding => (
            <div key={finding.id} className="text-[10px] text-muted-foreground flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary/60 mt-1.5 flex-shrink-0" />
              <span>{finding.finding_name || finding.coach_sees}</span>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-[10px] text-muted-foreground p-2.5 rounded-lg bg-secondary/50 border border-border">
          Drag risk has not been assessed in this report. Add a coach finding about body line, streamline, head position, hip position, or kick width if it is visible in the video.
        </div>
      )}
      {report?.analysis_mode !== 'real_pose' && (
        <div className="text-[10px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2.5">
          AI-derived drag estimates require reliable pose evidence. This report should use coach-observed hydrodynamic notes only.
        </div>
      )}
    </div>
  );
}
