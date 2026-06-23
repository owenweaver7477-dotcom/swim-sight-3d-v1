import React from 'react';
import { CheckSquare2 } from 'lucide-react';
import FeatureStatusBadge from '@/components/status/FeatureStatusBadge';

export const ANALYSIS_FOCUS_OPTIONS = [
  { id: 'body_line', label: 'Body line', mode: 'ai_assisted' },
  { id: 'kick', label: 'Kick', mode: 'ai_assisted' },
  { id: 'pull', label: 'Pull', mode: 'ai_assisted' },
  { id: 'timing', label: 'Timing', mode: 'ai_assisted' },
  { id: 'starts', label: 'Starts', mode: 'manual_focus' },
  { id: 'turns', label: 'Turns', mode: 'manual_focus' },
  { id: 'race_skills', label: 'Race skills', mode: 'manual_focus' },
  { id: 'custom', label: 'Custom coach focus', mode: 'coach_defined' },
];

export default function AnalysisFocusChecklist({ value = [], onChange }) {
  const selected = Array.isArray(value) ? value : [];
  const toggle = (id) => onChange?.(selected.includes(id) ? selected.filter(item => item !== id) : [...selected, id]);

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4" aria-labelledby="analysis-focus-title">
      <div className="flex items-start gap-2">
        <CheckSquare2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-cyan-700" aria-hidden="true" />
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 id="analysis-focus-title" className="text-xs font-bold text-slate-900">Analysis focus checklist</h3>
            <FeatureStatusBadge status="partial" />
          </div>
          <p className="mt-1 text-[11px] leading-5 text-slate-600">Preparing AI instruction payload. These choices guide review context; they do not guarantee a finding.</p>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {ANALYSIS_FOCUS_OPTIONS.map(option => {
          const active = selected.includes(option.id);
          return (
            <button
              key={option.id}
              type="button"
              aria-pressed={active}
              onClick={() => toggle(option.id)}
              className={`min-h-14 rounded-md border px-3 py-2 text-left transition-colors ${active ? 'border-cyan-500 bg-cyan-50 text-cyan-950' : 'border-slate-200 bg-white text-slate-700 hover:border-cyan-300'}`}
            >
              <span className="block text-xs font-semibold">{option.label}</span>
              <span className="mt-0.5 block text-[9px] leading-4 text-slate-500">
                {option.mode === 'manual_focus' ? 'Manual focus only' : option.mode === 'coach_defined' ? 'Coach-defined context' : 'AI-assisted draft'}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
