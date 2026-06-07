import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Brain, CheckCircle2, Edit3, XCircle, RefreshCw, Loader2, ChevronDown, ChevronUp, BarChart2 } from 'lucide-react';
import { format } from 'date-fns';

// Classify a single AI finding
function classifyFinding(f) {
  if (f.approval_status === 'rejected') return 'rejected';

  const origName  = f.original_finding_name || f.finding_name;
  const origCue   = f.original_cue          || f.cue;
  const origSev   = f.original_severity     || f.severity;
  const origPhase = f.original_phase        || f.phase;
  const origDrill = f.original_drill        || f.drill;
  const origFocus = f.original_next_focus   || f.next_focus;

  const edited =
    (f.cue       && f.cue       !== origCue   ) ||
    (f.severity  && f.severity  !== origSev   ) ||
    (f.phase     && f.phase     !== origPhase ) ||
    (f.drill     && origDrill   && f.drill     !== origDrill) ||
    (f.next_focus && origFocus  && f.next_focus !== origFocus);

  if (edited) return 'edited';
  if (f.approval_status === 'approved') return 'approved';
  return 'pending';
}

const TYPE_CONFIG = {
  approved: { label: 'Approved unchanged', color: 'text-green-400', bg: 'bg-green-900/10 border-green-700/20', icon: CheckCircle2 },
  edited:   { label: 'Edited by coach',    color: 'text-blue-400',  bg: 'bg-blue-900/10 border-blue-700/20',  icon: Edit3 },
  rejected: { label: 'Rejected by coach',  color: 'text-red-400',   bg: 'bg-red-900/10 border-red-700/20',    icon: XCircle },
  pending:  { label: 'Pending review',     color: 'text-yellow-400',bg: 'bg-yellow-900/10 border-yellow-700/20', icon: Brain },
};

function FindingComparisonRow({ finding }) {
  const [expanded, setExpanded] = useState(false);
  const type = classifyFinding(finding);
  const cfg = TYPE_CONFIG[type];
  const Icon = cfg.icon;

  const orig = {
    name:  finding.original_finding_name || finding.finding_name,
    cue:   finding.original_cue          || finding.cue,
    sev:   finding.original_severity     || finding.severity,
    phase: finding.original_phase        || finding.phase,
    drill: finding.original_drill        || finding.drill,
    focus: finding.original_next_focus   || finding.next_focus,
  };

  const changed = type === 'edited';

  return (
    <div className={`rounded-lg border ${cfg.bg} overflow-hidden`}>
      <button
        className="w-full flex items-center gap-3 px-3 py-2.5 text-left"
        onClick={() => setExpanded(!expanded)}
      >
        <Icon className={`w-3.5 h-3.5 flex-shrink-0 ${cfg.color}`} />
        <span className="flex-1 text-xs font-medium text-foreground truncate">{finding.finding_name}</span>
        {finding.phase && (
          <span className="text-[10px] text-muted-foreground flex-shrink-0 hidden sm:block">{finding.phase}</span>
        )}
        <span className={`text-[10px] font-semibold flex-shrink-0 ${cfg.color}`}>{cfg.label}</span>
        {changed && (expanded ? <ChevronUp className="w-3 h-3 text-muted-foreground flex-shrink-0" /> : <ChevronDown className="w-3 h-3 text-muted-foreground flex-shrink-0" />)}
      </button>

      {expanded && changed && (
        <div className="px-3 pb-3 grid grid-cols-1 sm:grid-cols-2 gap-3 border-t border-border/50">
          <div className="space-y-1.5 pt-2">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Original AI Suggestion</div>
            {orig.sev && <div className="text-[10px] text-muted-foreground">Severity: <span className="text-foreground">{orig.sev}</span></div>}
            {orig.cue && <div className="text-[10px] text-muted-foreground leading-relaxed">Cue: <span className="text-foreground">{orig.cue}</span></div>}
            {orig.drill && <div className="text-[10px] text-muted-foreground">Drill: <span className="text-foreground">{orig.drill}</span></div>}
            {orig.focus && <div className="text-[10px] text-muted-foreground">Next focus: <span className="text-foreground">{orig.focus}</span></div>}
          </div>
          <div className="space-y-1.5 pt-2">
            <div className="text-[10px] uppercase tracking-wider text-blue-400 font-semibold">Coach Final Version</div>
            {finding.severity && finding.severity !== orig.sev && <div className="text-[10px] text-muted-foreground">Severity: <span className="text-blue-300 font-medium">{finding.severity}</span></div>}
            {finding.cue && <div className="text-[10px] text-muted-foreground leading-relaxed">Cue: <span className={finding.cue !== orig.cue ? 'text-blue-300 font-medium' : 'text-foreground'}>{finding.cue}</span></div>}
            {finding.drill && <div className="text-[10px] text-muted-foreground">Drill: <span className={finding.drill !== orig.drill ? 'text-blue-300 font-medium' : 'text-foreground'}>{finding.drill}</span></div>}
            {finding.next_focus && <div className="text-[10px] text-muted-foreground">Next focus: <span className={finding.next_focus !== orig.focus ? 'text-blue-300 font-medium' : 'text-foreground'}>{finding.next_focus}</span></div>}
          </div>
        </div>
      )}

      {expanded && type === 'rejected' && (
        <div className="px-3 pb-3 pt-2 border-t border-border/50">
          <div className="text-[10px] text-muted-foreground">Original AI suggestion was dismissed by the coach.</div>
          {orig.cue && <div className="text-[10px] text-muted-foreground mt-1">Original cue: <span className="text-foreground">{orig.cue}</span></div>}
        </div>
      )}
    </div>
  );
}

