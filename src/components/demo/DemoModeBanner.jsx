import React from 'react';
import { FlaskRound, X } from 'lucide-react';
import { isDemoMode, exitDemoMode, onDemoModeChange } from '@/lib/demoMode';

/**
 * Persistent, unmissable marker that the coach is looking at example data, with a
 * one-click exit. It is deliberately always visible while demo mode is on — a coach
 * must never mistake the demo squad for their own club.
 */
export default function DemoModeBanner() {
  const [active, setActive] = React.useState(isDemoMode());
  React.useEffect(() => onDemoModeChange(setActive), []);
  if (!active) return null;

  return (
    <div role="status" className="sticky top-0 z-40 border-b border-amber-300 bg-amber-100 px-4 py-2 dark:border-amber-500/40 dark:bg-amber-500/15">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-3 gap-y-1">
        <FlaskRound className="h-4 w-4 flex-shrink-0 text-amber-800 dark:text-amber-300" aria-hidden="true" />
        <span className="text-xs font-bold text-amber-900 dark:text-amber-200">Example data</span>
        <span className="text-xs text-amber-900/80 dark:text-amber-200/80">
          You&apos;re exploring a demo squad. Nothing here is saved, and none of it belongs to your club.
        </span>
        <button
          type="button"
          onClick={exitDemoMode}
          className="ml-auto inline-flex min-h-8 items-center gap-1.5 rounded-md border border-amber-400 bg-white px-3 py-1 text-xs font-semibold text-amber-900 transition-colors hover:bg-amber-50 dark:border-amber-400/40 dark:bg-transparent dark:text-amber-200 dark:hover:bg-amber-500/10"
        >
          <X className="h-3.5 w-3.5" aria-hidden="true" /> Exit demo squad
        </button>
      </div>
    </div>
  );
}
