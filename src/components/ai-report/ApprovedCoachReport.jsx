import React from 'react';
import { SeverityBadge } from './AIFindingCard';
import { CheckCircle2, Star, Activity, Target } from 'lucide-react';

export default function ApprovedCoachReport({ report, swimmer, video, approvedFindings }) {
  if (approvedFindings.length === 0) {
    return (
      <div className="p-6 rounded-xl bg-card border border-dashed border-border text-center space-y-2">
        <CheckCircle2 className="w-8 h-8 text-muted-foreground mx-auto opacity-20" />
        <p className="text-xs font-medium text-muted-foreground">No approved findings yet</p>
        <p className="text-[10px] text-muted-foreground/70 max-w-xs mx-auto leading-relaxed">
          Review the AI Suggested Findings above and click <strong className="text-muted-foreground">Approve</strong> on each finding to include it in the coach report.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-green-700/30 bg-green-900/5 overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 bg-green-900/20 border-b border-green-700/30">
        <div className="flex items-center gap-2 mb-1">
          <CheckCircle2 className="w-4 h-4 text-green-400" />
          <span className="text-xs font-bold text-green-400 uppercase tracking-wider">Approved Coach Report</span>
        </div>
        <div className="text-sm font-semibold text-foreground">{report.title || 'Technique Report'}</div>
        {swimmer && (
          <div className="text-xs text-muted-foreground mt-0.5">
            Swimmer: <span className="text-foreground font-medium">{swimmer.name}</span>
            {video?.stroke_type && <span className="ml-2 text-primary">{video.stroke_type}</span>}
          </div>
        )}
      </div>

      <div className="px-5 py-4 space-y-5">
        {/* Score */}
        {report.overall_score != null && (
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex flex-col items-center justify-center flex-shrink-0">
              <span className="text-base font-bold text-primary">{report.overall_score}</span>
              <span className="text-[9px] text-muted-foreground uppercase tracking-wider">Score</span>
            </div>
            <div>
              <div className="text-xs font-semibold text-foreground">Overall Technique Score</div>
              <div className="flex gap-0.5 mt-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className={`w-3 h-3 ${i < Math.round(report.overall_score / 20) ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground'}`} />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Approved findings */}
        <div>
          <div className="flex items-center gap-2 mb-2.5">
            <Activity className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs font-bold text-foreground uppercase tracking-wider">
              Technical Findings ({approvedFindings.length})
            </span>
          </div>
          <div className="space-y-3">
            {approvedFindings.map((f, i) => (
              <div key={f.id} className="p-3 rounded-lg bg-card border border-border space-y-2">
                <div className="flex items-start gap-2 flex-wrap">
                  <span className="text-[10px] font-mono text-muted-foreground flex-shrink-0 mt-0.5">{i + 1}.</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap mb-1">
                      <span className="text-xs font-bold text-foreground">{f.finding_name}</span>
                      {f.severity && <SeverityBadge severity={f.severity} />}
                      {f.phase && <span className="text-[10px] text-primary">{f.phase}</span>}
                    </div>
                    {f.coach_sees && (
                      <p className="text-[10px] text-muted-foreground leading-relaxed">
                        {f.coach_sees.split('\n\nCoach should check: ')[0]}
                      </p>
                    )}
                  </div>
                </div>

                {f.cue && (
                  <div className="pl-4 border-l-2 border-primary/30 ml-4">
                    <div className="text-[10px] uppercase tracking-wider text-primary font-semibold mb-0.5">Correction</div>
                    <p className="text-xs text-foreground font-medium">{f.cue}</p>
                  </div>
                )}

                {f.next_focus && (
                  <div className="flex items-start gap-1.5 text-[10px] text-muted-foreground bg-secondary/50 rounded px-2 py-1.5">
                    <Target className="w-3 h-3 flex-shrink-0 mt-0.5 text-primary" />
                    <span>{f.next_focus}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}