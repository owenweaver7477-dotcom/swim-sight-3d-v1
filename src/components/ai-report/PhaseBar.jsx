import React from 'react';

// Small horizontal score bar for a stroke-phase breakdown row.
// Pure presentational — extracted from AIReportPage (Batch 9B maintainability).
export default function PhaseBar({ label, score }) {
  const pct = Math.min(100, Math.max(0, score));
  const color = pct >= 80 ? 'bg-green-500' : pct >= 65 ? 'bg-yellow-500' : 'bg-orange-500';
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-[10px]">
        <span className="text-muted-foreground capitalize">{label.replace(/_/g, ' ')}</span>
        <span className="text-foreground font-semibold">{score}</span>
      </div>
      <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
