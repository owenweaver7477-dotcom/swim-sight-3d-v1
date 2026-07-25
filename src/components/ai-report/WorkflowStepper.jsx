import React from 'react';
import { CheckCircle2, Clapperboard, ClipboardCheck, FileText, Share2 } from 'lucide-react';

// Step keys are stable identifiers used by callers; only the labels/icons are
// coach-facing. The first step is the coach marking moments on the video — the
// product is fully coach-authored, so no step is framed as machine-generated.
const STEPS = [
  { key: 'ai',       label: 'Video Review',          icon: Clapperboard },
  { key: 'review',   label: 'Coach Findings',        icon: ClipboardCheck },
  { key: 'final',    label: 'Final Report',          icon: FileText },
  { key: 'export',   label: 'Export / Share',        icon: Share2 },
];

/**
 * currentStep: 'ai' | 'review' | 'final' | 'export'
 */
export default function WorkflowStepper({ currentStep }) {
  const currentIdx = STEPS.findIndex(s => s.key === currentStep);

  return (
    <div className="flex items-center gap-0 overflow-x-auto pb-1">
      {STEPS.map((step, i) => {
        const Icon = step.icon;
        const isDone    = i < currentIdx;
        const isCurrent = i === currentIdx;

        return (
          <React.Fragment key={step.key}>
            <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg flex-shrink-0 transition-colors
              ${isCurrent ? 'bg-primary/10 border border-primary/30' : ''}
              ${isDone ? 'opacity-60' : !isCurrent ? 'opacity-40' : ''}
            `}>
              {isDone ? (
                <CheckCircle2 className="w-3 h-3 text-green-400 flex-shrink-0" />
              ) : (
                <Icon className={`w-3 h-3 flex-shrink-0 ${isCurrent ? 'text-primary' : 'text-muted-foreground'}`} />
              )}
              <span className={`text-[10px] font-semibold whitespace-nowrap ${isCurrent ? 'text-primary' : isDone ? 'text-green-400' : 'text-muted-foreground'}`}>
                {i + 1}. {step.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`w-4 h-px flex-shrink-0 mx-0.5 ${i < currentIdx ? 'bg-green-400/40' : 'bg-border'}`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}