export default function CoachFeedbackComparison({ report, reportId, findings, canEdit }) {
  const queryClient = useQueryClient();
  const [generating, setGenerating] = useState(false);

  const aiFinding = findings.filter(f => f.source === 'ai');
  const approvedUnchanged = aiFinding.filter(f => classifyFinding(f) === 'approved').length;
  const editedCount       = aiFinding.filter(f => classifyFinding(f) === 'edited').length;
  const rejectedCount     = aiFinding.filter(f => f.approval_status === 'rejected').length;
  const total             = aiFinding.length;
  const acceptanceRate    = total > 0 ? Math.round(((approvedUnchanged + editedCount) / total) * 100) : 0;

  // Only show after report is published
  if (report?.status !== 'published' || !aiFinding.length) return null;

  const handleGenerate = async () => {
    setGenerating(true);
    await base44.functions.invoke('generateCoachFeedbackSummary', { report_id: reportId });
    queryClient.invalidateQueries({ queryKey: ['ai-report', reportId] });
    setGenerating(false);
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-2 mb-2">
          <BarChart2 className="w-3.5 h-3.5 text-primary" /> Coach Feedback Comparison
        </h2>
        <p className="text-[10px] text-muted-foreground leading-relaxed p-3 rounded-lg bg-secondary/50 border border-border">
          🔒 <span className="font-semibold text-foreground">Internal coach-only section.</span> Compares the AI's original suggestions against the coach-approved report. Helps review AI quality and coaching priorities. Not shown on public reports, shared links, or PDFs.
        </p>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {[
          { label: 'Approved unchanged', value: approvedUnchanged, color: 'text-green-400' },
          { label: 'Edited by coach',    value: editedCount,   color: 'text-blue-400' },
          { label: 'Rejected',           value: rejectedCount, color: 'text-red-400' },
          { label: 'AI Acceptance Rate', value: `${acceptanceRate}%`, color: 'text-primary' },
        ].map(s => (
          <div key={s.label} className="p-3 rounded-lg bg-card border border-border text-center">
            <div className={`text-lg font-bold ${s.color}`}>{s.value}</div>
            <div className="text-[10px] text-muted-foreground">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Per-finding comparison */}
      <div className="space-y-1.5">
        {aiFinding.map(f => (
          <FindingComparisonRow key={f.id} finding={f} />
        ))}
      </div>

      {/* AI Feedback Summary */}
      <div className="p-4 rounded-xl bg-card border border-border space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="text-xs font-semibold text-foreground">Coach Feedback Summary</div>
          {canEdit && (
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs"
              onClick={handleGenerate}
              disabled={generating}
            >
              {generating
                ? <><Loader2 className="w-3 h-3 mr-1.5 animate-spin" />Generating…</>
                : <><RefreshCw className="w-3 h-3 mr-1.5" />{report.coach_feedback_summary ? 'Regenerate' : 'Generate'} Summary</>
              }
            </Button>
          )}
        </div>

        {report.coach_feedback_summary ? (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground leading-relaxed">{report.coach_feedback_summary}</p>
            {report.coach_feedback_generated_at && (
              <div className="text-[10px] text-muted-foreground/60">
                Generated {format(new Date(report.coach_feedback_generated_at), 'dd MMM yyyy HH:mm')} · This is a coach feedback summary only. It does not retrain or automatically improve the AI model.
              </div>
            )}
          </div>
        ) : (
          <p className="text-[10px] text-muted-foreground">
            {canEdit
              ? 'Click "Generate Summary" to create a plain-English comparison of AI suggestions vs coach decisions.'
              : 'No summary generated yet.'}
          </p>
        )}
      </div>
    </div>
  );
}