import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Pencil, BookOpen, Eye, EyeOff, Paperclip, Check, X, ChevronDown, ChevronUp } from 'lucide-react';
import VideoAnnotator from './VideoAnnotator';

export default function AnnotationsPanel({ videoUploadId, swimmerId, clubId, reportId, sessionId, findings = [], strokeType, canEdit }) {
  const [open, setOpen] = useState(false);
  const [showAnnotator, setShowAnnotator] = useState(false);
  const [filterFinding, setFilterFinding] = useState('');
  const queryClient = useQueryClient();

  const { data: annotations = [] } = useQuery({
    queryKey: ['annotations', videoUploadId],
    queryFn: () => base44.entities.Annotation.filter({ video_upload_id: videoUploadId }, '-created_date', 100),
    enabled: !!videoUploadId,
  });

  const updateAnnotation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Annotation.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['annotations', videoUploadId] }),
  });

  const filtered = filterFinding
    ? annotations.filter(a => a.finding_id === filterFinding)
    : annotations;

  const reportAnnotations = annotations.filter(a => a.is_included_in_report);

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between p-4 text-sm hover:bg-secondary/30 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Pencil className="w-4 h-4 text-primary" />
          <span className="font-semibold text-foreground">Coach Annotations</span>
          {annotations.length > 0 && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">{annotations.length}</span>
          )}
          {reportAnnotations.length > 0 && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-900/20 text-green-400 font-medium">{reportAnnotations.length} in report</span>
          )}
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>

      {open && (
        <div className="border-t border-border p-4 space-y-4">
          {/* Honesty notice */}
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground p-2 rounded bg-secondary/50">
            <BookOpen className="w-3 h-3 flex-shrink-0" />
            All annotations shown here are <strong className="text-foreground mx-1">coach-created</strong> unless explicitly labelled "AI suggested".
          </div>

          {/* Filter by finding */}
          {findings.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-muted-foreground">Filter:</span>
              <button
                onClick={() => setFilterFinding('')}
                className={`text-[10px] px-2 py-0.5 rounded-full border ${!filterFinding ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground'}`}
              >All</button>
              {findings.map(f => (
                <button
                  key={f.id}
                  onClick={() => setFilterFinding(f.id)}
                  className={`text-[10px] px-2 py-0.5 rounded-full border truncate max-w-[120px] ${filterFinding === f.id ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground'}`}
                >
                  {f.finding_name}
                </button>
              ))}
            </div>
          )}

          {/* Annotations list */}
          {filtered.length === 0 ? (
            <div className="text-[11px] text-muted-foreground text-center py-4">
              No annotations yet. Use the drawing tools below to add one.
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map(a => {
                const linkedFinding = findings.find(f => f.id === a.finding_id);
                return (
                  <div key={a.id} className="p-3 rounded-lg bg-secondary/40 border border-border/50 space-y-1.5">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: a.colour || '#00A6C8' }} />
                      <span className="text-xs font-medium text-foreground flex-1">{a.label || a.annotation_type}</span>
                      {a.video_time_label && (
                        <span className="text-[10px] font-mono text-primary bg-primary/10 px-1.5 rounded">@ {a.video_time_label}</span>
                      )}
                    </div>
                    {a.note && <div className="text-[10px] text-muted-foreground ml-5">{a.note}</div>}
                    {linkedFinding && (
                      <div className="flex items-center gap-1 ml-5 text-[10px] text-primary">
                        <Paperclip className="w-3 h-3" /> Linked to: {linkedFinding.finding_name}
                      </div>
                    )}
                    <div className="flex items-center gap-2 ml-5">
                      <span className="text-[9px] text-muted-foreground">Coach annotation</span>
                      {canEdit && (
                        <>
                          <button
                            onClick={() => updateAnnotation.mutate({ id: a.id, data: { is_included_in_report: !a.is_included_in_report } })}
                            className={`text-[9px] flex items-center gap-0.5 px-1.5 py-0.5 rounded border transition-colors ${
                              a.is_included_in_report
                                ? 'bg-green-900/20 text-green-400 border-green-700/30'
                                : 'bg-secondary text-muted-foreground border-border'
                            }`}
                          >
                            {a.is_included_in_report ? <Check className="w-2.5 h-2.5" /> : <X className="w-2.5 h-2.5" />}
                            {a.is_included_in_report ? 'In report' : 'Exclude'}
                          </button>
                          <button
                            onClick={() => updateAnnotation.mutate({ id: a.id, data: { visibility: a.visibility === 'shared_report' ? 'coach_only' : 'shared_report' } })}
                            className={`text-[9px] flex items-center gap-0.5 px-1.5 py-0.5 rounded border transition-colors ${
                              a.visibility === 'shared_report'
                                ? 'bg-primary/10 text-primary border-primary/20'
                                : 'bg-secondary text-muted-foreground border-border'
                            }`}
                          >
                            {a.visibility === 'shared_report' ? <Eye className="w-2.5 h-2.5" /> : <EyeOff className="w-2.5 h-2.5" />}
                            {a.visibility === 'shared_report' ? 'Shared' : 'Private'}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Drawing tools toggle */}
          {canEdit && (
            <div>
              <Button
                size="sm"
                variant={showAnnotator ? 'secondary' : 'outline'}
                className="h-8 text-xs w-full"
                onClick={() => setShowAnnotator(v => !v)}
              >
                <Pencil className="w-3.5 h-3.5 mr-1.5" />
                {showAnnotator ? 'Hide Drawing Tools' : 'Open Drawing Tools'}
              </Button>
              {showAnnotator && (
                <div className="mt-3">
                  <VideoAnnotator
                    videoUploadId={videoUploadId}
                    swimmerId={swimmerId}
                    clubId={clubId}
                    reportId={reportId}
                    sessionId={sessionId}
                    findings={findings}
                    strokeType={strokeType}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}