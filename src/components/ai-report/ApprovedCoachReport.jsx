import React from 'react';
import { SeverityBadge } from './AIFindingCard';
import { CheckCircle2, Star, Activity, Target, PencilLine, Dumbbell } from 'lucide-react';
import { formatTimestamp } from '@/lib/annotationRender';
import { sanitizePublicAnnotations, sanitizePublicFindings } from '@/lib/sanitizeAIReport';

function AnnotationCard({ annotation, linkedFinding }) {
  const safeThumbnail = typeof annotation.thumbnail_data_url === 'string' && annotation.thumbnail_data_url.startsWith('data:image/')
    ? annotation.thumbnail_data_url
    : null;
  const label = annotation.annotation_type === 'key_frame' ? 'Coach-selected key moment' : 'Coach-created annotation';
  return (
    <div className="rounded-lg bg-card border border-border overflow-hidden">
      {safeThumbnail ? (
        <img src={safeThumbnail} alt={annotation.title || label} className="w-full bg-slate-950 object-contain" />
      ) : (
        <div
          className="bg-slate-950"
          style={{ aspectRatio: `${annotation.canvas_width || 16}/${annotation.canvas_height || 9}` }}
          dangerouslySetInnerHTML={{
            __html: annotation.rendered_svg || '',
          }}
        />
      )}
      <div className="p-2.5">
        <div className="text-[10px] font-bold uppercase tracking-wider text-primary mb-1">{label}</div>
        <div className="text-xs font-semibold text-foreground">{annotation.title || 'Marked frame'}</div>
        <div className="text-[10px] text-muted-foreground">
          Frame {annotation.frame_label || annotation.video_frame_time_label || formatTimestamp(annotation.timestamp_seconds)}
        </div>
        {linkedFinding && (
          <div className="text-[10px] text-muted-foreground mt-1">
            Linked finding: <span className="font-semibold text-foreground">{linkedFinding.finding_name || linkedFinding.observation}</span>
          </div>
        )}
        {annotation.note && <p className="text-[10px] text-muted-foreground mt-1">{annotation.note}</p>}
      </div>
    </div>
  );
}

export default function ApprovedCoachReport({ report, swimmer, video, approvedFindings: inputFindings = [], annotations: inputAnnotations = [] }) {
  const approvedFindings = sanitizePublicFindings(inputFindings);
  const annotations = sanitizePublicAnnotations(inputAnnotations);
  const approvedFindingIds = new Set(approvedFindings.map(finding => finding.id));
  const annotationsByFinding = new Map();
  annotations.forEach(annotation => {
    if (!annotation.finding_id || !approvedFindingIds.has(annotation.finding_id)) return;
    const group = annotationsByFinding.get(annotation.finding_id) || [];
    group.push(annotation);
    annotationsByFinding.set(annotation.finding_id, group);
  });
  const unlinkedAnnotations = annotations.filter(annotation => !annotation.finding_id || !approvedFindingIds.has(annotation.finding_id));

  if (approvedFindings.length === 0 && annotations.length === 0) {
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
              Coach Findings ({approvedFindings.length})
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
                      {f.timestamp_start != null && (
                        <span className="text-[10px] font-mono text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                          {formatTimestamp(f.timestamp_start)}
                        </span>
                      )}
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
                    <div className="text-[10px] uppercase tracking-wider text-primary font-semibold mb-0.5">What to feel in the water</div>
                    <p className="text-xs text-foreground font-medium">{f.cue}</p>
                  </div>
                )}

                {f.drill && (
                  <div className="flex items-start gap-2 text-xs text-muted-foreground bg-blue-50 border border-blue-100 rounded px-2.5 py-2">
                    <Dumbbell className="w-3 h-3 flex-shrink-0 mt-0.5 text-blue-600" />
                    <span><strong className="text-blue-700">Recommended drill:</strong> {f.drill}</span>
                  </div>
                )}

                {f.next_focus && (
                  <div className="flex items-start gap-2 text-xs text-muted-foreground bg-secondary/50 rounded px-2.5 py-2">
                    <Target className="w-3 h-3 flex-shrink-0 mt-0.5 text-primary" />
                    <span>{f.next_focus}</span>
                  </div>
                )}

                {(annotationsByFinding.get(f.id) || []).length > 0 && (
                  <div className="ml-4 pt-2 border-t border-border">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
                      Marked frames for this finding
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {annotationsByFinding.get(f.id).map(annotation => (
                        <AnnotationCard key={annotation.id} annotation={annotation} linkedFinding={f} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {unlinkedAnnotations.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2.5">
              <PencilLine className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs font-bold text-foreground uppercase tracking-wider">
                Included Coach Annotations ({unlinkedAnnotations.length})
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {unlinkedAnnotations.map(annotation => (
                <AnnotationCard key={annotation.id} annotation={annotation} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
