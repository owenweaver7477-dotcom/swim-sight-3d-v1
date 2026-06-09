import React from 'react';
import AnnotationPreviewCard from './AnnotationPreviewCard';
import { PencilLine } from 'lucide-react';

export default function AnnotationTimeline({ annotations = [], findings = [], onUpdate, onDelete, canEdit = true }) {
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

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {annotations.map(annotation => (
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
  );
}
