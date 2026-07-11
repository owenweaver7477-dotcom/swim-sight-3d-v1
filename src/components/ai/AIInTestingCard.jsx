import React from 'react';
import { LockKeyhole, Sparkles, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Shown to coaches wherever AI review is offered while the manual-first pilot
// lock is active (see src/lib/aiPilotLock.js). Deliberately premium — a frosted
// gradient "behind glass / coming later" panel, not an error card — so AI reads
// as an intentional future feature, and the coach is pointed at manual Coach Studio.
export default function AIInTestingCard({ onOpenCoachStudio, openPending = false, className = '' }) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-sky-200/70 bg-gradient-to-br from-sky-50 via-white to-cyan-50 p-5 shadow-sm ring-1 ring-inset ring-white/50 ${className}`}
    >
      {/* Soft decorative light — sells the frosted "coming later" feel */}
      <div aria-hidden="true" className="pointer-events-none absolute -right-10 -top-12 h-36 w-36 rounded-full bg-cyan-300/25 blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute -bottom-12 left-8 h-32 w-32 rounded-full bg-sky-400/15 blur-3xl" />

      <div className="relative space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500/15 to-cyan-500/10 text-sky-700 ring-1 ring-inset ring-sky-300/50">
              <LockKeyhole className="h-4 w-4" />
            </span>
            <div className="text-sm font-bold text-slate-900">AI Analysis — In Testing</div>
          </div>
          <span className="inline-flex flex-shrink-0 items-center gap-1 rounded-full border border-sky-200 bg-white/70 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-sky-700 backdrop-blur">
            <Sparkles className="h-3 w-3" /> Coming later
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
    </div>
  );
}
