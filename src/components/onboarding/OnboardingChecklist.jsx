import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CheckCircle2, Circle, ChevronRight, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

const STEPS = [
  {
    id: 'club',
    label: 'Create club workspace',
    description: 'Set up your club so videos and reports can be linked to the right team.',
    link: '/club-onboarding',
    cta: 'Create Club',
  },
  {
    id: 'swimmer',
    label: 'Add first swimmer',
    description: 'Create a swimmer profile so videos and reports can be linked to the correct athlete.',
    link: '/swimmers',
    cta: 'Add Swimmer',
  },
  {
    id: 'video',
    label: 'Upload first video',
    description: 'Upload a swim clip — select stroke type, camera angle, and swimmer before uploading.',
    link: '/analyse',
    cta: 'Upload Video',
  },
  {
    id: 'ai_job',
    label: 'Send video for AI Review',
    description: 'In Analyse Video, open the uploaded video card and click "Send to AI Analysis".',
    link: '/analyse',
    cta: 'Go to Analyse',
  },
  {
    id: 'finding',
    label: 'Add a coach finding',
    description: 'In the AI Review, approve AI suggestions or add your own manual finding with a coaching cue.',
    link: '/ai-reviews',
    cta: 'Open AI Reviews',
  },
  {
    id: 'report',
    label: 'Finalise first report',
    description: 'Once findings are reviewed, click "Finalise Coach Report" to lock the report.',
    link: '/ai-reviews',
    cta: 'Open AI Reviews',
  },
  {
    id: 'share',
    label: 'Share or export report',
    description: 'Download as PDF or create a share link to send to the swimmer or parent.',
    link: '/ai-reviews',
    cta: 'Open AI Reviews',
  },
];

export default function OnboardingChecklist({ completed, onDismiss }) {
  const navigate = useNavigate();
  const doneCount = STEPS.filter(s => completed[s.id]).length;
  const allDone = doneCount === STEPS.length;

  if (allDone) return null;

  return (
    <div className="p-5 rounded-xl bg-card border border-primary/20 mb-8">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-primary mb-0.5">Getting Started</div>
          <div className="text-sm font-semibold text-foreground">Coach Onboarding — {doneCount}/{STEPS.length} complete</div>
        </div>
        <div className="flex items-center gap-3">
          <div className="h-1.5 w-24 bg-secondary rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${(doneCount / STEPS.length) * 100}%` }} />
          </div>
          {onDismiss && (
            <button onClick={onDismiss} className="text-muted-foreground hover:text-foreground transition-colors">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <div className="space-y-2">
        {STEPS.map((step, i) => {
          const done = !!completed[step.id];
          return (
            <div
              key={step.id}
              className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                done ? 'bg-secondary/30 border-border opacity-60' : 'bg-white border-border hover:border-primary/30'
              }`}
            >
              <div className="flex-shrink-0">
                {done
                  ? <CheckCircle2 className="w-4 h-4 text-green-500" />
                  : <Circle className="w-4 h-4 text-muted-foreground" />
                }
              </div>
              <div className="flex-1 min-w-0">
                <div className={`text-xs font-semibold ${done ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                  {i + 1}. {step.label}
                </div>
                {!done && (
                  <p className="text-[10px] text-muted-foreground mt-0.5 leading-relaxed">{step.description}</p>
                )}
              </div>
              {!done && (
                <button
                  onClick={() => navigate(step.link)}
                  className="flex-shrink-0 flex items-center gap-1 text-[10px] font-semibold text-primary hover:underline"
                >
                  {step.cta} <ChevronRight className="w-3 h-3" />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}