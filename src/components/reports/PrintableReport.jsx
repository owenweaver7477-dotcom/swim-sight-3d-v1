import React from 'react';
import { format } from 'date-fns';
import { CheckCircle2, Star, Target, Dumbbell, Waves, Download, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import DragRiskReportSection from '@/components/drag/DragRiskReportSection';
import { drawingToSvg, formatTimestamp } from '@/lib/annotationRender';

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

function AnnotationPrintCard({ annotation, linkedFinding }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden print:break-inside-avoid">
      <div
        className="bg-slate-950"
        style={{ aspectRatio: `${annotation.canvas_width || 16}/${annotation.canvas_height || 9}` }}
        dangerouslySetInnerHTML={{
          __html: drawingToSvg(annotation.drawing_data, {
            width: annotation.canvas_width,
            height: annotation.canvas_height,
          }),
        }}
      />
      <div className="p-3">
        <div className="text-[10px] font-bold uppercase tracking-wider text-teal-700 mb-1 flex items-center gap-1.5">
          <Pencil className="w-3 h-3" /> Coach-created annotation
        </div>
        <div className="text-sm font-semibold text-slate-900">{annotation.title || 'Marked frame'}</div>
        <div className="text-[10px] font-mono text-blue-600 mt-0.5">
          Frame {annotation.frame_label || annotation.video_frame_time_label || formatTimestamp(annotation.timestamp_seconds)}
        </div>
        {linkedFinding && (
          <div className="text-[10px] text-slate-500 mt-1">
            Linked finding: <span className="font-semibold text-slate-700">{linkedFinding.finding_name || linkedFinding.observation}</span>
          </div>
        )}
        {annotation.coach_note && <p className="text-sm text-slate-600 mt-1 leading-relaxed">{annotation.coach_note}</p>}
      </div>
    </div>
  );
}

