import React from 'react';
import AnnotationPreviewCard from './AnnotationPreviewCard';
import { PencilLine } from 'lucide-react';

export default function AnnotationTimeline({ annotations = [], findings = [], onUpdate, onDelete, canEdit = true }) {
  const findingsById = new Map(findings.map(finding => [finding.id, finding]));

  if (!annotations.length) {
    return (
      <div className="p-5 rounded-xl bg-card border border-dashed border-border text-center">
        <PencilLine className="w-7 h-7 mx-auto text-muted-foreground opacity-30 mb-2" />
        <div className="text-xs font-semibold text-foreground">No coach annotations yet</div>
        <p className="text-[10px] text-muted-foreground mt-1">
          Pause the source video, choose Coach Draw, then save a marked frame.
        </p>
      </div>
    );
  }

  const linkedGroups = findings
    .map(finding => ({
      finding,
      annotations: annotations.filter(annotation => annotation.finding_id === finding.id),
    }))
    .filter(group => group.annotations.length > 0);
  const unlinked = annotations.filter(annotation => !annotation.finding_id || !findingsById.has(annotation.finding_id));

  return (
    <div className="space-y-4">
      {linkedGroups.map(({ finding, annotations: groupAnnotations }) => (
        <div key={finding.id} className="space-y-2">
          <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Attached to finding: <span className="text-foreground normal-case tracking-normal">{finding.finding_name || finding.observation}</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {groupAnnotations.map(annotation => (
              <AnnotationPreviewCard
                key={annotation.id}
                annotation={annotation}
                findings={findings}
                linkedFinding={finding}
                onUpdate={onUpdate}
                onDelete={onDelete}
                canEdit={canEdit}
              />
            ))}
          </div>
        </div>
      ))}

      {unlinked.length > 0 && (
        <div className="space-y-2">
          <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Unlinked report annotations
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {unlinked.map(annotation => (
              <AnnotationPreviewCard
                key={annotation.id}
                annotation={annotation}
                findings={findings}
                onUpdate={onUpdate}
                onDelete={onDelete}
                canEdit={canEdit}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
