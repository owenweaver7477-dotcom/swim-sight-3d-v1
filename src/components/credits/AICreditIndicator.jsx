import React from 'react';
import { Coins } from 'lucide-react';

export default function AICreditIndicator({ selectedFocusCount = 0, selectedOutputCount = 0, estimatedCredits, mode = 'ai', compact = false }) {
  const manual = mode === 'manual';
  const estimate = manual ? 0 : Number.isFinite(Number(estimatedCredits))
    ? Number(estimatedCredits)
    : Math.max(1, selectedOutputCount || selectedFocusCount || 1);
  return (
    <div className={`rounded-lg border border-cyan-200 bg-cyan-50 text-cyan-950 ${compact ? 'px-3 py-2' : 'p-3'}`}>
      <div className="flex items-start gap-2">
        <Coins className="mt-0.5 h-4 w-4 flex-shrink-0 text-cyan-700" aria-hidden="true" />
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold">{manual ? 'Manual review: 0 AI credits' : `Estimated AI credits: ${estimate}`}</span>
            <span className="rounded-full border border-cyan-200 bg-white px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-cyan-700">Estimate only</span>
          </div>
          <p className="mt-1 text-[10px] leading-4 text-cyan-900/80">
            {manual
              ? 'No AI credits are used in manual review.'
              : 'Final billing may differ until production credit tracking is fully enabled. No charge is confirmed by this estimate.'}
          </p>
        </div>
      </div>
    </div>
  );
}
