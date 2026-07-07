import React, { useEffect, useState } from 'react';
import DragRiskReportSection from '@/components/drag/DragRiskReportSection';
import { useParams } from 'react-router-dom';
import functions from '@/lib/data/functions';
import { Loader2, AlertTriangle, CheckCircle2, Waves, Target, Dumbbell, Download, PencilLine } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { drawingToSvg, formatTimestamp } from '@/lib/annotationRender';
import { sanitizePublicReportPayload } from '@/lib/sanitizeAIReport';

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

function labelFromKey(value = '') {
  return String(value)
    .replace(/_/g, ' ')
    .replace(/\b\w/g, letter => letter.toUpperCase());
}

function uniqueTruthy(items = []) {
  return Array.from(new Set(items.filter(Boolean).map(item => String(item).trim()).filter(Boolean)));
}

function buildWeeklyPlan(report, findings = []) {
  const cues = uniqueTruthy(findings.map(finding => finding.cue || finding.correction_cue));
  const drills = uniqueTruthy([
    ...findings.map(finding => finding.linked_drill_title || finding.drill),
    ...findings.flatMap(finding => Array.isArray(finding.extra_drills) ? finding.extra_drills.map(drill => drill.title) : []),
  ]);
  const focus = report.next_focus || findings.find(finding => finding.next_focus)?.next_focus || '';

  return {
    focus,
    cues: cues.slice(0, 3),
    drills: drills.slice(0, 6),
    avoid: findings.length
      ? 'Rushing the correction before the swimmer can repeat it cleanly in the water.'
      : '',
    nextReview: videoReviewLabel(report),
  };
}

function videoReviewLabel(report) {
  const stroke = report.stroke_type || 'technique';
  return `Film another ${String(stroke).toLowerCase()} clip after the next focused training block.`;
}

function PublicAnnotationCard({ annotation, linkedFindingTitle }) {
  const safeThumbnail = typeof annotation.thumbnail_data_url === 'string'
    && annotation.thumbnail_data_url.startsWith('data:image/')
    ? annotation.thumbnail_data_url
    : null;
  const label = annotation.annotation_type === 'key_frame' ? 'Coach-selected key moment' : 'Coach annotation';

  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden print:break-inside-avoid">
      {safeThumbnail ? (
        <div className="relative bg-slate-950">
          <img src={safeThumbnail} alt={annotation.title || label} className="w-full object-contain" />
          {annotation.rendered_svg && (
            <div
              className="pointer-events-none absolute inset-0 [&>svg]:h-full [&>svg]:w-full"
              dangerouslySetInnerHTML={{ __html: annotation.rendered_svg }}
            />
          )}
        </div>
      ) : (
        <div
          className="bg-slate-950"
          style={{ aspectRatio: `${annotation.canvas_width || 16}/${annotation.canvas_height || 9}` }}
          dangerouslySetInnerHTML={{
            __html: annotation.rendered_svg || drawingToSvg({}, {
              width: annotation.canvas_width,
              height: annotation.canvas_height,
            }),
          }}
        />
      )}
      <div className="p-3">
        <div className="text-[10px] font-bold uppercase tracking-wider text-teal-700 mb-1 flex items-center gap-1.5">
          <PencilLine className="w-3 h-3" /> {label}
        </div>
        <div className="text-sm font-bold text-slate-900">{annotation.title || 'Marked frame'}</div>
        <div className="mt-1 flex flex-wrap gap-1.5">
          <span className="rounded-full bg-cyan-50 px-2 py-0.5 text-[10px] font-mono font-semibold text-cyan-700">
            {annotation.frame_label || annotation.video_frame_time_label || formatTimestamp(annotation.timestamp_seconds)}
          </span>
          {annotation.phase && (
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
              {labelFromKey(annotation.phase)}
            </span>
          )}
        </div>
        {linkedFindingTitle && (
          <div className="text-[10px] text-slate-500 mt-1">
            Linked technical finding: <span className="font-semibold text-slate-700">{linkedFindingTitle}</span>
          </div>
        )}
        {annotation.note && <p className="text-sm text-slate-600 mt-2 leading-relaxed">{annotation.note}</p>}
      </div>
    </div>
  );
}