export default function PrintableReport({ report, swimmer, club, video_meta, findings, annotations = [], dragItems = [], share_link, showPrintButton = false }) {
  const reportDate = report.ai_completed_at || report.created_date;
  const findingIds = new Set((findings || []).map(finding => finding.id));
  const annotationsByFinding = new Map();
  (annotations || []).forEach(annotation => {
    if (!annotation.finding_id || !findingIds.has(annotation.finding_id)) return;
    const group = annotationsByFinding.get(annotation.finding_id) || [];
    group.push(annotation);
    annotationsByFinding.set(annotation.finding_id, group);
  });
  const unlinkedAnnotations = (annotations || []).filter(annotation => !annotation.finding_id || !findingIds.has(annotation.finding_id));

  const handlePrint = () => {
    window.scrollTo(0, 0);
    setTimeout(() => window.print(), 100);
  };

  return (
    <div className="printable-report-area-content">
      {/* Print button - hidden during print */}
      {showPrintButton && (
        <div className="print:hidden mb-8 flex justify-end">
          <Button
            onClick={handlePrint}
            className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white shadow-lg"
            size="lg"
          >
            <Download className="w-5 h-5 mr-2" />
            Download PDF
          </Button>
        </div>
      )}

      {/* Report Container - A4 style */}
      <div className="print-report max-w-4xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden print:shadow-none print:rounded-none print:max-w-none">
        {/* Header - Navy gradient */}
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
          
          {/* Club info */}
          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10 print:border-slate-200">
            <div>
              <div className="text-[10px] uppercase tracking-wider text-slate-400 print:text-slate-500 mb-0.5">Club</div>
              <div className="font-semibold">{club?.name || 'Swim Club'}</div>
            </div>
            <div className="text-right">
              <div className="text-[10px] uppercase tracking-wider text-slate-400 print:text-slate-500 mb-0.5">Report Date</div>
              <div className="font-semibold">{reportDate ? format(new Date(reportDate), 'dd MMMM yyyy') : 'N/A'}</div>
            </div>
          </div>
        </div>

        {/* Athlete Information */}
        <div className="px-8 py-5 bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200 print:bg-slate-50">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <div className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">Swimmer</div>
              <div className="text-lg font-bold text-slate-900">{swimmer?.name || 'N/A'}</div>
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
            {video_meta?.camera_angle && (
              <div>
                <div className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">Camera Angle</div>
                <div className="text-sm text-slate-900">{video_meta.camera_angle}</div>
              </div>
            )}
          </div>
        </div>

        {/* Overall Score */}
        {report.overall_score != null && (
          <div className="px-8 py-6 border-b border-slate-200 print:break-inside-avoid">
            <div className="flex items-center gap-5">
              <div className="flex-shrink-0">
                <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex flex-col items-center justify-center text-white shadow-lg print:shadow-none">
                  <span className="text-4xl font-black">{report.overall_score}</span>
                  <span className="text-[10px] font-semibold uppercase tracking-wider opacity-90">Score</span>
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-2">Overall Technique Score</h3>
                <div className="flex gap-1 mb-3">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className={`w-5 h-5 ${i < Math.round(report.overall_score / 20) ? 'text-yellow-400 fill-yellow-400' : 'text-slate-200'}`} />
                  ))}
                </div>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {report.overall_score >= 80 ? 'Excellent technique with minor areas for refinement.' :
                   report.overall_score >= 65 ? 'Good foundation with several areas for improvement.' :
                   'Significant technical adjustments recommended.'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Technical Summary */}
        {report.technical_summary && (
          <div className="px-8 py-6 border-b border-slate-200 print:break-inside-avoid">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">Technical Summary</h3>
            <p className="text-sm text-slate-700 leading-relaxed">{report.technical_summary}</p>
          </div>
        )}

        {/* Approved Findings */}
        {findings && findings.length > 0 && (
          <div className="px-8 py-6">
            <h2 className="text-lg font-bold text-slate-900 uppercase tracking-wider mb-5 flex items-center gap-2">
              <span className="w-1 h-6 bg-gradient-to-b from-cyan-500 to-blue-600 rounded-full"></span>
              Technical Findings <span className="text-sm font-normal text-slate-500">({findings.length})</span>
            </h2>

            <div className="space-y-4">
              {findings.map((finding, index) => (
                <div key={finding.id} className="rounded-xl border border-slate-200 bg-white overflow-hidden print:break-inside-avoid print:border-slate-300">
                  {/* Finding Header */}
                  <div className="px-5 py-3 bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200 print:bg-slate-50">
                    <div className="flex items-start gap-3 flex-wrap">
                      <span className="text-xs font-bold text-slate-400 flex-shrink-0 mt-0.5 font-mono">{index + 1}.</span>
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

                  {/* Finding Content */}
                  <div className="px-5 py-4 space-y-3.5">
                    {finding.coach_sees && (
                      <div>
                        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-cyan-500"></span>
                          Observation
                        </div>
                        <p className="text-sm text-slate-700 leading-relaxed">
                          {finding.coach_sees.split('\n\nCoach should check: ')[0]}
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
                      <div className="pl-4 border-l-4 border-cyan-500 bg-cyan-50/50 print:bg-cyan-50 rounded-r-lg p-3">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-cyan-700 mb-1.5 flex items-center gap-1.5">
                          <Target className="w-3.5 h-3.5" />
                          Correction Cue
                        </div>
                        <p className="text-sm font-semibold text-slate-900 leading-relaxed">{finding.cue}</p>
                      </div>
                    )}
                    {finding.drill && (
                      <div className="flex items-start gap-2.5 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg px-4 py-2.5 border border-blue-100 print:border-blue-200">
                        <Dumbbell className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <div className="text-[10px] font-bold uppercase tracking-wider text-blue-700 mb-0.5">Recommended Drill</div>
                          <p className="text-sm text-slate-800 leading-relaxed">{finding.drill}</p>
                        </div>
                      </div>
                    )}
                    {finding.next_focus && (
                      <div className="flex items-start gap-2.5 bg-slate-50 rounded-lg px-4 py-2.5 border border-slate-100 print:border-slate-200">
                        <Target className="w-4 h-4 text-slate-500 flex-shrink-0 mt-0.5" />
                        <div>
                          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-0.5">Next Focus</div>
                          <p className="text-sm text-slate-700 leading-relaxed">{finding.next_focus}</p>
                        </div>
                      </div>
                    )}
                    {(annotationsByFinding.get(finding.id) || []).length > 0 && (
                      <div className="pt-3 border-t border-slate-100">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                          Marked frames for this finding
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {annotationsByFinding.get(finding.id).map(annotation => (
                            <AnnotationPrintCard key={annotation.id} annotation={annotation} linkedFinding={finding} />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Standalone coach annotations included in report */}
        {unlinkedAnnotations.length > 0 && (
          <div className="px-8 py-6 border-t border-slate-200">
            <h2 className="text-lg font-bold text-slate-900 uppercase tracking-wider mb-5 flex items-center gap-2">
              <span className="w-1 h-6 bg-gradient-to-b from-emerald-500 to-teal-600 rounded-full"></span>
              Included Coach Annotations <span className="text-sm font-normal text-slate-500">({unlinkedAnnotations.length})</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {unlinkedAnnotations.map(annotation => (
                <AnnotationPrintCard key={annotation.id} annotation={annotation} />
              ))}
            </div>
          </div>
        )}

        {/* Drag Risk Section */}
        <DragRiskReportSection dragItems={dragItems} />

        {/* Footer */}
        <div className="px-8 py-5 bg-gradient-to-r from-slate-50 to-slate-100 border-t border-slate-200 print:bg-slate-50 print:border-slate-300">
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
            <div className="text-right space-y-0.5">
              {reportDate && (
                <div className="text-xs text-slate-500">
                  Generated {format(new Date(reportDate), 'dd MMMM yyyy')}
                </div>
              )}
              <div className="text-[10px] text-slate-400">
                Coach-Approved Report
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
