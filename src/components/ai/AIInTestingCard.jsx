import React from 'react';
import { Sparkles, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Shown to normal coaches wherever AI review is offered while the manual-first
// pilot lock is active (see src/lib/aiPilotLock.js). Keeps the app feeling
// complete — AI is presented as "in testing / coming later", not broken — and
// points the coach straight at the manual Coach Studio flow.
export default function AIInTestingCard({ onOpenCoachStudio, openPending = false, className = '' }) {
  return (
    <div className={`rounded-xl border border-sky-200 bg-sky-50 p-4 space-y-3 ${className}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-sky-100 text-sky-700">
            <Sparkles className="h-4 w-4" />
          </span>
          <div className="text-sm font-bold text-slate-900">AI Analysis — In Testing</div>
        </div>
        <span className="flex-shrink-0 rounded-full border border-sky-200 bg-white px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-sky-700">
          Coming later
        </span>
      </div>
      <p className="text-xs leading-relaxed text-slate-700">
        AI-assisted suggestions are currently being tested privately. For this pilot, coaches complete
        reviews manually so every finding is coach-approved and reliable.
      </p>
      <p className="text-xs leading-relaxed text-slate-600">
        You can still upload videos, mark key moments, add findings, draw over frames, attach drills,
        finalise reports, and share them with swimmers or parents.
      </p>
      {onOpenCoachStudio && (
        <Button
          className="w-full bg-primary text-primary-foreground sm:w-auto"
          onClick={onOpenCoachStudio}
          disabled={openPending}
        >
          {openPending ? 'Opening…' : (<>Open Coach Studio <ArrowRight className="ml-1.5 h-4 w-4" /></>)}
        </Button>
      )}
    </div>
  );
}
