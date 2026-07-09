import React from 'react';

// Step indicator for the Analyse wizard (Swimmer → Video → Configure → Analyse).
// Pure presentational — extracted from Analyse.jsx (Batch 9B maintainability).
export const STEPS = ['Swimmer', 'Video', 'Configure', 'Analyse'];

export default function StepBar({ current }) {
  return (
    <div className="flex items-center gap-0 mb-8">
      {STEPS.map((s, i) => (
        <React.Fragment key={s}>
          <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium transition-all ${
            i < current ? 'text-primary' : i === current ? 'bg-primary/10 text-primary' : 'text-muted-foreground'
          }`}>
            <span className={`w-5 h-5 rounded-full text-[10px] flex items-center justify-center font-bold ${
              i < current ? 'bg-primary text-primary-foreground' :
              i === current ? 'bg-primary/20 text-primary' : 'bg-secondary text-muted-foreground'
            }`}>{i < current ? '✓' : i + 1}</span>
            {s}
          </div>
          {i < STEPS.length - 1 && <div className="flex-1 h-px bg-border mx-1" />}
        </React.Fragment>
      ))}
    </div>
  );
}
