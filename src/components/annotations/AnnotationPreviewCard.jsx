import React from 'react';
import { Button } from '@/components/ui/button';
import { drawingToSvg, formatTimestamp } from '@/lib/annotationRender';
import { CheckCircle2, Link2, Trash2 } from 'lucide-react';

export default function AnnotationPreviewCard({
  annotation,
  findings = [],
  onUpdate,
  onDelete,
  canEdit = true,
}) {
  const drawing = annotation.drawing_data || {};
  const svg = drawingToSvg(drawing, {
    width: annotation.canvas_width,
    height: annotation.canvas_height,
  });

  return (
    <div className="rounded-xl bg-card border border-border overflow-hidden">
      <div
        className="bg-slate-950"
        style={{ aspectRatio: `${annotation.canvas_width || 16}/${annotation.canvas_height || 9}` }}
        dangerouslySetInnerHTML={{ __html: svg }}
      />
      <div className="p-3 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="text-xs font-semibold text-foreground">
              {annotation.title || 'Coach-created annotation'}
            </div>
            <div className="text-[10px] text-muted-foreground">
              Frame {annotation.video_frame_time_label || formatTimestamp(annotation.timestamp_seconds)}
            </div>
          </div>
          {annotation.include_in_report && (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-200 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Included
            </span>
          )}
        </div>
        {annotation.coach_note && (
          <p className="text-[11px] text-muted-foreground leading-relaxed">{annotation.coach_note}</p>
        )}

        {canEdit && (
          <div className="space-y-2">
            <select
              value={annotation.finding_id || ''}
              onChange={e => onUpdate(annotation, { finding_id: e.target.value || null })}
              className="w-full h-8 rounded-md border border-input bg-background px-2 text-xs"
            >
              <option value="">Attach to finding...</option>
              {findings.map(finding => (
                <option key={finding.id} value={finding.id}>
                  {finding.finding_name || finding.observation}
                </option>
              ))}
            </select>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant={annotation.include_in_report ? 'default' : 'outline'}
                className="h-8 text-xs flex-1"
                onClick={() => onUpdate(annotation, {
                  include_in_report: !annotation.include_in_report,
                  is_public: !annotation.include_in_report,
                })}
              >
                <Link2 className="w-3.5 h-3.5 mr-1" />
                {annotation.include_in_report ? 'Included in report' : 'Include in report'}
              </Button>
              <Button size="sm" variant="outline" className="h-8 text-xs text-destructive" onClick={() => onDelete(annotation)}>
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
