import React, { useEffect, useState } from 'react';
import DragRiskReportSection from '@/components/drag/DragRiskReportSection';
import { useParams } from 'react-router-dom';
import functions from '@/lib/data/functions';
import { Loader2, AlertTriangle, CheckCircle2, Waves, Target, Dumbbell, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';

const SEVERITY_STYLES = {
  low:      { label: 'Low',      cls: 'text-sky-700 bg-sky-50 border-sky-200' },
  medium:   { label: 'Medium',   cls: 'text-amber-700 bg-amber-50 border-amber-200' },
  high:     { label: 'High',     cls: 'text-orange-700 bg-orange-50 border-orange-200' },
  critical: { label: 'Critical', cls: 'text-red-700 bg-red-50 border-red-200' },
};

function SeverityBadge({ severity }) {
  const cfg = SEVERITY_STYLES[severity] || SEVERITY_STYLES.medium;
  return (
    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${cfg.cls}`}>
      {cfg.label}
    </span>
  );
}

// Clean public-facing report — no internal links, no debug info, no approval controls
function PublicReportContent({ report, swimmer, club, video_meta, findings, dragItems = [] }) {
  const reportDate = report.ai_completed_at || report.created_date;

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden">
      {/* Header */}
      <div className="px-8 py-6 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white print:bg-white print:text-slate-900 print:border-b-2 print:border-slate-900">
        <div className="flex items-start justify-between mb-5">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center">
                <Waves className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="text-xs font-semibold tracking-wider uppercase text-cyan-300 print:text-cyan-700">Swim Sight 3D</div>
                <div className="text-[10px] text-slate-300 print:text-slate-500">Professional Video Analysis</div>
              </div>
            </div>
            <h1 className="text-2xl font-bold mb-1">{report.title || 'Technical Analysis Report'}</h1>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/20 border border-green-400/30 print:bg-green-50 print:border-green-300">
            <CheckCircle2 className="w-4 h-4 text-green-400 print:text-green-600" />
            <span className="text-[10px] font-bold text-green-300 print:text-green-700 uppercase tracking-wider">Coach Approved</span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10 print:border-slate-200">
          <div>
            <div className="text-[10px] uppercase tracking-wider text-slate-400 print:text-slate-500 mb-0.5">Club</div>
            <div className="font-semibold">{club?.name || 'Swim Club'}</div>
          </div>
          <div className="text-right">
            <div className="text-[10px] uppercase tracking-wider text-slate-400 print:text-slate-500 mb-0.5">Report Date</div>
            <div className="font-semibold">{reportDate ? format(new Date(reportDate), 'dd MMMM yyyy') : '—'}</div>
          </div>
        </div>
      </div>

      {/* Athlete info */}
      <div className="px-8 py-5 bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <div className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">Swimmer</div>
            <div className="text-lg font-bold text-slate-900">{swimmer?.name || '—'}</div>
          </div>
          {video_meta?.stroke_type && (
            <div>
              <div className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">Stroke</div>
              <div className="text-sm font-semibold text-slate-900">{video_meta.stroke_type}</div>
            </div>
          )}
          {video_meta?.analysis_type && (
            <div>
              <div className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">Analysis Type</div>
              <div className="text-sm text-slate-900">{video_meta.analysis_type}</div>
            </div>
          )}
        </div>
      </div>

      {/* Overall score */}
      {report.overall_score != null && (
        <div className="px-8 py-6 border-b border-slate-200">
          <div className="flex items-center gap-5">
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex flex-col items-center justify-center text-white shadow-lg">
              <span className="text-4xl font-black">{report.overall_score}</span>
              <span className="text-[10px] font-semibold uppercase tracking-wider opacity-90">Score</span>
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-2">Overall Technique Score</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                {report.overall_score >= 80 ? 'Excellent technique with minor areas for refinement.' :
                 report.overall_score >= 65 ? 'Good foundation with several areas for improvement.' :
                 'Significant technical adjustments recommended.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Technical summary */}
      {report.coach_summary && (
        <div className="px-8 py-6 border-b border-slate-200">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">Coach Summary</h3>
          <p className="text-sm text-slate-700 leading-relaxed">{report.coach_summary}</p>
        </div>
      )}

      {report.technical_summary && (
        <div className="px-8 py-6 border-b border-slate-200">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">Technical Summary</h3>
          <p className="text-sm text-slate-700 leading-relaxed">{report.technical_summary}</p>
        </div>
      )}

      {report.next_focus && (
        <div className="px-8 py-6 border-b border-slate-200">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">Next Focus</h3>
          <p className="text-sm text-slate-700 leading-relaxed">{report.next_focus}</p>
        </div>
      )}

      {/* Findings — public-safe: only approved, no internal fields */}
      {findings && findings.length > 0 && (
        <div className="px-8 py-6">
          <h2 className="text-lg font-bold text-slate-900 uppercase tracking-wider mb-5 flex items-center gap-2">
            <span className="w-1 h-6 bg-gradient-to-b from-cyan-500 to-blue-600 rounded-full"></span>
            Technical Findings <span className="text-sm font-normal text-slate-500">({findings.length})</span>
          </h2>
          <div className="space-y-4">
            {findings.map((finding, index) => (
              <div key={index} className="rounded-xl border border-slate-200 bg-white overflow-hidden print:break-inside-avoid print:border-slate-300">
                <div className="px-5 py-3 bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200">
                  <div className="flex items-start gap-3 flex-wrap">
                    <span className="text-xs font-bold text-slate-400 font-mono mt-0.5">{index + 1}.</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-sm font-bold text-slate-900">{finding.finding_name}</span>
                        {finding.severity && <SeverityBadge severity={finding.severity} />}
                      </div>
                      {finding.phase && (
                        <span className="text-[10px] font-medium text-blue-600 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
                          {finding.phase}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="px-5 py-4 space-y-3.5">
                  {/* Observation — strip internal debug suffix */}
                  {finding.coach_sees && (
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-500"></span>
                        Observation
                      </div>
                      <p className="text-sm text-slate-700 leading-relaxed">
                        {finding.coach_sees.split('\n\nCoach should check:')[0]}
                      </p>
                    </div>
                  )}
                  {finding.why_it_matters && (
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                        Why It Matters
                      </div>
                      <p className="text-sm text-slate-700 leading-relaxed">{finding.why_it_matters}</p>
                    </div>
                  )}
                  {finding.cue && (
                    <div className="pl-4 border-l-4 border-cyan-500 bg-cyan-50/50 rounded-r-lg p-3">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-cyan-700 mb-1.5 flex items-center gap-1.5">
                        <Target className="w-3.5 h-3.5" /> Correction Cue
                      </div>
                      <p className="text-sm font-semibold text-slate-900 leading-relaxed">{finding.cue}</p>
                    </div>
                  )}
                  {finding.drill && (
                    <div className="flex items-start gap-2.5 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg px-4 py-2.5 border border-blue-100">
                      <Dumbbell className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="text-[10px] font-bold uppercase tracking-wider text-blue-700 mb-0.5">Recommended Drill</div>
                        <p className="text-sm text-slate-800 leading-relaxed">{finding.drill}</p>
                      </div>
                    </div>
                  )}
                  {finding.next_focus && (
                    <div className="flex items-start gap-2.5 bg-slate-50 rounded-lg px-4 py-2.5 border border-slate-100">
                      <Target className="w-4 h-4 text-slate-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-0.5">Next Focus</div>
                        <p className="text-sm text-slate-700 leading-relaxed">{finding.next_focus}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Drag Risk Section — approved + included only, public-safe fields */}
      <DragRiskReportSection dragItems={dragItems} />

      {/* Disclaimer */}
      <div className="mx-8 mb-5 p-3 rounded-lg bg-slate-50 border border-slate-200">
        <p className="text-[10px] text-slate-500 leading-relaxed text-center">
          AI-assisted evidence supports coach review. Final report content is coach-approved. This report does not constitute a medical or clinical assessment.
        </p>
      </div>

      {/* Footer */}
      <div className="px-8 py-5 bg-gradient-to-r from-slate-50 to-slate-100 border-t border-slate-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
              <Waves className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-700">Swim Sight 3D</div>
              <div className="text-[10px] text-slate-500">Professional Video Analysis Platform</div>
            </div>
          </div>
          {reportDate && (
            <div className="text-xs text-slate-500">
              {format(new Date(reportDate), 'dd MMMM yyyy')}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SharedReportPage() {
  const { token } = useParams();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) { setError('Invalid link.'); setLoading(false); return; }
    functions.getSharedReport(token)
      .then(res => { setData(res.data); })
      .catch(err => {
        setError(err?.message || 'Report not found or link expired.');
      })
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
          <span className="text-sm text-muted-foreground">Loading report…</span>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="max-w-sm w-full text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-8 h-8 text-destructive" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground mb-1">Report not found</h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {error || 'This share link is invalid, has been disabled, or has expired.'}
            </p>
          </div>
          <div className="text-[10px] text-muted-foreground">
            Powered by <span className="text-primary font-semibold">Swim Sight 3D</span>
          </div>
        </div>
      </div>
    );
  }

  const { report, swimmer, club, video_meta, findings, drag_items = [] } = data;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Top branding bar */}
      <div className="bg-slate-900/80 backdrop-blur-sm border-b border-slate-700 px-4 py-4 print:hidden sticky top-0 z-50">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            {club?.logo_url ? (
              <img src={club.logo_url} alt={club.name} className="w-9 h-9 rounded-lg object-contain bg-white/10 p-1" />
            ) : (
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg">
                <Waves className="w-5 h-5 text-white" />
              </div>
            )}
            <div>
              <div className="text-sm font-bold text-white">{club?.name || 'Swim Club'}</div>
              <div className="text-[10px] text-slate-400">Powered by <span className="text-cyan-400 font-semibold">Swim Sight 3D</span></div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-900/30 border border-green-700/50">
              <CheckCircle2 className="w-4 h-4 text-green-400" />
              <span className="text-xs font-bold text-green-400 uppercase tracking-wider">Coach Approved</span>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="text-xs border-slate-600 text-slate-300 hover:bg-slate-700 print:hidden"
              onClick={() => { window.scrollTo(0, 0); setTimeout(() => window.print(), 100); }}
            >
              <Download className="w-3 h-3 mr-1.5" /> Download PDF
            </Button>
          </div>
        </div>
      </div>

      {/* Printable area */}
      <div id="printable-report-area" className="max-w-4xl mx-auto px-4 py-8 pb-16 print:max-w-none print:px-0 print:py-0 print:absolute print:top-0 print:left-0 print:w-full">
        <PublicReportContent
          report={report}
          swimmer={swimmer}
          club={club}
          video_meta={video_meta}
          findings={findings}
          dragItems={drag_items}
        />
        <div className="mt-6 text-center text-xs text-slate-500 print:hidden">
          <div className="text-[10px] text-slate-500">Professional swimming technique analysis platform</div>
        </div>
      </div>
    </div>
  );
}
