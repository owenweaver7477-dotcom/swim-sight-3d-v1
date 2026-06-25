import React from 'react';
import { CheckCircle2, CheckSquare2, ClipboardList } from 'lucide-react';
import FeatureStatusBadge from '@/components/status/FeatureStatusBadge';

export const ANALYSIS_FOCUS_OPTIONS = [
  { id: 'body_line', label: 'Body line', mode: 'ai_assisted', detail: 'Head, hips, streamline and visible alignment cues.' },
  { id: 'kick', label: 'Kick', mode: 'ai_assisted', detail: 'Kick setup, drive, width and timing where visible.' },
  { id: 'pull', label: 'Pull', mode: 'ai_assisted', detail: 'Catch setup, pull pathway and visible arm timing.' },
  { id: 'timing', label: 'Timing', mode: 'ai_assisted', detail: 'Stroke rhythm, phase order and repeated timing signals.' },
  { id: 'starts', label: 'Starts', mode: 'manual_focus', detail: 'Set position, entry, streamline and breakout notes.' },
  { id: 'turns', label: 'Turns', mode: 'manual_focus', detail: 'Approach, wall contact, push-off and breakout notes.' },
  { id: 'race_skills', label: 'Race skills', mode: 'manual_focus', detail: 'Starts, turns, pacing and race-context coaching notes.' },
  { id: 'custom', label: 'Custom coach focus', mode: 'coach_defined', detail: 'Coach-defined question or technical focus for this review.' },
];

const MODE_LABELS = {
  ai_assisted: 'AI-assisted draft',
  manual_focus: 'Manual focus only',
  coach_defined: 'Coach-defined',
};

const MODE_CLASSES = {
  ai_assisted: 'border-cyan-200 bg-cyan-50 text-cyan-800',
  manual_focus: 'border-amber-200 bg-amber-50 text-amber-800',
  coach_defined: 'border-slate-200 bg-slate-50 text-slate-700',
};

export default function AnalysisFocusChecklist({ value = [], onChange, compact = false }) {
  const selected = Array.isArray(value) ? value : [];
  const toggle = (id) => onChange?.(selected.includes(id) ? selected.filter(item => item !== id) : [...selected, id]);

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4" aria-labelledby="analysis-focus-title">
      <div className="flex items-start gap-2">
        <ClipboardList className="mt-0.5 h-4 w-4 flex-shrink-0 text-cyan-700" aria-hidden="true" />
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 id="analysis-focus-title" className="text-xs font-bold text-slate-900">What should the AI-assisted review look for?</h3>
            <FeatureStatusBadge status="partial" />
          </div>
          <p className="mt-1 text-[11px] leading-5 text-slate-600">
            Choose the technical focus before AI submission. AI-assisted items can produce draft evidence when the video is suitable; manual-focus items guide Coach Studio notes and reports.
          </p>
        </div>
      </div>
      <div className={`mt-3 grid gap-2 ${compact ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'}`}>
        {ANALYSIS_FOCUS_OPTIONS.map(option => {
          const active = selected.includes(option.id);
          return (
            <button
              key={option.id}
              type="button"
              aria-pressed={active}
              onClick={() => toggle(option.id)}
              className={`min-h-24 rounded-md border px-3 py-2 text-left transition-colors ${active ? 'border-cyan-500 bg-cyan-50 text-cyan-950' : 'border-slate-200 bg-white text-slate-700 hover:border-cyan-300'}`}
            >
              <span className="flex items-start justify-between gap-2">
                <span className="text-xs font-semibold">{option.label}</span>
                {active && <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0 text-cyan-700" aria-hidden="true" />}
              </span>
              <span className={`mt-1 inline-flex rounded-full border px-2 py-0.5 text-[9px] font-bold ${MODE_CLASSES[option.mode] || MODE_CLASSES.coach_defined}`}>
                {MODE_LABELS[option.mode] || 'Coach-defined'}
              </span>
              <span className="mt-1.5 block text-[10px] leading-4 text-slate-600">
                {option.detail}
              </span>
            </button>
          );
        })}
      </div>
      {selected.length > 0 && (
        <div className="mt-3 flex items-start gap-2 rounded-lg border border-cyan-100 bg-cyan-50 px-3 py-2 text-[11px] leading-5 text-cyan-900">
          <CheckSquare2 className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" aria-hidden="true" />
          <span>{selected.length} focus area{selected.length === 1 ? '' : 's'} selected. You can still continue with manual Coach Studio if AI is slow or unavailable.</span>
        </div>
      )}
    </section>
  );
}