// Clean public-facing report — no internal links, no debug info, no approval controls
function PublicReportContent({ report, swimmer, club, video_meta, findings, annotations = [], dragItems = [] }) {
  const reportDate = report.ai_completed_at || report.created_date;
  const keyMoments = annotations.filter(annotation => annotation.annotation_type === 'key_frame');
  const coachAnnotations = annotations.filter(annotation => annotation.annotation_type !== 'key_frame');
  const weeklyPlan = buildWeeklyPlan(report, findings);
  // The public payload carries no finding source/mode, so infer AI use from the
  // AI-generated technical summary. Manual coach reviews have none, so the AI
  // technical score and AI disclaimer are hidden for them.
  const aiUsed = Boolean(report.technical_summary && String(report.technical_summary).trim());
  const annotationsByFindingTitle = new Map();
  coachAnnotations.forEach(annotation => {
    if (!annotation.linked_finding_title) return;
    const group = annotationsByFindingTitle.get(annotation.linked_finding_title) || [];
    group.push(annotation);
    annotationsByFindingTitle.set(annotation.linked_finding_title, group);
  });
  const linkedAnnotationSet = new Set(
    Array.from(annotationsByFindingTitle.values()).flat()
  );
  const unlinkedAnnotations = coachAnnotations.filter(annotation => !linkedAnnotationSet.has(annotation));

  return (
    <div className="max-w-4xl mx-auto bg-white shadow-xl overflow-hidden sm:rounded-2xl">
      {/* Header */}
      <div className="px-4 py-6 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white print:bg-white print:text-slate-900 print:border-b-2 print:border-slate-900 sm:px-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between mb-5">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center">
                <Waves className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="text-xs font-semibold tracking-wider uppercase text-cyan-300 print:text-cyan-700">Swim Sight 3D</div>
                <div className="text-[10px] text-slate-300 print:text-slate-500">Coach-reviewed swim analysis</div>
              </div>
            </div>
            <h1 className="text-2xl font-bold tracking-tight mb-2 sm:text-3xl">{report.title || 'Swimmer Improvement Plan'}</h1>
            {report.coach_summary && (
              <p className="max-w-2xl text-sm leading-6 text-slate-300 print:text-slate-600">{report.coach_summary}</p>
            )}
          </div>
          <div className="flex w-fit items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/20 border border-green-400/30 print:bg-green-50 print:border-green-300">
            <CheckCircle2 className="w-4 h-4 text-green-400 print:text-green-600" />
            <span className="text-[10px] font-bold text-green-300 print:text-green-700 uppercase tracking-wider">Coach Approved</span>
          </div>
        </div>
        <div className="grid gap-4 pt-4 border-t border-white/10 print:border-slate-200 sm:grid-cols-3">
          <div>
            <div className="text-[10px] uppercase tracking-wider text-slate-400 print:text-slate-500 mb-0.5">Club</div>
            <div className="font-semibold">{club?.name || 'Swim Club'}</div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wider text-slate-400 print:text-slate-500 mb-0.5">Swimmer</div>
            <div className="font-semibold">{swimmer?.name || '—'}</div>
          </div>
          <div className="sm:text-right">
            <div className="text-[10px] uppercase tracking-wider text-slate-400 print:text-slate-500 mb-0.5">Report Date</div>
            <div className="font-semibold">{reportDate ? format(new Date(reportDate), 'dd MMMM yyyy') : '—'}</div>
          </div>
        </div>
      </div>

      {/* Athlete info */}
      <div className="px-4 py-5 bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200 sm:px-8">
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
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

      {/* Weekly improvement plan */}
      <div className="px-4 py-6 border-b border-slate-200 sm:px-8">
        <div className="mb-4 flex items-center gap-2">
          <Target className="w-4 h-4 text-cyan-600" />
          <h2 className="text-lg font-bold text-slate-900">This week’s focus</h2>
        </div>
        {weeklyPlan.focus || weeklyPlan.cues.length || weeklyPlan.drills.length ? (
          <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-sky-600">Coach focus</div>
              <p className="mt-2 text-lg font-bold leading-7 text-slate-950">
                {weeklyPlan.focus || 'Keep the approved findings clear and repeatable in the next training block.'}
              </p>
              <div className="mt-4 grid gap-3">
                <div className="rounded-xl bg-white p-3">
                  <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Coach cues</div>
                  {weeklyPlan.cues.length ? (
                    <ul className="mt-2 space-y-1 text-sm leading-6 text-slate-700">
                      {weeklyPlan.cues.map(cue => <li key={cue}>• {cue}</li>)}
                    </ul>
                  ) : (
                    <p className="mt-2 text-sm text-slate-500">Coach cues will appear here once added to the report.</p>
                  )}
                </div>
                <div className="rounded-xl bg-white p-3">
                  <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Next review target</div>
                  <p className="mt-2 text-sm leading-6 text-slate-700">{weeklyPlan.nextReview}</p>
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5">
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.22em] text-blue-700">
                <Dumbbell className="w-4 h-4" />
                Recommended drills
              </div>
              {weeklyPlan.drills.length ? (
                <div className="mt-3 grid gap-2">
                  {weeklyPlan.drills.map(drill => (
                    <div key={drill} className="rounded-xl bg-white p-3 text-sm font-semibold leading-6 text-slate-800 shadow-sm">
                      {drill}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-3 text-sm leading-6 text-blue-900/70">Drill recommendations will appear here once selected by the coach.</p>
              )}
              {weeklyPlan.avoid && (
                <div className="mt-4 rounded-xl border border-blue-100 bg-white/70 p-3">
                  <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Avoid</div>
                  <p className="mt-2 text-sm leading-6 text-slate-700">{weeklyPlan.avoid}</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-600">
            Coach focus will appear here once added to the report.
          </div>
        )}
      </div>

      {/* Overall score — AI technical score, only when AI was actually used */}
      {aiUsed && report.overall_score != null && report.overall_score > 0 && (
        <div className="px-4 py-6 border-b border-slate-200 sm:px-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
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
        <div className="px-4 py-6 border-b border-slate-200 sm:px-8">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">Coach Summary</h3>
          <p className="text-sm text-slate-700 leading-relaxed">{report.coach_summary}</p>
        </div>
      )}

      {report.technical_summary && (
        <div className="px-4 py-6 border-b border-slate-200 sm:px-8">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">Technical Focus</h3>
          <p className="text-sm text-slate-700 leading-relaxed">{report.technical_summary}</p>
        </div>
      )}

      {report.next_focus && (
        <div className="px-4 py-6 border-b border-slate-200 sm:px-8">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">Next Focus</h3>
          <p className="text-sm text-slate-700 leading-relaxed">{report.next_focus}</p>
        </div>
      )}

      {keyMoments.length > 0 && (
        <div className="px-4 py-6 border-b border-slate-200 sm:px-8">
          <h2 className="text-lg font-bold text-slate-900 uppercase tracking-wider mb-5 flex items-center gap-2">
            <span className="w-1 h-6 bg-gradient-to-b from-emerald-500 to-teal-600 rounded-full"></span>
            Key Moments <span className="text-sm font-normal text-slate-500">({keyMoments.length})</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {keyMoments.map((annotation, index) => (
              <PublicAnnotationCard key={`${annotation.title || 'key-moment'}-${index}`} annotation={annotation} />
            ))}
          </div>
        </div>
      )}

      {/* Findings — public-safe: only approved, no internal fields */}
      {findings && findings.length > 0 && (
        <div className="px-4 py-6 sm:px-8">
          <h2 className="text-lg font-bold text-slate-900 uppercase tracking-wider mb-5 flex items-center gap-2">
            <span className="w-1 h-6 bg-gradient-to-b from-cyan-500 to-blue-600 rounded-full"></span>
            Coach Findings <span className="text-sm font-normal text-slate-500">({findings.length})</span>
          </h2>
          <div className="space-y-4">
            {findings.map((finding, index) => {
              const linkedAnnotations = annotationsByFindingTitle.get(finding.finding_name) || [];
              return (
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
                      {finding.timestamp_seconds != null && (
                        <span className="text-[10px] font-mono text-cyan-700 bg-cyan-50 border border-cyan-200 px-2 py-0.5 rounded-full">
                          {formatTimestamp(finding.timestamp_seconds)}
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
                        What we saw
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
                        Why it matters
                      </div>
                      <p className="text-sm text-slate-700 leading-relaxed">{finding.why_it_matters}</p>
                    </div>
                  )}
                  {finding.cue && (
                    <div className="pl-4 border-l-4 border-cyan-500 bg-cyan-50/50 rounded-r-lg p-3">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-cyan-700 mb-1.5 flex items-center gap-1.5">
                        <Target className="w-3.5 h-3.5" /> What to feel in the water
                      </div>
                      <p className="text-sm font-semibold text-slate-900 leading-relaxed">{finding.cue}</p>
                    </div>
                  )}
                  {finding.drill && (
                    <div className="flex flex-col gap-2.5 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg px-4 py-2.5 border border-blue-100 sm:flex-row">
                      <Dumbbell className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="text-[10px] font-bold uppercase tracking-wider text-blue-700 mb-0.5">Recommended Drill</div>
                        <p className="text-sm text-slate-800 leading-relaxed">{finding.drill}</p>
                        {finding.linked_drill_summary && (
                          <div className="mt-2 rounded-lg bg-white/70 px-3 py-2">
                            <div className="text-[10px] font-bold uppercase tracking-wider text-blue-700">Why it helps</div>
                            <p className="text-xs text-slate-600 leading-relaxed mt-1">{finding.linked_drill_summary}</p>
                          </div>
                        )}
                        {Array.isArray(finding.extra_drills) && finding.extra_drills.length > 0 && (
                          <div className="mt-2 rounded-lg bg-white/70 px-3 py-2">
                            <div className="text-[10px] font-bold uppercase tracking-wider text-blue-700">Additional drills</div>
                            <ul className="mt-1 space-y-0.5">
                              {finding.extra_drills.map((drill, drillIndex) => (
                                <li key={drillIndex} className="text-xs text-slate-700 leading-relaxed">
                                  <span className="font-semibold">{drill.title}</span>{drill.summary ? ` — ${drill.summary}` : ''}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  {finding.next_focus && (
                    <div className="flex flex-col gap-2.5 bg-slate-50 rounded-lg px-4 py-2.5 border border-slate-100 sm:flex-row">
                      <Target className="w-4 h-4 text-slate-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-0.5">Next focus</div>
                        <p className="text-sm text-slate-700 leading-relaxed">{finding.next_focus}</p>
                      </div>
                    </div>
                  )}
                  {linkedAnnotations.length > 0 && (
                    <div className="pt-3 border-t border-slate-100">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                        Marked frames for this finding
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {linkedAnnotations.map((annotation, annotationIndex) => (
                          <PublicAnnotationCard
                            key={`${finding.finding_name}-${annotationIndex}`}
                            annotation={annotation}
                            linkedFindingTitle={finding.finding_name}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
            })}
          </div>
        </div>
      )}

      {unlinkedAnnotations.length > 0 && (
        <div className="px-4 py-6 border-t border-slate-200 sm:px-8">
          <h2 className="text-lg font-bold text-slate-900 uppercase tracking-wider mb-5 flex items-center gap-2">
            <span className="w-1 h-6 bg-gradient-to-b from-emerald-500 to-teal-600 rounded-full"></span>
            Coach-Selected Key Moments <span className="text-sm font-normal text-slate-500">({unlinkedAnnotations.length})</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {unlinkedAnnotations.map((annotation, index) => (
              <PublicAnnotationCard key={index} annotation={annotation} />
            ))}
          </div>
        </div>
      )}

      {/* Drag Risk Section — approved + included only, public-safe fields */}
      <DragRiskReportSection dragItems={dragItems} />

      {/* Disclaimer */}
      <div className="mx-4 mb-5 p-3 rounded-lg bg-slate-50 border border-slate-200 sm:mx-8">
        <p className="text-[10px] text-slate-500 leading-relaxed text-center">
          {aiUsed
            ? 'This report was reviewed and approved by a coach. AI-assisted suggestions were coach-reviewed, and may have been edited or rejected, before sharing.'
            : 'Prepared by the coach using Swim Sight 3D. Coach-created technical review.'}
        </p>
      </div>

      {/* Footer */}
      <div className="px-4 py-5 bg-gradient-to-r from-slate-50 to-slate-100 border-t border-slate-200 sm:px-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
              <Waves className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-700">Swim Sight 3D</div>
              <div className="text-[10px] text-slate-500">Coach-reviewed swimming analysis</div>
            </div>
          </div>
          {reportDate && (
            <div className="text-xs text-slate-500 sm:text-right">
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
      .then(res => {
        const safeReport = sanitizePublicReportPayload(res.data);
        if (!safeReport.report) throw new Error('Report not found or not ready to share.');
        setData(safeReport);
      })
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

  const { report, swimmer, club, video_meta, findings, annotations = [], drag_items = [] } = data;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Top branding bar */}
      <div className="bg-slate-900/80 backdrop-blur-sm border-b border-slate-700 px-4 py-4 print:hidden sticky top-0 z-50">
        <div className="max-w-4xl mx-auto flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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
          annotations={annotations}
          dragItems={drag_items}
        />
        <div className="mt-6 text-center text-xs text-slate-500 print:hidden">
          <div className="text-[10px] text-slate-500">Coach-reviewed swimming technique report</div>
        </div>
      </div>
    </div>
  );
}
