import React from 'react';
import { Film, Layers } from 'lucide-react';

export default function SessionModeSelector({ value, onChange }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <button
        type="button"
        onClick={() => onChange('single_angle')}
        className={`text-left p-4 rounded-xl border-2 transition-all ${
          value === 'single_angle'
            ? 'border-primary bg-primary/5'
            : 'border-border bg-card hover:border-primary/40'
        }`}
      >
        <div className="flex items-center gap-2 mb-2">
          <div className={`p-1.5 rounded-lg ${value === 'single_angle' ? 'bg-primary/10' : 'bg-secondary'}`}>
            <Film className={`w-4 h-4 ${value === 'single_angle' ? 'text-primary' : 'text-muted-foreground'}`} />
          </div>
          <span className="text-sm font-semibold text-foreground">Single Angle Review</span>
          {value === 'single_angle' && (
            <span className="ml-auto text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">Selected</span>
          )}
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Upload one video for coach review and basic pose-assisted checks.
        </p>
      </button>

      <button
        type="button"
        onClick={() => onChange('multi_angle')}
        className={`text-left p-4 rounded-xl border-2 transition-all ${
          value === 'multi_angle'
            ? 'border-primary bg-primary/5'
            : 'border-border bg-card hover:border-primary/40'
        }`}
      >
        <div className="flex items-center gap-2 mb-2">
          <div className={`p-1.5 rounded-lg ${value === 'multi_angle' ? 'bg-primary/10' : 'bg-secondary'}`}>
            <Layers className={`w-4 h-4 ${value === 'multi_angle' ? 'text-primary' : 'text-muted-foreground'}`} />
          </div>
          <span className="text-sm font-semibold text-foreground">Multi-Angle Review</span>
          {value === 'multi_angle' && (
            <span className="ml-auto text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">Selected</span>
          )}
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Recommended for clearer AI-assisted review. Upload side, front/rear, underwater, and above-water angles when available.
        </p>
        <div className="mt-2 inline-flex items-center gap-1 text-[10px] text-primary font-medium bg-primary/10 px-2 py-0.5 rounded-full">
          <span>SwimPro-ready workflow</span>
        </div>
      </button>
    </div>
  );
}